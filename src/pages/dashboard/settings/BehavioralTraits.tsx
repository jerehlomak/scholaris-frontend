import { useState, useEffect } from 'react';
import { Button } from './../../../components/ui/button';
import { Input } from './../../../components/ui/input';
import { Label } from './../../../components/ui/label';
import { Card, CardContent, CardHeader } from './../../../components/ui/card';
import { Badge } from './../../../components/ui/badge';
import { Separator } from './../../../components/ui/separator';
import {
    Plus,
    Trash2,
    Save,
    GripVertical,
    Activity,
    ChevronRight,
    CheckCircle2,
} from 'lucide-react';
import { cn } from './../../../lib/utils';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
interface Trait {
    id: string;
    name: string;
}

interface DomainCategory {
    id: string;
    title: string;
    description: string;
    traits: Trait[];
}

const DEFAULT_DOMAINS: DomainCategory[] = [
    {
        id: 'cat-1',
        title: 'Affective Domain (Behavior & Character)',
        description: "Traits related to a student's social behavior and moral conduct.",
        traits: [
            { id: 't-1', name: 'Punctuality' },
            { id: 't-2', name: 'Neatness' },
            { id: 't-3', name: 'Politeness' },
            { id: 't-4', name: 'Honesty' },
            { id: 't-5', name: 'Relationship with Peers' },
            { id: 't-6', name: 'Attentiveness in Class' },
        ],
    },
    {
        id: 'cat-2',
        title: 'Psychomotor Domain (Skills)',
        description: 'Physical skills and extracurricular abilities.',
        traits: [
            { id: 't-7', name: 'Handwriting' },
            { id: 't-8', name: 'Verbal Fluency' },
            { id: 't-9', name: 'Sports & Athletics' },
            { id: 't-10', name: 'Musical Skills' },
        ],
    },
];

// ─────────────────────────────────────────────
// TraitRow
// ─────────────────────────────────────────────
function TraitRow({
    trait,
    domainId,
    onUpdate,
    onRemove,
    delay,
}: {
    trait: Trait;
    domainId: string;
    onUpdate: (domainId: string, traitId: string, value: string) => void;
    onRemove: (domainId: string, traitId: string) => void;
    delay: number;
}) {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const t = setTimeout(() => setVisible(true), delay);
        return () => clearTimeout(t);
    }, [delay]);

    return (
        <div
            className={cn(
                'group/trait flex items-center gap-2 rounded-xl border border-blue-50 bg-slate-50/70 p-1.5',
                'transition-all duration-300 hover:border-blue-100 hover:bg-blue-50/40 hover:shadow-sm',
                visible ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'
            )}
        >
            <div className="cursor-grab px-1 text-slate-300 transition-colors hover:text-slate-400 active:cursor-grabbing">
                <GripVertical className="h-3.5 w-3.5" />
            </div>
            <Input
                className="h-9 flex-1 border-slate-200 bg-white text-base font-medium text-slate-800 shadow-sm transition-all focus-visible:border-blue-400 focus-visible:ring-2 focus-visible:ring-blue-100"
                value={trait.name}
                onChange={(e) => onUpdate(domainId, trait.id, e.target.value)}
                placeholder="e.g. Punctuality"
            />
            <button
                onClick={() => onRemove(domainId, trait.id)}
                className="rounded-lg p-1.5 text-slate-300 opacity-0 transition-all hover:bg-red-50 hover:text-red-500 group-hover/trait:opacity-100"
            >
                <Trash2 className="h-3.5 w-3.5" />
            </button>
        </div>
    );
}

