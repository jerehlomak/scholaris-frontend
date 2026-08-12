import React from 'react';
import { CommentBasedReportCard } from './CommentBasedReportCard';

// ─── TYPES ────────────────────────────────────────────────────────────────────
export interface GradeRule {
    id: string;
    grade: string;
    minScore: number;
    maxScore: number;
    remark: string;
    status: 'PASS' | 'FAIL';
}

export interface SubjectColumn {
    id: string;
    name: string;
    key: string;
    width?: number;
    show: boolean;
    computed?: boolean;
}

export interface EvaluationRow {
    id: string;
    label: string;
}

export interface EvaluationSection {
    id: string;
    title: string;
    show: boolean;
    rows: EvaluationRow[];
    scale: string[];
}

export interface TemplateConfig {
    // Existing fields remain unchanged
    // Added optional fields for backward compatibility with AdminResults and other components
    blocks?: any[];
    design?: any;
    gradeScale?: any[];
    studentFields?: any;

    showSchoolLogo: boolean;
    showSchoolAddress: boolean;
    showStudentPhoto: boolean;
    showAdmissionNo: boolean;
    showClass: boolean;
    showSession: boolean;
    showTerm: boolean;
    showAge: boolean;
    showGender: boolean;
    showTeacherName: boolean;
    showClassAverage: boolean;
    showSubjectPosition: boolean;
    showOverallPosition: boolean;
    showClassPosition?: boolean;
    showGradingKey: boolean;
    showAttendance: boolean;
    showEvaluation: boolean;
    showTeacherComment: boolean;
    showHeadComment: boolean;
    showPrincipalComment: boolean;
    showNextTerm: boolean;
    showPromotedTo: boolean;
    showHighestInClass?: boolean;
    showLowestInClass?: boolean;
    showTraitLegend?: boolean;
    baseFontSize?: string;
    reportTitle: string;
    principalTitle: string;
    headTeacherTitle: string;
    formTeacherTitle: string;
    principalName: string;
    primaryColor: string;
    headerBg: string;
    fontFamily: string;
    tableBorderColor: string;
    pageMargin: string;
    logoPosition: 'left' | 'center' | 'right';
    headerStyle: 'standard' | 'banner' | 'minimal';
    subjectColumns: SubjectColumn[];
    evaluationSections: EvaluationSection[];
}

export interface StudentData {
    id: string;
    name: string;
    admissionNo: string;
    className: string;
    classLevel?: string;
    gender: string;
    dateOfBirth?: string | null;
    term: string;
    academicYear: string;
    teacherName?: string;
    photoUrl?: string | null;
}

export interface SubjectResult {
    subjectId?: string;
    subject: { name: string; code?: string };
    scores: Record<string, number | string>;
    totalScore: number;
    computedGrade?: string;
    computedRemark?: string;
    isPassing?: boolean;
    classAvgScore?: number;
    highestScore?: number;
    lowestScore?: number;
    subjectPosition?: number;
    evaluationData?: Record<string, string>;
}

export interface AttendanceSummary {
    total: number;
    present: number;
    absent: number;
    late: number;
}

export interface ReportComments {
    teacherComment?: string | null;
    headComment?: string | null;
    principalComment?: string | null;
    nextTermBegins?: string | null;
    promotedTo?: string | null;
}

export interface SchoolInfo {
    signatures?: any[];
    display?: any;
    schoolName: string;
    tagline?: string | null;
    address?: string | null;
    phone?: string | null;
    email?: string | null;
    logoUrl?: string | null;
    currentTerm?: string | null;
    currentYear?: string | null;
    resultShowBorder?: boolean;
    resultShowSignature?: boolean;
    resultShowNextTermFees?: boolean;
}

export interface ReportSummary {
    totalSubjects: number;
    totalScore: number;
    average: string | number;
    overallPosition?: number | null;
    classAverage?: string | null;
    passMark: number;
    cumulativeAverage?: string | null;
    nextTermFee?: string | number | null;
}

