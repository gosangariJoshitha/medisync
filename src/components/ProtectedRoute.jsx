import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function ProtectedRoute({ children, allowedRoles }) {
    const { currentUser, userRole, loading } = useAuth();

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
    }

    if (!currentUser) {
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles && !allowedRoles.includes(userRole)) {
        // If user has role but tries to access wrong dashboard, redirect to their own dashboard
        if (userRole === 'patient') return <Navigate to="/dashboard/patient" replace />;
        if (userRole === 'doctor') return <Navigate to="/dashboard/doctor" replace />;
        if (userRole === 'caretaker') return <Navigate to="/dashboard/caretaker" replace />;

        return <Navigate to="/" replace />;
    }

    return children;
}
