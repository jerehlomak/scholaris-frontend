import { inputCls, subjectsForClasses, type CbtMeta } from './api';

const Label = ({ t, children }: { t: string; children: React.ReactNode }) => (
    <label className="block space-y-1"><span className="text-xs font-semibold text-slate-600">{t}</span>{children}</label>
);

/**
 * Class, then subject. A teacher only gets the classes they teach or are form teacher of, and for each class the subjects
 * they may set: the ones they teach there, or every subject of the class when they are its form teacher.
 */
export function ClassSubjectFields({ meta, classLevel, subject, onChange }: { meta: CbtMeta; classLevel: string; subject: string; onChange: (p: { classLevel: string; subject: string }) => void }) {
    const cls = meta.classes.find(c => c.name === classLevel);
    const subjects = subjectsForClasses(meta, cls ? [cls.id] : []);
    const classOptions = classLevel && !cls ? [classLevel, ...meta.classes.map(c => c.name)] : meta.classes.map(c => c.name); // keep an older free-text value visible
    const subjectOptions = subject && !subjects.includes(subject) ? [subject, ...subjects] : subjects;

    const pickClass = (name: string) => {
        const next = meta.classes.find(c => c.name === name);
        const list = subjectsForClasses(meta, next ? [next.id] : []);
        onChange({ classLevel: name, subject: list.includes(subject) ? subject : list.length === 1 ? list[0] : '' });
    };

    return (
        <>
            <Label t="Class / level">
                <select className={inputCls} value={classLevel} onChange={e => pickClass(e.target.value)}>
                    <option value="">{meta.classes.length ? 'Choose a class…' : 'No classes assigned to you'}</option>
                    {classOptions.map(n => <option key={n} value={n}>{n}</option>)}
                </select>
            </Label>
            <Label t="Subject">
                <select className={inputCls} value={subject} onChange={e => onChange({ classLevel, subject: e.target.value })}>
                    <option value="">{subjects.length ? 'Choose a subject…' : cls ? 'No subjects assigned' : 'Choose a class first'}</option>
                    {subjectOptions.map(n => <option key={n} value={n}>{n}</option>)}
                </select>
            </Label>
        </>
    );
}
