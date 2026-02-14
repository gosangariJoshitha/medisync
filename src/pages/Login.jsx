import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { doc, getDoc } from "firebase/firestore"; // Import doc, getDoc
import { db } from "../firebase"; // Import db
import { User, Stethoscope, HeartHandshake, ArrowLeft } from "lucide-react";
import { motion as Motion } from "framer-motion";

export default function Login() {
  const [role, setRole] = useState("doctor");
  const [formData, setFormData] = useState({
    identifier: "", // Email, Patient ID, Mobile
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, currentUser, userRole } = useAuth(); // Destructure currentUser and userRole
  const navigate = useNavigate();

  // Redirect when user is authenticated and role is loaded
  useEffect(() => {
    if (currentUser && userRole) {
      navigate(`/dashboard/${userRole}`);
    }
  }, [currentUser, userRole, navigate]);

  function handleChange(e) {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      setError("");
      setLoading(true);

      let loginIdentifier = formData.identifier.trim();
      let password = formData.password;

      // 1. Doctor-Linked Patient Login (PAT-...)
      if (loginIdentifier.startsWith("PAT-")) {
        // Construct email: PAT-1234@medisync.com
        loginIdentifier = `${loginIdentifier}@medisync.com`;

        // If password is empty (e.g. first login), default to identifier
        // But for security, we should assume the user entered the password.
        // If they didn't, we can try the default one?
        // Let's assume the user knows the password is their ID initially.
      }

      // 2. Caretaker Login (Mobile Number)
      if (role === "caretaker") {
        // Simple validation for mobile number
        if (!/^\d{10}$/.test(formData.identifier)) {
          throw new Error("Please enter a valid 10-digit mobile number.");
        }
        // Construct email: 9876543210@caretaker.medisync.com
        loginIdentifier = `${formData.identifier}@caretaker.medisync.com`;
        password = formData.identifier; // Password is mobile number by default
      }

      await login(loginIdentifier, password);
      // Navigation handled by useEffect
    } catch (err) {
      console.error(err);
      setError("Failed to log in: " + err.message);
      setLoading(false);
    }
  }

  const getLabel = () => {
    if (role === "doctor") return "Email ID";
    if (role === "patient") return "Patient ID or Email";
    if (role === "caretaker") return "Mobile Number";
  };

  return (
    <div
      className="container fade-in"
      style={{ padding: "2rem 1.5rem", maxWidth: "500px" }}
    >
      <Link to="/" className="btn btn-outline" style={{ marginBottom: "2rem" }}>
        <ArrowLeft size={18} /> Back
      </Link>

      <div className="card">
        <h2 className="text-2xl text-center mb-6">Welcome Back</h2>

        {/* Role Toggles */}
        <div
          className="flex justify-center gap-2 mb-6"
          style={{
            background: "#F1F5F9",
            padding: "0.5rem",
            borderRadius: "1rem",
          }}
        >
          <RoleToggle
            active={role === "doctor"}
            onClick={() => setRole("doctor")}
            icon={<Stethoscope size={18} />}
            label="Doctor"
          />
          <RoleToggle
            active={role === "patient"}
            onClick={() => setRole("patient")}
            icon={<User size={18} />}
            label="Patient"
          />
          <RoleToggle
            active={role === "caretaker"}
            onClick={() => setRole("caretaker")}
            icon={<HeartHandshake size={18} />}
            label="Caretaker"
          />
        </div>

        {error && (
          <div
            style={{
              color: "var(--danger)",
              marginBottom: "1rem",
              textAlign: "center",
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label className="label">{getLabel()}</label>
            <input
              type={role === "doctor" ? "email" : "text"}
              name="identifier"
              className="input"
              required
              value={formData.identifier}
              onChange={handleChange}
              placeholder={role === "caretaker" ? "Enter mobile number" : ""}
            />
          </div>

          {role !== "caretaker" && (
            <div className="input-group">
              <label className="label">Password</label>
              <input
                type="password"
                name="password"
                className="input"
                required
                value={formData.password}
                onChange={handleChange}
              />
            </div>
          )}

          <button
            disabled={loading}
            className="btn btn-primary w-full"
            type="submit"
          >
            {loading ? "Logging In..." : "Login"}
          </button>
        </form>

        <p className="text-center mt-4 text-sm">
          Don't have an account?{" "}
          <Link
            to="/register/role-selection"
            style={{ color: "var(--primary)" }}
          >
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}

function RoleToggle({ active, onClick, icon, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.5rem",
        padding: "0.5rem 1rem",
        borderRadius: "0.75rem",
        background: active ? "white" : "transparent",
        color: active ? "var(--primary)" : "var(--text-muted)",
        fontWeight: active ? 600 : 500,
        boxShadow: active ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
        flex: 1,
        justifyContent: "center",
      }}
    >
      {icon}
      <span className="text-sm">{label}</span>
      {active && (
        <Motion.div layoutId="active-pill" style={{ position: "absolute" }} />
      )}
    </button>
  );
}
