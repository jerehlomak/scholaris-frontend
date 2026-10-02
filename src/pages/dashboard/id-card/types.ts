export type Audience = 'STUDENT' | 'STAFF';
export type Orientation = 'vertical' | 'horizontal';
export type TemplateId = 'classic' | 'band' | 'sidebar' | 'minimal' | 'bold' | 'crest';

export interface IdCardConfig {
    templateId: TemplateId;
    orientation: Orientation;
    photoShape: 'circle' | 'rounded' | 'square';
    colors: { primary: string; secondary: string; text: string; background: string };
    header: {
        title: string;
        showLogo: boolean;
        showSchoolName: boolean;
        schoolNameOverride: string;
        showArabicName: boolean;
        arabicName: string;
        showMotto: boolean;
    };
    fields: {
        name: boolean;
        idNumber: boolean;
        classOrRole: boolean;
        gender: boolean;
        dob: boolean;
        bloodGroup: boolean;
        phone: boolean;
        address: boolean;
        issueDate: boolean;
    };
    qr: { enabled: boolean; mode: 'VERIFY_URL' | 'ATTENDANCE_TOKEN' };
    expiry: { enabled: boolean; mode: 'YEARS' | 'FIXED_DATE'; years: number; date: string };
    seal: { enabled: boolean; imageUrl: string };
    signature: { enabled: boolean; imageUrl: string; name: string; title: string };
    back: {
        note: string;
        showAddress: boolean;
        showPhone: boolean;
        showEmail: boolean;
        showQr: boolean;
        showSignature: boolean;
        showSeal: boolean;
        showTerms: boolean;
        terms: string;
    };
    numbering: { prefix: string };
    digital: { enabled: boolean };
}

export interface SchoolInfo {
    code: string;
    name: string;
    arabicName: string;
    motto: string;
    logoUrl: string;
    address: string;
    phone: string;
    email: string;
}

export interface Person {
    id: string;
    type: Audience;
    name: string;
    idNumber: string;
    classOrRole: string;
    classId: string | null;
    gender: string;
    dob: string;
    bloodGroup: string;
    phone: string;
    address: string;
    photo?: string;
    hasPhoto?: boolean;
}

export interface CardSummary {
    cardNumber: string;
    token: string;
    issuedAt: string;
    expiresAt: string | null;
    status: 'ACTIVE' | 'REVOKED';
}

export interface CardItem {
    person: Person;
    card: CardSummary | null;
    qr: string | null;
    valid: boolean;
}

export interface ClassOption { id: string; name: string }
