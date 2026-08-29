import { useState, useEffect } from 'react';
import { Plus, Edit3, Trash2, BookOpen, Loader2, Search, Filter, ChevronDown, Download, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { SettingsShell } from '../settings/shared/SettingsShell';
import { SettingsHero } from '../settings/shared/SettingsHero';
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
    AlertDialogTitle, AlertDialogTrigger,
} from "../../../components/ui/alert-dialog";
import { EditSubjectModal } from './EditSubjectModal';
import { ViewToggle } from '../../../components/shared/ViewToggle';
import { useViewPreference } from '../../../hooks/useViewPreference';
import { Pagination } from '../../../components/shared/Pagination';

const API = '/api/v1';

interface SubjectData {
    id: string;
    name: string;
    code: string | null;
    arabicName: string | null;
    type: string | null;
    categoryId: string | null;
    category?: { id: string; name: string } | null;
    description: string | null;
    status: string;
    classes: { class: { name: string } }[];
    teacher: { user: { name: string } } | null;
}

interface ClassData {
    id: string;
    name: string;
    level: string;
}

const DEFAULT_CAT_STYLE = { label: 'General', cls: 'bg-slate-100 text-slate-600' };

const CATEGORY_COLORS = [
    'bg-[#1E4DA6]/10 text-[#173F8C]',
    'bg-[#1E4DA6]/10 text-[#173F8C]',
    'bg-orange-100 text-orange-700',
    'bg-teal-100 text-teal-700',
    'bg-rose-100 text-rose-700',
    'bg-amber-100 text-amber-700',
];

// Color palette for class badges
const CLASS_BADGE_COLORS = [
    'bg-[#1E4DA6]/10 text-[#173F8C]',
    'bg-emerald-100 text-emerald-700',
    'bg-indigo-100 text-indigo-700',
    'bg-violet-100 text-violet-700',
    'bg-rose-100 text-rose-700',
    'bg-amber-100 text-amber-700',
    'bg-sky-100 text-sky-700',
    'bg-teal-100 text-teal-700',
];

