// Mirrors the backend's Permission.key derivation exactly
// (backend/scripts/seed-permissions.js `deriveKey`) so the client can check
// "does the current user have this menu item's permission" without needing a
// stored key on every menu.tsx node — it's a pure function of the route path.
export function derivePermissionKey(path: string): string {
    if (path === '/dashboard') return 'dashboard';
    const stripped = path.startsWith('/dashboard/')
        ? path.slice('/dashboard/'.length)
        : path.replace(/^\//, '');
    return stripped.replace(/\//g, '.');
}

type MenuNode = {
    path?: string;
    roles?: string[];
    formTeacherOnly?: boolean;
    children?: MenuNode[];
};

export interface MenuFilterContext {
    role: string;
    isFormTeacher: boolean;
    hasPermission: (key: string) => boolean;
}

function isNodeAllowed(item: MenuNode, ctx: MenuFilterContext): boolean {
    // `roles`/`formTeacherOnly` are branch-scoping and role-identity boundaries
    // (e.g. "hidden from branch users"), not feature access — they stay as hard
    // gates independent of the subscription/role-permission system below, so a
    // school admin ticking a custom role can't accidentally expose school-wide
    // settings to branch-scoped staff.
    if (item.roles && !item.roles.includes(ctx.role)) return false;
    if (item.formTeacherOnly && ctx.role === 'TEACHER' && !ctx.isFormTeacher) return false;
    return true;
}

/**
 * Recursively filters a menu tree against both the hard role/form-teacher
 * gates above and the resolved three-layer RBAC permission set. A leaf node
 * (has a `path`) is kept if it passes the hard gates AND
 * `hasPermission(derivePermissionKey(path))`. A group node (has `children`,
 * no `path`) is kept if it passes its own hard gates AND filtering its
 * children leaves at least one surviving node — group visibility is always
 * derived from its children for the permission layer, it has no Permission
 * row of its own.
 */
export function filterMenuTree<T extends MenuNode>(items: T[], ctx: MenuFilterContext): T[] {
    const result: T[] = [];
    for (const item of items) {
        if (!isNodeAllowed(item, ctx)) continue;
        if (item.children) {
            const filteredChildren = filterMenuTree(item.children, ctx);
            if (filteredChildren.length > 0) {
                result.push({ ...item, children: filteredChildren });
            }
        } else if (item.path) {
            if (ctx.hasPermission(derivePermissionKey(item.path))) {
                result.push(item);
            }
        } else {
            result.push(item);
        }
    }
    return result;
}

/**
 * Depth-first search for the first navigable `path` in an already-filtered
 * menu tree (e.g. the output of `filterMenuTree`). Used to redirect a
 * restricted user to the first menu item their role actually grants, instead
 * of a generic dashboard home they may not have permission to view.
 */
export function findFirstPath(items: MenuNode[]): string | null {
    for (const item of items) {
        if (item.path) return item.path;
        if (item.children) {
            const found = findFirstPath(item.children);
            if (found) return found;
        }
    }
    return null;
}
