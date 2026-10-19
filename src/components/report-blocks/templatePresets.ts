/**
 * templatePresets.ts — the fixed, pre-made result-template gallery.
 *
 * Replaces the old drag-and-drop builder (TemplateBuilder.tsx, removed) per
 * the "no template builder" decision in PROJECT_BRIEF.md section 3. Admins
 * pick one of these as-is instead of assembling blocks themselves — there's
 * no per-block editing UI anymore, so each preset needs to stand on its own
 * as a finished, polished design.
 *
 * All three share Scholaris's fixed navy/gold/cream brand palette (the
 * client's own request: one consistent color identity per school, not a
 * per-template color picker — see section 1, item 3 "let the sidebar and
 * taskbar colors be one for the whole schools"). What actually differs
 * between them is structural: header alignment, typography, information
 * density, and footer layout — real layout choices, not a color reskin of
 * the same page three times.
 *
 * Each preset's `config` shape is exactly what ReportCard.tsx already
 * expects ({ blocks, design }) and what gets persisted as a ReportTemplate's
 * `config` JSON via POST /api/v1/report-templates — no rendering changes
 * were needed to support this, only removing the builder UI that used to
 * let admins assemble a `blocks` array by hand.
 */

const NAVY = '#0B1F4E';
const NAVY_DEEP = '#122B5C';
const GOLD = '#F5B800';
const GOLD_LIGHT = '#FFC72C';

export interface TemplatePreset {
    id: string;
    name: string;
    description: string;
    /** Small stylistic tag shown on the gallery card. */
    tag: string;
    /**
     * 'blocks' (default) renders through ReportCard. 'legacy' is the original
     * config-driven layout drawn by ReportCardPreview — it must have NO `blocks`
     * key, because every result page picks its renderer by `config.blocks`.
     */
    kind?: 'blocks' | 'legacy';
    config: {
        blocks?: { id: string; type: string; isVisible: boolean; props?: Record<string, any> }[];
        design: Record<string, any>;
        [legacyKey: string]: any;
    };
}

/**
 * The "Classic" layout: ReportCardPreview's built-in design (Academic
 * Performance table, Summary + Attendance cards, Remarks & Signatures, Grading
 * Key). `autoColumns` makes it read each school's own assessment names from the
 * results instead of needing columns defined by hand.
 */
const CLASSIC_CONFIG: TemplatePreset['config'] = {
    legacyLayout: true,
    autoColumns: true,
    showSchoolLogo: true, showSchoolAddress: true, showStudentPhoto: true,
    showAdmissionNo: true, showClass: true, showSession: true, showTerm: true, showAge: false, showGender: true, showTeacherName: false,
    showClassAverage: true, showSubjectPosition: false, showOverallPosition: true, showClassPosition: true,
    showGradingKey: true, showAttendance: true, showEvaluation: true, showTraitRatings: true,
    showTeacherComment: true, showHeadComment: true, showPrincipalComment: true, showNextTerm: false, showPromotedTo: false,
    reportTitle: 'End of Term Academic Report',
    formTeacherTitle: 'Form Teacher', headTeacherTitle: 'Head Teacher', principalTitle: 'Principal', principalName: '',
    primaryColor: NAVY, headerBg: NAVY, accentColor: GOLD,
    fontFamily: 'serif', tableBorderColor: '#d1d5db', pageMargin: '10mm', logoPosition: 'left', headerStyle: 'standard',
    subjectColumns: [], evaluationSections: [],
    design: { primaryColor: NAVY, accentColor: GOLD },
};

