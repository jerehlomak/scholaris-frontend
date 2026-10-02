import { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { ChevronRight, HomeIcon, Loader2 } from 'lucide-react';
import { CBT_API } from '../cbt/api';
import { ResultCards } from '../cbt/student/StudentExams';

interface Child { id: string; name: string; results: any[] }

/** A parent sees each child's CBT results only after the school has released them. */
export default function ParentCBT() {
    const [children, setChildren] = useState<Child[] | null>(null);
    const [childId, setChildId] = useState('');

    useEffect(() => {
        axios.get(`${CBT_API}/parent/results`)
            .then(r => { setChildren(r.data.children); if (r.data.children[0]) setChildId(r.data.children[0].id); })
            .catch(() => setChildren([]));
    }, []);

    const child = children?.find(c => c.id === childId);
    return (
        <div className="mx-auto w-full max-w-4xl space-y-6">
            <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">CBT Results</h1>
                    <div className="mt-1 flex items-center gap-1 text-xs text-gray-400"><HomeIcon size={12} /><Link to="/parent" className="transition-colors hover:text-[#173F8C]">Home</Link><ChevronRight size={12} className="opacity-50" /><span>CBT Results</span></div>
                </div>
                {children && children.length > 1 && (
                    <label className="flex items-center gap-2 text-sm text-gray-500"><span className="font-medium">Child:</span>
                        <select value={childId} onChange={e => setChildId(e.target.value)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-[#173F8C] shadow-sm outline-none focus:border-[#1E4DA6]">
                            {children.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
                )}
            </div>
            {!children ? <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-[#1E4DA6]" /></div>
                : children.length === 0 ? <p className="rounded-2xl border border-dashed border-slate-200 p-12 text-center text-sm text-slate-400">No children found on your account.</p>
                    : <><p className="text-sm text-slate-500">{child?.name}</p><ResultCards results={child?.results || []} reviewPath={examId => `${CBT_API}/parent/results/${childId}/${examId}`} /></>}
        </div>
    );
}
