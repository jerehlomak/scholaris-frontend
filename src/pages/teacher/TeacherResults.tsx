import { useState } from 'react';
import { Edit3, FileSpreadsheet, Printer } from 'lucide-react';
import RecordScores from '../dashboard/results/RecordScores';
import AdminResults from '../dashboard/results/AdminResults';
import { useAuth } from '../../context/AuthContext';
import { Tabs, TabsList, TabsTrigger } from '../../components/ui/tabs';

export default function TeacherResults() {
    const [tab, setTab] = useState<'entry' | 'broadsheet' | 'print'>('entry');
    const { user } = useAuth();
    
    // Admin or Form Teacher check to show print and broadsheet tabs
    const isFormTeacherOrAdmin = user?.role === 'ADMIN' || 
                                 user?.role === 'SCHOOL_SUPER_ADMIN' || 
                                 user?.role === 'SCHOOL_ADMIN' || 
                                 (user?.role === 'TEACHER' && user?.teacherProfile?.formClasses?.length > 0);

    return (
        <div className="max-w-[1200px] mx-auto w-full pb-10">
            {/* ── Header ── */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Results & Grades</h1>
                    <p className="text-sm text-slate-500 mt-0.5">Enter grades, view broadsheets and print report cards</p>
                </div>

                {/* ── Tabs (shadcn) ── */}
                <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
                    <TabsList className="bg-slate-100 p-1 h-10 w-full sm:w-auto overflow-x-auto scrollbar-hide flex-nowrap justify-start">
                        <TabsTrigger value="entry" className="flex items-center gap-1.5 text-sm data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-sm">
                            <Edit3 size={13} /> Grade Entry
                        </TabsTrigger>
                        {isFormTeacherOrAdmin && (
                            <>
                                <TabsTrigger value="broadsheet" className="flex items-center gap-1.5 text-sm data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-sm">
                                    <FileSpreadsheet size={13} /> Broadsheet
                                </TabsTrigger>
                                <TabsTrigger value="print" className="flex items-center gap-1.5 text-sm data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-sm">
                                    <Printer size={13} /> Report Cards
                                </TabsTrigger>
                            </>
                        )}
                    </TabsList>
                </Tabs>
            </div>

            {/* Content Container */}
            <div className="bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden min-h-[500px] relative p-6">
                <style>{`
                    .ss-root { min-height: auto !important; padding: 0 !important; }
                    .ss-root > div { padding: 1.5rem !important; }
                `}</style>

                {tab === 'entry' && <RecordScores isTeacherDashboard />}
                {tab === 'broadsheet' && <AdminResults defaultTab="BROADSHEET" isTeacherDashboard />}
                {tab === 'print' && <AdminResults defaultTab="CARDS" isTeacherDashboard />}
            </div>
        </div>
    );
}
