import { useState, useEffect } from 'react';
import { Button } from '../../../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
// Removed Checkbox import
import { ArrowLeft, Save, Search, AlertCircle, Users, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { SettingsShell } from '../settings/shared/SettingsShell';
import { SettingsHero } from '../settings/shared/SettingsHero';

const API = '/api/v1';

export function SubjectAllocation() {
    const navigate = useNavigate();
    const [classes, setClasses] = useState<any[]>([]);
    const [subjects, setSubjects] = useState<any[]>([]);
    const [selectedClass, setSelectedClass] = useState<string>('');
    const [selectedSubject, setSelectedSubject] = useState<string>('');
    
    const [students, setStudents] = useState<any[]>([]);
    const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 20;

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, selectedClass, selectedSubject]);

    useEffect(() => {
        // Fetch classes
        axios.get(`${API}/classes/all`, { withCredentials: true })
            .then(res => setClasses(res.data.classes || []))
            .catch(() => toast.error('Failed to load classes'));
        
        // Fetch subjects
        axios.get(`${API}/subjects/all?limit=1000`, { withCredentials: true })
            .then(res => setSubjects((res.data.subjects || []).filter((s: any) => s.type === 'ELECTIVE')))
            .catch(() => toast.error('Failed to load subjects'));
    }, []);

    useEffect(() => {
        if (selectedClass && selectedSubject) {
            fetchAllocations();
        } else {
            setStudents([]);
            setSelectedStudentIds(new Set());
        }
    }, [selectedClass, selectedSubject]);

    const fetchAllocations = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API}/subjects/allocations?classId=${selectedClass}&subjectId=${selectedSubject}`, { withCredentials: true });
            const allocs = res.data.allocations || [];
            setStudents(allocs);
            
            const initiallySelected = new Set<string>();
            allocs.forEach((a: any) => {
                if (a.isAllocated) initiallySelected.add(a.studentId);
            });
            setSelectedStudentIds(initiallySelected);
        } catch (err) {
            console.error(err);
            toast.error('Failed to fetch allocations');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!selectedClass || !selectedSubject) return;
        setSaving(true);
        try {
            await axios.post(`${API}/subjects/allocations/${selectedSubject}`, {
                classId: selectedClass,
                studentIds: Array.from(selectedStudentIds)
            }, { withCredentials: true });
            toast.success('Subject allocations saved successfully');
        } catch (err) {
            console.error(err);
            toast.error('Failed to save allocations');
        } finally {
            setSaving(false);
        }
    };

    const toggleStudent = (id: string) => {
        const newSet = new Set(selectedStudentIds);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setSelectedStudentIds(newSet);
    };

    const filteredStudents = students.filter(s => 
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        s.admissionNo.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
    const paginatedStudents = filteredStudents.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const toggleAll = () => {
        if (paginatedStudents.length === 0) return;
        
        const allFilteredSelected = paginatedStudents.every(s => selectedStudentIds.has(s.studentId));
        
        const newSet = new Set(selectedStudentIds);
        paginatedStudents.forEach(s => {
            if (allFilteredSelected) {
                newSet.delete(s.studentId);
            } else {
                newSet.add(s.studentId);
            }
        });
        setSelectedStudentIds(newSet);
    };

    return (
        <SettingsShell
            breadcrumbParent="Subjects"
            breadcrumbCurrent="Elective Allocation"
            tabLabel="Subject Allocation"
            tabIcon={<Users className="h-3.5 w-3.5" />}
        >
            <SettingsHero
                icon={<Users className="h-7 w-7" />}
                title="Subject Allocation"
                subtitle="Assign elective subjects to specific students. Only allocated students will appear in the score entry sheet for these subjects."
            />

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-dash-dark">Target Class</label>
                            <Select value={selectedClass} onValueChange={setSelectedClass}>
                                <SelectTrigger className="bg-white h-11 border-gray-200">
                                    <SelectValue placeholder="Select Class" />
                                </SelectTrigger>
                                <SelectContent>
                                    {classes.map(c => (
                                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-dash-dark">Elective Subject</label>
                            <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                                <SelectTrigger className="bg-white h-11 border-gray-200">
                                    <SelectValue placeholder="Select Subject" />
                                </SelectTrigger>
                                <SelectContent>
                                    {subjects.length === 0 && (
                                        <div className="p-3 text-sm text-gray-500 text-center">No elective subjects found. Ensure subject 'type' is set to ELECTIVE.</div>
                                    )}
                                    {subjects.map(s => (
                                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>

                {!selectedClass || !selectedSubject ? (
                    <div className="p-12 text-center flex flex-col items-center justify-center text-gray-500">
                        <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mb-4 border border-gray-100">
                            <AlertCircle className="w-8 h-8 text-gray-300" />
                        </div>
                        <p>Select a class and an elective subject to assign students.</p>
                    </div>
                ) : loading ? (
                    <div className="p-12 text-center flex flex-col items-center justify-center">
                        <div className="w-8 h-8 border-4 border-brand-teal/20 border-t-brand-teal rounded-full animate-spin"></div>
                        <p className="mt-4 text-sm text-gray-500 font-medium">Loading roster...</p>
                    </div>
                ) : (
                    <div className="p-0 flex flex-col h-full">
                        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white">
                            <div className="relative max-w-sm w-full">
                                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                <input 
                                    type="text" 
                                    placeholder="Search students..." 
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal transition-all"
                                />
                            </div>
                            <div className="text-sm font-medium text-gray-500">
                                <span className="text-brand-teal font-bold">{selectedStudentIds.size}</span> of {students.length} Allocated
                            </div>
                        </div>

                        <div className="overflow-hidden">
                            {/* Desktop Header */}
                            <div className="hidden md:grid grid-cols-[60px_1fr_2fr] gap-4 bg-gray-50/80 text-gray-600 font-semibold uppercase text-xs tracking-wider border-b border-gray-200 px-4 py-3">
                                <div className="flex items-center justify-center">
                                    <input 
                                        type="checkbox"
                                        className="w-4 h-4 rounded border-gray-300 text-brand-teal focus:ring-brand-teal cursor-pointer"
                                        checked={paginatedStudents.length > 0 && paginatedStudents.every(s => selectedStudentIds.has(s.studentId))}
                                        onChange={toggleAll}
                                    />
                                </div>
                                <div className="flex items-center">Admission No</div>
                                <div className="flex items-center">Student Name</div>
                            </div>
                            
                            {/* Mobile Header */}
                            <div className="md:hidden flex items-center justify-between bg-gray-50/80 text-gray-600 font-semibold uppercase text-xs tracking-wider border-b border-gray-200 px-4 py-3">
                                <span>Select All</span>
                                <input 
                                    type="checkbox"
                                    className="w-4 h-4 rounded border-gray-300 text-brand-teal focus:ring-brand-teal cursor-pointer"
                                    checked={paginatedStudents.length > 0 && paginatedStudents.every(s => selectedStudentIds.has(s.studentId))}
                                    onChange={toggleAll}
                                />
                            </div>

                            <div className="divide-y divide-gray-100">
                                {paginatedStudents.length === 0 ? (
                                    <div className="p-12 text-center text-gray-500 text-sm">
                                        No students found.
                                    </div>
                                ) : (
                                    paginatedStudents.map((student) => (
                                        <div 
                                            key={student.studentId} 
                                            className="flex flex-col md:grid md:grid-cols-[60px_1fr_2fr] gap-3 md:gap-4 p-4 md:p-3 hover:bg-brand-teal/5 transition-colors group cursor-pointer" 
                                            onClick={() => toggleStudent(student.studentId)}
                                        >
                                            <div className="flex items-center justify-between md:justify-center order-1 md:order-none">
                                                <span className="text-xs font-semibold text-gray-400 uppercase md:hidden">Status</span>
                                                <input 
                                                    type="checkbox"
                                                    className="w-4 h-4 rounded border-gray-300 text-brand-teal focus:ring-brand-teal cursor-pointer"
                                                    checked={selectedStudentIds.has(student.studentId)}
                                                    onChange={() => {}} // Handled by parent onClick
                                                />
                                            </div>
                                            <div className="flex items-center justify-between md:justify-start order-3 md:order-none">
                                                <span className="text-xs font-semibold text-gray-400 uppercase md:hidden">Adm No</span>
                                                <span className="text-gray-500 font-medium text-sm">{student.admissionNo}</span>
                                            </div>
                                            <div className="flex items-center justify-between md:justify-start order-2 md:order-none">
                                                <span className="text-xs font-semibold text-gray-400 uppercase md:hidden">Student</span>
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-teal/20 to-brand-teal/10 flex items-center justify-center text-brand-teal font-bold text-xs uppercase border border-brand-teal/20">
                                                        {student.name.substring(0, 2)}
                                                    </div>
                                                    <span className="font-semibold text-gray-700 text-sm">{student.name}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        <div className="p-4 border-t border-gray-100 bg-white flex flex-col sm:flex-row items-center justify-between gap-4">
                            <span className="text-sm text-gray-500">
                                Showing <span className="font-medium text-gray-900">{filteredStudents.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-medium text-gray-900">{Math.min(filteredStudents.length, currentPage * itemsPerPage)}</span> of <span className="font-medium text-gray-900">{filteredStudents.length}</span> entries
                            </span>
                            <div className="flex items-center gap-2">
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                    disabled={currentPage === 1}
                                    className="h-8 px-2 border-gray-200"
                                >
                                    <ChevronLeft className="w-4 h-4 text-gray-500" />
                                </Button>
                                <div className="text-sm font-medium text-gray-700 px-2">
                                    Page {currentPage} of {totalPages === 0 ? 1 : totalPages}
                                </div>
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                    disabled={currentPage === totalPages || totalPages === 0}
                                    className="h-8 px-2 border-gray-200"
                                >
                                    <ChevronRight className="w-4 h-4 text-gray-500" />
                                </Button>
                            </div>
                        </div>
                        
                        <div className="p-5 border-t border-gray-100 bg-gray-50 flex justify-end">
                            <Button 
                                onClick={handleSave} 
                                disabled={saving}
                                className="bg-brand-teal hover:bg-brand-teal/90 text-white shadow-sm rounded-full px-8 gap-2 font-bold transition-all"
                            >
                                {saving ? (
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                ) : (
                                    <Save className="w-4 h-4" />
                                )}
                                {saving ? 'Saving...' : 'Save Allocations'}
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </SettingsShell>
    );
}
