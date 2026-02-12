import { useEffect, useState } from "react";
import { db } from "../../firebase";
import {
  collection,
  query,
  getDocs,
  doc,
  updateDoc,
  increment,
  getDoc,
  onSnapshot,
} from "firebase/firestore"; // Added onSnapshot
import { useAuth } from "../../contexts/AuthContext";
import { CheckCircle, XCircle, Clock, Flame, RotateCcw } from "lucide-react";
import { motion } from "framer-motion";
import { getSmartMessage } from "../../services/mlService";

export default function PatientHome() {
  const { currentUser } = useAuth();
  const [medicines, setMedicines] = useState([]);
  const [userStats, setUserStats] = useState({ streak: 0, adherence: 100 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;

    setLoading(true);

    // 1. Real-time Medicines
    const medsRef = collection(db, "users", currentUser.uid, "medicines");
    const unsubscribeMeds = onSnapshot(
      medsRef,
      (snapshot) => {
        const medsList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setMedicines(medsList);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching medicines real-time:", error);
        setLoading(false);
      },
    );

    // 2. Real-time User Stats
    const userRef = doc(db, "users", currentUser.uid);
    const unsubscribeUser = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
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

  const handleAction = async (medId, action) => {
    // In a real app, we would log this action in a subcollection 'logs' with timestamp
    // For this prototype, we'll just toggle a local state or show an alert, and update streak
    try {
      if (action === "taken") {
        const userRef = doc(db, "users", currentUser.uid);
        await updateDoc(userRef, {
          streak: increment(1),
          points: increment(10), // Gamification
        });
        setUserStats((prev) => ({ ...prev, streak: prev.streak + 1 }));
        alert("Medicine Taken! +10 Points");
      } else {
        // Missed/Skipped
        const userRef = doc(db, "users", currentUser.uid);
        await updateDoc(userRef, {
          streak: 0,
        });
        setUserStats((prev) => ({ ...prev, streak: 0 }));
        alert("Medicine Skipped. Streak Reset.");
      }
    } catch (e) {
      console.error("Action failed", e);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-2">Today's Schedule</h1>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 p-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg shadow-lg"
      >
        <p className="font-medium text-lg">
          {userStats
            ? getSmartMessage(
                currentUser.displayName || "Patient",
                userStats.streak,
                userStats.adherence,
              )
            : "Loading insights..."}
        </p>
      </motion.div>

      {/* Quick Summary Cards */}
      <div className="grid grid-cols-3 gap-6 mb-8">
        <div className="card bg-blue-50 border-blue-100 flex items-center gap-4">
          <div className="p-3 bg-blue-200 text-blue-700 rounded-full">
            <CheckCircle size={24} />
          </div>
          <div>
            <p className="text-sm text-blue-700 font-semibold">Adherence</p>
            <p className="text-2xl font-bold text-blue-900">
              {userStats.adherence}%
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
              {userStats.streak} Days
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
          medicines={medicines}
          onAction={handleAction}
        />
      </div>
    </div>
  );
}

function TimelineSection({ title, medicines, onAction }) {
  if (medicines.length === 0)
    return (
      <p className="text-muted italic">No medicines scheduled for today.</p>
    );

  return (
    <div className="grid grid-cols-1 gap-4">
      {medicines.map((med) => (
        <MedicineCard key={med.id} med={med} onAction={onAction} />
      ))}
    </div>
  );
}

function MedicineCard({ med, onAction }) {
  const [status, setStatus] = useState("pending"); // pending, taken, skipped

  const handleBtn = (type) => {
    setStatus(type);
    onAction(med.id, type);
  };

  return (
    <motion.div
      layout
      className="card flex items-center justify-between p-4"
      style={{
        borderLeft:
          status === "taken"
            ? "4px solid var(--secondary)"
            : status === "skipped"
              ? "4px solid var(--danger)"
              : "4px solid var(--primary)",
      }}
    >
      <div className="flex items-center gap-4">
        <div
          className={`p-3 rounded-full ${
            status === "taken"
              ? "bg-green-100 text-green-600"
              : status === "skipped"
                ? "bg-red-100 text-red-600"
                : "bg-blue-100 text-blue-600"
          }`}
        >
          <Clock size={20} />
        </div>
        <div>
          <h3 className="font-semibold text-lg">{med.name}</h3>
          <p className="text-sm text-muted">
            {med.dosage} Tablet • {med.timing}
          </p>
        </div>
      </div>

      {status === "pending" ? (
        <div className="flex gap-2">
          <button
            onClick={() => handleBtn("skipped")}
            className="p-2 text-red-500 hover:bg-red-50 rounded-full"
            title="Skip"
          >
            <XCircle size={28} />
          </button>
          <button
            onClick={() => handleBtn("taken")}
            className="p-2 text-green-500 hover:bg-green-50 rounded-full"
            title="Take"
          >
            <CheckCircle size={28} />
          </button>
        </div>
      ) : (
        <div
          className={`text-sm font-bold px-3 py-1 rounded-full uppercase ${
            status === "taken"
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {status}
        </div>
      )}
    </motion.div>
  );
}
