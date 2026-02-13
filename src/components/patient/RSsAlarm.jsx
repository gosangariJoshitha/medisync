import { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../../firebase";
import { Bell } from "lucide-react";

export default function RSsAlarm() {
  const { currentUser } = useAuth();
  const [medicines, setMedicines] = useState([]);
  const [alarmActive, setAlarmActive] = useState(null); // { medName, time }

  // Mock mapping for demo. In real app, user sets specific times.
  const TIME_MAPPING = {
    "Once Daily": ["09:00"],
    "Twice Daily": ["09:00", "21:00"],
    "Thrice Daily": ["09:00", "14:00", "21:00"],
  };

  const playAlertSound = () => {
    // Simple beep using AudioContext or a hosted file.
    // For prototype, we'll try a base64 generic beep or just standard Alert if blocking.
    // Using a gentle chime sound URL (placeholder)
    const audio = new Audio(
      "https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3",
    );
    audio
      .play()
      .catch((e) =>
        console.log("Audio play failed (interaction needed first):", e),
      );
  };

  const triggerAlarm = (med, time) => {
    setAlarmActive({ medName: med.name, time });
    playAlertSound();

    // Native Notification
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(`Medicine Reminder: ${med.name}`, {
        body: `It's ${time}. Time to take your ${med.dosage}.`,
      });
    }
  };

  useEffect(() => {
    if (!currentUser) return;

    const medsRef = collection(db, "users", currentUser.uid, "medicines");
    const unsubscribe = onSnapshot(medsRef, (snapshot) => {
      const meds = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      setMedicines(meds);
    });

    return () => unsubscribe();
  }, [currentUser]);

  useEffect(() => {
    const checkAlarm = () => {
      const now = new Date();
      const currentTime = now.toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
      }); // HH:MM

      medicines.forEach((med) => {
        const times = TIME_MAPPING[med.frequency] || [];
        if (times.includes(currentTime)) {
          // Unique ID for alarm today: medId + time
          const alarmId = `${med.id}-${currentTime}-${now.getDate()}`;
          const seenAlarms = JSON.parse(
            localStorage.getItem("seenAlarms") || "[]",
          );

          if (!seenAlarms.includes(alarmId)) {
            triggerAlarm(med, currentTime);
            seenAlarms.push(alarmId);
            localStorage.setItem("seenAlarms", JSON.stringify(seenAlarms));
          }
        }
      });
    };

    const interval = setInterval(checkAlarm, 1000 * 60); // Check every minute
    checkAlarm(); // Check immediately on load

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [medicines]);

  // Request Notification Permission on mount
  useEffect(() => {
    if ("Notification" in window && Notification.permission !== "granted") {
      Notification.requestPermission();
    }
  }, []);

  if (!alarmActive) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-bounce">
      <div className="bg-red-600 text-white p-6 rounded-lg shadow-2xl flex flex-col items-center gap-4 border-4 border-white">
        <Bell size={48} className="animate-pulse" />
        <div className="text-center">
          <h3 className="text-2xl font-bold">ALARM!</h3>
          <p className="text-lg">
            Time to take <br />
            <span className="font-bold text-yellow-300 text-xl">
              {alarmActive.medName}
            </span>
          </p>
        </div>
        <button
          onClick={() => setAlarmActive(null)}
          className="bg-white text-red-600 px-6 py-2 rounded-full font-bold hover:bg-gray-100"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
