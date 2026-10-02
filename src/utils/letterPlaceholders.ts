// Placeholders available in admission / employment letter templates.
// Shown in the letter settings pages and filled in by fillLetterPlaceholders().
export const LETTER_PLACEHOLDERS: { token: string; description: string }[] = [
    { token: '{ApplicantName}', description: "Applicant's full name" },
    { token: '{ReferenceNumber}', description: 'Reference number given at submission' },
    { token: '{AdmissionNumber}', description: 'Admission number assigned by the school (admission letters)' },
    { token: '{EmploymentNumber}', description: 'Employment number assigned by the school (employment letters)' },
    { token: '{AdmittedClass}', description: 'Class the applicant is admitted into (may differ from the class applied for)' },
    { token: '{DemotedClass}', description: 'Same as {AdmittedClass} - use when the applicant is placed in a lower class' },
    { token: '{AppliedClass}', description: 'Class the applicant originally applied for' },
    { token: '{Position}', description: 'Position assigned by the school (employment letters)' },
];

const NAME_FIELDS = {
    first: ['f_fname', 'f_firstname', 'firstname', 'first_name', 'fname', 'f_name'],
    last: ['f_lname', 'f_lastname', 'lastname', 'last_name', 'lname', 'l_name'],
};

const pick = (data: Record<string, any>, keys: string[]) => {
    for (const k of keys) if (data?.[k]) return String(data[k]);
    return '';
};

/** Best available display name for an application (falls back to the form data). */
export function applicantDisplayName(application: any): string {
    const name = application?.applicantName;
    if (name && name !== 'Applicant') return name;
    const d = application?.formData || {};
    const extracted = [pick(d, NAME_FIELDS.first), pick(d, NAME_FIELDS.last)].filter(Boolean).join(' ');
    return extracted || name || 'Applicant';
}

const escapeHtml = (v: string) =>
    v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/**
 * Replaces placeholders in a letter body. Values that haven't been assigned yet are
 * left as a visible blank line instead of the raw {Token}, so a printed letter never
 * shows template syntax.
 */
export function fillLetterPlaceholders(body: string, application: any): string {
    const d = application?.formData || {};
    const assigned = application?.assignedClass || '';
    const isEmployment = application?.applicationType === 'EMPLOYMENT';
    const bold = (v: string) => (v ? `<strong>${escapeHtml(v)}</strong>` : '<strong>__________</strong>');

    const values: Record<string, string> = {
        applicantname: applicantDisplayName(application),
        referencenumber: application?.referenceNumber || '',
        admissionnumber: isEmployment ? '' : application?.assignedNumber || '',
        employmentnumber: isEmployment ? application?.assignedNumber || '' : '',
        admittedclass: assigned,
        demotedclass: assigned,
        appliedclass: pick(d, ['classAppliedFor', 'f_class', 'f_class_applied', 'f_classapplied']),
        position: isEmployment ? assigned || pick(d, ['position', 'f_position']) : '',
    };

    return (body || '')
        .replace(/\{(\w+)\}/g, (match, key: string) => {
            const k = key.toLowerCase();
            return k in values ? bold(values[k]) : match;
        })
        .replace(/Dear(\s|&nbsp;)(Candidate|Applicant),?/gi, `Dear ${bold(values.applicantname)},`);
}

export const signatureHeightPx = (template: any): number => {
    const h = Number(template?.signature?.height);
    return Number.isFinite(h) && h >= 30 && h <= 200 ? h : 64;
};
