import React from 'react';

export default function CommentSignaturesBlock({ data, config, globalSettings }: { data: any, config?: any, globalSettings?: any }) {
    const textColor = config?.textColor || '#000000';
    
    const sourceSig = config?.signatures || globalSettings?.schoolSettings?.resultConfig?.signatures || [];
    let sigs: any[] = [];

    if (Array.isArray(sourceSig) && sourceSig.length > 0) {
        sigs = sourceSig;
    } else if (sourceSig && typeof sourceSig === 'object' && !Array.isArray(sourceSig)) {
        if (sourceSig.showSignature1) sigs.push({ label: sourceSig.signature1Label || 'Class Teacher' });
        if (sourceSig.showSignature2) sigs.push({ label: sourceSig.signature2Label || 'Principal' });
        if (sourceSig.showSignature3) sigs.push({ label: sourceSig.signature3Label || 'Director' });
    }

    if (sigs.length === 0) {
       sigs = [{ label: 'Principal' }];
    }

    return (
        <div className="mb-4 space-y-8" style={{ color: textColor }}>
            <div className={`flex items-end px-12 pt-8 ${sigs.length === 1 ? 'justify-center' : 'justify-between'}`}>
                {sigs.map((sig: any, idx: number) => (
                    <div key={idx} className="text-center">
                        <div className="w-48 border-b-2 border-black mb-2" style={{ borderColor: textColor }}></div>
                        <div className="font-bold text-sm uppercase">Sign & Date</div>
                        <div className="text-xs">{sig.label || sig.roleName || sig.role}</div>
                    </div>
                ))}
            </div>

            <div className="bg-black text-white text-center font-bold text-sm py-2">
                NOTE: ANY ALTERATION RENDERS THIS RESULT INVALID
            </div>
        </div>
    );
}
