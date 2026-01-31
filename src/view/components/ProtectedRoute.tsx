import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store/store.ts';

interface ProtectedRouteProps {
    children: React.ReactNode;
    allowedRoles: string[];
}

export const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
    const { role, token } = useSelector((state: RootState) => state.auth);
    const location = useLocation();

    if (!token) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (role && !allowedRoles.includes(role)) {
        // Redirect to appropriate dashboard or home based on role
        if (role === 'admin') return <Navigate to="/dashboard" replace />;
        if (role === 'driver') return <Navigate to="/dashboard" replace />;
        if (role === 'customer') return <Navigate to="/dashboard" replace />;

        return <Navigate to="/" replace />;
    }

    return children;
};
