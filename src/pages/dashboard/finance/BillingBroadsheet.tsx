import { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { jsPDF } from 'jspdf';
import { Loader2, Table2, Search, FileText, ChevronRight, Download, FileDown } from 'lucide-react';
import { useFinanceMeta } from '../../../hooks/useFinanceMeta';

export default function BillingBroadsheet() {
    const { terms: metaTerms, sessions: metaSessions } = useFinanceMeta();
    const [data, setData] = useState<any[]>([]);
    const [columns, setColumns] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);

    const [filters, setFilters] = useState({ classId: '', term: '', academicYear: '', search: '' });
    const [classes, setClasses] = useState<any[]>([]);

    useEffect(() => {
        axios.get('/api/v1/classes/all', { withCredentials: true })
            .then(res => setClasses(res.data.classes || []))
            .catch(() => {});
    }, []);

    const fetchBroadsheet = useCallback(async () => {
        setLoading(true);
        try {
            const res = await axios.get(`/api/v1/finance-v2/broadsheet?${new URLSearchParams(filters as any)}`, { withCredentials: true });
            setData(res.data.students || []);
            setColumns(res.data.columns || []);
        } catch (e: any) {
            toast.error(e.response?.data?.msg || 'Failed to load broadsheet');
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => { fetchBroadsheet(); }, [fetchBroadsheet]);

    const filteredData = useMemo(() => {
        if (!filters.search) return data;
        const q = filters.search.toLowerCase();
        return data.filter(s => s.name.toLowerCase().includes(q) || s.admissionNo?.toLowerCase().includes(q));
    }, [data, filters.search]);

    const exportCsv = () => {
        if (!data.length) return;
        let csv = `Admission No,Student Name,Class,Expected,Paid,Balance,${columns.join(',')}\n`;
        filteredData.forEach(s => {
            let row = `${s.admissionNo},"${s.name}",${s.className},${s.expected},${s.paid},${s.balance}`;
            columns.forEach(col => {
                row += `,${s.items[col] || 0}`;
            });
            csv += row + '\n';
        });
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'billing_broadsheet.csv';
        a.click();
    };

    const exportPdf = () => {
        if (!filteredData.length) return;
        const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
        const pageWidth = doc.internal.pageSize.getWidth();
        const marginX = 10;
        const usableWidth = pageWidth - marginX * 2;
        let y = 15;

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.text('Billing Broadsheet', marginX, y);
        y += 6;

        const className = classes.find(c => c.id === filters.classId)?.name || 'All Classes';
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(100, 116, 139);
        doc.text(
            `Class: ${className}  •  Term: ${filters.term || 'All'}  •  Session: ${filters.academicYear || 'All'}  •  Generated: ${new Date().toLocaleString()}`,
            marginX, y
        );
        y += 8;

        const fixedHeaders = ['Adm No', 'Student', 'Class', 'Expected', 'Paid', 'Balance'];
        const fixedWidths = [20, 42, 24, 22, 22, 22];
        const fixedTotal = fixedWidths.reduce((a, b) => a + b, 0);
        const dynWidth = columns.length > 0 ? Math.max(16, Math.min(26, (usableWidth - fixedTotal) / columns.length)) : 0;
        const headers = [...fixedHeaders, ...columns];
        const widths = [...fixedWidths, ...columns.map(() => dynWidth)];

        const drawHeaderRow = () => {
            doc.setFillColor(241, 245, 249);
            doc.rect(marginX, y - 4, usableWidth, 6, 'F');
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(7);
            doc.setTextColor(71, 85, 105);
            let x = marginX + 1;
            headers.forEach((h, i) => {
                doc.text(String(h).slice(0, 18), x, y);
                x += widths[i];
            });
            y += 6;
        };

        drawHeaderRow();
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(30, 41, 59);

        filteredData.forEach((row, idx) => {
            if (y > doc.internal.pageSize.getHeight() - 15) {
                doc.addPage();
                y = 15;
                drawHeaderRow();
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(7.5);
                doc.setTextColor(30, 41, 59);
            }
            if (idx % 2 === 0) {
                doc.setFillColor(248, 250, 252);
                doc.rect(marginX, y - 3.5, usableWidth, 5, 'F');
            }
            const values = [
                row.admissionNo, row.name, row.className,
                row.expected.toLocaleString(), row.paid.toLocaleString(), row.balance.toLocaleString(),
                ...columns.map(col => (row.items[col] || 0).toLocaleString())
            ];
            let x = marginX + 1;
            values.forEach((v, i) => {
                doc.text(String(v ?? '').slice(0, 20), x, y);
                x += widths[i];
            });
            y += 5;
        });

        doc.save('billing_broadsheet.pdf');
    };

    return (
        <>
            <style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap');.bb-root,.bb-root *{font-family:'Plus Jakarta Sans',sans-serif!important}.bb-root .mono{font-family:'DM Mono',monospace!important}`}</style>
            <div className="bb-root min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-indigo-50/30 px-4 pb-20 pt-8 sm:px-6 lg:px-8">
                <div className="pointer-events-none fixed inset-0 opacity-[0.22]" style={{ backgroundImage: 'radial-gradient(circle,#94a3b8 1px,transparent 1px)', backgroundSize: '28px 28px' }} />
                <div className="relative z-10 mx-auto max-w-[1400px]">

                    {/* Breadcrumb */}
                    <div className="mb-5 flex items-center gap-1.5">
                        <span className="mono text-[10px] font-bold uppercase tracking-widest text-slate-500">Finance</span>
                        <ChevronRight className="h-3 w-3 text-slate-400" />
                        <span className="mono text-[10px] font-bold uppercase tracking-widest text-blue-600">Broadsheet</span>
                    </div>

                    <div className="mb-6 flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-700 to-purple-500 shadow-lg shadow-indigo-200">
                            <Table2 className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-extrabold text-slate-900">Billing Broadsheet</h1>
                            <p className="mono text-[10px] text-slate-400 uppercase tracking-widest">Aggregate View</p>
                        </div>
                    </div>

                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white/80 p-4 shadow-sm backdrop-blur-xl">
                        <div className="flex flex-wrap items-center gap-3">
                            <div className="relative flex-1 min-w-[180px]">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                <input className="pl-9 h-9 w-full rounded-xl border border-slate-200 text-sm outline-none px-3"
                                    placeholder="Search student..."
                                    value={filters.search}
                                    onChange={e => setFilters(s => ({ ...s, search: e.target.value }))} />
                            </div>
                            <select className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 outline-none focus:border-blue-400"
                                value={filters.classId} onChange={e => setFilters(s => ({ ...s, classId: e.target.value }))}>
                                <option value="">All Classes</option>
                                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                            <select className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 outline-none focus:border-blue-400"
                                value={filters.term} onChange={e => setFilters(s => ({ ...s, term: e.target.value }))}>
                                <option value="">All Terms</option>
                                {metaTerms.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                            <select className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 outline-none focus:border-blue-400"
                                value={filters.academicYear} onChange={e => setFilters(s => ({ ...s, academicYear: e.target.value }))}>
                                <option value="">All Sessions</option>
                                {metaSessions.map(sess => <option key={sess.id} value={sess.name}>{sess.name}</option>)}
                            </select>
                            <button onClick={() => setFilters({ classId:'', term:'', academicYear:'', search:'' })}
                                className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-500 hover:bg-slate-50">
                                Clear
                            </button>
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={exportCsv} disabled={!data.length}
                                className="h-9 px-3 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-1 disabled:opacity-50">
                                <Download className="h-4 w-4" /> Export CSV
                            </button>
                            <button onClick={exportPdf} disabled={!data.length}
                                className="h-9 px-3 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-1 disabled:opacity-50">
                                <FileDown className="h-4 w-4" /> Export PDF
                            </button>
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
                    ) : filteredData.length === 0 ? (
                        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 py-20 bg-white/50">
                            <FileText className="h-12 w-12 text-slate-200 mb-3" />
                            <p className="font-semibold text-slate-500">No data found</p>
                        </div>
                    ) : (
                        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden overflow-x-auto">
                            <table className="w-full text-sm text-left whitespace-nowrap min-w-[1000px] border-collapse border border-slate-200 [&_th]:border [&_th]:border-slate-200 [&_td]:border [&_td]:border-slate-200">
                                <thead className="bg-slate-50/60 border-b border-slate-50">
                                    <tr>
                                        <th className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 bg-slate-100 sticky left-0 z-10 w-16">Adm No</th>
                                        <th className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 bg-slate-100 sticky left-[120px] z-10 w-48">Student Name</th>
                                        <th className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">Class</th>
                                        <th className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-blue-600 bg-blue-50">Expected (₦)</th>
                                        <th className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-emerald-600 bg-emerald-50">Paid (₦)</th>
                                        <th className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-red-600 bg-red-50">Balance (₦)</th>
                                        {columns.map(col => (
                                            <th key={col} className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">{col} (₦)</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredData.map((row, idx) => (
                                        <tr key={row.id} className={idx % 2 === 0 ? 'bg-white hover:bg-slate-50' : 'bg-slate-50/30 hover:bg-slate-50'}>
                                            <td className="px-4 py-2 mono text-xs text-slate-500 bg-white sticky left-0 z-10 shadow-[1px_0_0_0_#e2e8f0] w-[120px] truncate">{row.admissionNo}</td>
                                            <td className="px-4 py-2 font-semibold text-slate-800 bg-white sticky left-[120px] z-10 shadow-[1px_0_0_0_#e2e8f0] w-48 truncate">{row.name}</td>
                                            <td className="px-4 py-2 text-xs text-slate-600">{row.className}</td>
                                            <td className="px-4 py-2 font-bold text-blue-700 bg-blue-50/30">{row.expected.toLocaleString()}</td>
                                            <td className="px-4 py-2 font-bold text-emerald-700 bg-emerald-50/30">{row.paid.toLocaleString()}</td>
                                            <td className="px-4 py-2 font-bold text-red-700 bg-red-50/30">{row.balance.toLocaleString()}</td>
                                            {columns.map(col => (
                                                <td key={col} className="px-4 py-2 text-slate-600 mono text-xs">{row.items[col] ? row.items[col].toLocaleString() : '-'}</td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
