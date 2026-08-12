import { Input } from '../../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Eye, Save, Mail, Search, Lock } from 'lucide-react';
import { useState } from 'react';
import { SettingsShell } from '../settings/shared/SettingsShell';
import { SettingsHero } from '../settings/shared/SettingsHero';

interface LoginRow { id: string; name: string; class: string; username: string; password: string; }

const MOCK_DATA: LoginRow[] = [
    { id: '223233', name: 'Agnes John', class: 'JSS1', username: 'agnes2', password: 'password123' }
];

export function ManageLogin() {
    const [showPassword, setShowPassword] = useState<{ [key: string]: boolean }>({});
    const [filterClass, setFilterClass] = useState('select');

    const togglePassword = (id: string) => setShowPassword(prev => ({ ...prev, [id]: !prev[id] }));

    return (
        <SettingsShell breadcrumbParent="Students" breadcrumbCurrent="Manage Login" tabLabel="Manage Login" tabIcon={<Lock className="h-3.5 w-3.5" />}>
            {/* Page Header */}
            <div className="mb-8">
                <div className="flex items-center gap-2 text-xs text-slate-400 font-mono mb-1"><span>Dashboard</span><span>/</span><span>Students</span><span>/</span><span>Manage Login</span></div>
                <h1 className="text-3xl font-black text-slate-800">Manage Login</h1>
                <p className="text-sm text-slate-500 mt-1">View and update student portal credentials.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Search Filter */}
                <div className="md:col-span-1 rounded-2xl border border-slate-200 bg-white shadow-sm p-6">
                    <div className="flex items-center justify-center gap-2 mb-6">
                        <div className="h-9 w-9 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 shrink-0"><Search className="h-4 w-4" /></div>
                        <h2 className="text-base font-black text-slate-800">Search</h2>
                    </div>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400">Search Student <span className="text-blue-600">*</span></label>
                            <Input className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 h-12 text-sm font-semibold text-slate-800 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" placeholder="Search Student" />
                        </div>
                        <div className="space-y-2">
                            <label className="font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400">Select Class <span className="text-blue-600">*</span></label>
                            <Select value={filterClass} onValueChange={setFilterClass}>
                                <SelectTrigger className="w-full rounded-xl border border-slate-200 px-4 py-3 h-12 bg-white text-slate-700 font-semibold"><SelectValue /></SelectTrigger>
                                <SelectContent><SelectItem value="select">All Classes</SelectItem><SelectItem value="jss1">JSS1</SelectItem><SelectItem value="jss2">JSS2</SelectItem><SelectItem value="jss3">JSS3</SelectItem></SelectContent>
                            </Select>
                        </div>
                        <button className="w-full text-center text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors mt-2">or, Reload All</button>
                    </div>
                </div>

                {/* Data Table */}
                <div className="md:col-span-3 rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                    <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/60 flex items-center gap-2">
                        <Lock className="h-4 w-4 text-blue-600" />
                        <h2 className="font-bold text-slate-800">Student Credentials</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm whitespace-nowrap">
                            <thead className="bg-slate-50 text-xs font-bold text-slate-400 uppercase tracking-wider">
                                <tr>
                                    <th className="px-5 py-3 text-left">ID</th>
                                    <th className="px-5 py-3 text-left">Student Name</th>
                                    <th className="px-5 py-3 text-left">Class</th>
                                    <th className="px-5 py-3 text-left">Username</th>
                                    <th className="px-5 py-3 text-left">Password</th>
                                    <th className="px-5 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {MOCK_DATA.map(student => (
                                    <tr key={student.id} className="hover:bg-slate-50/60 transition-colors">
                                        <td className="px-5 py-4 text-slate-500 font-mono text-xs">{student.id}</td>
                                        <td className="px-5 py-4 font-bold text-slate-800">{student.name}</td>
                                        <td className="px-5 py-4"><span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-bold">{student.class}</span></td>
                                        <td className="px-5 py-4">
                                            <Input defaultValue={student.username} className="h-9 w-32 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-800 focus:border-blue-400" />
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="relative flex items-center w-40">
                                                <Input type={showPassword[student.id] ? 'text' : 'password'} defaultValue={student.password}
                                                    className="h-9 w-full rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-800 focus:border-blue-400 pr-8 font-mono" />
                                                <button onClick={() => togglePassword(student.id)} className="absolute right-2 text-slate-400 hover:text-slate-600 transition-colors"><Eye className="h-4 w-4" /></button>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Save"><Save className="h-4 w-4" /></button>
                                                <button className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Send Email"><Mail className="h-4 w-4" /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/60 text-xs text-slate-400">Showing {MOCK_DATA.length} entries</div>
                </div>
            </div>
        </SettingsShell>
    );
}
