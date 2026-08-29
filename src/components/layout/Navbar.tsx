import { useState, useRef, useEffect } from 'react';
import { Menu, Bell, User, Apple, Play, Zap, LogOut, Settings, X } from 'lucide-react';
import { Button } from '../ui/button';
import { Separator } from '../ui/separator';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTerm } from '../../context/TermContext';
import { useSubscription } from '../../contexts/SubscriptionContext';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { SkcoolyWordmark } from '../shared/SkcoolyWordmark';
import { cn } from '../../lib/utils';
import { useBranch } from '../../context/BranchContext';
import { useSchoolType } from '../../context/SchoolTypeContext';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { usePermissions } from '../../hooks/usePermissions';
import { toast } from 'sonner';

// Every place the backend currently creates a Notification row and where its `link` points
// (see sendNotification() in financeMessaging.controller.js and application.controller.js).
// Notifications created before a route was renamed/removed can carry a stale link that no
// longer matches anything — this guards against navigating straight into a 404 dead-end.
const KNOWN_NOTIFICATION_LINK_PREFIXES = [
    '/dashboard/admission/applications',
    '/dashboard/finance/messages',
];

// The old per-school header color-picker maps were removed 14 Aug 2026 —
// see the "Fixed brand theme" comment further down.

interface NavbarProps { toggleSidebar: () => void; }

