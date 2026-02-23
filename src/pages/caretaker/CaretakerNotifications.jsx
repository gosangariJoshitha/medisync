import { useState, useEffect } from "react";
import { Bell, CheckCircle2 } from "lucide-react";
import { db } from "../../firebase";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  writeBatch,
  doc,
} from "firebase/firestore";
import { useAuth } from "../../contexts/AuthContext";

export default function CaretakerNotifications() {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (!currentUser) return;
    const q = query(
      collection(db, "users", currentUser.uid, "notifications"),
      orderBy("timestamp", "desc"),
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setNotifications(
        snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
      );
    });

    return () => unsubscribe();
  }, [currentUser]);

  const markAllRead = async () => {
    if (!currentUser || notifications.length === 0) return;
    const batch = writeBatch(db);
    notifications.forEach((notif) => {
      if (!notif.read) {
        batch.update(
          doc(db, "users", currentUser.uid, "notifications", notif.id),
          { read: true },
        );
      }
    });
    await batch.commit();
  };

  return (
    <div className="fade-in max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-100 text-primary rounded-xl">
            <Bell size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
            <p className="text-gray-500 text-sm">
              Alerts and updates for your linked patients.
            </p>
          </div>
        </div>
        <button onClick={markAllRead} className="btn btn-outline text-sm">
          <CheckCircle2 size={16} className="mr-2" /> Mark all as read
        </button>
      </div>

      <div className="card p-0 overflow-hidden">
        {notifications.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {notifications.map((notif) => (
              <div
                key={notif.id}
                className={`p-4 ${notif.read ? "bg-white" : "bg-blue-50"}`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {notif.title}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {notif.message}
                    </p>
                  </div>
                  <span className="text-xs text-gray-400">
                    {notif.timestamp?.toDate
                      ? notif.timestamp.toDate().toLocaleString()
                      : "Just now"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center text-gray-500">
            <Bell size={48} className="mx-auto mb-4 text-gray-300" />
            <p>You have no notifications right now.</p>
          </div>
        )}
      </div>
    </div>
  );
}
