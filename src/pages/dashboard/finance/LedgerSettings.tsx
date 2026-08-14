import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Loader2, Settings2, ChevronRight, Plus, Trash2, Edit2, Check, X as CloseIcon } from 'lucide-react';

type LedgerCategory = { id: string; name: string; type: 'INCOME' | 'EXPENSE' };

export default function LedgerSettings() {
    const [loading, setLoading] = useState(true);
    
    const [categories, setCategories] = useState<LedgerCategory[]>([]);
    const [newCatName, setNewCatName] = useState('');
    const [newCatType, setNewCatType] = useState<'INCOME' | 'EXPENSE'>('INCOME');
    const [editingCatId, setEditingCatId] = useState<string | null>(null);
    const [editCatName, setEditCatName] = useState('');
    const [catLoading, setCatLoading] = useState(false);
    const [pageVisible, setPageVisible] = useState(false);

    useEffect(() => { const t = setTimeout(() => setPageVisible(true), 60); return () => clearTimeout(t); }, []);

    useEffect(() => {
        axios.get('/api/v1/finance-v2/categories', { withCredentials: true })
            .then(res => { if(res.data.categories) setCategories(res.data.categories); })
            .catch(() => toast.error('Failed to load categories'))
            .finally(() => setLoading(false));
    }, []);

    const handleAddCategory = async () => {
        if (!newCatName.trim()) return;
        setCatLoading(true);
        try {
            const res = await axios.post('/api/v1/finance-v2/categories', { name: newCatName, type: newCatType }, { withCredentials: true });
            setCategories([...categories, res.data.category]);
            setNewCatName('');
            toast.success('Category added');
        } catch (e: any) { toast.error(e.response?.data?.msg || 'Failed to add category'); } finally { setCatLoading(false); }
    };

    const handleUpdateCategory = async (id: string) => {
        if (!editCatName.trim()) return;
        setCatLoading(true);
        try {
            const res = await axios.put(`/api/v1/finance-v2/categories/${id}`, { name: editCatName }, { withCredentials: true });
            setCategories(categories.map(c => c.id === id ? res.data.category : c));
            setEditingCatId(null);
            toast.success('Category updated');
        } catch (e: any) { toast.error(e.response?.data?.msg || 'Failed to update category'); } finally { setCatLoading(false); }
    };

    const handleDeleteCategory = async (id: string) => {
        if (!confirm('Delete this category?')) return;
        setCatLoading(true);
        try {
            await axios.delete(`/api/v1/finance-v2/categories/${id}`, { withCredentials: true });
            setCategories(categories.filter(c => c.id !== id));
            toast.success('Category deleted');
        } catch (e: any) { toast.error(e.response?.data?.msg || 'Failed to delete category'); } finally { setCatLoading(false); }
    };

    if (loading) return <div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-[#1E4DA6]" /></div>;

    return (
        <div className="min-h-screen bg-[#FBF9F5] px-4 pb-20 pt-8 sm:px-6 lg:px-8">
            <div className="relative z-10 mx-auto max-w-4xl">
                <div className={`mb-6 flex items-center gap-1.5 transition-all duration-500 ${pageVisible ? 'opacity-100' : '-translate-y-2 opacity-0'}`}>
                    <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-slate-500">Finance</span>
                    <ChevronRight className="h-3 w-3 text-slate-400" />
                    <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-slate-500">Income & Expenses</span>
                    <ChevronRight className="h-3 w-3 text-slate-400" />
                    <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#1E4DA6]">Ledger Settings</span>
                </div>

                <div className={`overflow-hidden rounded-2xl border border-slate-200/80 bg-white transition-all duration-500 mb-6 ${pageVisible ? 'opacity-100' : 'translate-y-3 opacity-0'}`}>
                    <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/60 px-6 py-4">
                        <div className="flex items-center gap-2">
                            <Settings2 className="h-5 w-5 text-slate-700" />
                            <h2 className="font-bold text-slate-800">Ledger Categories</h2>
                        </div>
                    </div>
                    
                    <div className="p-6 space-y-6">
                        <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm p-6">
                            <h3 className="font-bold text-slate-800 mb-4">Add New Category</h3>
                            <div className="flex flex-col sm:flex-row gap-3">
                                <div className="flex-1">
                                    <Label className="mb-1 text-xs">Category Name</Label>
                                    <Input value={newCatName} onChange={e => setNewCatName(e.target.value)} placeholder="e.g. Donations" />
                                </div>
                                <div className="w-full sm:w-48">
                                    <Label className="mb-1 text-xs">Type</Label>
                                    <select value={newCatType} onChange={e => setNewCatType(e.target.value as 'INCOME'|'EXPENSE')} className="w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring h-9">
                                        <option value="INCOME">Income</option>
                                        <option value="EXPENSE">Expense</option>
                                    </select>
                                </div>
                                <div className="flex items-end">
                                    <Button onClick={handleAddCategory} disabled={catLoading || !newCatName} className="w-full sm:w-auto h-9 bg-[#1E4DA6] hover:bg-[#173F8C] text-white">
                                        {catLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4 mr-1" />} Add
                                    </Button>
                                </div>
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/30 overflow-hidden">
                                <div className="bg-emerald-100/50 px-4 py-3 border-b border-emerald-200">
                                    <h3 className="font-bold text-emerald-800 text-sm">Income Categories</h3>
                                </div>
                                <div className="p-4 space-y-2">
                                    {categories.filter(c => c.type === 'INCOME').map(cat => (
                                        <div key={cat.id} className="flex items-center justify-between bg-white border border-emerald-100 rounded-lg p-3 shadow-sm">
                                            {editingCatId === cat.id ? (
                                                <div className="flex items-center gap-2 flex-1 mr-2">
                                                    <Input value={editCatName} onChange={e => setEditCatName(e.target.value)} className="h-8 text-sm" />
                                                    <button onClick={() => handleUpdateCategory(cat.id)} className="p-1.5 bg-emerald-100 text-emerald-700 rounded-md hover:bg-emerald-200"><Check className="w-4 h-4" /></button>
                                                    <button onClick={() => setEditingCatId(null)} className="p-1.5 bg-slate-100 text-slate-500 rounded-md hover:bg-slate-200"><CloseIcon className="w-4 h-4" /></button>
                                                </div>
                                            ) : (
                                                <>
                                                    <span className="font-semibold text-slate-700 text-sm">{cat.name}</span>
                                                    <div className="flex items-center gap-1">
                                                        <button onClick={() => { setEditingCatId(cat.id); setEditCatName(cat.name); }} className="p-1.5 text-slate-400 hover:bg-slate-100 hover:text-[#1E4DA6] rounded-md"><Edit2 className="w-3.5 h-3.5" /></button>
                                                        <button onClick={() => handleDeleteCategory(cat.id)} className="p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 rounded-md"><Trash2 className="w-3.5 h-3.5" /></button>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    ))}
                                    {categories.filter(c => c.type === 'INCOME').length === 0 && <p className="text-xs text-slate-500 text-center py-4">No income categories defined.</p>}
                                </div>
                            </div>

                            <div className="rounded-2xl border border-rose-200 bg-rose-50/30 overflow-hidden">
                                <div className="bg-rose-100/50 px-4 py-3 border-b border-rose-200">
                                    <h3 className="font-bold text-rose-800 text-sm">Expense Categories</h3>
                                </div>
                                <div className="p-4 space-y-2">
                                    {categories.filter(c => c.type === 'EXPENSE').map(cat => (
                                        <div key={cat.id} className="flex items-center justify-between bg-white border border-rose-100 rounded-lg p-3 shadow-sm">
                                            {editingCatId === cat.id ? (
                                                <div className="flex items-center gap-2 flex-1 mr-2">
                                                    <Input value={editCatName} onChange={e => setEditCatName(e.target.value)} className="h-8 text-sm" />
                                                    <button onClick={() => handleUpdateCategory(cat.id)} className="p-1.5 bg-rose-100 text-rose-700 rounded-md hover:bg-rose-200"><Check className="w-4 h-4" /></button>
                                                    <button onClick={() => setEditingCatId(null)} className="p-1.5 bg-slate-100 text-slate-500 rounded-md hover:bg-slate-200"><CloseIcon className="w-4 h-4" /></button>
                                                </div>
                                            ) : (
                                                <>
                                                    <span className="font-semibold text-slate-700 text-sm">{cat.name}</span>
                                                    <div className="flex items-center gap-1">
                                                        <button onClick={() => { setEditingCatId(cat.id); setEditCatName(cat.name); }} className="p-1.5 text-slate-400 hover:bg-slate-100 hover:text-[#1E4DA6] rounded-md"><Edit2 className="w-3.5 h-3.5" /></button>
                                                        <button onClick={() => handleDeleteCategory(cat.id)} className="p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 rounded-md"><Trash2 className="w-3.5 h-3.5" /></button>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    ))}
                                    {categories.filter(c => c.type === 'EXPENSE').length === 0 && <p className="text-xs text-slate-500 text-center py-4">No expense categories defined.</p>}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
