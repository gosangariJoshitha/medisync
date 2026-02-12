import { useAuth } from "../contexts/AuthContext";

export default function DashboardCaretaker() {
    const { currentUser } = useAuth();

    return (
        <div className="container fade-in" style={{ padding: '2rem 1.5rem' }}>
            <h1 className="text-2xl mb-4">Caretaker Dashboard</h1>
            <div className="card">
                <p>Welcome. You can monitor assigned patients from here.</p>
                <div style={{ marginTop: '1rem', padding: '1rem', background: '#FFF7ED', borderRadius: '0.5rem', color: '#9A3412' }}>
                    Configured for: {currentUser?.email}
                </div>
            </div>
        </div>
    );
}
