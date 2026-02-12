import { Search, Bell, Settings, User, QrCode, LogOut } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";

export default function CaretakerTopBar({ title }) {
  const { currentUser, logout } = useAuth();

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
        <button
          className="btn btn-outline"
          style={{ padding: "0.5rem", border: "none" }}
        >
          <Bell size={20} className="text-muted" />
        </button>

        <button
          className="btn btn-outline"
          style={{ padding: "0.5rem", border: "none" }}
        >
          <User size={20} className="text-muted" />
        </button>

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