// ─────────────────────────────────────────────
// DomainCard
// ─────────────────────────────────────────────
function DomainCard({
    domain,
    index,
    onUpdate,
    onRemove,
    onAddTrait,
    onUpdateTrait,
    onRemoveTrait,
    mountDelay,
}: {
    domain: DomainCategory;
    index: number;
    onUpdate: (id: string, field: keyof DomainCategory, value: string) => void;
    onRemove: (id: string) => void;
    onAddTrait: (id: string) => void;
    onUpdateTrait: (domainId: string, traitId: string, value: string) => void;
    onRemoveTrait: (domainId: string, traitId: string) => void;
    mountDelay: number;
}) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        const t = setTimeout(() => setMounted(true), mountDelay);
        return () => clearTimeout(t);
    }, [mountDelay]);

    return (
        <Card
            className={cn(
                'group relative overflow-hidden border border-slate-200/80 bg-white shadow-sm',
                'transition-all duration-500 hover:border-blue-200 hover:shadow-md',
                mounted ? 'translate-y-0 scale-100 opacity-100' : 'translate-y-4 scale-[0.98] opacity-0'
            )}
        >
            {/* Left accent bar */}
            <div className="absolute bottom-0 left-0 top-0 w-1 rounded-l-xl bg-gradient-to-b from-blue-700 to-blue-400 opacity-30 transition-opacity duration-300 group-hover:opacity-100" />

            {/* Delete domain btn */}
            <button
                onClick={() => onRemove(domain.id)}
                className="absolute right-3 top-3 z-10 rounded-lg p-2 text-slate-300 opacity-0 transition-all hover:bg-red-50 hover:text-red-500 group-hover:opacity-100"
                title="Delete category"
            >
                <Trash2 className="h-4 w-4" />
            </button>

            {/* Header */}
            <CardHeader className="border-b border-slate-100 bg-gradient-to-br from-slate-50 to-blue-50/30 pb-5 pl-6 pr-12 pt-5">
                <div className="flex items-start gap-4">
                    {/* Index badge */}
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-700 to-blue-500 font-mono text-sm font-bold text-white shadow-md shadow-blue-200">
                        {String(index + 1).padStart(2, '0')}
                    </div>

                    <div className="min-w-0 flex-1 space-y-2">
                        <div>
                            <Label className="mb-1.5 block font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                Category Title
                            </Label>
                            <Input
                                className="h-11 w-full border-slate-200 bg-white text-base font-bold text-slate-900 shadow-sm transition-all focus-visible:border-blue-400 focus-visible:ring-2 focus-visible:ring-blue-100"
                                value={domain.title}
                                onChange={(e) => onUpdate(domain.id, 'title', e.target.value)}
                                placeholder="e.g. Affective Domain"
                            />
                        </div>
                        <Input
                            className="h-8 w-full border-transparent bg-transparent px-0 text-sm text-slate-500 shadow-none transition-all hover:border-slate-200 focus-visible:border-slate-300 focus-visible:bg-white focus-visible:px-3 focus-visible:ring-0"
                            value={domain.description}
                            onChange={(e) => onUpdate(domain.id, 'description', e.target.value)}
                            placeholder="Brief description of this category..."
                        />
                    </div>
                </div>
            </CardHeader>

            {/* Body */}
            <CardContent className="pb-5 pl-6 pr-6 pt-5">
                <div className="mb-4 flex items-center gap-2">
                    <Label className="font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400">
                        Traits to Evaluate
                    </Label>
                    <Badge
                        className="h-5 rounded-md bg-blue-50 px-1.5 font-mono text-[10px] font-bold text-blue-600 hover:bg-blue-50"
                    >
                        {domain.traits.length} · Rated 1–5
                    </Badge>
                </div>

                <div className="mb-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                    {domain.traits.map((trait, ti) => (
                        <TraitRow
                            key={trait.id}
                            trait={trait}
                            domainId={domain.id}
                            onUpdate={onUpdateTrait}
                            onRemove={onRemoveTrait}
                            delay={ti * 40}
                        />
                    ))}
                </div>

                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onAddTrait(domain.id)}
                    className="h-9 gap-1.5 rounded-lg border border-dashed border-blue-200 bg-blue-50/50 px-4 text-xs font-semibold text-blue-600 transition-all hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
                >
                    <Plus className="h-3.5 w-3.5" />
                    Add Trait
                </Button>
            </CardContent>
        </Card>
    );
}

