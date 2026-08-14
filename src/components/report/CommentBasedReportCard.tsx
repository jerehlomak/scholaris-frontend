import React from 'react';
import type { ReportCardPreviewProps } from './ReportCardPreview';

export const CommentBasedReportCard: React.FC<ReportCardPreviewProps & { commentBasedSettings: any }> = ({
    student,
    results = [],
    comments,
    attendance,
    school,
    commentBasedSettings
}) => {
    // Group subjects into evaluation data format
    const categories = commentBasedSettings?.categories || [];
    const ratingScale = commentBasedSettings?.ratingScale || [];
    const narrativeTopics = commentBasedSettings?.narrativeTopics || [];
    const narrativeComments = (comments as any)?.narrativeComments || {};

    // Get skills from scores mapping
    // Here we need to map the scores back to skills.
    const skillsScores: Record<string, string> = {};
    results.forEach(res => {
        Object.entries(res.scores).forEach(([skillId, score]) => {
            skillsScores[skillId] = score as string;
        });
    });

    const halfCategoriesCount = Math.ceil(categories.length / 2);
    const leftCategories = categories.slice(0, halfCategoriesCount);
    const rightCategories = categories.slice(halfCategoriesCount);

    return (
        <div className="bg-white text-black font-sans leading-snug p-8 mx-auto shadow-sm" style={{ width: '210mm', minHeight: '100%', boxSizing: 'border-box' }}>
            {/* Header section */}
            <div className="flex flex-col items-center mb-6 relative border-b-2 border-black pb-4">
                {school.logoUrl && (
                    <img src={school.logoUrl} alt="School Logo" className="absolute right-0 top-0 w-24 h-24 object-contain" />
                )}
                
                <h1 className="text-2xl font-bold text-green-700 font-serif mb-1" dir="rtl">
                    مدرسة البينة الأساسية / التحفيظ
                </h1>
                
                <h2 className="text-3xl font-extrabold uppercase tracking-wide mb-1" style={{ color: '#1E4DA6' }}>
                    {school.schoolName}
                </h2>
                
                <div className="text-sm text-center mb-4 font-semibold text-gray-700">
                    <p>{school.address || 'Address not provided'}</p>
                    <p>Phone: {school.phone || 'N/A'} | Website: {school.email || 'N/A'}</p>
                </div>

                <div className="border-4 border-black px-6 py-2 mt-2">
                    <h3 className="text-xl font-bold uppercase tracking-wider">{student.className} PROGRESS REPORT CARD</h3>
                </div>
            </div>

            {/* Student Info */}
            <div className="border-2 border-black mb-4">
                <div className="grid grid-cols-4 divide-x-2 divide-black border-b-2 border-black">
                    <div className="p-2 flex items-center col-span-2">
                        <span className="font-bold mr-2 uppercase">Name:</span>
                        <span className="font-semibold uppercase">{student.name}</span>
                    </div>
                    <div className="p-2 flex items-center">
                        <span className="font-bold mr-2 uppercase">DOB:</span>
                        <span className="font-semibold">{student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString() : '-'}</span>
                    </div>
                    <div className="p-2 flex items-center">
                        <span className="font-bold mr-2 uppercase">HT/WT:</span>
                        <span className="font-semibold">- / -</span>
                    </div>
                </div>
                <div className="grid grid-cols-5 divide-x-2 divide-black border-b-2 border-black bg-gray-100">
                    <div className="p-2 flex items-center justify-center">
                        <span className="font-bold mr-2 uppercase">Session:</span>
                        <span className="font-semibold">{student.academicYear}</span>
                    </div>
                    <div className="p-2 flex items-center justify-center">
                        <span className="font-bold mr-2 uppercase">Term:</span>
                        <span className="font-semibold">{student.term}</span>
                    </div>
                    <div className="p-2 flex items-center justify-center">
                        <span className="font-bold mr-2 uppercase">Sex:</span>
                        <span className="font-semibold">{student.gender || '-'}</span>
                    </div>
                    <div className="p-2 flex flex-col items-center justify-center text-xs">
                        <span className="font-bold uppercase">Number of Days Open</span>
                        <span className="font-semibold text-lg">{attendance?.total || '-'}</span>
                    </div>
                    <div className="p-2 flex flex-col items-center justify-center text-xs">
                        <span className="font-bold uppercase">Days Present</span>
                        <span className="font-semibold text-lg">{attendance?.present || '-'}</span>
                    </div>
                    <div className="p-2 flex flex-col items-center justify-center text-xs">
                        <span className="font-bold uppercase">Days Absent</span>
                        <span className="font-semibold text-lg">{attendance?.absent || '-'}</span>
                    </div>
                </div>
            </div>

            {/* Scale Key */}
            <div className="border border-black p-2 mb-6 flex flex-wrap justify-center gap-6 bg-gray-50 text-sm font-bold uppercase">
                <span className="mr-4">Key to Rating:</span>
                {ratingScale.map((r: any) => (
                    <span key={r.id}>{r.label} = {r.description}</span>
                ))}
            </div>

            {/* Skills Grid - 2 Columns */}
            <div className="grid grid-cols-2 gap-8 mb-8">
                {/* Left Column */}
                <div>
                    {leftCategories.map((cat: any) => (
                        <div key={cat.id} className="mb-6">
                            <h4 className="font-bold uppercase mb-2 pb-1 border-b-2 border-gray-400">{cat.name}</h4>
                            <div className="space-y-1">
                                {cat.skills.map((skill: any) => (
                                    <div key={skill.id} className="flex justify-between items-end border-b border-dotted border-gray-300 pb-1 text-sm">
                                        <span className="uppercase">{skill.name}</span>
                                        <span className="font-bold w-8 text-center">{skillsScores[skill.id] || '-'}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
                {/* Right Column */}
                <div>
                    {rightCategories.map((cat: any) => (
                        <div key={cat.id} className="mb-6">
                            <h4 className="font-bold uppercase mb-2 pb-1 border-b-2 border-gray-400">{cat.name}</h4>
                            <div className="space-y-1">
                                {cat.skills.map((skill: any) => (
                                    <div key={skill.id} className="flex justify-between items-end border-b border-dotted border-gray-300 pb-1 text-sm">
                                        <span className="uppercase">{skill.name}</span>
                                        <span className="font-bold w-8 text-center">{skillsScores[skill.id] || '-'}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Narrative Comments (Teacher & Head) */}
            <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="border border-black rounded p-3 min-h-[100px]">
                    <h5 className="font-bold uppercase mb-2 text-sm">Teacher's Comment</h5>
                    <p className="text-sm italic">{comments?.teacherComment || '-'}</p>
                </div>
                <div className="border border-black rounded p-3 min-h-[100px]">
                    <h5 className="font-bold uppercase mb-2 text-sm">Head Teacher's Comment</h5>
                    <p className="text-sm italic">{comments?.headComment || '-'}</p>
                </div>
            </div>

            {/* Narrative Topics Comments */}
            {narrativeTopics?.length > 0 && (
                <div className="mb-8 border border-black rounded overflow-hidden">
                    <div className="bg-gray-200 border-b border-black p-2 font-bold uppercase text-center">Narrative Reports</div>
                    <div className="grid grid-cols-2 gap-0 divide-x divide-black border-t border-black">
                        {narrativeTopics.map((topic: any, idx: number) => (
                            <div key={topic.id} className={`p-3 ${(idx >= narrativeTopics.length - (narrativeTopics.length % 2 !== 0 ? 1 : 2)) ? '' : 'border-b border-black'}`}>
                                <h5 className="font-bold text-xs uppercase mb-1">{topic.name}</h5>
                                <p className="text-xs italic text-gray-700">{narrativeComments[topic.name] || '-'}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Signatures */}
            {school?.signatures && school.signatures.length > 0 ? (
                <div className="flex justify-around items-end mt-12 pt-8">
                    {(() => {
                        const clsLower = (student as any).class?.toLowerCase() || (student as any).className?.toLowerCase() || '';
                        const isSecondary = clsLower.includes('jss') || clsLower.includes('sss') || clsLower.includes('secondary') || clsLower.includes('basic 7') || clsLower.includes('basic 8') || clsLower.includes('basic 9');
                        let filteredSigs = school.signatures;
                        
                        if (isSecondary) {
                            filteredSigs = school.signatures.filter(sig => sig.roleName?.toLowerCase().includes('principal') || sig.roleName?.toLowerCase().includes('director'));
                            if (filteredSigs.length === 0) filteredSigs = school.signatures.slice(0, 2); 
                        } else {
                            filteredSigs = school.signatures.filter(sig => sig.roleName?.toLowerCase().includes('head') || sig.roleName?.toLowerCase().includes('teacher') || sig.roleName?.toLowerCase().includes('proprietor'));
                            if (filteredSigs.length === 0) filteredSigs = school.signatures.slice(0, 1); 
                        }

                        return filteredSigs.map((sig: any) => (
                            <div key={sig.id} className="text-center w-48 flex flex-col items-center">
                                {sig.url ? (
                                    <img src={sig.url} alt={sig.roleName} className="h-10 object-contain mb-1" />
                                ) : (
                                    <div className="border-b border-black mb-2 h-8 w-32"></div>
                                )}
                                <span className="font-bold text-sm uppercase">{sig.roleName}</span>
                            </div>
                        ));
                    })()}
                </div>
            ) : (
                <div className="flex justify-between items-end mt-12 pt-8">
                    <div className="text-center w-48">
                        <div className="border-b border-black mb-2 h-8"></div>
                        <span className="font-bold text-sm uppercase">Teacher's Sign & Date</span>
                    </div>
                    <div className="text-center w-48">
                        <div className="border-b border-black mb-2 h-8"></div>
                        <span className="font-bold text-sm uppercase">Head Teacher's Sign</span>
                    </div>
                </div>
            )}
            
            <div className="mt-8 text-center text-xs font-bold bg-black text-white py-1">
                NOTE: ANY ALTERATION RENDERS THIS RESULT INVALID
            </div>
        </div>
    );
};
