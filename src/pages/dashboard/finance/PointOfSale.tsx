import { useState, useEffect, useMemo, useRef } from 'react';
import {
    ShoppingCart, Search, Plus, Minus, Trash2, CreditCard,
    DollarSign, ArrowRightLeft, Wallet, User, CheckCircle2,
    Printer, RefreshCw, X, Receipt, History, AlertCircle,
    ChevronRight, Sparkles, Building2, Store, Tag, Check,
    SlidersHorizontal, ArrowUpDown, Clock
} from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Label } from '../../../components/ui/label';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { cn } from '../../../lib/utils';
import { toast } from 'sonner';

// ─── TYPES & INTERFACES ──────────────────────────────────────────────────────

interface CatalogItem {
    id: string;
    name: string;
    sku: string;
    barcode?: string | null;
    category: string;
    unit: string;
    costPrice: number;
    sellingPrice: number;
    quantityOnHand: number;
    reorderLevel: number;
    isLowStock: boolean;
    isOutOfStock: boolean;
}

interface CartItem {
    item: CatalogItem;
    quantity: number;
    unitPrice: number;
    discount: number;
}

interface StudentSearchResult {
    id: string;
    userId: string;
    name: string;
    email: string;
    admissionNumber: string;
    className: string;
    walletBalance: number;
    isWalletFrozen: boolean;
    walletId: string | null;
}

interface PosSaleRecord {
    id: string;
    saleNumber: string;
    customerType: string;
    customerName: string;
    studentAdmNo?: string | null;
    studentClass?: string | null;
    cashierName: string;
    subtotal: number;
    discount: number;
    tax: number;
    totalAmount: number;
    amountPaid: number;
    change: number;
    paymentMethod: string;
    paymentReference?: string | null;
    status: string;
    createdAt: string;
    items: {
        id: string;
        itemName: string;
        sku?: string | null;
        unitPrice: number;
        quantity: number;
        discount: number;
        totalPrice: number;
    }[];
}

interface DailySummary {
    date: string;
    totalTransactions: number;
    completedCount: number;
    voidedCount: number;
    totalRevenue: number;
    cashTotal: number;
    posCardTotal: number;
    transferTotal: number;
    walletTotal: number;
}

