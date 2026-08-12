import { useState, useEffect } from 'react';
import { Navigate, Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
    Building2, LayoutDashboard, LogOut, ShieldCheck,
    Users, Menu, X, ChevronRight, Sun, Moon
} from 'lucide-react';

type GATheme = 'dark' | 'light';

// Theme token helper
const t = (theme: GATheme) => ({
    // Bg
    bg: theme === 'dark' ? '#0f1629' : '#f1f5f9',
    sidebar: theme === 'dark' ? '#080d1a' : '#ffffff',
    header: theme === 'dark' ? 'rgba(15,22,41,0.97)' : 'rgba(255,255,255,0.97)',
    card: theme === 'dark' ? 'rgba(255,255,255,0.03)' : '#ffffff',
    // Text
    textPrimary: theme === 'dark' ? '#f1f5f9' : '#0f172a',
    textMuted: theme === 'dark' ? '#64748b' : '#94a3b8',
    // Border
    border: theme === 'dark' ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.08)',
    // Active nav
    activeNavBg: theme === 'dark'
        ? 'linear-gradient(90deg, rgba(59,130,246,0.2) 0%, rgba(139,92,246,0.08) 100%)'
        : 'linear-gradient(90deg, rgba(59,130,246,0.12) 0%, rgba(139,92,246,0.04) 100%)',
    activeNavColor: '#3b82f6',
    inactiveNavColor: theme === 'dark' ? '#94a3b8' : '#64748b',
    // Hover
    hoverBg: theme === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
});

// Export context so dashboard pages can read it
export let groupAdminTheme: GATheme = 'dark';

const navItems = [
    { path: '/group-admin', icon: LayoutDashboard, label: 'Overview', exact: true },
    { path: '/group-admin/branches', icon: Building2, label: 'Branches' },
    { path: '/group-admin/admins', icon: Users, label: 'School Admins' },
];

export const GroupAdminLayout = () => {
    const { user, isLoading, logout } = useAuth();
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [theme, setTheme] = useState<GATheme>(() =>
        (localStorage.getItem('gaTheme') as GATheme) || 'dark'
    );

    useEffect(() => {
        localStorage.setItem('gaTheme', theme);
        groupAdminTheme = theme;
    }, [theme]);

    const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark');
    const T = t(theme);

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center" style={{ background: T.bg }}>
                <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' }}>
                        <ShieldCheck className="w-6 h-6 text-white" />
                    </div>
                    <div className="w-6 h-6 rounded-full border-2 border-blue-500/30 border-t-blue-500 animate-spin" />
                </div>
            </div>
        );
    }

    if (!user || user.role !== 'GROUP_ADMIN') {
        return <Navigate to="/group-admin/login" replace />;
    }

    const isActive = (path: string, exact?: boolean) =>
        exact ? location.pathname === path : location.pathname.startsWith(path);

    const groupName = (user as any).group?.name || 'My Group';

    const SidebarContent = () => (
        <>
            {/* Logo */}
            <div className="flex items-center gap-3 px-6 py-5 flex-shrink-0"
                style={{ borderBottom: `1px solid ${T.border}` }}>
                <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)' }}>
                    <ShieldCheck className="w-5 h-5 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold truncate" style={{ color: T.textPrimary }}>{groupName}</p>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-blue-500">Group Admin</p>
                </div>
                <button className="md:hidden" style={{ color: T.textMuted }} onClick={() => setSidebarOpen(false)}>
                    <X className="w-4 h-4" />
                </button>
            </div>

            {/* Nav */}
            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                {navItems.map(({ path, icon: Icon, label, exact }) => {
                    const active = isActive(path, exact);
                    return (
                        <Link key={path} to={path}
                            onClick={() => setSidebarOpen(false)}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200"
                            style={active ? {
                                background: T.activeNavBg,
                                borderLeft: `3px solid ${T.activeNavColor}`,
                                color: T.activeNavColor,
                            } : { color: T.inactiveNavColor }}
                        >
                            <Icon className="w-4 h-4 flex-shrink-0" />
                            <span className="flex-1">{label}</span>
                            {active && <ChevronRight className="w-3 h-3" />}
                        </Link>
                    );
                })}
            </nav>

            {/* User Footer */}
            <div className="px-4 py-4 flex-shrink-0" style={{ borderTop: `1px solid ${T.border}` }}>
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                        style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' }}>
                        {user.name?.charAt(0)?.toUpperCase() || 'G'}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate" style={{ color: T.textPrimary }}>{user.name}</p>
                        <p className="text-xs" style={{ color: T.textMuted }}>Group Owner</p>
                    </div>
                </div>
                <button onClick={() => logout()}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors">
                    <LogOut className="w-4 h-4" />
                    Sign out
                </button>
            </div>
        </>
    );

    return (
        <div className="flex h-screen overflow-hidden" style={{ background: T.bg }}>

            {/* Mobile overlay */}
            {sidebarOpen && (
                <div className="fixed inset-0 z-30 bg-black/60 md:hidden"
                    onClick={() => setSidebarOpen(false)} />
            )}

            {/* ── SIDEBAR ── */}
            <aside className={`fixed md:static inset-y-0 left-0 z-40 flex flex-col w-64 h-full transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
                style={{
                    background: T.sidebar,
                    borderRight: `1px solid ${T.border}`,
                    boxShadow: theme === 'light' ? '4px 0 20px rgba(0,0,0,0.06)' : 'none',
                }}>
                <SidebarContent />
            </aside>

            {/* ── MAIN AREA ── */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Top bar */}
                <header className="flex items-center gap-4 px-4 py-3 flex-shrink-0"
                    style={{ background: T.header, borderBottom: `1px solid ${T.border}` }}>
                    <button className="md:hidden transition-colors"
                        style={{ color: T.textMuted }}
                        onClick={() => setSidebarOpen(true)}>
                        <Menu className="w-6 h-6" />
                    </button>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold" style={{ color: T.textPrimary }}>{groupName}</p>
                        <p className="text-xs" style={{ color: T.textMuted }}>Group Administration Portal</p>
                    </div>

                    {/* Theme toggle */}
                    <button onClick={toggleTheme}
                        className="w-8 h-8 flex items-center justify-center rounded-lg transition-all"
                        style={{ background: T.hoverBg }}
                        title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}>
                        {theme === 'dark'
                            ? <Sun className="w-4 h-4 text-amber-400" />
                            : <Moon className="w-4 h-4 text-slate-600" />
                        }
                    </button>

                    <div className="flex items-center gap-2 flex-shrink-0">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                            style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' }}>
                            {user.name?.charAt(0)?.toUpperCase() || 'G'}
                        </div>
                        <span className="text-sm font-medium hidden sm:block" style={{ color: T.textPrimary }}>{user.name}</span>
                    </div>
                </header>

                {/* Page Content — pass theme via data attribute so child pages can style */}
                <main className="flex-1 overflow-y-auto p-4 sm:p-6" data-ga-theme={theme}>
                    <Outlet context={{ theme, T }} />
                </main>
            </div>
        </div>
    );
};
