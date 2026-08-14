import { createContext, useContext, useState, type ReactNode } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────
export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';

export interface Student {
    id: string;
    name: string;
    admissionNo: string;
    classLevel: string;
    avatar: string; // initials
    avatarColor: string;
}

export interface AttendanceRecord {
    id: string;
    studentId: string;
    classLevel: string;
    date: string; // ISO yyyy-mm-dd
    status: AttendanceStatus;
    note?: string;
    markedBy: string; // teacher name
}

// ─── Mock Students ────────────────────────────────────────────────────────────
export const MOCK_STUDENTS: Student[] = [
    { id: 's1', name: 'Ayomide Balogun', admissionNo: 'ADM/2024/001', classLevel: 'SS 1', avatar: 'AB', avatarColor: 'bg-[#1E4DA6]' },
    { id: 's2', name: 'Chinoso Obi', admissionNo: 'ADM/2024/002', classLevel: 'SS 1', avatar: 'CO', avatarColor: 'bg-orange-500' },
    { id: 's3', name: 'Fatima Musa', admissionNo: 'ADM/2024/003', classLevel: 'SS 1', avatar: 'FM', avatarColor: 'bg-pink-500' },
    { id: 's4', name: 'Emmanuel Adeyemi', admissionNo: 'ADM/2024/004', classLevel: 'SS 1', avatar: 'EA', avatarColor: 'bg-teal-500' },
    { id: 's5', name: 'Blessing Nwosu', admissionNo: 'ADM/2024/005', classLevel: 'SS 1', avatar: 'BN', avatarColor: 'bg-indigo-500' },
    { id: 's6', name: 'Kelechi Eze', admissionNo: 'ADM/2024/006', classLevel: 'SS 1', avatar: 'KE', avatarColor: 'bg-green-500' },
    { id: 's7', name: 'Amina Yusuf', admissionNo: 'ADM/2024/007', classLevel: 'SS 1', avatar: 'AY', avatarColor: 'bg-red-500' },
    { id: 's8', name: 'David Okonkwo', admissionNo: 'ADM/2024/008', classLevel: 'SS 1', avatar: 'DO', avatarColor: 'bg-[#1E4DA6]' },
    { id: 's9', name: 'Ngozi Ibe', admissionNo: 'ADM/2024/009', classLevel: 'JSS 2', avatar: 'NI', avatarColor: 'bg-yellow-600' },
    { id: 's10', name: 'Tunde Afolabi', admissionNo: 'ADM/2024/010', classLevel: 'JSS 2', avatar: 'TA', avatarColor: 'bg-cyan-600' },
    { id: 's11', name: 'Ifeoma Chukwu', admissionNo: 'ADM/2024/011', classLevel: 'JSS 2', avatar: 'IC', avatarColor: 'bg-rose-500' },
    { id: 's12', name: 'Musa Aliyu', admissionNo: 'ADM/2024/012', classLevel: 'JSS 2', avatar: 'MA', avatarColor: 'bg-lime-600' },
];

// ─── Mock Records (past 5 school days) ───────────────────────────────────────
function pastDay(n: number) {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return d.toISOString().split('T')[0];
}

const randomStatus = (seed: number): AttendanceStatus => {
    const r = seed % 10;
    if (r < 7) return 'present';
    if (r < 8) return 'absent';
    if (r < 9) return 'late';
    return 'excused';
};

export const MOCK_RECORDS: AttendanceRecord[] = MOCK_STUDENTS.flatMap((s, si) =>
    [1, 2, 3, 4, 5].map((d, di) => ({
        id: `${s.id}-d${d}`,
        studentId: s.id,
        classLevel: s.classLevel,
        date: pastDay(d),
        status: randomStatus(si * 3 + di),
        markedBy: s.classLevel.startsWith('SS') ? 'Mr. Adebayo' : 'Mrs. Okafor',
    }))
);

// ─── Context ──────────────────────────────────────────────────────────────────
interface AttendanceContextType {
    records: AttendanceRecord[];
    markAttendance: (records: Omit<AttendanceRecord, 'id'>[]) => void;
    updateRecord: (id: string, status: AttendanceStatus, note?: string) => void;
    getRecordsForClass: (classLevel: string, date: string) => AttendanceRecord[];
    getStudentStats: (studentId: string) => { present: number; absent: number; late: number; excused: number; total: number; rate: number };
}

const AttendanceContext = createContext<AttendanceContextType | undefined>(undefined);

export function AttendanceProvider({ children }: { children: ReactNode }) {
    const [records, setRecords] = useState<AttendanceRecord[]>(MOCK_RECORDS);

    const markAttendance = (newRecords: Omit<AttendanceRecord, 'id'>[]) => {
        const withIds = newRecords.map(r => ({ ...r, id: `${r.studentId}-${r.date}-${Date.now()}` }));
        setRecords(prev => {
            // Remove any existing records for same student+date, then add new
            const filtered = prev.filter(p =>
                !withIds.some(n => n.studentId === p.studentId && n.date === p.date)
            );
            return [...filtered, ...withIds];
        });
    };

    const updateRecord = (id: string, status: AttendanceStatus, note?: string) => {
        setRecords(prev => prev.map(r => r.id === id ? { ...r, status, note } : r));
    };

    const getRecordsForClass = (classLevel: string, date: string) =>
        records.filter(r => r.classLevel === classLevel && r.date === date);

    const getStudentStats = (studentId: string) => {
        const studentRecords = records.filter(r => r.studentId === studentId);
        const present = studentRecords.filter(r => r.status === 'present').length;
        const absent = studentRecords.filter(r => r.status === 'absent').length;
        const late = studentRecords.filter(r => r.status === 'late').length;
        const excused = studentRecords.filter(r => r.status === 'excused').length;
        const total = studentRecords.length;
        const rate = total > 0 ? Math.round(((present + late) / total) * 100) : 0;
        return { present, absent, late, excused, total, rate };
    };

    return (
        <AttendanceContext.Provider value={{ records, markAttendance, updateRecord, getRecordsForClass, getStudentStats }}>
            {children}
        </AttendanceContext.Provider>
    );
}

export function useAttendance() {
    const ctx = useContext(AttendanceContext);
    if (!ctx) throw new Error('useAttendance must be used inside AttendanceProvider');
    return ctx;
}

export const CLASS_LEVELS = ['JSS 1', 'JSS 2', 'JSS 3', 'SS 1', 'SS 2', 'SS 3'];

export const STATUS_CONFIG: Record<AttendanceStatus, { label: string; color: string; bg: string; dot: string }> = {
    present: { label: 'Present', color: 'text-[#10b981]', bg: 'bg-[#10b981]/10', dot: 'bg-[#10b981]' },
    absent: { label: 'Absent', color: 'text-red-600', bg: 'bg-red-50', dot: 'bg-red-500' },
    late: { label: 'Late', color: 'text-[#ff9800]', bg: 'bg-[#ff9800]/10', dot: 'bg-[#ff9800]' },
    excused: { label: 'Excused', color: 'text-[#1E4DA6]', bg: 'bg-[#1E4DA6]/5', dot: 'bg-[#1E4DA6]/60' },
};
