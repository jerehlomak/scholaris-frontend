import axios from 'axios';
import { apiError, blobError, saveBlob, inputCls } from '../dashboard/lesson-notes/api';

export { apiError, inputCls };
export const ATT_API = '/api/v1/attendance-v2';

export type PeriodKind = 'day' | 'week' | 'month' | 'term' | 'session' | 'year' | 'custom';
export interface PeriodQuery { period: PeriodKind; date?: string; month?: string; termId?: string; sessionId?: string; year?: string; from?: string; to?: string }

export const todayStr = () => { const d = new Date(); const p = (n: number) => String(n).padStart(2, '0'); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`; };
export const defaultPeriod = (): PeriodQuery => ({ period: 'month', month: todayStr().slice(0, 7), date: todayStr(), year: String(new Date().getFullYear()), from: todayStr().slice(0, 8) + '01', to: todayStr() });

/** Only the fields the chosen period needs, ready to send as query parameters. */
export const periodParams = (p: PeriodQuery): Record<string, string> => {
    const out: Record<string, string> = { period: p.period };
    if (p.period === 'day' || p.period === 'week') out.date = p.date || todayStr();
    if (p.period === 'month') out.month = p.month || todayStr().slice(0, 7);
    if (p.period === 'term' && p.termId) out.termId = p.termId;
    if (p.period === 'session' && p.sessionId) out.sessionId = p.sessionId;
    if (p.period === 'year') out.year = p.year || String(new Date().getFullYear());
    if (p.period === 'custom') { out.from = p.from || ''; out.to = p.to || ''; }
    return out;
};

export async function downloadFile(path: string, params: Record<string, string>, fallback: string) {
    try { const res = await axios.get(`${ATT_API}${path}`, { params, responseType: 'blob' }); saveBlob(res.data, res.headers, fallback); }
    catch (err) { throw new Error(await blobError(err, 'Could not download the file.')); }
}

export const STATUS_STYLE: Record<string, string> = {
    PRESENT: 'bg-emerald-100 text-emerald-700', LATE: 'bg-amber-100 text-amber-700', ABSENT: 'bg-rose-100 text-rose-700', EXCUSED: 'bg-blue-100 text-blue-700', HALF_DAY: 'bg-violet-100 text-violet-700',
};
export const statusLabel = (s: string | null) => (s === 'HALF_DAY' ? 'Half day' : s ? s.charAt(0) + s.slice(1).toLowerCase() : '—');

export const fmtTime = (d: string | null | undefined) => (d ? new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '');
export const fmtDay = (d: string) => new Date(`${d}T12:00:00`).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });

export interface Channels { inApp: boolean; email: boolean; whatsapp: boolean }
export interface Deduction { enabled: boolean; mode: 'PER_LATE_FIXED' | 'PER_LATE_PERCENT_DAILY' | 'PER_MINUTE'; amount: number; freeLates: number; maxPercentOfGross: number; deductAbsent: boolean }
export interface AttConfig {
    enabled: boolean; timezone: string; workDays: string[]; holidays: string[];
    staff: { startTime: string; graceMinutes: number; closeTime: string; halfDayHours: number; earliestSignIn: string; requireSignOut: boolean; autoSignOut: boolean; minMinutesBeforeSignOut: number };
    students: { startTime: string; lateAfterMinutes: number; closeTime: string };
    methods: { register: boolean; cardScan: boolean; wallQr: boolean; locationOnly: boolean };
    geofence: { enabled: boolean; lat: number | null; lng: number | null; radiusMeters: number; maxAccuracyMeters: number };
    wallQr: { rotateDays: number }; scanners: { teachersCanScanCards: boolean };
    staffReminders: { enabled: boolean; resumeLeadMinutes: number[]; lateWarnMinutes: number[]; signOutLeadMinutes: number[]; channels: Channels };
    parentAlerts: { enabled: boolean; onSignIn: boolean; onSignOut: boolean; onAbsent: boolean; channels: Channels };
    adminAlerts: { staffEvents: boolean; studentEvents: boolean; channels: Channels };
    deduction: Deduction;
}
export interface StaffRow {
    staffId: string; name: string; employeeId: string; department: string; exempt: boolean; workingDays: number; present: number; late: number; halfDay: number; absent: number; excused: number;
    attended: number; lateMinutes: number; punctuality: number | null; attendanceRate: number | null; gross: number; deduction: { total: number; lateDeduction: number; absentDeduction: number; chargeableLates: number; capped: boolean };
}
export interface StudentRow { studentId: string; name: string; admissionNo: string | null; classId: string | null; className: string; present: number; late: number; absent: number; excused: number; total: number; attendanceRate: number | null; lateMinutes: number }

export const naira = (n: number) => `₦${Number(n || 0).toLocaleString('en-NG', { maximumFractionDigits: 2 })}`;
