import { useState, useEffect, useRef } from 'react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../../components/ui/tabs';
import {
    LayoutTemplate, Plus, Trash2, Save, Eye, ChevronLeft,
    CheckCircle2, Pencil, Copy, Star, Printer, AlertCircle,
    Settings, Palette, TableProperties, Award, Users
} from 'lucide-react';
import { toast } from 'sonner';
import ReportCardPreview from '../../../components/report/ReportCardPreview';
import type { TemplateConfig, SubjectColumn, EvaluationSection } from '../../../components/report/ReportCardPreview';

const API = import.meta.env.VITE_API_URL || '/api/v1';

// ─── MOCK DATA for preview ────────────────────────────────────────────────────
const MOCK_STUDENT = {
    id: 'preview', name: 'Amina Ibrahim', admissionNo: 'ADM/2025/001',
    className: 'JSS 2A', gender: 'Female', dateOfBirth: '2013-04-15',
    term: 'First Term', academicYear: '2025/2026', teacherName: 'Mr. Adeleke'
};
const MOCK_RESULTS = [
    { subject: { name: 'Mathematics' }, scores: { ca1: 18, ca2: 17, exam: 54 }, totalScore: 89, computedGrade: 'A', computedRemark: 'Excellent', isPassing: true },
    { subject: { name: 'English Language' }, scores: { ca1: 16, ca2: 15, exam: 48 }, totalScore: 79, computedGrade: 'B', computedRemark: 'Very Good', isPassing: true },
    { subject: { name: 'Basic Science' }, scores: { ca1: 14, ca2: 13, exam: 42 }, totalScore: 69, computedGrade: 'C', computedRemark: 'Good', isPassing: true },
    { subject: { name: 'Social Studies' }, scores: { ca1: 17, ca2: 16, exam: 50 }, totalScore: 83, computedGrade: 'A', computedRemark: 'Excellent', isPassing: true },
];
const MOCK_SUMMARY = { totalSubjects: 4, totalScore: 320, average: '80.0', overallPosition: 3, classAverage: '72.5', passMark: 40 };
const MOCK_ATTENDANCE = { total: 65, present: 60, absent: 4, late: 1 };
const MOCK_COMMENTS = { teacherComment: 'An excellent student.', headComment: 'Keep it up!', principalComment: 'Well done.', nextTermBegins: 'Jan 12, 2026' };
const MOCK_GRADING = {
    grades: [
        { id: 'g1', grade: 'A', minScore: 75, maxScore: 100, remark: 'Excellent', status: 'PASS' as const },
        { id: 'g2', grade: 'B', minScore: 65, maxScore: 74, remark: 'Very Good', status: 'PASS' as const },
        { id: 'g3', grade: 'C', minScore: 55, maxScore: 64, remark: 'Good', status: 'PASS' as const },
        { id: 'g4', grade: 'D', minScore: 45, maxScore: 54, remark: 'Pass', status: 'PASS' as const },
        { id: 'g5', grade: 'F', minScore: 0, maxScore: 44, remark: 'Fail', status: 'FAIL' as const },
    ], passMark: 40
};

const DEFAULT_CONFIG: TemplateConfig = {
    showSchoolLogo: true, showSchoolAddress: true, showStudentPhoto: true,
    showAdmissionNo: true, showClass: true, showSession: true, showTerm: true,
    showAge: true, showGender: true, showTeacherName: true,
    showClassAverage: true, showSubjectPosition: false, showOverallPosition: true,
    showGradingKey: true, showAttendance: true, showEvaluation: true,
    showTeacherComment: true, showHeadComment: true, showPrincipalComment: true,
    showNextTerm: true, showPromotedTo: false, showHighestInClass: false, showLowestInClass: false, showTraitLegend: false,
    baseFontSize: 'medium',
    reportTitle: 'End of Term Academic Report',
    principalTitle: 'Principal', headTeacherTitle: 'Head Teacher', formTeacherTitle: 'Form Teacher',
    principalName: '',
    primaryColor: '#0036a1', headerBg: '#0036a1', fontFamily: 'serif',
    tableBorderColor: '#d1d5db', pageMargin: '10mm', logoPosition: 'left', headerStyle: 'standard',
    subjectColumns: [
        { id: 'ca1', name: '1st CA', key: 'ca1', width: 60, show: true },
        { id: 'ca2', name: '2nd CA', key: 'ca2', width: 60, show: true },
        { id: 'exam', name: 'Exam', key: 'exam', width: 60, show: true },
        { id: 'total', name: 'Total', key: 'total', width: 60, show: true, computed: true },
        { id: 'grade', name: 'Grade', key: 'grade', width: 55, show: true, computed: true },
        { id: 'remark', name: 'Remark', key: 'remark', width: 80, show: true, computed: true },
    ],
    evaluationSections: [
        {
            id: 'behavior', title: 'Behavioural Assessment', show: true,
            rows: [
                { id: 'b1', label: 'Attentiveness' }, { id: 'b2', label: 'Cooperation' },
                { id: 'b3', label: 'Punctuality' }, { id: 'b4', label: 'Neatness' }, { id: 'b5', label: 'Leadership' },
            ],
            scale: ['Excellent', 'Very Good', 'Good', 'Fair', 'Poor']
        }
    ],
};

