import { useState } from 'react';
import { motion } from 'framer-motion';
import { BrainCircuit, X, CheckCircle2, ChevronRight, Settings } from 'lucide-react';
import { Button } from '../ui/button';

interface AIGeneratorWizardProps {
    onClose: () => void;
    onGenerate: (config: any) => void;
}

export function AIGeneratorWizard({ onClose, onGenerate }: AIGeneratorWizardProps) {
    const [step, setStep] = useState(1);
    const [isGenerating, setIsGenerating] = useState(false);

    // Mock configuration state
    const [config, setConfig] = useState({
        days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        periodsPerDay: 8,
        includeBreaks: true,
        breakAfterPeriod: 4,
        classes: ['JSS 1', 'JSS 2', 'JSS 3', 'SS 1', 'SS 2', 'SS 3'],
    });

    const handleGenerate = () => {
        setIsGenerating(true);
        // Simulate AI thinking time
        setTimeout(() => {
            onGenerate(config);
            setIsGenerating(false);
        }, 3000); // 3 seconds of "thinking"
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 font-dash">
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gradient-to-r from-[#0036a1]/5 to-transparent">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#0036a1]/10 flex items-center justify-center text-[#0036a1]">
                            <BrainCircuit className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-[#1e2230]">AI Timetable Generator</h2>
                            <p className="text-sm text-gray-500">Smartly allocate teachers and classes without conflicts.</p>
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
                                    animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                                    className="absolute inset-0 rounded-full border-2 border-[#0036a1]/30"
                                />
                                <motion.div
                                    animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0, 0.3] }}
                                    transition={{ duration: 2, delay: 0.5, repeat: Infinity, ease: "easeInOut" }}
                                    className="absolute inset-0 rounded-full border-2 border-[#6bc048]/30"
                                />
                                {/* Center brain */}
                                <div className="w-16 h-16 bg-[#0036a1] rounded-full flex items-center justify-center shadow-lg relative z-10">
                                    <BrainCircuit className="w-8 h-8 text-white animate-pulse" />
                                </div>
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-[#1e2230] mb-2">Analyzing Constraints...</h3>
                                <p className="text-gray-500 max-w-sm mx-auto">
                                    The AI is cross-referencing teacher availability, subject requirements, and classroom capacities to build a perfect, conflict-free schedule.
                                </p>
                            </div>

                            {/* Simulated Progress Steps */}
                            <div className="w-full max-w-xs space-y-3 mt-4 text-left">
                                <motion.div
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.5 }}
                                    className="flex items-center gap-2 text-sm text-[#0036a1]"
                                >
                                    <CheckCircle2 className="w-4 h-4" /> Mapping {config.classes.length} distinct classes
                                </motion.div>
                                <motion.div
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 1.5 }}
                                    className="flex items-center gap-2 text-sm text-[#0036a1]"
                                >
                                    <CheckCircle2 className="w-4 h-4" /> Evaluating teacher workloads
                                </motion.div>
                                <motion.div
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 2.5 }}
                                    className="flex items-center gap-2 text-sm text-gray-500"
                                >
                                    <div className="w-4 h-4 rounded-full border-2 border-gray-300 border-t-[#6bc048] animate-spin" /> Finalizing grid placement
                                </motion.div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6">

                            {/* Step Indicator */}
                            <div className="flex items-center justify-between relative mb-8">
                                <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-gray-100 -z-10" />
                                {[1, 2, 3].map((num) => (
                                    <div key={num} className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-4 border-white ${step >= num ? 'bg-[#0036a1] text-white' : 'bg-gray-200 text-gray-500'}`}>
                                        {num}
                                    </div>
                                ))}
                            </div>

                            {step === 1 && (
                                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                                    <h3 className="text-lg font-bold text-[#1e2230] mb-4 flex items-center gap-2">
                                        <Settings className="w-5 h-5 text-[#0036a1]" /> Basic Configuration
                                    </h3>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-sm font-medium text-gray-700 block mb-1">Working Days</label>
                                            <div className="flex flex-wrap gap-2">
                                                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => (
                                                    <button
                                                        key={day}
                                                        onClick={() => {
                                                            const newDays = config.days.includes(day)
                                                                ? config.days.filter(d => d !== day)
                                                                : [...config.days, day];
                                                            setConfig({ ...config, days: newDays });
                                                        }}
                                                        className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${config.days.includes(day) ? 'bg-[#0036a1]/10 border-[#0036a1]/30 text-[#0036a1]' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                                                    >
                                                        {day}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-sm font-medium text-gray-700 block mb-1">Periods per Day</label>
                                                <input
                                                    type="number"
                                                    value={config.periodsPerDay}
                                                    onChange={e => setConfig({ ...config, periodsPerDay: parseInt(e.target.value) || 8 })}
                                                    className="w-full border border-gray-200 rounded-md p-2 text-sm focus:ring-1 focus:ring-[#0036a1] focus:border-[#0036a1] outline-none"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-sm font-medium text-gray-700 block mb-1">Break Time After</label>
                                                <select
                                                    value={config.breakAfterPeriod}
                                                    onChange={e => setConfig({ ...config, breakAfterPeriod: parseInt(e.target.value) || 4 })}
                                                    className="w-full border border-gray-200 rounded-md p-2 text-sm focus:ring-1 focus:ring-[#0036a1] focus:border-[#0036a1] outline-none"
                                                >
                                                    {[2, 3, 4, 5].map(p => <option key={p} value={p}>Period {p}</option>)}
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {step === 2 && (
                                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                                    <h3 className="text-lg font-bold text-[#1e2230] mb-4">Select target classes</h3>
                                    <p className="text-sm text-gray-500 mb-4">Choose which sections the AI should generate schedules for right now. You can run this individually or for the whole school.</p>

                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                        {['JSS 1', 'JSS 2', 'JSS 3', 'SS 1', 'SS 2', 'SS 3', 'Primary 1', 'Primary 2'].map(cls => (
                                            <div
                                                key={cls}
                                                onClick={() => {
                                                    const newClasses = config.classes.includes(cls)
                                                        ? config.classes.filter(c => c !== cls)
                                                        : [...config.classes, cls];
                                                    setConfig({ ...config, classes: newClasses });
                                                }}
                                                className={`p-3 rounded-lg border-2 cursor-pointer transition-all flex items-center justify-between ${config.classes.includes(cls)
                                                        ? 'border-[#6bc048] bg-[#6bc048]/5'
                                                        : 'border-gray-100 hover:border-gray-200'
                                                    }`}
                                            >
                                                <span className="font-semibold text-gray-700">{cls}</span>
                                                {config.classes.includes(cls) && <CheckCircle2 className="w-5 h-5 text-[#6bc048]" />}
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            )}

                            {step === 3 && (
                                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="text-center py-6">
                                    <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <BrainCircuit className="w-10 h-10 text-[#6bc048]" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-[#1e2230] mb-2">Ready to Generate</h3>
                                    <p className="text-gray-500 max-w-md mx-auto mb-6">
                                        The AI algorithm is ready to construct a conflict-free schedule for {config.classes.length} classes across {config.days.length} days.
                                    </p>

                                    <div className="bg-gray-50 rounded-lg p-4 text-left max-w-sm mx-auto space-y-2 mb-6 border border-gray-100">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500">Days Active:</span>
                                            <span className="font-semibold text-gray-800">{config.days.length} Days</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500">Total Periods/Day:</span>
                                            <span className="font-semibold text-gray-800">{config.periodsPerDay}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500">Classes to Schedule:</span>
                                            <span className="font-semibold text-gray-800">{config.classes.map(c => c.split(' ')[0]).join(', ')}</span>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                {!isGenerating && (
                    <div className="p-6 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
                        <button
                            onClick={step === 1 ? onClose : () => setStep(step - 1)}
                            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                        >
                            {step === 1 ? 'Cancel' : 'Back'}
                        </button>

                        {step < 3 ? (
                            <Button
                                onClick={() => setStep(step + 1)}
                                className="bg-[#0036a1] hover:bg-[#001761] text-white flex items-center gap-2"
                            >
                                Continue <ChevronRight className="w-4 h-4" />
                            </Button>
                        ) : (
                            <Button
                                onClick={handleGenerate}
                                className="bg-gradient-to-r from-[#0036a1] to-[#0033cc] hover:from-[#001761] hover:to-[#0036a1] text-white flex items-center gap-2 px-6 shadow-md"
                            >
                                <BrainCircuit className="w-4 h-4" /> Generate Timetable
                            </Button>
                        )}
                    </div>
                )}
            </motion.div>
        </div>
    );
}
