import { useState } from 'react';
import { CreditCard, Palette, LayoutTemplate } from 'lucide-react';
import { SettingsShell } from './shared/SettingsShell';
import { SettingsHero } from './shared/SettingsHero';
import { SaveButton } from './shared/SaveButton';
import { cn } from '../../../lib/utils';

const COLORS = ['#1E4DA6', '#16a34a', '#dc2626', '#7c3aed', '#0891b2', '#ea580c', '#1e293b'];

export function IDCardSettings() {
    const [saved, setSaved] = useState(false);
    const [config, setConfig] = useState({
        layout: 'vertical',
        primaryColor: '#1E4DA6',
        showBarcode: true,
        showBloodGroup: true,
        showEmergencyContact: false,
        showAddress: false,
        validityYears: '1',
    });

    const update = (field: string, value: string | boolean) => { setSaved(false); setConfig(prev => ({ ...prev, [field]: value })); };
    const handleSave = () => { setSaved(true); setTimeout(() => setSaved(false), 3000); };

    const toggleCls = (active: boolean) =>
        `relative inline-flex h-5 w-9 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors ${active ? 'bg-[#1E4DA6]' : 'bg-slate-200'}`;
    const thumbCls = (active: boolean) =>
        `inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${active ? 'translate-x-4' : 'translate-x-0'}`;

    return (
        <SettingsShell breadcrumbParent="ID Card" breadcrumbCurrent="ID Card Design" tabLabel="ID Card Design" tabIcon={<CreditCard className="h-3.5 w-3.5" />}>
            <SettingsHero
                icon={<CreditCard className="h-7 w-7" />}
                title="Student ID Card Settings"
                subtitle="Configure what fields and design elements appear on printed student identification cards."
            />

            <div className="flex flex-col lg:flex-row gap-8">
                {/* Config panel */}
                <div className="flex-1 space-y-6">
                    {/* Layout */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
                        <div className="flex items-center gap-2">
                            <LayoutTemplate className="h-4 w-4 text-[#1E4DA6]" />
                            <h3 className="font-bold text-slate-700 text-sm">Card Layout</h3>
                        </div>
                        <div className="flex gap-3">
                            {['vertical', 'horizontal'].map(l => (
                                <button
                                    key={l}
                                    onClick={() => update('layout', l)}
                                    className={cn('flex-1 rounded-xl border-2 py-3 text-sm font-bold capitalize transition-all', config.layout === l ? 'border-[#1E4DA6] bg-[#1E4DA6]/5 text-[#173F8C]' : 'border-slate-200 text-slate-500 hover:border-slate-300')}
                                >
                                    {l}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Color */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
                        <div className="flex items-center gap-2">
                            <Palette className="h-4 w-4 text-[#1E4DA6]" />
                            <h3 className="font-bold text-slate-700 text-sm">Primary Color</h3>
                        </div>
                        <div className="flex gap-3 flex-wrap">
                            {COLORS.map(c => (
                                <button
                                    key={c}
                                    onClick={() => update('primaryColor', c)}
                                    className={cn('h-9 w-9 rounded-full transition-all', config.primaryColor === c ? 'scale-125 ring-2 ring-offset-2 ring-slate-700' : 'hover:scale-110 opacity-80')}
                                    style={{ backgroundColor: c }}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Fields */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
                        <h3 className="font-bold text-slate-700 text-sm">Displayed Fields</h3>
                        <div className="space-y-4">
                            {[
                                { label: 'Show Barcode / QR Code', field: 'showBarcode' },
                                { label: 'Show Blood Group', field: 'showBloodGroup' },
                                { label: 'Show Emergency Contact', field: 'showEmergencyContact' },
                                { label: 'Show Home Address', field: 'showAddress' },
                            ].map(item => (
                                <div key={item.field} className="flex items-center justify-between">
                                    <span className="text-sm font-semibold text-slate-700">{item.label}</span>
                                    <button onClick={() => update(item.field, !config[item.field as keyof typeof config])} className={toggleCls(!!config[item.field as keyof typeof config])}>
                                        <span className={thumbCls(!!config[item.field as keyof typeof config])} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Validity */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
                        <h3 className="font-bold text-slate-700 text-sm">Card Validity</h3>
                        <div className="flex items-center gap-3">
                            <input
                                type="number"
                                min={1}
                                max={5}
                                value={config.validityYears}
                                onChange={e => update('validityYears', e.target.value)}
                                className="w-20 rounded-xl border border-slate-200 px-3 py-2.5 text-center text-lg font-black text-[#173F8C] outline-none focus:border-[#1E4DA6]/60 focus:ring-2 focus:ring-[#1E4DA6]/10"
                            />
                            <span className="text-sm text-slate-500 font-semibold">year(s) from date of issue</span>
                        </div>
                    </div>
                </div>

                {/* Card Preview */}
                <div className="w-full lg:w-64 shrink-0 flex flex-col items-center">
                    <p className="font-mono text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-5">Preview</p>
                    <div className={cn('relative overflow-hidden rounded-2xl shadow-xl border-4', config.layout === 'vertical' ? 'w-48 h-80' : 'w-72 h-44')}
                        style={{ borderColor: config.primaryColor }}>
                        {/* Header strip */}
                        <div className="absolute top-0 inset-x-0 h-16 flex items-center justify-center text-white text-xs font-black tracking-wider" style={{ backgroundColor: config.primaryColor }}>
                            STUDENT ID CARD
                        </div>
                        {/* Photo placeholder */}
                        <div className={cn('absolute bg-slate-200 rounded-xl', config.layout === 'vertical' ? 'top-12 left-1/2 -translate-x-1/2 w-16 h-16' : 'top-8 left-4 w-20 h-24')}>
                            <div className="flex h-full w-full items-center justify-center text-slate-400 text-[10px] font-bold">PHOTO</div>
                        </div>
                        {/* Details */}
                        <div className={cn('absolute space-y-1 text-[9px]', config.layout === 'vertical' ? 'bottom-12 inset-x-4 text-center' : 'top-9 right-4 left-32')}>
                            <div className="h-2 rounded bg-slate-200 w-4/5 mx-auto" />
                            <div className="h-2 rounded bg-slate-100 w-3/5 mx-auto" />
                            {config.showBloodGroup && <div className="h-2 rounded bg-slate-100 w-2/5 mx-auto" />}
                            {config.showBarcode && <div className="mt-2 h-6 rounded bg-slate-200 w-full" />}
                        </div>
                        {/* Footer */}
                        <div className="absolute bottom-0 inset-x-0 h-6 opacity-20" style={{ backgroundColor: config.primaryColor }} />
                    </div>
                </div>
            </div>

            <div className="mt-8 border-t border-slate-100 pt-8">
                <SaveButton onClick={handleSave} saved={saved} saveLabel="Save Layout Config" savedLabel="Config Saved!" />
            </div>
        </SettingsShell>
    );
}

