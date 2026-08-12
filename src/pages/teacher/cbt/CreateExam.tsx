import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import { 
    ChevronLeft, CheckCircle, Save, Plus, Trash, 
    Clock, FileText, Search, Loader2, Sparkles, PlusCircle
} from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Card } from '../../../components/ui/card';
import { toast } from 'sonner';
import { AICBTGeneratorWizard } from '../../../components/cbt/AICBTGeneratorWizard';
import { ManualQuestionForm } from '../../../components/cbt/ManualQuestionForm';
import type { GeneratedQuestion } from '../../../lib/cbt-engine';

const API = import.meta.env.VITE_API_URL || '/api/v1';

interface Question {
    id: string;
    questionText: string;
    type: string;
    options: string[];
    correctAnswer: string;
    marks: number;
}

export default function CreateExam() {
    const navigate = useNavigate();
    const { id } = useParams(); // id for editing
    const isEdit = !!id;

    // Loading states
    const [loading, setLoading] = useState(isEdit);
    const [submitting, setSubmitting] = useState(false);

    // Form data
    const [formData, setFormData] = useState({
        title: '',
        instructions: '',
        classId: '',
        subjectId: '',
        durationMinutes: 60,
        passingMarks: 40,
        status: 'DRAFT'
    });

    // Lists
    const [classes, setClasses] = useState<any[]>([]);
    const [assignedSubjects, setAssignedSubjects] = useState<any[]>([]);
    const [questionBank, setQuestionBank] = useState<Question[]>([]);
    const [selectedQuestions, setSelectedQuestions] = useState<Question[]>([]);
    const [searchQuery, setSearchQuery] = useState('');

    // Question Modal state
    const [showBank, setShowBank] = useState(false);
    const [showAIWizard, setShowAIWizard] = useState(false);
    const [showManualForm, setShowManualForm] = useState(false);

    // Initial Fetch
    useEffect(() => {
        const fetchMeta = async () => {
            try {
                const res = await axios.get(`${API}/teachers/me/classes`, { withCredentials: true });
                setClasses(res.data.classes || []);
                
                if (isEdit) {
                    const examRes = await axios.get(`${API}/cbt/exams/${id}`, { withCredentials: true });
                    const e = examRes.data.exam;
                    setFormData({
                        title: e.title,
                        instructions: e.instructions || '',
                        classId: e.classId,
                        subjectId: e.subjectId,
                        durationMinutes: e.durationMinutes,
                        passingMarks: e.passingMarks,
                        status: e.status
                    });
                    setSelectedQuestions(e.examQuestions.map((eq: any) => eq.question));
                    
                    // Trigger subject fetch for the selected class
                    const cls = res.data.classes.find((c: any) => c.id === e.classId);
                    if (cls) setAssignedSubjects(cls.mySubjects || []);
                }
            } catch (error) {
                toast.error('Failed to load metadata');
            } finally {
                setLoading(false);
            }
        };
        fetchMeta();
    }, [isEdit, id]);

    // Subject Sync
    const handleClassChange = (classId: string) => {
        setFormData(prev => ({ ...prev, classId, subjectId: '' }));
        const cls = classes.find(c => c.id === classId);
        setAssignedSubjects(cls?.mySubjects || []);
        setQuestionBank([]);
    };

    // Question Bank Fetch
    const fetchQuestionBank = async () => {
        if (!formData.subjectId) {
            toast.error('Please select a subject first');
            return;
        }
        try {
            const res = await axios.get(`${API}/cbt/questions`, { 
                params: { subjectId: formData.subjectId },
                withCredentials: true 
            });
            setQuestionBank(res.data.questions || []);
            setShowBank(true);
        } catch (error) {
            toast.error('Failed to fetch question bank');
        }
    };

    const toggleQuestion = (q: Question) => {
        if (selectedQuestions.some(sq => sq.id === q.id)) {
            setSelectedQuestions(prev => prev.filter(sq => sq.id !== q.id));
        } else {
            setSelectedQuestions(prev => [...prev, q]);
        }
    };

    const handleNewQuestions = async (newQs: GeneratedQuestion[]) => {
        if (!formData.subjectId) {
            toast.error("Subject ID is missing");
            return;
        }
        
        const loadingToast = toast.loading("Saving new questions to bank...");
        try {
            const savedQs = await Promise.all(newQs.map(async (q) => {
                const res = await axios.post(`${API}/cbt/questions`, {
                    ...q,
                    subjectId: formData.subjectId
                }, { withCredentials: true });
                return res.data.question;
            }));
            
            setSelectedQuestions(prev => [...prev, ...savedQs]);
            toast.success(`${savedQs.length} questions added successfully`, { id: loadingToast });
        } catch (error) {
            toast.error("Failed to save some questions to bank", { id: loadingToast });
        }
    };

    const handleSubmit = async (publish = false) => {
        if (!formData.title || !formData.classId || !formData.subjectId) {
            toast.error('Please fill required fields');
            return;
        }
        if (selectedQuestions.length === 0) {
            toast.error('Please add at least one question');
            return;
        }

        setSubmitting(true);
        try {
            const payload = {
                ...formData,
                status: publish ? 'PUBLISHED' : formData.status,
                questionIds: selectedQuestions.map(q => q.id)
            };

            if (isEdit) {
                await axios.patch(`${API}/cbt/exams/${id}`, payload, { withCredentials: true });
                toast.success('Exam updated successfully');
            } else {
                await axios.post(`${API}/cbt/exams`, payload, { withCredentials: true });
                toast.success('Exam created successfully');
            }
            navigate('/teacher/cbt');
        } catch (error: any) {
            toast.error(error.response?.data?.msg || 'Operation failed');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="p-20 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-[#0036a1]" /></div>;

    return (
        <div className="max-w-[1000px] mx-auto w-full font-dash pb-20">
            {/* Header */}
            <div className="flex items-center justify-between mb-8 group">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/teacher/cbt')} className="w-10 h-10 rounded-full border border-gray-100 flex items-center justify-center hover:bg-gray-50 transition-colors">
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{isEdit ? 'Edit Exam' : 'Create New Exam'}</h1>
                        <p className="text-sm text-gray-500 mt-0.5">Define your assessment parameters and questions</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" onClick={() => handleSubmit(false)} disabled={submitting} className="h-10">
                        <Save className="w-4 h-4 mr-2" /> {isEdit ? 'Update' : 'Save Draft'}
                    </Button>
                    <Button onClick={() => handleSubmit(true)} disabled={submitting} className="h-10 bg-[#0036a1] hover:bg-[#001761]">
                        <CheckCircle className="w-4 h-4 mr-2" /> {isEdit && formData.status === 'PUBLISHED' ? 'Update & Sync' : 'Publish to Students'}
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left: Settings */}
                <div className="lg:col-span-1 space-y-6">
                    <Card className="p-6 bg-white border border-gray-100 shadow-sm space-y-5">
                        <h3 className="font-bold text-gray-900 flex items-center gap-2">
                            <Plus className="w-4 h-4 text-[#0036a1]" /> Basic Configuration
                        </h3>
                        
                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-gray-400 uppercase">Exam Title <span className="text-red-500">*</span></label>
                                <input 
                                    type="text" 
                                    placeholder="e.g. Mid-Term Genetics Test"
                                    value={formData.title}
                                    onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm outline-none focus:border-[#0036a1] transition-all"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-gray-400 uppercase">Class Arm <span className="text-red-500">*</span></label>
                                <select 
                                    value={formData.classId}
                                    onChange={e => handleClassChange(e.target.value)}
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm outline-none focus:border-[#0036a1] cursor-pointer"
                                >
                                    <option value="">Select Class</option>
                                    {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-gray-400 uppercase">Subject <span className="text-red-500">*</span></label>
                                <select 
                                    value={formData.subjectId}
                                    onChange={e => setFormData(prev => ({ ...prev, subjectId: e.target.value }))}
                                    disabled={!formData.classId}
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm outline-none focus:border-[#0036a1] cursor-pointer disabled:opacity-50"
                                >
                                    <option value="">Select Subject</option>
                                    {assignedSubjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-6 bg-white border border-gray-100 shadow-sm space-y-5">
                        <h3 className="font-bold text-gray-900 flex items-center gap-2">
                            <Clock className="w-4 h-4 text-[#ff9800]" /> Timing & Pass Mark
                        </h3>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-gray-400 uppercase">Duration (mins)</label>
                                <input 
                                    type="number" 
                                    value={formData.durationMinutes}
                                    onChange={e => setFormData(prev => ({ ...prev, durationMinutes: parseInt(e.target.value) }))}
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm outline-none focus:border-[#0036a1]"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-gray-400 uppercase">Passing %</label>
                                <input 
                                    type="number" 
                                    value={formData.passingMarks}
                                    onChange={e => setFormData(prev => ({ ...prev, passingMarks: parseInt(e.target.value) }))}
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm outline-none focus:border-[#0036a1]"
                                />
                            </div>
                        </div>
                    </Card>

                    <Card className="p-6 bg-white border border-gray-100 shadow-sm space-y-4">
                         <h3 className="font-bold text-gray-900 flex items-center gap-2">
                            <FileText className="w-4 h-4 text-purple-600" /> Instructions
                        </h3>
                        <textarea 
                            rows={4}
                            placeholder="Provide exam rules or instructions here..."
                            value={formData.instructions}
                            onChange={e => setFormData(prev => ({ ...prev, instructions: e.target.value }))}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm outline-none focus:border-[#0036a1] resize-none transition-all placeholder:text-gray-300"
                        />
                    </Card>
                </div>

                {/* Right: Question Picker/Manager */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-black text-gray-900">Questions ({selectedQuestions.length})</h3>
                            <p className="text-xs text-gray-400">Add questions from bank or create new ones</p>
                        </div>
                        <div className="flex gap-2">
                            <Button onClick={fetchQuestionBank} variant="outline" className="h-9 gap-2 border-[#0036a1] text-[#0036a1] hover:bg-[#0036a1]/5">
                                <Search className="w-4 h-4" /> Import from Bank
                            </Button>
                            <Button onClick={() => setShowAIWizard(true)} variant="outline" className="h-9 gap-2 border-purple-600 text-purple-600 hover:bg-purple-50">
                                <Sparkles className="w-4 h-4" /> AI Draft
                            </Button>
                            <Button onClick={() => setShowManualForm(true)} variant="outline" className="h-9 gap-2">
                                <PlusCircle className="w-4 h-4" /> Add Manual
                            </Button>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {selectedQuestions.length === 0 ? (
                            <div className="p-20 text-center border-2 border-dashed border-gray-100 rounded-3xl bg-gray-50/50">
                                <FileText className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                                <h4 className="font-bold text-gray-400">No questions selected</h4>
                                <p className="text-xs text-gray-400 mt-1">Select from the bank or add manually to start</p>
                            </div>
                        ) : (
                            selectedQuestions.map((q, idx) => (
                                <Card key={q.id} className="p-5 border border-gray-100 shadow-sm relative group overflow-hidden">
                                     <div className="absolute left-0 top-0 bottom-0 w-1 bg-gray-100 group-hover:bg-[#0036a1] transition-colors" />
                                     <div className="flex gap-4">
                                        <div className="shrink-0 pt-1">
                                            <div className="w-7 h-7 rounded-lg bg-gray-100 text-gray-500 flex items-center justify-center font-bold text-xs">{idx + 1}</div>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-gray-900 leading-relaxed mb-4">{q.questionText}</p>
                                            <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                                                {q.options.map((opt, i) => (
                                                    <div key={i} className={`text-xs p-2 rounded-lg border ${opt === q.correctAnswer ? 'bg-green-50 border-green-100 text-green-700' : 'bg-gray-50 border-gray-50 text-gray-500'}`}>
                                                        <span className="font-black mr-2">{String.fromCharCode(65 + i)}.</span> {opt}
                                                        {opt === q.correctAnswer && <CheckCircle className="w-3 h-3 inline ml-2" />}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button size="sm" variant="ghost" onClick={() => toggleQuestion(q)} className="h-8 w-8 p-0 text-red-500 hover:bg-red-50">
                                                <Trash className="w-4 h-4" />
                                            </Button>
                                        </div>
                                     </div>
                                </Card>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Question Bank Modal */}
            {showBank && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-sm p-4">
                    <Card className="w-full max-w-2xl bg-white shadow-2xl rounded-3xl overflow-hidden flex flex-col max-h-[85vh]">
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 tracking-tight">Question Bank</h3>
                                <p className="text-xs text-gray-400 mt-0.5">{questionBank.length} questions found in bank</p>
                            </div>
                            <Button variant="ghost" onClick={() => setShowBank(false)} className="rounded-full">✕</Button>
                        </div>
                        
                        <div className="p-4 bg-gray-50/50 border-b border-gray-100">
                             <div className="relative">
                                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                <input 
                                    type="text" 
                                    placeholder="Search by keyword..."
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#0036a1]"
                                />
                             </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-4">
                            {questionBank.filter(q => q.questionText.toLowerCase().includes(searchQuery.toLowerCase())).map(q => {
                                const isSelected = selectedQuestions.some(sq => sq.id === q.id);
                                return (
                                    <div key={q.id} onClick={() => toggleQuestion(q)} className={`p-4 rounded-2xl border transition-all cursor-pointer group ${isSelected ? 'border-[#0036a1] bg-[#0036a1]/5' : 'border-gray-100 hover:border-gray-200 bg-white'}`}>
                                        <div className="flex items-start gap-3">
                                            <div className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${isSelected ? 'bg-[#0036a1] border-[#0036a1]' : 'border-gray-300'}`}>
                                                {isSelected && <CheckCircle className="w-3 h-3 text-white" />}
                                            </div>
                                            <div>
                                                <p className="font-bold text-sm text-gray-900 leading-snug">{q.questionText}</p>
                                                <div className="mt-2 flex gap-3 text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                                                    <span>{q.type}</span>
                                                    <span>•</span>
                                                    <span>{q.marks} Marks</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="p-6 border-t border-gray-100 flex justify-between items-center bg-gray-50/30">
                            <p className="text-sm text-gray-500 font-medium">{selectedQuestions.length} Selected</p>
                            <Button onClick={() => setShowBank(false)} className="bg-[#0036a1] hover:bg-[#001761]">Done Selecting</Button>
                        </div>
                    </Card>
                </div>
            )}

            {/* AI Wizard */}
            {showAIWizard && (
                <AICBTGeneratorWizard 
                    onClose={() => setShowAIWizard(false)}
                    onQuestionsGenerated={handleNewQuestions}
                    subjectName={classes.find(c => c.id === formData.classId)?.mySubjects?.find((s: any) => s.id === formData.subjectId)?.name || 'Subject'}
                />
            )}

            {/* Manual Form */}
            {showManualForm && (
                <ManualQuestionForm 
                    onClose={() => setShowManualForm(false)}
                    onAdd={(q) => handleNewQuestions([q])}
                />
            )}
        </div>
    );
}
