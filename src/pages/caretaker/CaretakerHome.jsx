import { useState, useEffect } from "react";
import { Plus, User, Activity, AlertTriangle, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { db } from "../../firebase";
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
  onSnapshot,
} from "firebase/firestore";
import { motion as Motion } from "framer-motion";
import { calculateRiskScore } from "../../services/mlService";

export default function CaretakerHome() {
  const { currentUser } = useAuth();
  const [patients, setPatients] = useState([]);
  const [linkId, setLinkId] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;

    // Query patients where caretakerUid == currentUser.uid
    const q = query(
      collection(db, "users"),
      where("caretakerUid", "==", currentUser.uid),
    );

    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        setPatients(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching caretaker patients:", error);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [currentUser]);

  const handleLinkPatient = async (e) => {
    e.preventDefault();
    try {
      // 1. Check if patient exists
      // We are searching by patientId (custom ID) not doc ID for UX,
      // but strictly we should query. Let's assume input implies Patient Custom ID key.
      const q = query(
        collection(db, "users"),
        where("patientId", "==", linkId),
      );
      const snap = await getDocs(q);

      if (snap.empty) {
        alert("Patient ID not found.");
        return;
      }

      const patientDoc = snap.docs[0];

      // 2. Update patient doc with caretakerUid and caretakerName
      await updateDoc(doc(db, "users", patientDoc.id), {
        caretakerUid: currentUser.uid,
        caretakerName: currentUser.displayName || "Guardian",
      });

      setPatients([...patients, { id: patientDoc.id, ...patientDoc.data() }]);
      setLinkId("");
      alert("Patient Linked Successfully!");
    } catch (e) {
      console.error(e);
      alert("Error linking patient.");
    }
  };

  return (
    <div className="fade-in">
      <h1 className="text-2xl font-semibold mb-6">Start Monitoring</h1>

      <div className="card mb-8 bg-blue-50 border-blue-200">
        <h3 className="font-semibold mb-2 flex items-center gap-2 text-blue-800">
          <Plus size={20} /> Link New Patient
        </h3>
        <form onSubmit={handleLinkPatient} className="flex gap-4 items-center">
          <input
            className="input max-w-sm bg-white"
            placeholder="Enter Patient ID (e.g. PAT-123)"
            value={linkId}
            onChange={(e) => setLinkId(e.target.value)}
            required
          />
          <button type="submit" className="btn btn-primary">
            Link & Monitor
          </button>
        </form>
      </div>

      <h2 className="text-xl font-semibold mb-4">Your Patients</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {patients.map((patient) => (
          <PatientStatusCard key={patient.id} patient={patient} />
        ))}
        {!loading && patients.length === 0 && (
          <p className="text-muted italic col-span-full">
            No patients linked yet.
          </p>
        )}
      </div>
    </div>
  );
}

function PatientStatusCard({ patient }) {
  // ML-Based Risk Logic
  const riskAnalysis = calculateRiskScore(patient.adherenceScore || 100, 0);
  const isRisk = riskAnalysis.level === "Critical";
  const isAttention = riskAnalysis.level === "Attention";

  // Style logic
  const statusColor = isRisk
    ? "text-red-600"
    : isAttention
      ? "text-yellow-600"
      : "text-green-600";
  const statusBg = isRisk
    ? "bg-red-50"
    : isAttention
      ? "bg-yellow-50"
      : "bg-green-50";

  return (
    <Motion.div
      whileHover={{ y: -5 }}
      className={`card border-l-4 ${isRisk ? "border-l-red-500" : "border-l-green-500"}`}
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center ${statusBg} ${statusColor}`}
          >
            <User size={24} />
          </div>
          <div>
            <h3 className="font-bold text-lg">{patient.fullName}</h3>
            <p className="text-xs text-muted">ID: {patient.patientId}</p>
          </div>
        </div>
        {isRisk && <AlertTriangle className="text-red-500 animate-pulse" />}
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="text-center p-2 bg-gray-50 rounded">
          <p className="text-xs text-muted">Adherence</p>
          <p className={`font-bold ${statusColor} text-lg`}>
            {patient.adherenceScore || 100}%
          </p>
        </div>
        <div className="text-center p-2 bg-gray-50 rounded">
          <p className="text-xs text-muted">Streak</p>
          <p className="font-bold text-gray-800 text-lg">
            {patient.streak || 0}
          </p>
        </div>
      </div>

      {/* <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                    <span className="text-muted">Last Dose:</span>
                    <span className="font-medium">--</span>
                </div>
            </div> */}

      <Link
        to={`/dashboard/caretaker/monitor/${patient.id}`}
        className="btn btn-outline w-full flex justify-center items-center gap-2"
      >
        View Details <ArrowRight size={16} />
      </Link>
    </Motion.div>
  );
}
