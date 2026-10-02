import type { CSSProperties, ReactNode } from 'react';
import type { Audience, CardSummary, IdCardConfig, Orientation, Person, SchoolInfo, TemplateId } from './types';

// One renderer for everything: designer preview, class grid, print sheets and the digital card.
// Cards are laid out at CR80 size (85.6 x 54 mm = 324 x 204 CSS px) so print output is 1:1.

export const CARD_SIZE: Record<Orientation, { w: number; h: number }> = {
    vertical: { w: 204, h: 324 },
    horizontal: { w: 324, h: 204 },
};

export const TEMPLATES: { id: TemplateId; name: string; description: string }[] = [
    { id: 'classic', name: 'Classic', description: 'Solid colour header with a bold title strip' },
    { id: 'band', name: 'Curved Band', description: 'Curved header with the photo overlapping' },
    { id: 'sidebar', name: 'Sidebar', description: 'Coloured side stripe with rotated title' },
    { id: 'minimal', name: 'Minimal', description: 'Clean white card with a thin accent bar' },
    { id: 'bold', name: 'Bold', description: 'Full-colour gradient card with a white details panel' },
    { id: 'crest', name: 'Crest', description: 'Framed, formal card with a logo watermark' },
];

export const sampleSchool: SchoolInfo = {
    code: 'SKL', name: 'Your School Name', arabicName: '', motto: 'Knowledge and Character', logoUrl: '',
    address: '12 School Road, Your City', phone: '+234 800 000 0000', email: 'info@yourschool.com',
};

export const samplePerson = (audience: Audience): Person => audience === 'STAFF'
    ? { id: 'sample', type: 'STAFF', name: 'Ibrahim Musa Danjuma', idNumber: 'STF-2026-014', classOrRole: 'Mathematics Dept.', classId: null, gender: 'Male', dob: '1988-04-12', bloodGroup: 'O+', phone: '0803 000 0000', address: '5 Staff Quarters' }
    : { id: 'sample', type: 'STUDENT', name: 'Amina Yusuf Bello', idNumber: 'ADM/2026/0123', classOrRole: 'JSS 1A', classId: null, gender: 'Female', dob: '2013-09-03', bloodGroup: 'A+', phone: '0802 000 0000', address: '12 Example Street' };

// ── colour helpers ───────────────────────────────────────────────────────────
const clamp = (n: number) => Math.max(0, Math.min(255, Math.round(n)));
export const shade = (hex: string, amount: number) => {
    const h = /^#[0-9a-f]{6}$/i.test(hex) ? hex.slice(1) : '1E4DA6';
    const [r, g, b] = [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16));
    const f = (c: number) => clamp(amount >= 0 ? c + (255 - c) * amount : c * (1 + amount));
    return `#${[f(r), f(g), f(b)].map(c => c.toString(16).padStart(2, '0')).join('')}`;
};
const luminance = (hex: string) => {
    const h = /^#[0-9a-f]{6}$/i.test(hex) ? hex.slice(1) : '000000';
    const [r, g, b] = [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16) / 255);
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const onColor = (bg: string) => (luminance(bg) > 0.6 ? '#0F172A' : '#FFFFFF');

