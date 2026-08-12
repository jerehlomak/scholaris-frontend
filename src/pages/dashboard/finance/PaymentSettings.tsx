import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import {
    Settings, CreditCard, Building2, Plus, Trash2, Loader2,
    CheckCircle2, XCircle, Eye, EyeOff, ChevronRight, Zap,
    Copy, ExternalLink, ShieldCheck, HelpCircle, Check, ArrowRight
} from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Switch } from '../../../components/ui/switch';
import { Card, CardContent } from '../../../components/ui/card';

interface BankAccount {
    id: string; bankName: string; accountName: string; accountNumber: string;
    accountType: string; displayInstructions: string; isDefault: boolean; isActive: boolean;
}

interface PaymentSettingsData {
    activeGateway: string;
    // Flutterwave
    flutterwavePublicKey: string;
    flutterwaveEnv: string;
    flutterwaveEnabled: boolean;
    flwPublicKey?: string;
    flwEnv?: string;
    flwEnabled?: boolean;
    hasFlwSecret?: boolean;
    hasFlwWebhookSecret?: boolean;
    // Paystack
    paystackPublicKey: string;
    paystackEnv: string;
    paystackEnabled: boolean;
    hasPaystackSecret?: boolean;
    hasPaystackWebhookSecret?: boolean;
    // Monnify
    monnifyApiKey: string;
    monnifyContractCode: string;
    monnifyBaseUrl: string;
    monnifyEnabled: boolean;
    hasMonnifySecret?: boolean;
    hasMonnifyWebhookSecret?: boolean;
    // General
    merchantDisplayName: string;
    bankTransferEnabled: boolean;
    transferEvidenceRequired: boolean;
    allowPartialPayment: boolean;
    allowOverpayment: boolean;
    autoApplyWallet: boolean;
    allowWalletCheckout: boolean;
    allowFamilyWalletSharing: boolean;
    [key: string]: any;
}

const defaultSettings: PaymentSettingsData = {
    activeGateway: 'FLUTTERWAVE',
    flutterwavePublicKey: '',
    flutterwaveEnv: 'TEST',
    flutterwaveEnabled: true,
    paystackPublicKey: '',
    paystackEnv: 'TEST',
    paystackEnabled: false,
    monnifyApiKey: '',
    monnifyContractCode: '',
    monnifyBaseUrl: 'https://sandbox.monnify.com',
    monnifyEnabled: false,
    merchantDisplayName: '',
    bankTransferEnabled: true,
    transferEvidenceRequired: true,
    allowPartialPayment: true,
    allowOverpayment: false,
    autoApplyWallet: false,
    allowWalletCheckout: true,
    allowFamilyWalletSharing: true
};

