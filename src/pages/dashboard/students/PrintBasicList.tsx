import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Search, Printer, Download } from 'lucide-react';
import { useState } from 'react';
import { SettingsShell } from '../settings/shared/SettingsShell';
import { SettingsHero } from '../settings/shared/SettingsHero';

interface StudentRow { sr: number; id: string; name: string; father: string; class: string; fee: string; phone: string; }

const MOCK_DATA: StudentRow[] = [
    { sr: 1, id: '223233', name: 'Agnes John', father: '', class: 'JSS1', fee: '₦ 0', phone: '' }
];

export function PrintBasicList() {
    const [selectedClass, setSelectedClass] = useState('all');
    const [search, setSearch] = useState('');

    const filtered = MOCK_DATA.filter(s =>
        (selectedClass === 'all' || s.class.toLowerCase() === selectedClass) &&
        (!search || s.name.toLowerCase().includes(search.toLowerCase()))
    );

    return (
        <SettingsShell breadcrumbParent="Students" breadcrumbCurrent="Print Basic List" tabLabel="Print Basic List" tabIcon={<Printer className="h-3.5 w-3.5" />}>
            {/* Page Header */}
            <div className="mb-8">
                <div className="flex items-center gap-2 text-xs text-slate-400 font-mono mb-1"><span>Dashboard</span><span>/</span><span>Students</span><span>/</span><span>Print Basic List</span></div>
                <h1 className="text-3xl font-black text-slate-800">Print Basic List</h1>
                <p className="text-sm text-slate-500 mt-1">Generate and print a student list for a class or the whole school.</p>
            </div>

            {/* Controls */}
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-end gap-4">
                    <div className="space-y-2 min-w-[200px]">
                        <label className="font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400">Select Class <span className="text-blue-600">*</span></label>
                        <Select value={selectedClass} onValueChange={setSelectedClass}>
                            <SelectTrigger className="w-full rounded-xl border border-slate-200 px-4 py-3 h-12 bg-white text-slate-700 font-semibold"><SelectValue /></SelectTrigger>
                            <SelectContent><SelectItem value="all">All Classes</SelectItem><SelectItem value="jss1">JSS1</SelectItem><SelectItem value="jss2">JSS2</SelectItem><SelectItem value="jss3">JSS3</SelectItem></SelectContent>
                        </Select>
                    </div>
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                        <input type="text" placeholder="Search students..." value={search} onChange={e => setSearch(e.target.value)}
                            className="w-full pl-9 pr-4 h-12 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-800 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all" />
                    </div>
                    <div className="flex gap-2 shrink-0">
                        {[{ icon: <Printer className="h-4 w-4" />, label: 'Print' }, { icon: <Download className="h-4 w-4" />, label: 'PDF' }].map(b => (
                            <button key={b.label} className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors">
                                {b.icon}{b.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-sm whitespace-nowrap">
                        <thead className="bg-blue-700 text-white text-xs font-bold uppercase tracking-wider">
                            <tr>
                                <th className="px-5 py-3 text-left">Sr</th>
                                <th className="px-5 py-3 text-left">ID</th>
                                <th className="px-5 py-3 text-left">Student Name</th>
                                <th className="px-5 py-3 text-left">Father</th>
                                <th className="px-5 py-3 text-left">Class</th>
                                <th className="px-5 py-3 text-left">Fee Remaining</th>
                                <th className="px-5 py-3 text-left">Phone</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filtered.map(student => (
                                <tr key={student.id} className="hover:bg-slate-50/60 transition-colors">
                                    <td className="px-5 py-4 text-slate-500 font-mono text-xs">{student.sr}</td>
                                    <td className="px-5 py-4 text-slate-500 font-mono text-xs">{student.id}</td>
                                    <td className="px-5 py-4 font-bold text-slate-800">{student.name}</td>
                                    <td className="px-5 py-4 text-slate-600">{student.father || <span className="text-slate-300 italic">N/A</span>}</td>
                                    <td className="px-5 py-4"><span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-bold">{student.class}</span></td>
                                    <td className="px-5 py-4 font-bold text-red-500">{student.fee}</td>
                                    <td className="px-5 py-4 text-slate-600">{student.phone || <span className="text-slate-300 italic">N/A</span>}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="p-4 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between text-xs text-slate-400">
                    <span>Showing {filtered.length} of {MOCK_DATA.length} entries</span>
                </div>
            </div>
        </SettingsShell>
    );
}