export const TEMPLATE_PRESETS: TemplatePreset[] = [
    {
        id: 'heritage',
        name: 'Heritage',
        description: 'Formal, bordered layout with a serif face — the traditional printed-report-card look, in the school\'s navy and gold.',
        tag: 'Classic',
        config: {
            blocks: [
                { id: 'b-header', type: 'SchoolHeaderBlock', isVisible: true, props: { accentColor: GOLD, headerLayoutMode: 'LEFT', reportBadge: 'ACADEMIC PROGRESS REPORT' } },
                { id: 'b-student-info', type: 'StudentInfoBlock', isVisible: true, props: { accentColor: NAVY } },
                { id: 'b-academic-summary', type: 'AcademicSummaryBlock', isVisible: true, props: { accentColor: GOLD } },
                { id: 'b-subject-results', type: 'SubjectResultsBlock', isVisible: true, props: { accentColor: NAVY, highlightTop: true, showPassFail: true } },
                { id: 'b-attendance', type: 'AttendanceBlock', isVisible: true, props: { accentColor: NAVY } },
                { id: 'b-comments', type: 'NarrativeCommentsBlock', isVisible: true, props: { accentColor: NAVY } },
                { id: 'b-remarks', type: 'RemarksBlock', isVisible: true, props: { accentColor: GOLD } },
                { id: 'b-signatures', type: 'SignaturesBlock', isVisible: true, props: {} }
            ],
            design: {
                primaryColor: NAVY,
                accentColor: GOLD,
                headerBg: NAVY,
                fontFamily: 'serif',
                tableBorderColor: '#c9b98a',
                pageMargin: '12mm',
                logoPosition: 'left',
                headerStyle: 'standard',
                resultBorder: true
            }
        }
    },
    {
        id: 'modern',
        name: 'Modern',
        description: 'Centered header, clean sans-serif, generous whitespace, and a two-column footer — a contemporary read for schools that want less "form," more "report."',
        tag: 'Contemporary',
        config: {
            blocks: [
                { id: 'b-header', type: 'SchoolHeaderBlock', isVisible: true, props: { accentColor: GOLD_LIGHT, headerLayoutMode: 'CENTER', reportBadge: 'TERM REPORT' } },
                { id: 'b-student-info', type: 'StudentInfoBlock', isVisible: true, props: { accentColor: NAVY_DEEP } },
                { id: 'b-academic-summary', type: 'AcademicSummaryBlock', isVisible: true, props: { accentColor: NAVY_DEEP } },
                { id: 'b-subject-results', type: 'SubjectResultsBlock', isVisible: true, props: { accentColor: NAVY_DEEP, highlightTop: true, showPassFail: false } },
                { id: 'b-attendance', type: 'AttendanceBlock', isVisible: true, props: { accentColor: GOLD_LIGHT } },
                { id: 'b-comments', type: 'NarrativeCommentsBlock', isVisible: true, props: { accentColor: NAVY_DEEP } },
                { id: 'b-signatures', type: 'SignaturesBlock', isVisible: true, props: {} }
            ],
            design: {
                primaryColor: NAVY_DEEP,
                accentColor: GOLD_LIGHT,
                headerBg: NAVY_DEEP,
                fontFamily: 'sans',
                tableBorderColor: '#e2e8f0',
                pageMargin: '10mm',
                logoPosition: 'center',
                headerStyle: 'minimal',
                resultBorder: false
            }
        }
    },
    {
        id: 'concise',
        name: 'Concise',
        description: 'Right-aligned header and tight spacing to fit more on one page — for schools with long subject lists or multi-column assessment breakdowns.',
        tag: 'Compact',
        config: {
            blocks: [
                { id: 'b-header', type: 'SchoolHeaderBlock', isVisible: true, props: { accentColor: GOLD, headerLayoutMode: 'RIGHT', reportBadge: 'RESULT SHEET' } },
                { id: 'b-student-info', type: 'StudentInfoBlock', isVisible: true, props: { accentColor: NAVY } },
                { id: 'b-subject-results', type: 'SubjectResultsBlock', isVisible: true, props: { accentColor: GOLD, highlightTop: false, showPassFail: true } },
                { id: 'b-academic-summary', type: 'AcademicSummaryBlock', isVisible: true, props: { accentColor: NAVY } },
                { id: 'b-attendance', type: 'AttendanceBlock', isVisible: true, props: { accentColor: NAVY } },
                { id: 'b-comments', type: 'NarrativeCommentsBlock', isVisible: true, props: { accentColor: NAVY } },
                { id: 'b-remarks', type: 'RemarksBlock', isVisible: true, props: { accentColor: NAVY } },
                { id: 'b-signatures', type: 'SignaturesBlock', isVisible: true, props: {} }
            ],
            design: {
                primaryColor: NAVY,
                accentColor: GOLD,
                headerBg: NAVY,
                fontFamily: 'sans',
                tableBorderColor: '#d1d5db',
                pageMargin: '8mm',
                logoPosition: 'right',
                headerStyle: 'standard',
                resultBorder: false
            }
        }
    },
    {
        id: 'continuous-assessment',
        name: 'Continuous Assessment',
        description: 'The dense, all-on-one-page CA/Exam sheet most Nigerian primary and junior-secondary schools already use — full subject breakdown plus a Psychomotor & Affective domain rating grid.',
        tag: 'Detailed',
        config: {
            blocks: [
                { id: 'b-header', type: 'SchoolHeaderBlock', isVisible: true, props: { accentColor: GOLD, headerLayoutMode: 'LEFT', reportBadge: 'CONTINUOUS ASSESSMENT REPORT' } },
                { id: 'b-student-info', type: 'StudentInfoBlock', isVisible: true, props: { accentColor: NAVY } },
                { id: 'b-attendance', type: 'AttendanceBlock', isVisible: true, props: { accentColor: NAVY } },
                { id: 'b-subject-results', type: 'SubjectResultsBlock', isVisible: true, props: { accentColor: NAVY, highlightTop: true, showPassFail: true } },
                { id: 'b-academic-summary', type: 'AcademicSummaryBlock', isVisible: true, props: { accentColor: GOLD } },
                { id: 'b-domain-ratings', type: 'DomainRatingsBlock', isVisible: true, props: { accentColor: GOLD, primaryColor: NAVY } },
                { id: 'b-comments', type: 'NarrativeCommentsBlock', isVisible: true, props: { accentColor: NAVY } },
                { id: 'b-signatures', type: 'SignaturesBlock', isVisible: true, props: {} }
            ],
            design: {
                primaryColor: NAVY,
                accentColor: GOLD,
                headerBg: NAVY,
                fontFamily: 'sans',
                tableBorderColor: '#c9b98a',
                pageMargin: '8mm',
                logoPosition: 'left',
                headerStyle: 'standard',
                resultBorder: true
            }
        }
    },
    {
        id: 'ledger',
        name: 'Ledger',
        description: 'A dense, all-on-one-page CA sheet built from an uploaded reference format: a bordered admission/attendance/grades grid, color-coded remark badges right in the subject table, and Affective/Psychomotor ratings alongside a grading-key legend in a sidebar next to the results — 20+ subjects on a single page without shrinking to fit two.',
        tag: 'Legacy CA',
        config: {
            blocks: [
                { id: 'b-header', type: 'SchoolHeaderBlock', isVisible: true, props: { accentColor: GOLD, primaryColor: NAVY, headerLayoutMode: 'BANNER', reportBadge: '{TERM} EXAM REPORT SHEET {SESSION}' } },
                { id: 'b-student-info', type: 'BorderedStudentInfoBlock', isVisible: true, props: { primaryColor: NAVY } },
                { id: 'b-subject-results', type: 'SubjectResultsBlock', isVisible: true, props: { accentColor: NAVY, primaryColor: NAVY, variant: 'BORDERED', remarkStyle: 'COLORED_BADGE', showTotalRow: true, highlightTop: false, showPassFail: false, showCols: { score: true, grade: true, progress: false, remark: true }, highestAverageInSubject: false, lowestAverageInSubject: false, subjectClassAverage: false, subjectPosition: false } },
                { id: 'b-domain-ratings', type: 'DomainRatingsBlock', isVisible: true, props: { accentColor: GOLD, primaryColor: NAVY, layout: 'STACKED' } },
                { id: 'b-grading-key', type: 'GradingKeyBlock', isVisible: true, props: { primaryColor: NAVY, style: 'LIST' } },
                { id: 'b-remarks', type: 'RemarksBlock', isVisible: true, props: { accentColor: NAVY, remarkLayoutMode: 'CENTERED_LINE', showTeacherName: true, signatures: [{ roleName: 'Class Teacher' }, { roleName: 'Head Teacher' }] } },
                { id: 'b-signatures', type: 'SignaturesBlock', isVisible: true, props: { signatures: [{ roleName: "Head Teacher's Signature" }, { roleName: "Director's Signature" }] } }
            ],
            design: {
                primaryColor: NAVY,
                accentColor: GOLD,
                headerBg: NAVY,
                fontFamily: 'sans',
                tableBorderColor: NAVY,
                pageMargin: '6mm',
                logoPosition: 'left',
                headerStyle: 'banner',
                resultBorder: false,
                mainLayout: 'SIDEBAR_RIGHT',
                sidebarPairBlockType: 'SubjectResultsBlock',
                sidebarBlockTypes: ['DomainRatingsBlock', 'GradingKeyBlock']
            }
        }
    },
    {
        id: 'bulletin',
        name: 'Bulletin',
        description: 'A clean, modern layout with solid navy section banners, a two-column student info panel with a passport-photo slot, Grand Total/Percentage Average rows in the subject table, matching Summary and Attendance cards, and a three-column Form/Head/Principal remarks band with a colored grading-key pill row underneath.',
        tag: 'Modern',
        config: {
            blocks: [
                { id: 'b-header', type: 'SchoolHeaderBlock', isVisible: true, props: { accentColor: GOLD_LIGHT, primaryColor: NAVY_DEEP, headerLayoutMode: 'CENTER', badgeStyle: 'PLAIN_TEXT', borderStyle: 'THIN', reportBadge: 'END OF TERM ACADEMIC REPORT' } },
                { id: 'b-student-info', type: 'StudentInfoBlock', isVisible: true, props: { layoutCols: 2, studentPicture: true } },
                { id: 'b-subject-results', type: 'SubjectResultsBlock', isVisible: true, props: { accentColor: NAVY_DEEP, primaryColor: NAVY_DEEP, headerStyle: 'NAVY_BAR', showTotalRow: true, totalRowLabel: 'Grand Total / Average', showAverageRow: true, averageRowLabel: 'Percentage Average', highlightTop: false, showPassFail: false } },
                { id: 'b-academic-summary', type: 'AcademicSummaryBlock', isVisible: true, props: { accentColor: NAVY_DEEP, primaryColor: NAVY_DEEP, variant: 'NAVY_CARD', title: 'Summary' } },
                { id: 'b-attendance', type: 'AttendanceBlock', isVisible: true, props: { accentColor: NAVY_DEEP, primaryColor: NAVY_DEEP, variant: 'NAVY_CARD', title: 'Attendance' } },
                { id: 'b-remarks', type: 'RemarksBlock', isVisible: true, props: { accentColor: NAVY_DEEP, primaryColor: NAVY_DEEP, remarkLayoutMode: 'ROW', bannerTitle: 'Remarks & Signatures', signatures: [{ roleName: 'Form Teacher' }, { roleName: 'Head Teacher' }, { roleName: 'Principal' }] } },
                { id: 'b-grading-key', type: 'GradingKeyBlock', isVisible: true, props: { primaryColor: NAVY_DEEP, style: 'PILLS', title: 'Grading Key' } }
            ],
            design: {
                primaryColor: NAVY_DEEP,
                accentColor: GOLD_LIGHT,
                headerBg: NAVY_DEEP,
                fontFamily: 'sans',
                tableBorderColor: '#e2e8f0',
                pageMargin: '8mm',
                logoPosition: 'center',
                headerStyle: 'minimal',
                resultBorder: false,
                mainLayout: 'SUMMARY_ATTENDANCE_PAIR',
                showGeneratedFooter: true
            }
        }
    },
    {
        id: 'classic',
        name: 'Classic',
        kind: 'legacy',
        description: 'The original report card layout: Academic Performance table with Grand Total and Percentage Average, Summary and Attendance cards, a Remarks & Signatures band and a Grading Key — with a passport photo slot.',
        tag: 'Original',
        config: CLASSIC_CONFIG
    }
];