interface Template { id: string; name: string; category?: string; config: TemplateConfig; isDefault: boolean; classAssignments: { classId: string }[] }
interface GradeRow { id: string; grade: string; minScore: string; maxScore: string; remark: string; status: 'PASS' | 'FAIL' }

// ─── TOGGLE CARD ──────────────────────────────────────────────────────────────
const ToggleCard = ({ title, desc, active, onClick }: { title: string; desc: string; active: boolean; onClick: () => void }) => (
    <div onClick={onClick} className={`p-3 rounded-xl border-2 cursor-pointer transition-all flex items-start gap-2 ${active ? 'border-[#0036a1] bg-blue-50' : 'border-gray-100 hover:border-gray-200 bg-white'}`}>
        <div className={`w-4 h-4 mt-0.5 rounded-full shrink-0 flex items-center justify-center ${active ? 'bg-[#0036a1] text-white' : 'border-2 border-gray-300'}`}>
            {active && <CheckCircle2 className="w-3 h-3" />}
        </div>
        <div><p className={`text-sm font-bold ${active ? 'text-[#0036a1]' : 'text-gray-700'}`}>{title}</p><p className="text-xs text-gray-400 mt-0.5 leading-tight">{desc}</p></div>
    </div>
);

export function ReportCardBuilder() {
    const [view, setView] = useState<'list' | 'editor'>('list');
    const [templates, setTemplates] = useState<Template[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTemplate, setActiveTemplate] = useState<Template | null>(null);
    const [config, setConfig] = useState<TemplateConfig>(DEFAULT_CONFIG);
    const [templateName, setTemplateName] = useState('');
    const [templateCategory, setTemplateCategory] = useState('');
    const [saving, setSaving] = useState(false);
    const [classes, setClasses] = useState<{ id: string; name: string }[]>([]);
    const [assignedClasses, setAssignedClasses] = useState<string[]>([]);
    const [gradingRows, setGradingRows] = useState<GradeRow[]>(MOCK_GRADING.grades.map(g => ({ ...g, minScore: String(g.minScore), maxScore: String(g.maxScore) })));
    const [passMark, setPassMark] = useState('40');
    const [gradingSaved, setGradingSaved] = useState(false);
    const printRef = useRef<HTMLDivElement>(null);

    const headers = { 'Content-Type': 'application/json' };

    // Load templates & classes
    useEffect(() => {
        Promise.all([
            fetch(`${API}/report-templates`, { headers, credentials: 'include' }).then(r => r.json()),
            fetch(`${API}/classes/all`, { headers, credentials: 'include' }).then(r => r.json()).catch(() => ({ classes: [] })),
            fetch(`${API}/results/grading-scale`, { headers, credentials: 'include' }).then(r => r.json()).catch(() => null),
        ]).then(([tData, cData, gData]) => {
            setTemplates(tData.templates || []);
            setClasses(cData.classes || []);
            if (gData?.scale?.grades) {
                setGradingRows(gData.scale.grades.map((g: GradeRow) => ({ ...g, minScore: String(g.minScore), maxScore: String(g.maxScore) })));
                setPassMark(String(gData.scale.passMark || 40));
            }
        }).finally(() => setLoading(false));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const openEditor = (tmpl?: Template) => {
        if (tmpl) {
            setActiveTemplate(tmpl);
            setConfig({ ...DEFAULT_CONFIG, ...tmpl.config });
            setTemplateName(tmpl.name);
            setTemplateCategory(tmpl.category || '');
            setAssignedClasses(tmpl.classAssignments?.map(a => a.classId) || []);
        } else {
            setActiveTemplate(null);
            setConfig(DEFAULT_CONFIG);
            setTemplateName('New Template');
            setTemplateCategory('');
            setAssignedClasses([]);
        }
        setView('editor');
    };

    const saveTemplate = async () => {
        if (!templateName.trim()) return toast.error('Template name is required');
        setSaving(true);
        try {
            const url = activeTemplate ? `${API}/report-templates/${activeTemplate.id}` : `${API}/report-templates`;
            const method = activeTemplate ? 'PUT' : 'POST';
            const res = await fetch(url, { method, headers, credentials: 'include', body: JSON.stringify({ name: templateName, category: templateCategory, config }) });
            const data = await res.json();
            if (!res.ok) throw new Error(data.msg || 'Save failed');
            const saved = data.template;
            // Assign classes
            if (assignedClasses.length > 0) {
                await fetch(`${API}/report-templates/${saved.id}/assign`, { method: 'POST', headers, credentials: 'include', body: JSON.stringify({ classIds: assignedClasses }) });
            }
            toast.success(activeTemplate ? 'Template updated!' : 'Template created!');
            setActiveTemplate(saved);
            // Refresh list
            const listRes = await fetch(`${API}/report-templates`, { headers, credentials: 'include' });
            const listData = await listRes.json();
            setTemplates(listData.templates || []);
        } catch (e: unknown) { toast.error((e as Error).message); }
        finally { setSaving(false); }
    };

    const deleteTemplate = async (id: string) => {
        if (!confirm('Delete this template?')) return;
        await fetch(`${API}/report-templates/${id}`, { method: 'DELETE', headers, credentials: 'include' });
        setTemplates(prev => prev.filter(t => t.id !== id));
        toast.success('Template deleted');
    };

    const setAsDefault = async (t: any) => {
        try {
            const res = await fetch(`${API}/report-templates/${t.id}`, {
                method: 'PUT',
                headers,
                credentials: 'include',
                body: JSON.stringify({ isDefault: true })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.msg || 'Failed to set active');
            toast.success(`${t.name} is now the active template`);
            const listRes = await fetch(`${API}/report-templates`, { headers, credentials: 'include' });
            const listData = await listRes.json();
            setTemplates(listData.templates || []);
        } catch (e: any) {
            toast.error(e.message);
        }
    };

    const saveGradingScale = async () => {
        const grades = gradingRows.map(g => ({ ...g, minScore: Number(g.minScore), maxScore: Number(g.maxScore) }));
        const res = await fetch(`${API}/results/grading-scale`, { method: 'POST', headers, credentials: 'include', body: JSON.stringify({ passMark: Number(passMark), grades }) });
        if (res.ok) { setGradingSaved(true); setTimeout(() => setGradingSaved(false), 3000); toast.success('Grading scale saved!'); }
    };

    const updateConfig = (patch: Partial<TemplateConfig>) => setConfig(prev => ({ ...prev, ...patch }));
    const toggle = (key: keyof TemplateConfig) => setConfig(prev => ({ ...prev, [key]: !prev[key] }));
    const updateCol = (id: string, patch: Partial<SubjectColumn>) => setConfig(prev => ({ ...prev, subjectColumns: prev.subjectColumns.map(c => c.id === id ? { ...c, ...patch } : c) }));
    const addCol = () => setConfig(prev => ({ ...prev, subjectColumns: [...prev.subjectColumns, { id: `col-${Date.now()}`, name: 'New Column', key: `col_${Date.now()}`, show: true }] }));
    const removeCol = (id: string) => setConfig(prev => ({ ...prev, subjectColumns: prev.subjectColumns.filter(c => c.id !== id) }));

    const updateSection = (id: string, patch: Partial<EvaluationSection>) => setConfig(prev => ({ ...prev, evaluationSections: prev.evaluationSections.map(s => s.id === id ? { ...s, ...patch } : s) }));
    const addSection = () => setConfig(prev => ({ ...prev, evaluationSections: [...prev.evaluationSections, { id: `sec-${Date.now()}`, title: 'New Section', show: true, rows: [{ id: `r-${Date.now()}`, label: 'New Trait' }], scale: ['Excellent', 'Good', 'Poor'] }] }));
    const removeSection = (id: string) => setConfig(prev => ({ ...prev, evaluationSections: prev.evaluationSections.filter(s => s.id !== id) }));

    const handlePrint = () => {
        const content = document.getElementById('report-card-printable');
        if (!content) return;
        const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]')).map(s => s.outerHTML).join('');
        const win = window.open('', '_blank', 'width=900,height=700');
        win?.document.write(`<html><head><title>Report Card</title>${styles}<style>@media print{@page{size:A4;margin:10mm}body{margin:0}#noPrint{display:none}}</style></head><body class="bg-white">${content.outerHTML}</body></html>`);
        win?.document.close(); win?.focus(); setTimeout(() => { win?.print(); win?.close(); }, 500);
    };

    // ── LIST VIEW ──────────────────────────────────────────────────────────────
    if (view === 'list') {
        return (
            <div className="flex flex-col gap-6 w-full max-w-5xl mx-auto font-dash pb-10 animate-in fade-in duration-500">
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                    <span className="font-semibold text-gray-900">Settings</span><span>/</span>
                    <span className="text-[#0036a1]">Report Card Templates</span>
                </div>
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Report Card Templates</h2>
                        <p className="text-sm text-gray-500 mt-1">Design, manage and assign custom report card layouts for each section.</p>
                    </div>
                    <Button onClick={() => openEditor()} className="bg-[#0036a1] hover:bg-[#001761] text-white gap-2">
                        <Plus className="w-4 h-4" /> New Template
                    </Button>
                </div>
                {loading ? (
                    <div className="flex items-center justify-center h-48 text-gray-400">Loading templates…</div>
                ) : templates.length === 0 ? (
                    <div className="text-center py-20 border-2 border-dashed border-gray-200 rounded-2xl">
                        <LayoutTemplate className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="font-bold text-gray-500">No templates yet</p>
                        <p className="text-sm text-gray-400 mt-1">Create your first report card template to get started.</p>
                        <Button onClick={() => openEditor()} className="mt-4 bg-[#0036a1] text-white gap-2"><Plus className="w-4 h-4" /> Create Template</Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {templates.map(t => (
                            <div key={t.id} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col gap-3">
                                <div className="flex items-start justify-between gap-2">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-bold text-gray-900">{t.name}</h3>
                                            {t.isDefault && <span className="text-xs bg-yellow-100 text-yellow-700 font-bold px-2 py-0.5 rounded-full flex items-center gap-1"><Star className="w-3 h-3" />Default</span>}
                                        </div>
                                        {t.category && <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{t.category}</span>}
                                    </div>
                                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: (t.config as TemplateConfig).primaryColor + '22' }}>
                                        <LayoutTemplate className="w-4 h-4" style={{ color: (t.config as TemplateConfig).primaryColor }} />
                                    </div>
                                </div>
                                <p className="text-xs text-gray-400">{t.classAssignments?.length || 0} class(es) assigned</p>
                                <div className="flex gap-2 mt-auto pt-2 border-t border-gray-100">
                                    {t.isDefault ? (
                                        <Button size="sm" variant="outline" disabled className="flex-1 gap-1 text-xs bg-green-50 text-green-700 border-green-200 opacity-100"><CheckCircle2 className="w-3 h-3" />Active</Button>
                                    ) : (
                                        <Button size="sm" variant="outline" onClick={() => setAsDefault(t)} className="flex-1 gap-1 text-xs"><Star className="w-3 h-3" />Set Active</Button>
                                    )}
                                </div>
                                <div className="flex gap-2 mt-2 pt-2 border-t border-gray-100">
                                    <Button size="sm" variant="outline" onClick={() => openEditor(t)} className="flex-1 gap-1 text-xs"><Pencil className="w-3 h-3" />Edit</Button>
                                    <Button size="sm" variant="outline" onClick={() => { openEditor({ ...t, name: `${t.name} (Copy)`, id: '' } as Template); setActiveTemplate(null); }} className="gap-1 text-xs"><Copy className="w-3 h-3" /></Button>
                                    <Button size="sm" variant="outline" onClick={() => deleteTemplate(t.id)} className="gap-1 text-xs text-red-500 hover:bg-red-50"><Trash2 className="w-3 h-3" /></Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    // ── EDITOR VIEW ────────────────────────────────────────────────────────────
    return (
        <div className="flex flex-col gap-4 w-full max-w-6xl mx-auto font-dash pb-10 px-2 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center gap-3 flex-wrap">
                <Button variant="ghost" onClick={() => setView('list')} className="gap-1 text-gray-500 hover:text-gray-900 px-2"><ChevronLeft className="w-4 h-4" />Templates</Button>
                <span className="text-gray-300">/</span>
                <Input value={templateName} onChange={e => setTemplateName(e.target.value)} className="font-bold text-gray-900 border-none shadow-none text-lg h-9 w-64 focus-visible:ring-0 px-1" />
                <div className="md:ml-auto flex items-center gap-2">
                    <Button variant="outline" onClick={handlePrint} className="gap-2 text-sm"><Printer className="w-4 h-4" />Print Preview</Button>
                    <Button onClick={saveTemplate} disabled={saving} className="bg-[#0036a1] text-white hover:bg-[#001761] gap-2 text-sm">
                        {saving ? 'Saving…' : <><Save className="w-4 h-4" />Save Template</>}
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-[1fr_420px] gap-6">
                {/* Left: Editor Tabs */}
                <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                    <Tabs defaultValue="layout">
                        <TabsList className="w-full rounded-none border-b border-gray-200 bg-gray-50 h-12 justify-start px-4 gap-1 overflow-x-auto">
                            <TabsTrigger value="layout" className="gap-1.5 text-xs data-[state=active]:text-[#0036a1]"><Settings className="w-3.5 h-3.5" />Layout</TabsTrigger>
                            <TabsTrigger value="design" className="gap-1.5 text-xs data-[state=active]:text-[#0036a1]"><Palette className="w-3.5 h-3.5" />Design</TabsTrigger>
                            <TabsTrigger value="columns" className="gap-1.5 text-xs data-[state=active]:text-[#0036a1]"><TableProperties className="w-3.5 h-3.5" />Columns</TabsTrigger>
                            <TabsTrigger value="sections" className="gap-1.5 text-xs data-[state=active]:text-[#0036a1]"><Users className="w-3.5 h-3.5" />Sections</TabsTrigger>
                            <TabsTrigger value="grading" className="gap-1.5 text-xs data-[state=active]:text-[#0036a1]"><Award className="w-3.5 h-3.5" />Grading</TabsTrigger>
                            <TabsTrigger value="assign" className="gap-1.5 text-xs data-[state=active]:text-[#0036a1]"><CheckCircle2 className="w-3.5 h-3.5" />Assign</TabsTrigger>
                        </TabsList>

                        {/* LAYOUT TAB */}
                        <TabsContent value="layout" className="p-5 space-y-5 overflow-y-auto max-h-[70vh]">
                            <div>
                                <Label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Report Title</Label>
                                <Input value={config.reportTitle} onChange={e => updateConfig({ reportTitle: e.target.value })} className="h-10" />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                <div><Label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Category</Label><Input placeholder="e.g. JSS" value={templateCategory} onChange={e => setTemplateCategory(e.target.value)} className="h-9 text-sm" /></div>
                                <div><Label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Principal's Name</Label><Input value={config.principalName} onChange={e => updateConfig({ principalName: e.target.value })} className="h-9 text-sm" /></div>
                                <div><Label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Form Teacher Title</Label><Input value={config.formTeacherTitle} onChange={e => updateConfig({ formTeacherTitle: e.target.value })} className="h-9 text-sm" /></div>
                            </div>
                            <div>
                                <h4 className="font-bold text-gray-700 text-sm mb-2 border-b pb-1">Header & Branding</h4>
                                <div className="grid grid-cols-2 gap-2">
                                    <ToggleCard title="School Logo" desc="Show logo at top of report" active={config.showSchoolLogo} onClick={() => toggle('showSchoolLogo')} />
                                    <ToggleCard title="School Address" desc="Display address & contact" active={config.showSchoolAddress} onClick={() => toggle('showSchoolAddress')} />
                                    <ToggleCard title="Student Photo" desc="Show passport photo" active={config.showStudentPhoto} onClick={() => toggle('showStudentPhoto')} />
                                </div>
                            </div>
                            <div>
                                <h4 className="font-bold text-gray-700 text-sm mb-2 border-b pb-1">Student Information Fields</h4>
                                <div className="grid grid-cols-2 gap-2">
                                    <ToggleCard title="Admission No." desc="" active={config.showAdmissionNo} onClick={() => toggle('showAdmissionNo')} />
                                    <ToggleCard title="Class" desc="" active={config.showClass} onClick={() => toggle('showClass')} />
                                    <ToggleCard title="Session" desc="" active={config.showSession} onClick={() => toggle('showSession')} />
                                    <ToggleCard title="Term" desc="" active={config.showTerm} onClick={() => toggle('showTerm')} />
                                    <ToggleCard title="Age" desc="" active={config.showAge} onClick={() => toggle('showAge')} />
                                    <ToggleCard title="Gender" desc="" active={config.showGender} onClick={() => toggle('showGender')} />
                                    <ToggleCard title="Form Teacher" desc="" active={config.showTeacherName} onClick={() => toggle('showTeacherName')} />
                                </div>
                            </div>
                            <div>
                                <h4 className="font-bold text-gray-700 text-sm mb-2 border-b pb-1">Performance Metrics</h4>
                                <div className="grid grid-cols-2 gap-2">
                                    <ToggleCard title="Class Average" desc="" active={config.showClassAverage} onClick={() => toggle('showClassAverage')} />
                                    <ToggleCard title="Highest Score" desc="Show class highest score" active={config.showHighestInClass ?? false} onClick={() => toggle('showHighestInClass')} />
                                    <ToggleCard title="Lowest Score" desc="Show class lowest score" active={config.showLowestInClass ?? false} onClick={() => toggle('showLowestInClass')} />
                                    <ToggleCard title="Subject Position" desc="Show position per subject" active={config.showSubjectPosition} onClick={() => toggle('showSubjectPosition')} />
                                    <ToggleCard title="Overall Position" desc="" active={config.showOverallPosition} onClick={() => toggle('showOverallPosition')} />
                                    <ToggleCard title="Grading Key" desc="" active={config.showGradingKey} onClick={() => toggle('showGradingKey')} />
                                </div>
                            </div>
                            <div>
                                <h4 className="font-bold text-gray-700 text-sm mb-2 border-b pb-1">Sections</h4>
                                <div className="grid grid-cols-2 gap-2">
                                    <ToggleCard title="Attendance Summary" desc="" active={config.showAttendance} onClick={() => toggle('showAttendance')} />
                                    <ToggleCard title="Evaluation Section" desc="" active={config.showEvaluation} onClick={() => toggle('showEvaluation')} />
                                    <ToggleCard title="Trait Legend" desc="Explain trait initials" active={config.showTraitLegend ?? false} onClick={() => toggle('showTraitLegend')} />
                                    <ToggleCard title="Teacher's Remark" desc="" active={config.showTeacherComment} onClick={() => toggle('showTeacherComment')} />
                                    <ToggleCard title="Head Teacher's Remark" desc="" active={config.showHeadComment} onClick={() => toggle('showHeadComment')} />
                                    <ToggleCard title="Principal's Remark" desc="" active={config.showPrincipalComment} onClick={() => toggle('showPrincipalComment')} />
                                    <ToggleCard title="Next Term Begins" desc="" active={config.showNextTerm} onClick={() => toggle('showNextTerm')} />
                                    <ToggleCard title="Promoted To" desc="" active={config.showPromotedTo} onClick={() => toggle('showPromotedTo')} />
                                </div>
                            </div>
                        </TabsContent>

                        {/* DESIGN TAB */}
                        <TabsContent value="design" className="p-5 space-y-5 overflow-y-auto max-h-[70vh]">
                            <div className="grid grid-cols-2 gap-4">
                                <div><Label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Primary Color</Label>
                                    <div className="flex gap-2 items-center">
                                        <input type="color" value={config.primaryColor} onChange={e => updateConfig({ primaryColor: e.target.value, headerBg: e.target.value })} className="h-10 w-14 rounded cursor-pointer border border-gray-200" />
                                        <Input value={config.primaryColor} onChange={e => updateConfig({ primaryColor: e.target.value })} className="h-10 font-mono text-sm" />
                                    </div>
                                </div>
                                <div><Label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Header Background</Label>
                                    <div className="flex gap-2 items-center">
                                        <input type="color" value={config.headerBg} onChange={e => updateConfig({ headerBg: e.target.value })} className="h-10 w-14 rounded cursor-pointer border border-gray-200" />
                                        <Input value={config.headerBg} onChange={e => updateConfig({ headerBg: e.target.value })} className="h-10 font-mono text-sm" />
                                    </div>
                                </div>
                                <div><Label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Font Family</Label>
                                    <Select value={config.fontFamily} onValueChange={v => updateConfig({ fontFamily: v })}>
                                        <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="serif">Serif (Times New Roman)</SelectItem>
                                            <SelectItem value="sans">Sans-serif (Arial)</SelectItem>
                                            <SelectItem value="mono">Monospace</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div><Label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Base Font Size</Label>
                                    <Select value={config.baseFontSize} onValueChange={v => updateConfig({ baseFontSize: v })}>
                                        <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="small">Small</SelectItem>
                                            <SelectItem value="medium">Medium</SelectItem>
                                            <SelectItem value="large">Large</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div><Label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Header Style</Label>
                                    <Select value={config.headerStyle} onValueChange={v => updateConfig({ headerStyle: v as 'standard' | 'banner' | 'minimal' })}>
                                        <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="standard">Standard</SelectItem>
                                            <SelectItem value="banner">Banner (Full Color)</SelectItem>
                                            <SelectItem value="minimal">Minimal</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div><Label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Logo Position</Label>
                                    <Select value={config.logoPosition} onValueChange={v => updateConfig({ logoPosition: v as 'left' | 'center' | 'right' })}>
                                        <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="left">Left</SelectItem>
                                            <SelectItem value="center">Center</SelectItem>
                                            <SelectItem value="right">Right</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div><Label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Table Border Color</Label>
                                    <div className="flex gap-2 items-center">
                                        <input type="color" value={config.tableBorderColor} onChange={e => updateConfig({ tableBorderColor: e.target.value })} className="h-10 w-14 rounded cursor-pointer border border-gray-200" />
                                        <Input value={config.tableBorderColor} onChange={e => updateConfig({ tableBorderColor: e.target.value })} className="h-10 font-mono text-sm" />
                                    </div>
                                </div>
                                <div><Label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Page Margin</Label>
                                    <Select value={config.pageMargin} onValueChange={v => updateConfig({ pageMargin: v })}>
                                        <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="5mm">5mm (Compact)</SelectItem>
                                            <SelectItem value="10mm">10mm (Balanced)</SelectItem>
                                            <SelectItem value="15mm">15mm (Spacious)</SelectItem>
                                            <SelectItem value="20mm">20mm (Wide)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </TabsContent>

                        {/* COLUMNS TAB */}
                        <TabsContent value="columns" className="p-5 space-y-4 overflow-y-auto max-h-[70vh]">
                            <p className="text-sm text-gray-500">Configure which score columns appear in the subject result table.</p>
                            <div className="space-y-2">
                                {config.subjectColumns.map(col => (
                                    <div key={col.id} className="flex items-center gap-3 p-3 border border-gray-100 rounded-xl bg-gray-50/50">
                                        <div onClick={() => updateCol(col.id, { show: !col.show })} className={`w-5 h-5 rounded flex items-center justify-center cursor-pointer shrink-0 ${col.show ? 'bg-[#0036a1] text-white' : 'border-2 border-gray-300'}`}>
                                            {col.show && <CheckCircle2 className="w-3 h-3" />}
                                        </div>
                                        <Input value={col.name} onChange={e => updateCol(col.id, { name: e.target.value })} className="h-8 text-sm font-medium flex-1" />
                                        {col.computed ? (
                                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold">Computed</span>
                                        ) : (
                                            <Input value={col.key} onChange={e => updateCol(col.id, { key: e.target.value })} className="h-8 text-xs font-mono w-28" placeholder="score key" />
                                        )}
                                        <Button variant="ghost" size="icon" onClick={() => removeCol(col.id)} className="text-red-400 hover:text-red-600 w-7 h-7 shrink-0"><Trash2 className="w-3.5 h-3.5" /></Button>
                                    </div>
                                ))}
                            </div>
                            <Button variant="outline" onClick={addCol} className="w-full border-dashed border-2 text-[#0036a1] hover:bg-blue-50 gap-2"><Plus className="w-4 h-4" />Add Column</Button>
                            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700 flex gap-2">
                                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                                <span>The <strong>Score Key</strong> must match the key used when entering scores (e.g. <strong>ca1</strong>, <strong>exam</strong>). Computed columns (Total, Grade, Remark) are auto-calculated.</span>
                            </div>
                        </TabsContent>

                        {/* SECTIONS TAB */}
                        <TabsContent value="sections" className="p-5 space-y-4 overflow-y-auto max-h-[70vh]">
                            <p className="text-sm text-gray-500">Define behavioural or skills evaluation sections with a rating scale.</p>
                            {config.evaluationSections.map(sec => (
                                <div key={sec.id} className="border border-gray-200 rounded-xl overflow-hidden">
                                    <div className="flex items-center gap-2 p-3 bg-gray-50 border-b border-gray-200">
                                        <div onClick={() => updateSection(sec.id, { show: !sec.show })} className={`w-5 h-5 rounded flex items-center justify-center cursor-pointer shrink-0 ${sec.show ? 'bg-[#0036a1] text-white' : 'border-2 border-gray-300'}`}>
                                            {sec.show && <CheckCircle2 className="w-3 h-3" />}
                                        </div>
                                        <Input value={sec.title} onChange={e => updateSection(sec.id, { title: e.target.value })} className="font-bold text-sm h-8 flex-1 border-none bg-transparent shadow-none focus-visible:ring-0" />
                                        <Button variant="ghost" size="icon" onClick={() => removeSection(sec.id)} className="text-red-400 w-7 h-7"><Trash2 className="w-3.5 h-3.5" /></Button>
                                    </div>
                                    <div className="p-3 space-y-3">
                                        <div>
                                            <Label className="text-xs font-bold text-gray-500 mb-1 block">Rating Scale (comma-separated)</Label>
                                            <Input value={sec.scale.join(', ')} onChange={e => updateSection(sec.id, { scale: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })} className="h-8 text-sm" />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-xs font-bold text-gray-500 mb-1 block">Traits / Rows</Label>
                                            {sec.rows.map(row => (
                                                <div key={row.id} className="flex items-center gap-2">
                                                    <Input value={row.label} onChange={e => updateSection(sec.id, { rows: sec.rows.map(r => r.id === row.id ? { ...r, label: e.target.value } : r) })} className="h-8 text-sm flex-1" />
                                                    <Button variant="ghost" size="icon" onClick={() => updateSection(sec.id, { rows: sec.rows.filter(r => r.id !== row.id) })} className="text-red-400 w-7 h-7"><Trash2 className="w-3 h-3" /></Button>
                                                </div>
                                            ))}
                                            <Button variant="outline" size="sm" onClick={() => updateSection(sec.id, { rows: [...sec.rows, { id: `r-${Date.now()}`, label: 'New Trait' }] })} className="gap-1 text-xs mt-1"><Plus className="w-3 h-3" />Add Trait</Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            <Button variant="outline" onClick={addSection} className="w-full border-dashed border-2 text-[#0036a1] hover:bg-blue-50 gap-2"><Plus className="w-4 h-4" />Add Evaluation Section</Button>
                        </TabsContent>

                        {/* GRADING TAB */}
                        <TabsContent value="grading" className="p-5 space-y-4 overflow-y-auto max-h-[70vh]">
                            <div className="flex items-center gap-4 p-4 bg-blue-50 border border-blue-100 rounded-xl">
                                <div className="flex-1"><p className="text-sm font-bold text-[#0036a1]">Global Pass Mark</p><p className="text-xs text-blue-600">Minimum score to pass a subject</p></div>
                                <div className="flex items-center gap-2">
                                    <Input type="number" value={passMark} onChange={e => setPassMark(e.target.value)} className="h-9 w-20 text-center font-bold text-lg" />
                                    <span className="text-gray-500 font-bold">%</span>
                                </div>
                            </div>
                            <div className="border border-gray-200 rounded-xl overflow-hidden">
                                <div className="grid grid-cols-12 gap-2 p-3 bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase">
                                    <div className="col-span-2 text-center">Grade</div>
                                    <div className="col-span-2 text-center">Min %</div>
                                    <div className="col-span-2 text-center">Max %</div>
                                    <div className="col-span-3">Remark</div>
                                    <div className="col-span-2 text-center">Status</div>
                                    <div className="col-span-1"></div>
                                </div>
                                <div className="divide-y divide-gray-100 p-2 space-y-1">
                                    {gradingRows.map(g => (
                                        <div key={g.id} className="grid grid-cols-12 gap-2 items-center p-1">
                                            <div className="col-span-2"><Input value={g.grade} onChange={e => setGradingRows(prev => prev.map(r => r.id === g.id ? { ...r, grade: e.target.value.toUpperCase() } : r))} className="text-center font-bold text-base h-8" placeholder="A" /></div>
                                            <div className="col-span-2"><Input type="number" value={g.minScore} onChange={e => setGradingRows(prev => prev.map(r => r.id === g.id ? { ...r, minScore: e.target.value } : r))} className="text-center h-8" /></div>
                                            <div className="col-span-2"><Input type="number" value={g.maxScore} onChange={e => setGradingRows(prev => prev.map(r => r.id === g.id ? { ...r, maxScore: e.target.value } : r))} className="text-center h-8" /></div>
                                            <div className="col-span-3"><Input value={g.remark} onChange={e => setGradingRows(prev => prev.map(r => r.id === g.id ? { ...r, remark: e.target.value } : r))} className="h-8 text-sm" /></div>
                                            <div className="col-span-2">
                                                <Select value={g.status} onValueChange={v => setGradingRows(prev => prev.map(r => r.id === g.id ? { ...r, status: v as 'PASS' | 'FAIL' } : r))}>
                                                    <SelectTrigger className={`h-8 text-xs font-bold ${g.status === 'PASS' ? 'text-green-700 bg-green-50' : 'text-red-700 bg-red-50'}`}><SelectValue /></SelectTrigger>
                                                    <SelectContent><SelectItem value="PASS" className="text-green-700 font-bold">PASS</SelectItem><SelectItem value="FAIL" className="text-red-700 font-bold">FAIL</SelectItem></SelectContent>
                                                </Select>
                                            </div>
                                            <div className="col-span-1 flex justify-center"><Button variant="ghost" size="icon" onClick={() => setGradingRows(prev => prev.filter(r => r.id !== g.id))} className="text-gray-400 hover:text-red-500 w-7 h-7"><Trash2 className="w-3.5 h-3.5" /></Button></div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <Button variant="outline" onClick={() => setGradingRows(prev => [...prev, { id: `g-${Date.now()}`, grade: '', minScore: '', maxScore: '', remark: '', status: 'PASS' }])} className="w-full border-dashed border-2 text-[#0036a1] hover:bg-blue-50 gap-2"><Plus className="w-4 h-4" />Add Grade</Button>
                            <Button onClick={saveGradingScale} className={`w-full py-5 font-bold rounded-xl gap-2 ${gradingSaved ? 'bg-green-600 hover:bg-green-700' : 'bg-[#0036a1] hover:bg-[#001761]'} text-white`}>
                                {gradingSaved ? '✓ Grading Scale Saved!' : <><Save className="w-4 h-4" />Save Grading Scale</>}
                            </Button>
                        </TabsContent>

                        {/* ASSIGN TAB */}
                        <TabsContent value="assign" className="p-5 space-y-4 overflow-y-auto max-h-[70vh]">
                            <p className="text-sm text-gray-500">Select which classes will use this template for their report cards.</p>
                            {classes.length === 0 ? (
                                <p className="text-sm text-gray-400 italic">No classes found. Add classes first.</p>
                            ) : (
                                <div className="grid grid-cols-2 gap-2">
                                    {classes.map(cls => {
                                        const assigned = assignedClasses.includes(cls.id);
                                        return (
                                            <div key={cls.id} onClick={() => setAssignedClasses(prev => assigned ? prev.filter(id => id !== cls.id) : [...prev, cls.id])} className={`p-3 rounded-xl border-2 cursor-pointer transition-all flex items-center gap-2 ${assigned ? 'border-[#0036a1] bg-blue-50' : 'border-gray-100 hover:border-gray-200 bg-white'}`}>
                                                <div className={`w-4 h-4 rounded flex items-center justify-center shrink-0 ${assigned ? 'bg-[#0036a1] text-white' : 'border-2 border-gray-300'}`}>
                                                    {assigned && <CheckCircle2 className="w-3 h-3" />}
                                                </div>
                                                <span className={`text-sm font-semibold ${assigned ? 'text-[#0036a1]' : 'text-gray-700'}`}>{cls.name}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                            <p className="text-xs text-gray-400">{assignedClasses.length} class(es) selected. Changes saved with the template.</p>
                        </TabsContent>
                    </Tabs>
                </div>

                {/* Right: Live Preview */}
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-1.5 text-sm font-bold text-gray-700"><Eye className="w-4 h-4 text-[#0036a1]" />Live Preview</div>
                    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-auto max-h-[80vh] p-2" ref={printRef}>
                        <div style={{ transform: 'scale(0.62)', transformOrigin: 'top left', width: '161%', pointerEvents: 'none' }}>
                            <ReportCardPreview
                                templateConfig={config}
                                student={MOCK_STUDENT}
                                results={MOCK_RESULTS}
                                gradingScale={{ grades: gradingRows.map(g => ({ ...g, minScore: Number(g.minScore), maxScore: Number(g.maxScore) })), passMark: Number(passMark) }}
                                comments={MOCK_COMMENTS}
                                attendance={MOCK_ATTENDANCE}
                                school={{ schoolName: 'Greenfield Academy', tagline: 'Excellence in Education', address: '12 School Road, Abuja', phone: '0801 234 5678' }}
                                summary={MOCK_SUMMARY}
                                isPreview
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

