import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { ArrowLeft } from "lucide-react";

export default function RegisterDoctor() {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    hospitalName: "",
    specialization: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  function handleChange(e) {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      setError("");
      setLoading(true);
      await register(formData.email, formData.password, "doctor", {
        fullName: formData.fullName,
        phone: formData.phone,
        hospitalName: formData.hospitalName,
        specialization: formData.specialization,
        doctorId: "DOC-" + Math.floor(1000 + Math.random() * 9000).toString(),
      });
      navigate("/dashboard/doctor");
    } catch (err) {
      setError("Failed to create an account: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="container fade-in"
      style={{ padding: "2rem 1.5rem", maxWidth: "500px" }}
    >
      <Link
        to="/register/role-selection"
        className="btn btn-outline"
        style={{ marginBottom: "2rem" }}
      >
        <ArrowLeft size={18} /> Back
      </Link>

      <div className="card">
        <h2 className="text-2xl text-center mb-6">Doctor Registration</h2>

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
            <label className="label">Full Name</label>
            <input
              type="text"
              name="fullName"
              className="input"
              required
              value={formData.fullName}
              onChange={handleChange}
            />
          </div>

          <div className="input-group">
            <label className="label">Email ID</label>
            <input
              type="email"
              name="email"
              className="input"
              required
              value={formData.email}
              onChange={handleChange}
            />
          </div>

          <div className="input-group">
            <label className="label">Phone Number</label>
            <input
              type="tel"
              name="phone"
              className="input"
              required
              value={formData.phone}
              onChange={handleChange}
            />
          </div>

          <div className="input-group">
            <label className="label">Hospital Name</label>
            <input
              type="text"
              name="hospitalName"
              className="input"
              required
              value={formData.hospitalName}
              onChange={handleChange}
            />
          </div>

          <div className="input-group">
            <label className="label">Specialization</label>
            <input
              type="text"
              name="specialization"
              className="input"
              required
              value={formData.specialization}
              onChange={handleChange}
            />
          </div>

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

          <button
            disabled={loading}
            className="btn btn-primary w-full"
            type="submit"
          >
            {loading ? "Creating Account..." : "Register"}
          </button>
        </form>

        <p className="text-center mt-4 text-sm">
          Already have an account?{" "}
          <Link to="/login" style={{ color: "var(--primary)" }}>
            Log In
          </Link>
        </p>
      </div>
    </div>
  );
}
