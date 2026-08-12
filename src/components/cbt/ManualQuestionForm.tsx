import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, X, CheckCircle2, ChevronRight, Save } from 'lucide-react';
import { Button } from '../ui/button';
import type { GeneratedQuestion } from '../../lib/cbt-engine';

interface ManualQuestionFormProps {
    onClose: () => void;
    onAdd: (question: GeneratedQuestion) => void;
}

export function ManualQuestionForm({ onClose, onAdd }: ManualQuestionFormProps) {
    const [formData, setFormData] = useState<GeneratedQuestion>({
        questionText: '',
        type: 'MULTIPLE_CHOICE',
        options: ['', '', '', ''],
        correctAnswer: '',
        marks: 1
    });

    const handleOptionChange = (idx: number, val: string) => {
        const newOpts = [...formData.options];
        newOpts[idx] = val;
        setFormData({ ...formData, options: newOpts });
    };

    const isValid = formData.questionText && formData.options.every(o => o.trim() !== '') && formData.correctAnswer;

    const handleSubmit = () => {
        if (!isValid) return;
        onAdd(formData);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 font-dash">
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 30 }}
                className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] border border-white/20"
            >
                {/* Header */}
                <div className="flex items-center justify-between p-8 bg-gray-50 border-b border-gray-100">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-[#0036a1] flex items-center justify-center shadow-lg shadow-[#0036a1]/20">
                            <Plus className="w-7 h-7 text-white" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-gray-900 tracking-tight">Custom Question</h2>
                            <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em] mt-0.5">Craft individual assessment items</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-900 rounded-full transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-10 flex-1 overflow-y-auto space-y-8">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Question Content <span className="text-red-500">*</span></label>
                        <textarea
                            rows={3}
                            placeholder="Type your question prompt here..."
                            value={formData.questionText}
                            onChange={e => setFormData({ ...formData, questionText: e.target.value })}
                            className="w-full bg-gray-50 border-2 border-gray-50 rounded-2xl px-5 py-4 text-sm font-bold text-gray-900 focus:bg-white focus:border-[#0036a1] focus:ring-4 focus:ring-[#0036a1]/5 outline-none transition-all placeholder:text-gray-300 resize-none"
                        />
                    </div>

                    <div className="space-y-6">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Options & Correct Answer Selection</label>
                        <div className="grid grid-cols-1 gap-3">
                            {formData.options.map((opt, i) => {
                                const isCorrect = formData.correctAnswer === opt && opt !== '';
                                return (
                                    <div key={i} className={`flex items-center gap-4 p-2 rounded-2xl border-2 transition-all ${isCorrect ? 'border-emerald-500 bg-emerald-50' : 'border-gray-50 bg-gray-50/50'}`}>
                                        <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center font-black text-sm text-gray-400 shrink-0 shadow-sm">
                                            {String.fromCharCode(65 + i)}
                                        </div>
                                        <input
                                            type="text"
                                            placeholder={`Option ${i + 1}`}
                                            value={opt}
                                            onChange={e => handleOptionChange(i, e.target.value)}
                                            className="flex-1 bg-transparent border-none outline-none text-sm font-bold text-gray-700"
                                        />
                                        <button
                                            onClick={() => setFormData({ ...formData, correctAnswer: opt })}
                                            className={`h-10 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${isCorrect ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-white text-gray-300 hover:text-[#0036a1]'}`}
                                        >
                                            {isCorrect ? <CheckCircle2 size={16} /> : 'Correct?'}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Mark Value</label>
                        <div className="flex gap-4">
                            {[1, 2, 3, 5].map(m => (
                                <button
                                    key={m}
                                    onClick={() => setFormData({ ...formData, marks: m })}
                                    className={`flex-1 h-14 rounded-2xl font-black text-sm transition-all border-2 ${formData.marks === m ? 'bg-[#0036a1] text-white border-[#0036a1] shadow-lg shadow-[#0036a1]/10' : 'bg-gray-50 text-gray-400 border-gray-50 hover:border-gray-100 hover:bg-gray-100'}`}
                                >
                                    {m} Pt{m > 1 ? 's' : ''}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-8 bg-gray-50 border-t border-gray-100">
                    <Button
                        onClick={handleSubmit}
                        disabled={!isValid}
                        className="w-full h-16 bg-gray-900 hover:bg-black text-white rounded-[1.5rem] font-black text-sm uppercase tracking-widest shadow-xl transition-all active:scale-95 disabled:opacity-30 flex items-center justify-center gap-3"
                    >
                        <Save className="w-5 h-5" />
                        Save Question to Exam
                        <ChevronRight className="w-4 h-4 ml-2 opacity-50" />
                    </Button>
                </div>
            </motion.div>
        </div>
    );
}
