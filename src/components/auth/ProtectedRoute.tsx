import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth, type User } from '../../context/AuthContext';
import { usePermissions } from '../../hooks/usePermissions';

interface ProtectedRouteProps {
    allowedRoles: Array<'ADMIN' | 'TEACHER' | 'STUDENT' | 'PARENT' | 'GROUP_ADMIN' | 'SCHOOL_SUPER_ADMIN' | 'SCHOOL_ADMIN' | 'BRANCH_ADMIN' | 'BRANCH_STAFF'>;
}

// Maps a user to the dashboard portal they actually land in — mirrors the
// staff/non-academic-teacher exception already used below for redirects, so
// the Layer 1 (SchoolDashboard) check below is asking about the portal the
// user would actually see, not just their raw role.
function getUserDashboardType(user: User): 'STUDENT' | 'PARENT' | 'TEACHER' | 'STAFF' {
    if (user.role === 'STUDENT') return 'STUDENT';
    if (user.role === 'PARENT') return 'PARENT';
    if (user.role === 'TEACHER') {
        if (user.customRoleId || user.teacherProfile?.staffType === 'NON_ACADEMIC') return 'STAFF';
        return 'TEACHER';
    }
    return 'STAFF'; // ADMIN/SCHOOL_SUPER_ADMIN/SCHOOL_ADMIN/BRANCH_ADMIN/BRANCH_STAFF (GROUP_ADMIN never reaches here)
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
    const { user, isLoading } = useAuth();
    const { hasDashboardAccess } = usePermissions();

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="w-12 h-12 rounded-full border-4 border-brand-green/20 border-t-brand-green animate-spin"></div>
            </div>
        );
    }

    if (!user) {
        // Not logged in -> redirect to login
        return <Navigate to="/portal/login" replace />;
    }

    if (!allowedRoles.includes(user.role)) {
        // Exception: A TEACHER with a customRole or non-academic staffType is allowed into the Admin dashboard
        const isStaffGoingToAdmin = user.role === 'TEACHER' && allowedRoles.includes('ADMIN') && 
            (user.customRoleId || user.teacherProfile?.staffType === 'NON_ACADEMIC');
            
        if (!isStaffGoingToAdmin) {
            // Logged in but wrong role -> redirect based on role
            if (['ADMIN', 'SCHOOL_SUPER_ADMIN', 'SCHOOL_ADMIN', 'BRANCH_ADMIN', 'BRANCH_STAFF'].includes(user.role)) {
                return <Navigate to="/dashboard" replace />;
            }
            if (user.role === 'STUDENT') return <Navigate to="/student" replace />;
            if (user.role === 'TEACHER') {
                if (user.customRoleId || user.teacherProfile?.staffType === 'NON_ACADEMIC') {
                    return <Navigate to="/dashboard" replace />;
                }
                return <Navigate to="/teacher" replace />;
            }
            if (user.role === 'PARENT') return <Navigate to="/parent" replace />;
            return <Navigate to="/portal/login" replace />;
        }
    } else {
        // Logged in and role is technically allowed, BUT we must prevent NON_ACADEMIC from accessing the /teacher portal
        if (user.role === 'TEACHER' && !allowedRoles.includes('ADMIN') && (user.customRoleId || user.teacherProfile?.staffType === 'NON_ACADEMIC')) {
            return <Navigate to="/dashboard" replace />;
        }
    }

    // Layer 1 (SchoolDashboard): even with the right role, the portal itself
    // might be turned off for this school by central admin. GROUP_ADMIN sits
    // outside the per-school dashboard concept entirely, so it's exempt.
    if (user.role !== 'GROUP_ADMIN' && !hasDashboardAccess(getUserDashboardType(user))) {
        return <Navigate to="/portal/login" replace />;
    }

    // Render the nested routes
    return <Outlet />;
};
