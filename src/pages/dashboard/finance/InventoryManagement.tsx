import { useState, useEffect, useMemo } from 'react';
import {
    Plus, Search, Filter, RefreshCw, Package, ArrowDownRight,
    ArrowUpRight, AlertTriangle, AlertCircle, Trash2, Edit3,
    Eye, ShieldAlert, ShoppingBag, Truck, History, FileSpreadsheet,
    Layers, CheckCircle2, ChevronRight, X, SlidersHorizontal,
    Boxes, DollarSign, ArrowRightLeft, ArrowUpDown, Tag, Sparkles
} from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Label } from '../../../components/ui/label';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { cn } from '../../../lib/utils';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

// ─── TYPES & INTERFACES ──────────────────────────────────────────────────────

interface InventoryItem {
    id: string;
    sku: string;
    barcode?: string | null;
    name: string;
    category: string;
    unit: string;
    costPrice: number;
    sellingPrice: number;
    quantityOnHand: number;
    reorderLevel: number;
    isSellable: boolean;
    location?: string | null;
    description?: string | null;
    stockStatus: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
    isLowStock: boolean;
    totalCostValue: number;
    totalRetailValue: number;
    lastRestockedAt?: string | null;
    createdAt: string;
}

interface InventoryMovement {
    id: string;
    itemId: string;
    type: 'RESTOCK' | 'POS_SALE' | 'USAGE' | 'DAMAGE' | 'RETURN' | 'ADJUSTMENT';
    quantityChange: number;
    previousQuantity: number;
    newQuantity: number;
    unitPrice?: number | null;
    reason?: string | null;
    performedBy?: string | null;
    createdAt: string;
    item?: {
        name: string;
        sku: string;
        unit: string;
        category: string;
    };
}

interface ValuationReport {
    totalSKUs: number;
    totalStockQuantity: number;
    totalCostValue: number;
    totalRetailValue: number;
    potentialGrossMargin: number;
    lowStockCount: number;
    outOfStockCount: number;
    totalAlertsCount: number;
    categoryBreakdown: Record<string, { skuCount: number; totalUnits: number; costValue: number; retailValue: number }>;
    lowStockAlerts: InventoryItem[];
}

const CATEGORIES = [
    'Textbooks & Workbooks',
    'Exercise Books & Stationery',
    'School Uniforms & Sportswear',
    'Tuck Shop & Beverages',
    'Science Lab Consumables',
    'Art & Craft Materials',
    'Cleaning & Facilities Supplies',
    'Boarding House Provisions',
    'Medical & First Aid',
    'Other'
];

