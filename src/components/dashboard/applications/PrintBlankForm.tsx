import { useAuth } from '../../../context/AuthContext';
import useSWR from 'swr';
import { fetcher } from '../../../utils/fetcher';
import { Loader2, Printer } from 'lucide-react';
import type { FormFieldData } from '../../../pages/dashboard/settings/shared/FieldEditorModal';

interface PrintBlankFormProps {
    formType: 'ADMISSION_APPLICATION' | 'EMPLOYMENT';
    onClose: () => void;
}

export function PrintBlankForm({ formType, onClose }: PrintBlankFormProps) {
    const { user } = useAuth();
    const { data: settingsData, isLoading } = useSWR('/api/v1/school-settings', fetcher);
    
    if (isLoading) return <div className="fixed inset-0 z-[200] bg-white flex items-center justify-center"><Loader2 className="animate-spin text-blue-600 h-8 w-8" /></div>;

    const schoolName = (user as any)?.schoolName || (user as any)?.school?.name || (user as any)?.schoolDetails?.name || 'School Name';
    const logoUrl = (user as any)?.school?.logoUrl || (user as any)?.schoolDetails?.logoUrl;
    
    const settings = settingsData?.settings;
    const currentFormConfig = formType === 'ADMISSION_APPLICATION' 
        ? settings?.admissionFormConfig 
        : settings?.employmentFormConfig;
        
    const sections = Array.isArray(currentFormConfig) ? currentFormConfig : [];

    return (
        <div className="fixed inset-0 z-[200] bg-white overflow-y-auto print:relative print:overflow-visible text-black flex flex-col">
            <div className="print:hidden sticky top-0 z-[210] flex items-center justify-between p-4 bg-slate-900 text-white shadow-md">
                <div>
                    <h2 className="text-lg font-bold tracking-widest">Print Blank Form</h2>
                </div>
                <div className="flex gap-4">
                    <button onClick={() => { window.print(); onClose(); }} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors flex items-center gap-2 shadow-sm">
                        <Printer className="h-4 w-4" /> Print Now
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
                        <h2 className="text-xl font-bold mt-2 text-slate-800 tracking-widest uppercase">
                            {formType === 'ADMISSION_APPLICATION' ? 'Admission Form' : 'Employment Form'}
                        </h2>
                        <p className="text-sm mt-1 font-bold text-slate-500">Please complete all fields in BLOCK LETTERS.</p>
                    </div>
                    <div className="h-20 w-20 shrink-0"></div>
                </div>

                <div className="space-y-8 flex-grow">
                    {sections?.map((section: any) => (
                        <div key={section.id} className="mb-6 break-inside-avoid">
                            <h3 className="text-base font-black uppercase text-slate-500 mb-4 bg-slate-100 p-2">{section.title}</h3>
                            <div className="grid grid-cols-2 gap-x-6 gap-y-6">
                                {section.fields.filter((f: FormFieldData) => f.isVisible || f.isPermanent).map((field: FormFieldData) => (
                                    <div key={field.id} className={field.type === 'Textarea' ? 'col-span-2' : ''}>
                                        <div className="border-b border-black pb-1 min-h-[40px]">
                                            <span className="text-xs font-bold uppercase block mb-6">
                                                {field.label} {field.isRequired && '*'}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-12 pt-8 border-t-2 border-slate-200 break-inside-avoid flex justify-between">
                    <div className="w-[45%] border-t border-black text-center pt-2 mt-8">
                        <span className="text-xs font-bold uppercase">Applicant Signature</span>
                    </div>
                    <div className="w-[45%] border-t border-black text-center pt-2 mt-8">
                        <span className="text-xs font-bold uppercase">Date</span>
                    </div>
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
