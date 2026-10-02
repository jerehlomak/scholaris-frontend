import { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { CreditCard, Loader2, Printer, RefreshCw, Sparkles, Link2, Ban, RotateCcw, Eye, Search } from 'lucide-react';
import { SettingsShell } from '../settings/shared/SettingsShell';
import { SettingsHero } from '../settings/shared/SettingsHero';
import { cn } from '../../../lib/utils';
import { IdCardView } from './IdCardView';
import { PrintSheets, type PrintGroup, type PrintSides } from './PrintSheets';
import { apiError, ID_CARD_API, useIdCardConfig } from './useIdCard';
import type { Audience, CardItem, Person, CardSummary } from './types';

interface PersonRow extends Person { card?: CardSummary | null; valid?: boolean }
interface Group { key: string; classId: string | null; title: string; people: PersonRow[] }

const origin = () => window.location.origin;
const cfg = { withCredentials: true } as const;

export function IdCardGenerate() {
    const [audience, setAudience] = useState<Audience>('STUDENT');
    const { config, school, loading: configLoading } = useIdCardConfig(audience);

    const [people, setPeople] = useState<PersonRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [classFilter, setClassFilter] = useState('ALL'); // group key, or ALL
    const [busy, setBusy] = useState<string | null>(null);

    const [open, setOpen] = useState<Group | null>(null);
    const [items, setItems] = useState<CardItem[]>([]);
    const [itemsLoading, setItemsLoading] = useState(false);
    const [side, setSide] = useState<'front' | 'back'>('front');

    const [printSides, setPrintSides] = useState<PrintSides>('both');
    const [printing, setPrinting] = useState<PrintGroup[] | null>(null);
    const [progress, setProgress] = useState<string | null>(null);

    const loadPeople = useCallback(async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${ID_CARD_API}/people`, { ...cfg, params: { audience } });
            setPeople(res.data.people || []);
        } catch (err) {
            toast.error(apiError(err, 'Could not load people.'));
        } finally {
            setLoading(false);
        }
    }, [audience]);

    useEffect(() => { setOpen(null); setItems([]); setSearch(''); setClassFilter('ALL'); loadPeople(); }, [loadPeople]);

    // Students are grouped class by class; staff are a single group.
    const searchedGroups: Group[] = useMemo(() => {
        const q = search.trim().toLowerCase();
        const filtered = q ? people.filter(p => p.name.toLowerCase().includes(q) || p.idNumber.toLowerCase().includes(q) || p.classOrRole.toLowerCase().includes(q)) : people;
        if (audience === 'STAFF') return filtered.length ? [{ key: 'staff', classId: null, title: 'All Staff', people: filtered }] : [];
        const map = new Map<string, Group>();
        for (const p of filtered) {
            const key = p.classId || p.classOrRole || 'none';
            if (!map.has(key)) map.set(key, { key, classId: p.classId, title: p.classOrRole || 'Unassigned', people: [] });
            map.get(key)!.people.push(p);
        }
        return [...map.values()];
    }, [people, search, audience]);

    // Dropdown options come from everyone (not the search), so a class never vanishes from the list.
    const classOptions = useMemo(() => {
        const seen = new Map<string, string>();
        for (const p of people) {
            const key = p.classId || p.classOrRole || 'none';
            if (!seen.has(key)) seen.set(key, p.classOrRole || 'Unassigned');
        }
        return [...seen.entries()].map(([key, title]) => ({ key, title }))
            .sort((a, b) => a.title.localeCompare(b.title, undefined, { numeric: true }));
    }, [people]);

    const groups = useMemo(
        () => (classFilter === 'ALL' ? searchedGroups : searchedGroups.filter(g => g.key === classFilter)),
        [searchedGroups, classFilter],
    );
    const selectedGroup = classFilter === 'ALL' ? null : (groups[0] ?? null);

    const totals = useMemo(() => ({
        all: people.length,
        withCards: people.filter(p => p.card).length,
        noPhoto: people.filter(p => !p.hasPhoto).length,
    }), [people]);

    const fetchCards = async (group: Group): Promise<CardItem[]> => {
        const res = await axios.get(`${ID_CARD_API}/cards`, { ...cfg, params: { audience, classId: group.classId || undefined, origin: origin() } });
        return res.data.items as CardItem[];
    };

    const openGroup = async (group: Group) => {
        setOpen(group); setItems([]); setItemsLoading(true);
        try { setItems(await fetchCards(group)); }
        catch (err) { toast.error(apiError(err, 'Could not load cards.')); }
        finally { setItemsLoading(false); }
    };

    const generate = async (opts: { classId?: string | null; renew?: boolean; reissueIds?: string[] }, label: string) => {
        setBusy(label);
        try {
            const res = await axios.post(`${ID_CARD_API}/generate`, {
                audience, classId: opts.classId || undefined, renew: !!opts.renew,
                ...(opts.reissueIds ? { ids: opts.reissueIds, reissue: true } : {}),
            }, cfg);
            toast.success(res.data.msg);
            await loadPeople();
            if (open) openGroup(open);
        } catch (err) {
            toast.error(apiError(err, 'Could not generate cards.'));
        } finally {
            setBusy(null);
        }
    };

    const setStatus = async (profileId: string, status: 'ACTIVE' | 'REVOKED') => {
        try {
            await axios.patch(`${ID_CARD_API}/status`, { audience, profileId, status }, cfg);
            toast.success(status === 'REVOKED' ? 'Card revoked' : 'Card reactivated');
            await loadPeople();
            if (open) openGroup(open);
        } catch (err) { toast.error(apiError(err, 'Could not update card.')); }
    };

    const copyLink = async (token: string) => {
        try { await navigator.clipboard.writeText(`${origin()}/id/${token}`); toast.success('Digital ID link copied'); }
        catch { toast.error('Could not copy the link'); }
    };

    const printGroups = async (selected: Group[]) => {
        if (!config) return;
        const result: PrintGroup[] = [];
        try {
            for (let i = 0; i < selected.length; i++) {
                setProgress(`Preparing ${selected[i].title} (${i + 1}/${selected.length})…`);
                // Reuse already-loaded items for the open group; fetch the rest class by class.
                const groupItems = open && open.key === selected[i].key && items.length ? items : await fetchCards(selected[i]);
                result.push({ title: selected[i].title, items: groupItems });
            }
        } catch (err) {
            toast.error(apiError(err, 'Could not prepare cards for printing.'));
            setProgress(null);
            return;
        }
        setProgress(null);
        const printable = result.reduce((n, g) => n + g.items.filter(it => it.card && it.card.status === 'ACTIVE').length, 0);
        if (printable === 0) { toast.error('No generated cards to print here yet. Click Generate first.'); return; }
        const skipped = result.reduce((n, g) => n + g.items.length, 0) - printable;
        if (skipped > 0) toast.info(`${skipped} without an active card were left out.`);
        setPrinting(result);
    };

    const chooseClass = (key: string) => {
        setClassFilter(key);
        if (key === 'ALL') { setOpen(null); setItems([]); return; }
        const g = searchedGroups.find(x => x.key === key);
        if (g) openGroup(g);
    };

    const missingFor = (g: Group) => g.people.filter(p => !p.card).length;
    const label = audience === 'STUDENT' ? 'students' : 'staff';

    return (
        <SettingsShell breadcrumbParent="ID Card" breadcrumbCurrent="Generate & Print" tabLabel="Generate & Print" tabIcon={<CreditCard className="h-3.5 w-3.5" />}>
            <SettingsHero
                icon={<CreditCard className="h-7 w-7" />}
                title="Generate & Print ID Cards"
                subtitle="Generate a card for every registered student and staff member in one click, then print or save them as PDF class by class."
            />

            <div className="mb-6 flex flex-wrap items-center gap-3">
                <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1">
                    {(['STUDENT', 'STAFF'] as const).map(a => (
                        <button key={a} onClick={() => setAudience(a)} className={cn('rounded-lg px-5 py-2 text-sm font-bold transition-colors', audience === a ? 'bg-[#173F8C] text-white shadow' : 'text-slate-500 hover:text-slate-800')}>
                            {a === 'STUDENT' ? 'Students' : 'Staff'}
                        </button>
                    ))}
                </div>
                {audience === 'STUDENT' && (
                    <select value={classFilter} onChange={e => chooseClass(e.target.value)}
                        className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 outline-none focus:border-[#1E4DA6]/60 focus:ring-2 focus:ring-[#1E4DA6]/10">
                        <option value="ALL">All classes</option>
                        {classOptions.map(o => <option key={o.key} value={o.key}>{o.title}</option>)}
                    </select>
                )}
                <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder={`Search ${label}…`}
                        className="h-10 w-56 rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm font-semibold outline-none focus:border-[#1E4DA6]/60 focus:ring-2 focus:ring-[#1E4DA6]/10" />
                </div>
                <div className="ml-auto flex flex-wrap items-center gap-2">
                    <select value={printSides} onChange={e => setPrintSides(e.target.value as PrintSides)} className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none">
                        <option value="both">Print: fronts + backs</option>
                        <option value="front">Print: fronts only</option>
                        <option value="back">Print: backs only</option>
                    </select>
                    {selectedGroup && (
                        <>
                            <button disabled={!!busy || missingFor(selectedGroup) === 0} onClick={() => generate({ classId: selectedGroup.classId }, selectedGroup.key)}
                                className="flex h-10 items-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-bold text-white shadow hover:bg-emerald-700 disabled:opacity-50"
                                title={missingFor(selectedGroup) === 0 ? 'Every student in this class already has a card' : undefined}>
                                {busy === selectedGroup.key ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                                Generate {selectedGroup.title}{missingFor(selectedGroup) > 0 ? ` (${missingFor(selectedGroup)})` : ''}
                            </button>
                            <button disabled={!!progress || missingFor(selectedGroup) === selectedGroup.people.length} onClick={() => printGroups([selectedGroup])}
                                className="flex h-10 items-center gap-2 rounded-xl bg-[#173F8C] px-4 text-sm font-bold text-white shadow hover:bg-[#122F69] disabled:opacity-50">
                                <Printer className="h-4 w-4" /> Print {selectedGroup.title}
                            </button>
                        </>
                    )}
                    <button disabled={!!busy || loading || totals.all === 0} onClick={() => generate({}, 'all')}
                        className="flex h-10 items-center gap-2 rounded-xl bg-[#173F8C] px-4 text-sm font-bold text-white shadow hover:bg-[#122F69] disabled:opacity-50">
                        {busy === 'all' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                        Generate for all {label}
                    </button>
                    <button disabled={!!busy || loading || totals.withCards === 0} onClick={() => generate({ renew: true }, 'renew')}
                        className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50" title="Recalculate the expiry date of existing cards from the current settings">
                        {busy === 'renew' ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />} Renew expiry
                    </button>
                    <button disabled={!!progress || groups.length === 0} onClick={() => printGroups(searchedGroups.filter(g => g.people.some(p => p.card)))}
                        className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50">
                        <Printer className="h-4 w-4" /> {audience === 'STUDENT' ? 'Print all classes' : 'Print all staff'}
                    </button>
                </div>
            </div>

            {progress && <div className="mb-4 flex items-center gap-2 rounded-xl bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700"><Loader2 className="h-4 w-4 animate-spin" />{progress}</div>}

            <div className="mb-6 grid grid-cols-3 gap-3">
                {[
                    { l: `Registered ${label}`, v: totals.all },
                    { l: 'Cards generated', v: totals.withCards },
                    { l: 'Without a photo', v: totals.noPhoto, warn: totals.noPhoto > 0 },
                ].map(s => (
                    <div key={s.l} className="rounded-2xl border border-slate-200 bg-white p-4">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{s.l}</p>
                        <p className={cn('text-2xl font-black', s.warn ? 'text-amber-600' : 'text-slate-800')}>{s.v}</p>
                    </div>
                ))}
            </div>

            {loading || configLoading ? (
                <div className="flex h-40 items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-[#1E4DA6]" /></div>
            ) : groups.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center text-sm font-semibold text-slate-400">
                    No registered {label} found{search ? ' for that search' : ''}.
                </div>
            ) : (
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">
                            <tr><th className="px-4 py-3">{audience === 'STUDENT' ? 'Class' : 'Group'}</th><th className="px-4 py-3">{label}</th><th className="px-4 py-3">Cards</th><th className="px-4 py-3 text-right">Actions</th></tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {groups.map(g => {
                                const missing = missingFor(g);
                                return (
                                    <tr key={g.key} className={cn(open?.key === g.key && 'bg-[#1E4DA6]/5')}>
                                        <td className="px-4 py-3 font-bold text-slate-800">{g.title}</td>
                                        <td className="px-4 py-3 text-slate-600">{g.people.length}</td>
                                        <td className="px-4 py-3">
                                            {missing === 0
                                                ? <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">All generated</span>
                                                : <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700">{missing} to generate</span>}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex flex-wrap justify-end gap-2">
                                                {missing > 0 && (
                                                    <button disabled={!!busy} onClick={() => generate({ classId: g.classId }, g.key)} className="flex items-center gap-1.5 rounded-lg bg-[#173F8C] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#122F69] disabled:opacity-50">
                                                        {busy === g.key ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />} Generate
                                                    </button>
                                                )}
                                                <button onClick={() => openGroup(g)} className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50"><Eye className="h-3.5 w-3.5" /> Preview</button>
                                                <button disabled={!!progress || missing === g.people.length} onClick={() => printGroups([g])} className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-40"><Printer className="h-3.5 w-3.5" /> Print / PDF</button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {open && config && (
                <div className="mt-8">
                    <div className="mb-4 flex flex-wrap items-center gap-3">
                        <h3 className="text-lg font-black text-slate-800">{open.title}</h3>
                        <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5">
                            {(['front', 'back'] as const).map(s => (
                                <button key={s} onClick={() => setSide(s)} className={cn('rounded-md px-3 py-1 text-xs font-bold capitalize', side === s ? 'bg-slate-800 text-white' : 'text-slate-500')}>{s}</button>
                            ))}
                        </div>
                        <button onClick={() => setOpen(null)} className="ml-auto text-xs font-bold text-slate-400 hover:text-slate-700">Close preview</button>
                    </div>
                    {itemsLoading ? (
                        <div className="flex h-40 items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-[#1E4DA6]" /></div>
                    ) : (
                        <div className="grid grid-cols-[repeat(auto-fill,minmax(230px,1fr))] gap-6">
                            {items.map(it => (
                                <div key={it.person.id} className="flex flex-col items-center gap-2">
                                    <IdCardView config={config} school={school} person={it.person} card={it.card} qr={it.qr} side={side} preview={!it.card}
                                        style={{ boxShadow: '0 4px 14px rgba(15,23,42,.2)', opacity: it.card?.status === 'REVOKED' ? 0.45 : 1 }} />
                                    <div className="flex w-full items-center justify-between gap-2 px-1 text-xs">
                                        <span className="truncate font-semibold text-slate-600">{it.person.name}</span>
                                        {!it.card ? (
                                            <span className="shrink-0 rounded bg-amber-50 px-1.5 py-0.5 font-bold text-amber-700">Not generated</span>
                                        ) : (
                                            <span className="flex shrink-0 items-center gap-1">
                                                {it.card.status === 'REVOKED' && <span className="rounded bg-red-50 px-1.5 py-0.5 font-bold text-red-600">Revoked</span>}
                                                {it.card.status === 'ACTIVE' && !it.valid && <span className="rounded bg-red-50 px-1.5 py-0.5 font-bold text-red-600">Expired</span>}
                                                <button title="Copy digital ID link" onClick={() => copyLink(it.card!.token)} className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"><Link2 className="h-3.5 w-3.5" /></button>
                                                <button title="Reissue (new QR) — for a lost card" onClick={() => window.confirm(`Reissue ${it.person.name}'s card? The old QR code will stop working.`) && generate({ reissueIds: [it.person.id] }, 'reissue')} className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"><RotateCcw className="h-3.5 w-3.5" /></button>
                                                <button title={it.card.status === 'REVOKED' ? 'Reactivate' : 'Revoke'} onClick={() => setStatus(it.person.id, it.card!.status === 'REVOKED' ? 'ACTIVE' : 'REVOKED')} className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-red-600"><Ban className="h-3.5 w-3.5" /></button>
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {printing && config && (
                <PrintSheets groups={printing} sides={printSides} config={config} school={school} onDone={() => setPrinting(null)} />
            )}
        </SettingsShell>
    );
}