export default function PaymentSettings() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState<PaymentSettingsData>(defaultSettings);
    const [activeTab, setActiveTab] = useState<'gateways' | 'accounts' | 'rules'>('gateways');

    // Sensitive keys (only sent if changed)
    const [flwSecret, setFlwSecret] = useState('');
    const [flwEncryptionKey, setFlwEncryptionKey] = useState('');
    const [flwWebhookSecret, setFlwWebhookSecret] = useState('');
    const [showFlwSecret, setShowFlwSecret] = useState(false);

    const [paystackSecret, setPaystackSecret] = useState('');
    const [paystackWebhookSecret, setPaystackWebhookSecret] = useState('');
    const [showPaystackSecret, setShowPaystackSecret] = useState(false);

    const [monnifySecret, setMonnifySecret] = useState('');
    const [monnifyWebhookSecret, setMonnifyWebhookSecret] = useState('');
    const [showMonnifySecret, setShowMonnifySecret] = useState(false);

    // Testing state
    const [testingGateway, setTestingGateway] = useState<string | null>(null);
    const [testResults, setTestResults] = useState<{ [key: string]: { success: boolean; message: string } }>({});

    // Bank accounts
    const [accounts, setAccounts] = useState<BankAccount[]>([]);
    const [addingAccount, setAddingAccount] = useState(false);
    const [newAccount, setNewAccount] = useState({
        bankName: '',
        accountName: '',
        accountNumber: '',
        accountType: 'SAVINGS',
        displayInstructions: '',
        isDefault: false
    });

    const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

    const copyToClipboard = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopiedUrl(id);
        toast.success('Copied to clipboard');
        setTimeout(() => setCopiedUrl(null), 2000);
    };

    useEffect(() => {
        Promise.all([
            axios.get('/api/v1/finance-v2/payment-settings', { withCredentials: true }),
            axios.get('/api/v1/finance-v2/bank-accounts', { withCredentials: true })
        ]).then(([psRes, baRes]) => {
            if (psRes.data.settings) {
                const s = psRes.data.settings;
                setSettings(prev => ({
                    ...prev,
                    ...s,
                    flutterwavePublicKey: s.flutterwavePublicKey || s.flwPublicKey || '',
                    flutterwaveEnv: s.flutterwaveMode || s.flwEnv || 'TEST',
                    flutterwaveEnabled: s.flutterwaveEnabled !== undefined ? s.flutterwaveEnabled : (s.flwEnabled !== undefined ? s.flwEnabled : true),
                    activeGateway: s.activeGateway || 'FLUTTERWAVE'
                }));
            }
            setAccounts(baRes.data.accounts || []);
        }).catch(() => toast.error('Failed to load payment settings'))
        .finally(() => setLoading(false));
    }, []);

    const handleSaveSettings = async () => {
        setSaving(true);
        try {
            const payload: any = {
                ...settings,
                flwPublicKey: settings.flutterwavePublicKey || settings.flwPublicKey,
                flutterwavePublicKey: settings.flutterwavePublicKey || settings.flwPublicKey,
                flutterwaveMode: settings.flutterwaveEnv || settings.flwEnv,
                flwEnv: settings.flutterwaveEnv || settings.flwEnv,
                flutterwaveEnabled: settings.flutterwaveEnabled,
                flwEnabled: settings.flutterwaveEnabled,
                ...(flwSecret && { flutterwaveSecretKey: flwSecret, flwSecret }),
                ...(flwEncryptionKey && { flutterwaveEncryptionKey: flwEncryptionKey, flwEncryptionKey }),
                ...(flwWebhookSecret && { flwWebhookSecret, flutterwaveWebhookSecret: flwWebhookSecret }),
                ...(paystackSecret && { paystackSecret, paystackSecretKey: paystackSecret }),
                ...(paystackWebhookSecret && { paystackWebhookSecret }),
                ...(monnifySecret && { monnifySecretKey: monnifySecret, monnifySecret }),
                ...(monnifyWebhookSecret && { monnifyWebhookSecret })
            };

            await axios.put('/api/v1/finance-v2/payment-settings', payload, { withCredentials: true });
            toast.success('Payment settings saved successfully');

            // Refetch fresh settings state
            const psRes = await axios.get('/api/v1/finance-v2/payment-settings', { withCredentials: true });
            if (psRes.data.settings) {
                const s = psRes.data.settings;
                setSettings(prev => ({
                    ...prev,
                    ...s,
                    flutterwavePublicKey: s.flutterwavePublicKey || s.flwPublicKey || '',
                    flutterwaveEnv: s.flutterwaveMode || s.flwEnv || 'TEST',
                    flutterwaveEnabled: s.flutterwaveEnabled !== undefined ? s.flutterwaveEnabled : (s.flwEnabled !== undefined ? s.flwEnabled : true)
                }));
            }

            setFlwSecret('');
            setFlwEncryptionKey('');
            setFlwWebhookSecret('');
            setPaystackSecret('');
            setPaystackWebhookSecret('');
            setMonnifySecret('');
            setMonnifyWebhookSecret('');
        } catch (e: any) {
            toast.error(e.response?.data?.msg || 'Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    const handleTestGateway = async (gateway: 'FLUTTERWAVE' | 'PAYSTACK' | 'MONNIFY') => {
        setTestingGateway(gateway);
        try {
            const credentials: any = {};
            if (gateway === 'FLUTTERWAVE') {
                credentials.publicKey = settings.flutterwavePublicKey;
                credentials.secretKey = flwSecret;
            } else if (gateway === 'PAYSTACK') {
                credentials.publicKey = settings.paystackPublicKey;
                credentials.secretKey = paystackSecret;
            } else if (gateway === 'MONNIFY') {
                credentials.apiKey = settings.monnifyApiKey;
                credentials.secretKey = monnifySecret;
                credentials.contractCode = settings.monnifyContractCode;
                credentials.baseUrl = settings.monnifyBaseUrl;
            }

            const { data } = await axios.post('/api/v1/finance-v2/payment-settings/test-connection', {
                gateway,
                credentials
            }, { withCredentials: true });

            setTestResults(prev => ({
                ...prev,
                [gateway]: { success: true, message: data.message || 'Connected successfully!' }
            }));
            toast.success(`${gateway} connection verified!`);
        } catch (err: any) {
            const msg = err.response?.data?.message || err.response?.data?.msg || 'Connection failed';
            setTestResults(prev => ({
                ...prev,
                [gateway]: { success: false, message: msg }
            }));
            toast.error(`${gateway} test failed: ${msg}`);
        } finally {
            setTestingGateway(null);
        }
    };

    const handleAddAccount = async () => {
        try {
            const { data } = await axios.post('/api/v1/finance-v2/bank-accounts', newAccount, { withCredentials: true });
            setAccounts(prev => [...prev, data.account]);
            setNewAccount({
                bankName: '',
                accountName: '',
                accountNumber: '',
                accountType: 'SAVINGS',
                displayInstructions: '',
                isDefault: false
            });
            setAddingAccount(false);
            toast.success('Bank account added');
        } catch (e: any) {
            toast.error(e.response?.data?.msg || 'Failed to add account');
        }
    };

    const handleDeleteAccount = async (id: string) => {
        try {
            await axios.delete(`/api/v1/finance-v2/bank-accounts/${id}`, { withCredentials: true });
            setAccounts(prev => prev.filter(a => a.id !== id));
            toast.success('Account removed');
        } catch {
            toast.error('Failed to remove account');
        }
    };

    const currentOrigin = typeof window !== 'undefined' ? window.location.origin : (import.meta.env.VITE_API_BASE_URL || '');

    if (loading) return (
        <div className="fd-root min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-indigo-50/30 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
    );

    return (
        <>
            <style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap'); .fd-root,.fd-root *{font-family:'Plus Jakarta Sans',sans-serif!important} .fd-root .mono{font-family:'DM Mono',monospace!important}`}</style>
            <div className="fd-root min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-indigo-50/30 px-4 pb-20 pt-8 sm:px-6 lg:px-8">
                <div className="pointer-events-none fixed inset-0 opacity-[0.22]" style={{ backgroundImage: 'radial-gradient(circle,#94a3b8 1px,transparent 1px)', backgroundSize: '28px 28px' }} />
                <div className="relative z-10 mx-auto max-w-6xl space-y-6">

                    {/* Breadcrumb */}
                    <div className="flex items-center gap-1.5">
                        <span className="mono text-[10px] font-bold uppercase tracking-widest text-slate-500">Finance</span>
                        <ChevronRight className="h-3 w-3 text-slate-400" />
                        <span className="mono text-[10px] font-bold uppercase tracking-widest text-blue-600">Payment Settings (Phase 13)</span>
                    </div>

                    {/* Header */}
                    <div className="flex flex-col md:flex-row items-start justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-700 to-indigo-600 shadow-lg shadow-indigo-200">
                                <Settings className="h-7 w-7 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Payment Gateway & Collections</h1>
                                <p className="mt-0.5 text-sm text-slate-500">Configure Flutterwave, Paystack, Monnify, bank transfers, and automated settlement rules.</p>
                            </div>
                        </div>
                        <button
                            onClick={handleSaveSettings}
                            disabled={saving}
                            className="flex items-center gap-2 rounded-xl bg-blue-700 px-6 py-2.5 text-sm font-bold text-white shadow-md shadow-blue-200 transition-all hover:bg-blue-800 hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-60"
                        >
                            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                            Save All Settings
                        </button>
                    </div>

                    {/* Navigation Tabs */}
                    <div className="flex gap-2 border-b border-slate-200 pb-2 overflow-x-auto hide-scrollbar">
                        <button
                            onClick={() => setActiveTab('gateways')}
                            className={`flex shrink-0 items-center gap-2 whitespace-nowrap px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
                                activeTab === 'gateways'
                                    ? 'bg-blue-600 text-white shadow-sm'
                                    : 'text-slate-600 hover:bg-slate-100'
                            }`}
                        >
                            <CreditCard className="h-4 w-4" />
                            Payment Gateways (Flutterwave, Paystack, Monnify)
                        </button>
                        <button
                            onClick={() => setActiveTab('accounts')}
                            className={`flex shrink-0 items-center gap-2 whitespace-nowrap px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
                                activeTab === 'accounts'
                                    ? 'bg-blue-600 text-white shadow-sm'
                                    : 'text-slate-600 hover:bg-slate-100'
                            }`}
                        >
                            <Building2 className="h-4 w-4" />
                            School Bank Accounts ({accounts.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('rules')}
                            className={`flex shrink-0 items-center gap-2 whitespace-nowrap px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
                                activeTab === 'rules'
                                    ? 'bg-blue-600 text-white shadow-sm'
                                    : 'text-slate-600 hover:bg-slate-100'
                            }`}
                        >
                            <Zap className="h-4 w-4" />
                            Payment & Wallet Rules
                        </button>
                    </div>

                    {activeTab === 'gateways' && (
                        <div className="space-y-6">
                            {/* Active Gateway Selection */}
                            <Card className="border-blue-100 bg-gradient-to-r from-blue-50/50 via-indigo-50/30 to-slate-50 shadow-sm">
                                <CardContent className="p-6">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                        <div>
                                            <h3 className="text-base font-bold text-slate-900">Primary Active Payment Gateway</h3>
                                            <p className="text-xs text-slate-500 mt-0.5">
                                                Select which online gateway parents and students will default to when paying school fees and funding wallets.
                                            </p>
                                        </div>
                                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                                            {[
                                                { id: 'FLUTTERWAVE', label: 'Flutterwave', tag: 'Recommended', color: 'orange' },
                                                { id: 'PAYSTACK', label: 'Paystack', tag: 'Fast', color: 'teal' },
                                                { id: 'MONNIFY', label: 'Monnify', tag: 'Low Fee', color: 'blue' },
                                            ].map(gw => {
                                                const isSelected = settings.activeGateway === gw.id;
                                                return (
                                                    <button
                                                        key={gw.id}
                                                        type="button"
                                                        onClick={() => setSettings(s => ({ ...s, activeGateway: gw.id }))}
                                                        className={`relative flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all ${
                                                            isSelected
                                                                ? 'border-blue-600 bg-white ring-2 ring-blue-500/20 shadow-md'
                                                                : 'border-slate-200 bg-white/70 hover:bg-white'
                                                        }`}
                                                    >
                                                        <span className="text-xs font-extrabold text-slate-800">{gw.label}</span>
                                                        <span className="text-[10px] font-medium text-slate-400 mt-0.5">{gw.tag}</span>
                                                        {isSelected && (
                                                            <div className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-blue-600 flex items-center justify-center text-white shadow">
                                                                <Check className="h-3 w-3" />
                                                            </div>
                                                        )}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Merchant Display Name */}
                            <Card className="border-slate-200 shadow-sm">
                                <CardContent className="p-6">
                                    <div className="space-y-2">
                                        <Label className="text-sm font-bold text-slate-800">Merchant Brand Name (shown on payment checkouts)</Label>
                                        <Input
                                            placeholder="e.g. Greenfield Academy / Premier College"
                                            value={settings.merchantDisplayName}
                                            onChange={e => setSettings(s => ({ ...s, merchantDisplayName: e.target.value }))}
                                            className="max-w-md"
                                        />
                                        <p className="text-xs text-slate-500">This appears as the company/organization name on Flutterwave and Paystack checkout pages.</p>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* ─── FLUTTERWAVE CONFIG ────────────────────────────────────────── */}
                            <Card className="border-slate-200 shadow-sm overflow-hidden">
                                <div className="flex items-center justify-between bg-gradient-to-r from-amber-500/10 to-orange-500/10 px-6 py-4 border-b border-slate-100">
                                    <div className="flex items-center gap-3">
                                        <div className="h-9 w-9 rounded-xl bg-amber-500 text-white flex items-center justify-center font-black text-sm shadow">
                                            FLW
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h2 className="font-bold text-slate-900">Flutterwave</h2>
                                                <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                                                    Active Gateway
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-500">Cards, USSD, Bank Transfer, Apple Pay, Google Pay</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-xs font-medium text-slate-600">Enable</span>
                                        <Switch
                                            checked={settings.flutterwaveEnabled}
                                            onCheckedChange={v => setSettings(s => ({ ...s, flutterwaveEnabled: v }))}
                                        />
                                    </div>
                                </div>
                                <CardContent className="p-6 space-y-4">
                                    <div className="grid sm:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Public Key</Label>
                                            <Input
                                                placeholder="FLWPUBK_TEST-xxxx or FLWPUBK-xxxx"
                                                value={settings.flutterwavePublicKey}
                                                onChange={e => setSettings(s => ({ ...s, flutterwavePublicKey: e.target.value }))}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Environment Mode</Label>
                                            <select
                                                className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                                value={settings.flutterwaveEnv}
                                                onChange={e => setSettings(s => ({ ...s, flutterwaveEnv: e.target.value }))}
                                            >
                                                <option value="TEST">Sandbox / Test Mode</option>
                                                <option value="LIVE">Production / Live Mode</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <Label>Secret Key</Label>
                                                {settings.hasFlwSecret ? (
                                                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                                                        ✓ Stored & Encrypted
                                                    </span>
                                                ) : (
                                                    <span className="text-[10px] text-amber-600 font-medium">Not saved yet</span>
                                                )}
                                            </div>
                                            <div className="relative">
                                                <Input
                                                    type={showFlwSecret ? 'text' : 'password'}
                                                    placeholder={settings.hasFlwSecret ? "•••••••••••••••• (Leave blank to keep existing)" : "Paste Client Secret here"}
                                                    value={flwSecret}
                                                    onChange={e => setFlwSecret(e.target.value)}
                                                    className="pr-10"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowFlwSecret(!showFlwSecret)}
                                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                                >
                                                    {showFlwSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                </button>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Encryption Key <span className="text-xs text-slate-400">(Optional)</span></Label>
                                            <Input
                                                type="password"
                                                placeholder="FLWSECK_xxx-encryption"
                                                value={flwEncryptionKey}
                                                onChange={e => setFlwEncryptionKey(e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-2 sm:col-span-2">
                                            <Label>Webhook Secret Hash <span className="text-xs text-slate-400">(Verif-Hash header from Flutterwave Dashboard)</span></Label>
                                            <Input
                                                type="password"
                                                placeholder="Custom secret hash set in Flutterwave webhook dashboard"
                                                value={flwWebhookSecret}
                                                onChange={e => setFlwWebhookSecret(e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    {/* Webhook details & tester */}
                                    <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 space-y-3">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                            <div>
                                                <p className="text-xs font-bold text-amber-900">Flutterwave Webhook URL</p>
                                                <p className="mono text-[11px] text-amber-700 break-all">{currentOrigin}/api/v1/webhooks/flutterwave</p>
                                            </div>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => copyToClipboard(`${currentOrigin}/api/v1/webhooks/flutterwave`, 'flw-wh')}
                                                className="border-amber-300 text-amber-800 hover:bg-amber-100 text-xs shrink-0"
                                            >
                                                {copiedUrl === 'flw-wh' ? <Check className="h-3.5 w-3.5 mr-1" /> : <Copy className="h-3.5 w-3.5 mr-1" />}
                                                Copy Webhook URL
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between pt-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => handleTestGateway('FLUTTERWAVE')}
                                            disabled={testingGateway === 'FLUTTERWAVE'}
                                            className="text-xs font-bold text-amber-800 border-amber-300 hover:bg-amber-50"
                                        >
                                            {testingGateway === 'FLUTTERWAVE' ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Zap className="h-3.5 w-3.5 mr-1" />}
                                            Test Flutterwave Connection
                                        </Button>
                                        {testResults['FLUTTERWAVE'] && (
                                            <span className={`text-xs font-medium flex items-center gap-1 ${testResults['FLUTTERWAVE'].success ? 'text-emerald-600' : 'text-red-600'}`}>
                                                {testResults['FLUTTERWAVE'].success ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                                                {testResults['FLUTTERWAVE'].message}
                                            </span>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* ─── PAYSTACK CONFIG ────────────────────────────────────────── */}
                            <Card className="border-slate-200 shadow-sm overflow-hidden">
                                <div className="flex items-center justify-between bg-gradient-to-r from-teal-500/10 to-emerald-500/10 px-6 py-4 border-b border-slate-100">
                                    <div className="flex items-center gap-3">
                                        <div className="h-9 w-9 rounded-xl bg-teal-600 text-white flex items-center justify-center font-black text-sm shadow">
                                            PSK
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h2 className="font-bold text-slate-900">Paystack</h2>
                                                <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 border border-teal-200">
                                                    Popular in NG/GH
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-500">Cards, USSD, Bank Account Debit, QR, Mobile Money</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-xs font-medium text-slate-600">Enable</span>
                                        <Switch
                                            checked={settings.paystackEnabled}
                                            onCheckedChange={v => setSettings(s => ({ ...s, paystackEnabled: v }))}
                                        />
                                    </div>
                                </div>
                                <CardContent className="p-6 space-y-4">
                                    <div className="grid sm:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Public Key</Label>
                                            <Input
                                                placeholder="pk_test_xxxx or pk_live_xxxx"
                                                value={settings.paystackPublicKey}
                                                onChange={e => setSettings(s => ({ ...s, paystackPublicKey: e.target.value }))}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Environment Mode</Label>
                                            <select
                                                className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                                value={settings.paystackEnv}
                                                onChange={e => setSettings(s => ({ ...s, paystackEnv: e.target.value }))}
                                            >
                                                <option value="TEST">Test Mode</option>
                                                <option value="LIVE">Live Mode</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <Label>Secret Key</Label>
                                                {settings.hasPaystackSecret ? (
                                                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                                                        ✓ Stored & Encrypted
                                                    </span>
                                                ) : (
                                                    <span className="text-[10px] text-amber-600 font-medium">Not saved yet</span>
                                                )}
                                            </div>
                                            <div className="relative">
                                                <Input
                                                    type={showPaystackSecret ? 'text' : 'password'}
                                                    placeholder={settings.hasPaystackSecret ? "•••••••••••••••• (Leave blank to keep existing)" : "sk_test_xxxx or sk_live_xxxx"}
                                                    value={paystackSecret}
                                                    onChange={e => setPaystackSecret(e.target.value)}
                                                    className="pr-10"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPaystackSecret(!showPaystackSecret)}
                                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                                >
                                                    {showPaystackSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                </button>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Webhook Secret</Label>
                                            <Input
                                                type="password"
                                                placeholder="Paystack Webhook secret"
                                                value={paystackWebhookSecret}
                                                onChange={e => setPaystackWebhookSecret(e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    {/* Webhook details & tester */}
                                    <div className="rounded-xl border border-teal-200 bg-teal-50/50 p-4 space-y-3">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                            <div>
                                                <p className="text-xs font-bold text-teal-900">Paystack Webhook URL</p>
                                                <p className="mono text-[11px] text-teal-700 break-all">{currentOrigin}/api/v1/webhooks/paystack</p>
                                            </div>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => copyToClipboard(`${currentOrigin}/api/v1/webhooks/paystack`, 'psk-wh')}
                                                className="border-teal-300 text-teal-800 hover:bg-teal-100 text-xs shrink-0"
                                            >
                                                {copiedUrl === 'psk-wh' ? <Check className="h-3.5 w-3.5 mr-1" /> : <Copy className="h-3.5 w-3.5 mr-1" />}
                                                Copy Webhook URL
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between pt-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => handleTestGateway('PAYSTACK')}
                                            disabled={testingGateway === 'PAYSTACK'}
                                            className="text-xs font-bold text-teal-800 border-teal-300 hover:bg-teal-50"
                                        >
                                            {testingGateway === 'PAYSTACK' ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Zap className="h-3.5 w-3.5 mr-1" />}
                                            Test Paystack Connection
                                        </Button>
                                        {testResults['PAYSTACK'] && (
                                            <span className={`text-xs font-medium flex items-center gap-1 ${testResults['PAYSTACK'].success ? 'text-emerald-600' : 'text-red-600'}`}>
                                                {testResults['PAYSTACK'].success ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                                                {testResults['PAYSTACK'].message}
                                            </span>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* ─── MONNIFY CONFIG ────────────────────────────────────────── */}
                            <Card className="border-slate-200 shadow-sm overflow-hidden">
                                <div className="flex items-center justify-between bg-gradient-to-r from-blue-600/10 to-indigo-600/10 px-6 py-4 border-b border-slate-100">
                                    <div className="flex items-center gap-3">
                                        <div className="h-9 w-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-sm shadow">
                                            MNF
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h2 className="font-bold text-slate-900">Monnify</h2>
                                                <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                                                    Dedicated Virtual Accounts
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-500">Virtual Bank Accounts, Direct Account Transfers, Cards</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-xs font-medium text-slate-600">Enable</span>
                                        <Switch
                                            checked={settings.monnifyEnabled}
                                            onCheckedChange={v => setSettings(s => ({ ...s, monnifyEnabled: v }))}
                                        />
                                    </div>
                                </div>
                                <CardContent className="p-6 space-y-4">
                                    <div className="grid sm:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>API Key</Label>
                                            <Input
                                                placeholder="MK_TEST_xxxx or MK_PROD_xxxx"
                                                value={settings.monnifyApiKey}
                                                onChange={e => setSettings(s => ({ ...s, monnifyApiKey: e.target.value }))}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Contract Code</Label>
                                            <Input
                                                placeholder="e.g. 1234567890"
                                                value={settings.monnifyContractCode}
                                                onChange={e => setSettings(s => ({ ...s, monnifyContractCode: e.target.value }))}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <Label>Secret Key</Label>
                                                {settings.hasMonnifySecret ? (
                                                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                                                        ✓ Stored & Encrypted
                                                    </span>
                                                ) : (
                                                    <span className="text-[10px] text-amber-600 font-medium">Not saved yet</span>
                                                )}
                                            </div>
                                            <div className="relative">
                                                <Input
                                                    type={showMonnifySecret ? 'text' : 'password'}
                                                    placeholder={settings.hasMonnifySecret ? "•••••••••••••••• (Leave blank to keep existing)" : "Monnify Secret Key"}
                                                    value={monnifySecret}
                                                    onChange={e => setMonnifySecret(e.target.value)}
                                                    className="pr-10"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowMonnifySecret(!showMonnifySecret)}
                                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                                >
                                                    {showMonnifySecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                </button>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Base URL / Environment</Label>
                                            <select
                                                className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                                value={settings.monnifyBaseUrl}
                                                onChange={e => setSettings(s => ({ ...s, monnifyBaseUrl: e.target.value }))}
                                            >
                                                <option value="https://sandbox.monnify.com">Sandbox Mode (https://sandbox.monnify.com)</option>
                                                <option value="https://api.monnify.com">Production Mode (https://api.monnify.com)</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* Webhook details & tester */}
                                    <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4 space-y-3">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                            <div>
                                                <p className="text-xs font-bold text-blue-900">Monnify Webhook URL</p>
                                                <p className="mono text-[11px] text-blue-700 break-all">{currentOrigin}/api/v1/webhooks/monnify</p>
                                            </div>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => copyToClipboard(`${currentOrigin}/api/v1/webhooks/monnify`, 'mnf-wh')}
                                                className="border-blue-300 text-blue-800 hover:bg-blue-100 text-xs shrink-0"
                                            >
                                                {copiedUrl === 'mnf-wh' ? <Check className="h-3.5 w-3.5 mr-1" /> : <Copy className="h-3.5 w-3.5 mr-1" />}
                                                Copy Webhook URL
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between pt-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => handleTestGateway('MONNIFY')}
                                            disabled={testingGateway === 'MONNIFY'}
                                            className="text-xs font-bold text-blue-800 border-blue-300 hover:bg-blue-50"
                                        >
                                            {testingGateway === 'MONNIFY' ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Zap className="h-3.5 w-3.5 mr-1" />}
                                            Test Monnify Connection
                                        </Button>
                                        {testResults['MONNIFY'] && (
                                            <span className={`text-xs font-medium flex items-center gap-1 ${testResults['MONNIFY'].success ? 'text-emerald-600' : 'text-red-600'}`}>
                                                {testResults['MONNIFY'].success ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                                                {testResults['MONNIFY'].message}
                                            </span>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {activeTab === 'accounts' && (
                        <Card className="border-slate-200 shadow-sm">
                            <div className="flex items-center gap-3 bg-slate-50/50 px-6 py-4 border-b border-slate-100">
                                <Building2 className="h-5 w-5 text-slate-600" />
                                <div>
                                    <h2 className="font-semibold text-slate-900">School Bank Accounts for Direct Transfers</h2>
                                    <p className="text-xs text-slate-500">Accounts shown to parents when choosing manual bank transfer payment method.</p>
                                </div>
                                <Button variant="outline" size="sm" className="ml-auto" onClick={() => setAddingAccount(true)}>
                                    <Plus className="mr-1 h-3.5 w-3.5" /> Add Bank Account
                                </Button>
                            </div>
                            <CardContent className="p-0">
                                {accounts.length === 0 ? (
                                    <div className="p-12 text-center text-sm text-slate-400">
                                        No bank accounts configured yet. Click "Add Bank Account" to create your first one.
                                    </div>
                                ) : accounts.map(acc => (
                                    <div key={acc.id} className="flex items-center justify-between p-4 sm:px-6 border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors">
                                        <div>
                                            <p className="font-bold text-slate-900">{acc.bankName} – <span className="mono">{acc.accountNumber}</span></p>
                                            <p className="text-xs text-slate-600">{acc.accountName}</p>
                                            {acc.displayInstructions && (
                                                <p className="text-[11px] text-slate-400 mt-1 italic">{acc.displayInstructions}</p>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {acc.isDefault && <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">Default</span>}
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => handleDeleteAccount(acc.id)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}

                                {addingAccount && (
                                    <div className="p-6 border-t border-slate-100 space-y-4 bg-slate-50/80">
                                        <h3 className="font-bold text-slate-900 text-sm">Add New School Bank Account</h3>
                                        <div className="grid sm:grid-cols-3 gap-3">
                                            <div>
                                                <Label className="text-xs">Bank Name</Label>
                                                <Input placeholder="e.g. Zenith Bank, GTBank, Access" value={newAccount.bankName} onChange={e => setNewAccount(s => ({ ...s, bankName: e.target.value }))} />
                                            </div>
                                            <div>
                                                <Label className="text-xs">Account Name</Label>
                                                <Input placeholder="e.g. Greenfield Academy Main" value={newAccount.accountName} onChange={e => setNewAccount(s => ({ ...s, accountName: e.target.value }))} />
                                            </div>
                                            <div>
                                                <Label className="text-xs">Account Number (10 digits)</Label>
                                                <Input placeholder="e.g. 0123456789" value={newAccount.accountNumber} onChange={e => setNewAccount(s => ({ ...s, accountNumber: e.target.value }))} />
                                            </div>
                                        </div>
                                        <div>
                                            <Label className="text-xs">Payment Instructions for Parents</Label>
                                            <textarea
                                                className="w-full h-20 rounded-md border border-input bg-background px-3 py-2 text-xs resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                placeholder="Specify narration guidelines (e.g. 'Use Student Full Name as transfer remark') and proof upload instructions."
                                                value={newAccount.displayInstructions}
                                                onChange={e => setNewAccount(s => ({ ...s, displayInstructions: e.target.value }))}
                                            />
                                        </div>
                                        <div className="flex gap-2">
                                            <Button onClick={handleAddAccount} className="bg-blue-600 hover:bg-blue-700 text-xs">Save Account</Button>
                                            <Button variant="outline" onClick={() => setAddingAccount(false)} className="text-xs">Cancel</Button>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {activeTab === 'rules' && (
                        <Card className="border-slate-200 shadow-sm">
                            <div className="flex items-center gap-3 bg-slate-50/50 px-6 py-4 border-b border-slate-100">
                                <Zap className="h-5 w-5 text-indigo-600" />
                                <div>
                                    <h2 className="font-semibold text-slate-900">Collection & Automated Settlement Rules</h2>
                                    <p className="text-xs text-slate-500">Configure how partial payments, excess funds, and student wallets are treated.</p>
                                </div>
                            </div>
                            <CardContent className="p-6">
                                <div className="divide-y divide-slate-100">
                                    {[
                                        { key: 'bankTransferEnabled', label: 'Enable Direct Bank Transfer Submissions', description: 'Allow parents and students to upload proof of bank transfer on the portal.' },
                                        { key: 'transferEvidenceRequired', label: 'Mandatory Transfer Evidence Upload', description: 'Require payment receipt or screenshot upload before transfer is queued for admin review.' },
                                        { key: 'allowPartialPayment', label: 'Allow Partial Invoice Payments', description: 'Allow parents to pay in installments towards an outstanding invoice balance.' },
                                        { key: 'allowOverpayment', label: 'Allow Overpayment & Auto-Credit to Wallet', description: 'If a parent pays more than the invoice balance, automatically deposit the excess into the student wallet.' },
                                        { key: 'autoApplyWallet', label: 'Auto-Apply Wallet to Invoices (Option A)', description: 'Automatically deduct student wallet credit when new invoices are generated.' },
                                        { key: 'allowWalletCheckout', label: 'Parent Wallet Checkout (Option B)', description: 'Allow parents to select and spend available student wallet funds when clearing invoices.' },
                                        { key: 'allowFamilyWalletSharing', label: 'Cross-Student Sibling Sharing (Option C)', description: 'Allow parents with multiple enrolled children to allocate wallet funds across siblings.' },
                                    ].map(({ key, label, description }) => (
                                        <div key={key} className="flex items-center justify-between py-4">
                                            <div className="pr-4">
                                                <p className="text-sm font-semibold text-slate-900">{label}</p>
                                                <p className="text-xs text-slate-500 mt-0.5">{description}</p>
                                            </div>
                                            <Switch
                                                checked={!!settings[key as keyof PaymentSettingsData]}
                                                onCheckedChange={v => setSettings(s => ({ ...s, [key]: v }))}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    <div className="flex justify-end">
                        <Button onClick={handleSaveSettings} disabled={saving} className="bg-blue-700 hover:bg-blue-800 shadow-md shadow-blue-200">
                            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save All Payment Settings
                        </Button>
                    </div>

                </div>
            </div>
        </>
    );
}
