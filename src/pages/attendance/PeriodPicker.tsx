import { useEffect, useState } from 'react';
import axios from 'axios';
import { ATT_API, inputCls, todayStr, type PeriodKind, type PeriodQuery } from './api';

interface Periods { terms: { id: string; label: string; isActive: boolean; hasDates: boolean }[]; sessions: { id: string; label: string; isCurrent: boolean; hasDates: boolean }[] }

let cache: Periods | null = null;
export function usePeriods() {
    const [p, setP] = useState<Periods | null>(cache);
    useEffect(() => { if (!cache) axios.get(`${ATT_API}/periods`).then(r => { cache = r.data; setP(r.data); }).catch(() => setP({ terms: [], sessions: [] })); }, []);
    return p;
}

const KINDS: [PeriodKind, string][] = [['day', 'Day'], ['week', 'Week'], ['month', 'Month'], ['term', 'Term'], ['session', 'Session'], ['year', 'Year'], ['custom', 'Custom']];

/** One control for every way of choosing a period: a day, week, month, term, session, year or any two dates. */
export function PeriodPicker({ value, onChange }: { value: PeriodQuery; onChange: (p: PeriodQuery) => void }) {
    const periods = usePeriods();
    const set = (patch: Partial<PeriodQuery>) => onChange({ ...value, ...patch });
    const pickKind = (k: PeriodKind) => {
        const next: PeriodQuery = { ...value, period: k };
        if (k === 'term' && !next.termId) next.termId = periods?.terms.find(t => t.isActive)?.id || periods?.terms[0]?.id;
        if (k === 'session' && !next.sessionId) next.sessionId = periods?.sessions.find(s => s.isCurrent)?.id || periods?.sessions[0]?.id;
        onChange(next);
    };
    return (
        <div className="flex flex-wrap items-end gap-2">
            <label className="space-y-1"><span className="block text-xs font-semibold text-slate-600">Period</span>
                <select className={`${inputCls} !w-32`} value={value.period} onChange={e => pickKind(e.target.value as PeriodKind)}>{KINDS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></label>
            {(value.period === 'day' || value.period === 'week') && <label className="space-y-1"><span className="block text-xs font-semibold text-slate-600">{value.period === 'week' ? 'Any day in the week' : 'Date'}</span><input type="date" max={todayStr()} className={`${inputCls} !w-44`} value={value.date || ''} onChange={e => set({ date: e.target.value })} /></label>}
            {value.period === 'month' && <label className="space-y-1"><span className="block text-xs font-semibold text-slate-600">Month</span><input type="month" className={`${inputCls} !w-44`} value={value.month || ''} onChange={e => set({ month: e.target.value })} /></label>}
            {value.period === 'term' && <label className="space-y-1"><span className="block text-xs font-semibold text-slate-600">Term</span>
                <select className={`${inputCls} !w-56`} value={value.termId || ''} onChange={e => set({ termId: e.target.value })}>{(periods?.terms || []).map(t => <option key={t.id} value={t.id} disabled={!t.hasDates}>{t.label}{t.isActive ? ' (current)' : ''}{t.hasDates ? '' : ' - no dates set'}</option>)}</select></label>}
            {value.period === 'session' && <label className="space-y-1"><span className="block text-xs font-semibold text-slate-600">Session</span>
                <select className={`${inputCls} !w-48`} value={value.sessionId || ''} onChange={e => set({ sessionId: e.target.value })}>{(periods?.sessions || []).map(s => <option key={s.id} value={s.id} disabled={!s.hasDates}>{s.label}{s.isCurrent ? ' (current)' : ''}{s.hasDates ? '' : ' - no dates set'}</option>)}</select></label>}
            {value.period === 'year' && <label className="space-y-1"><span className="block text-xs font-semibold text-slate-600">Year</span><input type="number" min={2000} max={2100} className={`${inputCls} !w-28`} value={value.year || ''} onChange={e => set({ year: e.target.value })} /></label>}
            {value.period === 'custom' && <>
                <label className="space-y-1"><span className="block text-xs font-semibold text-slate-600">From</span><input type="date" className={`${inputCls} !w-44`} value={value.from || ''} onChange={e => set({ from: e.target.value })} /></label>
                <label className="space-y-1"><span className="block text-xs font-semibold text-slate-600">To</span><input type="date" className={`${inputCls} !w-44`} value={value.to || ''} onChange={e => set({ to: e.target.value })} /></label></>}
        </div>
    );
}
