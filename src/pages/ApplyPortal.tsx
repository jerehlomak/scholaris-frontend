import { useState } from 'react';
import { UploadCloud } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Header } from '../components/home/Header';
import { Footer } from '../components/home/Footer';

export default function ApplyPortal() {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const [action, setAction] = useState('APPLY'); // 'APPLY' or 'CHECK_STATUS'
    const [applicationType, setApplicationType] = useState('ADMISSION_APPLICATION');
    const [pinCode, setPinCode] = useState('');
    const [schoolInfo, setSchoolInfo] = useState<{ id: string; name: string; logoUrl: string | null } | null>(null);
    const [validatedPinId, setValidatedPinId] = useState('');
    const [formConfig, setFormConfig] = useState<any>(null);
    const [applicationStatus, setApplicationStatus] = useState<any>(null);
    const [letterTemplate, setLetterTemplate] = useState<any>(null);
    const [showPrintView, setShowPrintView] = useState(false);

    // Step 2 State
    const [formData, setFormData] = useState<any>({}); // For dynamic form inputs
    const [dynamicFiles, setDynamicFiles] = useState<Record<string, File>>({});

    const handleValidatePin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const response = await axios.post('/api/v1/applications/validate-pin', { pinCode, applicationType, action });
            setSchoolInfo(response.data.school);
            
            if (action === 'APPLY') {
                toast.success('PIN Validated! Please proceed with your application.');
                setValidatedPinId(response.data.pinId);
                setFormConfig(response.data.formConfig);
                setStep(2);
            } else {
                toast.success('Application found.');
                setApplicationStatus(response.data.application);
                setLetterTemplate(response.data.letterTemplate);
                setStep(3); // Status View
            }
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
            let finalApplicantName = 'Applicant';
            let finalApplicantEmail = '';
            let finalApplicantPhone = '';

            if (formConfig && Array.isArray(formConfig) && formConfig.length > 0) {
                let fName = formData['f_firstname'] || formData['firstname'] || formData['first_name'] || formData['fname'] || formData['f_name'] || '';
                let lName = formData['f_lastname'] || formData['lastname'] || formData['last_name'] || formData['lname'] || formData['l_name'] || '';
                finalApplicantName = [fName, lName].filter(Boolean).join(' ') || 'Applicant';
                finalApplicantEmail = formData['f_email'] || formData['email'] || formData['email_address'] || formData['f_parent_email'] || '';
                finalApplicantPhone = formData['f_phone'] || formData['phone'] || formData['phone_number'] || formData['f_parent_phone'] || '';
            }

            // Map standard files if they exist in dynamic files
            if (dynamicFiles['f_passport']) {
                formDataObj.append('passport', dynamicFiles['f_passport']);
            }
            if (dynamicFiles['f_birth_cert']) {
                formDataObj.append('birthCertificate', dynamicFiles['f_birth_cert']);
            }
            if (dynamicFiles['f_other_cert']) {
                formDataObj.append('otherCertificates', dynamicFiles['f_other_cert']);
            }

            formDataObj.append('pinCode', pinCode);
            formDataObj.append('applicationType', applicationType);
            formDataObj.append('applicantName', finalApplicantName);
            formDataObj.append('applicantEmail', finalApplicantEmail);
            formDataObj.append('applicantPhone', finalApplicantPhone);
            formDataObj.append('formData', JSON.stringify(formData));
            
            // Append other dynamic files
            Object.keys(dynamicFiles).forEach(key => {
                if (!['f_passport', 'f_birth_cert', 'f_other_cert'].includes(key)) {
                    formDataObj.append(key, dynamicFiles[key]);
                }
            });

            await axios.post('/api/v1/applications/submit', formDataObj, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            toast.success('Application submitted successfully!');
            navigate('/');
        } catch (error: any) {
            toast.error(error.response?.data?.msg || error.response?.data?.message || 'Failed to submit application.');
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

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <div className={showPrintView ? "print:hidden" : "flex flex-col flex-grow"}>
                <Header />

            <div className="flex-grow flex flex-col justify-center py-12 sm:px-6 lg:px-8">
                <div className="sm:mx-auto sm:w-full sm:max-w-md">
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-[#1a2fa0] font-heading">
                        Application Portal
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        {step === 1 ? 'Enter your application PIN to begin.' : step === 2 ? `Applying to ${schoolInfo?.name}` : `Application Status for ${schoolInfo?.name}`}
                    </p>
                </div>

                <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-2xl">
                    <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
                        {step === 1 ? (
                            <form className="space-y-6" onSubmit={handleValidatePin}>
                                <div>
                                    <label htmlFor="action" className="block text-sm font-medium text-gray-700">What do you want to do?</label>
                                    <div className="mt-1 flex gap-4">
                                        <label className="flex items-center gap-2 cursor-pointer border rounded-lg p-3 flex-1 hover:bg-gray-50 border-gray-300">
                                            <input type="radio" name="action" value="APPLY" checked={action === 'APPLY'} onChange={() => setAction('APPLY')} className="w-4 h-4 text-[#1a2fa0] focus:ring-[#1a2fa0]" />
                                            <span className="text-sm font-medium text-gray-700">Start New Application</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer border rounded-lg p-3 flex-1 hover:bg-gray-50 border-gray-300">
                                            <input type="radio" name="action" value="CHECK_STATUS" checked={action === 'CHECK_STATUS'} onChange={() => setAction('CHECK_STATUS')} className="w-4 h-4 text-[#1a2fa0] focus:ring-[#1a2fa0]" />
                                            <span className="text-sm font-medium text-gray-700">Check Status</span>
                                        </label>
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="applicationType" className="block text-sm font-medium text-gray-700">I am applying for *</label>
                                    <div className="mt-1">
                                        <select
                                            id="applicationType"
                                            value={applicationType}
                                            onChange={(e) => setApplicationType(e.target.value)}
                                            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#1a2fa0] focus:border-[#1a2fa0] sm:text-sm"
                                        >
                                            <option value="ADMISSION_APPLICATION">Student Admission</option>
                                            <option value="EMPLOYMENT">Employment Application</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="pinCode" className="block text-sm font-medium text-gray-700">12-Digit PIN Code *</label>
                                    <div className="mt-1">
                                        <input
                                            id="pinCode"
                                            type="text"
                                            required
                                            value={pinCode}
                                            onChange={(e) => setPinCode(e.target.value.toUpperCase())}
                                            placeholder="e.g. 1A2B-3C4D-5E6F"
                                            className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#1a2fa0] focus:border-[#1a2fa0] sm:text-sm font-mono tracking-widest uppercase text-center text-lg"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <Button type="submit" disabled={isSubmitting || !pinCode} className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#1a2fa0] hover:bg-[#121f6e]">
                                        {isSubmitting ? 'Validating...' : 'Validate PIN & Continue'}
                                    </Button>
                                </div>
                            </form>
                        ) : step === 2 ? (
                            <form className="space-y-6" onSubmit={handleSubmitApplication}>
                                {schoolInfo?.logoUrl && (
                                    <div className="flex justify-center mb-6">
                                        <img src={schoolInfo.logoUrl} alt={schoolInfo.name} className="h-16 object-contain" />
                                    </div>
                                )}



                                <div className="pt-4 border-t border-gray-200">
                                    <h3 className="text-lg font-medium text-gray-900 mb-4">Application Details</h3>

                                    {formConfig && Array.isArray(formConfig) ? (
                                        <div className="space-y-8">
                                            {formConfig.map((group: any) => (
                                                <div key={group.id} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                                    <h4 className="font-bold text-gray-800 mb-4 uppercase tracking-wider text-xs border-b pb-2">{group.title}</h4>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        {group.fields.filter((f: any) => f.isVisible || f.isPermanent).map((field: any) => (
                                                            <div key={field.id} className={field.type === 'Textarea' ? 'md:col-span-2' : ''}>
                                                                <label className="block text-sm font-medium text-gray-700">
                                                                    {field.label} {field.isRequired ? '*' : ''}
                                                                </label>
                                                                <div className="mt-1">
                                                                    {field.type === 'Textarea' ? (
                                                                        <textarea
                                                                            name={field.id}
                                                                            required={field.isRequired}
                                                                            value={formData[field.id] || ''}
                                                                            onChange={handleDynamicFormChange}
                                                                            className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#1a2fa0] focus:border-[#1a2fa0] sm:text-sm"
                                                                            rows={3}
                                                                        />
                                                                    ) : field.type === 'Dropdown' ? (
                                                                        <select
                                                                            name={field.id}
                                                                            required={field.isRequired}
                                                                            value={formData[field.id] || ''}
                                                                            onChange={handleDynamicFormChange}
                                                                            className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#1a2fa0] focus:border-[#1a2fa0] sm:text-sm bg-white"
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
                                                                    ) : field.type === 'Image' ? (
                                                                        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 border-dashed rounded-xl hover:border-[#1a2fa0] transition-colors cursor-pointer bg-slate-50/50">
                                                                            <div className="space-y-1 text-center">
                                                                                <UploadCloud className="mx-auto h-8 w-8 text-slate-400" />
                                                                                <div className="flex text-sm text-slate-600 justify-center">
                                                                                    <label className="relative cursor-pointer rounded-md font-medium text-[#1a2fa0] hover:text-[#13227a]">
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
                                                                            className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#1a2fa0] focus:border-[#1a2fa0] sm:text-sm"
                                                                        />
                                                                    )}
                                                                </div>
                                                                {field.description && <p className="mt-1 text-xs text-gray-500">{field.description}</p>}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <>
                                            {applicationType === 'ADMISSION_APPLICATION' && (
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700">Class Applied For *</label>
                                                        <div className="mt-1">
                                                            <input type="text" name="classAppliedFor" required value={formData.classAppliedFor || ''} onChange={handleDynamicFormChange} className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#1a2fa0] focus:border-[#1a2fa0] sm:text-sm" />
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700">Previous School</label>
                                                        <div className="mt-1">
                                                            <input type="text" name="previousSchool" value={formData.previousSchool || ''} onChange={handleDynamicFormChange} className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#1a2fa0] focus:border-[#1a2fa0] sm:text-sm" />
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {applicationType === 'EMPLOYMENT' && (
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700">Position Applied For *</label>
                                                        <div className="mt-1">
                                                            <input type="text" name="position" required value={formData.position || ''} onChange={handleDynamicFormChange} className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#1a2fa0] focus:border-[#1a2fa0] sm:text-sm" />
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700">Years of Experience</label>
                                                        <div className="mt-1">
                                                            <input type="number" name="experience" value={formData.experience || ''} onChange={handleDynamicFormChange} className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#1a2fa0] focus:border-[#1a2fa0] sm:text-sm" />
                                                        </div>
                                                    </div>
                                                    <div className="md:col-span-2">
                                                        <label className="block text-sm font-medium text-gray-700">Portfolio / Resume Link</label>
                                                        <div className="mt-1">
                                                            <input type="url" name="resumeUrl" value={formData.resumeUrl || ''} onChange={handleDynamicFormChange} placeholder="Google Drive, Dropbox, or LinkedIn URL" className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#1a2fa0] focus:border-[#1a2fa0] sm:text-sm" />
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>

                                <div className="flex gap-4">
                                    <Button type="button" onClick={() => setStep(1)} variant="outline" className="w-1/3 flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                                        Back
                                    </Button>
                                    <Button type="submit" disabled={isSubmitting} variant="success" className="w-2/3 flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white">
                                        {isSubmitting ? 'Submitting...' : 'Submit Application'}
                                    </Button>
                                </div>
                            </form>
                        ) : step === 3 ? (
                            <div className="space-y-6 text-center py-8">
                                {schoolInfo?.logoUrl && (
                                    <div className="flex justify-center mb-6">
                                        <img src={schoolInfo.logoUrl} alt={schoolInfo.name} className="h-16 object-contain" />
                                    </div>
                                )}
                                
                                <div className="p-6 bg-gray-50 rounded-xl border border-gray-200">
                                    <h3 className="text-xl font-bold text-gray-900 mb-2">Hello, {applicationStatus?.applicantName || 'Applicant'}</h3>
                                    <p className="text-sm text-gray-600 mb-6">Your application is currently being reviewed.</p>
                                    
                                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full font-bold text-sm tracking-wider uppercase bg-blue-100 text-blue-800">
                                        Status: {applicationStatus?.status || 'PENDING'}
                                    </div>
                                    
                                    {(applicationStatus?.status === 'APPROVED' || applicationStatus?.status === 'REJECTED') && (
                                        <div className="mt-8 pt-6 border-t border-gray-200">
                                            {applicationStatus.status === 'APPROVED' ? (
                                                <div>
                                                    <p className="text-green-600 font-medium mb-4">Congratulations! Your application was successful.</p>
                                                    
                                                    {(applicationStatus.interviewDate || applicationStatus.interviewTime || applicationStatus.interviewLocation) && (
                                                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 text-left">
                                                            <h4 className="font-bold text-blue-900 mb-3 flex items-center gap-2">
                                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                                                Interview Scheduled
                                                            </h4>
                                                            <div className="space-y-2 text-sm text-blue-800">
                                                                <p><strong className="font-semibold">Date:</strong> {applicationStatus.interviewDate || 'TBD'}</p>
                                                                <p><strong className="font-semibold">Time:</strong> {applicationStatus.interviewTime || 'TBD'}</p>
                                                                <p><strong className="font-semibold">Location:</strong> {applicationStatus.interviewLocation || 'TBD'}</p>
                                                            </div>
                                                        </div>
                                                    )}
                                                    
                                                    {letterTemplate ? (
                                                        <Button 
                                                            onClick={() => setShowPrintView(true)}
                                                            className="w-full bg-[#1a2fa0] hover:bg-[#121f6e] text-white"
                                                        >
                                                            Download {applicationType === 'EMPLOYMENT' ? 'Employment' : 'Admission'} Letter
                                                        </Button>
                                                    ) : (
                                                        <p className="text-sm text-gray-500 italic text-center">Your official letter is not yet available.</p>
                                                    )}
                                                </div>
                                            ) : (
                                                <p className="text-red-600 font-medium">We regret to inform you that your application was unsuccessful at this time.</p>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <Button type="button" onClick={() => setStep(1)} variant="outline" className="w-full mt-4">
                                    Back to Home
                                </Button>
                            </div>
                        ) : null}
                    </div>
                </div>
            </div>

            <Footer />
            </div>

            {/* Print View Overlay */}
            {showPrintView && letterTemplate && (
                <div className="fixed inset-0 z-[200] bg-slate-500/75 flex items-start justify-center overflow-y-auto print:static print:bg-white print:p-0 print:overflow-visible text-black">
                    <div className="bg-white mx-auto relative print:shadow-none shadow-2xl w-full max-w-4xl my-10 print:my-0 flex flex-col" id="print-letter-container" style={{ minHeight: '297mm' }}>
                        
                        <div className="absolute top-4 right-4 flex gap-2 print:hidden z-10">
                            <Button onClick={() => { window.print(); setShowPrintView(false); }} variant="outline" className="bg-blue-600 hover:bg-blue-700 text-white border-0 font-bold shadow-sm">
                                Print / Save PDF
                            </Button>
                            <Button onClick={() => setShowPrintView(false)} variant="destructive" className="font-bold">
                                Close
                            </Button>
                        </div>

                        {/* Professional Letter Content Container */}
                        <div className="print:w-[210mm] print:min-h-[297mm] w-full p-12 sm:p-16 print:p-[25mm] mx-auto box-border flex flex-col bg-white relative">
                            
                            {/* Watermark Logo (Optional subtle background) */}
                            {schoolInfo?.logoUrl && (
                                <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none z-0 print:opacity-[0.03]">
                                    <img src={schoolInfo.logoUrl} alt="Watermark" className="w-2/3 object-contain grayscale" />
                                </div>
                            )}

                            <div className="relative z-10 flex-grow flex flex-col">
                                {/* Professional Header */}
                                <div className="flex items-center justify-between mb-10 pb-6 border-b-[3px] border-[#1a2fa0]">
                                    {/* Logo */}
                                    <div className="flex-shrink-0 w-28">
                                        {schoolInfo?.logoUrl ? (
                                            <img src={schoolInfo.logoUrl} alt={schoolInfo?.name || "Logo"} className="h-24 w-full object-contain object-left" />
                                        ) : (
                                            <div className="h-24 w-full bg-slate-100 flex items-center justify-center text-slate-400 text-xs text-center border border-slate-200">No Logo</div>
                                        )}
                                    </div>
                                    
                                    {/* School Name & Info */}
                                    <div className="flex-grow text-right pl-6">
                                        <h1 className="text-3xl font-black text-[#1a2fa0] uppercase tracking-wider font-heading leading-tight mb-2">
                                            {schoolInfo?.name || 'School Name'}
                                        </h1>
                                        <div className="text-xs text-slate-600 uppercase tracking-widest font-semibold flex flex-col gap-0.5">
                                            <p>OFFICIAL NOTIFICATION</p>
                                            <p className="text-slate-400 mt-1">Date: {new Date().toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Body (Rich Text) */}
                                <div 
                                    className="prose max-w-none text-slate-800 leading-relaxed mb-16 font-serif text-[15px]"
                                    dangerouslySetInnerHTML={{ 
                                        __html: letterTemplate.body?.replace(/\{ApplicantName\}/gi, `<strong>${(() => {
                                            let name = applicationStatus?.applicantName;
                                            if (!name || name === 'Applicant') {
                                                const d = applicationStatus?.formData || {};
                                                let fName = d['f_firstname'] || d['firstname'] || d['first_name'] || d['fname'] || d['f_name'] || '';
                                                let lName = d['f_lastname'] || d['lastname'] || d['last_name'] || d['lname'] || d['l_name'] || '';
                                                let extracted = [fName, lName].filter(Boolean).join(' ');
                                                if (extracted) return extracted;
                                            }
                                            return name || 'Applicant';
                                        })()}</strong>`).replace(/Dear(\s|&nbsp;)Candidate,?/gi, `Dear <strong>${(() => {
                                            let name = applicationStatus?.applicantName;
                                            if (!name || name === 'Applicant') {
                                                const d = applicationStatus?.formData || {};
                                                let fName = d['f_firstname'] || d['firstname'] || d['first_name'] || d['fname'] || d['f_name'] || '';
                                                let lName = d['f_lastname'] || d['lastname'] || d['last_name'] || d['lname'] || d['l_name'] || '';
                                                let extracted = [fName, lName].filter(Boolean).join(' ');
                                                if (extracted) return extracted;
                                            }
                                            return name || 'Applicant';
                                        })()}</strong>,`) || '' 
                                    }}
                                />

                                {/* Signature Block */}
                                <div className="mt-auto pt-16 flex justify-end">
                                    <div className="text-center w-64">
                                        {letterTemplate.signatureUrl ? (
                                            <img src={letterTemplate.signatureUrl} alt="Signature" className="h-16 object-contain mx-auto mb-2" />
                                        ) : (
                                            <div className="h-16 border-b border-dashed border-slate-300 mb-2 mx-4"></div>
                                        )}
                                        <div className="border-t-2 border-slate-800 pt-2 mx-2">
                                            <p className="font-bold text-slate-900 uppercase text-sm tracking-widest">{letterTemplate.signatoryName || 'Authorized Signatory'}</p>
                                            <p className="text-slate-500 text-xs font-semibold mt-1 uppercase">{letterTemplate.signatoryTitle || 'Administration'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
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
                            #print-letter-container {
                                position: absolute;
                                left: 0;
                                top: 0;
                                width: 100%;
                                background: white !important;
                            }
                            * { color: black !important; }
                        }
                    `}</style>
                </div>
            )}
        </div>
    );
}
