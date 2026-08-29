import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Loader2, Users, FileText, CheckCircle2, CreditCard, ChevronRight } from 'lucide-react';
import { Input } from '../../../components/ui/input';
import { toast } from 'sonner';
import RecordPaymentModal from './components/RecordPaymentModal';

export default function FamilyPaymentView() {
    const [families, setFamilies] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [selectedFamily, setSelectedFamily] = useState<any>(null);
    const [profile, setProfile] = useState<any>(null);
    const [loadingProfile, setLoadingProfile] = useState(false);
    const [payInv, setPayInv] = useState<any | null>(null);

    useEffect(() => {
        axios.get('/api/v1/finance-v2/billing/families', { withCredentials: true })
            .then(res => setFamilies(res.data.summary || []))
            .catch(() => toast.error('Failed to load families'))
            .finally(() => setLoading(false));
    }, []);

    const fetchFamilyProfile = (parentId: string) => {
        setLoadingProfile(true);
        axios.get(`/api/v1/finance-v2/billing/families/${parentId}`, { withCredentials: true })
            .then(res => setProfile(res.data))
            .catch(() => toast.error('Failed to load family profile'))
            .finally(() => setLoadingProfile(false));
    };

    const handleSelectFamily = (family: any) => {
        setSelectedFamily(family);
        setSearch('');
        fetchFamilyProfile(family.id);
    };

    const filteredFamilies = search.length > 1 
        ? families.filter(f => 
            f.name?.toLowerCase().includes(search.toLowerCase()) || 
            f.email?.toLowerCase().includes(search.toLowerCase()) ||
            f.phone?.includes(search)
          ).slice(0, 5)
        : [];

    return (
        <>
            <style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap'); .fd-root .mono{font-family:'DM Mono',monospace!important}`}</style>
            <div className="fd-root min-h-screen bg-[#FBF9F5] px-4 pb-20 pt-8 sm:px-6 lg:px-8">
                <div className="relative z-10 mx-auto max-w-full space-y-6">
                    {/* Breadcrumb */}
            <div className="flex items-center gap-1.5">
                <span className="mono text-[10px] font-bold uppercase tracking-widest text-slate-500">Finance</span>
                <ChevronRight className="h-3 w-3 text-slate-400" />
                <span className="mono text-[10px] font-bold uppercase tracking-widest text-[#1E4DA6]">Family Payment</span>
            </div>

            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-200">
                        <Users className="h-6 w-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Family Payment</h1>
                        <p className="mt-0.5 text-sm text-slate-500">
                            Record payments for an entire family's outstanding invoices at once.
                        </p>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <Input 
                        placeholder="Search family by name, email or phone..." 
                        className="pl-10 h-12 text-base rounded-xl bg-slate-50 border-transparent focus:bg-white focus:border-indigo-500 transition-colors"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                    
                    {search.length > 1 && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-10">
                            {filteredFamilies.length > 0 ? filteredFamilies.map(f => (
                                <button
                                    key={f.id}
                                    onClick={() => handleSelectFamily(f)}
                                    className="w-full text-left px-4 py-3 hover:bg-slate-50 border-b border-slate-50 last:border-0 flex items-center gap-3"
                                >
                                    <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                                        <Users className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-slate-800">{f.name}</p>
                                        <p className="text-xs text-slate-500">{f.studentCount} Children • {f.email || f.phone}</p>
                                    </div>
                                </button>
                            )) : (
                                <div className="p-4 text-center text-slate-500 text-sm">No families found</div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {selectedFamily && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-6 border-b border-slate-100 flex items-center gap-4 bg-slate-50/50">
                        <div className="h-16 w-16 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-2xl">
                            <Users className="h-8 w-8" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-slate-900">{selectedFamily.name}</h3>
                            <p className="text-slate-500 text-sm">{selectedFamily.studentCount} Children</p>
                        </div>
                    </div>

                    <div className="p-6">
                        {loadingProfile ? (
                            <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-indigo-500" /></div>
                        ) : profile ? (
                            <div className="space-y-8">
                                {profile.children?.map((child: any) => {
                                    const outstandingInvoices = child.invoices?.filter((inv: any) => inv.balanceDue > 0) || [];
                                    
                                    if (outstandingInvoices.length === 0) return null;

                                    return (
                                        <div key={child.id} className="space-y-3">
                                            <h4 className="font-semibold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-2">
                                                <div className="h-6 w-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 text-xs font-bold">
                                                    {child.name?.[0]}
                                                </div>
                                                {child.name}
                                                <span className="text-xs text-slate-400 font-normal">({child.className})</span>
                                            </h4>
                                            
                                            <div className="space-y-3 pl-8">
                                                {outstandingInvoices.map((inv: any) => (
                                                    <div key={inv.id} className="flex flex-col sm:flex-row items-center justify-between p-4 rounded-xl border border-slate-100 bg-white hover:border-indigo-100 transition-colors gap-4 shadow-sm">
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <span className="font-bold text-slate-800">{inv.invoiceNumber}</span>
                                                                <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold uppercase">
                                                                    {inv.term} {inv.academicYear}
                                                                </span>
                                                            </div>
                                                            <p className="text-sm text-slate-500">Generated: {new Date(inv.createdAt).toLocaleDateString()}</p>
                                                        </div>
                                                        
                                                        <div className="flex items-center gap-6 w-full sm:w-auto">
                                                            <div className="text-right">
                                                                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Amount Due</p>
                                                                <p className="font-bold text-lg text-red-600">₦{inv.balanceDue.toLocaleString()}</p>
                                                            </div>
                                                            <button 
                                                                onClick={() => setPayInv(inv)}
                                                                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-colors shadow-sm"
                                                            >
                                                                Pay
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                                
                                {profile.children?.every((child: any) => !child.invoices?.some((inv: any) => inv.balanceDue > 0)) && (
                                    <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                        <CheckCircle2 className="h-12 w-12 text-emerald-400 mx-auto mb-3" />
                                        <p className="text-slate-600 font-medium">All clear!</p>
                                        <p className="text-slate-400 text-sm">This family has no outstanding invoices.</p>
                                    </div>
                                )}
                            </div>
                        ) : null}
                    </div>
                </div>
            )}

                </div>
                
                {payInv && (
                    <RecordPaymentModal 
                        inv={payInv}
                        onClose={() => setPayInv(null)}
                        onSuccess={() => { setPayInv(null); fetchFamilyProfile(selectedFamily.id); }}
                    />
                )}
            </div>
        </>
    );
}
