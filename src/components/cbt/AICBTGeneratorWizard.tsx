import { useState } from 'react';
import { motion } from 'framer-motion';
import { BrainCircuit, X, Sparkles, ChevronRight, CheckCircle2 } from 'lucide-react';
import { Button } from '../ui/button';
import type { QuestionConfig, GeneratedQuestion } from '../../lib/cbt-engine';
import { generateCBTQuestions } from '../../lib/cbt-engine';

interface AICBTGeneratorWizardProps {
    onClose: () => void;
    onQuestionsGenerated: (questions: GeneratedQuestion[]) => void;
    subjectName: string;
}

export function AICBTGeneratorWizard({ onClose, onQuestionsGenerated, subjectName }: AICBTGeneratorWizardProps) {
    const [isGenerating, setIsGenerating] = useState(false);

    const [config, setConfig] = useState<QuestionConfig>({
        subject: subjectName,
        topic: '',
        count: 5,
        difficulty: 'Medium'
    });

    const handleGenerate = async () => {
        if (!config.topic) return;
        setIsGenerating(true);
        try {
            const questions = await generateCBTQuestions(config);
            onQuestionsGenerated(questions);
            onClose();
        } catch (error: any) {
            console.error(error);
            alert("Generation failed: " + error.message);
            setIsGenerating(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 font-dash">
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 30 }}
                className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh] border border-white/20"
            >
                {/* Header */}
                <div className="flex items-center justify-between p-8 bg-gradient-to-br from-[#1E4DA6] to-[#001c52] text-white">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center border border-white/20 shadow-inner">
                            <BrainCircuit className="w-7 h-7 text-white" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black tracking-tight">AI Exam Drafter</h2>
                            <p className="text-xs text-white/70 font-bold uppercase tracking-widest mt-0.5">Powered by Skooly Intelligence</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-white/50 hover:text-white rounded-full transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-10 flex-1 overflow-y-auto">
                    {isGenerating ? (
                        <div className="py-12 flex flex-col items-center justify-center text-center space-y-8">
                            <div className="relative w-32 h-32 flex items-center justify-center">
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                                    className="absolute inset-0 rounded-full border-4 border-[#1E4DA6]/10 border-t-[#1E4DA6]"
                                />
                                <motion.div
                                    animate={{ scale: [1, 1.2, 1] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                    className="w-20 h-20 bg-gradient-to-br from-[#1E4DA6] to-[#010c29] rounded-[2rem] flex items-center justify-center shadow-xl"
                                >
                                    <Sparkles className="w-10 h-10 text-white animate-pulse" />
                                </motion.div>
                            </div>
                            <div className="space-y-4">
                                <h3 className="text-2xl font-black text-gray-900 leading-tight">Thinking deeply...</h3>
                                <p className="text-gray-500 max-w-xs mx-auto text-sm font-medium">
                                    Our AI is analyzing {config.subject} pedagogy to craft high-quality {config.difficulty} questions on <span className="text-[#1E4DA6] font-bold">"{config.topic}"</span>.
                                </p>
                            </div>
                            <div className="w-full max-w-xs bg-gray-50 p-2 rounded-2xl border border-gray-100 flex items-center gap-3">
                                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                                    <CheckCircle2 size={18} />
                                </div>
                                <span className="text-xs font-black text-emerald-700 tracking-wider">SECURE CONNECTION ESTABLISHED</span>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-8">
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Knowledge Subject</label>
                                    <div className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-sm font-bold text-gray-900 transition-all">
                                        {config.subject}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Focus Topic <span className="text-red-500">*</span></label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Photosynthesis, Trigonometry..."
                                        value={config.topic}
                                        onChange={e => setConfig({ ...config, topic: e.target.value })}
                                        className="w-full bg-white border-2 border-gray-100 rounded-2xl px-5 py-4 text-sm font-bold text-gray-900 focus:border-[#1E4DA6] focus:ring-4 focus:ring-[#1E4DA6]/5 outline-none transition-all placeholder:text-gray-300"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Question Count</label>
                                        <select
                                            value={config.count}
                                            onChange={e => setConfig({ ...config, count: parseInt(e.target.value) })}
                                            className="w-full bg-white border-2 border-gray-100 rounded-2xl px-5 py-4 text-sm font-bold text-gray-900 focus:border-[#1E4DA6] outline-none transition-all"
                                        >
                                            {[5, 10, 15, 20].map(c => <option key={c} value={c}>{c} Questions</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Difficulty</label>
                                        <select
                                            value={config.difficulty}
                                            onChange={e => setConfig({ ...config, difficulty: e.target.value as any })}
                                            className="w-full bg-white border-2 border-gray-100 rounded-2xl px-5 py-4 text-sm font-bold text-gray-900 focus:border-[#1E4DA6] outline-none transition-all"
                                        >
                                            {['Easy', 'Medium', 'Hard'].map(d => <option key={d} value={d}>{d}</option>)}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <Button
                                onClick={handleGenerate}
                                disabled={!config.topic}
                                className="w-full h-16 bg-[#1E4DA6] hover:bg-[#173F8C] text-white rounded-[1.5rem] font-black text-sm uppercase tracking-widest shadow-xl shadow-[#1E4DA6]/20 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-3"
                            >
                                <BrainCircuit className="w-5 h-5 shadow-inner" /> 
                                Draft with AI
                                <ChevronRight className="w-4 h-4 ml-auto" />
                            </Button>
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
