import React from 'react';
import { PenTool } from 'lucide-react';

export default function RemarksBlock({ data, config, design, globalSettings, toggles }: { data: any, config?: any, design?: any, globalSettings?: any, toggles?: any }) {
    const accentColor = design?.accentColor || config?.accentColor || '#1a7a40';
    
    const rawSigs = globalSettings?.schoolSettings?.signatures || globalSettings?.schoolSettings?.resultConfig?.signatures || config?.signatures || [];
    let sigs: any[] = [];

    if (rawSigs && !Array.isArray(rawSigs) && (rawSigs['ALL'] || Object.values(rawSigs).some(Array.isArray))) {
        const sectionName = data?.student?.class?.name || data?.student?.section || 'ALL';
        sigs = rawSigs[sectionName] || rawSigs['ALL'] || Object.values(rawSigs).find(Array.isArray) || [];
    } else if (Array.isArray(rawSigs) && rawSigs.length > 0) {
        sigs = rawSigs;
    } else if (rawSigs && typeof rawSigs === 'object') {
        if (rawSigs.showSignature1) sigs.push({ roleName: rawSigs.signature1Label || 'Class Teacher', url: rawSigs.signature1Url });
        if (rawSigs.showSignature2) sigs.push({ roleName: rawSigs.signature2Label || 'Principal', url: rawSigs.signature2Url });
        if (rawSigs.showSignature3) sigs.push({ roleName: rawSigs.signature3Label || 'Director', url: rawSigs.signature3Url });
    }
    
    // See SignaturesBlock.tsx for why this normalization is needed — a
    // legacy per-section signatures shape can leave `sigs` as a non-array,
    // and `sigs.length === 0` silently passes on `undefined`, so `.filter()`
    // further down would otherwise throw.
    if (!Array.isArray(sigs)) sigs = [];

    if (sigs.length === 0) {
        sigs = [{ roleName: 'Class Teacher' }, { roleName: 'Principal' }];
    }

    // Determine layout
    const layoutMode = config?.remarkLayoutMode || 'COLUMN';

    // Figure out remark text for a specific role
    const getRemarkForRole = (role: string) => {
        const lowerRole = role.toLowerCase();
        
        // Check dynamic narrativeComments first (so custom roles or explicit mappings take precedence)
        const nComments = data?.comments?.narrativeComments;
        if (nComments) {
            const exactMatch = nComments[role] || nComments[role.toUpperCase()] || nComments[role.toLowerCase()];
            if (exactMatch) return exactMatch;
            
            const caseInsensitiveKey = Object.keys(nComments).find(k => k.toLowerCase() === lowerRole);
            if (caseInsensitiveKey && nComments[caseInsensitiveKey]) {
                return nComments[caseInsensitiveKey];
            }
        }

        // Exact matches for standard roles (since manual overrides are stored here)
        if (lowerRole === 'class teacher' || lowerRole === 'form teacher') {
            const val = data?.comments?.teacherComment || data?.comments?.teacher || data?.comments?.[0]?.teacherComment || data?.result?.classTeacherRemark;
            if (val) return val;
        }
        if (lowerRole === 'head teacher') {
            const val = data?.comments?.headComment || data?.comments?.[0]?.headComment || data?.result?.headTeacherRemark;
            if (val) return val;
        }
        if (lowerRole === 'principal' || lowerRole === 'director') {
            const val = data?.comments?.principalComment || data?.comments?.principal;
            if (val) return val;
        }

        // Aggressive fallbacks
        if (lowerRole.includes('class') || lowerRole.includes('form') || (lowerRole.includes('teacher') && !lowerRole.includes('head'))) {
            return data?.comments?.teacherComment || data?.comments?.teacher || data?.comments?.[0]?.teacherComment || data?.result?.classTeacherRemark || '';
        }
        if (lowerRole.includes('head')) {
            return data?.comments?.headComment || data?.comments?.[0]?.headComment || data?.result?.headTeacherRemark || '';
        }
        if (lowerRole.includes('principal') || lowerRole.includes('director')) {
            return data?.comments?.principalComment || data?.comments?.principal || '';
        }
        return '';
    };

    const t = toggles || {};
    const activeRemarks = sigs.filter((sig: any) => {
        // Allow the user to toggle off specific remarks via Properties panel
        // Use either the explicit toggle key or fallback to true
        const key = sig.roleName || sig.role || sig.label;
        if (config?.[`hideRemark_${key}`] === true) return false;

        // Display Toggles → "Class Teacher Remark" / "Head Teacher or
        // Principal Remark" (Result Settings → Display Toggles): these
        // previously only applied to the comment-based result system's own
        // narrative block, never to this one, so every score-based preset
        // (Heritage, Modern, Concise, Continuous Assessment, Ledger,
        // Bulletin) ignored them entirely.
        const lowerKey = (key || '').toLowerCase();
        const isClassTeacherRole = lowerKey.includes('class') || lowerKey.includes('form') || (lowerKey.includes('teacher') && !lowerKey.includes('head'));
        const isHeadOrPrincipalRole = lowerKey.includes('head') || lowerKey.includes('principal') || lowerKey.includes('director');
        if (isClassTeacherRole && t.showClassTeacherRemark === false) return false;
        if (isHeadOrPrincipalRole && t.showHeadTeacherRemark === false) return false;

        return true;
    });

    if (activeRemarks.length === 0) return null;

    // "Bulletin" preset: a solid navy banner titling the whole row of
    // remark columns (e.g. "REMARKS & SIGNATURES"), instead of each column
    // carrying its own small underlined label.
    const bannerTitle = config?.bannerTitle;
    const primaryColor = design?.primaryColor || accentColor;

    if (layoutMode === 'ROW') {
        const rowContent = (
            <div className="flex flex-row gap-4">
                {activeRemarks.map((sig: any, idx: number) => {
                    const role = sig.roleName || sig.role || sig.label;
                    return (
                        <div key={idx} className="flex-1">
                            {!bannerTitle && (
                                <div className="text-[9px] font-bold uppercase tracking-widest pb-1 border-b flex items-center justify-between gap-1.5 mb-1.5" style={{ color: accentColor, borderBottomColor: accentColor }}>
                                    <div className="flex items-center gap-1.5">
                                        <PenTool className="w-3 h-3" />
                                        <span>{role}'s Remarks</span>
                                    </div>
                                </div>
                            )}
                            {bannerTitle && (
                                <div className="text-[8px] font-bold uppercase tracking-widest text-gray-500 mb-1">{role}</div>
                            )}
                            <div className="flex items-start justify-between min-h-[30px] p-2 bg-gray-50 border-l-[2px] rounded-r" style={{ borderLeftColor: accentColor }}>
                                <div className="text-[10px] text-gray-700 italic pr-2 flex-1 leading-snug">
                                    {getRemarkForRole(role) || <span className="text-gray-300">No remark provided...</span>}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        );

        if (bannerTitle) {
            return (
                <div className="mb-2">
                    <div className="text-white text-[10px] font-bold uppercase tracking-widest px-2 py-1 mb-2" style={{ backgroundColor: primaryColor }}>
                        {bannerTitle}
                    </div>
                    {rowContent}
                </div>
            );
        }

        return <div className="mb-2">{rowContent}</div>;
    }

    if (layoutMode === 'CENTERED_LINE') {
        // "Ledger" preset: plain centered "Role's Comment: text" lines, no
        // boxes — matches the reference sheet's footer exactly. Optionally
        // prints the class teacher's actual name above their comment line
        // (a real name, from the class's assigned form teacher — not the
        // comment text, which is a separate field).
        const showTeacherName = config?.showTeacherName === true;
        const teacherName = data?.student?.classTeacherName;
        return (
            <div className="mb-2 text-center space-y-1">
                {showTeacherName && teacherName && (
                    <div className="text-[10px] font-bold text-gray-800">Class Teacher's Name: {teacherName}</div>
                )}
                {activeRemarks.map((sig: any, idx: number) => {
                    const role = sig.roleName || sig.role || sig.label;
                    const text = getRemarkForRole(role);
                    if (!text) return null;
                    return (
                        <div key={idx} className="text-[10px] text-gray-800">
                            <span className="font-bold">{role}'s Comment:</span> {text}
                        </div>
                    );
                })}
            </div>
        );
    }

    return (
        <div className="mb-2 space-y-3">
            {activeRemarks.map((sig: any, idx: number) => {
                const role = sig.roleName || sig.role || sig.label;
                return (
                    <div key={idx} className="pt-2 border-t border-gray-100 first:border-0 first:pt-0">
                        <div className="text-[9px] font-bold uppercase tracking-widest pb-1 border-b flex items-center gap-1.5 mb-1.5" style={{ color: accentColor, borderBottomColor: accentColor }}>
                            <PenTool className="w-3 h-3" />
                            <span>{role}'s Remarks</span>
                        </div>
                        <div className="flex items-start justify-between min-h-[30px] p-2 bg-gray-50 border-l-[2px] rounded-r" style={{ borderLeftColor: accentColor }}>
                            <div className="text-[10px] text-gray-700 italic pr-2 flex-1 leading-snug">
                                {getRemarkForRole(role) || <span className="text-gray-300">No remark provided...</span>}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
