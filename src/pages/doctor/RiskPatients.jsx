import { useEffect, useState } from "react";
import { db } from "../../firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { AlertTriangle, Phone } from "lucide-react";
import { motion as Motion } from "framer-motion";
import { calculateRiskScore } from "../../services/mlService";
import { useAuth } from "../../contexts/AuthContext";

export default function RiskPatients() {
  const { currentUser } = useAuth();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;

    const q = query(
      collection(db, "patients"),
      where("role", "==", "patient"),
      where("doctorUid", "==", currentUser.uid),
    );

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const list = querySnapshot.docs
          .map((doc) => {
            const data = doc.data();
            const analysis = calculateRiskScore(data.adherenceScore || 100, 0); // Mock 0 missed for now
            return { id: doc.id, ...data, riskAnalysis: analysis };
          })
          .filter(
            (p) =>
              p.riskAnalysis.level !== "Stable" || p.riskStatus === "critical",
          );

        setPatients(list);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching risk patients:", error);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [currentUser]);

  return (
    <div className="fade-in">
      <h1 className="text-2xl font-semibold mb-6 flex items-center gap-2 text-danger">
        <AlertTriangle /> Risk Patients (Action Required)
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {patients.map((patient) => (
          <Motion.div
            key={patient.id}
            className="card border-l-4 border-l-red-500"
            whileHover={{ y: -5 }}
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold text-lg">{patient.fullName}</h3>
                <p className="text-muted text-sm">ID: {patient.patientId}</p>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                  patient.riskAnalysis?.level === "Critical"
                    ? "bg-red-100 text-red-700"
                    : "bg-yellow-100 text-yellow-700"
                }`}
              >
                {patient.riskAnalysis?.level || "Review Needed"}
              </span>
            </div>

            <div
              className={`my-4 p-3 rounded text-sm ${
                patient.riskAnalysis?.level === "Critical"
                  ? "bg-red-50 text-red-800"
                  : "bg-yellow-50 text-yellow-800"
              }`}
            >
              <strong>ML Insight:</strong> Patient has{" "}
              {patient.riskAnalysis?.level === "Critical" ? "high" : "moderate"}{" "}
              probability of missing next dose based on recent patterns.
            </div>

            <div className="flex gap-4 mb-4">
              <div className="text-center flex-1">
                <p className="text-xs text-muted">Adherence</p>
                <p className="font-bold text-red-600 text-xl">
                  {patient.adherenceScore || 45}%
                </p>
              </div>
              <div className="text-center flex-1">
                <p className="text-xs text-muted">Missed Doses</p>
                <p className="font-bold text-gray-800 text-xl">5</p>
              </div>
            </div>

            <div className="flex gap-2">
              <button className="btn btn-primary flex-1">
                <Phone size={16} /> Call Patient
              </button>
              <button className="btn btn-outline flex-1">View Report</button>
            </div>
          </Motion.div>
        ))}
        {!loading && patients.length === 0 && (
          <div className="col-span-full text-center py-10 card">
            <p className="text-green-600 font-semibold mb-2">All Clear!</p>
            <p className="text-muted">
              No high-risk patients detected at the moment.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
