import { useState, useEffect } from 'react';
import { Plus, Edit3, Trash2, BookOpen, Users, Loader2, GraduationCap, Printer, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
    AlertDialogTitle, AlertDialogTrigger,
} from '../../../components/ui/alert-dialog';
import { SettingsShell } from '../settings/shared/SettingsShell';
import { SettingsHero } from '../settings/shared/SettingsHero';
import { cn } from '../../../lib/utils';
import { useAuth } from './../../../context/AuthContext';
import { EditClassModal } from './EditClassModal';
import { ViewToggle } from '../../../components/shared/ViewToggle';
import { useViewPreference } from '../../../hooks/useViewPreference';

const API = '/api/v1';

interface SectionInfo {
    id: string;
    name: string;
    type: string | null;
    shortCode: string | null;
}

interface ClassData {
    id: string;
    name: string;
    level: string;
    sectionId: string | null;
    sectionRel: SectionInfo | null;
    status: string;
    subjects: { subject: { name: string } }[];
    students: { id: string }[];
    formTeacher?: { id: string; user: { name: string } } | null;
}

// Color palette cycling for sections
const SECTION_COLOR_PALETTE = [
    { bg: 'bg-[#1E4DA6]/5', border: 'border-[#1E4DA6]/20', header: 'bg-[#1E4DA6]', text: 'text-[#173F8C]', badge: 'bg-[#1E4DA6]/10 text-[#173F8C]' },
    { bg: 'bg-indigo-50', border: 'border-indigo-200', header: 'bg-indigo-600', text: 'text-indigo-700', badge: 'bg-indigo-100 text-indigo-700' },
    { bg: 'bg-violet-50', border: 'border-violet-200', header: 'bg-violet-600', text: 'text-violet-700', badge: 'bg-violet-100 text-violet-700' },
    { bg: 'bg-emerald-50', border: 'border-emerald-200', header: 'bg-emerald-600', text: 'text-emerald-700', badge: 'bg-emerald-100 text-emerald-700' },
    { bg: 'bg-amber-50', border: 'border-amber-200', header: 'bg-amber-600', text: 'text-amber-700', badge: 'bg-amber-100 text-amber-700' },
    { bg: 'bg-pink-50', border: 'border-pink-200', header: 'bg-pink-600', text: 'text-pink-700', badge: 'bg-pink-100 text-pink-700' },
    { bg: 'bg-teal-50', border: 'border-teal-200', header: 'bg-teal-600', text: 'text-teal-700', badge: 'bg-teal-100 text-teal-700' },
    { bg: 'bg-rose-50', border: 'border-rose-200', header: 'bg-rose-600', text: 'text-rose-700', badge: 'bg-rose-100 text-rose-700' },
];

const DEFAULT_COLOR = SECTION_COLOR_PALETTE[0];

