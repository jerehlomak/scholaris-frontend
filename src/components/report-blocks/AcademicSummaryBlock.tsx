import React from 'react';
import { PieChart } from 'lucide-react';

export default function AcademicSummaryBlock({ data, config, design, toggles, globalSettings }: { data: any, config?: any, design?: any, toggles?: any, globalSettings?: any }) {
    const s = data?.summary || {};
    const title = config?.title || 'Academic summary';
    const accentColor = design?.accentColor || config?.accentColor || '#1a7a40';
    const t = toggles || {};
    
    // Calculate light color safely or use a default extremely light version
    const lightBg = `${accentColor}15`; // 15% opacity hex

    const cards = [];
    const results = data?.results || [];
    
    // Compute passes/fails
    const corePassed = results.filter((r: any) => r.isPassing && (!r.subject?.type || r.subject?.type?.toLowerCase() === 'core')).length;
    const coreFailed = results.filter((r: any) => !r.isPassing && (!r.subject?.type || r.subject?.type?.toLowerCase() === 'core')).length;
    const electivePassed = results.filter((r: any) => r.isPassing && r.subject?.type?.toLowerCase() === 'elective').length;
    const electiveFailed = results.filter((r: any) => !r.isPassing && r.subject?.type?.toLowerCase() === 'elective').length;

    // Use overallGrade or compute from data
    let finalGrade = s.overallGrade;
    if (!finalGrade && s.average && data?.gradingScale?.grades) {
        const avg = parseFloat(s.average);
        const sortedGrades = [...data.gradingScale.grades].sort((a, b) => Number(b.minScore) - Number(a.minScore));
        for (const g of sortedGrades) {
            if (avg >= Number(g.minScore) && avg <= Number(g.maxScore)) {
                finalGrade = g.grade;
                break;
            }
        }
        if (!finalGrade) finalGrade = 'F';
    }
    if (!finalGrade) finalGrade = 'N/A';

    if (t.showFinalAverage === false ? false : (config?.finalAverage ?? true)) cards.push({ label: 'Average Score', value: s.average ? `${s.average}%` : 'N/A' });
    if (t.showFinalGrade === false ? false : (config?.finalGrade ?? true)) cards.push({ label: 'Final Grade', value: finalGrade });
    if (t.showOutof === false ? false : (config?.outOf ?? true)) {
        const outOf = s.totalSubjects ? s.totalSubjects * 100 : 'N/A';
        cards.push({ label: 'Total Score', value: `${s.totalScore || 'N/A'} / ${outOf}` });
    }
function ordinal(n: number): string {
    const s = ['TH', 'ST', 'ND', 'RD'];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

    const showClassPositionToggle = t.showClassPosition !== undefined ? t.showClassPosition : t.showOverallPosition;
    if (showClassPositionToggle === false ? false : (config?.showOverallPosition ?? true)) cards.push({ label: 'Class Position', value: s.overallPosition ? ordinal(Number(s.overallPosition)) : 'N/A' });
    if (t.showClassAverage === false ? false : (config?.classAverage ?? true)) cards.push({ label: 'Class Average', value: s.classAverage ? `${s.classAverage}%` : 'N/A' });
    if (t.showHighestAvgClass === false ? false : (config?.highestAverageInClass ?? true)) cards.push({ label: 'Highest Avg', value: s.highestAvg ? `${s.highestAvg}%` : 'N/A' });
    if (t.showLowestAvgClass === false ? false : (config?.lowestAverageInClass ?? true)) cards.push({ label: 'Lowest Avg', value: s.lowestAvg ? `${s.lowestAvg}%` : 'N/A' });
    
    if (t.showTotalSubjects === false ? false : (config?.totalSubjectsOffered ?? true)) cards.push({ label: 'Subjects Offered', value: s.totalSubjects || results.length || 'N/A' });
    if (t.showCorePassed === false ? false : (config?.coreSubjectsPassed ?? true)) cards.push({ label: 'Core Passed', value: corePassed });
    if (t.showCoreFailed === false ? false : (config?.coreSubjectsFailed ?? true)) cards.push({ label: 'Core Failed', value: coreFailed });
    if (t.showElectivePassed === false ? false : (config?.electiveSubjectsPassed ?? true)) cards.push({ label: 'Elective Passed', value: electivePassed });
    if (t.showElectiveFailed === false ? false : (config?.electiveSubjectsFailed ?? true)) cards.push({ label: 'Elective Failed', value: electiveFailed });
    if (t.showTotalStudents === false ? false : (config?.totalStudentsInClass ?? true)) cards.push({ label: 'Students in Class', value: s.studentsInClass || s.totalStudents || 'N/A' });

    const summaryGridLayout = globalSettings?.schoolSettings?.resultConfig?.summaryGridLayout || '4';
    const isRibbon = summaryGridLayout === 'RIBBON';
    
    // Determine dynamic grid columns if not ribbon
    let gridColsClass = "grid-cols-4";
    if (summaryGridLayout === '2') gridColsClass = "grid-cols-2";
    if (summaryGridLayout === '3') gridColsClass = "grid-cols-3";
    if (summaryGridLayout === '4') gridColsClass = "grid-cols-4";
    if (summaryGridLayout === '5') gridColsClass = "grid-cols-5";
    if (summaryGridLayout === '6') gridColsClass = "grid-cols-6";

    // Check for compact padding
    const layoutDensity = globalSettings?.schoolSettings?.resultConfig?.layoutDensity || 'STANDARD';
    const isCompact = layoutDensity === 'COMPACT' || layoutDensity === 'ULTRA_COMPACT';
    const padClass = isCompact ? 'p-1' : 'p-2';

    return (
        <div>
            <div className="text-[10px] font-bold uppercase tracking-widest pb-1.5 border-b-2 flex items-center gap-1.5 mb-2.5" style={{ color: accentColor, borderBottomColor: accentColor }}>
                <PieChart className="w-3.5 h-3.5" />
                <span>{title}</span>
            </div>

            {isRibbon ? (
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] font-semibold text-gray-700 py-1" style={{ backgroundColor: lightBg, paddingLeft: '8px', paddingRight: '8px', borderRadius: '4px' }}>
                    {cards.map((c, i) => (
                        <div key={i} className="flex items-center gap-1.5 whitespace-nowrap">
                            <span className="text-[8px] uppercase tracking-wider text-gray-500">{c.label}:</span>
                            <span style={{ color: accentColor }}>{c.value}</span>
                            {i < cards.length - 1 && <span className="text-gray-300 ml-2">•</span>}
                        </div>
                    ))}
                </div>
            ) : (
                <div className={`grid ${gridColsClass} gap-2`}>
                    {cards.map((c, i) => (
                        <div key={i} className={`rounded-[5px] ${padClass} text-center flex flex-col justify-center`} style={{ backgroundColor: lightBg }}>
                            <div className="text-[16px] font-bold leading-tight" style={{ color: accentColor }}>{c.value}</div>
                            <div className="text-[8px] text-gray-500 mt-1 uppercase tracking-wider leading-tight">{c.label}</div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
