import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { db } from "../../firebase";
import { doc, getDoc, collection, getDocs, onSnapshot } from "firebase/firestore";
import { ArrowLeft, User, Phone, Clock, CheckCircle, AlertTriangle } from "lucide-react";

export default function PatientDetails() {
    const { id } = useParams();
    const [patient, setPatient] = useState(null);
    const [medicines, setMedicines] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("overview");

    useEffect(() => {
        setLoading(true);
        // 1. Real-time Patient Details
        const docRef = doc(db, "users", id);
        const unsubscribePatient = onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
                setPatient({ id: docSnap.id, ...docSnap.data() });
            } else {
                setPatient(null);
            }
            // We set loading false after initial fetch of patient, 
            // but we also have medicines to fetch. 
            // Simplified: won't set loading false here to wait for both or just let them update independently.
            // For better UX, let's keep loading true until at least patient is found.
        });

        // 2. Real-time Medicines
        const medsRef = collection(db, "users", id, "medicines");
        const unsubscribeMeds = onSnapshot(medsRef, (snapshot) => {
            const medsList = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
            setMedicines(medsList);
            setLoading(false); // Set loading false when data arrives
        });

        return () => {
            unsubscribePatient();
            unsubscribeMeds();
        };
    }, [id]);

    if (loading) return <div className="p-8 text-center">Loading Profile...</div>;
    if (!patient) return <div className="p-8 text-center">Patient Not Found</div>;

    return (
        <div className="fade-in">
            <Link to="/dashboard/doctor/view-patients" className="flex items-center gap-2 text-muted mb-6 hover:text-primary">
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
                        <span className="flex items-center gap-1 text-sm bg-gray-100 px-3 py-1 rounded"><Phone size={14} /> {patient.phone}</span>
                        <span className="text-sm bg-gray-100 px-3 py-1 rounded">{patient.age} Yrs / {patient.gender}</span>
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
                <TabButton label="Overview" active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} />
                <TabButton label="Medicines" active={activeTab === 'medicines'} onClick={() => setActiveTab('medicines')} />
                <TabButton label="History" active={activeTab === 'history'} onClick={() => setActiveTab('history')} />
            </div>

            {activeTab === 'overview' && (
                <div className="grid grid-cols-2 gap-6">
                    <div className="card">
                        <h3 className="font-semibold mb-4">Patient Summary</h3>
                        <p className="text-sm text-muted mb-2"><strong>Risk Status:</strong> {patient.riskStatus?.toUpperCase()}</p>
                        <p className="text-sm text-muted mb-2"><strong>Caretaker:</strong> {patient.caretakerName || 'None'}</p>
                        <div className="mt-4 p-4 bg-yellow-50 text-yellow-800 rounded text-sm">
                            <AlertTriangle size={16} className="inline mr-2" />
                            Patient has missed 2 doses of Paracetamol this week.
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'medicines' && (
                <div className="grid grid-cols-1 gap-4">
                    {medicines.map(med => (
                        <div key={med.id} className="card flex justify-between items-center">
                            <div>
                                <p className="font-semibold text-lg">{med.name}</p>
                                <p className="text-muted text-sm">{med.dosage} • {med.frequency} • {med.timing}</p>
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
        </div>
    );
}

function TabButton({ label, active, onClick }) {
    return (
        <button
            onClick={onClick}
            className={`px-6 py-3 font-medium transition-colors border-b-2 ${active ? 'border-primary text-primary' : 'border-transparent text-muted hover:text-main'
                }`}
        >
            {label}
        </button>
    )
}
