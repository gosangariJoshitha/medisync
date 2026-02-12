import { useAuth } from "../contexts/AuthContext";

export default function DashboardDoctor() {
    const { currentUser } = useAuth();

    return (
        <div className="container fade-in" style={{ padding: '2rem 1.5rem' }}>
            <h1 className="text-2xl mb-4">Doctor Dashboard</h1>
            <div className="card">
                <p>Welcome, Doctor. Access to patient records and prescription management will appear here.</p>
                <div style={{ marginTop: '1rem', padding: '1rem', background: '#F0FDFA', borderRadius: '0.5rem', color: '#0F766E' }}>
                    Configured for: {currentUser?.email}
                </div>
            </div>
        </div>
    );
}
