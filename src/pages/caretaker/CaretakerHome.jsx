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
import {
  predictAdherenceRisk,
  predictEmergencyRisk,
} from "../../services/mlService";

export default function CaretakerHome() {
  const { currentUser } = useAuth();
  const [patients, setPatients] = useState([]);
  const [legacyPatients, setLegacyPatients] = useState([]);
  const [linkId, setLinkId] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;

    // Query patients where caretakerUid == currentUser.uid
    const qPatients = query(
      collection(db, "patients"),
      where("caretakerUid", "==", currentUser.uid),
    );

    const qUsers = query(
      collection(db, "users"),
      where("caretakerUid", "==", currentUser.uid),
    );

    const unsubscribePatients = onSnapshot(qPatients, (snap) => {
      const patientsList = snap.docs.map((d) => ({ ...d.data(), id: d.id }));
      setPatients((prev) => {
        // We can't easily merge with legacy here without access to legacy state in closure if we use simple set.
        // But we can use a functional update or just simple set since we will combine in render.
        return patientsList;
      });
    });

    const unsubscribeUsers = onSnapshot(qUsers, (snap) => {
      const usersList = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
        isLegacy: true,
      }));
      setLegacyPatients(usersList);
    });

    return () => {
      unsubscribePatients();
      unsubscribeUsers();
    };
  }, [currentUser]);

  // Combine lists for display, filtering duplicates if any (though unlikely given different collections)
  const allPatients = [...patients, ...legacyPatients].filter(
    (v, i, a) => a.findIndex((t) => t.patientId === v.patientId) === i,
  );

  // Loading state handling could be improved but let's assume if we have data or not.
  // We can set loading false after first snap?
  // For now, let's just rely on the list being empty or not.
  // Actually, let's set loading false when we get data.
  useEffect(() => {
    if (patients.length > 0 || legacyPatients.length > 0) setLoading(false);
    const timer = setTimeout(() => setLoading(false), 2000);
    return () => clearTimeout(timer);
  }, [patients, legacyPatients]);

  const criticalCount = allPatients.filter((p) => {
    // Treat misses as abstract metric for this view
    const missed = p.dailyProgress
      ? p.dailyProgress.total - p.dailyProgress.taken
      : 0;
    const emergencyRisk = predictEmergencyRisk(missed, p.vitals);
    return emergencyRisk.escalationLevel >= 4;
  }).length;

  return (
    <div className="fade-in">
      <h1 className="text-2xl font-semibold mb-6">Start Monitoring</h1>

      {criticalCount > 0 && (
        <div className="mb-8 p-4 bg-red-50 border border-red-200 shadow-sm rounded-xl flex items-center gap-4 animate-pulse">
          <div className="p-2 bg-red-100 text-red-600 rounded-full">
            <AlertTriangle size={24} />
          </div>
          <div>
            <h3 className="font-bold text-red-800">
              Critical Attention Required
            </h3>
            <p className="text-red-700 font-medium">
              {criticalCount} patient{criticalCount > 1 ? "s" : ""} reported
              critical status. Please check their profiles immediately.
            </p>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-800">Your Patients</h2>
        <span className="text-sm text-gray-500 font-medium">
          {allPatients.length} Active
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {allPatients.map((patient) => (
          <PatientStatusCard key={patient.id} patient={patient} />
        ))}
        {!loading && allPatients.length === 0 && (
          <p className="text-muted italic col-span-full">
            No patients linked yet.
          </p>
        )}
      </div>
    </div>
  );
}

function PatientStatusCard({ patient }) {
  // ML Integrations
  const missedDoses = patient.dailyProgress
    ? patient.dailyProgress.total - patient.dailyProgress.taken
    : 0;
  const adherenceRisk = predictAdherenceRisk(25, missedDoses, 0); // Model 1
  const emergencyRisk = predictEmergencyRisk(missedDoses, patient.vitals); // Model 5

  const isCritical =
    emergencyRisk.escalationLevel >= 4 || adherenceRisk.riskLabel === "High";
  const isAttention = adherenceRisk.riskLabel === "Medium" && !isCritical;

  // Style logic
  const statusColor = isCritical
    ? "text-red-600"
    : isAttention
      ? "text-yellow-600"
      : "text-green-600";
  const statusBg = isCritical
    ? "bg-red-50"
    : isAttention
      ? "bg-yellow-50"
      : "bg-green-50";

  return (
    <Motion.div
      whileHover={{ y: -5 }}
      className={`card border-l-4 ${isCritical ? "border-l-red-500" : isAttention ? "border-l-yellow-500" : "border-l-green-500"}`}
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
            <p className="text-xs text-muted font-medium mb-1">
              ID: {patient.patientId}
            </p>
            {patient.doctorUid && (
              <p className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded inline-block border border-blue-100">
                Doctor: DOC-{patient.doctorUid.substring(0, 4).toUpperCase()}
              </p>
            )}
          </div>
        </div>
        {isCritical && <AlertTriangle className="text-red-500 animate-pulse" />}
      </div>

      {isCritical && (
        <div className="mb-4 bg-red-100 text-red-700 text-xs font-bold px-3 py-1.5 rounded-lg">
          Severity: {emergencyRisk.text} (Level {emergencyRisk.escalationLevel})
        </div>
      )}

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
