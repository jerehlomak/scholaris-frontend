import { useViewPreference } from '../../../hooks/useViewPreference';
import { useState, useEffect } from 'react';
import { Search, Eye, Loader2, Filter, ChevronDown, ClipboardList, CheckCircle2, XCircle, Clock, User, Info, ArrowLeft } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import useSWR from 'swr';
import { fetcher } from '../../../utils/fetcher';
import { ApplicationDetailsModal } from '../../../components/dashboard/applications/ApplicationDetailsModal';
import { SettingsShell } from '../settings/shared/SettingsShell';
import { SettingsHero } from '../settings/shared/SettingsHero';
import { cn } from '../../../lib/utils';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ViewToggle } from '../../../components/shared/ViewToggle';
import { Pagination } from '../../../components/shared/Pagination';
import { PrintBlankForm } from '../../../components/dashboard/applications/PrintBlankForm';
import { PrintApplication } from '../../../components/dashboard/applications/PrintApplication';
import { PrintAdmissionLetter } from '../../../components/dashboard/applications/PrintAdmissionLetter';

interface Application {
    id: string;
    applicantName: string;
    applicantEmail: string;
    applicantPhone: string;
    applicationType: string;
    status: string;
    createdAt: string;
    formData: any;
    passportUrl?: string;
    birthCertificateUrl?: string;
    otherCertificatesUrl?: string;
    pin: { pinCode: string; serialNumber: string; };
}

const STATUS_COLORS: Record<string, string> = {
    PENDING: 'bg-amber-100 text-amber-700',
    APPROVED: 'bg-emerald-100 text-emerald-700',
    REJECTED: 'bg-red-100 text-red-700',
};

const TYPE_LABELS: Record<string, string> = {
    ADMISSION_APPLICATION: 'Admission',
    EMPLOYMENT: 'Staff/Job',
};

const labelCls = 'font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5 block';

const SectionCard = ({ icon, num, title, children }: { icon: React.ReactNode; num: number; title: string; children: React.ReactNode }) => (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/60 flex items-center gap-3">
            <div className="h-8 w-8 rounded-xl bg-[#173F8C] text-white flex items-center justify-center text-sm font-black shrink-0">{num}</div>
            <div className="h-8 w-8 flex items-center justify-center text-[#1E4DA6] -ml-3 shrink-0">{icon}</div>
            <h2 className="font-bold text-slate-800">{title}</h2>
        </div>
        <div className="p-0">{children}</div>
    </div>
);

