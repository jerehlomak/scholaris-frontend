import { useState } from 'react';
import { Users, Plus, Trash2, AlertCircle } from 'lucide-react';
import { SettingsShell } from './shared/SettingsShell';
import { SettingsHero } from './shared/SettingsHero';
import { SaveButton } from './shared/SaveButton';
import { cn } from '../../../lib/utils';

interface AttendanceCode {
    id: string;
    code: string;
    description: string;
    color: string;
    countsAsPresent: boolean;
    isSystemDefault: boolean;
}

const DEFAULT_CODES: AttendanceCode[] = [
    { id: 'c1', code: 'P', description: 'Present', color: '#6bc048', countsAsPresent: true, isSystemDefault: true },
    { id: 'c2', code: 'A', description: 'Absent', color: '#ef4444', countsAsPresent: false, isSystemDefault: true },
    { id: 'c3', code: 'L', description: 'Late', color: '#ff9800', countsAsPresent: true, isSystemDefault: false },
    { id: 'c4', code: 'E', description: 'Excused', color: '#0ea5e9', countsAsPresent: false, isSystemDefault: false },
    { id: 'c5', code: 'H', description: 'Half Day', color: '#a855f7', countsAsPresent: true, isSystemDefault: false },
];

const COLOR_OPTIONS = ['#6bc048', '#ef4444', '#ff9800', '#0ea5e9', '#a855f7', '#0036a1', '#ec4899', '#14b8a6', '#64748b', '#84cc16'];

export function AttendanceCodes() {
    const [codes, setCodes] = useState<AttendanceCode[]>(DEFAULT_CODES);
    const [saved, setSaved] = useState(false);

    const handleAdd = () => {
        setSaved(false);
        setCodes([...codes, { id: `c-${Date.now()}`, code: '', description: '', color: COLOR_OPTIONS[Math.floor(Math.random() * COLOR_OPTIONS.length)], countsAsPresent: false, isSystemDefault: false }]);
    };

    const handleUpdate = (id: string, field: keyof AttendanceCode, value: string | boolean) => {
        setSaved(false);
        setCodes(prev => prev.map(c => {
            if (c.id === id) {
                if (c.isSystemDefault && field === 'code') return c;
                return { ...c, [field]: value };
            }
            return c;
        }));
    };

    const handleDelete = (id: string) => {
        const code = codes.find(c => c.id === id);
        if (code?.isSystemDefault) return;
        setSaved(false);
        setCodes(prev => prev.filter(c => c.id !== id));
    };

    const handleSave = () => {
        if (!isValid) return;
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
    };

    const isValid = codes.every(c => c.code.trim() && c.description.trim());

    return (
        <SettingsShell breadcrumbParent="Attendance" breadcrumbCurrent="Attendance Codes" tabLabel="Register Codes" tabIcon={<Users className="h-3.5 w-3.5" />}>
            <SettingsHero
                icon={<Users className="h-7 w-7" />}
                title="Custom Attendance Logic"
                subtitle="Design the acronyms your teachers use during daily roll call, and decide whether codes like 'Late' count towards a student's attendance percentage."
            />

            {/* Column headers */}
            <div className="mb-3 hidden grid-cols-12 gap-4 px-4 sm:grid">
                <span className="col-span-2 font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400">Code</span>
                <span className="col-span-4 font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400">Description</span>
                <span className="col-span-3 font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400">Color</span>
                <span className="col-span-2 text-center font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400">Present?</span>
                <span className="col-span-1" />
            </div>

            <div className="space-y-3">
                {codes.map(item => (
                    <div
                        key={item.id}
                        className={cn(
                            'grid grid-cols-12 gap-3 items-center rounded-2xl border p-4 transition-all',
                            item.isSystemDefault ? 'border-slate-100 bg-slate-50/60' : 'border-slate-100 bg-white hover:border-blue-100 hover:shadow-sm'
                        )}
                    >
                        {/* Code */}
                        <div className="col-span-2 relative">
                            <input
                                value={item.code}
                                onChange={e => handleUpdate(item.id, 'code', e.target.value.substring(0, 3).toUpperCase())}
                                placeholder="L"
                                disabled={item.isSystemDefault}
                                className={cn(
                                    'w-full rounded-xl border px-3 py-2.5 text-center text-sm font-black tracking-widest outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100',
                                    item.isSystemDefault ? 'border-slate-200 bg-slate-100 text-slate-500 cursor-not-allowed' : 'border-slate-200 bg-white text-slate-800'
                                )}
                            />
                            {item.isSystemDefault && (
                                <span className="absolute -top-2 -right-1 rounded bg-slate-200 px-1 text-[8px] font-bold text-slate-500">SYS</span>
                            )}
                        </div>

                        {/* Description */}
                        <div className="col-span-4">
                            <input
                                value={item.description}
                                onChange={e => handleUpdate(item.id, 'description', e.target.value)}
                                placeholder="e.g. Late Arrival"
                                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                            />
                        </div>

                        {/* Color */}
                        <div className="col-span-3 flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white p-2.5 h-10 overflow-x-auto">
                            {COLOR_OPTIONS.map(c => (
                                <button
                                    key={c}
                                    onClick={() => handleUpdate(item.id, 'color', c)}
                                    className={cn('h-5 w-5 shrink-0 rounded-full transition-transform', item.color === c ? 'scale-125 ring-2 ring-offset-1 ring-slate-800' : 'opacity-70 hover:scale-110')}
                                    style={{ backgroundColor: c }}
                                />
                            ))}
                        </div>

                        {/* Toggle */}
                        <div className="col-span-2 flex justify-center">
                            <div className="flex flex-col items-center gap-1">
                                <button
                                    onClick={() => handleUpdate(item.id, 'countsAsPresent', !item.countsAsPresent)}
                                    className={cn('relative inline-flex h-5 w-9 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors', item.countsAsPresent ? 'bg-emerald-500' : 'bg-slate-200')}
                                >
                                    <span className={cn('inline-block h-4 w-4 rounded-full bg-white shadow transition-transform', item.countsAsPresent ? 'translate-x-4' : 'translate-x-0')} />
                                </button>
                                <span className={cn('text-[10px] font-bold', item.countsAsPresent ? 'text-emerald-600' : 'text-slate-400')}>
                                    {item.countsAsPresent ? 'YES' : 'NO'}
                                </span>
                            </div>
                        </div>

                        {/* Delete */}
                        <div className="col-span-1 flex  justify-end">
                            <button
                                onClick={() => handleDelete(item.id)}
                                disabled={item.isSystemDefault}
                                className={cn('rounded-lg p-2 transition-colors', item.isSystemDefault ? 'opacity-20 cursor-not-allowed' : 'text-slate-400 hover:bg-red-50 hover:text-red-500')}
                            >
                                <Trash2 className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                ))}

                <button
                    onClick={handleAdd}
                    className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-blue-200 py-4 text-sm font-semibold text-blue-600 transition-colors hover:bg-blue-50"
                >
                    <Plus className="h-4 w-4" /> Add Custom Code
                </button>

                {!isValid && (
                    <div className="flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-600">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        All attendance codes must have an acronym and a description.
                    </div>
                )}
            </div>

            <div className="mt-8 border-t border-slate-100 pt-8">
                <SaveButton onClick={handleSave} saved={saved} disabled={!isValid} saveLabel="Save Register Logic" savedLabel="Logic Saved!" />
            </div>
        </SettingsShell>
    );
}

