import { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { ATT_API, apiError, defaultPeriod, inputCls, periodParams, type PeriodQuery } from './api';
import { PeriodPicker } from './PeriodPicker';
import { RecordsView } from './RecordsView';
import { PrefsPanel } from './PrefsPanel';

/** A parent sees each child's attendance, with sign-in and sign-out times, and sets how they want to be told. */
export default function ParentAttendancePage() {
    const [kids, setKids] = useState<{ id: string; name: string; admissionNo: string | null; className: string }[] | null>(null);
    const [kidId, setKidId] = useState('');
    const [period, setPeriod] = useState<PeriodQuery>(defaultPeriod());
    const [data, setData] = useState<{ summary: any; records: any[]; period: { label: string } } | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => { axios.get(`${ATT_API}/children`).then(r => { setKids(r.data.children); if (r.data.children[0]) setKidId(r.data.children[0].id); }).catch(() => setKids([])); }, []);
    useEffect(() => {
        if (!kidId) return;
        setLoading(true);
        axios.get(`${ATT_API}/child/${kidId}`, { params: periodParams(period) }).then(r => setData(r.data)).catch(err => { toast.error(apiError(err, 'Could not load attendance.')); setData(null); }).finally(() => setLoading(false));
    }, [kidId, period]);

    if (!kids) return <div className="flex justify-center py-24"><Loader2 className="h-6 w-6 animate-spin text-[#1E4DA6]" /></div>;
    return (
        <div className="mx-auto max-w-4xl space-y-5 p-4 md:p-6">
            <div className="flex flex-wrap items-end justify-between gap-3">
                <div><h1 className="text-2xl font-bold text-slate-800">Attendance</h1><p className="text-sm text-slate-500">When your children were in school and when they left.</p></div>
                {kids.length > 1 && <select className={`${inputCls} !w-60`} value={kidId} onChange={e => setKidId(e.target.value)}>{kids.map(k => <option key={k.id} value={k.id}>{k.name}{k.className ? ` · ${k.className}` : ''}</option>)}</select>}
            </div>
            {kids.length === 0 ? <p className="rounded-2xl border border-dashed border-slate-200 p-12 text-center text-sm text-slate-400">No children found on your account.</p> : (<>
                <div className="rounded-2xl border border-slate-200 bg-white p-4"><PeriodPicker value={period} onChange={setPeriod} /></div>
                {loading ? <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-[#1E4DA6]" /></div> : data && <><p className="text-sm font-semibold text-slate-600">{kids.find(k => k.id === kidId)?.name} · {data.period.label}</p><RecordsView kind="student" summary={data.summary} records={data.records} /></>}
                <PrefsPanel kind="parent" />
            </>)}
        </div>
    );
}
