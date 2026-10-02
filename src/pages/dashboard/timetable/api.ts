export const TT_API = '/api/v1/timetable';

export const apiError = (err: any, fallback: string) =>
    err?.response?.data?.msg || err?.response?.data?.message || err?.message || fallback;

export const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export const EXAM_TYPES = ['Internal exam', 'WAEC', 'NECO', 'Common Entrance', 'BECE', 'Mock exam', 'Test / CA', 'Other'];

export interface LayoutRow { type: 'LESSON' | 'BREAK'; rowIndex?: number; periodNo?: number; label: string; start: string; end: string; segment: number }

export interface Slot {
    id: string; classId: string | null; day: string | null; date: string | null; rowIndex: number;
    startTime: string; endTime: string; type: string; subject: string | null; title: string | null;
    teacherId: string | null; teacherName: string | null; room: string | null; blockId: string | null;
    isLocked: boolean; notes: string | null; className?: string;
}

export interface ClassInfo { id: string; name: string; level?: string; sectionId?: string | null; sectionName: string }
export interface Clash { type: 'CLASS' | 'TEACHER' | 'ROOM'; slotIds: string[]; classIds: string[]; day: string; start: string; message: string; sectionIds: string[] }

export interface DocSummary {
    id: string; name: string; kind: 'CLASS' | 'EXAM' | 'ACTIVITY'; examType: string | null; term: string | null; academicYear: string | null;
    status: 'DRAFT' | 'PUBLISHED'; startDate: string | null; endDate: string | null; notes: string | null; slotCount?: number;
}

export interface Meta {
    weekdays: string[]; classes: ClassInfo[]; teachers: { id: string; userId: string; name: string; department: string }[];
    subjects: { id: string; name: string }[]; sections: { id: string; name: string }[];
    staff: { id: string; name: string; role: string }[];
    assignments: { classId: string; subject: string; teacherId: string | null }[];
    sectionHeads: { sectionId: string; userId: string }[]; terms: string[]; sessions: string[];
    currentTerm: string | null; currentYear: string | null; timezone: string;
}

export interface MyView {
    key: string; type: 'CLASS_GRID' | 'PERSON_WEEK' | 'DATE_LIST'; classId: string | null; title: string; subtitle: string;
    layout: LayoutRow[] | null; days: string[] | null; slots: Slot[];
}

export const KIND_LABEL: Record<string, string> = { CLASS: 'Class timetable', EXAM: 'Exam timetable', ACTIVITY: 'Activity schedule' };

export const fmtDate = (d: string | null) => {
    if (!d) return '';
    const dt = new Date(`${d}T00:00:00`);
    return Number.isNaN(dt.getTime()) ? d : dt.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
};

export const inputCls = 'h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none focus:border-[#1E4DA6] focus:ring-2 focus:ring-[#1E4DA6]/20 disabled:bg-slate-50';
