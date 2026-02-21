import { Outlet, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { LogOut, Activity, User, Settings, QrCode } from "lucide-react";
import { useState } from "react";

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

    const [showMenu, setShowMenu] = useState(false);

    return (
        <div className="min-h-screen flex flex-col">
            <nav className="border-b" style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}>
                <div className="container flex items-center justify-between" style={{ height: '4rem' }}>
                    <Link to="/" className="flex items-center gap-2" style={{ textDecoration: 'none' }}>
                        <Activity className="h-6 w-6" style={{ color: 'var(--primary)' }} />
                        <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--primary-dark)' }}>MediSync</span>
                    </Link>

                    <div className="relative">
                        {currentUser ? (
                            <>
                                <button onClick={() => setShowMenu(!showMenu)} className="flex items-center gap-2 border rounded px-3 py-1">
                                    <User size={18} />
                                    <span style={{ fontWeight: 600 }}>{currentUser.displayName || currentUser.email}</span>
                                </button>
                                {showMenu && (
                                    <div className="absolute right-0 mt-2 w-56 bg-white border rounded shadow-lg z-50 p-3">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                                                {currentUser.displayName ? currentUser.displayName.charAt(0).toUpperCase() : <User />}
                                            </div>
                                            <div>
                                                <div className="font-semibold">{currentUser.displayName || currentUser.email}</div>
                                                <div className="text-xs text-gray-500">{currentUser.email}</div>
                                            </div>
                                        </div>
                                        <div className="mb-2">
                                            <img src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${currentUser.uid}`} alt="QR" className="w-24 h-24 mx-auto" />
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <Link to="/dashboard/patient/settings" onClick={() => setShowMenu(false)} className="btn btn-ghost justify-start">
                                                <Settings size={16} className="mr-2" /> Settings
                                            </Link>
                                            <button className="btn btn-ghost justify-start" onClick={handleLogout}>
                                                <LogOut size={16} className="mr-2" /> Logout
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </>
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
