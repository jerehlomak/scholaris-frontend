import axios from 'axios';
import { apiError, blobError, saveBlob, inputCls, fmtBytes } from '../dashboard/lesson-notes/api';

export { apiError, blobError, saveBlob, inputCls, fmtBytes };
export const CBT_API = '/api/v1/cbt-exams';

export type QType = 'MCQ' | 'MULTI' | 'TRUE_FALSE' | 'SHORT' | 'ESSAY';
export const QTYPES: { value: QType; label: string; hint: string }[] = [
    { value: 'MCQ', label: 'Multiple choice', hint: 'One correct option' },
    { value: 'MULTI', label: 'Multiple answer', hint: 'Several correct options' },
    { value: 'TRUE_FALSE', label: 'True / False', hint: 'A statement to judge' },
    { value: 'SHORT', label: 'Short answer', hint: 'Typed word or number, marked automatically' },
    { value: 'ESSAY', label: 'Essay / theory', hint: 'Marked by the teacher' },
];
export const typeLabel = (t: string) => QTYPES.find(x => x.value === t)?.label || t;
export const DIFFICULTIES = ['EASY', 'MEDIUM', 'HARD'] as const;

export interface Option { id: string; html: string; correct?: boolean }
export interface Question {
    id?: string; type: QType; stem: string; options: Option[] | null; answers: any; explanation?: string | null; marks: number;
    subject?: string; classLevel?: string | null; topic?: string | null; difficulty?: string; source?: string; warnings?: string[];
}
export interface BankSummary {
    id: string; type: QType; subject: string; classLevel: string | null; topic: string | null; difficulty: string; marks: number; source: string;
    ownerName: string; preview: string; hasMedia: boolean; updatedAt: string;
}
export interface ExamSummary {
    id: string; title: string; subject: string; classIds: string[]; classNames?: string[]; term: string | null; academicYear: string | null; week: number | null; examType: string;
    durationMinutes: number; startAt: string | null; endAt: string | null; passMark: number; shuffleQuestions: boolean; shuffleOptions: boolean; warnMinutes: number; totalMarks: number;
    status: 'DRAFT' | 'PUBLISHED' | 'CLOSED'; resultsReleased: boolean; allowReview: boolean; ownerId: string; ownerName: string; label: string;
    questionCount?: number; submitted?: number; inProgress?: number; locked?: number; instructions?: string;
}
export interface CbtMeta {
    settings: CbtSettings; isAdmin: boolean; storage: { limitMB: number; limitBytes: number; usedBytes: number; freeBytes: number };
    ai: { configured: boolean; enabled: boolean; remaining: number | null; reason: string | null };
    powers: Record<string, boolean>; classes: { id: string; name: string; level?: string }[]; classSubjects: { classId: string; subject: string }[]; subjects: string[]; terms: string[]; sessions: string[];
    currentTerm: string | null; currentYear: string | null; owners: { ownerId: string; ownerName: string }[];
}
export interface CbtSettings {
    aiEnabled: boolean; teachersCanUseAi: boolean; dailyAiLimit: number; defaultDuration: number; defaultWarnMinutes: number; defaultPassMark: number;
    defaultShuffleQuestions: boolean; defaultShuffleOptions: boolean; examTypes: string[];
    teachersCanSetTimer: boolean; teachersCanAddTime: boolean; teachersCanExempt: boolean; teachersCanReleaseResults: boolean; teachersCanReleaseLock: boolean; teachersCanResetAttempt: boolean; teachersCanSendToReportCard: boolean;
    lockOnLoginElsewhere: boolean; offlineMode: boolean; syncGraceMinutes: number; gradeScale: { min: number; grade: string }[];
    maxUploadMB: number; allowEmailShare: boolean; shareLinkDays: number;
}

export const emptyQuestion = (type: QType = 'MCQ'): Question => ({
    type, stem: '', marks: type === 'ESSAY' ? 10 : 1, explanation: '',
    options: type === 'MCQ' || type === 'MULTI' ? ['A', 'B', 'C', 'D'].map(id => ({ id, html: '', correct: false })) : type === 'TRUE_FALSE' ? [{ id: 'A', html: '<p>True</p>', correct: true }, { id: 'B', html: '<p>False</p>', correct: false }] : null,
    answers: type === 'SHORT' ? [''] : type === 'ESSAY' ? { guide: '' } : null,
});

export const fmtDateTime = (d: string | null) => (d ? new Date(d).toLocaleString([], { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '');
export const toLocalInput = (d: string | null) => { if (!d) return ''; const x = new Date(d); const p = (n: number) => String(n).padStart(2, '0'); return `${x.getFullYear()}-${p(x.getMonth() + 1)}-${p(x.getDate())}T${p(x.getHours())}:${p(x.getMinutes())}`; };

export async function download(url: string, params: Record<string, string>, fallback: string) {
    try { const res = await axios.get(`${CBT_API}${url}`, { params, responseType: 'blob' }); saveBlob(res.data, res.headers, fallback); }
    catch (err) { throw new Error(await blobError(err, 'Could not download the file.')); }
}

/** POST (JSON or FormData) answered with server-sent events. Resolves with the `done` payload. */
export async function streamSse<T>(path: string, body: unknown, onProgress?: (chars: number) => void, signal?: AbortSignal): Promise<T> {
    const headers: Record<string, string> = {};
    const isForm = typeof FormData !== 'undefined' && body instanceof FormData;
    if (!isForm) headers['Content-Type'] = 'application/json';
    const branch = localStorage.getItem('skooly_active_branch');
    if (branch) headers['x-active-branch'] = branch;
    const res = await fetch(`${axios.defaults.baseURL || ''}${path}`, { method: 'POST', credentials: 'include', headers, body: isForm ? (body as FormData) : JSON.stringify(body), signal });
    if (!res.ok || !res.body) { const j = await res.json().catch(() => ({})); throw new Error(j.msg || 'The request could not be started.'); }
    const ct = res.headers.get('content-type') || '';
    if (!ct.includes('event-stream')) return (await res.json()) as T; // non-AI path answers plain JSON
    const reader = res.body.getReader();
    const dec = new TextDecoder();
    let buf = '';
    let out: T | null = null;
    for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        let i: number;
        while ((i = buf.indexOf('\n\n')) !== -1) {
            const block = buf.slice(0, i); buf = buf.slice(i + 2);
            const ev = /^event: (.+)$/m.exec(block)?.[1]; const data = /^data: (.+)$/m.exec(block)?.[1];
            if (!ev || !data) continue;
            const p = JSON.parse(data);
            if (ev === 'progress') onProgress?.(p.chars); else if (ev === 'error') throw new Error(p.message); else if (ev === 'done') out = p;
        }
    }
    if (!out) throw new Error('The connection closed before the work was finished. Please try again.');
    return out;
}

/** Subjects the person may set for the given classes (all their allowed subjects when no class is chosen). Admins fall back to every subject. */
export const subjectsForClasses = (meta: CbtMeta, classIds: string[]): string[] => {
    const rows = classIds.length ? meta.classSubjects.filter(r => classIds.includes(r.classId)) : meta.classSubjects;
    const names = [...new Set(rows.map(r => r.subject))];
    if (!names.length && meta.isAdmin) return [...meta.subjects];
    return names.sort((a, b) => a.localeCompare(b));
};
