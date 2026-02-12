import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { ArrowLeft } from "lucide-react";

export default function RegisterPatient() {
    const [formData, setFormData] = useState({
        fullName: "",
        email: "",
        phone: "",
        password: "",
        age: "",
        gender: "select"
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

        if (formData.gender === "select") {
            return setError("Please select a gender");
        }

        try {
            setError("");
            setLoading(true);
            await register(formData.email, formData.password, "patient", {
                fullName: formData.fullName,
                phone: formData.phone,
                age: formData.age,
                gender: formData.gender
            });
            navigate("/dashboard/patient");
        } catch (err) {
            setError("Failed to create an account: " + err.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="container fade-in" style={{ padding: '2rem 1.5rem', maxWidth: '500px' }}>
            <Link to="/register/role-selection" className="btn btn-outline" style={{ marginBottom: '2rem' }}>
                <ArrowLeft size={18} /> Back
            </Link>

            <div className="card">
                <h2 className="text-2xl text-center mb-6">Patient Registration</h2>

                {error && <div style={{ color: 'var(--danger)', marginBottom: '1rem', textAlign: 'center' }}>{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="input-group">
                        <label className="label">Full Name</label>
                        <input type="text" name="fullName" className="input" required value={formData.fullName} onChange={handleChange} />
                    </div>

                    <div className="input-group">
                        <label className="label">Email ID</label>
                        <input type="email" name="email" className="input" required value={formData.email} onChange={handleChange} />
                    </div>

                    <div className="input-group">
                        <label className="label">Phone Number</label>
                        <input type="tel" name="phone" className="input" required value={formData.phone} onChange={handleChange} />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="input-group">
                            <label className="label">Age</label>
                            <input type="number" name="age" className="input" required value={formData.age} onChange={handleChange} />
                        </div>
                        <div className="input-group">
                            <label className="label">Gender</label>
                            <select name="gender" className="input" value={formData.gender} onChange={handleChange}>
                                <option value="select">Select</option>
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                    </div>

                    <div className="input-group">
                        <label className="label">Password</label>
                        <input type="password" name="password" className="input" required value={formData.password} onChange={handleChange} />
                    </div>

                    <button disabled={loading} className="btn btn-primary w-full" type="submit">
                        {loading ? "Creating Account..." : "Register"}
                    </button>
                </form>

                <p className="text-center mt-4 text-sm">
                    Already have an account? <Link to="/login" style={{ color: 'var(--primary)' }}>Log In</Link>
                </p>
            </div>
        </div>
    );
}
