import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
    Menu, Settings,
    LayoutDashboard, Users, BookOpen, CreditCard,
    FileText, Calendar, Bell, ChevronRight, MessageSquare,
    LayoutTemplate, ClipboardCheck, FilePlus, LogOut, GraduationCap, X, Wallet, Send, UploadCloud
} from 'lucide-react';
import { cn } from '../../lib/utils';
import logo from '../../assets/SkcoolyPlus.png';
import { useAuth } from '../../context/AuthContext';
import { ProfileSettingsModal } from '../shared/ProfileSettingsModal';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent } from '../ui/dropdown-menu';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

// ─── Nav Config ──────────────────────────────────────────────────────────────
const NAV_GROUPS = [
    {
        label: 'Overview',
        items: [
            { title: 'Dashboard', path: '/parent', icon: LayoutDashboard, exact: true },
            { title: 'My Children', path: '/parent/children', icon: Users },
            { title: 'Apply for Admission', path: '/parent/apply', icon: FilePlus },
        ]
    },
    {
        label: 'Academics & Reports',
        items: [
            { title: 'Academics', path: '/parent/academics', icon: BookOpen },
            { title: 'Attendance', path: '/parent/attendance', icon: Calendar },
            { title: 'Results', path: '/parent/results', icon: FileText },
        ]
    },
    {
        label: 'Financials',
        items: [
            { title: 'Fees & Payment', path: '/parent/fees', icon: CreditCard },
            { title: 'Wallet', path: '/parent/wallet', icon: Wallet },
            { title: 'Finance Messages', path: '/parent/finance-messages', icon: MessageSquare },
        ]
    },
    {
        label: 'Tools',
        items: [
            { title: 'LMS Hub', path: '/parent/lms', icon: LayoutTemplate },
            { title: 'CBT Assessments', path: '/parent/cbt', icon: ClipboardCheck },
            { title: 'Messaging', path: '/parent/messaging', icon: MessageSquare },
        ]
    }
];

const ROUTE_TITLES: Record<string, string> = {
    '/parent': 'Dashboard',
    '/parent/children': 'My Children',
    '/parent/apply': 'Apply for Admission',
    '/parent/academics': 'Academics',
    '/parent/fees': 'Fees & Payment',
    '/parent/results': 'Results',
    '/parent/attendance': 'Attendance',
    '/parent/lms': 'LMS Hub',
    '/parent/cbt': 'CBT Assessments',
    '/parent/messaging': 'Messaging',
    '/parent/wallet': 'Wallet',
    '/parent/finance-messages': 'Finance Messages',
};

