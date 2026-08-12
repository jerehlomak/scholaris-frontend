import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Award, Plus, Trash2, AlertCircle } from 'lucide-react';
import { SettingsShell } from './shared/SettingsShell';
import { SettingsHero } from './shared/SettingsHero';
import { SaveButton } from './shared/SaveButton';
import { cn } from '../../../lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';

interface GradeScale {
    id: string;
    grade: string;
    minScore: string;
    maxScore: string;
    remark?: string;
    status: 'PASS' | 'FAIL';
}

const DEFAULT_GRADES: GradeScale[] = [
    { id: 'g1', grade: 'A+', minScore: '80', maxScore: '100', status: 'PASS' },
    { id: 'g2', grade: 'A',  minScore: '70', maxScore: '79',  status: 'PASS' },
    { id: 'g3', grade: 'B+', minScore: '60', maxScore: '69',  status: 'PASS' },
    { id: 'g4', grade: 'B',  minScore: '50', maxScore: '59',  status: 'PASS' },
    { id: 'g5', grade: 'C',  minScore: '40', maxScore: '49',  status: 'PASS' },
    { id: 'g6', grade: 'D',  minScore: '33', maxScore: '39',  remark: 'Pass', status: 'PASS' },
    { id: 'g7', grade: 'F',  minScore: '0',  maxScore: '32',  remark: 'Fail', status: 'FAIL' },
];

