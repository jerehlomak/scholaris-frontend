import React from 'react';
import SchoolHeaderBlock from './SchoolHeaderBlock';
import StudentInfoBlock from './StudentInfoBlock';
import AcademicSummaryBlock from './AcademicSummaryBlock';
import SubjectResultsBlock from './SubjectResultsBlock';
import AttendanceBlock from './AttendanceBlock';
import TraitRatingsBlock from './TraitRatingsBlock';
import NarrativeCommentsBlock from './NarrativeCommentsBlock';
import RemarksBlock from './RemarksBlock';
import SignaturesBlock from './SignaturesBlock';

import CommentHeaderBlock from './CommentHeaderBlock';
import CommentStudentInfoBlock from './CommentStudentInfoBlock';
import CommentSkillsGridBlock from './CommentSkillsGridBlock';
import CommentNarrativeBlock from './CommentNarrativeBlock';
import CommentSignaturesBlock from './CommentSignaturesBlock';

const BLOCK_REGISTRY: Record<string, { component: React.FC<any> }> = {
    SchoolHeaderBlock: { component: SchoolHeaderBlock },
    StudentInfoBlock: { component: StudentInfoBlock },
    AcademicSummaryBlock: { component: AcademicSummaryBlock },
    SubjectResultsBlock: { component: SubjectResultsBlock },
    AttendanceBlock: { component: AttendanceBlock },
    TraitRatingsBlock: { component: TraitRatingsBlock },
    NarrativeCommentsBlock: { component: NarrativeCommentsBlock },
    RemarksBlock: { component: RemarksBlock },
    SignaturesBlock: { component: SignaturesBlock },
    CommentHeaderBlock: { component: CommentHeaderBlock },
    CommentStudentInfoBlock: { component: CommentStudentInfoBlock },
    CommentSkillsGridBlock: { component: CommentSkillsGridBlock },
    CommentNarrativeBlock: { component: CommentNarrativeBlock },
    CommentSignaturesBlock: { component: CommentSignaturesBlock },
};

interface ReportCardProps {
    config: {
        blocks: any[];
        design: any;
        gradeScale: any[];
        studentFields: any;
        globalSettings?: any;
    };
    data: any;
}

export default function ReportCard({ config, data }: ReportCardProps) {
    const { blocks, design, globalSettings } = config;
    const toggles = globalSettings?.schoolSettings?.display || globalSettings?.schoolSettings?.resultConfig?.display || {};

    // Determine which blocks to show based on global toggles
    const isBlockVisible = (type: string) => {
        if (type === 'TraitRatingsBlock') return toggles.showTraitRatings ?? true;
        if (type === 'AttendanceBlock') return toggles.showAttendance ?? true;
        if (type === 'NarrativeCommentsBlock') return toggles.showNarrative ?? true;
        if (type === 'AcademicSummaryBlock') return toggles.showAcademicSummaryCards ?? true;
        if (type === 'SignaturesBlock') return toggles.showSignatures ?? true;
        return true;
    };

    const showBorder = toggles.showBorder ?? design.resultBorder ?? true;

    const layoutDensity = globalSettings?.schoolSettings?.resultConfig?.layoutDensity || 'STANDARD';
    const footerLayout = globalSettings?.schoolSettings?.resultConfig?.footerLayout || 'STACKED';

    const containerPadding = layoutDensity === 'ULTRA_COMPACT' ? 'p-3' : layoutDensity === 'COMPACT' ? 'p-5' : 'p-8';
    const blockMargin = layoutDensity === 'ULTRA_COMPACT' ? 'mb-1' : layoutDensity === 'COMPACT' ? 'mb-2' : 'mb-4';

    const renderBlock = (block: any) => {
        const BlockComponent = BLOCK_REGISTRY[block.type]?.component;
        if (!BlockComponent) return null;
        return (
            <div key={block.id} className={blockMargin}>
                <BlockComponent 
                    design={design} 
                    data={data} 
                    config={block.props || {}} 
                    masterConfig={config}
                    globalSettings={globalSettings}
                    toggles={toggles}
                />
            </div>
        );
    };

    // Separate blocks if multi-column footer is enabled
    const footerTypes = ['AttendanceBlock', 'TraitRatingsBlock', 'NarrativeCommentsBlock', 'RemarksBlock', 'SignaturesBlock', 'CommentNarrativeBlock', 'CommentSignaturesBlock'];
    
    let renderedContent;
    
    const visibleBlocks = blocks.filter((b: any) => b.isVisible && isBlockVisible(b.type));

    if (footerLayout === 'MULTI_COLUMN') {
        const topBlocks = visibleBlocks.filter((b: any) => !footerTypes.includes(b.type));
        const footerBlocks = visibleBlocks.filter((b: any) => footerTypes.includes(b.type));
        
        const col1Types = ['AttendanceBlock', 'TraitRatingsBlock'];
        const col2Types = ['NarrativeCommentsBlock', 'RemarksBlock', 'SignaturesBlock', 'CommentNarrativeBlock', 'CommentSignaturesBlock'];

        renderedContent = (
            <>
                {topBlocks.map(renderBlock)}
                {footerBlocks.length > 0 && (
                    <div className="flex flex-col gap-2 mt-2">
                        <div className="grid grid-cols-12 gap-5">
                            <div className="col-span-6">
                                {footerBlocks.filter((b: any) => b.type === 'AttendanceBlock').map(renderBlock)}
                            </div>
                            <div className="col-span-6">
                                {footerBlocks.filter((b: any) => ['NarrativeCommentsBlock', 'RemarksBlock', 'CommentNarrativeBlock'].includes(b.type)).map(renderBlock)}
                            </div>
                        </div>
                        <div className="grid grid-cols-12 gap-5">
                            <div className="col-span-6">
                                {footerBlocks.filter((b: any) => b.type === 'TraitRatingsBlock').map(renderBlock)}
                            </div>
                            <div className="col-span-6">
                                {footerBlocks.filter((b: any) => ['SignaturesBlock', 'CommentSignaturesBlock'].includes(b.type)).map(renderBlock)}
                            </div>
                        </div>
                    </div>
                )}
            </>
        );
    } else {
        renderedContent = visibleBlocks.map(renderBlock);
    }

    const wrapperRef = React.useRef<HTMLDivElement>(null);
    const [scale, setScale] = React.useState(1);

    React.useLayoutEffect(() => {
        if (wrapperRef.current) {
            const height = wrapperRef.current.scrollHeight;
            const A4_HEIGHT = 1100; // slightly less than 1123px to account for browser print margins
            if (height > A4_HEIGHT) {
                setScale(A4_HEIGHT / height);
            }
        }
    }, [renderedContent]);

    return (
        <div 
            className={`bg-white overflow-hidden ${showBorder ? 'border-[8px] border-double' : ''} report-card-print-wrapper`} 
            style={{ 
                width: '794px', 
                minHeight: '1123px',
                borderColor: showBorder ? (design.primaryColor || design.accentColor || '#1a7a40') : 'transparent',
                fontFamily: design.fontFamily === 'serif' ? 'Merriweather, serif' : 
                            design.fontFamily === 'mono' ? 'Fira Code, monospace' : 'Inter, sans-serif'
            }}
        >
            <div 
                ref={wrapperRef}
                className={containerPadding} 
                style={{ 
                    transform: scale < 1 ? `scale(${scale})` : 'none', 
                    transformOrigin: 'top left',
                    width: scale < 1 ? `${100 / scale}%` : '100%', // expand width so scaling down doesn't make it narrow
                }}
            >
                {renderedContent}
            </div>
        </div>
    );
}
