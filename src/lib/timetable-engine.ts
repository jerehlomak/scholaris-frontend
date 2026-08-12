/**
 * timetable-engine.ts
 * 
 * This simulates a smart constraint-checking algorithm (our "AI").
 * In a real backend, this would take all teachers, their subjects, 
 * max limits per week, and perform backtracking or genetic algorithms.
 * 
 * For UI demonstration, we generate a highly structured mock representation
 * of a perfect timetable grid based on the provided configuration.
 */

export interface TimetableConfig {
    days: string[];
    periodsPerDay: number;
    includeBreaks: boolean;
    breakAfterPeriod: number;
    classes: string[];
}

export interface PeriodSlot {
    subject: string;
    teacher: string;
    type: 'class' | 'break' | 'free';
}

export type GeneratedRoutine = {
    [className: string]: {
        [day: string]: PeriodSlot[];
    }
};

const SUBJECTS = ['Mathematics', 'English Language', 'Basic Science', 'Social Studies', 'Civic Education', 'Computer Science', 'Physical Health Ed.'];
const TEACHERS = ['Mr. Lomak', 'Mrs. Adebayo', 'Dr. Okoro', 'Musa Ibrahim', 'Miss Funke', 'Mr. Chinedu'];

/**
 * Returns a randomized but structured routine simulation.
 */
export function generateSmartTimetable(config: TimetableConfig): GeneratedRoutine {
    const routine: GeneratedRoutine = {};

    config.classes.forEach(className => {
        routine[className] = {};

        config.days.forEach(day => {
            const periods: PeriodSlot[] = [];

            for (let i = 1; i <= config.periodsPerDay; i++) {

                // Insert a break period if configured
                if (config.includeBreaks && i === config.breakAfterPeriod + 1) {
                    periods.push({
                        subject: 'Long Break',
                        teacher: '',
                        type: 'break'
                    });
                    // We don't advance the period index for the actual classes just logic wise
                }

                // Pick a pseudo-random subject/teacher mapping
                // Using a deterministic approach based on index so it looks structured
                const subIndex = (className.length + day.length + i) % SUBJECTS.length;
                const teachIndex = (subIndex + i) % TEACHERS.length;

                periods.push({
                    subject: SUBJECTS[subIndex],
                    teacher: TEACHERS[teachIndex],
                    type: 'class'
                });
            }

            // Slice to exact length + breaks 
            const finalLength = config.includeBreaks ? config.periodsPerDay + 1 : config.periodsPerDay;
            routine[className][day] = periods.slice(0, finalLength);
        });
    });

    return routine;
}
