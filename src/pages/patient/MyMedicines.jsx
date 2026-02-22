import { useState, useEffect } from "react";
import {
  Plus,
  Edit2,
  Trash2,
  Pill,
  RotateCcw,
  X,
  Clock,
  CheckCircle,
  XCircle,
} from "lucide-react";
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
  updateDoc,
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
      const documentId = currentUser.id || currentUser.uid;
      const userRef = doc(db, collectionName, documentId);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const data = userSnap.data();
        setCanEdit(!data.doctorUid);
      }
    }
    checkPermissions();

    // Real-time Meds
    const collectionName = currentUser.sourceCollection || "users";
    const documentId = currentUser.id || currentUser.uid;
    const medsRef = collection(db, collectionName, documentId, "medicines");
    const unsubscribe = onSnapshot(medsRef, (snapshot) => {
      setMedicines(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    return () => unsubscribe();
  }, [currentUser]);

  const deleteMedicine = async (id) => {
    if (!window.confirm("Delete this medicine?")) return;
    const collectionName = currentUser.sourceCollection || "users";
    const documentId = currentUser.id || currentUser.uid;
    await deleteDoc(doc(db, collectionName, documentId, "medicines", id));
    setMedicines(medicines.filter((m) => m.id !== id));
  };

  const handleAction = async (id, action) => {
    try {
      const collectionName = currentUser.sourceCollection || "users";
      const documentId = currentUser.id || currentUser.uid;
      const medRef = doc(db, collectionName, documentId, "medicines", id);
      if (action === "snooze") {
        const val = window.prompt("Snooze minutes (e.g. 30)", "30");
        const mins = parseInt(val, 10);
        if (isNaN(mins) || mins <= 0) return;
        const snoozedUntil = new Date(
          Date.now() + mins * 60 * 1000,
        ).toISOString();
        await updateDoc(medRef, { snoozedUntil });
        alert(`Snoozed for ${mins} minutes`);
        return;
      }

      const todayStr = new Date().toISOString();
      await updateDoc(medRef, {
        lastAction: todayStr,
        status: action,
        snoozedUntil: null,
      });
      alert(`Marked ${action}`);
    } catch (e) {
      console.error("Medicine Action Error: ", e);
      alert("Failed to update medicine: " + e.message);
    }
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
                    const documentId = currentUser.id || currentUser.uid;
                    const docRef = await addDoc(
                      collection(db, collectionName, documentId, "medicines"),
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
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4">
              <div className="flex gap-4 items-center">
                <div className="w-14 h-14 rounded-full bg-blue-50 border-2 border-blue-100 flex items-center justify-center text-blue-600 shadow-sm">
                  <Pill size={28} />
                </div>
                <div>
                  <h3 className="font-bold text-xl text-gray-800">
                    {med.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm font-semibold text-gray-700 bg-gray-100 px-2 py-0.5 rounded-full">
                      {med.dosage}
                    </span>
                    <span className="text-sm text-gray-500">
                      {med.frequency}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-gray-600 mt-2 flex items-center gap-1">
                    <Clock size={14} /> Timing:{" "}
                    {med.timing ||
                      (med.times && med.times.join(", ")) ||
                      "Not set"}
                  </p>
                  <div className="mt-2 text-xs font-semibold text-orange-600 bg-orange-50 inline-flex items-center gap-1 px-2 py-1 rounded border border-orange-100">
                    <RotateCcw size={12} /> Refill in {med.alertQuantity || 5}{" "}
                    days
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-end gap-3">
                <div className="flex gap-2">
                  <button
                    onClick={() => handleAction(med.id, "taken")}
                    className="btn btn-sm btn-outline border-green-200 text-green-700 hover:bg-green-50 shadow-sm flex items-center gap-1"
                  >
                    <CheckCircle size={14} /> Take
                  </button>
                  <button
                    onClick={() => handleAction(med.id, "skipped")}
                    className="btn btn-sm btn-outline border-red-200 text-red-700 hover:bg-red-50 shadow-sm flex items-center gap-1"
                  >
                    <XCircle size={14} /> Skip
                  </button>
                  <button
                    onClick={() => handleAction(med.id, "snooze")}
                    className="btn btn-sm btn-outline border-blue-200 text-blue-700 hover:bg-blue-50 shadow-sm flex items-center gap-1"
                  >
                    <Clock size={14} /> Snooze
                  </button>
                </div>

                <div className="flex items-center gap-3 w-full justify-end border-t border-gray-100 pt-3 mt-1">
                  {!canEdit && (
                    <span className="text-xs text-gray-500 italic bg-gray-50 px-2 py-1 rounded">
                      Managed by doctor
                    </span>
                  )}
                  {canEdit && (
                    <div className="flex gap-2 text-gray-400">
                      <button
                        className="p-1.5 hover:bg-gray-100 hover:text-blue-600 rounded transition-colors"
                        title="Edit Medicine"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => deleteMedicine(med.id)}
                        className="p-1.5 hover:bg-red-50 hover:text-red-600 rounded transition-colors"
                        title="Delete Medicine"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
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
