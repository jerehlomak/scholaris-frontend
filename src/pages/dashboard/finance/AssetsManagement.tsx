import { useState, useEffect, useMemo } from 'react';
import {
    Plus, Search, Filter, RefreshCw, Download, FileSpreadsheet,
    FileText, CheckCircle2, AlertTriangle, AlertCircle, Trash2,
    Edit3, Eye, ShieldCheck, Wrench, Building2,
    Calendar, User, Tag, Sparkles, Layers,
    TrendingDown, Archive, ChevronRight, Check, X,
    SlidersHorizontal, ArrowUpDown, ChevronDown
} from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Label } from '../../../components/ui/label';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { cn } from '../../../lib/utils';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

// ─── TYPES & INTERFACES ──────────────────────────────────────────────────────

type AssetCondition = 'GOOD' | 'FAIR' | 'NEEDS_REPAIR' | 'DAMAGED' | 'MISSING' | 'DISPOSED';

interface SchoolAsset {
    id: string;
    assetTag: string;
    name: string;
    category: string;
    location: string;
    quantity: number;
    purchaseDate: string | null;
    purchaseCost: number;
    salvageValue: number;
    usefulLifeYears: number;
    depreciationRate: number;
    currentValue: number;
    condition: AssetCondition;
    assignedStaffId?: string | null;
    assignedStaffName?: string | null;
    serialNumber?: string | null;
    vendor?: string | null;
    warrantyExpiry?: string | null;
    notes?: string | null;
    lastAuditedAt?: string | null;
    lastAuditStatus?: string | null;
    createdAt: string;
}

interface AuditRecord {
    id: string;
    assetId: string;
    auditDate: string;
    auditorName: string;
    expectedQuantity: number;
    actualQuantity: number;
    discrepancy: number;
    condition: AssetCondition;
    location: string;
    status: 'VERIFIED' | 'DISCREPANCY' | 'FLAGGED';
    notes?: string | null;
    asset?: {
        name: string;
        assetTag: string;
        category: string;
        location: string;
    };
}

interface ValuationSummary {
    totalItemsCount: number;
    totalAssetQuantity: number;
    totalAcquisitionCost: number;
    totalCurrentValue: number;
    totalDepreciation: number;
    totalSalvageValue: number;
    needingRepairCount: number;
    damagedOrMissingCount: number;
    flaggedAuditsCount: number;
    categoryBreakdown: Record<string, { count: number; acquisitionCost: number; currentValue: number }>;
    conditionBreakdown: Record<AssetCondition, number>;
}

const CATEGORIES = [
    'Furniture & Fixtures',
    'IT & Electronics',
    'Vehicles & Transport',
    'Laboratory & Science',
    'Books & Library',
    'Facilities & Machinery',
    'Sports & Recreation',
    'Musical Instruments',
    'Security & Safety',
    'Other'
];