export const getPresetById = (id: string) => TEMPLATE_PRESETS.find(p => p.id === id);

/**
 * Sections a school can switch off on the Classic layout. Each maps to the
 * legacy config flag(s) ReportCardPreview reads.
 */
export const LEGACY_TOGGLES: { id: string; label: string; keys: string[] }[] = [
    { id: 'photo', label: 'Passport photo', keys: ['showStudentPhoto'] },
    { id: 'classAvg', label: 'Class average column', keys: ['showClassAverage'] },
    { id: 'attendance', label: 'Attendance summary', keys: ['showAttendance'] },
    { id: 'traits', label: 'Trait ratings', keys: ['showTraitRatings'] },
    { id: 'remarks', label: 'Remarks & signatures', keys: ['showTeacherComment', 'showHeadComment', 'showPrincipalComment'] },
    { id: 'gradingKey', label: 'Grading key', keys: ['showGradingKey'] },
];

/**
 * Optional blocks a school can toggle off per template — Header, Student
 * Info, Academic Summary, and Subject Results are load-bearing (no toggle).
 * Block ids are consistent across all three presets above.
 */
export const OPTIONAL_BLOCKS: { id: string; label: string }[] = [
    { id: 'b-attendance', label: 'Attendance summary' },
    { id: 'b-comments', label: "Teacher's / Principal's comments" },
    { id: 'b-remarks', label: 'Remarks' },
    { id: 'b-signatures', label: 'Signatures line' },
    { id: 'b-domain-ratings', label: 'Psychomotor & Affective domain ratings' }
];

