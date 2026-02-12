import { Outlet, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { LogOut, Activity } from "lucide-react";

export default function Layout() {
    const { currentUser, logout } = useAuth();
    const navigate = useNavigate();

    async function handleLogout() {
        try {
            await logout();
            navigate("/login");
        } catch (error) {
            console.error("Failed to log out", error);
        }
    }

    return (
        <div className="min-h-screen flex flex-col">
            <nav className="border-b" style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}>
                <div className="container flex items-center justify-between" style={{ height: '4rem' }}>
                    <Link to="/" className="flex items-center gap-2" style={{ textDecoration: 'none' }}>
                        <Activity className="h-6 w-6" style={{ color: 'var(--primary)' }} />
                        <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--primary-dark)' }}>MediSync</span>
                    </Link>

                    <div>
                        {currentUser ? (
                            <button onClick={handleLogout} className="btn btn-outline">
                                <LogOut size={18} />
                                Logout
                            </button>
                        ) : (
                            <Link to="/login" className="btn btn-primary">
                                Login
                            </Link>
                        )}
                    </div>
                </div>
            </nav>

            <main style={{ flex: 1 }}>
                <Outlet />
            </main>
        </div>
    );
}
