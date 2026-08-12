import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
    Menu, Settings,
    LayoutDashboard, BookOpen, Users,
    ClipboardList, Calendar, FileText, Bell,
    ChevronRight, MessageSquare, Video, ClipboardCheck, LayoutTemplate,
    LogOut, Scan, GraduationCap, X, Banknote
} from 'lucide-react';
import { cn } from '../../lib/utils';
import logo from '../../assets/SkcoolyPlus.png';
import { useAuth } from '../../context/AuthContext';
import { ProfileSettingsModal } from '../shared/ProfileSettingsModal';
import { Badge } from '../ui/badge';

// ─── Nav Config ──────────────────────────────────────────────────────────────
const NAV_GROUPS = [
    {
        label: 'Teaching',
        items: [
            { title: 'Dashboard', path: '/teacher', icon: LayoutDashboard, exact: true },
            { title: 'My Classes', path: '/teacher/classes', icon: Users },
            { title: 'Subjects', path: '/teacher/subjects', icon: BookOpen },
            { title: 'Assignments', path: '/teacher/assignments', icon: ClipboardList },
            { title: 'Attendance', path: '/teacher/attendance', icon: Calendar, exact: true },
            { title: 'Scanner Terminal', path: '/teacher/attendance/scanner', icon: Scan },
            { title: 'Results', path: '/teacher/results', icon: FileText },
        ]
    },
    {
        label: 'Tools & Finance',
        items: [
            { title: 'LMS Hub', path: '/teacher/lms', icon: LayoutTemplate },
            { title: 'CBT Manager', path: '/teacher/cbt', icon: ClipboardCheck },
            { title: 'Live Class', path: '/teacher/live-class', icon: Video },
            { title: 'Messaging', path: '/teacher/messaging', icon: MessageSquare },
            { title: 'My Payroll & Payslips', path: '/teacher/payroll', icon: Banknote },
        ]
    }
];

// Route → display title map for the topbar
const ROUTE_TITLES: Record<string, string> = {
    '/teacher': 'Dashboard',
    '/teacher/classes': 'My Classes',
    '/teacher/subjects': 'Subjects',
    '/teacher/assignments': 'Assignments',
    '/teacher/attendance': 'Attendance',
    '/teacher/attendance/scanner': 'Scanner Terminal',
    '/teacher/results': 'Results',
    '/teacher/lms': 'LMS Hub',
    '/teacher/cbt': 'CBT Manager',
    '/teacher/cbt/create': 'Create Exam',
    '/teacher/live-class': 'Live Class',
    '/teacher/messaging': 'Messaging',
    '/teacher/payroll': 'My Payroll & Payslips',
};

function getPageTitle(pathname: string): string {
    if (ROUTE_TITLES[pathname]) return ROUTE_TITLES[pathname];
    for (const [route, title] of Object.entries(ROUTE_TITLES)) {
        if (pathname.startsWith(route) && route !== '/teacher') return title;
    }
    return 'Teacher Portal';
}

// ─── NavItem ─────────────────────────────────────────────────────────────────
function NavItem({ item, isActive }: { item: typeof NAV_GROUPS[0]['items'][0]; isActive: boolean }) {
    const Icon = item.icon;
    return (
        <Link
            to={item.path}
            className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group',
                isActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            )}
        >
            <Icon
                size={16}
                className={cn(
                    'shrink-0 transition-colors',
                    isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'
                )}
            />
            <span className="truncate">{item.title}</span>
            {isActive && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0" />
            )}
        </Link>
    );
}

