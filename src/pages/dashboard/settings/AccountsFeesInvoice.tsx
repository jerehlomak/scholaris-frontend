import { useState, useEffect } from "react";
import { Receipt, Building2, Trash2, Loader2, Plus } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";
import { SettingsShell } from "./shared/SettingsShell";
import { SettingsHero } from "./shared/SettingsHero";
import { SaveButton } from "./shared/SaveButton";

const API = "/api/v1/finance-v2/bank-accounts";

type BankAccount = {
    id: string;
    bankName: string;
    accountName: string;
    accountNumber: string;
    accountType: string | null;
    notes: string | null;
    displayInstructions: string | null;
    isDefault: boolean;
    createdAt: string;
    feeDefinitions?: { id: string; name: string }[];
};

const inputCls = "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 shadow-sm outline-none focus:border-[#1E4DA6]/60 focus:ring-2 focus:ring-[#1E4DA6]/10 transition-all";

export function AccountsFeesInvoice() {
    const [banks, setBanks] = useState<BankAccount[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [saved, setSaved] = useState(false);
    const [showForm, setShowForm] = useState(false);

    const [form, setForm] = useState({ 
        bankName: "", 
        accountName: "", 
        accountNumber: "", 
        accountType: "Current", 
        notes: "", 
        displayInstructions: "",
        isDefault: false 
    });

    const fetchBanks = async () => {
        try {
            const res = await axios.get(API, { withCredentials: true });
            setBanks(res.data.accounts || res.data.banks || []);
        } catch { toast.error("Failed to load bank accounts"); }
        finally { setIsLoading(false); }
    };

    useEffect(() => { fetchBanks(); }, []);

    const handleChange = (field: string, value: string | boolean) => setForm(prev => ({ ...prev, [field]: value }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.bankName || !form.accountName || !form.accountNumber) { 
            toast.error("Bank Name, Account Name, and Account Number are required"); 
            return; 
        }
        setIsSubmitting(true);
        try {
            await axios.post(API, form, { withCredentials: true });
            toast.success("Bank Account added successfully");
            setForm({ bankName: "", accountName: "", accountNumber: "", accountType: "Current", notes: "", displayInstructions: "", isDefault: false });
            setShowForm(false);
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
            fetchBanks();
        } catch (e) {
            const err = e as { response?: { data?: { msg?: string } } };
            toast.error(err.response?.data?.msg || "Failed to add bank account");
        } finally { setIsSubmitting(false); }
    };

    const handleDelete = async (id: string, name: string) => {
        if (!window.confirm("Delete " + name + "?")) return;
        try {
            await axios.delete(API + "/" + id, { withCredentials: true });
            toast.success("Bank account deleted");
            setBanks(banks.filter(b => b.id !== id));
        } catch (e) {
            const err = e as { response?: { data?: { msg?: string } } };
            toast.error(err.response?.data?.msg || "Failed to delete bank account");
        }
    };

    if (isLoading) {
        return <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-[#1E4DA6]" /></div>;
    }

    return (
        <SettingsShell breadcrumbParent="Finance" breadcrumbCurrent="Invoice & Receipt" tabLabel="Bank Accounts" tabIcon={<Receipt className="h-3.5 w-3.5" />}>
            <SettingsHero
                icon={<Receipt className="h-7 w-7" />}
                title="Invoice & Receipt Settings"
                subtitle="Configure the bank accounts that appear on fee invoices and payment receipts issued to parents."
            />

            {banks.length > 0 && (
                <div className="mb-8 space-y-3">
                    <h3 className="font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400">Registered Bank Accounts</h3>
                    {banks.map(bank => (
                        <div key={bank.id} className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-slate-100 bg-slate-50 overflow-hidden">
                                <Building2 className="h-6 w-6 text-slate-300" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <p className="font-bold text-slate-800">{bank.bankName}</p>
                                    {bank.isDefault && <span className="rounded-full bg-green-50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-green-600">Default</span>}
                                </div>
                                <p className="font-medium text-sm text-slate-600 mt-0.5">{bank.accountName}</p>
                                <p className="font-mono text-sm text-slate-500 tracking-widest">{bank.accountNumber}</p>
                                {bank.notes && <p className="text-xs text-slate-400 mt-0.5">{bank.notes}</p>}
                                
                                {bank.feeDefinitions && bank.feeDefinitions.length > 0 && (
                                    <div className="mt-3 flex flex-wrap gap-1.5">
                                        {bank.feeDefinitions.map(f => (
                                            <span key={f.id} className="inline-flex items-center rounded-md bg-[#1E4DA6]/5 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-[#173F8C] ring-1 ring-inset ring-[#173F8C]/10">
                                                {f.name}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <button onClick={() => handleDelete(bank.id, bank.bankName)} className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors shrink-0">
                                <Trash2 className="h-4 w-4" />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {!showForm && (
                <button onClick={() => setShowForm(true)} className="mb-8 flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[#1E4DA6]/20 py-5 text-sm font-semibold text-[#1E4DA6] hover:bg-[#1E4DA6]/5 transition-colors">
                    <Plus className="h-4 w-4" /> Add New Bank Account
                </button>
            )}

            {showForm && (
                <form onSubmit={handleSubmit} className="mb-8 space-y-5 rounded-2xl border border-[#1E4DA6]/10 bg-[#1E4DA6]/8 py-6 px-4">
                    <h3 className="font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400">Add New Bank Account</h3>
                    
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="space-y-1.5">
                            <label className="font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400">Bank Name *</label>
                            <input className={inputCls} value={form.bankName} onChange={e => handleChange("bankName", e.target.value)} placeholder="e.g. Guaranty Trust Bank" required />
                        </div>
                        <div className="space-y-1.5">
                            <label className="font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400">Account Name *</label>
                            <input className={inputCls} value={form.accountName} onChange={e => handleChange("accountName", e.target.value)} placeholder="e.g. Skooly High School" required />
                        </div>
                        <div className="space-y-1.5">
                            <label className="font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400">Account Number *</label>
                            <input className={inputCls + " font-mono tracking-widest"} value={form.accountNumber} onChange={e => handleChange("accountNumber", e.target.value)} placeholder="0123456789" required />
                        </div>
                        <div className="space-y-1.5">
                            <label className="font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400">Account Type</label>
                            <select className={inputCls} value={form.accountType} onChange={e => handleChange("accountType", e.target.value)}>
                                <option value="Current">Current</option>
                                <option value="Savings">Savings</option>
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400">Branch / Notes</label>
                            <input className={inputCls} value={form.notes} onChange={e => handleChange("notes", e.target.value)} placeholder="e.g. Victoria Island Branch" />
                        </div>
                        <div className="space-y-1.5 flex items-center justify-between pt-6">
                            <div>
                                <label className="font-bold text-slate-800 text-sm block">Set as Default Account</label>
                                <span className="text-xs text-slate-500">Use this account for all unassigned fees.</span>
                            </div>
                            <label className="relative inline-flex cursor-pointer items-center">
                                <input type="checkbox" className="peer sr-only" checked={form.isDefault} onChange={e => handleChange("isDefault", e.target.checked)} />
                                <div className="peer h-6 w-11 rounded-full bg-slate-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-slate-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-[#1E4DA6] peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#1E4DA6]/35 dark:border-slate-600 dark:bg-slate-700 dark:peer-focus:ring-[#122F69]"></div>
                            </label>
                        </div>
                        <div className="space-y-1.5 sm:col-span-2">
                            <label className="font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400">Payment Instructions (Shown on Invoices)</label>
                            <textarea className={inputCls + " resize-none h-20"} value={form.displayInstructions} onChange={e => handleChange("displayInstructions", e.target.value)} placeholder="e.g. Include student name in narration." />
                        </div>
                    </div>
                    <div className="flex flex-col-reverse sm:flex-row items-center gap-3 justify-center pt-2">
                        <button type="button" onClick={() => setShowForm(false)} className="max-w-lg sm:w-auto rounded-full px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors border border-slate-200">Cancel</button>
                        <SaveButton onClick={() => { }} saved={saved} saving={isSubmitting} saveLabel="Add Bank Account" savedLabel="Account Added!" />
                    </div>
                </form>
            )}
        </SettingsShell>
    );
}
