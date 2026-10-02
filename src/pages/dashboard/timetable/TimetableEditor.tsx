import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { AlertTriangle, ArrowLeft, Copy, Eraser, FileSpreadsheet, Loader2, Lock, Plus, Printer, RefreshCw, Sparkles, Trash2, Unlock, Upload } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { mobileSafePrint } from '../../../lib/printUtils';
import { Button } from '../../../components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../../components/ui/dialog';
import { KIND_LABEL, TT_API, apiError, inputCls, type Clash, type ClassInfo, type DocSummary, type LayoutRow, type Meta, type Slot } from './api';
import { ClassGrid, EntryList } from './TimetableGrid';
import { Link } from 'react-router-dom';

interface DocData {
    doc: DocSummary; classes: ClassInfo[]; slots: Slot[]; layouts: Record<string, LayoutRow[]>; days: Record<string, string[]>; clashes: Clash[]; totalClashes: number;
}
interface Readiness {
    ready: boolean; problemClasses: number; lockedLessons: number;
    classes: { classId: string; className: string; subjects: number; capacity: number; issues: { type: string; subjects?: string[]; demand?: number; capacity?: number }[] }[];
}
type Scope = { mode: 'school' } | { mode: 'section'; id: string } | { mode: 'class'; id: string };

const withCreds = { withCredentials: true };
const Label = ({ t, children }: { t: string; children: React.ReactNode }) => (
    <label className="block space-y-1"><span className="text-xs font-semibold text-slate-600">{t}</span>{children}</label>
);

async function downloadFile(url: string, params: Record<string, string>) {
    const res = await axios.get(url, { params, responseType: 'blob', ...withCreds });
    const name = /filename="([^"]+)"/.exec(res.headers['content-disposition'] || '')?.[1] || 'timetable.xlsx';
    const a = document.createElement('a');
    a.href = URL.createObjectURL(res.data);
    a.download = name;
    a.click();
    URL.revokeObjectURL(a.href);
}

const PRINT_CSS = '@page{size:landscape;margin:10mm}.tt-class{page-break-after:always;margin-bottom:16px}.tt-class:last-child{page-break-after:auto}table{width:100%}';