const UNITS = [
    'Pieces',
    'Cartons',
    'Packs',
    'Bundles',
    'Dozens',
    'Pairs',
    'Sets',
    'Bottles',
    'Rolls',
    'Boxes'
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

export default function InventoryManagement() {
    const [activeTab, setActiveTab] = useState<'catalog' | 'restock' | 'usage' | 'movements'>('catalog');
    const [items, setItems] = useState<InventoryItem[]>([]);
    const [valuation, setValuation] = useState<ValuationReport | null>(null);
    const [movements, setMovements] = useState<InventoryMovement[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('ALL');
    const [selectedStatus, setSelectedStatus] = useState('ALL');
    const [viewMode, setViewMode] = useState<'table' | 'cards'>('cards');

    // Modals
    const [showItemModal, setShowItemModal] = useState(false);
    const [showRestockModal, setShowRestockModal] = useState(false);
    const [showUsageModal, setShowUsageModal] = useState(false);
    const [showMovementsModal, setShowMovementsModal] = useState(false);

    const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
    const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
    const [itemMovementsList, setItemMovementsList] = useState<InventoryMovement[]>([]);

    // Form States
    const [itemForm, setItemForm] = useState({
        sku: '',
        barcode: '',
        name: '',
        category: 'Textbooks & Workbooks',
        unit: 'Pieces',
        costPrice: '',
        sellingPrice: '',
        initialQuantity: 0,
        reorderLevel: 10,
        isSellable: true,
        location: '',
        description: ''
    });

    const [restockForm, setRestockForm] = useState({
        quantityAdded: '',
        unitCost: '',
        supplier: '',
        batchNumber: '',
        invoiceRef: '',
        receivedDate: new Date().toISOString().split('T')[0],
        receivedBy: '',
        notes: ''
    });

    const [usageForm, setUsageForm] = useState({
        quantity: '',
        type: 'USAGE',
        reason: '',
        performedBy: '',
        notes: ''
    });

    const [submitting, setSubmitting] = useState(false);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [itemsRes, valRes, movRes] = await Promise.all([
                axios.get('/api/v1/inventory'),
                axios.get('/api/v1/inventory/valuation/report'),
                axios.get('/api/v1/inventory/movements/history?limit=50')
            ]);
            setItems(itemsRes.data.items || []);
            setValuation(valRes.data.report || null);
            setMovements(movRes.data.movements || []);
        } catch (error: any) {
            console.error('Failed to fetch inventory data:', error);
            toast.error(error?.response?.data?.msg || 'Failed to load inventory');
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

    // Filtered Items
    const filteredItems = useMemo(() => {
        return items.filter(item => {
            const matchesSearch = !searchQuery ||
                item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (item.barcode && item.barcode.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (item.location && item.location.toLowerCase().includes(searchQuery.toLowerCase()));

            const matchesCategory = selectedCategory === 'ALL' || item.category === selectedCategory;
            const matchesStatus = selectedStatus === 'ALL' || item.stockStatus === selectedStatus;

            return matchesSearch && matchesCategory && matchesStatus;
        });
    }, [items, searchQuery, selectedCategory, selectedStatus]);

    // Open Register / Add Modal
    const handleOpenAddItem = () => {
        setEditingItem(null);
        setItemForm({
            sku: `SKU-${Math.floor(100000 + Math.random() * 900000)}`,
            barcode: '',
            name: '',
            category: 'Textbooks & Workbooks',
            unit: 'Pieces',
            costPrice: '',
            sellingPrice: '',
            initialQuantity: 0,
            reorderLevel: 10,
            isSellable: true,
            location: '',
            description: ''
        });
        setShowItemModal(true);
    };

    // Open Edit Modal
    const handleOpenEditItem = (item: InventoryItem) => {
        setEditingItem(item);
        setItemForm({
            sku: item.sku,
            barcode: item.barcode || '',
            name: item.name,
            category: item.category,
            unit: item.unit,
            costPrice: item.costPrice.toString(),
            sellingPrice: item.sellingPrice.toString(),
            initialQuantity: item.quantityOnHand,
            reorderLevel: item.reorderLevel,
            isSellable: item.isSellable,
            location: item.location || '',
            description: item.description || ''
        });
        setShowItemModal(true);
    };

    // Open Quick Restock Modal
    const handleOpenRestock = (item: InventoryItem) => {
        setSelectedItem(item);
        setRestockForm({
            quantityAdded: '',
            unitCost: item.costPrice.toString(),
            supplier: '',
            batchNumber: `BAT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
            invoiceRef: '',
            receivedDate: new Date().toISOString().split('T')[0],
            receivedBy: '',
            notes: ''
        });
        setShowRestockModal(true);
    };

    // Open Log Usage Modal
    const handleOpenUsage = (item: InventoryItem) => {
        setSelectedItem(item);
        setUsageForm({
            quantity: '',
            type: 'USAGE',
            reason: '',
            performedBy: '',
            notes: ''
        });
        setShowUsageModal(true);
    };

    // View Item Stock Card Movements
    const handleViewItemMovements = async (item: InventoryItem) => {
        setSelectedItem(item);
        try {
            const res = await axios.get(`/api/v1/inventory/movements/history?itemId=${item.id}`);
            setItemMovementsList(res.data.movements || []);
            setShowMovementsModal(true);
        } catch (e) {
            toast.error('Failed to load item movements');
        }
    };

    // Submit Item Save
    const handleSubmitItem = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!itemForm.name.trim()) {
            toast.error('Item name is required');
            return;
        }

        try {
            setSubmitting(true);
            const payload = {
                ...itemForm,
                costPrice: Number(itemForm.costPrice) || 0,
                sellingPrice: Number(itemForm.sellingPrice) || 0,
                initialQuantity: parseInt(itemForm.initialQuantity.toString()) || 0,
                reorderLevel: parseInt(itemForm.reorderLevel.toString()) || 10,
            };

            if (editingItem) {
                await axios.put(`/api/v1/inventory/${editingItem.id}`, payload);
                toast.success('Inventory item updated');
            } else {
                await axios.post('/api/v1/inventory', payload);
                toast.success('Inventory item created');
            }

            setShowItemModal(false);
            fetchData();
        } catch (error: any) {
            toast.error(error?.response?.data?.msg || 'Failed to save item');
        } finally {
            setSubmitting(false);
        }
    };

    // Submit Restock
    const handleSubmitRestock = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedItem) return;

        const qty = parseInt(restockForm.quantityAdded);
        if (!qty || qty <= 0) {
            toast.error('Please enter a valid quantity greater than 0');
            return;
        }

        try {
            setSubmitting(true);
            await axios.post(`/api/v1/inventory/${selectedItem.id}/restock`, {
                ...restockForm,
                quantityAdded: qty,
                unitCost: Number(restockForm.unitCost) || selectedItem.costPrice,
            });
            toast.success(`Successfully restocked ${qty} ${selectedItem.unit} of ${selectedItem.name}`);
            setShowRestockModal(false);
            fetchData();
        } catch (error: any) {
            toast.error(error?.response?.data?.msg || 'Failed to restock item');
        } finally {
            setSubmitting(false);
        }
    };

    // Submit Usage / Damage
    const handleSubmitUsage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedItem) return;

        const qty = parseInt(usageForm.quantity);
        if (!qty || qty <= 0) {
            toast.error('Please enter a valid quantity');
            return;
        }

        try {
            setSubmitting(true);
            await axios.post(`/api/v1/inventory/${selectedItem.id}/usage`, {
                ...usageForm,
                quantity: qty
            });
            toast.success(`Stock deduction recorded for ${selectedItem.name}`);
            setShowUsageModal(false);
            fetchData();
        } catch (error: any) {
            toast.error(error?.response?.data?.msg || 'Failed to record usage');
        } finally {
            setSubmitting(false);
        }
    };

    // Delete Item
    const handleDeleteItem = async (item: InventoryItem) => {
        if (!window.confirm(`Are you sure you want to delete ${item.name} (${item.sku})?`)) return;
        try {
            await axios.delete(`/api/v1/inventory/${item.id}`);
            toast.success('Item deleted');
            fetchData();
        } catch (error: any) {
            toast.error(error?.response?.data?.msg || 'Failed to delete item');
        }
    };

    // Export Excel
    const handleExportExcel = () => {
        try {
            const dataToExport = filteredItems.map((item, index) => ({
                'S/N': index + 1,
                'SKU': item.sku,
                'Item Name': item.name,
                'Category': item.category,
                'Unit': item.unit,
                'Quantity On Ground': item.quantityOnHand,
                'Reorder Level': item.reorderLevel,
                'Stock Status': item.stockStatus,
                'Cost Price (₦)': item.costPrice,
                'Selling Price (₦)': item.sellingPrice,
                'Total Cost Value (₦)': item.totalCostValue,
                'Total Retail Value (₦)': item.totalRetailValue,
                'Sellable in POS': item.isSellable ? 'YES' : 'NO',
                'Location': item.location || 'Main Store'
            }));

            const worksheet = XLSX.utils.json_to_sheet(dataToExport);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'School Inventory Valuation');
            XLSX.writeFile(workbook, `School_Inventory_${new Date().toISOString().split('T')[0]}.xlsx`);
            toast.success('Inventory Excel export generated');
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
                                <div className="flex h-12 w-12 sm:h-16 sm:w-16 shrink-0 items-center justify-center rounded-xl sm:rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-emerald-400 shadow-lg shadow-emerald-200 text-white">
                                    <Boxes className="h-6 w-6 sm:h-8 sm:w-8" />
                                </div>
                                <div>
                                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                                        <h1 className="text-lg sm:text-2xl font-black tracking-tight text-slate-900">
                                            Inventory & Stock Management
                                        </h1>
                                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] sm:text-[10px] font-bold text-emerald-800">
                                            <Sparkles className="h-2.5 w-2.5 sm:h-3 sm:w-3" /> Live Intelligence
                                        </span>
                                    </div>
                                    <p className="mt-0.5 text-[11px] sm:text-xs text-slate-500 line-clamp-2 sm:line-clamp-none">
                                        Batch restocking, on-ground store levels, auto-deduction, reorder alerts & movement ledger
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
                                Stock Report
                            </Button>

                            <Button
                                size="sm"
                                onClick={handleOpenAddItem}
                                className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-200 font-semibold"
                            >
                                <Plus className="h-4 w-4 mr-1.5" />
                                Add Stock Item
                            </Button>
                        </div>
                    </div>

                    </div>

                    {/* Navigation Tabs */}
                    <div className="mb-4 sm:mb-6 -mx-3 px-3 sm:mx-0 sm:px-0 flex gap-1.5 sm:gap-2 overflow-x-auto pb-2 no-scrollbar">
                        <button
                            onClick={() => setActiveTab('catalog')}
                            className={`flex shrink-0 items-center gap-1.5 sm:gap-2 rounded-xl sm:rounded-2xl px-3 py-2 sm:px-4 sm:py-2.5 text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                                activeTab === 'catalog'
                                    ? 'bg-slate-900 text-white shadow-md shadow-slate-300'
                                    : 'border border-slate-200/80 bg-white text-slate-600 hover:bg-slate-50'
                            }`}
                        >
                            <Package className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${activeTab === 'catalog' ? 'text-white' : 'text-emerald-600'}`} />
                            Stock Catalog ({items.length})
                        </button>

                        <button
                            onClick={() => setActiveTab('restock')}
                            className={`flex shrink-0 items-center gap-1.5 sm:gap-2 rounded-xl sm:rounded-2xl px-3 py-2 sm:px-4 sm:py-2.5 text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                                activeTab === 'restock'
                                    ? 'bg-slate-900 text-white shadow-md shadow-slate-300'
                                    : 'border border-slate-200/80 bg-white text-slate-600 hover:bg-slate-50'
                            }`}
                        >
                            <ArrowDownRight className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${activeTab === 'restock' ? 'text-white' : 'text-blue-600'}`} />
                            Batch Restock (Stock In)
                        </button>

                        <button
                            onClick={() => setActiveTab('usage')}
                            className={`flex shrink-0 items-center gap-1.5 sm:gap-2 rounded-xl sm:rounded-2xl px-3 py-2 sm:px-4 sm:py-2.5 text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                                activeTab === 'usage'
                                    ? 'bg-slate-900 text-white shadow-md shadow-slate-300'
                                    : 'border border-slate-200/80 bg-white text-slate-600 hover:bg-slate-50'
                            }`}
                        >
                            <ArrowUpRight className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${activeTab === 'usage' ? 'text-white' : 'text-rose-600'}`} />
                            Internal Usage & Damage
                        </button>

                        <button
                            onClick={() => setActiveTab('movements')}
                            className={`flex shrink-0 items-center gap-1.5 sm:gap-2 rounded-xl sm:rounded-2xl px-3 py-2 sm:px-4 sm:py-2.5 text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                                activeTab === 'movements'
                                    ? 'bg-slate-900 text-white shadow-md shadow-slate-300'
                                    : 'border border-slate-200/80 bg-white text-slate-600 hover:bg-slate-50'
                            }`}
                        >
                            <History className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${activeTab === 'movements' ? 'text-white' : 'text-indigo-600'}`} />
                            Stock Card Ledger
                        </button>
                    </div>

                    <div className="space-y-4 sm:space-y-6">
                        {/* ─── SUMMARY KPI CARDS ─── */}
                        <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
                            <div className="rounded-xl sm:rounded-2xl border border-slate-200/80 bg-white p-3 sm:p-4 shadow-sm">
                                <div className="flex items-center justify-between text-slate-400">
                                    <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider">Total SKUs</span>
                                    <Package className="h-3.5 w-3.5 text-emerald-500" />
                                </div>
                                <p className="mono mt-0.5 sm:mt-1 text-base sm:text-lg font-black text-slate-900">
                                    {valuation?.totalSKUs || items.length} <span className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">items</span>
                                </p>
                                <p className="text-[9px] sm:text-[10px] font-semibold text-emerald-600 mt-0.5 truncate">{valuation?.totalStockQuantity || 0} units on ground</p>
                            </div>

                            <div className="rounded-xl sm:rounded-2xl border border-slate-200/80 bg-white p-3 sm:p-4 shadow-sm">
                                <div className="flex items-center justify-between text-slate-400">
                                    <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider">Stock Cost Value</span>
                                    <DollarSign className="h-3.5 w-3.5 text-blue-500" />
                                </div>
                                <p className="mono mt-0.5 sm:mt-1 text-base sm:text-lg font-black text-slate-900">{fmtCompact(valuation?.totalCostValue || 0)}</p>
                                <p className="text-[9px] sm:text-[10px] font-semibold text-blue-600 mt-0.5 truncate">Total purchase cost</p>
                            </div>

                            <div className="rounded-xl sm:rounded-2xl border border-slate-200/80 bg-white p-3 sm:p-4 shadow-sm">
                                <div className="flex items-center justify-between text-slate-400">
                                    <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider">Retail Sales Worth</span>
                                    <Tag className="h-3.5 w-3.5 text-indigo-500" />
                                </div>
                                <p className="mono mt-0.5 sm:mt-1 text-base sm:text-lg font-black text-indigo-700">{fmtCompact(valuation?.totalRetailValue || 0)}</p>
                                <p className="text-[9px] sm:text-[10px] font-semibold text-indigo-600 mt-0.5 truncate">Margin: {valuation?.potentialGrossMargin || 0}%</p>
                            </div>

                            <div className="rounded-xl sm:rounded-2xl border border-rose-100 bg-rose-50/50 p-3 sm:p-4 shadow-sm">
                                <div className="flex items-center justify-between text-rose-400">
                                    <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-rose-700">Reorder Alerts</span>
                                    <AlertTriangle className="h-3.5 w-3.5 text-rose-600" />
                                </div>
                                <div className="flex sm:block items-baseline justify-between">
                                    <p className="mono mt-0.5 sm:mt-1 text-base sm:text-lg font-black text-rose-700">
                                        {(valuation?.lowStockCount || 0) + (valuation?.outOfStockCount || 0)}
                                    </p>
                                    <p className="text-[9px] sm:text-[10px] font-semibold text-rose-600 mt-0.5">{valuation?.outOfStockCount || 0} out of stock</p>
                                </div>
                            </div>
                        </div>

                {/* ─── TAB 1: STOCK MASTER CATALOG ─── */}
                {activeTab === 'catalog' && (
                    <div className="space-y-4">
                        {/* Filters Bar */}
                        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                            <div className="relative flex-1">
                                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Search by product name, SKU, barcode, location..."
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm font-medium text-slate-800 outline-none focus:border-emerald-500 focus:bg-white transition-all"
                                />
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                                <select
                                    value={selectedCategory}
                                    onChange={e => setSelectedCategory(e.target.value)}
                                    className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 outline-none focus:border-emerald-500"
                                >
                                    <option value="ALL">All Categories</option>
                                    {CATEGORIES.map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>

                                <select
                                    value={selectedStatus}
                                    onChange={e => setSelectedStatus(e.target.value)}
                                    className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 outline-none focus:border-emerald-500"
                                >
                                    <option value="ALL">All Stock Levels</option>
                                    <option value="LOW_STOCK">⚠️ Low Stock Alert</option>
                                    <option value="OUT_OF_STOCK">⛔ Out of Stock</option>
                                    <option value="IN_STOCK">✅ Healthy Stock</option>
                                </select>

                                <div className="border-l border-slate-200 pl-2 flex items-center gap-1">
                                    <button
                                        onClick={() => setViewMode('cards')}
                                        className={cn('p-2 rounded-lg text-slate-500 transition-all', viewMode === 'cards' && 'bg-slate-100 text-emerald-600 font-bold')}
                                        title="Cards View"
                                    >
                                        <Layers className="h-4 w-4" />
                                    </button>
                                    <button
                                        onClick={() => setViewMode('table')}
                                        className={cn('p-2 rounded-lg text-slate-500 transition-all', viewMode === 'table' && 'bg-slate-100 text-emerald-600 font-bold')}
                                        title="Table View"
                                    >
                                        <SlidersHorizontal className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Catalog View */}
                        {loading ? (
                            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200/80">
                                <RefreshCw className="h-8 w-8 animate-spin text-emerald-600 mx-auto" />
                                <p className="text-sm font-medium text-slate-600 mt-3">Loading store inventory...</p>
                            </div>
                        ) : filteredItems.length === 0 ? (
                            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200/80">
                                <Boxes className="h-12 w-12 text-slate-300 mx-auto" />
                                <h3 className="text-base font-bold text-slate-800 mt-3">No Inventory Items Found</h3>
                                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                                    {searchQuery || selectedCategory !== 'ALL' || selectedStatus !== 'ALL'
                                        ? 'No items match your active filters. Try adjusting your query.'
                                        : 'No inventory items are registered yet. Click "Add Stock Item" to set up your store items.'}
                                </p>
                                <Button
                                    size="sm"
                                    onClick={handleOpenAddItem}
                                    className="mt-4 rounded-xl bg-emerald-600 text-white"
                                >
                                    <Plus className="h-4 w-4 mr-1.5" />
                                    Add First Stock Item
                                </Button>
                            </div>
                        ) : viewMode === 'cards' ? (
                            /* ─── CARDS VIEW ─── */
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {filteredItems.map(item => {
                                    const isLow = item.quantityOnHand <= item.reorderLevel && item.quantityOnHand > 0;
                                    const isOut = item.quantityOnHand <= 0;
                                    return (
                                        <div
                                            key={item.id}
                                            className={cn(
                                                'bg-white rounded-2xl border p-4 sm:p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between',
                                                isOut ? 'border-rose-200 bg-rose-50/10' :
                                                isLow ? 'border-amber-200 bg-amber-50/10' :
                                                'border-slate-200/80'
                                            )}
                                        >
                                            <div>
                                                <div className="flex items-start justify-between gap-2">
                                                    <div>
                                                        <span className="inline-block font-mono text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                                                            {item.sku}
                                                        </span>
                                                        <h3 className="text-sm sm:text-base font-bold text-slate-900 mt-1.5 line-clamp-1">
                                                            {item.name}
                                                        </h3>
                                                        <p className="text-xs text-slate-500 font-medium mt-0.5">
                                                            {item.category} • {item.unit}
                                                        </p>
                                                    </div>

                                                    <span className={cn(
                                                        'text-[11px] font-bold px-2 py-1 rounded-lg border whitespace-nowrap',
                                                        isOut ? 'bg-rose-50 text-rose-700 border-rose-200' :
                                                        isLow ? 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse' :
                                                        'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                    )}>
                                                        {isOut ? '⛔ OUT OF STOCK' : isLow ? '⚠️ REORDER ALERT' : '✅ IN STOCK'}
                                                    </span>
                                                </div>

                                                <div className="mt-4 grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs">
                                                    <div>
                                                        <span className="text-slate-400 block font-medium text-[10px] uppercase">On Ground</span>
                                                        <span className={cn(
                                                            'font-extrabold text-base',
                                                            isOut ? 'text-rose-600' : isLow ? 'text-amber-600' : 'text-slate-900'
                                                        )}>
                                                            {item.quantityOnHand} <span className="text-xs font-semibold">{item.unit}</span>
                                                        </span>
                                                    </div>

                                                    <div>
                                                        <span className="text-slate-400 block font-medium text-[10px] uppercase">Reorder Level</span>
                                                        <span className="font-bold text-slate-700 text-sm">{item.reorderLevel} {item.unit}</span>
                                                    </div>

                                                    <div>
                                                        <span className="text-slate-400 block font-medium text-[10px] uppercase">Cost / Unit</span>
                                                        <span className="font-bold text-slate-700 text-xs">{fmt(item.costPrice)}</span>
                                                    </div>

                                                    <div>
                                                        <span className="text-slate-400 block font-medium text-[10px] uppercase">POS Selling Price</span>
                                                        <span className="font-bold text-emerald-700 text-xs">{fmt(item.sellingPrice)}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                                                <div className="flex items-center gap-1.5">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleOpenRestock(item)}
                                                        className="rounded-xl text-xs font-bold text-emerald-700 border-emerald-200 hover:bg-emerald-50 h-8 px-2.5"
                                                    >
                                                        <ArrowDownRight className="h-3.5 w-3.5 mr-1" />
                                                        Restock
                                                    </Button>

                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleOpenUsage(item)}
                                                        className="rounded-xl text-xs font-semibold text-slate-700 border-slate-200 hover:bg-slate-100 h-8 px-2.5"
                                                    >
                                                        <ArrowUpRight className="h-3.5 w-3.5 mr-1" />
                                                        Usage
                                                    </Button>
                                                </div>

                                                <div className="flex items-center gap-1">
                                                    <button
                                                        onClick={() => handleViewItemMovements(item)}
                                                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                                                        title="Stock Card Ledger"
                                                    >
                                                        <History className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleOpenEditItem(item)}
                                                        className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50"
                                                        title="Edit Item"
                                                    >
                                                        <Edit3 className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteItem(item)}
                                                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                                                        title="Delete Item"
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
                                                <th className="py-3.5 px-4">SKU / Item Name</th>
                                                <th className="py-3.5 px-4">Category</th>
                                                <th className="py-3.5 px-4 text-center">Unit</th>
                                                <th className="py-3.5 px-4 text-center">On Ground</th>
                                                <th className="py-3.5 px-4 text-center">Reorder Level</th>
                                                <th className="py-3.5 px-4 text-right">Cost Price</th>
                                                <th className="py-3.5 px-4 text-right">POS Price</th>
                                                <th className="py-3.5 px-4 text-center">Status</th>
                                                <th className="py-3.5 px-4 text-center">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {filteredItems.map(item => {
                                                const isLow = item.quantityOnHand <= item.reorderLevel && item.quantityOnHand > 0;
                                                const isOut = item.quantityOnHand <= 0;
                                                return (
                                                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                                                        <td className="py-3 px-4">
                                                            <div className="font-mono text-xs font-bold text-emerald-700">{item.sku}</div>
                                                            <div className="font-bold text-slate-900 mt-0.5">{item.name}</div>
                                                        </td>
                                                        <td className="py-3 px-4 text-slate-600 font-medium">{item.category}</td>
                                                        <td className="py-3 px-4 text-center text-slate-600 font-medium">{item.unit}</td>
                                                        <td className="py-3 px-4 text-center font-extrabold text-slate-900">
                                                            <span className={cn(isOut && 'text-rose-600', isLow && 'text-amber-600')}>
                                                                {item.quantityOnHand}
                                                            </span>
                                                        </td>
                                                        <td className="py-3 px-4 text-center text-slate-500 font-medium">{item.reorderLevel}</td>
                                                        <td className="py-3 px-4 text-right font-medium text-slate-600">{fmt(item.costPrice)}</td>
                                                        <td className="py-3 px-4 text-right font-bold text-emerald-700">{fmt(item.sellingPrice)}</td>
                                                        <td className="py-3 px-4 text-center">
                                                            <span className={cn(
                                                                'text-[10px] font-bold px-2 py-0.5 rounded-md border inline-block',
                                                                isOut ? 'bg-rose-50 text-rose-700 border-rose-200' :
                                                                isLow ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                                                'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                            )}>
                                                                {isOut ? 'OUT OF STOCK' : isLow ? 'LOW STOCK' : 'IN STOCK'}
                                                            </span>
                                                        </td>
                                                        <td className="py-3 px-4 text-center">
                                                            <div className="flex items-center justify-center gap-1">
                                                                <button
                                                                    onClick={() => handleOpenRestock(item)}
                                                                    className="px-2 py-1 rounded-lg text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100"
                                                                >
                                                                    Restock
                                                                </button>
                                                                <button
                                                                    onClick={() => handleOpenUsage(item)}
                                                                    className="px-2 py-1 rounded-lg text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200"
                                                                >
                                                                    Usage
                                                                </button>
                                                                <button
                                                                    onClick={() => handleViewItemMovements(item)}
                                                                    className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
                                                                >
                                                                    <History className="h-3.5 w-3.5" />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleOpenEditItem(item)}
                                                                    className="p-1 rounded-lg text-slate-400 hover:text-emerald-600"
                                                                >
                                                                    <Edit3 className="h-3.5 w-3.5" />
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

                {/* ─── TAB 2: BATCH RESTOCK (STOCK IN) ─── */}
                {activeTab === 'restock' && (
                    <div className="space-y-6">
                        <div className="bg-gradient-to-br from-emerald-900 to-teal-900 text-white rounded-3xl p-6 sm:p-8 shadow-lg">
                            <span className="text-xs font-bold uppercase tracking-widest text-emerald-300">
                                Stock In & Procurement Intake
                            </span>
                            <h2 className="text-xl sm:text-2xl font-extrabold mt-1">
                                Batch Stock Intake & Weighted Costing
                            </h2>
                            <p className="text-xs sm:text-sm text-emerald-200 mt-2 max-w-2xl leading-relaxed">
                                Enter newly purchased stock batches (e.g. 40 cartons of books today, more added tomorrow). The store automatically increments remaining ground stock and recalculates weighted average unit cost.
                            </p>
                        </div>

                        {/* Quick Action Grid to Restock Any Item */}
                        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
                            <h3 className="text-base font-bold text-slate-900 mb-3">Select Stock Item to Restock</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                {items.slice(0, 9).map(item => (
                                    <div
                                        key={item.id}
                                        onClick={() => handleOpenRestock(item)}
                                        className="p-3.5 rounded-xl border border-slate-200/80 hover:border-emerald-500 hover:bg-emerald-50/20 cursor-pointer transition-all flex items-center justify-between"
                                    >
                                        <div>
                                            <div className="font-bold text-slate-800 text-sm">{item.name}</div>
                                            <div className="text-xs text-slate-500">
                                                On Ground: <span className="font-semibold text-slate-800">{item.quantityOnHand} {item.unit}</span>
                                            </div>
                                        </div>
                                        <ArrowDownRight className="h-5 w-5 text-emerald-600" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* ─── TAB 3: INTERNAL USAGE & DAMAGE LOG ─── */}
                {activeTab === 'usage' && (
                    <div className="space-y-6">
                        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 text-white rounded-3xl p-6 sm:p-8 shadow-lg shadow-blue-500/10">
                            <span className="inline-block px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-widest bg-white/20 text-white backdrop-blur-sm">
                                Internal School Consumption
                            </span>
                            <h2 className="text-xl sm:text-2xl font-extrabold mt-2 text-white">
                                Stock Out, Classroom Distribution & Damage Log
                            </h2>
                            <p className="text-xs sm:text-sm text-blue-100 mt-2 max-w-2xl leading-relaxed font-medium">
                                Record consumable dispatches to teachers, science laboratories, classroom sets, or damaged goods. Stock deductions immediately update available store inventory.
                            </p>
                        </div>

                        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
                            <h3 className="text-base font-bold text-slate-900 mb-3">Select Item for Internal Distribution / Damage</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                {items.slice(0, 9).map(item => (
                                    <div
                                        key={item.id}
                                        onClick={() => handleOpenUsage(item)}
                                        className="p-3.5 rounded-xl border border-slate-200/80 hover:border-rose-400 hover:bg-rose-50/20 cursor-pointer transition-all flex items-center justify-between"
                                    >
                                        <div>
                                            <div className="font-bold text-slate-800 text-sm">{item.name}</div>
                                            <div className="text-xs text-slate-500">
                                                Available: <span className="font-semibold text-slate-800">{item.quantityOnHand} {item.unit}</span>
                                            </div>
                                        </div>
                                        <ArrowUpRight className="h-5 w-5 text-rose-500" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* ─── TAB 4: STOCK MOVEMENT LEDGER (STOCK CARD) ─── */}
                {activeTab === 'movements' && (
                    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
                        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
                            <div>
                                <h3 className="text-base font-bold text-slate-900">Stock Movement Audit Trail</h3>
                                <p className="text-xs text-slate-500 font-medium">Real-time ledger of restocks, POS sales deductions, usages and returns</p>
                            </div>
                        </div>

                        {movements.length === 0 ? (
                            <div className="p-12 text-center">
                                <History className="h-10 w-10 text-slate-300 mx-auto" />
                                <p className="text-sm font-semibold text-slate-700 mt-2">No stock movements recorded yet</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs sm:text-sm">
                                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[11px]">
                                        <tr>
                                            <th className="py-3 px-4">Date / Time</th>
                                            <th className="py-3 px-4">Item Name & SKU</th>
                                            <th className="py-3 px-4">Movement Type</th>
                                            <th className="py-3 px-4 text-center">Change</th>
                                            <th className="py-3 px-4 text-center">Previous $\rightarrow$ New</th>
                                            <th className="py-3 px-4">Reason / Reference</th>
                                            <th className="py-3 px-4">User</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {movements.map(mov => {
                                            const isAdd = mov.quantityChange > 0;
                                            return (
                                                <tr key={mov.id} className="hover:bg-slate-50/80 transition-colors">
                                                    <td className="py-3 px-4 font-mono text-xs text-slate-600">
                                                        {new Date(mov.createdAt).toLocaleString('en-NG')}
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <div className="font-bold text-slate-900">{mov.item?.name || 'Item'}</div>
                                                        <div className="font-mono text-[11px] text-emerald-700">{mov.item?.sku}</div>
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <span className={cn(
                                                            'px-2 py-0.5 rounded-md text-[10px] font-bold border',
                                                            mov.type === 'RESTOCK' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                                            mov.type === 'POS_SALE' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                                                            mov.type === 'USAGE' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                                            mov.type === 'RETURN' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                                            'bg-rose-50 text-rose-700 border-rose-200'
                                                        )}>
                                                            {mov.type}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-4 text-center font-extrabold">
                                                        <span className={isAdd ? 'text-emerald-600' : 'text-rose-600'}>
                                                            {isAdd ? `+${mov.quantityChange}` : mov.quantityChange}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-4 text-center font-semibold text-slate-700">
                                                        {mov.previousQuantity} $\rightarrow$ <span className="font-bold text-slate-900">{mov.newQuantity}</span>
                                                    </td>
                                                    <td className="py-3 px-4 text-slate-600 text-xs max-w-xs truncate">
                                                        {mov.reason || 'N/A'}
                                                    </td>
                                                    <td className="py-3 px-4 text-slate-500 text-xs">
                                                        {mov.performedBy || 'System'}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* ─── MODAL: ADD / EDIT ITEM ─── */}
            <AnimatePresence>
                {showItemModal && (
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
                                        <Boxes className="h-5 w-5 text-blue-200" />
                                        {editingItem ? 'Edit Inventory Item' : 'Add New Inventory Item'}
                                    </h3>
                                    <p className="text-xs text-blue-100 font-medium mt-0.5">
                                        Set up catalog product details, pricing, units, and safety reorder alerts
                                    </p>
                                </div>
                                <button
                                    onClick={() => setShowItemModal(false)}
                                    className="p-2 rounded-xl text-blue-100 hover:text-white hover:bg-white/15 transition-all"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmitItem} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <Label className="text-xs font-bold text-slate-700">SKU / Product Code</Label>
                                        <input
                                            type="text"
                                            className={inputCls}
                                            value={itemForm.sku}
                                            onChange={e => setItemForm({ ...itemForm, sku: e.target.value })}
                                            placeholder="e.g. BK-MTH-JSS1"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <Label className="text-xs font-bold text-slate-700">Barcode / EAN (Optional)</Label>
                                        <input
                                            type="text"
                                            className={inputCls}
                                            value={itemForm.barcode}
                                            onChange={e => setItemForm({ ...itemForm, barcode: e.target.value })}
                                            placeholder="Scan or enter barcode"
                                        />
                                    </div>

                                    <div className="sm:col-span-2">
                                        <Label className="text-xs font-bold text-slate-700">Item Name</Label>
                                        <input
                                            type="text"
                                            className={inputCls}
                                            value={itemForm.name}
                                            onChange={e => setItemForm({ ...itemForm, name: e.target.value })}
                                            placeholder="e.g. Mathematics for Junior Secondary 1 (40 Cartons / Pack)"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <Label className="text-xs font-bold text-slate-700">Category</Label>
                                        <select
                                            className={inputCls}
                                            value={itemForm.category}
                                            onChange={e => setItemForm({ ...itemForm, category: e.target.value })}
                                        >
                                            {CATEGORIES.map(c => (
                                                <option key={c} value={c}>{c}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <Label className="text-xs font-bold text-slate-700">Unit of Measurement</Label>
                                        <select
                                            className={inputCls}
                                            value={itemForm.unit}
                                            onChange={e => setItemForm({ ...itemForm, unit: e.target.value })}
                                        >
                                            {UNITS.map(u => (
                                                <option key={u} value={u}>{u}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <Label className="text-xs font-bold text-slate-700">Purchase / Cost Price (₦)</Label>
                                        <input
                                            type="number"
                                            min="0"
                                            className={inputCls}
                                            value={itemForm.costPrice}
                                            onChange={e => setItemForm({ ...itemForm, costPrice: e.target.value })}
                                            placeholder="e.g. 1500"
                                        />
                                    </div>

                                    <div>
                                        <Label className="text-xs font-bold text-slate-700">POS Selling Price (₦)</Label>
                                        <input
                                            type="number"
                                            min="0"
                                            className={inputCls}
                                            value={itemForm.sellingPrice}
                                            onChange={e => setItemForm({ ...itemForm, sellingPrice: e.target.value })}
                                            placeholder="e.g. 2500"
                                        />
                                    </div>

                                    {!editingItem && (
                                        <div>
                                            <Label className="text-xs font-bold text-slate-700">Initial Quantity On Ground</Label>
                                            <input
                                                type="number"
                                                min="0"
                                                className={inputCls}
                                                value={itemForm.initialQuantity}
                                                onChange={e => setItemForm({ ...itemForm, initialQuantity: parseInt(e.target.value) || 0 })}
                                            />
                                        </div>
                                    )}

                                    <div>
                                        <Label className="text-xs font-bold text-slate-700">Reorder Alert Threshold</Label>
                                        <input
                                            type="number"
                                            min="1"
                                            className={inputCls}
                                            value={itemForm.reorderLevel}
                                            onChange={e => setItemForm({ ...itemForm, reorderLevel: parseInt(e.target.value) || 10 })}
                                            placeholder="Alert when stock falls below"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <Label className="text-xs font-bold text-slate-700">Storage Location</Label>
                                        <input
                                            type="text"
                                            className={inputCls}
                                            value={itemForm.location}
                                            onChange={e => setItemForm({ ...itemForm, location: e.target.value })}
                                            placeholder="e.g. Main Store Shelf B2, Tuck Shop"
                                        />
                                    </div>
                                </div>

                                <label className="flex items-center gap-2.5 cursor-pointer bg-emerald-50/60 p-3 rounded-xl border border-emerald-100">
                                    <input
                                        type="checkbox"
                                        checked={itemForm.isSellable}
                                        onChange={e => setItemForm({ ...itemForm, isSellable: e.target.checked })}
                                        className="h-4 w-4 rounded text-emerald-600 focus:ring-emerald-500"
                                    />
                                    <span className="text-xs font-medium text-emerald-950">
                                        Make available for Point of Sale (POS) store checkout
                                    </span>
                                </label>

                                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setShowItemModal(false)}
                                        className="rounded-xl border-slate-200"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={submitting}
                                        className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 shadow-md shadow-emerald-200"
                                    >
                                        {submitting ? 'Saving...' : editingItem ? 'Update Item' : 'Create Item'}
                                    </Button>
                                </div>
                            </form>
                            </motion.div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ─── MODAL: BATCH RESTOCK (STOCK IN) ─── */}
            <AnimatePresence>
                {showRestockModal && selectedItem && (
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
                                        <ArrowDownRight className="h-5 w-5 text-blue-200" />
                                        Restock Batch Intake
                                    </h3>
                                    <p className="text-xs text-blue-100 font-medium mt-0.5">
                                        Adding stock for {selectedItem.name} ({selectedItem.sku})
                                    </p>
                                </div>
                                <button
                                    onClick={() => setShowRestockModal(false)}
                                    className="p-2 rounded-xl text-blue-100 hover:text-white hover:bg-white/15 transition-all"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmitRestock} className="p-6 space-y-4">
                                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center justify-between">
                                    <div>
                                        <span className="text-xs text-slate-500 font-medium">Current On Ground</span>
                                        <div className="text-lg font-extrabold text-slate-800">
                                            {selectedItem.quantityOnHand} {selectedItem.unit}
                                        </div>
                                    </div>
                                    <div>
                                        <span className="text-xs text-slate-500 font-medium">Current Cost / Unit</span>
                                        <div className="text-sm font-bold text-slate-800">{fmt(selectedItem.costPrice)}</div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label className="text-xs font-bold text-slate-700">Quantity Added ({selectedItem.unit})</Label>
                                        <input
                                            type="number"
                                            min="1"
                                            className={inputCls}
                                            value={restockForm.quantityAdded}
                                            onChange={e => setRestockForm({ ...restockForm, quantityAdded: e.target.value })}
                                            placeholder="e.g. 40"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <Label className="text-xs font-bold text-slate-700">Purchase Unit Cost (₦)</Label>
                                        <input
                                            type="number"
                                            min="0"
                                            className={inputCls}
                                            value={restockForm.unitCost}
                                            onChange={e => setRestockForm({ ...restockForm, unitCost: e.target.value })}
                                            placeholder={selectedItem.costPrice.toString()}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label className="text-xs font-bold text-slate-700">Supplier / Vendor</Label>
                                        <input
                                            type="text"
                                            className={inputCls}
                                            value={restockForm.supplier}
                                            onChange={e => setRestockForm({ ...restockForm, supplier: e.target.value })}
                                            placeholder="e.g. LearnAfrica Publishers"
                                        />
                                    </div>

                                    <div>
                                        <Label className="text-xs font-bold text-slate-700">Invoice / Receipt Ref</Label>
                                        <input
                                            type="text"
                                            className={inputCls}
                                            value={restockForm.invoiceRef}
                                            onChange={e => setRestockForm({ ...restockForm, invoiceRef: e.target.value })}
                                            placeholder="e.g. INV-9902"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <Label className="text-xs font-bold text-slate-700">Received By</Label>
                                    <input
                                        type="text"
                                        className={inputCls}
                                        value={restockForm.receivedBy}
                                        onChange={e => setRestockForm({ ...restockForm, receivedBy: e.target.value })}
                                        placeholder="Storekeeper Name"
                                    />
                                </div>

                                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setShowRestockModal(false)}
                                        className="rounded-xl border-slate-200"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={submitting}
                                        className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 shadow-md shadow-emerald-200"
                                    >
                                        {submitting ? 'Processing...' : 'Confirm Restock'}
                                    </Button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ─── MODAL: RECORD USAGE / DAMAGE ─── */}
            <AnimatePresence>
                {showUsageModal && selectedItem && (
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
                                        <ArrowUpRight className="h-5 w-5 text-blue-200" />
                                        Record Stock Deduction
                                    </h3>
                                    <p className="text-xs text-blue-100 font-medium mt-0.5">
                                        For {selectedItem.name} ({selectedItem.quantityOnHand} {selectedItem.unit} available)
                                    </p>
                                </div>
                                <button
                                    onClick={() => setShowUsageModal(false)}
                                    className="p-2 rounded-xl text-blue-100 hover:text-white hover:bg-white/15 transition-all"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmitUsage} className="p-6 space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label className="text-xs font-bold text-slate-700">Quantity to Deduct</Label>
                                        <input
                                            type="number"
                                            min="1"
                                            max={selectedItem.quantityOnHand}
                                            className={inputCls}
                                            value={usageForm.quantity}
                                            onChange={e => setUsageForm({ ...usageForm, quantity: e.target.value })}
                                            placeholder="e.g. 5"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <Label className="text-xs font-bold text-slate-700">Deduction Type</Label>
                                        <select
                                            className={inputCls}
                                            value={usageForm.type}
                                            onChange={e => setUsageForm({ ...usageForm, type: e.target.value })}
                                        >
                                            <option value="USAGE">Classroom / Dept Usage</option>
                                            <option value="DAMAGE">Damaged Goods</option>
                                            <option value="EXPIRED">Expired Stock</option>
                                            <option value="ADJUSTMENT">Audit Adjustment</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <Label className="text-xs font-bold text-slate-700">Reason / Beneficiary Department</Label>
                                    <input
                                        type="text"
                                        className={inputCls}
                                        value={usageForm.reason}
                                        onChange={e => setUsageForm({ ...usageForm, reason: e.target.value })}
                                        placeholder="e.g. Distributed to JSS 2 class teachers"
                                        required
                                    />
                                </div>

                                <div>
                                    <Label className="text-xs font-bold text-slate-700">Authorized / Performed By</Label>
                                    <input
                                        type="text"
                                        className={inputCls}
                                        value={usageForm.performedBy}
                                        onChange={e => setUsageForm({ ...usageForm, performedBy: e.target.value })}
                                        placeholder="Staff Name"
                                    />
                                </div>

                                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setShowUsageModal(false)}
                                        className="rounded-xl border-slate-200"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={submitting}
                                        className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold px-6 shadow-md shadow-rose-200"
                                    >
                                        {submitting ? 'Recording...' : 'Deduct Stock'}
                                    </Button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ─── MODAL: ITEM MOVEMENTS (STOCK CARD) ─── */}
            <AnimatePresence>
                {showMovementsModal && selectedItem && (
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
                            className="w-full max-w-2xl bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden"
                        >
                            <div className="px-6 py-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 text-white flex items-center justify-between shadow-md">
                                <div>
                                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                        <History className="h-5 w-5 text-blue-200" />
                                        Stock Card History
                                    </h3>
                                    <p className="text-xs text-blue-100 font-medium mt-0.5">
                                        Audit movements for {selectedItem.name} ({selectedItem.sku})
                                    </p>
                                </div>
                                <button
                                    onClick={() => setShowMovementsModal(false)}
                                    className="p-2 rounded-xl text-blue-100 hover:text-white hover:bg-white/15 transition-all"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            <div className="p-6 max-h-[65vh] overflow-y-auto space-y-3">
                                {itemMovementsList.length === 0 ? (
                                    <p className="text-center text-xs text-slate-500 py-8">No movements logged yet.</p>
                                ) : (
                                    itemMovementsList.map(mov => (
                                        <div
                                            key={mov.id}
                                            className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50 flex items-center justify-between text-xs"
                                        >
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className={cn(
                                                        'font-bold px-2 py-0.5 rounded-md text-[10px]',
                                                        mov.type === 'RESTOCK' ? 'bg-emerald-100 text-emerald-800' :
                                                        mov.type === 'POS_SALE' ? 'bg-indigo-100 text-indigo-800' :
                                                        'bg-amber-100 text-amber-800'
                                                    )}>
                                                        {mov.type}
                                                    </span>
                                                    <span className="font-semibold text-slate-700">{mov.reason}</span>
                                                </div>
                                                <div className="text-[11px] text-slate-400 mt-1">
                                                    {new Date(mov.createdAt).toLocaleString('en-NG')} • By {mov.performedBy || 'System'}
                                                </div>
                                            </div>

                                            <div className="text-right">
                                                <div className={cn('font-extrabold text-sm', mov.quantityChange > 0 ? 'text-emerald-600' : 'text-rose-600')}>
                                                    {mov.quantityChange > 0 ? `+${mov.quantityChange}` : mov.quantityChange} {selectedItem.unit}
                                                </div>
                                                <div className="text-[10px] text-slate-500 font-medium">
                                                    {mov.previousQuantity} $\rightarrow$ {mov.newQuantity} on ground
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
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
