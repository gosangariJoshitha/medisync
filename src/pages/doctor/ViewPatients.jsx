import { useEffect, useState } from "react";
import { Search, User, Filter } from "lucide-react";
import { Link } from "react-router-dom";
import { db } from "../../firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { motion as Motion } from "framer-motion";
import { useAuth } from "../../contexts/AuthContext";

export default function ViewPatients() {
  const { currentUser } = useAuth();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (!currentUser) return;

    const q = query(
      collection(db, "users"),
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

  const filteredPatients = patients.filter(
    (p) =>
      p.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.patientId?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="fade-in">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">All Patients</h1>

        <div className="flex gap-4">
          <div className="relative">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
            />
            <input
              className="input pl-10"
              placeholder="Search Name or ID"
              style={{ paddingLeft: "2.5rem" }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="btn btn-outline">
            <Filter size={18} /> Filter
          </button>
        </div>
      </div>

      {loading ? (
        <p>Loading patients...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPatients.map((patient) => (
            <PatientCard key={patient.id} patient={patient} />
          ))}
          {filteredPatients.length === 0 && (
            <p className="text-muted col-span-full text-center py-10">
              No patients found.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function PatientCard({ patient }) {
  return (
    <Motion.div className="card" whileHover={{ y: -5 }}>
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
            <User size={20} />
          </div>
          <div>
            <h3 className="font-semibold">{patient.fullName}</h3>
            <p className="text-sm text-muted">ID: {patient.patientId}</p>
          </div>
        </div>
        <span
          className={`text-xs px-2 py-1 rounded-full ${
            patient.riskStatus === "critical"
              ? "bg-red-100 text-red-700"
              : patient.riskStatus === "attention"
                ? "bg-yellow-100 text-yellow-700"
                : "bg-green-100 text-green-700"
          }`}
        >
          {patient.riskStatus?.toUpperCase() || "STABLE"}
        </span>
      </div>

      <div className="space-y-2 text-sm text-muted mb-4">
        <div className="flex justify-between">
          <span>Age/Gender:</span>
          <span className="text-main">
            {patient.age} / {patient.gender}
          </span>
        </div>
        <div className="flex justify-between">
          <span>Adherence:</span>
          <span
            className={
              patient.adherenceScore < 50
                ? "text-red-600 font-bold"
                : "text-green-600 font-bold"
            }
          >
            {patient.adherenceScore || 100}%
          </span>
        </div>
        <div className="flex justify-between">
          <span>Caretaker:</span>
          <span className="text-main">{patient.caretakerName || "N/A"}</span>
        </div>
      </div>

      <Link
        to={`/dashboard/doctor/patient/${patient.id}`}
        className="btn btn-outline w-full text-sm block text-center"
      >
        View Details
      </Link>
    </Motion.div>
  );
}
