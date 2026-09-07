import React from 'react';
import { getRemarkColor } from './remarkColors';

/**
 * GradingKeyBlock — the "Keys to Grading" / "Grading Key" legend seen on
 * both uploaded reference templates. Reads the school's real grading scale
 * (`data.gradingScale.grades` — the same scale SubjectResultsBlock's grade
 * badges are computed from server-side) rather than a hardcoded A–F table,
 * so a school with a different scale sees its own bands here, not someone
 * else's.
 *
 * Two visual styles, picked per-template via `config.style`:
 *  - 'LIST'  — bordered box, one row per band (Ledger/Unity reference)
 *  - 'PILLS' — a wrapped row of colored pills (Bulletin/MKK reference)
 */
const FALLBACK_GRADES = [
    { grade: 'A', minScore: 80, maxScore: 100, remark: 'Excellent' },
    { grade: 'B', minScore: 60, maxScore: 79, remark: 'V. Good' },
    { grade: 'C', minScore: 50, maxScore: 59, remark: 'Good' },
    { grade: 'D', minScore: 40, maxScore: 49, remark: 'Fair' },
    { grade: 'E', minScore: 30, maxScore: 39, remark: 'Weak' },
    { grade: 'F', minScore: 0, maxScore: 29, remark: 'Poor' },
];

export default function GradingKeyBlock({ data, design, config }: { data: any; design?: any; config?: any }) {
    const primaryColor = design?.primaryColor || config?.primaryColor || '#0B1F4E';
    const style = config?.style || 'LIST';
    const title = config?.title || 'Grading Key';

    const grades = (data?.gradingScale?.grades?.length ? data.gradingScale.grades : FALLBACK_GRADES)
        .slice()
        .sort((a: any, b: any) => Number(b.minScore) - Number(a.minScore));

    if (style === 'PILLS') {
        return (
            <div className="mb-3">
                <div className="text-white text-[10px] font-bold uppercase tracking-widest px-2 py-1 mb-1.5" style={{ backgroundColor: primaryColor }}>
                    {title}
                </div>
                <div className="flex flex-wrap gap-1.5">
                    {grades.map((g: any) => {
                        const c = getRemarkColor(g.remark);
                        return (
                            <span
                                key={g.grade}
                                className="text-[9px] font-semibold px-2 py-1 rounded-full whitespace-nowrap"
                                style={{ backgroundColor: c.bg, color: c.fg }}
                            >
                                {g.grade}: {g.minScore}–{g.maxScore} ({g.remark})
                            </span>
                        );
                    })}
                </div>
            </div>
        );
    }

    // LIST style
    return (
        <div className="border rounded overflow-hidden" style={{ borderColor: primaryColor }}>
            <div className="text-[10px] font-bold uppercase tracking-widest text-center py-1" style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}>
                {title}
            </div>
            <div className="divide-y" style={{ borderColor: `${primaryColor}30` }}>
                {grades.map((g: any) => (
                    <div key={g.grade} className="flex items-center justify-between px-2 py-1 text-[9px]" style={{ color: primaryColor }}>
                        <span className="font-bold">{g.grade} = {g.remark}</span>
                        <span className="font-mono">{g.minScore} - {g.maxScore}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
