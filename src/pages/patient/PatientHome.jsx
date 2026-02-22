import { useEffect, useState, useMemo } from "react";
import { db } from "../../firebase";
import {
  collection,
  updateDoc,
  increment,
  doc,
  onSnapshot,
} from "firebase/firestore"; // Added onSnapshot
import { useAuth } from "../../contexts/AuthContext";
import {
  CheckCircle,
  XCircle,
  Clock,
  Flame,
  RotateCcw,
  AlertCircle,
  Calendar,
} from "lucide-react";
import { Link } from "react-router-dom";
import { motion as Motion } from "framer-motion";
import { getSmartMessage } from "../../services/mlService";

import Toast from "../../components/common/Toast";
import { LocalNotifications } from "@capacitor/local-notifications";
import { Capacitor } from "@capacitor/core";

export default function PatientHome() {
  const { currentUser } = useAuth();
  const [medicines, setMedicines] = useState([]);
  const [userStats, setUserStats] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [toast, setToast] = useState(null); // { message, type }

  useEffect(() => {
    if (!currentUser) return;

    // 1. Real-time Medicines
    const collectionName = currentUser.sourceCollection || "users";
    const medsRef = collection(
      db,
      collectionName,
      currentUser.uid,
      "medicines",
    );
    const unsubscribeMeds = onSnapshot(medsRef, (snapshot) => {
      const medsList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setMedicines(medsList);
    });

    // 2. Real-time User Stats
    const userRef = doc(db, collectionName, currentUser.uid);
    const unsubscribeUser = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setUserProfile(data);
        setUserStats({
          streak: data.streak || 0,
          adherence: data.adherenceScore || 100,
        });
      }
    });

    return () => {
      unsubscribeMeds();
      unsubscribeUser();
    };
  }, [currentUser]);

  // Background Alarm Logic (Web/Foreground)
  useEffect(() => {
    if (!medicines || medicines.length === 0) return;

    // Native Offline Pre-scheduler (Calculates next 7 days and hands to OS)
    const scheduleNativeAlarms = async () => {
      if (!Capacitor.isNativePlatform()) return;
      try {
        await LocalNotifications.requestPermissions();
        const pending = await LocalNotifications.getPending();
        if (pending.notifications.length > 0) {
          await LocalNotifications.cancel({
            notifications: pending.notifications,
          });
        }

        const notificationsToSchedule = [];
        let notifId = 1;
        const now = new Date();

        medicines.forEach((med) => {
          if (med.endDate && new Date(med.endDate) < now) return;

          const times = med.timeDisplay
            ? Array.isArray(med.timeDisplay)
              ? med.timeDisplay
              : [med.timeDisplay]
            : med.times
              ? Array.isArray(med.times)
                ? med.times
                : [med.times]
              : med.timing
                ? [med.timing]
                : [];

          for (let i = 0; i < 7; i++) {
            const d = new Date(now);
            d.setDate(d.getDate() + i);

            if (med.startDate) {
              const start = new Date(med.startDate);
              start.setHours(0, 0, 0, 0);
              if (d < start) continue;
            }
            if (med.endDate) {
              const end = new Date(med.endDate);
              end.setHours(23, 59, 59, 999);
              if (d > end) continue;
            }

            times.forEach((t) => {
              const parts = t.match(/(\d{1,2}):(\d{2})\s*(AM|PM|am|pm)?/);
              if (parts) {
                let hour = parseInt(parts[1], 10);
                const min = parseInt(parts[2], 10);
                if (parts[3]) {
                  const ampm = parts[3].toLowerCase();
                  if (ampm === "pm" && hour < 12) hour += 12;
                  if (ampm === "am" && hour === 12) hour = 0;
                }
                const scheduleDate = new Date(d);
                scheduleDate.setHours(hour, min, 0, 0);

                if (scheduleDate > now) {
                  notificationsToSchedule.push({
                    title: `Medicine Reminder: ${med.name}`,
                    body: `It's time to take ${med.dosage || "your medicine"}.`,
                    id: notifId++,
                    schedule: { at: scheduleDate },
                  });
                }
              }
            });
          }
        });

        if (notificationsToSchedule.length > 0) {
          await LocalNotifications.schedule({
            notifications: notificationsToSchedule,
          });
        }
      } catch (e) {
        console.warn("Failed to schedule native notifications", e);
      }
    };

    scheduleNativeAlarms();

    // Check every minute for foreground/web alerts
    const interval = setInterval(() => {
      const now = new Date();
      // Only care about hours and minutes for comparison
      const currentHours = now.getHours();
      const currentMinutes = now.getMinutes();

      medicines.forEach((med) => {
        // Skip if already taken today or snoozed past now
        const snoozedUntil = med.snoozedUntil
          ? new Date(med.snoozedUntil)
          : null;
        if (snoozedUntil && snoozedUntil > now) return;

        const isToday = (dateString) => {
          if (!dateString) return false;
          const date = new Date(dateString);
          return (
            date.getDate() === now.getDate() &&
            date.getMonth() === now.getMonth() &&
            date.getFullYear() === now.getFullYear()
          );
        };

        if (isToday(med.lastAction) && med.status === "taken") return;

        // Check if med is active today
        if (med.startDate && med.endDate) {
          const start = new Date(med.startDate);
          const end = new Date(med.endDate);
          end.setHours(23, 59, 59, 999);
          if (now < start || now > end) return;
        }

        const times = med.timeDisplay
          ? Array.isArray(med.timeDisplay)
            ? med.timeDisplay
            : [med.timeDisplay]
          : med.times
            ? Array.isArray(med.times)
              ? med.times
              : [med.times]
            : med.timing
              ? [med.timing]
              : [];

        times.forEach((t) => {
          const parts = t.match(/(\d{1,2}):(\d{2})\s*(AM|PM|am|pm)?/);
          if (parts) {
            let hour = parseInt(parts[1], 10);
            const min = parseInt(parts[2], 10);
            if (parts[3]) {
              const ampm = parts[3].toLowerCase();
              if (ampm === "pm" && hour < 12) hour += 12;
              if (ampm === "am" && hour === 12) hour = 0;
            }
            if (hour === currentHours && min === currentMinutes) {
              triggerAlarm(med);
            }
          }
        });
      });
    }, 60000); // 1 minute

    return () => clearInterval(interval);
  }, [medicines]);

  const triggerAlarm = (med) => {
    // Attempt Notification
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(`Medicine Reminder: ${med.name}`, {
        body: `It's time to take ${med.dosage}.`,
        icon: "/vite.svg",
      });
    }

    // Attempt Beep
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = "sine";
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        gain.gain.setValueAtTime(0.5, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1);
        osc.start();
        osc.stop(ctx.currentTime + 1);
      }
    } catch (e) {
      console.warn("Audio alarm failed", e);
    }

    // In-app visual Toast
    setToast({
      message: `ALARM: Time to take ${med.name} (${med.dosage})`,
      type: "info",
    });
  };

  // Helper to check if date is today
  const isToday = (dateString) => {
    if (!dateString) return false;
    const date = new Date(dateString);
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  // Helpers to determine active days and next occurrence
  const parseTimes = (med) => {
    if (!med) return [];
    if (med.timeDisplay)
      return Array.isArray(med.timeDisplay)
        ? med.timeDisplay
        : [med.timeDisplay];
    if (med.times) return Array.isArray(med.times) ? med.times : [med.times];
    if (med.timing) return [med.timing];
    return [];
  };

  const isActiveOnDate = (med, date) => {
    if (!med.startDate || !med.endDate) return false;
    const start = new Date(med.startDate);
    const end = new Date(med.endDate);
    end.setHours(23, 59, 59, 999);
    return date >= start && date <= end;
  };

  const findNextOccurrence = (med) => {
    const times = parseTimes(med);
    const now = new Date();
    for (let i = 0; i < 7; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() + i);
      if (!isActiveOnDate(med, d)) continue;
      for (const t of times) {
        // Try parse HH:MM or HH:MM AM/PM
        const parts = t.match(/(\d{1,2}):(\d{2})\s*(AM|PM|am|pm)?/);
        let hour = 9,
          minute = 0;
        if (parts) {
          hour = parseInt(parts[1], 10);
          minute = parseInt(parts[2], 10);
          if (parts[3]) {
            const ampm = parts[3].toLowerCase();
            if (ampm === "pm" && hour < 12) hour += 12;
            if (ampm === "am" && hour === 12) hour = 0;
          }
        }
        const occ = new Date(d);
        occ.setHours(hour, minute, 0, 0);
        if (occ > now) return { date: occ, time: t };
      }
    }
    return null;
  };

  // Compute which medicines to show: today's scheduled ones, or the single next upcoming
  const displayedMeds = useMemo(() => {
    if (!medicines || medicines.length === 0) return [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todays = medicines.filter(
      (m) => isActiveOnDate(m, new Date()) && parseTimes(m).length > 0,
    );
    if (todays.length > 0) return todays;

    // find next upcoming across medicines
    let next = null;
    let nextMed = null;
    medicines.forEach((m) => {
      const occ = findNextOccurrence(m);
      if (occ) {
        if (!next || occ.date < next) {
          next = occ.date;
          nextMed = { ...m, timing: occ.time };
        }
      }
    });
    return nextMed ? [nextMed] : [];
  }, [medicines]);

  const handleAction = async (medId, action, payload) => {
    try {
      const todayStr = new Date().toISOString();

      // 1. Update Medicine Status
      const collectionName = currentUser.sourceCollection || "users"; // Should persist from AuthContext
      const medRef = doc(
        db,
        collectionName,
        currentUser.uid,
        "medicines",
        medId,
      );
      // handle cancel-snooze separately
      if (action === "cancel-snooze") {
        const collectionName = currentUser.sourceCollection || "users";
        const medRef = doc(
          db,
          collectionName,
          currentUser.uid,
          "medicines",
          medId,
        );
        await updateDoc(medRef, { snoozedUntil: null });
        setToast({ message: `Snooze cancelled`, type: "info" });
        return;
      }

      // handle snooze separately
      if (action === "snooze") {
        const minutes = payload?.minutes || 30;
        const snoozedUntil = new Date(
          Date.now() + minutes * 60 * 1000,
        ).toISOString();
        await updateDoc(medRef, {
          snoozedUntil,
        });
        setToast({ message: `Snoozed for ${minutes} minutes`, type: "info" });
        return;
      }

      await updateDoc(medRef, {
        lastAction: todayStr,
        status: action, // 'taken' or 'skipped'
        snoozedUntil: null,
      });

      // 2. Calculate Daily Progress & Adherence
      // We need to wait a tick or use local state, but since we use onSnapshot,
      // let's calculate based on current 'medicines' + this change.
      // Actually, 'medicines' will update via snapshot.
      // For immediate user doc update, let's look at current snapshot and modify this one item.

      const updatedMeds = medicines.map((m) =>
        m.id === medId
          ? { ...m, status: action, lastAction: todayStr, snoozedUntil: null }
          : m,
      );

      const takenCount = updatedMeds.filter(
        (m) => m.status === "taken" && isToday(m.lastAction),
      ).length;

      const totalCount = updatedMeds.length;
      const newAdherence =
        totalCount > 0 ? Math.round((takenCount / totalCount) * 100) : 100;

      // 3. Update User Doc
      const userRef = doc(db, collectionName, currentUser.uid);
      await updateDoc(userRef, {
        streak: action === "taken" ? increment(1) : 0, // Simplified streak logic
        adherenceScore: newAdherence,
        dailyProgress: {
          taken: takenCount,
          total: totalCount,
          date: todayStr.split("T")[0],
        },
      });

      if (action === "taken") {
        setToast({ message: "Medicine Taken! +10 Points", type: "success" });
      } else {
        setToast({ message: "Medicine Skipped.", type: "info" });
      }
    } catch (e) {
      console.error("Action failed", e);
      setToast({ message: "Action failed. Please try again.", type: "error" });
    }
  };

  return (
    <div>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      <h1 className="text-2xl font-semibold mb-2">Today's Schedule</h1>

      {/* Caretaker Prompt */}
      {!userProfile?.caretakerUid && (
        <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg flex justify-between items-center text-orange-800">
          <div className="flex gap-3 items-center">
            <AlertCircle size={24} />
            <div>
              <p className="font-semibold">Connect a Caretaker</p>
              <p className="text-sm">
                Link a family member or nurse to monitor your health.
              </p>
            </div>
          </div>
          <Link
            to="/dashboard/patient/settings"
            className="btn btn-sm btn-outline border-orange-300 text-orange-800 hover:bg-orange-100"
          >
            Link Now
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Smart Message */}
        <Motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:col-span-2 p-6 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg shadow-lg flex flex-col justify-center"
        >
          <h2 className="text-xl font-bold mb-2">
            Good Morning,{" "}
            {userProfile?.fullName || currentUser.displayName || "Patient"}!
          </h2>
          <p className="font-medium text-lg opacity-90">
            {userStats
              ? getSmartMessage(
                  currentUser.displayName || "Patient",
                  userStats.streak,
                  userStats.adherence,
                )
              : "Loading insights..."}
          </p>
        </Motion.div>

        {/* QR Code Card */}
        <div className="card flex flex-col items-center justify-center text-center p-6">
          <h3 className="font-semibold text-gray-800 mb-2">My Medical ID</h3>
          <div className="bg-white p-2 rounded-lg border shadow-sm mb-2">
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${currentUser.uid}`}
              alt="Patient QR Code"
              className="w-28 h-28"
            />
          </div>
          <p className="text-xs text-muted">
            Scan to view basic medical profile
          </p>
        </div>
      </div>

      {/* Quick Summary Cards */}
      <div className="grid grid-cols-3 gap-6 mb-8">
        <div className="card bg-blue-50 border-blue-100 flex items-center gap-4">
          <div className="p-3 bg-blue-200 text-blue-700 rounded-full">
            <CheckCircle size={24} />
          </div>
          <div>
            <p className="text-sm text-blue-700 font-semibold">Adherence</p>
            <p className="text-2xl font-bold text-blue-900">
              {userStats?.adherence ?? 0}%
            </p>
          </div>
        </div>
        <div className="card bg-orange-50 border-orange-100 flex items-center gap-4">
          <div className="p-3 bg-orange-200 text-orange-700 rounded-full">
            <Flame size={24} />
          </div>
          <div>
            <p className="text-sm text-orange-700 font-semibold">Streak</p>
            <p className="text-2xl font-bold text-orange-900">
              {userStats?.streak ?? 0} Days
            </p>
          </div>
        </div>
        <div className="card bg-green-50 border-green-100 flex items-center gap-4">
          <div className="p-3 bg-green-200 text-green-700 rounded-full">
            <RotateCcw size={24} />
          </div>
          <div>
            <p className="text-sm text-green-700 font-semibold">Refills</p>
            <p className="text-sm font-medium text-green-900">All Good</p>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="space-y-6">
        <TimelineSection
          title="Today's Plan"
          medicines={displayedMeds}
          onAction={handleAction}
        />
      </div>

      {/* Upcoming Schedule */}
      <div className="space-y-6 mt-12">
        <UpcomingScheduleSection medicines={medicines} />
      </div>
    </div>
  );
}

function TimelineSection({ medicines, onAction }) {
  if (medicines.length === 0)
    return (
      <div className="card p-8 text-center text-gray-500 border-dashed border-2">
        <Calendar size={48} className="mx-auto text-gray-300 mb-4" />
        <p>No medicines scheduled for today. Enjoy your day!</p>
      </div>
    );

  // Sort today's medicines by parsed time
  const sortedMeds = [...medicines].sort((a, b) => {
    // A simple string sort on timing works if format is consistent (e.g. HH:MM)
    // For complete robustness, parse AM/PM but assuming 24h or simple strings here.
    return (a.timing || "").localeCompare(b.timing || "");
  });

  return (
    <div className="relative pl-6 border-l-4 border-blue-100 space-y-8">
      {sortedMeds.map((med, index) => (
        <TimelineCard key={med.id + index} med={med} onAction={onAction} />
      ))}
    </div>
  );
}

function TimelineCard({ med, onAction }) {
  const isToday = (dateString) => {
    if (!dateString) return false;
    const date = new Date(dateString);
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const currentStatus = isToday(med.lastAction) ? med.status : "pending";
  const snoozedUntilStr = med.snoozedUntil || null;
  const snoozedUntil = snoozedUntilStr ? new Date(snoozedUntilStr) : null;
  const isSnoozed = snoozedUntil && snoozedUntil > new Date();

  return (
    <Motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="relative"
    >
      {/* Timeline Node */}
      <span
        className={`absolute -left-[35px] top-4 w-6 h-6 rounded-full border-4 border-white shadow flex items-center justify-center ${
          currentStatus === "taken"
            ? "bg-green-500"
            : currentStatus === "skipped"
              ? "bg-red-500"
              : "bg-blue-500"
        }`}
      >
        <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
      </span>

      <div
        className={`card p-5 border-l-8 transition-shadow hover:shadow-lg ${
          currentStatus === "taken"
            ? "border-green-500 bg-green-50"
            : currentStatus === "skipped"
              ? "border-red-500 bg-red-50"
              : "border-blue-500 bg-white"
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div
              className={`p-3 rounded-xl shadow-sm ${
                currentStatus === "taken"
                  ? "bg-green-200 text-green-700"
                  : currentStatus === "skipped"
                    ? "bg-red-200 text-red-700"
                    : "bg-blue-100 text-blue-700"
              }`}
            >
              <Clock size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-bold text-xl text-gray-800">{med.name}</h3>
                <span className="text-xs font-bold text-gray-500 bg-gray-200 px-2 py-1 rounded-full">
                  {med.timing}
                </span>
              </div>
              <p className="text-gray-600 font-medium">
                {med.dosage} • {med.relationToMeal || med.frequency}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isSnoozed ? (
              <div className="flex items-center gap-2 bg-yellow-100 text-yellow-800 px-4 py-2 rounded-full font-bold">
                <Clock size={16} className="animate-pulse" />
                Snoozed to{" "}
                {snoozedUntil.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
                <button
                  onClick={() => onAction(med.id, "cancel-snooze")}
                  className="ml-2 hover:text-red-600 bg-white rounded-full p-1 shadow-sm"
                  title="Cancel Snooze"
                >
                  <XCircle size={16} />
                </button>
              </div>
            ) : currentStatus === "pending" ? (
              <div className="flex gap-2">
                <button
                  onClick={() => onAction(med.id, "skipped")}
                  className="btn btn-outline border-red-200 text-red-600 hover:bg-red-50 hover:border-red-500 flex items-center gap-1"
                >
                  <XCircle size={18} /> Skip
                </button>
                <button
                  onClick={() => {
                    const val = window.prompt("Snooze minutes (e.g. 30)", "30");
                    const mins = parseInt(val, 10);
                    if (!isNaN(mins) && mins > 0)
                      onAction(med.id, "snooze", { minutes: mins });
                  }}
                  className="btn btn-outline border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-500 flex items-center gap-1"
                >
                  <Clock size={18} /> Snooze
                </button>
                <button
                  onClick={() => onAction(med.id, "taken")}
                  className="btn btn-primary bg-green-500 hover:bg-green-600 border-none flex items-center gap-1 shadow-md"
                >
                  <CheckCircle size={18} /> Take Now
                </button>
              </div>
            ) : (
              <div
                className={`px-4 py-2 rounded-full font-bold shadow-sm uppercase flex items-center gap-2 ${
                  currentStatus === "taken"
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {currentStatus === "taken" ? (
                  <CheckCircle size={18} />
                ) : (
                  <XCircle size={18} />
                )}
                {currentStatus}
              </div>
            )}
          </div>
        </div>
      </div>
    </Motion.div>
  );
}

// Enhanced Upcoming Schedule Section
function UpcomingScheduleSection({ medicines }) {
  const [upcomingMeds, setUpcomingMeds] = useState([]);

  useEffect(() => {
    // Calculate upcoming medicines for the next 7 days
    const upcoming = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    medicines.forEach((med) => {
      if (!med.startDate || !med.endDate) return;

      const startDate = new Date(med.startDate);
      const endDate = new Date(med.endDate);
      endDate.setHours(23, 59, 59, 999);

      // Only include medicines that are scheduled or upcoming
      if (endDate < today) return;

      // Parse timing to get hours (assumes format like "09:00 AM")
      let times = [];
      if (med.timeDisplay) {
        times = Array.isArray(med.timeDisplay)
          ? med.timeDisplay
          : [med.timeDisplay];
      } else if (med.timing) {
        times = [med.timing];
      } else if (med.times) {
        times = med.times;
      }

      // For each day in the schedule, add medicine entries
      for (let i = 0; i < 7; i++) {
        const currentDate = new Date(today);
        currentDate.setDate(currentDate.getDate() + i);

        // Check if medicine is active on this date
        if (currentDate >= startDate && currentDate <= endDate) {
          times.forEach((time) => {
            upcoming.push({
              id: `${med.id}-${currentDate.toISOString()}-${time}`,
              medId: med.id,
              name: med.name,
              dosage: med.dosage,
              time: time,
              date: currentDate.toISOString().split("T")[0],
              displayDate: currentDate.toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
              }),
              frequency: med.frequency,
            });
          });
        }
      }
    });

    // Sort by date then by time
    upcoming.sort((a, b) => {
      const dateCompare = new Date(a.date) - new Date(b.date);
      if (dateCompare !== 0) return dateCompare;
      return a.time.localeCompare(b.time);
    });

    setUpcomingMeds(upcoming.slice(0, 5)); // Show next 5 scheduled doses
  }, [medicines]);

  if (upcomingMeds.length === 0) return null;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
        <Calendar size={20} className="text-blue-600" />
        Upcoming Prescriptions Next 7 Days
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {upcomingMeds.map((item, idx) => (
          <Motion.div
            key={item.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="card bg-white border border-gray-100 p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <h3 className="font-bold text-md text-gray-900 line-clamp-1">
                  {item.name}
                </h3>
                <p className="text-sm text-gray-600">{item.dosage}</p>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-2 flex items-center justify-between">
              <div className="flex items-center gap-2 text-blue-600">
                <Clock size={14} />
                <span className="font-bold text-sm">{item.time}</span>
              </div>
              <span className="text-xs font-semibold text-gray-500">
                {item.displayDate}
              </span>
            </div>
          </Motion.div>
        ))}
      </div>
    </div>
  );
}
