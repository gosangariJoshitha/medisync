import { useEffect, useState } from "react";

import { useParams, Link, useNavigate } from "react-router-dom";
import { db } from "../../firebase";

import {
  doc,
  collection,
  addDoc,
  onSnapshot,
  getDoc,
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

  const [showApptModal, setShowApptModal] = useState(false);

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
          setPatient({ id: docSnap.id, ...data });
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
              setPatient({ id: legacySnap.id, ...data });

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

  const handleBookAppointment = async (apptData) => {
    // Book on behalf of patient
    try {
      await addDoc(collection(db, "appointments"), {
        patientId: patient.id,
        patientName: patient.fullName,
        caretakerId: currentUser.uid,
        bookedBy: "caretaker",
        status: "upcoming",
        ...apptData,
      });
      alert("Appointment Booked Successfully!");
      setShowApptModal(false);
    } catch (e) {
      console.error(e);
      alert("Booking failed");
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
            {patient.doctorUid && (
              <p className="text-sm text-blue-600 font-medium">
                Linked Doctor ID: {patient.doctorUid}
              </p>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <button className="btn btn-outline border-red-200 text-red-600 hover:bg-red-50">
            <AlertTriangle size={18} /> Report Emergency
          </button>
          <button
            onClick={() => setShowApptModal(true)}
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
              <span
                className={`text-xs px-2 py-1 rounded font-bold uppercase ${
                  med.status === "taken"
                    ? "bg-green-100 text-green-700"
                    : med.status === "skipped"
                      ? "bg-red-100 text-red-700"
                      : "bg-gray-100 text-gray-700"
                }`}
              >
                {med.status || "Scheduled"}
              </span>
            </div>
          </div>
        ))}
        {medicines.length === 0 && (
          <p className="text-muted italic">No medicines found.</p>
        )}
      </div>

      {/* Action Modal */}
      {showApptModal && (
        <BookAppointmentModal
          onClose={() => setShowApptModal(false)}
          onBook={handleBookAppointment}
        />
      )}
    </div>
  );
}

function BookAppointmentModal({ onClose, onBook }) {
  const handleSubmit = (e) => {
    e.preventDefault();
    onBook({
      date: e.target.date.value,
      time: e.target.time.value,
      reason: e.target.reason.value,
      doctorId: "general", // Keep simple
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Book for Patient</h2>
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label className="label">Date</label>
            <input type="date" name="date" required className="input" />
          </div>
          <div className="input-group">
            <label className="label">Time</label>
            <input type="time" name="time" required className="input" />
          </div>
          <div className="input-group">
            <label className="label">Reason</label>
            <textarea
              name="reason"
              required
              className="input h-24"
              placeholder="Description"
            ></textarea>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button type="button" onClick={onClose} className="btn btn-outline">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Confirm Booking
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
