/**
 * remarkColors.ts — shared remark-text → color mapping.
 *
 * Grading scales (Settings → Marks & Grading) store grade/minScore/maxScore/
 * remark per band, but no explicit color — schools type their own remark
 * words freely ("V. Good", "Very Good", "Excellent", etc.), so there's no
 * fixed enum to switch on. Both SubjectResultsBlock's colored remark badges
 * and GradingKeyBlock's legend need the *same* color for the *same* remark
 * (so the table and its legend never disagree), hence one shared helper
 * instead of two hand-rolled mappings.
 *
 * Matching is case-insensitive substring matching against common Nigerian
 * report-card remark vocabulary, ordered so more specific phrases (e.g.
 * "very good") are checked before shorter ones they contain ("good").
 */
export interface RemarkColor {
    bg: string;
    fg: string;
}

const REMARK_RULES: { test: RegExp; color: RemarkColor }[] = [
    { test: /excellent|distinction/i, color: { bg: '#16a34a', fg: '#ffffff' } },      // green
    { test: /very\s*good|v\.?\s*good/i, color: { bg: '#bae6fd', fg: '#0369a1' } },    // sky blue
    { test: /^good$|^good\b/i, color: { bg: '#fde047', fg: '#78350f' } },             // yellow
    { test: /fair|average/i, color: { bg: '#78350f', fg: '#ffffff' } },               // dark brown
    { test: /weak|below\s*average/i, color: { bg: '#fbcfe8', fg: '#9d174d' } },       // pink
    { test: /poor|fail/i, color: { bg: '#fecaca', fg: '#991b1b' } },                  // red
    { test: /pass/i, color: { bg: '#dcfce7', fg: '#166534' } },                       // light green
];

const DEFAULT_COLOR: RemarkColor = { bg: '#f1f5f9', fg: '#475569' }; // neutral slate

export function getRemarkColor(remark: string | undefined | null): RemarkColor {
    if (!remark) return DEFAULT_COLOR;
    const match = REMARK_RULES.find(r => r.test.test(remark));
    return match ? match.color : DEFAULT_COLOR;
}
