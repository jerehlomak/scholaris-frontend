// Keeps an exam alive without internet: the questions, the student's answers and the clock reference are stored on the
// device (IndexedDB, falling back to localStorage) so the exam can continue, and upload later.

export interface PendingSubmit { finishedAt: number; answers: Record<string, unknown>; flagged: string[]; events: Record<string, number>; offline: boolean }
export interface SavedAttempt {
    examId: string; attemptId: string; deviceId: string;
    exam: any; questions: any[]; deadlineAt: number;
    answers: Record<string, unknown>; flagged: string[]; events: { tabSwitches: number; offlineSeconds: number };
    clock: { server: number; wall: number }; // server time and the device wall clock at the same moment
    everOffline: boolean; pending: PendingSubmit | null; savedAt: number;
}

const DB = 'skooly-cbt';
const STORE = 'attempts';
const LS = (examId: string) => `skooly_cbt_${examId}`;

const open = (): Promise<IDBDatabase> => new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') return reject(new Error('no idb'));
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => { req.result.createObjectStore(STORE, { keyPath: 'examId' }); };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
});

const tx = async <T>(mode: IDBTransactionMode, run: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> => {
    const db = await open();
    return new Promise<T>((resolve, reject) => {
        const t = db.transaction(STORE, mode);
        const r = run(t.objectStore(STORE));
        r.onsuccess = () => resolve(r.result);
        r.onerror = () => reject(r.error);
        t.oncomplete = () => db.close();
    });
};

export async function loadSaved(examId: string): Promise<SavedAttempt | null> {
    try { return ((await tx('readonly', s => s.get(examId))) as SavedAttempt) || null; }
    catch { try { const raw = localStorage.getItem(LS(examId)); return raw ? JSON.parse(raw) : null; } catch { return null; } }
}

export async function putSaved(a: SavedAttempt): Promise<void> {
    const data = { ...a, savedAt: Date.now() };
    try { await tx('readwrite', s => s.put(data)); }
    catch { try { localStorage.setItem(LS(a.examId), JSON.stringify(data)); } catch { /* storage full: the server copy still has the last sync */ } }
}

export async function clearSaved(examId: string): Promise<void> {
    try { await tx('readwrite', s => s.delete(examId)); } catch { /* ignore */ }
    try { localStorage.removeItem(LS(examId)); } catch { /* ignore */ }
}

export const deviceId = (): string => {
    try {
        let id = localStorage.getItem('skooly_cbt_device');
        if (!id) { id = (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`); localStorage.setItem('skooly_cbt_device', id); }
        return id;
    } catch { return `tmp-${Math.random().toString(36).slice(2)}`; }
};
