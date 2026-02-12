import { ArrowRight } from "lucide-react";

export default function PatientInfoForm({ data, update, onNext }) {

    const handleChange = (e) => {
        update({ ...data, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!data.fullName || !data.age || !data.phone) {
            alert("Please fill in required fields");
            return;
        }
        onNext();
    };

    return (
        <form onSubmit={handleSubmit} className="fade-in">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">Step 1: Patient Details</h2>
                <div style={{ background: '#EFF6FF', padding: '0.5rem 1rem', borderRadius: '0.5rem', color: 'var(--primary)' }}>
                    Patient ID: <strong>{data.patientId}</strong>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="input-group">
                    <label className="label">Full Name *</label>
                    <input name="fullName" value={data.fullName} onChange={handleChange} className="input" placeholder="e.g. John Doe" />
                </div>
                <div className="input-group">
                    <label className="label">Age *</label>
                    <input name="age" type="number" value={data.age} onChange={handleChange} className="input" placeholder="e.g. 45" />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="input-group">
                    <label className="label">Gender</label>
                    <select name="gender" value={data.gender} onChange={handleChange} className="input">
                        <option value="select">Select Gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                    </select>
                </div>
                <div className="input-group">
                    <label className="label">Phone Number *</label>
                    <input name="phone" value={data.phone} onChange={handleChange} className="input" placeholder="+91 9876543210" />
                </div>
            </div>

            <div className="input-group mb-6">
                <label className="label">Email ID (Optional)</label>
                <input name="email" type="email" value={data.email} onChange={handleChange} className="input" placeholder="john@example.com" />
            </div>

            <hr className="mb-6" style={{ borderColor: 'var(--border)' }} />

            <h3 className="text-lg font-semibold mb-4">Caretaker Details (Optional)</h3>
            <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="input-group">
                    <label className="label">Caretaker Name</label>
                    <input name="caretakerName" value={data.caretakerName} onChange={handleChange} className="input" />
                </div>
                <div className="input-group">
                    <label className="label">Caretaker Phone</label>
                    <input name="caretakerPhone" value={data.caretakerPhone} onChange={handleChange} className="input" />
                </div>
            </div>

            <div className="flex justify-end">
                <button type="submit" className="btn btn-primary">
                    Next Step <ArrowRight size={18} />
                </button>
            </div>
        </form>
    );
}
