import React from 'react';

export default function SignaturesBlock({ data, config, globalSettings }: { data: any, config?: any, globalSettings?: any }) {
    const footNote = config?.footNote || 'Computer-generated result. Valid without a stamp.';
    
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
       sigs = [{ roleName: 'Principal', url: '' }];
    }

    const activeSigs = sigs.filter((sig: any) => {
        const key = sig.roleName || sig.role || sig.label;
        if (config?.[`hideSignature_${key}`] === true) return false;
        return true;
    });

    const footerLayout = globalSettings?.schoolSettings?.resultConfig?.footerLayout || 'STACKED';
    const isMulti = footerLayout === 'MULTI_COLUMN';

    if (isMulti) {
        return (
            <div className="flex flex-col items-center py-1 mt-1 bg-gray-50 border-t border-gray-200 text-[9px] text-gray-400 rounded px-2">
                <div className="flex gap-4 items-end justify-center mb-1">
                    {activeSigs.map((sig: any, idx: number) => (
                        <div key={idx} className="flex flex-col items-center">
                            {sig.url ? (
                                <img src={sig.url} alt={`Signature ${idx + 1}`} className="h-5 mb-0.5 object-contain" />
                            ) : (
                                <div className="h-5"></div>
                            )}
                            <div className="w-20 border-t border-gray-300 pt-0.5 text-center font-semibold text-[8px] uppercase tracking-wider">{sig.roleName || sig.role || sig.label}</div>
                        </div>
                    ))}
                </div>
                <span className="font-medium text-center text-[8px]">{footNote}</span>
            </div>
        );
    }

    return (
        <div className="flex items-end justify-between px-3 py-1.5 mt-1 bg-gray-50 border-t border-gray-200 text-[9px] text-gray-400 rounded">
            <span className="font-medium text-[8px] mb-0.5">{footNote}</span>
            <div className="flex gap-6 items-end">
                {activeSigs.map((sig: any, idx: number) => (
                    <div key={idx} className="flex flex-col items-center">
                        {sig.url ? (
                            <img src={sig.url} alt={`Signature ${idx + 1}`} className="h-5 mb-0.5 object-contain" />
                        ) : (
                            <div className="h-5"></div>
                        )}
                        <div className="w-20 border-t border-gray-300 pt-0.5 text-center font-semibold text-[8px] uppercase tracking-wider">{sig.roleName || sig.role || sig.label}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}