export default function TimetableEditor({ docId, meta, onBack, onChanged }: { docId: string; meta: Meta; onBack: () => void; onChanged: () => void }) {
    const [data, setData] = useState<DocData | null>(null);
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState('');
    const [scope, setScope] = useState<Scope>({ mode: 'school' });
    const [cell, setCell] = useState<{ classId: string; day: string; row: LayoutRow; slot?: Slot } | null>(null);
    const [entry, setEntry] = useState<{ slot?: Slot } | null>(null);
    const [showExamGen, setShowExamGen] = useState(false);
    const [keepLocked, setKeepLocked] = useState(true);
    const [readiness, setReadiness] = useState<Readiness | null>(null);
    const [report, setReport] = useState<{ msg: string; warnings: any[] } | null>(null);
    const [importErrors, setImportErrors] = useState<{ msg: string; errors: any[]; file: File } | null>(null);
    const fileRef = useRef<HTMLInputElement>(null);

    const query = useMemo(() => (scope.mode === 'class' ? { classId: scope.id } : scope.mode === 'section' ? { sectionId: scope.id } : {}), [scope]);

    const load = useCallback(async () => {
        try {
            const res = await axios.get(`${TT_API}/docs/${docId}`, { params: query, ...withCreds });
            setData(res.data);
        } catch (err) { toast.error(apiError(err, 'Could not load the timetable.')); }
        finally { setLoading(false); }
    }, [docId, query]);
    useEffect(() => { setLoading(true); load(); }, [load]);

    const run = async (key: string, fn: () => Promise<any>) => {
        setBusy(key);
        try { return await fn(); } catch (err) { toast.error(apiError(err, 'Something went wrong.')); }
        finally { setBusy(''); }
    };

    if (loading || !data) return <div className="flex justify-center py-24"><Loader2 className="h-6 w-6 animate-spin text-[#1E4DA6]" /></div>;
    const { doc } = data;
    const isClass = doc.kind === 'CLASS';
    const clashSlotIds = new Set(data.clashes.flatMap(c => c.slotIds));
    const classById = new Map(meta.classes.map(c => [c.id, c]));
    const scopeLabel = scope.mode === 'class' ? classById.get(scope.id)?.name : scope.mode === 'section' ? meta.sections.find(s => s.id === scope.id)?.name : 'Whole school';
    const slotsWithClass = data.slots.map(s => ({ ...s, className: s.classId ? classById.get(s.classId)?.name : '' }));

    const changed = async () => { await load(); onChanged(); };

    const publish = (status: 'DRAFT' | 'PUBLISHED', force = false): Promise<unknown> => run('status', async () => {
        try {
            const res = await axios.post(`${TT_API}/docs/${docId}/status`, { status, force }, withCreds);
            toast.success(res.data.msg); await changed();
        } catch (err: any) {
            if (err?.response?.status === 409 && window.confirm(`${err.response.data.msg}\n\nPublish anyway?`)) return publish(status, true);
            if (err?.response?.status !== 409) throw err;
        }
    });

    const generate = () => run('generate', async () => {
        const r = await axios.get(`${TT_API}/docs/${docId}/readiness`, { params: query, ...withCreds });
        if (!r.data.ready) { setReadiness(r.data); return; }
        await doGenerate();
    });

    const doGenerate = () => run('generate', async () => {
        setReadiness(null);
        if (data.slots.length && !window.confirm(`This replaces the ${scopeLabel} lessons${keepLocked ? ' (locked lessons are kept)' : ''}. Continue?`)) return;
        const body = scope.mode === 'class' ? { classId: scope.id, keepLocked } : scope.mode === 'section' ? { sectionId: scope.id, keepLocked } : { keepLocked };
        const res = await axios.post(`${TT_API}/docs/${docId}/generate`, body, withCreds);
        toast.success(res.data.msg);
        setReport({ msg: res.data.msg, warnings: res.data.warnings || [] });
        await changed();
    });

    const clear = () => run('clear', async () => {
        if (!window.confirm(`Clear all entries for ${scopeLabel}?${isClass ? ' Locked lessons are kept.' : ''}`)) return;
        const body = { ...(scope.mode === 'class' ? { classId: scope.id } : scope.mode === 'section' ? { sectionId: scope.id } : {}), keepLocked: isClass };
        const res = await axios.post(`${TT_API}/docs/${docId}/clear`, body, withCreds);
        toast.success(res.data.msg); await changed();
    });

    const duplicate = () => run('dup', async () => {
        const term = window.prompt('Copy into which term? (e.g. Second Term)', doc.term || '');
        if (term === null) return;
        const academicYear = window.prompt('Which session / academic year?', doc.academicYear || '');
        if (academicYear === null) return;
        const res = await axios.post(`${TT_API}/docs/${docId}/duplicate`, { term, academicYear }, withCreds);
        toast.success(`Copied ${res.data.copied} entries as a new draft.`); onChanged();
    });

    const refreshConfig = () => run('refresh', async () => {
        const res = await axios.post(`${TT_API}/docs/${docId}/refresh-config`, {}, withCreds);
        toast.success(res.data.msg); await changed();
    });

    const exportXlsx = () => run('export', async () => { await downloadFile(`${TT_API}/docs/${docId}/export`, query as Record<string, string>); });

    const importXlsx = (file: File, skipInvalid = false) => run('import', async () => {
        const form = new FormData();
        form.append('file', file);
        form.append('skipInvalid', String(skipInvalid));
        try {
            const res = await axios.post(`${TT_API}/docs/${docId}/import`, form, withCreds);
            toast.success(res.data.msg); setImportErrors(null); await changed();
        } catch (err: any) {
            if (err?.response?.status === 400 && err.response.data?.errors) setImportErrors({ msg: err.response.data.msg, errors: err.response.data.errors, file });
            else throw err;
        }
    });

    const scopeValue = scope.mode === 'school' ? 'school' : `${scope.mode}:${scope.id}`;
    const onScope = (v: string) => { const [mode, id] = v.split(':'); setScope(mode === 'school' ? { mode: 'school' } : { mode: mode as 'class' | 'section', id }); };

    return (
        <div className="space-y-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                    <button onClick={onBack} className="flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800"><ArrowLeft className="h-3.5 w-3.5" /> All timetables</button>
                    <h2 className="text-xl font-bold text-slate-800">{doc.name}</h2>
                    <p className="text-xs text-slate-500">{[KIND_LABEL[doc.kind], doc.examType, doc.term, doc.academicYear].filter(Boolean).join(' · ')}
                        <span className={cn('ml-2 rounded-full px-2 py-0.5 text-[10px] font-bold', doc.status === 'PUBLISHED' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700')}>{doc.status === 'PUBLISHED' ? 'Published' : 'Draft'}</span></p>
                </div>
                <div className="flex flex-wrap gap-2">
                    {doc.status === 'PUBLISHED'
                        ? <Button variant="outline" size="sm" disabled={!!busy} onClick={() => publish('DRAFT')}>Unpublish</Button>
                        : <Button size="sm" disabled={!!busy} onClick={() => publish('PUBLISHED')}>Publish</Button>}
                    <Button variant="outline" size="sm" disabled={!!busy} onClick={exportXlsx}><FileSpreadsheet /> Excel</Button>
                    <Button variant="outline" size="sm" onClick={() => mobileSafePrint('tt-print-root', PRINT_CSS)}><Printer /> PDF / Print</Button>
                    <Button variant="outline" size="sm" disabled={!!busy} onClick={() => fileRef.current?.click()}><Upload /> Import</Button>
                    <input ref={fileRef} type="file" accept=".xlsx,.xls" hidden onChange={e => { const f = e.target.files?.[0]; if (f) importXlsx(f); e.target.value = ''; }} />
                    <Button variant="outline" size="sm" disabled={!!busy} onClick={duplicate}><Copy /> Copy to term</Button>
                </div>
            </div>

            <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-slate-200 bg-white p-4">
                <div className="min-w-[200px]"><Label t="Show / download">
                    <select className={inputCls} value={scopeValue} onChange={e => onScope(e.target.value)}>
                        <option value="school">Whole school</option>
                        <optgroup label="Section">{meta.sections.map(s => <option key={s.id} value={`section:${s.id}`}>{s.name}</option>)}</optgroup>
                        <optgroup label="Class">{meta.classes.map(c => <option key={c.id} value={`class:${c.id}`}>{c.name}</option>)}</optgroup>
                    </select></Label></div>
                {isClass ? (
                    <>
                        <Button disabled={!!busy} onClick={generate}>{busy === 'generate' ? <Loader2 className="animate-spin" /> : <Sparkles />} Auto-generate</Button>
                        <label className="flex cursor-pointer items-center gap-2 pb-2 text-xs text-slate-600"><input type="checkbox" className="accent-[#1E4DA6]" checked={keepLocked} onChange={e => setKeepLocked(e.target.checked)} /> Keep locked lessons</label>
                        <Button variant="outline" size="sm" disabled={!!busy} onClick={refreshConfig} title="Re-read days, periods and breaks from Settings"><RefreshCw /> Refresh settings</Button>
                    </>
                ) : (
                    <>
                        <Button disabled={!!busy} onClick={() => setShowExamGen(true)}><Sparkles /> Auto-schedule</Button>
                        <Button variant="outline" onClick={() => setEntry({})}><Plus /> Add entry</Button>
                    </>
                )}
                <Button variant="ghost" size="sm" disabled={!!busy} onClick={clear} className="text-slate-500"><Eraser /> Clear</Button>
            </div>

            {report && report.warnings.length > 0 && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                    <p className="font-semibold">{report.msg}</p>
                    <ul className="mt-1 list-inside list-disc text-xs">{report.warnings.slice(0, 12).map((w, i) => <li key={i}>{warnText(w)}</li>)}</ul>
                </div>
            )}

            {data.clashes.length > 0 ? (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3">
                    <p className="flex items-center gap-2 text-sm font-bold text-red-700"><AlertTriangle className="h-4 w-4" /> {data.clashes.length} clash{data.clashes.length === 1 ? '' : 'es'} to review{data.totalClashes > data.clashes.length && ` (${data.totalClashes} in the whole timetable)`}</p>
                    <ul className="mt-2 max-h-40 space-y-1 overflow-auto text-xs text-red-800">{data.clashes.map((c, i) => <li key={i}><span className="mr-1 rounded bg-red-200 px-1 font-bold">{c.type}</span>{c.message}</li>)}</ul>
                </div>
            ) : data.slots.length > 0 && <p className="rounded-xl bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">No clashes found.</p>}

            <div id="tt-print-root" className="space-y-6">
                <div className="hidden print:block"><h1 style={{ fontSize: 20, fontWeight: 700 }}>{doc.name}</h1><p style={{ fontSize: 12 }}>{[doc.examType, doc.term, doc.academicYear].filter(Boolean).join(' · ')}</p></div>
                {isClass ? data.classes.map(c => {
                    const layout = data.layouts[c.id] || [];
                    const days = data.days[c.id] || [];
                    return (
                        <section key={c.id} className="tt-class space-y-2">
                            <h3 className="text-sm font-bold text-slate-700">{c.name}{c.sectionName && <span className="font-normal text-slate-400"> · {c.sectionName}</span>}</h3>
                            <ClassGrid layout={layout} days={days} slots={data.slots.filter(s => s.classId === c.id)} clashSlotIds={clashSlotIds}
                                onCell={(day, row, slot) => setCell({ classId: c.id, day, row, slot })} />
                        </section>
                    );
                }) : <EntryList slots={slotsWithClass} by="date" clashSlotIds={clashSlotIds} onEntry={s => setEntry({ slot: s })} />}
            </div>

            {readiness && <ReadinessDialog r={readiness} onClose={() => setReadiness(null)} onProceed={doGenerate} />}
            {cell && <CellDialog meta={meta} docId={docId} cell={cell} data={data} onClose={() => setCell(null)} onSaved={async () => { setCell(null); await changed(); }} />}
            {entry && <EntryDialog meta={meta} docId={docId} slot={entry.slot} defaultClassIds={scope.mode === 'class' ? [scope.id] : []} onClose={() => setEntry(null)} onSaved={async () => { setEntry(null); await changed(); }} />}
            {showExamGen && <ExamGenDialog meta={meta} docId={docId} doc={doc} onClose={() => setShowExamGen(false)} onDone={async (r) => { setShowExamGen(false); setReport(r); await changed(); }} />}

            <Dialog open={!!importErrors} onOpenChange={o => !o && setImportErrors(null)}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Some rows need fixing</DialogTitle><DialogDescription>{importErrors?.msg}</DialogDescription></DialogHeader>
                    <ul className="max-h-60 space-y-1 overflow-auto text-xs text-slate-600">{importErrors?.errors.map((e, i) => <li key={i}>Row {e.row}: {e.message}</li>)}</ul>
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setImportErrors(null)}>Cancel and fix the file</Button>
                        <Button onClick={() => importErrors && importXlsx(importErrors.file, true)}>Import valid rows only</Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

function warnText(w: any): string {
    const who = w.className ? `${w.className}: ` : '';
    switch (w.type) {
        case 'NO_SUBJECTS': return `${who}no subjects are assigned, so nothing was generated.`;
        case 'NO_TEACHER': return `${who}${w.subject || 'a subject'} has no teacher assigned.`;
        case 'UNPLACED': return `${who}could not place ${w.periods ?? ''} period(s) of ${w.subject || 'a subject'} without a clash.`;
        case 'OVER_CAPACITY': return `${who}${w.demand} periods wanted but only ${w.capacity} fit in the week.`;
        case 'NO_DATES': return 'No usable exam dates in that range.';
        case 'NO_SESSIONS': return 'No valid exam sessions were given.';
        case 'UNSCHEDULED': return `${who}${w.subject || 'a paper'} did not fit in the date range.`;
        default: return `${who}${w.message || w.type}`;
    }
}

// ─── readiness check ─────────────────────────────────────────────────────────

const issueText = (i: Readiness['classes'][number]['issues'][number]) => {
    if (i.type === 'NO_SUBJECTS') return 'No subjects are assigned to this class.';
    if (i.type === 'NO_TEACHER') return `No teacher assigned for: ${i.subjects?.join(', ')}.`;
    if (i.type === 'OVER_CAPACITY') return `You asked for ${i.demand} periods a week but only ${i.capacity} fit.`;
    return i.type;
};

function ReadinessDialog({ r, onClose, onProceed }: { r: Readiness; onClose: () => void; onProceed: () => void }) {
    const problems = r.classes.filter(c => c.issues.length);
    return (
        <Dialog open onOpenChange={o => !o && onClose()}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{problems.length} class{problems.length === 1 ? '' : 'es'} need attention</DialogTitle>
                    <DialogDescription>You can generate anyway, but these classes will be incomplete or have unassigned lessons.</DialogDescription>
                </DialogHeader>
                <ul className="max-h-64 space-y-2 overflow-auto text-sm">
                    {problems.map(c => (
                        <li key={c.classId} className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
                            <p className="font-bold text-amber-900">{c.className}</p>
                            {c.issues.map((i, k) => <p key={k} className="text-xs text-amber-800">{issueText(i)}</p>)}
                        </li>
                    ))}
                </ul>
                <div className="flex flex-wrap gap-3 text-xs font-semibold text-[#1E4DA6]">
                    <Link to="/dashboard/academics/assignments" className="underline">Assign subjects &amp; teachers</Link>
                    <span className="text-slate-400">Periods per subject: Settings &amp; alerts tab</span>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                    <Button variant="outline" onClick={onClose}>Go back and fix</Button>
                    <Button onClick={onProceed}>Generate anyway</Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

// ─── cell editor ─────────────────────────────────────────────────────────────

function CellDialog({ meta, docId, cell, data, onClose, onSaved }: {
    meta: Meta; docId: string; cell: { classId: string; day: string; row: LayoutRow; slot?: Slot }; data: DocData; onClose: () => void; onSaved: () => void;
}) {
    const { slot } = cell;
    const blockSize = slot?.blockId ? data.slots.filter(s => s.blockId === slot.blockId).length : 1;
    const [subject, setSubject] = useState(slot?.subject || '');
    const [teacherId, setTeacherId] = useState(slot?.teacherId || '');
    const [teacherTouched, setTeacherTouched] = useState(false);
    const [room, setRoom] = useState(slot?.room || '');
    const [span, setSpan] = useState(blockSize);
    const [isLocked, setIsLocked] = useState(slot?.isLocked ?? false);
    const [saving, setSaving] = useState(false);
    const cls = meta.classes.find(c => c.id === cell.classId);
    const url = `${TT_API}/docs/${docId}`;

    // the teacher assigned to each subject in this class (from Teacher Assignments) is the default
    const classAssignments = (meta.assignments || []).filter(a => a.classId === cell.classId);
    const assignedFor = (name: string) => classAssignments.find(a => a.subject.trim().toLowerCase() === name.trim().toLowerCase());
    const assigned = assignedFor(subject);
    const assignedTeacher = assigned?.teacherId ? meta.teachers.find(t => t.id === assigned.teacherId) : undefined;
    const classSubjects = classAssignments.map(a => a.subject).sort((a, b) => a.localeCompare(b));
    const otherSubjects = meta.subjects.map(s => s.name).filter(n => !classSubjects.some(c => c.toLowerCase() === n.toLowerCase()));
    const changeSubject = (name: string) => {
        setSubject(name);
        const a = assignedFor(name);
        if (!teacherTouched && a?.teacherId) setTeacherId(a.teacherId);
        else if (!teacherTouched && !a) setTeacherId(slot?.teacherId || '');
    };
    // an existing lesson with no teacher picks up the assigned one
    useEffect(() => { if (!teacherId && assigned?.teacherId && !teacherTouched) setTeacherId(assigned.teacherId); /* eslint-disable-next-line */ }, []);

    const save = async () => {
        if (!subject.trim()) return toast.error('Enter a subject.');
        setSaving(true);
        try {
            const res = await axios.put(`${url}/cell`, { classId: cell.classId, day: cell.day, rowIndex: cell.row.rowIndex, subject, teacherId: teacherId || null, room, span, isLocked }, withCreds);
            res.data.clashes?.length ? toast.warning(res.data.msg) : toast.success(res.data.msg);
            onSaved();
        } catch (err) { toast.error(apiError(err, 'Could not save.')); setSaving(false); }
    };
    const remove = async () => {
        setSaving(true);
        try { await axios.delete(`${url}/cell`, { data: { classId: cell.classId, day: cell.day, rowIndex: cell.row.rowIndex }, ...withCreds }); onSaved(); }
        catch (err) { toast.error(apiError(err, 'Could not remove.')); setSaving(false); }
    };

    return (
        <Dialog open onOpenChange={o => !o && onClose()}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{cls?.name} · {cell.day}</DialogTitle>
                    <DialogDescription>{cell.row.label}, {cell.row.start}–{cell.row.end}</DialogDescription>
                </DialogHeader>
                <div className="space-y-3">
                    <Label t="Subject">
                        <input list="tt-subjects" className={inputCls} value={subject} onChange={e => changeSubject(e.target.value)} autoFocus />
                        <datalist id="tt-subjects">{classSubjects.map(n => <option key={`c-${n}`} value={n} label="taught in this class" />)}{otherSubjects.map(n => <option key={`o-${n}`} value={n} />)}</datalist>
                    </Label>
                    <Label t="Teacher">
                        <select className={inputCls} value={teacherId} onChange={e => { setTeacherId(e.target.value); setTeacherTouched(true); }}>
                            <option value="">— none —</option>{meta.teachers.map(t => <option key={t.id} value={t.id}>{t.name}{t.id === assigned?.teacherId ? ' (assigned)' : ''}</option>)}
                        </select>
                        {subject.trim() && (assignedTeacher
                            ? <p className="mt-1 text-[11px] text-slate-500">{teacherId === assignedTeacher.id ? `${assignedTeacher.name} is assigned to ${subject.trim()} in this class.` : <>Assigned teacher is {assignedTeacher.name}. <button type="button" className="font-bold text-[#1E4DA6] underline" onClick={() => { setTeacherId(assignedTeacher.id); setTeacherTouched(false); }}>Use them</button></>}</p>
                            : <p className="mt-1 text-[11px] text-amber-600">{assigned ? `No teacher is assigned to ${subject.trim()} in this class yet (Teacher Assignments).` : `${subject.trim()} is not assigned to this class in Teacher Assignments.`}</p>)}
                    </Label>
                    <div className="grid grid-cols-2 gap-3">
                        <Label t="Room (optional)"><input className={inputCls} value={room} onChange={e => setRoom(e.target.value)} /></Label>
                        <Label t="Length">
                            <select className={inputCls} value={span} onChange={e => setSpan(Number(e.target.value))}>
                                <option value={1}>Single period</option><option value={2}>Double period</option><option value={3}>Triple period</option>
                            </select>
                        </Label>
                    </div>
                    <button type="button" onClick={() => setIsLocked(v => !v)} className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                        {isLocked ? <Lock className="h-4 w-4 text-[#1E4DA6]" /> : <Unlock className="h-4 w-4" />} {isLocked ? 'Locked — kept when you auto-generate' : 'Not locked — auto-generate may replace it'}
                    </button>
                </div>
                <div className="flex justify-between gap-2 pt-2">
                    {slot ? <Button variant="ghost" className="text-red-600" disabled={saving} onClick={remove}><Trash2 /> Remove</Button> : <span />}
                    <div className="flex gap-2"><Button variant="outline" onClick={onClose}>Cancel</Button><Button disabled={saving} onClick={save}>{saving && <Loader2 className="animate-spin" />} Save</Button></div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

// ─── exam / activity entry ───────────────────────────────────────────────────

function EntryDialog({ meta, docId, slot, defaultClassIds, onClose, onSaved }: {
    meta: Meta; docId: string; slot?: Slot; defaultClassIds: string[]; onClose: () => void; onSaved: () => void;
}) {
    const [title, setTitle] = useState(slot?.title || slot?.subject || '');
    const [date, setDate] = useState(slot?.date || '');
    const [startTime, setStart] = useState(slot?.startTime || '09:00');
    const [endTime, setEnd] = useState(slot?.endTime || '11:00');
    const [teacherId, setTeacherId] = useState(slot?.teacherId || '');
    const [room, setRoom] = useState(slot?.room || '');
    const [classIds, setClassIds] = useState<string[]>(slot?.classId ? [slot.classId] : defaultClassIds);
    const [saving, setSaving] = useState(false);

    const save = async () => {
        setSaving(true);
        try {
            const body = { title, date, startTime, endTime, teacherId: teacherId || null, room };
            if (slot) await axios.patch(`${TT_API}/docs/${docId}/entries/${slot.id}`, { ...body, classId: classIds[0] }, withCreds);
            else {
                const res = await axios.post(`${TT_API}/docs/${docId}/entries`, { ...body, classIds }, withCreds);
                res.data.clashes ? toast.warning(`${res.data.msg} — ${res.data.clashes} clash(es) to review.`) : toast.success(res.data.msg);
            }
            onSaved();
        } catch (err) { toast.error(apiError(err, 'Could not save.')); setSaving(false); }
    };
    const remove = async () => {
        if (!slot) return;
        setSaving(true);
        try { await axios.delete(`${TT_API}/docs/${docId}/entries/${slot.id}`, withCreds); onSaved(); }
        catch (err) { toast.error(apiError(err, 'Could not remove.')); setSaving(false); }
    };

    return (
        <Dialog open onOpenChange={o => !o && onClose()}>
            <DialogContent>
                <DialogHeader><DialogTitle>{slot ? 'Edit entry' : 'Add entry'}</DialogTitle><DialogDescription>A paper, test or activity on a date.</DialogDescription></DialogHeader>
                <div className="space-y-3">
                    <Label t="Paper / activity"><input className={inputCls} value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Mathematics Paper 1" autoFocus /></Label>
                    <div className="grid grid-cols-3 gap-3">
                        <Label t="Date"><input type="date" className={inputCls} value={date} onChange={e => setDate(e.target.value)} /></Label>
                        <Label t="Start"><input type="time" className={inputCls} value={startTime} onChange={e => setStart(e.target.value)} /></Label>
                        <Label t="End"><input type="time" className={inputCls} value={endTime} onChange={e => setEnd(e.target.value)} /></Label>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <Label t="Invigilator / in charge"><select className={inputCls} value={teacherId} onChange={e => setTeacherId(e.target.value)}><option value="">— none —</option>{meta.teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select></Label>
                        <Label t="Venue (optional)"><input className={inputCls} value={room} onChange={e => setRoom(e.target.value)} /></Label>
                    </div>
                    <Label t={slot ? 'Class' : 'Classes'}>
                        <div className="grid max-h-36 gap-1 overflow-auto rounded-lg border border-slate-200 p-2 sm:grid-cols-2">
                            {meta.classes.map(c => (
                                <label key={c.id} className="flex items-center gap-2 text-xs text-slate-600">
                                    <input type={slot ? 'radio' : 'checkbox'} className="accent-[#1E4DA6]" checked={classIds.includes(c.id)}
                                        onChange={e => setClassIds(s => (slot ? [c.id] : e.target.checked ? [...s, c.id] : s.filter(x => x !== c.id)))} /> {c.name}
                                </label>
                            ))}
                        </div>
                    </Label>
                </div>
                <div className="flex justify-between gap-2 pt-2">
                    {slot ? <Button variant="ghost" className="text-red-600" disabled={saving} onClick={remove}><Trash2 /> Remove</Button> : <span />}
                    <div className="flex gap-2"><Button variant="outline" onClick={onClose}>Cancel</Button><Button disabled={saving} onClick={save}>{saving && <Loader2 className="animate-spin" />} Save</Button></div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

// ─── exam auto-scheduler ─────────────────────────────────────────────────────

function ExamGenDialog({ meta, docId, doc, onClose, onDone }: {
    meta: Meta; docId: string; doc: DocSummary; onClose: () => void; onDone: (r: { msg: string; warnings: any[] }) => void;
}) {
    const [classIds, setClassIds] = useState<string[]>(meta.classes.map(c => c.id));
    const [startDate, setStart] = useState(doc.startDate || '');
    const [endDate, setEnd] = useState(doc.endDate || '');
    const [includeWeekends, setWeekends] = useState(false);
    const [papersPerDay, setPapers] = useState(1);
    const [sessions, setSessions] = useState([{ start: '09:00', end: '11:00' }, { start: '12:00', end: '14:00' }]);
    const [saving, setSaving] = useState(false);

    const setSession = (i: number, p: Partial<{ start: string; end: string }>) => setSessions(s => s.map((x, j) => (j === i ? { ...x, ...p } : x)));

    const go = async () => {
        if (!classIds.length) return toast.error('Choose at least one class.');
        if (!startDate || !endDate) return toast.error('Choose the start and end dates.');
        if (!window.confirm('This replaces the unlocked entries for the chosen classes. Continue?')) return;
        setSaving(true);
        try {
            const res = await axios.post(`${TT_API}/docs/${docId}/generate-exams`, { classIds, startDate, endDate, includeWeekends, papersPerDay, sessions }, withCreds);
            toast.success(res.data.msg);
            onDone({ msg: res.data.msg, warnings: res.data.warnings || [] });
        } catch (err) { toast.error(apiError(err, 'Could not schedule.')); setSaving(false); }
    };

    return (
        <Dialog open onOpenChange={o => !o && onClose()}>
            <DialogContent>
                <DialogHeader><DialogTitle>Auto-schedule</DialogTitle><DialogDescription>Papers are taken from each class's subjects and spread across the dates. Edit or add entries afterwards.</DialogDescription></DialogHeader>
                <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                        <Label t="First day"><input type="date" className={inputCls} value={startDate} onChange={e => setStart(e.target.value)} /></Label>
                        <Label t="Last day"><input type="date" className={inputCls} value={endDate} onChange={e => setEnd(e.target.value)} /></Label>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <Label t="Papers per day"><select className={inputCls} value={papersPerDay} onChange={e => setPapers(Number(e.target.value))}>{[1, 2, 3, 4].map(n => <option key={n}>{n}</option>)}</select></Label>
                        <label className="flex cursor-pointer items-center gap-2 pt-6 text-sm text-slate-600"><input type="checkbox" className="accent-[#1E4DA6]" checked={includeWeekends} onChange={e => setWeekends(e.target.checked)} /> Include weekends</label>
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center justify-between"><span className="text-xs font-semibold text-slate-600">Daily sessions</span>
                            <button className="text-xs font-bold text-[#1E4DA6]" onClick={() => setSessions(s => [...s, { start: '09:00', end: '11:00' }])}>+ Add session</button></div>
                        {sessions.map((s, i) => (
                            <div key={i} className="flex items-center gap-2">
                                <input type="time" className={inputCls} value={s.start} onChange={e => setSession(i, { start: e.target.value })} />
                                <span className="text-slate-400">to</span>
                                <input type="time" className={inputCls} value={s.end} onChange={e => setSession(i, { end: e.target.value })} />
                                {sessions.length > 1 && <button className="text-slate-400 hover:text-red-500" onClick={() => setSessions(x => x.filter((_, j) => j !== i))}><Trash2 className="h-4 w-4" /></button>}
                            </div>
                        ))}
                    </div>
                    <div>
                        <div className="mb-1 flex items-center justify-between"><span className="text-xs font-semibold text-slate-600">Classes ({classIds.length})</span>
                            <span className="text-xs"><button className="font-bold text-[#1E4DA6]" onClick={() => setClassIds(meta.classes.map(c => c.id))}>All</button> · <button className="font-bold text-[#1E4DA6]" onClick={() => setClassIds([])}>None</button></span></div>
                        <div className="grid max-h-36 gap-1 overflow-auto rounded-lg border border-slate-200 p-2 sm:grid-cols-2">
                            {meta.classes.map(c => (
                                <label key={c.id} className="flex items-center gap-2 text-xs text-slate-600">
                                    <input type="checkbox" className="accent-[#1E4DA6]" checked={classIds.includes(c.id)} onChange={e => setClassIds(s => (e.target.checked ? [...s, c.id] : s.filter(x => x !== c.id)))} /> {c.name}
                                </label>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="flex justify-end gap-2 pt-2"><Button variant="outline" onClick={onClose}>Cancel</Button><Button disabled={saving} onClick={go}>{saving ? <Loader2 className="animate-spin" /> : <Sparkles />} Schedule</Button></div>
            </DialogContent>
        </Dialog>
    );
}