function getPageTitle(pathname: string): string {
    if (ROUTE_TITLES[pathname]) return ROUTE_TITLES[pathname];
    for (const [route, title] of Object.entries(ROUTE_TITLES)) {
        if (pathname.startsWith(route) && route !== '/parent') return title;
    }
    return 'Parent Portal';
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
                    ? 'bg-[#1E4DA6]/5 text-[#173F8C]'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            )}
        >
            <Icon
                size={16}
                className={cn(
                    'shrink-0 transition-colors',
                    isActive ? 'text-[#1E4DA6]' : 'text-slate-400 group-hover:text-slate-600'
                )}
            />
            <span className="truncate">{item.title}</span>
            {isActive && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#1E4DA6] shrink-0" />
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
    parentPhoto,
    parentName,
    onProfileClick,
    onLogout,
}: {
    open: boolean;
    onClose: () => void;
    location: ReturnType<typeof useLocation>;
    profile: any;
    user: any;
    schoolName: string;
    parentPhoto: string;
    parentName: string;
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
                        <div className="w-7 h-7 rounded-md bg-[#1E4DA6] flex items-center justify-center shrink-0">
                            <GraduationCap size={14} className="text-white" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-[11px] font-semibold text-slate-800 truncate leading-tight">{schoolName}</p>
                            <p className="text-[10px] text-slate-400 leading-tight">Parent Portal</p>
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
                    {/* Staff Dashboard link for parents who are also staff */}
                    {(user?.customRoleId || user?.role !== 'PARENT') && user?.role !== 'PARENT' && (
                        <Link
                            to="/dashboard"
                            className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors"
                        >
                            <Settings size={14} />
                            Staff Dashboard
                        </Link>
                    )}

                    {/* Parent profile mini-card */}
                    <button
                        onClick={onProfileClick}
                        className="w-full flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-all text-left"
                    >
                        <div className="relative shrink-0">
                            <img
                                src={parentPhoto}
                                alt={parentName}
                                className="w-8 h-8 rounded-full object-cover ring-2 ring-white shadow"
                            />
                            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-slate-800 truncate leading-tight">{parentName}</p>
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
export function ParentLayout() {
    const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 768);
    const [profileModalOpen, setProfileModalOpen] = useState(false);
    
    // Notifications State
    const [selectedMessage, setSelectedMessage] = useState<any>(null);
    const [replyBody, setReplyBody] = useState('');
    const [replyAttachment, setReplyAttachment] = useState<File | null>(null);
    const [isReplying, setIsReplying] = useState(false);
    const [notifications, setNotifications] = useState<any[]>([]);

    useEffect(() => {
        const fetchNotifications = async () => {
            try {
                const res = await axios.get('/api/v1/finance-v2/messages/parent', { withCredentials: true });
                setNotifications(res.data.messages || []);
            } catch (err) {
                console.error('Failed to fetch notifications');
            }
        };
        fetchNotifications();
    }, []);

    // Mark messages as read when the chat opens
    useEffect(() => {
        if (selectedMessage) {
            const hasUnread = notifications.some(n => !n.isRead && n.senderType === 'ADMIN');
            if (hasUnread) {
                // Update locally immediately for snappy UI
                setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
                // Fire request to server
                axios.put('/api/v1/finance-v2/messages/parent/mark-read', {}, { withCredentials: true }).catch(console.error);
            }
        }
    }, [selectedMessage, notifications]);

    const handleReplySubmit = async () => {
        if (!replyBody.trim() && !replyAttachment) return;
        setIsReplying(true);
        try {
            const formData = new FormData();
            
            // In unified chat, reply to the most recent message to keep context
            const sortedNotifications = [...notifications].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
            const lastMessage = sortedNotifications[sortedNotifications.length - 1];
            
            if (lastMessage) {
                formData.append('replyToId', lastMessage.id);
            }
            
            formData.append('body', replyBody);
            if (replyAttachment) {
                formData.append('attachment', replyAttachment);
            }
            await axios.post('/api/v1/finance-v2/messages/parent', formData, { 
                withCredentials: true,
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            
            // Re-fetch notifications to get the new message
            const res = await axios.get('/api/v1/finance-v2/messages/parent', { withCredentials: true });
            setNotifications(res.data.messages || []);
            
            setReplyBody('');
            setReplyAttachment(null);
        } catch (err) {
            console.error('Failed to send reply');
        } finally {
            setIsReplying(false);
        }
    };

    const [profile, setProfile] = useState<any>(null);
    const location = useLocation();
    const { user, logout } = useAuth();

    // Kept exactly as-is — backend logic untouched
    useEffect(() => {
        axios.get('/api/v1/dashboard/me', { withCredentials: true })
            .then(res => setProfile(res.data?.profile))
            .catch(err => console.error("Failed to fetch parent profile", err));
    }, []);

    useEffect(() => {
        if (window.innerWidth < 768) {
            setSidebarOpen(false);
        }
    }, [location.pathname]);

    const parentName = profile ? (profile.user?.name || profile.fatherName || profile.motherName || profile.guardianName || 'Parent') : 'Parent';
    const schoolName = profile?.school?.name || 'Skooly Platform';
    const parentPhoto = profile?.photo || "https://i.pravatar.cc/100?img=47";

    // Kept exactly as-is — backend logic untouched
    const handleLogout = async () => {
        try {
            await logout();
        } catch (error) {
            console.error("Logout failed", error);
        }
    };

    const pageTitle = getPageTitle(location.pathname);

    const thread = [...notifications].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    
    // Only count unread messages sent by the admin
    const unreadCount = notifications.filter(n => !n.isRead && n.senderType === 'ADMIN').length;

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
                parentPhoto={parentPhoto}
                parentName={parentName}
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
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button className="relative p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors outline-none">
                                    <Bell size={18} />
                                    {unreadCount > 0 && (
                                        <span className="absolute top-0 right-0 inline-flex items-center justify-center w-4 h-4 text-[9px] font-bold text-white bg-red-500 rounded-full border-2 border-white transform -translate-y-1/4 translate-x-1/4">
                                            {unreadCount}
                                        </span>
                                    )}
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-80 p-0">
                                <div className="px-4 py-3 border-b border-slate-100 font-semibold text-slate-800">
                                    Notifications {unreadCount > 0 && <span className="ml-2 text-xs text-[#1E4DA6]">({unreadCount} new)</span>}
                                </div>
                                <div className="max-h-[300px] overflow-y-auto">
                                    {notifications.length > 0 ? (
                                        notifications.slice(0, 5).map((msg, i) => (
                                            <div key={i} onClick={() => setSelectedMessage(msg)} className={cn("px-4 py-3 hover:bg-slate-50 border-b border-slate-50 last:border-0 cursor-pointer", !msg.isRead && msg.senderType === 'ADMIN' ? 'bg-[#1E4DA6]/8' : '')}>
                                                <h4 className="text-sm font-semibold text-slate-900">{msg.subject}</h4>
                                                <p className="text-xs text-slate-500 mt-1 line-clamp-2">{msg.body}</p>
                                                <p className="text-[10px] text-slate-400 mt-2">{new Date(msg.createdAt).toLocaleDateString()}</p>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="px-4 py-6 text-center text-sm text-slate-500">
                                            No recent notifications.
                                        </div>
                                    )}
                                </div>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        {/* Divider */}
                        <div className="w-px h-6 bg-slate-200 mx-1" />

                        {/* Profile button (topbar) */}
                        <button
                            onClick={() => setProfileModalOpen(true)}
                            className="flex items-center gap-2.5 pl-1 pr-3 py-1.5 rounded-xl hover:bg-slate-100 transition-colors group"
                        >
                            <img
                                src={parentPhoto}
                                alt={parentName}
                                className="w-8 h-8 rounded-full object-cover ring-2 ring-slate-200"
                            />
                            <div className="hidden md:block text-left">
                                <p className="text-sm font-semibold text-slate-800 leading-tight">{parentName}</p>
                                <p className="text-[11px] text-slate-400 leading-tight">Parent</p>
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
                        © 2026 Skooly Plus · Parent Portal · v1.0.0
                    </footer>
                </div>
            </div>

            {/* Parent Reply Modal / Threaded View */}
            <Dialog open={!!selectedMessage} onOpenChange={(open) => !open && setSelectedMessage(null)}>
                <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden flex flex-col max-h-[85vh]">
                    <DialogHeader className="px-6 py-4 border-b border-slate-100 bg-white shrink-0">
                        <DialogTitle className="text-xl font-bold text-slate-800 flex items-center gap-2">
                            School Admin
                        </DialogTitle>
                        <DialogDescription className="text-slate-500">
                            Unified conversation history
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50">
                        {thread.map((msg: any) => {
                            const isParent = msg.senderType === 'PARENT';
                            return (
                                <div key={msg.id} className={cn('flex flex-col max-w-[85%]', isParent ? 'ml-auto items-end' : 'mr-auto items-start')}>
                                    <span className="text-[10px] font-bold text-slate-400 mb-1 px-1">
                                        {isParent ? 'You' : 'Admin'} • {new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                    </span>
                                    <div className={cn(
                                        'p-3 rounded-2xl text-sm shadow-sm', 
                                        isParent ? 'bg-[#1E4DA6] text-white rounded-br-sm' : 'bg-white border border-slate-200 text-slate-700 rounded-bl-sm'
                                    )}>
                                        {msg.subject && msg.subject !== 'Fee Reminder' && !msg.subject.startsWith('Re:') && (
                                            <p className={cn("text-xs font-bold mb-2 pb-2 border-b", isParent ? "border-[#1E4DA6] text-white/80" : "border-slate-100 text-slate-500")}>
                                                {msg.subject}
                                            </p>
                                        )}
                                        <p className="whitespace-pre-wrap">{msg.body}</p>
                                        {msg.attachmentUrl && (
                                            <a href={msg.attachmentUrl} target="_blank" rel="noreferrer" className={cn('mt-2 flex items-center gap-1 text-[11px] font-bold underline', isParent ? 'text-white/70 hover:text-white' : 'text-[#1E4DA6] hover:text-[#122F69]')}>
                                                View Attachment
                                            </a>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    
                    <div className="p-4 bg-white border-t border-slate-100 shrink-0">
                        <div className="flex flex-col gap-3">
                            <textarea
                                value={replyBody}
                                onChange={(e) => setReplyBody(e.target.value)}
                                placeholder="Type your reply here..."
                                className="w-full min-h-[80px] p-3 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white shadow-sm focus:border-[#1E4DA6] focus:ring-1 focus:ring-[#1E4DA6] transition-all outline-none resize-none"
                            />
                            <div className="flex items-center justify-between gap-3">
                                <div className="relative flex-1 max-w-[200px]">
                                    <UploadCloud className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <Input
                                        type="file"
                                        accept="image/jpeg, image/png, image/webp, application/pdf"
                                        onChange={(e) => setReplyAttachment(e.target.files ? e.target.files[0] : null)}
                                        className="pl-9 h-9 rounded-xl bg-slate-50 border-slate-200 focus:bg-white pt-[4px] text-xs"
                                    />
                                </div>
                                <Button 
                                    onClick={handleReplySubmit}
                                    disabled={!replyBody.trim() || isReplying}
                                    className="rounded-xl h-9 px-5 gap-2 bg-[#1E4DA6] hover:bg-[#173F8C] font-bold shadow-md shadow-[#1E4DA6]/20"
                                >
                                    {isReplying ? <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" /> : <Send className="w-4 h-4" />}
                                    {isReplying ? 'Sending...' : 'Send'}
                                </Button>
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
