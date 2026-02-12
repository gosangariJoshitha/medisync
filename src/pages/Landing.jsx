import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, ShieldCheck, Activity, Users } from "lucide-react";

export default function Landing() {
    return (
        <div className="fade-in">
            {/* Hero Section */}
            <section className="container" style={{ padding: '5rem 1.5rem', textAlign: 'center' }}>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <span className="text-sm" style={{
                        color: 'var(--primary)',
                        fontWeight: 600,
                        background: '#EFF6FF',
                        padding: '0.5rem 1rem',
                        borderRadius: '2rem'
                    }}>
                        HEALTHCARE REIMAGINED
                    </span>
                    <h1 style={{
                        fontSize: '3.5rem',
                        fontWeight: 800,
                        marginTop: '1.5rem',
                        marginBottom: '1rem',
                        lineHeight: 1.2
                    }}>
                        Synchronize Your <br />
                        <span style={{ color: 'var(--primary)' }}>Health Journey</span>
                    </h1>
                    <p className="text-muted" style={{ fontSize: '1.25rem', maxWidth: '600px', margin: '0 auto 2rem' }}>
                        A unified platform for patients, doctors, and caretakers to stay connected.
                        Never miss a dose, never miss a beat.
                    </p>
                    <div className="flex justify-center gap-4">
                        <Link to="/register/role-selection" className="btn btn-primary" style={{ padding: '1rem 2rem', fontSize: '1.125rem' }}>
                            Get Started <ArrowRight size={20} />
                        </Link>
                    </div>
                </motion.div>
            </section>

            {/* Features Grid */}
            <section className="container" style={{ paddingBottom: '5rem' }}>
                <div className="grid grid-cols-2 gap-4" style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                    gap: '2rem'
                }}>
                    <FeatureCard
                        icon={<ShieldCheck size={32} />}
                        title="Secure & Reliable"
                        desc="Enterprise-grade security for your personal health data."
                    />
                    <FeatureCard
                        icon={<Users size={32} />}
                        title="Role-Based Access"
                        desc="Dedicated portals for Patients, Doctors, and Caretakers."
                    />
                    <FeatureCard
                        icon={<Activity size={32} />}
                        title="Real-time Sync"
                        desc="Updates are instantly reflected across all connected devices."
                    />
                </div>
            </section>
        </div>
    );
}

function FeatureCard({ icon, title, desc }) {
    return (
        <motion.div
            className="card"
            whileHover={{ y: -5 }}
            style={{ textAlign: 'center', padding: '3rem 2rem' }}
        >
            <div style={{
                color: 'var(--primary)',
                background: '#EFF6FF',
                width: '4rem',
                height: '4rem',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.5rem'
            }}>
                {icon}
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>{title}</h3>
            <p className="text-muted">{desc}</p>
        </motion.div>
    );
}