export default function ApplicationList({ fixedType }: { fixedType?: 'ADMISSION_APPLICATION' | 'EMPLOYMENT' }) {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');
    const [filterType, setFilterType] = useState(fixedType || 'all');
    const [filterTerm, setFilterTerm] = useState('ALL');
    const [filterSession, setFilterSession] = useState('ALL');
    const [showFilters, setShowFilters] = useState(false);
    const [selectedApp, setSelectedApp] = useState<Application | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isPrintingBlankForm, setIsPrintingBlankForm] = useState(false);
    const [isPrintingApp, setIsPrintingApp] = useState(false);
    const [isPrintingLetter, setIsPrintingLetter] = useState(false);

    const [view, setView] = useViewPreference('applicationlist');
    const [page, setPage] = useState(1);
    const limit = 10;

    const { data: appsData, isLoading, mutate } = useSWR(`/api/v1/applications/school?page=${page}&limit=${limit}&search=${search}&status=${filterStatus === 'ALL' ? '' : filterStatus}&type=${filterType === 'all' ? '' : filterType}`, fetcher);
    const applications: Application[] = appsData?.applications || [];
    const totalPages = appsData?.totalPages || 1;
    const totalRecords = appsData?.total || 0;

    const handleUpdateStatus = async (id: string, status: string, interviewDetails?: any) => {
        try {
            await axios.put(`/api/v1/applications/school/${id}/status`, { status, ...interviewDetails }, { withCredentials: true });
            toast.success(`Application ${status.toLowerCase()} successfully`);
            mutate();
            setIsModalOpen(false);
        } catch (e) {
            toast.error('Failed to update application status');
        }
    };

    // Auto-open application if applicationId is in the URL
    useEffect(() => {
        const appId = searchParams.get('applicationId');
        if (appId && applications.length > 0 && !selectedApp) {
            const found = applications.find(a => a.id === appId);
            if (found) {
                setSelectedApp(found);
                setIsModalOpen(true);
            }
        }
    }, [searchParams, applications, selectedApp]);

    // Extract unique terms and sessions for filter dropdowns
    const uniqueTerms = Array.from(new Set(applications.map(a => a.formData?.academicTerm).filter(Boolean)));
    const uniqueSessions = Array.from(new Set(applications.map(a => a.formData?.academicSession).filter(Boolean)));

    const displayed = applications.filter(a => {
        if (filterTerm !== 'ALL' && a.formData?.academicTerm !== filterTerm) return false;
        if (filterSession !== 'ALL' && a.formData?.academicSession !== filterSession) return false;
        return true;
    });

    const pageTitle = fixedType === 'ADMISSION_APPLICATION' 
        ? 'Admission Applications' 
        : fixedType === 'EMPLOYMENT' ? 'Employment Applications' : 'Incoming Applications';

    return (
        <SettingsShell breadcrumbCurrent={pageTitle} tabLabel="Queue" tabIcon={<ClipboardList className="h-3.5 w-3.5" />}>
            <SettingsHero 
                icon={<ClipboardList className="h-7 w-7" />}
                title={pageTitle}
                subtitle={`Review, approve, or reject ${fixedType === 'EMPLOYMENT' ? 'staff' : 'admission'} applications.`}
            />

            {/* KPI Strip - Using SectionCard style for small stats if needed, or keeping them as clean cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-8">
                {[
                    { icon: <ClipboardList className="h-4 w-4" />, label: 'TOTAL', value: applications.length, color: 'bg-[#1E4DA6]/10 text-[#173F8C]' },
                    { icon: <Clock className="h-4 w-4" />, label: 'PENDING', value: applications.filter(a => a.status === 'PENDING').length, color: 'bg-amber-100 text-amber-700' },
                    { icon: <CheckCircle2 className="h-4 w-4" />, label: 'APPROVED', value: applications.filter(a => a.status === 'APPROVED').length, color: 'bg-emerald-100 text-emerald-700' },
                    { icon: <XCircle className="h-4 w-4" />, label: 'REJECTED', value: applications.filter(a => a.status === 'REJECTED').length, color: 'bg-red-100 text-red-700' },
                ].map((k) => (
                    <div key={k.label} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 rounded-2xl border border-slate-200 bg-white p-3 sm:p-4 shadow-sm">
                        <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', k.color)}>{k.icon}</div>
                        <div><p className={labelCls}>{k.label}</p><p className="text-lg sm:text-xl font-black text-slate-800">{k.value}</p></div>
                    </div>
                ))}
            </div>

            {/* Data Section wrapped in SectionCard structure */}
            <SectionCard icon={<Info className="h-4 w-4" />} num={1} title="Review Queue">
                {/* Toolbar inside the card */}
                <div className="w-full p-4 border-b border-slate-100 flex flex-col sm:flex-row justify-center md:justify-between gap-3 bg-slate-50/30">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input 
                            type="text" 
                            placeholder="Search by name, email or PIN..." 
                            value={search} 
                            onChange={e => { setSearch(e.target.value); setPage(1); }}
                            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-[#1E4DA6]/60 focus:ring-2 focus:ring-[#1E4DA6]/10 bg-white transition-all" 
                        />
                    </div>
                    <div className="flex flex-wrap items-center gap-2 mt-2 md:mt-0">
                        <button 
                            onClick={() => navigate(fixedType === 'EMPLOYMENT' ? '/dashboard/staff/applications/new' : '/dashboard/admission/applications/new')}
                            className="flex items-center gap-2 px-3 py-2 border border-[#1E4DA6] bg-[#1E4DA6] text-white rounded-xl text-sm font-bold hover:bg-[#173F8C] transition-colors shadow-sm whitespace-nowrap flex-grow sm:flex-grow-0 justify-center"
                        >
                            + New Application
                        </button>
                        <button 
                            onClick={() => setIsPrintingBlankForm(true)}
                            className="flex items-center gap-2 px-3 py-2 border border-slate-200 bg-white text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-50 transition-colors shadow-sm whitespace-nowrap flex-grow sm:flex-grow-0 justify-center"
                        >
                            <ClipboardList className="h-4 w-4 hidden sm:block" /> Print Blank Form
                        </button>
                        <button 
                            onClick={() => setShowFilters(!showFilters)}
                            className={cn('flex items-center gap-2 px-3 py-2 border rounded-xl text-sm font-bold transition-colors whitespace-nowrap flex-grow sm:flex-grow-0 justify-center', showFilters ? 'border-[#1E4DA6]/35 bg-[#1E4DA6]/5 text-[#173F8C]' : 'border-slate-200 text-slate-600 hover:bg-slate-50')}
                        >
                            <Filter className="h-4 w-4" /> Filter <ChevronDown className={cn('h-3 w-3 transition-transform', showFilters && 'rotate-180')} />
                        </button>
                        <ViewToggle view={view} onChange={setView} />
                    </div>
                </div>

                {showFilters && (
                    <div className="px-4 pb-3 flex flex-wrap gap-2 border-b border-slate-100 pt-3 bg-slate-50/30">
                        {!fixedType && (
                            <select 
                                value={filterType} 
                                onChange={e => { setFilterType(e.target.value); setPage(1); }}
                                className="border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold bg-white outline-none focus:border-[#1E4DA6]/60 shadow-sm"
                            >
                                <option value="all">All Types</option>
                                <option value="ADMISSION_APPLICATION">Admission</option>
                                <option value="EMPLOYMENT">Staff/Job</option>
                            </select>
                        )}
                        <div className="flex gap-1 bg-slate-200/50 p-1 rounded-xl">
                            {(['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as const).map(s => (
                                <button 
                                    key={s} 
                                    onClick={() => { setFilterStatus(s); setPage(1); }}
                                    className={cn('px-3 py-1 rounded-lg text-xs font-bold transition-all', filterStatus === s ? 'bg-white text-[#173F8C] shadow-sm' : 'text-slate-500')}
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                        {uniqueSessions.length > 0 && (
                            <select 
                                value={filterSession} 
                                onChange={e => setFilterSession(e.target.value)}
                                className="border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold bg-white outline-none focus:border-[#1E4DA6]/60 shadow-sm"
                            >
                                <option value="ALL">All Sessions</option>
                                {uniqueSessions.map((session: any) => <option key={session} value={session}>{session}</option>)}
                            </select>
                        )}
                        {uniqueTerms.length > 0 && (
                            <select 
                                value={filterTerm} 
                                onChange={e => setFilterTerm(e.target.value)}
                                className="border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold bg-white outline-none focus:border-[#1E4DA6]/60 shadow-sm"
                            >
                                <option value="ALL">All Terms</option>
                                {uniqueTerms.map((term: any) => <option key={term} value={term}>{term}</option>)}
                            </select>
                        )}
                    </div>
                )}

                {view === 'table' && (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm whitespace-nowrap">
                            <thead className="bg-slate-50/80 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">
                                <tr>
                                    <th className="px-6 py-4 text-left">Applicant</th>
                                    <th className="px-4 py-4 text-left">Type</th>
                                    <th className="px-4 py-4 text-left">PIN Code</th>
                                    <th className="px-4 py-4 text-center">Status</th>
                                    <th className="px-4 py-4 text-left">Date</th>
                                    <th className="px-4 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {isLoading ? (
                                    <tr><td colSpan={6} className="py-12 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto text-[#1E4DA6]" /></td></tr>
                                ) : displayed.length === 0 ? (
                                    <tr><td colSpan={6} className="py-10 text-center text-slate-400 text-sm">{search ? 'No matches found.' : 'No applications in queue.'}</td></tr>
                                ) : displayed.map((app) => (
                                    <tr key={app.id} className="hover:bg-slate-50/60 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div>
                                                <p className="font-bold text-slate-800">{app.applicantName}</p>
                                                <p className="text-[10px] font-mono text-slate-400 uppercase tracking-tight">{app.applicantPhone || app.applicantEmail}</p>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <span className="px-2 py-0.5 bg-[#1E4DA6]/5 text-[#173F8C] rounded-lg text-[10px] font-black uppercase tracking-wider border border-[#1E4DA6]/10">
                                                {TYPE_LABELS[app.applicationType] || app.applicationType}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4 text-slate-500 text-xs font-black font-mono">{app.pin.pinCode}</td>
                                        <td className="px-4 py-4 text-center">
                                            <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded-full', STATUS_COLORS[app.status] ?? 'bg-slate-100 text-slate-500')}>
                                                <span className="h-1 w-1 rounded-full bg-current" />{app.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4 text-slate-400 text-[11px] font-bold">
                                            {app.formData?.academicSession && app.formData?.academicTerm && (
                                                <div className="text-[10px] text-[#1E4DA6] mb-0.5 whitespace-nowrap">
                                                    {app.formData.academicSession} ({app.formData.academicTerm})
                                                </div>
                                            )}
                                            {new Date(app.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-4 py-4 text-right">
                                            <button 
                                                onClick={() => { setSelectedApp(app); setIsModalOpen(true); }}
                                                className="p-2 text-[#1E4DA6] hover:bg-[#1E4DA6]/5 rounded-xl transition-all border border-transparent hover:border-[#1E4DA6]/10"
                                            >
                                                <Eye className="h-4 w-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
                
                {view === 'grid' && (
                    <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {isLoading ? (
                            <div className="col-span-full py-12 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-[#1E4DA6]" /></div>
                        ) : displayed.length === 0 ? (
                            <div className="col-span-full py-10 text-center text-slate-400 text-sm">{search ? 'No matches found.' : 'No applications in queue.'}</div>
                        ) : displayed.map(app => (
                            <div key={app.id} className="rounded-2xl border border-slate-200 p-4 hover:shadow-md transition-all bg-white flex flex-col">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex-1 min-w-0 pr-3">
                                        <h3 className="font-bold text-slate-800 text-base truncate">{app.applicantName}</h3>
                                        <p className="text-[10px] font-mono text-slate-400 uppercase truncate mt-0.5">{app.applicantPhone || app.applicantEmail}</p>
                                    </div>
                                    <span className={cn('inline-flex items-center px-2 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-full shrink-0', STATUS_COLORS[app.status] ?? 'bg-slate-100 text-slate-500')}>
                                        {app.status}
                                    </span>
                                </div>
                                <div className="flex flex-wrap items-center gap-2 mb-4">
                                    <span className="px-2 py-0.5 bg-[#1E4DA6]/5 text-[#173F8C] rounded-lg text-[10px] font-black uppercase tracking-wider border border-[#1E4DA6]/10">
                                        {TYPE_LABELS[app.applicationType] || app.applicationType}
                                    </span>
                                    <span className="text-slate-500 text-xs font-black font-mono bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200">{app.pin.pinCode}</span>
                                </div>
                                <div className="mt-auto pt-3 border-t border-slate-100 flex items-center justify-between">
                                    <div className="flex flex-col">
                                        {app.formData?.academicSession && app.formData?.academicTerm && (
                                            <span className="text-[#1E4DA6] text-[9px] font-black uppercase">
                                                {app.formData.academicSession} ({app.formData.academicTerm})
                                            </span>
                                        )}
                                        <span className="text-slate-400 text-[10px] font-bold">
                                            {new Date(app.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <button 
                                        onClick={() => { setSelectedApp(app); setIsModalOpen(true); }}
                                        className="text-xs font-bold text-[#1E4DA6] hover:text-[#173F8C] bg-[#1E4DA6]/5 hover:bg-[#1E4DA6]/10 px-3 py-1.5 rounded-lg transition-colors"
                                    >
                                        View Details
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <Pagination currentPage={page} totalPages={totalPages} totalRecords={totalRecords} onPageChange={setPage} />
            </SectionCard>

            {isModalOpen && selectedApp && (
                <ApplicationDetailsModal
                    isOpen={isModalOpen}
                    onClose={() => { setIsModalOpen(false); setSelectedApp(null); }}
                    application={selectedApp}
                    onUpdateStatus={handleUpdateStatus}
                    onPrintApp={() => { setIsModalOpen(false); setIsPrintingApp(true); }}
                    onPrintLetter={() => { setIsModalOpen(false); setIsPrintingLetter(true); }}
                />
            )}

            {isPrintingBlankForm && (
                <PrintBlankForm formType={fixedType || 'ADMISSION_APPLICATION'} onClose={() => setIsPrintingBlankForm(false)} />
            )}

            {isPrintingApp && selectedApp && (
                <PrintApplication application={selectedApp} onClose={() => { setIsPrintingApp(false); setSelectedApp(null); }} />
            )}

            {isPrintingLetter && selectedApp && (
                <PrintAdmissionLetter application={selectedApp} onClose={() => { setIsPrintingLetter(false); setSelectedApp(null); }} />
            )}
        </SettingsShell>
    );
}
