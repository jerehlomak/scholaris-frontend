import { useState } from 'react';
import { BrainCircuit, BookOpen, RefreshCw, ExternalLink } from 'lucide-react';
import { Card } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { AICurriculumWizard } from '../../../components/academics/AICurriculumWizard';
import { CurriculumView } from '../../../components/academics/CurriculumView';
import { generateCurriculum } from '../../../lib/curriculum-engine';
import type { GeneratedCurriculum } from '../../../lib/curriculum-engine';

export default function Curriculum() {
    const [showWizard, setShowWizard] = useState(false);
    const [curriculum, setCurriculum] = useState<GeneratedCurriculum | null>(null);

    const handleGenerate = async (config: any) => {
        try {
            const generated = await generateCurriculum(config);
            setCurriculum(generated);
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
                    <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Curriculum & Scheme of Work</h2>
                    <p className="text-sm text-gray-500 mt-1">Generate dynamic, 12-week course outlines using Skooly AI.</p>
                </div>
                <div className="flex flex-wrap gap-3">
                    {curriculum && (
                        <Button variant="outline" className="flex items-center gap-2 border-gray-200 text-gray-600 bg-white hover:bg-gray-50">
                            <ExternalLink className="w-4 h-4" />
                            Master Print
                        </Button>
                    )}
                    <Button
                        onClick={() => setShowWizard(true)}
                        className="flex items-center gap-2 bg-[#002082] hover:bg-[#001761] text-white shadow-sm transition-all hover:shadow-md"
                    >
                        {curriculum ? (
                            <>
                                <RefreshCw className="w-4 h-4" /> Re-generate Scheme
                            </>
                        ) : (
                            <>
                                <BrainCircuit className="w-4 h-4 text-[#6bc048]" /> AI Scheme Generator
                            </>
                        )}
                    </Button>
                </div>
            </div>

            {!curriculum ? (
                <Card className="p-8 bg-white rounded-xl shadow-sm border border-gray-100/80">
                    <div className="h-[400px] flex flex-col items-center justify-center text-center">
                        <div className="w-20 h-20 bg-[#002082]/5 rounded-3xl flex items-center justify-center mb-6 border border-[#002082]/10 rotate-3 transition-transform hover:rotate-6">
                            <BookOpen className="w-10 h-10 text-[#002082]/40" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">No Curriculum Generated</h3>
                        <p className="text-sm text-gray-500 max-w-sm mb-8 leading-relaxed">
                            Create comprehensive, term-by-term schemes of work tailored to your classes in seconds using our AI.
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
                    <CurriculumView curriculum={curriculum} />
                </div>
            )}

            {showWizard && (
                <AICurriculumWizard
                    onClose={() => setShowWizard(false)}
                    onGenerate={handleGenerate}
                />
            )}
        </div>
    );
}