export function AllSubjects() {
    const navigate = useNavigate();
    const [subjects, setSubjects] = useState<SubjectData[]>([]);
    const [classes, setClasses] = useState<ClassData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [editingSubjectId, setEditingSubjectId] = useState<string | null>(null);
    const [view, setView] = useViewPreference('allsubjects');
    const [search, setSearch] = useState('');
    const [filterCat, setFilterCat] = useState('all');
    const [filterClass, setFilterClass] = useState('all');
    const [showFilters, setShowFilters] = useState(false);
    const [showDeleted, setShowDeleted] = useState(false);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [subjectsRes, classesRes] = await Promise.all([
                axios.get(`${API}/subjects/all`, { 
                    params: { 
                        page, 
                        limit: 10,
                        search: search || undefined,
                        category: filterCat,
                        showDeleted: showDeleted ? 'true' : undefined,
                        classId: filterClass !== 'all' ? filterClass : undefined // The backend controller uses `classId` as a filter but wait, we need to pass the ID or name? The controller has: `...(classId && classId !== 'all' ? { classes: { some: { classId } } } : {})` It expects the class ID!
                    },
                    withCredentials: true 
                }),
                axios.get(`${API}/classes/all`, { withCredentials: true }).catch(() => ({ data: { classes: [] } })),
            ]);
            setSubjects(subjectsRes.data.subjects);
            setTotalPages(subjectsRes.data.totalPages || 1);
            setTotalRecords(subjectsRes.data.count || 0);
            setClasses(classesRes.data.classes || []);
        } catch {
            toast.error('Failed to load subjects. Make sure you are logged in as Admin.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { 
        const delaySearch = setTimeout(() => {
            fetchData();
        }, 500);
        return () => clearTimeout(delaySearch);
    }, [page, search, filterCat, filterClass, showDeleted]);

    const handleDelete = async (id: string, name: string, force = false) => {
        try {
            await axios.delete(`${API}/subjects/${id}${force ? '?force=true' : ''}`, { withCredentials: true });
            toast.success(`Subject "${name}" deleted`);
            fetchData();
        } catch (error: any) {
            const msg = error.response?.data?.msg || 'Failed to delete subject';
            if (msg.includes('?force=true')) {
                if (window.confirm(`${msg}\n\nDo you want to proceed and force delete it?`)) {
                    handleDelete(id, name, true);
                }
            } else {
                toast.error(msg);
            }
        }
    };

    const handleRestore = async (id: string, name: string) => {
        try {
            await axios.patch(`${API}/subjects/${id}/restore`, {}, { withCredentials: true });
            toast.success(`Subject "${name}" restored`);
            fetchData();
        } catch (error: any) {
            toast.error(error.response?.data?.msg || 'Failed to restore subject');
        }
    };

    // Build dynamic class style map
    const classStyleMap: Record<string, { label: string; cls: string }> = {};
    classes.forEach((cls, i) => {
        classStyleMap[cls.name] = {
            label: cls.name,
            cls: CLASS_BADGE_COLORS[i % CLASS_BADGE_COLORS.length],
        };
    });
    const getClassStyle = (className: string) =>
        classStyleMap[className] ?? { label: className, cls: 'bg-slate-100 text-slate-600' };

    const handleDownload = () => {
        const headers = ["Subject Name", "Code", "Category", "Classes Assigned"];
        const csvData = displayed.map(s => [
            `"${s.name}"`,
            `"${s.code || ''}"`,
            `"${s.category?.name || 'General'}"`,
            `"${s.classes.map(c => c.class.name).join(', ')}"`
        ]);
        const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...csvData.map(row => row.join(","))].join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "subjects_export.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const displayed = subjects;

    // Unique categories for filter bar
    const uniqueCategories = [...new Map(subjects
        .filter(s => s.category)
        .map(s => [s.category!.id, s.category!]))
        .values()];

    // Unique classes for filter bar
    const uniqueClasses = Array.from(
        new Set(subjects.flatMap(s => s.classes.map(c => c.class?.name)).filter(Boolean))
    ).sort();



    return (
        <SettingsShell
            breadcrumbParent="Subjects"
            breadcrumbCurrent="All Subjects"
            tabLabel="All Subjects"
            tabIcon={<BookOpen className="h-3.5 w-3.5" />}
        >
            <SettingsHero
                icon={<BookOpen className="h-7 w-7" />}
                title="All Subjects"
                subtitle="Manage subjects by category and assigned classes."
            />

            {/* Header action */}
            <div className="flex flex-col sm:flex-row justify-end gap-4 mb-6">
                <button onClick={handleDownload}
                    className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 text-sm font-semibold shadow-sm transition-colors">
                    <Download className="w-4 h-4" /> Export CSV
                </button>
                <button onClick={() => navigate('/dashboard/subjects/allocation')}
                    className="bg-[#0F766E]/10 hover:bg-[#0F766E]/20 text-[#0F766E] px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 text-sm font-semibold shadow-sm transition-colors border border-[#0F766E]/20">
                    <Users className="w-4 h-4" /> Allocate Electives
                </button>
                <button onClick={() => navigate('/dashboard/subjects/add')}
                    className="bg-[#1E4DA6] hover:bg-[#173F8C] text-white px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 text-sm font-semibold shadow-sm transition-colors">
                    <Plus className="w-4 h-4" /> Add New Subject
                </button>
            </div>
            
            <div className="flex justify-end mb-4">
                <ViewToggle view={view} onChange={setView} />
            </div>

            {/* KPI strip — dynamic from classes */}
            {classes.length > 0 && (
                <div className="flex overflow-x-auto pb-4 gap-3 mb-2 snap-x">
                    {classes.map((cls, i) => {
                        const count = subjects.filter(s => s.classes.some(c => c.class.name === cls.name)).length;
                        const style = CLASS_BADGE_COLORS[i % CLASS_BADGE_COLORS.length];
                        const classIdMatch = classes.find(c => c.name === cls.name)?.id;
                        return (
                            <button key={cls.id} onClick={() => setFilterClass(filterClass === classIdMatch ? 'all' : (classIdMatch || 'all'))}
                                className={`flex-shrink-0 min-w-[120px] rounded-xl p-3 text-left border transition-all snap-start ${filterClass === classIdMatch ? 'border-[#1E4DA6]/60 shadow-md shadow-[#1E4DA6]/10' : 'border-slate-100 bg-white shadow-sm hover:shadow-md'}`}>
                                <div className={`text-xs font-bold px-2 py-0.5 rounded-full inline-block mb-1 ${style}`}>{cls.name}</div>
                                <p className="text-xl font-bold text-slate-900">{count}</p>
                                <p className="text-[10px] text-slate-400">subjects</p>
                            </button>
                        );
                    })}
                </div>
            )}

            {/* Toolbar */}
            <div className="flex flex-wrap gap-3 mb-6">
                <div className="relative flex-1 max-w-sm">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input type="text" placeholder="Search subjects or code..."
                        value={search} onChange={e => setSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-[#1E4DA6] bg-white" />
                </div>
                <button onClick={() => setShowFilters(!showFilters)}
                    className="flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white text-slate-600 hover:bg-slate-50">
                    <Filter className="w-4 h-4" /> Filter <ChevronDown className={`w-3 h-3 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                </button>
                <button onClick={() => setShowDeleted(!showDeleted)}
                    className={`flex items-center gap-2 px-3 py-2 border rounded-lg text-sm transition-colors ${showDeleted ? 'bg-red-50 text-red-600 border-red-200' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>
                    {showDeleted ? 'Hide Deleted' : 'Show Deleted'}
                </button>
                {showFilters && (
                    <div className="w-full flex flex-wrap gap-2">
                        <button onClick={() => setFilterCat('all')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${filterCat === 'all' ? 'bg-[#1E4DA6] text-white border-[#1E4DA6]' : 'bg-white border-slate-200 text-slate-600'}`}>
                            All Categories
                        </button>
                        {uniqueCategories.map(cat => (
                            <button key={cat.id} onClick={() => setFilterCat(cat.id)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${filterCat === cat.id ? 'bg-[#1E4DA6] text-white border-[#1E4DA6]' : 'bg-white border-slate-200 text-slate-600'}`}>
                                {cat.name}
                            </button>
                        ))}
                    </div>
                )}
                {showFilters && (
                    <div className="w-full flex flex-wrap gap-2 mt-2">
                        <button onClick={() => setFilterClass('all')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${filterClass === 'all' ? 'bg-[#1E4DA6] text-white border-[#1E4DA6]' : 'bg-white border-slate-200 text-slate-600'}`}>
                            All Classes
                        </button>
                        {classes.map(clsObj => (
                            <button key={clsObj.id} onClick={() => setFilterClass(clsObj.id)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${filterClass === clsObj.id ? 'bg-[#1E4DA6] text-white border-[#1E4DA6]' : 'bg-white border-slate-200 text-slate-600'}`}>
                                {clsObj.name}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-10 h-10 animate-spin text-[#1E4DA6]" />
                </div>
            ) : view === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                    {displayed.map((subject) => {
                        const catName = subject.category?.name ?? 'General';
                        const catStyle = CATEGORY_COLORS[(subject.category?.name?.length ?? 0) % CATEGORY_COLORS.length];
                        return (
                            <div key={subject.id} className="bg-white rounded-[20px] shadow-sm border border-slate-100 p-5 flex flex-col justify-between min-h-[190px] hover:shadow-md transition-shadow relative overflow-hidden group">
                                <div className="absolute -right-8 -top-8 w-24 h-24 bg-[#1E4DA6]/5 rounded-full group-hover:scale-110 transition-transform duration-500" />

                                <div className="flex items-start justify-between mb-2 relative z-10">
                                    <div className="flex flex-wrap gap-1">
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${catStyle}`}>{catName}</span>
                                        {subject.classes.slice(0, 2).map((c) => {
                                            const cStyle = getClassStyle(c.class.name);
                                            return <span key={c.class.name} className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${cStyle.cls}`}>{c.class.name}</span>
                                        })}
                                        {subject.classes.length > 2 && (
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">+{subject.classes.length - 2}</span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-1 text-slate-300 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity shrink-0 ml-1">
                                        {subject.status === 'Deleted' ? (
                                            <button onClick={() => handleRestore(subject.id, subject.name)} className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-md hover:bg-green-200 transition-colors">
                                                Restore
                                            </button>
                                        ) : (
                                            <>
                                                <button onClick={() => setEditingSubjectId(subject.id)} className="hover:text-[#1E4DA6]"><Edit3 className="w-4 h-4" /></button>
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <button className="hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>Delete "{subject.name}"?</AlertDialogTitle>
                                                            <AlertDialogDescription>This will permanently remove this subject and all class assignments. This cannot be undone.</AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                            <AlertDialogAction onClick={() => handleDelete(subject.id, subject.name)} className="bg-red-600 hover:bg-red-700 text-white">Delete</AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </>
                                        )}
                                    </div>
                                </div>

                                <div className="relative z-10 mt-auto mb-2">
                                    <h3 className="text-lg font-bold text-slate-800 leading-tight">{subject.name}</h3>
                                    {subject.code && <span className="text-[10px] font-mono text-slate-400">{subject.code}</span>}
                                    <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                                        <BookOpen className="w-3 h-3" />
                                        {subject.classes.length > 0
                                            ? `${subject.classes.length} class${subject.classes.length > 1 ? 'es' : ''}`
                                            : 'No class assigned'}
                                    </p>
                                    {subject.teacher && (
                                        <p className="text-[10px] text-slate-400 mt-0.5">👨‍🏫 {subject.teacher.user.name}</p>
                                    )}
                                </div>
                            </div>
                        );
                    })}

                    {/* Add New Card */}
                    {view === 'grid' && (
                        <button onClick={() => navigate('/dashboard/subjects/add')}
                            className="flex flex-col items-center justify-center min-h-[190px] border-2 border-dashed border-[#1E4DA6]/35 rounded-[20px] bg-[#1E4DA6]/8 hover:bg-[#1E4DA6]/5 transition-colors group cursor-pointer">
                            <Plus className="w-8 h-8 text-[#1E4DA6] mb-2 group-hover:scale-110 transition-transform" />
                            <span className="text-[#1E4DA6] font-semibold text-sm">Add New Subject</span>
                        </button>
                    )}
                </div>
            ) : null}

            {view === 'table' && displayed.length > 0 && !isLoading && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mt-4">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-4 font-semibold">Subject</th>
                                    <th className="px-6 py-4 font-semibold">Category</th>
                                    <th className="px-6 py-4 font-semibold">Classes</th>
                                    <th className="px-6 py-4 font-semibold">Teacher</th>
                                    <th className="px-6 py-4 font-semibold text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {displayed.map(subject => {
                                    const catName = subject.category?.name ?? 'General';
                                    const catStyle = CATEGORY_COLORS[(subject.category?.name?.length ?? 0) % CATEGORY_COLORS.length];
                                    return (
                                        <tr key={subject.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-slate-800">{subject.name}</div>
                                                {subject.code && <div className="text-xs text-slate-400 font-mono">{subject.code}</div>}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${catStyle}`}>{catName}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-wrap gap-1 max-w-[200px]">
                                                    {subject.classes.slice(0, 2).map((c) => {
                                                        const cStyle = getClassStyle(c.class.name);
                                                        return <span key={c.class.name} className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${cStyle.cls}`}>{c.class.name}</span>
                                                    })}
                                                    {subject.classes.length > 2 && (
                                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">+{subject.classes.length - 2}</span>
                                                    )}
                                                    {subject.classes.length === 0 && <span className="text-xs text-slate-400 italic">None</span>}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {subject.teacher ? (
                                                    <div className="flex items-center gap-1.5">
                                                        <div className="w-6 h-6 rounded-full bg-[#1E4DA6]/10 flex items-center justify-center text-[#173F8C] font-bold text-xs">
                                                            {subject.teacher.user.name.charAt(0)}
                                                        </div>
                                                        <span className="text-slate-700">{subject.teacher.user.name}</span>
                                                    </div>
                                                ) : <span className="text-slate-400 italic">Unassigned</span>}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    {subject.status === 'Deleted' ? (
                                                        <button onClick={() => handleRestore(subject.id, subject.name)} className="px-3 py-1.5 bg-green-100 text-green-700 text-xs font-bold rounded-md hover:bg-green-200 transition-colors">
                                                            Restore
                                                        </button>
                                                    ) : (
                                                        <>
                                                            <button onClick={() => setEditingSubjectId(subject.id)} className="rounded-lg p-2 text-slate-400 hover:bg-[#1E4DA6]/5 hover:text-[#1E4DA6] transition-colors">
                                                                <Edit3 className="h-4 w-4" />
                                                            </button>
                                                            <AlertDialog>
                                                                <AlertDialogTrigger asChild>
                                                                    <button className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors">
                                                                        <Trash2 className="h-4 w-4" />
                                                                    </button>
                                                                </AlertDialogTrigger>
                                                                <AlertDialogContent>
                                                                    <AlertDialogHeader>
                                                                        <AlertDialogTitle>Delete "{subject.name}"?</AlertDialogTitle>
                                                                        <AlertDialogDescription>This will permanently remove this subject and all class assignments. This cannot be undone.</AlertDialogDescription>
                                                                    </AlertDialogHeader>
                                                                    <AlertDialogFooter>
                                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                        <AlertDialogAction onClick={() => handleDelete(subject.id, subject.name)} className="bg-red-600 hover:bg-red-700 text-white">Delete</AlertDialogAction>
                                                                    </AlertDialogFooter>
                                                                </AlertDialogContent>
                                                            </AlertDialog>
                                                        </>
                                                    )}
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

            {!isLoading && totalPages > 1 && (
                <div className="mt-6">
                    <Pagination
                        currentPage={page}
                        totalPages={totalPages}
                        totalRecords={totalRecords}
                        onPageChange={setPage}
                    />
                </div>
            )}
            <EditSubjectModal 
                subjectId={editingSubjectId} 
                onClose={() => setEditingSubjectId(null)} 
                onSuccess={fetchData} 
            />
        </SettingsShell>
    );
}
