import React from 'react';
import { PenTool } from 'lucide-react';

export default function RemarksBlock({ data, config, design, globalSettings }: { data: any, config?: any, design?: any, globalSettings?: any }) {
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

    const activeRemarks = sigs.filter((sig: any, index: number) => {
        // Allow the user to toggle off specific remarks via Properties panel
        // Use either the explicit toggle key or fallback to true
        const key = sig.roleName || sig.role || sig.label;
        if (config?.[`hideRemark_${key}`] === true) return false;
        return true;
    });

    if (activeRemarks.length === 0) return null;

    if (layoutMode === 'ROW') {
        return (
            <div className="mb-2 flex flex-row gap-4">
                {activeRemarks.map((sig: any, idx: number) => {
                    const role = sig.roleName || sig.role || sig.label;
                    return (
                        <div key={idx} className="flex-1">
                            <div className="text-[9px] font-bold uppercase tracking-widest pb-1 border-b flex items-center justify-between gap-1.5 mb-1.5" style={{ color: accentColor, borderBottomColor: accentColor }}>
                                <div className="flex items-center gap-1.5">
                                    <PenTool className="w-3 h-3" />
                                    <span>{role}'s Remarks</span>
                                </div>
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
