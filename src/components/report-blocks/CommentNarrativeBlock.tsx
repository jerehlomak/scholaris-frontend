import React from 'react';

export default function CommentNarrativeBlock({ data, config }: { data: any, config?: any }) {
    const commentSettings = config?.globalSettings?.schoolSettings?.resultConfig?.commentBasedSettings || data?.schoolSettings?.resultConfig?.commentBasedSettings || data?.commentBasedSettings || {};
    
    const narrativeTopics = commentSettings.narrativeTopics || [];
    const rawNarrativeComments = data?.comments?.narrativeComments || {};
    
    // Map topics from settings to their respective comments
    const finalNarratives = narrativeTopics.length > 0 ? narrativeTopics.map((topic: any) => ({
        topic: topic,
        comment: rawNarrativeComments[topic.name] || ''
    })) : [
        { topic: { name: 'Literacy' }, comment: 'Abdallah can identify all the sounds from A-Z and all the learnt sights words. He can also blend two sounds' },
        { topic: { name: 'Social Norms' }, comment: 'Abdallah associate freely with his teacher and fellow classmates. He shares his things and belongings to his friends.' },
        { topic: { name: 'Numeracy' }, comment: 'Alhamdulillah, Abdallah can identify all his numbers both in words and figure. Barakallahu feeh' }
    ];

    const teacherRemark = data?.comments?.teacherComment || data?.comments?.teacher || data?.comments?.[0]?.teacherComment || data?.result?.classTeacherRemark || '';
    const headTeacherRemark = data?.comments?.principalComment || data?.comments?.headComment || data?.comments?.principal || data?.comments?.[0]?.headComment || data?.result?.headTeacherRemark || '';
    
    const nextTermBegins = data?.summary?.nextTermBegins ? new Date(data?.summary?.nextTermBegins).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : data?.comments?.nextTermBegins || '22 Apr, 2024';
    const studentName = data?.student?.name || data?.student?.firstName ? `${data.student.firstName} ${data.student.lastName || ''}`.trim() : 'Abdullah Bin Umar';

    return (
        <div className="mb-2 mt-4 px-2">
            {/* Remarks Section (Bottom of Page 1) */}
            <div className="flex flex-col md:flex-row gap-4 mb-8">
                {(config?.showClassTeacherRemark ?? true) && (
                    <fieldset className="flex-1 border border-black px-4 pb-4 pt-2">
                        <legend className="text-[10px] font-bold text-center px-2 uppercase">Teacher's Comment</legend>
                        <div className="text-[11px] leading-tight min-h-[40px]">{teacherRemark}</div>
                    </fieldset>
                )}
                
                {(config?.showHeadTeacherRemark ?? true) && (
                    <fieldset className="flex-1 border border-black px-4 pb-4 pt-2">
                        <legend className="text-[10px] font-bold text-center px-2 uppercase">Head Teacher's Comment</legend>
                        <div className="text-[11px] leading-tight min-h-[40px]">{headTeacherRemark}</div>
                    </fieldset>
                )}
            </div>

            {/* Narrative Comments (Page 2) */}
            <div className="mt-8 page-break-before" style={{ pageBreakBefore: 'always' }}>
                <div className="border-[6px] border-[#1e1b4b] p-6 min-h-[500px] flex flex-col">
                    <h2 className="text-2xl font-bold text-center mb-8 uppercase">Comments</h2>
                    
                    <div className="flex-1 flex flex-col items-center gap-6">
                        {/* Top row (first 2 topics) */}
                        <div className="flex w-full gap-6 justify-center">
                            {finalNarratives.slice(0, 2).map((nc: any, idx: number) => (
                                <div key={idx} className="flex-1 border border-black rounded-[20px] p-6 max-w-[45%] min-h-[200px]">
                                    <h3 className="text-center font-bold text-sm mb-4">{nc.topic?.name || 'Topic'}</h3>
                                    <p className="text-[11px] leading-relaxed text-justify">{nc.comment}</p>
                                </div>
                            ))}
                        </div>
                        
                        {/* Remaining topics (centered) */}
                        {finalNarratives.slice(2).map((nc: any, idx: number) => (
                            <div key={idx} className="w-full flex justify-center mt-2">
                                <div className="border border-black rounded-[20px] p-6 w-[45%] min-h-[200px]">
                                    <h3 className="text-center font-bold text-sm mb-4">{nc.topic?.name || 'Topic'}</h3>
                                    <p className="text-[11px] leading-relaxed text-justify">{nc.comment}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="text-center text-[10px] uppercase font-medium mt-12 mb-2">
                        NEXT TERM BEGINS: {nextTermBegins} | {studentName}
                    </div>
                </div>
            </div>
        </div>
    );
}
