import { useState, useEffect } from 'react';
import { Home as HomeIcon, ChevronRight, Printer, FileText, Download, BookOpen, Loader2, AlertCircle, KeyRound, Minus, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import useSWR from 'swr';
import { fetcher } from '../../utils/fetcher';
import ReportCardPreview from '../../components/report/ReportCardPreview';
import ReportCard from '../../components/report-blocks/ReportCard';
import { Card } from '../../components/ui/card';
import { mobileSafePrint } from '../../lib/printUtils';
export default function ParentResults() {
    const [activeTab, setActiveTab] = useState<'current'|'legacy'>('current');
    const [childId, setChildId] = useState('');
    const [term, setTerm] = useState('First Term');
    const [year, setYear] = useState('2025/2026');
    const [terms, setTerms] = useState<any[]>([]);
    const [sessions, setSessions] = useState<any[]>([]);
    const [showCard, setShowCard] = useState(false);
    const [cardData, setCardData] = useState<any>(null);
    const [cardLoading, setCardLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [downloadLoading, setDownloadLoading] = useState(false);
    const [transcriptLoading, setTranscriptLoading] = useState(false);
    
    // PIN states
    const [showPinModal, setShowPinModal] = useState(false);
    const [pinCode, setPinCode] = useState('');
    const [pinError, setPinError] = useState<string | null>(null);

    // Responsive states
    const [previewZoom, setPreviewZoom] = useState(1);

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 850 && !showCard) {
                // Initial scale for mobile
                setPreviewZoom(Math.max(0.3, Math.min(1, (window.innerWidth - 40) / 800)));
            }
        };
        handleResize();
        // We only want to set initial zoom once on load, so user can manually adjust it.
    }, []);

    const { data: dashboardData, isLoading: loadingChildren } = useSWR(`/api/v1/dashboard/me`, fetcher);
    const { data: legacyData, isLoading: legacyLoading } = useSWR('/api/v1/legacy-results/my', fetcher);
    
    useEffect(() => {
        const fetchTermsSessions = async () => {
            try {
                const [termsRes, sessionsRes] = await Promise.all([
                    fetch(`${import.meta.env.VITE_API_URL || '/api/v1'}/terms`, { credentials: 'include' }).then(r => r.json()),
                    fetch(`${import.meta.env.VITE_API_URL || '/api/v1'}/sessions`, { credentials: 'include' }).then(r => r.json())
                ]);
                
                if (termsRes.terms) {
                    setTerms(termsRes.terms);
                    const active = termsRes.terms.find((t: any) => t.isCurrent);
                    if (active) setTerm(active.name);
                    else if (termsRes.terms.length > 0) setTerm(termsRes.terms[0].name);
                }
                if (sessionsRes.sessions) {
                    setSessions(sessionsRes.sessions);
                    const activeSession = sessionsRes.sessions.find((s: any) => s.isCurrent);
                    if (activeSession) setYear(activeSession.name);
                    else if (sessionsRes.sessions.length > 0) setYear(sessionsRes.sessions[0].name);
                }
            } catch (err) {
                console.error("Failed to fetch terms and sessions:", err);
            }
        };
        fetchTermsSessions();
    }, []);
    const children = dashboardData?.children || [];

    const API_URL = import.meta.env.VITE_API_URL || '/api/v1';

    useEffect(() => {
        if (children.length > 0 && !childId) {
            setChildId(children[0].id);
        }
    }, [children, childId]);

    const loadReportCard = async (providedPin?: string) => {
        if (!childId) return;
        setCardLoading(true);
        setShowCard(false);
        try {
            setErrorMsg(null);
            setPinError(null);
            const currentPin = providedPin || pinCode;
            const url = new URL(`${API_URL}/results/report-card`, window.location.origin);
            url.searchParams.append('studentProfileId', childId);
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
                throw new Error(`API Error ${res.status}: ${text}`);
            }
            const data = await res.json();
            setCardData(data);
            setShowCard(true);
            setShowPinModal(false);
        } catch (err: any) {
            console.error("Report Card Fetch Error:", err);
            setErrorMsg(err.message || 'Unknown error');
            setCardData(null);
            setShowCard(true);
        } finally {
            setCardLoading(false);
        }
    };

    const handlePrint = () => {
        if (!cardData) return;
        mobileSafePrint('report-card-printable');
    };

    const handleDownloadPDF = async () => {
        if (!childId) return;
        setDownloadLoading(true);
        try {
            const url = new URL(`${API_URL}/results/report-card/pdf`, window.location.origin);
            url.searchParams.append('studentProfileId', childId);
            url.searchParams.append('term', term);
            url.searchParams.append('academicYear', year);
            if (pinCode) {
                url.searchParams.append('pinCode', pinCode);
            }
            const res = await fetch(url.toString(), { credentials: 'include' });
            if (!res.ok) {
                const text = await res.text();
                if (text.includes('PIN_REQUIRED')) {
                    setShowPinModal(true);
                    return;
                }
                throw new Error('Failed to download PDF');
            }
            const blob = await res.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = blobUrl;
            a.download = `ReportCard_${term}_${year.replace('/', '-')}.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        } catch (err) {
            console.error(err);
            alert('Error downloading PDF');
        } finally {
            setDownloadLoading(false);
        }
    };

    const handleDownloadTranscript = async () => {
        if (!childId) return;
        setTranscriptLoading(true);
        try {
            const res = await fetch(`${API_URL}/transcripts/${childId}`, { credentials: 'include' });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.msg || 'Transcript generation failed');
            }
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Transcript.pdf`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (err: any) {
            alert(err.message || 'Failed to download Transcript. Transcripts might not be available.');
        } finally {
            setTranscriptLoading(false);
        }
    };

    if (loadingChildren) return (
        <div className="flex items-center justify-center h-[50vh]">
            <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--accent)' }} />
        </div>
    );

    const selectedChild = children.find((c: any) => c.id === childId);

    return (
        <div className="w-full max-w-6xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Report Cards</h1>
                    <div className="flex items-center text-xs text-gray-400 gap-1 mt-1">
                        <HomeIcon size={12} />
                        <Link to="/parent" className="hover:text-[#173F8C] transition-colors">Home</Link>
                        <ChevronRight size={12} className="opacity-50" />
                        <span>Results</span>
                    </div>
                </div>
            </div>

            <div className="flex space-x-1 border-b border-gray-200">
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
                            {legacyData.legacyResults.filter((lr: any) => !lr.studentId || lr.studentId === childId).map((lr: any) => (
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
                            {legacyData.legacyResults.filter((lr: any) => !lr.studentId || lr.studentId === childId).length === 0 && (
                                <div className="col-span-full text-center p-10 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                                    <p className="text-slate-500 font-medium">No legacy results found for this child.</p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-center p-10 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                            <AlertCircle className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                            <p className="text-slate-500 font-medium">No legacy results found.</p>
                        </div>
                    )}
                </div>
            ) : (
                <>
                    {/* Filter Bar */}
                    <Card className="p-4 sm:p-5 shadow-sm border-slate-200">
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-end">
                            <div className="sm:col-span-3">
                                <label className="text-[10px] sm:text-xs font-bold uppercase block mb-1.5 text-slate-500">Child</label>
                                <select
                                    value={childId}
                                    onChange={e => { setChildId(e.target.value); setShowCard(false); }}
                                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-white outline-none focus:border-[#1E4DA6] focus:ring-1 focus:ring-[#1E4DA6] transition-colors"
                                >
                                    {children.length === 0 && <option value="">No children linked</option>}
                                    {children.map((c: any) => <option key={c.id} value={c.id}>{c.name || `${c.firstName} ${c.lastName}`}</option>)}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-3 sm:col-span-4 lg:col-span-3">
                                <div>
                                    <label className="text-[10px] sm:text-xs font-bold uppercase block mb-1.5 text-slate-500">Academic Year</label>
                                    <select
                                        value={year}
                                        onChange={e => { setYear(e.target.value); setShowCard(false); }}
                                        className="w-full border border-slate-200 rounded-xl px-2 py-2.5 text-sm bg-white outline-none focus:border-[#1E4DA6] focus:ring-1 focus:ring-[#1E4DA6] transition-colors"
                                    >
                                        {sessions.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                                        {sessions.length === 0 && (
                                            <>
                                                <option value="2024/2025">2024/2025</option>
                                                <option value="2025/2026">2025/2026</option>
                                            </>
                                        )}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] sm:text-xs font-bold uppercase block mb-1.5 text-slate-500">Term</label>
                                    <select
                                        value={term}
                                        onChange={e => { setTerm(e.target.value); setShowCard(false); }}
                                        className="w-full border border-slate-200 rounded-xl px-2 py-2.5 text-sm bg-white outline-none focus:border-[#1E4DA6] focus:ring-1 focus:ring-[#1E4DA6] transition-colors"
                                    >
                                        {terms.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                                        {terms.length === 0 && (
                                            <>
                                                <option value="First Term">First Term</option>
                                                <option value="Second Term">Second Term</option>
                                                <option value="Third Term">Third Term</option>
                                            </>
                                        )}
                                    </select>
                                </div>
                            </div>
                            <div className="sm:col-span-5 lg:col-span-6 flex flex-col sm:flex-row gap-2 justify-end">
                                <Button onClick={handleDownloadTranscript} disabled={transcriptLoading || !childId} variant="outline" className="gap-2 w-full sm:w-auto">
                                    {transcriptLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                                    <span className="hidden lg:inline">{transcriptLoading ? 'Generating…' : 'Get Transcript'}</span>
                                    <span className="lg:hidden">Transcript</span>
                                </Button>
                                <Button
                                    onClick={() => loadReportCard()}
                                    disabled={cardLoading || !childId}
                                    className="bg-[#1E4DA6] hover:bg-[#173F8C] text-white gap-2 w-full sm:w-auto"
                                >
                                    {cardLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <BookOpen className="w-4 h-4" />}
                                    {cardLoading ? 'Loading…' : 'View Report'}
                                </Button>
                            </div>
                        </div>
                    </Card>

            {/* Result Quick-Stats Banner (when loaded) */}
            {/* Stat Cards - Only show if not a purely comment-based result */}
            {showCard && cardData && !cardData.notReleased && cardData.templateConfig?.resultType !== 'COMMENT_BASED' && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {[
                        { label: 'Total Score', value: cardData.summary?.totalScore ?? '—' },
                        { label: 'Average', value: cardData.summary?.average ? `${cardData.summary.average}%` : '—' },
                        { label: 'Position', value: cardData.summary?.overallPosition ? (
                            (() => {
                                const n = Number(cardData.summary.overallPosition);
                                const s = ['TH', 'ST', 'ND', 'RD'];
                                const v = n % 100;
                                return n + (s[(v - 20) % 10] || s[v] || s[0]);
                            })()
                        ) : '—' },
                        { label: 'Subjects', value: cardData.summary?.totalSubjects ?? '—' },
                    ].map((stat, i) => (
                        <Card key={i} className="p-4 text-center shadow-sm border-slate-200">
                            <p className="text-xs mb-1 text-slate-500">{stat.label}</p>
                            <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                        </Card>
                    ))}
                </div>
            )}

            {/* Content Area */}
            {!showCard && !cardLoading && (
                <Card className="text-center py-20 flex flex-col items-center shadow-sm border-slate-200">
                    <BookOpen className="w-14 h-14 mb-4 text-slate-300" />
                    <p className="font-bold text-lg text-slate-900">View Your Child's Report Card</p>
                    <p className="text-sm mt-1 max-w-sm text-slate-500">
                        Select a child, academic year and term above, then click <strong>View Report Card</strong>.
                    </p>
                </Card>
            )}

            {showCard && cardData && cardData.notReleased && (
                <Card className="text-center py-20 flex flex-col items-center shadow-sm border-slate-200">
                    <AlertCircle className="w-12 h-12 text-amber-500 mb-3" />
                    <p className="font-bold text-amber-500 text-lg">Result Not Released</p>
                    <p className="text-sm text-slate-500 mt-1 max-w-sm">{cardData.message || 'Results for this term have not been released yet. Please check back later.'}</p>
                </Card>
            )}

            {showCard && errorMsg && !cardData?.notReleased && (
                <Card className="text-center py-20 flex flex-col items-center shadow-sm border-slate-200">
                    <AlertCircle className="w-12 h-12 text-red-400 mb-3" />
                    <p className="font-bold text-red-500">No results found</p>
                    <p className="text-sm text-slate-500 mt-1 max-w-sm">Results for <strong>{term} {year}</strong> have not been released yet, or the teacher has not submitted scores.</p>
                </Card>
            )}

            {showCard && cardData && !cardData.notReleased && !errorMsg && (
                <>
                    <div className="flex flex-wrap items-center justify-between gap-3 mb-4 bg-white p-3 rounded-2xl border border-gray-200 shadow-sm">
                        <div className="flex items-center gap-1 bg-slate-50 rounded-lg border border-gray-200 p-1 shadow-inner">
                            <Button size="icon" variant="ghost" onClick={() => setPreviewZoom(z => Math.max(0.3, z - 0.1))} className="w-7 h-7 sm:w-8 sm:h-8"><Minus className="w-3 h-3" /></Button>
                            <span className="text-[10px] sm:text-xs font-bold w-12 text-center text-gray-600">{Math.round(previewZoom * 100)}%</span>
                            <Button size="icon" variant="ghost" onClick={() => setPreviewZoom(z => Math.min(2.0, z + 0.1))} className="w-7 h-7 sm:w-8 sm:h-8"><Plus className="w-3 h-3" /></Button>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button onClick={handlePrint} variant="outline" className="gap-2 hidden sm:flex h-9">
                                <Printer className="w-4 h-4" />Print
                            </Button>
                            <Button onClick={handleDownloadPDF} disabled={downloadLoading} className="gap-2 h-9 bg-slate-800 hover:bg-slate-900 text-white shadow-md">
                                {downloadLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                                <span className="hidden sm:inline">{downloadLoading ? 'Generating…' : 'Download PDF'}</span>
                                <span className="sm:hidden">PDF</span>
                            </Button>
                        </div>
                    </div>
                    <div id="report-card-printable" className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-x-auto print:border-none print:shadow-none print:overflow-visible transition-all duration-300">
                        <div className="py-10 mx-auto origin-top transform-gpu print:min-w-0" style={{ zoom: previewZoom }}>
                        {cardData.templateConfig?.blocks ? (
                            <div className="mx-auto w-full max-w-[794px]">
                                <ReportCard config={{ ...cardData.templateConfig, globalSettings: { schoolSettings: cardData.schoolSettings } }} data={cardData} />
                            </div>
                        ) : (
                            <ReportCardPreview
                                templateConfig={cardData.templateConfig}
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
                </>
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
                                    onClick={() => loadReportCard()}
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
            </>
            )}
        </div>
    );
}
