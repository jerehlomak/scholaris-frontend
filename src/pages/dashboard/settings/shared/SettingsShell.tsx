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
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=DM+Mono:wght@400;500;700&display=swap');
                .ss-root, .ss-root * { font-family: 'Plus Jakarta Sans', sans-serif !important; }
                .ss-root .font-mono { font-family: 'DM Mono', monospace !important; }
            `}</style>

            <div className="ss-root min-h-screen px-2 pb-10 pt-6 sm:px-4 lg:px-8 print:p-0 print:m-0 print:bg-white print:block print:min-h-0 print:h-auto">

                {/* Dot-grid background */}
                {/* <div
                    className="pointer-events-none fixed inset-0 opacity-[0.28]"
                    style={{
                        backgroundImage: 'radial-gradient(circle, #94a3b8 1px, transparent 1px)',
                        backgroundSize: '28px 28px',
                    }}
                /> */}

                <div className="relative z-10 mx-auto max-w-6xl print:block print:max-w-none">

                    {/* Breadcrumb */}
                    <div
                        className={cn(
                            'print:hidden mb-6 flex items-center gap-1.5 transition-all duration-500',
                            visible ? 'translate-y-0 opacity-100' : '-translate-y-2 opacity-0'
                        )}
                    >
                        <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-slate-500">
                            {breadcrumbParent}
                        </span>
                        <ChevronRight className="h-3 w-3 text-slate-400" />
                        <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-blue-600">
                            {breadcrumbCurrent}
                        </span>
                    </div>

                    {/* Main panel */}
                    <div
                        className={cn(
                            'print:overflow-visible print:border-none print:shadow-none print:bg-white print:m-0 print:block print:w-full overflow-hidden rounded-2xl border border-slate-200/80 bg-white/80 shadow-xl shadow-blue-900/5 backdrop-blur-xl transition-all duration-500',
                            visible ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0'
                        )}
                    >
                        {/* Tab bar */}
                        <div className="print:hidden border-b border-slate-100 bg-slate-50/80 px-3 sm:px-6 lg:px-8">
                            <div className="inline-flex items-center gap-2 border-b-2 border-blue-600 pb-3 pt-3.5">
                                <span className="text-blue-600">{tabIcon}</span>
                                <span className="text-xs font-bold tracking-tight text-blue-600">
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
        </>
    );
}
