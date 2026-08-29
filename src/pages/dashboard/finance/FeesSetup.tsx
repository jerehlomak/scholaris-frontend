import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import FeesConfiguration from './FeesConfiguration';
import { FeeRules } from '../settings/FeeRules';
import { AccountsFeesInvoice } from '../settings/AccountsFeesInvoice';

type TabKey = 'configuration' | 'rules' | 'accounts';

export default function FeesSetup() {
    const location = useLocation();
    const navigate = useNavigate();
    
    // Determine initial tab from URL hash if present
    const getInitialTab = (): TabKey => {
        const hash = location.hash.replace('#', '');
        if (['configuration', 'rules', 'accounts'].includes(hash)) {
            return hash as TabKey;
        }
        return 'configuration';
    };

    const [activeTab, setActiveTab] = useState<TabKey>(getInitialTab());

    useEffect(() => {
        const hash = location.hash.replace('#', '');
        if (['configuration', 'rules', 'accounts'].includes(hash)) {
            setActiveTab(hash as TabKey);
        }
    }, [location.hash]);

    const handleTabChange = (tab: TabKey) => {
        setActiveTab(tab);
        navigate(`#${tab}`, { replace: true });
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'configuration': return <FeesConfiguration />;
            case 'rules': return <FeeRules />;
            case 'accounts': return <AccountsFeesInvoice />;
            default: return <FeesConfiguration />;
        }
    };

    const tabs = [
        { id: 'configuration', label: 'Fees Configuration' },
        { id: 'rules', label: 'Custom Fee Rules' },
        { id: 'accounts', label: 'Accounts For Fees Invoice' },
    ];

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            <div className="bg-white border-b border-slate-200 sticky top-0 z-40 px-4 sm:px-6 lg:px-8 py-2 overflow-x-auto hide-scrollbar">
                <nav className="flex space-x-1 min-w-max" aria-label="Tabs">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => handleTabChange(tab.id as TabKey)}
                            className={`${
                                activeTab === tab.id
                                    ? 'bg-[#1E4DA6]/5 text-[#173F8C]'
                                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                            } px-4 py-2.5 rounded-lg text-sm font-medium transition-colors`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </div>
            
            <div className="flex-1 relative">
                {renderContent()}
            </div>
        </div>
    );
}

