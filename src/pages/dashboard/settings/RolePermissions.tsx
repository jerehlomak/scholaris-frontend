import { useState, useEffect } from 'react';
import { ShieldCheck, ShieldAlert, Plus, Trash2, Check, Loader2, Info } from 'lucide-react';
import axios from 'axios';
import { SettingsShell } from './shared/SettingsShell';
import { SettingsHero } from './shared/SettingsHero';
import { SaveButton } from './shared/SaveButton';
import { cn } from '../../../lib/utils';
import { toast } from 'sonner';

// One tickable menu item within a module (from the subscribed Permission catalog).
interface CatalogPermission {
    id: string;
    key: string;
    label: string;
}

// { "Result Management": [...], "Finance": [...] } — only what this school is subscribed to.
type PermissionCatalog = Record<string, CatalogPermission[]>;

interface RolePermissionRow {
    permissionId: string;
    permission?: CatalogPermission;
}

interface Role {
    id: string;
    name: string;
    description: string;
    isSystemDefault: boolean;
    rolePermissions: RolePermissionRow[];
}

export function RolePermissions() {
    const [roles, setRoles] = useState<Role[]>([]);
    const [catalog, setCatalog] = useState<PermissionCatalog>({});
    const [activeRoleId, setActiveRoleId] = useState<string>('');
    // Locally-edited set of granted permission IDs for the active role.
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [saved, setSaved] = useState(false);
    const [loading, setLoading] = useState(true);

    const selectRole = (role: Role) => {
        setActiveRoleId(role.id);
        setSelectedIds(new Set(role.rolePermissions.map(rp => rp.permissionId)));
        setSaved(false);
    };

    useEffect(() => {
        const fetchAll = async () => {
            try {
                const [rolesRes, catalogRes] = await Promise.all([
                    axios.get('/api/v1/roles', { withCredentials: true }),
                    axios.get('/api/v1/roles/permissions', { withCredentials: true }),
                ]);
                const fetched: Role[] = rolesRes.data.roles;
                setCatalog(catalogRes.data.permissions || {});
                setRoles(fetched);
                if (fetched.length > 0) selectRole(fetched[0]);
            } catch { /* silent */ }
            finally { setLoading(false); }
        };
        fetchAll();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const activeRole = roles.find(r => r.id === activeRoleId);
    const catalogEntries = Object.entries(catalog);
    const totalCatalogCount = catalogEntries.reduce((sum, [, items]) => sum + items.length, 0);

    const handleAddRole = async () => {
        setSaved(false);
        try {
            const defaultName = `New Custom Role ${Math.floor(1000 + Math.random() * 9000)}`;
            const res = await axios.post('/api/v1/roles', { name: defaultName, description: '', permissionIds: [] }, { withCredentials: true });
            const role: Role = res.data.role;
            setRoles(prev => [...prev, role]);
            selectRole(role);
        } catch (e: any) {
            toast.error(e.response?.data?.msg || 'Failed to create role');
        }
    };

    const handleUpdateField = (field: 'name' | 'description', value: string) => {
        if (!activeRole || activeRole.isSystemDefault) return;
        setSaved(false);
        setRoles(prev => prev.map(r => r.id === activeRoleId ? { ...r, [field]: value } : r));
    };

    const handleDeleteRole = async (id: string) => {
        const role = roles.find(r => r.id === id);
        if (role?.isSystemDefault) return;
        setSaved(false);
        try {
            await axios.delete(`/api/v1/roles/${id}`, { withCredentials: true });
            const updated = roles.filter(r => r.id !== id);
            setRoles(updated);
            if (activeRoleId === id) {
                if (updated.length > 0) selectRole(updated[0]);
                else { setActiveRoleId(''); setSelectedIds(new Set()); }
            }
        } catch { /* silent */ }
    };

    const togglePermission = (permId: string) => {
        if (!activeRole || activeRole.isSystemDefault) return;
        setSaved(false);
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(permId)) next.delete(permId);
            else next.add(permId);
            return next;
        });
    };

    const toggleModule = (items: CatalogPermission[]) => {
        if (!activeRole || activeRole.isSystemDefault) return;
        setSaved(false);
        const allChecked = items.every(it => selectedIds.has(it.id));
        setSelectedIds(prev => {
            const next = new Set(prev);
            for (const it of items) {
                if (allChecked) next.delete(it.id);
                else next.add(it.id);
            }
            return next;
        });
    };

    const handleSave = async () => {
        if (!activeRole || activeRole.isSystemDefault) return;
        try {
            const permissionIds = Array.from(selectedIds);
            const res = await axios.put(`/api/v1/roles/${activeRole.id}`,
                { name: activeRole.name, description: activeRole.description, permissionIds },
                { withCredentials: true });
            // Sync the saved role's rolePermissions from the server response.
            const updated: Role = res.data.role;
            setRoles(prev => prev.map(r => r.id === activeRole.id ? updated : r));
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (e: any) {
            toast.error(e.response?.data?.msg || 'Failed to save changes');
        }
    };

    if (loading) {
        return <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-[#1E4DA6]" /></div>;
    }

    const inputCls = 'w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 outline-none focus:border-[#1E4DA6]/60 focus:ring-2 focus:ring-[#1E4DA6]/10';

    return (
        <SettingsShell breadcrumbParent="Access Control" breadcrumbCurrent="Roles & Permissions" tabLabel="Access Control (RBAC)" tabIcon={<ShieldCheck className="h-3.5 w-3.5" />}>
            <SettingsHero
                icon={<ShieldCheck className="h-7 w-7" />}
                title="Staff Roles & Permissions"
                subtitle="Define what each staff role can see and do across the system. Create custom roles for granular access control."
            />

            <div className="flex flex-col md:flex-row gap-8 min-h-[500px]">
                {/* Role list sidebar */}
                <div className="w-full md:w-64 shrink-0 flex flex-col gap-3">
                    <h3 className="font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400">Staff Roles</h3>
                    <div className="space-y-2">
                        {roles.map(role => (
                            <button
                                key={role.id}
                                onClick={() => selectRole(role)}
                                className={cn(
                                    'w-full rounded-xl border-2 p-3 text-left transition-all',
                                    activeRoleId === role.id ? 'border-[#1E4DA6]/20 bg-[#1E4DA6]/8 shadow-sm' : 'border-transparent bg-slate-50/60 hover:bg-slate-100/60'
                                )}
                            >
                                <div className="flex items-center justify-between">
                                    <span className={cn('text-sm font-bold', activeRoleId === role.id ? 'text-[#173F8C]' : 'text-slate-700')}>{role.name}</span>
                                    {role.isSystemDefault && <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[9px] font-bold uppercase text-slate-500">System</span>}
                                </div>
                                <p className="mt-0.5 text-xs text-slate-400">{role.rolePermissions.length} permissions</p>
                            </button>
                        ))}
                    </div>
                    <button
                        onClick={handleAddRole}
                        className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#1E4DA6]/20 py-3 text-sm font-semibold text-[#1E4DA6] hover:bg-[#1E4DA6]/5 transition-colors mt-2"
                    >
                        <Plus className="h-4 w-4" /> Create Custom Role
                    </button>
                </div>

                {/* Right: permission config */}
                <div className="flex-1">
                    {activeRole ? (
                        <div className="space-y-6">
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 space-y-3">
                                    <div>
                                        <label className="font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400">Role Name</label>
                                        <input className={inputCls + ' mt-1 text-lg font-black'} value={activeRole.name} onChange={e => handleUpdateField('name', e.target.value)} disabled={activeRole.isSystemDefault} />
                                    </div>
                                    <div>
                                        <label className="font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400">Description</label>
                                        <input className={inputCls + ' mt-1'} value={activeRole.description} onChange={e => handleUpdateField('description', e.target.value)} placeholder="Brief description of responsibilities..." disabled={activeRole.isSystemDefault} />
                                    </div>
                                </div>
                                {!activeRole.isSystemDefault && (
                                    <button onClick={() => handleDeleteRole(activeRole.id)} className="mt-6 flex items-center gap-1.5 rounded-xl px-3 py-2.5 text-sm font-semibold text-red-500 hover:bg-red-50 transition-colors shrink-0">
                                        <Trash2 className="h-4 w-4" /> Delete
                                    </button>
                                )}
                            </div>

                            {activeRole.isSystemDefault && (
                                <div className="flex items-start gap-3 rounded-2xl border border-[#1E4DA6]/10 bg-[#1E4DA6]/8 p-4">
                                    <ShieldAlert className="h-5 w-5 text-[#1E4DA6] mt-0.5 shrink-0" />
                                    <div>
                                        <h4 className="font-bold text-[#173F8C] text-sm">System Role — Read Only</h4>
                                        <p className="text-xs text-[#1E4DA6]/80 mt-0.5">Core system roles cannot be modified. Create a custom role for specific variations.</p>
                                    </div>
                                </div>
                            )}

                            {/* Permission modules — driven by the subscribed catalog */}
                            <div>
                                <h3 className="font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-4">Menu Access Checklist</h3>

                                {totalCatalogCount === 0 ? (
                                    <div className="flex items-start gap-3 rounded-2xl border border-amber-100 bg-amber-50/60 p-4">
                                        <Info className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
                                        <div>
                                            <h4 className="font-bold text-amber-700 text-sm">No menu items available yet</h4>
                                            <p className="text-xs text-amber-600/80 mt-0.5">Your school isn't subscribed to any menu items yet. Contact platform support to enable the modules your plan includes, then they'll appear here to assign to roles.</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {catalogEntries.map(([moduleName, items]) => {
                                            const allChecked = items.every(it => selectedIds.has(it.id));
                                            const someChecked = items.some(it => selectedIds.has(it.id));
                                            return (
                                                <div key={moduleName} className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
                                                    <div className="mb-3 flex items-center justify-between">
                                                        <h4 className="font-bold text-slate-700 text-sm">{moduleName}</h4>
                                                        {!activeRole.isSystemDefault && (
                                                            <button
                                                                onClick={() => toggleModule(items)}
                                                                className="text-[11px] font-semibold text-[#1E4DA6] hover:text-[#173F8C]"
                                                            >
                                                                {allChecked ? 'Clear all' : 'Select all'}
                                                            </button>
                                                        )}
                                                    </div>
                                                    <div className="space-y-2.5">
                                                        {items.map(perm => {
                                                            const isChecked = selectedIds.has(perm.id);
                                                            return (
                                                                <div
                                                                    key={perm.id}
                                                                    onClick={() => togglePermission(perm.id)}
                                                                    className={cn('flex items-center gap-3 rounded-lg p-2 transition-colors select-none', activeRole.isSystemDefault ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:bg-white')}
                                                                >
                                                                    <div className={cn('flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors', isChecked ? 'border-[#1E4DA6] bg-[#1E4DA6] text-white' : 'border-slate-300 bg-white')}>
                                                                        {isChecked && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
                                                                    </div>
                                                                    <span className={cn('text-sm', isChecked ? 'font-semibold text-slate-800' : 'text-slate-500')}>{perm.label}</span>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                    {someChecked && !allChecked && (
                                                        <p className="mt-2 text-[11px] text-slate-400">{items.filter(it => selectedIds.has(it.id)).length}/{items.length} selected</p>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {!activeRole.isSystemDefault && totalCatalogCount > 0 && (
                                <div className="border-t border-slate-100 pt-6">
                                    <SaveButton onClick={handleSave} saved={saved} saveLabel="Save Access Rules" savedLabel="Permissions Saved!" />
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-slate-400">
                            <ShieldCheck className="h-10 w-10 opacity-30" />
                            <p className="text-sm font-medium text-slate-500">No roles yet</p>
                            <p className="text-xs max-w-xs">Create a custom role, then tick the menus each role should be able to access. Staff are assigned a role from the Add / Edit Staff form.</p>
                        </div>
                    )}
                </div>
            </div>
        </SettingsShell>
    );
}
