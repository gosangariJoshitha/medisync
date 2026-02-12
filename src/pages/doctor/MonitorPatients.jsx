import { useEffect, useState } from "react";
import { db } from "../../firebase";
import {
  collection,
  query,
  where,
  getDocs,
  onSnapshot,
} from "firebase/firestore";
import { CheckCircle, XCircle, Clock } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";

export default function MonitorPatients() {
  const { currentUser } = useAuth();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;
    setLoading(true);

    const q = query(
      collection(db, "users"),
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
      <h1 className="text-2xl font-semibold mb-6">Monitor Adherence</h1>

      <div className="card overflow-hidden p-0">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b">
              <th className="p-4 font-semibold text-sm text-muted">Patient</th>
              <th className="p-4 font-semibold text-sm text-muted">Status</th>
              <th className="p-4 font-semibold text-sm text-muted">
                Today's Doses
              </th>
              <th className="p-4 font-semibold text-sm text-muted">
                Adherence Rate
              </th>
              <th className="p-4 font-semibold text-sm text-muted">
                Last Activity
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="5" className="p-4 text-center">
                  Loading data...
                </td>
              </tr>
            ) : (
              patients.map((patient, index) => (
                <tr
                  key={patient.id}
                  className="border-b last:border-0 hover:bg-gray-50 transition"
                >
                  <td className="p-4">
                    <p className="font-semibold">{patient.fullName}</p>
                    <p className="text-xs text-muted">{patient.patientId}</p>
                  </td>
                  <td className="p-4">
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
                  </td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      <div
                        className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center"
                        title="Taken"
                      >
                        <CheckCircle size={16} />
                      </div>
                      <div
                        className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center"
                        title="Missed"
                      >
                        <XCircle size={16} />
                      </div>
                      <div
                        className="w-8 h-8 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center"
                        title="Pending"
                      >
                        <Clock size={16} />
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${patient.adherenceScore < 50 ? "bg-red-500" : "bg-green-500"}`}
                          style={{ width: `${patient.adherenceScore || 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium">
                        {patient.adherenceScore || 100}%
                      </span>
                    </div>
                  </td>
                  <td className="p-4 text-sm text-muted">2 hours ago</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
