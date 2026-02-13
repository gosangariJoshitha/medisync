import { Link } from "react-router-dom";
import { User, Stethoscope, ArrowLeft } from "lucide-react";
import { motion as Motion } from "framer-motion";

export default function RegisterSelection() {
  return (
    <div
      className="container fade-in"
      style={{ padding: "4rem 1.5rem", maxWidth: "800px" }}
    >
      <Link to="/" className="btn btn-outline" style={{ marginBottom: "2rem" }}>
        <ArrowLeft size={18} /> Back
      </Link>

      <h1 className="text-center text-2xl" style={{ marginBottom: "3rem" }}>
        Choose your Role
      </h1>

      <div className="grid grid-cols-2 gap-4">
        <RoleCard
          to="/register/patient"
          icon={<User size={48} />}
          title="Patient"
          desc="Track your doses and stay connected with your doctor."
        />
        <RoleCard
          to="/register/doctor"
          icon={<Stethoscope size={48} />}
          title="Doctor"
          desc="Monitor your patients and manage prescriptions."
        />
      </div>
    </div>
  );
}

function RoleCard({ to, icon, title, desc }) {
  return (
    <Link to={to} className="w-full">
      <Motion.div
        className="card"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        style={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          cursor: "pointer",
          border: "2px solid transparent",
        }}
        onMouseEnter={(e) =>
          (e.currentTarget.style.borderColor = "var(--primary)")
        }
        onMouseLeave={(e) =>
          (e.currentTarget.style.borderColor = "transparent")
        }
      >
        <div
          style={{
            color: "var(--primary)",
            marginBottom: "1.5rem",
          }}
        >
          {icon}
        </div>
        <h2
          style={{
            fontSize: "1.5rem",
            fontWeight: 600,
            marginBottom: "0.5rem",
          }}
        >
          {title}
        </h2>
        <p className="text-muted">{desc}</p>
      </Motion.div>
    </Link>
  );
}
