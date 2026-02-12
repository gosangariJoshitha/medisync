import { Link, useLocation } from "react-router-dom";
import { Home, Pill, Activity, BarChart2, Award, Calendar, Settings } from "lucide-react";

export default function PatientSidebar() {
    const location = useLocation();
    const isActive = (path) => location.pathname === path;

    const menuItems = [
        { path: "/dashboard/patient", icon: <Home size={20} />, label: "Home" },
        { path: "/dashboard/patient/medicines", icon: <Pill size={20} />, label: "Medicines" },
        { path: "/dashboard/patient/vitals", icon: <Activity size={20} />, label: "Health Vitals" },
        { path: "/dashboard/patient/analytics", icon: <BarChart2 size={20} />, label: "Analytics & Rewards" },
        { path: "/dashboard/patient/appointments", icon: <Calendar size={20} />, label: "Appointments" },
        { path: "/dashboard/patient/settings", icon: <Settings size={20} />, label: "Settings" },
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
                <p className="text-sm text-muted">Patient Portal</p>
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
        </aside>
    );
}
