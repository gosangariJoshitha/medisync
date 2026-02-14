import { useEffect, useState } from "react";
import { db } from "../../firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import {
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Calendar,
  ChevronRight,
  MoreVertical,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { motion as Motion } from "framer-motion";
import { Link } from "react-router-dom";

export default function MonitorPatients() {
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
        const list = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setPatients(list);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching patients:", error);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [currentUser]);

  return (
    <div className="fade-in">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Monitor Patients</h1>
        <div className="flex gap-2">
          <span className="text-sm text-muted flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-500"></span> Stable
          </span>
          <span className="text-sm text-muted flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-yellow-500"></span>{" "}
            Attention
          </span>
          <span className="text-sm text-muted flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-red-500"></span> Critical
          </span>
        </div>
      </div>

      {loading ? (
        <div className="p-10 text-center">Loading patient data...</div>
      ) : patients.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 rounded-xl border-dashed border-2">
          <p className="text-gray-500">No patients linked yet.</p>
          <Link
            to="/dashboard/doctor/add-patient"
            className="btn btn-primary mt-4 inline-flex items-center gap-2"
          >
            Add Your First Patient
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {patients.map((patient) => (
            <PatientStatusCard key={patient.id} patient={patient} />
          ))}
        </div>
      )}
    </div>
  );
}

function PatientStatusCard({ patient }) {
  const adherence = patient.adherenceScore || 100;
  const isCritical = patient.riskStatus === "critical" || adherence < 50;
  const isAttention =
    patient.riskStatus === "attention" || (adherence >= 50 && adherence < 80);

  // Derived Status
  const statusColor = isCritical ? "red" : isAttention ? "yellow" : "green";
  const statusBg = isCritical
    ? "bg-red-50"
    : isAttention
      ? "bg-yellow-50"
      : "bg-green-50";
  const borderColor = isCritical
    ? "border-red-200"
    : isAttention
      ? "border-yellow-200"
      : "border-green-200";

  // Progress
  const taken = patient.dailyProgress?.taken || 0;
  const total = patient.dailyProgress?.total || 0;
  const percentage = total > 0 ? (taken / total) * 100 : 0;

  return (
    <Motion.div
      whileHover={{ y: -5 }}
      className={`bg-white rounded-xl shadow-sm border ${borderColor} p-5 flex flex-col gap-4 relative overflow-hidden`}
    >
      {/* AI Flag Banner */}
      {isCritical && (
        <div className="absolute top-0 left-0 w-full bg-red-100 text-red-700 text-xs font-bold px-4 py-1 flex items-center gap-1">
          <AlertTriangle size={12} /> CRITICAL ATTENTION NEEDED
        </div>
      )}

      <div
        className={`flex justify-between items-start ${isCritical ? "mt-4" : ""}`}
      >
        <div className="flex gap-3">
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold ${statusBg} text-${statusColor}-600`}
          >
            {patient.fullName.charAt(0)}
          </div>
          <div>
            <h3 className="font-bold text-gray-900">{patient.fullName}</h3>
            <p className="text-xs text-muted">ID: {patient.patientId}</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold">{adherence}%</div>
          <div className="text-xs text-muted">Adherence</div>
        </div>
      </div>

      {/* Daily Progress Bar */}
      <div>
        <div className="flex justify-between text-sm mb-1">
          <span className="text-gray-600 font-medium">Today's Schedule</span>
          <span className="text-gray-900 font-bold">
            {taken}/{total} Meds
          </span>
        </div>
        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${isCritical ? "bg-red-500" : "bg-green-500"}`}
            style={{ width: `${percentage}%` }}
          ></div>
        </div>
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="bg-gray-50 p-2 rounded flex items-center gap-2 text-gray-600">
          <Clock size={14} className="text-blue-500" />
          <span>Last: 2h ago</span> {/* Placeholder for now */}
        </div>
        <div className="bg-gray-50 p-2 rounded flex items-center gap-2 text-gray-600">
          <Calendar size={14} className="text-purple-500" />
          <span>Next: 09:00 PM</span> {/* Placeholder */}
        </div>
      </div>

      {/* Actions */}
      <div className="pt-2 flex gap-2 border-t mt-auto">
        <Link
          to={`/dashboard/doctor/patient/${patient.id}`}
          className="btn btn-outline flex-1 text-xs"
        >
          View Details
        </Link>
        <button className="btn btn-primary flex-1 text-xs">Remind</button>
      </div>
    </Motion.div>
  );
}
