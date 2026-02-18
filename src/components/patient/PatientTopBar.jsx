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
  updateDoc,
  addDoc,
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
            className="p-2 relative text-gray-500 hover:text-blue-600 hover:shadow-sm hover:shadow-blue-200 rounded-lg transition-all duration-300 ease-out transform hover:scale-110 active:scale-95 border-0 outline-none bg-transparent group"
            style={{ padding: "0.5rem" }}
          >
            <Bell
              size={20}
              className="group-hover:animate-bounce transition-all duration-300"
            />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full border-2 border-white flex items-center justify-center flex-shrink-0">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-96 bg-white border border-gray-200 shadow-2xl rounded-xl overflow-hidden z-50">
              <div className="p-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50 flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-base text-gray-900">
                    Notifications
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {unreadCount} unread
                  </p>
                </div>
                <span className="text-xs text-primary cursor-pointer hover:underline font-semibold hover:text-primary/80 transition-colors">
                  Mark all read
                </span>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.length > 0 ? (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className={`p-4 border-b transition-all cursor-pointer ${
                        notif.read
                          ? "bg-white opacity-70 hover:bg-gray-50"
                          : "bg-blue-50 hover:bg-blue-100 border-blue-100"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${notif.read ? "bg-gray-300" : "bg-blue-500"}`}
                        ></div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900">
                            {notif.title || "New Message"}
                          </p>
                          <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                            {notif.message}
                          </p>
                          <p className="text-xs text-gray-400 mt-2 font-medium">
                            {notif.timestamp?.toDate
                              ? notif.timestamp
                                  .toDate()
                                  .toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })
                              : "Just now"}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center">
                    <Bell size={32} className="text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">
                      No notifications yet
                    </p>
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