export interface ReportCardPreviewProps {
    visibleTypes?: string[];
    templateConfig: TemplateConfig;
    student: StudentData;
    results: SubjectResult[];
    gradingScale: { grades: GradeRule[]; passMark: number };
    comments?: ReportComments | null;
    attendance?: AttendanceSummary | null;
    school: SchoolInfo;
    summary: ReportSummary;
    evaluationData?: Record<string, Record<string, string>>;
    annualResults?: any[];
    isPreview?: boolean;
    isCommentBased?: boolean;
    forceScoreBased?: boolean;
    commentBasedSettings?: any;
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function ordinal(n: number): string {
    const s = ['TH', 'ST', 'ND', 'RD'];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function calcAge(dob: string): number {
    const d = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - d.getFullYear();
    const m = today.getMonth() - d.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--;
    return age;
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export const ReportCardPreview: React.FC<ReportCardPreviewProps> = ({
    visibleTypes = ['CA', 'EXAM', 'FULL', 'COMMENT'],
    templateConfig: _templateConfig,
    student,
    results = [],
    gradingScale = { grades: [], passMark: 40 },
    comments,
    attendance,
    school,
    summary,
    evaluationData = {},
    annualResults = [],
    isPreview = false,
    isCommentBased = false,
    forceScoreBased = false,
    commentBasedSettings
}) => {
    // If it's a comment-based report, render the specialized layout
    if (!forceScoreBased && (isCommentBased || _templateConfig?.design?.id === 'comment-based')) {
        return <CommentBasedReportCard 
            visibleTypes={visibleTypes}
            templateConfig={_templateConfig as any}
            student={student}
            results={results}
            gradingScale={gradingScale}
            comments={comments}
            attendance={attendance}
            school={school}
            summary={summary}
            evaluationData={evaluationData}
            annualResults={annualResults}
            isPreview={isPreview}
            commentBasedSettings={commentBasedSettings || school.display?.resultConfig?.commentBasedSettings}
        />;
    }

    // Extract dynamic term names from annualResults for the cumulative table
    const dynamicTermNames = React.useMemo(() => {
        if (!annualResults || annualResults.length === 0) return [];
        const termsSet = new Set<string>();
        annualResults.forEach((ar: any) => {
            if (ar.terms) {
                Object.keys(ar.terms).forEach(t => termsSet.add(t));
            } else {
                // Fallback for older data format
                if (ar.first !== undefined) termsSet.add('1st Term');
                if (ar.second !== undefined) termsSet.add('2nd Term');
                if (ar.third !== undefined) termsSet.add('3rd Term');
            }
        });
        return Array.from(termsSet);
    }, [annualResults]);

    // Use a sensible default if no template is assigned, but preserve `false` if set
    
    const cfg = _templateConfig ?? {
        primaryColor: '#0036a1',
        headerBg: '#0036a1',
        tableBorderColor: '#d1d5db',
        fontFamily: 'sans',
        showSchoolLogo: true,
        showSchoolAddress: true,
        showStudentPhoto: false,
        showAdmissionNo: true,
        showClass: true,
        showSession: true,
        showTerm: true,
        showClassAverage: true,
        showHighestInClass: false,
        showLowestInClass: false,
        showTraitLegend: false,
        subjectColumns: [
            { id: 'c1', key: '1', name: 'CA 1', show: true },
            { id: 'c2', key: '2', name: 'CA 2', show: true },
            { id: 'c3', key: '3', name: 'Exam', show: true },
            { id: 't1', key: 'total', name: 'Total', show: true, computed: true },
            { id: 'g1', key: 'grade', name: 'Grade', show: true, computed: true },
            { id: 'r1', key: 'remark', name: 'Remark', show: true, computed: true }
        ],
    };

    // Helper to safely resolve boolean flags: if undefined, fallback to a default
    const resolveBool = (val: boolean | undefined, defaultVal: boolean) => val !== undefined ? val : defaultVal;

    const isCumulative = visibleTypes?.includes('CUMULATIVE');

    if (!student || !school) {
        return <div className="p-10 text-center text-gray-500 font-dash">Unable to render report card: Missing student or school data.</div>;
    }

    const primary = cfg.primaryColor || '#0036a1';
    const headerBg = cfg.headerBg || '#0036a1';
    const showBorder = school.resultShowBorder ?? true;
    const showSignature = school.resultShowSignature ?? true;
    const borderColor = cfg.tableBorderColor || '#d1d5db';
    const fontFamily = cfg.fontFamily === 'sans' ? 'Arial, sans-serif' : cfg.fontFamily === 'mono' ? 'Courier New, monospace' : 'Georgia, Times New Roman, serif';
    const visibleCols = (cfg.subjectColumns || []).filter(c => c.show);

    const borderStyle = showBorder ? `1px solid ${borderColor}` : 'none';

    // Requirement 4: Base Font Size logic
    const baseFontSize = cfg.baseFontSize === 'small' ? '9px' : cfg.baseFontSize === 'large' ? '13px' : '11px';
    const cellPadding = cfg.baseFontSize === 'small' ? '2px 4px' : '4px 6px';

    const tdStyle: React.CSSProperties = {
        border: borderStyle,
        padding: cellPadding,
        fontSize: baseFontSize,
        textAlign: 'center',
        verticalAlign: 'middle',
    };

    const thStyle: React.CSSProperties = {
        ...tdStyle,
        backgroundColor: primary,
        color: '#fff',
        fontWeight: 700,
        fontSize: cfg.baseFontSize === 'small' ? '9px' : '10px',
        textAlign: 'center',
        padding: '5px 6px',
        whiteSpace: 'nowrap',
    };

    const tdLeftStyle: React.CSSProperties = {
        ...tdStyle,
        textAlign: 'left',
        fontWeight: 600,
        padding: cfg.baseFontSize === 'small' ? '2px 6px' : '4px 8px',
    };

    // Compute totals row
    const grandTotal = results.reduce((s, r) => s + r.totalScore, 0);
    const avgScore = results.length > 0 ? (grandTotal / results.length).toFixed(1) : '0';

    // Requirement 5: Conditional Signatures
    const levelStr = (student?.classLevel || '').toLowerCase();
    const nameStr = (student?.className || '').toLowerCase();
    const isSecondary = levelStr.includes('secondary') || nameStr.includes('sss') || nameStr.includes('jss') || nameStr.includes('senior') || nameStr.includes('junior');
    const isPrimaryNursery = levelStr.includes('primary') || levelStr.includes('nursery') || nameStr.includes('primary') || nameStr.includes('nursery') || nameStr.includes('basic') || nameStr.includes('creche');

    const showHeadComment = resolveBool(cfg.showHeadComment, true) && !isSecondary;
    const showPrincipalComment = resolveBool(cfg.showPrincipalComment, true) && !isPrimaryNursery;

    const finalShowClassPosition = resolveBool(cfg.showClassPosition ?? cfg.showOverallPosition, true) && resolveBool(school.display?.showClassPosition, true);
    const finalShowSubjectPosition = resolveBool(cfg.showSubjectPosition, false) && resolveBool(school.display?.showSubjectPosition, true);

    return (
        <div
            id="report-card-printable"
            style={{
                width: isPreview ? '100%' : '210mm',
                minHeight: isPreview ? 'auto' : '297mm',
                fontFamily,
                backgroundColor: '#fff',
                color: '#111',
                fontSize: cfg.baseFontSize === 'small' ? '10px' : '12px',
                boxSizing: 'border-box',
                padding: cfg.pageMargin || '10mm',
            }}
        >
            {/* ── SCHOOL HEADER ─────────────────────────────────────────────── */}
            {cfg.headerStyle === 'banner' ? (
                <div style={{
                    background: `linear-gradient(135deg, ${headerBg} 60%, ${primary}cc)`,
                    color: '#fff',
                    padding: '14px 20px',
                    borderRadius: '6px',
                    marginBottom: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    justifyContent: cfg.logoPosition === 'center' ? 'center' : cfg.logoPosition === 'right' ? 'flex-end' : 'flex-start',
                }}>
                    {cfg.showSchoolLogo && school.logoUrl && cfg.logoPosition === 'left' && (
                        <img src={school.logoUrl} alt="Logo" style={{ width: 60, height: 60, objectFit: 'contain', borderRadius: 4, background: '#fff', padding: 2 }} />
                    )}
                    <div style={{ textAlign: cfg.logoPosition === 'center' ? 'center' : 'left' }}>
                        <div style={{ fontSize: '20px', fontWeight: 800, letterSpacing: 1 }}>{school.schoolName}</div>
                        {cfg.showSchoolAddress && school.tagline && <div style={{ fontSize: '11px', opacity: 0.88 }}>{school.tagline}</div>}
                        {cfg.showSchoolAddress && school.address && <div style={{ fontSize: '10px', opacity: 0.75 }}>{school.address}</div>}
                        {cfg.showSchoolAddress && school.phone && <div style={{ fontSize: '10px', opacity: 0.75 }}>Tel: {school.phone}</div>}
                        <div style={{ marginTop: 6, fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 2, borderTop: '1px solid rgba(255,255,255,0.3)', paddingTop: 6 }}>
                            {cfg.reportTitle || 'End of Term Academic Report'}
                        </div>
                    </div>
                    {cfg.showSchoolLogo && school.logoUrl && cfg.logoPosition === 'right' && (
                        <img src={school.logoUrl} alt="Logo" style={{ width: 60, height: 60, objectFit: 'contain', borderRadius: 4, background: '#fff', padding: 2 }} />
                    )}
                </div>
            ) : cfg.headerStyle === 'minimal' ? (
                <div style={{ borderBottom: `3px solid ${primary}`, paddingBottom: 8, marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <div>
                        <div style={{ fontSize: '18px', fontWeight: 800, color: primary }}>{school.schoolName}</div>
                        {cfg.showSchoolAddress && school.address && <div style={{ fontSize: '10px', color: '#666' }}>{school.address}</div>}
                    </div>
                    {cfg.showSchoolLogo && school.logoUrl && (
                        <img src={school.logoUrl} alt="Logo" style={{ width: 50, height: 50, objectFit: 'contain' }} />
                    )}
                </div>
            ) : (
                // Standard header (default)
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '10px', borderBottom: `2px double ${primary}`, paddingBottom: '10px' }}>
                    {cfg.showSchoolLogo && school.logoUrl && cfg.logoPosition !== 'right' && (
                        <img src={school.logoUrl} alt="Logo" style={{ width: 64, height: 64, objectFit: 'contain', flexShrink: 0 }} />
                    )}
                    <div style={{ flex: 1, textAlign: 'center' }}>
                        <div style={{ fontSize: '18px', fontWeight: 800, textTransform: 'uppercase', color: primary, letterSpacing: 1 }}>{school.schoolName}</div>
                        {school.tagline && <div style={{ fontSize: '11px', color: '#555', fontStyle: 'italic' }}>{school.tagline}</div>}
                        {cfg.showSchoolAddress && school.address && <div style={{ fontSize: '10px', color: '#666', marginTop: 1 }}>{school.address}</div>}
                        {cfg.showSchoolAddress && school.phone && <div style={{ fontSize: '10px', color: '#666' }}>Tel: {school.phone}{school.email ? ` | ${school.email}` : ''}</div>}
                        <div style={{ marginTop: 6, fontSize: '12px', fontWeight: 700, color: '#333', textTransform: 'uppercase', letterSpacing: 1, padding: '3px 0', borderTop: `1px solid ${borderColor}` }}>
                            {cfg.reportTitle || 'End of Term Academic Report'}
                        </div>
                    </div>
                    {cfg.showSchoolLogo && school.logoUrl && cfg.logoPosition === 'right' && (
                        <img src={school.logoUrl} alt="Logo" style={{ width: 64, height: 64, objectFit: 'contain', flexShrink: 0 }} />
                    )}
                </div>
            )}

            {/* ── STUDENT INFO + PHOTO ──────────────────────────────────────── */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '10px', border: borderStyle, borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ flex: 1, padding: '8px 10px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <tbody>
                            <InfoRow label="Student's Name" value={student.name} style={{ fontWeight: 700, fontSize: 13 }} />
                            {cfg.showAdmissionNo && <InfoRow label="Admission No." value={student.admissionNo} />}
                            {cfg.showClass && <InfoRow label="Class" value={student.className} />}
                            {cfg.showSession && <InfoRow label="Session" value={student.academicYear} />}
                            {cfg.showTerm && <InfoRow label="Term" value={student.term} />}
                            {cfg.showGender && <InfoRow label="Gender" value={student.gender} />}
                            {cfg.showAge && student.dateOfBirth && <InfoRow label="Age" value={`${calcAge(student.dateOfBirth)} years`} />}
                            {cfg.showTeacherName && student.teacherName && <InfoRow label="Form Teacher" value={student.teacherName} />}
                        </tbody>
                    </table>
                </div>
                {cfg.showStudentPhoto && (
                    <div style={{ width: 80, minHeight: 100, borderLeft: borderStyle, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, backgroundColor: '#f8f9fa' }}>
                        {student.photoUrl ? (
                            <img src={student.photoUrl} alt="Student" style={{ width: 76, height: 96, objectFit: 'cover' }} />
                        ) : (
                            <div style={{ width: 76, height: 96, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#e8edf5', color: '#aaa', fontSize: 10, gap: 4 }}>
                                <svg width={28} height={28} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><circle cx={12} cy={8} r={4} /><path d="M4 20c0-4 3.58-7 8-7s8 3 8 7" /></svg>
                                Passport
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* ── SUBJECT RESULT TABLE ──────────────────────────────────────── */}
            {!isCumulative && (
            <div style={{ marginBottom: '10px', overflowX: 'auto' }}>
                <div style={{ backgroundColor: primary, color: '#fff', fontWeight: 700, fontSize: '11px', padding: '4px 8px', borderRadius: '3px 3px 0 0', textTransform: 'uppercase', letterSpacing: 1 }}>
                    Academic Performance
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                    <thead>
                        <tr>
                            <th style={{ ...thStyle, textAlign: 'left', width: '30%' }}>Subject</th>
                            {visibleCols.filter(c => !c.computed).map(col => (
                                <th key={col.id} style={{ ...thStyle, width: col.width ? `${col.width}px` : undefined }}>{col.name}</th>
                            ))}
                            {visibleCols.find(c => c.key === 'total') && <th style={{ ...thStyle, backgroundColor: '#1e4db7' }}>Total</th>}
                            {resolveBool(cfg.showClassAverage, true) && <th style={{ ...thStyle, backgroundColor: '#1e4db7' }}>Avg</th>}
                            {resolveBool(cfg.showHighestInClass, false) && <th style={{ ...thStyle, backgroundColor: '#1e4db7' }}>High</th>}
                            {resolveBool(cfg.showLowestInClass, false) && <th style={{ ...thStyle, backgroundColor: '#1e4db7' }}>Low</th>}
                            {finalShowSubjectPosition && <th style={{ ...thStyle, backgroundColor: '#1e4db7' }}>Pos</th>}
                            {visibleCols.find(c => c.key === 'grade') && <th style={{ ...thStyle, backgroundColor: '#1e4db7' }}>Grade</th>}
                            {visibleCols.find(c => c.key === 'remark') && <th style={{ ...thStyle, backgroundColor: '#1e4db7', width: 90 }}>Remark</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {results.map((r, idx) => (
                            <tr key={r.subjectId || idx} style={{ backgroundColor: idx % 2 === 0 ? '#fafafa' : '#fff' }}>
                                <td style={{ ...tdLeftStyle }}>{r.subject.name}</td>
                                {visibleCols.filter(c => !c.computed).map(col => (
                                    <td key={col.id} style={tdStyle}>
                                        {r.scores[col.key] !== undefined && r.scores[col.key] !== null && r.scores[col.key] !== '' ? r.scores[col.key] : '-'}
                                    </td>
                                ))}
                                {visibleCols.find(c => c.key === 'total') && (
                                    <td style={{ ...tdStyle, fontWeight: 700 }}>{r.totalScore ?? '-'}</td>
                                )}
                                {resolveBool(cfg.showClassAverage, true) && (
                                    <td style={tdStyle}>{r.classAvgScore?.toFixed(1) ?? '-'}</td>
                                )}
                                {resolveBool(cfg.showHighestInClass, false) && (
                                    <td style={tdStyle}>{r.highestScore ?? '-'}</td>
                                )}
                                {resolveBool(cfg.showLowestInClass, false) && (
                                    <td style={tdStyle}>{r.lowestScore ?? '-'}</td>
                                )}
                                {finalShowSubjectPosition && (
                                    <td style={tdStyle}>{r.subjectPosition ? ordinal(r.subjectPosition) : '-'}</td>
                                )}
                                {visibleCols.find(c => c.key === 'grade') && (
                                    <td style={{ ...tdStyle, fontWeight: 700, color: r.isPassing ? '#166534' : '#991b1b' }}>
                                        {r.computedGrade ?? '-'}
                                    </td>
                                )}
                                {visibleCols.find(c => c.key === 'remark') && (
                                    <td style={{ ...tdStyle, fontSize: 10 }}>{r.computedRemark ?? '-'}</td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                    {/* Totals row */}
                    <tfoot>
                        <tr style={{ backgroundColor: '#f0f4ff' }}>
                            <td style={{ ...tdLeftStyle, fontWeight: 700, color: primary }} colSpan={visibleCols.filter(c => !c.computed).length + 1}>
                                Grand Total / Average
                            </td>
                            {visibleCols.find(c => c.key === 'total') && (
                                <td style={{ ...tdStyle, fontWeight: 700, color: primary }}>{grandTotal}</td>
                            )}
                            {resolveBool(cfg.showClassAverage, true) && <td style={tdStyle}>{summary.classAverage ?? '-'}</td>}
                            {resolveBool(cfg.showHighestInClass, false) && <td style={tdStyle}>-</td>}
                            {resolveBool(cfg.showLowestInClass, false) && <td style={tdStyle}>-</td>}
                            {finalShowSubjectPosition && <td style={tdStyle}>-</td>}
                            {visibleCols.find(c => c.key === 'grade') && (
                                <td style={{ ...tdStyle, fontWeight: 700 }}>-</td>
                            )}
                            {visibleCols.find(c => c.key === 'remark') && (
                                <td style={tdStyle}>-</td>
                            )}
                        </tr>
                        <tr style={{ backgroundColor: '#e8edf8' }}>
                            <td style={{ ...tdLeftStyle, fontWeight: 700, color: primary }} colSpan={visibleCols.filter(c => !c.computed).length + 1}>
                                Percentage Average
                            </td>
                            {visibleCols.find(c => c.key === 'total') && (
                                <td style={{ ...tdStyle, fontWeight: 700, color: primary }}>{avgScore}%</td>
                            )}
                            {resolveBool(cfg.showClassAverage, true) && <td style={tdStyle}>-</td>}
                            {resolveBool(cfg.showHighestInClass, false) && <td style={tdStyle}>-</td>}
                            {resolveBool(cfg.showLowestInClass, false) && <td style={tdStyle}>-</td>}
                            {finalShowSubjectPosition && <td style={tdStyle}>-</td>}
                            {visibleCols.find(c => c.key === 'grade') && <td style={{ ...tdStyle, fontWeight: 700 }}>-</td>}
                            {visibleCols.find(c => c.key === 'remark') && <td style={tdStyle}>-</td>}
                        </tr>
                    </tfoot>
                </table>
            </div>
            )}

            {/* ── ANNUAL / CUMULATIVE RESULTS ───────────────────────────────── */}
            {annualResults && annualResults.length > 0 && (
                <div style={{ marginBottom: '10px', overflowX: 'auto' }}>
                    <div style={{ backgroundColor: primary, color: '#fff', fontWeight: 700, fontSize: '11px', padding: '4px 8px', borderRadius: '3px 3px 0 0', textTransform: 'uppercase', letterSpacing: 1 }}>
                        {isCumulative ? "Student's Cumulative Academic Performance" : "Annual Consolidated Report"}
                    </div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                        <thead>
                            <tr>
                                <th style={{ ...thStyle, textAlign: 'left', width: '30%' }}>Subject</th>
                                {dynamicTermNames.map(termName => (
                                    <th key={termName} style={{ ...thStyle }}>{termName}</th>
                                ))}
                                <th style={{ ...thStyle }}>Cum. Avg</th>
                                <th style={{ ...thStyle }}>Grade</th>
                                <th style={{ ...thStyle }}>Remark</th>
                            </tr>
                        </thead>
                        <tbody>
                            {annualResults.map((ar: any, idx: number) => (
                                <tr key={ar.subject.id} style={{ backgroundColor: idx % 2 === 0 ? '#fafafa' : '#fff' }}>
                                    <td style={tdLeftStyle}>{ar.subject.name}</td>
                                    {dynamicTermNames.map(termName => {
                                        let val: any = '-';
                                        if (ar.terms && ar.terms[termName] !== undefined && ar.terms[termName] !== null) {
                                            val = ar.terms[termName];
                                        } else if (!ar.terms) {
                                            if (termName === '1st Term' && ar.first !== undefined) val = ar.first;
                                            if (termName === '2nd Term' && ar.second !== undefined) val = ar.second;
                                            if (termName === '3rd Term' && ar.third !== undefined) val = ar.third;
                                        }
                                        return <td key={termName} style={tdStyle}>{val ?? '-'}</td>;
                                    })}
                                    <td style={{ ...tdStyle, fontWeight: 700, color: primary }}>{ar.cumulative}%</td>
                                    <td style={{ ...tdStyle, fontWeight: 700, color: primary }}>{ar.grade ?? '-'}</td>
                                    <td style={tdStyle}>{ar.remark ?? '-'}</td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr style={{ backgroundColor: '#f0f4ff' }}>
                                <td colSpan={dynamicTermNames.length + 1} style={{ ...tdLeftStyle, fontWeight: 700, color: primary }}>Overall Cumulative Average</td>
                                <td colSpan={3} style={{ ...tdStyle, fontWeight: 700, color: primary, fontSize: 13, textAlign: 'left', paddingLeft: '15px' }}>{summary.cumulativeAverage}%</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            )}

            {/* ── BOTTOM ROW: Position + Attendance + Evaluation ────────────── */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>

                {/* Position / Summary box */}
                {(finalShowClassPosition || finalShowSubjectPosition) && (
                    <div style={{ minWidth: 140, border: borderStyle, borderRadius: 4, overflow: 'hidden' }}>
                        <div style={{ backgroundColor: primary, color: '#fff', fontWeight: 700, fontSize: '10px', padding: '3px 8px', textTransform: 'uppercase' }}>Summary</div>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <tbody>
                                {finalShowClassPosition && summary.overallPosition != null && (
                                    <InfoRow label="Position" value={ordinal(summary.overallPosition)} />
                                )}
                                <InfoRow label="Subjects" value={String(summary.totalSubjects)} />
                                {!isCumulative && <InfoRow label="Total Score" value={String(summary.totalScore)} />}
                                <InfoRow label="Average" value={String(isCumulative ? summary.cumulativeAverage || summary.average : summary.average) + '%'} />
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Attendance */}
                {resolveBool(cfg.showAttendance, true) && (
                    <div style={{ minWidth: 140, border: borderStyle, borderRadius: 4, overflow: 'hidden' }}>
                        <div style={{ backgroundColor: primary, color: '#fff', fontWeight: 700, fontSize: '10px', padding: '3px 8px', textTransform: 'uppercase' }}>Attendance</div>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <tbody>
                                <InfoRow label="Number of Days Open" value={String(attendance?.total || 0)} />
                                <InfoRow label="Days Present" value={String(attendance?.present || 0)} />
                                <InfoRow label="Days Absent" value={String(attendance?.absent || 0)} />
                                {attendance?.total && Number(attendance.total) > 0 ? (
                                    <InfoRow label="Attendance (%)" value={`${Math.round((Number(attendance.present || 0) / Number(attendance.total)) * 100)}%`} />
                                ) : null}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Evaluation Sections */}
                {resolveBool(cfg.showEvaluation, true) && (cfg.evaluationSections || []).filter(s => s.show).map(section => (
                    <div key={section.id} style={{ flex: 1, border: borderStyle, borderRadius: 4, overflow: 'hidden' }}>
                        <div style={{ backgroundColor: primary, color: '#fff', fontWeight: 700, fontSize: '10px', padding: '3px 8px', textTransform: 'uppercase' }}>{section.title}</div>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr>
                                    <th style={{ ...thStyle, textAlign: 'left', backgroundColor: '#e8edf8', color: primary, fontSize: 9 }}>Trait</th>
                                    {section.scale.map(s => (
                                        <th key={s} style={{ ...thStyle, fontSize: 8, backgroundColor: '#e8edf8', color: primary, padding: '3px 2px' }}>{s.substring(0, 3)}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {section.rows.map((row, idx) => {
                                    const sectionData = evaluationData[section.id] || {};
                                    const val = sectionData[row.id] || '';
                                    return (
                                        <tr key={row.id} style={{ backgroundColor: idx % 2 === 0 ? '#fafafa' : '#fff' }}>
                                            <td style={{ ...tdStyle, textAlign: 'left', fontSize: 9, paddingLeft: 6 }}>{row.label}</td>
                                            {section.scale.map(s => (
                                                <td key={s} style={{ ...tdStyle, fontSize: 10 }}>
                                                    {val === s ? '✓' : ''}
                                                </td>
                                            ))}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                        {/* Trait Legend */}
                        {resolveBool(cfg.showTraitLegend, false) && (
                            <div style={{ padding: '4px', fontSize: '8px', color: '#666', borderTop: '1px solid #eee' }}>
                                {section.scale.map(s => `${s.substring(0, 3)}=${s}`).join(', ')}
                            </div>
                        )}
                    </div>
                ))}
            </div>

                        {/* ── COMMENTS & SIGNATURES ──────────────────────────────────── */}
            <div style={{ marginBottom: '10px', border: borderStyle, borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ backgroundColor: primary, color: '#fff', fontWeight: 700, fontSize: '10px', padding: '3px 8px', textTransform: 'uppercase' }}>
                    Remarks & Signatures
                </div>
                
                {(!school?.signatures || school.signatures.length === 0) ? (
                    <div style={{ display: 'flex', gap: 0 }}>
                        {resolveBool(cfg.showTeacherComment, true) && (
                            <div style={{ flex: 1, padding: '7px 10px', borderRight: (showHeadComment || showPrincipalComment) ? borderStyle : 'none' }}>
                                <div style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', color: '#555', marginBottom: 2 }}>{cfg.formTeacherTitle || "Form Teacher's Remark"}</div>
                                <div style={{ fontSize: '11px', minHeight: 28, fontStyle: comments?.teacherComment ? 'normal' : 'italic', color: comments?.teacherComment ? '#333' : '#aaa' }}>
                                    {comments?.teacherComment || 'No remark entered yet.'}
                                </div>
                            </div>
                        )}
                        {showHeadComment && (
                            <div style={{ flex: 1, padding: '7px 10px', borderRight: showPrincipalComment ? borderStyle : 'none' }}>
                                <div style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', color: '#555', marginBottom: 2 }}>{cfg.headTeacherTitle || "Head Teacher's Remark"}</div>
                                <div style={{ fontSize: '11px', minHeight: 28, fontStyle: comments?.headComment ? 'normal' : 'italic', color: comments?.headComment ? '#333' : '#aaa' }}>
                                    {comments?.headComment || 'No remark entered yet.'}
                                </div>
                            </div>
                        )}
                        {showPrincipalComment && (
                            <div style={{ flex: 1, padding: '7px 10px' }}>
                                <div style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', color: '#555', marginBottom: 2 }}>{cfg.principalTitle || "Principal's Remark"}</div>
                                <div style={{ fontSize: '11px', minHeight: 28, fontStyle: comments?.principalComment ? 'normal' : 'italic', color: comments?.principalComment ? '#333' : '#aaa' }}>
                                    {comments?.principalComment || 'No remark entered yet.'}
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div style={{ display: 'flex', gap: 0 }}>
                        {school.signatures.map((sig: any, idx: number) => {
                            let text: string | undefined | null = '';
                            let nComments = (comments as any)?.narrativeComments || {};
                            if (typeof nComments === 'string') {
                                try { nComments = JSON.parse(nComments); } catch (e) {}
                            }
                            if (nComments[sig.roleName]) {
                                text = nComments[sig.roleName];
                            } else {
                                const roleLower = sig.roleName?.toLowerCase() || '';
                                if (roleLower.includes('teacher') && !roleLower.includes('head')) text = comments?.teacherComment;
                                else if (roleLower.includes('head')) text = comments?.headComment;
                                else if (roleLower.includes('principal') || roleLower.includes('director')) text = comments?.principalComment;
                            }

                            return (
                                <div key={sig.id || idx} style={{ flex: 1, padding: '7px 10px', borderRight: idx !== (school.signatures?.length || 0) - 1 ? borderStyle : 'none' }}>
                                    <div style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', color: '#555', marginBottom: 2 }}>{sig.roleName}'s Remark</div>
                                    <div style={{ fontSize: '11px', minHeight: 28, fontStyle: text ? 'normal' : 'italic', color: text ? '#333' : '#aaa' }}>
                                        {text || 'No remark entered yet.'}
                                    </div>
                                    <div style={{ marginTop: '10px', textAlign: 'center' }}>
                                        {sig.url ? (
                                            <img src={sig.url} alt={sig.roleName} style={{ height: '35px', objectFit: 'contain', marginBottom: '4px' }} />
                                        ) : (
                                            <div style={{ height: '35px', borderBottom: '1px dotted #ccc', width: '100%', marginBottom: '4px' }}></div>
                                        )}
                                        <div style={{ fontSize: '9px', fontWeight: 'bold', color: '#555' }}>Sign/Date</div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {((cfg.showNextTerm && (comments?.nextTermBegins || comments?.promotedTo)) || school.resultShowNextTermFees) && (
                    <div style={{ backgroundColor: '#f8fafc', padding: '6px 10px', borderTop: borderStyle, display: 'flex', flexWrap: 'wrap', gap: 24, fontSize: '11px' }}>
                        {cfg.showNextTerm && comments?.nextTermBegins && (
                            <span><strong>Next Term Begins:</strong> {comments.nextTermBegins}</span>
                        )}
                        {cfg.showPromotedTo && comments?.promotedTo && (
                            <span><strong>Promoted To:</strong> {comments.promotedTo}</span>
                        )}
                        {school.resultShowNextTermFees && (
                            <span style={{ color: '#991b1b' }}><strong>Next Term Fees:</strong> {summary.nextTermFee ? `₦${Number(summary.nextTermFee).toLocaleString()}` : 'Please refer to portal/invoice'}</span>
                        )}
                    </div>
                )}
            </div>

            {/* ── GRADING KEY ───────────────────────────────────────────────── */}
            {cfg.showGradingKey && gradingScale?.grades && gradingScale.grades.length > 0 && (
                <div style={{ border: borderStyle, borderRadius: 4, overflow: 'hidden', marginBottom: 6 }}>
                    <div style={{ backgroundColor: primary, color: '#fff', fontWeight: 700, fontSize: '10px', padding: '3px 8px', textTransform: 'uppercase' }}>Grading Key</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', padding: '5px 8px', gap: 6 }}>
                        {[...gradingScale.grades].sort((a: any, b: any) => b.minScore - a.minScore).map((g: any) => (
                            <span key={g.id} style={{ fontSize: '10px', fontWeight: 600, padding: '2px 8px', borderRadius: 3, backgroundColor: g.status === 'PASS' ? '#dcfce7' : '#fee2e2', color: g.status === 'PASS' ? '#166534' : '#991b1b', border: '1px solid', borderColor: g.status === 'PASS' ? '#86efac' : '#fca5a5' }}>
                                {g.grade}: {g.minScore}–{g.maxScore} ({g.remark})
                            </span>
                        ))}
                    </div>
                </div>
            )}

{/* ── FOOTER ────────────────────────────────────────────────────── */}
            <div style={{ marginTop: 6, fontSize: '9px', color: '#aaa', textAlign: 'center', borderTop: `1px solid ${borderColor}`, paddingTop: 4 }}>
                Generated by Skooly School Management System — {school?.schoolName || 'School'}
            </div>
        </div>
    );
};

// ─── INFO ROW ─────────────────────────────────────────────────────────────────
const InfoRow: React.FC<{ label: string; value: string; style?: React.CSSProperties }> = ({ label, value, style }) => (
    <tr style={{ borderBottom: '1px solid #f0f0f0' }}>
        <td style={{ fontSize: '10px', color: '#666', fontWeight: 600, padding: '3px 8px', whiteSpace: 'nowrap', width: '40%' }}>{label}:</td>
        <td style={{ fontSize: '11px', fontWeight: 600, padding: '3px 8px', ...style }}>{value}</td>
    </tr>
);

export default ReportCardPreview;