export function AllClasses() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [classes, setClasses] = useState<ClassData[]>([]);
    const [sections, setSections] = useState<SectionInfo[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeSectionId, setActiveSectionId] = useState<string>('all');
    const [editingClassId, setEditingClassId] = useState<string | null>(null);
    const [view, setView] = useViewPreference('allclasses');
    const [totalRecords, setTotalRecords] = useState(0);
    const [isPrinting, setIsPrinting] = useState(false);

    const fetchAll = async () => {
        setIsLoading(true);
        try {
            const [classRes, sectionRes] = await Promise.all([
                axios.get(`${API}/classes/all`, { params: { limit: 500 }, withCredentials: true }),
                axios.get(`${API}/sections`, { withCredentials: true })
            ]);
            setClasses(classRes.data.classes || []);
            setTotalRecords(classRes.data.total || (classRes.data.classes || []).length);
            setSections(sectionRes.data.sections || []);
        } catch (e: any) {
            toast.error(e.response?.data?.msg || 'Failed to load classes');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { fetchAll(); }, []);

    const handleDelete = async (id: string, name: string) => {
        try {
            await axios.delete(`${API}/classes/${id}`, { withCredentials: true });
            toast.success(`Class "${name}" deleted`);
            fetchAll();
        } catch (e) {
            const err = e as { response?: { data?: { msg?: string } } };
            toast.error(err.response?.data?.msg || 'Failed to delete class');
        }
    };

    const handlePrintAllClasses = async () => {
        setIsPrinting(true);
        try {
            const res = await axios.get(`${API}/students/all?limit=10000`, { withCredentials: true });
            const students = res.data.students || [];
            
            const studentsByClass: Record<string, any[]> = {};
            students.forEach((s: any) => {
                const cid = s.classId || '__none__';
                if (!studentsByClass[cid]) studentsByClass[cid] = [];
                studentsByClass[cid].push(s);
            });
            
            const printWindow = window.open('', '', 'width=900,height=700');
            if (!printWindow) return toast.error('Popup blocked. Please allow popups to print.');
            
            let html = `<html><head><title>Classes & Students Roster</title>
                <style>
                    body { font-family: sans-serif; padding: 20px; }
                    h2 { border-bottom: 2px solid #ccc; padding-bottom: 5px; margin-top: 30px; font-size: 18px; }
                    table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 14px; }
                    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                    th { background-color: #f5f5f5; }
                    .header { text-align: center; margin-bottom: 30px; }
                    @media print {
                        h2 { page-break-after: avoid; }
                        table { page-break-inside: auto; }
                        tr { page-break-inside: avoid; page-break-after: auto; }
                    }
                </style>
            </head><body>`;
            
            const schoolName = user?.school?.name ? `${user.school.name} - ` : '';
            html += `<div class="header"><h1>${schoolName}School Classes Roster</h1></div>`;
            
            classes.forEach(cls => {
                const classStudents = studentsByClass[cls.id] || [];
                // Sort students alphabetically
                classStudents.sort((a, b) => {
                    const nameA = a.user?.name || '';
                    const nameB = b.user?.name || '';
                    return nameA.localeCompare(nameB);
                });
                
                html += `<h2>${cls.name} (${classStudents.length} Students)</h2>`;
                if (classStudents.length === 0) {
                    html += `<p>No students enrolled.</p>`;
                } else {
                    html += `<table>
                        <thead>
                            <tr>
                                <th style="width: 50px">#</th>
                                <th style="width: 150px">Admission No</th>
                                <th>Student Name</th>
                                <th style="width: 100px">Gender</th>
                            </tr>
                        </thead>
                        <tbody>`;
                    classStudents.forEach((st, i) => {
                        const studentName = st.user?.name || 'Unknown';
                        html += `<tr>
                            <td>${i + 1}</td>
                            <td>${st.admissionNo || '-'}</td>
                            <td>${studentName}</td>
                            <td>${st.gender || '-'}</td>
                        </tr>`;
                    });
                    html += `</tbody></table>`;
                }
            });
            
            html += `</body></html>`;
            printWindow.document.write(html);
            printWindow.document.close();
            printWindow.focus();
            setTimeout(() => {
                printWindow.print();
                printWindow.close();
            }, 500);
            
        } catch (e) {
            toast.error('Failed to generate print data.');
        } finally {
            setIsPrinting(false);
        }
    };

    // ─── Grouping logic ───────────────────────────────────────────────────────
    // Build section → color map deterministically
    const sectionColorMap: Record<string, typeof SECTION_COLOR_PALETTE[0]> = {};
    sections.forEach((sec, i) => {
        sectionColorMap[sec.id] = SECTION_COLOR_PALETTE[i % SECTION_COLOR_PALETTE.length];
    });

    // Filter by active section tab
    const filteredClasses = activeSectionId === 'all'
        ? classes
        : classes.filter(c => c.sectionId === activeSectionId);

    // Group filtered classes by sectionId for display
    const grouped: Record<string, { section: SectionInfo | null; classes: ClassData[] }> = {};
    filteredClasses.forEach(cls => {
        const key = cls.sectionId || '__none__';
        if (!grouped[key]) {
            grouped[key] = { section: cls.sectionRel, classes: [] };
        }
        grouped[key].classes.push(cls);
    });

    // Sort groups: sections first (by their order from sections array), then "Uncategorised"
    const sectionOrder = sections.map(s => s.id);
    const sortedGroupKeys = Object.keys(grouped).sort((a, b) => {
        if (a === '__none__') return 1;
        if (b === '__none__') return -1;
        return sectionOrder.indexOf(a) - sectionOrder.indexOf(b);
    });

    // Build tab list: All + each section that has at least one class
    const sectionsWithClasses = sections.filter(s => classes.some(c => c.sectionId === s.id));
    const hasUncategorised = classes.some(c => !c.sectionId);

    const ClassCard = ({ cls, color }: { cls: ClassData; color: typeof SECTION_COLOR_PALETTE[0] }) => (
        <div className="relative flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-all group">
            <div className="flex items-start justify-between mb-3">
                <h3 className="font-bold text-slate-800 text-base leading-tight">{cls.name}</h3>
                <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-bold', cls.status === 'Active' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500')}>
                    {cls.status}
                </span>
            </div>

            {cls.formTeacher && (
                <p className="text-xs text-slate-400 mb-3 truncate">
                    Form Teacher: <span className="font-semibold text-slate-600">{cls.formTeacher.user.name}</span>
                </p>
            )}

            <div className="grid grid-cols-2 gap-2 mt-auto mb-4">
                <div 
                    className="rounded-xl bg-slate-50 p-2.5 flex flex-col gap-0.5 cursor-pointer hover:bg-slate-100 transition-colors"
                    onClick={() => navigate('/dashboard/classes/roster/' + cls.id, { state: { className: cls.name } })}
                    title="View Class Roster"
                >
                    <div className="flex items-center gap-1 text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                        <Users className="w-3 h-3" /> Students
                    </div>
                    <span className="font-mono text-sm font-semibold text-[#1E4DA6] underline decoration-[#1E4DA6]/20 underline-offset-2">{cls.students?.length ?? 0}</span>
                </div>
                <div className="rounded-xl bg-slate-50 p-2.5 flex flex-col gap-0.5">
                    <div className="flex items-center gap-1 text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                        <BookOpen className="w-3 h-3" /> Subjects
                    </div>
                    <span className="font-mono text-sm font-semibold text-slate-700">{cls.subjects.length}</span>
                </div>
            </div>

            <div className="flex items-center justify-between border-t border-slate-100 pt-3 mt-auto">
                <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-bold', color.badge)}>
                    {cls.sectionRel?.name ?? 'No section'}
                </span>
                <div className="flex items-center gap-1">
                    <button onClick={() => setEditingClassId(cls.id)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-[#1E4DA6] transition-colors">
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
                                <AlertDialogTitle>Delete Class "{cls.name}"?</AlertDialogTitle>
                                <AlertDialogDescription>This will permanently remove the class and all linked subject assignments. Students will not be deleted.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(cls.id, cls.name)} className="bg-red-600 hover:bg-red-700 text-white">Delete</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            </div>
        </div>
    );

    return (
        <SettingsShell
            breadcrumbParent="Dashboard"
            breadcrumbCurrent="All Classes"
            tabLabel="All Classes"
            tabIcon={<GraduationCap className="h-3.5 w-3.5" />}
        >
            <SettingsHero
                icon={<GraduationCap className="h-7 w-7" />}
                title="All Classes"
                subtitle="Classes are organised by section. Use the tabs below to filter by section."
            />

            {/* Header actions */}
            <div className="print:hidden flex flex-col sm:flex-row md:justify-end mb-6 gap-3">
                <button
                    disabled={isPrinting}
                    onClick={handlePrintAllClasses}
                    className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50 transition-colors shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isPrinting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Printer className="h-4 w-4" />} 
                    {isPrinting ? 'Preparing...' : 'Print List'}
                </button>
                <button
                    onClick={() => navigate('/dashboard/classes/add-class')}
                    className="flex items-center gap-2 rounded-xl bg-[#173F8C] px-5 py-2.5 text-sm font-bold text-white shadow-md hover:bg-[#122F69] transition-colors shrink-0"
                >
                    <Plus className="h-4 w-4" /> Add New Class
                </button>
            </div>

            {/* KPI Strip */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1 w-full">
                    {[
                        { icon: <GraduationCap className="h-5 w-5" />, label: 'Total Classes', value: totalRecords, color: 'bg-[#1E4DA6]/10 text-[#173F8C]' },
                        { icon: <BookOpen className="h-5 w-5" />, label: 'With Subjects', value: classes.filter(c => c.subjects.length > 0).length, color: 'bg-emerald-100 text-emerald-700' },
                        { icon: <Users className="h-5 w-5" />, label: 'Active Classes', value: classes.filter(c => c.status === 'Active').length, color: 'bg-violet-100 text-violet-700' },
                    ].map((k) => (
                        <div key={k.label} className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                            <div className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-xl', k.color)}>{k.icon}</div>
                            <div>
                                <p className="text-xs text-slate-500">{k.label}</p>
                                <p className="text-2xl font-black text-slate-800">{k.value}</p>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="shrink-0 self-end sm:self-auto">
                    <ViewToggle view={view} onChange={setView} />
                </div>
            </div>

            {/* Section Filter Tabs */}
            {!isLoading && classes.length > 0 && (
                <div className="print:hidden flex flex-wrap gap-2 mb-6 border-b border-slate-100 pb-4">
                    <button
                        onClick={() => setActiveSectionId('all')}
                        className={cn(
                            'px-4 py-2 rounded-xl text-sm font-bold transition-all',
                            activeSectionId === 'all'
                                ? 'bg-slate-800 text-white shadow-md'
                                : 'bg-white text-slate-500 border border-slate-200 hover:border-slate-300 hover:text-slate-700'
                        )}
                    >
                        All Sections
                        <span className="ml-1.5 rounded-full bg-slate-700/20 px-1.5 py-0.5 text-[10px] font-bold">{classes.length}</span>
                    </button>
                    {sectionsWithClasses.map((sec, i) => {
                        const color = SECTION_COLOR_PALETTE[i % SECTION_COLOR_PALETTE.length];
                        const count = classes.filter(c => c.sectionId === sec.id).length;
                        const isActive = activeSectionId === sec.id;
                        return (
                            <button
                                key={sec.id}
                                onClick={() => setActiveSectionId(sec.id)}
                                className={cn(
                                    'px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-1.5',
                                    isActive
                                        ? `${color.header} text-white shadow-md`
                                        : `bg-white text-slate-500 border border-slate-200 hover:border-slate-300 hover:text-slate-700`
                                )}
                            >
                                {sec.name}
                                <span className={cn('rounded-full px-1.5 py-0.5 text-[10px] font-bold', isActive ? 'bg-white/20' : 'bg-slate-100')}>{count}</span>
                            </button>
                        );
                    })}
                    {hasUncategorised && (
                        <button
                            onClick={() => setActiveSectionId('__none__')}
                            className={cn(
                                'px-4 py-2 rounded-xl text-sm font-bold transition-all',
                                activeSectionId === '__none__'
                                    ? 'bg-slate-600 text-white shadow-md'
                                    : 'bg-white text-slate-500 border border-slate-200 hover:border-slate-300'
                            )}
                        >
                            Uncategorised
                        </button>
                    )}
                </div>
            )}

            {isLoading ? (
                <div className="flex justify-center p-20"><Loader2 className="h-8 w-8 animate-spin text-[#1E4DA6]" /></div>
            ) : classes.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-12 text-center">
                    <GraduationCap className="mx-auto h-12 w-12 text-slate-300 mb-3" />
                    <h3 className="text-lg font-bold text-slate-700">No classes found</h3>
                    <p className="text-slate-500 mt-1 mb-5 text-sm max-w-md mx-auto">
                        Create your first class to get started. Make sure you have set up sections in <strong>Settings → Sections</strong> first.
                    </p>
                    <button onClick={() => navigate('/dashboard/classes/add-class')} className="rounded-xl bg-[#173F8C] px-5 py-2.5 text-sm font-bold text-white shadow-md hover:bg-[#122F69]">
                        Add First Class
                    </button>
                </div>
            ) : (
                /* Grouped by section */
                <div className="space-y-8">
                    {sortedGroupKeys.map(key => {
                        const group = grouped[key];
                        const secId = key === '__none__' ? null : key;
                        const color = secId ? (sectionColorMap[secId] ?? DEFAULT_COLOR) : DEFAULT_COLOR;
                        const sectionName = group.section?.name ?? 'Uncategorised';
                        const classCount = group.classes.length;

                        return (
                            <div key={key} className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
                                {/* Section header */}
                                <div className={cn('flex items-center justify-between px-5 py-3', color.header)}>
                                    <div className="flex items-center gap-3">
                                        <span className="text-white font-bold text-sm">{sectionName}</span>
                                        {group.section?.shortCode && (
                                            <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold text-white">{group.section.shortCode}</span>
                                        )}
                                    </div>
                                    <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-bold text-white">
                                        {classCount} {classCount === 1 ? 'class' : 'classes'}
                                    </span>
                                </div>

                                {/* Classes inside section */}
                                {view === 'grid' ? (
                                    <div className={cn('p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3', color.bg)}>
                                        {group.classes.map(cls => (
                                            <ClassCard key={cls.id} cls={cls} color={color} />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left text-sm whitespace-nowrap">
                                            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                                                <tr>
                                                    <th className="px-5 py-3 font-semibold">Class Name</th>
                                                    <th className="px-5 py-3 font-semibold">Students</th>
                                                    <th className="px-5 py-3 font-semibold">Subjects</th>
                                                    <th className="px-5 py-3 font-semibold">Form Teacher</th>
                                                    <th className="px-5 py-3 font-semibold">Status</th>
                                                    <th className="px-5 py-3 font-semibold text-right">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {group.classes.map(cls => (
                                                    <tr key={cls.id} className="hover:bg-slate-50/50 transition-colors">
                                                        <td className="px-5 py-3">
                                                            <span className="font-bold text-slate-800">{cls.name}</span>
                                                        </td>
                                                        <td className="px-5 py-3">
                                                            <button 
                                                                onClick={() => navigate('/dashboard/classes/roster/' + cls.id, { state: { className: cls.name } })}
                                                                className="flex items-center gap-1 text-[#1E4DA6] hover:text-[#122F69] font-bold hover:bg-[#1E4DA6]/5 px-2 py-1 rounded-lg transition-colors"
                                                                title="View Class Roster"
                                                            >
                                                                <Users className="w-3.5 h-3.5" /> {cls.students?.length ?? 0}
                                                            </button>
                                                        </td>
                                                        <td className="px-5 py-3">
                                                            <div className="flex items-center gap-1 text-slate-500">
                                                                <BookOpen className="w-3.5 h-3.5" /> {cls.subjects.length}
                                                            </div>
                                                        </td>
                                                        <td className="px-5 py-3 text-slate-500 text-xs">
                                                            {cls.formTeacher?.user.name ?? <span className="text-slate-300">—</span>}
                                                        </td>
                                                        <td className="px-5 py-3">
                                                            <span className={cn('rounded-full px-2.5 py-1 text-[10px] font-bold', cls.status === 'Active' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500')}>
                                                                {cls.status}
                                                            </span>
                                                        </td>
                                                        <td className="px-5 py-3 text-right">
                                                            <div className="flex items-center justify-end gap-2">
                                                                <button onClick={() => setEditingClassId(cls.id)} className="rounded-lg p-2 text-slate-400 hover:bg-green-50 hover:text-green-600 transition-colors">
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
                                                                            <AlertDialogTitle>Delete Class "{cls.name}"?</AlertDialogTitle>
                                                                            <AlertDialogDescription>This will permanently remove the class and all linked subject assignments. Students will not be deleted.</AlertDialogDescription>
                                                                        </AlertDialogHeader>
                                                                        <AlertDialogFooter>
                                                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                            <AlertDialogAction onClick={() => handleDelete(cls.id, cls.name)} className="bg-red-600 hover:bg-red-700 text-white">Delete</AlertDialogAction>
                                                                        </AlertDialogFooter>
                                                                    </AlertDialogContent>
                                                                </AlertDialog>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        );
                    })}

                    {/* Add class CTA card at bottom */}
                    <button
                        onClick={() => navigate('/dashboard/classes/add-class')}
                        className="print:hidden w-full flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[#1E4DA6]/20 bg-[#1E4DA6]/8 hover:bg-[#1E4DA6]/5 py-6 transition-colors group"
                    >
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#1E4DA6]/10 group-hover:bg-[#1E4DA6]/20 transition-colors">
                            <Plus className="h-5 w-5 text-[#1E4DA6]" />
                        </div>
                        <span className="text-sm font-bold text-[#1E4DA6]">Add New Class</span>
                        <ChevronRight className="h-4 w-4 text-[#1E4DA6]/60" />
                    </button>
                </div>
            )}

            <EditClassModal
                classId={editingClassId}
                onClose={() => setEditingClassId(null)}
                onSuccess={fetchAll}
            />
        </SettingsShell>
    );
}
