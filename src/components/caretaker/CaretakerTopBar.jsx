import { Search, Bell, Settings, User, QrCode, LogOut } from "lucide-react";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase";

export default function CaretakerTopBar({ title }) {
  const { logout, currentUser } = useAuth();
  const [name, setName] = useState("");

  useEffect(() => {
    async function fetchName() {
      if (currentUser) {
        const snap = await getDoc(doc(db, "users", currentUser.uid));
        if (snap.exists()) {
          setName(
            snap.data().fullName || currentUser.displayName || "Caretaker",
          );
        }
      }
    }
    fetchName();
  }, [currentUser]);

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
      {/* Title / Search */}
      <div className="flex items-center gap-4">
        {title && <h2 className="text-xl font-bold text-primary">{title}</h2>}
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-4">
        <div className="hidden md:block text-right mr-2">
          <p className="text-sm text-muted">Welcome,</p>
          <p className="text-sm font-bold text-primary">{name}</p>
        </div>

        <button
          className="btn btn-outline"
          style={{ padding: "0.5rem", border: "none" }}
        >
          <Bell size={20} className="text-muted" />
        </button>

        <Link
          to="/dashboard/caretaker/settings"
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
          onClick={() => logout()}
          className="btn btn-outline hover:bg-red-50 hover:text-red-600 hover:border-red-200 transaction-colors"
          style={{
            marginLeft: "1rem",
            borderColor: "var(--border)",
            color: "var(--text-muted)",
          }}
        >
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </div>
    </header>
  );
}
