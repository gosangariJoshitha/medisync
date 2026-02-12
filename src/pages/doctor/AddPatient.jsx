import { useState } from "react";
import { User, Pill, CheckCircle, ArrowRight, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import PatientInfoForm from "../../components/doctor/PatientInfoForm";
import MedicineForm from "../../components/doctor/MedicineForm";
import ReviewPatient from "../../components/doctor/ReviewPatient";
import { db } from "../../firebase";
import { doc, setDoc, collection, addDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

export default function AddPatient() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [patientData, setPatientData] = useState({
    fullName: "",
    age: "",
    gender: "select",
    phone: "",
    email: "", // optional/auto-generated
    patientId: "PAT-" + Math.floor(1000 + Math.random() * 9000),
    caretakerName: "",
    caretakerPhone: "",
  });

  const [medicines, setMedicines] = useState([]);

  function nextStep() {
    setStep((prev) => prev + 1);
  }

  function prevStep() {
    setStep((prev) => prev - 1);
  }

  async function handleFinish() {
    setLoading(true);
    try {
      // 1. Create User Document (Simulated auth for now, in real app would use Cloud Functions or secondary auth)
      // Here we just store the patient profile in 'users' collection with role 'patient'
      const userRef = doc(db, "users", patientData.patientId); // Using PatientID as doc ID for easy lookup
      await setDoc(userRef, {
        ...patientData,
        role: "patient",
        doctorUid: currentUser.uid, // Link to the creating doctor
        createdAt: new Date().toISOString(),
        riskStatus: "stable",
        adherenceScore: 100,
      });

      // 2. Add Medicines
      const medsRef = collection(
        db,
        "users",
        patientData.patientId,
        "medicines",
      );
      for (const med of medicines) {
        await addDoc(medsRef, med);
      }

      alert("Patient Added Successfully!");
      navigate("/dashboard/doctor");
    } catch (error) {
      console.error("Error adding patient: ", error);
      alert("Failed to add patient. Check console.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fade-in max-w-4xl mx-auto">
      <h1 className="text-2xl mb-6">Add New Patient</h1>

      {/* Stepper */}
      <div className="flex items-center justify-between mb-8 relative">
        <div className="absolute left-0 top-1/2 w-full h-1 bg-gray-200 -z-10" />
        <StepIndicator
          num={1}
          label="Patient Info"
          icon={<User size={20} />}
          active={step >= 1}
          current={step === 1}
        />
        <StepIndicator
          num={2}
          label="Medicines"
          icon={<Pill size={20} />}
          active={step >= 2}
          current={step === 2}
        />
        <StepIndicator
          num={3}
          label="Review & Save"
          icon={<CheckCircle size={20} />}
          active={step >= 3}
          current={step === 3}
        />
      </div>

      <div className="card">
        {step === 1 && (
          <PatientInfoForm
            data={patientData}
            update={setPatientData}
            onNext={nextStep}
          />
        )}
        {step === 2 && (
          <MedicineForm
            medicines={medicines}
            setMedicines={setMedicines}
            onBack={prevStep}
            onNext={nextStep}
          />
        )}
        {step === 3 && (
          <ReviewPatient
            patientData={patientData}
            medicines={medicines}
            onBack={prevStep}
            onFinish={handleFinish}
            loading={loading}
          />
        )}
      </div>
    </div>
  );
}

function StepIndicator({ num, label, icon, active, current }) {
  return (
    <div className="flex flex-col items-center bg-white px-2">
      <div
        style={{
          width: "3rem",
          height: "3rem",
          borderRadius: "50%",
          backgroundColor: active ? "var(--primary)" : "var(--background)",
          color: active ? "white" : "var(--text-muted)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: active ? "none" : "2px solid var(--border)",
          marginBottom: "0.5rem",
          transition: "all 0.3s",
        }}
      >
        {icon}
      </div>
      <span
        style={{
          fontWeight: current ? 600 : 400,
          color: current ? "var(--primary)" : "var(--text-muted)",
        }}
      >
        {label}
      </span>
    </div>
  );
}
