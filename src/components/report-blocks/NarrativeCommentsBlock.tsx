import React from 'react';
import { PenTool } from 'lucide-react';

export default function NarrativeCommentsBlock({ data, config, design, toggles  }: { data: any, config?: any, design?: any, toggles?: any  }) {
    const title = config?.title || 'Narrative reports';
    const accentColor = design?.accentColor || config?.accentColor || '#1a7a40';
    const t = config || toggles || {};
    
    const commentSettings = config?.globalSettings?.schoolSettings?.resultConfig?.commentBasedSettings || data?.schoolSettings?.resultConfig?.commentBasedSettings || data?.commentBasedSettings || {};
    const narrativeTopics = commentSettings.narrativeTopics || [];
    const rawNarrativeComments = data?.comments?.narrativeComments || {};

    const categories = narrativeTopics.length > 0 ? narrativeTopics.map((t: any) => ({
        cat: t.name,
        text: rawNarrativeComments[t.name] || ''
    })) : [
        { cat: 'Cognitive Skills', text: 'Demonstrates strong analytical thinking and problem-solving abilities. Engages actively in class discussions.' },
        { cat: 'Social Development', text: 'Works collaboratively with peers. Shows respect for teachers and fellow students.' },
        { cat: 'Co-curricular', text: 'Active member of the Science Club. Participated in the Regional Math Olympiad.' }
    ];

    return (
        <div className="mb-4">
            <div className="text-[10px] font-bold uppercase tracking-widest pb-1.5 border-b-2 flex items-center gap-1.5 mb-2.5" style={{ color: accentColor, borderBottomColor: accentColor }}>
                <PenTool className="w-3.5 h-3.5" />
                <span>{title}</span>
            </div>
            
            <div className="space-y-2">
                {categories.map((n: any, i: number) => (
                    <div key={i} className="bg-gray-50 rounded-[5px] px-3 py-2.5">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">{n.cat}</div>
                        <div className="text-[11px] text-gray-600 leading-relaxed">{n.text}</div>
                    </div>
                ))}
            </div>
            
        </div>
    );
}
