import { useState } from "react";
import { ArrowRight, ArrowLeft, Plus, Trash2, Camera, Clock } from "lucide-react";

export default function MedicineForm({ medicines, setMedicines, onBack, onNext }) {
    const [showScanner, setShowScanner] = useState(false);
    const [newMed, setNewMed] = useState({
        name: "",
        type: "Tablet",
        dosage: "1",
        frequency: "Twice Daily",
        timing: "After Meal",
        duration: "10",
        alertQuantity: "5"
    });

    const handleAddKey = (e) => {
        setNewMed({ ...newMed, [e.target.name]: e.target.value });
    }

    const addMedicine = () => {
        if (!newMed.name) return alert("Medicine Name is required");
        setMedicines([...medicines, { ...newMed, id: Date.now() }]);
        setNewMed({
            name: "",
            type: "Tablet",
            dosage: "1",
            frequency: "Twice Daily",
            timing: "After Meal",
            duration: "10",
            alertQuantity: "5"
        });
    };

    const removeMedicine = (id) => {
        setMedicines(medicines.filter(m => m.id !== id));
    };

    const mockScan = () => {
        setShowScanner(true);
        setTimeout(() => {
            setNewMed({
                name: "Paracetamol 500mg",
                type: "Tablet",
                dosage: "1",
                frequency: "SOS",
                timing: "After Meal",
                duration: "5",
                alertQuantity: "2"
            });
            setShowScanner(false);
            alert("Scanned Prescription Successfully!");
        }, 2000);
    };

    return (
        <div className="fade-in">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">Step 2: Medicine Management</h2>
                <button type="button" onClick={mockScan} className="btn btn-outline" style={{ borderColor: 'var(--primary)', color: 'var(--primary)' }}>
                    <Camera size={18} /> OCR Scanner
                </button>
            </div>

            {showScanner && (
                <div className="mb-6 p-4 bg-gray-100 rounded text-center animate-pulse">
                    Running OCR Analysis on Prescription...
                </div>
            )}

            {/* Add New Medicine Form */}
            <div className="p-4 bg-blue-50 rounded-lg mb-6" style={{ border: '1px solid #BFDBFE' }}>
                <h3 className="font-semibold mb-4 text-primary">Add New Medicine</h3>
                <div className="grid grid-cols-2 gap-4 mb-4">
                    <input name="name" value={newMed.name} onChange={handleAddKey} className="input" placeholder="Medicine Name" />
                    <select name="type" value={newMed.type} onChange={handleAddKey} className="input">
                        <option>Tablet</option>
                        <option>Capsule</option>
                        <option>Syrup</option>
                        <option>Injection</option>
                    </select>
                </div>
                <div className="grid grid-cols-4 gap-4 mb-4">
                    <input name="dosage" value={newMed.dosage} onChange={handleAddKey} className="input" placeholder="Dose (e.g. 1)" />
                    <select name="frequency" value={newMed.frequency} onChange={handleAddKey} className="input">
                        <option>Once Daily</option>
                        <option>Twice Daily</option>
                        <option>Thrice Daily</option>
                        <option>SOS</option>
                    </select>
                    <select name="timing" value={newMed.timing} onChange={handleAddKey} className="input">
                        <option>Before Meal</option>
                        <option>After Meal</option>
                    </select>
                    <input name="duration" value={newMed.duration} onChange={handleAddKey} className="input" placeholder="Days" />
                </div>
                <button onClick={addMedicine} className="btn btn-primary w-full">
                    <Plus size={18} /> Add to List
                </button>
            </div>

            {/* Medicine List */}
            <div className="mb-6">
                <h3 className="font-semibold mb-2">Prescribed Medicines ({medicines.length})</h3>
                {medicines.length === 0 && <p className="text-muted text-sm italic">No medicines added yet.</p>}
                <div className="flex flex-col gap-2">
                    {medicines.map(med => (
                        <div key={med.id} className="flex justify-between items-center p-3 bg-white border rounded shadow-sm">
                            <div>
                                <p className="font-semibold">{med.name} <span className="text-xs bg-gray-100 px-2 py-1 rounded text-muted">{med.type}</span></p>
                                <div className="flex gap-4 text-sm text-muted mt-1">
                                    <span className="flex items-center gap-1"><Clock size={12} /> {med.frequency}</span>
                                    <span>{med.dosage} Tablet(s) - {med.timing}</span>
                                    <span>{med.duration} Days</span>
                                </div>
                            </div>
                            <button onClick={() => removeMedicine(med.id)} className="text-red-500 hover:bg-red-50 p-2 rounded">
                                <Trash2 size={18} />
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex justify-between">
                <button onClick={onBack} className="btn btn-outline">
                    <ArrowLeft size={18} /> Back
                </button>
                <button onClick={onNext} className="btn btn-primary" disabled={medicines.length === 0}>
                    Next <ArrowRight size={18} />
                </button>
            </div>
        </div>
    );
}
