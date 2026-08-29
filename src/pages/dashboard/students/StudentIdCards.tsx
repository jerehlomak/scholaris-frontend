import { Settings, Printer, Search, RefreshCw, QrCode } from 'lucide-react';
import { useState } from 'react';
import { SettingsShell } from '../settings/shared/SettingsShell';
import { SettingsHero } from '../settings/shared/SettingsHero';
import { cn } from '../../../lib/utils';

const CARD_STYLES = ['Default', 'Style 1', 'Style 2', 'Style 3', 'Style 4'];

export function StudentIdCards() {
    const [activeStyle, setActiveStyle] = useState('Default');
    const [search, setSearch] = useState('');

    return (
        <SettingsShell breadcrumbParent="Students" breadcrumbCurrent="ID Cards" tabLabel="Student ID Cards" tabIcon={<QrCode className="h-3.5 w-3.5" />}>
            {/* Page Header */}
            <div className="mb-8">
                <div className="flex items-center gap-2 text-xs text-slate-400 font-mono mb-1"><span>Dashboard</span><span>/</span><span>Students</span><span>/</span><span>ID Cards</span></div>
                <h1 className="text-3xl font-black text-slate-800">Student ID Cards</h1>
                <p className="text-sm text-slate-500 mt-1">Generate and print student ID cards with different style templates.</p>
            </div>

            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-3 mb-6">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                    <input type="text" placeholder="Search students..." value={search} onChange={e => setSearch(e.target.value)}
                        className="pl-9 pr-4 h-10 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-800 outline-none focus:border-[#1E4DA6]/60 focus:ring-2 focus:ring-[#1E4DA6]/10 transition-all w-56" />
                </div>
                <button className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors">
                    <RefreshCw className="h-4 w-4" />
                </button>
                <button className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors">
                    <Printer className="h-4 w-4" /> Print
                </button>
                <button className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors">
                    <Settings className="h-4 w-4" /> Customize
                </button>

                {/* Style Picker */}
                <div className="flex items-center flex-wrap gap-2 ml-auto">
                    {CARD_STYLES.map(style => (
                        <button key={style} onClick={() => setActiveStyle(style)}
                            className={cn('rounded-xl px-4 py-2.5 text-xs font-bold transition-colors', activeStyle === style ? 'bg-[#173F8C] text-white shadow-md' : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50')}>
                            {style}
                        </button>
                    ))}
                </div>
            </div>

            {/* ID Cards Display */}
            <div className="flex flex-wrap gap-8">
                {/* ID Card */}
                <div className="relative w-72 h-[450px] bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200">
                    {/* Top accent */}
                    <div className="absolute top-0 left-0 w-full h-2 bg-[#173F8C]" />
                    {/* Dot pattern background */}
                    <div className="pointer-events-none absolute inset-0"
                        style={{ backgroundImage: 'radial-gradient(circle, #1E4DA608 1px, transparent 1px)', backgroundSize: '16px 16px' }} />

                    <div className="relative z-10 flex flex-col items-center pt-10 pb-6 px-5 h-full">
                        {/* Avatar */}
                        <div className="h-24 w-24 rounded-full bg-[#1E4DA6]/10 border-4 border-white shadow-md flex items-center justify-center mb-3 overflow-hidden relative">
                            <svg className="w-full h-full text-[#173F8C] mt-4" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
                            </svg>
                            <div className="absolute top-1 right-3 h-3 w-3 bg-emerald-500 rounded-full border-2 border-white" />
                        </div>

                        {/* Barcode */}
                        <div className="w-3/4 h-10 mb-2 flex items-center justify-center overflow-hidden opacity-80">
                            <div className="w-full flex justify-between gap-[1px]">
                                {[...Array(30)].map((_, i) => (
                                    <div key={i} className={`bg-slate-800 h-10 ${i % 3 === 0 ? 'w-1' : i % 5 === 0 ? 'w-[3px]' : 'w-[1.5px]'}`} />
                                ))}
                            </div>
                        </div>

                        <h3 className="text-sm font-black tracking-widest text-slate-800 uppercase mt-1 mb-auto">AGNES JOHN</h3>

                        {/* Details */}
                        <div className="w-full mt-auto text-left pt-6 pb-2 border-t border-slate-100">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="font-black text-sm text-slate-800 uppercase tracking-wide">STUDENT</span>
                            </div>
                            <div className="flex justify-between items-end">
                                <div className="text-[11px] text-slate-700 space-y-0.5 leading-tight font-semibold">
                                    {[{ label: 'ID', val: '223233' }, { label: 'Class', val: 'JSS1' }, { label: 'DOA', val: '09 Feb 2026' }].map(r => (
                                        <div key={r.label} className="grid grid-cols-[36px_1fr] gap-1">
                                            <span className="text-slate-400">{r.label}</span>
                                            <span>→ {r.val}</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="p-1 bg-white border border-slate-200 rounded-lg">
                                    <QrCode className="h-10 w-10 text-slate-800" strokeWidth={1.5} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Add more cards placeholder */}
                <div className="flex h-[450px] w-72 items-center justify-center rounded-2xl border-2 border-dashed border-[#1E4DA6]/20 bg-[#1E4DA6]/8 text-slate-400">
                    <span className="text-sm font-bold text-[#1E4DA6]/60">More cards will appear here</span>
                </div>
            </div>
        </SettingsShell>
    );
}
