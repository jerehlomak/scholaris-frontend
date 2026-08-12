import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { ShieldAlert } from 'lucide-react';

interface PermissionGateProps {
    permissions: string[];
    children: React.ReactNode;
    fallback?: React.ReactNode;
    requireAll?: boolean; // If true, requires ALL permissions. If false (default), requires ANY.
}

export const PermissionGate: React.FC<PermissionGateProps> = ({ 
    permissions, 
    children, 
    fallback = null,
    requireAll = false 
}) => {
    const { user } = useAuth();

    if (!user) return <>{fallback}</>;

    // Unrestricted admins (no custom role assigned) have full access. An
    // assigned custom role always constrains the user, even if their role
    // enum is an admin tier — mirrors usePermissions().isUnrestrictedAdmin
    // and the backend's resolveUserAccess.
    if (!user.customRoleId && ['ADMIN', 'SCHOOL_SUPER_ADMIN', 'SCHOOL_ADMIN'].includes(user.role)) {
        return <>{children}</>;
    }

    // Note: `permissions` here are STAFF-dashboard menu-item keys (e.g. "students.all"),
    // resolved server-side under the three-layer RBAC system. Callers of PermissionGate
    // still pass some pre-RBAC-rewrite keys (e.g. "std_view") that predate this catalog —
    // those checks will resolve to false (fail closed, narrower display) until updated.
    const userPerms = user.permissions || [];
    
    let hasAccess = false;
    if (permissions.length === 0) {
        hasAccess = true;
    } else if (requireAll) {
        hasAccess = permissions.every(p => userPerms.includes(p));
    } else {
        hasAccess = permissions.some(p => userPerms.includes(p));
    }

    if (!hasAccess) {
        return <>{fallback}</>;
    }

    return <>{children}</>;
};

export const PermissionDeniedFallback = () => {
    return (
        <div className="flex flex-col items-center justify-center p-12 text-center bg-gray-50 rounded-2xl border border-gray-100 min-h-[400px]">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mb-6 shadow-sm ring-1 ring-red-100">
                <ShieldAlert className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Access Restricted</h2>
            <p className="text-gray-500 max-w-md">
                You do not have the required permissions to view this module. Please contact your school administrator if you believe this is a mistake.
            </p>
        </div>
    );
};
