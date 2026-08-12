/**
 * PrivateRoute.tsx
 * Redirects unauthenticated users to /login.
 * Reads `skooly_auth` from localStorage (will be replaced with real token check post-backend).
 */
import { Navigate, useLocation } from 'react-router-dom';

interface PrivateRouteProps {
    children: React.ReactNode;
    /** Optional: role restriction e.g. 'admin' | 'teacher' | 'student' | 'parent' */
    role?: string;
}

export default function PrivateRoute({ children }: PrivateRouteProps) {
    const location = useLocation();

    // --- TEMPORARY pre-backend auth check ---
    // Replace with real JWT/session validation once the backend is ready.
    const isAuthenticated = !!localStorage.getItem('skooly_auth');

    if (!isAuthenticated) {
        // Preserve the attempted path so we can redirect back after login
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return <>{children}</>;
}
