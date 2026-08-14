/**
 * TemplateGallery.tsx — the picker that replaced the drag-and-drop report
 * card builder (TemplateBuilder.tsx + ReportCardBuilder.tsx's old UI, both
 * removed). Admins choose one of the fixed presets in templatePresets.ts,
 * then customize it — primary/accent color and which optional sections show
 * — before assigning it to a section (or the whole school).
 *
 * This is deliberately short of the old drag-and-drop builder: no block
 * reordering, no free-form layout editing, no per-block color overrides
 * beyond the two theme colors. Each preset's actual structure (header
 * alignment layout, footer arrangement, typography) stays as designed —
 * see PROJECT_BRIEF.md section 3, "Result templates" for the full scope
 * decision this follows (14 Aug 2026 update: color + section-visibility
 * customization added on top of the fixed gallery, per client request).
 *
 * Talks to /api/v1/report-templates (reportTemplate.controller.js) — the
 * single surviving template API after the 12 Aug 2026 consolidation. Used
 * from both ReportCardBuilder.tsx and ResultSettings.tsx's "Result
 * Templates" tab so there's exactly one management surface, not two.
 */
import { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Check, Loader2, Star, Trash2, X, Palette, LayoutGrid } from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import { Card } from '../../../../components/ui/card';
import ReportCard from '../../../../components/report-blocks/ReportCard';
import { TEMPLATE_PRESETS, OPTIONAL_BLOCKS, recolorConfig, type TemplatePreset } from '../../../../components/report-blocks/templatePresets';

const API = import.meta.env.VITE_API_URL || '/api/v1';

// A realistic stand-in dataset shaped exactly like getStudentReportCard's
// real response, so the gallery preview is the actual rendering pipeline,
// not a mockup that could drift from what schools really see.
const PREVIEW_DATA = {
    student: {
        name: 'Doe, John Emmanuel', admissionNo: 'ADM/2025/014', className: 'JSS 2 Gold',
        classLevel: 'JSS', gender: 'Male', term: 'First Term', academicYear: '2025/2026'
    },
    results: [
        { subject: { name: 'Mathematics' }, ca1: 15, ca2: 18, exam: 55, totalScore: 88, computedGrade: 'A', computedRemark: 'Excellent', isPassing: true },
        { subject: { name: 'English Language' }, ca1: 14, ca2: 16, exam: 45, totalScore: 75, computedGrade: 'B', computedRemark: 'Very Good', isPassing: true },
        { subject: { name: 'Basic Science' }, ca1: 10, ca2: 12, exam: 40, totalScore: 62, computedGrade: 'C', computedRemark: 'Good', isPassing: true }
    ],
    summary: { totalSubjects: 3, totalScore: 225, average: '75.0', overallPosition: 3, classAverage: '68.4', passMark: 40 },
    attendance: { present: 58, absent: 2, total: 60 },
    comments: { teacherComment: 'A focused and consistent learner this term.', principalComment: 'Keep up the good work.' },
    schoolSettings: { schoolName: 'Sample School', display: {}, signatures: [], resultConfig: {} }
};

const HEADER_ALIGNMENTS = [
    { value: 'LEFT', label: 'Left-aligned' },
    { value: 'CENTER', label: 'Centered' },
    { value: 'RIGHT', label: 'Right-aligned' }
];

interface SavedTemplate {
    id: string; name: string; type: string; category: string | null; isDefault: boolean; config: any;
}

function previewConfig(config: TemplatePreset['config']) {
    return { ...config, gradeScale: [], studentFields: {} };
}

