import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Home as HomeIcon, ChevronRight, Printer, FileText, X, AlertCircle, KeyRound, Loader2, Download, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Tooltip } from 'recharts';
import useSWR from 'swr';
import { fetcher } from '../../utils/fetcher';
import ReportCardPreview from '../../components/report/ReportCardPreview';
import type { TemplateConfig } from '../../components/report/ReportCardPreview';
import ReportCard from '../../components/report-blocks/ReportCard';
import PinValidationModal from '../../components/shared/PinValidationModal';
import { mobileSafePrint } from '../../lib/printUtils';

const TERMS = ['First Term', 'Second Term', 'Third Term'];
const YEARS = ['2023/2024', '2024/2025', '2025/2026'];

const DEFAULT_CFG: TemplateConfig = {
    showSchoolLogo: true, showSchoolAddress: true, showStudentPhoto: true,
    showAdmissionNo: true, showClass: true, showSession: true, showTerm: true,
    showAge: true, showGender: true, showTeacherName: true,
    showClassAverage: true, showSubjectPosition: false, showOverallPosition: true,
    showGradingKey: true, showAttendance: true, showEvaluation: true,
    showTeacherComment: true, showHeadComment: true, showPrincipalComment: true,
    showNextTerm: true, showPromotedTo: false,
    reportTitle: 'End of Term Academic Report',
    principalTitle: 'Principal', headTeacherTitle: 'Head Teacher', formTeacherTitle: 'Form Teacher', principalName: '',
    primaryColor: '#1E4DA6', headerBg: '#1E4DA6', fontFamily: 'serif',
    tableBorderColor: '#d1d5db', pageMargin: '10mm', logoPosition: 'left', headerStyle: 'standard',
    subjectColumns: [
        { id: 'ca1', name: '1st CA', key: 'ca1', show: true },
        { id: 'ca2', name: '2nd CA', key: 'ca2', show: true },
        { id: 'exam', name: 'Exam', key: 'exam', show: true },
        { id: 'total', name: 'Total', key: 'total', show: true, computed: true },
        { id: 'grade', name: 'Grade', key: 'grade', show: true, computed: true },
        { id: 'remark', name: 'Remark', key: 'remark', show: true, computed: true },
    ],
    evaluationSections: [],
};

const GRADE_COLOR: Record<string, string> = {
    A: 'bg-[#10b981]/10 text-[#10b981]',
    B: 'bg-[#1E4DA6]/5 text-[#1E4DA6]',
    C: 'bg-[#ff9800]/10 text-[#ff9800]',
    D: 'bg-orange-50 text-orange-600',
    E: 'bg-red-50 text-red-500',
    F: 'bg-red-100 text-red-700',
};

function ordinal(n: number | string | undefined | null): string {
    if (n == null) return '-';
    const num = Number(n);
    if (isNaN(num)) return String(n);
    const s = ['TH', 'ST', 'ND', 'RD'];
    const v = num % 100;
    return num + (s[(v - 20) % 10] || s[v] || s[0]);
}

