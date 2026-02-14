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
      {/* Row 1: Patient Name & ID */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="input-group">
          <label className="label">Patient Name*</label>
          <input
            name="fullName"
            value={data.fullName}
            onChange={handleChange}
            className="input"
            placeholder="Full Name"
          />
        </div>
        <div className="input-group">
          <label className="label">Patient ID (Auto-Generated)</label>
          <input
            name="patientId"
            value={data.patientId}
            disabled
            className="input bg-gray-50 text-gray-500"
          />
        </div>
      </div>

      {/* Row 2: Age, Gender, Diagnosis */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="input-group">
          <label className="label">Age*</label>
          <input
            name="age"
            type="number"
            value={data.age}
            onChange={handleChange}
            className="input"
            placeholder="Age"
          />
        </div>
        <div className="input-group">
          <label className="label">Gender*</label>
          <select
            name="gender"
            value={data.gender}
            onChange={handleChange}
            className="input"
          >
            <option value="select">Select Gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div className="input-group">
          <label className="label">Disease / Diagnosis*</label>
          <input
            name="diagnosis"
            value={data.diagnosis}
            onChange={handleChange}
            className="input"
            placeholder="Primary Diagnosis"
          />
        </div>
      </div>

      {/* Row 3: Contact & Caretaker */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="input-group">
          <label className="label">Contact Number*</label>
          <input
            name="phone"
            value={data.phone}
            onChange={handleChange}
            className="input"
            placeholder="(+xx) xxxxxxxxxx"
          />
        </div>
        <div className="input-group">
          <label className="label">Caretaker Name</label>
          <input
            name="caretakerName"
            value={data.caretakerName}
            onChange={handleChange}
            className="input"
            placeholder="Guardian / Caretaker Name"
          />
        </div>
      </div>

      {/* Row 4: Caretaker Phone */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="input-group">
          <label className="label">Caretaker Mobile Number</label>
          <input
            name="caretakerPhone"
            value={data.caretakerPhone}
            onChange={handleChange}
            className="input"
            placeholder="Caretaker Contact"
          />
        </div>
      </div>
    </form>
  );
}
