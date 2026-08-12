import { Button } from '../../../../components/ui/button';
import { Card } from '../../../../components/ui/card';
import { Video } from 'lucide-react';

const CLASS_LEVELS = ['JSS 1', 'JSS 2', 'JSS 3', 'SS 1', 'SS 2', 'SS 3'];
const SUBJECTS = ['Mathematics', 'English', 'Physics', 'Chemistry', 'Biology', 'Economics', 'Government', 'Literature', 'Geography', 'Civic Education'];

export interface ClassFormState {
    title: string;
    subject: string;
    classLevel: string;
    durationMinutes: number;
    scheduledAt: string;
}

interface Props {
    form: ClassFormState;
    onChange: (f: ClassFormState) => void;
    onSubmit: () => void;
}

export function CreateClassForm({ form, onChange, onSubmit }: Props) {
    const set = (patch: Partial<ClassFormState>) => onChange({ ...form, ...patch });

    return (
        <Card className="bg-white border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-gray-100 bg-[#f8fafc] flex items-center gap-3">
                <Video className="w-5 h-5 text-[#0036a1]" />
                <h3 className="font-bold text-gray-900">Create a New Class</h3>
            </div>
            <div className="p-5 space-y-4">
                <input
                    type="text"
                    value={form.title}
                    onChange={e => set({ title: e.target.value })}
                    placeholder="Class Title (e.g. Algebra Review)"
                    className="w-full border border-gray-200 rounded-lg p-3 text-sm outline-none focus:border-[#0036a1]"
                />
                <div className="grid grid-cols-2 gap-3">
                    <select value={form.subject} onChange={e => set({ subject: e.target.value })} className="border border-gray-200 rounded-lg p-3 text-sm outline-none focus:border-[#0036a1] bg-white">
                        <option value="">Subject...</option>
                        {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <select value={form.classLevel} onChange={e => set({ classLevel: e.target.value })} className="border border-gray-200 rounded-lg p-3 text-sm outline-none focus:border-[#0036a1] bg-white">
                        <option value="">Section...</option>
                        {CLASS_LEVELS.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="text-xs font-bold text-gray-500 block mb-1">Duration (minutes)</label>
                        <input
                            type="number"
                            value={form.durationMinutes}
                            onChange={e => set({ durationMinutes: Number(e.target.value) })}
                            className="w-full border border-gray-200 rounded-lg p-3 text-sm outline-none focus:border-[#0036a1]"
                        />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-500 block mb-1">Schedule (optional)</label>
                        <input
                            type="datetime-local"
                            value={form.scheduledAt}
                            onChange={e => set({ scheduledAt: e.target.value })}
                            className="w-full border border-gray-200 rounded-lg p-3 text-sm outline-none focus:border-[#0036a1]"
                        />
                    </div>
                </div>
                <Button
                    onClick={onSubmit}
                    disabled={!form.title || !form.subject || !form.classLevel}
                    className="w-full bg-[#0036a1] text-white"
                >
                    <Video className="w-4 h-4 mr-2" /> Create &amp; Start Class
                </Button>
            </div>
        </Card>
    );
}
