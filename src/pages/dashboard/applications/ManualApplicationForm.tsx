import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import useSWR from 'swr';
import { fetcher } from '../../../utils/fetcher';
import { SettingsShell } from '../settings/shared/SettingsShell';
import { SettingsHero } from '../settings/shared/SettingsHero';
import { ClipboardList, ArrowLeft, Loader2, UploadCloud } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import type { FormFieldData } from '../settings/shared/FieldEditorModal';

export default function ManualApplicationForm({ fixedType }: { fixedType?: 'ADMISSION_APPLICATION' | 'EMPLOYMENT' }) {
    const navigate = useNavigate();
    
    const [applicationType, setApplicationType] = useState(fixedType || 'ADMISSION_APPLICATION');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Basic fields
    const [applicantName, setApplicantName] = useState('');
    const [applicantEmail, setApplicantEmail] = useState('');
    const [applicantPhone, setApplicantPhone] = useState('');
    const [formData, setFormData] = useState<any>({});
    const [dynamicFiles, setDynamicFiles] = useState<Record<string, File>>({});

    // Fetch settings to get dynamic form configuration
    const { data: settingsData, isLoading: isLoadingSettings } = useSWR('/api/v1/school-settings', fetcher);
    
    const settings = settingsData?.settings;
    const currentFormConfig = applicationType === 'ADMISSION_APPLICATION' 
        ? settings?.admissionFormConfig 
        : settings?.employmentFormConfig;

    const sections = Array.isArray(currentFormConfig) ? currentFormConfig : [];

    const handleDynamicFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleDynamicFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setDynamicFiles({ ...dynamicFiles, [e.target.name]: e.target.files[0] });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const formDataObj = new FormData();
            
            let finalName = applicantName;
            let finalEmail = applicantEmail;
            let finalPhone = applicantPhone;

            if (sections && sections.length > 0) {
                let fName = formData['f_firstname'] || formData['firstname'] || formData['first_name'] || formData['fname'] || formData['f_name'] || '';
                let lName = formData['f_lastname'] || formData['lastname'] || formData['last_name'] || formData['lname'] || formData['l_name'] || '';
                if (!finalName || finalName === 'Applicant') {
                    finalName = [fName, lName].filter(Boolean).join(' ') || 'Applicant';
                }
                if (!finalEmail) finalEmail = formData['f_email'] || formData['email'] || formData['email_address'] || '';
                if (!finalPhone) finalPhone = formData['f_phone'] || formData['phone'] || formData['phone_number'] || '';
            }


            formDataObj.append('applicationType', applicationType);
            formDataObj.append('applicantName', finalName);
            formDataObj.append('applicantEmail', finalEmail);
            formDataObj.append('applicantPhone', finalPhone);
            
            // Tag with active term and session
            const payloadFormData = {
                ...formData,
                academicTerm: settings?.currentTerm || settings?.activeTerm || '',
                academicSession: settings?.currentSession || settings?.activeSession || ''
            };
            formDataObj.append('formData', JSON.stringify(payloadFormData));
            
            // Append dynamic files
            Object.keys(dynamicFiles).forEach(key => {
                formDataObj.append(key, dynamicFiles[key]);
            });

            await axios.post('/api/v1/applications/admin/submit', formDataObj, {
                headers: { 'Content-Type': 'multipart/form-data' },
                withCredentials: true
            });

            toast.success('Manual Application submitted successfully!');
            navigate(applicationType === 'EMPLOYMENT' ? '/dashboard/staff/applications' : '/dashboard/admission/applications');
        } catch (error: any) {
            toast.error(error.response?.data?.msg || error.response?.data?.message || 'Failed to submit application.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoadingSettings) {
        return (
            <SettingsShell breadcrumbCurrent="New Application" tabLabel="New" tabIcon={<ClipboardList className="h-3.5 w-3.5" />}>
                <div className="flex h-64 items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-[#1E4DA6]" />
                </div>
            </SettingsShell>
        );
    }

    return (
        <SettingsShell breadcrumbCurrent="New Application" tabLabel="New" tabIcon={<ClipboardList className="h-3.5 w-3.5" />}>
            <div className="mb-6 flex flex-col sm:flex-row items-center justify-center relative min-h-[60px] gap-4 sm:gap-0">
                <button 
                    onClick={() => navigate(applicationType === 'EMPLOYMENT' ? '/dashboard/staff/applications' : '/dashboard/admission/applications')}
                    className="relative sm:absolute self-start sm:self-auto left-0 p-2 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
                >
                    <ArrowLeft className="h-5 w-5 text-slate-600" />
                </button>
                <div className="text-center w-full">
                    <SettingsHero 
                        icon={<ClipboardList className="h-7 w-7" />}
                        title="Manual Application Entry"
                        subtitle="Submit an application on behalf of an applicant without requiring a PIN."
                    />
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-8">
                <form onSubmit={handleSubmit} className="space-y-8">
                    
                    {/* Select Type */}
                    {!fixedType && (
                        <div className="max-w-md">
                            <label className="block text-sm font-bold text-slate-700 mb-2">Application Type *</label>
                            <select
                                value={applicationType}
                                onChange={(e) => {
                                    setApplicationType(e.target.value as "ADMISSION_APPLICATION" | "EMPLOYMENT");
                                    setFormData({}); // Reset dynamic data when changing types
                                }}
                                className="block w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#1E4DA6] focus:border-[#1E4DA6] sm:text-sm transition-all"
                            >
                                <option value="ADMISSION_APPLICATION">Student Admission</option>
                                <option value="EMPLOYMENT">Employment Application</option>
                            </select>
                        </div>
                    )}

                    {/* Basic Info */}
                    {(!sections || sections.length === 0) && (
                        <div>
                            <h3 className="text-lg font-bold text-slate-800 mb-4 pb-2 border-b">Basic Information</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Applicant Full Name *</label>
                                    <input
                                        type="text"
                                        required
                                        value={applicantName}
                                        onChange={(e) => setApplicantName(e.target.value)}
                                        className="block w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#1E4DA6] focus:border-[#1E4DA6] sm:text-sm"
                                        placeholder="John Doe"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Email Address</label>
                                    <input
                                        type="email"
                                        value={applicantEmail}
                                        onChange={(e) => setApplicantEmail(e.target.value)}
                                        className="block w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#1E4DA6] focus:border-[#1E4DA6] sm:text-sm"
                                        placeholder="johndoe@example.com"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Phone Number</label>
                                    <input
                                        type="text"
                                        value={applicantPhone}
                                        onChange={(e) => setApplicantPhone(e.target.value)}
                                        className="block w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#1E4DA6] focus:border-[#1E4DA6] sm:text-sm"
                                        placeholder="+1234567890"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Dynamic Fields */}
                    {sections?.map((section: any) => (
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
                                                        <label className="relative cursor-pointer rounded-md font-medium text-[#1E4DA6] hover:text-[#13227a]">
                                                            <span>Upload a file</span>
                                                            <input type="file" name={field.id} required={field.isRequired} className="sr-only" accept="image/*,application/pdf,.doc,.docx" onChange={handleDynamicFileChange} />
                                                        </label>
                                                    </div>
                                                    <p className="text-xs text-slate-500">
                                                        {dynamicFiles[field.id] ? dynamicFiles[field.id].name : "PDF, JPG, PNG up to 5MB"}
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
                        <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={() => navigate('/dashboard/admission/applications')}>
                            Cancel
                        </Button>
                        <Button 
                            type="submit" 
                            disabled={isSubmitting} 
                            className="w-full sm:w-auto bg-[#1E4DA6] hover:bg-[#173F8C] text-white px-8"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...
                                </>
                            ) : (
                                "Submit Application"
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </SettingsShell>
    );
}
