import { useState } from 'react';
import { CreditCard, Palette, Settings2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { SettingsShell } from '../settings/shared/SettingsShell';
import { SettingsHero } from '../settings/shared/SettingsHero';
import { SaveButton } from '../settings/shared/SaveButton';
import { cn } from '../../../lib/utils';
import { fileToDataUrl, prepareFileForUpload, UPLOAD_LIMITS_MB } from '../../../utils/imageUpload';
import { IdCardView, samplePerson, TEMPLATES } from './IdCardView';
import { apiError, useIdCardConfig } from './useIdCard';
import type { Audience, IdCardConfig } from './types';

// One page, two modes: "design" (look & feel) and "settings" (what appears on the card).
// Both edit the same per-audience config and share the live front/back preview.

const PALETTES: { name: string; primary: string; secondary: string }[] = [
    { name: 'Navy & Gold', primary: '#1E4DA6', secondary: '#F5B800' },
    { name: 'Forest', primary: '#166534', secondary: '#FACC15' },
    { name: 'Crimson', primary: '#B91C1C', secondary: '#0F172A' },
    { name: 'Royal Purple', primary: '#6D28D9', secondary: '#F472B6' },
    { name: 'Teal', primary: '#0F766E', secondary: '#F59E0B' },
    { name: 'Sunset', primary: '#EA580C', secondary: '#1E293B' },
    { name: 'Slate', primary: '#1E293B', secondary: '#38BDF8' },
    { name: 'Maroon', primary: '#7F1D1D', secondary: '#E5C07B' },
];

const Card = ({ title, children, hint }: { title: string; hint?: string; children: React.ReactNode }) => (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
        <div>
            <h3 className="font-bold text-slate-700 text-sm">{title}</h3>
            {hint && <p className="mt-0.5 text-xs text-slate-500">{hint}</p>}
        </div>
        {children}
    </div>
);

const Toggle = ({ label, checked, onChange, hint }: { label: string; checked: boolean; onChange: (v: boolean) => void; hint?: string }) => (
    <div className="flex items-center justify-between gap-4">
        <div>
            <span className="text-sm font-semibold text-slate-700">{label}</span>
            {hint && <p className="text-xs text-slate-400">{hint}</p>}
        </div>
        <button
            type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)}
            className={cn('relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors', checked ? 'bg-[#1E4DA6]' : 'bg-slate-200')}
        >
            <span className={cn('inline-block h-4 w-4 rounded-full bg-white shadow transition-transform', checked ? 'translate-x-4' : 'translate-x-0')} />
        </button>
    </div>
);

const Segmented = <T extends string>({ value, options, onChange }: { value: T; options: { value: T; label: string }[]; onChange: (v: T) => void }) => (
    <div className="flex gap-2">
        {options.map(o => (
            <button key={o.value} type="button" onClick={() => onChange(o.value)}
                className={cn('flex-1 rounded-xl border-2 px-3 py-2 text-sm font-bold transition-all', value === o.value ? 'border-[#1E4DA6] bg-[#1E4DA6]/5 text-[#173F8C]' : 'border-slate-200 text-slate-500 hover:border-slate-300')}>
                {o.label}
            </button>
        ))}
    </div>
);

const textInput = 'w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#1E4DA6]/60 focus:ring-2 focus:ring-[#1E4DA6]/10';