export function Navbar({ toggleSidebar }: NavbarProps) {
    const { viewingTerm, terms, setViewingTerm } = useTerm();
    const { currentPlan } = useSubscription();
    const { logout, user } = useAuth();
    const { isUnrestrictedAdmin } = usePermissions();
    const { activeBranchId, availableBranches, switchBranch } = useBranch();
    const { schoolTypes, activeSchoolType, setActiveSchoolType, isLoadingSchoolTypes } = useSchoolType();
    const { t } = useTranslation();

    const [showProfileDropdown, setShowProfileDropdown] = useState(false);
    const [showMobileMenu, setShowMobileMenu] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [notifications, setNotifications] = useState<any[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [mounted, setMounted] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const notifRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    // Fetch Notifications
    useEffect(() => {
        if (!user) return;
        const fetchNotifs = async () => {
            try {
                const res = await axios.get('/api/v1/notifications', { withCredentials: true });
                setNotifications(res.data.notifications || []);
                setUnreadCount(res.data.unreadCount || 0);
            } catch (err) {}
        };
        fetchNotifs();
        const interval = setInterval(fetchNotifs, 60000);
        return () => clearInterval(interval);
    }, [user]);

    const handleReadNotification = async (notif: any) => {
        if (!notif.isRead) {
            try {
                await axios.patch(`/api/v1/notifications/${notif.id}/read`, {}, { withCredentials: true });
                setUnreadCount(prev => Math.max(0, prev - 1));
                setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, isRead: true } : n));
            } catch (err) {}
        }
        setShowNotifications(false);
        if (notif.link) {
            const isKnownLink = KNOWN_NOTIFICATION_LINK_PREFIXES.some(p => notif.link.startsWith(p));
            if (isKnownLink) {
                navigate(notif.link);
            } else {
                toast.error('This notification points to a page that no longer exists.');
            }
        }
    };

    useEffect(() => {
        const t = setTimeout(() => setMounted(true), 40);
        return () => clearTimeout(t);
    }, []);

    // Close profile dropdown on outside click
    useEffect(() => {
        function onMouseDown(e: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node))
                setShowProfileDropdown(false);
            if (notifRef.current && !notifRef.current.contains(e.target as Node))
                setShowNotifications(false);
        }
        document.addEventListener('mousedown', onMouseDown);
        return () => document.removeEventListener('mousedown', onMouseDown);
    }, []);

    // Fixed brand theme — see Sidebar.tsx for the same change and why
    // (client explicitly asked for one consistent, non-customizable color
    // per school). ThemeContext's headerBg/activeItemBg/headerText color-
    // picker values are intentionally ignored here.
    const isLight = true; // top bar stays a light cream panel against the navy sidebar
    const bgClass = 'bg-white/95 border-[#EEEAE0]';
    const activeBgClass = 'bg-[#15316B]';
    const textClass = 'text-[#15316B]';

    // Helper: ghost icon button
    const iconBtn = cn(
        'relative h-9 w-9 rounded-xl transition-all duration-200',
        isLight
            ? 'text-slate-600 hover:bg-slate-100 hover:text-[#15316B]'
            : 'text-white/80 hover:bg-white/10 hover:text-white'
    );

    const userName = user?.school?.name || user?.name || 'My School';
    const userInit = userName.charAt(0).toUpperCase();
    const userGroup = user?.school?.group?.name;

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500;700&display=swap');
                /* Body text inherits the app's global Inter font (index.css)
                   — only the monospace face (term/session codes, etc.) is
                   still overridden here as a deliberate detail. */
                .nb-root .font-mono  { font-family: 'DM Mono', monospace !important; }
            `}</style>

            {/* ── Main header ──────────────────────────── */}
            <header
                className={cn(
                    'nb-root fixed start-0 right-0 top-0 z-50 h-16 border-b shadow-sm',
                    'flex items-center justify-between px-4 lg:px-6',
                    'backdrop-blur-md transition-all duration-300',
                    bgClass, textClass,
                    mounted ? 'opacity-100' : '-translate-y-2 opacity-0',
                    'transition-all duration-500'
                )}
            >
                {/* ── Left: Logo + toggle ─────────────── */}
                <div className="flex items-center gap-3">
                    <Link to="/" className="flex h-full shrink-0 items-center">
                        <SkcoolyWordmark size="md" />
                    </Link>

                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={toggleSidebar}
                        className={cn(iconBtn, 'ml-1')}
                        aria-label="Toggle sidebar"
                    >
                        <Menu className="h-5 w-5" />
                    </Button>
                </div>

                {/* ── Right: Desktop actions ──────────── */}
                <div className="flex items-center gap-1 sm:gap-2">

                    {/* App store buttons — large screens only */}
                    <div className="hidden xl:flex items-center gap-2 mr-2">
                        <button className={cn(
                            'flex items-center gap-2 rounded-full px-4 py-2 text-[10px] font-semibold text-white transition-all hover:scale-[1.03]',
                            'bg-[#1E4DA6] hover:bg-[#173F8C] shadow-sm shadow-[#1E4DA6]/20'
                        )}>
                            <Apple className="h-3.5 w-3.5 fill-current" />
                            <span className="flex flex-col text-left leading-none">
                                <span className="text-[8px] uppercase opacity-70">Download on</span>
                                <span>App Store</span>
                            </span>
                        </button>
                        <button className={cn(
                            'flex items-center gap-2 rounded-full px-4 py-2 text-[10px] font-semibold text-[#15316B] transition-all hover:scale-[1.03]',
                            'bg-[#F5B800] hover:bg-[#FFC72C] shadow-sm shadow-[#F5B800]/25'
                        )}>
                            <Play className="h-3.5 w-3.5 fill-current" />
                            <span className="flex flex-col text-left leading-none">
                                <span className="text-[8px] uppercase opacity-70">Get it on</span>
                                <span>Google Play</span>
                            </span>
                        </button>
                    </div>

                    {/* Icon buttons */}


                    {/* Bell with badge — unrestricted admins only; a staff member with a
                        custom role sees only what their role grants, and notifications
                        aren't (yet) part of the granted-menu model */}
                    {isUnrestrictedAdmin && (
                    <div className="relative" ref={notifRef}>
                        <Button variant="ghost" size="icon" className={iconBtn} onClick={() => setShowNotifications(!showNotifications)}>
                            <Bell className="h-4.5 w-4.5 fill-current" />
                            {unreadCount > 0 && (
                                <span className="absolute right-1.5 top-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-rose-500 font-mono text-[8px] font-bold text-white shadow">
                                    {unreadCount}
                                </span>
                            )}
                        </Button>

                        {/* Notifications Dropdown */}
                        <AnimatePresence>
                            {showNotifications && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                    transition={{ duration: 0.15 }}
                                    className="absolute right-0 top-12 w-80 rounded-2xl bg-white p-2 shadow-2xl border border-slate-200 z-[100]"
                                >
                                    <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100 mb-2">
                                        <h3 className="text-sm font-bold text-slate-800">Notifications</h3>
                                        {unreadCount > 0 && (
                                            <button 
                                                onClick={async () => {
                                                    try {
                                                        await axios.post('/api/v1/notifications/mark-all-read', {}, { withCredentials: true });
                                                        setUnreadCount(0);
                                                        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
                                                    } catch {}
                                                }}
                                                className="text-[10px] font-semibold text-[#15316B] hover:text-[#0E2450]"
                                            >
                                                Mark all read
                                            </button>
                                        )}
                                    </div>
                                    <div className="max-h-[300px] overflow-y-auto space-y-1">
                                        {notifications.length === 0 ? (
                                            <div className="px-3 py-6 text-center text-sm text-slate-500">No notifications yet.</div>
                                        ) : (
                                            notifications.map((notif) => (
                                                <button
                                                    key={notif.id}
                                                    onClick={() => handleReadNotification(notif)}
                                                    className={cn(
                                                        'w-full text-left p-3 rounded-xl transition-colors hover:bg-slate-50',
                                                        !notif.isRead ? 'bg-[#F5B800]/8' : 'bg-transparent'
                                                    )}
                                                >
                                                    <div className="flex gap-3">
                                                        <div className={cn('mt-0.5 h-2 w-2 rounded-full flex-shrink-0', !notif.isRead ? 'bg-[#F5B800]' : 'bg-transparent')} />
                                                        <div>
                                                            <p className="text-[11px] font-bold text-slate-800">{notif.title}</p>
                                                            <p className="text-[10px] text-slate-500 leading-tight mt-0.5">{notif.message}</p>
                                                            <p className="text-[9px] text-slate-400 mt-1">{new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                                        </div>
                                                    </div>
                                                </button>
                                            ))
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                    )}
                    {/* <Button variant="ghost" size="icon" className={cn(iconBtn, 'hidden sm:flex')}>
                        <ShoppingCart className="h-4.5 w-4.5" />
                    </Button> */}

                    {/* Term selector — desktop. Switching the viewing term is a
                        school-wide administrative action — unrestricted admins only. */}
                    {isUnrestrictedAdmin && (
                    <div className={cn(
                        'hidden lg:flex items-center gap-2 border-l px-3',
                        isLight ? 'border-slate-200' : 'border-white/15'
                    )}>
                        <select
                            value={viewingTerm?.id || ''}
                            onChange={(e) => {
                                const term = terms.find((t: any) => t.id === e.target.value);
                                if (term) setViewingTerm(term);
                            }}
                            className={cn(
                                'cursor-pointer appearance-none rounded-xl border px-3 py-1.5 font-mono text-xs font-semibold',
                                'transition-all focus:outline-none focus:ring-2 focus:ring-[#15316B]/30',
                                'bg-white/80 border-slate-200 text-slate-700 hover:border-slate-300',
                                'pr-7 shadow-sm'
                            )}
                            style={{
                                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2394a3b8'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                                backgroundRepeat: 'no-repeat',
                                backgroundPosition: 'right 0.4rem center',
                                backgroundSize: '0.9em 0.9em',
                            }}
                        >
                            {terms.map((term: any) => (
                                <option key={term.id} value={term.id}>
                                    {term.name} ({term.session?.name || 'Session'}){term.isActive ? ' - Active' : ''}
                                </option>
                            ))}
                        </select>
                    </div>
                    )}

                    {/* School Type Selector — desktop */}
                    {!isLoadingSchoolTypes && schoolTypes.length > 0 && (
                        <div className={cn(
                            'hidden lg:flex items-center gap-2 border-l px-3',
                            isLight ? 'border-slate-200' : 'border-white/15'
                        )}>
                            <select
                                value={activeSchoolType || ''}
                                onChange={(e) => setActiveSchoolType(e.target.value)}
                                className={cn(
                                    'cursor-pointer appearance-none rounded-xl border px-3 py-1.5 font-mono text-xs font-bold text-[#8a6a00]',
                                    'transition-all focus:outline-none focus:ring-2 focus:ring-[#F5B800]/40',
                                    'bg-[#F5B800]/10 border-[#F5B800]/30 hover:border-[#F5B800]/50 hover:bg-[#F5B800]/15',
                                    'pr-7 shadow-sm'
                                )}
                                style={{
                                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%238a6a00'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='3' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                                    backgroundRepeat: 'no-repeat',
                                    backgroundPosition: 'right 0.4rem center',
                                    backgroundSize: '0.9em 0.9em',
                                }}
                            >
                                {schoolTypes.map((st) => (
                                    <option key={st.id} value={st.name}>
                                        🏫 {st.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Branch selector — desktop (only for SCHOOL_SUPER_ADMIN) */}
                    {user?.role === 'SCHOOL_SUPER_ADMIN' && (
                        <div className={cn(
                            'hidden lg:flex items-center gap-2 border-l px-3',
                            isLight ? 'border-slate-200' : 'border-white/15'
                        )}>
                            <select
                                value={activeBranchId || 'all'}
                                onChange={(e) => switchBranch(e.target.value)}
                                className={cn(
                                    'cursor-pointer appearance-none rounded-xl border px-3 py-1.5 font-mono text-xs font-bold text-[#7C3559]',
                                    'transition-all focus:outline-none focus:ring-2 focus:ring-[#7C3559]/30',
                                    'bg-[#7C3559]/8 border-[#7C3559]/25 hover:border-[#7C3559]/40 hover:bg-[#7C3559]/12',
                                    'pr-7 shadow-sm'
                                )}
                                style={{
                                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%237C3559'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='3' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                                    backgroundRepeat: 'no-repeat',
                                    backgroundPosition: 'right 0.4rem center',
                                    backgroundSize: '0.9em 0.9em',
                                }}
                            >
                                <option value="all">🏢 All Branches</option>
                                {availableBranches.map((branch) => (
                                    <option key={branch.id} value={branch.id}>
                                        📍 {branch.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Plan badge — desktop */}
                    <div className={cn(
                        'hidden sm:flex items-center border-l px-3',
                        isLight ? 'border-slate-200' : 'border-white/15'
                    )}>
                        <div className={cn(
                            'flex items-center gap-1.5 rounded-full px-3 py-1.5 font-mono text-[10px] font-black uppercase tracking-widest text-white shadow-sm',
                            activeBgClass
                        )}>
                            <Zap className="h-3 w-3 fill-current" />
                            {currentPlan}
                        </div>
                    </div>

                    {/* Profile dropdown */}
                    <div className="relative hidden xl:block" ref={dropdownRef}>
                        <button
                            onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                            className="flex h-9 items-center gap-2 rounded-xl border border-transparent px-2 transition-all hover:bg-slate-100 dark:hover:bg-white/10"
                        >
                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#15316B]/8 font-bold text-[#15316B] shadow-sm border border-[#15316B]/15">
                                {userInit}
                            </div>
                        </button>
                        <AnimatePresence>
                            {showProfileDropdown && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 10 }}
                                    transition={{ duration: 0.15 }}
                                    className="absolute right-0 mt-2 w-48 origin-top-right rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl dark:border-white/10 dark:bg-slate-800"
                                >
                                    <div className="px-2 py-1.5">
                                        <p className="truncate text-sm font-bold text-slate-900 dark:text-white">{userName}</p>
                                    </div>
                                    <Separator className="my-1 opacity-50" />
                                    <Link
                                        to="/dashboard/settings/account-settings"
                                        onClick={() => setShowProfileDropdown(false)}
                                        className="flex w-full items-center gap-2 rounded-xl px-2 py-2 text-sm font-semibold text-slate-600 transition-all hover:bg-slate-50 dark:hover:bg-slate-800"
                                    >
                                        <Settings className="h-4 w-4" />
                                        {t('Account Settings')}
                                    </Link>
                                    <Link
                                        to="/dashboard/settings/profile"
                                        onClick={() => setShowProfileDropdown(false)}
                                        className="flex w-full items-center gap-2 rounded-xl px-2 py-2 text-sm font-semibold text-slate-600 transition-all hover:bg-slate-50 dark:hover:bg-slate-800"
                                    >
                                        <User className="h-4 w-4" />
                                        {t('School Profile')}
                                    </Link>
                                    <Separator className="my-1 opacity-50" />
                                    <button
                                        onClick={() => { setShowProfileDropdown(false); logout(); }}
                                        className="flex w-full items-center gap-2 rounded-xl px-2 py-2 text-sm font-semibold text-rose-600 transition-all hover:bg-rose-50 dark:hover:bg-rose-500/10"
                                    >
                                        <LogOut className="h-4 w-4" />
                                        {t('Log out')}
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Mobile hamburger (for secondary sheet) */}
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setShowMobileMenu(true)}
                        className={cn(iconBtn, 'xl:hidden ml-1')}
                        aria-label="Open mobile menu"
                    >
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#15316B]/8 font-bold text-[#15316B] shadow-sm border border-[#15316B]/15">
                            {userInit}
                        </div>
                    </Button>
                </div>
            </header>

            {/* ── Mobile bottom sheet ──────────────────── */}
            <AnimatePresence>
                {showMobileMenu && (
                    <>
                        {/* Overlay */}
                        <motion.div
                            key="mob-overlay"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm"
                            onClick={() => setShowMobileMenu(false)}
                        />

                        {/* Sheet */}
                        <motion.div
                            key="mob-sheet"
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', stiffness: 280, damping: 28 }}
                            className="nb-root fixed bottom-0 left-0 right-0 z-[70] rounded-t-3xl border-t border-slate-200 bg-white shadow-2xl"
                        >
                            {/* Drag handle */}
                            <div className="flex justify-center pt-3 pb-1">
                                <div className="h-1 w-10 rounded-full bg-slate-200" />
                            </div>

                            {/* Sheet header */}
                            <div className="flex items-center justify-between px-6 py-3">
                                <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                    Quick Access
                                </span>
                                <button
                                    onClick={() => setShowMobileMenu(false)}
                                    className="rounded-xl p-1.5 text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-600"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>

                            <Separator className="bg-slate-100" />

                            <div className="space-y-1 px-4 py-3">
                                {/* User info */}
                                <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3 mb-3">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#15316B]/8 font-bold text-[#15316B] shadow-sm border border-[#15316B]/15">
                                        {userInit}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-bold text-slate-900">{userName}</p>
                                        <span className={cn(
                                            'inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-mono text-[10px] font-black uppercase tracking-widest text-white mt-0.5',
                                            activeBgClass
                                        )}>
                                            <Zap className="h-2.5 w-2.5 fill-current" /> {currentPlan}
                                        </span>
                                    </div>
                                </div>

                                {/* Term selector — unrestricted admins only */}
                                {isUnrestrictedAdmin && (
                                <div className="space-y-1.5 mb-3">
                                    <label className="font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400 px-1">
                                        Viewing Term
                                    </label>
                                    <select
                                        value={viewingTerm?.id || ''}
                                        onChange={(e) => {
                                            const term = terms.find((t: any) => t.id === e.target.value);
                                            if (term) setViewingTerm(term);
                                        }}
                                        className="w-full cursor-pointer appearance-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 font-mono text-sm font-semibold text-slate-700 shadow-sm transition-all focus:border-[#15316B]/40 focus:outline-none focus:ring-2 focus:ring-[#15316B]/15"
                                    >
                                        {terms.map((term: any) => (
                                            <option key={term.id} value={term.id}>
                                                {term.name} ({term.session?.name || 'Session'}){term.isActive ? ' - Active' : ''}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                )}

                                {/* School Type Selector — mobile */}
                                {!isLoadingSchoolTypes && schoolTypes.length > 0 && (
                                    <div className="space-y-1.5 mb-3">
                                        <label className="font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400 px-1">
                                            School Type
                                        </label>
                                        <select
                                            value={activeSchoolType || ''}
                                            onChange={(e) => setActiveSchoolType(e.target.value)}
                                            className="w-full cursor-pointer appearance-none rounded-xl border border-[#F5B800]/30 bg-[#F5B800]/10 px-4 py-2.5 font-mono text-sm font-bold text-[#8a6a00] shadow-sm transition-all focus:border-[#F5B800]/50 focus:outline-none focus:ring-2 focus:ring-[#F5B800]/20"
                                        >
                                            {schoolTypes.map((st) => (
                                                <option key={st.id} value={st.name}>
                                                    🏫 {st.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                {/* Branch selector — mobile (SCHOOL_SUPER_ADMIN only) */}
                                {user?.role === 'SCHOOL_SUPER_ADMIN' && (
                                    <div className="space-y-1.5 mb-3">
                                        <label className="font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400 px-1">
                                            Branch Context
                                        </label>
                                        <select
                                            value={activeBranchId || 'all'}
                                            onChange={(e) => switchBranch(e.target.value)}
                                            className="w-full cursor-pointer appearance-none rounded-xl border border-[#7C3559]/25 bg-[#7C3559]/8 px-4 py-2.5 font-mono text-sm font-bold text-[#7C3559] shadow-sm transition-all focus:border-[#7C3559]/40 focus:outline-none focus:ring-2 focus:ring-[#7C3559]/15"
                                        >
                                            <option value="all">🏢 All Branches</option>
                                            {availableBranches.map((branch) => (
                                                <option key={branch.id} value={branch.id}>
                                                    📍 {branch.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                {/* App buttons */}
                                {/* <div className="grid grid-cols-2 gap-2 mb-3">
                                    <button className="flex items-center justify-center gap-2 rounded-xl bg-teal-500 px-4 py-3 text-xs font-semibold text-white shadow-sm transition-all hover:bg-teal-600 active:scale-95">
                                        <Apple className="h-4 w-4 fill-current" />
                                        App Store
                                    </button>
                                    <button className="flex items-center justify-center gap-2 rounded-xl bg-[#1E4DA6] px-4 py-3 text-xs font-semibold text-white shadow-sm transition-all hover:bg-[#173F8C] active:scale-95">
                                        <Play className="h-4 w-4 fill-current" />
                                        Google Play
                                    </button>
                                </div> */}

                                <Separator className="bg-slate-100 my-2" />

                                {/* Nav links */}
                                {[
                                    { to: '/dashboard/settings/profile', icon: <User className="h-4 w-4" />, label: 'School Profile' },
                                    { to: '/dashboard/settings/account-settings', icon: <Settings className="h-4 w-4" />, label: 'Account Settings' },
                                ].map((item) => (
                                    <Link
                                        key={item.to}
                                        to={item.to}
                                        onClick={() => setShowMobileMenu(false)}
                                        className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-600 transition-all hover:bg-slate-50 hover:text-slate-900"
                                    >
                                        <span className="text-slate-400">{item.icon}</span>
                                        {item.label}
                                    </Link>
                                ))}

                                <button
                                    onClick={() => { setShowMobileMenu(false); logout(); }}
                                    className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-rose-600 transition-all hover:bg-rose-50"
                                >
                                    <LogOut className="h-4 w-4" />
                                    {t('Log out')}
                                </button>
                            </div>

                            {/* Safe area spacer */}
                            <div className="h-6" />
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}
