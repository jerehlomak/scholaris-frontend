import { cn } from '../../lib/utils';
import { STATUS_STYLE, fmtDay, fmtTime, naira, statusLabel } from './api';

const Chip = ({ l, v, cls }: { l: string; v: string | number; cls?: string }) => <div className="rounded-xl border border-slate-200 bg-white p-3"><p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{l}</p><p className={cn('text-xl font-bold', cls || 'text-slate-800')}>{v}</p></div>;

/** A person's attendance for a period: totals, and every day with its sign-in and sign-out times. */
export function RecordsView({ kind, summary, records, emptyText = 'No attendance recorded in this period.' }: { kind: 'staff' | 'student'; summary: any; records: any[]; emptyText?: string }) {
    const staff = kind === 'staff';
    return (
        <div className="space-y-4">
            {summary && (
                <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
                    <Chip l="Present" v={summary.present ?? 0} cls="text-emerald-600" />
                    <Chip l="Late" v={summary.late ?? 0} cls={summary.late ? 'text-amber-600' : undefined} />
                    <Chip l="Absent" v={summary.absent ?? 0} cls={summary.absent ? 'text-rose-600' : undefined} />
                    {staff ? <Chip l="Half days" v={summary.halfDay ?? 0} /> : <Chip l="Excused" v={summary.excused ?? 0} />}
                    <Chip l="Attendance" v={summary.attendanceRate !== null && summary.attendanceRate !== undefined ? `${summary.attendanceRate}%` : '—'} />
                    {staff ? <Chip l="Late minutes" v={summary.lateMinutes ?? 0} /> : <Chip l="Days recorded" v={summary.total ?? 0} />}
                </div>
            )}
            {staff && summary?.deduction?.total > 0 && <p className="rounded-xl bg-rose-50 px-4 py-2.5 text-sm text-rose-700">Estimated lateness deduction for this period: <strong>{naira(summary.deduction.total)}</strong>{summary.deduction.capped ? ' (capped)' : ''}. It is applied when payroll is run for the month.</p>}
            {records.length === 0 ? <p className="rounded-2xl border border-dashed border-slate-200 p-10 text-center text-sm text-slate-400">{emptyText}</p> : (
                <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
                    <table className="w-full min-w-[520px] text-sm">
                        <thead className="bg-slate-50 text-xs text-slate-500"><tr><th className="p-2.5 text-left">Date</th><th className="p-2.5 text-left">Status</th><th className="p-2.5 text-left">Signed in</th><th className="p-2.5 text-left">Signed out</th><th className="p-2.5 text-left">Note</th></tr></thead>
                        <tbody>{records.map(r => (
                            <tr key={r.id} className="border-t border-slate-100">
                                <td className="p-2.5 text-slate-700">{fmtDay(r.date)}</td>
                                <td className="p-2.5"><span className={cn('rounded-full px-2 py-0.5 text-[11px] font-bold', STATUS_STYLE[r.status])}>{statusLabel(r.status)}{r.excused ? ' (excused)' : ''}</span>{r.lateMinutes > 0 && <span className="ml-1.5 text-xs text-amber-600">{r.lateMinutes} min late</span>}</td>
                                <td className="p-2.5 text-xs text-slate-600">{fmtTime(r.checkInTime || r.checkInAt) || '—'}</td>
                                <td className="p-2.5 text-xs text-slate-600">{fmtTime(r.checkOutTime || r.checkOutAt) || '—'}{r.earlyLeaveMinutes > 0 && <span className="ml-1 text-amber-600">({r.earlyLeaveMinutes} min early)</span>}</td>
                                <td className="p-2.5 text-xs text-slate-500">{r.note}</td>
                            </tr>))}</tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