const fmtDate = (v?: string | null) => {
    if (!v) return '';
    const d = new Date(v);
    return isNaN(d.getTime()) ? v : d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

// ── small pieces ─────────────────────────────────────────────────────────────
const Silhouette = ({ color }: { color: string }) => (
    <svg viewBox="0 0 24 24" width="100%" height="100%" fill={color} style={{ display: 'block' }}>
        <rect width="24" height="24" fill="#E2E8F0" />
        <circle cx="12" cy="9" r="4.2" fill="#94A3B8" />
        <path d="M3.5 24c0-5 3.8-8 8.5-8s8.5 3 8.5 8z" fill="#94A3B8" />
    </svg>
);

// Placeholder shown in previews before real QR images exist (deterministic pattern, not scannable).
const FakeQr = ({ size }: { size: number }) => {
    const cells = 11;
    const on = (x: number, y: number) => (x * 7 + y * 13 + x * y) % 3 === 0 || (x < 3 && y < 3) || (x > 7 && y < 3) || (x < 3 && y > 7);
    return (
        <svg width={size} height={size} viewBox={`0 0 ${cells} ${cells}`} style={{ background: '#fff', display: 'block' }}>
            {Array.from({ length: cells * cells }, (_, i) => ({ x: i % cells, y: Math.floor(i / cells) }))
                .filter(({ x, y }) => on(x, y))
                .map(({ x, y }) => <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill="#0F172A" />)}
        </svg>
    );
};

const Qr = ({ src, size }: { src: string | null; size: number }) => (
    <div style={{ width: size, height: size, background: '#fff', padding: 2, borderRadius: 3, boxSizing: 'border-box', flexShrink: 0 }}>
        {src ? <img src={src} alt="QR" style={{ width: '100%', height: '100%', display: 'block' }} /> : <FakeQr size={size - 4} />}
    </div>
);

interface Ctx {
    config: IdCardConfig;
    school: SchoolInfo;
    person: Person;
    card: CardSummary | null;
    qr: string | null;
    preview: boolean;
}

const schoolTitle = (c: Ctx) => c.config.header.schoolNameOverride.trim() || c.school.name;
const arabic = (c: Ctx) => (c.config.header.arabicName.trim() || c.school.arabicName || '').trim();
const expiryText = (c: Ctx) => {
    if (!c.config.expiry.enabled) return '';
    if (c.card?.expiresAt) return fmtDate(c.card.expiresAt);
    if (!c.preview) return '';
    if (c.config.expiry.mode === 'FIXED_DATE' && c.config.expiry.date) return fmtDate(c.config.expiry.date);
    const d = new Date(); d.setFullYear(d.getFullYear() + (c.config.expiry.years || 1));
    return fmtDate(d.toISOString());
};

interface Tokens {
    cardBg: string; text: string; muted: string; headerBg: string; headerText: string;
    accent: string; titleBg: string; titleText: string; panelBg: string; panelText: string; frame?: string;
}

const tokensFor = (cfg: IdCardConfig): Tokens => {
    const { primary, secondary, text, background } = cfg.colors;
    const base: Tokens = {
        cardBg: background, text, muted: shade(text, 0.45), headerBg: primary, headerText: onColor(primary),
        accent: secondary, titleBg: secondary, titleText: onColor(secondary), panelBg: 'transparent', panelText: text,
    };
    switch (cfg.templateId) {
        case 'minimal':
            return { ...base, headerBg: 'transparent', headerText: text, titleBg: primary, titleText: onColor(primary) };
        case 'bold':
            return { ...base, cardBg: `linear-gradient(160deg, ${shade(primary, 0.1)}, ${shade(primary, -0.35)})`, text: onColor(primary), muted: onColor(primary) === '#FFFFFF' ? 'rgba(255,255,255,.75)' : 'rgba(15,23,42,.65)', headerBg: 'transparent', headerText: onColor(primary), panelBg: background, panelText: text };
        case 'crest':
            return { ...base, headerBg: 'transparent', headerText: primary, titleBg: primary, titleText: onColor(primary), frame: secondary };
        case 'sidebar':
            return { ...base, headerBg: 'transparent', headerText: primary, titleBg: primary, titleText: onColor(primary) };
        default:
            return base;
    }
};

// ── header ───────────────────────────────────────────────────────────────────
const SchoolHeader = ({ c, t, compact }: { c: Ctx; t: Tokens; compact?: boolean }) => {
    const { header } = c.config;
    const logo = header.showLogo && c.school.logoUrl;
    const ar = header.showArabicName ? arabic(c) : '';
    const logoSize = compact ? 26 : 32;
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: t.headerText, justifyContent: compact ? 'flex-start' : 'center', textAlign: compact ? 'left' : 'center', width: '100%' }}>
            {logo && <img src={c.school.logoUrl} alt="" style={{ width: logoSize, height: logoSize, objectFit: 'contain', flexShrink: 0 }} />}
            <div style={{ minWidth: 0, flex: compact ? 1 : undefined }}>
                {header.showSchoolName && <div style={{ fontSize: compact ? 9.5 : 10.5, fontWeight: 800, letterSpacing: 0.4, textTransform: 'uppercase', lineHeight: 1.12 }}>{schoolTitle(c)}</div>}
                {ar && <div dir="rtl" style={{ fontSize: 11, fontWeight: 700, lineHeight: 1.2, fontFamily: "'Noto Naskh Arabic','Amiri','Traditional Arabic',serif" }}>{ar}</div>}
                {header.showMotto && c.school.motto && <div style={{ fontSize: 6.5, fontStyle: 'italic', opacity: 0.85, marginTop: 1 }}>{c.school.motto}</div>}
            </div>
        </div>
    );
};

