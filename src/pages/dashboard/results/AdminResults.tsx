import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '../../../components/ui/button';
import { SettingsShell } from '../settings/shared/SettingsShell';
import { SettingsHero } from '../settings/shared/SettingsHero';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import ReportCardPreview from '../../../components/report/ReportCardPreview';
import type { TemplateConfig, SubjectResult, GradeRule } from '../../../components/report/ReportCardPreview';
import ReportCard from '../../../components/report-blocks/ReportCard';
import { Printer, Eye, X, Users, FileText, TrendingUp, Grid, List as ListIcon, MessageSquare, Save, Loader2, Cpu, Globe, GlobeLock, Share2, Plus, Minus, Download } from 'lucide-react';
import { ErrorBoundary } from '../../../components/ErrorBoundary';
import { toast } from 'sonner';
import BroadsheetView from './BroadsheetView';
import CumulativeBroadsheetView from './CumulativeBroadsheetView';
import TranscriptSheet from './TranscriptSheet';
import { useSchoolType } from '../../../context/SchoolTypeContext';
import { useAuth } from '../../../context/AuthContext';
import { Pagination } from '../../../components/shared/Pagination';
import { cn } from '../../../lib/utils';
import { mobileSafePrint } from '../../../lib/printUtils';
interface StudentSummary {
    studentProfileId: string; name: string; admissionNo: string; gender: string;
    subjectCount: number; totalScore: number; average: string; overallGrade: string;
    position: number; hasComments: boolean; isPassing: boolean;
}
interface ReportCardData {
    student: { id: string; name: string; admissionNo: string; className: string; gender: string; dateOfBirth?: string; term: string; academicYear: string };
    results: SubjectResult[];
    annualResults?: any[];
    summary: { totalSubjects: number; totalScore: number; average: string; overallPosition?: number; classAverage?: string; passMark: number; cumulativeAverage?: string };
    attendance?: { total: number; present: number; absent: number; late: number };
    comments?: { teacherComment?: string; headComment?: string; principalComment?: string; nextTermBegins?: string };
    templateConfig: TemplateConfig | null;
    schoolSettings: {
        schoolName: string; logoUrl?: string; address?: string; phone?: string; tagline?: string;
        resultShowBorder?: boolean; resultShowSignature?: boolean; resultShowNextTermFees?: boolean;
    } | null;
    gradingScale: { grades: GradeRule[]; passMark: number };
}

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
    primaryColor: '#0036a1', headerBg: '#0036a1', fontFamily: 'serif',
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

const TeacherWrapper = ({ children }: { children: React.ReactNode }) => <>{children}</>;

