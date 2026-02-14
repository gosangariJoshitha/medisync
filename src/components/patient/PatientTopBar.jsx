import { useState, useEffect } from "react";
import { Bell, User, Phone, QrCode, LogOut, Settings } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
  doc,
  getDoc,
} from "firebase/firestore";
import { db } from "../../firebase";

export default function PatientTopBar() {
  const { currentUser, logout } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    async function fetchPatientData() {
      if (currentUser) {
        const docRef = doc(db, "users", currentUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setPatientData(data);
          if (data.doctorUid || data.caretakerName) {
            setShowEmergency(true);
          } else {
            setShowEmergency(false);
          }
        }
      }
    }
    fetchPatientData();

    // Real-time Notifications
    if (currentUser) {
      const q = query(
        collection(db, "users", currentUser.uid, "notifications"),
        orderBy("timestamp", "desc"),
        limit(10),
      );
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const notifs = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setNotifications(notifs);
        setUnreadCount(notifs.filter((n) => !n.read).length);
      });
      return () => unsubscribe();
    }
  }, [currentUser]);

  const handleEmergency = async () => {
    const confirm = window.confirm(
      "Are you sure you want to trigger an EMERGENCY ALERT?",
    );
    if (confirm) {
      try {
        const timestamp = new Date();
        // 1. Update Patient Status
        await updateDoc(doc(db, "users", currentUser.uid), {
          riskStatus: "critical",
          isEmergency: true,
          lastEmergency: timestamp.toISOString(),
        });

        // 2. Notify Doctor (if linked)
        if (patientData?.doctorUid) {
          await addDoc(
            collection(db, "users", patientData.doctorUid, "notifications"),
            {
              title: "EMERGENCY ALERT",
              message: `Patient ${patientData.fullName} reported distress!`,
              type: "emergency",
              patientId: currentUser.uid,
              read: false,
              timestamp: timestamp,
            },
          );
        }

        alert(
          `EMERGENCY TRIGGERED!\n\nAlert sent to Dr. and Caretaker.\nPlease call 911 if life-threatening.`,
        );
      } catch (error) {
        console.error("Emergency Error", error);
        alert("Failed to send alert. Please call emergency services directly.");
      }
    }
  };

  return (
    <header
      style={{
        height: "4rem",
        backgroundColor: "var(--surface)",
        borderBottom: "1px solid var(--border)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 2rem",
      }}
    >
      <div className="text-lg font-semibold text-primary">
        Welcome, {patientData?.fullName || "Patient"}
      </div>

      <div className="flex items-center gap-4">
        {showEmergency && (
          <button
            onClick={handleEmergency}
            className="btn"
            style={{
              backgroundColor: "var(--danger)",
              color: "white",
              animation: "pulse 2s infinite",
              border: "none",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <Phone size={18} /> EMERGENCY
          </button>
        )}

        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="btn btn-outline"
            style={{ padding: "0.5rem", border: "none" }}
          >
            <Bell size={20} className="text-muted" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 shadow-xl rounded-lg overflow-hidden z-50">
              <div className="p-3 border-b bg-gray-50 flex justify-between items-center">
                <h3 className="font-semibold text-sm">Notifications</h3>
                <span className="text-xs text-primary cursor-pointer hover:underline">
                  Mark all read
                </span>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {notifications.length > 0 ? (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className={`p-3 border-b hover:bg-gray-50 transition-colors ${notif.read ? "opacity-60" : ""}`}
                    >
                      <p className="text-sm font-medium text-gray-800">
                        {notif.title || "New Message"}
                      </p>
                      <p className="text-xs text-muted mt-1">{notif.message}</p>
                      <p className="text-xs text-blue-500 mt-2">
                        {notif.timestamp?.toDate().toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-muted text-sm">
                    No new notifications
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <Link
          to="/dashboard/patient/settings"
          className="btn btn-outline"
          style={{
            padding: "0.5rem",
            border: "none",
            display: "flex",
            alignItems: "center",
          }}
        >
          <Settings size={20} className="text-muted" />
        </Link>

        <button
          className="btn btn-primary"
          style={{
            padding: "0.5rem 1rem",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <QrCode size={18} />
          <span className="text-sm">Scan</span>
        </button>

        <button
          onClick={() => logout()}
          className="btn btn-outline hover:bg-red-50 hover:text-red-600 hover:border-red-200 transaction-colors"
          style={{
            marginLeft: "1rem",
            borderColor: "var(--border)",
            color: "var(--text-muted)",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </div>

      <style>{`
          @keyframes pulse {
              0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
              70% { box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
              100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
          }
      `}</style>
    </header>
  );
}
