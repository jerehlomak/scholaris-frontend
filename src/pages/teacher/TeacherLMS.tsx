import { useState } from 'react';
import useSWR from 'swr';
import axios from 'axios';
import { Plus, BookOpen, Upload, ChevronRight, Clock, Users, Eye, Star, Loader2 } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Tabs, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Label } from '../../components/ui/label';
import { Separator } from '../../components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { Pagination } from '../../components/shared/Pagination';

const API = import.meta.env.VITE_API_URL || '/api/v1';
const fetcher = (url: string) => axios.get(url, { withCredentials: true }).then(r => r.data);

type Tab = 'assignments' | 'resources';

interface AssignmentForm {
    classId: string; subjectId: string; title: string;
    description: string; dueDate: string; maxScore: number;
}

export default function TeacherLMS() {
    const [tab, setTab] = useState<Tab>('assignments');
    const [showForm, setShowForm] = useState(false);
    const [saving, setSaving] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const PAGE_SIZE = 10;

    const [form, setForm] = useState<AssignmentForm>({
        classId: '', subjectId: '', title: '', description: '', dueDate: '', maxScore: 100
    });

    const { data: classData } = useSWR(`${API}/classes`, fetcher);
    const { data: subjectData } = useSWR(`${API}/subjects`, fetcher);
    const { data: assignData, mutate: mutateAssign } = useSWR(`${API}/lms/assignments`, fetcher);
    const { data: lessonData } = useSWR(`${API}/lms/lessons`, fetcher);

    const classes: any[] = classData?.classes || [];
    const subjects: any[] = subjectData?.subjects || [];
    const assignments: any[] = assignData?.assignments || [];
    const lessons: any[] = lessonData?.lessons || [];

    const handleCreateAssignment = async () => {
        if (!form.classId || !form.subjectId || !form.title) {
            toast.error('Please fill all required fields');
            return;
        }
        setSaving(true);
        try {
            await axios.post(`${API}/lms/assignments`, form, { withCredentials: true });
            toast.success('Assignment posted successfully!');
            setShowForm(false);
            setForm({ classId: '', subjectId: '', title: '', description: '', dueDate: '', maxScore: 100 });
            mutateAssign();
        } catch (e: any) {
            toast.error(e.response?.data?.msg || 'Failed to create assignment');
        } finally {
            setSaving(false);
        }
    };

    const formatDate = (d: string) => d ? new Date(d).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : 'No deadline';
    const isOverdue = (d: string) => d && new Date() > new Date(d);

    return (
        <div className="max-w-[1200px] mx-auto w-full pb-10">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">LMS — Learning Hub</h1>
                    <p className="text-sm text-slate-500 mt-0.5">Post assignments and share lesson resources with students</p>
                </div>
                <Button onClick={() => setShowForm(true)} className="bg-[#1E4DA6] hover:bg-[#173F8C] text-white gap-1.5">
                    <Plus size={16} /> Post Assignment
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                {[
                    { icon: BookOpen, label: 'Assignments', value: assignments.length, color: 'text-[#1E4DA6]', bg: 'bg-[#1E4DA6]/5' },
                    { icon: Users, label: 'Resources', value: lessons.length, color: 'text-violet-600', bg: 'bg-violet-50' },
                    { icon: Clock, label: 'Due Soon', value: assignments.filter((a: any) => a.dueDate && !isOverdue(a.dueDate)).length, color: 'text-amber-600', bg: 'bg-amber-50' },
                    { icon: Star, label: 'Overdue', value: assignments.filter((a: any) => isOverdue(a.dueDate)).length, color: 'text-red-600', bg: 'bg-red-50' },
                ].map((k) => (
                    <Card key={k.label} className="bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                        <CardContent className="p-4 flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${k.bg}`}>
                                <k.icon size={18} className={k.color} />
                            </div>
                            <div>
                                <p className="text-xs font-medium text-slate-500">{k.label}</p>
                                <p className="text-xl font-bold text-slate-900">{k.value}</p>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Tabs */}
            <div className="mb-5">
                <Tabs value={tab} onValueChange={(v) => { setTab(v as Tab); setCurrentPage(1); }}>
                    <TabsList className="bg-slate-100 p-1 h-10">
                        <TabsTrigger value="assignments" className="text-sm data-[state=active]:bg-white data-[state=active]:text-[#173F8C] data-[state=active]:shadow-sm">Assignments</TabsTrigger>
                        <TabsTrigger value="resources" className="text-sm data-[state=active]:bg-white data-[state=active]:text-[#173F8C] data-[state=active]:shadow-sm">Lesson Resources</TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>

            {/* Assignments Tab */}
            {tab === 'assignments' && (
                <div className="space-y-3">
                    {assignments.length === 0 ? (
                        <Card className="p-20 border border-dashed border-slate-300 text-center bg-white">
                            <BookOpen className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                            <p className="text-slate-400 font-medium">No assignments posted yet.</p>
                            <p className="text-slate-400 text-sm mt-1">Click "Post Assignment" to get started.</p>
                        </Card>
                    ) : assignments.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE).map((a: any) => (
                        <motion.div key={a.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
                            <Card className="p-5 bg-white border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:shadow-md transition-shadow">
                                <div className="flex gap-4 items-start">
                                    <div className="w-10 h-10 rounded-xl bg-[#1E4DA6]/5 text-[#1E4DA6] flex items-center justify-center shrink-0">
                                        <BookOpen size={18} />
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-900">{a.title}</p>
                                        <p className="text-xs text-slate-500 mt-0.5">{a.class?.name} · {a.subject?.name}</p>
                                        {a.description && <p className="text-sm text-slate-600 mt-1 line-clamp-2">{a.description}</p>}
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-2 shrink-0">
                                    <Badge className={isOverdue(a.dueDate) ? 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-50' : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-50'}>
                                        {isOverdue(a.dueDate) ? 'Overdue' : 'Active'}
                                    </Badge>
                                    <p className="text-xs text-slate-400">Due: {formatDate(a.dueDate)}</p>
                                    <p className="text-xs text-slate-500">{a._count?.submissions ?? 0} submission(s)</p>
                                </div>
                            </Card>
                        </motion.div>
                    ))}

                    {assignments.length > 0 && (
                        <div className="mt-4">
                            <Pagination 
                                currentPage={currentPage} 
                                totalPages={Math.ceil(assignments.length / PAGE_SIZE)} 
                                totalRecords={assignments.length} 
                                onPageChange={setCurrentPage} 
                            />
                        </div>
                    )}
                </div>
            )}

            {/* Resources Tab */}
            {tab === 'resources' && (
                <div className="space-y-3">
                    {lessons.length === 0 ? (
                        <Card className="p-20 border border-dashed border-slate-300 text-center bg-white">
                            <Upload className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                            <p className="text-slate-400 font-medium">No lesson resources uploaded yet.</p>
                        </Card>
                    ) : lessons.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE).map((l: any) => (
                        <Card key={l.id} className="p-5 bg-white border border-slate-200 shadow-sm flex items-center justify-between gap-4 hover:shadow-md transition-shadow">
                            <div className="flex gap-4 items-center">
                                <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center shrink-0">
                                    <Upload size={18} />
                                </div>
                                <div>
                                    <p className="font-bold text-slate-900">{l.title}</p>
                                    <p className="text-xs text-slate-500">{l.class?.name} · {l.subject?.name} · <span className="uppercase font-mono">{l.type}</span></p>
                                </div>
                            </div>
                            {l.fileUrl && (
                                <a href={l.fileUrl} target="_blank" rel="noreferrer">
                                    <Button size="sm" variant="outline" className="gap-1 text-xs h-7">
                                        <Eye className="w-3 h-3" /> Open
                                    </Button>
                                </a>
                            )}
                        </Card>
                    ))}

                    {lessons.length > 0 && (
                        <div className="mt-4">
                            <Pagination 
                                currentPage={currentPage} 
                                totalPages={Math.ceil(lessons.length / PAGE_SIZE)} 
                                totalRecords={lessons.length} 
                                onPageChange={setCurrentPage} 
                            />
                        </div>
                    )}
                </div>
            )}

            {/* Create Assignment Dialog (shadcn Dialog) */}
            <Dialog open={showForm} onOpenChange={(o) => { setShowForm(o); }}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-bold">Post New Assignment</DialogTitle>
                    </DialogHeader>
                    <Separator />
                    <div className="space-y-4 py-2">
                        <div>
                            <Label className="text-xs font-semibold text-slate-600 mb-1.5 block">Title *</Label>
                            <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                                placeholder="e.g. Essay on Photosynthesis" className="border-slate-200" />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label className="text-xs font-semibold text-slate-600 mb-1.5 block">Class *</Label>
                                <Select value={form.classId} onValueChange={v => setForm(f => ({ ...f, classId: v }))}>
                                    <SelectTrigger className="border-slate-200"><SelectValue placeholder="Select class" /></SelectTrigger>
                                    <SelectContent>
                                        {classes.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label className="text-xs font-semibold text-slate-600 mb-1.5 block">Subject *</Label>
                                <Select value={form.subjectId} onValueChange={v => setForm(f => ({ ...f, subjectId: v }))}>
                                    <SelectTrigger className="border-slate-200"><SelectValue placeholder="Select subject" /></SelectTrigger>
                                    <SelectContent>
                                        {subjects.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label className="text-xs font-semibold text-slate-600 mb-1.5 block">Due Date</Label>
                                <Input type="datetime-local" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} className="border-slate-200" />
                            </div>
                            <div>
                                <Label className="text-xs font-semibold text-slate-600 mb-1.5 block">Max Score</Label>
                                <Input type="number" value={form.maxScore} onChange={e => setForm(f => ({ ...f, maxScore: +e.target.value }))} className="border-slate-200" />
                            </div>
                        </div>
                        <div>
                            <Label className="text-xs font-semibold text-slate-600 mb-1.5 block">Instructions</Label>
                            <Textarea rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                                placeholder="Write instructions for students..." className="border-slate-200 resize-none" />
                        </div>
                    </div>
                    <Separator />
                    <div className="flex gap-3 justify-end pt-1">
                        <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                        <Button onClick={handleCreateAssignment} disabled={saving} className="bg-[#1E4DA6] hover:bg-[#173F8C] text-white">
                            {saving ? 'Posting...' : 'Post Assignment'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
