import { useState, useEffect } from 'react';
import { Tag, Plus, X, Trash2, Pencil, Loader2, Check } from 'lucide-react';
import { SettingsShell } from './shared/SettingsShell';
import { SettingsHero } from './shared/SettingsHero';
import { cn } from '../../../lib/utils';
import axios from 'axios';
import { toast } from 'sonner';

interface CategoryData {
    id: string;
    name: string;
    arabicName: string | null;
}

export function SubjectCategories() {
    const [categories, setCategories] = useState<CategoryData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    
    // Form states
    const [name, setName] = useState('');

    // Edit states
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');

    const fetchCategories = async () => {
        try {
            const res = await axios.get('/api/v1/subject-categories', { withCredentials: true });
            setCategories(res.data.categories);
        } catch {
            toast.error('Failed to load subject categories');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name) return;
        
        try {
            const res = await axios.post('/api/v1/subject-categories', {
                name
            }, { withCredentials: true });
            
            toast.success('Category created successfully');
            setCategories(prev => [...prev, res.data.category]);
            setIsAdding(false);
            setName('');
        } catch (err: any) {
            toast.error(err.response?.data?.msg || 'Failed to create category');
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await axios.delete(`/api/v1/subject-categories/${id}`, { withCredentials: true });
            setCategories(prev => prev.filter(s => s.id !== id));
            toast.success('Category deleted');
        } catch (err: any) {
            toast.error(err.response?.data?.msg || 'Failed to delete category');
        }
    };

    const startEdit = (c: CategoryData) => {
        setEditingId(c.id);
        setEditName(c.name);
    };

    const saveEdit = async (id: string) => {
        try {
            const res = await axios.patch(`/api/v1/subject-categories/${id}`, {
                name: editName
            }, { withCredentials: true });
            
            setCategories(prev => prev.map(s => s.id === id ? { ...s, ...res.data.category } : s));
            setEditingId(null);
            toast.success('Category updated');
        } catch {
            toast.error('Failed to update category');
        }
    };

    if (isLoading) {
        return (
            <SettingsShell breadcrumbCurrent="Subject Categories" tabLabel="Subject Categories" tabIcon={<Tag className="h-3.5 w-3.5" />}>
                <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>
            </SettingsShell>
        );
    }

    return (
        <SettingsShell breadcrumbParent="Settings" breadcrumbCurrent="Subject Categories" tabLabel="Subject Categories" tabIcon={<Tag className="h-3.5 w-3.5" />}>
            <SettingsHero
                icon={<Tag className="h-7 w-7" />}
                title="Subject Categories"
                subtitle="Organize your subjects into categories like Core, Optional, Vocational, or Trade Subjects."
            />

            <div className="mb-6 flex justify-end">
                <button
                    onClick={() => setIsAdding(!isAdding)}
                    className={cn(
                        'flex items-center gap-2 rounded-xl border-2 border-dashed px-5 py-2.5 text-sm font-semibold transition-all',
                        isAdding
                            ? 'border-red-200 bg-red-50 text-red-600 hover:bg-red-100'
                            : 'border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100'
                    )}
                >
                    {isAdding ? <><X className="h-4 w-4" /> Cancel</> : <><Plus className="h-4 w-4" /> Add New Category</>}
                </button>
            </div>

            {isAdding && (
                <form onSubmit={handleAdd} className="mb-8 rounded-2xl border border-blue-100 bg-blue-50/50 p-6 space-y-4">
                    <h3 className="font-mono text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-4">
                        Create Subject Category
                    </h3>
                    <div className="grid grid-cols-1 gap-4">
                        <div className="space-y-1.5">
                            <label className="font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                Category Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                required
                                value={name}
                                onChange={e => setName(e.target.value)}
                                placeholder="e.g. Science"
                                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 shadow-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                            />
                        </div>
                    </div>
                    <div className="flex justify-end pt-2">
                        <button type="submit" className="rounded-xl bg-blue-700 px-6 py-2.5 text-sm font-bold text-white shadow-md hover:bg-blue-800 transition-colors">
                            Create Category
                        </button>
                    </div>
                </form>
            )}

            <div className="rounded-2xl border border-slate-200/80 bg-white overflow-hidden shadow-sm">
                <div className="border-b border-slate-100 bg-slate-50/60 px-5 py-3">
                    <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400">Categories</span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-slate-100 text-left">
                                <th className="px-5 py-3 font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400">Name</th>
                                <th className="px-5 py-3 font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {categories.length === 0 && (
                                <tr>
                                    <td colSpan={2} className="px-5 py-8 text-center text-slate-400 text-sm">No categories found</td>
                                </tr>
                            )}
                            {categories.map(category => (
                                <tr key={category.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-5 py-4">
                                        {editingId === category.id ? (
                                            <input 
                                                value={editName} onChange={e => setEditName(e.target.value)} 
                                                className="w-full rounded-md border border-slate-300 px-2 py-1 text-sm outline-none focus:border-blue-500" 
                                            />
                                        ) : (
                                            <span className="font-semibold text-slate-800">{category.name}</span>
                                        )}
                                    </td>
                                    <td className="px-5 py-4 text-right">
                                        {editingId === category.id ? (
                                            <div className="flex justify-end gap-2">
                                                <button onClick={() => saveEdit(category.id)} className="rounded-lg bg-emerald-50 p-2 text-emerald-600 hover:bg-emerald-100"><Check className="h-4 w-4" /></button>
                                                <button onClick={() => setEditingId(null)} className="rounded-lg bg-slate-100 p-2 text-slate-500 hover:bg-slate-200"><X className="h-4 w-4" /></button>
                                            </div>
                                        ) : (
                                            <div className="flex justify-end items-center gap-2">
                                                <button onClick={() => startEdit(category)} className="rounded-lg p-2 text-slate-400 hover:bg-blue-50 hover:text-blue-500 transition-colors"><Pencil className="h-4 w-4" /></button>
                                                <button onClick={() => handleDelete(category.id)} className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"><Trash2 className="h-4 w-4" /></button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </SettingsShell>
    );
}
