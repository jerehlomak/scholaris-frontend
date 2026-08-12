export interface CBTQuestion {
    id: string; // Unique ID for tracking choices
    text: string; // The specific question asking text
    options: string[]; // Always 4 options
    correctAnswer: string; // The exact string of the correct option
    explanation?: string; // Why the answer is correct (for post-exam review) — optional for manually added questions
    order?: number; // Display order (used by manual flow)
}

export type ExamStatus = 'draft' | 'scheduled' | 'active' | 'completed';

export interface CBTExam {
    id: string;
    title: string;
    subject: string;
    classLevel: string;
    durationMinutes: number; // The strict countdown timer
    teacherId: string; // So teachers only see their own tests
    scheduledDate: string; // ISO date string
    status: ExamStatus;
    questions: CBTQuestion[];
    createdAt: string; // ISO date string
}

export interface StudentResult {
    id: string;
    examId: string;
    studentId: string;
    studentName: string;
    score: number; // Raw points (e.g., 8 out of 10)
    percentage: number;
    submittedAt: string; // ISO date string
    answers: Record<string, string>; // Maps Question ID -> Selected Option String
}