export default function AdminResults({ defaultTab = 'CARDS', isTeacherDashboard }: { defaultTab?: 'CARDS' | 'BROADSHEET' | 'CUMULATIVE' | 'TRANSCRIPT', isTeacherDashboard?: boolean }) {
    const { user } = useAuth();
    const isTeacher = user?.role === 'TEACHER';
    const API = import.meta.env.VITE_API_URL || '/api/v1';
    const [classes, setClasses] = useState<{ id: string; name: string }[]>([]);
    const [classId, setClassId] = useState('');
    const [term, setTerm] = useState('First Term');
    const [year, setYear] = useState('2025/2026');
    const [terms, setTerms] = useState<any[]>([]);
    const [sessions, setSessions] = useState<any[]>([]);
    const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
    const [categoryId, setCategoryId] = useState('all');
    const [students, setStudents] = useState<StudentSummary[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 10;
    const [loading, setLoading] = useState(false);
    const [modal, setModal] = useState<ReportCardData | null>(null);
    const [previewZoom, setPreviewZoom] = useState(1);
    const [transcriptStudentId, setTranscriptStudentId] = useState<string | null>(null);
    const [loadingModal, setLoadingModal] = useState(false);
    const [activeTab, setActiveTab] = useState<'CARDS' | 'BROADSHEET' | 'CUMULATIVE' | 'TRANSCRIPT'>(defaultTab);
    
    // Bulk Print State
    const [bulkPrinting, setBulkPrinting] = useState(false);
    const [bulkPreviewModal, setBulkPreviewModal] = useState(false);
    const [bulkData, setBulkData] = useState<ReportCardData[] | null>(null);
    const [loadingBulkModal, setLoadingBulkModal] = useState(false);

    // Support for Result Types (CA vs Exam)
    const [classStructure, setClassStructure] = useState<any[]>([]);
    const [resultPrintType, setResultPrintType] = useState('FULL');
    const [resultMode, setResultMode] = useState<'SCORE_BASED' | 'COMMENT_BASED'>('SCORE_BASED');

    const { activeSchoolType } = useSchoolType();

    // Phase 1: Compute & Release
    const [computing, setComputing] = useState(false);
    const [releasing, setReleasing] = useState(false);
    const [isReleased, setIsReleased] = useState(false);

    // Phase 2: Sharing
    const [shareModal, setShareModal] = useState<{ studentProfileId: string; name: string } | null>(null);

    useEffect(() => {
        if (modal) {
            document.body.classList.add('print-modal-open');
        } else {
            document.body.classList.remove('print-modal-open');
        }
        return () => document.body.classList.remove('print-modal-open');
    }, [modal]);

    const [shareForm, setShareForm] = useState({ channel: 'EMAIL', recipient: '' });
    const [sharing, setSharing] = useState(false);

    const handleShare = async () => {
        if (!shareModal || !shareForm.recipient) return;
        setSharing(true);
        try {
            // Client-side sharing via links
            const baseUrl = window.location.origin;
            const pdfUrl = `${baseUrl}/report-card/pdf?studentProfileId=${shareModal.studentProfileId}&term=${term}&academicYear=${year}`;
            
            if (shareForm.channel === 'WHATSAPP') {
                const text = encodeURIComponent(`Hello! The ${term} result for ${shareModal.name} is now available. View or download it securely here: ${pdfUrl}`);
                const phone = shareForm.recipient.replace(/\D/g, '');
                const waLink = `https://wa.me/${phone}?text=${text}`;
                window.open(waLink, '_blank');
                toast.success(`Opened WhatsApp to share with ${shareModal.name}'s parent`);
            } else {
                const subject = encodeURIComponent(`${shareModal.name}'s ${term} Result`);
                const body = encodeURIComponent(`Dear Parent/Guardian,\n\nThe ${term} (${year}) result for ${shareModal.name} is now available.\n\nView or download it securely here: ${pdfUrl}\n\nThank you,\nSchool Administration`);
                const mailtoLink = `mailto:${shareForm.recipient}?subject=${subject}&body=${body}`;
                window.open(mailtoLink, '_self'); // mailto works better with _self
                toast.success(`Opened Email client to share with ${shareModal.name}'s parent`);
            }
            
            setShareModal(null);
            setShareForm({ channel: 'EMAIL', recipient: '' });
        } catch (e: any) { toast.error(e.message); }
        finally { setSharing(false); }
    };

    const handleCompute = async () => {
        if (!classId) return toast.error('Select a class first');
        setComputing(true);
        try {
            const res = await fetch(`${API}/results/compute`, {
                method: 'POST', credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ classId, term, academicYear: year })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.msg || 'Compute failed');
            toast.success('Results computed successfully! Positions and grades updated.');
            loadReport();
        } catch (e: any) { toast.error(e.message); }
        finally { setComputing(false); }
    };

    const handleToggleRelease = async () => {
        if (!classId) return toast.error('Select a class first');
        setReleasing(true);
        const next = !isReleased;
        try {
            const res = await fetch(`${API}/results/release-status`, {
                method: 'POST', credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ classId, term, academicYear: year, isReleased: next })
            });
            if (!res.ok) throw new Error('Failed to update release status');
            setIsReleased(next);
            toast.success(next ? 'Results released to parents & students!' : 'Results retracted.');
        } catch (e: any) { toast.error(e.message); }
        finally { setReleasing(false); }
    };

    useEffect(() => {
        const params = new URLSearchParams();
        if (activeSchoolType) params.append('schoolType', activeSchoolType);
        
        Promise.all([
            fetch(`${API}/${isTeacher ? 'teachers/me/classes' : 'classes/all'}?${params.toString()}`, { credentials: 'include' }).then(r => r.json()),
            fetch(`${API}/terms`, { credentials: 'include' }).then(r => r.json()),
            fetch(`${API}/sessions`, { credentials: 'include' }).then(r => r.json())
        ]).then(([classesData, termsData, sessionsData]) => {
            setClasses(classesData.classes || []);
            if (termsData.terms) {
                setTerms(termsData.terms);
                const active = termsData.terms.find((t: any) => t.isActive);
                if (active) setTerm(active.name);
                else if (termsData.terms.length > 0) setTerm(termsData.terms[0].name);
            }
            if (sessionsData.sessions) {
                setSessions(sessionsData.sessions);
                const activeSession = sessionsData.sessions.find((s: any) => s.isCurrent);
                if (activeSession) setYear(activeSession.name);
                else if (sessionsData.sessions.length > 0) setYear(sessionsData.sessions[0].name);
            }
        }).catch(console.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeSchoolType]);

    useEffect(() => {
        if (sessions.length > 0 && terms.length > 0 && year) {
            const selectedSessionId = sessions.find((s: any) => s.name === year)?.id;
            const yearTerms = terms.filter((t: any) => t.sessionId === selectedSessionId);
            if (yearTerms.length > 0 && !yearTerms.find((t: any) => t.name === term)) {
                setTerm(yearTerms[0].name);
            }
        }
    }, [year, sessions, terms, term]);

    const loadReport = async () => {
        if (!classId) return;
        setLoading(true);
        try {
            const [reportRes, structRes] = await Promise.all([
                fetch(`${API}/results/class-report?classId=${classId}&term=${encodeURIComponent(term)}&academicYear=${encodeURIComponent(year)}`, { credentials: 'include' }),
                fetch(`${API}/assessments/structure?classId=${classId}`, { credentials: 'include' })
            ]);
            const reportData = await reportRes.json();
            const structData = await structRes.json();
            
            setStudents(reportData.students || []);
            setCurrentPage(1);
            
            const structure = structData.parts || [];
            setClassStructure(structure);
            
            setResultPrintType(prev => {
                if (resultMode === 'COMMENT_BASED') {
                    return prev.startsWith('COMMENT_') ? prev : 'COMMENT_CA';
                } else {
                    return prev === 'COMMENT_CA' || prev === 'COMMENT_EXAM' ? 'FULL' : prev;
                }
            });
        } catch (e) {
            toast.error("Failed to load class report");
        } finally {
            setLoading(false);
        }
    };

    const openCard = async (sp: StudentSummary) => {
        setLoadingModal(true); setModal(null);
        try {
            const res = await fetch(`${API}/results/report-card?studentProfileId=${sp.studentProfileId}&term=${encodeURIComponent(term)}&academicYear=${encodeURIComponent(year)}&classId=${classId}&resultType=${resultPrintType}`, { credentials: 'include' });
            let data = await res.json();
            if (!res.ok) throw new Error(data.msg || data.message || "Failed to load report card");
            if (data.notReleased) throw new Error(data.message || "Result not yet released");
            
            // TASK 1 & 2: Dynamic Assessment Structure for Columns & Result Type Filter
            if (classStructure && classStructure.length > 0) {
                let dynamicCols = classStructure.map((p: any) => ({
                    id: p.id || p.name, name: p.name, key: p.name, show: true, weight: p.weight || p.maxScore
                }));
                
                // Filter columns based on resultPrintType
                if (resultPrintType === 'CA_ONLY') {
                    dynamicCols = dynamicCols.filter(c => !c.name.toLowerCase().includes('exam'));
                } else if (resultPrintType !== 'FULL' && resultPrintType !== 'CUMULATIVE') {
                    // Match a specific CA like 'First CA'
                    dynamicCols = dynamicCols.filter(c => c.name === resultPrintType);
                }

                const visibleKeys = dynamicCols.map(c => c.key);

                // Recalculate totals if we filtered columns
                if (resultPrintType !== 'FULL' && resultPrintType !== 'CUMULATIVE') {
                    data.results = data.results.map((r: any) => {
                        let newTotal = 0;
                        for (const key of visibleKeys) {
                            if (r.scores && r.scores[key]) {
                                newTotal += Number(r.scores[key]) || 0;
                            }
                        }
                        // Simple pass/fail based on new total and scale if needed
                        return { ...r, totalScore: newTotal };
                    });
                }

                const cfg = data.templateConfig || DEFAULT_CFG;
                data.templateConfig = {
                    ...cfg,
                    reportTitle: resultPrintType === 'COMMENT_CA' ? 'Mid-Term CA Report' : (resultPrintType === 'COMMENT_EXAM' ? 'End of Term Academic Report' : cfg.reportTitle),
                    showClassAverage: resultPrintType === 'FULL' ? cfg.showClassAverage : false,
                    showOverallPosition: resultPrintType === 'FULL' ? cfg.showOverallPosition : false,
                    showSubjectPosition: resultPrintType === 'FULL' ? cfg.showSubjectPosition : false,
                    subjectColumns: [
                        ...dynamicCols,
                        { id: 'total', name: 'Total', key: 'total', show: resultPrintType === 'FULL' || resultPrintType === 'CA_ONLY', computed: true },
                        { id: 'grade', name: 'Grade', key: 'grade', show: resultPrintType === 'FULL', computed: true },
                        { id: 'remark', name: 'Remark', key: 'remark', show: resultPrintType === 'FULL', computed: true }
                    ]
                };
            }

            setModal(data);
        } catch (e: any) {
            toast.error(e.message || "Failed to load report card");
        } finally {
            setLoadingModal(false);
        }
    };

    const handleDownloadSinglePDF = async () => {
        if (!modal) return toast.error("No student loaded");
        toast.loading("Generating PDF...", { id: 'single-pdf-progress' });
        try {
            const htmlToImage = await import('html-to-image');
            const { jsPDF } = await import('jspdf');
            const container = document.getElementById('report-card-printable');
            if (!container) throw new Error("Could not find report card container");

            const fileName = `${(modal.student?.name || 'Student').replace(/\s+/g, '_')}_${(modal.student?.admissionNo || '').replace(/\//g, '-')}_Result.pdf`;
            
            const imgData = await htmlToImage.toJpeg(container, { quality: 0.95, pixelRatio: 2 });
            const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
            
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const margin = 10;
            const w = pdfWidth - margin * 2;
            const h = (container.offsetHeight * w) / container.offsetWidth;
            
            pdf.addImage(imgData, 'JPEG', margin, margin, w, h);
            pdf.save(fileName);
            toast.success("Downloaded successfully!", { id: 'single-pdf-progress' });
        } catch (e: any) {
            console.error(e);
            toast.error(e.message || "Failed to generate PDF", { id: 'single-pdf-progress' });
        }
    };

    const handleDownloadBulkZIP = async () => {
        if (!bulkData || bulkData.length === 0) return toast.error("No students loaded");
        setBulkPrinting(true);
        toast.info("Generating PDFs... This may take a minute.", { id: 'bulk-zip-progress' });
        
        try {
            const JSZip = (await import('jszip')).default;
            const htmlToImage = await import('html-to-image');
            const { jsPDF } = await import('jspdf');
            
            const zip = new JSZip();
            const container = document.getElementById('bulk-report-cards-printable');
            if (!container) throw new Error("Could not find report cards container");
            
            const cards = container.querySelectorAll('.bulk-card-item');
            
            for (let i = 0; i < cards.length; i++) {
                const card = cards[i] as HTMLElement;
                const studentData = bulkData[i];
                const sName = studentData?.student?.name || 'Unknown_Student';
                const sAdm = studentData?.student?.admissionNo || '';
                const fileName = `${sName.replace(/\s+/g, '_')}_${sAdm.replace(/\//g, '-')}_Result.pdf`;
                
                toast.loading(`Processing ${i + 1}/${cards.length}: ${studentData.student.name}`, { id: 'bulk-zip-progress' });
                
                // Use html-to-image to bypass html2canvas oklch parsing errors
                const imgData = await htmlToImage.toJpeg(card, { quality: 0.95, pixelRatio: 2 });
                const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
                
                const pdfWidth = pdf.internal.pageSize.getWidth();
                const margin = 10; // 10mm margins
                const w = pdfWidth - margin * 2;
                const h = (card.offsetHeight * w) / card.offsetWidth;
                
                pdf.addImage(imgData, 'JPEG', margin, margin, w, h);
                const pdfBlob = pdf.output('blob');
                zip.file(fileName, pdfBlob);
            }
            
            toast.loading('Zipping files...', { id: 'bulk-zip-progress' });
            const zipBlob = await zip.generateAsync({ type: 'blob' });
            
            const url = window.URL.createObjectURL(zipBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Class_Results_${term}_${year.replace(/\//g, '-')}.zip`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            
            // Clean up memory
            setTimeout(() => window.URL.revokeObjectURL(url), 1000);
            
            toast.success("Downloaded ZIP successfully!", { id: 'bulk-zip-progress' });
        } catch (e: any) {
            console.error(e);
            toast.error(e.message || "Failed to generate bulk ZIP", { id: 'bulk-zip-progress' });
        } finally {
            setBulkPrinting(false);
        }
    };

    const handleBulkPreview = async () => {
        if (!students || students.length === 0) return toast.error("No students loaded");
        setLoadingBulkModal(true);
        setBulkPreviewModal(true);
        setBulkData(null);
        try {
            const studentIds = students.map(s => s.studentProfileId).join(',');
            const res = await fetch(`${API}/results/batch-report-cards?studentProfileIds=${studentIds}&term=${encodeURIComponent(term)}&academicYear=${encodeURIComponent(year)}&classId=${classId}&resultType=${resultPrintType}`, { credentials: 'include' });
            const respData = await res.json();
            if (!res.ok) throw new Error(respData.msg || respData.message || "Failed to load report cards");
            
            let dataArr = respData.data || [];
            
            if (classStructure && classStructure.length > 0) {
                let dynamicCols = classStructure.map((p: any) => ({
                    id: p.id || p.name, name: p.name, key: p.name, show: true, weight: p.weight || p.maxScore
                }));
                
                if (resultPrintType === 'CA_ONLY') {
                    dynamicCols = dynamicCols.filter(c => !c.name.toLowerCase().includes('exam'));
                } else if (resultPrintType !== 'FULL' && resultPrintType !== 'CUMULATIVE') {
                    dynamicCols = dynamicCols.filter(c => c.name === resultPrintType);
                }

                const visibleKeys = dynamicCols.map(c => c.key);

                dataArr = dataArr.map((data: any) => {
                    if (resultPrintType !== 'FULL' && resultPrintType !== 'CUMULATIVE') {
                        data.results = data.results.map((r: any) => {
                            let newTotal = 0;
                            for (const key of visibleKeys) {
                                if (r.scores && r.scores[key]) {
                                    newTotal += Number(r.scores[key]) || 0;
                                }
                            }
                            return { ...r, totalScore: newTotal };
                        });
                    }

                    const cfg = data.templateConfig || DEFAULT_CFG;
                    data.templateConfig = {
                        ...cfg,
                        reportTitle: resultPrintType === 'COMMENT_CA' ? 'Mid-Term CA Report' : (resultPrintType === 'COMMENT_EXAM' ? 'End of Term Academic Report' : cfg.reportTitle),
                        showClassAverage: resultPrintType === 'FULL' ? cfg.showClassAverage : false,
                        showOverallPosition: resultPrintType === 'FULL' ? cfg.showOverallPosition : false,
                        showSubjectPosition: resultPrintType === 'FULL' ? cfg.showSubjectPosition : false,
                        subjectColumns: [
                            ...dynamicCols,
                            { id: 'total', name: 'Total', key: 'total', show: resultPrintType === 'FULL' || resultPrintType === 'CA_ONLY', computed: true },
                            { id: 'grade', name: 'Grade', key: 'grade', show: resultPrintType === 'FULL', computed: true },
                            { id: 'remark', name: 'Remark', key: 'remark', show: resultPrintType === 'FULL', computed: true }
                        ]
                    };
                    return data;
                });
            }
            
            setBulkData(dataArr);
        } catch (e: any) {
            toast.error(e.message || "Failed to load bulk report cards");
            setBulkPreviewModal(false);
        } finally {
            setLoadingBulkModal(false);
        }
    };

    const handlePrint = () => {
        if (!modal) return;
        mobileSafePrint('report-card-printable');
    };

    const cfg = modal?.templateConfig || DEFAULT_CFG;
    const school = modal?.schoolSettings ? {
        schoolName: modal.schoolSettings.schoolName,
        logoUrl: modal.schoolSettings.logoUrl ?? undefined,
        address: modal.schoolSettings.address ?? undefined,
        phone: modal.schoolSettings.phone ?? undefined,
        tagline: modal.schoolSettings.tagline ?? undefined,
        resultShowBorder: modal.schoolSettings.resultShowBorder ?? true,
        resultShowSignature: modal.schoolSettings.resultShowSignature ?? true,
        resultShowNextTermFees: modal.schoolSettings.resultShowNextTermFees ?? false,
    } : { schoolName: 'School Name' };

    // Derived states for pagination
    const totalPages = Math.ceil(students.length / ITEMS_PER_PAGE);
    const paginatedStudents = students.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    const Wrapper: any = isTeacherDashboard ? TeacherWrapper : SettingsShell;
    const wrapperProps = isTeacherDashboard ? {} : {
        breadcrumbParent: "Dashboard",
        breadcrumbCurrent: "Results & Reports",
        tabLabel: "Admin Results",
        tabIcon: <FileText className="h-4 w-4" />
    };

    return (
        <>
        <Wrapper {...wrapperProps}>
            <div className={cn("flex flex-col gap-6 animate-in fade-in duration-300", !isTeacherDashboard && "font-dash", isTeacherDashboard && "w-full")}>
                {!isTeacherDashboard && (
                <SettingsHero
                    icon={<FileText className="h-7 w-7" />}
                    title="Results & Report Cards"
                    subtitle="View and print student report cards for any class and term."
                >
                    {!isTeacher && (
                        <div className="flex flex-col sm:flex-row justify-center gap-2 mt-4">
                            <Button onClick={handleCompute} disabled={computing || !classId} variant="outline" className="w-full sm:w-auto gap-2 border-[#0036a1]/30 text-[#0036a1] hover:bg-[#0036a1]/5">
                                {computing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Cpu className="w-4 h-4" />}
                                {computing ? 'Computing…' : 'Compute Results'}
                            </Button>
                            <Button onClick={handleToggleRelease} disabled={releasing || !classId} className={cn("w-full sm:w-auto gap-2 text-white", isReleased ? 'bg-amber-500 hover:bg-amber-600' : 'bg-green-600 hover:bg-green-700')}>
                                {releasing ? <Loader2 className="w-4 h-4 animate-spin" /> : isReleased ? <GlobeLock className="w-4 h-4" /> : <Globe className="w-4 h-4" />}
                                {releasing ? 'Updating…' : isReleased ? 'Retract Results' : 'Release Results'}
                            </Button>
                        </div>
                    )}
                </SettingsHero>
                )}

                {/* Score vs Comment Mode Toggle */}
                <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm mb-4">
                    <div className="flex bg-gray-100 p-1 rounded-xl w-fit">
                        <button onClick={() => { setResultMode('SCORE_BASED'); setResultPrintType('FULL'); setActiveTab('CARDS'); }} className={`px-6 py-2 rounded-lg text-sm font-bold transition-colors ${resultMode === 'SCORE_BASED' ? 'bg-white shadow-sm text-[#0036a1]' : 'text-gray-500 hover:text-gray-900'}`}>Score-Based Result</button>
                        <button onClick={() => { setResultMode('COMMENT_BASED'); setResultPrintType('COMMENT_CA'); setActiveTab('CARDS'); }} className={`px-6 py-2 rounded-lg text-sm font-bold transition-colors ${resultMode === 'COMMENT_BASED' ? 'bg-white shadow-sm text-[#0036a1]' : 'text-gray-500 hover:text-gray-900'}`}>Comment-Based Result</button>
                    </div>
                </div>

                {/* Main Content Card */}{/* Filters */}
                <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm flex flex-wrap gap-4 items-end">
                    <div className="flex-1 min-w-[140px]">
                        <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Category</label>
                        <Select value={categoryId} onValueChange={setCategoryId}>
                            <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Categories</SelectItem>
                                {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex-1 min-w-[160px]">
                        <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Class</label>
                        <Select value={classId} onValueChange={setClassId}>
                            <SelectTrigger className="h-10"><SelectValue placeholder="Select class" /></SelectTrigger>
                            <SelectContent>{classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                        </Select>
                    </div>
                    <div className="flex-1 min-w-[140px]">
                        <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Term</label>
                        <Select value={term} onValueChange={setTerm}>
                            <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {terms.filter((t: any) => t.sessionId === sessions.find((s: any) => s.name === year)?.id).map((t: any) => <SelectItem key={t.id} value={t.name}>{t.name}</SelectItem>)}
                                {terms.length === 0 && (
                                    <>
                                        <SelectItem value="First Term">First Term</SelectItem>
                                        <SelectItem value="Second Term">Second Term</SelectItem>
                                        <SelectItem value="Third Term">Third Term</SelectItem>
                                    </>
                                )}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex-1 min-w-[140px]">
                        <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Academic Year</label>
                        <Select value={year} onValueChange={setYear}>
                            <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {sessions.map(s => <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>)}
                                {sessions.length === 0 && (
                                    <>
                                        <SelectItem value="2024/2025">2024/2025</SelectItem>
                                        <SelectItem value="2025/2026">2025/2026</SelectItem>
                                        <SelectItem value="2026/2027">2026/2027</SelectItem>
                                    </>
                                )}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex-1 min-w-[160px]">
                        <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Result Type</label>
                        <Select value={resultPrintType} onValueChange={setResultPrintType}>
                            <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {resultMode === 'SCORE_BASED' ? (
                                    <>
                                        <SelectItem value="FULL">Full Exam Result</SelectItem>
                                        <SelectItem value="CA_ONLY">Combined CA Result</SelectItem>
                                        {classStructure.filter(p => !p.name.toLowerCase().includes('exam')).map(p => (
                                            <SelectItem key={p.name} value={p.name}>{p.name} Result</SelectItem>
                                        ))}
                                    </>
                                ) : (
                                    <>
                                        <SelectItem value="COMMENT_CA">Comment-Based CA Result</SelectItem>
                                        <SelectItem value="COMMENT_EXAM">Comment-Based Exam Result</SelectItem>
                                    </>
                                )}
                            </SelectContent>
                        </Select>
                    </div>
                    <Button onClick={loadReport} disabled={!classId || loading} className="bg-[#0036a1] hover:bg-[#001761] text-white h-10 px-6 gap-2">
                        <FileText className="w-4 h-4" />{loading ? 'Loading…' : 'Load Results'}
                    </Button>
                </div>

                {/* Tabs */}
                {resultMode === 'SCORE_BASED' && (
                <div className="flex border-b border-gray-200 gap-6 mt-4 overflow-x-auto scrollbar-hide">
                    <button
                        className={`pb-3 text-sm font-bold flex items-center gap-2 transition-colors border-b-2 shrink-0 ${activeTab === 'CARDS' ? 'border-[#0036a1] text-[#0036a1]' : 'border-transparent text-gray-500 hover:text-gray-900'}`}
                        onClick={() => setActiveTab('CARDS')}
                    >
                        <ListIcon className="w-4 h-4" /> Report Cards
                    </button>
                    <button
                        className={`pb-3 text-sm font-bold flex items-center gap-2 transition-colors border-b-2 shrink-0 ${activeTab === 'BROADSHEET' ? 'border-[#0036a1] text-[#0036a1]' : 'border-transparent text-gray-500 hover:text-gray-900'}`}
                        onClick={() => setActiveTab('BROADSHEET')}
                    >
                        <Grid className="w-4 h-4" /> Broadsheet Printout
                    </button>
                    <button
                        className={`pb-3 text-sm font-bold flex items-center gap-2 transition-colors border-b-2 shrink-0 ${activeTab === 'CUMULATIVE' ? 'border-[#0036a1] text-[#0036a1]' : 'border-transparent text-gray-500 hover:text-gray-900'}`}
                        onClick={() => setActiveTab('CUMULATIVE')}
                    >
                        <Grid className="w-4 h-4" /> Cumulative Sheet
                    </button>
                    <button
                        className={`pb-3 text-sm font-bold flex items-center gap-2 transition-colors border-b-2 shrink-0 ${activeTab === 'TRANSCRIPT' ? 'border-[#0036a1] text-[#0036a1]' : 'border-transparent text-gray-500 hover:text-gray-900'}`}
                        onClick={() => setActiveTab('TRANSCRIPT')}
                    >
                        <FileText className="w-4 h-4" /> Transcripts
                    </button>
                </div>
                )}

                {activeTab === 'BROADSHEET' && resultMode === 'SCORE_BASED' && (
                    <BroadsheetView classId={classId} term={term} year={year} categoryId={categoryId} API={API} classStructure={classStructure} resultPrintType={resultPrintType} />
                )}

                {activeTab === 'CUMULATIVE' && resultMode === 'SCORE_BASED' && (
                    <CumulativeBroadsheetView classId={classId} year={year} API={API} />
                )}

                {activeTab === 'TRANSCRIPT' && resultMode === 'SCORE_BASED' && (
                    <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                        {transcriptStudentId ? (
                            <TranscriptSheet studentId={transcriptStudentId} API={API} onClose={() => setTranscriptStudentId(null)} />
                        ) : (
                            <>
                                <div className="hidden md:block overflow-x-auto mt-4">
                                    <h3 className="font-bold text-lg text-gray-900 mb-4">Select a student to view transcript</h3>
                                <table className="w-full text-sm min-w-[800px]">
                                    <thead className="bg-gray-50 border-b border-gray-200">
                                        <tr>
                                            <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Admission No.</th>
                                            <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Student Name</th>
                                            <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Gender</th>
                                            <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {paginatedStudents.length > 0 ? paginatedStudents.map((s) => (
                                            <tr key={s.studentProfileId} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-4 py-3 font-mono text-xs text-gray-600">{s.admissionNo}</td>
                                                <td className="px-4 py-3 font-semibold text-gray-900">{s.name}</td>
                                                <td className="px-4 py-3 text-gray-600">{s.gender}</td>
                                                <td className="px-4 py-3">
                                                    <Button size="sm" onClick={() => setTranscriptStudentId(s.studentProfileId)} className="gap-1 text-xs h-7 bg-[#0036a1] text-white">
                                                        <FileText className="w-3 h-3" /> View Transcript
                                                    </Button>
                                                </td>
                                            </tr>
                                        )) : (
                                            <tr>
                                                <td colSpan={4} className="py-10 text-center text-gray-500">
                                                    Load results first to see students.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Mobile Kanban View for Transcripts */}
                            <div className="md:hidden mt-4">
                                <h3 className="font-bold text-lg text-gray-900 mb-4">Select a student</h3>
                                <div className="grid grid-cols-1 gap-4">
                                    {paginatedStudents.length > 0 ? paginatedStudents.map((s) => (
                                        <div key={s.studentProfileId} className="bg-gray-50 border border-gray-200 rounded-xl p-4 shadow-sm flex flex-col gap-3">
                                            <div>
                                                <h4 className="font-bold text-gray-900 text-base">{s.name}</h4>
                                                <p className="text-xs text-gray-500 font-mono mt-1 flex items-center gap-2">
                                                    <span>{s.admissionNo}</span>
                                                    <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                                                    <span>{s.gender}</span>
                                                </p>
                                            </div>
                                            <Button size="sm" onClick={() => setTranscriptStudentId(s.studentProfileId)} className="w-full justify-center gap-2 h-9 bg-[#0036a1] text-white">
                                                <FileText className="w-4 h-4" /> View Transcript
                                            </Button>
                                        </div>
                                    )) : (
                                        <div className="py-10 text-center text-gray-500 bg-gray-50 rounded-xl border border-gray-200">
                                            Load results first to see students.
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            {/* Pagination */}
                            <div className="mt-4 flex justify-center">
                                <Pagination
                                    currentPage={currentPage}
                                    totalPages={totalPages}
                                    totalRecords={students.length}
                                    onPageChange={setCurrentPage}
                                />
                            </div>
                            </>
                        )}
                    </div>
                )}

                {activeTab === 'CARDS' && (
                    <>
                        {/* Stats & Actions */}
                {students.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                        <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center"><Users className="w-5 h-5 text-[#0036a1]" /></div>
                            <div><p className="text-xs text-gray-500 font-bold uppercase">Students</p><p className="text-xl font-bold text-gray-900">{students.length}</p></div>
                        </div>
                        <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm flex items-center gap-3">
                            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center"><TrendingUp className="w-5 h-5 text-green-600" /></div>
                            <div><p className="text-xs text-gray-500 font-bold uppercase">Passing</p><p className="text-xl font-bold text-gray-900">{students.filter(s => s.isPassing).length}</p></div>
                        </div>
                        <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm flex items-center gap-3">
                            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center"><TrendingUp className="w-5 h-5 text-purple-600" /></div>
                            <div><p className="text-xs text-gray-500 font-bold uppercase">Class Average</p>
                                <p className="text-xl font-bold text-gray-900">
                                    {(students.reduce((s, st) => s + parseFloat(st.average), 0) / students.length).toFixed(1)}%
                                </p>
                            </div>
                        </div>
                        <div className="bg-[#0036a1]/5 border border-[#0036a1]/20 rounded-2xl p-4 shadow-sm flex flex-col justify-center items-center gap-2">
                            <Button onClick={handleBulkPreview} disabled={loadingBulkModal} className="w-full bg-[#0036a1] hover:bg-[#001761] text-white gap-2 shadow-md">
                                {loadingBulkModal ? <Loader2 className="w-4 h-4 animate-spin" /> : <Printer className="w-4 h-4" />}
                                {loadingBulkModal ? 'Loading Preview...' : 'Bulk Print Results'}
                            </Button>
                        </div>
                    </div>
                )}

                {/* Table */}
                {students.length > 0 && (
                    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full text-sm min-w-[800px]">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        {['#', 'Admission No.', 'Student Name', 'Gender', 'Subjects', 'Total', 'Average', 'Grade', 'Status', 'Action'].map(h => (
                                            <th key={h} className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {paginatedStudents.map((s, idx) => (
                                        <tr key={s.studentProfileId} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-4 py-3 text-gray-500 font-bold">{(currentPage - 1) * ITEMS_PER_PAGE + idx + 1}</td>
                                            <td className="px-4 py-3 font-mono text-xs text-gray-600">{s.admissionNo}</td>
                                            <td className="px-4 py-3 font-semibold text-gray-900">{s.name}</td>
                                            <td className="px-4 py-3 text-gray-600">{s.gender}</td>
                                            <td className="px-4 py-3 text-center text-gray-700">{s.subjectCount}</td>
                                            <td className="px-4 py-3 text-center font-bold text-gray-900">{s.totalScore}</td>
                                            <td className="px-4 py-3 text-center font-bold text-gray-900">{s.average}%</td>
                                            <td className="px-4 py-3 text-center font-bold">{s.overallGrade}</td>
                                            <td className="px-4 py-3">
                                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${s.isPassing ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                    {s.isPassing ? 'Pass' : 'Fail'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <Button size="sm" variant="outline" onClick={() => openCard(s)} className="gap-1 text-xs h-7">
                                                    <Eye className="w-3 h-3" />View Card
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile Kanban View */}
                        <div className="md:hidden grid grid-cols-1 gap-4 p-4 bg-gray-50/50">
                            {paginatedStudents.map((s, idx) => (
                                <div key={s.studentProfileId} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm relative">
                                    <div className="absolute top-4 right-4 font-bold text-xs text-gray-400">#{(currentPage - 1) * ITEMS_PER_PAGE + idx + 1}</div>
                                    <div className="mb-3 pr-8">
                                        <h4 className="font-bold text-gray-900 text-base">{s.name}</h4>
                                        <p className="text-xs text-gray-500 font-mono mt-1 flex items-center gap-2">
                                            <span>{s.admissionNo}</span>
                                            <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                                            <span>{s.gender}</span>
                                        </p>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2 mb-4 bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                                        <div className="text-center">
                                            <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-0.5">Total</p>
                                            <p className="font-bold text-gray-900 text-sm">{s.totalScore}</p>
                                        </div>
                                        <div className="text-center border-x border-gray-200">
                                            <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-0.5">Average</p>
                                            <p className="font-bold text-[#0036a1] text-sm">{s.average}%</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-0.5">Grade</p>
                                            <p className="font-bold text-gray-900 text-sm">{s.overallGrade}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between pt-1 border-t border-gray-100">
                                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${s.isPassing ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                            {s.isPassing ? 'Pass' : 'Fail'}
                                        </span>
                                        <Button size="sm" variant="outline" onClick={() => openCard(s)} className="gap-1.5 text-xs h-8 border-gray-300 hover:bg-gray-50">
                                            <Eye className="w-3.5 h-3.5" />View Card
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        
                        {/* Pagination */}
                        <div className="bg-white p-4 border-t border-gray-200">
                            <Pagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                totalRecords={students.length}
                                onPageChange={setCurrentPage}
                            />
                        </div>
                    </div>
                )}
                {/* Modal */}
                {(loadingModal || modal) && createPortal(
                    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-3 sm:p-6 print:static print:bg-transparent print:p-0" onClick={() => setModal(null)}>
                        <div className="bg-white rounded-2xl shadow-2xl w-full h-full max-w-5xl max-h-full flex flex-col print:shadow-none print:m-0 print:max-w-none print:h-auto print:rounded-none" onClick={e => e.stopPropagation()}>
                            <div className="flex flex-col gap-4 items-start justify-between p-4 border-b border-gray-200 print:hidden">
                                <div className="flex gap-4 justify-between items-center w-full">
                                    <h3 className="font-bold text-gray-900">Report Card — {modal?.student.name}</h3>
                                    <Button size="icon" variant="ghost" onClick={() => setModal(null)} className="w-8 h-8"><X className="w-4 h-4" /></Button>
                                </div>
                                <div className="flex flex-wrap gap-2 items-center w-full justify-between sm:justify-start">
                                    <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1 mr-2">
                                        <Button size="icon" variant="ghost" onClick={() => setPreviewZoom(z => Math.max(0.3, z - 0.1))} className="w-6 h-6"><Minus className="w-3 h-3" /></Button>
                                        <span className="text-[10px] font-bold w-10 text-center text-gray-600">{Math.round(previewZoom * 100)}%</span>
                                        <Button size="icon" variant="ghost" onClick={() => setPreviewZoom(z => Math.min(1.5, z + 0.1))} className="w-6 h-6"><Plus className="w-3 h-3" /></Button>
                                    </div>
                                    <div className="flex gap-2">
                                        {modal && <Button size="sm" variant="outline" onClick={() => setShareModal({ studentProfileId: modal.student.id, name: modal.student.name })} className="gap-1 text-xs"><Share2 className="w-3.5 h-3.5" />Share</Button>}
                                        <Button size="sm" variant="outline" onClick={handleDownloadSinglePDF} className="gap-1 text-xs bg-white text-[#0036a1] border-[#0036a1]/30"><Download className="w-3.5 h-3.5" />Download PDF</Button>
                                        <Button size="sm" variant="outline" onClick={handlePrint} className="gap-1 text-xs bg-white"><Printer className="w-3.5 h-3.5" />Print</Button>
                                    </div>
                                </div>
                            </div>
                            <div className="flex-1 overflow-auto p-3 sm:p-4 print:overflow-visible print:p-0 flex justify-center bg-gray-50/50 sm:bg-white rounded-b-2xl">
                                {loadingModal ? (
                                    <div className="h-48 flex items-center justify-center text-gray-400">Loading report card...</div>
                                ) : modal && (
                                        (cfg.blocks && cfg.blocks.length > 0) ? (
                                            <div id="report-card-printable" className="print:shadow-none shadow-lg sm:mb-8 mx-auto w-full max-w-[794px] overflow-x-auto print:w-full print:max-w-none print:m-0 print:overflow-visible origin-top transition-transform" style={{ zoom: previewZoom } as React.CSSProperties}>
                                                <div className="min-w-[794px] print:min-w-0 bg-white">
                                                    <ErrorBoundary errorMessage={`Failed to render report card for ${modal.student?.name || 'this student'}.`}>
                                                        <ReportCard config={{ ...cfg, blocks: cfg.blocks ?? [], design: cfg.design ?? {}, gradeScale: cfg.gradeScale ?? [], studentFields: cfg.studentFields ?? {}, globalSettings: { schoolSettings: modal.schoolSettings } }} data={modal} />
                                                    </ErrorBoundary>
                                                </div>
                                            </div>
                                        ) : (
                                            <div id="report-card-printable" className="mx-auto w-full max-w-[794px] overflow-x-auto print:w-full print:max-w-none print:m-0 print:overflow-visible origin-top transition-transform sm:mb-8" style={{ zoom: previewZoom } as React.CSSProperties}>
                                                <div className="min-w-[794px] print:min-w-0 bg-white shadow-lg print:shadow-none sm:rounded-none">
                                                    <ErrorBoundary errorMessage={`Failed to render report card for ${modal.student?.name || 'this student'}.`}>
                                                        <ReportCardPreview
                                                            templateConfig={cfg}
                                                            student={modal.student}
                                                            results={modal.results}
                                                            gradingScale={modal.gradingScale}
                                                            comments={modal.comments}
                                                            attendance={modal.attendance}
                                                            school={modal.schoolSettings ? { schoolName: modal.schoolSettings.schoolName, logoUrl: modal.schoolSettings.logoUrl, address: modal.schoolSettings.address, phone: modal.schoolSettings.phone, tagline: modal.schoolSettings.tagline, resultShowBorder: modal.schoolSettings.resultShowBorder, resultShowSignature: modal.schoolSettings.resultShowSignature, resultShowNextTermFees: modal.schoolSettings.resultShowNextTermFees } : { schoolName: 'School Name' }}
                                                            summary={modal.summary}
                                                            annualResults={modal.annualResults}
                                                            isCommentBased={resultMode === 'COMMENT_BASED'}
                                                            visibleTypes={[resultPrintType]}
                                                            forceScoreBased={resultMode === 'SCORE_BASED'}
                                                        />
                                                    </ErrorBoundary>
                                                </div>
                                            </div>
                                        )
                                )}
                            </div>
                        </div>
                    </div>,
                    document.body
                )}
                    </>
                )}
            </div>
        </Wrapper>

            {/* Share Result Modal */}
        {shareModal && createPortal(
            <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4" onClick={() => setShareModal(null)}>
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center justify-between mb-5">
                        <div>
                            <h3 className="font-bold text-gray-900 text-lg">Share Result</h3>
                            <p className="text-sm text-gray-500 mt-0.5">{shareModal.name}</p>
                        </div>
                        <button onClick={() => setShareModal(null)} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200"><X className="w-4 h-4" /></button>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase block mb-1.5">Channel</label>
                            <div className="grid grid-cols-2 gap-2">
                                {['EMAIL', 'WHATSAPP'].map(ch => (
                                    <button key={ch} onClick={() => setShareForm(p => ({ ...p, channel: ch }))}
                                        className={`py-2.5 rounded-xl border-2 text-sm font-bold transition-all ${shareForm.channel === ch ? 'border-[#0036a1] bg-[#0036a1]/5 text-[#0036a1]' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                                        {ch === 'EMAIL' ? '📧  Email' : '💬 WhatsApp'}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase block mb-1.5">
                                {shareForm.channel === 'EMAIL' ? 'Parent Email Address' : 'Parent WhatsApp Number'}
                            </label>
                            <input
                                type={shareForm.channel === 'EMAIL' ? 'email' : 'tel'}
                                value={shareForm.recipient}
                                onChange={e => setShareForm(p => ({ ...p, recipient: e.target.value }))}
                                placeholder={shareForm.channel === 'EMAIL' ? 'e.g. parent@example.com' : 'e.g. +2348000000000'}
                                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm focus:border-[#0036a1] focus:ring-2 focus:ring-[#0036a1]/20 transition-all outline-none"
                            />
                        </div>
                    </div>

                    <div className="flex gap-3 mt-6 pt-5 border-t border-gray-100">
                        <Button variant="outline" className="flex-1" onClick={() => setShareModal(null)}>Cancel</Button>
                        <Button onClick={handleShare} disabled={sharing || !shareForm.recipient} className="flex-1 bg-[#0036a1] hover:bg-[#001761] text-white gap-2">
                            {sharing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Share2 className="w-4 h-4" />}
                            {sharing ? 'Sending...' : 'Send Result'}
                        </Button>
                    </div>
                </div>
            </div>,
            document.body
        )}

        {/* Bulk Print Modal */}
        {(loadingBulkModal || bulkPreviewModal) && createPortal(
            <div className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center overflow-y-auto p-2 sm:p-4 print:static print:bg-transparent print:p-0" onClick={() => setBulkPreviewModal(false)}>
                <div className="bg-white sm:rounded-2xl shadow-2xl w-full max-w-5xl my-2 sm:my-8 print:shadow-none print:m-0 print:max-w-none" onClick={e => e.stopPropagation()}>
                    <div className="flex flex-col gap-4 items-start justify-between p-4 border-b border-gray-200 print:hidden">
                        <div className="flex gap-4 justify-between items-center w-full">
                            <h3 className="font-bold text-gray-900">Bulk Report Cards Preview {bulkData ? `(${bulkData.length} Students)` : ''}</h3>
                            <Button size="icon" variant="ghost" onClick={() => setBulkPreviewModal(false)} className="w-8 h-8"><X className="w-4 h-4" /></Button>
                        </div>
                        <div className="flex flex-wrap gap-2 items-center w-full justify-between sm:justify-start">
                            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1 mr-2">
                                <Button size="icon" variant="ghost" onClick={() => setPreviewZoom(z => Math.max(0.3, z - 0.1))} className="w-6 h-6"><Minus className="w-3 h-3" /></Button>
                                <span className="text-[10px] font-bold w-10 text-center text-gray-600">{Math.round(previewZoom * 100)}%</span>
                                <Button size="icon" variant="ghost" onClick={() => setPreviewZoom(z => Math.min(1.5, z + 0.1))} className="w-6 h-6"><Plus className="w-3 h-3" /></Button>
                            </div>
                            <div className="flex gap-2">
                                <Button size="sm" variant="outline" onClick={handleDownloadBulkZIP} disabled={bulkPrinting || !bulkData} className="gap-1 text-xs bg-white text-[#0036a1] border-[#0036a1]/30">
                                    {bulkPrinting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                                    {bulkPrinting ? 'Zipping...' : 'Download ZIP'}
                                </Button>
                                <Button size="sm" onClick={() => mobileSafePrint('bulk-report-cards-printable')} disabled={!bulkData} className="gap-1 text-xs bg-[#0036a1] hover:bg-[#001761] text-white">
                                    <Printer className="w-3.5 h-3.5" /> Print / Save as PDF
                                </Button>
                            </div>
                        </div>
                    </div>
                    <div id="bulk-report-cards-printable" className="p-0 sm:p-4 overflow-auto print:overflow-visible print:p-0 flex flex-col items-center bg-gray-50/50 sm:bg-white rounded-b-2xl">
                        {loadingBulkModal ? (
                            <div className="h-48 flex items-center justify-center text-gray-400">Loading report cards...</div>
                        ) : bulkData && bulkData.map((dataItem, idx) => {
                            const cCfg = dataItem.templateConfig || DEFAULT_CFG;
                            const sSchool = dataItem.schoolSettings ? {
                                schoolName: dataItem.schoolSettings.schoolName,
                                logoUrl: dataItem.schoolSettings.logoUrl ?? undefined,
                                address: dataItem.schoolSettings.address ?? undefined,
                                phone: dataItem.schoolSettings.phone ?? undefined,
                                tagline: dataItem.schoolSettings.tagline ?? undefined,
                                resultShowBorder: dataItem.schoolSettings.resultShowBorder ?? true,
                                resultShowSignature: dataItem.schoolSettings.resultShowSignature ?? true,
                                resultShowNextTermFees: dataItem.schoolSettings.resultShowNextTermFees ?? false,
                            } : { schoolName: 'School Name' };

                            return (
                                <div key={dataItem.student.id} className="bulk-card-item w-full print:break-after-page sm:mb-8" style={{ pageBreakAfter: 'always' }}>
                                    {(cCfg.blocks && cCfg.blocks.length > 0) ? (
                                        <div className="print:shadow-none shadow-lg mx-auto w-full max-w-[794px] overflow-x-auto print:w-full print:max-w-none print:m-0 print:overflow-visible origin-top transition-transform" style={{ zoom: previewZoom }}>
                                            <div className="min-w-[794px] print:min-w-0 bg-white">
                                                <ErrorBoundary errorMessage={`Failed to render report card for ${dataItem.student?.name || 'this student'}.`}>
                                                    <ReportCard config={{ ...cCfg, blocks: cCfg.blocks ?? [], design: cCfg.design ?? {}, gradeScale: cCfg.gradeScale ?? [], studentFields: cCfg.studentFields ?? {}, globalSettings: { schoolSettings: dataItem.schoolSettings } }} data={dataItem} />
                                                </ErrorBoundary>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="mx-auto w-full max-w-[794px] overflow-x-auto print:w-full print:max-w-none print:m-0 print:overflow-visible origin-top transition-transform" style={{ zoom: previewZoom }}>
                                            <div className="min-w-[794px] print:min-w-0 bg-white shadow-lg print:shadow-none sm:rounded-none">
                                                <ErrorBoundary errorMessage={`Failed to render report card for ${dataItem.student?.name || 'this student'}.`}>
                                                    <ReportCardPreview
                                                        templateConfig={cCfg}
                                                        student={dataItem.student}
                                                        results={dataItem.results}
                                                        gradingScale={dataItem.gradingScale}
                                                        comments={dataItem.comments}
                                                        attendance={dataItem.attendance}
                                                        school={sSchool}
                                                        summary={dataItem.summary}
                                                        annualResults={dataItem.annualResults}
                                                        isCommentBased={resultMode === 'COMMENT_BASED'}
                                                        visibleTypes={[resultPrintType]}
                                                        forceScoreBased={resultMode === 'SCORE_BASED'}
                                                    />
                                                </ErrorBoundary>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>,
            document.body
        )}
        </>
    );
}
