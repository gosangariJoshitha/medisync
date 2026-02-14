import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { ArrowLeft, ChevronRight, Check } from "lucide-react";

export default function RegisterPatient() {
    const [step, setStep] = useState(1); // Step 1: Basic Info, Step 2: Caretaker Option
    const [formData, setFormData] = useState({
        fullName: "",
        email: "",
        phone: "",
        password: "",
        age: "",
        gender: "select",
        wantCaretaker: null,
    });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const { register } = useAuth();
    const navigate = useNavigate();

    function handleChange(e) {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    }

    function handleCaretakerChoice(choice) {
        setFormData({ ...formData, wantCaretaker: choice });
    }

    async function handleSubmit(e) {
        e.preventDefault();

        if (step === 1) {
            // Validate step 1
            if (formData.gender === "select") {
                return setError("Please select a gender");
            }
            if (!formData.fullName || !formData.email || !formData.phone || !formData.age || !formData.password) {
                return setError("Please fill all fields");
            }
            // Move to step 2
            setError("");
            setStep(2);
            return;
        }

        if (step === 2) {
            // Caretaker choice is optional
            if (formData.wantCaretaker === null) {
                return setError("Please select an option above");
            }
            // Move to step 3 (summary) or complete
            // For now, let's complete registration
            try {
                setError("");
                setLoading(true);
                await register(formData.email, formData.password, "patient", {
                    fullName: formData.fullName,
                    phone: formData.phone,
                    age: formData.age,
                    gender: formData.gender,
                    wantCaretaker: formData.wantCaretaker,
                });
                navigate("/dashboard/patient");
            } catch (err) {
                setError("Failed to create an account: " + err.message);
            } finally {
                setLoading(false);
            }
        }
    }

    if (step === 1) {
        return (
            <div className="container fade-in" style={{ padding: '2rem 1.5rem', maxWidth: '500px' }}>
                <Link to="/register/role-selection" className="btn btn-outline" style={{ marginBottom: '2rem' }}>
                    <ArrowLeft size={18} /> Back
                </Link>

                <div className="card">
                    <h2 className="text-2xl text-center mb-2">Patient Registration</h2>
                    <p className="text-center text-sm text-muted mb-6">Step 1 of 2 - Basic Information</p>

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
                            {loading ? "Proceeding..." : "Next"} <ChevronRight size={18} />
                        </button>
                    </form>

                    <p className="text-center mt-4 text-sm">
                        Already have an account? <Link to="/login" style={{ color: 'var(--primary)' }}>Log In</Link>
                    </p>
                </div>
            </div>
        );
    }

    if (step === 2) {
        return (
            <div className="container fade-in" style={{ padding: '2rem 1.5rem', maxWidth: '500px' }}>
                <button 
                    onClick={() => setStep(1)}
                    className="btn btn-outline" 
                    style={{ marginBottom: '2rem' }}
                >
                    <ArrowLeft size={18} /> Back
                </button>

                <div className="card">
                    <h2 className="text-2xl text-center mb-2">Caretaker Setup</h2>
                    <p className="text-center text-sm text-muted mb-6">Step 2 of 2 - Optional Caretaker Connection</p>

                    {error && <div style={{ color: 'var(--danger)', marginBottom: '1rem', textAlign: 'center' }}>{error}</div>}

                    <div className="mb-6">
                        <p className="text-center mb-6 font-medium text-gray-700">
                            Do you want to link a caretaker to monitor your health?
                        </p>

                        <div className="space-y-3">
                            <button
                                type="button"
                                onClick={() => handleCaretakerChoice(true)}
                                className={`w-full p-4 rounded-lg border-2 transition-all flex items-center justify-between ${
                                    formData.wantCaretaker === true
                                        ? 'border-primary bg-blue-50 text-primary'
                                        : 'border-gray-200 bg-white text-gray-800 hover:border-primary hover:bg-blue-50'
                                }`}
                            >
                                <div className="text-left">
                                    <p className="font-semibold">Yes, Link a Caretaker</p>
                                    <p className="text-sm opacity-75">A family member or nurse can monitor your medications and health.</p>
                                </div>
                                {formData.wantCaretaker === true && <Check size={24} className="flex-shrink-0" />}
                            </button>

                            <button
                                type="button"
                                onClick={() => handleCaretakerChoice(false)}
                                className={`w-full p-4 rounded-lg border-2 transition-all flex items-center justify-between ${
                                    formData.wantCaretaker === false
                                        ? 'border-primary bg-blue-50 text-primary'
                                        : 'border-gray-200 bg-white text-gray-800 hover:border-primary hover:bg-blue-50'
                                }`}
                            >
                                <div className="text-left">
                                    <p className="font-semibold">No, I'll Manage Alone</p>
                                    <p className="text-sm opacity-75">You can link a caretaker anytime from your settings.</p>
                                </div>
                                {formData.wantCaretaker === false && <Check size={24} className="flex-shrink-0" />}
                            </button>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <button disabled={loading} className="btn btn-primary w-full" type="submit">
                            {loading ? "Creating Account..." : "Complete Registration"}
                        </button>
                    </form>

                    <p className="text-center mt-4 text-sm text-muted">
                        By registering, you agree to our Terms and Privacy Policy
                    </p>
                </div>
            </div>
        );
    }

}