/* ── CUSTOMIZE MODAL ────────────────────────────────────── */
function CustomizeModal({ preset, defaultName, onCancel, onApply, applying }: {
    preset: TemplatePreset;
    defaultName: string;
    onCancel: () => void;
    onApply: (config: TemplatePreset['config']) => void;
    applying: boolean;
}) {
    const [primary, setPrimary] = useState(preset.config.design.primaryColor);
    const [accent, setAccent] = useState(preset.config.design.accentColor);
    const [hidden, setHidden] = useState<Set<string>>(new Set());
    const [headerAlign, setHeaderAlign] = useState(
        preset.config.blocks.find(b => b.type === 'SchoolHeaderBlock')?.props?.headerLayoutMode || 'LEFT'
    );

    const toggleBlock = (id: string) => {
        setHidden(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const buildConfig = (): TemplatePreset['config'] => {
        const recolored = recolorConfig(preset.config, primary, accent);
        return {
            ...recolored,
            blocks: recolored.blocks.map(b => ({
                ...b,
                isVisible: hidden.has(b.id) ? false : b.isVisible,
                props: b.type === 'SchoolHeaderBlock' ? { ...b.props, headerLayoutMode: headerAlign } : b.props
            }))
        };
    };

    const liveConfig = buildConfig();

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <div className="w-full max-w-4xl max-h-[90vh] rounded-2xl bg-white shadow-2xl overflow-hidden flex flex-col">
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 shrink-0">
                    <div>
                        <h3 className="font-bold text-slate-900">Customize "{preset.name}"</h3>
                        <p className="text-xs text-slate-500 mt-0.5">Colors and which sections appear — the layout itself stays as designed.</p>
                    </div>
                    <button onClick={onCancel} className="text-slate-400 hover:text-slate-700"><X className="w-5 h-5" /></button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 flex-1 overflow-hidden">
                    {/* Controls */}
                    <div className="p-5 space-y-6 overflow-y-auto border-r border-slate-100">
                        <div>
                            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 uppercase tracking-wide mb-3">
                                <Palette className="w-3.5 h-3.5" /> Colors
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[11px] font-semibold text-slate-500 block mb-1">Primary (headers)</label>
                                    <div className="flex items-center gap-2">
                                        <input type="color" value={primary} onChange={e => setPrimary(e.target.value)} className="h-9 w-9 rounded cursor-pointer border border-slate-200 shrink-0" />
                                        <input value={primary} onChange={e => setPrimary(e.target.value)} className="h-9 flex-1 rounded-lg border border-slate-200 px-2 text-xs font-mono" />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[11px] font-semibold text-slate-500 block mb-1">Accent (badges/highlights)</label>
                                    <div className="flex items-center gap-2">
                                        <input type="color" value={accent} onChange={e => setAccent(e.target.value)} className="h-9 w-9 rounded cursor-pointer border border-slate-200 shrink-0" />
                                        <input value={accent} onChange={e => setAccent(e.target.value)} className="h-9 flex-1 rounded-lg border border-slate-200 px-2 text-xs font-mono" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 uppercase tracking-wide mb-3">
                                <LayoutGrid className="w-3.5 h-3.5" /> Structure
                            </div>
                            <label className="text-[11px] font-semibold text-slate-500 block mb-1">Header alignment</label>
                            <select
                                value={headerAlign}
                                onChange={e => setHeaderAlign(e.target.value)}
                                className="w-full h-9 rounded-lg border border-slate-200 px-2 text-sm font-semibold mb-4"
                            >
                                {HEADER_ALIGNMENTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                            </select>

                            <label className="text-[11px] font-semibold text-slate-500 block mb-1.5">Sections to include</label>
                            <div className="space-y-1.5">
                                {OPTIONAL_BLOCKS.map(block => {
                                    const inThisPreset = preset.config.blocks.some(b => b.id === block.id);
                                    if (!inThisPreset) return null;
                                    const isOn = !hidden.has(block.id);
                                    return (
                                        <label key={block.id} className="flex items-center gap-2 p-2 rounded-lg border border-slate-100 hover:bg-slate-50 cursor-pointer">
                                            <input type="checkbox" checked={isOn} onChange={() => toggleBlock(block.id)} className="accent-[#0B1F4E] w-4 h-4" />
                                            <span className="text-sm text-slate-700">{block.label}</span>
                                        </label>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Live preview */}
                    <div className="p-5 overflow-y-auto bg-slate-50 flex items-start justify-center">
                        <div style={{ transform: 'scale(0.42)', transformOrigin: 'top center', width: '794px' }}>
                            <ReportCard config={previewConfig(liveConfig)} data={PREVIEW_DATA} />
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-between gap-3 px-5 py-4 border-t border-slate-100 shrink-0">
                    <p className="text-xs text-slate-400 truncate">{defaultName}</p>
                    <div className="flex gap-2 shrink-0">
                        <Button variant="outline" onClick={onCancel}>Cancel</Button>
                        <Button onClick={() => onApply(liveConfig)} disabled={applying} className="bg-[#0B1F4E] hover:bg-[#122B5C] text-white gap-2">
                            {applying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                            Apply template
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export function TemplateGallery({ resultType = 'SCORE_BASED' }: { resultType?: string }) {
    const [templates, setTemplates] = useState<SavedTemplate[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [category, setCategory] = useState('ALL');
    const [sections, setSections] = useState<{ id: string; name: string }[]>([]);
    const [customizing, setCustomizing] = useState<TemplatePreset | null>(null);

    const fetchTemplates = () => {
        axios.get(`${API}/report-templates`, { withCredentials: true })
            .then(res => setTemplates((res.data.templates || []).filter((t: SavedTemplate) => t.type === resultType)))
            .catch(() => toast.error('Failed to load saved templates'))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchTemplates();
        axios.get(`${API}/sections`, { withCredentials: true })
            .then(res => setSections(res.data.sections || []))
            .catch(() => {});
    }, [resultType]);

    const applyConfig = async (preset: TemplatePreset, config: TemplatePreset['config']) => {
        setSaving(true);
        try {
            await axios.post(`${API}/report-templates`, {
                name: `${preset.name}${category !== 'ALL' ? ` — ${category}` : ' (School Default)'}`,
                type: resultType,
                category: category === 'ALL' ? null : category,
                config,
                isDefault: category === 'ALL'
            }, { withCredentials: true });
            toast.success(`"${preset.name}" is now active${category !== 'ALL' ? ` for ${category}` : ' school-wide'}`);
            setCustomizing(null);
            fetchTemplates();
        } catch (e: any) {
            toast.error(e.response?.data?.msg || 'Failed to apply template');
        } finally {
            setSaving(false);
        }
    };

    const deleteTemplate = async (id: string) => {
        if (!confirm('Remove this template assignment?')) return;
        try {
            await axios.delete(`${API}/report-templates/${id}`, { withCredentials: true });
            fetchTemplates();
        } catch {
            toast.error('Failed to remove template');
        }
    };

    if (loading) {
        return <div className="flex items-center justify-center py-16 text-slate-400"><Loader2 className="w-5 h-5 animate-spin" /></div>;
    }

    return (
        <div className="space-y-8">
            {/* Scope selector — who is this template for */}
            <div className="flex flex-wrap items-center gap-3 bg-[#FDF6E3]/60 border border-[#F5B800]/30 rounded-xl p-3">
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">Apply to:</span>
                <select
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-800 outline-none focus:border-[#0B1F4E]"
                >
                    <option value="ALL">Whole school (default)</option>
                    {sections.map(s => <option key={s.id} value={s.name}>{s.name} section only</option>)}
                </select>
            </div>

            {/* Gallery */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {TEMPLATE_PRESETS.map(preset => (
                    <Card key={preset.id} className="overflow-hidden flex flex-col border-slate-200">
                        <div className="relative bg-slate-100 h-56 overflow-hidden flex items-start justify-center border-b border-slate-200">
                            <div style={{ transform: 'scale(0.28)', transformOrigin: 'top center', width: '794px', pointerEvents: 'none' }}>
                                <ReportCard config={previewConfig(preset.config)} data={PREVIEW_DATA} />
                            </div>
                            <span className="absolute top-2 right-2 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-[#0B1F4E] text-white">
                                {preset.tag}
                            </span>
                        </div>
                        <div className="p-4 flex flex-col flex-1 gap-3">
                            <div>
                                <h3 className="font-bold text-slate-900">{preset.name}</h3>
                                <p className="text-xs text-slate-500 mt-1 leading-relaxed">{preset.description}</p>
                            </div>
                            <Button
                                onClick={() => setCustomizing(preset)}
                                className="mt-auto bg-[#0B1F4E] hover:bg-[#122B5C] text-white gap-2"
                            >
                                <Palette className="w-4 h-4" />
                                Use & customize
                            </Button>
                        </div>
                    </Card>
                ))}
            </div>

            {/* Currently active assignments */}
            <div>
                <h3 className="font-bold text-slate-900 mb-3">Active assignments</h3>
                {templates.length === 0 ? (
                    <p className="text-sm text-slate-400">No template applied yet — pick one above.</p>
                ) : (
                    <div className="space-y-2">
                        {templates.map(t => (
                            <div key={t.id} className="flex items-center justify-between bg-white border border-slate-200 rounded-xl px-4 py-3">
                                <div className="flex items-center gap-2 text-sm">
                                    {t.isDefault && <Star className="w-3.5 h-3.5 text-[#F5B800] fill-[#F5B800]" />}
                                    <span className="font-semibold text-slate-800">{t.name}</span>
                                    <span className="text-xs text-slate-400">{t.category ? `· ${t.category}` : '· School default'}</span>
                                    {t.config?.design?.primaryColor && (
                                        <span className="w-3 h-3 rounded-full border border-slate-200 shrink-0" style={{ backgroundColor: t.config.design.primaryColor }} title="Primary color" />
                                    )}
                                </div>
                                <button onClick={() => deleteTemplate(t.id)} className="text-slate-400 hover:text-red-600">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {customizing && (
                <CustomizeModal
                    preset={customizing}
                    defaultName={`Applies to: ${category === 'ALL' ? 'whole school (default)' : `${category} section only`}`}
                    onCancel={() => setCustomizing(null)}
                    onApply={config => applyConfig(customizing, config)}
                    applying={saving}
                />
            )}
        </div>
    );
}
