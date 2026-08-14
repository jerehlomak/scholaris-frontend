import React from 'react';

/**
 * DomainRatingsBlock — the two-column "Psychomotor Domain / Affective Domain"
 * numeric (1–5) rating grid common on Nigerian primary/junior-secondary
 * report cards (Handwriting, Punctuality, Neatness, etc.), distinct from
 * CommentSkillsGridBlock which renders a different shape entirely (an
 * early-years skills checklist with letter ratings and its own hardcoded
 * pastel palette) — reusing that block here would have shown the wrong
 * content. This one is purpose-built to match the reference format and
 * stays in the school's own primary/accent colors instead of a fixed
 * palette.
 *
 * Pulls from `data.domainRatings` if a school ever wires real per-student
 * ratings in; falls back to representative sample categories/scores so the
 * template gallery preview and any school that hasn't configured real data
 * yet still renders something sensible.
 */
interface DomainItem { label: string; score: number | string }

const DEFAULT_PSYCHOMOTOR: DomainItem[] = [
    { label: 'Handwriting', score: 4 },
    { label: 'Verbal Fluency', score: 4 },
    { label: 'Club & Society', score: 3 },
    { label: 'Sports', score: 4 },
    { label: 'Musical Skill', score: 3 },
];

const DEFAULT_AFFECTIVE: DomainItem[] = [
    { label: 'Punctuality', score: 5 },
    { label: 'Neatness', score: 4 },
    { label: 'Politeness', score: 5 },
    { label: 'Initiative', score: 4 },
    { label: 'Health', score: 4 },
];

export default function DomainRatingsBlock({ data, config, design }: { data: any; config?: any; design?: any }) {
    const accentColor = design?.accentColor || config?.accentColor || '#F5B800';
    const primaryColor = design?.primaryColor || config?.primaryColor || '#0B1F4E';

    const psychomotor: DomainItem[] = data?.domainRatings?.psychomotor?.length ? data.domainRatings.psychomotor : DEFAULT_PSYCHOMOTOR;
    const affective: DomainItem[] = data?.domainRatings?.affective?.length ? data.domainRatings.affective : DEFAULT_AFFECTIVE;

    const Column = ({ title, items }: { title: string; items: DomainItem[] }) => (
        <div className="flex-1">
            <div className="text-[9px] font-bold uppercase tracking-widest pb-1 mb-1.5 border-b" style={{ color: primaryColor, borderBottomColor: accentColor }}>
                {title}
            </div>
            <div className="border border-gray-200 rounded overflow-hidden">
                {items.map((item, i) => (
                    <div key={item.label} className={`flex items-center justify-between px-2 py-1 ${i % 2 === 1 ? 'bg-gray-50' : 'bg-white'}`}>
                        <span className="text-[10px] text-gray-700">{item.label}</span>
                        <span className="w-5 h-5 flex items-center justify-center rounded text-[10px] font-bold text-white shrink-0" style={{ backgroundColor: primaryColor }}>
                            {item.score}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );

    return (
        <div className="mb-4">
            <div className="flex gap-6">
                <Column title="Psychomotor Domain" items={psychomotor} />
                <Column title="Affective Domain" items={affective} />
            </div>
            <p className="text-[8px] text-gray-500 mt-2 italic">
                Scale: 1 = Poor &nbsp;·&nbsp; 2 = Fair &nbsp;·&nbsp; 3 = Good &nbsp;·&nbsp; 4 = Very Good &nbsp;·&nbsp; 5 = Distinction
            </p>
        </div>
    );
}
