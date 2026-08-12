import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { CBTExam, StudentResult, ExamStatus } from '../types/cbt';

// Generate some realistic dummy data so the dashboards aren't completely empty on first load.
const INITIAL_EXAMS: CBTExam[] = [
    {
        id: 'exam-1',
        title: 'Mid-Term Algebra Review',
        subject: 'Mathematics',
        classLevel: 'JSS 1',
        durationMinutes: 45,
        teacherId: 'teacher-1',
        scheduledDate: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
        status: 'scheduled',
        createdAt: new Date().toISOString(),
        questions: []
    },
    {
        id: 'exam-2',
        title: 'Photosynthesis Fundamentals',
        subject: 'Biology',
        classLevel: 'SS 1',
        durationMinutes: 30,
        teacherId: 'teacher-1',
        scheduledDate: new Date(Date.now() - 86400000).toISOString(), // Yesterday
        status: 'completed',
        createdAt: new Date().toISOString(),
        questions: []
    }
];

const INITIAL_RESULTS: StudentResult[] = [
    {
        id: 'res-1',
        examId: 'exam-2',
        studentId: 'student-1',
        studentName: 'Ayomide Balogun',
        score: 8,
        percentage: 80,
        submittedAt: new Date(Date.now() - 82400000).toISOString(),
        answers: {}
    }
];

interface CBTDatabaseType {
    exams: CBTExam[];
    results: StudentResult[];
    addExam: (exam: CBTExam) => void;
    updateExamStatus: (examId: string, status: ExamStatus) => void;
    deleteExam: (examId: string) => void;
    submitResult: (result: StudentResult) => void;

    // Helper queries
    getExamsByTeacher: (teacherId: string) => CBTExam[];
    getExamsForStudent: (classLevel: string) => CBTExam[];
    getResultsByExam: (examId: string) => StudentResult[];
    getResultsByStudent: (studentId: string) => StudentResult[];
}

const CBTContext = createContext<CBTDatabaseType | undefined>(undefined);

export const CBTProvider = ({ children }: { children: ReactNode }) => {
    // In a real app, these would fetch from a database. 
    // Here we use localStorage to persist the state across reloads.
    const [exams, setExams] = useState<CBTExam[]>(() => {
        const saved = localStorage.getItem('skooly_cbt_exams');
        return saved ? JSON.parse(saved) : INITIAL_EXAMS;
    });

    const [results, setResults] = useState<StudentResult[]>(() => {
        const saved = localStorage.getItem('skooly_cbt_results');
        return saved ? JSON.parse(saved) : INITIAL_RESULTS;
    });

    // Sync to localStorage
    useEffect(() => {
        localStorage.setItem('skooly_cbt_exams', JSON.stringify(exams));
    }, [exams]);

    useEffect(() => {
        localStorage.setItem('skooly_cbt_results', JSON.stringify(results));
    }, [results]);

    // Actions
    const addExam = (exam: CBTExam) => {
        setExams((prev) => [exam, ...prev]);
    };

    const updateExamStatus = (examId: string, status: ExamStatus) => {
        setExams((prev) =>
            prev.map(ex => ex.id === examId ? { ...ex, status } : ex)
        );
    };

    const deleteExam = (examId: string) => {
        setExams((prev) => prev.filter(ex => ex.id !== examId));
        // Also clean up any orphan results
        setResults((prev) => prev.filter(res => res.examId !== examId));
    };

    const submitResult = (result: StudentResult) => {
        setResults((prev) => [result, ...prev]);
    };

    // Queries
    const getExamsByTeacher = (teacherId: string) => exams.filter(e => e.teacherId === teacherId);
    // Students only see "scheduled" or "active" exams for their class, plus past completed ones
    const getExamsForStudent = (classLevel: string) => exams.filter(e => e.classLevel === classLevel && e.status !== 'draft');

    const getResultsByExam = (examId: string) => results.filter(r => r.examId === examId);
    const getResultsByStudent = (studentId: string) => results.filter(r => r.studentId === studentId);

    return (
        <CBTContext.Provider value={{
            exams,
            results,
            addExam,
            updateExamStatus,
            deleteExam,
            submitResult,
            getExamsByTeacher,
            getExamsForStudent,
            getResultsByExam,
            getResultsByStudent
        }}>
            {children}
        </CBTContext.Provider>
    );
};

export const useCBT = () => {
    const context = useContext(CBTContext);
    if (context === undefined) {
        throw new Error('useCBT must be used within a CBTProvider');
    }
    return context;
};