function fmt(n: number) {
    return '₦' + (n || 0).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtCompact(n: number) {
    if (!n) return '₦0';
    if (n >= 1e9) return '₦' + (n / 1e9).toFixed(2).replace(/\.00$/, '') + 'B';
    if (n >= 1e6) return '₦' + (n / 1e6).toFixed(2).replace(/\.00$/, '') + 'M';
    if (n >= 1e3) return '₦' + (n / 1e3).toFixed(2).replace(/\.00$/, '') + 'K';
    return '₦' + n.toLocaleString('en-NG');
}

export default function PointOfSale() {
    const [catalog, setCatalog] = useState<CatalogItem[]>([]);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeCategory, setActiveCategory] = useState('ALL');
    const [searchQuery, setSearchQuery] = useState('');

    // Customer & Payment state
    const [customerType, setCustomerType] = useState<'WALK_IN' | 'STUDENT' | 'STAFF' | 'PARENT'>('WALK_IN');
    const [customerName, setCustomerName] = useState('');
    const [studentSearch, setStudentSearch] = useState('');
    const [studentResults, setStudentResults] = useState<StudentSearchResult[]>([]);
    const [selectedStudent, setSelectedStudent] = useState<StudentSearchResult | null>(null);
    const [searchingStudents, setSearchingStudents] = useState(false);

    const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'POS' | 'TRANSFER' | 'WALLET'>('CASH');
    const [amountTendered, setAmountTendered] = useState<string>('');
    const [discountOverall, setDiscountOverall] = useState<string>('0');
    const [taxOverall, setTaxOverall] = useState<string>('0');
    const [paymentNotes, setPaymentNotes] = useState('');
    const [submittingSale, setSubmittingSale] = useState(false);

    // Sales History & Receipt Modals
    const [activeView, setActiveView] = useState<'terminal' | 'history' | 'summary'>('terminal');
    const [salesHistory, setSalesHistory] = useState<PosSaleRecord[]>([]);
    const [dailySummary, setDailySummary] = useState<DailySummary | null>(null);
    const [selectedSaleForReceipt, setSelectedSaleForReceipt] = useState<PosSaleRecord | null>(null);
    const [receiptFormat, setReceiptFormat] = useState<'thermal' | 'a4'>('thermal');
    const [showReceiptModal, setShowReceiptModal] = useState(false);
    const [mobileCartOpen, setMobileCartOpen] = useState(false);

    const receiptRef = useRef<HTMLDivElement>(null);

    // Fetch Sellable Catalog
    const fetchCatalog = async () => {
        try {
            setLoading(true);
            const res = await axios.get('/api/v1/pos/catalog');
            setCatalog(res.data.items || []);
        } catch (error: any) {
            console.error('Failed to load POS catalog:', error);
            toast.error(error?.response?.data?.msg || 'Failed to load POS catalog');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const fetchSalesHistory = async () => {
        try {
            const [salesRes, summaryRes] = await Promise.all([
                axios.get('/api/v1/pos/sales?timeRange=TODAY'),
                axios.get('/api/v1/pos/sales/daily-summary')
            ]);
            setSalesHistory(salesRes.data.sales || []);
            setDailySummary(summaryRes.data.summary || null);
        } catch (e) {
            console.error('Failed to fetch sales history:', e);
        }
    };

    useEffect(() => {
        fetchCatalog();
        fetchSalesHistory();
    }, []);

    const handleRefresh = () => {
        setRefreshing(true);
        fetchCatalog();
        fetchSalesHistory();
    };

    // Student Search Debounce
    useEffect(() => {
        if (!studentSearch || studentSearch.length < 2) {
            setStudentResults([]);
            return;
        }
        const timer = setTimeout(async () => {
            try {
                setSearchingStudents(true);
                const res = await axios.get(`/api/v1/pos/students/search?q=${encodeURIComponent(studentSearch)}`);
                setStudentResults(res.data.students || []);
            } catch (e) {
                console.error(e);
            } finally {
                setSearchingStudents(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [studentSearch]);

    // Filtered Items for POS
    const filteredCatalog = useMemo(() => {
        return catalog.filter(item => {
            const matchesSearch = !searchQuery ||
                item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (item.barcode && item.barcode.toLowerCase().includes(searchQuery.toLowerCase()));

            const matchesCategory = activeCategory === 'ALL' || item.category === activeCategory;
            return matchesSearch && matchesCategory;
        });
    }, [catalog, searchQuery, activeCategory]);

    // Categories in Catalog
    const categoriesList = useMemo(() => {
        const set = new Set<string>();
        catalog.forEach(item => set.add(item.category));
        return ['ALL', ...Array.from(set)];
    }, [catalog]);

    // Cart Management
    const addToCart = (item: CatalogItem) => {
        if (item.quantityOnHand <= 0) {
            toast.error(`"${item.name}" is currently out of stock`);
            return;
        }

        const existing = cart.find(c => c.item.id === item.id);
        if (existing) {
            if (existing.quantity >= item.quantityOnHand) {
                toast.error(`Cannot add more. Only ${item.quantityOnHand} available on ground.`);
                return;
            }
            setCart(cart.map(c => c.item.id === item.id ? { ...c, quantity: c.quantity + 1 } : c));
        } else {
            setCart([...cart, { item, quantity: 1, unitPrice: item.sellingPrice, discount: 0 }]);
        }
    };

    const updateCartQty = (itemId: string, newQty: number) => {
        const cartItem = cart.find(c => c.item.id === itemId);
        if (!cartItem) return;

        if (newQty <= 0) {
            removeFromCart(itemId);
            return;
        }

        if (newQty > cartItem.item.quantityOnHand) {
            toast.error(`Only ${cartItem.item.quantityOnHand} units available in stock`);
            return;
        }

        setCart(cart.map(c => c.item.id === itemId ? { ...c, quantity: newQty } : c));
    };

    const removeFromCart = (itemId: string) => {
        setCart(cart.filter(c => c.item.id !== itemId));
    };

    const clearCart = () => {
        setCart([]);
        setSelectedStudent(null);
        setCustomerName('');
        setStudentSearch('');
        setAmountTendered('');
        setDiscountOverall('0');
        setPaymentNotes('');
    };

    // Calculate totals
    const cartSubtotal = useMemo(() => {
        return cart.reduce((acc, c) => acc + (c.unitPrice * c.quantity - c.discount), 0);
    }, [cart]);

    const numDiscount = Number(discountOverall) || 0;
    const numTax = Number(taxOverall) || 0;
    const grandTotal = Math.max(0, cartSubtotal - numDiscount + numTax);

    const tenderedNum = amountTendered ? Number(amountTendered) : grandTotal;
    const changeDue = Math.max(0, tenderedNum - grandTotal);

    // Fast Barcode Scanner / SKU handler
    const handleBarcodeKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const query = searchQuery.trim().toLowerCase();
            if (!query) return;

            const exactMatch = catalog.find(i =>
                i.barcode?.toLowerCase() === query ||
                i.sku.toLowerCase() === query ||
                i.name.toLowerCase() === query
            );

            if (exactMatch) {
                addToCart(exactMatch);
                setSearchQuery('');
                toast.success(`Added ${exactMatch.name} to cart`);
            } else if (filteredCatalog.length === 1) {
                addToCart(filteredCatalog[0]);
                setSearchQuery('');
                toast.success(`Added ${filteredCatalog[0].name} to cart`);
            }
        }
    };

    // Process Sale
    const handleProcessSale = async () => {
        if (cart.length === 0) {
            toast.error('Cart is empty. Add items to checkout.');
            return;
        }

        if (paymentMethod === 'WALLET') {
            if (!selectedStudent) {
                toast.error('Please select a student to pay using student wallet');
                return;
            }
            if (selectedStudent.walletBalance < grandTotal) {
                toast.error(`Insufficient student wallet balance (₦${selectedStudent.walletBalance.toLocaleString()})`);
                return;
            }
        }

        try {
            setSubmittingSale(true);
            const payload = {
                items: cart.map(c => ({
                    itemId: c.item.id,
                    quantity: c.quantity,
                    unitPrice: c.unitPrice,
                    discount: c.discount
                })),
                customerType,
                studentId: selectedStudent?.id,
                customerName: selectedStudent ? selectedStudent.name : customerName || 'Walk-in Customer',
                paymentMethod,
                discount: numDiscount,
                tax: numTax,
                amountPaid: tenderedNum,
                notes: paymentNotes
            };

            const res = await axios.post('/api/v1/pos/checkout', payload);
            toast.success(`Sale #${res.data.sale.saleNumber} completed!`);

            setSelectedSaleForReceipt(res.data.sale);
            setShowReceiptModal(true);
            clearCart();
            setMobileCartOpen(false);

            fetchCatalog();
            fetchSalesHistory();
        } catch (error: any) {
            toast.error(error?.response?.data?.msg || 'Checkout failed');
        } finally {
            setSubmittingSale(false);
        }
    };

    // Void Sale
    const handleVoidSale = async (sale: PosSaleRecord) => {
        const reason = window.prompt(`Enter reason for voiding POS Sale #${sale.saleNumber}:`);
        if (!reason) return;

        try {
            await axios.post(`/api/v1/pos/sales/${sale.id}/void`, { reason });
            toast.success(`Sale #${sale.saleNumber} voided and stock restored`);
            fetchSalesHistory();
            fetchCatalog();
        } catch (error: any) {
            toast.error(error?.response?.data?.msg || 'Failed to void sale');
        }
    };

    // Print Receipt
    const handlePrintReceipt = () => {
        window.print();
    };

    // Category colour palette for dots
    const categoryColours: Record<string, string> = {
        'Textbooks & Workbooks': 'bg-blue-500',
        'Stationery': 'bg-amber-500',
        'Uniforms': 'bg-emerald-500',
        'Food & Snacks': 'bg-orange-500',
        'Sports & PE': 'bg-rose-500',
        'Art & Craft': 'bg-purple-500',
        'Electronics': 'bg-cyan-500',
        'Boarding Supplies': 'bg-teal-500',
        'ALL': 'bg-indigo-500',
    };
    const getCatColour = (cat: string) => categoryColours[cat] ?? 'bg-slate-400';

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=DM+Mono:wght@400;500;600&display=swap');
                .fd-root, .fd-root * { font-family: 'Plus Jakarta Sans', sans-serif !important; }
                .fd-root .mono { font-family: 'DM Mono', monospace !important; }
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
            
            <div className="fd-root min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-indigo-50/30 pb-28 md:pb-8">
                <div className="pointer-events-none fixed inset-0 opacity-[0.22]" style={{ backgroundImage: 'radial-gradient(circle,#94a3b8 1px,transparent 1px)', backgroundSize: '28px 28px' }} />
                <div className="relative z-10">
                    
                    {/* ══════════════════ HEADER ══════════════════ */}
                    <div className="bg-white/90 border-b border-slate-200/80 shadow-sm backdrop-blur-xl mb-4 sm:mb-6 rounded-b-3xl sm:rounded-b-3xl">
                        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
                            {/* Top bar */}
                            <div className="flex items-center justify-between gap-2 py-4">
                                {/* Title */}
                                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                                    <div className="h-9 w-9 sm:h-11 sm:w-11 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-indigo-300/40 shrink-0 text-white">
                                        <Store className="h-5 w-5 sm:h-6 sm:w-6" />
                                    </div>
                                    <div className="min-w-0">
                                        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                                            <h1 className="text-sm sm:text-lg font-black tracking-tight text-slate-900 truncate">Point of Sale</h1>
                                            <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-indigo-100 px-2 py-0.5 text-[9px] sm:text-[10px] font-bold text-indigo-800">
                                                <Sparkles className="h-2.5 w-2.5 sm:h-3 sm:w-3" /> Live Intelligence
                                            </span>
                                        </div>
                                        <p className="mt-0.5 text-[10px] sm:text-[11px] text-slate-500 font-medium hidden sm:block">School store · Instant stock deduction · Receipt printing</p>
                                    </div>
                                </div>

                                {/* Live daily stats — hidden on mobile */}
                                {dailySummary && (
                                    <div className="hidden lg:flex items-center gap-2 text-xs">
                                        <div className="px-3 py-1.5 rounded-xl border border-slate-200/80 shadow-sm bg-white">
                                            <span className="text-[9px] sm:text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Revenue</span>
                                            <span className="mono font-black text-slate-900">{fmtCompact(dailySummary.totalRevenue)}</span>
                                        </div>
                                        <div className="px-3 py-1.5 rounded-xl border border-slate-200/80 shadow-sm bg-white">
                                            <span className="text-[9px] sm:text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Sales</span>
                                            <span className="mono font-black text-slate-900">{dailySummary.completedCount}</span> <span className="text-[9px] text-slate-500 font-semibold uppercase">txns</span>
                                        </div>
                                        <div className="px-3 py-1.5 rounded-xl border border-slate-200/80 shadow-sm bg-white">
                                            <span className="text-[9px] sm:text-[10px] text-slate-400 font-bold uppercase tracking-wider block">In Cart</span>
                                            <span className="mono font-black text-indigo-600">{cart.reduce((a, c) => a + c.quantity, 0)}</span> <span className="text-[9px] text-slate-500 font-semibold uppercase">items</span>
                                        </div>
                                    </div>
                                )}

                                {/* Right actions */}
                                <div className="flex items-center gap-1.5 shrink-0">
                                    {/* Desktop view switcher */}
                                    <div className="hidden md:flex items-center gap-1.5">
                                        <button
                                            onClick={() => setActiveView('terminal')}
                                            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all font-bold text-xs ${
                                                activeView === 'terminal' ? 'bg-slate-900 text-white shadow-md shadow-slate-300' : 'border border-slate-200/80 bg-white text-slate-600 hover:bg-slate-50'
                                            }`}
                                        >
                                            <Store className={`h-3.5 w-3.5 ${activeView === 'terminal' ? 'text-white' : 'text-indigo-600'}`} /> Terminal
                                        </button>
                                        <button
                                            onClick={() => setActiveView('history')}
                                            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all font-bold text-xs ${
                                                activeView === 'history' ? 'bg-slate-900 text-white shadow-md shadow-slate-300' : 'border border-slate-200/80 bg-white text-slate-600 hover:bg-slate-50'
                                            }`}
                                        >
                                            <History className={`h-3.5 w-3.5 ${activeView === 'history' ? 'text-white' : 'text-indigo-600'}`} /> History
                                            {salesHistory.length > 0 && <span className={cn("text-[9px] font-extrabold rounded-full px-1.5 py-0.5 ml-0.5", activeView === 'history' ? "bg-white/20 text-white" : "bg-indigo-100 text-indigo-700")}>{salesHistory.length}</span>}
                                        </button>
                                    </div>

                                    <button
                                        onClick={handleRefresh}
                                        disabled={refreshing}
                                        className="h-8 w-8 rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 flex items-center justify-center transition-all"
                                    >
                                        <RefreshCw className={cn('h-3.5 w-3.5', refreshing && 'animate-spin text-indigo-600')} />
                                    </button>

                                    {/* Mobile cart button */}
                                    <button
                                        onClick={() => setMobileCartOpen(true)}
                                        className="md:hidden relative h-8 px-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex items-center gap-1.5 font-bold text-xs shadow-sm shadow-indigo-400/30"
                                    >
                                        <ShoppingCart className="h-4 w-4" />
                                        Cart
                                        {cart.length > 0 && (
                                            <span className="h-4 min-w-[16px] px-1 bg-rose-500 text-white text-[9px] font-extrabold rounded-full flex items-center justify-center">
                                                {cart.reduce((a, c) => a + c.quantity, 0)}
                                            </span>
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Mobile tab bar */}
                            <div className="md:hidden flex gap-1.5 pb-3 overflow-x-auto no-scrollbar">
                                <button
                                    onClick={() => setActiveView('terminal')}
                                    className={`flex shrink-0 items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                                        activeView === 'terminal' ? 'bg-slate-900 text-white shadow-md shadow-slate-300' : 'border border-slate-200/80 bg-white text-slate-600 hover:bg-slate-50'
                                    }`}
                                >
                                    <Store className={`h-3.5 w-3.5 ${activeView === 'terminal' ? 'text-white' : 'text-indigo-600'}`} /> Terminal
                                </button>
                                <button
                                    onClick={() => setActiveView('history')}
                                    className={`flex shrink-0 items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                                        activeView === 'history' ? 'bg-slate-900 text-white shadow-md shadow-slate-300' : 'border border-slate-200/80 bg-white text-slate-600 hover:bg-slate-50'
                                    }`}
                                >
                                    <History className={`h-3.5 w-3.5 ${activeView === 'history' ? 'text-white' : 'text-indigo-600'}`} /> History ({salesHistory.length})
                                </button>
                            </div>
                        </div>
                    </div>

            {/* ══════════════════ MAIN CONTENT ══════════════════ */}
            <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6">

                {/* ─────────── TERMINAL VIEW ─────────── */}
                {activeView === 'terminal' && (
                    <div className="flex flex-col md:grid md:grid-cols-12 gap-4 sm:gap-5 items-start">

                        {/* LEFT — Catalog */}
                        <div className="w-full md:col-span-7 space-y-3">

                            {/* Search bar */}
                            <div className="relative">
                                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                                <input
                                    type="text"
                                    placeholder="Search by name, SKU or scan barcode — ↵ to add"
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    onKeyDown={handleBarcodeKeyDown}
                                    className="w-full pl-10 pr-10 py-2.5 sm:py-3 rounded-2xl border border-slate-200 bg-white text-sm font-medium text-slate-800 placeholder-slate-400 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 shadow-sm transition-all"
                                />
                                {searchQuery && (
                                    <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded-lg">
                                        <X className="h-4 w-4" />
                                    </button>
                                )}
                            </div>

                            {/* Category chips */}
                            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
                                {categoriesList.map(cat => (
                                    <button
                                        key={cat}
                                        onClick={() => setActiveCategory(cat)}
                                        className={cn(
                                            'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap border transition-all shrink-0',
                                            activeCategory === cat
                                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-300/40'
                                                : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300 hover:text-indigo-600'
                                        )}
                                    >
                                        <span className={cn('h-2 w-2 rounded-full shrink-0', activeCategory === cat ? 'bg-white/60' : getCatColour(cat))} />
                                        {cat}
                                    </button>
                                ))}
                            </div>

                            {/* Product grid */}
                            {loading ? (
                                <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
                                    <RefreshCw className="h-7 w-7 animate-spin text-indigo-500 mx-auto" />
                                    <p className="text-sm text-slate-500 font-medium mt-3">Loading items…</p>
                                </div>
                            ) : filteredCatalog.length === 0 ? (
                                <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
                                    <Store className="h-9 w-9 text-slate-300 mx-auto mb-2" />
                                    <p className="text-sm font-bold text-slate-700">No items found</p>
                                    <p className="text-xs text-slate-400 mt-0.5">Try a different search or category</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3">
                                    {filteredCatalog.map(item => {
                                        const isOut = item.quantityOnHand <= 0;
                                        const isLow = !isOut && item.quantityOnHand <= item.reorderLevel;
                                        const cartQty = cart.find(c => c.item.id === item.id)?.quantity ?? 0;
                                        return (
                                            <motion.div
                                                key={item.id}
                                                layout
                                                whileTap={!isOut ? { scale: 0.97 } : {}}
                                                onClick={() => !isOut && addToCart(item)}
                                                className={cn(
                                                    'relative bg-white rounded-2xl border p-3 sm:p-3.5 shadow-sm flex flex-col justify-between transition-all cursor-pointer select-none group overflow-hidden',
                                                    isOut
                                                        ? 'opacity-50 cursor-not-allowed border-slate-200 bg-slate-50'
                                                        : cartQty > 0
                                                        ? 'border-indigo-400 ring-2 ring-indigo-100 shadow-indigo-100/50'
                                                        : 'border-slate-200 hover:border-indigo-300 hover:shadow-md hover:shadow-indigo-50'
                                                )}
                                            >
                                                {/* Category accent bar */}
                                                <div className={cn('absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl', getCatColour(item.category))} />

                                                {/* In-cart quantity badge */}
                                                {cartQty > 0 && (
                                                    <span className="absolute top-2 right-2 h-5 w-5 bg-indigo-600 text-white text-[10px] font-extrabold rounded-full flex items-center justify-center shadow-md z-10">
                                                        {cartQty}
                                                    </span>
                                                )}

                                                {/* Item info */}
                                                <div className="pt-1">
                                                    <span className="font-mono text-[9px] sm:text-[10px] text-slate-400 font-semibold">{item.sku}</span>
                                                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 mt-0.5 line-clamp-2 leading-snug pr-4">
                                                        {item.name}
                                                    </h4>
                                                </div>

                                                {/* Bottom row */}
                                                <div className="mt-3 flex items-end justify-between gap-1">
                                                    <div>
                                                        <p className="text-sm sm:text-base font-extrabold text-slate-900">{fmt(item.sellingPrice)}</p>
                                                        <span className={cn(
                                                            'text-[9px] font-bold uppercase tracking-wide',
                                                            isOut ? 'text-rose-500' : isLow ? 'text-amber-500' : 'text-slate-400'
                                                        )}>
                                                            {isOut ? '✕ Out of stock' : isLow ? `⚠ ${item.quantityOnHand} left` : `${item.quantityOnHand} ${item.unit}`}
                                                        </span>
                                                    </div>
                                                    <div className={cn(
                                                        'h-7 w-7 sm:h-8 sm:w-8 rounded-xl flex items-center justify-center transition-all shrink-0',
                                                        isOut ? 'bg-slate-100 text-slate-300' : 'bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white shadow-sm'
                                                    )}>
                                                        <Plus className="h-3.5 w-3.5" />
                                                    </div>
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* RIGHT — Cart & Checkout (tablet/desktop) */}
                        <div className="hidden md:flex md:col-span-5 flex-col bg-white rounded-3xl border border-slate-200 shadow-md overflow-hidden">
                            {/* Cart header */}
                            <div className="px-5 py-4 bg-gradient-to-r from-blue-600 to-indigo-700 flex items-center justify-between shrink-0">
                                <div className="flex items-center gap-2 text-white">
                                    <ShoppingCart className="h-5 w-5" />
                                    <span className="font-bold text-sm">Cart & Checkout</span>
                                    {cart.length > 0 && (
                                        <span className="bg-white/20 text-white text-xs font-extrabold px-2 py-0.5 rounded-full">
                                            {cart.reduce((a, c) => a + c.quantity, 0)} items
                                        </span>
                                    )}
                                </div>
                                {cart.length > 0 && (
                                    <button onClick={clearCart} className="text-[11px] text-rose-200 hover:text-white font-bold bg-white/10 px-2 py-1 rounded-lg transition-all">
                                        Clear
                                    </button>
                                )}
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                {/* Customer */}
                                <div className="space-y-2.5">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Customer</span>
                                        <div className="flex items-center gap-0.5 bg-slate-100 p-0.5 rounded-lg text-[11px] font-bold">
                                            <button
                                                onClick={() => { setCustomerType('WALK_IN'); setSelectedStudent(null); }}
                                                className={cn('px-2.5 py-1 rounded-md transition-all', customerType === 'WALK_IN' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700')}
                                            >Walk-in</button>
                                            <button
                                                onClick={() => setCustomerType('STUDENT')}
                                                className={cn('px-2.5 py-1 rounded-md transition-all', customerType === 'STUDENT' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700')}
                                            >Student</button>
                                        </div>
                                    </div>

                                    {customerType === 'STUDENT' ? (
                                        selectedStudent ? (
                                            <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-3 flex items-start justify-between gap-2">
                                                <div>
                                                    <p className="font-bold text-slate-900 text-xs">{selectedStudent.name}</p>
                                                    <p className="text-[11px] text-slate-500">{selectedStudent.admissionNumber} · {selectedStudent.className}</p>
                                                    <p className="text-xs font-extrabold text-indigo-600 mt-1">Wallet: {fmt(selectedStudent.walletBalance)}</p>
                                                </div>
                                                <button onClick={() => setSelectedStudent(null)} className="text-slate-400 hover:text-rose-600 p-1 mt-0.5 transition-all">
                                                    <X className="h-4 w-4" />
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="relative">
                                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                                                <input
                                                    type="text"
                                                    placeholder="Search student name or admission #…"
                                                    value={studentSearch}
                                                    onChange={e => setStudentSearch(e.target.value)}
                                                    className="w-full pl-8 pr-8 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 outline-none focus:border-indigo-400 focus:bg-white transition-all"
                                                />
                                                {searchingStudents && <RefreshCw className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 animate-spin text-indigo-500" />}
                                                {studentResults.length > 0 && (
                                                    <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl z-30 max-h-44 overflow-y-auto divide-y divide-slate-100">
                                                        {studentResults.map(s => (
                                                            <div key={s.id} onClick={() => { setSelectedStudent(s); setStudentSearch(''); setStudentResults([]); }} className="p-2.5 hover:bg-indigo-50 cursor-pointer flex items-center justify-between text-xs transition-all">
                                                                <div>
                                                                    <p className="font-bold text-slate-900">{s.name}</p>
                                                                    <p className="text-[10px] text-slate-500">{s.admissionNumber} · {s.className}</p>
                                                                </div>
                                                                <span className="font-bold text-indigo-600">{fmt(s.walletBalance)}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    ) : (
                                        <input
                                            type="text"
                                            placeholder="Customer name (optional)"
                                            value={customerName}
                                            onChange={e => setCustomerName(e.target.value)}
                                            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 outline-none focus:border-indigo-400 focus:bg-white transition-all"
                                        />
                                    )}
                                </div>

                                {/* Cart items */}
                                <div>
                                    <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400 block mb-2">
                                        Items ({cart.reduce((a, c) => a + c.quantity, 0)})
                                    </span>
                                    {cart.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                            <ShoppingCart className="h-8 w-8 text-slate-300 mb-2" />
                                            <p className="text-xs font-semibold text-slate-400">Cart is empty</p>
                                            <p className="text-[11px] text-slate-400">Tap a product to add it</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-1.5 max-h-52 overflow-y-auto pr-0.5">
                                            {cart.map(c => (
                                                <div key={c.item.id} className="flex items-center gap-2 p-2 rounded-xl hover:bg-slate-50 transition-all group">
                                                    <div className={cn('h-2 w-2 rounded-full shrink-0', getCatColour(c.item.category))} />
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-xs font-bold text-slate-900 truncate">{c.item.name}</p>
                                                        <p className="text-[11px] text-slate-500">{fmt(c.unitPrice)} each</p>
                                                    </div>
                                                    <div className="flex items-center gap-1 shrink-0">
                                                        <button onClick={() => updateCartQty(c.item.id, c.quantity - 1)} className="h-6 w-6 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-all">
                                                            <Minus className="h-2.5 w-2.5" />
                                                        </button>
                                                        <span className="w-5 text-center text-xs font-extrabold text-slate-900">{c.quantity}</span>
                                                        <button onClick={() => updateCartQty(c.item.id, c.quantity + 1)} className="h-6 w-6 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-all">
                                                            <Plus className="h-2.5 w-2.5" />
                                                        </button>
                                                    </div>
                                                    <p className="text-xs font-extrabold text-slate-900 min-w-[52px] text-right">{fmt(c.unitPrice * c.quantity)}</p>
                                                    <button onClick={() => removeFromCart(c.item.id)} className="text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all p-0.5">
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Payment method */}
                                <div>
                                    <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400 block mb-2">Payment</span>
                                    <div className="grid grid-cols-2 gap-1.5">
                                        {[
                                            { id: 'CASH', label: 'Cash', icon: <DollarSign className="h-3.5 w-3.5" />, colour: 'emerald' },
                                            { id: 'POS', label: 'POS Card', icon: <CreditCard className="h-3.5 w-3.5" />, colour: 'indigo' },
                                            { id: 'TRANSFER', label: 'Transfer', icon: <ArrowRightLeft className="h-3.5 w-3.5" />, colour: 'blue' },
                                            { id: 'WALLET', label: 'Wallet', icon: <Wallet className="h-3.5 w-3.5" />, colour: 'purple', disabled: !selectedStudent },
                                        ].map(m => (
                                            <button
                                                key={m.id}
                                                onClick={() => !m.disabled && setPaymentMethod(m.id as any)}
                                                disabled={!!m.disabled}
                                                className={cn(
                                                    'flex items-center justify-center gap-1.5 p-2.5 rounded-xl border text-xs font-bold transition-all',
                                                    paymentMethod === m.id
                                                        ? m.colour === 'emerald' ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm shadow-emerald-300/40'
                                                        : m.colour === 'indigo' ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-300/40'
                                                        : m.colour === 'blue' ? 'bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-300/40'
                                                        : 'bg-purple-600 text-white border-purple-600 shadow-sm shadow-purple-300/40'
                                                        : m.disabled ? 'bg-slate-50 text-slate-300 border-slate-200 cursor-not-allowed'
                                                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                                                )}
                                            >
                                                {m.icon}{m.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Cash tendered */}
                                {paymentMethod === 'CASH' && (
                                    <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                                        <div>
                                            <Label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Tendered (₦)</Label>
                                            <input
                                                type="number"
                                                value={amountTendered}
                                                onChange={e => setAmountTendered(e.target.value)}
                                                placeholder={grandTotal.toString()}
                                                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-bold outline-none focus:border-indigo-400 transition-all"
                                            />
                                        </div>
                                        <div>
                                            <Label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Change (₦)</Label>
                                            <div className="px-2.5 py-1.5 rounded-lg border border-emerald-200 bg-emerald-50 text-xs font-extrabold text-emerald-700">
                                                {fmt(changeDue)}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Totals + CTA (fixed footer) */}
                            <div className="px-4 py-4 border-t border-slate-100 bg-white space-y-3 shrink-0">
                                <div className="flex items-center justify-between text-xs text-slate-500">
                                    <span>Subtotal</span>
                                    <span className="font-bold text-slate-800">{fmt(cartSubtotal)}</span>
                                </div>
                                <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                                    <span className="text-base font-extrabold text-slate-900">Grand Total</span>
                                    <span className="text-xl font-extrabold text-indigo-700">{fmt(grandTotal)}</span>
                                </div>
                                <Button
                                    disabled={cart.length === 0 || submittingSale}
                                    onClick={handleProcessSale}
                                    className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-extrabold text-sm shadow-lg shadow-indigo-400/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {submittingSale ? <RefreshCw className="h-4 w-4 animate-spin" /> : <><CheckCircle2 className="h-4 w-4" /> Complete Sale · {fmt(grandTotal)}</>}
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ─────────── HISTORY VIEW ─────────── */}
                {activeView === 'history' && (
                    <div className="space-y-4">

                        {/* Stat cards */}
                        {dailySummary && (
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
                                {[
                                    { label: "Today's Revenue", value: fmt(dailySummary.totalRevenue), sub: `${dailySummary.completedCount} sales`, colour: 'indigo', icon: <Receipt className="h-4 w-4" /> },
                                    { label: 'Cash Drawer', value: fmt(dailySummary.cashTotal), sub: 'Physical cash', colour: 'emerald', icon: <DollarSign className="h-4 w-4" /> },
                                    { label: 'POS & Transfer', value: fmt(dailySummary.posCardTotal + dailySummary.transferTotal), sub: 'Electronic', colour: 'blue', icon: <CreditCard className="h-4 w-4" /> },
                                    { label: 'Student Wallets', value: fmt(dailySummary.walletTotal), sub: 'Wallet debits', colour: 'purple', icon: <Wallet className="h-4 w-4" /> },
                                ].map(s => (
                                    <div key={s.label} className="bg-white rounded-2xl border border-slate-200 p-3.5 sm:p-4 shadow-sm flex items-start gap-3">
                                        <div className={cn('h-9 w-9 rounded-xl flex items-center justify-center shrink-0 text-white',
                                            s.colour === 'indigo' ? 'bg-indigo-100 text-indigo-600' :
                                            s.colour === 'emerald' ? 'bg-emerald-100 text-emerald-600' :
                                            s.colour === 'blue' ? 'bg-blue-100 text-blue-600' :
                                            'bg-purple-100 text-purple-600'
                                        )}>{s.icon}</div>
                                        <div className="min-w-0">
                                            <p className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase truncate">{s.label}</p>
                                            <p className={cn('text-base sm:text-xl font-extrabold truncate mt-0.5',
                                                s.colour === 'indigo' ? 'text-indigo-700' :
                                                s.colour === 'emerald' ? 'text-emerald-700' :
                                                s.colour === 'blue' ? 'text-blue-700' :
                                                'text-purple-700'
                                            )}>{s.value}</p>
                                            <p className="text-[10px] text-slate-400 truncate">{s.sub}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Transactions */}
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="px-4 sm:px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
                                <div>
                                    <h3 className="text-sm font-bold text-slate-900">Today's Transactions</h3>
                                    <p className="text-[11px] text-slate-400">Reprint receipts · Void sales · Audit trail</p>
                                </div>
                                {salesHistory.length > 0 && (
                                    <span className="bg-indigo-50 text-indigo-700 text-xs font-bold px-2.5 py-1 rounded-xl border border-indigo-100">
                                        {salesHistory.length} records
                                    </span>
                                )}
                            </div>

                            {salesHistory.length === 0 ? (
                                <div className="py-14 text-center">
                                    <Receipt className="h-9 w-9 text-slate-300 mx-auto mb-2" />
                                    <p className="text-sm font-semibold text-slate-600">No transactions today</p>
                                    <p className="text-xs text-slate-400 mt-0.5">Sales will appear here once processed</p>
                                </div>
                            ) : (
                                <>
                                    {/* Mobile card feed */}
                                    <div className="divide-y divide-slate-100 sm:hidden">
                                        {salesHistory.map(sale => (
                                            <div key={sale.id} className="p-3.5 space-y-2.5">
                                                <div className="flex items-start justify-between gap-2">
                                                    <div>
                                                        <span className="font-mono text-xs font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">{sale.saleNumber}</span>
                                                        <p className="font-bold text-slate-900 text-xs mt-1">{sale.customerName}</p>
                                                        {sale.studentAdmNo && <p className="text-[10px] text-slate-500">{sale.studentAdmNo} · {sale.studentClass}</p>}
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="font-extrabold text-slate-900 text-sm">{fmt(sale.totalAmount)}</p>
                                                        <span className={cn('text-[9px] font-bold px-1.5 py-0.5 rounded border inline-block mt-0.5',
                                                            sale.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'
                                                        )}>{sale.status}</span>
                                                    </div>
                                                </div>
                                                <p className="text-[11px] text-slate-500 line-clamp-1 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
                                                    {sale.items?.map(i => `${i.quantity}× ${i.itemName}`).join(', ')}
                                                </p>
                                                <div className="flex items-center justify-between text-[11px]">
                                                    <span className="text-slate-400">{new Date(sale.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · {sale.paymentMethod}</span>
                                                    <div className="flex gap-1">
                                                        <button onClick={() => { setSelectedSaleForReceipt(sale); setShowReceiptModal(true); }} className="flex items-center gap-1 px-2.5 py-1 bg-indigo-50 text-indigo-700 font-bold rounded-lg text-xs hover:bg-indigo-100 transition-all">
                                                            <Printer className="h-3 w-3" /> Receipt
                                                        </button>
                                                        {sale.status === 'COMPLETED' && (
                                                            <button onClick={() => handleVoidSale(sale)} className="px-2.5 py-1 bg-rose-50 text-rose-600 font-bold rounded-lg text-xs hover:bg-rose-100 transition-all">Void</button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Desktop table */}
                                    <div className="hidden sm:block overflow-x-auto">
                                        <table className="w-full text-left text-xs">
                                            <thead className="bg-slate-50 border-b border-slate-200 text-slate-400 font-semibold uppercase text-[10px] tracking-wide">
                                                <tr>
                                                    <th className="py-3 px-4">Receipt / Time</th>
                                                    <th className="py-3 px-4">Customer</th>
                                                    <th className="py-3 px-4">Items</th>
                                                    <th className="py-3 px-4">Method</th>
                                                    <th className="py-3 px-4 text-right">Total</th>
                                                    <th className="py-3 px-4 text-center">Status</th>
                                                    <th className="py-3 px-4 text-center">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {salesHistory.map(sale => (
                                                    <tr key={sale.id} className="hover:bg-slate-50/60 transition-colors">
                                                        <td className="py-3 px-4">
                                                            <p className="font-mono text-xs font-bold text-indigo-600">{sale.saleNumber}</p>
                                                            <p className="text-[11px] text-slate-400">{new Date(sale.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · {sale.cashierName}</p>
                                                        </td>
                                                        <td className="py-3 px-4">
                                                            <p className="font-bold text-slate-900">{sale.customerName}</p>
                                                            {sale.studentAdmNo && <p className="text-[11px] text-slate-400">{sale.studentAdmNo} · {sale.studentClass}</p>}
                                                        </td>
                                                        <td className="py-3 px-4 text-slate-500 max-w-[200px] truncate">{sale.items?.map(i => `${i.quantity}× ${i.itemName}`).join(', ')}</td>
                                                        <td className="py-3 px-4">
                                                            <span className="bg-slate-100 text-slate-700 font-bold text-[11px] px-2 py-0.5 rounded-lg">{sale.paymentMethod}</span>
                                                        </td>
                                                        <td className="py-3 px-4 text-right font-extrabold text-slate-900">{fmt(sale.totalAmount)}</td>
                                                        <td className="py-3 px-4 text-center">
                                                            <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-md border',
                                                                sale.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'
                                                            )}>{sale.status}</span>
                                                        </td>
                                                        <td className="py-3 px-4">
                                                            <div className="flex items-center justify-center gap-1.5">
                                                                <button onClick={() => { setSelectedSaleForReceipt(sale); setShowReceiptModal(true); }} className="p-1.5 rounded-lg text-indigo-600 hover:bg-indigo-50 transition-all" title="Reprint">
                                                                    <Printer className="h-4 w-4" />
                                                                </button>
                                                                {sale.status === 'COMPLETED' && (
                                                                    <button onClick={() => handleVoidSale(sale)} className="px-2 py-1 rounded-lg text-rose-500 hover:bg-rose-50 text-xs font-bold transition-all" title="Void">Void</button>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* ══════════════════ RECEIPT MODAL ══════════════════ */}
            <AnimatePresence>
                {showReceiptModal && selectedSaleForReceipt && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm overflow-y-auto">
                        <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} className="w-full max-w-lg bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden my-8">
                            <div className="px-5 py-4 bg-gradient-to-r from-blue-600 to-indigo-700 text-white flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Receipt className="h-5 w-5 text-blue-200" />
                                    <h3 className="text-sm font-bold">POS Receipt</h3>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="flex items-center bg-black/20 p-0.5 rounded-xl text-xs backdrop-blur-sm">
                                        <button onClick={() => setReceiptFormat('thermal')} className={cn('px-2.5 py-1 rounded-lg font-bold transition-all', receiptFormat === 'thermal' ? 'bg-white text-indigo-700 shadow-sm' : 'text-blue-100 hover:text-white')}>80mm</button>
                                        <button onClick={() => setReceiptFormat('a4')} className={cn('px-2.5 py-1 rounded-lg font-bold transition-all', receiptFormat === 'a4' ? 'bg-white text-indigo-700 shadow-sm' : 'text-blue-100 hover:text-white')}>A4</button>
                                    </div>
                                    <button onClick={() => setShowReceiptModal(false)} className="p-1.5 rounded-xl text-blue-100 hover:text-white hover:bg-white/15 transition-all"><X className="h-5 w-5" /></button>
                                </div>
                            </div>

                            <div className="p-6 bg-slate-100 flex justify-center max-h-[65vh] overflow-y-auto">
                                <div ref={receiptRef} className={cn('bg-white text-slate-900 shadow-md p-5 font-mono', receiptFormat === 'thermal' ? 'w-[320px] text-xs rounded-none border border-dashed border-slate-300' : 'w-full text-sm rounded-2xl border border-slate-200')}>
                                    <div className="text-center pb-4 border-b border-dashed border-slate-300 space-y-0.5">
                                        <h2 className="text-base font-extrabold uppercase tracking-wide">SKOOLY SCHOOL STORE</h2>
                                        <p className="text-[11px] text-slate-500">Point of Sale & Tuck Shop</p>
                                        <p className="text-[10px] text-slate-400">Receipt #{selectedSaleForReceipt.saleNumber}</p>
                                        <p className="text-[10px] text-slate-400">{new Date(selectedSaleForReceipt.createdAt).toLocaleString('en-NG')}</p>
                                    </div>
                                    <div className="py-3 border-b border-dashed border-slate-300 text-[11px] space-y-0.5">
                                        <div className="flex justify-between"><span className="text-slate-500">Cashier:</span><span className="font-bold">{selectedSaleForReceipt.cashierName}</span></div>
                                        <div className="flex justify-between"><span className="text-slate-500">Customer:</span><span className="font-bold">{selectedSaleForReceipt.customerName}</span></div>
                                        {selectedSaleForReceipt.studentAdmNo && <div className="flex justify-between"><span className="text-slate-500">Adm/Class:</span><span className="font-semibold">{selectedSaleForReceipt.studentAdmNo} ({selectedSaleForReceipt.studentClass})</span></div>}
                                    </div>
                                    <div className="py-3 border-b border-dashed border-slate-300 space-y-2 text-[11px]">
                                        <div className="flex justify-between font-bold text-slate-400 text-[10px] uppercase"><span>Item / Qty</span><span>Total</span></div>
                                        {selectedSaleForReceipt.items?.map((item, idx) => (
                                            <div key={idx} className="flex justify-between items-baseline">
                                                <div className="pr-2"><p className="font-bold">{item.itemName}</p><p className="text-[10px] text-slate-500">{item.quantity} × {fmt(item.unitPrice)}</p></div>
                                                <span className="font-bold">{fmt(item.totalPrice)}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="py-3 border-b border-dashed border-slate-300 space-y-1 text-xs">
                                        <div className="flex justify-between"><span className="text-slate-500">Subtotal:</span><span className="font-semibold">{fmt(selectedSaleForReceipt.subtotal)}</span></div>
                                        {selectedSaleForReceipt.discount > 0 && <div className="flex justify-between text-rose-600"><span>Discount:</span><span>-{fmt(selectedSaleForReceipt.discount)}</span></div>}
                                        <div className="flex justify-between font-extrabold pt-1 border-t border-slate-200 text-sm"><span>TOTAL PAID:</span><span className="text-indigo-700">{fmt(selectedSaleForReceipt.totalAmount)}</span></div>
                                    </div>
                                    <div className="pt-3 text-[11px] space-y-0.5">
                                        <div className="flex justify-between"><span className="text-slate-500">Method:</span><span className="font-bold">{selectedSaleForReceipt.paymentMethod}</span></div>
                                        <div className="flex justify-between"><span className="text-slate-500">Tendered:</span><span>{fmt(selectedSaleForReceipt.amountPaid)}</span></div>
                                        <div className="flex justify-between font-bold text-emerald-700"><span>Change:</span><span>{fmt(selectedSaleForReceipt.change)}</span></div>
                                    </div>
                                    <div className="text-center pt-6 text-[10px] text-slate-400"><p>Thank you for your purchase!</p><p className="pt-0.5">Please retain this receipt for records.</p></div>
                                </div>
                            </div>

                            <div className="px-5 py-3.5 bg-white border-t border-slate-100 flex items-center justify-between">
                                <Button variant="outline" onClick={() => setShowReceiptModal(false)} className="rounded-xl border-slate-200 text-slate-700">Close</Button>
                                <Button onClick={handlePrintReceipt} className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-sm flex items-center gap-2">
                                    <Printer className="h-4 w-4" /> Print Receipt
                                </Button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ══════════════════ MOBILE: FLOATING CHECKOUT BAR ══════════════════ */}
            <AnimatePresence>
                {activeView === 'terminal' && cart.length > 0 && (
                    <motion.div
                        initial={{ y: 80, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 80, opacity: 0 }}
                        transition={{ type: 'spring', damping: 22, stiffness: 200 }}
                        className="fixed bottom-0 left-0 right-0 z-40 md:hidden px-3 pb-4 pt-2 bg-gradient-to-t from-[#f5f6fa] via-[#f5f6fa]/90 to-transparent pointer-events-none"
                    >
                        <button
                            onClick={() => setMobileCartOpen(true)}
                            className="pointer-events-auto w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 text-white rounded-2xl p-3.5 shadow-2xl shadow-indigo-500/40 flex items-center justify-between border border-white/10 active:scale-[0.99] transition-all"
                        >
                            <div className="flex items-center gap-3">
                                <div className="relative h-10 w-10 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
                                    <ShoppingCart className="h-5 w-5 text-white" />
                                    <span className="absolute -top-1.5 -right-1.5 h-5 min-w-[20px] px-1 bg-rose-500 text-white text-[10px] font-extrabold rounded-full flex items-center justify-center border-2 border-indigo-700">
                                        {cart.reduce((a, c) => a + c.quantity, 0)}
                                    </span>
                                </div>
                                <div>
                                    <p className="text-[11px] text-blue-200 font-medium">{cart.length} {cart.length === 1 ? 'product' : 'products'} in cart</p>
                                    <p className="text-base font-extrabold text-white leading-none">{fmt(grandTotal)}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1.5 bg-white text-indigo-700 font-extrabold text-xs px-4 py-2 rounded-xl shadow-sm">
                                Checkout <ChevronRight className="h-4 w-4" />
                            </div>
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ══════════════════ MOBILE: CART SLIDE-UP DRAWER ══════════════════ */}
            <AnimatePresence>
                {mobileCartOpen && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-end md:hidden bg-black/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 26, stiffness: 240 }}
                            className="w-full bg-white rounded-t-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden"
                        >
                            {/* Drawer header */}
                            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-5 py-4 shrink-0">
                                <div className="w-10 h-1 bg-white/40 rounded-full mx-auto mb-3" />
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-white">
                                        <ShoppingCart className="h-5 w-5" />
                                        <div>
                                            <h3 className="font-bold text-base text-white">Checkout</h3>
                                            <p className="text-[11px] text-blue-200">{cart.reduce((a, c) => a + c.quantity, 0)} items · {fmt(grandTotal)}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {cart.length > 0 && <button onClick={clearCart} className="text-[11px] text-rose-200 hover:text-white font-bold bg-white/10 px-2.5 py-1 rounded-lg">Clear</button>}
                                        <button onClick={() => setMobileCartOpen(false)} className="p-1.5 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-all"><X className="h-5 w-5" /></button>
                                    </div>
                                </div>
                            </div>

                            {/* Scrollable content */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                {/* Customer */}
                                <div className="space-y-2.5">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Customer</span>
                                        <div className="flex items-center gap-0.5 bg-slate-100 p-0.5 rounded-lg text-[11px] font-bold">
                                            <button onClick={() => { setCustomerType('WALK_IN'); setSelectedStudent(null); }} className={cn('px-2.5 py-1 rounded-md transition-all', customerType === 'WALK_IN' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500')}>Walk-in</button>
                                            <button onClick={() => setCustomerType('STUDENT')} className={cn('px-2.5 py-1 rounded-md transition-all', customerType === 'STUDENT' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500')}>Student</button>
                                        </div>
                                    </div>
                                    {customerType === 'STUDENT' ? (
                                        selectedStudent ? (
                                            <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-3 flex items-start justify-between gap-2">
                                                <div>
                                                    <p className="font-bold text-slate-900 text-xs">{selectedStudent.name}</p>
                                                    <p className="text-[11px] text-slate-500">{selectedStudent.admissionNumber} · {selectedStudent.className}</p>
                                                    <p className="text-xs font-extrabold text-indigo-600 mt-1">Wallet: {fmt(selectedStudent.walletBalance)}</p>
                                                </div>
                                                <button onClick={() => setSelectedStudent(null)} className="text-slate-400 hover:text-rose-600 p-1 transition-all"><X className="h-4 w-4" /></button>
                                            </div>
                                        ) : (
                                            <div className="relative">
                                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                                                <input type="text" placeholder="Search student…" value={studentSearch} onChange={e => setStudentSearch(e.target.value)} className="w-full pl-8 pr-8 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 outline-none focus:border-indigo-400 transition-all" />
                                                {searchingStudents && <RefreshCw className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 animate-spin text-indigo-500" />}
                                                {studentResults.length > 0 && (
                                                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-30 max-h-40 overflow-y-auto divide-y divide-slate-100">
                                                        {studentResults.map(s => (
                                                            <div key={s.id} onClick={() => { setSelectedStudent(s); setStudentSearch(''); setStudentResults([]); }} className="p-2.5 hover:bg-indigo-50 cursor-pointer flex items-center justify-between text-xs">
                                                                <div><p className="font-bold text-slate-900">{s.name}</p><p className="text-[10px] text-slate-500">{s.admissionNumber}</p></div>
                                                                <span className="font-bold text-indigo-600">{fmt(s.walletBalance)}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    ) : (
                                        <input type="text" placeholder="Customer name (optional)" value={customerName} onChange={e => setCustomerName(e.target.value)} className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 outline-none focus:border-indigo-400 transition-all" />
                                    )}
                                </div>

                                {/* Cart items */}
                                <div>
                                    <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400 block mb-2">Items</span>
                                    {cart.length === 0 ? (
                                        <div className="text-center py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                            <ShoppingCart className="h-7 w-7 text-slate-300 mx-auto mb-1" />
                                            <p className="text-xs text-slate-400 font-semibold">Cart is empty</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-1.5 max-h-44 overflow-y-auto pr-0.5">
                                            {cart.map(c => (
                                                <div key={c.item.id} className="flex items-center gap-2 p-2 rounded-xl border border-slate-100 bg-slate-50">
                                                    <div className={cn('h-2 w-2 rounded-full shrink-0', getCatColour(c.item.category))} />
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-xs font-bold text-slate-900 truncate">{c.item.name}</p>
                                                        <p className="text-[10px] text-slate-500">{fmt(c.unitPrice)}</p>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <button onClick={() => updateCartQty(c.item.id, c.quantity - 1)} className="h-6 w-6 rounded-lg bg-white border border-slate-200 flex items-center justify-center"><Minus className="h-2.5 w-2.5" /></button>
                                                        <span className="w-5 text-center text-xs font-extrabold">{c.quantity}</span>
                                                        <button onClick={() => updateCartQty(c.item.id, c.quantity + 1)} className="h-6 w-6 rounded-lg bg-white border border-slate-200 flex items-center justify-center"><Plus className="h-2.5 w-2.5" /></button>
                                                    </div>
                                                    <p className="text-xs font-extrabold text-slate-900 min-w-[48px] text-right">{fmt(c.unitPrice * c.quantity)}</p>
                                                    <button onClick={() => removeFromCart(c.item.id)} className="text-slate-300 hover:text-rose-500 transition-all p-0.5"><Trash2 className="h-3.5 w-3.5" /></button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Payment */}
                                <div>
                                    <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400 block mb-2">Payment</span>
                                    <div className="grid grid-cols-2 gap-1.5">
                                        {[
                                            { id: 'CASH', label: 'Cash', icon: <DollarSign className="h-3.5 w-3.5" />, active: 'bg-emerald-600 text-white border-emerald-600' },
                                            { id: 'POS', label: 'POS Card', icon: <CreditCard className="h-3.5 w-3.5" />, active: 'bg-indigo-600 text-white border-indigo-600' },
                                            { id: 'TRANSFER', label: 'Transfer', icon: <ArrowRightLeft className="h-3.5 w-3.5" />, active: 'bg-blue-600 text-white border-blue-600' },
                                            { id: 'WALLET', label: 'Wallet', icon: <Wallet className="h-3.5 w-3.5" />, active: 'bg-purple-600 text-white border-purple-600', disabled: !selectedStudent },
                                        ].map(m => (
                                            <button key={m.id} onClick={() => !m.disabled && setPaymentMethod(m.id as any)} disabled={!!m.disabled}
                                                className={cn('flex items-center justify-center gap-1.5 p-2.5 rounded-xl border text-xs font-bold transition-all',
                                                    paymentMethod === m.id ? m.active : m.disabled ? 'bg-slate-50 text-slate-300 border-slate-200 cursor-not-allowed' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                                                )}>
                                                {m.icon}{m.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {paymentMethod === 'CASH' && (
                                    <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                                        <div>
                                            <Label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Tendered (₦)</Label>
                                            <input type="number" value={amountTendered} onChange={e => setAmountTendered(e.target.value)} placeholder={grandTotal.toString()} className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-bold outline-none focus:border-indigo-400" />
                                        </div>
                                        <div>
                                            <Label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Change (₦)</Label>
                                            <div className="px-2.5 py-1.5 rounded-lg border border-emerald-200 bg-emerald-50 text-xs font-extrabold text-emerald-700">{fmt(changeDue)}</div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="px-4 py-4 border-t border-slate-100 bg-white space-y-3 shrink-0">
                                <div className="flex items-center justify-between">
                                    <span className="text-base font-extrabold text-slate-900">Grand Total</span>
                                    <span className="text-xl font-extrabold text-indigo-700">{fmt(grandTotal)}</span>
                                </div>
                                <Button
                                    disabled={cart.length === 0 || submittingSale}
                                    onClick={handleProcessSale}
                                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-extrabold text-sm shadow-lg shadow-indigo-400/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                                >
                                    {submittingSale ? <RefreshCw className="h-4 w-4 animate-spin" /> : <><CheckCircle2 className="h-4 w-4" /> Complete Sale · {fmt(grandTotal)}</>}
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
