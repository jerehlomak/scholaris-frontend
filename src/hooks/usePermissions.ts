import { useAuth } from '../context/AuthContext';
import { derivePermissionKey } from '../utils/permissions';

type DashboardType = 'STUDENT' | 'PARENT' | 'TEACHER' | 'STAFF';

/**
 * Reads the resolved three-layer RBAC access already attached to the logged-in
 * user (see AuthContext's `permissions`/`enabledDashboards`, populated by the
 * backend's resolveUserAccess). Pure lookups — no fetching of its own.
 */
export function usePermissions() {
    const { user } = useAuth();

    // The single source of truth for "is this user a true, unrestricted admin"
    // (sees everything, no menu filtering) vs. "restricted to their assigned
    // role's ticked permissions" — regardless of staffType. Mirrors the exact
    // bypass condition in the backend's resolveUserAccess.
    const isUnrestrictedAdmin = !!user && !user.customRoleId && ['ADMIN', 'SCHOOL_SUPER_ADMIN', 'SCHOOL_ADMIN'].includes(user.role);

    const hasPermission = (key: string): boolean => {
        if (!user) return false;
        if (isUnrestrictedAdmin) return true;
        return (user.permissions || []).includes(key);
    };

    const hasPermissionForPath = (path: string): boolean => hasPermission(derivePermissionKey(path));

    const hasDashboardAccess = (dashboardType: DashboardType): boolean => {
        if (!user) return false;
        // No enabledDashboards on the payload yet (e.g. stale session before this
        // field existed) defaults to allowed, matching the backend's own default.
        if (!user.enabledDashboards) return true;
        return user.enabledDashboards.includes(dashboardType);
    };

    return { hasPermission, hasPermissionForPath, hasDashboardAccess, isUnrestrictedAdmin };
}
