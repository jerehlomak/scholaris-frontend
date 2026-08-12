import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
    Menu, Settings,
    LayoutDashboard, CreditCard, BookOpen,
    FileText, Home as HomeIcon, Video, MessageSquare, LayoutTemplate,
    LogOut, QrCode, GraduationCap, X, Calendar
} from 'lucide-react';
import { cn } from '../../lib/utils';
import logo from '../../assets/SkcoolyPlus.png';
import { useAuth } from '../../context/AuthContext';
import { ProfileSettingsModal } from '../shared/ProfileSettingsModal';
import { Badge } from '../ui/badge';

// ─── Nav Config ──────────────────────────────────────────────────────────────
const NAV_GROUPS = [
    {
        label: 'Academics',
        items: [
            { title: 'Dashboard', path: '/student', icon: LayoutDashboard, exact: true },
            { title: 'Courses & Subjects', path: '/student/course', icon: BookOpen },
            { title: 'LMS Hub', path: '/student/lms', icon: LayoutTemplate },
            { title: 'CBT Assessments', path: '/student/cbt', icon: FileText },
            { title: 'Live Class', path: '/student/live-class', icon: Video },
            { title: 'Results', path: '/student/result', icon: GraduationCap },
            { title: 'ID & Attendance', path: '/student/attendance', icon: QrCode, exact: true },
        ]
    },
    {
        label: 'Administration',
        items: [
            { title: 'Payment', path: '/student/payment', icon: CreditCard },
            { title: 'Hostel', path: '/student/hostel', icon: HomeIcon },
            { title: 'Messaging', path: '/student/messaging', icon: MessageSquare },
        ]
    }
];

// Route → display title map for the topbar
const ROUTE_TITLES: Record<string, string> = {
    '/student': 'Student Dashboard',
    '/student/course': 'Courses & Subjects',
    '/student/lms': 'LMS Hub',
    '/student/cbt': 'CBT Assessments',
    '/student/live-class': 'Live Class',
    '/student/result': 'Results & Transcripts',
    '/student/attendance': 'ID & Attendance',
    '/student/payment': 'Fee Payments',
    '/student/hostel': 'Hostel Allocation',
    '/student/messaging': 'Messaging',
};

function getPageTitle(pathname: string): string {
    if (ROUTE_TITLES[pathname]) return ROUTE_TITLES[pathname];
    for (const [route, title] of Object.entries(ROUTE_TITLES)) {
        if (pathname.startsWith(route) && route !== '/student') return title;
    }
    return 'Student Portal';
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
    handleLogout
}: {
    open: boolean;
    onClose: () => void;
    location: any;
    profile: any;
    user: any;
    handleLogout: () => void;
}) {
    const schoolName = profile?.school?.name || 'Skooly Platform';

    return (
        <>
            {/* Mobile backdrop */}
            {open && (
                <div
                    className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden"
                    onClick={onClose}
                />
            )}

            <aside
                className={cn(
                    "fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 flex flex-col shrink-0",
                    !open && "-translate-x-full"
                )}
            >
                {/* Logo Area */}
                <div className="h-16 flex items-center justify-between px-6 border-b border-slate-100 shrink-0">
                    <Link to="/student" className="flex items-center gap-2" onClick={() => window.innerWidth < 1024 && onClose()}>
                        <img src={logo} alt="Logo" className="h-8 object-contain" />
                    </Link>
                    <button onClick={onClose} className="p-1 rounded-md text-slate-400 hover:bg-slate-100 lg:hidden">
                        <X size={20} />
                    </button>
                </div>

                {/* School Chip */}
                <div className="p-4 shrink-0">
                    <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-100 rounded-xl">
                        <div className="w-10 h-10 rounded-lg bg-white border border-slate-200 shadow-sm flex items-center justify-center shrink-0">
                            <GraduationCap className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Connected School</p>
                            <p className="text-xs font-bold text-slate-700 truncate">{schoolName}</p>
                        </div>
                    </div>
                </div>

                {/* Navigation Links */}
                <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-6">
                    {NAV_GROUPS.map((group) => (
                        <div key={group.label}>
                            <h3 className="px-3 mb-2 text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                                {group.label}
                            </h3>
                            <nav className="space-y-1">
                                {group.items.map((item) => {
                                    const isActive = item.exact
                                        ? location.pathname === item.path
                                        : location.pathname.startsWith(item.path);
                                    return (
                                        <div key={item.path} onClick={() => window.innerWidth < 1024 && onClose()}>
                                            <NavItem item={item} isActive={isActive} />
                                        </div>
                                    );
                                })}
                            </nav>
                        </div>
                    ))}
                </div>

                {/* User / Logout */}
                <div className="p-4 border-t border-slate-100 shrink-0">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                    >
                        <LogOut size={18} />
                        Sign Out
                    </button>
                </div>
            </aside>
        </>
    );
}

// ─── Main Layout ─────────────────────────────────────────────────────────────
export function StudentLayout() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [profileModalOpen, setProfileModalOpen] = useState(false);
    const [profile, setProfile] = useState<any>(null);
    const location = useLocation();
    const navigate = useNavigate();
    const { user, logout } = useAuth();

    // Fetch Profile
    useEffect(() => {
        axios.get('/api/v1/dashboard/me', { withCredentials: true })
            .then(res => setProfile(res.data?.profile))
            .catch(err => console.error("Failed to fetch student profile", err));
    }, []);

    // Close sidebar on route change (mobile)
    useEffect(() => {
        if (window.innerWidth < 1024) {
            setSidebarOpen(false);
        }
    }, [location.pathname]);

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login');
        } catch (error) {
            console.error("Logout failed", error);
        }
    };

    const studentName = profile?.user?.name || profile?.firstName || user?.name || 'Student';
    const studentPhoto = profile?.photoUrl || profile?.user?.photoUrl || "https://i.pravatar.cc/100?img=12";
    const pageTitle = getPageTitle(location.pathname);

    return (
        <div className="flex h-screen bg-slate-50 font-sans overflow-hidden text-slate-900">
            <ProfileSettingsModal isOpen={profileModalOpen} onClose={() => setProfileModalOpen(false)} />

            {/* Sidebar */}
            <Sidebar
                open={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
                location={location}
                profile={profile}
                user={user}
                handleLogout={handleLogout}
            />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 relative">
                
                {/* Topbar */}
                <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-8 shrink-0 z-10">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="p-2 -ml-2 rounded-lg text-slate-500 hover:bg-slate-100 lg:hidden"
                        >
                            <Menu size={20} />
                        </button>
                        <h1 className="text-lg font-bold text-slate-800 hidden sm:block">{pageTitle}</h1>
                    </div>

                    <div className="flex items-center gap-3 sm:gap-4">
                        {/* Profile Clickable Area */}
                        <div
                            onClick={() => setProfileModalOpen(true)}
                            className="flex items-center gap-3 p-1.5 pr-3 rounded-full hover:bg-slate-100 border border-transparent hover:border-slate-200 cursor-pointer transition-all"
                        >
                            <img src={studentPhoto} alt="Student" className="w-8 h-8 rounded-full object-cover shadow-sm" />
                            <span className="text-sm font-bold text-slate-700 hidden md:block">
                                {studentName.split(' ')[0]}
                            </span>
                            <Settings size={16} className="text-slate-400 hidden sm:block ml-1" />
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-auto bg-slate-50/50 p-4 sm:p-6 lg:p-8">
                    <Outlet context={{ profile }} />
                </main>
            </div>
        </div>
    );
}
