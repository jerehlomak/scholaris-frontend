import React from 'react';

export default function SchoolHeaderBlock({ data, config, design, toggles, globalSettings }: { data: any, config?: any, design?: any, toggles?: any, globalSettings?: any }) {
    const d = data?.schoolSettings || data?.school || {};
    const accentColor = design?.accentColor || config?.accentColor || '#1a7a40';
    const reportBadge = config?.reportBadge || 'ACADEMIC PROGRESS REPORT';
    const showArabicName = toggles?.showArabicName ?? config?.arabicSchoolName ?? true;
    
    const schoolName = d.schoolName || d.name || 'School Name';
    const fallbackLogoText = schoolName.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase();

    // Default to LEFT if not specified (legacy SIDE_BY_SIDE maps to LEFT)
    let alignMode = config?.headerLayoutMode || globalSettings?.schoolSettings?.resultConfig?.headerLayoutMode || toggles?.headerLayoutMode || 'LEFT';
    if (alignMode === 'SIDE_BY_SIDE') alignMode = 'LEFT';
    if (alignMode === 'CENTERED') alignMode = 'CENTER';

    const Logo = ({ className = '' }) => (
        d.logoUrl ? (
            <img src={d.logoUrl} alt="Logo" className={`w-16 h-16 rounded-lg object-contain bg-white shrink-0 ${className}`} />
        ) : (
            <div className={`w-16 h-16 rounded-lg flex items-center justify-center text-xl font-bold text-white shrink-0 ${className}`} style={{ backgroundColor: accentColor }}>
                {d.logoText || fallbackLogoText}
            </div>
        )
    );

    const ArabicText = ({ className = '' }) => (
        showArabicName ? (
            <div className={`text-xl font-bold text-gray-800 ${className}`} dir="rtl">
                {d.arabicName || "المدرسة العربية الدولية"}
            </div>
        ) : null
    );

    const TextDetails = ({ alignClass = 'text-left' }) => (
        <div className={alignClass}>
            <div className="text-[20px] font-bold text-gray-900 leading-tight">
                {schoolName}
            </div>
            <div className="text-[12px] text-gray-500 mt-0.5">
                {d.address || "School Address"}{d.phone ? ` • Tel: ${d.phone}` : ''}
            </div>
            {d.motto && (
                <div className="text-[11px] text-gray-500 italic mt-0.5">
                    Motto: {d.motto}
                </div>
            )}
            <div className="inline-block px-3 py-0.5 rounded-[3px] text-[10px] font-bold tracking-wider mt-1 text-white uppercase" style={{ backgroundColor: accentColor }}>
                {reportBadge}
            </div>
        </div>
    );

    if (alignMode === 'CENTER') {
        return (
            <div className="flex items-center pb-2 border-b-[3px] gap-6" style={{ borderColor: accentColor }}>
                <Logo className="self-start" />
                <div className="flex-1 flex flex-col items-center space-y-0.5">
                    <ArabicText className="text-center w-full" />
                    <TextDetails alignClass="text-center w-full" />
                </div>
                {/* Invisible spacer to keep center alignment perfect */}
                <div className="w-16 h-16 shrink-0 opacity-0 pointer-events-none" />
            </div>
        );
    }

    if (alignMode === 'RIGHT') {
        return (
            <div className="flex items-start gap-6 pb-2 border-b-[3px]" style={{ borderColor: accentColor }}>
                <div className="flex-1 flex flex-col justify-start items-start">
                    <ArabicText className="text-left" />
                </div>
                <TextDetails alignClass="text-right" />
                <Logo />
            </div>
        );
    }

    // Default: LEFT
    return (
        <div className="flex items-start gap-6 pb-2 border-b-[3px]" style={{ borderColor: accentColor }}>
            <Logo />
            <TextDetails alignClass="text-left" />
            <div className="flex-1 flex flex-col justify-start items-end">
                <ArabicText className="text-right" />
            </div>
        </div>
    );
}