const TitleStrip = ({ c, t }: { c: Ctx; t: Tokens }) => (
    <div style={{ background: t.titleBg, color: t.titleText, fontSize: 7.5, fontWeight: 800, letterSpacing: 1.6, textAlign: 'center', padding: '2.5px 6px', textTransform: 'uppercase' }}>
        {c.config.header.title}
    </div>
);

// ── photo / info ─────────────────────────────────────────────────────────────
const Photo = ({ c, t, w, h }: { c: Ctx; t: Tokens; w: number; h: number }) => {
    const shape = c.config.photoShape;
    const radius = shape === 'circle' ? '50%' : shape === 'rounded' ? 10 : 2;
    const size = shape === 'circle' ? { w: Math.min(w, h), h: Math.min(w, h) } : { w, h };
    return (
        <div style={{ width: size.w, height: size.h, borderRadius: radius, overflow: 'hidden', border: `3px solid ${t.accent}`, background: '#E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,.25)', flexShrink: 0, boxSizing: 'border-box' }}>
            {c.person.photo ? <img src={c.person.photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} /> : <Silhouette color="#94A3B8" />}
        </div>
    );
};

const infoRows = (c: Ctx): [string, string][] => {
    const f = c.config.fields;
    const p = c.person;
    const roleLabel = p.type === 'STAFF' ? 'Dept' : 'Class';
    const rows: [string, string][] = [];
    if (f.idNumber) rows.push([p.type === 'STAFF' ? 'Staff ID' : 'Adm No', p.idNumber]);
    if (f.classOrRole) rows.push([roleLabel, p.classOrRole]);
    if (f.gender && p.gender) rows.push(['Gender', p.gender]);
    if (f.dob && p.dob) rows.push(['DOB', fmtDate(p.dob)]);
    if (f.bloodGroup && p.bloodGroup) rows.push(['Blood', p.bloodGroup]);
    if (f.phone && p.phone) rows.push(['Phone', p.phone]);
    if (f.address && p.address) rows.push(['Address', p.address]);
    return rows.filter(([, v]) => v);
};

