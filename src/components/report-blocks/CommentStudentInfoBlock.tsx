import React from 'react';

export default function CommentStudentInfoBlock({ data, config }: { data: any, config?: any }) {
    const s = data?.student || {};

    const studentName = s.firstName || s.lastName ? `${s.firstName || ''} ${s.lastName || ''} ${s.otherNames || ''}`.trim() : s.name || 'N/A';
    const dob = s.dateOfBirth ? new Date(s.dateOfBirth).toISOString().split('T')[0] : 'N/A';
    
    // Attempt to extract height and weight from attendance/health if available
    const height = data?.attendance?.height || '......';
    const weight = data?.attendance?.weight || '......';

    const className = s.class?.name || s.className || data?.summary?.className || data?.class?.name || 'N/A';
    const session = s.academicYear || data?.summary?.session || 'N/A';
    const termName = s.term || data?.summary?.term?.name || data?.term?.name || 'N/A';
    const daysPresent = data?.attendance?.present ?? data?.attendance?.daysPresent ?? '......';
    const daysAbsent = data?.attendance?.absent ?? data?.attendance?.daysAbsent ?? '......';

    return (
        <div className="mb-2 mt-4 px-2">
            <div className="flex flex-col space-y-3 font-bold text-[11px] md:text-xs">
                {/* Line 1 */}
                <div className="flex items-center">
                    <span>Name</span>
                    <span className="flex-1 border-b border-black ml-2 px-2 pb-0.5 font-normal text-sm">{studentName}</span>
                    <span className="ml-4">Class</span>
                    <span className="w-32 border-b border-black ml-2 px-2 pb-0.5 font-normal text-sm text-center">{className}</span>
                    <span className="ml-4">DOB</span>
                    <span className="w-32 border-b border-black ml-2 px-2 pb-0.5 font-normal text-sm text-center">{dob}</span>
                </div>
                {/* Line 2 */}
                <div className="flex items-center mt-2">
                    <span>Session</span>
                    <span className="w-32 border-b border-black ml-2 px-2 pb-0.5 font-normal text-sm text-center">{session}</span>
                    <span className="ml-4">Term</span>
                    <span className="w-32 border-b border-black ml-2 px-2 pb-0.5 font-normal text-sm text-center">{termName}</span>
                    <span className="ml-4">Days present</span>
                    <span className="w-16 border-b border-black ml-2 px-2 pb-0.5 font-normal text-sm text-center">{daysPresent}</span>
                    <span className="ml-4">Days absent</span>
                    <span className="w-16 border-b border-black ml-2 px-2 pb-0.5 font-normal text-sm text-center">{daysAbsent}</span>
                </div>
            </div>
        </div>
    );
}
