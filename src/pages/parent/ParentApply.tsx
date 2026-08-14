import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { Button } from '../../components/ui/button';
import { ClipboardList, ArrowLeft, Loader2, UploadCloud } from 'lucide-react';
import type { FormFieldData } from '../dashboard/settings/shared/FieldEditorModal';

export default function ParentApply() {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const [pinCode, setPinCode] = useState('');
    const [schoolInfo, setSchoolInfo] = useState<{ id: string; name: string; logoUrl: string | null } | null>(null);
    const [validatedPinId, setValidatedPinId] = useState('');
    const [formConfig, setFormConfig] = useState<any>(null);
    const [requiresPin, setRequiresPin] = useState(true);
    const [initializing, setInitializing] = useState(true);



    useEffect(() => {
        const initForm = async () => {
            try {
                const res = await axios.get('/api/v1/applications/parent/init');
                setRequiresPin(res.data.requiresPin);
                if (!res.data.requiresPin) {
                    setSchoolInfo(res.data.school);
                    setFormConfig(res.data.formConfig);
                    setStep(2);
                }
            } catch (err) {
                console.error("Failed to init form", err);
            } finally {
                setInitializing(false);
            }
        };
        initForm();
    }, []);

    const [formData, setFormData] = useState<any>({});
    const [dynamicFiles, setDynamicFiles] = useState<Record<string, File>>({});

    const handleValidatePin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            // We only do ADMISSION_APPLICATION in the parent portal for children
            const response = await axios.post('/api/v1/applications/validate-pin', { pinCode, applicationType: 'ADMISSION_APPLICATION', action: 'APPLY' });
            setSchoolInfo(response.data.school);
            toast.success('PIN Validated! Please proceed with your application.');
            setValidatedPinId(response.data.pinId);
            setFormConfig(response.data.formConfig);
            setStep(2);
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to validate PIN.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSubmitApplication = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const formDataObj = new FormData();
            formDataObj.append('pinCode', pinCode);
            formDataObj.append('applicationType', 'ADMISSION_APPLICATION');
            const appName = `${formData['f_first_name'] || ''} ${formData['f_last_name'] || ''}`.trim() || 'Unknown Applicant';
            const appEmail = formData['f_parent_email'] || formData['f_email'] || '';
            const appPhone = formData['f_parent_phone'] || formData['f_phone'] || '';

            formDataObj.append('applicantName', appName);
            formDataObj.append('applicantEmail', appEmail);
            formDataObj.append('applicantPhone', appPhone);
            formDataObj.append('formData', JSON.stringify(formData));
            
            // Map known file fields to preserve backend compatibility
            if (dynamicFiles['f_passport']) {
                formDataObj.append('passport', dynamicFiles['f_passport']);
            }
            if (dynamicFiles['f_birth_cert']) {
                formDataObj.append('birthCertificate', dynamicFiles['f_birth_cert']);
            }
            if (dynamicFiles['f_other_cert']) {
                formDataObj.append('otherCertificates', dynamicFiles['f_other_cert']);
            }

            // Append other dynamic files
            Object.keys(dynamicFiles).forEach(key => {
                if (!['f_passport', 'f_birth_cert', 'f_other_cert'].includes(key)) {
                    formDataObj.append(key, dynamicFiles[key]);
                }
            });

            const endpoint = requiresPin ? '/api/v1/applications/submit' : '/api/v1/applications/parent/submit';
            
            await axios.post(endpoint, formDataObj, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            toast.success('Application submitted successfully!');
            navigate('/parent');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to submit application.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDynamicFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleDynamicFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setDynamicFiles({ ...dynamicFiles, [e.target.name]: e.target.files[0] });
        }
    };

    const sections = Array.isArray(formConfig) ? formConfig : [];

    return (
        <div className="w-full max-w-6xl mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Apply for Admission</h1>
                    <p className="text-slate-500 text-sm mt-1">Submit a new admission application for your child.</p>
                </div>
            </div>

            {initializing ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
                </div>
            ) : step === 1 ? (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center max-w-md mx-auto mt-12">
                    <ClipboardList className="h-16 w-16 text-[#1E4DA6] mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-slate-800 mb-2">Enter Application PIN</h2>
                    <p className="text-sm text-slate-500 mb-6">You need a valid admission PIN to start the application process.</p>
                    
                    <form onSubmit={handleValidatePin} className="space-y-4 text-left">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">12-Digit PIN Code *</label>
                            <input
                                type="text"
                                required
                                value={pinCode}
                                onChange={(e) => setPinCode(e.target.value.toUpperCase())}
                                placeholder="e.g. 1A2B-3C4D-5E6F"
                                className="block w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#1E4DA6] focus:border-[#1E4DA6] sm:text-sm font-mono tracking-widest uppercase text-center text-lg"
                            />
                        </div>
                        <Button type="submit" disabled={isSubmitting || !pinCode} className="w-full bg-[#1E4DA6] hover:bg-[#173F8C] text-white py-3 rounded-xl text-sm font-bold transition-all">
                            {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Validating...</> : 'Validate PIN & Continue'}
                        </Button>
                    </form>
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-8">
                    <div className="mb-6 flex items-center gap-4 border-b border-slate-100 pb-4">
                        {requiresPin && (
                            <button 
                                onClick={() => setStep(1)}
                                className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
                            >
                                <ArrowLeft className="h-5 w-5 text-slate-600" />
                            </button>
                        )}
                        <div>
                            <h2 className="text-lg font-bold text-slate-800">Application Form</h2>
                            <p className="text-xs text-slate-500">Applying to {schoolInfo?.name}</p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmitApplication} className="space-y-8">
                        {/* Dynamic Fields */}
                        {sections.map((section: any) => (
                            <div key={section.id}>
                                <h3 className="text-lg font-bold text-slate-800 mb-4 pb-2 border-b">{section.title}</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {section.fields.filter((f: FormFieldData) => f.isVisible || f.isPermanent).map((field: FormFieldData) => (
                                        <div key={field.id} className={field.type === 'Textarea' ? 'md:col-span-2' : ''}>
                                            <label className="block text-sm font-bold text-slate-700 mb-1">
                                                {field.label} {field.isRequired && <span className="text-red-500">*</span>}
                                            </label>
                                            {field.description && (
                                                <p className="text-xs text-slate-500 mb-2">{field.description}</p>
                                            )}
                                            
                                            {field.type === 'Dropdown' ? (
                                                <select
                                                    name={field.id}
                                                    required={field.isRequired}
                                                    value={formData[field.id] || ''}
                                                    onChange={handleDynamicFormChange}
                                                    className="block w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#1E4DA6] focus:border-[#1E4DA6] sm:text-sm bg-white"
                                                >
                                                    <option value="">Select option</option>
                                                    {field.options && field.options.length > 0 ? (
                                                        field.options.map((opt: string, i: number) => (
                                                            <option key={i} value={opt}>{opt}</option>
                                                        ))
                                                    ) : (
                                                        <>
                                                            {field.id === 'f_gender' && (
                                                                <>
                                                                    <option value="Male">Male</option>
                                                                    <option value="Female">Female</option>
                                                                </>
                                                            )}
                                                            {field.id === 'f_education' && (
                                                                <>
                                                                    <option value="High School">High School</option>
                                                                    <option value="BSc">BSc</option>
                                                                    <option value="MSc">MSc</option>
                                                                    <option value="PhD">PhD</option>
                                                                </>
                                                            )}
                                                            {field.id !== 'f_gender' && field.id !== 'f_education' && (
                                                                <option value="" disabled>No options configured</option>
                                                            )}
                                                        </>
                                                    )}
                                                </select>
                                            ) : field.type === 'Textarea' ? (
                                                <textarea
                                                    name={field.id}
                                                    required={field.isRequired}
                                                    value={formData[field.id] || ''}
                                                    onChange={handleDynamicFormChange}
                                                    rows={3}
                                                    className="block w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#1E4DA6] focus:border-[#1E4DA6] sm:text-sm"
                                                />
                                            ) : field.type === 'Image' ? (
                                                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 border-dashed rounded-xl hover:border-[#1E4DA6] transition-colors cursor-pointer bg-slate-50/50">
                                                    <div className="space-y-1 text-center">
                                                        <UploadCloud className="mx-auto h-8 w-8 text-slate-400" />
                                                        <div className="flex text-sm text-slate-600 justify-center">
                                                            <label className="relative cursor-pointer rounded-md font-medium text-[#1E4DA6] hover:text-[#173F8C]">
                                                                <span>Upload a file</span>
                                                                <input type="file" name={field.id} required={field.isRequired} className="sr-only" accept="image/*" onChange={handleDynamicFileChange} />
                                                            </label>
                                                        </div>
                                                        <p className="text-xs text-slate-500">
                                                            {dynamicFiles[field.id] ? dynamicFiles[field.id].name : "PNG, JPG up to 5MB"}
                                                        </p>
                                                    </div>
                                                </div>
                                            ) : (
                                                <input
                                                    type={field.type === 'Date' ? 'date' : field.type === 'Number' ? 'number' : 'text'}
                                                    name={field.id}
                                                    required={field.isRequired}
                                                    value={formData[field.id] || ''}
                                                    onChange={handleDynamicFormChange}
                                                    className="block w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#1E4DA6] focus:border-[#1E4DA6] sm:text-sm"
                                                />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}

                        <div className="pt-6 border-t flex flex-col sm:flex-row justify-end gap-3 sm:gap-4">
                            {requiresPin && (
                                <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={() => setStep(1)}>
                                    Cancel
                                </Button>
                            )}
                            <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto bg-[#1E4DA6] hover:bg-[#173F8C] text-white px-8">
                                {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...</> : "Submit Application"}
                            </Button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}
