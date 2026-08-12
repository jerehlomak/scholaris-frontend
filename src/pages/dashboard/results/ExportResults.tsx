import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FileText, Download, AlertTriangle, CheckCircle, Search, RefreshCw, Archive, File } from 'lucide-react';
import { toast } from 'sonner';
import { SettingsShell } from '../settings/shared/SettingsShell';
import { SettingsHero } from '../settings/shared/SettingsHero';
import { useSchoolType } from '../../../context/SchoolTypeContext';
import { createPortal } from 'react-dom';
import ReportCardPreview from '../../../components/report/ReportCardPreview';
import type { TemplateConfig } from '../../../components/report/ReportCardPreview';
import ReportCard from '../../../components/report-blocks/ReportCard';
import { Printer, Eye, X, Plus, Minus } from 'lucide-react';

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

const API = import.meta.env.VITE_API_URL || '/api/v1';

export default function ExportResults() {
    const { activeSchoolType } = useSchoolType();
    
    const [academicYears, setAcademicYears] = useState<any[]>([]);
    const [terms, setTerms] = useState<any[]>([]);
    const [classes, setClasses] = useState<any[]>([]);
    const [students, setStudents] = useState<any[]>([]);
    const [templates, setTemplates] = useState<any[]>([]);

    const [selectedYear, setSelectedYear] = useState('');
    const [selectedTerm, setSelectedTerm] = useState('');
    const [selectedClassId, setSelectedClassId] = useState('');
    const [selectedTemplateId, setSelectedTemplateId] = useState('');
    const [format, setFormat] = useState<'merged' | 'zip'>('merged');

    const [loading, setLoading] = useState(false);
    const [validating, setValidating] = useState(false);
    const [warnings, setWarnings] = useState<string[]>([]);
    const [isValidated, setIsValidated] = useState(false);
    const [exporting, setExporting] = useState(false);

    // Preview state
    const [previewModal, setPreviewModal] = useState(false);
    const [previewData, setPreviewData] = useState<any[] | null>(null);
    const [loadingPreview, setLoadingPreview] = useState(false);
    const [previewZoom, setPreviewZoom] = useState(1);

    useEffect(() => {
        Promise.all([
            axios.get(`${API}/sessions`, { withCredentials: true }),
            axios.get(`${API}/classes/all${activeSchoolType ? `?schoolType=${activeSchoolType}` : ''}`, { withCredentials: true }),
            axios.get(`${API}/results/templates`, { withCredentials: true })
        ]).then(([sessionsRes, classesRes, templatesRes]) => {
            const sessions = sessionsRes.data.sessions || [];
            setAcademicYears(sessions);
            const activeSession = sessions.find((s: any) => s.isCurrent);
            if (activeSession) setSelectedYear(activeSession.name);

            setClasses(classesRes.data.classes || []);
            setTemplates(templatesRes.data.templates || []);
            const activeTemplate = (templatesRes.data.templates || []).find((t: any) => t.isActive);
            if (activeTemplate) setSelectedTemplateId(activeTemplate.id);
        }).catch(err => {
            console.error("Failed to load export options:", err);
            toast.error("Failed to load configuration options.");
        });
    }, [activeSchoolType]);

    useEffect(() => {
        if (!selectedYear) return;
        axios.get(`${API}/terms?sessionName=${selectedYear}`, { withCredentials: true })
            .then(res => {
                setTerms(res.data.terms || []);
                const currentTerm = res.data.terms.find((t: any) => t.isCurrent);
                if (currentTerm) setSelectedTerm(currentTerm.name);
            })
            .catch(console.error);
    }, [selectedYear]);

    useEffect(() => {
        if (!selectedClassId || !selectedTerm || !selectedYear) return;
        setLoading(true);
        axios.get(`${API}/students/all?classId=${selectedClassId}`, { withCredentials: true })
            .then(res => setStudents(res.data.students || []))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [selectedClassId, selectedTerm, selectedYear]);

    const handleValidate = async () => {
        if (!selectedClassId || !selectedTerm || !selectedYear) {
            toast.error("Please select a class, term, and session");
            return;
        }
        setValidating(true);
        setWarnings([]);
        try {
            const res = await axios.get(`${API}/results/print/validate`, {
                params: { classId: selectedClassId, term: selectedTerm, academicYear: selectedYear },
                withCredentials: true
            });
            setWarnings(res.data.warnings || []);
            setIsValidated(true);
            if (res.data.warnings?.length === 0) {
                toast.success("Validation passed! All results are complete.");
            } else {
                toast.warning(`Found ${res.data.warnings.length} warnings. You can still export.`);
            }
        } catch (err: any) {
            toast.error(err.response?.data?.msg || "Validation failed");
        } finally {
            setValidating(false);
        }
    };

    const handlePreview = async () => {
        if (!selectedClassId || !selectedTerm || !selectedYear || !selectedTemplateId) {
            toast.error("Please ensure all selections are made.");
            return;
        }
        if (students.length === 0) {
            toast.error("No students found in the selected class.");
            return;
        }

        setLoadingPreview(true);
        setPreviewModal(true);
        setPreviewData(null);

        try {
            const studentIds = students.map(s => s.id).join(',');
            const res = await axios.get(`${API}/results/batch-report-cards`, {
                params: {
                    studentProfileIds: studentIds,
                    term: selectedTerm,
                    academicYear: selectedYear,
                    classId: selectedClassId
                },
                withCredentials: true
            });

            const respData = res.data.data || [];
            const selectedTemplate = templates.find(t => t.id === selectedTemplateId);
            const templateConfigToUse = selectedTemplate ? selectedTemplate.config : DEFAULT_CFG;

            const processedData = respData.map((data: any) => {
                data.templateConfig = { ...templateConfigToUse };
                return data;
            });

            setPreviewData(processedData);
        } catch (err: any) {
            toast.error("Failed to load preview data");
            setPreviewModal(false);
        } finally {
            setLoadingPreview(false);
        }
    };

    const handleExport = async () => {
        if (!selectedClassId || !selectedTerm || !selectedYear || !selectedTemplateId) {
            toast.error("Please ensure all selections are made.");
            return;
        }
        
        if (students.length === 0) {
            toast.error("No students found in the selected class.");
            return;
        }

        setExporting(true);
        try {
            const studentIds = students.map(s => s.id);
            const res = await axios.post(`${API}/results/print/batch`, {
                studentIds,
                classId: selectedClassId,
                term: selectedTerm,
                academicYear: selectedYear,
                templateId: selectedTemplateId,
                format
            }, {
                responseType: 'blob',
                withCredentials: true
            });

            // Create download link
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', format === 'zip' ? `results_${selectedClassId}.zip` : `Class_Results.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            toast.success("Export successful!");
        } catch (err: any) {
            console.error(err);
            toast.error("Failed to export results. The batch may be too large.");
        } finally {
            setExporting(false);
        }
    };

    return (
        <SettingsShell breadcrumbParent="Results & Reports" breadcrumbCurrent="Export Results" tabLabel="Export Results" tabIcon={<FileText className="h-3.5 w-3.5" />}>
            <SettingsHero
                icon={<FileText className="h-7 w-7" />}
                title="Export Result Cards"
                subtitle="Batch generate and export student report cards in PDF format."
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-2">
                <div className="md:col-span-1 space-y-6">
                    <div className="bg-white p-4 sm:p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
                        <h2 className="font-bold text-gray-900 border-b pb-2 mb-4">Export Configuration</h2>
                        
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Academic Session</label>
                            <select value={selectedYear} onChange={e => setSelectedYear(e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg text-sm">
                                <option value="">Select Session...</option>
                                {academicYears.map(y => <option key={y.name} value={y.name}>{y.name}</option>)}
                            </select>
                        </div>
                        
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Term</label>
                            <select value={selectedTerm} onChange={e => setSelectedTerm(e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg text-sm" disabled={!selectedYear}>
                                <option value="">Select Term...</option>
                                {terms.map(t => <option key={t.name} value={t.name}>{t.name}</option>)}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Class</label>
                            <select value={selectedClassId} onChange={e => { setSelectedClassId(e.target.value); setIsValidated(false); }} className="w-full p-2 border border-gray-300 rounded-lg text-sm">
                                <option value="">Select Class...</option>
                                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Result Template</label>
                            <select value={selectedTemplateId} onChange={e => setSelectedTemplateId(e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg text-sm">
                                <option value="">Select Template...</option>
                                {templates.map(t => <option key={t.id} value={t.id}>{t.name} {t.isActive ? '(Active)' : ''}</option>)}
                            </select>
                        </div>

                        <div className="pt-2 border-t">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Export Format</label>
                            <div className="grid grid-cols-2 gap-2">
                                <button 
                                    onClick={() => setFormat('merged')}
                                    className={`flex flex-col items-center justify-center p-3 border rounded-lg text-xs font-medium transition-colors ${format === 'merged' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                                >
                                    <File className="w-5 h-5 mb-1" />
                                    Single PDF
                                </button>
                                <button 
                                    onClick={() => setFormat('zip')}
                                    className={`flex flex-col items-center justify-center p-3 border rounded-lg text-xs font-medium transition-colors ${format === 'zip' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                                >
                                    <Archive className="w-5 h-5 mb-1" />
                                    ZIP Archive
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="md:col-span-2 space-y-6">
                    <div className="bg-white p-4 sm:p-6 rounded-xl border border-gray-200 shadow-sm">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 mb-4 pb-2 border-b">
                            <h2 className="font-bold text-gray-900">Pre-Export Validation</h2>
                            <button 
                                onClick={handleValidate}
                                disabled={!selectedClassId || validating}
                                className="w-full sm:w-auto justify-center px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm font-semibold rounded-lg flex items-center gap-2 disabled:opacity-50"
                            >
                                {validating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                                Run Validation
                            </button>
                        </div>

                        {!isValidated && !validating ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center text-gray-500">
                                <Search className="w-12 h-12 text-gray-300 mb-3" />
                                <p className="font-medium text-sm">Run validation to check for missing scores before exporting.</p>
                            </div>
                        ) : validating ? (
                            <div className="flex justify-center py-12">
                                <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
                            </div>
                        ) : (
                            <div>
                                {warnings.length === 0 ? (
                                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
                                        <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                                        <div>
                                            <h3 className="font-bold text-green-800 text-sm">All Clear!</h3>
                                            <p className="text-sm text-green-700 mt-1">Found {students.length} students. No missing scores or critical issues detected.</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                        <div className="flex items-start gap-3 mb-3">
                                            <AlertTriangle className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
                                            <div>
                                                <h3 className="font-bold text-yellow-800 text-sm">Warnings Detected ({warnings.length})</h3>
                                                <p className="text-sm text-yellow-700 mt-1">Review the issues below. You can still export, but some data may be incomplete.</p>
                                            </div>
                                        </div>
                                        <ul className="list-disc pl-10 text-xs text-yellow-800 space-y-1">
                                            {warnings.slice(0, 10).map((w, i) => <li key={i}>{w}</li>)}
                                            {warnings.length > 10 && <li>...and {warnings.length - 10} more.</li>}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="bg-gray-50 p-4 sm:p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col items-center text-center">
                        <Download className="w-12 h-12 text-gray-300 mb-4" />
                        <h3 className="font-bold text-gray-900 mb-2">Ready to Export</h3>
                        <p className="text-sm text-gray-500 mb-6 max-w-md">
                            Exporting will generate {format === 'merged' ? 'a single merged PDF' : 'a ZIP file of individual PDFs'} using the selected template. This may take a few moments for large classes.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 w-full">
                            <button 
                                onClick={handlePreview}
                                disabled={!selectedClassId || !selectedTemplateId || loadingPreview}
                                className="w-full sm:w-auto px-8 py-3 bg-white border-2 border-[#0036a1] hover:bg-blue-50 text-[#0036a1] font-bold rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                            >
                                {loadingPreview ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Eye className="w-5 h-5" />}
                                {loadingPreview ? 'Loading...' : 'Preview Results'}
                            </button>
                            <button 
                                onClick={handleExport}
                                disabled={!selectedClassId || !selectedTemplateId || exporting}
                                className="w-full sm:w-auto px-8 py-3 bg-[#0036a1] hover:bg-blue-800 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-blue-500/30 disabled:opacity-50 disabled:shadow-none transition-all"
                            >
                                {exporting ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
                                {exporting ? 'Generating...' : `Export ${students.length} Results`}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Preview Modal */}
            {(loadingPreview || previewModal) && createPortal(
                <div className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center overflow-y-auto p-2 sm:p-4 print:static print:bg-transparent print:p-0" onClick={() => setPreviewModal(false)}>
                    <div className="bg-white sm:rounded-2xl shadow-2xl w-full max-w-5xl my-2 sm:my-8 print:shadow-none print:m-0 print:max-w-none" onClick={e => e.stopPropagation()}>
                        <div className="flex flex-col gap-4 items-start justify-between p-4 border-b border-gray-200 print:hidden">
                            <div className="flex gap-4 justify-between items-center w-full">
                                <h3 className="font-bold text-gray-900">Export Preview {previewData ? `(${previewData.length} Students)` : ''}</h3>
                                <button onClick={() => setPreviewModal(false)} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200"><X className="w-4 h-4" /></button>
                            </div>
                            <div className="flex flex-wrap gap-2 items-center w-full justify-between sm:justify-start">
                                <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1 mr-2">
                                    <button onClick={() => setPreviewZoom(z => Math.max(0.3, z - 0.1))} className="w-6 h-6 rounded flex items-center justify-center hover:bg-gray-200"><Minus className="w-3 h-3" /></button>
                                    <span className="text-[10px] font-bold w-10 text-center text-gray-600">{Math.round(previewZoom * 100)}%</span>
                                    <button onClick={() => setPreviewZoom(z => Math.min(1.5, z + 0.1))} className="w-6 h-6 rounded flex items-center justify-center hover:bg-gray-200"><Plus className="w-3 h-3" /></button>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={handleExport} disabled={exporting || !previewData} className="px-3 py-1.5 border rounded-lg text-xs font-bold bg-white hover:bg-gray-50 flex items-center gap-1">
                                        {exporting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                                        {exporting ? 'Exporting...' : 'Export PDF'}
                                    </button>
                                    <button onClick={() => { setTimeout(() => window.print(), 100) }} disabled={!previewData} className="px-3 py-1.5 border rounded-lg text-xs font-bold bg-white hover:bg-gray-50 flex items-center gap-1">
                                        <Printer className="w-3.5 h-3.5" />Print Preview
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div className="p-0 pb-24 sm:p-4 overflow-auto print:overflow-visible print:p-0 flex flex-col items-center bg-gray-50/50 sm:bg-white rounded-b-2xl">
                            {loadingPreview ? (
                                <div className="h-48 flex items-center justify-center text-gray-400">Loading preview data...</div>
                            ) : previewData && previewData.map((dataItem, idx) => {
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
                                    <div key={dataItem.student.id} className="w-full print:break-after-page sm:mb-8" style={{ pageBreakAfter: 'always' }}>
                                        {(cCfg.blocks && cCfg.blocks.length > 0) ? (
                                            <div className="print:shadow-none shadow-lg mx-auto w-full max-w-[794px] overflow-x-auto print:w-full print:max-w-none print:m-0 print:overflow-visible origin-top transition-transform" style={{ zoom: previewZoom }}>
                                                <div className="min-w-[794px] print:min-w-0 bg-white">
                                                    <ReportCard config={{ ...cCfg, blocks: cCfg.blocks ?? [], design: cCfg.design ?? {}, gradeScale: cCfg.gradeScale ?? [], studentFields: cCfg.studentFields ?? {}, globalSettings: { schoolSettings: dataItem.schoolSettings } }} data={dataItem} />
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="mx-auto w-full max-w-[794px] overflow-x-auto print:w-full print:max-w-none print:m-0 print:overflow-visible origin-top transition-transform" style={{ zoom: previewZoom }}>
                                                <div className="min-w-[794px] print:min-w-0 bg-white shadow-lg print:shadow-none sm:rounded-none">
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
                                                        isCommentBased={cCfg.resultType === 'COMMENT_BASED'}
                                                        visibleTypes={['FULL']}
                                                        forceScoreBased={cCfg.resultType === 'SCORE_BASED'}
                                                    />
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
        </SettingsShell>
    );
}
