import { useEffect, useState, useRef } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../../firebase";
import { Bell, X } from "lucide-react";

export default function RSsAlarm() {
  const { currentUser } = useAuth();
  const [medicines, setMedicines] = useState([]);
  const [alarmActive, setAlarmActive] = useState(null); // { medName, time, dosage }
  const audioRef = useRef(null);

  // Simple Beep Sound (Base64) to avoid external dependencies
  const BEEP_URL =
    "data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU"; // Truncated for brevity in plan, but I will use a real one or a reliable URL if base64 is too long.
  // Actually, let's use a reliable public URL for now, or the mixkit one if it worked, but base64 is safer.
  // I will use a generated beep via AudioContext to be 100% safe and dependency-free.

  const playAlertSound = () => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;

      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = "square";
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.5);

      gain.gain.setValueAtTime(0.5, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);

      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    } catch (e) {
      console.error("Audio Context Error", e);
    }
  };

  const triggerAlarm = (med, time) => {
    setAlarmActive({ ...med, time });
    playAlertSound();

    // Repeat sound every 2 seconds until dismissed
    if (window.alarmInterval) clearInterval(window.alarmInterval);
    window.alarmInterval = setInterval(playAlertSound, 2000);

    // Native Notification
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(`Medicine Reminder: ${med.name}`, {
        body: `It's ${time}. Time to take your ${med.dosage}.`,
        icon: "/vite.svg",
      });
    }
  };

  const handleDismiss = () => {
    setAlarmActive(null);
    if (window.alarmInterval) clearInterval(window.alarmInterval);
  };

  useEffect(() => {
    if (!currentUser) return;

    const collectionName = currentUser.sourceCollection || "users";
    const medsRef = collection(
      db,
      collectionName,
      currentUser.uid,
      "medicines",
    );

    const unsubscribe = onSnapshot(medsRef, (snapshot) => {
      const meds = snapshot.docs.map((d) => ({ ...d.data(), id: d.id }));
      setMedicines(meds);
    });

    return () => {
      unsubscribe();
      if (window.alarmInterval) clearInterval(window.alarmInterval);
    };
  }, [currentUser]);

  useEffect(() => {
    const checkAlarm = () => {
      const now = new Date();
      const currentTime = now.toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
      }); // HH:MM

      medicines.forEach((med) => {
        // Use real times from DB or fallback to old logic if specificTimes is missing
        let times = med.times || [];

        // If legacy data with no 'times' array, try to map frequency
        if (times.length === 0 && med.frequency) {
          const TIME_MAPPING = {
            "Once a day": ["09:00"],
            "Twice a day": ["09:00", "21:00"],
            "Thrice a day": ["09:00", "14:00", "21:00"],
          };
          times = TIME_MAPPING[med.frequency] || [];
        }

        if (times.includes(currentTime)) {
          // Unique ID for alarm today: medId + time
          const alarmId = `${med.id}-${currentTime}-${now.getDate()}-${now.getMonth()}`;
          const seenAlarms = JSON.parse(
            localStorage.getItem("seenAlarms") || "[]",
          );

          if (!seenAlarms.includes(alarmId)) {
            triggerAlarm(med, currentTime);
            seenAlarms.push(alarmId);
            // Keep storage clean - maybe slice last 20
            if (seenAlarms.length > 50) seenAlarms.shift();
            localStorage.setItem("seenAlarms", JSON.stringify(seenAlarms));
          }
        }
      });
    };

    const interval = setInterval(checkAlarm, 5000); // Check every 5 seconds to be precise
    checkAlarm(); // Check immediately on load

    return () => clearInterval(interval);
  }, [medicines]);

  // Request Notification Permission on mount
  useEffect(() => {
    if ("Notification" in window && Notification.permission !== "granted") {
      Notification.requestPermission();
    }
  }, []);

  if (!alarmActive) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white p-6 rounded-2xl shadow-2xl flex flex-col items-center gap-6 max-w-sm w-full mx-4 border-t-8 border-red-500 relative">
        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 p-2 text-gray-400 hover:text-gray-600"
        >
          <X size={24} />
        </button>

        <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center animate-bounce">
          <Bell size={40} />
        </div>

        <div className="text-center">
          <h3 className="text-2xl font-bold text-gray-900">
            Medicine Reminder
          </h3>
          <p className="text-gray-500 mt-1">It's {alarmActive.time}</p>
        </div>

        <div className="bg-gray-50 p-4 rounded-xl w-full text-center border border-gray-100">
          <p className="text-sm text-gray-500 font-bold uppercase tracking-wider mb-1">
            Time to take
          </p>
          <p className="text-xl font-bold text-blue-600">{alarmActive.name}</p>
          <p className="text-gray-600 font-medium">{alarmActive.dosage}</p>
          {alarmActive.relationToMeal && (
            <span className="inline-block mt-2 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
              {alarmActive.relationToMeal}
            </span>
          )}
        </div>

        <button
          onClick={handleDismiss}
          className="btn btn-primary w-full py-3 text-lg shadow-lg shadow-blue-500/30"
        >
          I've Taken It
        </button>
      </div>
    </div>
  );
}
