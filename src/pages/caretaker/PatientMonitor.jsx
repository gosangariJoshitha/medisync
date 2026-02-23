import { useEffect, useState } from "react";

import { useParams, Link, useNavigate } from "react-router-dom";
import { db } from "../../firebase";

import {
  doc,
  collection,
  addDoc,
  onSnapshot,
  getDoc,
  updateDoc,
  query,
  where,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";
import {
  ArrowLeft,
  User,
  Phone,
  AlertTriangle,
  Pill,
  Activity,
  Calendar,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";

export default function PatientMonitor() {
  const { id } = useParams();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [patient, setPatient] = useState(null);
  const [medicines, setMedicines] = useState([]);
  const [doctor, setDoctor] = useState(null);
  const [assignDocId, setAssignDocId] = useState("");

  const isToday = (dateString) => {
    if (!dateString) return false;
    const date = new Date(dateString);
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  useEffect(() => {
    // 1. Patient Details
    const docRef = doc(db, "patients", id);
    const unsubscribePatient = onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          // Security Check: Only allow if Linked
          if (data.caretakerUid !== currentUser.uid) {
            alert("Access Denied: You are not linked to this patient.");
            navigate("/dashboard/caretaker");
            return;
          }
          setPatient({ id: docSnap.id, sourceCollection: "patients", ...data });
          if (data.doctorUid) {
            getDoc(doc(db, "doctors", data.doctorUid)).then((dSnap) => {
              if (dSnap.exists()) {
                setDoctor({ id: dSnap.id, ...dSnap.data() });
              } else {
                getDoc(doc(db, "users", data.doctorUid)).then((dSnap2) => {
                  if (dSnap2.exists())
                    setDoctor({ id: dSnap2.id, ...dSnap2.data() });
                });
              }
            });
          }
        } else {
          // Fallback: Check 'users' collection for legacy support
          const legacyRef = doc(db, "users", id);
          getDoc(legacyRef).then((legacySnap) => {
            if (legacySnap.exists()) {
              const data = legacySnap.data();
              if (data.caretakerUid !== currentUser.uid) {
                alert("Access Denied: You are not linked to this patient.");
                navigate("/dashboard/caretaker");
                return;
              }
              setPatient({
                id: legacySnap.id,
                sourceCollection: "users",
                ...data,
              });

              if (data.doctorUid) {
                getDoc(doc(db, "doctors", data.doctorUid)).then((dSnap) => {
                  if (dSnap.exists()) {
                    setDoctor({ id: dSnap.id, ...dSnap.data() });
                  } else {
                    getDoc(doc(db, "users", data.doctorUid)).then((dSnap2) => {
                      if (dSnap2.exists())
                        setDoctor({ id: dSnap2.id, ...dSnap2.data() });
                    });
                  }
                });
              }

              // Also fetch meds from legacy
              const legacyMedsRef = collection(db, "users", id, "medicines");
              onSnapshot(legacyMedsRef, (snap) => {
                setMedicines(snap.docs.map((d) => ({ ...d.data(), id: d.id })));
              });
            } else {
              navigate("/dashboard/caretaker");
            }
          });
        }
      },
      (error) => console.error("Error fetching patient", error),
    );

    // 2. Meds (Default to patients, fallback handled above if patient not found)
    const medsRef = collection(db, "patients", id, "medicines");
    const unsubscribeMeds = onSnapshot(
      medsRef,
      (snapshot) => {
        setMedicines(snapshot.docs.map((d) => ({ ...d.data(), id: d.id })));
      },
      (error) => console.error("Error fetching meds", error),
    );

    return () => {
      unsubscribePatient();
      unsubscribeMeds();
    };
  }, [id]);

  const handleAssignDoctor = async () => {
    if (!assignDocId.trim()) return;
    try {
      const q = query(
        collection(db, "doctors"),
        where("doctorId", "==", assignDocId.trim().toUpperCase()),
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        const targetDocUid = snap.docs[0].id; // uses UID
        const targetDocData = snap.docs[0].data();

        // Update both the specific patients collection and potentially legacy user
        await updateDoc(doc(db, "patients", patient.id), {
          doctorUid: targetDocUid,
        });

        setDoctor(targetDocData);
        setAssignDocId("");
        alert("Doctor assigned successfully!");
      } else {
        alert("Could not find a doctor with that ID.");
      }
    } catch (e) {
      console.error(e);
      alert("Error assigning doctor.");
    }
  };

  const handleReportEmergency = async () => {
    if (!patient.doctorUid) {
      alert("No doctor assigned to report to.");
      return;
    }
    if (window.confirm(`Report critical emergency for ${patient.fullName}?`)) {
      try {
        const timestamp = new Date();
        const collectionName = patient.sourceCollection || "patients";

        // 1. Update Patient Status
        await updateDoc(doc(db, collectionName, patient.id), {
          riskStatus: "critical",
          isEmergency: true,
          lastEmergency: timestamp.toISOString(),
        });

        // 2. Notify Doctor
        await addDoc(
          collection(db, "users", patient.doctorUid, "notifications"),
          {
            title: "CRITICAL EMERGENCY: " + patient.fullName,
            message: "Guardian has triggered a manual emergency override.",
            type: "emergency",
            patientId: patient.id,
            read: false,
            timestamp: serverTimestamp(),
          },
        );
        alert("Emergency declared. Doctor has been notified immediately.");
      } catch (e) {
        console.error(e);
        alert("Failed to send emergency report.");
      }
    }
  };

  if (!patient) return <div className="p-8">Loading...</div>;

  return (
    <div className="fade-in">
      <Link
        to="/dashboard/caretaker"
        className="flex items-center gap-2 text-muted mb-6 hover:text-primary"
      >
        <ArrowLeft size={18} /> Back to Dashboard
      </Link>

      <div className="flex justify-between items-start mb-6">
        <div className="flex gap-4">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
            <User size={32} />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{patient.fullName}</h1>
            <p className="text-muted">
              ID: {patient.patientId} • Risk:{" "}
              <span className="font-semibold text-green-600">
                {patient.riskStatus?.toUpperCase() || "STABLE"}
              </span>
            </p>
            {patient.doctorUid ? (
              <p className="text-sm text-blue-600 font-medium">
                Dr. {doctor?.fullName || "Loading..."} (ID:{" "}
                {doctor?.doctorId ||
                  (doctor?.id
                    ? `REG-${doctor.id.substring(0, 4).toUpperCase()}`
                    : "Pending")}
                )
              </p>
            ) : (
              <div className="flex bg-white items-center gap-2 mt-2">
                <input
                  type="text"
                  placeholder="Doctor ID (DOC-XXXX)"
                  className="input input-sm max-w-[200px]"
                  value={assignDocId}
                  onChange={(e) => setAssignDocId(e.target.value)}
                />
                <button
                  onClick={handleAssignDoctor}
                  className="btn btn-primary btn-sm"
                >
                  Assign
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleReportEmergency}
            className="btn btn-outline border-red-200 text-red-600 hover:bg-red-50"
          >
            <AlertTriangle size={18} /> Report Emergency
          </button>
          <button
            onClick={() =>
              navigate("/dashboard/caretaker/book-appointment", {
                state: { preselectPatient: patient.id },
              })
            }
            className="btn btn-primary"
          >
            <Calendar size={18} /> Book Appointment
          </button>
        </div>
      </div>

      {/* Read-Only Meds */}
      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Pill size={20} /> Today's Medication Status
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {medicines.map((med) => (
          <div key={med.id} className="card bg-gray-50 border-gray-200">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold">{med.name}</h3>
                <p className="text-sm text-muted">{med.timing}</p>
              </div>
              {/* Real Status Display */}
              {(() => {
                const takenToday =
                  isToday(med.lastAction) && med.status === "taken";
                const skippedToday =
                  isToday(med.lastAction) && med.status === "skipped";
                const displayStatus = takenToday
                  ? "taken"
                  : skippedToday
                    ? "skipped"
                    : "scheduled";

                return (
                  <span
                    className={`text-xs px-2 py-1 rounded font-bold uppercase ${
                      displayStatus === "taken"
                        ? "bg-green-100 text-green-700"
                        : displayStatus === "skipped"
                          ? "bg-red-100 text-red-700"
                          : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {displayStatus}
                  </span>
                );
              })()}
            </div>
          </div>
        ))}
        {medicines.length === 0 && (
          <p className="text-muted italic">No medicines found.</p>
        )}
      </div>
    </div>
  );
}
