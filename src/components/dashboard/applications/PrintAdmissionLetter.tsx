import { useAuth } from '../../../context/AuthContext';
import useSWR from 'swr';
import { fetcher } from '../../../utils/fetcher';
import { Loader2, Printer } from 'lucide-react';

interface PrintAdmissionLetterProps {
    application: any;
    onClose: () => void;
}

export function PrintAdmissionLetter({ application, onClose }: PrintAdmissionLetterProps) {
    const { user } = useAuth();
    const { data, isLoading } = useSWR('/api/v1/school-settings', fetcher);
    
    if (isLoading) return <div className="fixed inset-0 z-[200] bg-white flex items-center justify-center"><Loader2 className="animate-spin text-[#1E4DA6] h-8 w-8" /></div>;

    const template = data?.settings?.admissionLetterTemplate || {
        body: '<p>Dear {ApplicantName},</p><p>Congratulations! We are pleased to offer you admission to our institution.</p>',
        showLogo: true,
        showSchoolName: true,
        signatoryName: '',
        signatoryTitle: 'Principal',
        signatureUrl: ''
    };

    const schoolName = (user as any)?.schoolName || (user as any)?.school?.name || (user as any)?.schoolDetails?.name || 'School Name';
    const logoUrl = (user as any)?.school?.logoUrl || (user as any)?.schoolDetails?.logoUrl;
    
    const letterBody = template.body.replace(/{ApplicantName}/gi, application.applicantName || 'Applicant');

    return (
        <div className="fixed inset-0 z-[200] bg-white overflow-y-auto print:relative print:overflow-visible text-black flex flex-col">
            <div className="print:hidden sticky top-0 z-[210] flex items-center justify-between p-4 bg-slate-900 text-white shadow-md">
                <div>
                    <h2 className="text-lg font-bold tracking-widest">Print Admission Letter</h2>
                </div>
                <div className="flex gap-4">
                    <button onClick={() => { window.print(); onClose(); }} className="px-6 py-2 bg-[#1E4DA6] hover:bg-[#173F8C] text-white font-bold rounded-lg transition-colors shadow-sm flex items-center">
                        <Printer className="w-4 h-4 mr-2" /> Print Letter
                    </button>
                    <button onClick={onClose} className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-lg transition-colors">
                        Close
                    </button>
                </div>
            </div>

            <div id="print-letter-container" className="p-12 print:p-[20mm] mx-auto w-[210mm] min-h-[297mm] bg-white text-black font-sans flex flex-col relative overflow-hidden">
                <div className="flex items-center mb-10 pb-6 border-b-2 border-[#1E4DA6]">
                    {template.showLogo ? (
                        logoUrl ? <img src={logoUrl} alt="School Logo" className="h-20 w-20 object-contain shrink-0" /> : <div className="h-20 w-20 shrink-0"></div>
                    ) : (
                        <div className="h-20 w-20 shrink-0"></div>
                    )}
                    <div className="flex-1 text-center px-4">
                        {template.showSchoolName && (
                            <h1 className="text-3xl font-black text-[#000080] uppercase tracking-wider">{schoolName}</h1>
                        )}
                        <h2 className="text-xl font-bold mt-2 text-slate-800 tracking-widest uppercase">Admission Letter</h2>
                    </div>
                    <div className="h-20 w-20 shrink-0"></div>
                </div>

                <div 
                    className="flex-grow text-[15px] leading-relaxed text-black [&>p]:mb-4 [&>ul]:list-disc [&>ul]:pl-5 [&>ol]:list-decimal [&>ol]:pl-5" 
                    dangerouslySetInnerHTML={{ __html: letterBody }} 
                />

                <div className="mt-16 pt-8 flex flex-col items-end text-right break-inside-avoid">
                    {template.signatureUrl && (
                        <img src={template.signatureUrl} alt="Signature" className="h-16 object-contain mb-2" />
                    )}
                    <div className="font-bold text-lg text-slate-800">{template.signatoryName || '_________________'}</div>
                    <div className="text-sm font-semibold text-slate-500 uppercase tracking-widest mt-1">{template.signatoryTitle || 'Principal'}</div>
                </div>
            </div>

            <style>{`
                @media print {
                    @page { size: A4 portrait; margin: 0; }
                    body { visibility: hidden; margin: 0; padding: 0; background: white; }
                    .print\\:hidden { display: none !important; }
                    #print-letter-container, #print-letter-container * {
                        visibility: visible;
                    }
                    .print\\:relative {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        max-height: 100vh !important;
                        overflow: hidden !important;
                        display: block !important;
                        background: white !important;
                        page-break-inside: avoid;
                        break-inside: avoid;
                    }
                    #print-letter-container {
                        max-height: 260mm !important;
                        page-break-inside: avoid;
                        break-inside: avoid;
                    }
                    * { color: black !important; }
                }
            `}</style>
        </div>
    );
}
