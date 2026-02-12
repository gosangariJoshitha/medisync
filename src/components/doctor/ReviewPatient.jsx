import { ArrowLeft, CheckCircle, Save } from "lucide-react";

export default function ReviewPatient({ patientData, medicines, onBack, onFinish, loading }) {
    return (
        <div className="fade-in">
            <h2 className="text-xl font-semibold mb-6">Step 3: Review & Finalize</h2>

            <div className="grid grid-cols-2 gap-6 mb-8">
                <div>
                    <h3 className="text-primary font-semibold mb-2">Patient Profile</h3>
                    <div className="bg-gray-50 p-4 rounded border">
                        <p><strong>Name:</strong> {patientData.fullName}</p>
                        <p><strong>ID:</strong> {patientData.patientId}</p>
                        <p><strong>Age:</strong> {patientData.age} / {patientData.gender}</p>
                        <p><strong>Phone:</strong> {patientData.phone}</p>
                        {patientData.caretakerName && (
                            <div className="mt-2 pt-2 border-t text-sm">
                                <p><strong>Caretaker:</strong> {patientData.caretakerName}</p>
                                <p><strong>Ph:</strong> {patientData.caretakerPhone}</p>
                            </div>
                        )}
                    </div>
                </div>
                <div>
                    <h3 className="text-primary font-semibold mb-2">Prescription Summary</h3>
                    <div className="bg-gray-50 p-4 rounded border max-h-48 overflow-y-auto">
                        {medicines.map((med, i) => (
                            <div key={i} className="mb-2 pb-2 border-b last:border-0 last:pb-0">
                                <p className="font-semibold">{med.name}</p>
                                <p className="text-sm text-muted">{med.frequency} | {med.duration} Days</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="text-center p-4 bg-yellow-50 rounded mb-6 text-sm text-yellow-800">
                <p>By clicking Finish, an account will be created for <strong>{patientData.fullName}</strong> with ID <strong>{patientData.patientId}</strong>.</p>
                <p>The patient uses this ID as their password for their first login.</p>
            </div>

            <div className="flex justify-between">
                <button onClick={onBack} disabled={loading} className="btn btn-outline">
                    <ArrowLeft size={18} /> Back
                </button>
                <button onClick={onFinish} disabled={loading} className="btn btn-primary px-8">
                    {loading ? "Creating Account..." : (
                        <>Finish & Add Patient <Save size={18} /></>
                    )}
                </button>
            </div>
        </div>
    );
}
