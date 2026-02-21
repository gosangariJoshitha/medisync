import { useEffect, useState, useRef } from "react";
import { db } from "../../firebase";
import { collection, query, where, onSnapshot, addDoc, setDoc, doc, serverTimestamp } from "firebase/firestore";
import {
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Calendar,
  ChevronRight,
  MoreVertical,
  Phone,
  Activity,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { motion as Motion } from "framer-motion";
import { Link } from "react-router-dom";

export default function MonitorPatients() {
  const { currentUser } = useAuth();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isMonitoring, setIsMonitoring] = useState(false);

  useEffect(() => {
    if (!currentUser) return;

    const q = query(
      collection(db, "patients"),
      where("role", "==", "patient"),
      where("doctorUid", "==", currentUser.uid),
    );

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const list = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setPatients(list);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching patients:", error);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [currentUser]);

  return (
    <div className="fade-in">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Monitor Patients</h1>
        <div className="flex gap-2">
          <span className="text-sm text-muted flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-500"></span> Stable
          </span>
          <span className="text-sm text-muted flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-yellow-500"></span>{" "}
            Attention
          </span>
          <span className="text-sm text-muted flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-red-500"></span> Critical
          </span>
        </div>
        <button
          onClick={() => setIsMonitoring(!isMonitoring)}
          className={`btn btn-sm gap-2 ${isMonitoring ? "btn-error animate-pulse text-white" : "btn-outline"}`}
        >
          <Activity size={16} />
          {isMonitoring ? "Stop Monitoring" : "Start Live Monitoring"}
        </button>
      </div>

      {loading ? (
        <div className="p-10 text-center">Loading patient data...</div>
      ) : patients.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 rounded-xl border-dashed border-2">
          <p className="text-gray-500">No patients linked yet.</p>
          <Link
            to="/dashboard/doctor/add-patient"
            className="btn btn-primary mt-4 inline-flex items-center gap-2"
          >
            Add Your First Patient
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {patients.map((patient) => (
            <PatientStatusCard
              key={patient.id}
              patient={patient}
              currentUser={currentUser}
              isMonitoring={isMonitoring}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function PatientStatusCard({ patient, currentUser, isMonitoring }) {
  // Use real-time data from Firestore
  const bpm = patient.vitals?.heartRate || "--";
  const [todayTaken, setTodayTaken] = useState(0);
  const [todayTotal, setTodayTotal] = useState(0);
  const [nextInfo, setNextInfo] = useState(null); // { date: Date, label: string }
  const scheduledRef = useRef(new Set());

  useEffect(() => {
    // Subscribe to patient's medicines to compute today's schedule live
    const medsRef = collection(db, "patients", patient.id, "medicines");
    const unsubscribe = onSnapshot(medsRef, (snap) => {
      const meds = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

      const todayStr = new Date().toISOString().split("T")[0];
      let total = 0;
      let taken = 0;
      const upcomingTimes = [];

      meds.forEach((m) => {
        // Determine if medicine is active today based on start/end date
        const start = m.startDate || todayStr;
        const end = m.endDate === "Continuous" || !m.endDate ? null : m.endDate;
        const inRange = new Date(start) <= new Date() && (!end || new Date(end) >= new Date());
        if (!inRange) return;

        // times can be an array of HH:MM strings
        let times = m.times || [];
        if (times.length === 0 && m.timeDisplay) {
          // fallback: try parsing timeDisplay
          const t = (m.timeDisplay || "").match(/(\d{1,2}:\d{2})/);
          if (t) times.push(t[1]);
        }

        // if no explicit times, infer count from frequency
        if (times.length === 0) {
          const freqMap = { "Once a day": 1, "Twice a day": 2, "Thrice a day": 3 };
          const inferred = freqMap[m.frequency] || 1;
          for (let i = 0; i < inferred; i++) times.push("00:00"); // placeholder times (count only)
        }

        if (times.length > 0) {
          total += times.length;
          // check status/lastAction per med - if status "taken" and lastAction is today, try to count proportionally
          if (m.status === "taken") {
            const last = m.lastAction ? m.lastAction.split("T")[0] : null;
            if (last === todayStr) {
              // if frequency >1 and we only have single status, count as 1 taken (conservative)
              taken += 1;
            }
          }

          // collect upcoming times (today) - ignore placeholder "00:00" entries for next-time calculation
          times.forEach((t) => {
            if (!t || t === "00:00") return;
            const [hh, mm] = t.split(":");
            const dt = new Date();
            dt.setHours(parseInt(hh || "0"), parseInt(mm || "0"), 0, 0);
            upcomingTimes.push(dt);
          });
        }
      });

      setTodayTotal(total);
      setTodayTaken(taken);

      // find next upcoming time
      const now = new Date();
      const next = upcomingTimes.filter((d) => d > now).sort((a, b) => a - b)[0];
      if (next) {
        setNextInfo({ date: next, label: next.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) });
      } else {
        setNextInfo(null);
      }

      // Persist a daily snapshot for simple learning/analytics
      (async () => {
        try {
          const adherence = total > 0 ? Math.round((taken / total) * 100) : 100;
          await setDoc(doc(db, "patients", patient.id, "daily_stats", todayStr), {
            date: todayStr,
            taken,
            total,
            adherence,
            updatedAt: serverTimestamp(),
          });
        } catch (err) {
          console.error("Failed to write daily snapshot:", err);
        }
      })();
    });

    return () => unsubscribe();
  }, [patient.id]);
  const adherence = patient.adherenceScore || 100;
  const isCritical = patient.riskStatus === "critical" || adherence < 50;
  const isAttention =
    patient.riskStatus === "attention" || (adherence >= 50 && adherence < 80);

  // Derived Status
  const statusColor = isCritical ? "red" : isAttention ? "yellow" : "green";
  const statusBg = isCritical
    ? "bg-red-50"
    : isAttention
      ? "bg-yellow-50"
      : "bg-green-50";
  const borderColor = isCritical
    ? "border-red-200"
    : isAttention
      ? "border-yellow-200"
      : "border-green-200";

  // Progress (use live medicines subscription values if available)
  const taken = typeof todayTaken !== "undefined" ? todayTaken : patient.dailyProgress?.taken || 0;
  const total = typeof todayTotal !== "undefined" ? todayTotal : patient.dailyProgress?.total || 0;
  const percentage = total > 0 ? (taken / total) * 100 : 0;

  return (
    <Motion.div
      whileHover={{ y: -5 }}
      className={`bg-white rounded-xl shadow-sm border ${borderColor} p-5 flex flex-col gap-4 relative overflow-hidden`}
    >
      {/* AI Flag Banner */}
      {isCritical && (
        <div className="absolute top-0 left-0 w-full bg-red-100 text-red-700 text-xs font-bold px-4 py-1 flex items-center gap-1">
          <AlertTriangle size={12} /> CRITICAL ATTENTION NEEDED
        </div>
      )}

      <div
        className={`flex justify-between items-start ${isCritical ? "mt-4" : ""}`}
      >
        <div className="flex gap-3">
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold ${statusBg} text-${statusColor}-600`}
          >
            {patient.fullName.charAt(0)}
          </div>
          <div>
            <h3 className="font-bold text-gray-900">{patient.fullName}</h3>
            <p className="text-xs text-muted">ID: {patient.patientId}</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold">{adherence}%</div>
          <div className="text-xs text-muted">Adherence</div>
        </div>
      </div>

      {/* Daily Progress Bar */}
      <div>
        <div className="flex justify-between text-sm mb-1">
          <span className="text-gray-600 font-medium">Today's Schedule</span>
          <span className="text-gray-900 font-bold">
            {taken}/{total} Meds
          </span>
        </div>
        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${isCritical ? "bg-red-500" : "bg-green-500"}`}
            style={{ width: `${percentage}%` }}
          ></div>
        </div>
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="bg-gray-50 p-2 rounded flex items-center gap-2 text-gray-600">
          <Activity
            size={14}
            className={
              isMonitoring ? "text-red-500 animate-pulse" : "text-gray-400"
            }
          />
          <span
            className={
              isMonitoring && bpm > 100 ? "text-red-600 font-bold" : ""
            }
          >
            {isMonitoring
              ? typeof bpm === "number"
                ? `${bpm} BPM`
                : bpm
              : "No Live Data"}
          </span>
        </div>
        <div className="bg-gray-50 p-2 rounded flex items-center gap-2 text-gray-600">
          <Calendar size={14} className="text-purple-500" />
          <span>{nextInfo ? `Next: ${nextInfo.label}` : "No upcoming"}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="pt-2 flex gap-2 border-t mt-auto">
        <Link
          to={`/dashboard/doctor/patient/${patient.id}`}
          className="btn btn-outline flex-1 text-xs"
        >
          View Details
        </Link>
        <Link
          to={`/dashboard/doctor/edit-patient/${patient.id}`}
          className="btn btn-ghost flex-1 text-xs"
        >
          Edit
        </Link>
      </div>
      {/* Schedule in-app notification for next dose when monitoring is active */}
      {isMonitoring && nextInfo && (
        <ScheduleNotification
          nextInfo={nextInfo}
          patient={patient}
          currentUser={currentUser}
          scheduledRef={scheduledRef}
        />
      )}
    </Motion.div>
  );
}

function ScheduleNotification({ nextInfo, patient, currentUser, scheduledRef }) {
  useEffect(() => {
    if (!nextInfo || !currentUser) return;

    const now = new Date();
    const ms = nextInfo.date - now;

    // Only schedule if within next 24 hours and in the future
    if (ms <= 0 || ms > 24 * 60 * 60 * 1000) return;

    const timeoutId = setTimeout(async () => {
      try {
        await addDoc(collection(db, "users", currentUser.uid, "notifications"), {
          title: `Medicine due: ${patient.fullName}`,
          message: `A scheduled dose is due for ${patient.fullName} at ${nextInfo.label}`,
          type: "reminder",
          read: false,
          patientId: patient.id,
          timestamp: serverTimestamp(),
        });
      } catch (err) {
        console.error("Failed to write scheduled notification:", err);
      } finally {
        scheduledRef.current.delete(timeoutId);
      }
    }, ms);

    scheduledRef.current.add(timeoutId);

    return () => {
      clearTimeout(timeoutId);
      scheduledRef.current.delete(timeoutId);
    };
  }, [nextInfo, patient, currentUser, scheduledRef]);

  return null;
}
