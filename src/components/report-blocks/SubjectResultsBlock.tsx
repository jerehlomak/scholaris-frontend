import React from 'react';
import { ClipboardList } from 'lucide-react';

function ordinal(n: number): string {
    const s = ['TH', 'ST', 'ND', 'RD'];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

export default function SubjectResultsBlock({ data, config, design, toggles, globalSettings, masterConfig  }: { data: any, config?: any, design?: any, toggles?: any, globalSettings?: any, masterConfig?: any  }) {
    const title = config?.title || 'Subject results';
    const accentColor = design?.accentColor || config?.accentColor || '#1a7a40';
    const highlightTop = config?.highlightTop !== false;
    const showPassFail = config?.showPassFail === true;
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
    
    // Master Display Toggles take precedence over Template Config
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

    const layoutDensity = globalSettings?.schoolSettings?.resultConfig?.layoutDensity || 'STANDARD';
    const isUltraCompact = layoutDensity === 'ULTRA_COMPACT';
    const isCompact = layoutDensity === 'COMPACT';
    const padClass = isUltraCompact ? 'py-0.5 px-1' : isCompact ? 'py-1 px-1.5' : 'py-1.5 px-2';
    const textBaseClass = isUltraCompact ? 'text-[9px]' : isCompact ? 'text-[10px]' : 'text-[11px]';
    const textSmallClass = isUltraCompact ? 'text-[8px]' : 'text-[9px]';

    return (
        <div className="mb-4">
            <div className="text-[10px] font-bold uppercase tracking-widest pb-1.5 border-b-2 flex items-center gap-1.5 mb-2.5" style={{ color: accentColor, borderBottomColor: accentColor }}>
                <ClipboardList className="w-3.5 h-3.5" />
                <span>{title}</span>
            </div>
            
            <table className={`w-full ${textBaseClass} border-collapse`} style={{ tableLayout: 'auto' }}>
                <thead>
                    <tr>
                        <th className={`text-left ${textSmallClass} font-semibold uppercase tracking-wider text-gray-500 ${padClass} bg-gray-50 border-b border-gray-200`}>Subject</th>
                        {assessmentParts.map((p: any) => (
                            <th key={p.id} className={`text-center ${textSmallClass} font-semibold uppercase tracking-wider text-gray-500 ${padClass} bg-gray-50 border-b border-gray-200`}>
                                {p.name} <br/><span className="text-[7px] text-gray-400">({p.weight})</span>
                            </th>
                        ))}
                        {showCols.score && <th className={`text-center ${textSmallClass} font-semibold uppercase tracking-wider text-gray-500 ${padClass} bg-gray-50 border-b border-gray-200`}>Total</th>}
                        {showSubjectClassAverage && <th className={`text-center ${textSmallClass} font-semibold uppercase tracking-wider text-gray-500 ${padClass} bg-gray-50 border-b border-gray-200`}>Class Avg</th>}
                        {showHighestAvgSubj && <th className={`text-center ${textSmallClass} font-semibold uppercase tracking-wider text-gray-500 ${padClass} bg-gray-50 border-b border-gray-200`}>High</th>}
                        {showLowestAvgSubj && <th className={`text-center ${textSmallClass} font-semibold uppercase tracking-wider text-gray-500 ${padClass} bg-gray-50 border-b border-gray-200`}>Low</th>}
                        {showSubjectPosition && <th className={`text-center ${textSmallClass} font-semibold uppercase tracking-wider text-gray-500 ${padClass} bg-gray-50 border-b border-gray-200`}>Pos</th>}
                        {showCols.grade && <th className={`text-center ${textSmallClass} font-semibold uppercase tracking-wider text-gray-500 ${padClass} bg-gray-50 border-b border-gray-200`}>Grade</th>}
                        {showCols.progress && <th className={`text-left ${textSmallClass} font-semibold uppercase tracking-wider text-gray-500 ${padClass} bg-gray-50 border-b border-gray-200 min-w-[60px]`}>Progress</th>}
                        {showCols.remark && <th className={`text-left ${textSmallClass} font-semibold uppercase tracking-wider text-gray-500 ${padClass} bg-gray-50 border-b border-gray-200`}>Remark</th>}
                    </tr>
                </thead>
                <tbody>
                    {subjects.map((s: any, i: number) => {
                        const g = getGrade(s.score, s.backendGrade, s.remark);
                        return (
                            <tr key={i}>
                                <td className={`${padClass} border-b border-gray-100 font-bold text-gray-800`}>{s.name}</td>
                                {assessmentParts.map((p: any) => (
                                    <td key={p.id} className={`${padClass} border-b border-gray-100 text-center font-medium text-gray-600`}>
                                        {s.parts[p.name] !== undefined ? s.parts[p.name] : '-'}
                                    </td>
                                ))}
                                {showCols.score && <td className={`${padClass} border-b border-gray-100 text-center font-bold text-[#1E4DA6]`}>{s.score}</td>}
                                {showSubjectClassAverage && <td className={`${padClass} border-b border-gray-100 text-center text-gray-500`}>{s.avg}</td>}
                                {showHighestAvgSubj && <td className={`${padClass} border-b border-gray-100 text-center text-emerald-600 font-semibold`}>{s.high}</td>}
                                {showLowestAvgSubj && <td className={`${padClass} border-b border-gray-100 text-center text-red-500 font-semibold`}>{s.low}</td>}
                                {showSubjectPosition && <td className={`${padClass} border-b border-gray-100 text-center text-[#1E4DA6] font-semibold`}>{s.pos}</td>}
                                {showCols.grade && (
                                    <td className={`${padClass} border-b border-gray-100 text-center`}>
                                        <span className={`inline-block px-1.5 py-0.5 rounded-full ${isUltraCompact ? 'text-[8px]' : 'text-[10px]'} font-bold leading-none`} style={{ background: g.bg, color: g.fg }}>{g.label}</span>
                                    </td>
                                )}
                                {showCols.progress && (
                                    <td className={`${padClass} border-b border-gray-100`}>
                                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mt-0.5">
                                            <div className="h-full rounded-full" style={{ width: `${s.score}%`, backgroundColor: accentColor }}></div>
                                        </div>
                                    </td>
                                )}
                                {showCols.remark && <td className={`${padClass} border-b border-gray-100 text-gray-500 ${isUltraCompact ? 'text-[8px]' : 'text-[10px]'}`}>{g.remark || s.remark}</td>}
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
