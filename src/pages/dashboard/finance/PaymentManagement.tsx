import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CreditCard, Users, FileText, History, Settings, ArrowRightLeft, Wallet, Table, Upload, ChevronDown } from 'lucide-react';
import InvoiceManager from './InvoiceManager';
import PaymentRecords from './PaymentRecords';
import TransferVerifications from './TransferVerifications';
import WalletLedger from './WalletLedger';
import PaymentSettings from './PaymentSettings';
import SinglePaymentView from './SinglePaymentView';
import FamilyPaymentView from './FamilyPaymentView';
import BillingBroadsheet from './BillingBroadsheet';
import BulkFinanceUpload from './BulkFinanceUpload';

type TabKey = 'single' | 'family' | 'invoices' | 'payments' | 'transfers' | 'wallet' | 'broadsheet' | 'bulk-upload' | 'settings';

export default function PaymentManagement() {
    const location = useLocation();
    const navigate = useNavigate();
    const [isMoreOpen, setIsMoreOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    
    const getInitialTab = (): TabKey => {
        const hash = location.hash.replace('#', '');
        if (['single', 'family', 'invoices', 'payments', 'transfers', 'wallet', 'broadsheet', 'bulk-upload', 'settings'].includes(hash)) {
            return hash as TabKey;
        }
        return 'single';
    };

    const [activeTab, setActiveTab] = useState<TabKey>(getInitialTab());

    useEffect(() => {
        const hash = location.hash.replace('#', '');
        if (['single', 'family', 'invoices', 'payments', 'transfers', 'wallet', 'broadsheet', 'bulk-upload', 'settings'].includes(hash)) {
            setActiveTab(hash as TabKey);
        }
    }, [location.hash]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsMoreOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleTabChange = (tab: TabKey) => {
        setActiveTab(tab);
        navigate(`#${tab}`, { replace: true });
        setIsMoreOpen(false);
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'single': return <SinglePaymentView />;
            case 'family': return <FamilyPaymentView />;
            case 'invoices': return <InvoiceManager />;
            case 'payments': return <PaymentRecords />;
            case 'transfers': return <TransferVerifications />;
            case 'wallet': return <WalletLedger />;
            case 'broadsheet': return <BillingBroadsheet />;
            case 'bulk-upload': return <BulkFinanceUpload />;
            case 'settings': return <PaymentSettings />;
            default: return <SinglePaymentView />;
        }
    };

    const mainTabs = [
        { id: 'single', label: 'Single Payment', icon: CreditCard },
        { id: 'family', label: 'Family Payment', icon: Users },
        { id: 'invoices', label: 'All Invoices', icon: FileText },
        { id: 'payments', label: 'Payment History', icon: History },
    ];

    const moreTabs = [
        { id: 'transfers', label: 'Transfers', icon: ArrowRightLeft },
        { id: 'wallet', label: 'Wallet / Ledger', icon: Wallet },
        { id: 'broadsheet', label: 'Broadsheet', icon: Table },
        { id: 'bulk-upload', label: 'Bulk Upload', icon: Upload },
        { id: 'settings', label: 'Payment Settings', icon: Settings },
    ];

    const isMoreActive = moreTabs.some(t => t.id === activeTab);

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            <div className="bg-white border-b border-slate-200 px-3 sm:px-6 lg:px-8 py-3">
                <div className="flex items-center w-full">
                    {/* Scrollable Main Tabs */}
                    <div className="flex-1 overflow-x-auto hide-scrollbar relative">
                        <nav className="flex space-x-2 min-w-max pr-2" aria-label="Tabs">
                            {mainTabs.map((tab) => {
                                const Icon = tab.icon;
                                const isActive = activeTab === tab.id;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => handleTabChange(tab.id as TabKey)}
                                        className={`
                                            group flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 whitespace-nowrap
                                            ${isActive 
                                                ? 'bg-[#1E4DA6] text-white shadow-md shadow-[#1E4DA6]/20' 
                                                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                                            }
                                        `}
                                    >
                                        <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white/80' : 'text-slate-400 group-hover:text-slate-600'}`} />
                                        {tab.label}
                                    </button>
                                );
                            })}
                        </nav>
                    </div>
                    
                    {/* Pinned More Options */}
                    <div className="relative shrink-0 ml-1 sm:ml-2 border-l border-slate-200 pl-2 sm:pl-3" ref={dropdownRef}>
                        <button
                            onClick={() => setIsMoreOpen(!isMoreOpen)}
                            className={`
                                group flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 whitespace-nowrap
                                ${isMoreActive 
                                    ? 'bg-indigo-50 text-indigo-700 border border-indigo-100 shadow-sm' 
                                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100 border border-transparent'
                                }
                            `}
                        >
                            More
                            <ChevronDown className={`w-4 h-4 shrink-0 transition-transform duration-200 ${isMoreOpen ? 'rotate-180' : ''} ${isMoreActive ? 'text-indigo-500' : 'text-slate-400'}`} />
                        </button>

                        {isMoreOpen && (
                            <div className="absolute right-0 mt-2 w-56 origin-top-right rounded-2xl bg-white shadow-xl ring-1 ring-black ring-opacity-5 focus:outline-none z-50 overflow-hidden transform transition-all border border-slate-100">
                                <div className="py-2">
                                    {moreTabs.map((tab) => {
                                        const Icon = tab.icon;
                                        const isActive = activeTab === tab.id;
                                        return (
                                            <button
                                                key={tab.id}
                                                onClick={() => handleTabChange(tab.id as TabKey)}
                                                className={`
                                                    w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors
                                                    ${isActive ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}
                                                `}
                                            >
                                                <div className={`p-1.5 rounded-lg ${isActive ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500'}`}>
                                                    <Icon className="w-4 h-4" />
                                                </div>
                                                {tab.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            
            <div className="flex-1 relative">
                {renderContent()}
            </div>
        </div>
    );
}
