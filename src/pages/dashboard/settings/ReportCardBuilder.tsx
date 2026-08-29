/**
 * ReportCardBuilder.tsx — result-template settings page.
 *
 * Rewritten 12 Aug 2026: this used to be a full drag-and-drop/tabbed
 * template editor (Layout/Design/Columns/Sections/Assign tabs, ~590 lines).
 * Per PROJECT_BRIEF.md section 3 ("no template builder"), that's gone —
 * admins now pick from TemplateGallery's fixed, pre-made designs instead of
 * assembling their own. Grading-scale management is kept here since it's a
 * grading-policy setting, not a layout/design choice, and was never part of
 * what the client asked to simplify.
 */
import { useState, useEffect } from 'react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Plus, Trash2, Save, LayoutTemplate, Award } from 'lucide-react';
import { toast } from 'sonner';
import { TemplateGallery } from './shared/TemplateGallery';

const API = import.meta.env.VITE_API_URL || '/api/v1';

interface GradeRow { id: string; grade: string; minScore: string; maxScore: string; remark: string; status: 'PASS' | 'FAIL' }

const RESULT_TYPES = [
    { value: 'SCORE_BASED', label: 'Score-Based Results' },
    { value: 'COMMENT_BASED', label: 'Comment-Based Reports' },
    { value: 'TRANSCRIPT', label: 'Transcripts' }
];

export function ReportCardBuilder() {
    const [tab, setTab] = useState<'templates' | 'grading'>('templates');
    const [resultType, setResultType] = useState('SCORE_BASED');

    const [gradingRows, setGradingRows] = useState<GradeRow[]>([]);
    const [passMark, setPassMark] = useState('40');
    const [gradingSaved, setGradingSaved] = useState(false);
    const headers = { 'Content-Type': 'application/json' };

    useEffect(() => {
        fetch(`${API}/results/grading-scale`, { headers, credentials: 'include' })
            .then(r => r.json())
            .then(gData => {
                if (gData?.scale?.grades) {
                    setGradingRows(gData.scale.grades.map((g: GradeRow) => ({ ...g, minScore: String(g.minScore), maxScore: String(g.maxScore) })));
                    setPassMark(String(gData.scale.passMark || 40));
                }
            })
            .catch(() => {});
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const saveGradingScale = async () => {
        const grades = gradingRows.map(g => ({ ...g, minScore: Number(g.minScore), maxScore: Number(g.maxScore) }));
        const res = await fetch(`${API}/results/grading-scale`, { method: 'POST', headers, credentials: 'include', body: JSON.stringify({ passMark: Number(passMark), grades }) });
        if (res.ok) { setGradingSaved(true); setTimeout(() => setGradingSaved(false), 3000); toast.success('Grading scale saved!'); }
        else toast.error('Failed to save grading scale');
    };

    return (
        <div className="flex flex-col gap-6 w-full max-w-6xl mx-auto font-dash pb-10 animate-in fade-in duration-500">
            <div className="flex items-center gap-2 text-sm text-gray-500">
                <span className="font-semibold text-gray-900">Settings</span><span>/</span>
                <span className="text-[#0B1F4E]">Result Templates</span>
            </div>
            <div>
                <h2 className="text-2xl font-bold text-gray-900">Result Templates</h2>
                <p className="text-sm text-gray-500 mt-1">Pick a pre-made report card design for each section, and manage the grading scale used to compute grades.</p>
            </div>

            <div className="flex items-center gap-2 border-b border-gray-200">
                <button onClick={() => setTab('templates')} className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-bold border-b-2 -mb-px ${tab === 'templates' ? 'border-[#0B1F4E] text-[#0B1F4E]' : 'border-transparent text-gray-500 hover:text-gray-800'}`}>
                    <LayoutTemplate className="w-4 h-4" /> Templates
                </button>
                <button onClick={() => setTab('grading')} className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-bold border-b-2 -mb-px ${tab === 'grading' ? 'border-[#0B1F4E] text-[#0B1F4E]' : 'border-transparent text-gray-500 hover:text-gray-800'}`}>
                    <Award className="w-4 h-4" /> Grading Scale
                </button>
            </div>

            {tab === 'templates' ? (
                <div className="space-y-4">
                    <Select value={resultType} onValueChange={setResultType}>
                        <SelectTrigger className="h-10 w-64"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            {RESULT_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <TemplateGallery resultType={resultType} />
                </div>
            ) : (
                <div className="space-y-4 max-w-3xl">
                    <div className="flex items-center gap-4 p-4 bg-[#FDF6E3]/60 border border-[#F5B800]/30 rounded-xl">
                        <div className="flex-1"><p className="text-sm font-bold text-[#0B1F4E]">Global Pass Mark</p><p className="text-xs text-slate-500">Minimum score to pass a subject</p></div>
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
                    <Button variant="outline" onClick={() => setGradingRows(prev => [...prev, { id: `g-${Date.now()}`, grade: '', minScore: '', maxScore: '', remark: '', status: 'PASS' }])} className="w-full border-dashed border-2 text-[#0B1F4E] hover:bg-[#FDF6E3] gap-2"><Plus className="w-4 h-4" />Add Grade</Button>
                    <Button onClick={saveGradingScale} className={`w-full py-5 font-bold rounded-xl gap-2 ${gradingSaved ? 'bg-green-600 hover:bg-green-700' : 'bg-[#0B1F4E] hover:bg-[#122B5C]'} text-white`}>
                        {gradingSaved ? '✓ Grading Scale Saved!' : <><Save className="w-4 h-4" />Save Grading Scale</>}
                    </Button>
                </div>
            )}
        </div>
    );
}