const ColorField = ({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) => (
    <label className="flex items-center gap-3">
        <input type="color" value={value} onChange={e => onChange(e.target.value)} className="h-9 w-12 cursor-pointer rounded-lg border border-slate-200 bg-white p-0.5" />
        <span className="text-sm font-semibold text-slate-700">{label}</span>
        <span className="ml-auto font-mono text-xs text-slate-400">{value}</span>
    </label>
);

function ImagePicker({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
    const pick = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const input = e.target;
        const file = input.files?.[0];
        if (!file) return;
        try {
            // Transparent PNG, resized, so scans of seals / signatures stay clean on any card colour.
            const ready = await prepareFileForUpload(file, { maxMB: UPLOAD_LIMITS_MB.brandImage, maxDimension: 500, keepTransparency: true });
            onChange(await fileToDataUrl(ready));
        } catch (err: any) {
            toast.error(err.message || 'Could not use that image.');
            input.value = '';
        }
    };
    return (
        <div>
            <label className="mb-1 block text-xs font-bold text-slate-500">{label}</label>
            <div className="flex items-center gap-3">
                <div className="flex h-14 w-24 items-center justify-center overflow-hidden rounded-lg border border-dashed border-slate-300 bg-[linear-gradient(45deg,#f1f5f9_25%,transparent_25%,transparent_75%,#f1f5f9_75%),linear-gradient(45deg,#f1f5f9_25%,transparent_25%,transparent_75%,#f1f5f9_75%)] bg-[length:12px_12px] bg-[position:0_0,6px_6px]">
                    {value ? <img src={value} alt="" className="max-h-full max-w-full object-contain" /> : <span className="text-[10px] font-semibold text-slate-400">None</span>}
                </div>
                <label className="cursor-pointer rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-[#1E4DA6] hover:bg-slate-50">
                    {value ? 'Change' : 'Upload'}
                    <input type="file" accept="image/*" className="hidden" onChange={pick} />
                </label>
                {value && <button type="button" onClick={() => onChange('')} className="text-xs font-bold text-red-500 hover:underline">Remove</button>}
            </div>
        </div>
    );
}

const AudienceTabs = ({ value, onChange }: { value: Audience; onChange: (a: Audience) => void }) => (
    <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1">
        {(['STUDENT', 'STAFF'] as const).map(a => (
            <button key={a} onClick={() => onChange(a)} className={cn('rounded-lg px-5 py-2 text-sm font-bold transition-colors', value === a ? 'bg-[#173F8C] text-white shadow' : 'text-slate-500 hover:text-slate-800')}>
                {a === 'STUDENT' ? 'Student Cards' : 'Staff Cards'}
            </button>
        ))}
    </div>
);

export function IdCardConfigPage({ mode }: { mode: 'design' | 'settings' }) {
    const [audience, setAudience] = useState<Audience>('STUDENT');
    const { config, school, loading, saving, dirty, update, save } = useIdCardConfig(audience);
    const [saved, setSaved] = useState(false);

    const person = samplePerson(audience);
    const set = (fn: (c: IdCardConfig) => IdCardConfig) => { setSaved(false); update(fn); };

    const handleSave = async () => {
        try {
            await save();
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (err) {
            toast.error(apiError(err, 'Could not save ID card settings.'));
        }
    };

    const changeAudience = (a: Audience) => {
        if (dirty && !window.confirm('You have unsaved changes. Switch anyway and discard them?')) return;
        setAudience(a);
    };

    const isDesign = mode === 'design';

    return (
        <SettingsShell
            breadcrumbParent="ID Card"
            breadcrumbCurrent={isDesign ? 'Designer' : 'Settings'}
            tabLabel={isDesign ? 'Card Designer' : 'Card Settings'}
            tabIcon={isDesign ? <Palette className="h-3.5 w-3.5" /> : <Settings2 className="h-3.5 w-3.5" />}
        >
            <SettingsHero
                icon={<CreditCard className="h-7 w-7" />}
                title={isDesign ? 'ID Card Designer' : 'ID Card Settings'}
                subtitle={isDesign
                    ? 'Pick a template, orientation and colours. Front and back update live; student and staff cards are designed separately.'
                    : 'Choose what appears on the card: school heading, fields, QR code, expiry, seal, signature, back note and numbering.'}
            />

            <div className="mb-6"><AudienceTabs value={audience} onChange={changeAudience} /></div>

            {loading || !config ? (
                <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-[#1E4DA6]" /></div>
            ) : (
                <div className="flex flex-col gap-8 xl:flex-row">
                    <div className="flex-1 space-y-6 min-w-0">
                        {isDesign ? (
                            <>
                                <Card title="Template" hint="All templates work in both orientations.">
                                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                                        {TEMPLATES.map(t => (
                                            <button key={t.id} type="button" onClick={() => set(c => ({ ...c, templateId: t.id }))}
                                                className={cn('flex flex-col items-center gap-2 rounded-xl border-2 p-3 transition-all', config.templateId === t.id ? 'border-[#1E4DA6] bg-[#1E4DA6]/5' : 'border-slate-200 hover:border-slate-300')}>
                                                <IdCardView config={{ ...config, templateId: t.id }} school={school} person={person} preview scale={config.orientation === 'vertical' ? 0.5 : 0.42} />
                                                <span className="text-xs font-bold text-slate-700">{t.name}</span>
                                                <span className="text-center text-[10px] leading-tight text-slate-400">{t.description}</span>
                                            </button>
                                        ))}
                                    </div>
                                </Card>

                                <Card title="Orientation">
                                    <Segmented value={config.orientation} onChange={v => set(c => ({ ...c, orientation: v }))}
                                        options={[{ value: 'vertical', label: 'Vertical (portrait)' }, { value: 'horizontal', label: 'Horizontal (landscape)' }]} />
                                </Card>

                                <Card title="Colours">
                                    <div className="flex flex-wrap gap-2">
                                        {PALETTES.map(p => (
                                            <button key={p.name} type="button" title={p.name}
                                                onClick={() => set(c => ({ ...c, colors: { ...c.colors, primary: p.primary, secondary: p.secondary } }))}
                                                className={cn('flex h-9 w-14 overflow-hidden rounded-lg border-2 transition-all', config.colors.primary === p.primary && config.colors.secondary === p.secondary ? 'border-slate-800 scale-105' : 'border-white shadow hover:scale-105')}>
                                                <span className="flex-1" style={{ background: p.primary }} /><span className="flex-1" style={{ background: p.secondary }} />
                                            </button>
                                        ))}
                                    </div>
                                    <div className="grid gap-3 sm:grid-cols-2">
                                        <ColorField label="Primary" value={config.colors.primary} onChange={v => set(c => ({ ...c, colors: { ...c.colors, primary: v } }))} />
                                        <ColorField label="Accent" value={config.colors.secondary} onChange={v => set(c => ({ ...c, colors: { ...c.colors, secondary: v } }))} />
                                        <ColorField label="Text" value={config.colors.text} onChange={v => set(c => ({ ...c, colors: { ...c.colors, text: v } }))} />
                                        <ColorField label="Card background" value={config.colors.background} onChange={v => set(c => ({ ...c, colors: { ...c.colors, background: v } }))} />
                                    </div>
                                </Card>

                                <Card title="Photo shape">
                                    <Segmented value={config.photoShape} onChange={v => set(c => ({ ...c, photoShape: v }))}
                                        options={[{ value: 'rounded', label: 'Rounded' }, { value: 'circle', label: 'Circle' }, { value: 'square', label: 'Square' }]} />
                                </Card>

                                <Card title="Card title" hint="The label printed on the card, e.g. STUDENT ID CARD or PUPIL IDENTITY CARD.">
                                    <input className={textInput} value={config.header.title} maxLength={32} onChange={e => set(c => ({ ...c, header: { ...c.header, title: e.target.value } }))} />
                                </Card>
                            </>
                        ) : (
                            <>
                                <Card title="Heading" hint="School name, logo and Arabic name come from Institute Profile unless overridden here.">
                                    <Toggle label="Show school logo" checked={config.header.showLogo} onChange={v => set(c => ({ ...c, header: { ...c.header, showLogo: v } }))} />
                                    <Toggle label="Show school name" checked={config.header.showSchoolName} onChange={v => set(c => ({ ...c, header: { ...c.header, showSchoolName: v } }))} />
                                    <input className={textInput} placeholder={`School name on card (default: ${school.name})`} value={config.header.schoolNameOverride} onChange={e => set(c => ({ ...c, header: { ...c.header, schoolNameOverride: e.target.value } }))} />
                                    <Toggle label="Show Arabic name" checked={config.header.showArabicName} onChange={v => set(c => ({ ...c, header: { ...c.header, showArabicName: v } }))} />
                                    {config.header.showArabicName && (
                                        <input dir="rtl" className={textInput} placeholder={school.arabicName || 'الاسم بالعربية'} value={config.header.arabicName} onChange={e => set(c => ({ ...c, header: { ...c.header, arabicName: e.target.value } }))} />
                                    )}
                                    <Toggle label="Show school motto" checked={config.header.showMotto} onChange={v => set(c => ({ ...c, header: { ...c.header, showMotto: v } }))} />
                                </Card>

                                <Card title="Fields shown on the front">
                                    {([
                                        ['name', audience === 'STAFF' ? 'Staff name' : 'Student name'],
                                        ['idNumber', audience === 'STAFF' ? 'Staff ID' : 'Admission number'],
                                        ['classOrRole', audience === 'STAFF' ? 'Department / role' : 'Class'],
                                        ['gender', 'Gender'], ['dob', 'Date of birth'], ['bloodGroup', 'Blood group'],
                                        ['phone', 'Phone number'], ['address', 'Home address'], ['issueDate', 'Issue date'],
                                    ] as const).map(([key, label]) => (
                                        <Toggle key={key} label={label} checked={config.fields[key]} onChange={v => set(c => ({ ...c, fields: { ...c.fields, [key]: v } }))} />
                                    ))}
                                </Card>

                                <Card title="QR code">
                                    <Toggle label="Show QR code" checked={config.qr.enabled} onChange={v => set(c => ({ ...c, qr: { ...c.qr, enabled: v } }))} />
                                    {config.qr.enabled && (
                                        <>
                                            <Segmented value={config.qr.mode} onChange={v => set(c => ({ ...c, qr: { ...c.qr, mode: v } }))}
                                                options={[{ value: 'VERIFY_URL', label: 'Opens digital ID' }, { value: 'ATTENDANCE_TOKEN', label: 'Attendance scanner' }]} />
                                            <p className="text-xs text-slate-500">
                                                {config.qr.mode === 'VERIFY_URL'
                                                    ? 'Scanning with any phone opens the live digital card and shows whether it is valid, expired or revoked.'
                                                    : 'Encodes the school attendance token so the card works with the attendance scanner.'}
                                            </p>
                                        </>
                                    )}
                                </Card>

                                <Card title="Expiry">
                                    <Toggle label="Card expires" checked={config.expiry.enabled} onChange={v => set(c => ({ ...c, expiry: { ...c.expiry, enabled: v } }))} hint="Expiry is set when cards are generated or renewed." />
                                    {config.expiry.enabled && (
                                        <>
                                            <Segmented value={config.expiry.mode} onChange={v => set(c => ({ ...c, expiry: { ...c.expiry, mode: v } }))}
                                                options={[{ value: 'YEARS', label: 'Years from issue' }, { value: 'FIXED_DATE', label: 'Fixed date' }]} />
                                            {config.expiry.mode === 'YEARS' ? (
                                                <div className="flex items-center gap-3">
                                                    <input type="number" min={1} max={10} className="w-20 rounded-xl border border-slate-200 px-3 py-2 text-center text-lg font-black text-[#173F8C] outline-none focus:border-[#1E4DA6]/60"
                                                        value={config.expiry.years} onChange={e => set(c => ({ ...c, expiry: { ...c.expiry, years: Math.min(10, Math.max(1, Number(e.target.value) || 1)) } }))} />
                                                    <span className="text-sm font-semibold text-slate-500">year(s) from issue date</span>
                                                </div>
                                            ) : (
                                                <input type="date" className={textInput} value={config.expiry.date} onChange={e => set(c => ({ ...c, expiry: { ...c.expiry, date: e.target.value } }))} />
                                            )}
                                        </>
                                    )}
                                </Card>

                                <Card title="Seal & signature">
                                    <Toggle label="Show school seal" checked={config.seal.enabled} onChange={v => set(c => ({ ...c, seal: { ...c.seal, enabled: v } }))} />
                                    {config.seal.enabled && <ImagePicker label="Seal image (transparent PNG works best)" value={config.seal.imageUrl} onChange={v => set(c => ({ ...c, seal: { ...c.seal, imageUrl: v } }))} />}
                                    <Toggle label="Show signature" checked={config.signature.enabled} onChange={v => set(c => ({ ...c, signature: { ...c.signature, enabled: v } }))} />
                                    {config.signature.enabled && (
                                        <>
                                            <ImagePicker label="Signature image" value={config.signature.imageUrl} onChange={v => set(c => ({ ...c, signature: { ...c.signature, imageUrl: v } }))} />
                                            <div className="grid gap-3 sm:grid-cols-2">
                                                <input className={textInput} placeholder="Signatory name" value={config.signature.name} onChange={e => set(c => ({ ...c, signature: { ...c.signature, name: e.target.value } }))} />
                                                <input className={textInput} placeholder="Title, e.g. Principal" value={config.signature.title} onChange={e => set(c => ({ ...c, signature: { ...c.signature, title: e.target.value } }))} />
                                            </div>
                                        </>
                                    )}
                                </Card>

                                <Card title="Back of the card">
                                    <textarea rows={3} maxLength={300} className={textInput} placeholder="Back note" value={config.back.note} onChange={e => set(c => ({ ...c, back: { ...c.back, note: e.target.value } }))} />
                                    <Toggle label="School address" checked={config.back.showAddress} onChange={v => set(c => ({ ...c, back: { ...c.back, showAddress: v } }))} hint={school.address || 'Set the address in Institute Profile'} />
                                    <Toggle label="School phone" checked={config.back.showPhone} onChange={v => set(c => ({ ...c, back: { ...c.back, showPhone: v } }))} hint={school.phone || undefined} />
                                    <Toggle label="School email" checked={config.back.showEmail} onChange={v => set(c => ({ ...c, back: { ...c.back, showEmail: v } }))} hint={school.email || undefined} />
                                    <Toggle label="QR code on back" checked={config.back.showQr} onChange={v => set(c => ({ ...c, back: { ...c.back, showQr: v } }))} />
                                    <Toggle label="School seal on back" checked={config.back.showSeal} onChange={v => set(c => ({ ...c, back: { ...c.back, showSeal: v } }))} />
                                    <Toggle label="Signature on back" checked={config.back.showSignature} onChange={v => set(c => ({ ...c, back: { ...c.back, showSignature: v } }))} />
                                    <Toggle label="Terms & conditions" checked={config.back.showTerms} onChange={v => set(c => ({ ...c, back: { ...c.back, showTerms: v } }))} />
                                    {config.back.showTerms && (
                                        <textarea rows={4} maxLength={400} className={textInput} placeholder="One term per line (max 6 shown)" value={config.back.terms} onChange={e => set(c => ({ ...c, back: { ...c.back, terms: e.target.value } }))} />
                                    )}
                                </Card>

                                <Card title="Card numbering" hint="Cards are numbered automatically, e.g. PREFIX-0001. Leave blank to use the school code.">
                                    <input className={textInput} maxLength={20} placeholder={`${school.code || 'SCH'}-${audience === 'STAFF' ? 'STF' : 'STU'}`} value={config.numbering.prefix} onChange={e => set(c => ({ ...c, numbering: { prefix: e.target.value.toUpperCase().replace(/[^A-Z0-9/-]/g, '') } }))} />
                                    <p className="text-xs text-slate-500">Applies to cards generated after you save. Existing card numbers never change.</p>
                                </Card>

                                <Card title="Digital ID card">
                                    <Toggle label="Enable digital ID card" checked={config.digital.enabled} onChange={v => set(c => ({ ...c, digital: { enabled: v } }))} hint="Students and staff can open their card on their phone from their portal, and the QR page can verify it." />
                                </Card>
                            </>
                        )}
                    </div>

                    {/* Live preview */}
                    <div className="w-full xl:w-[460px] shrink-0">
                        <div className="sticky top-4 space-y-4">
                            <p className="text-center font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400">Live preview</p>
                            <div className="flex flex-wrap items-start justify-center gap-5 rounded-2xl bg-slate-100 p-6">
                                <div className="space-y-2 text-center">
                                    <IdCardView config={config} school={school} person={person} preview side="front" style={{ boxShadow: '0 6px 18px rgba(15,23,42,.25)' }} />
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Front</p>
                                </div>
                                <div className="space-y-2 text-center">
                                    <IdCardView config={config} school={school} person={person} preview side="back" style={{ boxShadow: '0 6px 18px rgba(15,23,42,.25)' }} />
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Back</p>
                                </div>
                            </div>
                            <SaveButton onClick={handleSave} saved={saved} saving={saving} disabled={!dirty && !saved}
                                saveLabel={dirty ? 'Save changes' : 'No changes'} savedLabel="Saved!" />
                        </div>
                    </div>
                </div>
            )}
        </SettingsShell>
    );
}

export const IdCardDesigner = () => <IdCardConfigPage mode="design" />;
export const IdCardSettings = () => <IdCardConfigPage mode="settings" />;