const InfoBlock = ({ c, t, align }: { c: Ctx; t: Tokens; align: 'center' | 'left' }) => {
    const rows = infoRows(c);
    const number = c.card?.cardNumber || (c.preview ? 'SKL-STU-0001' : '');
    const issued = c.config.fields.issueDate ? fmtDate(c.card?.issuedAt || (c.preview ? new Date().toISOString() : '')) : '';
    const exp = expiryText(c);
    return (
        <div style={{ width: '100%', textAlign: align, color: t.panelBg !== 'transparent' ? t.panelText : t.text, minHeight: 0, overflow: 'hidden' }}>
            {c.config.fields.name && (
                <div style={{ fontSize: align === 'center' ? 12.5 : 12, fontWeight: 800, textTransform: 'uppercase', lineHeight: 1.15, letterSpacing: 0.3, marginBottom: 2 }}>{c.person.name}</div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', columnGap: 5, rowGap: 1, fontSize: 8, lineHeight: 1.3, textAlign: 'left', justifyContent: align === 'center' ? 'center' : 'start', marginTop: 3 }}>
                {rows.map(([k, v]) => (
                    <FragmentRow key={k} k={k} v={v} muted={t.panelBg !== 'transparent' ? shade(t.panelText, 0.45) : t.muted} />
                ))}
                {number && <FragmentRow k="Card No" v={number} muted={t.panelBg !== 'transparent' ? shade(t.panelText, 0.45) : t.muted} strong />}
                {issued && <FragmentRow k="Issued" v={issued} muted={t.panelBg !== 'transparent' ? shade(t.panelText, 0.45) : t.muted} />}
                {exp && <FragmentRow k="Expires" v={exp} muted={t.panelBg !== 'transparent' ? shade(t.panelText, 0.45) : t.muted} />}
            </div>
        </div>
    );
};

const FragmentRow = ({ k, v, muted, strong }: { k: string; v: string; muted: string; strong?: boolean }) => (
    <>
        <span style={{ color: muted, fontWeight: 600 }}>{k}</span>
        <span style={{ fontWeight: strong ? 800 : 700, wordBreak: 'break-word' }}>{v}</span>
    </>
);

const SignatureBlock = ({ c, t, width = 70 }: { c: Ctx; t: Tokens; width?: number }) => {
    const sig = c.config.signature;
    if (!sig.enabled) return null;
    return (
        <div style={{ width, textAlign: 'center', color: t.text }}>
            <div style={{ height: 20, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
                {sig.imageUrl && <img src={sig.imageUrl} alt="" style={{ maxHeight: 20, maxWidth: '100%', objectFit: 'contain' }} />}
            </div>
            <div style={{ borderTop: `1px solid ${t.text}`, fontSize: 6, fontWeight: 700, paddingTop: 1, lineHeight: 1.15 }}>
                {sig.name || ''}{sig.name && sig.title ? ' · ' : ''}{sig.title}
            </div>
        </div>
    );
};

const Seal = ({ c, size = 34 }: { c: Ctx; size?: number }) =>
    c.config.seal.enabled && c.config.seal.imageUrl
        ? <img src={c.config.seal.imageUrl} alt="" style={{ width: size, height: size, objectFit: 'contain', opacity: 0.9 }} />
        : null;

// ── front ────────────────────────────────────────────────────────────────────
const FrontVertical = ({ c, t }: { c: Ctx; t: Tokens }) => {
    const id = c.config.templateId;
    const showQr = c.config.qr.enabled;
    const solidHeader = id === 'classic' || id === 'band';
    return (
        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ background: solidHeader ? t.headerBg : 'transparent', padding: id === 'band' ? '8px 8px 22px' : '8px 8px 6px', borderRadius: id === 'band' ? '0 0 50% 50% / 0 0 22px 22px' : 0 }}>
                <SchoolHeader c={c} t={t} />
            </div>
            {id === 'classic' && <TitleStrip c={c} t={t} />}
            {id !== 'classic' && id !== 'band' && id !== 'sidebar' && (
                <div style={{ margin: '2px 18px 0' }}><TitleStrip c={c} t={t} /></div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flex: 1, minHeight: 0, padding: '0 10px', marginTop: id === 'band' ? -14 : 8 }}>
                <Photo c={c} t={t} w={76} h={92} />
                <div style={{ width: '100%', flex: 1, minHeight: 0, background: t.panelBg, borderRadius: 8, padding: t.panelBg !== 'transparent' ? '6px 6px' : 0, boxSizing: 'border-box' }}>
                    <InfoBlock c={c} t={t} align="center" />
                </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: showQr ? 'space-between' : 'center', padding: '4px 10px 8px', position: 'relative', gap: 6 }}>
                {showQr && <Qr src={c.qr} size={44} />}
                <div style={{ position: 'absolute', left: '50%', bottom: 6, transform: 'translateX(-50%)', pointerEvents: 'none' }}><Seal c={c} /></div>
                <SignatureBlock c={c} t={id === 'bold' ? { ...t, text: t.text } : t} />
            </div>
            {(id === 'classic' || id === 'band') && <div style={{ height: 5, background: t.accent }} />}
        </div>
    );
};

