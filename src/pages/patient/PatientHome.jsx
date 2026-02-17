import { useEffect, useState } from "react";
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
} from "lucide-react";
import { Link } from "react-router-dom";
import { motion as Motion } from "framer-motion";
import { getSmartMessage } from "../../services/mlService";

import Toast from "../../components/common/Toast";

export default function PatientHome() {
  const { currentUser } = useAuth();
  const [medicines, setMedicines] = useState([]);
  const [userStats, setUserStats] = useState({ streak: 0, adherence: 100 });
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

  const handleAction = async (medId, action) => {
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
      await updateDoc(medRef, {
        lastAction: todayStr,
        status: action, // 'taken' or 'skipped'
      });

      // 2. Calculate Daily Progress & Adherence
      // We need to wait a tick or use local state, but since we use onSnapshot,
      // let's calculate based on current 'medicines' + this change.
      // Actually, 'medicines' will update via snapshot.
      // For immediate user doc update, let's look at current snapshot and modify this one item.

      const updatedMeds = medicines.map((m) =>
        m.id === medId ? { ...m, status: action, lastAction: todayStr } : m,
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
      {!currentUser.caretakerUid && (
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
            Good Morning, {currentUser.displayName || "Patient"}!
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

function TimelineSection({ medicines, onAction }) {
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

  const handleBtn = (type) => {
    onAction(med.id, type);
  };

  return (
    <Motion.div
      layout
      className="card flex items-center justify-between p-4"
      style={{
        borderLeft:
          currentStatus === "taken"
            ? "4px solid var(--secondary)"
            : currentStatus === "skipped"
              ? "4px solid var(--danger)"
              : "4px solid var(--primary)",
      }}
    >
      <div className="flex items-center gap-4">
        <div
          className={`p-3 rounded-full ${
            currentStatus === "taken"
              ? "bg-green-100 text-green-600"
              : currentStatus === "skipped"
                ? "bg-red-100 text-red-600"
                : "bg-blue-100 text-blue-600"
          }`}
        >
          <Clock size={20} />
        </div>
        <div>
          <h3 className="font-semibold text-lg">{med.name}</h3>
          <p className="text-sm text-muted">
            {med.dosage} • {med.timing}
          </p>
        </div>
      </div>

      {currentStatus === "pending" ? (
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
            currentStatus === "taken"
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {currentStatus}
        </div>
      )}
    </Motion.div>
  );
}
