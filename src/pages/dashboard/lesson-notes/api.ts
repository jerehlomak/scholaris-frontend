import axios from 'axios';

export const LD_API = '/api/v1/lesson-docs';

export const apiError = (err: any, fallback: string) =>
    err?.response?.data?.msg || err?.response?.data?.message || err?.message || fallback;

export type Kind = 'LESSON_NOTE' | 'SCHEME_OF_WORK' | 'CURRICULUM' | 'OTHER';
export type Source = 'AI' | 'MANUAL' | 'UPLOAD';

export const KINDS: { value: Kind; label: string; hint: string }[] = [
    { value: 'LESSON_NOTE', label: 'Lesson note', hint: 'A full note for one lesson' },
    { value: 'SCHEME_OF_WORK', label: 'Scheme of work', hint: 'Week-by-week plan for a term' },
    { value: 'CURRICULUM', label: 'Curriculum / syllabus', hint: 'Units, outcomes and assessment' },
    { value: 'OTHER', label: 'Other document', hint: 'Anything else you describe' },
];
export const kindLabel = (k: string) => KINDS.find(x => x.value === k)?.label || k;

export interface DocSummary {
    id: string; kind: Kind; title: string; subject: string | null; classLevel: string | null; topic: string | null; curriculum: string | null;
    term: string | null; academicYear: string | null; week: number | null; source: Source; ownerId: string; ownerName: string;
    fileName: string | null; fileMime: string | null; fileSize: number; sharing: boolean; createdAt: string; updatedAt: string; weekLabel: string;
}
export interface DocFull extends DocSummary { content: string; shareExpiresAt?: string | null }

export interface Settings {
    aiEnabled: boolean; teachersCanUseAi: boolean; dailyAiLimit: number; curricula: string[]; defaultCurriculum: string; defaultDuration: number;
    defaultLanguage: string; includeDiagrams: boolean; schoolStyleNotes: string; lessonNoteSections: string[];
    allowTeacherUploads: boolean; maxUploadMB: number; allowEmailShare: boolean; shareLinkDays: number;
}
export interface Meta {
    settings: Settings; isAdmin: boolean; terms: string[]; sessions: string[]; subjects: string[]; classes: string[];
    currentTerm: string | null; currentYear: string | null; owners: { ownerId: string; ownerName: string }[];
    ai: { configured: boolean; enabled: boolean; usedToday: number; remaining: number | null; reason: string | null };
    storage: { limitMB: number; limitBytes: number; usedBytes: number; freeBytes: number };
}

/** Metadata that travels with a document (and is shown as "Week 5 · First Term · 2026/2027"). */
export interface DocMeta {
    title: string; kind: Kind; subject: string; classLevel: string; topic: string; curriculum: string; term: string; academicYear: string; week: string;
}
export const emptyMeta = (m?: Meta | null): DocMeta => ({
    title: '', kind: 'LESSON_NOTE', subject: '', classLevel: '', topic: '', curriculum: m?.settings.defaultCurriculum || '',
    term: m?.currentTerm || '', academicYear: m?.currentYear || '', week: '',
});

export const formatLabel = (d: { week?: number | string | null; term?: string | null; academicYear?: string | null }) =>
    [d.week ? `Week ${d.week}` : null, d.term, d.academicYear].filter(Boolean).join(' · ');

export const fmtBytes = (n: number) => (n >= 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : n >= 1024 ? `${Math.round(n / 1024)} KB` : `${n} B`);

export const inputCls = 'h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none focus:border-[#1E4DA6] focus:ring-2 focus:ring-[#1E4DA6]/20 disabled:bg-slate-50';

/** Save a blob returned by the API as a file. */
export const saveBlob = (blob: Blob, headers: any, fallbackName: string) => {
    const name = /filename="([^"]+)"/.exec(headers?.['content-disposition'] || '')?.[1] || fallbackName;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
};

// A blob error body is JSON text; turn it back into a message.
export const blobError = async (err: any, fallback: string) => {
    const data = err?.response?.data;
    if (data instanceof Blob) {
        try { return JSON.parse(await data.text()).msg || fallback; } catch { return fallback; }
    }
    return apiError(err, fallback);
};

export async function downloadDoc(id: string, format: 'pdf' | 'docx' | 'original') {
    try {
        const res = await axios.get(`${LD_API}/${id}/download`, { params: { format }, responseType: 'blob' });
        saveBlob(res.data, res.headers, `document.${format === 'original' ? 'pdf' : format}`);
    } catch (err) { throw new Error(await blobError(err, 'Could not download the document.')); }
}

export async function downloadDraft(format: 'pdf' | 'docx', html: string, meta: Partial<DocMeta>) {
    try {
        const res = await axios.post(`${LD_API}/export`, { format, html, ...meta }, { responseType: 'blob' });
        saveBlob(res.data, res.headers, `document.${format}`);
    } catch (err) { throw new Error(await blobError(err, 'Could not download the document.')); }
}

/**
 * POST that answers with server-sent events (AI generation). Resolves with the finished HTML;
 * `onProgress` gets the number of characters written so far. Abort with the signal.
 */
export async function streamAi(path: string, body: unknown, onProgress: (chars: number) => void, signal?: AbortSignal): Promise<{ html: string; truncated: boolean }> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    const branch = localStorage.getItem('skooly_active_branch');
    if (branch) headers['x-active-branch'] = branch;
    const res = await fetch(`${axios.defaults.baseURL || ''}${path}`, { method: 'POST', credentials: 'include', headers, body: JSON.stringify(body), signal });
    if (!res.ok || !res.body) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.msg || 'The request could not be started.');
    }
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let result: { html: string; truncated: boolean } | null = null;
    for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let idx: number;
        while ((idx = buffer.indexOf('\n\n')) !== -1) {
            const block = buffer.slice(0, idx);
            buffer = buffer.slice(idx + 2);
            const event = /^event: (.+)$/m.exec(block)?.[1];
            const data = /^data: (.+)$/m.exec(block)?.[1];
            if (!event || !data) continue;
            const payload = JSON.parse(data);
            if (event === 'progress') onProgress(payload.chars);
            else if (event === 'error') throw new Error(payload.message);
            else if (event === 'done') result = payload;
        }
    }
    if (!result) throw new Error('The connection closed before the document was finished. Please try again.');
    return result;
}
