import { Link, useLocation } from "react-router-dom";
import { Home, UserPlus, Users, Activity, BarChart2 } from "lucide-react";

export default function Sidebar() {
  const location = useLocation();
  const isActive = (path) => location.pathname === path;

  const menuItems = [
    { path: "/dashboard/doctor", icon: <Home size={20} />, label: "Home" },
    {
      path: "/dashboard/doctor/add-patient",
      icon: <UserPlus size={20} />,
      label: "Add Patient",
    },
    {
      path: "/dashboard/doctor/view-patients",
      icon: <Users size={20} />,
      label: "View Patients",
    },
    {
      path: "/dashboard/doctor/monitor",
      icon: <Activity size={20} />,
      label: "Monitor Patients",
    },
    {
      path: "/dashboard/doctor/reports",
      icon: <BarChart2 size={20} />,
      label: "Reports & Analytics",
    },
  ];

  return (
    <aside
      style={{
        width: "250px",
        backgroundColor: "var(--surface)",
        borderRight: "1px solid var(--border)",
        display: "flex",
        flexDirection: "column",
        padding: "1.5rem 1rem",
      }}
    >
      <div style={{ marginBottom: "2rem", paddingLeft: "1rem" }}>
        <h2
          style={{
            fontSize: "1.25rem",
            fontWeight: 700,
            color: "var(--primary)",
          }}
        >
          MediSync
        </h2>
        <p className="text-sm text-muted">Doctor Portal</p>
      </div>

      <nav className="flex flex-col gap-2">
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              padding: "0.75rem 1rem",
              borderRadius: "0.5rem",
              color: isActive(item.path)
                ? "var(--primary)"
                : "var(--text-muted)",
              backgroundColor: isActive(item.path) ? "#EFF6FF" : "transparent",
              fontWeight: isActive(item.path) ? 600 : 500,
              transition: "all 0.2s",
            }}
          >
            {item.icon}
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
    </aside>
  );
}
