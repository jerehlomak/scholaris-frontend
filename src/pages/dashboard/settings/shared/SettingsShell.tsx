import { useState, useEffect } from 'react';
import { ChevronRight } from 'lucide-react';
import { cn } from './../../../../lib/utils';

interface SettingsShellProps {
    /** e.g. "Settings" or "General Settings" */
    breadcrumbParent?: string;
    /** e.g. "Attendance Codes" */
    breadcrumbCurrent: string;
    /** The active tab label */
    tabLabel: string;
    /** Icon rendered next to the tab label */
    tabIcon: React.ReactNode;
    /** Page body */
    children: React.ReactNode;
}

export function SettingsShell({
    breadcrumbParent = 'Settings',
    breadcrumbCurrent,
    tabLabel,
    tabIcon,
    children,
}: SettingsShellProps) {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const t = setTimeout(() => setVisible(true), 60);
        return () => clearTimeout(t);
    }, []);

    return (
        <div className="min-h-screen bg-[#FBF9F5] px-2 pb-10 pt-6 sm:px-4 lg:px-8 print:p-0 print:m-0 print:bg-white print:block print:min-h-0 print:h-auto">

            <div className="mx-auto max-w-6xl print:block print:max-w-none">

                {/* Breadcrumb */}
                {/* Note: once `visible`, deliberately no transform class at all (not even
                    `translate-y-0`) — any non-`none` transform value, including a visually-
                    zero one, creates a new CSS stacking context and traps `fixed`-positioned
                    descendants (e.g. full-screen modals) below the Sidebar/Navbar, whose
                    z-index otherwise wins simply by not being trapped. Cost a real bug: a
                    modal overlay that rendered fully behind the sidebar instead of over it. */}
                <div
                    className={cn(
                        'print:hidden mb-5 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] transition-all duration-500',
                        visible ? 'opacity-100' : '-translate-y-2 opacity-0'
                    )}
                >
                    <span className="text-slate-400">{breadcrumbParent}</span>
                    <ChevronRight className="h-3 w-3 text-slate-300" />
                    <span className="text-[#15316B]">{breadcrumbCurrent}</span>
                </div>

                {/* Main panel */}
                <div
                    className={cn(
                        'print:overflow-visible print:border-none print:shadow-none print:bg-white print:m-0 print:block print:w-full overflow-hidden rounded-2xl border border-slate-200 bg-white transition-all duration-500',
                        visible ? 'opacity-100' : 'translate-y-3 opacity-0'
                    )}
                >
                    {/* Tab bar */}
                    <div className="print:hidden border-b border-slate-100 px-3 sm:px-6 lg:px-8">
                        <div className="inline-flex items-center gap-2 border-b-2 pb-3 pt-3.5" style={{ borderColor: '#F5B800' }}>
                            <span style={{ color: '#15316B' }}>{tabIcon}</span>
                            <span className="text-xs font-semibold tracking-tight" style={{ color: '#15316B' }}>
                                {tabLabel}
                            </span>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="px-3 pb-8 pt-8 sm:px-6 sm:pb-10 sm:pt-10 lg:px-8 print:p-0 print:m-0 print:block">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
}
