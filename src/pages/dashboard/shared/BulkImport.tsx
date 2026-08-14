import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import axios from 'axios';
import { toast } from 'sonner';
import {
    Upload, Download, CheckCircle2, XCircle,
    ArrowLeft, FileSpreadsheet, Users, Loader2, AlertCircle
} from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { SettingsShell } from '../settings/shared/SettingsShell';
import { SettingsHero } from '../settings/shared/SettingsHero';
import { cn } from '../../../lib/utils';

const API = '/api/v1';

type ImportMode = 'staff' | 'students' | 'parents';

interface ImportResult {
    summary: { total: number; created: number; failed: number };
    created: { name: string; admissionNo?: string; employeeId?: string; email: string; generatedPassword: string; row: number }[];
    failed: { row: number; reason: string }[];
}

export default function BulkImportPage() {
    const { type } = useParams();
    const navigate = useNavigate();
    
    const [mode, setMode] = useState<ImportMode>((type as ImportMode) || 'staff');
    
    React.useEffect(() => {
        if (type && ['staff', 'students', 'parents'].includes(type)) {
            setMode(type as ImportMode);
        }
    }, [type]);

    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [result, setResult] = useState<ImportResult | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = (selectedFile: File) => {
        if (!selectedFile.name.endsWith('.xlsx') && !selectedFile.name.endsWith('.xls')) {
            toast.error('Please upload a valid Excel file (.xlsx or .xls)');
            return;
        }
        setFile(selectedFile);
        setResult(null);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files[0]) handleFileSelect(e.dataTransfer.files[0]);
    };

    const downloadTemplate = async () => {
        try {
            const res = await axios.get(`${API}/bulk-import/template/${mode}`, {
                withCredentials: true,
                responseType: 'blob'
            });
            const url = URL.createObjectURL(new Blob([res.data]));
            const a = document.createElement('a');
            a.href = url;
            a.download = `${mode}_import_template.xlsx`;
            a.click();
            URL.revokeObjectURL(url);
        } catch {
            toast.error('Failed to download template');
        }
    };

    const handleImport = async () => {
        if (!file) { toast.error('Please select a file first'); return; }
        setIsUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            const res = await axios.post(`${API}/bulk-import/${mode}`, formData, {
                withCredentials: true,
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setResult(res.data);
            if (res.data.summary.created > 0) {
                toast.success(`${res.data.summary.created} records imported successfully!`);
            }
            if (res.data.summary.failed > 0) {
                toast.warning(`${res.data.summary.failed} rows failed. Check the error report below.`);
            }
        } catch (e) {
            const err = e as { response?: { data?: { msg?: string } } };
            toast.error(err.response?.data?.msg || 'Import failed');
        } finally {
            setIsUploading(false);
        }
    };

    const exportResults = () => {
        if (!result) return;
        const wb = XLSX.utils.book_new();
        // Created sheet
        if (result.created.length > 0) {
            const createdSheet = XLSX.utils.json_to_sheet(result.created);
            XLSX.utils.book_append_sheet(wb, createdSheet, 'Created');
        }
        // Failed sheet
        if (result.failed.length > 0) {
            const failedSheet = XLSX.utils.json_to_sheet(result.failed);
            XLSX.utils.book_append_sheet(wb, failedSheet, 'Failed');
        }
        XLSX.writeFile(wb, `import_results_${Date.now()}.xlsx`);
    };

    return (
        <SettingsShell breadcrumbParent="Dashboard" breadcrumbCurrent="Bulk Import" tabLabel="Bulk Import" tabIcon={<Upload className="h-3.5 w-3.5" />}>
            <Link to={mode === 'staff' ? '/dashboard/employees/all' : mode === 'students' ? '/dashboard/students/all' : '/dashboard/parents'}
                className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-[#1E4DA6] mb-6 transition-colors">
                <ArrowLeft className="h-4 w-4" /> Back
            </Link>

            <div className="mb-8">
                <h1 className="text-2xl font-black text-slate-800">Bulk Import</h1>
                <p className="text-slate-500 text-sm mt-1">Upload an Excel file to create multiple records at once.</p>
            </div>

            {/* Mode Toggle */}
            <div className="flex gap-2 mb-6 p-1 bg-slate-100 rounded-xl w-fit">
                {(['staff', 'students', 'parents'] as ImportMode[]).map(m => (
                    <button key={m} onClick={() => { setMode(m); setFile(null); setResult(null); navigate(`/dashboard/bulk-import/${m}`); }}
                        className={cn(
                            'px-5 py-2 rounded-xl text-sm font-bold transition-all',
                            mode === m ? 'bg-white text-[#173F8C] shadow-sm' : 'text-slate-500 hover:text-slate-700'
                        )}>
                        {m === 'staff' ? '👤 Staff' : m === 'students' ? '🎓 Students' : '👪 Parents'}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                {/* Left: Instructions + Upload */}
                <div className="lg:col-span-3 space-y-5">
                    {/* Step 1: Template */}
                    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/60 flex items-center gap-3">
                            <div className="h-7 w-7 rounded-full bg-[#173F8C] text-white flex items-center justify-center text-xs font-black">1</div>
                            <h2 className="font-bold text-slate-800">Download Template</h2>
                        </div>
                        <div className="p-6">
                            <p className="text-sm text-slate-500 mb-4">
                                Download the official template for {mode === 'staff' ? 'staff' : mode === 'students' ? 'student' : 'parent'} import. Fill it in and upload it back.
                                <span className="text-amber-600 font-semibold"> Do not change the column headers.</span>
                            </p>
                            <button onClick={downloadTemplate}
                                className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white text-sm font-bold rounded-xl hover:bg-emerald-700 transition-colors shadow-sm">
                                <Download className="h-4 w-4" />
                                Download {mode === 'staff' ? 'Staff' : mode === 'students' ? 'Student' : 'Parent'} Template
                            </button>
                        </div>
                    </div>

                    {/* Step 2: Upload */}
                    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/60 flex items-center gap-3">
                            <div className="h-7 w-7 rounded-full bg-[#173F8C] text-white flex items-center justify-center text-xs font-black">2</div>
                            <h2 className="font-bold text-slate-800">Upload Filled Template</h2>
                        </div>
                        <div className="p-6">
                            <div
                                className={cn(
                                    'border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all',
                                    isDragging ? 'border-[#1E4DA6]/60 bg-[#1E4DA6]/5' : 'border-slate-200 hover:border-[#1E4DA6]/35 hover:bg-slate-50',
                                    file && 'border-emerald-300 bg-emerald-50'
                                )}
                                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                                onDragLeave={() => setIsDragging(false)}
                                onDrop={handleDrop}
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <input ref={fileInputRef} type="file" accept=".xlsx,.xls" className="hidden"
                                    onChange={e => e.target.files?.[0] && handleFileSelect(e.target.files[0])} />
                                {file ? (
                                    <>
                                        <FileSpreadsheet className="h-10 w-10 text-emerald-500 mx-auto mb-3" />
                                        <p className="font-bold text-slate-800 text-sm">{file.name}</p>
                                        <p className="text-xs text-slate-400 mt-1">{(file.size / 1024).toFixed(1)} KB — click to change</p>
                                    </>
                                ) : (
                                    <>
                                        <Upload className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                                        <p className="font-semibold text-slate-600 text-sm">Drop your Excel file here</p>
                                        <p className="text-xs text-slate-400 mt-1">or click to browse • .xlsx, .xls only</p>
                                    </>
                                )}
                            </div>

                            {file && (
                                <button onClick={handleImport} disabled={isUploading}
                                    className="mt-4 w-full flex items-center justify-center gap-2 py-3 bg-[#173F8C] text-white text-sm font-bold rounded-xl hover:bg-[#122F69] transition-colors shadow-sm disabled:opacity-50">
                                    {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Users className="h-4 w-4" />}
                                    {isUploading ? 'Importing...' : `Import ${mode === 'staff' ? 'Staff' : mode === 'students' ? 'Students' : 'Parents'}`}
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right: Guidelines */}
                <div className="lg:col-span-2">
                    <div className="rounded-2xl border border-amber-100 bg-amber-50 shadow-sm p-6">
                        <h3 className="font-bold text-amber-800 mb-4 flex items-center gap-2">
                            <AlertCircle className="h-4 w-4" />
                            Import Guidelines
                        </h3>
                        <ul className="space-y-2.5 text-sm text-amber-900">
                            {mode === 'staff' ? (
                                <>
                                    <li>• <strong>Required:</strong> firstName, lastName, email, gender</li>
                                    <li>• <strong>staffType:</strong> TEACHER, ADMIN, CLASS_TEACHER, OTHER</li>
                                    <li>• <strong>employeeId:</strong> Auto-generated if blank</li>
                                    <li>• <strong>salary:</strong> Numbers only (no currency symbol)</li>
                                    <li>• <strong>dateOfBirth:</strong> Format YYYY-MM-DD</li>
                                    <li>• Email must be unique across the school</li>
                                    <li>• Max 200 rows per file</li>
                                </>
                            ) : mode === 'students' ? (
                                <>
                                    <li>• <strong>Required:</strong> name, className</li>
                                    <li>• <strong>className:</strong> Exact name of an existing class (e.g., JSS1 A)</li>
                                    <li>• <strong>admissionNo:</strong> Auto-generated if blank</li>
                                    <li>• <strong>orphan:</strong> Use "yes" or "no"</li>
                                    <li>• <strong>dateOfBirth:</strong> Format YYYY-MM-DD</li>
                                    <li>• Max 500 rows per file</li>
                                </>
                            ) : (
                                <>
                                    {mode === 'parents' && (
                                        <>
                                            <li><span className="font-bold text-amber-900">• Required:</span> studentAdmissionNo, phone</li>
                                            <li><span className="font-bold text-amber-900">• studentAdmissionNo:</span> Must match an existing student</li>
                                            <li><span className="font-bold text-amber-900">• parentId (Optional):</span> Leave blank to auto-generate, or provide your existing ID.</li>
                                            <li><span className="font-bold text-amber-900">• fatherName / motherName:</span> Provide at least one</li>
                                            <li><span className="font-bold text-amber-900">• email:</span> Auto-generated for login if left blank</li>
                                            <li><span className="font-bold text-amber-900">• Multiple Children:</span> Parents with multiple children will be grouped automatically if their <span className="font-mono bg-amber-100 px-1 rounded text-[10px]">phone</span> or <span className="font-mono bg-amber-100 px-1 rounded text-[10px]">parentId</span> matches.</li>
                                            <li><span className="font-bold text-amber-900">• Max 500 rows</span> per file</li>
                                        </>
                                    )}
                                </>
                            )}
                        </ul>
                    </div>
                </div>
            </div>

            {/* Results */}
            {result && (
                <div className="mt-6 space-y-4">
                    {/* Summary */}
                    <div className="grid grid-cols-3 gap-4">
                        {[
                            { label: 'Total Rows', val: result.summary.total, color: 'blue' },
                            { label: 'Created', val: result.summary.created, color: 'emerald' },
                            { label: 'Failed', val: result.summary.failed, color: 'red' },
                        ].map(s => (
                            <div key={s.label} className={cn(
                                'rounded-2xl border p-5 text-center',
                                s.color === 'blue' ? 'border-[#1E4DA6]/10 bg-[#1E4DA6]/5' :
                                s.color === 'emerald' ? 'border-emerald-100 bg-emerald-50' :
                                'border-red-100 bg-red-50'
                            )}>
                                <p className={cn('text-3xl font-black',
                                    s.color === 'blue' ? 'text-[#173F8C]' :
                                    s.color === 'emerald' ? 'text-emerald-700' : 'text-red-700'
                                )}>{s.val}</p>
                                <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mt-1">{s.label}</p>
                            </div>
                        ))}
                    </div>

                    {/* Export Results */}
                    <div className="flex justify-end">
                        <button onClick={exportResults}
                            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-bold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
                            <Download className="h-4 w-4" />
                            Export Results (with Passwords)
                        </button>
                    </div>

                    {/* Success rows */}
                    {result.created.length > 0 && (
                        <div className="rounded-2xl border border-emerald-100 bg-white shadow-sm overflow-hidden">
                            <div className="px-6 py-4 border-b border-emerald-100 bg-emerald-50 flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                                <h3 className="font-bold text-emerald-800">Successfully Created ({result.created.length})</h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-slate-100">
                                            <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">Name</th>
                                            <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">ID</th>
                                            <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">Login Email</th>
                                            <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">Password</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {result.created.slice(0, 50).map((r, i) => (
                                            <tr key={i} className="border-b border-slate-50 hover:bg-slate-50">
                                                <td className="px-4 py-3 font-semibold text-slate-800">{r.name}</td>
                                                <td className="px-4 py-3 font-mono text-[#173F8C] text-xs">{r.employeeId || r.admissionNo}</td>
                                                <td className="px-4 py-3 text-slate-600 text-xs">{r.email}</td>
                                                <td className="px-4 py-3 font-mono text-emerald-700 font-bold text-xs">{r.generatedPassword}</td>
                                            </tr>
                                        ))}
                                        {result.created.length > 50 && (
                                            <tr><td colSpan={4} className="px-4 py-3 text-center text-slate-400 text-xs italic">
                                                + {result.created.length - 50} more... Export to see all
                                            </td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Failed rows */}
                    {result.failed.length > 0 && (
                        <div className="rounded-2xl border border-red-100 bg-white shadow-sm overflow-hidden">
                            <div className="px-6 py-4 border-b border-red-100 bg-red-50 flex items-center gap-2">
                                <XCircle className="h-4 w-4 text-red-600" />
                                <h3 className="font-bold text-red-800">Failed Rows ({result.failed.length})</h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-slate-100">
                                            <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">Row</th>
                                            <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">Reason</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {result.failed.map((r, i) => (
                                            <tr key={i} className="border-b border-slate-50">
                                                <td className="px-4 py-3 font-mono text-slate-600 text-xs">Row {r.row}</td>
                                                <td className="px-4 py-3 text-red-700 text-xs">{r.reason}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </SettingsShell>
    );
}
