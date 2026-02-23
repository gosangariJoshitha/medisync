import { useState, useEffect } from "react";
import {
  Calendar,
  Clock,
  User,
  FileText,
  CheckCircle2,
  UserCheck,
  Stethoscope,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useLocation } from "react-router-dom";
import { db } from "../../firebase";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  doc,
  getDoc,
} from "firebase/firestore";

export default function CaretakerBookAppointment() {
  const { currentUser } = useAuth();
  const location = useLocation();
  const preselectPatient = location.state?.preselectPatient || "";

  const [patients, setPatients] = useState([]);
  const [doctorsMap, setDoctorsMap] = useState({});
  const [allDoctors, setAllDoctors] = useState([]);
  const [formData, setFormData] = useState({
    patient: preselectPatient,
    doctorId: "",
    date: "",
    time: "",
    reason: "",
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (!currentUser) return;
      try {
        // Fetch modern patients
        const qPatients = query(
          collection(db, "patients"),
          where("caretakerUid", "==", currentUser.uid),
        );
        const snapPatients = await getDocs(qPatients);

        // Fetch legacy patients (users table)
        const qUsers = query(
          collection(db, "users"),
          where("caretakerUid", "==", currentUser.uid),
        );
        const snapUsers = await getDocs(qUsers);

        const fetchedPatients = [
          ...snapPatients.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
          ...snapUsers.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
        ].filter((v, i, a) => a.findIndex((t) => t.id === v.id) === i); // deduplicate

        setPatients(fetchedPatients);

        // Fetch all available doctors from both collections
        const docsQuery = query(collection(db, "doctors"));
        const docsSnap = await getDocs(docsQuery);
        let fetchedAllDoctors = docsSnap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));

        const legacyDocsQuery = query(
          collection(db, "users"),
          where("role", "==", "doctor"),
        );
        const legacyDocsSnap = await getDocs(legacyDocsQuery);
        const legacyDoctors = legacyDocsSnap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));

        fetchedAllDoctors = [...fetchedAllDoctors, ...legacyDoctors].filter(
          (v, i, a) => a.findIndex((t) => t.id === v.id) === i,
        );

        setAllDoctors(fetchedAllDoctors);

        // Map assigned doctors
        const docMap = {};
        for (const p of fetchedPatients) {
          if (p.doctorUid) {
            const foundDoc = fetchedAllDoctors.find(
              (d) => d.id === p.doctorUid || d.uid === p.doctorUid,
            );
            if (foundDoc) {
              docMap[p.id] = foundDoc;
            } else {
              // Final fallback if somehow missing from both bulk queries
              let dSnap = await getDoc(doc(db, "doctors", p.doctorUid));
              if (!dSnap.exists()) {
                dSnap = await getDoc(doc(db, "users", p.doctorUid));
              }
              if (dSnap.exists())
                docMap[p.id] = { id: dSnap.id, ...dSnap.data() };
            }
          }
        }
        setDoctorsMap(docMap);
      } catch (e) {
        console.error("Failed to fetch patients/doctors", e);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [currentUser]);

  const selectedPatientData = patients.find((p) => p.id === formData.patient);
  const assignedDoctor = formData.patient ? doctorsMap[formData.patient] : null;
  const manuallySelectedDoctor = allDoctors.find(
    (d) => d.id === formData.doctorId,
  );

  const finalDoctorToBook = assignedDoctor || manuallySelectedDoctor;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!finalDoctorToBook) {
      alert("Please select a doctor for this appointment.");
      return;
    }
    try {
      await addDoc(collection(db, "appointments"), {
        patientId: selectedPatientData.id,
        patientName: selectedPatientData.fullName,
        caretakerId: currentUser.uid,
        doctorId: finalDoctorToBook.id || finalDoctorToBook.uid,
        doctorName: finalDoctorToBook.fullName,
        date: formData.date,
        time: formData.time,
        reason: formData.reason,
        bookedBy: "caretaker",
        status: "upcoming",
      });
      setIsSubmitted(true);
      setTimeout(() => setIsSubmitted(false), 3000);
      setFormData({
        patient: "",
        doctorId: "",
        date: "",
        time: "",
        reason: "",
      });
    } catch (err) {
      console.error("Booking error:", err);
      alert("Failed to confirm appointment");
    }
  };

  return (
    <div className="fade-in max-w-2xl mx-auto pb-12">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-blue-100 text-primary rounded-xl">
          <Calendar size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Book Appointment</h1>
          <p className="text-gray-500 text-sm">
            Schedule a primary care visit with the assigned doctor on behalf of
            your linked patient.
          </p>
        </div>
      </div>

      <div className="card p-6 md:p-8">
        {isSubmitted ? (
          <div className="text-center py-12">
            <CheckCircle2 size={64} className="mx-auto text-green-500 mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Request Submitted
            </h2>
            <p className="text-gray-500">
              The doctor's office will contact you shortly to confirm the
              appointment.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Select Patient
              </label>
              <div className="relative">
                <User
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <select
                  required
                  className="input w-full pl-10 bg-gray-50 border-gray-200 focus:bg-white"
                  value={formData.patient}
                  onChange={(e) =>
                    setFormData({ ...formData, patient: e.target.value })
                  }
                >
                  <option value="" disabled>
                    {loading ? "Loading..." : "Choose a linked patient..."}
                  </option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.fullName}
                    </option>
                  ))}
                </select>
              </div>

              {formData.patient && assignedDoctor && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-100 flex items-start gap-3">
                  <Stethoscope size={20} className="text-primary mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      Booking Appointment With Assigned Doctor:
                    </p>
                    <p className="text-sm text-gray-700 mt-1">
                      Dr. {assignedDoctor.fullName}
                    </p>
                    <p className="text-xs text-blue-600 mt-1">
                      On behalf of {selectedPatientData?.fullName}
                    </p>
                  </div>
                </div>
              )}

              {formData.patient && !assignedDoctor && (
                <div className="mt-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Select Available Doctor
                  </label>
                  <div className="relative">
                    <Stethoscope
                      size={18}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <select
                      required
                      className="input w-full pl-10 bg-gray-50 border-gray-200 focus:bg-white"
                      value={formData.doctorId}
                      onChange={(e) =>
                        setFormData({ ...formData, doctorId: e.target.value })
                      }
                    >
                      <option value="" disabled>
                        Choose a doctor...
                      </option>
                      {allDoctors.map((d) => (
                        <option key={d.id} value={d.id}>
                          Dr. {d.fullName} ({d.specialization || "General"})
                        </option>
                      ))}
                    </select>
                  </div>
                  <p className="text-xs text-muted mt-2">
                    This patient doesn't have a linked primary doctor. Please
                    choose one from the available list.
                  </p>
                </div>
              )}
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Preferred Date
                </label>
                <div className="relative">
                  <Calendar
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    type="date"
                    required
                    min={new Date().toISOString().split("T")[0]}
                    className="input w-full pl-10 bg-gray-50 border-gray-200 focus:bg-white"
                    value={formData.date}
                    onChange={(e) =>
                      setFormData({ ...formData, date: e.target.value })
                    }
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Preferred Time
                </label>
                <div className="relative">
                  <Clock
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <select
                    required
                    className="input w-full pl-10 bg-gray-50 border-gray-200 focus:bg-white"
                    value={formData.time}
                    onChange={(e) =>
                      setFormData({ ...formData, time: e.target.value })
                    }
                  >
                    <option value="" disabled>
                      Select time block
                    </option>
                    <option value="morning">Morning (9AM - 12PM)</option>
                    <option value="afternoon">Afternoon (1PM - 4PM)</option>
                    <option value="evening">Evening (5PM - 7PM)</option>
                  </select>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Reason for Visit
              </label>
              <div className="relative">
                <FileText
                  size={18}
                  className="absolute left-3 top-3 text-gray-400"
                />
                <textarea
                  required
                  className="input w-full pl-10 py-3 bg-gray-50 border-gray-200 focus:bg-white min-h-[120px]"
                  placeholder="Briefly describe the symptoms or reason for the appointment..."
                  value={formData.reason}
                  onChange={(e) =>
                    setFormData({ ...formData, reason: e.target.value })
                  }
                ></textarea>
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button type="submit" className="btn btn-primary px-8">
                Submit Request
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
