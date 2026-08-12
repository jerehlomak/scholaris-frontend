import { Printer, Download, BookText, AlignLeft, CheckSquare, Target, Clock, MessageSquare } from 'lucide-react';
import type { GeneratedLessonNote } from '../../lib/lesson-note-engine';

interface LessonNoteDocumentProps {
    note: GeneratedLessonNote;
}

export function LessonNoteDocument({ note }: LessonNoteDocumentProps) {
    const { metadata, content } = note || {};

    if (!metadata || !content) return null;

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden font-dash max-w-4xl mx-auto">
            {/* Toolbar */}
            <div className="p-4 border-b border-gray-100 bg-[#f8fafc] flex justify-between items-center">
                <div className="flex items-center gap-2 text-sm text-gray-500 font-medium">
                    <BookText className="w-5 h-5 text-[#ff9800]" />
                    Generated Lesson Plan Document
                </div>
                <div className="flex gap-2">
                    <button className="p-2 text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 rounded-md transition-colors shadow-sm" title="Print">
                        <Printer className="w-4 h-4" />
                    </button>
                    <button className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-[#0036a1] hover:bg-[#001761] rounded-md transition-colors shadow-sm">
                        <Download className="w-4 h-4" /> Download PDF
                    </button>
                </div>
            </div>

            {/* Document "Paper" Body */}
            <div className="p-8 sm:p-12">
                {/* Header Information */}
                <div className="border-b-2 border-[#0036a1] pb-6 mb-8 text-center sm:text-left">
                    <h1 className="text-3xl font-bold text-[#1e2230] mb-4">{metadata?.topic}</h1>
                    <div className="flex flex-col sm:flex-row gap-4 sm:gap-8 text-sm text-gray-600">
                        <span className="flex items-center justify-center sm:justify-start gap-2">
                            <Clock className="w-4 h-4 text-gray-400" /> Time Allocated: {metadata?.duration}
                        </span>
                        <span className="flex items-center justify-center sm:justify-start gap-2">
                            <Target className="w-4 h-4 text-gray-400" /> Focus: Core Instruction
                        </span>
                    </div>
                </div>

                <div className="space-y-10">
                    {/* Objectives Section */}
                    <div className="bg-[#ff9800]/5 border border-[#ff9800]/20 rounded-xl p-6">
                        <h3 className="text-lg font-bold text-[#1e2230] mb-3 flex items-center gap-2">
                            <Target className="w-5 h-5 text-[#ff9800]" /> Learning Objectives
                        </h3>
                        <p className="text-gray-700 italic border-l-4 border-[#ff9800]/40 pl-4 py-1">
                            {metadata?.objectives}
                        </p>
                    </div>

                    {/* Intro Section */}
                    <div>
                        <h3 className="text-lg font-bold text-[#1e2230] mb-3 flex items-center gap-2 border-b border-gray-100 pb-2">
                            <MessageSquare className="w-5 h-5 text-[#0036a1]" /> 1. Introduction & Hook
                        </h3>
                        <p className="text-gray-700 leading-relaxed">
                            {content?.introduction}
                        </p>
                    </div>

                    {/* Core Content Box */}
                    <div className="grid sm:grid-cols-2 gap-8">
                        <div>
                            <h3 className="text-lg font-bold text-[#1e2230] mb-3 flex items-center gap-2 border-b border-gray-100 pb-2">
                                <BookText className="w-5 h-5 text-[#0036a1]" /> 2. Core Concepts
                            </h3>
                            <ul className="space-y-3 mt-4">
                                {content?.coreConcepts?.map((concept, idx) => (
                                    <li key={idx} className="flex gap-3 text-gray-700">
                                        <div className="w-1.5 h-1.5 rounded-full bg-[#6bc048] mt-2 flex-shrink-0" />
                                        <span>{concept}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div>
                            <h3 className="text-lg font-bold text-[#1e2230] mb-3 flex items-center gap-2 border-b border-gray-100 pb-2">
                                <AlignLeft className="w-5 h-5 text-[#0036a1]" /> 3. Presentation Strategy
                            </h3>
                            <div className="space-y-3 mt-4">
                                {content?.presentationSteps?.map((step, idx) => (
                                    <div key={idx} className="bg-gray-50 p-3 rounded-lg text-sm text-gray-700 border border-gray-100">
                                        {step}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Assessment & Conclusion */}
                    <div>
                        <h3 className="text-lg font-bold text-[#1e2230] mb-3 flex items-center gap-2 border-b border-gray-100 pb-2">
                            <CheckSquare className="w-5 h-5 text-[#0036a1]" /> 4. Formative Assessment
                        </h3>
                        <p className="text-gray-700 leading-relaxed bg-[#f8fafc] p-4 rounded-lg border border-dashed border-gray-300">
                            {content?.formativeAssessment}
                        </p>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-6 bg-[#0036a1]/5 p-6 rounded-xl border border-[#0036a1]/10">
                        <div>
                            <h4 className="font-bold text-[#0036a1] mb-2 text-sm uppercase tracking-wider">Conclusion</h4>
                            <p className="text-sm text-gray-700 leading-relaxed">{content?.conclusion}</p>
                        </div>
                        <div>
                            <h4 className="font-bold text-[#0036a1] mb-2 text-sm uppercase tracking-wider">Assignment / Take-home</h4>
                            <p className="text-sm text-gray-700 leading-relaxed flex items-center gap-2">
                                {content?.assignment}
                            </p>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
