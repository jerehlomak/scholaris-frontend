import React from 'react';

/**
 * BorderedStudentInfoBlock — the fully-bordered admission/attendance/grades
 * grid style common on older Nigerian CA report sheets (a real "table"
 * look, unlike StudentInfoBlock's borderless label-over-value grid).
 * Built to match an uploaded reference template: a centered student-name
 * banner, a bordered grid of admission/attendance/average figures, and a
 * full-width "Position: Nth" row underneath.
 *
 * Every field here is gated by the same Display Toggles (Settings → Result
 * Settings → Display Toggles) every other block already respects — a
 * school's own settings must control what shows on every template, this
 * one included (see PROJECT_BRIEF.md's template scope note). The grid is
 * built from a filtered field list rather than a fixed 4x4 layout so
 * toggling a field off closes the gap instead of leaving an empty cell.
 *
 * Term-end / next-term *dates* aren't part of the report-card API response
 * today (only next-term *fee* is) — those two cells render '—' rather than
 * inventing a value, gated by the same toggles StudentInfoBlock uses for
 * the equivalent fields (showTermEnds / showNextTermBegins).
 */
function ordinal(n: number): string {
    const s = ['TH', 'ST', 'ND', 'RD'];
    const v = n % 100;
    return `${n}${(s[(v - 20) % 10] || s[v] || s[0]).toLowerCase()}`;
}

export default function BorderedStudentInfoBlock({ data, design, config, toggles }: { data: any; design?: any; config?: any; toggles?: any }) {
    const s = data?.student || {};
    const sum = data?.summary || {};
    const att = data?.attendance || {};
    const t = toggles || {};
    const primaryColor = design?.primaryColor || config?.primaryColor || '#0B1F4E';

    const daysOpened = att.opened || att.total || (att.present || 0) + (att.absent || 0) || '—';
    const showAttendanceFields = t.showAttendance ?? true;

    let finalGrade = sum.overallGrade;
    if (!finalGrade && sum.average && data?.gradingScale?.grades?.length) {
        const avg = parseFloat(sum.average);
        const sorted = [...data.gradingScale.grades].sort((a: any, b: any) => Number(b.minScore) - Number(a.minScore));
        const hit = sorted.find((g: any) => avg >= Number(g.minScore) && avg <= Number(g.maxScore));
        finalGrade = hit?.grade || 'F';
    }

    // Each field paired with the same Display Toggle key the equivalent
    // field uses elsewhere in the system (StudentInfoBlock / AcademicSummaryBlock),
    // so this block never shows something a school has explicitly turned off.
    const allFields: { key: string; label: string; value: React.ReactNode; on: boolean }[] = [
        { key: 'admissionNo', label: 'Admission No', value: s.admissionNo || '—', on: t.showStudentId ?? true },
        { key: 'class', label: 'Class', value: s.className || '—', on: t.showClass ?? true },
        { key: 'classSize', label: 'No. in Class', value: sum.studentsInClass || sum.totalStudents || '—', on: t.showTotalStudents ?? true },
        { key: 'termEnd', label: 'Term End', value: s.termEndDate || '—', on: t.showTermEnds ?? true },
        { key: 'daysOpened', label: 'Days Opened', value: daysOpened, on: showAttendanceFields },
        { key: 'present', label: 'Present', value: att.present ?? '—', on: showAttendanceFields },
        { key: 'absent', label: 'Absent', value: att.absent ?? '—', on: showAttendanceFields },
        { key: 'nextTerm', label: 'Next Term', value: s.nextTermStartDate || '—', on: t.showNextTermBegins ?? true },
        { key: 'finalAverage', label: 'Final Average', value: sum.average ? `${sum.average}` : '—', on: t.showFinalAverage ?? true },
        { key: 'highestAverage', label: 'Highest Average', value: sum.highestAvg ? `${sum.highestAvg}` : '—', on: t.showHighestAvgClass ?? true },
        { key: 'lowestAverage', label: 'Lowest Average', value: sum.lowestAvg ? `${sum.lowestAvg}` : '—', on: t.showLowestAvgClass ?? true },
        { key: 'classAverage', label: 'Class Average', value: sum.classAverage ? `${sum.classAverage}` : '—', on: t.showClassAverage ?? true },
        {
            key: 'finalGrade', label: 'Final Grade', on: t.showFinalGrade ?? true, value: (
                <span className="inline-block px-2 py-0.5 rounded text-white font-bold" style={{ backgroundColor: primaryColor }}>
                    {finalGrade || '—'}
                </span>
            )
        },
        { key: 'nextTermFees', label: 'Next Term Fees', value: sum.nextTermFee ? Number(sum.nextTermFee).toLocaleString() : '—', on: t.showNextTermFees ?? true },
    ];

    const visibleFields = allFields.filter(f => f.on);
    // Chunk into rows of 4 — matches the reference grid's proportions without
    // requiring a fixed field count, so toggling fields off/on never leaves
    // a ragged or gapped row.
    const rows: typeof visibleFields[] = [];
    for (let i = 0; i < visibleFields.length; i += 4) rows.push(visibleFields.slice(i, i + 4));

    const showPosition = t.showClassPosition ?? true;

    return (
        <div className="mb-3" style={{ color: primaryColor }}>
            {/* Student name banner */}
            {(t.showStudentName ?? true) && (
                <div className="border-2 text-center font-bold text-[13px] py-1.5" style={{ borderColor: primaryColor }}>
                    {(s.name || 'Student Name').toUpperCase()}
                </div>
            )}

            {/* Bordered info grid */}
            {rows.length > 0 && (
                <div className="border-2 border-t-0" style={{ borderColor: primaryColor }}>
                    {rows.map((row, ri) => (
                        <div key={ri} className="grid" style={{ gridTemplateColumns: `repeat(${row.length}, minmax(0, 1fr))` }}>
                            {row.map((cell, ci) => (
                                <div
                                    key={cell.key}
                                    className="px-2 py-1 text-[10px] border-r border-b last:border-r-0"
                                    style={{ borderColor: primaryColor, borderRightWidth: ci === row.length - 1 ? 0 : 1, borderBottomWidth: ri === rows.length - 1 ? 0 : 1 }}
                                >
                                    <span className="font-semibold">{cell.label}: </span>
                                    <span>{cell.value}</span>
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            )}

            {/* Position banner */}
            {showPosition && (
                <div className="border-2 border-t-0 text-center font-bold text-[11px] py-1" style={{ borderColor: primaryColor }}>
                    Position: {sum.overallPosition ? ordinal(Number(sum.overallPosition)) : '—'}
                </div>
            )}
        </div>
    );
}
