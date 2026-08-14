import { useViewPreference } from '../../../hooks/useViewPreference';
import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { KeyRound, Layers, FileDown, Hash, Clock, DatabaseZap, CheckCircle2, XCircle, Printer } from 'lucide-react';
import { toast } from 'sonner';
import PrintVouchers from './PrintVouchers';
import { SettingsShell } from '../settings/shared/SettingsShell';
import { SettingsHero } from '../settings/shared/SettingsHero';
import { ViewToggle } from '../../../components/shared/ViewToggle';
import { Pagination } from '../../../components/shared/Pagination';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

const T = {
    bg: '#f5f6fa',
    surface: '#ffffff',
    border: '#e4e7f0',
    text: '#1a1d2e',
    textMuted: '#7b829e',
    cyan: '#0099c6',
    emerald: '#10b981',
    emeraldBg: '#d1fae5',
    indigo: '#6366f1',
    indigoBg: '#e0e7ff',
};

function formatDate(dateString: string) {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
}

function UsageBar({ used, total }: { used: number; total: number }) {
    const pct = total > 0 ? Math.round((used / total) * 100) : 0;
    const color = pct >= 90 ? '#ef4444' : pct >= 50 ? '#f59e0b' : '#10b981';
    return (
        <div className="flex items-center gap-2 min-w-[100px]">
            <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                <div style={{ width: `${pct}%`, background: color }} className="h-full rounded-full transition-all duration-500" />
            </div>
            <span className="text-xs font-mono font-bold" style={{ color }}>{pct}%</span>
        </div>
    );
}

