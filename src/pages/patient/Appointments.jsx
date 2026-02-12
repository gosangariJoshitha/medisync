import { useState, useEffect } from "react";
import { Calendar, Clock, User, Check, Plus } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { db } from "../../firebase";
import { collection, addDoc, query, where, getDocs, doc, getDoc } from "firebase/firestore";

export default function Appointments() {
    const { currentUser } = useAuth();
    const [appointments, setAppointments] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [linkedDoctor, setLinkedDoctor] = useState(null);

    useEffect(() => {
        async function fetchData() {
            if (currentUser) {
                // 1. Check linked doctor
                const userSnap = await getDoc(doc(db, "users", currentUser.uid));
                if (userSnap.exists()) {
                    const data = userSnap.data();
                    if (data.doctorUid) {
                        // Fetch Doctor Name
                        // In a real app we'd fetch the doctor doc. For now just ID.
                        setLinkedDoctor({ id: data.doctorUid, name: "Dr. Assigned" });
                    }
                }

                // 2. Fetch Appointments
                const q = query(collection(db, "appointments"), where("patientId", "==", currentUser.uid));
                const querySnapshot = await getDocs(q);
                setAppointments(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            }
        }
        fetchData();
    }, [currentUser]);

    const handleBook = async (e) => {
        e.preventDefault();
        const form = e.target;
        const newAppt = {
            patientId: currentUser.uid,
            patientName: currentUser.displayName || "Patient", // Fallback
            date: form.date.value,
            time: form.time.value,
            reason: form.reason.value,
            status: 'upcoming',
            doctorId: linkedDoctor ? linkedDoctor.id : 'general-pool' // If linked, book with specific. Else general.
        };

        await addDoc(collection(db, "appointments"), newAppt);
        setAppointments([...appointments, newAppt]);
        setShowModal(false);
        alert("Appointment Booked!");
    };

    return (
        <div className="fade-in">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-semibold">Appointments</h1>
                <button onClick={() => setShowModal(true)} className="btn btn-primary">
                    <Plus size={18} /> New Appointment
                </button>
            </div>

            {linkedDoctor && (
                <div className="bg-blue-50 text-blue-800 p-4 rounded mb-6 flex items-center gap-3">
                    <User className="text-blue-600" />
                    <div>
                        <p className="font-bold">Linked Doctor: {linkedDoctor.name}</p>
                        <p className="text-sm">Booking will be requested with your primary doctor.</p>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {appointments.map((appt, idx) => (
                    <div key={idx} className="card border-l-4 border-l-blue-500">
                        <div className="flex justify-between items-start mb-2">
                            <h3 className="font-semibold">{appt.reason}</h3>
                            <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded uppercase font-bold">
                                {appt.status}
                            </span>
                        </div>
                        <div className="flex items-center gap-2 text-muted mb-1">
                            <Calendar size={16} /> {appt.date}
                        </div>
                        <div className="flex items-center gap-2 text-muted">
                            <Clock size={16} /> {appt.time}
                        </div>
                    </div>
                ))}
                {appointments.length === 0 && <p className="text-muted col-span-full text-center">No upcoming appointments.</p>}
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg w-full max-w-md">
                        <h2 className="text-xl font-bold mb-4">Book Appointment</h2>
                        <form onSubmit={handleBook}>
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
                                <textarea name="reason" required className="input h-24" placeholder="e.g. Regular Checkup"></textarea>
                            </div>
                            <div className="flex justify-end gap-2 mt-4">
                                <button type="button" onClick={() => setShowModal(false)} className="btn btn-outline">Cancel</button>
                                <button type="submit" className="btn btn-primary">Book Now</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