const FrontHorizontal = ({ c, t }: { c: Ctx; t: Tokens }) => {
    const id = c.config.templateId;
    const showQr = c.config.qr.enabled;
    const solidHeader = id === 'classic' || id === 'band';
    return (
        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ background: solidHeader ? t.headerBg : 'transparent', padding: '5px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, borderRadius: id === 'band' ? '0 0 40px 0' : 0, borderBottom: id === 'minimal' || id === 'sidebar' ? `2px solid ${c.config.colors.primary}` : undefined }}>
                <div style={{ flex: 1, minWidth: 0 }}><SchoolHeader c={c} t={t} compact /></div>
                {id !== 'sidebar' && <div style={{ background: t.titleBg, color: t.titleText, fontSize: 7, fontWeight: 800, letterSpacing: 1.3, padding: '3px 7px', borderRadius: 3, whiteSpace: 'nowrap', textTransform: 'uppercase' }}>{c.config.header.title}</div>}
            </div>
            <div style={{ display: 'flex', gap: 10, flex: 1, minHeight: 0, padding: '8px 10px 6px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <Photo c={c} t={t} w={70} h={86} />
                    {showQr && <Qr src={c.qr} size={38} />}
                </div>
                <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div style={{ background: t.panelBg, borderRadius: 8, padding: t.panelBg !== 'transparent' ? '6px 8px' : 0 }}>
                        <InfoBlock c={c} t={t} align="left" />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end', gap: 8 }}>
                        <Seal c={c} size={30} />
                        <SignatureBlock c={c} t={t} width={80} />
                    </div>
                </div>
            </div>
            {(id === 'classic' || id === 'band') && <div style={{ height: 4, background: t.accent }} />}
        </div>
    );
};

// ── back ─────────────────────────────────────────────────────────────────────
const Back = ({ c, t, vertical }: { c: Ctx; t: Tokens; vertical: boolean }) => {
    const b = c.config.back;
    const number = c.card?.cardNumber || (c.preview ? 'SKL-STU-0001' : '');
    const exp = expiryText(c);
    const lines = [b.showAddress && c.school.address, b.showPhone && c.school.phone, b.showEmail && c.school.email].filter(Boolean) as string[];
    const barBg = c.config.templateId === 'bold' ? 'rgba(255,255,255,.18)' : c.config.colors.primary;
    const barText = c.config.templateId === 'bold' ? t.text : onColor(c.config.colors.primary);
    return (
        <div style={{ display: 'flex', flexDirection: vertical ? 'column' : 'row', height: '100%', position: 'relative' }}>
            <div style={{ background: barBg, color: barText, padding: vertical ? '8px 8px' : '0 10px', width: vertical ? undefined : 70, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, textAlign: 'center', flexDirection: vertical ? 'row' : 'column' }}>
                {c.config.header.showLogo && c.school.logoUrl && <img src={c.school.logoUrl} alt="" style={{ width: vertical ? 24 : 38, height: vertical ? 24 : 38, objectFit: 'contain' }} />}
                <div style={{ fontSize: vertical ? 9.5 : 8.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.4, lineHeight: 1.15 }}>{schoolTitle(c)}</div>
            </div>
            <div style={{ flex: 1, minWidth: 0, minHeight: 0, padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 5, color: t.text, overflow: 'hidden' }}>
                {b.note && <p style={{ margin: 0, fontSize: 8, lineHeight: 1.35, fontWeight: 600, textAlign: 'center' }}>{b.note}</p>}
                {lines.length > 0 && (
                    <div style={{ fontSize: 7.5, lineHeight: 1.35, textAlign: 'center', color: t.muted, fontWeight: 600 }}>
                        {lines.map((l, i) => <div key={i}>{l}</div>)}
                    </div>
                )}
                {b.showTerms && b.terms.trim() && (
                    <ol style={{ margin: 0, paddingLeft: 12, fontSize: 6.5, lineHeight: 1.35, color: t.muted }}>
                        {b.terms.split('\n').map(s => s.trim()).filter(Boolean).slice(0, 6).map((s, i) => <li key={i}>{s}</li>)}
                    </ol>
                )}
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {b.showQr && c.config.qr.enabled && <Qr src={c.qr} size={vertical ? 84 : 58} />}
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 6 }}>
                    <span />
                    {b.showSeal && <Seal c={c} size={32} />}
                    {b.showSignature && <SignatureBlock c={c} t={t} width={66} />}
                </div>
                {(number || exp) && (
                    <div style={{ fontSize: 6.5, textAlign: 'center', color: t.muted, fontWeight: 700, letterSpacing: 0.3 }}>
                        {number && <>Card No: {number}</>}{number && exp ? ' · ' : ''}{exp && <>Valid until {exp}</>}
                    </div>
                )}
            </div>
        </div>
    );
};