function PinTypeBadge({ type }: { type: string }) {
    if (!type) return null;
    const label = type.replace(/_/g, ' ').replace(/\w\S*/g, w => w.charAt(0).toUpperCase() + w.substring(1).toLowerCase());
    
    let colors = 'bg-slate-100 text-slate-600';
    if (type === 'RESULT_CHECKING') colors = 'bg-[#1E4DA6]/10 text-[#173F8C]';
    if (type === 'ADMISSION_APPLICATION') colors = 'bg-[#1E4DA6]/10 text-[#173F8C]';
    if (type === 'EMPLOYMENT') colors = 'bg-amber-100 text-amber-700';

    return <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${colors}`}>{label}</span>;
}

export default function PinManager() {
    const [batches, setBatches] = useState<any[]>([]);
    const [pins, setPins] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'BATCHES' | 'PINS'>('BATCHES');
    const [stats, setStats] = useState({ total: 0, used: 0, active: 0 });
    const [printMode, setPrintMode] = useState(false);
    const [isPreparingPrint, setIsPreparingPrint] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [printData, setPrintData] = useState<any[]>([]);
    const [pinTypeFilter, setPinTypeFilter] = useState('RESULT_CHECKING');
    const [statusFilter, setStatusFilter] = useState('ALL');
    
    const [view, setView] = useViewPreference('pinmanager');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);
    const [limit, setLimit] = useState(20);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const [bRes, pRes] = await Promise.all([
                axios.get(`${API_BASE}/api/v1/pins/batches?pinType=${pinTypeFilter}`, { withCredentials: true }),
                axios.get(`${API_BASE}/api/v1/pins/list?page=${page}&limit=${limit}&pinType=${pinTypeFilter}&status=${statusFilter === 'ALL' ? '' : statusFilter}`, { withCredentials: true }),
            ]);

            const fetchedBatches = bRes.data.batches || [];
            setBatches(fetchedBatches);
            setPins(pRes.data.pins || []);
            setTotalPages(pRes.data.totalPages || 1);
            setTotalRecords(pRes.data.total || 0);

            let t = 0; let u = 0;
            fetchedBatches.forEach((b: any) => { t += (b.totalPins || 0); u += (b.usedPins || 0); });
            setStats({ total: t, used: u, active: t - u });
        } catch (err: any) {
            toast.error(err?.response?.data?.message || err?.message || 'Failed to load PIN data');
        } finally {
            setLoading(false);
        }
    }, [page, limit, pinTypeFilter, statusFilter]);

    useEffect(() => { loadData(); }, [loadData]);

    const handleExport = async () => {
        setIsExporting(true);
        try {
            const res = await axios.get(`${API_BASE}/api/v1/pins/list?limit=10000&pinType=${pinTypeFilter}&status=${statusFilter === 'ALL' ? '' : statusFilter}`, { withCredentials: true });
            const fetchedPins = res.data.pins || [];
            
            if (fetchedPins.length === 0) return toast.error('No PINs available to export.');
            
            const csvRows = ['PIN Code,Serial Number,Batch,Status,Student'];
            fetchedPins.forEach((p: any) => {
                const s = p.student ? `${p.student.firstName} ${p.student.lastName} (${p.student.admissionNo})` : 'Unassigned';
                csvRows.push(`${p.pinCode},${p.serialNumber},${p.batch?.batchNumber},${p.status},"${s}"`);
            });
            
            const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = `School-PINs-${new Date().toISOString().split('T')[0]}.csv`;
            a.click();
        } catch (err: any) {
            toast.error('Failed to export pins');
        } finally {
            setIsExporting(false);
        }
    };

    const handlePreparePrint = async () => {
        setIsPreparingPrint(true);
        try {
            const res = await axios.get(`${API_BASE}/api/v1/pins/list?limit=10000&pinType=${pinTypeFilter}&status=${statusFilter === 'ALL' ? 'ACTIVE' : statusFilter}`, { withCredentials: true });
            const fetchedPins = res.data.pins || [];
            if (fetchedPins.length === 0) {
                toast.error('No active PINs available to print for this category.');
                return;
            }
            setPrintData(fetchedPins);
            setPrintMode(true);
        } catch (err: any) {
            toast.error('Failed to prepare pins for printing');
        } finally {
            setIsPreparingPrint(false);
        }
    };

    const handleReactivatePin = async (pinId: string) => {
        if (!confirm('Are you sure you want to reactivate this PIN? It will reset its usage count to 0.')) return;
        try {
            await axios.patch(`${API_BASE}/api/v1/school-pins/${pinId}/reactivate`, {}, { withCredentials: true });
            toast.success('PIN reactivated successfully');
            loadData();
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Failed to reactivate PIN');
        }
    };

    const handleRevealPin = async (pinId: string) => {
        try {
            const res = await axios.get(`${API_BASE}/api/v1/school-pins/${pinId}/reveal`, { withCredentials: true });
            toast.success(`PIN Revealed: ${res.data.pinCode}`, { duration: 10000 });
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Failed to reveal PIN');
        }
    };

    return (
        <SettingsShell breadcrumbCurrent="PINs & Cards" tabLabel="Manager" tabIcon={<KeyRound className="h-3.5 w-3.5" />}>
            <SettingsHero
                icon={<KeyRound className="h-7 w-7" />}
                title="PIN & Scratch Cards"
                subtitle="Manage prepaid PINs assigned to your school by the platform administrator."
            >
                {activeTab === 'PINS' && (
                    <div className="flex flex-wrap gap-2 justify-center mt-5">
                        <button 
                            disabled={isPreparingPrint}
                            onClick={handlePreparePrint}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl bg-slate-800 text-white shadow-md transition-all hover:-translate-y-0.5 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap">
                            {isPreparingPrint ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Preparing...</> : <><Printer size={15} /> Print Vouchers</>}
                        </button>
                        <button 
                            disabled={isExporting}
                            onClick={handleExport}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl text-white shadow-md transition-all hover:-translate-y-0.5 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                            style={{ background: T.cyan }}>
                            {isExporting ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Exporting...</> : <><FileDown size={15} /> Export CSV</>}
                        </button>
                    </div>
                )}
            </SettingsHero>

            {/* ── KPI Cards ────────────────────────────────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                {[
                    { icon: <Layers size={20} strokeWidth={2.5} />, value: stats.total, label: 'Total PINs Assigned', ibg: T.indigoBg, ic: T.indigo },
                    { icon: <KeyRound size={20} strokeWidth={2.5} />, value: stats.active, label: 'Active / Unused', ibg: T.emeraldBg, ic: T.emerald },
                    { icon: <DatabaseZap size={20} strokeWidth={2.5} />, value: stats.used, label: 'Consumed PINs', ibg: '#fef0f3', ic: '#e5445f' },
                ].map(({ icon, value, label, ibg, ic }) => (
                    <div key={label} className="rounded-2xl p-5 border shadow-sm flex flex-col gap-2 bg-white" style={{ borderColor: T.border }}>
                        <div className="w-10 h-10 rounded-xl flex justify-center items-center mb-1" style={{ background: ibg, color: ic }}>
                            {icon}
                        </div>
                        <div className="text-3xl font-bold font-mono">{value.toLocaleString()}</div>
                        <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</div>
                    </div>
                ))}
            </div>

            {/* ── Tabs ─────────────────────────────────────────── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b gap-4 sm:gap-0" style={{ borderColor: T.border }}>
                <div className="flex gap-4 sm:gap-6 overflow-x-auto pb-1 sm:pb-0 scrollbar-hide">
                    {[
                        { id: 'RESULT_CHECKING', label: 'Result Checking' },
                        { id: 'ADMISSION_APPLICATION', label: 'Admissions' },
                        { id: 'EMPLOYMENT', label: 'Employment' }
                    ].map(tab => (
                        <button key={tab.id}
                            onClick={() => { setPinTypeFilter(tab.id); setPage(1); }}
                            className="pb-3 text-sm font-bold transition-all border-b-2 whitespace-nowrap"
                            style={{
                                borderColor: pinTypeFilter === tab.id ? T.indigo : 'transparent',
                                color: pinTypeFilter === tab.id ? T.indigo : T.textMuted,
                            }}>
                            {tab.label}
                        </button>
                    ))}
                </div>
                <div className="flex flex-wrap items-center gap-2 sm:gap-4 pb-2">
                    <select
                        value={activeTab}
                        onChange={(e) => { setActiveTab(e.target.value as any); setPage(1); }}
                        className="text-xs font-semibold px-3 py-1.5 rounded-lg border focus:outline-none bg-white flex-1 sm:flex-none"
                        style={{ borderColor: T.border, color: T.text }}
                    >
                        <option value="PINS">Individual PINs</option>
                        <option value="BATCHES">Assigned Batches</option>
                    </select>
                    {activeTab === 'PINS' && (
                        <>
                        <select
                            value={statusFilter}
                            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                            className="text-xs font-semibold px-3 py-1.5 rounded-lg border focus:outline-none bg-white flex-1 sm:flex-none"
                            style={{ borderColor: T.border, color: T.text }}
                        >
                            <option value="ALL">All Status</option>
                            <option value="ACTIVE">Unused (Active)</option>
                            <option value="USED">Used</option>
                        </select>
                        <select
                            value={limit}
                            onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
                            className="text-xs font-semibold px-3 py-1.5 rounded-lg border focus:outline-none bg-white"
                            style={{ borderColor: T.border, color: T.text }}
                        >
                            <option value={20}>20 per page</option>
                            <option value={50}>50 per page</option>
                            <option value={100}>100 per page</option>
                        </select>
                        </>
                    )}
                    {activeTab === 'PINS' && (
                        <ViewToggle view={view} onChange={setView} />
                    )}
                </div>
            </div>

            {/* ── Content ──────────────────────────────────────── */}
            <div className="bg-white rounded-2xl border shadow-sm overflow-hidden" style={{ borderColor: T.border }}>

                {loading ? (
                    <div className="flex items-center justify-center p-16">
                        <div className="w-8 h-8 border-4 border-gray-200 border-t-indigo-500 rounded-full animate-spin" />
                    </div>

                ) : activeTab === 'BATCHES' ? (() => {
                    const paginatedBatches = batches.slice((page - 1) * limit, page * limit);
                    return (
                    <div className="flex flex-col min-h-0">
                        {/* Desktop table */}
                        <div className="hidden sm:block overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 font-bold border-b" style={{ borderColor: T.border }}>
                                    <tr>
                                        <th className="px-6 py-4">Batch Number</th>
                                        <th className="px-6 py-4">Type</th>
                                        <th className="px-6 py-4">Date Issued</th>
                                        <th className="px-6 py-4 text-center">Total</th>
                                        <th className="px-6 py-4 text-center">Used</th>
                                        <th className="px-6 py-4 text-center">Active</th>
                                        <th className="px-6 py-4">Usage</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y text-slate-700" style={{ borderColor: T.border }}>
                                    {paginatedBatches.length === 0 ? (
                                        <tr><td colSpan={6} className="py-12 text-center text-slate-400 text-sm">No batches assigned yet.</td></tr>
                                    ) : paginatedBatches.map(b => (
                                        <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <span className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center">
                                                        <Hash size={13} className="text-indigo-500" />
                                                    </span>
                                                    <span className="font-semibold text-slate-800 font-mono text-xs">{b.batchNumber}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <PinTypeBadge type={b.pinType} />
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-1.5 text-slate-500 text-xs">
                                                    <Clock size={12} />
                                                    {formatDate(b.createdAt)}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center font-bold font-mono">{b.totalPins ?? 0}</td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="inline-flex items-center gap-1 text-red-500 font-mono font-bold text-xs">
                                                    <XCircle size={11} /> {b.usedPins ?? 0}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="inline-flex items-center gap-1 text-emerald-600 font-mono font-bold text-xs">
                                                    <CheckCircle2 size={11} /> {(b.totalPins ?? 0) - (b.usedPins ?? 0)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <UsageBar used={b.usedPins ?? 0} total={b.totalPins ?? 0} />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile cards */}
                        <div className="sm:hidden divide-y" style={{ borderColor: T.border }}>
                            {paginatedBatches.length === 0 ? (
                                <p className="py-10 text-center text-slate-400 text-sm">No batches assigned yet.</p>
                            ) : paginatedBatches.map(b => {
                                const active = (b.totalPins ?? 0) - (b.usedPins ?? 0);
                                return (
                                    <div key={b.id} className="p-4 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <span className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center">
                                                    <Hash size={13} className="text-indigo-500" />
                                                </span>
                                                <span className="font-semibold text-slate-800 font-mono text-xs">{b.batchNumber}</span>
                                            </div>
                                            <div className="flex items-center gap-1 text-slate-400 text-xs">
                                                <PinTypeBadge type={b.pinType} />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-3 gap-2">
                                            {[
                                                { label: 'Total', value: b.totalPins ?? 0, color: T.indigo, bg: T.indigoBg },
                                                { label: 'Used', value: b.usedPins ?? 0, color: '#e5445f', bg: '#fef0f3' },
                                                { label: 'Active', value: active, color: T.emerald, bg: T.emeraldBg },
                                            ].map(({ label, value, color, bg }) => (
                                                <div key={label} className="rounded-xl py-2 px-3 text-center" style={{ background: bg }}>
                                                    <div className="text-lg font-bold font-mono" style={{ color }}>{value}</div>
                                                    <div className="text-[10px] font-semibold uppercase tracking-wide" style={{ color }}>{label}</div>
                                                </div>
                                            ))}
                                        </div>
                                        <UsageBar used={b.usedPins ?? 0} total={b.totalPins ?? 0} />
                                    </div>
                                );
                            })}
                        </div>
                        <div className="mt-auto">
                            <Pagination currentPage={page} totalPages={Math.ceil(batches.length / limit) || 1} totalRecords={batches.length} onPageChange={setPage} />
                        </div>
                    </div>
                    );
                })() : (
                    /* ── Individual PINs view ── */
                    <div className="flex flex-col min-h-0">
                        {view === 'table' && (
                            <>
                                {/* Desktop table */}
                                <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 font-bold border-b" style={{ borderColor: T.border }}>
                                    <tr>
                                        <th className="px-5 py-4">Serial No.</th>
                                        <th className="px-5 py-4">PIN Code</th>
                                        <th className="px-5 py-4">Type</th>
                                        <th className="px-5 py-4">Batch</th>
                                        <th className="px-5 py-4">Status</th>
                                        <th className="px-5 py-4">Linked Student</th>
                                        <th className="px-5 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y text-slate-700 font-mono text-xs" style={{ borderColor: T.border }}>
                                    {pins.length === 0 ? (
                                        <tr><td colSpan={5} className="py-12 text-center text-slate-400 font-sans text-sm">No PINs available.</td></tr>
                                    ) : pins.map(p => (
                                        <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-5 py-3 text-slate-400">{p.serialNumber}</td>
                                            <td className="px-5 py-3 font-bold text-indigo-600 tracking-widest">{p.pinCode}</td>
                                            <td className="px-5 py-3"><PinTypeBadge type={p.pinType} /></td>
                                            <td className="px-5 py-3 text-slate-500">{p.batch?.batchNumber}</td>
                                            <td className="px-5 py-3">
                                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg font-sans text-[10px] font-bold tracking-wider ${p.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>
                                                    {p.status === 'ACTIVE' ? <CheckCircle2 size={10} /> : <XCircle size={10} />}
                                                    {p.status}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3 font-sans">
                                                {p.student ? (
                                                    <span className="text-slate-800">
                                                        {p.student.firstName} {p.student.lastName}
                                                        <span className="text-slate-400 text-[10px] ml-1">({p.student.admissionNo})</span>
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-400 italic">Unassigned</span>
                                                )}
                                            </td>
                                            <td className="px-5 py-3 text-right">
                                                <div className="flex justify-end gap-2">
                                                    {p.student && (
                                                        <button onClick={() => handleRevealPin(p.id)} className="text-xs px-2 py-1 bg-indigo-50 text-indigo-600 rounded hover:bg-indigo-100 font-semibold transition-colors">
                                                            Reveal
                                                        </button>
                                                    )}
                                                    {(p.status === 'USED' || p.status === 'EXPIRED') && (
                                                        <button onClick={() => handleReactivatePin(p.id)} className="text-xs px-2 py-1 bg-emerald-50 text-emerald-600 rounded hover:bg-emerald-100 font-semibold transition-colors">
                                                            Reactivate
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                            </>
                        )}
                        
                        {view === 'grid' && (
                            <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {pins.length === 0 ? (
                                    <div className="col-span-full py-10 text-center text-slate-400 text-sm">No PINs available.</div>
                                ) : pins.map(p => (
                                    <div key={p.id} className="p-4 rounded-2xl border border-slate-200 bg-white hover:shadow-md transition-all space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="font-bold text-indigo-600 font-mono tracking-widest text-sm">{p.pinCode}</span>
                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold tracking-wider ${p.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>
                                                {p.status === 'ACTIVE' ? <CheckCircle2 size={10} /> : <XCircle size={10} />}
                                                {p.status}
                                            </span>
                                        </div>
                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                            <PinTypeBadge type={p.pinType} />
                                        </div>
                                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                                            <span><span className="font-semibold text-slate-700">S/N:</span> {p.serialNumber}</span>
                                            <span><span className="font-semibold text-slate-700">Batch:</span> {p.batch?.batchNumber}</span>
                                        </div>
                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                    <div className="text-xs">
                        {p.student ? (
                            <span className="text-slate-700 font-medium">
                                {p.student.firstName} {p.student.lastName}
                                <span className="text-slate-400 ml-1">({p.student.admissionNo})</span>
                            </span>
                        ) : (
                            <span className="text-slate-400 italic">No student linked</span>
                        )}
                    </div>
                    
                    <div className="flex justify-end gap-2">
                        {p.student && (
                            <button onClick={() => handleRevealPin(p.id)} className="text-xs px-2 py-1 bg-indigo-50 text-indigo-600 rounded hover:bg-indigo-100 font-semibold transition-colors">
                                Reveal
                            </button>
                        )}
                        {(p.status === 'USED' || p.status === 'EXPIRED') && (
                            <button onClick={() => handleReactivatePin(p.id)} className="text-xs px-2 py-1 bg-emerald-50 text-emerald-600 rounded hover:bg-emerald-100 font-semibold transition-colors">
                                Reactivate
                            </button>
                        )}
                    </div>
                </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        <div className="mt-auto">
                            <Pagination currentPage={page} totalPages={totalPages} totalRecords={totalRecords} onPageChange={setPage} />
                        </div>
                    </div>
                )}
            </div>

            {printMode && (
                <PrintVouchers 
                    pins={printData} 
                    onClose={() => setPrintMode(false)} 
                />
            )}
        </SettingsShell>
    );
}