const CONDITIONS: { label: string; value: AssetCondition; color: string; bg: string; border: string }[] = [
    { label: 'Good (Functional)', value: 'GOOD', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
    { label: 'Fair (Minor Wear)', value: 'FAIR', color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200' },
    { label: 'Needs Repair', value: 'NEEDS_REPAIR', color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200' },
    { label: 'Damaged (Unusable)', value: 'DAMAGED', color: 'text-rose-700', bg: 'bg-rose-50', border: 'border-rose-200' },
    { label: 'Missing / Lost', value: 'MISSING', color: 'text-purple-700', bg: 'bg-purple-50', border: 'border-purple-200' },
    { label: 'Disposed / Scrapped', value: 'DISPOSED', color: 'text-slate-700', bg: 'bg-slate-100', border: 'border-slate-300' },
];

function fmt(n: number) {
    return '₦' + (n || 0).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtCompact(n: number) {
    if (n >= 1_000_000) return '₦' + (n / 1_000_000).toFixed(1) + 'M';
    if (n >= 1_000) return '₦' + (n / 1_000).toFixed(1) + 'k';
    return '₦' + (n || 0).toLocaleString('en-NG');
}

const inputCls = 'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-800 shadow-sm transition-all outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 placeholder:text-slate-400';

export default function AssetsManagement() {
    const [activeTab, setActiveTab] = useState<'register' | 'audit' | 'valuation'>('register');
    const [assets, setAssets] = useState<SchoolAsset[]>([]);
    const [summary, setSummary] = useState<ValuationSummary | null>(null);
    const [auditHistory, setAuditHistory] = useState<AuditRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('ALL');
    const [selectedCondition, setSelectedCondition] = useState('ALL');
    const [viewMode, setViewMode] = useState<'table' | 'cards'>('cards');

    // Modals
    const [showRegisterModal, setShowRegisterModal] = useState(false);
    const [showAuditModal, setShowAuditModal] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [selectedAsset, setSelectedAsset] = useState<SchoolAsset | null>(null);
    const [editingAsset, setEditingAsset] = useState<SchoolAsset | null>(null);

    // Form State for Asset Registration / Edit
    const [assetForm, setAssetForm] = useState({
        assetTag: '',
        name: '',
        category: 'Furniture & Fixtures',
        location: '',
        quantity: 1,
        purchaseDate: new Date().toISOString().split('T')[0],
        purchaseCost: '',
        salvageValue: '0',
        usefulLifeYears: 5,
        depreciationRate: 20,
        condition: 'GOOD' as AssetCondition,
        assignedStaffName: '',
        serialNumber: '',
        vendor: '',
        warrantyExpiry: '',
        notes: ''
    });

    // Form State for Audit Check
    const [auditForm, setAuditForm] = useState({
        actualQuantity: 1,
        condition: 'GOOD' as AssetCondition,
        location: '',
        auditorName: '',
        updateGroundRecord: true,
        notes: ''
    });
    const [submitting, setSubmitting] = useState(false);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [assetsRes, summaryRes, auditsRes] = await Promise.all([
                axios.get('/api/v1/assets'),
                axios.get('/api/v1/assets/valuation/summary'),
                axios.get('/api/v1/assets/audits/history')
            ]);
            setAssets(assetsRes.data.assets || []);
            setSummary(summaryRes.data.summary || null);
            setAuditHistory(auditsRes.data.audits || []);
        } catch (error: any) {
            console.error('Failed to fetch assets data:', error);
            toast.error(error?.response?.data?.msg || 'Failed to load assets');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleRefresh = () => {
        setRefreshing(true);
        fetchData();
    };

    // Filtered Assets
    const filteredAssets = useMemo(() => {
        return assets.filter(item => {
            const matchesSearch = !searchQuery ||
                item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.assetTag.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (item.assignedStaffName && item.assignedStaffName.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (item.serialNumber && item.serialNumber.toLowerCase().includes(searchQuery.toLowerCase()));

            const matchesCategory = selectedCategory === 'ALL' || item.category === selectedCategory;
            const matchesCondition = selectedCondition === 'ALL' || item.condition === selectedCondition;

            return matchesSearch && matchesCategory && matchesCondition;
        });
    }, [assets, searchQuery, selectedCategory, selectedCondition]);

    // Open Register Modal
    const handleOpenRegister = () => {
        setEditingAsset(null);
        setAssetForm({
            assetTag: `AST-${Math.floor(100000 + Math.random() * 900000)}`,
            name: '',
            category: 'Furniture & Fixtures',
            location: '',
            quantity: 1,
            purchaseDate: new Date().toISOString().split('T')[0],
            purchaseCost: '',
            salvageValue: '0',
            usefulLifeYears: 5,
            depreciationRate: 20,
            condition: 'GOOD',
            assignedStaffName: '',
            serialNumber: '',
            vendor: '',
            warrantyExpiry: '',
            notes: ''
        });
        setShowRegisterModal(true);
    };

    // Open Edit Modal
    const handleOpenEdit = (asset: SchoolAsset) => {
        setEditingAsset(asset);
        setAssetForm({
            assetTag: asset.assetTag,
            name: asset.name,
            category: asset.category,
            location: asset.location,
            quantity: asset.quantity,
            purchaseDate: asset.purchaseDate ? asset.purchaseDate.split('T')[0] : '',
            purchaseCost: asset.purchaseCost.toString(),
            salvageValue: asset.salvageValue.toString(),
            usefulLifeYears: asset.usefulLifeYears,
            depreciationRate: asset.depreciationRate,
            condition: asset.condition,
            assignedStaffName: asset.assignedStaffName || '',
            serialNumber: asset.serialNumber || '',
            vendor: asset.vendor || '',
            warrantyExpiry: asset.warrantyExpiry ? asset.warrantyExpiry.split('T')[0] : '',
            notes: asset.notes || ''
        });
        setShowRegisterModal(true);
    };

    // Open Audit Modal
    const handleOpenAudit = (asset: SchoolAsset) => {
        setSelectedAsset(asset);
        setAuditForm({
            actualQuantity: asset.quantity,
            condition: asset.condition,
            location: asset.location,
            auditorName: '',
            updateGroundRecord: true,
            notes: ''
        });
        setShowAuditModal(true);
    };

    // Submit Asset Save (Create / Update)
    const handleSubmitAsset = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!assetForm.name.trim() || !assetForm.location.trim()) {
            toast.error('Asset Name and Location are required');
            return;
        }

        try {
            setSubmitting(true);
            const payload = {
                ...assetForm,
                quantity: Number(assetForm.quantity) || 1,
                purchaseCost: Number(assetForm.purchaseCost) || 0,
                salvageValue: Number(assetForm.salvageValue) || 0,
                usefulLifeYears: Number(assetForm.usefulLifeYears) || 5,
                depreciationRate: Number(assetForm.depreciationRate) || 20,
            };

            if (editingAsset) {
                await axios.put(`/api/v1/assets/${editingAsset.id}`, payload);
                toast.success('Asset updated successfully');
            } else {
                await axios.post('/api/v1/assets', payload);
                toast.success('Asset registered successfully');
            }

            setShowRegisterModal(false);
            fetchData();
        } catch (error: any) {
            toast.error(error?.response?.data?.msg || 'Failed to save asset');
        } finally {
            setSubmitting(false);
        }
    };

    // Submit Audit Check
    const handleSubmitAudit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedAsset) return;

        try {
            setSubmitting(true);
            await axios.post(`/api/v1/assets/${selectedAsset.id}/audit`, auditForm);
            toast.success('Physical audit recorded successfully');
            setShowAuditModal(false);
            fetchData();
        } catch (error: any) {
            toast.error(error?.response?.data?.msg || 'Failed to submit audit');
        } finally {
            setSubmitting(false);
        }
    };

    // Delete Asset
    const handleDeleteAsset = async (asset: SchoolAsset) => {
        if (!window.confirm(`Are you sure you want to delete ${asset.name} (${asset.assetTag})?`)) return;
        try {
            await axios.delete(`/api/v1/assets/${asset.id}`);
            toast.success('Asset deleted');
            fetchData();
        } catch (error: any) {
            toast.error(error?.response?.data?.msg || 'Failed to delete asset');
        }
    };

    // Export Excel
    const handleExportExcel = () => {
        try {
            const dataToExport = filteredAssets.map((item, index) => ({
                'S/N': index + 1,
                'Asset Tag': item.assetTag,
                'Asset Name': item.name,
                'Category': item.category,
                'Location / Room': item.location,
                'Quantity On Ground': item.quantity,
                'Condition': item.condition,
                'Acquisition Cost (₦)': item.purchaseCost,
                'Current Book Value (₦)': item.currentValue,
                'Useful Life (Years)': item.usefulLifeYears,
                'Custodian': item.assignedStaffName || 'N/A',
                'Serial Number': item.serialNumber || 'N/A',
                'Purchase Date': item.purchaseDate ? item.purchaseDate.split('T')[0] : 'N/A'
            }));

            const worksheet = XLSX.utils.json_to_sheet(dataToExport);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'School Assets Register');
            XLSX.writeFile(workbook, `School_Assets_Register_${new Date().toISOString().split('T')[0]}.xlsx`);
            toast.success('Excel export generated');
        } catch (e) {
            toast.error('Failed to export Excel');
        }
    };

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=DM+Mono:wght@400;500;600&display=swap');
                .fd-root, .fd-root * { font-family: 'Plus Jakarta Sans', sans-serif !important; }
                .fd-root .mono { font-family: 'DM Mono', monospace !important; }
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
            
            <div className="fd-root min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-indigo-50/30 px-3 py-4 sm:px-6 sm:py-6 lg:px-8">
                <div className="pointer-events-none fixed inset-0 opacity-[0.22]" style={{ backgroundImage: 'radial-gradient(circle,#94a3b8 1px,transparent 1px)', backgroundSize: '28px 28px' }} />
                <div className="relative z-10 mx-auto max-w-7xl">
                    
                    {/* ─── TOP HEADER ─── */}
                    <div className="mb-4 sm:mb-6 rounded-2xl sm:rounded-3xl border border-slate-200/80 bg-white/90 p-4 sm:p-6 shadow-xl shadow-slate-100/50 backdrop-blur-xl">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-start sm:items-center gap-3 sm:gap-4">
                                <div className="flex h-12 w-12 sm:h-16 sm:w-16 shrink-0 items-center justify-center rounded-xl sm:rounded-2xl bg-gradient-to-tr from-indigo-700 via-blue-600 to-indigo-500 shadow-lg shadow-indigo-200 text-white">
                                    <Building2 className="h-6 w-6 sm:h-8 sm:w-8" />
                                </div>
                                <div>
                                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                                        <h1 className="text-lg sm:text-2xl font-black tracking-tight text-slate-900">
                                            Fixed Assets Management
                                        </h1>
                                        <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-2 py-0.5 text-[9px] sm:text-[10px] font-bold text-indigo-800">
                                            <Sparkles className="h-2.5 w-2.5 sm:h-3 sm:w-3" /> Live Intelligence
                                        </span>
                                    </div>
                                    <p className="mt-0.5 text-[11px] sm:text-xs text-slate-500 line-clamp-2 sm:line-clamp-none">
                                        School property registry, physical audits, ground checks & depreciation valuation
                                    </p>
                                </div>
                            </div>

                        {/* Action Buttons */}
                        <div className="flex flex-wrap items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleRefresh}
                                disabled={refreshing}
                                className="rounded-xl border-slate-200 text-slate-700 hover:bg-slate-100"
                            >
                                <RefreshCw className={cn('h-4 w-4 mr-1.5', refreshing && 'animate-spin')} />
                                Refresh
                            </Button>

                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleExportExcel}
                                className="rounded-xl border-slate-200 text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 transition-all"
                            >
                                <FileSpreadsheet className="h-4 w-4 mr-1.5 text-emerald-600" />
                                Export Excel
                            </Button>

                            <Button
                                size="sm"
                                onClick={handleOpenRegister}
                                className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-200 font-semibold"
                            >
                                <Plus className="h-4 w-4 mr-1.5" />
                                Register Asset
                            </Button>
                        </div>
                    </div>

                    </div>

                    {/* Navigation Tabs */}
                    <div className="mb-4 sm:mb-6 -mx-3 px-3 sm:mx-0 sm:px-0 flex gap-1.5 sm:gap-2 overflow-x-auto pb-2 no-scrollbar">
                        <button
                            onClick={() => setActiveTab('register')}
                            className={`flex shrink-0 items-center gap-1.5 sm:gap-2 rounded-xl sm:rounded-2xl px-3 py-2 sm:px-4 sm:py-2.5 text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                                activeTab === 'register'
                                    ? 'bg-slate-900 text-white shadow-md shadow-slate-300'
                                    : 'border border-slate-200/80 bg-white text-slate-600 hover:bg-slate-50'
                            }`}
                        >
                            <Building2 className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${activeTab === 'register' ? 'text-white' : 'text-indigo-600'}`} />
                            Asset Register ({assets.length})
                        </button>

                        <button
                            onClick={() => setActiveTab('audit')}
                            className={`flex shrink-0 items-center gap-1.5 sm:gap-2 rounded-xl sm:rounded-2xl px-3 py-2 sm:px-4 sm:py-2.5 text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                                activeTab === 'audit'
                                    ? 'bg-slate-900 text-white shadow-md shadow-slate-300'
                                    : 'border border-slate-200/80 bg-white text-slate-600 hover:bg-slate-50'
                            }`}
                        >
                            <ShieldCheck className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${activeTab === 'audit' ? 'text-white' : 'text-rose-600'}`} />
                            Ground Audit
                            {summary?.flaggedAuditsCount ? (
                                <span className="px-1.5 py-0.5 rounded-full text-[9px] bg-rose-500 text-white font-bold ml-1">
                                    {summary.flaggedAuditsCount}
                                </span>
                            ) : null}
                        </button>

                        <button
                            onClick={() => setActiveTab('valuation')}
                            className={`flex shrink-0 items-center gap-1.5 sm:gap-2 rounded-xl sm:rounded-2xl px-3 py-2 sm:px-4 sm:py-2.5 text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                                activeTab === 'valuation'
                                    ? 'bg-slate-900 text-white shadow-md shadow-slate-300'
                                    : 'border border-slate-200/80 bg-white text-slate-600 hover:bg-slate-50'
                            }`}
                        >
                            <TrendingDown className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${activeTab === 'valuation' ? 'text-white' : 'text-emerald-600'}`} />
                            Valuation & Depreciation
                        </button>
                    </div>

                    <div className="space-y-4 sm:space-y-6">
                        {/* ─── SUMMARY KPI CARDS ─── */}
                        <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
                            <div className="rounded-xl sm:rounded-2xl border border-slate-200/80 bg-white p-3 sm:p-4 shadow-sm">
                                <div className="flex items-center justify-between text-slate-400">
                                    <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider">Total Assets</span>
                                    <Building2 className="h-3.5 w-3.5 text-indigo-500" />
                                </div>
                                <p className="mono mt-0.5 sm:mt-1 text-base sm:text-lg font-black text-slate-900">
                                    {summary?.totalAssetQuantity || assets.reduce((acc, a) => acc + (a.quantity || 1), 0)} <span className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">units</span>
                                </p>
                                <p className="text-[9px] sm:text-[10px] font-semibold text-indigo-600 mt-0.5 truncate">{assets.length} Unique Items</p>
                            </div>

                            <div className="rounded-xl sm:rounded-2xl border border-slate-200/80 bg-white p-3 sm:p-4 shadow-sm">
                                <div className="flex items-center justify-between text-slate-400">
                                    <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider">Acquisition Cost</span>
                                    <Tag className="h-3.5 w-3.5 text-blue-500" />
                                </div>
                                <p className="mono mt-0.5 sm:mt-1 text-base sm:text-lg font-black text-slate-900">{fmtCompact(summary?.totalAcquisitionCost || 0)}</p>
                                <p className="text-[9px] sm:text-[10px] font-semibold text-blue-600 mt-0.5 truncate">Original Purchase Value</p>
                            </div>

                            <div className="rounded-xl sm:rounded-2xl border border-slate-200/80 bg-white p-3 sm:p-4 shadow-sm">
                                <div className="flex items-center justify-between text-slate-400">
                                    <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider">Current Book Value</span>
                                    <TrendingDown className="h-3.5 w-3.5 text-emerald-500" />
                                </div>
                                <p className="mono mt-0.5 sm:mt-1 text-base sm:text-lg font-black text-emerald-600">{fmtCompact(summary?.totalCurrentValue || 0)}</p>
                                <p className="text-[9px] sm:text-[10px] font-semibold text-emerald-600 mt-0.5 truncate">Net Depreciated Worth</p>
                            </div>

                            <div className="rounded-xl sm:rounded-2xl border border-rose-100 bg-rose-50/50 p-3 sm:p-4 shadow-sm">
                                <div className="flex items-center justify-between text-rose-400">
                                    <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-rose-700">Needs Attention</span>
                                    <Wrench className="h-3.5 w-3.5 text-rose-600" />
                                </div>
                                <div className="flex sm:block items-baseline justify-between">
                                    <p className="mono mt-0.5 sm:mt-1 text-base sm:text-lg font-black text-rose-700">
                                        {(summary?.needingRepairCount || 0) + (summary?.damagedOrMissingCount || 0)}
                                    </p>
                                    <p className="text-[9px] sm:text-[10px] font-semibold text-rose-600 mt-0.5">Repairs, Damaged & Missing</p>
                                </div>
                            </div>
                        </div>

                {/* ─── TAB 1: ASSET REGISTER ─── */}
                {activeTab === 'register' && (
                    <div className="space-y-4">
                        {/* Search & Filters */}
                        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                            <div className="relative flex-1">
                                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Search by asset tag, name, location, custodian, serial #..."
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm font-medium text-slate-800 outline-none focus:border-indigo-500 focus:bg-white transition-all"
                                />
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                                <select
                                    value={selectedCategory}
                                    onChange={e => setSelectedCategory(e.target.value)}
                                    className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 outline-none focus:border-indigo-500"
                                >
                                    <option value="ALL">All Categories</option>
                                    {CATEGORIES.map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>

                                <select
                                    value={selectedCondition}
                                    onChange={e => setSelectedCondition(e.target.value)}
                                    className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 outline-none focus:border-indigo-500"
                                >
                                    <option value="ALL">All Conditions</option>
                                    {CONDITIONS.map(cond => (
                                        <option key={cond.value} value={cond.value}>{cond.label}</option>
                                    ))}
                                </select>

                                <div className="border-l border-slate-200 pl-2 flex items-center gap-1">
                                    <button
                                        onClick={() => setViewMode('cards')}
                                        className={cn('p-2 rounded-lg text-slate-500 transition-all', viewMode === 'cards' && 'bg-slate-100 text-indigo-600 font-bold')}
                                        title="Cards View"
                                    >
                                        <Layers className="h-4 w-4" />
                                    </button>
                                    <button
                                        onClick={() => setViewMode('table')}
                                        className={cn('p-2 rounded-lg text-slate-500 transition-all', viewMode === 'table' && 'bg-slate-100 text-indigo-600 font-bold')}
                                        title="Table View"
                                    >
                                        <SlidersHorizontal className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Loading State */}
                        {loading ? (
                            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200/80">
                                <RefreshCw className="h-8 w-8 animate-spin text-indigo-600 mx-auto" />
                                <p className="text-sm font-medium text-slate-600 mt-3">Loading fixed assets registry...</p>
                            </div>
                        ) : filteredAssets.length === 0 ? (
                            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200/80">
                                <Building2 className="h-12 w-12 text-slate-300 mx-auto" />
                                <h3 className="text-base font-bold text-slate-800 mt-3">No Assets Found</h3>
                                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                                    {searchQuery || selectedCategory !== 'ALL' || selectedCondition !== 'ALL'
                                        ? 'No assets matched your search filters. Try adjusting criteria.'
                                        : 'No school assets have been registered yet. Click "Register Asset" to get started.'}
                                </p>
                                <Button
                                    size="sm"
                                    onClick={handleOpenRegister}
                                    className="mt-4 rounded-xl bg-indigo-600 text-white"
                                >
                                    <Plus className="h-4 w-4 mr-1.5" />
                                    Register First Asset
                                </Button>
                            </div>
                        ) : viewMode === 'cards' ? (
                            /* ─── CARDS VIEW ─── */
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {filteredAssets.map(asset => {
                                    const cond = CONDITIONS.find(c => c.value === asset.condition) || CONDITIONS[0];
                                    return (
                                        <div
                                            key={asset.id}
                                            className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                                        >
                                            <div>
                                                <div className="flex items-start justify-between gap-2">
                                                    <div>
                                                        <span className="inline-block font-mono text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                                                            {asset.assetTag}
                                                        </span>
                                                        <h3 className="text-sm sm:text-base font-bold text-slate-900 mt-1.5 line-clamp-1">
                                                            {asset.name}
                                                        </h3>
                                                        <p className="text-xs text-slate-500 font-medium flex items-center gap-1 mt-0.5">
                                                            <Building2 className="h-3.5 w-3.5 text-slate-400" />
                                                            {asset.location} • {asset.category}
                                                        </p>
                                                    </div>

                                                    <span className={cn('text-[11px] font-bold px-2 py-1 rounded-lg border', cond.bg, cond.color, cond.border)}>
                                                        {cond.label.split(' ')[0]}
                                                    </span>
                                                </div>

                                                <div className="mt-4 grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs">
                                                    <div>
                                                        <span className="text-slate-400 block font-medium text-[10px] uppercase">Quantity</span>
                                                        <span className="font-bold text-slate-800 text-sm">{asset.quantity} units</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-slate-400 block font-medium text-[10px] uppercase">Est. Book Value</span>
                                                        <span className="font-bold text-emerald-700 text-sm">{fmt(asset.currentValue)}</span>
                                                    </div>
                                                    {asset.assignedStaffName && (
                                                        <div className="col-span-2 pt-1 border-t border-slate-200/60 flex items-center gap-1 text-[11px] text-slate-600">
                                                            <User className="h-3 w-3 text-slate-400" />
                                                            Custodian: <span className="font-semibold text-slate-800">{asset.assignedStaffName}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleOpenAudit(asset)}
                                                    className="rounded-xl text-xs font-semibold text-indigo-700 border-indigo-200 hover:bg-indigo-50"
                                                >
                                                    <ShieldCheck className="h-3.5 w-3.5 mr-1" />
                                                    Audit Ground
                                                </Button>

                                                <div className="flex items-center gap-1">
                                                    <button
                                                        onClick={() => {
                                                            setSelectedAsset(asset);
                                                            setShowDetailsModal(true);
                                                        }}
                                                        className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                                                        title="View Details"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleOpenEdit(asset)}
                                                        className="p-2 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
                                                        title="Edit Asset"
                                                    >
                                                        <Edit3 className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteAsset(asset)}
                                                        className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                                                        title="Delete Asset"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            /* ─── TABLE VIEW ─── */
                            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-xs sm:text-sm">
                                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[11px] tracking-wider">
                                            <tr>
                                                <th className="py-3.5 px-4">Tag / Name</th>
                                                <th className="py-3.5 px-4">Category</th>
                                                <th className="py-3.5 px-4">Location</th>
                                                <th className="py-3.5 px-4 text-center">Qty</th>
                                                <th className="py-3.5 px-4">Condition</th>
                                                <th className="py-3.5 px-4 text-right">Cost Price</th>
                                                <th className="py-3.5 px-4 text-right">Book Value</th>
                                                <th className="py-3.5 px-4 text-center">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {filteredAssets.map(asset => {
                                                const cond = CONDITIONS.find(c => c.value === asset.condition) || CONDITIONS[0];
                                                return (
                                                    <tr key={asset.id} className="hover:bg-slate-50/80 transition-colors">
                                                        <td className="py-3 px-4">
                                                            <div className="font-mono text-xs font-bold text-indigo-600">{asset.assetTag}</div>
                                                            <div className="font-bold text-slate-900 mt-0.5">{asset.name}</div>
                                                        </td>
                                                        <td className="py-3 px-4 text-slate-600 font-medium">{asset.category}</td>
                                                        <td className="py-3 px-4 text-slate-600 font-medium">{asset.location}</td>
                                                        <td className="py-3 px-4 text-center font-bold text-slate-900">{asset.quantity}</td>
                                                        <td className="py-3 px-4">
                                                            <span className={cn('text-[11px] font-bold px-2 py-0.5 rounded-md border inline-block', cond.bg, cond.color, cond.border)}>
                                                                {cond.label.split(' ')[0]}
                                                            </span>
                                                        </td>
                                                        <td className="py-3 px-4 text-right font-medium text-slate-600">{fmt(asset.purchaseCost)}</td>
                                                        <td className="py-3 px-4 text-right font-bold text-emerald-700">{fmt(asset.currentValue)}</td>
                                                        <td className="py-3 px-4">
                                                            <div className="flex items-center justify-center gap-1.5">
                                                                <button
                                                                    onClick={() => handleOpenAudit(asset)}
                                                                    className="px-2 py-1 rounded-lg text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100"
                                                                >
                                                                    Audit
                                                                </button>
                                                                <button
                                                                    onClick={() => handleOpenEdit(asset)}
                                                                    className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100"
                                                                >
                                                                    <Edit3 className="h-3.5 w-3.5" />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeleteAsset(asset)}
                                                                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100"
                                                                >
                                                                    <Trash2 className="h-3.5 w-3.5" />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* ─── TAB 2: PHYSICAL GROUND AUDIT & DISCREPANCIES ─── */}
                {activeTab === 'audit' && (
                    <div className="space-y-6">
                        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 text-white rounded-3xl p-6 sm:p-8 shadow-lg shadow-blue-500/10 relative overflow-hidden">
                            <div className="max-w-2xl relative z-10">
                                <span className="inline-block px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-widest bg-white/20 text-white backdrop-blur-sm">
                                    School Ground Verification Protocol
                                </span>
                                <h2 className="text-xl sm:text-2xl font-extrabold mt-2 text-white">
                                    Physical Asset & Liability Check
                                </h2>
                                <p className="text-xs sm:text-sm text-blue-100 mt-2 leading-relaxed font-medium">
                                    Perform physical inventory counts on classroom desks, library books, computers, laboratory apparatus, and school equipment. Compare expected records vs ground reality and log discrepancies automatically.
                                </p>
                            </div>
                        </div>

                        {/* Recent Audits Table */}
                        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
                            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
                                <div>
                                    <h3 className="text-sm sm:text-base font-bold text-slate-900">Audit Check Records</h3>
                                    <p className="text-xs text-slate-500 font-medium">Log of recent physical verifications and discrepancies</p>
                                </div>
                            </div>

                            {auditHistory.length === 0 ? (
                                <div className="p-12 text-center">
                                    <ShieldCheck className="h-10 w-10 text-slate-300 mx-auto" />
                                    <p className="text-sm font-semibold text-slate-700 mt-2">No audit checks recorded yet</p>
                                    <p className="text-xs text-slate-400 mt-0.5">Go to the Asset Register tab and click "Audit Ground" on any asset to log your first physical check.</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-xs sm:text-sm">
                                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[11px]">
                                            <tr>
                                                <th className="py-3 px-4">Date / Auditor</th>
                                                <th className="py-3 px-4">Asset Name & Tag</th>
                                                <th className="py-3 px-4">Location</th>
                                                <th className="py-3 px-4 text-center">Expected</th>
                                                <th className="py-3 px-4 text-center">Ground Count</th>
                                                <th className="py-3 px-4 text-center">Discrepancy</th>
                                                <th className="py-3 px-4">Condition</th>
                                                <th className="py-3 px-4">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {auditHistory.map(audit => (
                                                <tr key={audit.id} className="hover:bg-slate-50/80 transition-colors">
                                                    <td className="py-3 px-4">
                                                        <div className="font-bold text-slate-900">{new Date(audit.auditDate).toLocaleDateString('en-NG')}</div>
                                                        <div className="text-xs text-slate-500">{audit.auditorName}</div>
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <div className="font-bold text-slate-900">{audit.asset?.name || 'Asset'}</div>
                                                        <div className="font-mono text-xs text-indigo-600">{audit.asset?.assetTag}</div>
                                                    </td>
                                                    <td className="py-3 px-4 text-slate-600 font-medium">{audit.location}</td>
                                                    <td className="py-3 px-4 text-center font-bold text-slate-700">{audit.expectedQuantity}</td>
                                                    <td className="py-3 px-4 text-center font-bold text-slate-900">{audit.actualQuantity}</td>
                                                    <td className="py-3 px-4 text-center font-bold">
                                                        {audit.discrepancy === 0 ? (
                                                            <span className="text-emerald-600">0 (Match)</span>
                                                        ) : audit.discrepancy < 0 ? (
                                                            <span className="text-rose-600 font-bold">{audit.discrepancy} (Missing)</span>
                                                        ) : (
                                                            <span className="text-blue-600 font-bold">+{audit.discrepancy} (Surplus)</span>
                                                        )}
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <span className="text-xs font-semibold text-slate-700">{audit.condition}</span>
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <span className={cn(
                                                            'px-2 py-0.5 rounded-md text-[11px] font-bold border',
                                                            audit.status === 'VERIFIED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                                            audit.status === 'FLAGGED' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                                                            'bg-amber-50 text-amber-700 border-amber-200'
                                                        )}>
                                                            {audit.status}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ─── TAB 3: VALUATION & DEPRECIATION ─── */}
                {activeTab === 'valuation' && summary && (
                    <div className="space-y-6">
                        {/* Valuation Overview */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
                                <span className="text-xs font-bold text-slate-400 uppercase">Gross Acquisition Cost</span>
                                <div className="text-2xl font-extrabold text-slate-900 mt-2">{fmt(summary.totalAcquisitionCost)}</div>
                                <p className="text-xs text-slate-500 mt-1">Cumulative purchase cost of all assets</p>
                            </div>

                            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
                                <span className="text-xs font-bold text-rose-500 uppercase">Accumulated Depreciation</span>
                                <div className="text-2xl font-extrabold text-rose-600 mt-2">-{fmt(summary.totalDepreciation)}</div>
                                <p className="text-xs text-slate-500 mt-1">Straight-line depreciation to date</p>
                            </div>

                            <div className="bg-white rounded-2xl p-5 border border-emerald-200 bg-emerald-50/30 shadow-sm">
                                <span className="text-xs font-bold text-emerald-700 uppercase">Net Balance Sheet Worth</span>
                                <div className="text-2xl font-extrabold text-emerald-700 mt-2">{fmt(summary.totalCurrentValue)}</div>
                                <p className="text-xs text-slate-500 mt-1">Live net book value on ground</p>
                            </div>
                        </div>

                        {/* Category Valuation Breakdown */}
                        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
                            <h3 className="text-base font-bold text-slate-900 mb-4">Asset Value by Category</h3>
                            <div className="space-y-4">
                                {Object.entries(summary.categoryBreakdown).map(([cat, stats]) => {
                                    const percent = summary.totalCurrentValue > 0
                                        ? Math.round((stats.currentValue / summary.totalCurrentValue) * 100)
                                        : 0;
                                    return (
                                        <div key={cat} className="space-y-1.5">
                                            <div className="flex items-center justify-between text-xs sm:text-sm font-semibold">
                                                <span className="text-slate-800">{cat} ({stats.count} units)</span>
                                                <span className="text-indigo-700 font-bold">{fmt(stats.currentValue)} ({percent}%)</span>
                                            </div>
                                            <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full transition-all duration-500"
                                                    style={{ width: `${percent}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* ─── MODAL: REGISTER / EDIT ASSET ─── */}
            <AnimatePresence>
                {showRegisterModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm"
                    >
                        <div className="flex min-h-full items-center justify-center p-4 py-10">
                            <motion.div
                                initial={{ scale: 0.95, y: 20 }}
                                animate={{ scale: 1, y: 0 }}
                                exit={{ scale: 0.95, y: 20 }}
                                className="w-full max-w-3xl bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden"
                            >
                            <div className="px-6 py-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 text-white flex items-center justify-between shadow-md">
                                <div>
                                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                        <Building2 className="h-5 w-5 text-blue-200" />
                                        {editingAsset ? 'Edit Asset Record' : 'Register New Fixed Asset'}
                                    </h3>
                                    <p className="text-xs text-blue-100 font-medium mt-0.5">
                                        Enter complete asset specifications, location, and depreciation parameters
                                    </p>
                                </div>
                                <button
                                    onClick={() => setShowRegisterModal(false)}
                                    className="p-2 rounded-xl text-blue-100 hover:text-white hover:bg-white/15 transition-all"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmitAsset} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <Label className="text-xs font-bold text-slate-700">Asset Tag / Code</Label>
                                        <input
                                            type="text"
                                            className={inputCls}
                                            value={assetForm.assetTag}
                                            onChange={e => setAssetForm({ ...assetForm, assetTag: e.target.value })}
                                            placeholder="e.g. AST-DESK-001"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <Label className="text-xs font-bold text-slate-700">Asset Name</Label>
                                        <input
                                            type="text"
                                            className={inputCls}
                                            value={assetForm.name}
                                            onChange={e => setAssetForm({ ...assetForm, name: e.target.value })}
                                            placeholder="e.g. Student Wooden Double Desks"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <Label className="text-xs font-bold text-slate-700">Category</Label>
                                        <select
                                            className={inputCls}
                                            value={assetForm.category}
                                            onChange={e => setAssetForm({ ...assetForm, category: e.target.value })}
                                        >
                                            {CATEGORIES.map(c => (
                                                <option key={c} value={c}>{c}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <Label className="text-xs font-bold text-slate-700">Location / Room</Label>
                                        <input
                                            type="text"
                                            className={inputCls}
                                            value={assetForm.location}
                                            onChange={e => setAssetForm({ ...assetForm, location: e.target.value })}
                                            placeholder="e.g. JSS 1 Alpha Classroom, ICT Lab"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <Label className="text-xs font-bold text-slate-700">Quantity On Ground</Label>
                                        <input
                                            type="number"
                                            min="1"
                                            className={inputCls}
                                            value={assetForm.quantity}
                                            onChange={e => setAssetForm({ ...assetForm, quantity: parseInt(e.target.value) || 1 })}
                                            required
                                        />
                                    </div>

                                    <div>
                                        <Label className="text-xs font-bold text-slate-700">Condition Status</Label>
                                        <select
                                            className={inputCls}
                                            value={assetForm.condition}
                                            onChange={e => setAssetForm({ ...assetForm, condition: e.target.value as AssetCondition })}
                                        >
                                            {CONDITIONS.map(c => (
                                                <option key={c.value} value={c.value}>{c.label}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <Label className="text-xs font-bold text-slate-700">Purchase Date</Label>
                                        <input
                                            type="date"
                                            className={inputCls}
                                            value={assetForm.purchaseDate}
                                            onChange={e => setAssetForm({ ...assetForm, purchaseDate: e.target.value })}
                                        />
                                    </div>

                                    <div>
                                        <Label className="text-xs font-bold text-slate-700">Acquisition Cost Per Unit (₦)</Label>
                                        <input
                                            type="number"
                                            min="0"
                                            className={inputCls}
                                            value={assetForm.purchaseCost}
                                            onChange={e => setAssetForm({ ...assetForm, purchaseCost: e.target.value })}
                                            placeholder="e.g. 25000"
                                        />
                                    </div>

                                    <div>
                                        <Label className="text-xs font-bold text-slate-700">Useful Life (Years)</Label>
                                        <input
                                            type="number"
                                            min="1"
                                            className={inputCls}
                                            value={assetForm.usefulLifeYears}
                                            onChange={e => setAssetForm({ ...assetForm, usefulLifeYears: parseInt(e.target.value) || 5 })}
                                        />
                                    </div>

                                    <div>
                                        <Label className="text-xs font-bold text-slate-700">Assigned Custodian / Staff</Label>
                                        <input
                                            type="text"
                                            className={inputCls}
                                            value={assetForm.assignedStaffName}
                                            onChange={e => setAssetForm({ ...assetForm, assignedStaffName: e.target.value })}
                                            placeholder="e.g. Mr. John Doe (Form Teacher)"
                                        />
                                    </div>

                                    <div>
                                        <Label className="text-xs font-bold text-slate-700">Serial Number / Model</Label>
                                        <input
                                            type="text"
                                            className={inputCls}
                                            value={assetForm.serialNumber}
                                            onChange={e => setAssetForm({ ...assetForm, serialNumber: e.target.value })}
                                            placeholder="e.g. SN-8823901"
                                        />
                                    </div>

                                    <div>
                                        <Label className="text-xs font-bold text-slate-700">Vendor / Supplier</Label>
                                        <input
                                            type="text"
                                            className={inputCls}
                                            value={assetForm.vendor}
                                            onChange={e => setAssetForm({ ...assetForm, vendor: e.target.value })}
                                            placeholder="e.g. School Supplies Ltd"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <Label className="text-xs font-bold text-slate-700">Notes / Audit Remarks</Label>
                                    <textarea
                                        className={cn(inputCls, 'h-20 resize-none')}
                                        value={assetForm.notes}
                                        onChange={e => setAssetForm({ ...assetForm, notes: e.target.value })}
                                        placeholder="Any additional details on condition, warranty or maintenance..."
                                    />
                                </div>

                                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setShowRegisterModal(false)}
                                        className="rounded-xl border-slate-200"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={submitting}
                                        className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 shadow-md shadow-indigo-200"
                                    >
                                        {submitting ? 'Saving...' : editingAsset ? 'Update Asset' : 'Register Asset'}
                                    </Button>
                                </div>
                            </form>
                            </motion.div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ─── MODAL: PHYSICAL GROUND AUDIT ─── */}
            <AnimatePresence>
                {showAuditModal && selectedAsset && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{ scale: 0.95, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.95, y: 20 }}
                            className="w-full max-w-lg bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden"
                        >
                            <div className="px-6 py-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 text-white flex items-center justify-between shadow-md">
                                <div>
                                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                        <ShieldCheck className="h-5 w-5 text-blue-200" />
                                        Log Physical Ground Audit
                                    </h3>
                                    <p className="text-xs text-blue-100 font-medium mt-0.5">
                                        Audit for {selectedAsset.name} ({selectedAsset.assetTag})
                                    </p>
                                </div>
                                <button
                                    onClick={() => setShowAuditModal(false)}
                                    className="p-2 rounded-xl text-blue-100 hover:text-white hover:bg-white/15 transition-all"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmitAudit} className="p-6 space-y-4">
                                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center justify-between">
                                    <div>
                                        <span className="text-xs text-slate-500 font-medium">Expected on Record</span>
                                        <div className="text-lg font-extrabold text-slate-800">{selectedAsset.quantity} units</div>
                                    </div>
                                    <div>
                                        <span className="text-xs text-slate-500 font-medium">Location</span>
                                        <div className="text-sm font-bold text-slate-800">{selectedAsset.location}</div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label className="text-xs font-bold text-slate-700">Actual Count on Ground</Label>
                                        <input
                                            type="number"
                                            min="0"
                                            className={inputCls}
                                            value={auditForm.actualQuantity}
                                            onChange={e => setAuditForm({ ...auditForm, actualQuantity: parseInt(e.target.value) || 0 })}
                                            required
                                        />
                                    </div>

                                    <div>
                                        <Label className="text-xs font-bold text-slate-700">Condition on Ground</Label>
                                        <select
                                            className={inputCls}
                                            value={auditForm.condition}
                                            onChange={e => setAuditForm({ ...auditForm, condition: e.target.value as AssetCondition })}
                                        >
                                            {CONDITIONS.map(c => (
                                                <option key={c.value} value={c.value}>{c.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <Label className="text-xs font-bold text-slate-700">Auditor Name</Label>
                                    <input
                                        type="text"
                                        className={inputCls}
                                        value={auditForm.auditorName}
                                        onChange={e => setAuditForm({ ...auditForm, auditorName: e.target.value })}
                                        placeholder="e.g. Audit Committee Member / Vice Principal"
                                        required
                                    />
                                </div>

                                <div>
                                    <Label className="text-xs font-bold text-slate-700">Audit Discrepancy & Remarks</Label>
                                    <textarea
                                        className={cn(inputCls, 'h-20 resize-none')}
                                        value={auditForm.notes}
                                        onChange={e => setAuditForm({ ...auditForm, notes: e.target.value })}
                                        placeholder="Explain any discrepancies, wear & tear, or required actions..."
                                    />
                                </div>

                                <label className="flex items-center gap-2.5 cursor-pointer bg-indigo-50/60 p-3 rounded-xl border border-indigo-100">
                                    <input
                                        type="checkbox"
                                        checked={auditForm.updateGroundRecord}
                                        onChange={e => setAuditForm({ ...auditForm, updateGroundRecord: e.target.checked })}
                                        className="h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500"
                                    />
                                    <span className="text-xs font-medium text-indigo-900">
                                        Update master asset quantity & condition to match this ground audit
                                    </span>
                                </label>

                                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setShowAuditModal(false)}
                                        className="rounded-xl border-slate-200"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={submitting}
                                        className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 shadow-md shadow-indigo-200"
                                    >
                                        {submitting ? 'Submitting...' : 'Save Ground Audit'}
                                    </Button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ─── MODAL: ASSET DETAILS ─── */}
            <AnimatePresence>
                {showDetailsModal && selectedAsset && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{ scale: 0.95, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.95, y: 20 }}
                            className="w-full max-w-lg bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 space-y-4"
                        >
                            <div className="flex items-start justify-between">
                                <div>
                                    <span className="font-mono text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                                        {selectedAsset.assetTag}
                                    </span>
                                    <h3 className="text-lg font-bold text-slate-900 mt-1">{selectedAsset.name}</h3>
                                    <p className="text-xs text-slate-500 font-medium">{selectedAsset.category} • {selectedAsset.location}</p>
                                </div>
                                <button
                                    onClick={() => setShowDetailsModal(false)}
                                    className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs">
                                <div>
                                    <span className="text-slate-400 block font-medium uppercase text-[10px]">Quantity</span>
                                    <span className="font-bold text-slate-800 text-sm">{selectedAsset.quantity} units</span>
                                </div>
                                <div>
                                    <span className="text-slate-400 block font-medium uppercase text-[10px]">Condition</span>
                                    <span className="font-bold text-indigo-700 text-sm">{selectedAsset.condition}</span>
                                </div>
                                <div>
                                    <span className="text-slate-400 block font-medium uppercase text-[10px]">Acquisition Cost</span>
                                    <span className="font-bold text-slate-800 text-sm">{fmt(selectedAsset.purchaseCost)}</span>
                                </div>
                                <div>
                                    <span className="text-slate-400 block font-medium uppercase text-[10px]">Est. Book Value</span>
                                    <span className="font-bold text-emerald-700 text-sm">{fmt(selectedAsset.currentValue)}</span>
                                </div>
                                <div>
                                    <span className="text-slate-400 block font-medium uppercase text-[10px]">Custodian</span>
                                    <span className="font-semibold text-slate-800">{selectedAsset.assignedStaffName || 'None assigned'}</span>
                                </div>
                                <div>
                                    <span className="text-slate-400 block font-medium uppercase text-[10px]">Serial Number</span>
                                    <span className="font-semibold text-slate-800">{selectedAsset.serialNumber || 'N/A'}</span>
                                </div>
                            </div>

                            {selectedAsset.notes && (
                                <div className="text-xs text-slate-600 bg-amber-50/60 p-3 rounded-xl border border-amber-100">
                                    <span className="font-bold text-amber-900 block mb-0.5">Notes:</span>
                                    {selectedAsset.notes}
                                </div>
                            )}

                            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        setShowDetailsModal(false);
                                        handleOpenEdit(selectedAsset);
                                    }}
                                    className="rounded-xl border-slate-200"
                                >
                                    <Edit3 className="h-4 w-4 mr-1.5" />
                                    Edit Details
                                </Button>
                                <Button
                                    size="sm"
                                    onClick={() => {
                                        setShowDetailsModal(false);
                                        handleOpenAudit(selectedAsset);
                                    }}
                                    className="rounded-xl bg-indigo-600 text-white font-bold shadow-md shadow-indigo-200"
                                >
                                    <ShieldCheck className="h-4 w-4 mr-1.5" />
                                    Audit Ground
                                </Button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
                </div>
            </div>
        </>
    );
}