// ─── Sidebar ─────────────────────────────────────────────────────────────────
function Sidebar({
    open,
    onClose,
    location,
    profile,
    user,
    schoolName,
    teacherPhoto,
    teacherName,
    onProfileClick,
    onLogout,
}: {
    open: boolean;
    onClose: () => void;
    location: ReturnType<typeof useLocation>;
    profile: any;
    user: any;
    schoolName: string;
    teacherPhoto: string;
    teacherName: string;
    onProfileClick: () => void;
    onLogout: () => void;
}) {
    return (
        <>
            {/* Mobile overlay */}
            {open && (
                <div
                    className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden"
                    onClick={onClose}
                />
            )}

            <aside
                className={cn(
                    'fixed inset-y-0 left-0 z-50 w-[260px] bg-white flex flex-col shrink-0',
                    'border-r border-slate-200 shadow-sm',
                    'transition-transform duration-300 ease-in-out',
                    'md:relative md:translate-x-0',
                    !open && '-translate-x-full md:flex'
                )}
            >
                {/* ── Logo ── */}
                <div className="flex items-center justify-between h-[60px] px-5 border-b border-slate-100 shrink-0">
                    <Link to="/" className="flex items-center gap-2">
                        <img src={logo} alt="Skooly" className="h-12 object-contain" />
                    </Link>
                    <button
                        onClick={onClose}
                        className="md:hidden p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* ── School chip ── */}
                <div className="px-4 py-3 border-b border-slate-100 shrink-0">
                    <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-slate-50 border border-slate-200">
                        <div className="w-7 h-7 rounded-md bg-blue-600 flex items-center justify-center shrink-0">
                            <GraduationCap size={14} className="text-white" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-[11px] font-semibold text-slate-800 truncate leading-tight">{schoolName}</p>
                            <p className="text-[10px] text-slate-400 leading-tight">Teacher Portal</p>
                        </div>
                    </div>
                </div>

                {/* ── Nav ── */}
                <div className="flex-1 overflow-y-auto py-3 px-3">
                    {NAV_GROUPS.map((group) => {
                        return (
                            <div key={group.label} className="mb-5">
                                <p className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                    {group.label}
                                </p>
                                <div className="space-y-0.5">
                                    {group.items.map((item) => {
                                        const isActive = (item as any).exact
                                            ? location.pathname === item.path
                                            : location.pathname === item.path || location.pathname.startsWith(item.path + '/');
                                        return (
                                            <NavItem key={item.path} item={item} isActive={isActive} />
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* ── User Card ── */}
                <div className="px-3 pb-4 pt-2 border-t border-slate-100 shrink-0 space-y-2">
                    {/* Staff Dashboard link for non-academic/custom role staff */}
                    {(user?.customRoleId || user?.teacherProfile?.staffType === 'NON_ACADEMIC') && (
                        <Link
                            to="/dashboard"
                            className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors"
                        >
                            <Settings size={14} />
                            Staff Dashboard
                        </Link>
                    )}

                    {/* Teacher profile mini-card */}
                    <button
                        onClick={onProfileClick}
                        className="w-full flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-all text-left"
                    >
                        <div className="relative shrink-0">
                            <img
                                src={teacherPhoto}
                                alt={teacherName}
                                className="w-8 h-8 rounded-full object-cover ring-2 ring-white shadow"
                            />
                            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-slate-800 truncate leading-tight">{teacherName}</p>
                            <p className="text-[10px] text-slate-400 leading-tight">View Profile</p>
                        </div>
                        <Settings size={12} className="text-slate-400 shrink-0" />
                    </button>

                    {/* Logout */}
                    <button
                        onClick={onLogout}
                        className="flex items-center justify-center w-full gap-2 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                        <LogOut size={14} />
                        Log Out
                    </button>
                </div>
            </aside>
        </>
    );
}

// ─── Main Layout ─────────────────────────────────────────────────────────────
export function TeacherLayout() {
    const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 768);
    const [profileModalOpen, setProfileModalOpen] = useState(false);
    const [profile, setProfile] = useState<any>(null);
    const location = useLocation();
    const { user } = useAuth();

    // Kept exactly as-is — backend logic untouched
    useEffect(() => {
        axios.get('/api/v1/dashboard/me', { withCredentials: true })
            .then(res => setProfile(res.data?.profile))
            .catch(err => console.error('Failed to fetch teacher profile', err));
    }, []);

    useEffect(() => {
        if (window.innerWidth < 768) {
            setSidebarOpen(false);
        }
    }, [location.pathname]);

    const teacherName = profile ? (profile.user?.name || profile.name || 'Teacher') : 'Teacher';
    const schoolName = profile?.school?.name || 'Skooly Platform';
    const teacherPhoto = profile?.photo || 'https://i.pravatar.cc/100?img=33';

    // Kept exactly as-is — backend logic untouched
    const handleLogout = async () => {
        try {
            await axios.get('/api/v1/auth/logout', { withCredentials: true });
            window.location.href = '/';
        } catch (error) {
            console.error('Logout failed', error);
        }
    };

    const pageTitle = getPageTitle(location.pathname);

    return (
        <div className="flex h-screen overflow-hidden" style={{ background: '#f1f5f9' }}>
            <ProfileSettingsModal isOpen={profileModalOpen} onClose={() => setProfileModalOpen(false)} />

            <Sidebar
                open={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
                location={location}
                profile={profile}
                user={user}
                schoolName={schoolName}
                teacherPhoto={teacherPhoto}
                teacherName={teacherName}
                onProfileClick={() => setProfileModalOpen(true)}
                onLogout={handleLogout}
            />

            {/* ── Main Content ── */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

                {/* ── Topbar ── */}
                <header className="h-[60px] bg-white border-b border-slate-200 flex items-center justify-between px-5 shrink-0 z-30">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
                        >
                            <Menu size={18} />
                        </button>
                        {/* Dynamic page title */}
                        <div className="hidden sm:flex items-center gap-2 text-sm text-slate-400">
                            <span className="text-slate-300">/</span>
                            <span className="font-semibold text-slate-700">{pageTitle}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Notification bell */}
                        <button className="relative p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors">
                            <Bell size={18} />
                            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
                        </button>

                        {/* Divider */}
                        <div className="w-px h-6 bg-slate-200 mx-1" />

                        {/* Profile button (topbar) */}
                        <button
                            onClick={() => setProfileModalOpen(true)}
                            className="flex items-center gap-2.5 pl-1 pr-3 py-1.5 rounded-xl hover:bg-slate-100 transition-colors group"
                        >
                            <img
                                src={teacherPhoto}
                                alt={teacherName}
                                className="w-8 h-8 rounded-full object-cover ring-2 ring-slate-200"
                            />
                            <div className="hidden md:block text-left">
                                <p className="text-sm font-semibold text-slate-800 leading-tight">{teacherName}</p>
                                <p className="text-[11px] text-slate-400 leading-tight">Teacher</p>
                            </div>
                        </button>
                    </div>
                </header>

                {/* ── Page Content ── */}
                <div className="flex-1 overflow-auto flex flex-col">
                    <main className="flex-1 p-5 md:p-6">
                        <Outlet />
                    </main>
                    <footer className="shrink-0 text-center py-3 text-[12px] text-slate-400 bg-white border-t border-slate-200">
                        © 2026 Skooly Plus · Teacher Portal · v1.0.0
                    </footer>
                </div>
            </div>
        </div>
    );
}
