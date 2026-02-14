import { useState, useEffect } from "react";
import { initializeApp, deleteApp } from "firebase/app";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { firebaseConfig } from "../../firebase";
import {
  User,
  Pill,
  ArrowRight,
  ArrowLeft,
  Plus,
  Trash2,
  X,
  Eye,
  Save,
} from "lucide-react";

import PatientInfoForm from "../../components/doctor/PatientInfoForm";
import MedicineForm from "../../components/doctor/MedicineForm";
import ReviewPatient from "../../components/doctor/ReviewPatient";
import { db } from "../../firebase";
import {
  doc,
  setDoc,
  collection,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

export default function AddPatient() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { id } = useParams(); // Get ID from URL for Edit Mode
  const isEditMode = !!id;
  const { currentUser } = useAuth();

  const [isMedicineModalOpen, setIsMedicineModalOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  // Initial State
  const initialPatientData = {
    fullName: "",
    age: "",
    gender: "select",
    diagnosis: "",
    phone: "",
    email: "",
    patientId: "PAT-" + Math.floor(1000 + Math.random() * 9000),
    caretakerName: "",
    caretakerPhone: "",
    riskStatus: "stable",
    adherenceScore: 100,
  };

  const [patientData, setPatientData] = useState(initialPatientData);
  const [medicines, setMedicines] = useState([]);
  const [initialMedicineIds, setInitialMedicineIds] = useState([]); // Track original IDs for deletion

  // Fetch Data if in Edit Mode
  useEffect(() => {
    if (isEditMode && currentUser) {
      const fetchPatientData = async () => {
        setLoading(true);
        try {
          // 1. Fetch User Doc
          const docRef = doc(db, "users", id);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            setPatientData({ ...initialPatientData, ...docSnap.data() });
          } else {
            alert("Patient not found!");
            navigate("/dashboard/doctor");
            return;
          }

          // 2. Fetch Medicines
          const medicinesRef = collection(db, "users", id, "medicines");
          const medSnap = await getDocs(medicinesRef);
          const medList = medSnap.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          setMedicines(medList);
          setInitialMedicineIds(medList.map((m) => m.id));
        } catch (error) {
          console.error("Error fetching patient details:", error);
          alert("Error loading data.");
        } finally {
          setLoading(false);
        }
      };

      fetchPatientData();
    }
  }, [isEditMode, currentUser, id, navigate]);

  async function handleFinish(e) {
    if (e) e.preventDefault();

    setLoading(true);
    try {
      // Calculate Daily Progress for consistency
      const todayStr = new Date().toISOString().split("T")[0];
      const currentProgress = patientData.dailyProgress || {};
      const isToday = currentProgress?.date === todayStr;

      const newDailyProgress = {
        taken: isToday ? currentProgress?.taken || 0 : 0,
        total: medicines.length,
        date: todayStr,
      };

      if (isEditMode) {
        // --- UPDATE MODE ---
        // Try updating 'patients' collection first, if not found, try 'users' (legacy)
        // But since we are moving forward, let's target 'patients'.
        // If migrating old data, this might need a check.
        // For now, we assume we are working with the new schema or migrated data.
        const userRef = doc(db, "patients", id);

        try {
          await updateDoc(userRef, {
            ...patientData,
            dailyProgress: newDailyProgress,
          });
        } catch (e) {
          // Fallback to 'users' if not found in 'patients' ??
          // Let's stick to 'patients' for now as requested.
          console.warn("Could not update in patients, trying users...", e);
          await updateDoc(doc(db, "users", id), {
            ...patientData,
            dailyProgress: newDailyProgress,
          });
        }

        // Handle Medicines
        const currentMedIds = medicines.map((m) => m.id);
        const medsToDelete = initialMedicineIds.filter(
          (oldId) => !currentMedIds.includes(oldId),
        );

        // Try deleting from patients/medicines
        for (const medId of medsToDelete) {
          try {
            await deleteDoc(doc(db, "patients", id, "medicines", medId));
          } catch (e) {
            await deleteDoc(doc(db, "users", id, "medicines", medId));
          }
        }

        // Add/update remaining
        // We will write to 'patients' collection primarily now.
        const medsRef = collection(db, "patients", id, "medicines");
        for (const med of medicines) {
          if (initialMedicineIds.includes(med.id)) {
            try {
              await updateDoc(
                doc(db, "patients", id, "medicines", med.id),
                med,
              );
            } catch (e) {
              // If it was in users, move it? Or just update in users?
              // Let's just update in users for legacy.
              await updateDoc(doc(db, "users", id, "medicines", med.id), med);
            }
          } else {
            const { id: tempId, ...medData } = med;
            await addDoc(medsRef, medData);
          }
        }
        alert("Patient Updated Successfully!");
      } else {
        // --- CREATE MODE ---
        const patientEmail = `${patientData.patientId}@medisync.com`;
        const patientPassword = patientData.patientId;

        // Caretaker Auth
        const caretakerEmail = `${patientData.caretakerPhone}@caretaker.medisync.com`;
        const caretakerPassword = patientData.caretakerPhone;

        const secondaryApp = initializeApp(firebaseConfig, "Secondary");
        const secondaryAuth = getAuth(secondaryApp);
        let patientUid = null;
        let caretakerUid = null;

        try {
          // 1. Create Patient Auth
          console.log("Creating patient auth...", patientEmail);
          const pCred = await createUserWithEmailAndPassword(
            secondaryAuth,
            patientEmail,
            patientPassword,
          );
          patientUid = pCred.user.uid;
          await signOut(secondaryAuth);

          // 2. Create Caretaker Auth
          if (patientData.caretakerPhone) {
            console.log("Creating caretaker auth...", caretakerEmail);
            try {
              const cCred = await createUserWithEmailAndPassword(
                secondaryAuth,
                caretakerEmail,
                caretakerPassword,
              );
              caretakerUid = cCred.user.uid;
              await signOut(secondaryAuth);
            } catch (cErr) {
              if (cErr.code === "auth/email-already-in-use") {
                console.log("Caretaker already exists (shared caretaker?)");
                // In real app, we would Find UID by email (needs admin sdk)
                // Here we simply proceed without linking specific UID if we can't get it.
              } else {
                throw cErr;
              }
            }
          }
        } catch (authError) {
          console.error("Error creating auth user:", authError);
          let errorMsg = "Failed to create login accounts.";
          if (authError.code === "auth/email-already-in-use") {
            errorMsg = "Patient ID is already registered.";
          }
          alert(errorMsg);
          setLoading(false);
          await deleteApp(secondaryApp);
          return;
        }

        if (!patientUid) {
          alert("Critical Error: Auth User ID missing. Aborting.");
          setLoading(false);
          await deleteApp(secondaryApp);
          return;
        }

        try {
          // 3. Create Patient Document in 'patients' collection
          const patientRef = doc(db, "patients", patientData.patientId);
          await setDoc(patientRef, {
            ...patientData,
            uid: patientUid,
            caretakerUid: caretakerUid,
            email: patientEmail,
            role: "patient",
            doctorUid: currentUser.uid,
            createdAt: new Date().toISOString(),
            riskStatus: "stable",
            adherenceScore: 100,
            dailyProgress: newDailyProgress,
          });

          // 4. Create Caretaker Document in 'caretakers' collection
          if (caretakerUid) {
            await setDoc(doc(db, "caretakers", caretakerUid), {
              fullName: patientData.caretakerName,
              phone: patientData.caretakerPhone,
              email: caretakerEmail,
              role: "caretaker",
              linkedPatients: [patientData.patientId],
              createdAt: new Date().toISOString(),
            });
          }

          // 5. Add Medicines
          const medsRef = collection(
            db,
            "patients",
            patientData.patientId,
            "medicines",
          );
          for (const med of medicines) {
            await addDoc(medsRef, med);
          }

          alert(
            `Patient Added!\n\nPatient Login:\nID: ${patientData.patientId}\nPass: ${patientPassword}\n\nCaretaker Login:\nPhone: ${patientData.caretakerPhone}\nPass: ${patientPassword}`,
          );
        } catch (dbError) {
          console.error("Error creating database record:", dbError);
          alert("Auth created but database failed. Please contact support.");
        } finally {
          await deleteApp(secondaryApp);
        }
      }

      navigate("/dashboard/doctor");
    } catch (error) {
      console.error("Error saving patient: ", error);
      alert("Failed to save patient. Check console.");
    } finally {
      setLoading(false);
    }
  }

  const openReview = () => {
    if (!patientData.fullName || !patientData.age || !patientData.phone) {
      alert("Please fill in required patient details.");
      return;
    }
    setIsReviewModalOpen(true);
  };

  if (loading && isEditMode && !patientData.fullName) {
    return (
      <div className="p-10 text-center">
        <p>Loading patient data...</p>
      </div>
    );
  }

  if (isMedicineModalOpen) {
    return (
      <div className="fade-in max-w-6xl mx-auto p-6">
        <button
          onClick={() => setIsMedicineModalOpen(false)}
          className="btn btn-outline mb-6 flex items-center gap-2"
        >
          <ArrowLeft size={18} /> Back to Patient Details
        </button>

        <h2 className="text-2xl font-bold mb-6">
          {isEditMode ? "Edit Medicine" : "Add Medicine"}
        </h2>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <MedicineForm
            medicines={medicines}
            setMedicines={setMedicines}
            onClose={() => setIsMedicineModalOpen(false)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="fade-in max-w-6xl mx-auto p-6">
      <button
        onClick={() => navigate("/dashboard/doctor")}
        className="btn btn-outline mb-6 flex items-center gap-2"
      >
        <ArrowLeft size={18} /> Back to Home
      </button>

      <h1 className="text-2xl font-bold mb-6">
        {isEditMode ? "Edit Patient Details" : "Add New Patient"}
      </h1>

      <div className="max-w-4xl mx-auto space-y-6">
        {/* Patient Details Section */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold mb-4">Patient Details</h3>
          <PatientInfoForm data={patientData} update={setPatientData} />
        </div>

        {/* Medication Schedule Section */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold mb-4">Medication Schedule</h3>

          {medicines.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
              <p className="text-gray-400 mb-4">No medications added yet.</p>
              <button
                type="button"
                onClick={() => setIsMedicineModalOpen(true)}
                className="btn btn-outline flex items-center gap-2 mx-auto"
              >
                <Plus size={18} /> Add Medicines
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {medicines.map((med, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-white"
                      style={{ backgroundColor: med.color || "#3B82F6" }}
                    >
                      <Pill size={20} />
                    </div>
                    <div>
                      <div className="font-medium">{med.name}</div>
                      <div className="text-xs text-gray-500">
                        {med.dosage} • {med.frequency}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() =>
                      setMedicines(medicines.filter((_, i) => i !== index))
                    }
                    className="text-red-500 hover:bg-red-50 p-2 rounded-full"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setIsMedicineModalOpen(true)}
                className="btn btn-outline w-full mt-4 flex items-center justify-center gap-2"
              >
                <Plus size={18} /> Add More Medicines
              </button>
            </div>
          )}
        </div>

        {/* Review & Finalize Button */}
        <button
          onClick={openReview}
          className="w-full btn btn-primary py-4 text-lg font-semibold shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2"
        >
          {isEditMode ? (
            <>
              <Save size={20} /> Update & Save
            </>
          ) : (
            <>
              <Eye size={20} /> Review & Finalize
            </>
          )}
        </button>
      </div>

      {/* Review Modal - Kept as Modal */}
      {isReviewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white z-10">
              <h3 className="text-lg font-semibold">
                {isEditMode ? "Review & Update" : "Review Details"}
              </h3>
              <button
                onClick={() => setIsReviewModalOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <X size={24} />
              </button>
            </div>
            <div className="p-6">
              <ReviewPatient
                patientData={patientData}
                medicines={medicines}
                onBack={() => setIsReviewModalOpen(false)}
                onFinish={handleFinish}
                loading={loading}
                submitLabel={isEditMode ? "Confirm Update" : "Finalize & Add"}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
