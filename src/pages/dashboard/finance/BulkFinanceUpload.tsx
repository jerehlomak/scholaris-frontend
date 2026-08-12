import { useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Loader2, Upload, Download, FileSpreadsheet, CheckCircle2, XCircle } from 'lucide-react';

export default function BulkFinanceUpload() {
    const [importType, setImportType] = useState<'billing' | 'payments'>('billing');
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [results, setResults] = useState<any>(null);

    const handleDownloadTemplate = () => {
        window.location.href = `/api/v1/bulk-import/template/${importType}`;
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setResults(null);
        }
    };

    const handleUpload = async () => {
        if (!file) return toast.error('Please select a file first.');
        
        const formData = new FormData();
        formData.append('file', file);

        setUploading(true);
        setResults(null);
        try {
            const res = await axios.post(`/api/v1/bulk-import/${importType}`, formData, {
                withCredentials: true,
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setResults(res.data);
            toast.success(`Successfully processed ${res.data.summary.created} records.`);
            setFile(null);
            
            // Clear file input
            const fileInput = document.getElementById('finance-file-upload') as HTMLInputElement;
            if (fileInput) fileInput.value = '';
        } catch (error: any) {
            toast.error(error.response?.data?.msg || 'Failed to process file upload.');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="p-4 sm:p-6 max-w-5xl mx-auto min-h-[80vh]">
            <div className="mb-8">
                <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Bulk Upload Records</h1>
                <p className="text-sm text-slate-500 mt-1">Easily upload billing invoices or payment records in bulk using our Excel templates.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Left Side: Upload Controls */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-5 border-b border-slate-100 bg-slate-50/50">
                        <h2 className="font-bold text-slate-800">1. Select Record Type</h2>
                    </div>
                    <div className="p-5 flex flex-col sm:flex-row gap-4">
                        <label className={`flex-1 flex items-center justify-center gap-2 p-4 rounded-xl border-2 cursor-pointer transition-all ${importType === 'billing' ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-semibold' : 'border-slate-200 hover:border-slate-300 text-slate-600'}`}>
                            <input type="radio" name="type" className="hidden" checked={importType === 'billing'} onChange={() => setImportType('billing')} />
                            <FileSpreadsheet className="w-5 h-5" /> Bills / Invoices
                        </label>
                        <label className={`flex-1 flex items-center justify-center gap-2 p-4 rounded-xl border-2 cursor-pointer transition-all ${importType === 'payments' ? 'border-emerald-600 bg-emerald-50 text-emerald-700 font-semibold' : 'border-slate-200 hover:border-slate-300 text-slate-600'}`}>
                            <input type="radio" name="type" className="hidden" checked={importType === 'payments'} onChange={() => setImportType('payments')} />
                            <FileSpreadsheet className="w-5 h-5" /> Payments
                        </label>
                    </div>

                    <div className="p-5 border-t border-slate-100 bg-slate-50/50">
                        <h2 className="font-bold text-slate-800">2. Download Template</h2>
                        <p className="text-xs text-slate-500 mt-1 mb-4">Download the correct Excel format to ensure smooth processing.</p>
                        <button onClick={handleDownloadTemplate} className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-slate-300 bg-white text-slate-700 font-medium hover:bg-slate-50 transition-colors shadow-sm text-sm">
                            <Download className="w-4 h-4" /> Download {importType === 'billing' ? 'Billing' : 'Payment'} Template
                        </button>
                    </div>

                    <div className="p-5 border-t border-slate-100">
                        <h2 className="font-bold text-slate-800 mb-4">3. Upload Completed File</h2>
                        <div className="relative group">
                            <input 
                                id="finance-file-upload"
                                type="file" 
                                accept=".xlsx, .xls"
                                onChange={handleFileChange}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                            />
                            <div className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center transition-all ${file ? 'border-indigo-400 bg-indigo-50/30' : 'border-slate-200 group-hover:border-indigo-300 group-hover:bg-slate-50'}`}>
                                <Upload className={`w-10 h-10 mb-3 ${file ? 'text-indigo-500' : 'text-slate-300'}`} />
                                <p className="font-semibold text-slate-700 text-sm">
                                    {file ? file.name : 'Click or drag Excel file here'}
                                </p>
                                <p className="text-xs text-slate-400 mt-1">.xlsx or .xls up to 5MB</p>
                            </div>
                        </div>

                        <button 
                            onClick={handleUpload}
                            disabled={!file || uploading}
                            className="w-full mt-6 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-blue-500/20 text-sm"
                        >
                            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                            {uploading ? 'Processing Upload...' : 'Upload & Process Records'}
                        </button>
                    </div>
                </div>

                {/* Right Side: Results */}
                <div>
                    {!results ? (
                        <div className="bg-slate-50 border border-slate-200 rounded-2xl h-full flex flex-col items-center justify-center text-slate-400 p-8 text-center min-h-[300px]">
                            <FileSpreadsheet className="w-16 h-16 mb-4 opacity-20" />
                            <p className="font-medium">Upload Results Will Appear Here</p>
                            <p className="text-sm mt-2 opacity-60">Upload your file to see the status of each row.</p>
                        </div>
                    ) : (
                        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col max-h-[800px]">
                            <div className="p-5 border-b border-slate-100 bg-slate-50">
                                <h3 className="font-bold text-slate-800">Upload Summary</h3>
                                <div className="flex gap-4 mt-3">
                                    <div className="flex-1 bg-white p-3 rounded-lg border border-slate-200 text-center">
                                        <div className="text-xs font-semibold text-slate-500 uppercase">Total</div>
                                        <div className="text-xl font-bold text-slate-800">{results.summary.total}</div>
                                    </div>
                                    <div className="flex-1 bg-emerald-50 p-3 rounded-lg border border-emerald-100 text-center">
                                        <div className="text-xs font-semibold text-emerald-600 uppercase">Success</div>
                                        <div className="text-xl font-bold text-emerald-700">{results.summary.created}</div>
                                    </div>
                                    <div className="flex-1 bg-red-50 p-3 rounded-lg border border-red-100 text-center">
                                        <div className="text-xs font-semibold text-red-600 uppercase">Failed</div>
                                        <div className="text-xl font-bold text-red-700">{results.summary.failed}</div>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="overflow-y-auto p-5 space-y-3">
                                {results.failed.length > 0 && (
                                    <div className="mb-6">
                                        <h4 className="text-sm font-bold text-red-600 flex items-center gap-2 mb-3">
                                            <XCircle className="w-4 h-4" /> Failed Rows
                                        </h4>
                                        <div className="space-y-2">
                                            {results.failed.map((f: any, idx: number) => (
                                                <div key={idx} className="bg-red-50/50 border border-red-100 rounded-lg p-3 text-sm flex gap-3">
                                                    <span className="font-mono text-red-400 font-bold shrink-0">Row {f.row}</span>
                                                    <div className="text-red-700">{f.error}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                
                                {results.created.length > 0 && (
                                    <div>
                                        <h4 className="text-sm font-bold text-emerald-600 flex items-center gap-2 mb-3">
                                            <CheckCircle2 className="w-4 h-4" /> Successful Rows
                                        </h4>
                                        <div className="space-y-2">
                                            {results.created.map((c: any, idx: number) => (
                                                <div key={idx} className="bg-emerald-50/50 border border-emerald-100 rounded-lg p-3 text-sm flex justify-between items-center">
                                                    <span className="font-mono text-emerald-500 font-bold">Row {c.row}</span>
                                                    <span className="text-emerald-700 font-medium">{c.invoiceNumber}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
