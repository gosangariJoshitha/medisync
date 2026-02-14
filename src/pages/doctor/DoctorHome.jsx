import { Link } from "react-router-dom";
import {
  UserPlus,
  Users,
  Activity,
  AlertTriangle,
  FileText,
} from "lucide-react";
import { useEffect, useState } from "react";
import { db } from "../../firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { useAuth } from "../../contexts/AuthContext";
import { motion as Motion } from "framer-motion";

export default function DoctorHome() {
  const { currentUser } = useAuth();
  const [stats, setStats] = useState({
    total: 0,
    stable: 0,
    attention: 0,
    critical: 0,
  });
  const [recentAlerts, setRecentAlerts] = useState([]);

  useEffect(() => {
    if (!currentUser) return;

    // Fetch Doctor's Patients Real-time
    const q = query(
      collection(db, "patients"),
      where("doctorUid", "==", currentUser.uid),
    );

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const patients = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Calculate Stats
        const total = patients.length;
        const stable = patients.filter(
          (p) => !p.riskStatus || p.riskStatus === "Stable",
        ).length;
        const attention = patients.filter(
          (p) => p.riskStatus === "Attention",
        ).length;
        const critical = patients.filter(
          (p) => p.riskStatus === "Critical",
        ).length;

        setStats({ total, stable, attention, critical });

        // Generate Alerts from Critical/Attention patients
        const alerts = patients
          .filter(
            (p) => p.riskStatus === "Critical" || p.riskStatus === "Attention",
          )
          .map((p) => ({
            id: p.id,
            patient: p.fullName,
            type:
              p.riskStatus === "Critical" ? "Critical Risk" : "Needs Attention",
            time: "Today", // Simplifying time for now
            severity: p.riskStatus === "Critical" ? "high" : "medium",
          }));

        setRecentAlerts(alerts);
      },
      (error) => {
        console.error("Error loading dashboard", error);
      },
    );

    return () => unsubscribe();
  }, [currentUser]);

  return (
    <div>
      <h1 className="text-2xl mb-6">Dashboard Overview</h1>

      {/* Stats Cards */}
      <div
        className="grid grid-cols-4 gap-4 mb-8"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "1.5rem",
        }}
      >
        <StatCard
          label="Total Patients"
          value={stats.total}
          color="var(--primary)"
        />
        <StatCard
          label="Stable"
          value={stats.stable}
          color="var(--secondary)"
        />
        <StatCard
          label="Needs Attention"
          value={stats.attention}
          color="var(--accent)"
        />
        <StatCard
          label="Critical"
          value={stats.critical}
          color="var(--danger)"
        />
      </div>

      {/* Quick Actions Grid */}
      <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
      <div
        className="grid grid-cols-5 gap-4 mb-8"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "1.5rem",
        }}
      >
        <ActionCard
          to="add-patient"
          icon={<UserPlus size={24} />}
          label="Add Patient"
          desc="Register new patient"
        />
        <ActionCard
          to="view-patients"
          icon={<Users size={24} />}
          label="View Patients"
          desc="Browse patient list"
        />
        <ActionCard
          to="monitor"
          icon={<Activity size={24} />}
          label="Monitor"
          desc="Track adherence"
        />
        <ActionCard
          to="reports"
          icon={<FileText size={24} />}
          label="Reports"
          desc="Analytics & Exports"
        />
        <ActionCard
          to="risk-patients"
          icon={<AlertTriangle size={24} />}
          label="Risk Patients"
          desc="High priority cases"
          color="var(--danger)"
        />
      </div>

      {/* Recent Alerts */}
      <h2 className="text-lg font-semibold mb-4">Recent Alerts</h2>
      <div className="card">
        {recentAlerts.map((alert) => (
          <div
            key={alert.id}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "1rem 0",
              borderBottom: "1px solid var(--border)",
            }}
          >
            <div className="flex items-center gap-4">
              <div
                style={{
                  width: "10px",
                  height: "10px",
                  borderRadius: "50%",
                  backgroundColor:
                    alert.severity === "high"
                      ? "var(--danger)"
                      : alert.severity === "medium"
                        ? "var(--accent)"
                        : "var(--secondary)",
                }}
              />
              <div>
                <p style={{ fontWeight: 600 }}>{alert.patient}</p>
                <p className="text-sm text-muted">{alert.type}</p>
              </div>
            </div>
            <span className="text-sm text-muted">{alert.time}</span>
          </div>
        ))}
        {recentAlerts.length === 0 && (
          <p className="text-muted text-center">No recent alerts.</p>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, color }) {
  return (
    <div
      className="card"
      style={{ padding: "1.5rem", borderLeft: `4px solid ${color}` }}
    >
      <p className="text-muted text-sm">{label}</p>
      <p style={{ fontSize: "2rem", fontWeight: 700, color: color }}>{value}</p>
    </div>
  );
}

function ActionCard({ to, icon, label, desc, color }) {
  return (
    <Link to={to}>
      <Motion.div
        className="card"
        whileHover={{ y: -5 }}
        style={{ height: "100%", cursor: "pointer", textAlign: "center" }}
      >
        <div
          style={{
            color: color || "var(--primary)",
            background: color ? `${color}20` : "#EFF6FF",
            width: "3rem",
            height: "3rem",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 1rem",
          }}
        >
          {icon}
        </div>
        <h3 style={{ fontWeight: 600, marginBottom: "0.25rem" }}>{label}</h3>
        <p className="text-sm text-muted">{desc}</p>
      </Motion.div>
    </Link>
  );
}
