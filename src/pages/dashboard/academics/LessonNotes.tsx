import { useState } from 'react';
import { BrainCircuit, BookText, RefreshCw, ExternalLink } from 'lucide-react';
import { Card } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { AILessonNoteWizard } from '../../../components/academics/AILessonNoteWizard';
import { LessonNoteDocument } from '../../../components/academics/LessonNoteDocument';
import { generateLessonNote } from '../../../lib/lesson-note-engine';
import type { GeneratedLessonNote } from '../../../lib/lesson-note-engine';

export default function LessonNotes() {
    const [showWizard, setShowWizard] = useState(false);
    const [note, setNote] = useState<GeneratedLessonNote | null>(null);

    const handleGenerate = async (config: any) => {
        try {
            const generated = await generateLessonNote(config);
            setNote(generated);
            setShowWizard(false);
        } catch (e: any) {
            console.error(e);
            alert("Error: " + e.message);
        }
    };
    return (
        <div className="space-y-6 font-dash">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 tracking-tight">AI Lesson Notes</h2>
                    <p className="text-sm text-gray-500 mt-1">Generate comprehensive daily lesson plans and teaching notes.</p>
                </div>
                <div className="flex flex-wrap gap-3">
                    {note && (
                        <Button variant="outline" className="flex items-center gap-2 border-gray-200 text-gray-600 bg-white hover:bg-gray-50">
                            <ExternalLink className="w-4 h-4" />
                            Open Fullscreen
                        </Button>
                    )}
                    <Button
                        onClick={() => setShowWizard(true)}
                        className="flex items-center gap-2 bg-[#002082] hover:bg-[#001761] text-white shadow-sm transition-all hover:shadow-md"
                    >
                        {note ? (
                            <>
                                <RefreshCw className="w-4 h-4" /> Generate Another
                            </>
                        ) : (
                            <>
                                <BrainCircuit className="w-4 h-4 text-[#6bc048]" /> Generate Lesson Note
                            </>
                        )}
                    </Button>
                </div>
            </div>

            {!note ? (
                <Card className="p-8 bg-white rounded-xl shadow-sm border border-gray-100/80">
                    <div className="h-[400px] flex flex-col items-center justify-center text-center">
                        <div className="w-20 h-20 bg-[#002082]/5 rounded-3xl flex items-center justify-center mb-6 border border-[#002082]/10 rotate-3 transition-transform hover:rotate-6">
                            <BookText className="w-10 h-10 text-[#002082]/40" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">No Lesson Notes Built</h3>
                        <p className="text-sm text-gray-500 max-w-sm mb-8 leading-relaxed">
                            Input your topic and objectives, and let the AI draft a complete lesson plan including introductions, core content, and assessments.
                        </p>
                        <Button
                            onClick={() => setShowWizard(true)}
                            className="bg-white border-2 border-[#002082] text-[#002082] hover:bg-[#002082] hover:text-white transition-colors h-12 px-8 font-semibold rounded-lg flex items-center gap-2 group"
                        >
                            <BrainCircuit className="w-5 h-5 text-[#6bc048] group-hover:text-white transition-colors" /> Start AI Wizard
                        </Button>
                    </div>
                </Card>
            ) : (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <LessonNoteDocument note={note} />
                </div>
            )}

            {showWizard && (
                <AILessonNoteWizard
                    onClose={() => setShowWizard(false)}
                    onGenerate={handleGenerate}
                />
            )}
        </div>
    );
}
