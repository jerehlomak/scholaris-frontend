import { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './../../../components/ui/select';
import { Label } from './../../../components/ui/label';
import { Button } from './../../../components/ui/button';
import { Separator } from './../../../components/ui/separator';
import { Check, ChevronRight, Palette, Sun, Moon, Languages } from 'lucide-react';
import { useTheme } from '../../../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import { cn } from './../../../lib/utils';

// ─────────────────────────────────────────────
// Data
// ─────────────────────────────────────────────
const headerColors = [
    { id: 'dark', class: 'bg-gray-800' },
    { id: 'red', class: 'bg-red-400' },
    { id: 'teal', class: 'bg-teal-400' },
    { id: 'green', class: 'bg-green-500' },
    { id: 'blue', class: 'bg-blue-400' },
    { id: 'light', class: 'bg-gray-100 border border-gray-200' },
];

const activeItemColors = [
    { id: 'red', class: 'bg-red-500' },
    { id: 'pink', class: 'bg-pink-500' },
    { id: 'teal', class: 'bg-teal-500' },
    { id: 'blue', class: 'bg-blue-500' },
    { id: 'yellow', class: 'bg-yellow-500' },
    { id: 'orange', class: 'bg-orange-500' },
    { id: 'indigo', class: 'bg-indigo-600' },
    { id: 'navy', class: 'bg-indigo-800' },
    { id: 'magenta', class: 'bg-pink-600' },
    { id: 'rust', class: 'bg-orange-600' },
    { id: 'forest', class: 'bg-green-600' },
    { id: 'purple', class: 'bg-purple-800' },
];

// ─────────────────────────────────────────────
// Section wrapper with floating label
// ─────────────────────────────────────────────
function Section({
    label,
    accent = false,
    children,
    delay = 0,
}: {
    label: string;
    accent?: boolean;
    children: React.ReactNode;
    delay?: number;
}) {
    const [visible, setVisible] = useState(false);
    useEffect(() => {
        const t = setTimeout(() => setVisible(true), delay);
        return () => clearTimeout(t);
    }, [delay]);

    return (
        <div
            className={cn(
                'group relative rounded-2xl border border-slate-200/80 bg-white p-6 pt-8 shadow-sm transition-all duration-500',
                'hover:border-blue-200 hover:shadow-md',
                visible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
            )}
        >
            {/* floating pill label */}
            <div className="absolute -top-3 left-5 z-10">
                <span
                    className={cn(
                        'rounded-full px-3 py-0.5 font-mono text-[10px] font-bold uppercase tracking-widest text-white shadow-sm',
                        accent ? 'bg-blue-700' : 'bg-slate-500'
                    )}
                >
                    {label}
                </span>
            </div>
            {/* Left accent bar */}
            <div className="absolute bottom-0 left-0 top-0 w-1 rounded-l-2xl bg-gradient-to-b from-blue-700 to-blue-400 opacity-0 transition-opacity duration-300 group-hover:opacity-60" />
            {children}
        </div>
    );
}

// ─────────────────────────────────────────────
// SelectionChip — generic selectable tile
// ─────────────────────────────────────────────
function SelectionChip({
    selected,
    onClick,
    className,
    children,
}: {
    selected: boolean;
    onClick: () => void;
    className?: string;
    children: React.ReactNode;
}) {
    return (
        <div
            onClick={onClick}
            className={cn(
                'relative cursor-pointer rounded-xl border-2 transition-all duration-200',
                selected
                    ? 'border-blue-600 shadow-md shadow-blue-100 scale-[1.04]'
                    : 'border-slate-200 hover:border-slate-300 hover:shadow-sm',
                className
            )}
        >
            {selected && (
                <div className="absolute -top-2.5 left-1/2 z-10 -translate-x-1/2 rounded-full bg-blue-600 p-0.5 shadow-sm">
                    <Check className="h-2.5 w-2.5 text-white" strokeWidth={3.5} />
                </div>
            )}
            {children}
        </div>
    );
}

// ─────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────
export function ThemeLanguage() {
    const {
        globalTheme, setGlobalTheme,
        themePlacement, setThemePlacement,
        sidebarBg, setSidebarBg,
        headerBg, setHeaderBg,
        sidebarText, setSidebarText,
        headerText, setHeaderText,
        activeItemBg, setActiveItemBg,
        language, setLanguage,
    } = useTheme();

    const { t } = useTranslation();
    const [pageVisible, setPageVisible] = useState(false);
    const [saved, setSaved] = useState(false);
    const [localLanguage, setLocalLanguage] = useState(language);

    useEffect(() => {
        const t = setTimeout(() => setPageVisible(true), 60);
        return () => clearTimeout(t);
    }, []);

    const handleSave = () => {
        setLanguage(localLanguage);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
    };

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=DM+Mono:wght@400;500;700&display=swap');
                .tl-root, .tl-root * { font-family: 'Plus Jakarta Sans', sans-serif !important; }
                .tl-root .font-mono  { font-family: 'DM Mono', monospace !important; }
                @keyframes tl-float {
                    0%, 100% { transform: translateY(0); }
                    50%       { transform: translateY(-6px); }
                }
                @keyframes tl-pulse-ring {
                    0%   { transform: scale(0.9);  opacity: 0.4; }
                    100% { transform: scale(1.5);  opacity: 0; }
                }
                .tl-float      { animation: tl-float 3.5s ease-in-out infinite; }
                .tl-pulse-ring { animation: tl-pulse-ring 2.4s ease-out infinite; }
            `}</style>

            <div className="tl-root min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-indigo-50/30 px-4 pb-20 pt-8 sm:px-6 lg:px-8">

                {/* Dot grid */}
                <div
                    className="pointer-events-none fixed inset-0 opacity-[0.28]"
                    style={{
                        backgroundImage: 'radial-gradient(circle, #94a3b8 1px, transparent 1px)',
                        backgroundSize: '28px 28px',
                    }}
                />

                <div className="relative z-10 mx-auto max-w-6xl">

                    {/* Breadcrumb */}
                    <div
                        className={cn(
                            'mb-6 flex items-center gap-1.5 transition-all duration-500',
                            pageVisible ? 'translate-y-0 opacity-100' : '-translate-y-2 opacity-0'
                        )}
                    >
                        <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-slate-500">
                            General Settings
                        </span>
                        <ChevronRight className="h-3 w-3 text-slate-400" />
                        <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-blue-600">
                            Theme & Language
                        </span>
                    </div>

                    {/* Main panel */}
                    <div
                        className={cn(
                            'overflow-hidden rounded-2xl border border-slate-200/80 bg-white/80 shadow-xl shadow-blue-900/5 backdrop-blur-xl transition-all duration-500',
                            pageVisible ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0'
                        )}
                    >
                        {/* Tab bar */}
                        <div className="border-b border-slate-100 bg-slate-50/80 px-6">
                            <div className="inline-flex items-center gap-2 border-b-2 border-blue-600 pb-3 pt-3.5">
                                <Palette className="h-3.5 w-3.5 text-blue-600" />
                                <span className="text-xs font-bold tracking-tight text-blue-600">
                                    Theme Settings
                                </span>
                            </div>
                        </div>

                        <div className="px-6 pb-10 pt-10 sm:px-10">

                            {/* ── Hero ──────────────────────────────── */}
                            <div className="mb-10 text-center">
                                <div className="tl-float relative mx-auto mb-5 h-16 w-16">
                                    <div className="tl-pulse-ring absolute inset-0 rounded-2xl bg-blue-400/25" />
                                    <div className="relative flex h-full w-full items-center justify-center rounded-2xl bg-gradient-to-br from-blue-700 to-blue-500 shadow-lg shadow-blue-200">
                                        <Palette className="h-7 w-7 text-white" />
                                    </div>
                                </div>
                                <h1 className="mb-2 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
                                    Theme Settings
                                </h1>
                                <p className="mx-auto max-w-md text-sm leading-relaxed text-slate-500">
                                    Update your dashboard's theme styling and language preferences.
                                </p>
                            </div>

                            {/* ── Sections ──────────────────────────── */}
                            <div className="space-y-6">

                                {/* Row 1: Placement + Sidebar Bg */}
                                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">

                                    {/* Theme Placement */}
                                    <Section label="Theme Placement" delay={80}>
                                        <div className="flex gap-3">
                                            {/* LTR */}
                                            <SelectionChip
                                                selected={themePlacement === 'ltl'}
                                                onClick={() => setThemePlacement('ltl')}
                                                className="flex h-20 w-16 flex-col items-center justify-center gap-2 p-3"
                                            >
                                                <div className="relative flex w-full flex-col items-center gap-1">
                                                    <div className="h-1 w-full rounded-full bg-blue-600" />
                                                    <div className="h-0.5 w-full rounded-full bg-slate-200" />
                                                    <div className="h-0.5 w-full rounded-full bg-slate-200" />
                                                    <div className="absolute -left-1 bottom-0 top-0 w-1 rounded-sm bg-blue-600 opacity-30" />
                                                </div>
                                                <span className="font-mono text-[11px] font-bold text-blue-600">LTR</span>
                                            </SelectionChip>

                                            {/* RTL */}
                                            <SelectionChip
                                                selected={themePlacement === 'rtl'}
                                                onClick={() => setThemePlacement('rtl')}
                                                className="flex h-20 w-16 flex-col items-center justify-center gap-2 p-3"
                                            >
                                                <div className="relative flex w-full flex-col items-center gap-1">
                                                    <div className="h-1 w-full rounded-full bg-slate-600" />
                                                    <div className="h-0.5 w-full rounded-full bg-slate-200" />
                                                    <div className="h-0.5 w-full rounded-full bg-slate-200" />
                                                    <div className="absolute -right-1 bottom-0 top-0 w-1 rounded-sm bg-slate-600 opacity-30" />
                                                </div>
                                                <span className="font-mono text-[11px] font-bold text-slate-600">RTL</span>
                                            </SelectionChip>
                                        </div>
                                    </Section>

                                    {/* Sidebar Background */}
                                    <Section label="Sidebar Background" delay={140}>
                                        <div className="flex flex-wrap gap-3">
                                            {headerColors.map((color) => (
                                                <SelectionChip
                                                    key={color.id}
                                                    selected={sidebarBg === color.id}
                                                    onClick={() => setSidebarBg(color.id as any)}
                                                    className="h-14 w-[62px] p-1.5"
                                                >
                                                    <div className="flex h-full w-full overflow-hidden rounded-md border border-slate-100 shadow-sm">
                                                        <div className={cn('h-full w-3 shrink-0', color.class)} />
                                                        <div className="flex-1 bg-white" />
                                                    </div>
                                                </SelectionChip>
                                            ))}
                                        </div>
                                    </Section>
                                </div>

                                {/* Row 2: Sidebar text + Header text */}
                                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">

                                    {/* Sidebar Text Color */}
                                    <Section label="Sidebar Text Color" delay={200}>
                                        <div className="flex gap-3">
                                            {[
                                                { val: 'white', bg: 'bg-slate-800', text: 'text-white', label: 'Aa' },
                                                { val: 'dark', bg: 'bg-slate-100', text: 'text-slate-900', label: 'Aa' },
                                                { val: 'gray', bg: 'bg-white', text: 'text-slate-500', label: 'Aa' },
                                            ].map((opt) => (
                                                <SelectionChip
                                                    key={opt.val}
                                                    selected={sidebarText === opt.val}
                                                    onClick={() => setSidebarText(opt.val as any)}
                                                    className={cn('flex h-12 w-16 items-center justify-center', opt.bg)}
                                                >
                                                    <span className={cn('text-sm font-bold', opt.text)}>{opt.label}</span>
                                                </SelectionChip>
                                            ))}
                                        </div>
                                    </Section>

                                    {/* Header Text Color */}
                                    <Section label="Header Text Color" delay={260}>
                                        <div className="flex gap-3">
                                            {[
                                                { val: 'white', bg: 'bg-slate-800', text: 'text-white', label: 'Aa' },
                                                { val: 'dark', bg: 'bg-slate-100', text: 'text-slate-900', label: 'Aa' },
                                                { val: 'gray', bg: 'bg-white', text: 'text-slate-500', label: 'Aa' },
                                            ].map((opt) => (
                                                <SelectionChip
                                                    key={opt.val}
                                                    selected={headerText === opt.val}
                                                    onClick={() => setHeaderText(opt.val as any)}
                                                    className={cn('flex h-12 w-16 items-center justify-center', opt.bg)}
                                                >
                                                    <span className={cn('text-sm font-bold', opt.text)}>{opt.label}</span>
                                                </SelectionChip>
                                            ))}
                                        </div>
                                    </Section>
                                </div>

                                {/* System Theme */}
                                <Section label="System App Theme" accent delay={320}>
                                    <div className="flex flex-wrap gap-4">
                                        {/* Light */}
                                        <SelectionChip
                                            selected={globalTheme === 'light'}
                                            onClick={() => setGlobalTheme('light')}
                                            className="flex h-24 w-32 flex-col items-center justify-center gap-1 bg-slate-50"
                                        >
                                            <Sun className="h-5 w-5 text-amber-500" />
                                            <span className="text-sm font-bold text-slate-800">Light Mode</span>
                                            <span className="font-mono text-[10px] text-slate-400">Default UI</span>
                                        </SelectionChip>

                                        {/* Dark */}
                                        <SelectionChip
                                            selected={globalTheme === 'dark'}
                                            onClick={() => setGlobalTheme('dark')}
                                            className="flex h-24 w-32 flex-col items-center justify-center gap-1 bg-slate-900"
                                        >
                                            <Moon className="h-5 w-5 text-blue-300" />
                                            <span className="text-sm font-bold text-slate-100">Dark Mode</span>
                                            <span className="font-mono text-[10px] text-slate-400">Night UI</span>
                                        </SelectionChip>
                                    </div>
                                </Section>

                                {/* Header Background */}
                                <Section label="Header Background" delay={380}>
                                    <div className="flex flex-wrap gap-3">
                                        {headerColors.map((color) => (
                                            <SelectionChip
                                                key={color.id}
                                                selected={headerBg === color.id}
                                                onClick={() => setHeaderBg(color.id as any)}
                                                className="h-14 w-[62px] p-1.5"
                                            >
                                                <div className="flex h-full w-full flex-col overflow-hidden rounded-md border border-slate-100 shadow-sm">
                                                    <div className={cn('h-3 w-full', color.class)} />
                                                    <div className="flex-1 bg-white" />
                                                </div>
                                            </SelectionChip>
                                        ))}
                                    </div>
                                </Section>

                                {/* Active Item Background */}
                                <Section label="Active Item Background" delay={440}>
                                    <div className="flex flex-wrap gap-3 pt-1">
                                        {activeItemColors.map((color) => (
                                            <div
                                                key={color.id}
                                                onClick={() => setActiveItemBg(color.id as any)}
                                                className={cn(
                                                    'relative cursor-pointer rounded-xl border-2 bg-white transition-all duration-200',
                                                    activeItemBg === color.id
                                                        ? 'scale-110 border-blue-600 shadow-md shadow-blue-100 h-11 w-11'
                                                        : 'h-9 w-9 border-slate-200 hover:scale-105 hover:border-slate-300 hover:shadow-sm'
                                                )}
                                            >
                                                {activeItemBg === color.id && (
                                                    <div className="absolute -right-2 -top-2 z-10 rounded-full bg-blue-600 p-0.5 shadow-sm">
                                                        <Check className="h-2.5 w-2.5 text-white" strokeWidth={4} />
                                                    </div>
                                                )}
                                                <div className={cn('absolute inset-0 m-auto h-4 w-4 rounded-sm', color.class)} />
                                            </div>
                                        ))}
                                    </div>
                                </Section>

                                {/* Language */}
                                <div
                                    className={cn(
                                        'rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm transition-all duration-500',
                                        'hover:border-blue-200 hover:shadow-md',
                                        pageVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
                                    )}
                                    style={{ transitionDelay: '500ms' }}
                                >
                                    <div className="mb-3 flex items-center gap-2">
                                        <Languages className="h-4 w-4 text-blue-600" />
                                        <Label className="font-mono text-[10px] font-bold uppercase tracking-widest text-slate-500">
                                            {t('Select Language')}
                                            <span className="ml-1 text-blue-600">*</span>
                                        </Label>
                                    </div>
                                    <Select value={localLanguage} onValueChange={setLocalLanguage}>
                                        <SelectTrigger className="h-11 border-slate-200 bg-slate-50/60 text-sm font-medium text-slate-800 shadow-sm transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-100">
                                            <SelectValue placeholder={t('Choose Language')} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="en">{t('English')}</SelectItem>
                                            <SelectItem value="ha">{t('Hausa')}</SelectItem>
                                            <SelectItem value="ar">{t('Arabic')}</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                            </div>{/* end space-y-6 */}

                            <Separator className="my-8 bg-slate-100" />

                            {/* Save button */}
                            <div className="flex justify-center">
                                <Button
                                    onClick={handleSave}
                                    className={cn(
                                        'h-12 w-full max-w-xs gap-2.5 rounded-full px-8 text-sm font-bold tracking-tight shadow-lg transition-all duration-500',
                                        saved
                                            ? 'scale-[1.03] bg-emerald-500 shadow-emerald-200 hover:bg-emerald-600'
                                            : 'bg-blue-700 shadow-blue-200 hover:scale-[1.02] hover:bg-blue-800 hover:shadow-blue-300'
                                    )}
                                >
                                    <Check className="h-4 w-4" strokeWidth={3} />
                                    {saved ? 'Saved Successfully!' : t('Save Settings')}
                                </Button>
                            </div>

                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
