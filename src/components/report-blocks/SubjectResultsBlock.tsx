import React from 'react';
import { ClipboardList } from 'lucide-react';
import { getRemarkColor } from './remarkColors';

function ordinal(n: number): string {
    const s = ['TH', 'ST', 'ND', 'RD'];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

export default function SubjectResultsBlock({ data, config, design, toggles, globalSettings, masterConfig  }: { data: any, config?: any, design?: any, toggles?: any, globalSettings?: any, masterConfig?: any  }) {
    const title = config?.title || 'Subject results';
    const accentColor = design?.accentColor || config?.accentColor || '#1a7a40';
    const primaryColor = design?.primaryColor || config?.primaryColor || accentColor;
    const highlightTop = config?.highlightTop !== false;
    const showPassFail = config?.showPassFail === true;

    // Visual variants — see templatePresets.ts "Ledger" / "Bulletin" presets.
    const isBordered = config?.variant === 'BORDERED';
    const isNavyHeader = config?.headerStyle === 'NAVY_BAR';
    const isColoredRemark = config?.remarkStyle === 'COLORED_BADGE';
    const showTotalRow = config?.showTotalRow === true;
    const showAverageRow = config?.showAverageRow === true;
    const tableBorderColor = design?.tableBorderColor || primaryColor;
    const baseShowCols = config?.showCols || { score: true, grade: true, progress: true, remark: true };
    const showCols = { ...baseShowCols };
    
    if (masterConfig?.subjectColumns && masterConfig.subjectColumns.length > 0) {
        const totalCol = masterConfig.subjectColumns.find((c: any) => c.key === 'total');
        if (totalCol) showCols.score = totalCol.show;
        
        const gradeCol = masterConfig.subjectColumns.find((c: any) => c.key === 'grade');
        if (gradeCol) showCols.grade = gradeCol.show;

        const remarkCol = masterConfig.subjectColumns.find((c: any) => c.key === 'remark');
        if (remarkCol) showCols.remark = remarkCol.show;
    }
    
    const t = toggles || {};

    // Master Display Toggles take precedence over Template Config, same as
    // every other preset — a school's own settings must control what shows
    // on every template, "Ledger" included (see PROJECT_BRIEF.md's template
    // scope note on this). The BORDERED variant's narrower sidebar-paired
    // width just means it needs to cope with extra columns gracefully
    // (tighter padding/font) rather than the table hiding columns the
    // school explicitly asked to see — see the width-aware sizing below.
    const showHighestAvgSubj = t.showHighestAvgSubj ?? config?.highestAverageInSubject ?? true;
    const showLowestAvgSubj = t.showLowestAvgSubj ?? config?.lowestAverageInSubject ?? true;
    const showSubjectClassAverage = t.showSubjectClassAverage ?? config?.subjectClassAverage ?? true;
    const showSubjectPosition = t.showSubjectPosition ?? config?.subjectPosition ?? true;

    // Dynamic grading scale from global settings
    let gradeScale = config?.gradeScale || [];
    if (globalSettings?.gradingScale && globalSettings.gradingScale.length > 0) {
        // Find SUBJECT scale
        const subjectScale = globalSettings.gradingScale.find((s: any) => s.type === 'SUBJECT');
        if (subjectScale && subjectScale.grades) {
            gradeScale = subjectScale.grades.map((g: any) => ({
                label: g.grade,
                min: Number(g.minScore),
                max: Number(g.maxScore),
                bg: g.status === 'PASS' ? '#e6f9ef' : '#fdecea',
                fg: g.status === 'PASS' ? '#1a7a40' : '#c0392b',
                remark: g.remark
            }));
        }
    }

    // Dynamic assessment structure
    let assessmentParts = [];
    if (masterConfig?.subjectColumns && masterConfig.subjectColumns.length > 0) {
        // Use the exactly passed dynamic subject columns from template generator/preview
        assessmentParts = masterConfig.subjectColumns.filter((c: any) => !c.computed && c.show !== false);
    } else {
        if (globalSettings?.assessmentStructure && globalSettings.assessmentStructure.length > 0) {
            assessmentParts = globalSettings.assessmentStructure[0].parts || [];
        }
        // Fallback if none defined
        if (assessmentParts.length === 0) {
            assessmentParts = [
                { id: '1', name: '1st CA', weight: 20 },
                { id: '2', name: '2nd CA', weight: 20 },
                { id: '3', name: 'Exam', weight: 60 }
            ];
        }
    }

    // Filter based on visibleTypes (CA_ONLY, EXAM_ONLY, FULL)
    const visibleTypes = data?.visibleTypes || ['FULL', 'CA', 'EXAM'];
    if (!visibleTypes.includes('FULL')) {
        showCols.score = false;
        showCols.grade = false;
        showCols.remark = false;
        showCols.progress = false;
        showCols.gpa = false;
        
        if (!visibleTypes.includes('CA')) {
            assessmentParts = assessmentParts.filter((p: any) => !p.name.toLowerCase().includes('ca') && !p.name.toLowerCase().includes('assessment'));
        }
        if (!visibleTypes.includes('EXAM')) {
            assessmentParts = assessmentParts.filter((p: any) => !p.name.toLowerCase().includes('exam'));
        }
    }

    // Data mapping
    const subjects = data?.results && data.results.length > 0 ? data.results.map((r: any) => ({
        name: r.subject?.name || 'Unknown',
        parts: r.scores || {},
        score: r.totalScore,
        gpa: r.gpa || '-',
        backendGrade: r.computedGrade || r.grade,
        remark: r.computedRemark || r.remark || '',
        high: r.highestScore !== undefined && r.highestScore !== null ? `${r.highestScore}` : '-',
        low: r.lowestScore !== undefined && r.lowestScore !== null ? `${r.lowestScore}` : '-',
        avg: r.classAvgScore !== undefined && r.classAvgScore !== null ? `${r.classAvgScore}` : '-',
        pos: r.subjectPosition ? ordinal(r.subjectPosition) : '-'
    })) : [
        { name: 'Mathematics', parts: { '1': 15, '2': 18, '3': 49 }, score: 82, gpa: 3.4, remark: 'Good', high: 95, low: 32, avg: 68, pos: '1ST' },
        { name: 'English Language', parts: { '1': 12, '2': 16, '3': 47 }, score: 75, gpa: 3.0, remark: 'Satisfactory', high: 88, low: 40, avg: 70, pos: '3RD' },
        { name: 'Biology', parts: { '1': 18, '2': 19, '3': 54 }, score: 91, gpa: 3.8, remark: 'Excellent', high: 91, low: 45, avg: 72, pos: '1ST' },
        { name: 'Chemistry', parts: { '1': 10, '2': 14, '3': 44 }, score: 68, gpa: 2.7, remark: 'Average', high: 85, low: 30, avg: 60, pos: '5TH' },
        { name: 'Physics', parts: { '1': 16, '2': 17, '3': 52 }, score: 85, gpa: 3.6, remark: 'Very Good', high: 90, low: 35, avg: 65, pos: '2ND' }
    ];

    const getGrade = (score: number, backendGrade?: string, backendRemark?: string) => {
        if (backendGrade) {
            const isFail = ['F', 'E', 'POOR', 'FAIL'].includes(backendGrade.toUpperCase());
            const isExcellent = ['A', 'A+', 'EXCELLENT'].includes(backendGrade.toUpperCase());
            return {
                label: backendGrade,
                bg: isFail ? '#fdecea' : isExcellent ? '#e6f9ef' : '#e0f2fe',
                fg: isFail ? '#c0392b' : isExcellent ? '#1a7a40' : '#0369a1',
                remark: backendRemark || (isFail ? 'Fail' : 'Pass')
            };
        }
        if (!gradeScale || gradeScale.length === 0) return { label: 'C', bg: '#fff8e1', fg: '#a06000', remark: 'Average' };
        for (const g of gradeScale) {
            if (score >= g.min && score <= g.max) return g;
        }
        return gradeScale[gradeScale.length - 1] || { label: 'C', bg: '#fff8e1', fg: '#a06000', remark: 'Average' };
    };

    const schoolLayoutDensity = globalSettings?.schoolSettings?.resultConfig?.layoutDensity || 'STANDARD';
    // BORDERED (Ledger) sits in a narrower sidebar-paired column and is
    // meant to be dense by design (the client's own "20 subjects on one
    // page" reference sheet), so its floor is COMPACT rather than the
    // school's STANDARD default — a school can still choose COMPACT or
    // ULTRA_COMPACT for an even tighter fit, this only raises the floor,
    // it never overrides an explicit tighter choice. This is a spacing
    // parameter, not a content toggle, so it doesn't touch what the school's
    // Display Toggles decide is shown — only how tightly it's packed.
    const layoutDensity = isBordered && schoolLayoutDensity === 'STANDARD' ? 'COMPACT' : schoolLayoutDensity;
    const isUltraCompact = layoutDensity === 'ULTRA_COMPACT';
    const isCompact = layoutDensity === 'COMPACT';
    const padClass = isUltraCompact ? 'py-0.5 px-1' : isCompact ? 'py-1 px-1.5' : 'py-1.5 px-2';
    const textBaseClass = isUltraCompact ? 'text-[9px]' : isCompact ? 'text-[10px]' : 'text-[11px]';
    const textSmallClass = isUltraCompact ? 'text-[8px]' : 'text-[9px]';

    // Border helpers — BORDERED gives every cell a full grid border in the
    // template's own primary color; the default stays the existing
    // border-bottom-only look.
    const cellBorderClass = isBordered ? 'border' : 'border-b';
    const cellBorderStyle = isBordered ? { borderColor: tableBorderColor } : { borderColor: '#f3f4f6' };
    const headBorderStyle = isBordered ? { borderColor: tableBorderColor } : { borderColor: '#e5e7eb' };
    const headCellClass = isNavyHeader
        ? `text-white ${textSmallClass} font-semibold uppercase tracking-wider ${padClass}`
        : `${textSmallClass} font-semibold uppercase tracking-wider text-gray-500 ${padClass} bg-gray-50`;
    const headCellStyle = isNavyHeader ? { backgroundColor: primaryColor } : undefined;

    // Column count — used to span the total/average summary rows correctly.
    const colCount = 1 + assessmentParts.length
        + (showCols.score ? 1 : 0) + (showSubjectClassAverage ? 1 : 0) + (showHighestAvgSubj ? 1 : 0)
        + (showLowestAvgSubj ? 1 : 0) + (showSubjectPosition ? 1 : 0) + (showCols.grade ? 1 : 0)
        + (showCols.progress ? 1 : 0) + (showCols.remark ? 1 : 0);

    const sumPart = (partName: string) => subjects.reduce((acc: number, s: any) => acc + (Number(s.parts[partName]) || 0), 0);
    const sumScore = subjects.reduce((acc: number, s: any) => acc + (Number(s.score) || 0), 0);

    return (
        <div className="mb-4">
            <div className="text-[10px] font-bold uppercase tracking-widest pb-1.5 border-b-2 flex items-center gap-1.5 mb-2.5" style={{ color: accentColor, borderBottomColor: accentColor }}>
                <ClipboardList className="w-3.5 h-3.5" />
                <span>{title}</span>
            </div>

            <table className={`w-full ${textBaseClass} border-collapse`} style={isBordered ? { tableLayout: 'auto', border: `1px solid ${tableBorderColor}` } : { tableLayout: 'auto' }}>
                <thead>
                    <tr>
                        <th className={`text-left ${cellBorderClass} ${headCellClass}`} style={{ ...headBorderStyle, ...headCellStyle }}>Subject</th>
                        {assessmentParts.map((p: any) => (
                            <th key={p.id} className={`text-center ${cellBorderClass} ${headCellClass}`} style={{ ...headBorderStyle, ...headCellStyle }}>
                                {p.name} <br/><span className={`text-[7px] ${isNavyHeader ? 'text-white/70' : 'text-gray-400'}`}>({p.weight})</span>
                            </th>
                        ))}
                        {showCols.score && <th className={`text-center ${cellBorderClass} ${headCellClass}`} style={{ ...headBorderStyle, ...headCellStyle }}>Total</th>}
                        {showSubjectClassAverage && <th className={`text-center ${cellBorderClass} ${headCellClass}`} style={{ ...headBorderStyle, ...headCellStyle }}>Class Avg</th>}
                        {showHighestAvgSubj && <th className={`text-center ${cellBorderClass} ${headCellClass}`} style={{ ...headBorderStyle, ...headCellStyle }}>High</th>}
                        {showLowestAvgSubj && <th className={`text-center ${cellBorderClass} ${headCellClass}`} style={{ ...headBorderStyle, ...headCellStyle }}>Low</th>}
                        {showSubjectPosition && <th className={`text-center ${cellBorderClass} ${headCellClass}`} style={{ ...headBorderStyle, ...headCellStyle }}>Pos</th>}
                        {showCols.grade && <th className={`text-center ${cellBorderClass} ${headCellClass}`} style={{ ...headBorderStyle, ...headCellStyle }}>Grade</th>}
                        {showCols.progress && <th className={`text-left ${cellBorderClass} ${headCellClass} min-w-[60px]`} style={{ ...headBorderStyle, ...headCellStyle }}>Progress</th>}
                        {showCols.remark && <th className={`text-left ${cellBorderClass} ${headCellClass}`} style={{ ...headBorderStyle, ...headCellStyle }}>Remark</th>}
                    </tr>
                </thead>
                <tbody>
                    {subjects.map((s: any, i: number) => {
                        const g = getGrade(s.score, s.backendGrade, s.remark);
                        const remarkText = g.remark || s.remark;
                        const remarkColor = isColoredRemark ? getRemarkColor(remarkText) : null;
                        return (
                            <tr key={i}>
                                <td className={`${padClass} ${cellBorderClass} font-bold text-gray-800`} style={cellBorderStyle}>{s.name}</td>
                                {assessmentParts.map((p: any) => (
                                    <td key={p.id} className={`${padClass} ${cellBorderClass} text-center font-medium text-gray-600`} style={cellBorderStyle}>
                                        {s.parts[p.name] !== undefined ? s.parts[p.name] : '-'}
                                    </td>
                                ))}
                                {showCols.score && <td className={`${padClass} ${cellBorderClass} text-center font-bold text-[#1E4DA6]`} style={cellBorderStyle}>{s.score}</td>}
                                {showSubjectClassAverage && <td className={`${padClass} ${cellBorderClass} text-center text-gray-500`} style={cellBorderStyle}>{s.avg}</td>}
                                {showHighestAvgSubj && <td className={`${padClass} ${cellBorderClass} text-center text-emerald-600 font-semibold`} style={cellBorderStyle}>{s.high}</td>}
                                {showLowestAvgSubj && <td className={`${padClass} ${cellBorderClass} text-center text-red-500 font-semibold`} style={cellBorderStyle}>{s.low}</td>}
                                {showSubjectPosition && <td className={`${padClass} ${cellBorderClass} text-center text-[#1E4DA6] font-semibold`} style={cellBorderStyle}>{s.pos}</td>}
                                {showCols.grade && (
                                    <td className={`${padClass} ${cellBorderClass} text-center`} style={cellBorderStyle}>
                                        <span className={`inline-block px-1.5 py-0.5 rounded-full ${isUltraCompact ? 'text-[8px]' : 'text-[10px]'} font-bold leading-none`} style={{ background: g.bg, color: g.fg }}>{g.label}</span>
                                    </td>
                                )}
                                {showCols.progress && (
                                    <td className={`${padClass} ${cellBorderClass}`} style={cellBorderStyle}>
                                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mt-0.5">
                                            <div className="h-full rounded-full" style={{ width: `${s.score}%`, backgroundColor: accentColor }}></div>
                                        </div>
                                    </td>
                                )}
                                {showCols.remark && (
                                    isColoredRemark ? (
                                        <td className={`${padClass} ${cellBorderClass} ${isUltraCompact ? 'text-[8px]' : 'text-[10px]'} text-center font-semibold`} style={{ ...cellBorderStyle, backgroundColor: remarkColor!.bg, color: remarkColor!.fg }}>
                                            {remarkText}
                                        </td>
                                    ) : (
                                        <td className={`${padClass} ${cellBorderClass} text-gray-500 ${isUltraCompact ? 'text-[8px]' : 'text-[10px]'}`} style={cellBorderStyle}>{remarkText}</td>
                                    )
                                )}
                            </tr>
                        );
                    })}
                    {showTotalRow && (
                        <tr>
                            <td className={`${padClass} ${cellBorderClass} font-bold`} style={{ ...cellBorderStyle, color: primaryColor }}>{config?.totalRowLabel || 'Total'}</td>
                            {assessmentParts.map((p: any) => (
                                <td key={p.id} className={`${padClass} ${cellBorderClass} text-center font-bold`} style={{ ...cellBorderStyle, color: primaryColor }}>{sumPart(p.name)}</td>
                            ))}
                            {showCols.score && <td className={`${padClass} ${cellBorderClass} text-center font-bold`} style={{ ...cellBorderStyle, color: primaryColor }}>{sumScore}</td>}
                            {Array.from({ length: colCount - 1 - assessmentParts.length - (showCols.score ? 1 : 0) }).map((_, i) => (
                                <td key={`totpad-${i}`} className={`${padClass} ${cellBorderClass}`} style={cellBorderStyle} />
                            ))}
                        </tr>
                    )}
                    {showAverageRow && (
                        <tr>
                            <td colSpan={colCount} className={`${padClass} ${cellBorderClass} font-bold`} style={{ ...cellBorderStyle, color: primaryColor, backgroundColor: `${primaryColor}0D` }}>
                                {config?.averageRowLabel || 'Percentage Average'}: {data?.summary?.average ? `${data.summary.average}%` : '—'}
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}
