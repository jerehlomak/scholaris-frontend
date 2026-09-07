import React from 'react';

export default function SchoolHeaderBlock({ data, config, design, toggles, globalSettings }: { data: any, config?: any, design?: any, toggles?: any, globalSettings?: any }) {
    const d = data?.schoolSettings || data?.school || {};
    const accentColor = design?.accentColor || config?.accentColor || '#1a7a40';
    const primaryColorForBanner = design?.primaryColor || config?.primaryColor || accentColor;
    // `{TERM}` / `{SESSION}` placeholders let a preset's badge read e.g.
    // "2ND TERM EXAM REPORT SHEET 2023/2024 SESSION" using this student's
    // actual term/session instead of a generic static label.
    const rawBadge = config?.reportBadge || 'ACADEMIC PROGRESS REPORT';
    const reportBadge = rawBadge
        .replace('{TERM}', (data?.student?.term || '').toUpperCase())
        .replace('{SESSION}', data?.student?.academicYear || '');
    const showArabicName = toggles?.showArabicName ?? config?.arabicSchoolName ?? true;
    
    const schoolName = d.schoolName || d.name || 'School Name';
    const fallbackLogoText = schoolName.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase();

    // Default to LEFT if not specified (legacy SIDE_BY_SIDE maps to LEFT)
    let alignMode = config?.headerLayoutMode || globalSettings?.schoolSettings?.resultConfig?.headerLayoutMode || toggles?.headerLayoutMode || 'LEFT';
    if (alignMode === 'SIDE_BY_SIDE') alignMode = 'LEFT';
    if (alignMode === 'CENTERED') alignMode = 'CENTER';

    // 'PLAIN_TEXT' — the badge/period line renders as plain bold caps text
    // instead of a colored pill (the "Bulletin" preset's minimal look).
    const badgeStyle = config?.badgeStyle || 'PILL';
    // 'THIN' — a single 1px top rule instead of the thick bottom border
    // (also "Bulletin"); default stays the existing thick bottom border.
    const borderStyle = config?.borderStyle || 'THICK_BOTTOM';

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
            {badgeStyle === 'PLAIN_TEXT' ? (
                <div className="text-[11px] font-bold tracking-wide mt-1.5 text-gray-800 uppercase">
                    {reportBadge}
                </div>
            ) : (
                <div className="inline-block px-3 py-0.5 rounded-[3px] text-[10px] font-bold tracking-wider mt-1 text-white uppercase" style={{ backgroundColor: accentColor }}>
                    {reportBadge}
                </div>
            )}
        </div>
    );

    if (alignMode === 'BANNER') {
        // "Ledger" preset: logo top-left, centered name/motto/address/phone,
        // then a full-width colored banner bar underneath the whole header
        // (not a small pill next to the text) carrying the report period.
        return (
            <div className="pb-0">
                <div className="flex items-start gap-4 pb-2">
                    <Logo />
                    <div className="flex-1 flex flex-col items-center text-center space-y-0.5">
                        <div className="text-[20px] font-bold uppercase leading-tight" style={{ color: primaryColorForBanner }}>{schoolName}</div>
                        {d.motto && <div className="text-[11px] text-gray-600 mt-0.5">MOTTO: {d.motto}</div>}
                        <div className="text-[11px] text-gray-600">
                            {d.address ? `Address: ${d.address}` : ''}
                        </div>
                        {d.phone && <div className="text-[11px] text-gray-600">Phone No: {d.phone}</div>}
                    </div>
                    <div className="w-16 h-16 shrink-0 opacity-0 pointer-events-none" />
                </div>
                <div className="text-center text-white font-bold text-[12px] uppercase tracking-wide py-1.5" style={{ backgroundColor: primaryColorForBanner }}>
                    {reportBadge}
                </div>
            </div>
        );
    }

    if (alignMode === 'CENTER') {
        return (
            <div className={`flex items-center gap-6 ${borderStyle === 'THIN' ? 'pt-2 border-t-2' : 'pb-2 border-b-[3px]'}`} style={{ borderColor: accentColor }}>
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
