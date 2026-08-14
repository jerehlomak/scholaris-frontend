import React from 'react';

export default function StudentInfoBlock({ data, config, toggles, masterConfig }: { data: any, config?: any, toggles?: any, masterConfig?: any }) {
    // Only use the explicitly ordered fields from config (or fallback)
    const DEFAULT_FIELDS = ['Student Name', 'Class', 'Academic Year', 'Student ID', 'Term', 'Date Issued', 'Next Term Begins', 'Term Ends', 'Age', 'Gender', 'Club & Society'];
    // `studentFields` is typed `any` upstream and several call sites default it to `{}`
    // (an empty object, not an array) when no real field config exists yet — guard against
    // that shape here rather than assuming every caller passes a real string array.
    const resolved = masterConfig?.studentFields || config?.studentFields || data?.studentFields;
    let fields: string[] = Array.isArray(resolved) ? [...resolved] : [...DEFAULT_FIELDS];
    const s = data?.student || {};
    const t = toggles || {};

    // Dynamically inject manually toggled fields if they are explicitly enabled in master toggles but missing from fields
    if (t.showStudentName === true && !fields.includes('Student Name')) fields.push('Student Name');
    if (t.showClass === true && !fields.includes('Class')) fields.push('Class');
    if (t.showAcademicYear === true && !fields.includes('Academic Year')) fields.push('Academic Year');
    if (t.showStudentId === true && !fields.includes('Student ID')) fields.push('Student ID');
    if (t.showTerm === true && !fields.includes('Term')) fields.push('Term');
    if (t.showDateIssued === true && !fields.includes('Date Issued')) fields.push('Date Issued');
    if (t.showNextTermBegins === true && !fields.includes('Next Term Begins')) fields.push('Next Term Begins');
    if (t.showTermEnds === true && !fields.includes('Term Ends')) fields.push('Term Ends');
    if (t.showAge === true && !fields.includes('Age')) fields.push('Age');
    if (t.showClub === true && !fields.includes('Club & Society')) fields.push('Club & Society');
    if (t.showGender === true && !fields.includes('Gender')) fields.push('Gender');

    // Apply master display toggles filter
    fields = fields.filter(f => {
        if (f === 'Student Name' && t.showStudentName === false) return false;
        if (f === 'Class' && t.showClass === false) return false;
        if (f === 'Academic Year' && t.showAcademicYear === false) return false;
        if (f === 'Student ID' && t.showStudentId === false) return false;
        if (f === 'Term' && t.showTerm === false) return false;
        if (f === 'Date Issued' && t.showDateIssued === false) return false;
        if (f === 'Gender' && t.showGender === false) return false;
        if (f === 'Age' && t.showAge === false) return false;
        if (f === 'Club & Society' && t.showClub === false) return false;
        if (f === 'Next Term Begins' && t.showNextTermBegins === false) return false;
        if (f === 'Term Ends' && t.showTermEnds === false) return false;
        return true;
    });

    // Fallback static map for dummy data if dynamic fields are used
    const valMap: Record<string, string> = {
        'Student Name': s.name || 'Amara Johnson',
        'Class': s.className || s.class || 'Grade 8B',
        'Academic Year': s.academicYear || s.session || '2025 / 2026',
        'Student ID': s.admissionNo || 'SKL-20240198',
        'Term': s.term || 'Second Term',
        'Date Issued': new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        'Gender': s.gender || 'Female',
        'Date of Birth': s.dateOfBirth || s.dob || '14 Oct 2012',
        'Age': s.age || '13 Years',
        'Club & Society': s.club || '—',
        'Next Term Begins': data?.comments?.nextTermBegins || s.nextTermBegins || 'Sept 10, 2026',
        'Term Ends': s.termEnds || 'July 20, 2026',
    };

    const cols = config?.layoutCols || 4;
    const gridClass = cols === 2 ? 'grid-cols-2' : cols === 3 ? 'grid-cols-3' : 'grid-cols-4';
    const showPicture = t.showStudentPicture === false ? false : (config?.studentPicture ?? true);

    return (
        <div className="flex gap-4 pb-2 border-b border-gray-200">
            {showPicture && (
                <div className="w-16 h-20 bg-gray-100 border border-gray-300 rounded overflow-hidden shrink-0">
                    {s.photoUrl || s.photo ? (
                        <img src={s.photoUrl || s.photo} alt="Student" className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                            <svg className="w-7 h-7 mb-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
                            <span className="text-[7px] font-bold">NO PHOTO</span>
                        </div>
                    )}
                </div>
            )}
            <div className={`flex-1 grid ${gridClass} gap-y-1 gap-x-4`}>
                {fields.map((f: string, i: number) => (
                    <div key={i}>
                        <div className="text-[8px] uppercase tracking-wider text-gray-400 font-semibold">{f}</div>
                        <div className="text-[11px] font-medium text-gray-800">{valMap[f] || s[f.toLowerCase().replace(/ /g, '')] || '—'}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}
