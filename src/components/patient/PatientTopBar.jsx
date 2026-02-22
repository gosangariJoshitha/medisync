import { useState, useEffect } from "react";
import {
  Bell,
  User,
  Phone,
  QrCode,
  LogOut,
  Settings,
  ChevronDown,
  X,
} from "lucide-react";
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
  const [patientData, setPatientData] = useState(null);
  const [showEmergency, setShowEmergency] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false); // Added missing state
  const [showQRModal, setShowQRModal] = useState(false);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  const getFirstName = () => {
    const fullName =
      patientData?.fullName ||
      currentUser?.fullName ||
      currentUser?.displayName;
    if (fullName) return fullName.split(" ")[0];
    if (currentUser?.email) return currentUser.email.split("@")[0];
    return "Patient";
  };

  useEffect(() => {
    let unsubscribeUser = null;

    if (currentUser) {
      const collectionName = currentUser.sourceCollection || "users";
      const documentId = currentUser.id || currentUser.uid;
      const docRef = doc(db, collectionName, documentId);

      unsubscribeUser = onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setPatientData(data);
          if (data.doctorUid || data.caretakerName) {
            setShowEmergency(true);
          } else {
            setShowEmergency(false);
          }
        }
      });
    }

    // Real-time Notifications
    if (currentUser) {
      const collectionName = currentUser.sourceCollection || "users";
      const documentId = currentUser.id || currentUser.uid;
      const q = query(
        collection(db, collectionName, documentId, "notifications"),
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
      return () => {
        if (unsubscribeUser) unsubscribeUser();
        unsubscribe();
      };
    }
  }, [currentUser]);

  const handleEmergency = async () => {
    const confirm = window.confirm(
      "Are you sure you want to trigger an EMERGENCY ALERT?",
    );
    if (confirm) {
      try {
        const timestamp = new Date();
        const collectionName = currentUser.sourceCollection || "users";
        const documentId = currentUser.id || currentUser.uid;
        // 1. Update Patient Status
        await updateDoc(doc(db, collectionName, documentId), {
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
              patientId: documentId,
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
        padding: "0 1rem",
        gap: "0.5rem",
      }}
    >
      <div className="text-sm sm:text-lg font-semibold text-primary truncate flex-1 md:flex-none mr-2">
        {getGreeting()}, {getFirstName()}
      </div>

      <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
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
            <div
              className="absolute mt-2 bg-white border border-gray-200 shadow-2xl rounded-xl overflow-hidden z-[100] right-0 origin-top-right"
              style={{
                width: "350px",
                maxWidth: "calc(100vw - 2rem)",
                transform: "translateX(-15px)",
              }}
            >
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

        {/* Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setShowProfileMenu(!showProfileMenu);
              setShowNotifications(false);
            }}
            className={`btn btn-outline border-none p-2 text-muted hover:text-primary hover:bg-blue-50 rounded-full flex items-center gap-2 ${showProfileMenu ? "bg-blue-50 text-primary" : ""}`}
            title="Profile"
          >
            <User size={20} />
            <ChevronDown size={14} className="opacity-50" />
          </button>

          {showProfileMenu && (
            <div
              className="absolute mt-2 origin-top-right bg-white border border-gray-200 shadow-xl rounded-lg z-[100] animate-in fade-in slide-in-from-top-2 p-4 right-0"
              style={{
                width: "220px",
                minWidth: "220px",
                maxWidth: "calc(100vw - 2rem)",
                transform: "translateX(-15px)",
              }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                  <User size={24} />
                </div>
                <div>
                  <p className="font-bold text-gray-800 line-clamp-1">
                    {getFirstName()}
                  </p>
                  <p className="text-xs text-muted truncate">
                    {currentUser?.email}
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <button
                  onClick={() => {
                    setShowQRModal(true);
                    setShowProfileMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 rounded flex items-center gap-2"
                >
                  <QrCode size={16} /> My QR Code
                </button>
                <Link
                  to="/dashboard/patient/settings"
                  className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 rounded flex items-center gap-2"
                  onClick={() => setShowProfileMenu(false)}
                >
                  <Settings size={16} /> Settings
                </Link>
                <button
                  onClick={() => logout()}
                  className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded flex items-center gap-2"
                >
                  <LogOut size={16} /> Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* QR Code Modal */}
      {showQRModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] px-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 relative shadow-2xl animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setShowQRModal(false)}
              className="absolute top-4 right-4 p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
            >
              <X size={20} className="text-gray-600" />
            </button>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <QrCode size={32} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                My Medical ID
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                Doctors can scan this to securely view your health profile and
                vitals.
              </p>
              <div className="bg-white p-4 rounded-xl border-2 border-dashed border-gray-200 shadow-sm mb-4 flex justify-center">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${currentUser.uid}`}
                  alt="Patient QR Code"
                  className="w-48 h-48"
                />
              </div>
              <p className="font-mono text-xs text-gray-400 bg-gray-50 p-2 rounded">
                ID: {currentUser.uid}
              </p>
            </div>
          </div>
        </div>
      )}

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