// ─────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────
export function BehavioralTraits() {
    const [domains, setDomains] = useState<DomainCategory[]>(DEFAULT_DOMAINS);
    const [saved, setSaved] = useState(false);
    const [pageVisible, setPageVisible] = useState(false);

    useEffect(() => {
        const t = setTimeout(() => setPageVisible(true), 60);
        return () => clearTimeout(t);
    }, []);

    // ── Domain operations ──────────────────────
    const addDomain = () => {
        setSaved(false);
        setDomains((prev) => [
            ...prev,
            {
                id: `cat-${Date.now()}`,
                title: 'New Skill Category',
                description: 'Description of this assessment area...',
                traits: [],
            },
        ]);
    };

    const updateDomain = (id: string, field: keyof DomainCategory, value: string) => {
        setSaved(false);
        setDomains((prev) => prev.map((d) => (d.id === id ? { ...d, [field]: value } : d)));
    };

    const removeDomain = (id: string) => {
        setSaved(false);
        setDomains((prev) => prev.filter((d) => d.id !== id));
    };

    // ── Trait operations ───────────────────────
    const addTrait = (domainId: string) => {
        setSaved(false);
        setDomains((prev) =>
            prev.map((d) =>
                d.id === domainId
                    ? { ...d, traits: [...d.traits, { id: `t-${Date.now()}`, name: '' }] }
                    : d
            )
        );
    };

    const updateTrait = (domainId: string, traitId: string, value: string) => {
        setSaved(false);
        setDomains((prev) =>
            prev.map((d) =>
                d.id === domainId
                    ? {
                        ...d,
                        traits: d.traits.map((t) =>
                            t.id === traitId ? { ...t, name: value } : t
                        ),
                    }
                    : d
            )
        );
    };

    const removeTrait = (domainId: string, traitId: string) => {
        setSaved(false);
        setDomains((prev) =>
            prev.map((d) =>
                d.id === domainId
                    ? { ...d, traits: d.traits.filter((t) => t.id !== traitId) }
                    : d
            )
        );
    };

    const handleSave = () => {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
    };

    const totalTraits = domains.reduce((a, d) => a + d.traits.length, 0);

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=DM+Mono:wght@400;500;700&display=swap');
                .btr-root, .btr-root * { font-family: 'Plus Jakarta Sans', sans-serif !important; }
                .btr-root .font-mono { font-family: 'DM Mono', monospace !important; }
                @keyframes btr-float {
                    0%, 100% { transform: translateY(0); }
                    50%       { transform: translateY(-6px); }
                }
                @keyframes btr-pulse-ring {
                    0%   { transform: scale(0.9);  opacity: 0.5; }
                    100% { transform: scale(1.45); opacity: 0; }
                }
                .btr-float     { animation: btr-float 3.5s ease-in-out infinite; }
                .btr-pulse-ring { animation: btr-pulse-ring 2.2s ease-out infinite; }
            `}</style>

            <div className="btr-root min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-indigo-50/30 px-4 pb-20 pt-8 sm:px-6 lg:px-8">

                {/* Dot grid bg */}
                <div
                    className="pointer-events-none fixed inset-0 opacity-30"
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
                            Settings
                        </span>
                        <ChevronRight className="h-3 w-3 text-slate-400" />
                        <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-blue-600">
                            Behavioral & Skills
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
                                <Activity className="h-3.5 w-3.5 text-blue-600" />
                                <span className="text-xs font-bold tracking-tight text-blue-600">
                                    Assessment Criteria
                                </span>
                            </div>
                        </div>

                        <div className="px-6 pb-10 pt-10 sm:px-10">

                            {/* Hero */}
                            <div className="mb-10 text-center">
                                <div className="btr-float relative mx-auto mb-5 h-16 w-16">
                                    <div className="btr-pulse-ring absolute inset-0 rounded-2xl bg-blue-400/25" />
                                    <div className="relative flex h-full w-full items-center justify-center rounded-2xl bg-gradient-to-br from-blue-700 to-blue-500 shadow-lg shadow-blue-200">
                                        <Activity className="h-7 w-7 text-white" />
                                    </div>
                                </div>

                                <h2 className="mb-2 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-[1.75rem]">
                                    Behavioral & Skills Assessment
                                </h2>
                                <p className="mx-auto max-w-md text-sm leading-relaxed text-slate-500">
                                    Customize the non-academic traits your school evaluates each term.
                                    These appear on student report cards.
                                </p>

                                {/* Stats pills */}
                                <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                                    {[
                                        { label: 'Categories', value: domains.length },
                                        { label: 'Total Traits', value: totalTraits },
                                    ].map((stat) => (
                                        <div
                                            key={stat.label}
                                            className="flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-4 py-1.5 transition-all hover:border-blue-200 hover:bg-blue-100"
                                        >
                                            <span className="font-mono text-sm font-bold text-blue-700">
                                                {stat.value}
                                            </span>
                                            <span className="font-mono text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                                                {stat.label}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Domain cards */}
                            <div className="mb-5 space-y-5">
                                {domains.map((domain, i) => (
                                    <DomainCard
                                        key={domain.id}
                                        domain={domain}
                                        index={i}
                                        onUpdate={updateDomain}
                                        onRemove={removeDomain}
                                        onAddTrait={addTrait}
                                        onUpdateTrait={updateTrait}
                                        onRemoveTrait={removeTrait}
                                        mountDelay={i * 90}
                                    />
                                ))}
                            </div>

                            {/* Add category */}
                            <Button
                                variant="outline"
                                onClick={addDomain}
                                className="mb-8 h-14 w-full gap-3 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50 text-sm font-semibold text-slate-500 transition-all hover:border-blue-300 hover:bg-blue-50/50 hover:text-blue-600"
                            >
                                <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-slate-200 transition-colors">
                                    <Plus className="h-3.5 w-3.5" />
                                </div>
                                Add New Assessment Category
                            </Button>

                            <Separator className="mb-8 bg-slate-100" />

                            {/* Save */}
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
                                    {saved ? (
                                        <>
                                            <CheckCircle2 className="h-4 w-4" />
                                            Saved Successfully!
                                        </>
                                    ) : (
                                        <>
                                            <Save className="h-4 w-4" />
                                            Save Configuration
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

