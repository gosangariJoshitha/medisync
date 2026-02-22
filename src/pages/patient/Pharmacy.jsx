import { useState } from "react";
import {
  ShoppingBag,
  Clock,
  Pill,
  Truck,
  RefreshCw,
  Bell,
  Check,
} from "lucide-react";
import Toast from "../../components/common/Toast";

import { useAuth } from "../../contexts/AuthContext";
import { db } from "../../firebase";
import { collection, doc, onSnapshot, updateDoc } from "firebase/firestore";
import { useEffect } from "react";

export default function Pharmacy() {
  const [refills, setRefills] = useState([]);
  const { currentUser } = useAuth();

  const [toast, setToast] = useState(null);
  const [alarms, setAlarms] = useState({}); // { id: boolean }

  useEffect(() => {
    if (!currentUser) return;
    const collectionName = currentUser.sourceCollection || "users";
    const documentId = currentUser.id || currentUser.uid;
    const userRef = doc(db, collectionName, documentId);
    const medsRef = collection(db, collectionName, documentId, "medicines");

    // 1. Sync User Alarms
    const unsubUser = onSnapshot(userRef, (snapshot) => {
      if (snapshot.exists()) {
        setAlarms(snapshot.data().smartAlarms || {});
      }
    });

    // 2. Sync Medicines
    const unsubMeds = onSnapshot(medsRef, (snapshot) => {
      const meds = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name,
          daysLeft: data.alertQuantity || 5, // Mock days left based on alertQuantity
        };
      });
      // Sort to show critically low first
      meds.sort((a, b) => a.daysLeft - b.daysLeft);
      setRefills(meds);
    });

    return () => {
      unsubUser();
      unsubMeds();
    };
  }, [currentUser]);

  const toggleAlarm = async (id) => {
    if (!currentUser) return;
    const newState = !alarms[id];
    const collectionName = currentUser.sourceCollection || "users";
    const documentId = currentUser.id || currentUser.uid;
    const userRef = doc(db, collectionName, documentId);

    try {
      // Optimistic update for speedy UI response
      setAlarms({ ...alarms, [id]: newState });

      await updateDoc(userRef, {
        [`smartAlarms.${id}`]: newState,
      });

      setToast({
        message: newState ? "Smart Alarm Enabled" : "Alarm Disabled",
        type: newState ? "success" : "info",
      });
    } catch (e) {
      console.error(e);
      setToast({
        message: "Failed to update alarm",
        type: "error",
      });
    }
  };

  return (
    <div className="fade-in max-w-4xl mx-auto">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <h1 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
        <ShoppingBag className="text-pink-500" /> Pharmacy & Refills
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card p-6 bg-gradient-to-br from-pink-50 to-white border-pink-100">
          <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Clock size={18} className="text-pink-500" /> Refill Assistant
          </h3>
          <div className="space-y-4">
            {refills.map((med) => (
              <div
                key={med.id}
                className="flex justify-between items-center bg-white p-3 rounded-lg shadow-sm"
              >
                <div>
                  <p className="font-bold text-sm text-gray-800">{med.name}</p>
                  <p
                    className={`text-xs font-bold ${med.daysLeft <= 7 ? "text-red-500" : "text-green-500"}`}
                  >
                    {med.daysLeft} days supply left
                  </p>
                </div>
                {med.daysLeft <= 7 && (
                  <button className="btn btn-xs btn-primary shadow-sm hover:bg-blue-600 border-none">
                    Order
                  </button>
                )}
              </div>
            ))}
            {refills.length === 0 && (
              <p className="text-gray-500 text-sm italic">
                No active medicines found.
              </p>
            )}
          </div>
        </div>

        <div className="card p-6 md:col-span-2">
          <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Truck size={18} className="text-blue-500" /> Active Orders
          </h3>
          <div className="bg-gray-50 rounded-xl p-8 text-center border-dashed border-2 border-gray-200">
            <div className="w-16 h-16 bg-blue-100 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-3">
              <RefreshCw size={24} />
            </div>
            <p className="text-gray-500 font-medium">No active orders</p>
            <p className="text-sm text-gray-400">
              Your recent refills will appear here.
            </p>
          </div>
        </div>
      </div>

      <h2 className="text-xl font-bold text-gray-900 mb-4">Smart Reminders</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Suggestion 1 */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-start gap-4">
          <div className="bg-yellow-100 text-yellow-600 p-3 rounded-lg">
            <Pill size={24} />
          </div>
          <div>
            <h4 className="font-bold text-gray-800">
              Missed Dose Pattern Detected
            </h4>
            <p className="text-sm text-gray-600 mt-1">
              You often miss your evening dose on Fridays. Would you like to set
              a stronger alarm?
            </p>
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => toggleAlarm("friday")}
                className={`btn btn-xs ${alarms["friday"] ? "btn-success text-white" : "btn-primary"}`}
              >
                {alarms["friday"] ? (
                  <>
                    <Check size={12} className="mr-1" /> Active
                  </>
                ) : (
                  "Enable Alarm"
                )}
              </button>
              <button className="btn btn-xs btn-ghost text-gray-500">
                Dismiss
              </button>
            </div>
          </div>
        </div>

        {/* Suggestion 2 */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-start gap-4">
          <div className="bg-green-100 text-green-600 p-3 rounded-lg">
            <Clock size={24} />
          </div>
          <div>
            <h4 className="font-bold text-gray-800">Optimization Suggestion</h4>
            <p className="text-sm text-gray-600 mt-1">
              Taking Metformin with dinner reduces side effects. We can adjust
              your schedule.
            </p>
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => toggleAlarm("metformin")}
                className={`btn btn-xs ${alarms["metformin"] ? "btn-success text-white" : "btn-primary"}`}
              >
                {alarms["metformin"] ? (
                  <>
                    <Check size={12} className="mr-1" /> Adjusted
                  </>
                ) : (
                  "Adjust Time"
                )}
              </button>
              <button className="btn btn-xs btn-ghost text-gray-500">
                Dismiss
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
