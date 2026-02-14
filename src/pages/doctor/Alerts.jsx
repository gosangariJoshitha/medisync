import { useState, useEffect } from "react";
import { db } from "../../firebase";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  getDoc,
} from "firebase/firestore";
import { useAuth } from "../../contexts/AuthContext";
import { AlertTriangle, CheckCircle, Clock, Phone, MapPin } from "lucide-react";
import { Link } from "react-router-dom";

export default function Alerts() {
  const { currentUser } = useAuth();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;

    // Fetch Emergency Notifications
    const q = query(
      collection(db, "users", currentUser.uid, "notifications"),
      where("type", "==", "emergency"),
      orderBy("timestamp", "desc"),
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setAlerts(list);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const handleResolve = async (alertId, patientId) => {
    try {
      if (
        window.confirm(
          "Mark this alert as resolved? This will reset the patient's critical status.",
        )
      ) {
        // 1. Mark notification as read
        await updateDoc(
          doc(db, "users", currentUser.uid, "notifications", alertId),
          {
            read: true,
            resolvedAt: new Date().toISOString(),
          },
        );

        // 2. Reset patient status if needed (Optional, decided by doctor)
        if (patientId) {
          await updateDoc(doc(db, "users", patientId), {
            isEmergency: false,
            riskStatus: "attention", // Downgrade from critical
          });
        }
        alert("Alert Resolved.");
      }
    } catch (e) {
      console.error("Error resolving alert", e);
    }
  };

  return (
    <div className="fade-in max-w-4xl mx-auto">
      <h1 className="text-2xl font-semibold mb-6 flex items-center gap-2">
        <AlertTriangle className="text-red-600" /> Emergency Alerts
      </h1>

      {loading ? (
        <p>Loading alerts...</p>
      ) : (
        <div className="space-y-4">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={`card border-l-4 ${alert.read ? "border-l-gray-300 bg-gray-50" : "border-l-red-500 bg-white shadow-md"}`}
            >
              <div className="flex justify-between items-start">
                <div className="flex gap-4">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center ${alert.read ? "bg-gray-200 text-gray-500" : "bg-red-100 text-red-600 animate-pulse"}`}
                  >
                    <AlertTriangle size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{alert.title}</h3>
                    <p className="text-gray-800 font-medium mb-1">
                      {alert.message}
                    </p>
                    <div className="text-sm text-muted flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <Clock size={14} />{" "}
                        {alert.timestamp?.toDate().toLocaleString()}
                      </span>
                      {alert.patientId && (
                        <Link
                          to={`/dashboard/doctor/patient/${alert.patientId}`}
                          className="text-blue-600 hover:underline"
                        >
                          View Patient Profile
                        </Link>
                      )}
                    </div>
                  </div>
                </div>

                {!alert.read && (
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => handleResolve(alert.id, alert.patientId)}
                      className="btn btn-outline hover:bg-green-50 hover:text-green-700 hover:border-green-200 flex items-center gap-2"
                    >
                      <CheckCircle size={16} /> Resolve Alert
                    </button>
                    <a
                      href="tel:911"
                      className="btn btn-primary bg-red-600 border-red-600 hover:bg-red-700 flex items-center justify-center gap-2"
                    >
                      <Phone size={16} /> Call 911
                    </a>
                  </div>
                )}
                {alert.read && (
                  <span className="text-sm text-green-600 font-bold flex items-center gap-1">
                    <CheckCircle size={16} /> Resolved
                  </span>
                )}
              </div>
            </div>
          ))}

          {alerts.length === 0 && (
            <p className="text-center text-muted py-10">
              No emergency alerts found.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
