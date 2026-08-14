import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { 
    Settings2, ToggleLeft, ShieldCheck, Lock, Calendar, Layers, 
    ArrowRightLeft, Plus, Trash2, Edit2, Check, X as CloseIcon, 
    CreditCard, CheckCircle2, RefreshCw
} from 'lucide-react';
import { Card, CardContent } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { Switch } from '../../../components/ui/switch';
import { SettingsShell } from '../settings/shared/SettingsShell';
import { SaveButton } from '../settings/shared/SaveButton';
import { cn } from '../../../lib/utils';

type LedgerCategory = { id: string; name: string; type: 'INCOME' | 'EXPENSE' };

type SettingsTab = 'general' | 'display' | 'term-control' | 'roles' | 'categories' | 'transfer-guide';

const TABS: { id: SettingsTab; label: string; icon: any; badge?: string }[] = [
    { id: 'general', label: 'General & Currency', icon: Settings2 },
    { id: 'display', label: 'Document Display', icon: ToggleLeft, badge: 'Toggles' },
    { id: 'term-control', label: 'Term & Session Lock', icon: Lock },
    { id: 'roles', label: 'Staff Permissions', icon: ShieldCheck, badge: 'Roles' },
    { id: 'categories', label: 'Ledger Categories', icon: Layers },
    { id: 'transfer-guide', label: 'Transfer Verification', icon: ArrowRightLeft },
];

