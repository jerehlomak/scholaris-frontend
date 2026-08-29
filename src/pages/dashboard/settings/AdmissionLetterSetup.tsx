import { useState, useEffect } from 'react';
import { FileText, Loader2, Image as ImageIcon } from 'lucide-react';
import axios from 'axios';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { SettingsShell } from './shared/SettingsShell';
import { SettingsHero } from './shared/SettingsHero';
import { SaveButton } from './shared/SaveButton';

const QUILL_MODULES = {
    toolbar: [
        [{ 'header': [1, 2, 3, false] }],
        ['bold', 'italic', 'underline'],
        [{ 'list': 'ordered' }, { 'list': 'bullet' }],
        [{ 'align': [] }],
        ['clean']
    ],
};

const DEFAULT_CONTENT = `
<p>Dear Applicant,</p>
<p><br></p>
<p>Congratulations! We are pleased to offer you admission to our institution.</p>
<p>Please log in to your portal to complete the necessary documentation.</p>
<p><br></p>
<p>Best Regards,</p>
`;

const QUILL_CSS = `
.ql-toolbar.ql-snow { border: none !important; border-bottom: 1px solid #e2e8f0 !important; background: #f8fafc; padding: 10px 14px !important; border-radius: 16px 16px 0 0; }
.ql-container.ql-snow { border: none !important; }
.ql-editor { min-height: 250px; padding: 22px 24px !important; color: #334155; line-height: 1.7; font-size: 0.9375rem; }
`;

interface LetterTemplate {
    body: string;
    showLogo: boolean;
    showSchoolName: boolean;
    signatoryName: string;
    signatoryTitle: string;
    signatureUrl: string;
}

const DEFAULT_TEMPLATE: LetterTemplate = {
    body: DEFAULT_CONTENT,
    showLogo: true,
    showSchoolName: true,
    signatoryName: '',
    signatoryTitle: 'Principal / Director',
    signatureUrl: ''
};

export function AdmissionLetterSetup() {
    const [template, setTemplate] = useState<LetterTemplate>(DEFAULT_TEMPLATE);
    const [saved, setSaved] = useState(false);
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        axios.get('/api/v1/school-settings', { withCredentials: true })
            .then(r => {
                if (r.data.settings?.admissionLetterTemplate) {
                    setTemplate({ ...DEFAULT_TEMPLATE, ...r.data.settings.admissionLetterTemplate });
                }
            })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            await axios.patch('/api/v1/school-settings', { admissionLetterTemplate: template }, { withCredentials: true });
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch { /* silent */ }
        finally { setSaving(false); }
    };

    const handleSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onloadend = () => {
            setTemplate(prev => ({ ...prev, signatureUrl: reader.result as string }));
        };
        reader.readAsDataURL(file);
    };

    if (loading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-[#1E4DA6]" />
            </div>
        );
    }

    return (
        <SettingsShell breadcrumbCurrent="Admission Letter" tabLabel="Admission Letter" tabIcon={<FileText className="h-3.5 w-3.5" />}>
            <SettingsHero
                icon={<FileText className="h-7 w-7" />}
                title="Admission Letter Template"
                subtitle="Configure the official admission letter that successful applicants will be able to download from their portal."
            />

            <style>{QUILL_CSS}</style>

            <div className="space-y-6 mb-8">
                <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6">
                    <h3 className="font-bold text-slate-800">Letter Header Settings</h3>
                    
                    <div className="flex items-center gap-6">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input 
                                type="checkbox" 
                                checked={template.showLogo}
                                onChange={(e) => setTemplate(p => ({ ...p, showLogo: e.target.checked }))}
                                className="w-4 h-4 text-[#1E4DA6] border-slate-300 rounded focus:ring-[#1E4DA6]"
                            />
                            <span className="text-sm font-medium text-slate-700">Display School Logo</span>
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer">
                            <input 
                                type="checkbox" 
                                checked={template.showSchoolName}
                                onChange={(e) => setTemplate(p => ({ ...p, showSchoolName: e.target.checked }))}
                                className="w-4 h-4 text-[#1E4DA6] border-slate-300 rounded focus:ring-[#1E4DA6]"
                            />
                            <span className="text-sm font-medium text-slate-700">Display School Name</span>
                        </label>
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
                    <h3 className="font-bold text-slate-800">Letter Body</h3>
                    <p className="text-sm text-slate-500">Draft the main content of the admission letter. This will appear below the header and above the signature. Use <code>{'{ApplicantName}'}</code> to insert the applicant's name dynamically.</p>
                    <div className="overflow-hidden rounded-xl border border-slate-200 focus-within:border-[#1E4DA6]/35 focus-within:ring-2 focus-within:ring-[#1E4DA6]/10 transition-all">
                        <ReactQuill
                            theme="snow"
                            value={template.body}
                            onChange={(val) => setTemplate(p => ({ ...p, body: val }))}
                            modules={QUILL_MODULES}
                        />
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6">
                    <h3 className="font-bold text-slate-800">Signatory Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Signatory Name</label>
                            <input 
                                type="text"
                                value={template.signatoryName}
                                onChange={(e) => setTemplate(p => ({ ...p, signatoryName: e.target.value }))}
                                placeholder="e.g. Dr. John Doe"
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-[#1E4DA6] focus:border-[#1E4DA6] sm:text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Signatory Title</label>
                            <input 
                                type="text"
                                value={template.signatoryTitle}
                                onChange={(e) => setTemplate(p => ({ ...p, signatoryTitle: e.target.value }))}
                                placeholder="e.g. Principal / Director"
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-[#1E4DA6] focus:border-[#1E4DA6] sm:text-sm"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-slate-700 mb-2">Signature Image</label>
                            <div className="flex items-center gap-6">
                                {template.signatureUrl ? (
                                    <div className="relative group border border-slate-200 rounded-lg p-2 max-w-[200px] h-20 flex items-center justify-center bg-slate-50">
                                        <img src={template.signatureUrl} alt="Signature" className="max-h-full max-w-full object-contain" />
                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                                            <label className="cursor-pointer text-xs text-white bg-black/50 px-2 py-1 rounded hover:bg-black/70">
                                                Change
                                                <input type="file" accept="image/*" className="hidden" onChange={handleSignatureUpload} />
                                            </label>
                                            <button onClick={() => setTemplate(p => ({ ...p, signatureUrl: '' }))} className="ml-2 text-xs text-white bg-red-500/80 px-2 py-1 rounded hover:bg-red-500">Remove</button>
                                        </div>
                                    </div>
                                ) : (
                                    <label className="flex flex-col items-center justify-center w-full max-w-[300px] h-24 border-2 border-slate-300 border-dashed rounded-lg cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors">
                                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                            <ImageIcon className="w-6 h-6 text-slate-400 mb-2" />
                                            <p className="text-xs text-slate-500"><span className="font-semibold">Click to upload</span> a signature image</p>
                                        </div>
                                        <input type="file" accept="image/*" className="hidden" onChange={handleSignatureUpload} />
                                    </label>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="border-t border-slate-100 pt-6">
                <SaveButton onClick={handleSave} saved={saved} saving={saving} saveLabel="Save Letter Template" savedLabel="Template Saved!" />
            </div>
        </SettingsShell>
    );
}
