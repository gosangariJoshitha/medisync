import { useAuth } from "../contexts/AuthContext";

export default function DashboardPatient() {
    const { currentUser } = useAuth();

    return (
        <div className="container fade-in" style={{ padding: '2rem 1.5rem' }}>
            <h1 className="text-2xl mb-4">Patient Dashboard</h1>
            <div className="card">
                <p>Welcome. Your daily dose schedule and doctor communications will appear here.</p>
                <div style={{ marginTop: '1rem', padding: '1rem', background: '#EFF6FF', borderRadius: '0.5rem', color: '#1E40AF' }}>
                    Configured for: {currentUser?.email}
                </div>
            </div>
        </div>
    );
}
