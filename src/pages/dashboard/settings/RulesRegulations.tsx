import { useState, useEffect } from 'react';
import { BookOpen, Loader2 } from 'lucide-react';
import axios from 'axios';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { SettingsShell } from './shared/SettingsShell';
import { SettingsHero } from './shared/SettingsHero';
import { SaveButton } from './shared/SaveButton';

const QUILL_MODULES = {
    toolbar: [
        [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
        [{ 'font': [] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'color': [] }, { 'background': [] }],
        [{ 'list': 'ordered' }, { 'list': 'bullet' }, { 'indent': '-1' }, { 'indent': '+1' }],
        [{ 'align': [] }],
        ['link', 'image'],
        ['clean']
    ],
};

const DEFAULT_CONTENT = `
<h2>1. General Conduct</h2>
<p>All students are expected to behave respectfully towards teachers, staff, and peers.</p>
<h2>2. Attendance &amp; Punctuality</h2>
<p>Students must arrive at school by <strong>7:45 AM</strong>. Latecomers will be marked accordingly and may face disciplinary action.</p>
<h2>3. Uniform &amp; Appearance</h2>
<p>Complete school uniform must be worn at all times. <em>Modified or improperly worn uniforms are strictly prohibited.</em></p>
`;

const QUILL_CSS = `
.ql-toolbar.ql-snow { border: none !important; border-bottom: 1px solid #e2e8f0 !important; background: #f8fafc; padding: 10px 14px !important; border-radius: 16px 16px 0 0; }
.ql-container.ql-snow { border: none !important; font-family: 'Plus Jakarta Sans', inherit !important; }
.ql-editor { min-height: 380px; padding: 22px 24px !important; color: #334155; line-height: 1.7; font-size: 0.9375rem; }
.ql-editor h2 { color: #0f172a; font-weight: 800; margin-top: 1.25em; margin-bottom: 0.5em; font-size: 1.125rem; }
`;

export function RulesRegulations() {
    const [content, setContent] = useState('');
    const [saved, setSaved] = useState(false);
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        axios.get('/api/v1/school-settings', { withCredentials: true })
            .then(r => setContent(r.data.settings?.rulesContent || DEFAULT_CONTENT))
            .catch(() => setContent(DEFAULT_CONTENT))
            .finally(() => setLoading(false));
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            await axios.patch('/api/v1/school-settings', { rulesContent: content }, { withCredentials: true });
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch { /* silent */ }
        finally { setSaving(false); }
    };

    if (loading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <SettingsShell breadcrumbCurrent="Rules & Regulations" tabLabel="Official Document" tabIcon={<BookOpen className="h-3.5 w-3.5" />}>
            <SettingsHero
                icon={<BookOpen className="h-7 w-7" />}
                title="Institute Rules & Regulations"
                subtitle="Define the full terms, conditions, and rules of conduct for the school. This document will be visible to parents and students in their portals."
            />

            <style>{QUILL_CSS}</style>

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm focus-within:border-blue-300 focus-within:ring-2 focus-within:ring-blue-100 transition-all mb-8">
                <ReactQuill
                    theme="snow"
                    value={content}
                    onChange={setContent}
                    modules={QUILL_MODULES}
                    placeholder="Draft your school's official rules and regulations here..."
                />
            </div>

            <div className="border-t border-slate-100 pt-6">
                <SaveButton onClick={handleSave} saved={saved} saving={saving} saveLabel="Save Official Rules" savedLabel="Document Published!" />
            </div>
        </SettingsShell>
    );
}