// ── public component ─────────────────────────────────────────────────────────
export interface IdCardViewProps {
    config: IdCardConfig;
    school: SchoolInfo;
    person: Person;
    card?: CardSummary | null;
    qr?: string | null;
    side?: 'front' | 'back';
    /** Visual scale only (preview); print output should use scale 1. */
    scale?: number;
    /** Fill in sample values (card number, expiry) when the card hasn't been generated yet. */
    preview?: boolean;
    className?: string;
    style?: CSSProperties;
    overlay?: ReactNode;
}

export function IdCardView({ config, school, person, card = null, qr = null, side = 'front', scale = 1, preview = false, className, style, overlay }: IdCardViewProps) {
    const { w, h } = CARD_SIZE[config.orientation];
    const t = tokensFor(config);
    const c: Ctx = { config, school, person, card, qr, preview };
    const vertical = config.orientation === 'vertical';
    const id = config.templateId;
    const frame = id === 'crest' ? config.colors.secondary : undefined;

    const card_ = (
        <div
            className={`id-card ${className || ''}`}
            style={{
                width: w, height: h, position: 'relative', overflow: 'hidden', boxSizing: 'border-box',
                background: t.cardBg, color: t.text, borderRadius: 10, border: '1px solid rgba(15,23,42,.18)',
                fontFamily: "'Poppins','Segoe UI',Arial,sans-serif", WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact',
                ...style,
            } as CSSProperties}
        >
            {/* template decoration */}
            {id === 'sidebar' && side === 'front' && (
                <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 24, background: config.colors.primary, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ transform: 'rotate(-90deg)', whiteSpace: 'nowrap', color: onColor(config.colors.primary), fontSize: 8, fontWeight: 800, letterSpacing: 2.2, textTransform: 'uppercase' }}>{config.header.title}</div>
                </div>
            )}
            {id === 'minimal' && <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 5, background: config.colors.primary }} />}
            {id === 'crest' && (
                <>
                    <div style={{ position: 'absolute', inset: 4, border: `2px double ${frame}`, borderRadius: 7, pointerEvents: 'none' }} />
                    {school.logoUrl && config.header.showLogo && <img src={school.logoUrl} alt="" style={{ position: 'absolute', left: '50%', top: '50%', width: '62%', transform: 'translate(-50%,-50%)', opacity: 0.07, objectFit: 'contain', pointerEvents: 'none' }} />}
                </>
            )}
            {id === 'bold' && side === 'front' && <div style={{ position: 'absolute', right: -40, top: -40, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,.08)' }} />}

            <div style={{ position: 'absolute', inset: 0, paddingLeft: id === 'sidebar' && side === 'front' ? 24 : 0, paddingTop: id === 'minimal' ? 5 : id === 'crest' ? 4 : 0 }}>
                {side === 'front'
                    ? (vertical ? <FrontVertical c={c} t={t} /> : <FrontHorizontal c={c} t={t} />)
                    : <Back c={c} t={t} vertical={vertical} />}
            </div>
            {overlay}
        </div>
    );

    if (scale === 1) return card_;
    return (
        <div style={{ width: w * scale, height: h * scale }}>
            <div style={{ width: w, height: h, transform: `scale(${scale})`, transformOrigin: 'top left' }}>{card_}</div>
        </div>
    );
}
