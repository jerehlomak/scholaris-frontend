import React, { useState, useEffect, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronDown, Lock, X } from 'lucide-react';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { useSubscription } from '../../contexts/SubscriptionContext';
import { menuItems } from '../../config/menu';
import { usePermissions } from '../../hooks/usePermissions';
import { filterMenuTree } from '../../utils/permissions';
import axios from 'axios';
import { toast } from 'sonner';

const API_BASE = '/api/v1';

// The old per-school color-picker maps (sidebarBg/activeItemBg/text color
// options) were removed 14 Aug 2026 — the sidebar is now a fixed navy/gold
// panel, not user-customizable (see the "Fixed brand theme" block below).

// ─────────────────────────────────────────────────────────────────────────────
// Spring / easing configs
// ─────────────────────────────────────────────────────────────────────────────
const SIDEBAR_SPRING = { type: 'tween', duration: 0.3, ease: 'easeOut' } as any;
const SUBMENU_TRANSITION = { duration: 0.28, ease: [0.16, 1, 0.3, 1] as any };

// ─────────────────────────────────────────────────────────────────────────────
// Helper: render icon (handles both element and component)
// ─────────────────────────────────────────────────────────────────────────────
function RenderIcon({
    icon,
    size = 18,
    strokeWidth = 2,
    className,
}: {
    icon: any;
    size?: number;
    strokeWidth?: number;
    className?: string;
}) {
    if (React.isValidElement(icon)) {
        return <span className={className}>{icon}</span>;
    }
    const Icon = icon as React.ElementType;
    return <Icon size={size} strokeWidth={strokeWidth} className={className} />;
}

