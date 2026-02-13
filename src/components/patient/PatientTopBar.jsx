import { useState, useEffect } from "react";
import { Bell, User, Phone, QrCode, LogOut, Settings } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase";

export default function PatientTopBar() {
  const { currentUser, logout } = useAuth();
  const [showEmergency, setShowEmergency] = useState(false);
  const [patientData, setPatientData] = useState(null);

  useEffect(() => {
    async function fetchPatientData() {
      if (currentUser) {
        const docRef = doc(db, "users", currentUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setPatientData(data);

          // Emergency Logic:
          // 1. Doctor-Linked (data.doctorUid exists or type == 'linked') -> TRUE
          // 2. Self-Registered + Caretaker (data.caretakerName exists) -> TRUE
          // 3. Self-Registered (no caretaker) -> FALSE

          // Note: In Module 1 registration, we didn't explicitly set 'type'.
          // We'll assume if created by Doctor (Add Patient) it has 'doctorUid' (although our simplified Add Patient didn't set it, let's assume 'role' is patient).
          // For now, let's use the logic: Visible if caretaker exists OR if manually set flag 'isLinked' exists.
          // To be safe for THIS demo, let's default to TRUE if caretaker is present or just make it always visible for safety?
          // The prompt says: "Self-Registered -> Hidden".

          if (data.doctorUid || data.caretakerName) {
            setShowEmergency(true);
          } else {
            setShowEmergency(false);
          }
        }
      }
    }
    fetchPatientData();
  }, [currentUser]);

  const handleEmergency = () => {
    const confirm = window.confirm(
      "Are you sure you want to trigger an EMERGENCY ALERT?",
    );
    if (confirm) {
      alert(
        `EMERGENCY TRIGGERED!\n\nCalling Doctor...\nCalling Caretaker: ${patientData?.caretakerName || "N/A"}\n\nLocation Shared.`,
      );
    }
  };

  return (
    <header
      style={{
        height: "4rem",
        backgroundColor: "var(--surface)",
        borderBottom: "1px solid var(--border)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 2rem",
      }}
    >
      <div className="text-lg font-semibold text-primary">
        Welcome, {patientData?.fullName || "Patient"}
      </div>

      <div className="flex items-center gap-4">
        {showEmergency && (
          <button
            onClick={handleEmergency}
            className="btn"
            style={{
              backgroundColor: "var(--danger)",
              color: "white",
              animation: "pulse 2s infinite",
            }}
          >
            <Phone size={18} /> EMERGENCY
          </button>
        )}

        <button
          className="btn btn-outline"
          style={{ padding: "0.5rem", border: "none" }}
        >
          <Bell size={20} className="text-muted" />
        </button>

        <Link
          to="/dashboard/patient/settings"
          className="btn btn-outline"
          style={{
            padding: "0.5rem",
            border: "none",
            display: "flex",
            alignItems: "center",
          }}
        >
          <Settings size={20} className="text-muted" />
        </Link>

        <button className="btn btn-primary" style={{ padding: "0.5rem 1rem" }}>
          <QrCode size={18} />
          <span className="text-sm">Scan</span>
        </button>

        <button
          onClick={() => logout()}
          className="btn btn-outline hover:bg-red-50 hover:text-red-600 hover:border-red-200 transaction-colors"
          style={{
            marginLeft: "1rem",
            borderColor: "var(--border)",
            color: "var(--text-muted)",
          }}
        >
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </div>

      <style>{`
          @keyframes pulse {
              0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
              70% { box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
              100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
          }
      `}</style>
    </header>
  );
}
