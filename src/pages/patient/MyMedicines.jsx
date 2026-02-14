import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Pill, RotateCcw, X } from "lucide-react";
import MedicineForm from "../../components/doctor/MedicineForm";
import { useAuth } from "../../contexts/AuthContext";
import { db } from "../../firebase";
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
} from "firebase/firestore";

export default function MyMedicines() {
  const { currentUser } = useAuth();
  const [medicines, setMedicines] = useState([]);

  const [canEdit, setCanEdit] = useState(false);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (!currentUser) return;

    async function checkPermissions() {
      // Check permissions (One-time fetch is fine for permissions as role/link doesn't change often in session)
      const collectionName = currentUser.sourceCollection || "users";
      const userRef = doc(db, collectionName, currentUser.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const data = userSnap.data();
        setCanEdit(!data.doctorUid);
      }
    }
    checkPermissions();

    // Real-time Meds
    const collectionName = currentUser.sourceCollection || "users";
    const medsRef = collection(
      db,
      collectionName,
      currentUser.uid,
      "medicines",
    );
    const unsubscribe = onSnapshot(medsRef, (snapshot) => {
      setMedicines(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    return () => unsubscribe();
  }, [currentUser]);

  const deleteMedicine = async (id) => {
    if (!window.confirm("Delete this medicine?")) return;
    const collectionName = currentUser.sourceCollection || "users";
    await deleteDoc(doc(db, collectionName, currentUser.uid, "medicines", id));
    setMedicines(medicines.filter((m) => m.id !== id));
  };

  return (
    <div className="fade-in">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">My Medicines</h1>
        {canEdit && (
          <button onClick={() => setShowForm(true)} className="btn btn-primary">
            <Plus size={18} /> Add Medicine
          </button>
        )}
      </div>

      {!canEdit && (
        <div className="bg-yellow-50 text-yellow-800 p-4 rounded mb-6 text-sm border border-yellow-200">
          <strong>Read Only:</strong> Your medicines are managed by your doctor.
          Contact them for changes.
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto py-10">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b flex justify-between items-center sticky top-0 bg-white z-10">
              <h2 className="text-xl font-bold">Add Medicine</h2>
              <button
                onClick={() => setShowForm(false)}
                className="p-1 hover:bg-gray-100 rounded-full"
              >
                <X size={24} />
              </button>
            </div>
            <div className="p-4">
              <MedicineForm
                onClose={() => setShowForm(false)}
                onSave={async (med) => {
                  try {
                    const { id, ...medData } = med;
                    const collectionName =
                      currentUser.sourceCollection || "users";
                    const docRef = await addDoc(
                      collection(
                        db,
                        collectionName,
                        currentUser.uid,
                        "medicines",
                      ),
                      medData,
                    );
                    // State update handled by onSnapshot, but we can optimistically update if we want.
                    // onSnapshot will handle it.
                  } catch (e) {
                    console.error("Error adding med", e);
                    alert("Failed to add medicine");
                  }
                }}
              />
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {medicines.map((med) => (
          <div key={med.id} className="card relative group">
            <div className="flex items-start justify-between">
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-primary">
                  <Pill size={24} />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{med.name}</h3>
                  <p className="text-sm text-muted">
                    {med.dosage} • {med.frequency}
                  </p>
                  <p className="text-sm text-muted mt-1">
                    Timing: {med.timing}
                  </p>
                  <div className="mt-2 inline-flex items-center gap-1 text-xs px-2 py-1 bg-gray-100 rounded">
                    <RotateCcw size={12} /> Refill in {med.alertQuantity || 5}{" "}
                    days
                  </div>
                </div>
              </div>

              {canEdit && (
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="p-2 hover:bg-gray-100 rounded text-muted">
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => deleteMedicine(med.id)}
                    className="p-2 hover:bg-red-50 rounded text-red-500"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              )}
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
