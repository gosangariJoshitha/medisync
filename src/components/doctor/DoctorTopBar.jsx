import { Html5QrcodeScanner } from "html5-qrcode";
import {
  Search,
  Bell,
  Settings,
  User,
  LogOut,
  ChevronDown,
  Menu,
  QrCode,
  Mic,
  X,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  limit,
} from "firebase/firestore";
import { useAuth } from "../../contexts/AuthContext";

export default function TopBar() {
  const { logout, currentUser } = useAuth();
  const navigate = useNavigate();
  const [doctorName, setDoctorName] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // QR Scanner State
  const [showScanner, setShowScanner] = useState(false);
  const scannerRef = useRef(null);

  useEffect(() => {
    if (currentUser?.displayName) {
      setDoctorName(currentUser.displayName);
    } else if (currentUser) {
      const fetchName = async () => {
        const d = await getDoc(doc(db, "users", currentUser.uid));
        if (d.exists()) setDoctorName(d.data().fullName);
      };
      fetchName();
    }

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

  // Handle QR Scanner Logic
  useEffect(() => {
    if (showScanner) {
      const scanner = new Html5QrcodeScanner(
        "reader",
        { fps: 10, qrbox: { width: 250, height: 250 } },
        /* verbose= */ false,
      );

      scanner.render(
        (decodedText) => {
          // Success Callback
          console.log(`Scan result: ${decodedText}`);
          scanner.clear();
          setShowScanner(false);

          // Assuming QR code contains Patient ID (e.g., PAT-1234)
          // Navigate to patient details
          // In real app, we might need to lookup the doc ID from the PAT- ID first
          // But here let's assume decodedText IS the doc ID or we search for it.
          // For now, let's treat it as a search query or direct ID.

          alert(`Scanned: ${decodedText}. Navigating...`);
          // Navigate to patient details if it looks like an ID, else search
          navigate(`/dashboard/doctor`); // Placeholder navigation - would go to specific patient
        },
        (error) => {
          // Error Callback - ignore frame errors
          // console.warn(error);
        },
      );
      scannerRef.current = scanner;

      return () => {
        if (scannerRef.current) {
          try {
            scannerRef.current.clear();
          } catch (e) {
            // ignore cleanup error
          }
        }
      };
    }
  }, [showScanner, navigate]);

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-50">
      {/* Left: Welcome & Search */}
      <div className="flex items-center gap-4 min-w-0">
        <div className="hidden lg:flex items-center gap-2 text-sm whitespace-nowrap">
          <span className="text-muted">Welcome,</span>
          <span className="font-bold text-primary">
            Dr. {doctorName || "Doctor"}
          </span>
        </div>

        <div className="relative w-72 group">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors duration-200"
          />
          <input
            type="text"
            placeholder="Search patients..."
            className="input w-full pl-9 pr-10 bg-white border border-gray-200 shadow-sm hover:border-gray-300 focus:border-blue-400 focus:ring-1 focus:ring-blue-200 focus:bg-white focus:shadow-md rounded-lg text-sm transition-all duration-200"
          />
          <button
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-gray-500 hover:text-blue-600 hover:shadow-sm hover:shadow-blue-200 transition-all duration-300 ease-out transform hover:scale-110 active:scale-95 group-focus-within:text-blue-500 border-0 outline-none bg-transparent"
            title="Voice Search"
            onClick={() => alert("Listening... (Voice Search Simulation)")}
          >
            <Mic 
              size={16} 
              strokeWidth={2.5}
              className="group-hover:animate-pulse transition-all duration-300"
            />
          </button>
        </div>
      </div>

      {/* Right Actions - Icons Reverted */}
      <div className="flex items-center gap-4 flex-shrink-0">
        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowProfileMenu(false);
            }}
            className="p-2 relative text-gray-500 hover:text-blue-600 hover:shadow-sm hover:shadow-blue-200 rounded-lg transition-all duration-300 ease-out transform hover:scale-110 active:scale-95 border-0 outline-none bg-transparent group"
            title="Notifications"
          >
            <Bell size={20} className="group-hover:animate-bounce transition-all duration-300" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full border-2 border-white flex items-center justify-center flex-shrink-0">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-96 bg-white border border-gray-200 shadow-2xl rounded-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
              <div className="p-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50 flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-base text-gray-900">Notifications</h3>
                  <p className="text-xs text-gray-500 mt-0.5">{unreadCount} unread</p>
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
                        <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${notif.read ? "bg-gray-300" : "bg-blue-500"}`}></div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900">
                            {notif.title || "New Notification"}
                          </p>
                          <p className="text-xs text-gray-600 mt-1 line-clamp-2">{notif.message}</p>
                          <p className="text-xs text-gray-400 mt-2 font-medium">
                            {notif.timestamp?.toDate ? notif.timestamp.toDate().toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            }) : "Just now"}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center">
                    <Bell size={32} className="text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">No notifications yet</p>
                  </div>
                )}
              </div>
              <div className="p-2 text-center border-t bg-gray-50">
                <Link
                  to="/dashboard/doctor/alerts"
                  className="text-xs text-primary font-medium hover:underline"
                >
                  View All Alerts
                </Link>
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
            <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 shadow-xl rounded-lg z-50 animate-in fade-in slide-in-from-top-2 p-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                  <User size={24} />
                </div>
                <div>
                  <p className="font-bold text-gray-800 line-clamp-1">
                    {doctorName || "Doctor"}
                  </p>
                  <p className="text-xs text-muted truncate">
                    {currentUser?.email}
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <Link
                  to="/dashboard/doctor/settings"
                  className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded flex items-center gap-2"
                >
                  <Settings size={16} /> Account Settings
                </Link>
                <button
                  onClick={() => logout()}
                  className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded flex items-center gap-2"
                >
                  <LogOut size={16} /> Sign Out
                </button>
              </div>
            </div>
          )}
        </div>

        <button
          onClick={() => setShowScanner(true)}
          className="btn btn-primary flex items-center gap-2"
          style={{ padding: "0.5rem 1rem" }}
        >
          <QrCode size={18} />
          <span>Scan QR</span>
        </button>
      </div>

      {/* Global Emergency Banner */}
      {notifications.some((n) => n.type === "emergency" && !n.read) && (
        <div className="absolute top-16 left-0 w-full bg-red-600 text-white p-3 flex justify-between items-center z-40 animate-pulse px-6 shadow-md">
          <div className="flex items-center gap-3 font-bold">
            <div className="bg-white text-red-600 rounded-full p-1">
              <Bell size={16} />
            </div>
            <span>
              EMERGENCY ALERT: One or more patients reported distress!
            </span>
          </div>
          <Link
            to="/dashboard/doctor/alerts"
            className="bg-white text-red-600 px-3 py-1 rounded text-sm font-bold hover:bg-red-50"
          >
            View Alerts
          </Link>
        </div>
      )}

      {/* QR Scanner Modal */}
      {showScanner && (
        <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full relative overflow-hidden">
            <button
              onClick={() => setShowScanner(false)}
              className="absolute top-2 right-2 p-2 bg-gray-100 rounded-full hover:bg-gray-200 z-10"
            >
              <X size={20} />
            </button>
            <div className="p-6 text-center">
              <h2 className="text-xl font-bold mb-4">Scan Patient QR Code</h2>
              <div
                id="reader"
                className="w-full h-64 bg-gray-100 rounded-lg overflow-hidden relative"
              ></div>
              <p className="text-sm text-muted mt-4">
                Point current camera at a patient's QR code to view their
                profile.
              </p>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
