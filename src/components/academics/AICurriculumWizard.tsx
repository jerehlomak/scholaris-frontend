import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BrainCircuit, X, BookOpen, ChevronRight, GraduationCap, CheckCircle2 } from 'lucide-react';
import { Button } from '../ui/button';

interface AICurriculumWizardProps {
    onClose: () => void;
    onGenerate: (config: any) => void;
}

export function AICurriculumWizard({ onClose, onGenerate }: AICurriculumWizardProps) {
    const [step, setStep] = useState(1);
    const [isGenerating, setIsGenerating] = useState(false);

    const [config, setConfig] = useState({
        classLevel: '',
        subject: '',
        academicTerm: 'First Term',
        weeks: 12,
        focusAreas: ['Core Concepts', 'Practical Applications', 'Exam Prep']
    });

    const handleGenerate = async () => {
        setIsGenerating(true);
        try {
            await onGenerate(config);
            // Parent handles closing the modal when generation is complete
        } catch (error) {
            console.error(error);
            setIsGenerating(false);
            alert("Failed to generate curriculum. Please check your API key.");
        }
    };

    const isStep1Valid = config.classLevel !== '' && config.subject !== '';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 font-dash">
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gradient-to-r from-[#0036a1]/5 to-transparent">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#0036a1]/10 flex items-center justify-center text-[#0036a1]">
                            <BookOpen className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-[#1e2230]">AI Scheme of Work Generator</h2>
                            <p className="text-sm text-gray-500">Draft a comprehensive 12-week curriculum instantly.</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content Body */}
                <div className="p-6 flex-1 overflow-y-auto">
                    {isGenerating ? (
                        <div className="py-16 flex flex-col items-center justify-center text-center space-y-6">
                            <div className="relative w-24 h-24 flex items-center justify-center">
                                {/* Outer pulsing rings */}
                                <motion.div
                                    animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0, 0.3] }}
                                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                                    className="absolute inset-0 rounded-full border-2 border-[#0036a1]/40"
                                />
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                                    className="absolute inset-0 rounded-full border-t-2 border-l-2 border-[#6bc048]/60 border-dashed"
                                />
                                {/* Center AI icon */}
                                <div className="w-16 h-16 bg-[#0036a1] rounded-full flex items-center justify-center shadow-lg relative z-10">
                                    <BrainCircuit className="w-8 h-8 text-white animate-pulse" />
                                </div>
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-[#1e2230] mb-2">Synthesizing Educational Standards...</h3>
                                <p className="text-gray-500 max-w-sm mx-auto text-sm">
                                    The AI is cross-referencing national pedagogical guidelines to construct a week-by-week layout for {config.subject} ({config.classLevel}).
                                </p>
                            </div>

                            {/* Simulated Progress Steps */}
                            <div className="w-full max-w-sm space-y-3 mt-4 text-left bg-gray-50 p-4 rounded-xl border border-gray-100">
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="flex items-center gap-3 text-sm text-[#0036a1] font-medium">
                                    <CheckCircle2 className="w-4 h-4 text-[#6bc048]" /> Extracting Core Topics for Term
                                </motion.div>
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }} className="flex items-center gap-3 text-sm text-[#0036a1] font-medium">
                                    <CheckCircle2 className="w-4 h-4 text-[#6bc048]" /> Formatting Weekly Sub-Topics
                                </motion.div>
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.5 }} className="flex items-center gap-3 text-sm text-gray-500">
                                    <div className="w-4 h-4 rounded-full border-2 border-gray-300 border-t-[#6bc048] animate-spin" /> Defining Learning Objectives
                                </motion.div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6">

                            {/* Step Indicator */}
                            <div className="flex items-center justify-between relative mb-8">
                                <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-gray-100 -z-10" />
                                {[1, 2].map((num) => (
                                    <div key={num} className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-4 border-white ${step === num ? 'bg-[#0036a1] text-white' : step > num ? 'bg-[#6bc048] text-white' : 'bg-gray-200 text-gray-500'}`}>
                                        {step > num ? <CheckCircle2 className="w-4 h-4" /> : num}
                                    </div>
                                ))}
                            </div>

                            <AnimatePresence mode="wait">
                                {step === 1 && (
                                    <motion.div
                                        key="step1"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        className="space-y-5"
                                    >
                                        <h3 className="text-lg font-bold text-[#1e2230] flex items-center gap-2">
                                            <GraduationCap className="w-5 h-5 text-[#0036a1]" /> Class & Subject Parameters
                                        </h3>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-gray-700">Select Section</label>
                                                <select
                                                    value={config.classLevel}
                                                    onChange={e => setConfig({ ...config, classLevel: e.target.value })}
                                                    className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-[#0036a1]/20 focus:border-[#0036a1] outline-none bg-gray-50"
                                                >
                                                    <option value="">Choose a class...</option>
                                                    <option value="Primary 1">Primary 1</option>
                                                    <option value="JSS 1">JSS 1</option>
                                                    <option value="SS 1">SS 1</option>
                                                    <option value="SS 3">SS 3</option>
                                                </select>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-gray-700">Subject Name</label>
                                                <input
                                                    type="text"
                                                    value={config.subject}
                                                    onChange={e => setConfig({ ...config, subject: e.target.value })}
                                                    placeholder="e.g. Mathematics, Biology..."
                                                    className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-[#0036a1]/20 focus:border-[#0036a1] outline-none bg-gray-50"
                                                />
                                            </div>
                                            <div className="space-y-2 sm:col-span-2">
                                                <label className="text-sm font-medium text-gray-700">Target Academic Term</label>
                                                <div className="flex gap-3">
                                                    {['First Term', 'Second Term', 'Third Term'].map(term => (
                                                        <label key={term} className={`flex-1 border rounded-lg p-3 text-center cursor-pointer transition-colors ${config.academicTerm === term ? 'border-[#0036a1] bg-[#0036a1]/5 text-[#0036a1] font-semibold' : 'border-gray-200 hover:border-gray-300 text-gray-600'}`}>
                                                            <input
                                                                type="radio"
                                                                className="hidden"
                                                                name="term"
                                                                checked={config.academicTerm === term}
                                                                onChange={() => setConfig({ ...config, academicTerm: term })}
                                                            />
                                                            {term}
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}

                                {step === 2 && (
                                    <motion.div
                                        key="step2"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        className="text-center py-4 space-y-6"
                                    >
                                        <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-2">
                                            <BrainCircuit className="w-10 h-10 text-[#6bc048]" />
                                        </div>
                                        <div>
                                            <h3 className="text-2xl font-bold text-[#1e2230] mb-2">Ready for AI Generation</h3>
                                            <p className="text-gray-500 max-w-sm mx-auto text-sm leading-relaxed">
                                                Skooly AI will now construct a comprehensive 12-week scheme of work mapping out all primary topics and learning objectives.
                                            </p>
                                        </div>

                                        <div className="bg-[#f8fafc] rounded-xl p-5 text-left max-w-md mx-auto space-y-3 border border-gray-100 shadow-sm">
                                            <div className="flex justify-between text-sm pb-2 border-b border-gray-100">
                                                <span className="text-gray-500">Subject:</span>
                                                <span className="font-bold text-[#0036a1]">{config.subject}</span>
                                            </div>
                                            <div className="flex justify-between text-sm pb-2 border-b border-gray-100">
                                                <span className="text-gray-500">Target Class:</span>
                                                <span className="font-semibold text-gray-800">{config.classLevel}</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-500">Term Span:</span>
                                                <span className="font-semibold text-gray-800">{config.academicTerm} ({config.weeks} Weeks)</span>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                {!isGenerating && (
                    <div className="p-5 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
                        <button
                            onClick={step === 1 ? onClose : () => setStep(step - 1)}
                            className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-800 transition-colors"
                        >
                            {step === 1 ? 'Cancel' : 'Back'}
                        </button>

                        {step === 1 ? (
                            <Button
                                onClick={() => setStep(2)}
                                disabled={!isStep1Valid}
                                className="bg-[#0036a1] hover:bg-[#001761] text-white flex items-center gap-2 px-6 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Continue <ChevronRight className="w-4 h-4" />
                            </Button>
                        ) : (
                            <Button
                                onClick={handleGenerate}
                                className="bg-gradient-to-r from-[#0036a1] to-[#0033cc] hover:from-[#001761] hover:to-[#0036a1] text-white flex items-center gap-2 px-6 shadow-md"
                            >
                                <BrainCircuit className="w-4 h-4" /> Build Curriculum
                            </Button>
                        )}
                    </div>
                )}
            </motion.div>
        </div>
    );
}
