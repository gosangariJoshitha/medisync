import { useState, useEffect } from "react";
import { Link2, Save, LogOut } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "../../firebase";

export default function Settings() {
    const { currentUser, logout } = useAuth();
    const [doctorId, setDoctorId] = useState("");
    const [currentDoctor, setCurrentDoctor] = useState(null);

    useEffect(() => {
        async function fetchData() {
            if (currentUser) {
                const snap = await getDoc(doc(db, "users", currentUser.uid));
                if (snap.exists() && snap.data().doctorUid) {
                    setCurrentDoctor(snap.data().doctorUid);
                }
            }
        }
        fetchData();
    }, [currentUser]);

    const handleLink = async (e) => {
        e.preventDefault();
        // In real app, verify doctor ID first
        try {
            await updateDoc(doc(db, "users", currentUser.uid), {
                doctorUid: doctorId,
                role: 'patient', // Ensure role
                riskStatus: 'stable' // Default
            });
            setCurrentDoctor(doctorId);
            alert("Successfully linked to Doctor!");
        } catch (error) {
            console.error(error);
            alert("Failed to link.");
        }
    };

    return (
        <div className="fade-in max-w-2xl mx-auto">
            <h1 className="text-2xl font-semibold mb-6">Settings</h1>

            <div className="card mb-6">
                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                    <Link2 size={20} className="text-primary" /> Doctor Linking
                </h3>

                {currentDoctor ? (
                    <div className="bg-green-50 text-green-800 p-4 rounded border border-green-200">
                        <strong>Linked to Doctor ID:</strong> {currentDoctor}
                        <p className="text-sm mt-1">Contact admin to unlink.</p>
                    </div>
                ) : (
                    <form onSubmit={handleLink}>
                        <p className="text-sm text-muted mb-4">Enter your Doctor's Unique ID to link your account. This will allow them to view your vitals and manage your medicines.</p>
                        <div className="flex gap-2">
                            <input
                                className="input flex-1"
                                placeholder="Enter Doctor ID"
                                value={doctorId}
                                onChange={(e) => setDoctorId(e.target.value)}
                                required
                            />
                            <button className="btn btn-primary">Link Account</button>
                        </div>
                    </form>
                )}
            </div>

            <button onClick={logout} className="btn w-full bg-red-50 text-red-600 hover:bg-red-100 border-red-200">
                <LogOut size={18} className="inline mr-2" /> Logout
            </button>
        </div>
    );
}