/**
 * Re-themes a preset's config to a chosen primary/accent color pair. Works
 * by swapping every occurrence of the preset's *own* original primary/accent
 * values (wherever they appear — design.primaryColor, design.headerBg, and
 * each block's own props.accentColor) for the new ones, so a template stays
 * internally consistent after recoloring instead of only changing one spot.
 */
export const recolorConfig = (
    config: TemplatePreset['config'],
    newPrimary: string,
    newAccent: string
): TemplatePreset['config'] => {
    const origPrimary = config.design.primaryColor;
    const origAccent = config.design.accentColor;
    const swap = (v: any) => (v === origPrimary ? newPrimary : v === origAccent ? newAccent : v);

    // Legacy (Classic) layout: no blocks — just its own color fields.
    if (!config.blocks) {
        return {
            ...config,
            primaryColor: newPrimary,
            headerBg: newPrimary,
            accentColor: newAccent,
            design: { ...config.design, primaryColor: newPrimary, accentColor: newAccent }
        };
    }

    return {
        blocks: config.blocks.map(b => ({
            ...b,
            props: b.props ? Object.fromEntries(Object.entries(b.props).map(([k, v]) => [k, swap(v)])) : b.props
        })),
        design: {
            ...config.design,
            primaryColor: newPrimary,
            headerBg: swap(config.design.headerBg),
            accentColor: newAccent
        }
    };
};
