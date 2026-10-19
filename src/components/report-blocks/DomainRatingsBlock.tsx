import React from 'react';

/**
 * DomainRatingsBlock — the "Affective / Psychomotor" rating grid on the report card.
 *
 * Renders the school's own trait setup (Result Settings → traits) with THIS student's
 * saved ratings (entered via Record Scores → Enter Trait Ratings): one column per
 * configured domain, showing the rating the teacher actually entered ('-' if none yet).
 * Reads the same fields the report card API returns for every renderer:
 *   data.schoolSettings.traitConfiguration  — [{ domain, traits[], ratingScale[] }]
 *   data.traits                             — [{ domain, ratings: { [trait]: rating } }]
 * No trait setup => nothing is rendered (never placeholder scores).
 */
interface DomainItem { label: string; score: string }
interface DomainGroup { title: string; items: DomainItem[]; scale: { rating: string; description?: string }[] }

function parseRatings(raw: any): Record<string, any> {
    if (!raw) return {};
    if (typeof raw === 'string') {
        try { return JSON.parse(raw) || {}; } catch { return {}; }
    }
    return raw;
}

function buildGroups(data: any): DomainGroup[] {
    const configs: any[] = data?.schoolSettings?.traitConfiguration;
    if (!Array.isArray(configs) || configs.length === 0) return [];
    const saved: any[] = Array.isArray(data?.traits) ? data.traits : [];
    return configs
        .map((tc: any) => {
            const ratings = parseRatings(saved.find((t: any) => t.domain === tc.domain)?.ratings);
            return {
                title: tc.domain,
                items: (Array.isArray(tc.traits) ? tc.traits : []).map((label: string) => ({ label, score: String(ratings[label] || '-') })),
                scale: Array.isArray(tc.ratingScale) ? tc.ratingScale : [],
            };
        })
        .filter((g: DomainGroup) => g.items.length > 0);
}

export default function DomainRatingsBlock({ data, config, design }: { data: any; config?: any; design?: any }) {
    const accentColor = design?.accentColor || config?.accentColor || '#F5B800';
    const primaryColor = design?.primaryColor || config?.primaryColor || '#0B1F4E';
    // 'STACKED' — one column above the other, for use in a narrow sidebar
    // (see the "Ledger" preset, where this sits beside the subject table).
    const isStacked = config?.layout === 'STACKED';

    const groups = buildGroups(data);
    if (groups.length === 0) return null;

    const scale = groups.find(g => g.scale.length > 0)?.scale || [];

    const Column = ({ title, items }: { title: string; items: DomainItem[] }) => (
        <div className="flex-1">
            <div className="text-[9px] font-bold uppercase tracking-widest pb-1 mb-1.5 border-b" style={{ color: primaryColor, borderBottomColor: accentColor }}>
                {title}
            </div>
            <div className="border border-gray-200 rounded overflow-hidden">
                {items.map((item, i) => (
                    <div key={item.label} className={`flex items-center justify-between px-2 py-1 ${i % 2 === 1 ? 'bg-gray-50' : 'bg-white'}`}>
                        <span className="text-[10px] text-gray-700">{item.label}</span>
                        <span className="min-w-[1.25rem] h-5 px-1 flex items-center justify-center rounded text-[10px] font-bold text-white shrink-0" style={{ backgroundColor: primaryColor }}>
                            {item.score}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );

    return (
        <div className="mb-4">
            <div className={isStacked ? 'flex flex-col gap-3' : 'flex gap-6'}>
                {groups.map(g => <Column key={g.title} title={g.title} items={g.items} />)}
            </div>
            {!isStacked && scale.length > 0 && (
                <p className="text-[8px] text-gray-500 mt-2 italic">
                    Scale: {scale.map(s => `${s.rating}${s.description ? ' = ' + s.description : ''}`).join('  ·  ')}
                </p>
            )}
        </div>
    );
}
