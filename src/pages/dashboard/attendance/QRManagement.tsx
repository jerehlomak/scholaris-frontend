import React, { useState } from 'react';
import useSWR from 'swr';
import axios from 'axios';
import { toast } from 'sonner';
import { QrCode, Loader2, User, ShieldOff, RotateCcw, AlertTriangle, Users, Play, Zap, UserX } from 'lucide-react';
import { SettingsShell } from '../settings/shared/SettingsShell';
import { SettingsHero } from '../settings/shared/SettingsHero';
import { fetcher } from '../../../utils/fetcher';
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
    AlertDialogTitle, AlertDialogTrigger,
} from '../../../components/ui/alert-dialog';

const API = '/api/v1/school/attendance/qr';

type QRRecord = {
    id: string;
    userType: string;
    userId: string;
    qrToken: string;
    isActive: boolean;
    createdAt: string;
};

type UserWithout = {
    userId: string;
    userName: string;
    userType: string;
    hasQR: false;
};

export default function QRManagement() {
    const [userType, setUserType] = useState<'student' | 'staff'>('student');
    const { data, error, mutate, isLoading } = useSWR(`${API}/list?userType=${userType}`, fetcher);
    const [isGeneratingBulk, setIsGeneratingBulk] = useState(false);
    const [generatingSingle, setGeneratingSingle] = useState<string | null>(null);

    const qrCodes: QRRecord[] = data?.qrCodes || [];
    const usersWithout: UserWithout[] = data?.usersWithout || [];
    const backendUrl = import.meta.env.VITE_API_BASE_URL || '';

    const handleDeactivate = async (id: string) => {
        try {
            await axios.post(`${API}/deactivate`, { id }, { withCredentials: true });
            toast.success('QR Code deactivated successfully');
            mutate();
        } catch {
            toast.error('Failed to deactivate QR code');
        }
    };

    const handleRegenerate = async (id: string) => {
        try {
            await axios.post(`${API}/regenerate`, { id }, { withCredentials: true });
            toast.success('QR Code regenerated successfully');
            mutate();
        } catch {
            toast.error('Failed to regenerate QR code');
        }
    };

    const handleGenerateSingle = async (userId: string, type: string) => {
        setGeneratingSingle(userId);
        try {
            await axios.post(`${API}/generate`, { userId, userType: type }, { withCredentials: true });
            toast.success('QR Code generated successfully');
            mutate();
        } catch (err: any) {
            toast.error(err.response?.data?.msg || 'Failed to generate QR code');
        } finally {
            setGeneratingSingle(null);
        }
    };

    const handleBulkGenerate = async () => {
        setIsGeneratingBulk(true);
        try {
            const { data } = await axios.post(`${API}/generate-bulk`, { userType }, { withCredentials: true });
            toast.success(data.msg);
            mutate();
        } catch (err: any) {
            toast.error(err.response?.data?.msg || 'Failed to bulk generate');
        } finally {
            setIsGeneratingBulk(false);
        }
    };

    return (
        <SettingsShell breadcrumbParent="Attendance" breadcrumbCurrent="QR Management" tabLabel="QR Cryptographic Tokens" tabIcon={<QrCode className="h-3.5 w-3.5" />}>
            <SettingsHero
                icon={<QrCode className="h-7 w-7 text-white" />}
                title="Cryptographic QR Pool"
                subtitle="Track, revoke, and issue JWT tokens bound to students and staff. New users appear below and can be activated individually or all at once."
            />

            {/* Filter tabs + Bulk action */}
            <div className="flex flex-wrap items-start gap-3 mb-6">
                <button
                    onClick={() => setUserType('student')}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-bold transition-colors ${userType === 'student' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                >
                    <Users className="h-4 w-4" /> Students
                </button>
                <button
                    onClick={() => setUserType('staff')}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-bold transition-colors ${userType === 'staff' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                >
                    <User className="h-4 w-4" /> Staff
                </button>

                {/* Always-visible bulk generate */}
                <button
                    onClick={handleBulkGenerate}
                    disabled={isGeneratingBulk || usersWithout.length === 0}
                    className="ml-auto flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-bold py-2.5 px-5 rounded-full transition-all text-sm shadow-sm"
                >
                    {isGeneratingBulk ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                    Generate All Missing ({usersWithout.length})
                </button>
            </div>

            {/* ── Users WITHOUT a QR token ────────────────────────────────── */}
            {!isLoading && usersWithout.length > 0 && (
                <section className="mb-8">
                    <div className="flex items-center gap-2 mb-3">
                        <UserX className="w-4 h-4 text-amber-500" />
                        <h3 className="text-sm font-bold text-slate-700">
                            No QR Token Yet — {usersWithout.length} {userType === 'student' ? 'Student' : 'Staff Member'}{usersWithout.length > 1 ? 's' : ''}
                        </h3>
                    </div>
                    <div className="rounded-2xl border border-[#e5e5e5] bg-white overflow-x-auto shadow-sm">
                        <table className="w-full text-left">
                            <thead className="bg-[#e5e5e5] border-b border-[#e5e5e5]">
                                <tr>
                                    <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-amber-700">Name</th>
                                    <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-amber-700">Type</th>
                                    <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-amber-700 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-amber-100">
                                {usersWithout.map(u => (
                                    <tr key={u.userId} className="hover:bg-amber-100/50 transition-colors">
                                        <td className="px-5 py-3 text-sm font-semibold text-slate-700">{u.userName}</td>
                                        <td className="px-5 py-3">
                                            <span className="text-[10px] uppercase font-bold text-amber-700 bg-amber-200 px-2 py-0.5 rounded-full">
                                                {u.userType}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3 text-right">
                                            <button
                                                onClick={() => handleGenerateSingle(u.userId, u.userType)}
                                                disabled={generatingSingle === u.userId}
                                                className="flex items-center gap-2 ml-auto text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 px-4 py-1.5 rounded-lg transition-colors"
                                            >
                                                {generatingSingle === u.userId
                                                    ? <Loader2 className="w-3 h-3 animate-spin" />
                                                    : <QrCode className="w-3 h-3" />}
                                                Generate ID
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            )}

            {/* ── Existing QR token records ───────────────────────────────── */}
            <section>
                {qrCodes.length > 0 && (
                    <div className="flex items-center gap-2 mb-3">
                        <QrCode className="w-4 h-4 text-indigo-500" />
                        <h3 className="text-sm font-bold text-slate-700">
                            Active Cryptographic Pool — {qrCodes.length} Record{qrCodes.length > 1 ? 's' : ''}
                        </h3>
                    </div>
                )}
                <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
                    {isLoading ? (
                        <div className="flex h-48 items-center justify-center">
                            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                        </div>
                    ) : error ? (
                        <div className="flex h-48 items-center justify-center text-slate-400 font-medium">Failed to load QR records.</div>
                    ) : qrCodes.length === 0 ? (
                        <div className="flex flex-col h-36 items-center justify-center text-slate-400">
                            <QrCode className="h-8 w-8 mb-2 opacity-40" />
                            <p className="text-sm font-semibold">No active bindings yet.</p>
                            <p className="text-xs text-slate-400 mt-1">Use "Generate All Missing" above to initialize tokens.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-slate-50 border-b border-slate-100">
                                    <tr>
                                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Date</th>
                                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">User ID</th>
                                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Status</th>
                                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {qrCodes.map((qr) => (
                                        <tr key={qr.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4 font-mono text-xs text-slate-500">
                                                {new Date(qr.createdAt).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-mono text-xs text-slate-700 bg-slate-100 p-1 px-2 rounded-md truncate max-w-[200px]">
                                                    {qr.userId}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${qr.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                                    <div className={`w-1.5 h-1.5 rounded-full ${qr.isActive ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                                                    {qr.isActive ? 'Active' : 'Revoked'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    {qr.isActive && (
                                                        <AlertDialog>
                                                            <AlertDialogTrigger asChild>
                                                                <button className="flex items-center justify-center p-2 rounded-lg border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 transition-colors" title="Revoke">
                                                                    <ShieldOff className="h-4 w-4" />
                                                                </button>
                                                            </AlertDialogTrigger>
                                                            <AlertDialogContent>
                                                                <AlertDialogHeader>
                                                                    <AlertDialogTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-red-500" /> Revoke QR Token?</AlertDialogTitle>
                                                                    <AlertDialogDescription>
                                                                        The holder of this printed ID card will immediately be blocked at all scan terminals.
                                                                    </AlertDialogDescription>
                                                                </AlertDialogHeader>
                                                                <AlertDialogFooter>
                                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                    <AlertDialogAction onClick={() => handleDeactivate(qr.id)} className="bg-red-600 hover:bg-red-700">Yes, Revoke</AlertDialogAction>
                                                                </AlertDialogFooter>
                                                            </AlertDialogContent>
                                                        </AlertDialog>
                                                    )}

                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                            <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-indigo-200 bg-indigo-50 text-indigo-700 font-semibold text-xs hover:bg-indigo-100 transition-colors">
                                                                <RotateCcw className="h-4 w-4" /> Regenerate
                                                            </button>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle>Perform Secure Rollover?</AlertDialogTitle>
                                                                <AlertDialogDescription>
                                                                    This kills the existing token and creates a fresh 1-year signed JWT. The old printed ID card will immediately stop working.
                                                                </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                <AlertDialogAction onClick={() => handleRegenerate(qr.id)} className="bg-indigo-600 hover:bg-indigo-700">Spin New Token</AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>

                                                    <a
                                                        href={`${backendUrl}/api/v1/school/attendance/id-card/${qr.userId}?userType=${qr.userType}`}
                                                        target="_blank" rel="noopener noreferrer"
                                                        className="flex items-center justify-center p-2 rounded-lg bg-slate-800 text-white hover:bg-slate-700 transition-colors"
                                                        title="Export ID Card PDF"
                                                    >
                                                        <QrCode className="h-4 w-4" />
                                                    </a>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </section>
        </SettingsShell>
    );
}