export function MarksGrading() {
    const [grades, setGrades] = useState<GradeScale[]>([]);
    const [saved, setSaved] = useState(false);
    const [passMark, setPassMark] = useState('40');
    
    const [classCategories, setClassCategories] = useState<string[]>([]);
    const [selectedCategory, setSelectedCategory] = useState('ALL');
    const [loading, setLoading] = useState(true);

    const API = import.meta.env.VITE_API_URL || '/api/v1';

    const fetchCategories = useCallback(async () => {
        try {
            const levelsRes = await axios.get(`${API}/school-settings/class-levels`, { withCredentials: true });
            const levels = levelsRes.data.levels.map((l: any) => l.name);
            setClassCategories(['ALL', ...new Set(levels)] as string[]);
        } catch (err) {
            console.error('Failed to load categories:', err);
        }
    }, [API]);

    const fetchScale = useCallback(async (cat: string) => {
        setLoading(true);
        try {
            const res = await axios.get(`${API}/results/grading-scale?category=${encodeURIComponent(cat)}`, { withCredentials: true });
            if (res.data.scale) {
                setGrades(res.data.scale.grades.map((g: any) => ({ ...g, minScore: String(g.minScore), maxScore: String(g.maxScore) })));
                setPassMark(String(res.data.scale.passMark || 40));
            } else {
                setGrades(DEFAULT_GRADES);
                setPassMark('40');
            }
        } catch (err) {
            console.error('Failed to load grading scale:', err);
            setGrades(DEFAULT_GRADES);
        } finally {
            setLoading(false);
        }
    }, [API]);

    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

    useEffect(() => {
        fetchScale(selectedCategory);
    }, [selectedCategory, fetchScale]);

    const handleAdd = () => {
        setSaved(false);
        setGrades([...grades, { id: `g-${Date.now()}`, grade: '', minScore: '', maxScore: '', remark: '', status: 'PASS' }]);
    };

    const handleUpdate = (id: string, field: keyof GradeScale, value: string) => {
        setSaved(false);
        setGrades(prev => prev.map(g => g.id === id ? { ...g, [field]: value } : g));
    };

    const handleDelete = (id: string) => {
        setSaved(false);
        setGrades(prev => prev.filter(g => g.id !== id));
    };

    const handleSave = async () => {
        if (!isValid) return;
        try {
            const payload = {
                category: selectedCategory,
                passMark: Number(passMark),
                grades: grades.map(g => ({ ...g, minScore: Number(g.minScore), maxScore: Number(g.maxScore) }))
            };
            await axios.post(`${API}/results/grading-scale`, payload, { withCredentials: true });
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (err) {
            console.error('Save failed:', err);
        }
    };

    const sortedGrades = [...grades].sort((a, b) => Number(b.maxScore) - Number(a.maxScore));
    const isValid = !grades.some(g => !g.grade || g.minScore === '' || g.maxScore === '' || Number(g.minScore) > Number(g.maxScore));

    return (
        <SettingsShell breadcrumbParent="Results & Reports" breadcrumbCurrent="Marks & Grading" tabLabel="Grading Scale" tabIcon={<Award className="h-3.5 w-3.5" />}>
            <SettingsHero
                icon={<Award className="h-7 w-7" />}
                title="Custom Grading Scheme"
                subtitle="Define the letter grades, percentage ranges, remarks and pass/fail thresholds for specific class categories."
            />

            {/* Category Selector */}
            <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
                <div>
                    <h3 className="font-bold text-gray-900 text-sm">Class Category</h3>
                    <p className="text-xs text-gray-500 mt-0.5">Select a category to customize its specific grading scale. Use 'ALL' as a default fallback.</p>
                </div>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-full sm:w-[240px] bg-white border-gray-200">
                        <SelectValue placeholder="Select Category" />
                    </SelectTrigger>
                    <SelectContent>
                        {classCategories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>

            {loading ? (
                <div className="py-10 text-center text-gray-400">Loading grading scale...</div>
            ) : (
                <>
                    {/* Global Pass Mark */}
                    <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl border border-blue-100 bg-blue-50/60 p-5">
                <div>
                    <h3 className="font-bold text-blue-800 text-sm">Global Passing Score</h3>
                    <p className="text-xs text-blue-600/70 mt-0.5">The minimum percentage required to pass a subject school-wide.</p>
                </div>
                <div className="flex items-center gap-2 rounded-xl border border-blue-200 bg-white px-3 py-2">
                    <span className="text-sm font-bold text-slate-600">Pass Mark</span>
                    <div className="relative w-20">
                        <input
                            type="number"
                            value={passMark}
                            onChange={e => setPassMark(e.target.value)}
                            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 pr-6 text-center text-sm font-black text-slate-800 outline-none focus:border-blue-400"
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">%</span>
                    </div>
                </div>
            </div>

            {/* Grade table */}
            <div className="rounded-2xl border border-slate-200 overflow-hidden bg-white shadow-sm">
                <div className="grid grid-cols-12 gap-4 border-b border-slate-100 bg-slate-50/60 px-5 py-3">
                    <div className="col-span-2 font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400 text-center">Grade</div>
                    <div className="col-span-2 font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400 text-center">Min %</div>
                    <div className="col-span-2 font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400 text-center">Max %</div>
                    <div className="col-span-3 font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400 text-left">Remark</div>
                    <div className="col-span-2 font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400 text-center">Status</div>
                    <div className="col-span-1" />
                </div>

                <div className="divide-y divide-slate-50 p-2">
                    {sortedGrades.map(g => (
                        <div key={g.id} className="grid grid-cols-12 gap-4 items-center p-2 rounded-xl hover:bg-slate-50/60 transition-colors">
                            <div className="col-span-2">
                                <input
                                    value={g.grade}
                                    onChange={e => handleUpdate(g.id, 'grade', e.target.value.toUpperCase())}
                                    placeholder="A+"
                                    className="w-full rounded-xl border border-slate-200 bg-white px-2 py-2.5 text-center text-lg font-black text-slate-800 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                                />
                            </div>
                            <div className="col-span-2">
                                <div className="relative">
                                    <input type="number" value={g.minScore} onChange={e => handleUpdate(g.id, 'minScore', e.target.value)}
                                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 pr-7 text-center text-sm font-semibold outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" />
                                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400">%</span>
                                </div>
                            </div>
                            <div className="col-span-2">
                                <div className="relative">
                                    <input type="number" value={g.maxScore} onChange={e => handleUpdate(g.id, 'maxScore', e.target.value)}
                                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 pr-7 text-center text-sm font-semibold outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" />
                                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400">%</span>
                                </div>
                            </div>
                            <div className="col-span-3">
                                <input value={(g as any).remark || ''} onChange={e => handleUpdate(g.id, 'remark' as keyof GradeScale, e.target.value)}
                                    placeholder="e.g. Excellent"
                                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" />
                            </div>
                            <div className="col-span-2">
                                <button
                                    onClick={() => handleUpdate(g.id, 'status', g.status === 'PASS' ? 'FAIL' : 'PASS')}
                                    className={cn(
                                        'w-full rounded-xl py-2.5 text-xs font-bold tracking-wider uppercase transition-all',
                                        g.status === 'PASS'
                                            ? 'bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                                            : 'bg-red-50 border border-red-200 text-red-700 hover:bg-red-100'
                                    )}
                                >
                                    {g.status}
                                </button>
                            </div>
                            <div className="col-span-1 flex justify-center">
                                <button onClick={() => handleDelete(g.id)} className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500">
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <button
                onClick={handleAdd}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-blue-200 py-4 text-sm font-semibold text-blue-600 hover:bg-blue-50 transition-colors"
            >
                <Plus className="h-4 w-4" /> Add Grade Range
            </button>

            {!isValid && (
                <div className="mt-4 flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-600">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    Please ensure all grades have a letter, percentage range properly defined (min &lt;= max).
                </div>
            )}

            <div className="mt-8 border-t border-slate-100 pt-8">
                <SaveButton onClick={handleSave} saved={saved} disabled={!isValid} saveLabel="Save Grading Scale" savedLabel="Scale Saved!" />
            </div>
          </>
        )}
        </SettingsShell>
    );
}