// ─────────────────────────────────────────────────────────────────────────────
// Tooltip for collapsed state
// ─────────────────────────────────────────────────────────────────────────────
function CollapsedTooltip({ label, isLight }: { label: string; isLight: boolean }) {
    return (
        <span
            className={cn(
                'pointer-events-none absolute left-full ml-3.5 z-[100]',
                'whitespace-nowrap rounded-xl px-3 py-1.5',
                'text-[12px] font-semibold tracking-wide',
                'opacity-0 group-hover:opacity-100',
                'translate-x-1 group-hover:translate-x-0',
                'transition-all duration-150 ease-out',
                'shadow-xl ring-1',
                isLight
                    ? 'bg-slate-900 text-white ring-white/5'
                    : 'bg-[#1a1a2e] text-white ring-white/10'
            )}
        >
            {label}
            {/* Arrow */}
            <span
                className={cn(
                    'absolute right-full top-1/2 -translate-y-1/2',
                    'border-[5px] border-transparent',
                    isLight ? 'border-r-slate-900' : 'border-r-[#1a1a2e]'
                )}
            />
        </span>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Branch Switcher Component
// ─────────────────────────────────────────────────────────────────────────────
const BranchSwitcher = ({ isDarkBg }: { isDarkBg: boolean }) => {
    const [branches, setBranches] = useState<any[]>([]);
    const [mainSchool, setMainSchool] = useState<any>(null);
    const [currentSchoolId, setCurrentSchoolId] = useState<string | null>(null);
    const [open, setOpen] = useState(false);

    useEffect(() => {
        axios.get(`${API_BASE}/school-settings/my-branches`, { withCredentials: true }).then((res: any) => {
            setBranches(res.data.branches);
            setMainSchool(res.data.mainSchool);
            setCurrentSchoolId(res.data.currentSchoolId);
        }).catch(() => {});
    }, []);

    const switchSchool = async (targetSchoolId: string) => {
        try {
            await axios.post(`${API_BASE}/auth/switch-school`, { targetSchoolId }, { withCredentials: true });
            toast.success('Switched school successfully!');
            window.location.reload();
        } catch (error: any) {
            toast.error(error.response?.data?.msg || 'Failed to switch school');
        }
    };

    if (!mainSchool && branches.length === 0) return null;

    return (
        <div className="px-3 mb-4 relative z-50">
            <div className="relative">
                <button
                    onClick={() => setOpen(!open)}
                    className={cn(
                        "w-full flex items-center justify-between px-3 py-2.5 rounded-xl border transition-all text-left",
                        isDarkBg 
                            ? "bg-white/5 border-white/10 hover:bg-white/10 text-white" 
                            : "bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700"
                    )}
                >
                    <div className="flex flex-col min-w-0">
                        <span className="text-[10px] font-bold uppercase tracking-wider opacity-60">Active School</span>
                        <span className="text-sm font-semibold truncate leading-tight mt-0.5">
                            {branches.find(b => b.id === currentSchoolId)?.name || mainSchool?.name || 'Loading...'}
                        </span>
                    </div>
                    <ChevronDown className={cn("w-4 h-4 opacity-50 transition-transform", open && "rotate-180")} />
                </button>

                <AnimatePresence>
                    {open && (
                        <motion.div
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -5 }}
                            transition={{ duration: 0.15 }}
                            className={cn(
                                "absolute top-full left-0 right-0 mt-2 p-1.5 rounded-2xl border shadow-xl max-h-64 overflow-y-auto",
                                isDarkBg 
                                    ? "bg-slate-800 border-white/10" 
                                    : "bg-white border-slate-200"
                            )}
                        >
                            {mainSchool && (
                                <div className="mb-1">
                                    <button
                                        onClick={() => switchSchool(mainSchool.id)}
                                        disabled={currentSchoolId === mainSchool.id}
                                        className={cn(
                                            "w-full text-left px-3 py-2.5 rounded-xl text-sm transition-colors",
                                            currentSchoolId === mainSchool.id
                                                ? (isDarkBg ? "bg-[#F5B800]/15 text-[#FFC72C] font-bold" : "bg-[#F5B800]/10 text-[#0B1F4E] font-bold")
                                                : (isDarkBg ? "text-white hover:bg-white/5" : "text-slate-700 hover:bg-slate-50")
                                        )}
                                    >
                                        <div className="flex items-center justify-between">
                                            <span>{mainSchool.name}</span>
                                            {currentSchoolId === mainSchool.id && (
                                                <span className="text-[10px] uppercase tracking-wider bg-[#F5B800]/20 px-2 py-0.5 rounded-md">Main</span>
                                            )}
                                        </div>
                                    </button>
                                </div>
                            )}

                            {branches.length > 0 && (
                                <div className="pt-1 mt-1 border-t border-white/10">
                                    <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider opacity-50">Branches</div>
                                    {branches.map(branch => (
                                        <button
                                            key={branch.id}
                                            onClick={() => switchSchool(branch.id)}
                                            disabled={currentSchoolId === branch.id}
                                            className={cn(
                                                "w-full text-left px-3 py-2.5 rounded-xl text-sm transition-colors",
                                                currentSchoolId === branch.id
                                                    ? (isDarkBg ? "bg-[#F5B800]/15 text-[#FFC72C] font-bold" : "bg-[#F5B800]/10 text-[#0B1F4E] font-bold")
                                                    : (isDarkBg ? "text-white hover:bg-white/5" : "text-slate-700 hover:bg-slate-50")
                                            )}
                                        >
                                            {branch.name}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
            {open && (
                <div className="fixed inset-0 z-[-1]" onClick={() => setOpen(false)} />
            )}
        </div>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// Sidebar
// ─────────────────────────────────────────────────────────────────────────────
export function Sidebar({ isOpen, onClose }: { isOpen: boolean; onClose?: () => void }) {
    const location = useLocation();
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({});
    const [expandedSubMenus, setExpandedSubMenus] = useState<Record<string, boolean>>({});
    const [mounted, setMounted] = useState(false);

    const { t } = useTranslation();
    const { hasFeatureAccess } = useSubscription();
    const { user, logout } = useAuth();
    const { hasPermission, isUnrestrictedAdmin } = usePermissions();

    const filteredMenuItems = useMemo(() => filterMenuTree(menuItems, {
        role: user?.role || '',
        isFormTeacher: user?.teacherProfile?.isFormTeacher === true,
        hasPermission,
    }), [user, hasPermission]);

    const sortedMenuItems = useMemo(() => {
        const active: any[] = [];
        const locked: any[] = [];
        let logout: any = null;

        filteredMenuItems.forEach(item => {
            if (item.title === 'Log out') {
                logout = item;
            } else {
                const isItemLocked = item.featureKey ? !hasFeatureAccess(item.featureKey) : false;
                if (isItemLocked) {
                    locked.push(item);
                } else {
                    active.push(item);
                }
            }
        });

        const result = [...active, ...locked];
        if (logout) result.push(logout);
        return result;
    }, [filteredMenuItems, hasFeatureAccess]);

    // Mount fade-in delay
    useEffect(() => {
        const timer = setTimeout(() => setMounted(true), 60);
        return () => clearTimeout(timer);
    }, []);

    // Responsive listener
    useEffect(() => {
        const handle = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handle);
        return () => window.removeEventListener('resize', handle);
    }, []);

    // Auto-expand menus based on current location
    useEffect(() => {
        menuItems.forEach(item => {
            if (item.children?.some(sub => 
                location.pathname === sub.path || 
                (sub.children?.some(grand => location.pathname === grand.path) ?? false)
            )) {
                setExpandedMenus(prev => ({ ...prev, [item.title]: true }));
                
                item.children?.forEach(sub => {
                    if (sub.children?.some(grand => location.pathname === grand.path)) {
                        setExpandedSubMenus(prev => ({ ...prev, [sub.title]: true }));
                    }
                });
            }
        });
    }, [location.pathname]);

    const toggleMenu = (title: string) =>
        setExpandedMenus((prev) => prev[title] ? {} : { [title]: true });

    // ── Fixed brand theme ──────────────────────────────────────────────────
    // Sidebar color is no longer user-customizable — the client explicitly
    // asked for "one consistent color for the whole school[s], unlike
    // skcoolyplus that is changeable" (section 1, item 3). ThemeContext's
    // sidebarBg/activeItemBg color-picker values are intentionally ignored
    // here; a fixed navy/gold panel replaces the old theme-map lookups.
    const isLight = false;
    const bgClass = 'bg-gradient-to-b from-[#15316B] to-[#0E2450] border-black/20';
    const activeBg = 'bg-[#F5B800]';
    const activeText = 'text-[#FFC72C]';
    const activeGlow = 'shadow-[#F5B800]/25';
    const activePill = 'bg-[#F5B800]/12';

    const defaultText = 'text-white/85';

    const hoverBg = 'hover:bg-white/[0.06]';
    const activeBgItem = activePill;

    // Label visible?
    const showLabel = isMobile ? true : isOpen;

    // Divider / section line color
    const dividerColor = 'border-white/[0.08]';

    // Submenu border
    const submenuBorder = 'border-white/[0.1]';

    // Section label color
    const sectionLabelColor = 'text-white/50';

    return (
        <>
            {/* ── Global styles ─────────────────────────────────────────── */}
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&display=swap');

                /* Nav item labels inherit the app's global Inter body font
                   (index.css) — kept only the monospace face for small
                   technical-feeling labels (.sb-mono: "Navigation", version
                   number), a deliberate detail rather than a full override. */
                .sb-root .sb-mono {
                    font-family: 'JetBrains Mono', monospace !important;
                }

                /* Subtle noise texture overlay for dark themes */
                .sb-noise::after {
                    content: '';
                    position: absolute;
                    inset: 0;
                    pointer-events: none;
                    opacity: 0.018;
                    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
                    background-size: 128px;
                }

                /* Stagger entrance */
                @keyframes sb-in {
                    from { opacity: 0; transform: translateX(-8px); }
                    to   { opacity: 1; transform: translateX(0); }
                }
                .sb-item-enter {
                    animation: sb-in 0.38s cubic-bezier(0.16,1,0.3,1) both;
                }

                /* Active item glow pulse */
                @keyframes sb-glow {
                    0%, 100% { opacity: 0.5; }
                    50%       { opacity: 0.9; }
                }
                .sb-active-glow {
                    animation: sb-glow 2.5s ease-in-out infinite;
                }

                /* Sidebar custom scrollbar */
                .sb-scroll::-webkit-scrollbar {
                    width: 6px;
                }
                .sb-scroll::-webkit-scrollbar-track {
                    background: transparent;
                }
                .sb-scroll::-webkit-scrollbar-thumb {
                    background: rgba(156, 163, 175, 0.5); 
                    border-radius: 10px;
                }
                .sb-scroll::-webkit-scrollbar-thumb:hover {
                    background: rgba(156, 163, 175, 0.8); 
                }
            `}</style>

            {/* ── Mobile overlay ────────────────────────────────────────── */}
            <AnimatePresence>
                {isMobile && isOpen && (
                    <motion.div
                        key="sb-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.22 }}
                        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-[3px]"
                        onClick={onClose}
                    />
                )}
            </AnimatePresence>

            {/* ── Sidebar panel ─────────────────────────────────────────── */}
            <motion.aside
                initial={false}
                animate={{
                    width: isMobile ? 284 : (isOpen ? 284 : 72),
                    x: isMobile ? (isOpen ? 0 : -300) : 0,
                }}
                transition={SIDEBAR_SPRING}
                className={cn(
                    'sb-root sb-noise',
                    'fixed start-0 top-0 z-50 md:z-40 h-screen',
                    'flex flex-col',
                    'border-r rtl:border-l rtl:border-r-0',
                    bgClass,
                    // Layered shadow for depth
                    'shadow-[4px_0_32px_-4px_rgba(0,0,0,0.18)]',
                    // Mount fade
                    mounted ? 'opacity-100' : 'opacity-0',
                    'transition-opacity duration-300',
                )}
            >

                {/* ── Header area ───────────────────────────────────────── */}
                <div className={cn(
                    'shrink-0 h-16 flex items-center border-b',
                    dividerColor,
                    showLabel ? 'px-5 justify-between' : 'px-0 justify-center',
                )}>
                    {/* Logo area when expanded */}
                    {showLabel && (
                        <motion.div
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                            className="flex items-center gap-2.5"
                        >
                            {/* Accent dot — small identity mark */}
                            <span className={cn(
                                'w-2 h-2 rounded-full shrink-0',
                                activeBg,
                                'shadow-lg',
                                activeGlow,
                                'sb-active-glow',
                            )} />
                            <span className={cn(
                                'sb-mono text-[11px] font-medium tracking-[0.18em] uppercase',
                                sectionLabelColor
                            )}>
                                Navigation
                            </span>
                        </motion.div>
                    )}

                    {/* Collapsed: show dot only */}
                    {!showLabel && (
                        <span className={cn(
                            'w-2 h-2 rounded-full shrink-0',
                            activeBg,
                            'sb-active-glow',
                        )} />
                    )}

                    {/* Mobile close button */}
                    {isMobile && isOpen && onClose && (
                        <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={onClose}
                            className={cn(
                                'rounded-xl p-2 transition-all duration-200',
                                isLight ? 'text-slate-500 hover:bg-slate-100 hover:text-slate-800' : 'text-white/80 hover:bg-white/10 hover:text-white'
                            )}
                        >
                            <X className="h-6 w-6" />
                        </motion.button>
                    )}
                </div>

                {/* ── Scrollable nav area ────────────────────────────────── */}
                <nav className="sb-scroll flex-1 overflow-y-auto pt-3 pb-8 px-2.5 space-y-0.5">
                    {/* Switching branches is a school-wide administrative action —
                        restricted to unrestricted admins, not staff with a custom role */}
                    {showLabel && isUnrestrictedAdmin && <BranchSwitcher isDarkBg={!isLight} />}
                    {sortedMenuItems.map((item, idx) => {
                        const isActive =
                            location.pathname === item.path ||
                            (item.children?.some((sub: any) => 
                                location.pathname === sub.path || 
                                (sub.children?.some((grand: any) => location.pathname === grand.path) ?? false)
                            ) ?? false);
                        const isExpanded = expandedMenus[item.title] ?? false;
                        const isItemLocked = item.featureKey ? !hasFeatureAccess(item.featureKey) : false;

                        return (
                            <div
                                key={item.title}
                                className="sb-item-enter"
                                style={{ animationDelay: `${idx * 36}ms` }}
                            >
                                {/* ── Check Locked State First ──────────────── */}
                                {isItemLocked ? (
                                    /* ── Locked item ──────────────────── */
                                    <div className={cn(
                                        'group relative flex items-center gap-3',
                                        'rounded-2xl px-3 py-2.5 text-[13px] font-normal',
                                        'cursor-not-allowed select-none',
                                        showLabel ? 'justify-between' : 'justify-center',
                                        isLight ? 'text-slate-300/70' : 'text-white/20',
                                    )} title="Module not subscribed">
                                        <div className="flex items-center gap-3 min-w-0">
                                            {/* Locked icon container */}
                                            <div className={cn(
                                                'shrink-0 flex items-center justify-center',
                                                'w-8 h-8 rounded-xl',
                                                isLight ? 'bg-slate-100/60' : 'bg-white/[0.04]'
                                            )}>
                                                <RenderIcon
                                                    icon={item.icon}
                                                    size={16}
                                                    strokeWidth={2}
                                                    className="text-white"
                                                />
                                            </div>
                                            {showLabel && (
                                                <span className="truncate leading-none opacity-50">
                                                    {t(item.title)}
                                                </span>
                                            )}
                                        </div>

                                        {showLabel && (
                                            <span className={cn(
                                                'shrink-0 flex items-center gap-1 rounded-lg px-1.5 py-0.5',
                                                'text-[9px] font-bold tracking-wide uppercase',
                                                'bg-rose-500/10 text-rose-400 ring-1 ring-rose-500/20'
                                            )}>
                                                <Lock className="h-2.5 w-2.5" strokeWidth={2.5} />
                                                Pro
                                            </span>
                                        )}

                                        {/* Collapsed tooltip with lock hint */}
                                        {!showLabel && (
                                            <CollapsedTooltip
                                                label={`${t(item.title)} — Module not subscribed`}
                                                isLight={isLight}
                                            />
                                        )}
                                    </div>

                                ) : item.children ? (
                                    /* ── Parent with children ──────────────── */
                                    <Button
                                        variant="ghost"
                                        onClick={() => toggleMenu(item.title)}
                                        className={cn(
                                            'group relative w-full h-auto flex items-center gap-3',
                                            'rounded-2xl px-3 py-2.5 text-[13px] font-normal',
                                            'transition-all duration-200',
                                            showLabel ? 'justify-between' : 'justify-center',
                                            // The shadcn `ghost` variant ships its own `hover:text-gray-900` —
                                            // a hover-scoped utility beats our plain (unscoped) `defaultText`
                                            // during :hover regardless of source order, since a `:hover`
                                            // pseudo-class selector outranks a plain class selector. Repeating
                                            // the hover state explicitly here lets tailwind-merge dedupe the
                                            // two `hover:text-*` utilities and keep ours instead.
                                            isActive
                                                ? `${activeBgItem} ${activeText}`
                                                : `${hoverBg} hover:text-white/85 ${defaultText}`,
                                        )}
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            {/* Icon container */}
                                            <div className={cn(
                                                'shrink-0 flex items-center justify-center',
                                                'w-8 h-8 rounded-xl transition-all duration-200',
                                                isActive
                                                    ? cn(activePill, activeText, 'shadow-md', activeGlow)
                                                    : isLight
                                                        ? 'group-hover:bg-slate-200/60'
                                                        : 'group-hover:bg-white/[0.08]'
                                            )}>
                                                <RenderIcon
                                                    icon={item.icon}
                                                    size={16}
                                                    strokeWidth={isActive ? 2.5 : 2}
                                                    className={cn(
                                                        'transition-transform duration-200 group-hover:scale-110',
                                                        isActive ? activeText : 'text-white/80'
                                                    )}
                                                />
                                            </div>

                                            {showLabel && (
                                                <span className="truncate leading-none">
                                                    {t(item.title)}
                                                </span>
                                            )}
                                        </div>

                                        {/* Chevron */}
                                        {showLabel && (
                                            <motion.div
                                                animate={{ rotate: isExpanded ? 90 : 0 }}
                                                transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] as any }}
                                                className={cn(
                                                    'shrink-0 transition-colors duration-200',
                                                    isActive ? activeText : 'text-white/80'
                                                )}
                                            >
                                                <ChevronRight className="h-3.5 w-3.5" />
                                            </motion.div>
                                        )}

                                        {/* Collapsed tooltip */}
                                        {!showLabel && (
                                            <CollapsedTooltip label={t(item.title)} isLight={isLight} />
                                        )}
                                    </Button>

                                ) : (
                                    /* ── Regular link ─────────────────── */
                                    <Link
                                        to={item.path ?? '#'}
                                        onClick={(e) => {
                                            if (item.title === 'Log out') {
                                                e.preventDefault();
                                                logout();
                                            }
                                        }}
                                        className={cn(
                                            'group relative flex items-center gap-3',
                                            'rounded-2xl px-3 py-2.5 text-[13px] font-normal',
                                            'transition-all duration-200 overflow-visible',
                                            showLabel ? '' : 'justify-center',
                                            isActive
                                                ? `${activeBgItem} ${activeText}`
                                                : `${hoverBg} ${defaultText}`,
                                        )}
                                    >
                                        {/* Active left rail indicator */}
                                        {isActive && (
                                            <motion.div
                                                layoutId="sb-active-rail"
                                                className={cn(
                                                    'absolute start-0 top-1/2 -translate-y-1/2',
                                                    'w-[3px] h-5 rounded-e-full',
                                                    activeBg,
                                                    'shadow-sm',
                                                )}
                                                transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                                            />
                                        )}

                                        {/* Icon container */}
                                        <div className={cn(
                                            'relative z-10 shrink-0',
                                            'flex items-center justify-center',
                                            'w-8 h-8 rounded-xl',
                                            'transition-all duration-200',
                                            isActive
                                                ? cn(activePill, 'shadow-md', activeGlow)
                                                : isLight
                                                    ? 'group-hover:bg-slate-200/60'
                                                    : 'group-hover:bg-white/[0.08]',
                                        )}>
                                            <RenderIcon
                                                icon={item.icon}
                                                size={16}
                                                strokeWidth={isActive ? 2.5 : 2}
                                                className={cn(
                                                    'transition-transform duration-200 group-hover:scale-110',
                                                    isActive ? activeText : 'text-white/80',
                                                )}
                                            />
                                        </div>

                                        {/* Label */}
                                        {showLabel && (
                                            <span className="relative z-10 truncate leading-none">
                                                {t(item.title)}
                                            </span>
                                        )}

                                        {/* Collapsed tooltip */}
                                        {!showLabel && (
                                            <CollapsedTooltip label={t(item.title)} isLight={isLight} />
                                        )}
                                    </Link>
                                )}

                                {/* ── Collapsible submenu ───────────────── */}
                                {item.children && showLabel && (
                                    <AnimatePresence initial={false}>
                                        {isExpanded && (
                                            <motion.div
                                                key="submenu"
                                                initial={{ opacity: 0, height: 0, y: -4 }}
                                                animate={{ opacity: 1, height: 'auto', y: 0 }}
                                                exit={{ opacity: 0, height: 0, y: -4 }}
                                                transition={SUBMENU_TRANSITION}
                                                className="overflow-hidden"
                                            >
                                                <ul className={cn(
                                                    'mt-1 ml-5 pl-3 space-y-0.5',
                                                    'border-l-2',
                                                    submenuBorder,
                                                )}>
                                                    {item.children.map((child: any, childIdx: any) => {
                                                        const isChildLocked = child.featureKey
                                                            ? !hasFeatureAccess(child.featureKey)
                                                            : false;
                                                        const isChildActive = !isChildLocked && (
                                                            location.pathname === child.path ||
                                                            (child.children?.some((grand: any) => location.pathname === grand.path) ?? false)
                                                        );

                                                        return (
                                                            <li
                                                                key={childIdx}
                                                                className="sb-item-enter"
                                                                style={{ animationDelay: `${childIdx * 28}ms` }}
                                                            >
                                                                {(() => {
                                                                    if (isChildLocked) {
                                                                        return (
                                                                            <div className={cn(
                                                                                'flex items-center justify-between',
                                                                                'px-3 py-2 rounded-xl text-[12.5px]',
                                                                                'cursor-not-allowed select-none',
                                                                                isLight
                                                                                    ? 'text-slate-300 bg-slate-50/80'
                                                                                    : 'text-white/20 bg-white/[0.03]',
                                                                            )} title="Module not subscribed">
                                                                                <span className="truncate opacity-50">
                                                                                    {t(child.title)}
                                                                                </span>
                                                                                <span className={cn(
                                                                                    'shrink-0 flex items-center gap-1',
                                                                                    'rounded-lg px-1.5 py-0.5 ml-2',
                                                                                    'text-[9px] font-bold tracking-wide uppercase',
                                                                                    'bg-rose-500/10 text-rose-400 ring-1 ring-rose-500/20'
                                                                                )}>
                                                                                    <Lock className="h-2.5 w-2.5" strokeWidth={2.5} />
                                                                                </span>
                                                                            </div>
                                                                        );
                                                                    }

                                                                    if (child.children) {
                                                                        return (
                                                                            <div className="space-y-0.5">
                                                                                <button
                                                                                    onClick={() => setExpandedSubMenus(prev => prev[child.title] ? {} : { [child.title]: true })}
                                                                                    className={cn(
                                                                                        'w-full group relative flex items-center justify-between',
                                                                                        'px-3 py-2 rounded-xl text-[12.5px] font-normal',
                                                                                        'transition-all duration-200',
                                                                                        expandedSubMenus[child.title]
                                                                                            ? `${activePill} ${activeText} font-[600]`
                                                                                            : `${hoverBg} ${defaultText}`,
                                                                                    )}
                                                                                >
                                                                                    <div className="flex items-center gap-2.5">
                                                                                        <span className={cn(
                                                                                            'shrink-0 w-1.5 h-1.5 rounded-full',
                                                                                            'transition-all duration-200',
                                                                                            expandedSubMenus[child.title] ? activeBg : 'bg-white/30'
                                                                                        )} />
                                                                                        <span className="truncate leading-none">
                                                                                            {t(child.title)}
                                                                                        </span>
                                                                                    </div>
                                                                                    <ChevronDown className={cn(
                                                                                        'h-3.5 w-3.5 transition-transform duration-200',
                                                                                        expandedSubMenus[child.title] ? 'rotate-180' : ''
                                                                                    )} />
                                                                                </button>
                                                                                <AnimatePresence initial={false}>
                                                                                    {expandedSubMenus[child.title] && (
                                                                                        <motion.ul
                                                                                            initial={{ opacity: 0, height: 0 }}
                                                                                            animate={{ opacity: 1, height: 'auto' }}
                                                                                            exit={{ opacity: 0, height: 0 }}
                                                                                            className="ml-4 pl-3 border-l border-slate-200 space-y-0.5"
                                                                                        >
                                                                                            {child.children.map((grandchild: any, gIdx: any) => (
                                                                                                <li key={gIdx}>
                                                                                                    <Link
                                                                                                        to={grandchild.path}
                                                                                                        className={cn(
                                                                                                            'block px-3 py-1.5 rounded-lg text-[12px] transition-all',
                                                                                                            location.pathname === grandchild.path
                                                                                                                ? `${activePill} ${activeText} font-semibold`
                                                                                                                : `${defaultText} opacity-70 ${hoverBg} hover:opacity-100`
                                                                                                        )}
                                                                                                    >
                                                                                                        {t(grandchild.title)}
                                                                                                    </Link>
                                                                                                </li>
                                                                                            ))}
                                                                                        </motion.ul>
                                                                                    )}
                                                                                </AnimatePresence>
                                                                            </div>
                                                                        );
                                                                    }

                                                                    return (
                                                                        <Link
                                                                            to={child.path!}
                                                                            onClick={(e) => {
                                                                                if (child.title === 'Log out') {
                                                                                    e.preventDefault();
                                                                                    logout();
                                                                                }
                                                                            }}
                                                                            className={cn(
                                                                                'group relative flex items-center gap-2.5',
                                                                                'px-3 py-2 rounded-xl text-[12.5px] font-normal',
                                                                                'transition-all duration-200',
                                                                                isChildActive
                                                                                    ? `${activePill} ${activeText} font-[600]`
                                                                                    : `${hoverBg} ${defaultText}`,
                                                                            )}
                                                                        >
                                                                            {/* Sub-item dot indicator */}
                                                                            <span className={cn(
                                                                                'shrink-0 w-1.5 h-1.5 rounded-full',
                                                                                'transition-all duration-200',
                                                                                isChildActive
                                                                                    ? cn(activeBg, 'shadow-sm')
                                                                                    : 'bg-white/40 group-hover:opacity-100',
                                                                            )} />
                                                                            <span className="truncate leading-none">
                                                                                {t(child.title)}
                                                                            </span>
                                                                        </Link>
                                                                    );
                                                                })()}
                                                            </li>
                                                        );
                                                    })}
                                                </ul>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                )}
                            </div>
                        );
                    })}
                </nav>

                {/* Dashboard Switcher */}
                {user?.role === 'TEACHER' && (
                    <div className="px-4 mt-2">
                        <Link
                            to="/teacher"
                            className={cn(
                                'flex items-center justify-center w-full gap-2 px-3 py-2 text-sm font-medium transition-colors rounded-lg',
                                isLight ? 'text-brand-green bg-brand-green/10 hover:bg-brand-green/20' : 'text-white bg-white/10 hover:bg-white/20'
                            )}
                        >
                            <span className="truncate">Teacher Portal</span>
                        </Link>
                    </div>
                )}

                {/* ── Footer rule ────────────────────────────────────────── */}
                <div className={cn(
                    'shrink-0 h-px mx-4',
                    isLight ? 'bg-slate-100' : 'bg-white/[0.06]'
                )} />

                {/* ── Footer version label ───────────────────────────────── */}
                <div className={cn(
                    'shrink-0 py-3 px-4 flex items-center',
                    showLabel ? 'justify-between' : 'justify-center',
                )}>
                    {showLabel ? (
                        <span className={cn(
                            'sb-mono text-[10px] tracking-widest',
                            'text-white/40'
                        )}>
                            v2.0
                        </span>
                    ) : (
                        <span className={cn(
                            'w-1.5 h-1.5 rounded-full',
                            isLight ? 'bg-slate-200' : 'bg-white/[0.12]'
                        )} />
                    )}
                </div>
            </motion.aside>
        </>
    );
}
