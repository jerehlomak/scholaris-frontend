import { useAuth } from '../../../context/AuthContext';

interface PrintApplicationProps {
    application: any;
    onClose: () => void;
}

export function PrintApplication({ application, onClose }: PrintApplicationProps) {
    const { user } = useAuth();

    const schoolName = (user as any)?.schoolName || (user as any)?.school?.name || (user as any)?.schoolDetails?.name || 'School Name';
    const logoUrl = (user as any)?.school?.logoUrl || (user as any)?.schoolDetails?.logoUrl;
    
    const formatKey = (key: string) => {
        let formatted = key.startsWith('f_') ? key.slice(2) : key;
        formatted = formatted.replace(/_/g, ' ');
        return formatted.replace(/\b\w/g, l => l.toUpperCase());
    };

    const isCloudinaryUrl = (value: any) => {
        return typeof value === 'string' && value.includes('res.cloudinary.com');
    };

    return (
        <div className="fixed inset-0 z-[200] bg-white overflow-y-auto print:relative print:overflow-visible text-black flex flex-col">
            <div className="print:hidden sticky top-0 z-[210] flex items-center justify-between p-4 bg-slate-900 text-white shadow-md">
                <div>
                    <h2 className="text-lg font-bold tracking-widest">Print Application Details</h2>
                </div>
                <div className="flex gap-4">
                    <button onClick={() => { window.print(); onClose(); }} className="px-6 py-2 bg-[#1E4DA6] hover:bg-[#173F8C] text-white font-bold rounded-lg transition-colors">
                        Print Now
                    </button>
                    <button onClick={onClose} className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-lg transition-colors">
                        Close
                    </button>
                </div>
            </div>

            <div id="print-app-container" className="p-12 print:p-[20mm] mx-auto w-[210mm] min-h-[297mm] bg-white text-black font-sans flex flex-col">
                <div className="flex items-center mb-8 pb-4 border-b-2 border-slate-200">
                    {logoUrl ? (
                        <img src={logoUrl} alt="School Logo" className="h-20 w-20 object-contain shrink-0" />
                    ) : (
                        <div className="h-20 w-20 shrink-0"></div>
                    )}
                    <div className="flex-1 text-center px-4">
                        <h1 className="text-3xl font-black text-[#000080] uppercase tracking-wider">{schoolName}</h1>
                        <h2 className="text-lg font-bold mt-2 text-slate-800 uppercase tracking-widest">
                            {application.applicationType === 'ADMISSION_APPLICATION' ? 'Admission Application Form' : 'Employment Application Form'}
                        </h2>
                    </div>
                    <div className="h-20 w-20 shrink-0"></div>
                </div>

                <div className="mb-6 pb-6 border-b border-slate-200">
                    <h3 className="text-sm font-black uppercase text-slate-500 mb-4 tracking-widest bg-slate-100 p-2">Applicant Summary</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div><span className="font-bold text-slate-700">Full Name:</span> {application.applicantName}</div>
                        <div><span className="font-bold text-slate-700">Email:</span> {application.applicantEmail || 'N/A'}</div>
                        <div><span className="font-bold text-slate-700">Phone:</span> {application.applicantPhone || 'N/A'}</div>
                        <div><span className="font-bold text-slate-700">Date Submitted:</span> {new Date(application.createdAt).toLocaleDateString()}</div>
                        <div><span className="font-bold text-slate-700">Status:</span> <span className="uppercase font-bold">{application.status}</span></div>
                        {application.pin && (
                            <div><span className="font-bold text-slate-700">PIN Used:</span> {application.pin.pinCode}</div>
                        )}
                    </div>
                </div>

                <div className="mb-6">
                    <h3 className="text-sm font-black uppercase text-slate-500 mb-4 tracking-widest bg-slate-100 p-2">Form Data</h3>
                    <div className="grid grid-cols-2 gap-y-4 gap-x-8 text-sm">
                        {Object.entries(application.formData || {}).map(([key, value]) => (
                            <div key={key} className="break-inside-avoid">
                                <div className="font-bold text-slate-700 text-xs uppercase mb-1">{formatKey(key)}</div>
                                <div className="text-slate-900 border-b border-slate-100 pb-1">
                                    {isCloudinaryUrl(value) ? (
                                        <a href={String(value)} target="_blank" rel="noopener noreferrer" className="text-[#1E4DA6] underline">
                                            [View Attached Document]
                                        </a>
                                    ) : (
                                        String(value) || 'N/A'
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="mt-10 pt-8 flex flex-col items-end text-right border-t-2 border-slate-200 text-sm">
                    <div className="font-bold text-slate-800">Official Use Only</div>
                    <div className="text-slate-500 mb-8 mt-2">Date Processed: _________________</div>
                    <div className="text-slate-500">Authorized Signature: _________________</div>
                </div>
            </div>

            <style>{`
                @media print {
                    @page { size: A4 portrait; margin: 0; }
                    body { visibility: hidden; margin: 0; padding: 0; background: white; }
                    .print\\:hidden { display: none !important; }
                    #print-app-container, #print-app-container * {
                        visibility: visible;
                    }
                    .print\\:relative {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        height: auto !important;
                        overflow: visible !important;
                        display: block !important;
                        background: white !important;
                    }
                    * { color: black !important; }
                }
            `}</style>
        </div>
    );
}