export default function Result() {
    const [activeTab, setActiveTab] = useState<'current'|'legacy'>('current');
    const [term, setTerm] = useState(TERMS[0]);
    const [year, setYear] = useState('2025/2026');
    const [showCard, setShowCard] = useState(false);
    const [cardData, setCardData] = useState<any>(null);
    const [cardLoading, setCardLoading] = useState(false);
    
    const [pinCode, setPinCode] = useState('');
    const [submittedPin, setSubmittedPin] = useState('');
    const [pinError, setPinError] = useState<string | null>(null);
    const [showPinModal, setShowPinModal] = useState(false);

    const API_URL = import.meta.env.VITE_API_URL || '/api/v1';

    const loadReportCard = async (providedPin?: string) => {
        setCardLoading(true);
        try {
            setPinError(null);
            const currentPin = providedPin || pinCode || submittedPin;
            const url = new URL(`${API_URL}/results/report-card`, window.location.origin);
            url.searchParams.append('term', term);
            url.searchParams.append('academicYear', year);
            if (currentPin) {
                url.searchParams.append('pinCode', currentPin);
            }
            const res = await fetch(url.toString(), { credentials: 'include' });
            
            if (!res.ok) {
                const text = await res.text();
                if (text.includes('PIN_REQUIRED')) {
                    setShowPinModal(true);
                    setCardLoading(false);
                    return;
                }
                if (text.includes('Invalid or expired PIN') || text.includes('PIN is only valid for') || text.includes('PIN has already been used')) {
                    if (showPinModal) {
                        try {
                            const errObj = JSON.parse(text);
                            setPinError(errObj.msg || errObj.message || 'Invalid PIN');
                        } catch {
                            setPinError('Invalid PIN');
                        }
                        setCardLoading(false);
                        return;
                    }
                }
                throw new Error(text);
            }
            const data = await res.json();
            setCardData(data);
            setShowCard(true);
            setShowPinModal(false);
        } catch (e: any) { 
            let msg = e.message;
            try { const p = JSON.parse(e.message); msg = p.msg || p.message || msg; } catch(err){}
            setCardData({ error: true, message: msg });
            setShowCard(true);
        }
        finally { setCardLoading(false); }
    };

    const handlePrint = () => {
        if (showCard) {
            mobileSafePrint('report-card-printable');
        } else { window.print(); }
    };

    const { data, error: swrError, isLoading } = useSWR(
        `/api/v1/dashboard/my-results?term=${encodeURIComponent(term)}&academicYear=${encodeURIComponent(year)}${submittedPin ? `&pinCode=${submittedPin}` : ''}`,
        fetcher
    );

    useEffect(() => {
        if (swrError && swrError.response?.data?.message === 'PIN_REQUIRED') {
            setShowPinModal(true);
        } else if (swrError && swrError.response?.data?.message?.includes('PIN')) {
            if (showPinModal) {
                setPinError(swrError.response.data.message);
            }
        } else if (data && !swrError) {
            setShowPinModal(false);
        }
    }, [swrError, data]);

    const { data: legacyData, isLoading: legacyLoading } = useSWR(
        '/api/v1/legacy-results/my',
        fetcher
    );

    if (isLoading) {
        return <div className="p-10 text-center text-gray-500">Loading your academic records...</div>;
    }

    const API_RESULTS = data?.results || [];
    const API_STUDENT = data?.student || {};
    const API_SUMMARY = data?.summary || { totalScore: 0, average: 0, classPos: 0, classTotal: 0, distinctions: 0 };
    const API_KEYS = data?.assessmentKeys || ['CA1', 'CA2', 'Exam'];

    const gridStyle = { gridTemplateColumns: `2fr repeat(${API_KEYS.length}, 1fr) 1fr 1fr 1fr 1fr` };
    const radarData = API_RESULTS.map((r: any) => ({ subject: r.subject.substring(0, 10), score: r.total }));

    // Security Gate — only show PIN gate if school explicitly enables it
    // (handled separately by school settings; default is open access)

    return (
        <div className="w-full max-w-6xl mx-auto space-y-6 print:pb-0 print:max-w-none print:bg-white print:m-0 print:p-0">
            {/* Header (Hidden on Print) */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3 print:hidden">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">My Results</h1>
                    <div className="flex items-center text-xs text-slate-400 gap-1 mt-1">
                        <HomeIcon size={12} />
                        <Link to="/student" className="hover:text-[#1E4DA6] transition-colors">Home</Link>
                        <ChevronRight size={12} className="opacity-50" />
                        <span>Results</span>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                <div className="flex items-center gap-3 flex-wrap">
                    <select value={year} onChange={e => setYear(e.target.value)} className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white outline-none focus:border-[#1E4DA6]">
                        {YEARS.map(y => <option key={y}>{y}</option>)}
                    </select>
                    <select value={term} onChange={e => setTerm(e.target.value)} className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white outline-none focus:border-[#1E4DA6]">
                        {TERMS.map(t => <option key={t}>{t}</option>)}
                    </select>
                    <Button onClick={handlePrint} variant="outline" className="flex items-center gap-2 text-sm"><Printer className="w-4 h-4" /> Print</Button>
                    <Button onClick={showCard ? () => setShowCard(false) : () => loadReportCard()} disabled={cardLoading} className="bg-[#1E4DA6] hover:bg-[#173F8C] text-white flex items-center gap-2 text-sm">
                        {showCard ? <><X className="w-4 h-4" />Back to Scores</> : cardLoading ? 'Loading…' : <><FileText className="w-4 h-4" />Official Report Card</>}
                    </Button>
                </div>
                </div>
            </div>

            <div className="flex space-x-1 border-b border-gray-200 mb-6 print:hidden">
                <button
                    onClick={() => setActiveTab('current')}
                    className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'current' ? 'border-[#1E4DA6] text-[#1E4DA6]' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                >
                    Current Results
                </button>
                <button
                    onClick={() => setActiveTab('legacy')}
                    className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'legacy' ? 'border-[#1E4DA6] text-[#1E4DA6]' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                >
                    Legacy Results (Previous App)
                </button>
            </div>

            {activeTab === 'legacy' ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h2 className="text-lg font-bold text-gray-800 mb-4">Historical Results</h2>
                    {legacyLoading ? (
                        <div className="text-center p-10 text-gray-500"><Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />Loading legacy results...</div>
                    ) : legacyData?.legacyResults?.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {legacyData.legacyResults.map((lr: any) => (
                                <div key={lr.id} className="border border-gray-200 rounded-lg p-4 flex flex-col hover:border-[#1E4DA6]/35 transition-colors bg-slate-50/50">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <p className="font-bold text-gray-800">{lr.academicYear}</p>
                                            <p className="text-sm text-gray-600">{lr.term}</p>
                                        </div>
                                        <span className="bg-[#1E4DA6]/10 text-[#122F69] text-[10px] px-2 py-1 rounded font-bold">LEGACY</span>
                                    </div>
                                    {lr.sessionName && <p className="text-xs text-gray-500 mb-2">{lr.sessionName}</p>}
                                    <p className="text-xs text-gray-500 mb-4">Class: {lr.class?.name}</p>
                                    <a href={lr.fileUrl} target="_blank" rel="noreferrer" className="mt-auto bg-[#1E4DA6]/5 text-[#173F8C] font-semibold text-sm py-2 px-4 rounded-lg text-center flex items-center justify-center gap-2 hover:bg-[#1E4DA6]/10 transition-colors">
                                        <Download className="w-4 h-4" /> Download PDF
                                    </a>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center p-10 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                            <Clock className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                            <p className="text-slate-500 font-medium">No legacy results found.</p>
                        </div>
                    )}
                </div>
            ) : showCard ? (
                cardLoading ? (
                    <div className="text-center p-20 bg-white rounded-xl border border-gray-100 print:hidden">
                        <p className="text-gray-400">Loading Report Card...</p>
                    </div>
                ) : cardData && cardData.notReleased ? (
                    <div className="text-center p-20 bg-white rounded-xl border border-gray-100 print:hidden">
                        <AlertCircle className="w-12 h-12 text-[#ff9800] mx-auto mb-3" />
                        <p className="font-bold text-[#ff9800] text-lg">Result Not Released</p>
                        <p className="text-gray-500 mt-2">{cardData.message || 'Results for this term have not been released yet.'}</p>
                    </div>
                ) : cardData && cardData.error ? (
                    <div className="text-center p-20 bg-white rounded-xl border border-gray-100 print:hidden">
                        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
                        <p className="font-bold text-red-500 text-lg">Error</p>
                        <p className="text-gray-500 mt-2">{cardData.message || 'Failed to load the Official Report Card.'}</p>
                    </div>
                ) : cardData && cardData.student ? (
                    <div id="report-card-printable" className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto print:border-none print:shadow-none print:overflow-visible">
                        <div className="min-w-[800px] print:min-w-0">
                            {(cardData.templateConfig || DEFAULT_CFG).blocks ? (
                                <div className="mx-auto w-full max-w-[794px]">
                                    <ReportCard config={{ ...(cardData.templateConfig || DEFAULT_CFG), globalSettings: { schoolSettings: cardData.schoolSettings } }} data={cardData} />
                                </div>
                            ) : (
                                <ReportCardPreview 
                                    templateConfig={cardData.templateConfig || DEFAULT_CFG}
                                    student={cardData.student}
                                    results={cardData.results}
                                    gradingScale={cardData.gradingScale}
                                    comments={cardData.comments}
                                    attendance={cardData.attendance}
                                    school={cardData.schoolSettings || { schoolName: 'School Name' }}
                                    summary={cardData.summary}
                                    annualResults={cardData.annualResults}
                                />
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="text-center p-20 bg-white rounded-xl border border-gray-100 print:hidden text-red-500">
                        Failed to load the Official Report Card.
                    </div>
                )
            ) : API_RESULTS.length === 0 ? (
                <div className="text-center p-20 bg-white rounded-xl border border-gray-100 print:hidden">
                    <p className="text-gray-400">No results found for {term} {year}.</p>
                </div>
            ) : (
                <div className="print:block">
                    {/* Print Header */}
                    <div className="hidden print:flex flex-col items-center justify-center mb-8 border-b-2 border-gray-800 pb-4">
                        <h1 className="text-3xl font-black text-black">OFFICIAL STUDENT RESULT</h1>
                        <p className="font-bold text-gray-800 mt-1">{term} - {year} Session</p>
                    </div>

                    {/* Student info card */}
                    <Card className="p-5 mb-6 bg-gradient-to-r from-[#173F8C] to-indigo-700 text-white shadow-lg print:shadow-none print:border-2 print:border-slate-800 print:bg-none print:bg-transparent print:text-black">
                        <div className="flex items-center justify-between flex-wrap gap-4">
                            <div className="flex items-center gap-4">
                                {API_STUDENT.photo ? (
                                    <img src={API_STUDENT.photo} alt="Photo" className="w-16 h-16 rounded-full object-cover border-2 border-white print:border-black" />
                                ) : (
                                    <div className="w-14 h-14 bg-white/20 print:bg-gray-200 rounded-full flex items-center justify-center text-2xl font-black print:border-2 border-black">
                                        {API_STUDENT.name?.charAt(0) || 'S'}
                                    </div>
                                )}
                                <div>
                                    <p className="font-bold text-xl">{API_STUDENT.name || 'Student Name'}</p>
                                    <p className="text-white/70 print:text-gray-700 text-sm font-medium mt-0.5">
                                        {API_STUDENT.admissionNo || 'N/A'} &nbsp;·&nbsp; {API_STUDENT.class || 'Class'} &nbsp;·&nbsp; {year} Session
                                    </p>
                                    <p className="text-white/70 print:text-gray-700 text-sm mt-0.5">{term}</p>
                                </div>
                            </div>
                            {/* Only show scores/position if not a purely comment-based result */}
                            {data?.templateConfig?.resultType !== 'COMMENT_BASED' && (
                                <div className="flex gap-6 print:gap-8 border-l border-white/20 print:border-black pl-6">
                                    <div className="text-center">
                                        <p className="text-3xl font-black print:text-black">{API_SUMMARY.average}%</p>
                                        <p className="text-white/70 print:text-gray-600 text-xs font-bold uppercase tracking-wider mt-1">Average</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-3xl font-black print:text-black text-yellow-300">
                                            {ordinal(API_SUMMARY.classPos)}
                                            {API_SUMMARY.classPos > 0 && <span className="text-lg text-white print:text-black">/{API_SUMMARY.classTotal}</span>}
                                        </p>
                                        <p className="text-white/70 print:text-gray-600 text-xs font-bold uppercase tracking-wider mt-1">Position</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </Card>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 print:grid-cols-1 print:gap-8">
                        {/* Results table */}
                        <div className="lg:col-span-2 print:col-span-1">
                            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="print:shadow-none print:border-none">
                                <Card className="bg-white border border-gray-100 shadow-sm overflow-hidden print:border-2 print:border-gray-800 print:rounded-none">
                                    <div style={gridStyle} className="bg-[#f8fafc] print:bg-gray-100 px-5 py-3 grid gap-2 text-xs font-bold text-gray-500 print:text-black uppercase tracking-wider border-b border-gray-100 print:border-gray-800">
                                        <span>Subject</span>
                                        {API_KEYS.map((k: string) => (
                                            <span key={k} className="text-center truncate" title={k}>
                                                {k.length > 10 ? k.substring(0, 8) + '..' : k}
                                            </span>
                                        ))}
                                        <span className="text-center">Total</span>
                                        <span className="text-center">Grade</span>
                                        <span className="text-center">Highest</span>
                                        <span className="text-center">Pos.</span>
                                    </div>
                                    <div className="divide-y divide-gray-50 print:divide-gray-300">
                                        {API_RESULTS.map((r: any) => (
                                            <div key={r.subject} style={gridStyle} className="grid gap-2 px-5 py-3.5 items-center hover:bg-gray-50/40 transition-colors">
                                                <span className="font-semibold text-gray-900 text-sm print:text-black">{r.subject}</span>
                                                {API_KEYS.map((k: string) => (
                                                    <span key={`${r.subject}-${k}`} className="text-center text-sm text-gray-600 print:text-gray-800">
                                                        {r.scores?.[k] ?? '-'}
                                                    </span>
                                                ))}
                                                <span className="text-center font-bold text-gray-900 print:text-black">{r.total}</span>
                                                <div className="flex justify-center">
                                                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold print:inline-block print:border print:border-black print:text-black print:bg-white print:rounded-none ${GRADE_COLOR[r.grade] ?? 'bg-gray-100 text-gray-500'}`}>
                                                        {r.grade}
                                                    </span>
                                                </div>
                                                <span className="text-center text-sm font-medium text-gray-500">{r.highest || '-'}</span>
                                                <div className="flex items-center justify-center gap-1">
                                                    <span className="text-sm font-bold text-gray-700 print:text-black">{r.position ? ordinal(r.position) : '-'}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    {data?.templateConfig?.resultType !== 'COMMENT_BASED' && (
                                        <div style={gridStyle} className="bg-[#1E4DA6]/8 print:bg-slate-100 px-5 py-3 grid gap-2 border-t border-slate-100 print:border-slate-800">
                                            <span className="font-black text-slate-900 print:text-black text-sm uppercase">Total</span>
                                            {API_KEYS.map((k: string) => <span key={`footer-${k}`} />)}
                                            <span />
                                            <span className="text-center font-black text-[#173F8C] print:text-black">{API_SUMMARY.totalScore}</span>
                                            <span className="text-center font-black text-[#173F8C] print:text-black">{API_SUMMARY.average}%</span>
                                            <span />
                                            <span className="text-center font-black text-[#173F8C] print:text-black">{ordinal(API_SUMMARY.classPos)}</span>
                                        </div>
                                    )}
                                </Card>
                            </motion.div>
                        </div>

                        {/* Summary / Remarks */}
                        <div className="space-y-5 print:mt-6">

                            {/* Third Term Promotion Logic Display */}
                            {term === 'Third Term' && API_SUMMARY.cumulativeAverage !== null && (
                                <Card className={`p-5 shadow-sm border-2 ${API_SUMMARY.promoted ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'} print:border-gray-800 print:bg-white print:shadow-none`}>
                                    <h4 className="font-bold text-gray-900 text-sm mb-2 print:text-black">End of Session Performance</h4>
                                    <div className="flex justify-between items-center bg-white p-3 rounded border border-gray-100 mb-3 print:border-black">
                                        <span className="text-sm font-semibold text-gray-600 print:text-black">Cumulative Average:</span>
                                        <span className="text-lg font-black text-gray-900 print:text-black">{API_SUMMARY.cumulativeAverage}%</span>
                                    </div>
                                    <p className={`text-sm font-bold ${API_SUMMARY.promoted ? 'text-green-700' : 'text-red-700'} print:text-black`}>
                                        {API_SUMMARY.promoted ? 'STATUS: PROMOTED' : 'STATUS: REPEAT'}
                                    </p>
                                </Card>
                            )}

                            <Card className="p-5 bg-white border border-gray-100 shadow-sm print:border-2 print:border-gray-800 print:shadow-none flex flex-col gap-4">
                                <div>
                                    <h4 className="font-bold text-gray-900 text-sm mb-2 print:text-black">Principal's Remarks</h4>
                                    <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 print:border-black print:bg-white print:rounded-none">
                                        <p className="text-sm font-semibold text-gray-800 italic print:text-black">"{API_SUMMARY.principalRemark || 'Satisfactory performance.'}"</p>
                                    </div>
                                </div>

                                <div className="hidden print:flex justify-between items-end mt-10 pt-10 border-t border-dashed border-gray-400">
                                    <div className="text-center">
                                        <div className="w-48 border-b border-black mb-2"></div>
                                        <span className="font-bold text-xs uppercase text-black">Form Teacher's Signature</span>
                                    </div>
                                    <div className="text-center">
                                        <div className="w-48 border-b border-black mb-2"></div>
                                        <span className="font-bold text-xs uppercase text-black">Principal's Signature & Stamp</span>
                                    </div>
                                </div>
                            </Card>

                            <Card className="p-5 bg-white border border-gray-100 shadow-sm print:hidden">
                                <h4 className="font-bold text-gray-900 text-sm mb-3">Performance Radar</h4>
                                <ResponsiveContainer width="100%" height={220}>
                                    <RadarChart data={radarData} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
                                        <PolarGrid stroke="#e5e7eb" />
                                        <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: '#6b7280' }} />
                                        <Radar name="Score" dataKey="score" stroke="#2563eb" fill="#2563eb" fillOpacity={0.15} strokeWidth={2} />
                                        <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 11 }} />
                                    </RadarChart>
                                </ResponsiveContainer>
                            </Card>
                        </div>
                    </div>
                </div>
            )}

            {showPinModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-[#1a1a2e] w-full max-w-md rounded-2xl shadow-2xl p-6 border border-gray-100 dark:border-white/5 relative overflow-hidden">
                        {/* Decorative Top Banner */}
                        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#1E4DA6] to-indigo-500" />
                        
                        <div className="text-center mb-6">
                            <div className="w-16 h-16 mx-auto bg-[#1E4DA6]/5 dark:bg-[#1E4DA6]/10 rounded-2xl flex items-center justify-center mb-4">
                                <KeyRound className="w-8 h-8 text-[#1E4DA6] dark:text-[#1E4DA6]/60" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Result Access PIN Required</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Please enter your result checking PIN to view the report card for {term}.</p>
                        </div>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-1.5">Enter PIN Code</label>
                                <input
                                    type="text"
                                    placeholder="e.g. 1234-5678-9012"
                                    value={pinCode}
                                    onChange={(e) => {
                                        setPinCode(e.target.value.toUpperCase());
                                        setPinError(null);
                                    }}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-black/20 text-gray-900 dark:text-white font-mono text-center tracking-widest outline-none focus:ring-2 focus:ring-[#1E4DA6]/50 transition-all uppercase"
                                    autoFocus
                                />
                                {pinError && <p className="text-xs text-red-500 mt-2 flex items-center gap-1 justify-center"><AlertCircle className="w-3 h-3" /> {pinError}</p>}
                            </div>
                            
                            <div className="flex gap-3 pt-2">
                                <Button variant="outline" className="flex-1 rounded-xl" onClick={() => { setShowPinModal(false); setPinError(null); setPinCode(''); }}>
                                    Cancel
                                </Button>
                                <Button 
                                    className="flex-1 rounded-xl bg-gradient-to-r from-[#1E4DA6] to-indigo-600 text-white shadow-md shadow-[#1E4DA6]/20 hover:shadow-lg hover:shadow-[#1E4DA6]/30 border-0"
                                    onClick={() => {
                                        setSubmittedPin(pinCode);
                                    }}
                                    disabled={!pinCode || pinCode.length < 5 || cardLoading}
                                >
                                    {cardLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                    Unlock Result
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

