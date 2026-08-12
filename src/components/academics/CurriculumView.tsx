import { Download, Share2, BookOpen, Clock, Target, Users } from 'lucide-react';
import type { GeneratedCurriculum } from '../../lib/curriculum-engine';

interface CurriculumViewProps {
    curriculum: GeneratedCurriculum;
}

export function CurriculumView({ curriculum }: CurriculumViewProps) {
    const { metadata, weeks } = curriculum || {};

    if (!metadata || !weeks) return null;

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden font-dash">
            {/* Header / Toolbar */}
            <div className="p-6 border-b border-gray-100 bg-[#f8fafc] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <span className="bg-[#0036a1]/10 text-[#0036a1] px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                            {metadata?.academicTerm}
                        </span>
                        <span className="bg-[#6bc048]/10 text-[#6bc048] px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                            {metadata?.classLevel}
                        </span>
                    </div>
                    <h2 className="text-2xl font-bold text-[#1e2230]">{metadata?.subject} Scheme of Work</h2>
                    <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
                        <Clock className="w-4 h-4" /> Comprehensive {metadata?.weeks}-Week Timeline
                    </p>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto mt-4 sm:mt-0">
                    <button className="p-2 text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 rounded-md transition-colors shadow-sm" title="Share with Teachers">
                        <Share2 className="w-4 h-4" />
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#0036a1] bg-[#0036a1]/5 hover:bg-[#0036a1]/10 border border-[#0036a1]/20 rounded-md transition-colors shadow-sm whitespace-nowrap">
                        <Download className="w-4 h-4" /> Export Outline
                    </button>
                </div>
            </div>

            {/* Timeline Body */}
            <div className="p-6 sm:p-8">
                <div className="relative border-l-2 border-dashed border-gray-200 ml-4 space-y-10 py-4">
                    {weeks?.map((week) => (
                        <div key={week?.weekNumber} className="relative pl-8">
                            {/* Timeline Node */}
                            <div className={`absolute -left-[17px] top-0 w-8 h-8 rounded-full border-4 border-white flex items-center justify-center shadow-sm ${week?.topic?.includes('Revision') ? 'bg-[#ff9800]' : 'bg-[#0036a1]'}`}>
                                <span className="text-[10px] font-bold text-white leading-none">W{week?.weekNumber}</span>
                            </div>

                            <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow group relative overflow-hidden">
                                {/* Accent Strip */}
                                <div className={`absolute left-0 top-0 bottom-0 w-1 ${week?.topic?.includes('Revision') ? 'bg-[#ff9800]' : 'bg-[#6bc048]'}`} />

                                <div className="flex flex-col sm:flex-row justify-between gap-4">
                                    <div className="flex-1">
                                        <h3 className="text-lg font-bold text-[#1e2230] mb-3 group-hover:text-[#0036a1] transition-colors">
                                            {week?.topic}
                                        </h3>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                            <div className="space-y-2">
                                                <h4 className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider">
                                                    <Target className="w-3.5 h-3.5" /> Learning Objectives
                                                </h4>
                                                <ul className="space-y-1.5 list-disc list-inside text-sm text-gray-600">
                                                    {week?.objectives?.map((obj, i) => (
                                                        <li key={i}>{obj}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                            <div className="space-y-2">
                                                <h4 className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider">
                                                    <Users className="w-3.5 h-3.5" /> Core Activities
                                                </h4>
                                                <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-100">
                                                    {week?.activities}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-4 pt-4 border-t border-gray-50 flex items-center gap-4 text-xs font-medium text-gray-400">
                                    <button className="hover:text-[#0036a1] flex items-center gap-1 transition-colors">
                                        Edit Details
                                    </button>
                                    <button className="hover:text-[#0036a1] flex items-center gap-1 transition-colors">
                                        Generate Lesson Note <ChevronRight className="w-3 h-3" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-100 bg-[#f8fafc] text-center">
                <p className="text-xs text-gray-500 flex items-center justify-center gap-2">
                    <BookOpen className="w-4 h-4" /> AI Generated Curriculum based on {metadata?.classLevel} standards.
                </p>
            </div>
        </div>
    );
}

// Ensure ChevronRight is imported above if not already present
import { ChevronRight } from 'lucide-react';