export default function FinanceSettings() {
    const [activeTab, setActiveTab] = useState<SettingsTab>('general');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    // Global Settings State
    const [settings, setSettings] = useState<any>({
        currencySymbol: '₦',
        invoicePrefix: 'INV-',
        receiptPrefix: 'REC-',
        allowPartialPayment: true,
        allowOverpayment: false,
        autoApplyWallet: false,
        showOptionalFees: true,
        showItemizedBreakdown: true,
        enableTransport: false,
        currentTerm: 'First Term',
        currentYear: '',
        schoolName: '',
        sessions: [],
        terms: [],
        financeModuleToggles: {
            display: {
                showItemizedBreakdown: true,
                showOptionalFees: true,
                showSchoolLogo: true,
                showBankDetails: true,
                showDueDate: true,
                showParentInfo: true,
                showPaymentInstructions: true,
                showTaxColumn: false,
                showDiscountColumn: true,
                showPreviousBalance: true,
                showWatermark: true,
                showQrCode: true,
                showSignatureLine: true,
                headerLayoutMode: 'CLASSIC_LEFT',
                instructionsText: 'Please quote the Student Admission Number or Invoice Number on all bank transfer deposits.',
                footerNote: 'Thank you for your prompt payment. In case of discrepancies, kindly contact the Bursary Department.',
            },
            termLock: {
                locked: false,
                activeTerm: 'First Term',
                activeSession: '',
                allowStaffOverride: false,
            },
            rolePermissions: {
                CASHIER: {
                    canRecordPayments: true,
                    canPrintReceipts: true,
                    canViewInvoices: true,
                    canCreateInvoices: false,
                    canEditInvoices: false,
                    canDeleteInvoices: false,
                    canApproveTransfers: false,
                    canApplyDiscounts: false,
                    canViewPayroll: false,
                    canRunPayroll: false,
                    canViewReports: false,
                    canManageSettings: false,
                },
                ACCOUNTANT: {
                    canRecordPayments: true,
                    canPrintReceipts: true,
                    canViewInvoices: true,
                    canCreateInvoices: true,
                    canEditInvoices: true,
                    canDeleteInvoices: false,
                    canApproveTransfers: true,
                    canApplyDiscounts: true,
                    canViewPayroll: true,
                    canRunPayroll: false,
                    canViewReports: true,
                    canManageSettings: false,
                },
                BURSAR: {
                    canRecordPayments: true,
                    canPrintReceipts: true,
                    canViewInvoices: true,
                    canCreateInvoices: true,
                    canEditInvoices: true,
                    canDeleteInvoices: true,
                    canApproveTransfers: true,
                    canApplyDiscounts: true,
                    canViewPayroll: true,
                    canRunPayroll: true,
                    canViewReports: true,
                    canManageSettings: true,
                },
                AUDITOR: {
                    canRecordPayments: false,
                    canPrintReceipts: true,
                    canViewInvoices: true,
                    canCreateInvoices: false,
                    canEditInvoices: false,
                    canDeleteInvoices: false,
                    canApproveTransfers: false,
                    canApplyDiscounts: false,
                    canViewPayroll: true,
                    canRunPayroll: false,
                    canViewReports: true,
                    canManageSettings: false,
                },
            }
        }
    });

    // Categories state
    const [categories, setCategories] = useState<LedgerCategory[]>([]);
    const [catFilter, setCatFilter] = useState<'ALL' | 'INCOME' | 'EXPENSE'>('ALL');
    const [newCatName, setNewCatName] = useState('');
    const [newCatType, setNewCatType] = useState<'INCOME' | 'EXPENSE'>('INCOME');
    const [editingCatId, setEditingCatId] = useState<string | null>(null);
    const [editCatName, setEditCatName] = useState('');
    const [catLoading, setCatLoading] = useState(false);

    // Selected staff role in Permissions tab
    const [selectedRole, setSelectedRole] = useState<'CASHIER' | 'ACCOUNTANT' | 'BURSAR' | 'AUDITOR'>('CASHIER');

    const fetchData = async () => {
        setLoading(true);
        try {
            const [resSet, resCat] = await Promise.all([
                axios.get('/api/v1/finance-v2/settings', { withCredentials: true }),
                axios.get('/api/v1/finance-v2/categories', { withCredentials: true })
            ]);
            if (resSet.data.settings) {
                setSettings(resSet.data.settings);
            }
            if (resCat.data.categories) {
                setCategories(resCat.data.categories);
            }
        } catch {
            toast.error('Failed to load financial settings');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Global field update
    const updateSetting = (key: string, val: any) => {
        setSaved(false);
        setSettings((prev: any) => ({ ...prev, [key]: val }));
    };

    // Nested Display Toggle update
    const updateDisplayToggle = (key: string, val: any) => {
        setSaved(false);
        setSettings((prev: any) => ({
            ...prev,
            financeModuleToggles: {
                ...prev.financeModuleToggles,
                display: {
                    ...prev.financeModuleToggles?.display,
                    [key]: val,
                }
            }
        }));
    };

    // Term Lock update
    const updateTermLock = (key: string, val: any) => {
        setSaved(false);
        setSettings((prev: any) => ({
            ...prev,
            financeModuleToggles: {
                ...prev.financeModuleToggles,
                termLock: {
                    ...prev.financeModuleToggles?.termLock,
                    [key]: val,
                }
            }
        }));
    };

    // Role Permission Toggle update
    const updateRolePermission = (role: string, permKey: string, val: boolean) => {
        setSaved(false);
        setSettings((prev: any) => ({
            ...prev,
            financeModuleToggles: {
                ...prev.financeModuleToggles,
                rolePermissions: {
                    ...prev.financeModuleToggles?.rolePermissions,
                    [role]: {
                        ...prev.financeModuleToggles?.rolePermissions?.[role],
                        [permKey]: val,
                    }
                }
            }
        }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await axios.put('/api/v1/finance-v2/settings', settings, { withCredentials: true });
            setSaved(true);
            toast.success('Financial settings saved successfully');
            setTimeout(() => setSaved(false), 3000);
        } catch {
            toast.error('Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    // Category Handlers
    const handleAddCategory = async () => {
        if (!newCatName.trim()) return;
        setCatLoading(true);
        try {
            const res = await axios.post('/api/v1/finance-v2/categories', { name: newCatName, type: newCatType }, { withCredentials: true });
            setCategories([...categories, res.data.category]);
            setNewCatName('');
            toast.success('Category added successfully');
        } catch (e: any) {
            toast.error(e.response?.data?.msg || 'Failed to add category');
        } finally {
            setCatLoading(false);
        }
    };

    const handleUpdateCategory = async (id: string) => {
        if (!editCatName.trim()) return;
        setCatLoading(true);
        try {
            const res = await axios.put(`/api/v1/finance-v2/categories/${id}`, { name: editCatName }, { withCredentials: true });
            setCategories(categories.map(c => c.id === id ? res.data.category : c));
            setEditingCatId(null);
            toast.success('Category updated successfully');
        } catch (e: any) {
            toast.error(e.response?.data?.msg || 'Failed to update category');
        } finally {
            setCatLoading(false);
        }
    };

    const handleDeleteCategory = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this category?')) return;
        setCatLoading(true);
        try {
            await axios.delete(`/api/v1/finance-v2/categories/${id}`, { withCredentials: true });
            setCategories(categories.filter(c => c.id !== id));
            toast.success('Category deleted');
        } catch (e: any) {
            toast.error(e.response?.data?.msg || 'Failed to delete category');
        } finally {
            setCatLoading(false);
        }
    };

    const filteredCategories = categories.filter(c => {
        if (catFilter === 'ALL') return true;
        return c.type === catFilter;
    });

    const displayToggles = settings.financeModuleToggles?.display || {};
    const termLock = settings.financeModuleToggles?.termLock || {};
    const rolePermissions = settings.financeModuleToggles?.rolePermissions || {};

    const availableSessions = settings.sessions || [];
    const availableTerms = ['First Term', 'Second Term', 'Third Term'];

    return (
        <SettingsShell
            breadcrumbParent="Finance"
            breadcrumbCurrent="Finance Settings"
            tabLabel="Finance Configuration"
            tabIcon={<Settings2 className="h-3.5 w-3.5" />}
        >
            <div className="space-y-6">
                {/* Header Banner */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 flex items-center gap-2.5">
                            <Settings2 className="h-7 w-7 text-[#173F8C]" />
                            Financial Settings & Permissions
                        </h1>
                        <p className="mt-1 text-sm text-slate-500">
                            Configure document layout toggles, term locking, staff role access, ledger categories, and payment preferences.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Link
                            to="/dashboard/finance/payment-settings"
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                        >
                            <CreditCard className="h-3.5 w-3.5 text-[#1E4DA6]" />
                            Payment Gateways
                        </Link>
                        <Link
                            to="/dashboard/finance/transfers"
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-violet-50 hover:bg-violet-100 text-violet-700 transition"
                        >
                            <ArrowRightLeft className="h-3.5 w-3.5 text-violet-600" />
                            Transfer Queue
                        </Link>
                    </div>
                </div>

                {/* Term Lock Alert (If Locked) */}
                {termLock.locked && (
                    <div className="flex items-center justify-between p-3.5 bg-amber-50/80 border border-amber-200/80 rounded-2xl text-amber-900 text-xs sm:text-sm shadow-xs">
                        <div className="flex items-center gap-2.5">
                            <Lock className="h-4 w-4 text-amber-600 shrink-0" />
                            <span>
                                <strong>Finance Module Locked:</strong> Invoices, fees, and billing operations are strictly anchored to <strong>{termLock.activeTerm} ({termLock.activeSession || 'Current Session'})</strong>.
                            </span>
                        </div>
                        <button
                            onClick={() => setActiveTab('term-control')}
                            className="text-xs font-bold text-amber-700 hover:text-amber-800 underline shrink-0"
                        >
                            Configure
                        </button>
                    </div>
                )}

                {/* Navigation Tabs */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar border-b border-slate-100">
                    {TABS.map(tab => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={cn(
                                    "flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition-all duration-200",
                                    isActive
                                        ? "bg-[#173F8C] text-white shadow-sm shadow-[#1E4DA6]/20"
                                        : "bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200/60"
                                )}
                            >
                                <Icon className={cn("h-4 w-4", isActive ? "text-white" : "text-slate-400")} />
                                <span>{tab.label}</span>
                                {tab.badge && (
                                    <span className={cn(
                                        "text-[10px] px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider",
                                        isActive ? "bg-[#122F69]/80 text-white/80" : "bg-slate-200 text-slate-600"
                                    )}>
                                        {tab.badge}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>

                {loading ? (
                    <div className="py-20 text-center text-slate-400 flex flex-col items-center gap-3">
                        <RefreshCw className="h-6 w-6 animate-spin text-[#1E4DA6]" />
                        <p className="text-sm font-medium">Loading financial settings...</p>
                    </div>
                ) : (
                    <>
                        {/* ─── TAB 1: GENERAL & CURRENCY PREFERENCES ─── */}
                        {activeTab === 'general' && (
                            <div className="space-y-6">
                                <Card className="border-slate-200/80 shadow-xs rounded-2xl">
                                    <CardContent className="p-5 sm:p-6 space-y-6">
                                        <div>
                                            <h2 className="text-base font-bold text-slate-900">Currency & Identification Prefixes</h2>
                                            <p className="text-xs text-slate-500 mt-0.5">Customize currency symbol and numbering prefixes for invoices & receipts.</p>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Currency Symbol</label>
                                                <Input 
                                                    value={settings.currencySymbol || '₦'} 
                                                    onChange={e => updateSetting('currencySymbol', e.target.value)}
                                                    placeholder="e.g. ₦, $, €, £"
                                                    className="h-11 rounded-xl font-bold text-base"
                                                />
                                                <p className="text-[11px] text-slate-400">Used across invoices, payslips, and statements.</p>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Invoice Prefix</label>
                                                <Input 
                                                    value={settings.invoicePrefix || 'INV-'} 
                                                    onChange={e => updateSetting('invoicePrefix', e.target.value)}
                                                    placeholder="e.g. INV-"
                                                    className="h-11 rounded-xl font-mono text-sm font-bold"
                                                />
                                                <p className="text-[11px] text-slate-400">Example output: {settings.invoicePrefix || 'INV-'}2025-001</p>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Receipt Prefix</label>
                                                <Input 
                                                    value={settings.receiptPrefix || 'REC-'} 
                                                    onChange={e => updateSetting('receiptPrefix', e.target.value)}
                                                    placeholder="e.g. REC-"
                                                    className="h-11 rounded-xl font-mono text-sm font-bold"
                                                />
                                                <p className="text-[11px] text-slate-400">Example output: {settings.receiptPrefix || 'REC-'}2025-001</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="border-slate-200/80 shadow-xs rounded-2xl">
                                    <CardContent className="p-5 sm:p-6 space-y-6">
                                        <div>
                                            <h2 className="text-base font-bold text-slate-900">Payment & Settlement Rules</h2>
                                            <p className="text-xs text-slate-500 mt-0.5">Control installment payments, excess balance allocations, and wallet credits.</p>
                                        </div>

                                        <div className="divide-y divide-slate-100">
                                            {/* Allow Partial Payments */}
                                            <div className="flex items-center justify-between py-4">
                                                <div className="pr-4">
                                                    <p className="font-bold text-sm text-slate-800">Allow Partial / Installment Payments</p>
                                                    <p className="text-xs text-slate-500 mt-0.5">Permit parents and students to pay bills in flexible installments.</p>
                                                </div>
                                                <Switch 
                                                    checked={settings.allowPartialPayment !== false} 
                                                    onCheckedChange={v => updateSetting('allowPartialPayment', v)}
                                                />
                                            </div>

                                            {/* Allow Overpayment */}
                                            <div className="flex items-center justify-between py-4">
                                                <div className="pr-4">
                                                    <p className="font-bold text-sm text-slate-800">Allow Overpayment / Credit Student Wallet</p>
                                                    <p className="text-xs text-slate-500 mt-0.5">Automatically credit any surplus payment into the student's digital wallet.</p>
                                                </div>
                                                <Switch 
                                                    checked={settings.allowOverpayment === true} 
                                                    onCheckedChange={v => updateSetting('allowOverpayment', v)}
                                                />
                                            </div>

                                            {/* Auto-Apply Wallet Credit */}
                                            <div className="flex items-center justify-between py-4">
                                                <div className="pr-4">
                                                    <p className="font-bold text-sm text-slate-800">Auto-Apply Wallet Credit on Billing</p>
                                                    <p className="text-xs text-slate-500 mt-0.5">Automatically deduct available student wallet balance when new term bills are generated.</p>
                                                </div>
                                                <Switch 
                                                    checked={settings.autoApplyWallet === true} 
                                                    onCheckedChange={v => updateSetting('autoApplyWallet', v)}
                                                />
                                            </div>

                                            {/* Enable Transport Module */}
                                            <div className="flex items-center justify-between py-4">
                                                <div className="pr-4">
                                                    <p className="font-bold text-sm text-slate-800">Enable Transport & Route Billing</p>
                                                    <p className="text-xs text-slate-500 mt-0.5">Activate student bus route subscriptions and periodic transport fare fees.</p>
                                                </div>
                                                <Switch 
                                                    checked={settings.enableTransport === true} 
                                                    onCheckedChange={v => updateSetting('enableTransport', v)}
                                                />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        )}

                        {/* ─── TAB 2: DOCUMENT DISPLAY TOGGLES ─── */}
                        {activeTab === 'display' && (
                            <div className="space-y-6">
                                {/* Header Layout Style */}
                                <Card className="border-slate-200/80 shadow-xs rounded-2xl">
                                    <CardContent className="p-5 sm:p-6 space-y-4">
                                        <div>
                                            <h2 className="text-base font-bold text-slate-900">Header Branding & Layout</h2>
                                            <p className="text-xs text-slate-500 mt-0.5">Select header alignment and branding layout on printed invoices & receipts.</p>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                            {[
                                                { id: 'CLASSIC_LEFT', title: 'Classic Left Aligned', desc: 'School logo on the left, school title and details aligned left.' },
                                                { id: 'CENTERED', title: 'Centered Modern', desc: 'Emblem in center with bold centered header and sub-details.' },
                                                { id: 'MINIMAL_RIGHT', title: 'Minimalist Split', desc: 'School branding on the left, invoice number & QR code on the right.' },
                                            ].map(layout => {
                                                const selected = (displayToggles.headerLayoutMode || 'CLASSIC_LEFT') === layout.id;
                                                return (
                                                    <div
                                                        key={layout.id}
                                                        onClick={() => updateDisplayToggle('headerLayoutMode', layout.id)}
                                                        className={cn(
                                                            "p-4 rounded-xl border cursor-pointer transition-all",
                                                            selected 
                                                                ? "border-[#1E4DA6] bg-[#1E4DA6]/8 ring-2 ring-[#1E4DA6]/20 shadow-xs"
                                                                : "border-slate-200 hover:border-slate-300 bg-white"
                                                        )}
                                                    >
                                                        <div className="flex items-center gap-2.5">
                                                            <div className={cn("w-4 h-4 rounded-full border flex items-center justify-center", selected ? "border-[#1E4DA6] bg-[#1E4DA6]" : "border-slate-300")}>
                                                                {selected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                                            </div>
                                                            <span className="font-bold text-sm text-slate-900">{layout.title}</span>
                                                        </div>
                                                        <p className="text-xs text-slate-500 mt-2 pl-6.5">{layout.desc}</p>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Invoice Content & Table Breakdown Toggles */}
                                <Card className="border-slate-200/80 shadow-xs rounded-2xl">
                                    <CardContent className="p-5 sm:p-6 space-y-6">
                                        <div>
                                            <h2 className="text-base font-bold text-slate-900">Invoice Items & Breakdown Toggles</h2>
                                            <p className="text-xs text-slate-500 mt-0.5">Control how line items, particulars, and fee categories appear to parents and students.</p>
                                        </div>

                                        <div className="divide-y divide-slate-100">
                                            {/* Itemized Breakdown Toggle */}
                                            <div className="flex items-center justify-between py-4">
                                                <div className="pr-4">
                                                    <div className="flex items-center gap-2">
                                                        <p className="font-bold text-sm text-slate-800">Show Full Itemized Breakdown</p>
                                                        <span className="text-[10px] bg-[#1E4DA6]/10 text-[#122F69] px-1.5 py-0.5 rounded-md font-bold">Recommended</span>
                                                    </div>
                                                    <p className="text-xs text-slate-500 mt-0.5">
                                                        When <strong>Enabled</strong>, invoices list individual items (Tuition, Books, Uniform, ICT). When <strong>Disabled</strong>, displays a single consolidated row titled "School Fees".
                                                    </p>
                                                </div>
                                                <Switch 
                                                    checked={displayToggles.showItemizedBreakdown !== false} 
                                                    onCheckedChange={v => {
                                                        updateDisplayToggle('showItemizedBreakdown', v);
                                                        updateSetting('showItemizedBreakdown', v);
                                                    }}
                                                />
                                            </div>

                                            {/* Show Optional Fees */}
                                            <div className="flex items-center justify-between py-4">
                                                <div className="pr-4">
                                                    <p className="font-bold text-sm text-slate-800">Show Optional & Elective Fees</p>
                                                    <p className="text-xs text-slate-500 mt-0.5">Display optional fee components (Clubs, Excursions, Summer Camp) in fee tables.</p>
                                                </div>
                                                <Switch 
                                                    checked={displayToggles.showOptionalFees !== false} 
                                                    onCheckedChange={v => {
                                                        updateDisplayToggle('showOptionalFees', v);
                                                        updateSetting('showOptionalFees', v);
                                                    }}
                                                />
                                            </div>

                                            {/* Show Discount / Scholarship Column */}
                                            <div className="flex items-center justify-between py-4">
                                                <div className="pr-4">
                                                    <p className="font-bold text-sm text-slate-800">Show Discount & Scholarship Reductions</p>
                                                    <p className="text-xs text-slate-500 mt-0.5">Highlight applied sibling discounts and scholarship waivers clearly on invoice totals.</p>
                                                </div>
                                                <Switch 
                                                    checked={displayToggles.showDiscountColumn !== false} 
                                                    onCheckedChange={v => updateDisplayToggle('showDiscountColumn', v)}
                                                />
                                            </div>

                                            {/* Show Previous Balance / Arrears */}
                                            <div className="flex items-center justify-between py-4">
                                                <div className="pr-4">
                                                    <p className="font-bold text-sm text-slate-800">Show Previous Term Balance / Arrears</p>
                                                    <p className="text-xs text-slate-500 mt-0.5">Include unpaid balances brought forward from previous terms on new invoices.</p>
                                                </div>
                                                <Switch 
                                                    checked={displayToggles.showPreviousBalance !== false} 
                                                    onCheckedChange={v => updateDisplayToggle('showPreviousBalance', v)}
                                                />
                                            </div>

                                            {/* Show Tax Column */}
                                            <div className="flex items-center justify-between py-4">
                                                <div className="pr-4">
                                                    <p className="font-bold text-sm text-slate-800">Show Tax / VAT Column</p>
                                                    <p className="text-xs text-slate-500 mt-0.5">Include statutory tax columns if applicable in your educational jurisdiction.</p>
                                                </div>
                                                <Switch 
                                                    checked={displayToggles.showTaxColumn === true} 
                                                    onCheckedChange={v => updateDisplayToggle('showTaxColumn', v)}
                                                />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Document Elements & Verification */}
                                <Card className="border-slate-200/80 shadow-xs rounded-2xl">
                                    <CardContent className="p-5 sm:p-6 space-y-6">
                                        <div>
                                            <h2 className="text-base font-bold text-slate-900">Document Elements & Signatures</h2>
                                            <p className="text-xs text-slate-500 mt-0.5">Customize institutional elements displayed on invoices and receipts.</p>
                                        </div>

                                        <div className="divide-y divide-slate-100">
                                            {/* School Logo */}
                                            <div className="flex items-center justify-between py-4">
                                                <div className="pr-4">
                                                    <p className="font-bold text-sm text-slate-800">Show School Logo / Crest</p>
                                                    <p className="text-xs text-slate-500 mt-0.5">Display the official school crest at the top of financial documents.</p>
                                                </div>
                                                <Switch 
                                                    checked={displayToggles.showSchoolLogo !== false} 
                                                    onCheckedChange={v => updateDisplayToggle('showSchoolLogo', v)}
                                                />
                                            </div>

                                            {/* Bank Details on Invoices */}
                                            <div className="flex items-center justify-between py-4">
                                                <div className="pr-4">
                                                    <div className="flex items-center gap-2">
                                                        <p className="font-bold text-sm text-slate-800">Show School Bank Accounts for Direct Transfer</p>
                                                        <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-md font-bold">Essential</span>
                                                    </div>
                                                    <p className="text-xs text-slate-500 mt-0.5">Display bank account numbers and payment instructions at the bottom of invoices for bank transfer deposits.</p>
                                                </div>
                                                <Switch 
                                                    checked={displayToggles.showBankDetails !== false} 
                                                    onCheckedChange={v => updateDisplayToggle('showBankDetails', v)}
                                                />
                                            </div>

                                            {/* Watermark */}
                                            <div className="flex items-center justify-between py-4">
                                                <div className="pr-4">
                                                    <p className="font-bold text-sm text-slate-800">Show Document Status Watermark</p>
                                                    <p className="text-xs text-slate-500 mt-0.5">Display subtle 'PAID', 'OVERDUE', or 'PARTIAL' diagonal watermarks on documents.</p>
                                                </div>
                                                <Switch 
                                                    checked={displayToggles.showWatermark !== false} 
                                                    onCheckedChange={v => updateDisplayToggle('showWatermark', v)}
                                                />
                                            </div>

                                            {/* QR Code */}
                                            <div className="flex items-center justify-between py-4">
                                                <div className="pr-4">
                                                    <p className="font-bold text-sm text-slate-800">Embed Scannable Verification QR Code</p>
                                                    <p className="text-xs text-slate-500 mt-0.5">Embed a secure verification QR code on receipts for cashier validation.</p>
                                                </div>
                                                <Switch 
                                                    checked={displayToggles.showQrCode !== false} 
                                                    onCheckedChange={v => updateDisplayToggle('showQrCode', v)}
                                                />
                                            </div>

                                            {/* Signature Line */}
                                            <div className="flex items-center justify-between py-4">
                                                <div className="pr-4">
                                                    <p className="font-bold text-sm text-slate-800">Show Bursar / Signatory Stamp & Signature Line</p>
                                                    <p className="text-xs text-slate-500 mt-0.5">Provide official signature and authorization stamp area at document footer.</p>
                                                </div>
                                                <Switch 
                                                    checked={displayToggles.showSignatureLine !== false} 
                                                    onCheckedChange={v => updateDisplayToggle('showSignatureLine', v)}
                                                />
                                            </div>
                                        </div>

                                        {/* Custom Instructions & Footer Notes */}
                                        <div className="space-y-4 pt-4 border-t border-slate-100">
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Payment Instructions Note</label>
                                                <Input
                                                    value={displayToggles.instructionsText || ''}
                                                    onChange={e => updateDisplayToggle('instructionsText', e.target.value)}
                                                    placeholder="e.g. Please quote Student Admission Number on bank transfer slips."
                                                    className="h-11 rounded-xl text-xs sm:text-sm"
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Terms & Footer Disclaimer</label>
                                                <Input
                                                    value={displayToggles.footerNote || ''}
                                                    onChange={e => updateDisplayToggle('footerNote', e.target.value)}
                                                    placeholder="e.g. Fees paid are non-refundable after term commencement."
                                                    className="h-11 rounded-xl text-xs sm:text-sm"
                                                />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        )}

                        {/* ─── TAB 3: CONTROLLED ACTIVE TERM & SESSION LOCK ─── */}
                        {activeTab === 'term-control' && (
                            <div className="space-y-6">
                                <Card className="border-slate-200/80 shadow-xs rounded-2xl">
                                    <CardContent className="p-5 sm:p-6 space-y-6">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <Lock className="h-5 w-5 text-[#173F8C]" />
                                                <h2 className="text-base font-bold text-slate-900">Controlled Active Term & Session</h2>
                                            </div>
                                            <p className="text-xs text-slate-500 mt-0.5">
                                                Lock the active billing session and term across the school. When locked, cashiers and billing staff cannot generate invoices or collect payments for arbitrary terms.
                                            </p>
                                        </div>

                                        {/* Lock Toggle */}
                                        <div className="p-4 sm:p-5 rounded-2xl bg-[#1E4DA6]/8 border border-[#1E4DA6]/70 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                            <div className="flex items-start gap-3">
                                                <div className="p-2 rounded-xl bg-[#1E4DA6] text-white shrink-0 mt-0.5">
                                                    <Lock className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <h3 className="font-bold text-sm text-slate-900">Strict Active Term Enforcement</h3>
                                                        <span className={cn(
                                                            "text-[10px] px-2 py-0.5 rounded-full font-bold uppercase",
                                                            termLock.locked ? "bg-amber-100 text-amber-800" : "bg-slate-200 text-slate-600"
                                                        )}>
                                                            {termLock.locked ? 'LOCKED & ENFORCED' : 'UNLOCKED (FLEXIBLE)'}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                                                        Once activated, all Single Billing, Family Billing, and Fee Generation workflows will automatically bind to the configured session and term.
                                                    </p>
                                                </div>
                                            </div>

                                            <Switch
                                                checked={termLock.locked === true}
                                                onCheckedChange={v => updateTermLock('locked', v)}
                                            />
                                        </div>

                                        {/* Session and Term Selectors */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                                    <Calendar className="h-3.5 w-3.5 text-[#1E4DA6]" />
                                                    Active Academic Session
                                                </label>
                                                <select
                                                    value={termLock.activeSession || settings.currentYear || ''}
                                                    onChange={e => {
                                                        updateTermLock('activeSession', e.target.value);
                                                        updateSetting('currentYear', e.target.value);
                                                    }}
                                                    className="w-full h-11 px-3 rounded-xl border border-slate-200 bg-white font-bold text-sm text-slate-900 focus:ring-2 focus:ring-[#1E4DA6] focus:outline-none"
                                                >
                                                    <option value="">Select Academic Session</option>
                                                    {availableSessions.map((s: any) => (
                                                        <option key={s.id} value={s.name}>{s.name} {s.isCurrent ? '(Current)' : ''}</option>
                                                    ))}
                                                </select>
                                                <p className="text-[11px] text-slate-400">Controls the primary academic year for all fee calculations.</p>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                                    <Calendar className="h-3.5 w-3.5 text-[#1E4DA6]" />
                                                    Active Academic Term
                                                </label>
                                                <select
                                                    value={termLock.activeTerm || settings.currentTerm || 'First Term'}
                                                    onChange={e => {
                                                        updateTermLock('activeTerm', e.target.value);
                                                        updateSetting('currentTerm', e.target.value);
                                                    }}
                                                    className="w-full h-11 px-3 rounded-xl border border-slate-200 bg-white font-bold text-sm text-slate-900 focus:ring-2 focus:ring-[#1E4DA6] focus:outline-none"
                                                >
                                                    {availableTerms.map(t => (
                                                        <option key={t} value={t}>{t}</option>
                                                    ))}
                                                </select>
                                                <p className="text-[11px] text-slate-400">Controls the current term on student invoices and fee schedules.</p>
                                            </div>
                                        </div>

                                        {/* Staff Override Permission */}
                                        <div className="flex items-center justify-between py-4 border-t border-slate-100">
                                            <div className="pr-4">
                                                <p className="font-bold text-sm text-slate-800">Allow Admin / Bursar Override in Billing Forms</p>
                                                <p className="text-xs text-slate-500 mt-0.5">Allows administrators with Bursar role to manually select a different historical term when needed.</p>
                                            </div>
                                            <Switch 
                                                checked={termLock.allowStaffOverride === true} 
                                                onCheckedChange={v => updateTermLock('allowStaffOverride', v)}
                                            />
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        )}

                        {/* ─── TAB 4: STAFF ROLES & PERMISSIONS MATRIX ─── */}
                        {activeTab === 'roles' && (
                            <div className="space-y-6">
                                <Card className="border-slate-200/80 shadow-xs rounded-2xl">
                                    <CardContent className="p-5 sm:p-6 space-y-6">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <ShieldCheck className="h-5 w-5 text-[#173F8C]" />
                                                <h2 className="text-base font-bold text-slate-900">Financial Staff Roles & Access Matrix</h2>
                                            </div>
                                            <p className="text-xs text-slate-500 mt-0.5">
                                                Control what each financial staff role can see, edit, approve, or execute across the Finance module.
                                            </p>
                                        </div>

                                        {/* Role Selector Tabs */}
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                            {[
                                                { id: 'CASHIER', label: 'Cashier', desc: 'Front-desk fee collection' },
                                                { id: 'ACCOUNTANT', label: 'Accountant', desc: 'Bookkeeper & reconciliations' },
                                                { id: 'BURSAR', label: 'Bursar', desc: 'Chief financial authority' },
                                                { id: 'AUDITOR', label: 'Auditor', desc: 'Read-only financial oversight' },
                                            ].map(role => {
                                                const isSelected = selectedRole === role.id;
                                                return (
                                                    <div
                                                        key={role.id}
                                                        onClick={() => setSelectedRole(role.id as any)}
                                                        className={cn(
                                                            "p-3.5 rounded-xl border cursor-pointer transition-all text-left",
                                                            isSelected
                                                                ? "border-[#1E4DA6] bg-[#1E4DA6]/8 ring-2 ring-[#1E4DA6]/20"
                                                                : "border-slate-200 hover:border-slate-300 bg-white"
                                                        )}
                                                    >
                                                        <div className="flex items-center justify-between">
                                                            <span className="font-bold text-sm text-slate-900">{role.label}</span>
                                                            {isSelected && <CheckCircle2 className="h-4 w-4 text-[#1E4DA6]" />}
                                                        </div>
                                                        <p className="text-[11px] text-slate-400 mt-1">{role.desc}</p>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        {/* Permission Toggles for Selected Role */}
                                        <div className="space-y-4 pt-2">
                                            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                                                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500">
                                                    Permissions for {selectedRole}
                                                </h3>
                                                <span className="text-xs text-slate-400">
                                                    Toggle to grant or revoke specific privileges
                                                </span>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {[
                                                    { key: 'canRecordPayments', label: 'Record Cash & POS Payments', desc: 'Allow accepting payments and issuing official numbered receipts.' },
                                                    { key: 'canPrintReceipts', label: 'Print & Export Receipts', desc: 'Allow printing A4 and thermal POS receipts.' },
                                                    { key: 'canViewInvoices', label: 'View Student Invoices & Balances', desc: 'Allow searching and viewing invoice details and payment histories.' },
                                                    { key: 'canCreateInvoices', label: 'Generate Single & Family Invoices', desc: 'Allow creating new billings and assigning fee schedules.' },
                                                    { key: 'canEditInvoices', label: 'Edit & Modify Invoices', desc: 'Allow adjusting fee items, due dates, or amounts on issued bills.' },
                                                    { key: 'canDeleteInvoices', label: 'Void / Cancel Invoices', desc: 'Allow permanently voiding incorrect or cancelled invoices.' },
                                                    { key: 'canApproveTransfers', label: 'Approve Bank Transfer Verifications', desc: 'Authorize matching bank credit alerts and approving parent transfer uploads.' },
                                                    { key: 'canApplyDiscounts', label: 'Grant Discounts & Scholarships', desc: 'Allow applying fee concessions, bursaries, and sibling discounts.' },
                                                    { key: 'canViewPayroll', label: 'View Staff Salary & Payroll Records', desc: 'Allow viewing staff pay rates, allowances, and deductions.' },
                                                    { key: 'canRunPayroll', label: 'Run Monthly Payroll & Payslips', desc: 'Allow processing payroll disbursements and generating payslips.' },
                                                    { key: 'canViewReports', label: 'View Financial Dashboard & P&L', desc: 'Allow inspecting profit & loss, cash flow statements, and trial balances.' },
                                                    { key: 'canManageSettings', label: 'Modify Finance & Gateway Settings', desc: 'Allow editing payment keys, ledger categories, and term lock.' },
                                                ].map(perm => {
                                                    const rolePerms = rolePermissions[selectedRole] || {};
                                                    const isChecked = rolePerms[perm.key] === true;
                                                    return (
                                                        <div key={perm.key} className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 flex items-start justify-between gap-3">
                                                            <div className="pr-2">
                                                                <p className="font-bold text-xs text-slate-800">{perm.label}</p>
                                                                <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{perm.desc}</p>
                                                            </div>
                                                            <Switch
                                                                checked={isChecked}
                                                                onCheckedChange={v => updateRolePermission(selectedRole, perm.key, v)}
                                                            />
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        )}

                        {/* ─── TAB 5: LEDGER CATEGORIES ─── */}
                        {activeTab === 'categories' && (
                            <div className="space-y-6">
                                <Card className="border-slate-200/80 shadow-xs rounded-2xl">
                                    <CardContent className="p-5 sm:p-6 space-y-6">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                            <div>
                                                <h2 className="text-base font-bold text-slate-900">Ledger Categories</h2>
                                                <p className="text-xs text-slate-500 mt-0.5">Manage income and expense categories for accurate bookkeeping and reports.</p>
                                            </div>

                                            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
                                                {(['ALL', 'INCOME', 'EXPENSE'] as const).map(type => (
                                                    <button
                                                        key={type}
                                                        onClick={() => setCatFilter(type)}
                                                        className={cn(
                                                            "px-3 py-1.5 rounded-lg text-xs font-bold transition",
                                                            catFilter === type ? "bg-white text-[#173F8C] shadow-xs" : "text-slate-600 hover:text-slate-900"
                                                        )}
                                                    >
                                                        {type === 'ALL' ? 'All Categories' : type === 'INCOME' ? 'Income Only' : 'Expenses Only'}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Add Category Form */}
                                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row gap-3 items-center">
                                            <Input
                                                placeholder="Category Name (e.g. Laboratory Maintenance, School Bus Fuel)"
                                                value={newCatName}
                                                onChange={e => setNewCatName(e.target.value)}
                                                className="h-11 rounded-xl bg-white font-medium text-xs sm:text-sm"
                                            />
                                            <select
                                                value={newCatType}
                                                onChange={e => setNewCatType(e.target.value as any)}
                                                className="h-11 px-3 rounded-xl border border-slate-200 bg-white font-bold text-xs sm:text-sm text-slate-800"
                                            >
                                                <option value="INCOME">Income Category</option>
                                                <option value="EXPENSE">Expense Category</option>
                                            </select>
                                            <button
                                                onClick={handleAddCategory}
                                                disabled={catLoading || !newCatName.trim()}
                                                className="h-11 px-5 rounded-xl bg-[#173F8C] hover:bg-[#122F69] text-white font-bold text-xs whitespace-nowrap flex items-center gap-1.5 transition shrink-0"
                                            >
                                                <Plus className="h-4 w-4" /> Add Category
                                            </button>
                                        </div>

                                        {/* Categories List */}
                                        <div className="space-y-2">
                                            {filteredCategories.length === 0 ? (
                                                <div className="py-12 text-center text-slate-400 border border-dashed rounded-xl">
                                                    <Layers className="h-8 w-8 mx-auto text-slate-300 mb-2" />
                                                    <p className="text-xs font-medium">No ledger categories found for this filter.</p>
                                                </div>
                                            ) : (
                                                filteredCategories.map(c => {
                                                    const isEditing = editingCatId === c.id;
                                                    return (
                                                        <div key={c.id} className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 bg-white hover:border-slate-200 transition">
                                                            {isEditing ? (
                                                                <div className="flex items-center gap-2 flex-1 mr-4">
                                                                    <Input
                                                                        value={editCatName}
                                                                        onChange={e => setEditCatName(e.target.value)}
                                                                        className="h-9 text-xs rounded-lg"
                                                                    />
                                                                    <button
                                                                        onClick={() => handleUpdateCategory(c.id)}
                                                                        className="p-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
                                                                    >
                                                                        <Check className="h-4 w-4" />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => setEditingCatId(null)}
                                                                        className="p-2 rounded-lg bg-slate-200 text-slate-700 hover:bg-slate-300"
                                                                    >
                                                                        <CloseIcon className="h-4 w-4" />
                                                                    </button>
                                                                </div>
                                                            ) : (
                                                                <div className="flex items-center gap-3">
                                                                    <span className={cn(
                                                                        "text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider",
                                                                        c.type === 'INCOME' ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                                                                    )}>
                                                                        {c.type}
                                                                    </span>
                                                                    <span className="font-bold text-sm text-slate-800">{c.name}</span>
                                                                </div>
                                                            )}

                                                            <div className="flex items-center gap-1">
                                                                <button
                                                                    onClick={() => { setEditingCatId(c.id); setEditCatName(c.name); }}
                                                                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                                                                >
                                                                    <Edit2 className="h-3.5 w-3.5" />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeleteCategory(c.id)}
                                                                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                                                                >
                                                                    <Trash2 className="h-3.5 w-3.5" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    );
                                                })
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        )}

                        {/* ─── TAB 6: TRANSFER VERIFICATION WORKFLOW GUIDE ─── */}
                        {activeTab === 'transfer-guide' && (
                            <div className="space-y-6">
                                <Card className="border-slate-200/80 shadow-xs rounded-2xl overflow-hidden">
                                    <div className="p-6 bg-gradient-to-r from-violet-900 to-indigo-800 text-white">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="p-2.5 rounded-xl bg-white/10 backdrop-blur-md">
                                                <ArrowRightLeft className="h-6 w-6 text-white" />
                                            </div>
                                            <div>
                                                <h2 className="text-xl font-bold text-white">Direct Bank Transfer Verification Workflow</h2>
                                                <p className="text-xs text-violet-200">How manual parent bank transfers are verified, approved, and settled in Skooly.</p>
                                            </div>
                                        </div>
                                    </div>

                                    <CardContent className="p-6 space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                            {[
                                                { step: '1', title: 'Parent Pays via Transfer', desc: 'Parent performs a direct bank transfer, USSD, or counter deposit to the school bank account, and uploads their payment receipt on the portal.' },
                                                { step: '2', title: 'Verification Queue', desc: 'The submission enters the Transfer Verifications queue in PENDING status with full payment proof details and amount.' },
                                                { step: '3', title: 'Bank Reconciliation', desc: 'Cashier / Bursar matches the sender reference and payment amount against the school bank statement or live credit alert.' },
                                                { step: '4', title: 'Settlement & Receipt', desc: 'Upon Bursar Approval, system automatically offsets the invoice, issues an official FinanceReceipt, and sends SMS/email confirmation.' },
                                            ].map(s => (
                                                <div key={s.step} className="p-4 rounded-xl border border-slate-100 bg-slate-50/60 relative">
                                                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-violet-600 text-white font-extrabold text-xs mb-3 shadow-xs">
                                                        {s.step}
                                                    </span>
                                                    <h3 className="font-bold text-sm text-slate-900 mb-1">{s.title}</h3>
                                                    <p className="text-xs text-slate-500 leading-relaxed">{s.desc}</p>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="p-5 rounded-2xl bg-violet-50/70 border border-violet-200/80 flex flex-col sm:flex-row items-center justify-between gap-4">
                                            <div className="flex items-center gap-3">
                                                <ShieldCheck className="h-6 w-6 text-violet-700 shrink-0" />
                                                <div>
                                                    <h4 className="font-bold text-sm text-violet-950">Live Transfer Verification Queue</h4>
                                                    <p className="text-xs text-violet-700">Review pending student bank transfer proofs, accept settlements, or request clarifications.</p>
                                                </div>
                                            </div>

                                            <Link
                                                to="/dashboard/finance/transfers"
                                                className="h-10 px-5 rounded-xl bg-violet-700 hover:bg-violet-800 text-white font-bold text-xs flex items-center gap-2 transition shadow-xs shrink-0"
                                            >
                                                Open Verification Queue <ArrowRightLeft className="h-3.5 w-3.5" />
                                            </Link>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        )}

                        {/* Save Button */}
                        {activeTab !== 'transfer-guide' && activeTab !== 'categories' && (
                            <div className="pt-4">
                                <SaveButton
                                    onClick={handleSave}
                                    saved={saved}
                                    saving={saving}
                                    saveLabel="Save Financial Settings"
                                    savedLabel="Configuration Saved!"
                                />
                            </div>
                        )}
                    </>
                )}
            </div>
        </SettingsShell>
    );
}
