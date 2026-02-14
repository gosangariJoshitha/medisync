import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { db } from "../../firebase";
import { doc, collection, onSnapshot, getDocs, getDoc, addDoc } from "firebase/firestore";
import {
  ArrowLeft,
  User,
  Phone,
  Clock,
  CheckCircle,
  AlertTriangle,
  Send,
} from "lucide-react";

export default function PatientDetails() {
  const { id } = useParams();
  const [patient, setPatient] = useState(null);
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [sendingNotif, setSendingNotif] = useState(false);
  const [notifMessage, setNotifMessage] = useState("");
  const [notifTitle, setNotifTitle] = useState("");

  useEffect(() => {
    // 1. Real-time Patient Details
    // 1. Real-time Patient Details
    // Try 'patients' first
    const patientRef = doc(db, "patients", id);
    const unsubscribePatient = onSnapshot(patientRef, (docSnap) => {
      if (docSnap.exists()) {
        setPatient({ id: docSnap.id, ...docSnap.data() });
        setLoading(false); // Found in new collection
      } else {
        // Fallback to 'users'
        const userRef = doc(db, "users", id);
        getDoc(userRef).then((userSnap) => {
          if (userSnap.exists()) {
            setPatient({ id: userSnap.id, ...userSnap.data() });
          } else {
            setPatient(null);
          }
          if (medicines.length === 0) setLoading(false);
        });
      }
    });

    // 2. Real-time Medicines
    // Listen to BOTH for safe migration or just 'patients' if we are sure?
    // Let's listen to 'patients' primarily.
    const medsRef = collection(db, "patients", id, "medicines");
    const unsubscribeMeds = onSnapshot(medsRef, (snapshot) => {
      const medsList = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      if (medsList.length > 0) {
        setMedicines(medsList);
      } else {
        // Fallback to users/medicines if empty
        const legacyMedsRef = collection(db, "users", id, "medicines");
        getDocs(legacyMedsRef).then((snap) => {
          if (!snap.empty) {
            setMedicines(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
          } else {
            setMedicines([]);
          }
        });
      }
    });

    return () => {
      unsubscribePatient();
      unsubscribeMeds();
    };
  }, [id]);

  const handleSendNotification = async () => {
    if (!notifTitle.trim() || !notifMessage.trim()) {
      alert("Please enter both title and message");
      return;
    }

    try {
      setSendingNotif(true);
      // Send notification to patient's notifications collection
      const collectionName = patient.sourceCollection || "users";
      await addDoc(collection(db, collectionName, id, "notifications"), {
        title: notifTitle,
        message: notifMessage,
        read: false,
        timestamp: new Date(),
        type: "doctor_message",
      });
      alert("Notification sent successfully!");
      setNotifTitle("");
      setNotifMessage("");
    } catch (error) {
      console.error("Error sending notification:", error);
      alert("Failed to send notification");
    } finally {
      setSendingNotif(false);
    }
  };

  if (loading) return <div className="p-8 text-center">Loading Profile...</div>;
  if (!patient) return <div className="p-8 text-center">Patient Not Found</div>;

  return (
    <div className="fade-in">
      <Link
        to="/dashboard/doctor/view-patients"
        className="flex items-center gap-2 text-muted mb-6 hover:text-primary"
      >
        <ArrowLeft size={18} /> Back to List
      </Link>

      <div className="flex gap-6 mb-6">
        <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
          <User size={48} />
        </div>
        <div>
          <h1 className="text-3xl font-bold">{patient.fullName}</h1>
          <p className="text-muted text-lg">Patient ID: {patient.patientId}</p>
          <div className="flex gap-4 mt-2">
            <a
              href={`tel:${patient.phone}`}
              className="flex items-center gap-1 text-sm bg-gray-100 hover:bg-green-100 hover:text-green-700 px-3 py-1 rounded transition-colors"
              title="Call Patient"
            >
              <Phone size={14} /> {patient.phone}
            </a>
            <span className="text-sm bg-gray-100 px-3 py-1 rounded">
              {patient.age} Yrs / {patient.gender}
            </span>
          </div>
        </div>
        <div className="ml-auto text-right">
          <div className="inline-block px-4 py-2 rounded-lg bg-green-50 text-green-700 font-bold border border-green-200">
            Adherence: {patient.adherenceScore || 100}%
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b mb-6">
        <TabButton
          label="Overview"
          active={activeTab === "overview"}
          onClick={() => setActiveTab("overview")}
        />
        <TabButton
          label="Medicines"
          active={activeTab === "medicines"}
          onClick={() => setActiveTab("medicines")}
        />
        <TabButton
          label="History"
          active={activeTab === "history"}
          onClick={() => setActiveTab("history")}
        />
        <TabButton
          label="Send Message"
          active={activeTab === "message"}
          onClick={() => setActiveTab("message")}
        />
      </div>

      {activeTab === "overview" && (
        <div className="grid grid-cols-2 gap-6">
          <div className="card">
            <h3 className="font-semibold mb-4">Patient Summary</h3>
            <p className="text-sm text-muted mb-2">
              <strong>Risk Status:</strong> {patient.riskStatus?.toUpperCase()}
            </p>
            <p className="text-sm text-muted mb-2">
              <strong>Caretaker:</strong> {patient.caretakerName || "None"}
            </p>
            <div className="mt-4 p-4 bg-yellow-50 text-yellow-800 rounded text-sm">
              <AlertTriangle size={16} className="inline mr-2" />
              Patient has missed 2 doses of Paracetamol this week.
            </div>
          </div>
        </div>
      )}

      {activeTab === "medicines" && (
        <div className="grid grid-cols-1 gap-4">
          {medicines.map((med) => (
            <div
              key={med.id}
              className="card flex justify-between items-center"
            >
              <div>
                <p className="font-semibold text-lg">{med.name}</p>
                <p className="text-muted text-sm">
                  {med.dosage} • {med.frequency} • {med.timing}
                </p>
              </div>
              <div className="text-right">
                <p className="font-bold text-primary">{med.duration} Days</p>
                <p className="text-xs text-muted">Left</p>
              </div>
            </div>
          ))}
          {medicines.length === 0 && <p>No medicines assigned.</p>}
        </div>
      )}

      {activeTab === "message" && (
        <div className="card max-w-2xl">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
            <Send size={20} className="text-primary" />
            Send Message to Patient
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Message Title
              </label>
              <input
                type="text"
                value={notifTitle}
                onChange={(e) => setNotifTitle(e.target.value)}
                className="input w-full"
                placeholder="e.g., Medication Reminder, Appointment Reminder"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Message Content
              </label>
              <textarea
                value={notifMessage}
                onChange={(e) => setNotifMessage(e.target.value)}
                className="input w-full h-32 resize-none"
                placeholder="Enter your message here..."
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleSendNotification}
                disabled={sendingNotif}
                className="btn btn-primary flex items-center gap-2"
              >
                <Send size={16} />
                {sendingNotif ? "Sending..." : "Send Message"}
              </button>
              <button
                onClick={() => {
                  setNotifTitle("");
                  setNotifMessage("");
                }}
                className="btn btn-outline"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TabButton({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`px-6 py-3 font-medium transition-colors border-b-2 ${
        active
          ? "border-primary text-primary"
          : "border-transparent text-muted hover:text-main"
      }`}
    >
      {label}
    </button>
  );
}
