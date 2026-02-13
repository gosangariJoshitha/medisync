import {
  Search,
  Bell,
  Settings,
  User,
  LogOut,
  ChevronDown,
  Menu,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
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
  const [doctorName, setDoctorName] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

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

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-50">
      {/* Left: Welcome & Search */}
      <div className="flex items-center gap-6 flex-1">
        <div className="hidden lg:flex items-center gap-2 text-sm whitespace-nowrap">
          <span className="text-muted">Welcome,</span>
          <span className="font-bold text-primary">
            Dr. {doctorName || "Doctor"}
          </span>
        </div>

        <div className="relative w-96">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
          />
          <input
            type="text"
            placeholder="Search patients by name or ID..."
            className="input w-full pl-10 bg-gray-50 border-gray-200 focus:bg-white"
          />
        </div>
      </div>

      {/* Right Actions - Icons Reverted */}
      <div className="flex items-center gap-3">
        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="btn btn-outline border-none p-2 relative text-muted hover:text-primary hover:bg-blue-50 rounded-full"
            title="Notifications"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 shadow-xl rounded-lg overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
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
                      className={`p-3 border-b hover:bg-gray-50 transition-colors cursor-pointer ${notif.read ? "opacity-60" : ""}`}
                    >
                      <p className="text-sm font-medium text-gray-800">
                        {notif.title || "New Notification"}
                      </p>
                      <p className="text-xs text-muted mt-1">{notif.message}</p>
                      <p className="text-xs text-blue-500 mt-2">
                        {notif.timestamp
                          ?.toDate()
                          .toLocaleTimeString([], {
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

        <Link
          to="/dashboard/doctor/settings"
          className="btn btn-outline border-none p-2 text-muted hover:text-primary hover:bg-blue-50 rounded-full"
          title="Settings"
        >
          <Settings size={20} />
        </Link>

        <button
          className="btn btn-outline border-none p-2 text-muted hover:text-primary hover:bg-blue-50 rounded-full"
          title="Profile"
        >
          <User size={20} />
        </button>

        <button className="btn btn-primary" style={{ padding: "0.5rem 1rem" }}>
          <span>Scan QR</span>
        </button>

        <button
          onClick={() => logout()}
          className="btn btn-outline hover:bg-red-50 hover:text-red-600 border-gray-200 text-muted ml-2"
          title="Logout"
        >
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
}
