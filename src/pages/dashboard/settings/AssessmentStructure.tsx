import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Button } from './../../../components/ui/button';
import { Input } from './../../../components/ui/input';
import { Label } from './../../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './../../../components/ui/select';
import { Plus, Trash2, Save, AlertCircle, Percent } from 'lucide-react';
import { Card } from './../../../components/ui/card';
import { useSchoolType } from './../../../context/SchoolTypeContext';

// Dynamically fetched sections
const API = '/api/v1/assessments';

interface AssessmentPart {
    id: string;
    name: string;
    weight: number;
}

interface CategoryConfig {
    [category: string]: AssessmentPart[];
}

const FALLBACK_PARTS: AssessmentPart[] = [
    { id: '1', name: '1st Continuous Assessment', weight: 20 },
    { id: '2', name: '2nd Continuous Assessment', weight: 20 },
    { id: '3', name: 'Examination', weight: 60 },
];

export function AssessmentStructure() {
    const [classCategories, setClassCategories] = useState<{id: string, name: string}[]>([]);
    const [selectedCategory, setSelectedCategory] = useState('ALL');
    const [selectedResultType, setSelectedResultType] = useState<'SCORE_BASED' | 'COMMENT_BASED'>('SCORE_BASED');
    const [config, setConfig] = useState<CategoryConfig>({});
    const [saved, setSaved] = useState(false);
    const [loading, setLoading] = useState(true);

    const { activeSchoolType } = useSchoolType();

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            // Fetch Sections — filter by active school type if set
            const params: any = {};
            if (activeSchoolType) params.schoolType = activeSchoolType;
            const sectionsRes = await axios.get('/api/v1/sections', { params, withCredentials: true });
            
            const fetchedSections = (sectionsRes.data.sections || []).map((s: any) => ({ id: s.id, name: `Section: ${s.name}` }));
            const combined = [{ id: 'ALL', name: 'Global Default (All Sections)' }, ...fetchedSections];
            
            setClassCategories(combined);
            setSelectedCategory(combined[0].id);

            // Fetch Structure Configs
            const structRes = await axios.get(`${API}/structure`, { params: { resultType: selectedResultType }, withCredentials: true });
            if (structRes.data.config && Object.keys(structRes.data.config).length > 0) {
                setConfig(structRes.data.config);
            } else {
                setConfig({}); // Reset config on empty
            }
        } catch (err) {
            console.error('Failed to load data:', err);
        } finally {
            setLoading(false);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeSchoolType, selectedResultType]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Use fetched config for category, or fallback to the default 3-stage structure
    const getPartsForCategory = (cat: string) => {
        if (!cat) return [];
        if (config[cat]) return config[cat];
        return FALLBACK_PARTS;
    };

    const parts = getPartsForCategory(selectedCategory);
    const totalWeight = parts.reduce((sum, p) => sum + (Number(p.weight) || 0), 0);
    const isValid = totalWeight === 100;

    const handleUpdate = (id: string, field: keyof AssessmentPart, value: string | number) => {
        setSaved(false);
        setConfig(prev => ({
            ...prev,
            [selectedCategory]: getPartsForCategory(selectedCategory).map(p =>
                p.id === id ? { ...p, [field]: field === 'weight' ? Number(value) : value } : p
            )
        }));
    };

    const handleAdd = () => {
        setSaved(false);
        setConfig(prev => ({
            ...prev,
            [selectedCategory]: [...getPartsForCategory(selectedCategory), { id: Date.now().toString(), name: 'New Assessment', weight: 0 }]
        }));
    };

    const handleRemove = (id: string) => {
        setSaved(false);
        setConfig(prev => ({
            ...prev,
            [selectedCategory]: getPartsForCategory(selectedCategory).filter(p => p.id !== id)
        }));
    };

    const handleSave = async () => {
        if (!isValid) return;
        try {
            await axios.patch(`${API}/structure`, {
                category: selectedCategory,
                resultType: selectedResultType,
                parts: getPartsForCategory(selectedCategory)
            }, { withCredentials: true });

            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (error) {
            console.error('Failed to save assessment structure:', error);
            alert('Failed to save structure.');
        }
    };

    return (
        <div className="flex flex-col gap-6 w-full animate-in fade-in duration-500 max-w-5xl mx-auto font-dash pb-10 px-4 sm:px-6">
            {/* Page Header */}
            <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500 mb-2 overflow-x-auto whitespace-nowrap pb-1">
                <span className="font-semibold text-gray-900">Settings</span>
                <span>/</span>
                <span className="text-[#1E4DA6]">Assessment Structure</span>
            </div>

            <div className="w-full">
                {/* Tabs */}
                <div className="flex items-center gap-2">
                    <Button 
                        variant="ghost" 
                        onClick={() => setSelectedResultType('SCORE_BASED')}
                        className={`font-semibold text-sm px-6 py-6 rounded-none rounded-t-xl z-10 -mb-px transition-colors ${selectedResultType === 'SCORE_BASED' ? 'bg-white border hover:bg-white border-b-0 border-gray-200 text-[#1E4DA6] shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]' : 'bg-gray-50 text-gray-500 border border-transparent hover:bg-gray-100'}`}>
                        Score-Based
                    </Button>
                    <Button 
                        variant="ghost" 
                        onClick={() => setSelectedResultType('COMMENT_BASED')}
                        className={`font-semibold text-sm px-6 py-6 rounded-none rounded-t-xl z-10 -mb-px transition-colors ${selectedResultType === 'COMMENT_BASED' ? 'bg-white border hover:bg-white border-b-0 border-gray-200 text-[#1E4DA6] shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]' : 'bg-gray-50 text-gray-500 border border-transparent hover:bg-gray-100'}`}>
                        Comment-Based
                    </Button>
                </div>

                {/* Tab Content Window */}
                <div className="bg-white border border-gray-200 rounded-b-xl rounded-tr-xl p-4 sm:p-8 shadow-sm">
                    <div className="text-center mb-6 sm:mb-8">
                        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Configure Termly Assessments</h2>
                        <p className="text-xs sm:text-sm text-gray-500 mt-2 max-w-2xl mx-auto px-2">
                            Define the grading structure for your school. You can customize the number of tests, assignments,
                            and exams, and assign specific percentage weights to each. Total must equal 100%.
                        </p>
                    </div>

                    {loading ? (
                        <div className="py-20 flex justify-center text-gray-400">Loading configurations...</div>
                    ) : (
                        <>
                            {/* Class Category Selector */}
                            <div className="max-w-3xl mx-auto mb-8 bg-[#f8fafc] p-4 rounded-xl border border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                <div>
                                    <h3 className="font-semibold text-gray-900">Class Category</h3>
                                    <p className="text-xs text-gray-500 mt-0.5">Select a category to customize its specific grading structure.</p>
                                </div>
                                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                                    <SelectTrigger className="w-full sm:w-[240px] bg-white">
                                        <SelectValue placeholder="Select Category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {classCategories.length > 0 ? classCategories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>) : <SelectItem disabled value="none">No Sections Found</SelectItem>}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex flex-col gap-5 max-w-3xl mx-auto">
                                <div className="space-y-3">
                                    {parts.map((part, index) => (
                                        <Card key={part.id} className="p-4 border border-gray-100 shadow-sm flex flex-col sm:flex-row items-start sm:items-center gap-4 transition-all hover:border-gray-200 relative sm:static">
                                            <div className="flex bg-gray-50 w-8 h-8 rounded-lg items-center justify-center font-bold text-gray-400 text-sm shrink-0">
                                                {index + 1}
                                            </div>
                                            <div className="w-full flex-1 space-y-1">
                                                <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Assessment Name</Label>
                                                <Input
                                                    className="h-10 bg-white border-gray-200 shadow-sm focus-visible:ring-[#1E4DA6]/20 font-medium w-full"
                                                    value={part.name}
                                                    onChange={e => handleUpdate(part.id, 'name', e.target.value)}
                                                    placeholder="e.g. Mid-Term Test"
                                                />
                                            </div>
                                            <div className="w-full sm:w-32 space-y-1">
                                                <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Weight (%)</Label>
                                                <div className="relative">
                                                    <Input
                                                        type="number"
                                                        min="0"
                                                        max="100"
                                                        className="h-10 bg-white border-gray-200 shadow-sm pr-8 focus-visible:ring-[#1E4DA6]/20 font-bold text-center w-full"
                                                        value={part.weight || ''}
                                                        onChange={e => handleUpdate(part.id, 'weight', e.target.value)}
                                                    />
                                                    <Percent className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                                </div>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleRemove(part.id)}
                                                className="text-gray-400 hover:text-red-500 hover:bg-red-50 absolute top-2 right-2 sm:static sm:mt-5 shrink-0"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </Card>
                                    ))}
                                </div>

                                <Button
                                    variant="outline"
                                    onClick={handleAdd}
                                    className="bg-gray-50/50 border-dashed border-2 hover:bg-[#1E4DA6]/5 hover:border-[#1E4DA6]/30 hover:text-[#1E4DA6] text-gray-500 py-6"
                                >
                                    <Plus className="w-4 h-4 mr-2" /> Add Assessment Segment
                                </Button>

                                {/* Progress/Validation Bar */}
                                <div className="mt-8 p-6 rounded-xl border border-gray-100 bg-[#f8fafc]">
                                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-4 sm:mb-2 gap-2">
                                        <div>
                                            <h4 className="font-bold text-gray-900">Total Allocation</h4>
                                            <p className="text-xs text-gray-500">Combined weight must exactly equal 100%.</p>
                                        </div>
                                        <span className={`text-xl sm:text-2xl font-bold ${totalWeight === 100 ? 'text-[#10b981]' : totalWeight > 100 ? 'text-red-500' : 'text-[#ff9800]'}`}>
                                            {totalWeight}%
                                        </span>
                                    </div>

                                    <div className="h-3 w-full bg-gray-200 rounded-full overflow-hidden flex relative">
                                        {parts.map((p, i) => (
                                            <div
                                                key={p.id}
                                                className={`h-full border-r border-white/20 transition-all ${totalWeight > 100 ? 'bg-red-400' :
                                                    i % 2 === 0 ? 'bg-[#1E4DA6]' : 'bg-[#10b981]'
                                                    }`}
                                                style={{ width: `${(p.weight / Math.max(100, totalWeight)) * 100}%` }}
                                                title={`${p.name}: ${p.weight}%`}
                                            />
                                        ))}
                                    </div>

                                    {!isValid && (
                                        <div className="mt-3 flex items-center gap-2 text-sm text-red-500 bg-red-50 p-2.5 rounded-lg border border-red-100">
                                            <AlertCircle className="w-4 h-4" />
                                            <span>
                                                {totalWeight > 100
                                                    ? `Total exceeds 100% by ${totalWeight - 100}%. Please reduce weights.`
                                                    : `Total is incomplete. You need to assign ${100 - totalWeight}% more.`}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* Save Actions */}
                                <div className="w-full flex justify-center mt-6 pt-6 border-t border-gray-100">
                                    <Button
                                        onClick={handleSave}
                                        disabled={!isValid}
                                        className={`px-8 py-5 rounded-full font-bold shadow-md transition-all flex items-center gap-2 text-sm tracking-wide ${saved ? 'bg-[#10b981] text-white hover:bg-[#5da93e]' :
                                            isValid ? 'bg-[#1E4DA6] text-white hover:bg-[#173F8C]' :
                                                'bg-gray-100 text-gray-400 cursor-not-allowed'
                                            }`}
                                    >
                                        {saved ? (
                                            <>Saved Successfully!</>
                                        ) : (
                                            <><Save className="w-4 h-4" /> Save Curriculum Structure</>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
