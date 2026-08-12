import React from 'react';

export default function CommentSkillsGridBlock({ data, config }: { data: any, config?: any }) {
    const commentSettings = config?.globalSettings?.schoolSettings?.resultConfig?.commentBasedSettings || data?.schoolSettings?.resultConfig?.commentBasedSettings || data?.commentBasedSettings || {};

    const categoriesFromSettings = commentSettings.categories || [];
    
    // Map actual results to skills (from narrativeComments)
    const skillsScores: Record<string, string> = data?.comments?.narrativeComments || {};

    // Fallback data if empty (for preview in editor)
    let finalCategories = categoriesFromSettings.length > 0 ? categoriesFromSettings.map((cat: any) => ({
        category: cat,
        skills: cat.skills.map((skill: any) => ({
            skill: skill,
            ratingScale: { label: skillsScores[skill.id] || '' }
        }))
    })) : (data?.comments?.length > 0 ? data.comments : [
        {
            category: { name: 'Physical Development/Motor Skills\nSocial Emotional Readiness' },
            skills: [
                { skill: { name: 'Plays well with others' }, ratingScale: { label: 'P' } },
                { skill: { name: 'Show self confidence' }, ratingScale: { label: 'P' } },
                { skill: { name: 'Displays self-control' }, ratingScale: { label: 'P' } },
            ]
        },
        {
            category: { name: 'Language Art/Reading Readiness' },
            skills: [
                { skill: { name: 'Shows interest in writing' }, ratingScale: { label: 'A' } },
                { skill: { name: 'works left to right' }, ratingScale: { label: 'A' } },
            ]
        },
        {
            category: { name: 'General Development' },
            skills: [
                { skill: { name: 'Identifies my animals correctly' }, ratingScale: { label: 'P' } },
            ]
        },
        {
            category: { name: 'Math/Science Readiness' },
            skills: [
                { skill: { name: 'Count in order to 50' }, ratingScale: { label: 'P' } },
            ]
        }
    ]);

    const showEvaluationKey = config?.showEvaluationKey ?? true;
    const showGridBorders = config?.showGridBorders ?? true;

    // Hardcoded pastel colors based on screenshot index
    const categoryColors = [
        '#fdf2f8', // light pink
        '#ffedd5', // light orange
        '#f3e8ff', // light purple
        '#fce7f3', // slightly darker pink
        '#fef08a', // light yellow
        '#e0f2fe', // light blue
        '#dcfce7', // light green
    ];

    // Split categories into two columns for the grid layout
    const leftCategories: any[] = [];
    const rightCategories: any[] = [];
    finalCategories.forEach((c: any, index: number) => {
        if (index % 2 === 0) leftCategories.push({ ...c, bg: categoryColors[index % categoryColors.length] });
        else rightCategories.push({ ...c, bg: categoryColors[index % categoryColors.length] });
    });

    const renderColumn = (cats: any[]) => (
        <div className="flex-1 space-y-4">
            {cats.map((c, i) => (
                <div key={i} className="mb-2">
                    <div className="font-bold text-[11px] mb-1 whitespace-pre-line leading-tight">
                        {c.category?.name || 'Category'}
                    </div>
                    <div className={showGridBorders ? "border border-black" : ""}>
                        {(c.skills || []).map((s: any, idx: number) => (
                            <div 
                                key={idx} 
                                className={`flex ${showGridBorders ? 'border-b border-black last:border-b-0' : ''}`}
                                style={{ backgroundColor: c.bg }}
                            >
                                <span className={`flex-1 p-1 text-[10px] pl-2 ${showGridBorders ? 'border-r border-black' : ''}`}>
                                    {s.skill?.name || 'Skill'}
                                </span>
                                <span className="w-8 text-center p-1 text-[10px] font-bold">
                                    {s.ratingScale?.label || ''}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );

    const ratingScale = commentSettings.ratingScale?.length > 0 ? commentSettings.ratingScale : [
        { id: 'A', label: 'A', description: 'Excellent' },
        { id: 'NA', label: 'NA', description: 'Not Applicable' },
        { id: 'P', label: 'P', description: 'Perfected' },
        { id: 'W', label: 'W', description: 'Working on It' }
    ];

    return (
        <div className="mb-2 px-2">
            {showEvaluationKey && (
                <div className="flex items-center text-[10px] md:text-xs mb-4 font-bold flex-wrap gap-2">
                    <span className="mr-4">Evaluation<br/>key:</span>
                    <div className="flex items-center gap-4 flex-wrap">
                        {ratingScale.map((rs: any, index: number) => (
                            <div key={rs.id || index} className="flex items-center gap-1">
                                <span className="text-white px-2 py-0.5 border border-black" style={{ backgroundColor: ['#800080', '#E32636', '#2563eb', '#16a34a'][index % 4] }}>
                                    {rs.label}
                                </span>
                                <span className="text-[10px] leading-tight">: {rs.description?.split(' ').join('\n') || rs.description}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="flex flex-col md:flex-row gap-6">
                {renderColumn(leftCategories)}
                {renderColumn(rightCategories)}
            </div>
        </div>
    );
}
