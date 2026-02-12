import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, FileText, Bell, User, Settings, Phone } from "lucide-react";

export default function CaretakerSidebar() {
    const location = useLocation();
    const isActive = (path) => location.pathname === path;

    const menuItems = [
        { path: "/dashboard/caretaker", icon: <LayoutDashboard size={20} />, label: "Dashboard" },
        { path: "/dashboard/caretaker/reports", icon: <FileText size={20} />, label: "Reports" },
        { path: "/dashboard/caretaker/notifications", icon: <Bell size={20} />, label: "Notifications" },
        { path: "/dashboard/caretaker/contact-doctor", icon: <Phone size={20} />, label: "Contact Doctor" },
        { path: "/dashboard/caretaker/settings", icon: <Settings size={20} />, label: "Settings" },
    ];

    return (
        <aside style={{
            width: '250px',
            backgroundColor: 'var(--surface)',
            borderRight: '1px solid var(--border)',
            display: 'flex',
            flexDirection: 'column',
            padding: '1.5rem 1rem'
        }}>
            <div style={{ marginBottom: '2rem', paddingLeft: '1rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--primary)' }}>MediSync</h2>
                <p className="text-sm text-muted">Guardian Portal</p>
            </div>

            <nav className="flex flex-col gap-2">
                {menuItems.map((item) => (
                    <Link
                        key={item.path}
                        to={item.path}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            padding: '0.75rem 1rem',
                            borderRadius: '0.5rem',
                            color: isActive(item.path) ? 'var(--primary)' : 'var(--text-muted)',
                            backgroundColor: isActive(item.path) ? '#EFF6FF' : 'transparent',
                            fontWeight: isActive(item.path) ? 600 : 500,
                            transition: 'all 0.2s'
                        }}
                    >
                        {item.icon}
                        <span>{item.label}</span>
                    </Link>
                ))}
            </nav>

            <div className="mt-auto p-4 bg-blue-50 rounded-lg">
                <p className="text-xs text-blue-800 font-semibold mb-2">Guardian Tips</p>
                <p className="text-xs text-blue-600">Ensure your linked patients have their emergency contacts updated.</p>
            </div>
        </aside>
    );
}
