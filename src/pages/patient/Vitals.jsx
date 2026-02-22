import { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Plus, Activity, Heart, Scale, Droplet } from "lucide-react";
import { db } from "../../firebase";
import {
  collection,
  addDoc,
  query,
  orderBy,
  getDocs,
} from "firebase/firestore";
import { useAuth } from "../../contexts/AuthContext";

export default function Vitals() {
  const { currentUser } = useAuth();
  const [vitalsData, setVitalsData] = useState([]);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    async function fetchData() {
      if (currentUser) {
        try {
          const collectionName = currentUser.sourceCollection || "users";
          const documentId = currentUser.id || currentUser.uid;
          const vRef = collection(db, collectionName, documentId, "vitals");
          const q = query(vRef, orderBy("date", "asc"));
          const snap = await getDocs(q);
          const data = snap.docs.map((d) => d.data());

          setVitalsData(data);
        } catch (e) {
          console.error(e);
        }
      }
    }
    fetchData();
  }, [currentUser]);

  const handleAddVital = async (reading) => {
    const newEntry = {
      date: new Date().toISOString().split("T")[0],
      ...reading,
    };
    // Optimistic update
    setVitalsData([...vitalsData, newEntry]);
    setShowForm(false);

    // Save to DB
    const documentId = currentUser.id || currentUser.uid;
    const collectionName = currentUser.sourceCollection || "users";
    await addDoc(
      collection(db, collectionName, documentId, "vitals"),
      newEntry,
    );
  };

  return (
    <div className="fade-in">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Health Vitals</h1>
        <button onClick={() => setShowForm(true)} className="btn btn-primary">
          <Plus size={18} /> Log Vitals
        </button>
      </div>

      {showForm && (
        <VitalsForm
          onClose={() => setShowForm(false)}
          onSave={handleAddVital}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Blood Pressure */}
        <VitalCard
          title="Blood Pressure"
          icon={<Activity size={20} />}
          color="text-red-500"
          bg="bg-red-100"
        >
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={vitalsData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis domain={[60, 160]} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="bpSys"
                stroke="#EF4444"
                name="Systolic"
              />
              <Line
                type="monotone"
                dataKey="bpDia"
                stroke="#F87171"
                name="Diastolic"
              />
            </LineChart>
          </ResponsiveContainer>
        </VitalCard>

        {/* Blood Sugar */}
        <VitalCard
          title="Blood Sugar"
          icon={<Droplet size={20} />}
          color="text-blue-500"
          bg="bg-blue-100"
        >
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={vitalsData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis domain={[60, 150]} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="sugar"
                stroke="#3B82F6"
                name="Sugar (mg/dL)"
              />
            </LineChart>
          </ResponsiveContainer>
        </VitalCard>

        {/* Weight */}
        <VitalCard
          title="Weight"
          icon={<Scale size={20} />}
          color="text-green-500"
          bg="bg-green-100"
        >
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={vitalsData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis domain={["dataMin - 5", "dataMax + 5"]} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="weight"
                stroke="#10B981"
                name="Weight (kg)"
              />
            </LineChart>
          </ResponsiveContainer>
        </VitalCard>
      </div>
    </div>
  );
}

function VitalCard({ title, icon, color, bg, children }) {
  return (
    <div className="card">
      <div className="flex items-center gap-3 mb-4">
        <div className={`p-2 rounded-full ${bg} ${color}`}>{icon}</div>
        <h3 className="font-semibold">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function VitalsForm({ onClose, onSave }) {
  const [formData, setFormData] = useState({
    bpSys: "",
    bpDia: "",
    sugar: "",
    weight: "",
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      bpSys: Number(formData.bpSys),
      bpDia: Number(formData.bpDia),
      sugar: Number(formData.sugar),
      weight: Number(formData.weight),
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Log New Reading</h2>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="input-group">
              <label className="label">BP Systolic</label>
              <input
                type="number"
                className="input"
                value={formData.bpSys}
                onChange={(e) =>
                  setFormData({ ...formData, bpSys: e.target.value })
                }
                placeholder="120"
              />
            </div>
            <div className="input-group">
              <label className="label">BP Diastolic</label>
              <input
                type="number"
                className="input"
                value={formData.bpDia}
                onChange={(e) =>
                  setFormData({ ...formData, bpDia: e.target.value })
                }
                placeholder="80"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="input-group">
              <label className="label">Sugar (mg/dL)</label>
              <input
                type="number"
                className="input"
                value={formData.sugar}
                onChange={(e) =>
                  setFormData({ ...formData, sugar: e.target.value })
                }
                placeholder="95"
              />
            </div>
            <div className="input-group">
              <label className="label">Weight (kg)</label>
              <input
                type="number"
                className="input"
                value={formData.weight}
                onChange={(e) =>
                  setFormData({ ...formData, weight: e.target.value })
                }
                placeholder="70"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="btn btn-outline">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Save Entry
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
