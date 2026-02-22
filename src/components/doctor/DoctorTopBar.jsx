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
import { doc, getDoc, writeBatch, getDocs } from "firebase/firestore";
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

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };
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
        async (decodedText) => {
          // Success Callback - try to resolve to a patient doc
          console.log(`Scan result: ${decodedText}`);
          try {
            // Try direct doc id first
            const direct = await getDoc(doc(db, "patients", decodedText));
            if (direct.exists()) {
              scanner.clear();
              setShowScanner(false);
              navigate(`/dashboard/doctor/patient/${direct.id}`);
              return;
            }

            // Fallback: search by patientId field (e.g., PAT-1234)
            const q = query(
              collection(db, "patients"),
              where("patientId", "==", decodedText),
            );
            const snap = await getDocs(q);
            if (!snap.empty) {
              const p = snap.docs[0];
              scanner.clear();
              setShowScanner(false);
              navigate(`/dashboard/doctor/patient/${p.id}`);
              return;
            }

            // Not found
            alert(`No patient found for scanned code: ${decodedText}`);
          } catch (err) {
            console.error("QR lookup failed", err);
            alert("Failed to lookup scanned code. Try again.");
          } finally {
            try {
              scanner.clear();
            } catch (e) {
              // ignore
            }
            setShowScanner(false);
          }
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

  // Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [allPatients, setAllPatients] = useState([]);
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [showResults, setShowResults] = useState(false);

  // Fetch Patients for Search
  useEffect(() => {
    if (!currentUser) return;

    const q = query(
      collection(db, "patients"),
      where("doctorUid", "==", currentUser.uid),
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const patients = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setAllPatients(patients);
    });

    return () => unsubscribe();
  }, [currentUser]);

  // Handle Search Input
  const handleSearch = (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (query.trim() === "") {
      setFilteredPatients([]);
      setShowResults(false);
    } else {
      const lowerQ = query.toLowerCase();
      const filtered = allPatients.filter(
        (p) =>
          p.fullName?.toLowerCase().includes(lowerQ) ||
          p.patientId?.toLowerCase().includes(lowerQ),
      );
      setFilteredPatients(filtered);
      setShowResults(true);
    }
  };

  // Mark all notifications as read
  const handleMarkAllRead = async () => {
    if (!currentUser || unreadCount === 0) return;

    try {
      const batch = writeBatch(db);
      const unreadNotifs = notifications.filter((n) => !n.read);

      unreadNotifs.forEach((notif) => {
        const notifRef = doc(
          db,
          "users",
          currentUser.uid,
          "notifications",
          notif.id,
        );
        batch.update(notifRef, { read: true });
      });

      await batch.commit();
      console.log("All notifications marked as read");
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-50">
      {/* Left: Welcome & Search */}
      <div className="flex items-center gap-8 flex-1">
        <p className="hidden lg:block text-sm text-gray-500 whitespace-nowrap flex-shrink-0">
          {getGreeting()},{" "}
          <span className="font-bold text-blue-600">
            Dr. {doctorName || "Doctor"}
          </span>
        </p>

        <div className="relative w-full max-w-sm lg:max-w-xs group">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors duration-200"
          />
          <input
            type="text"
            placeholder="Search patients..."
            value={searchQuery}
            onChange={handleSearch}
            onFocus={() => searchQuery && setShowResults(true)}
            onBlur={() => setTimeout(() => setShowResults(false), 200)} // Delay to allow click
            className="input w-full pl-9 pr-10 bg-white border border-gray-200 shadow-sm hover:border-gray-300 focus:border-blue-400 focus:ring-1 focus:ring-blue-200 focus:bg-white focus:shadow-md rounded-lg text-sm transition-all duration-200"
          />
          {showResults && (
            <div className="absolute top-full left-0 w-full mt-2 bg-white border border-gray-100 shadow-xl rounded-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-1">
              {filteredPatients.length > 0 ? (
                <ul>
                  {filteredPatients.slice(0, 5).map((patient) => (
                    <li key={patient.id}>
                      <button
                        onClick={() => {
                          navigate(`/dashboard/doctor/patient/${patient.id}`);
                          setSearchQuery("");
                          setShowResults(false);
                        }}
                        className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3 transition-colors border-b border-gray-50 last:border-0"
                      >
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">
                          {patient.fullName?.charAt(0) || "P"}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-800">
                            {patient.fullName}
                          </p>
                          <p className="text-xs text-gray-500">
                            {patient.patientId}
                          </p>
                        </div>
                      </button>
                    </li>
                  ))}
                  {filteredPatients.length > 5 && (
                    <li className="px-4 py-2 text-xs text-center text-gray-400 bg-gray-50">
                      +{filteredPatients.length - 5} more results
                    </li>
                  )}
                </ul>
              ) : (
                <div className="p-4 text-center text-gray-500 text-sm">
                  No patients found.
                </div>
              )}
            </div>
          )}
          <button
            className="absolute right-2 top-1/2 -translate-y-1/2 btn btn-ghost btn-circle btn-sm text-gray-400 hover:text-blue-600 hover:bg-blue-50 border-none outline-none focus:outline-none focus:ring-0 shadow-none bg-transparent"
            title="Voice Search"
            onClick={() => alert("Listening... (Voice Search Simulation)")}
          >
            <Mic size={18} strokeWidth={2.5} />
          </button>
        </div>
      </div>

      {/* Right Actions - Icons Reverted */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowProfileMenu(false);
            }}
            className={`btn btn-ghost btn-circle btn-sm text-gray-500 hover:text-blue-600 hover:bg-blue-50 border-none outline-none focus:outline-none focus:ring-0 shadow-none bg-transparent ${showNotifications ? "bg-blue-50 text-blue-600" : ""}`}
            title="Notifications"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
            )}
          </button>

          {/* ... (Existing Notification Logic) ... */}

          {showNotifications && (
            <div
              className="absolute mt-2 bg-white border border-gray-200 shadow-2xl rounded-xl overflow-hidden z-[100] animate-in fade-in slide-in-from-top-2 right-0 origin-top-right"
              style={{
                width: "350px",
                maxWidth: "calc(100vw - 2rem)",
                transform: "translateX(-15px)",
              }}
            >
              {/* ... Notification Content ... */}
              <div className="p-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50 flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-base text-gray-900">
                    Notifications
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {unreadCount} unread
                  </p>
                </div>
                <div className="flex gap-3">
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-[10px] font-semibold text-blue-600 hover:text-blue-800 hover:underline transition-colors pt-1"
                    >
                      Mark all read
                    </button>
                  )}
                  {notifications.length > 0 && (
                    <button
                      onClick={async () => {
                        const batch = writeBatch(db);
                        notifications.forEach((n) => {
                          batch.delete(
                            doc(
                              db,
                              "users",
                              currentUser.uid,
                              "notifications",
                              n.id,
                            ),
                          );
                        });
                        await batch.commit();
                      }}
                      className="text-[10px] font-semibold text-gray-500 hover:text-red-600 hover:underline transition-colors pt-1"
                    >
                      Clear All
                    </button>
                  )}
                </div>
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
                            {notif.title || "New Notification"}
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
            <div
              className="absolute mt-2 bg-white border border-gray-200 shadow-xl rounded-lg z-[100] animate-in fade-in slide-in-from-top-2 p-4 right-0 origin-top-right"
              style={{
                width: "250px",
                minWidth: "250px",
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

      {/* QR Scanner Modal */}
      {showScanner && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full relative overflow-hidden">
            <button
              onClick={() => setShowScanner(false)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors z-10"
            >
              <X size={20} />
            </button>
            <div className="p-6 text-center">
              <h2 className="text-xl font-bold mb-2">Scan Patient QR Code</h2>
              <p className="text-sm text-gray-500 mb-6">
                Point your camera at a patient's QR code to view their profile.
              </p>
              <div
                id="reader"
                className="w-full h-64 bg-black rounded-xl overflow-hidden shadow-inner relative border-4 border-blue-50"
              ></div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
