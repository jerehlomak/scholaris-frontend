import React from 'react';
import { Activity } from 'lucide-react';

export default function TraitRatingsBlock({ data, config, design, globalSettings, toggles  }: { data: any, config?: any, design?: any, globalSettings?: any, toggles?: any  }) {
    const title = config?.title || 'Behavioral & Trait Ratings';
    const accentColor = design?.accentColor || config?.accentColor || '#1a7a40';
    const t = toggles || {};
    
    // Read dynamic traits from global settings
    let traitGroups: any[] = [];
    const actualTraitConfig = globalSettings?.schoolSettings?.traitConfiguration || globalSettings?.traitConfiguration;
    
    if (actualTraitConfig && actualTraitConfig.length > 0) {
        const studentTraits = data?.traits || [];
        traitGroups = actualTraitConfig.map((tc: any) => {
            const domainRecord = studentTraits.find((st: any) => st.domain === tc.domain);
            let ratingsMap: any = {};
            if (domainRecord && domainRecord.ratings) {
                ratingsMap = typeof domainRecord.ratings === 'string' ? JSON.parse(domainRecord.ratings) : domainRecord.ratings;
            }
            return {
                group: tc.domain,
                items: Array.isArray(tc.traits) ? tc.traits.map((tr: string) => ({ label: tr, score: ratingsMap[tr] || '-' })) : [],
                scale: tc.ratingScale
            };
        });
    } else {
        // Fallback
        traitGroups = data?.traits || [
            {
                group: 'AFFECTIVE DOMAIN',
                items: [
                    { label: 'Punctuality', score: 'A' },
                    { label: 'Neatness', score: 'B' },
                    { label: 'Honesty', score: 'A' }
                ],
                scale: [{rating: 'A', description: 'Excellent'}]
            }
        ];
    }
    
    if (traitGroups.length === 0) return null;

    return (
        <div className="mb-4">
            <div className="text-[10px] font-bold uppercase tracking-widest pb-1.5 border-b-2 flex items-center gap-1.5 mb-2.5" style={{ color: accentColor, borderBottomColor: accentColor }}>
                <Activity className="w-3.5 h-3.5" />
                <span>{title}</span>
            </div>

            <div className={`grid ${traitGroups.length === 1 ? 'grid-cols-1' : 'grid-cols-2'} gap-x-6 gap-y-2`}>
                {traitGroups.map((group: any) => (
                    <div key={group.group}>
                        <div className="text-[9px] font-bold uppercase tracking-wider text-gray-500 mb-0.5">{group.group}</div>
                        <table className="w-full text-[10px] border-collapse" style={{ tableLayout: 'fixed' }}>
                            <tbody>
                                {group.items.map((item: any) => (
                                    <tr key={item.label} className="border-b border-gray-100 last:border-0">
                                        <td className="py-0.5 text-gray-600 leading-tight">{item.label}</td>
                                        <td className="py-0.5 text-right w-8"><span className="inline-block font-bold text-gray-800">{item.score || '-'}</span></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {(config?.traitRatingsScale ?? t.showTraitScale ?? true) && group.scale && group.scale.length > 0 && (
                            <div className="mt-0.5 text-[7px] text-gray-400 leading-tight">
                                {group.scale.map((s: any) => `${s.rating}=${s.description}`).join(', ')}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
