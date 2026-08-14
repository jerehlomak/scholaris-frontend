import React, { useState, useEffect } from 'react';
import { Button } from '../../../components/ui/button';
import { Printer, Loader2, Download } from 'lucide-react';
import axios from 'axios';
import { mobileSafePrint } from '../../../lib/printUtils';

interface TranscriptSheetProps {
    studentId: string;
    API: string;
    onClose?: () => void;
}

export default function TranscriptSheet({ studentId, API, onClose }: TranscriptSheetProps) {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!studentId) return;
        setLoading(true);
        axios.get(`${API}/transcripts/json/${studentId}`, { withCredentials: true })
            .then(res => {
                setData(res.data);
                setLoading(false);
            })
            .catch(err => {
                setError(err.message || 'An error occurred loading the transcript.');
                setLoading(false);
            });
    }, [studentId, API]);

    const handlePrint = () => {
        mobileSafePrint('transcript-printable', `
            @media print {
                @page { size: portrait; margin: 10mm; }
                body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            }
            .transcript-table th, .transcript-table td { border: 1px solid #d1d5db; padding: 6px; text-align: center; font-size: 11px; }
            .transcript-table th { background-color: #f3f4f6; font-weight: bold; }
            .transcript-table td.subject-name { text-align: left; font-weight: 600; background-color: #f9fafb; }
        `);
    };

    const handleDownloadPDF = () => {
        window.open(`${API}/transcripts/${studentId}`, '_blank');
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-gray-500 bg-white border border-gray-200 rounded-2xl shadow-sm">
                <Loader2 className="w-8 h-8 animate-spin text-[#1E4DA6] mb-4" />
                <p>Loading Transcript...</p>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="py-20 text-center text-red-500 bg-white border border-gray-200 rounded-2xl shadow-sm">
                <p>Error: {error || 'Failed to load data.'}</p>
                {onClose && <Button onClick={onClose} variant="outline" className="mt-4">Go Back</Button>}
            </div>
        );
    }

    const { school, student, columns, subjects, notes } = data;

    const enrichedSubjects = subjects.map((subj: any) => {
        const validScores = subj.scores.filter((s: number | null) => s !== null);
        const total = validScores.reduce((sum: number, s: number) => sum + s, 0);
        const avg = validScores.length > 0 ? (total / validScores.length).toFixed(1) : '-';
        return { ...subj, total, avg };
    });

    return (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col max-h-[85vh]">
            <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-gray-50 shrink-0">
                <h3 className="font-bold text-gray-800">Student Transcript</h3>
                <div className="flex gap-2">
                    {onClose && <Button variant="outline" size="sm" onClick={onClose}>Close</Button>}
                    <Button variant="outline" size="sm" onClick={handlePrint} className="gap-2 text-[#1E4DA6] border-[#1E4DA6]/30">
                        <Printer className="w-4 h-4" /> Print
                    </Button>
                </div>
            </div>

            <div className="overflow-y-auto p-8 bg-gray-100 flex-1">
                <div id="transcript-printable" className="max-w-[800px] mx-auto bg-white p-10 shadow-sm border border-gray-200">
                    
                    {/* 1. School Header */}
                    <div className="flex items-center justify-between border-b-2 border-gray-800 pb-4 mb-6">
                        <div className="w-[120px]">
                            {school.logoUrl && <img src={school.logoUrl} alt="Logo" className="w-24 h-24 object-contain" />}
                        </div>
                        <div className="flex-1 text-center px-4">
                            <h1 className="text-2xl font-black uppercase text-gray-900 m-0 tracking-wider">{school.name}</h1>
                            {school.motto && <p className="text-sm italic text-gray-600 my-1 font-serif">"{school.motto}"</p>}
                            <p className="text-xs text-gray-600 m-0">{school.address}</p>
                            <p className="text-xs text-gray-600 m-0">Tel: {school.phone} | Email: {school.email}</p>
                        </div>
                        <div className="w-[120px] text-right">
                            <h2 className="text-xl font-bold uppercase text-gray-800 border-2 border-gray-800 p-2 inline-block">TRANSCRIPT</h2>
                        </div>
                    </div>

                    {/* 2. Student Info Grid */}
                    <div className="grid grid-cols-2 gap-4 mb-8 border-2 border-gray-800 p-4 bg-gray-50/50">
                        <div className="space-y-2 text-sm">
                            <div className="flex"><span className="font-bold w-32">Student Name:</span> <span className="font-semibold uppercase border-b border-gray-400 flex-1">{student.name}</span></div>
                            <div className="flex"><span className="font-bold w-32">Admission No:</span> <span className="uppercase border-b border-gray-400 flex-1">{student.admissionNo}</span></div>
                            <div className="flex"><span className="font-bold w-32">Current Class:</span> <span className="uppercase border-b border-gray-400 flex-1">{student.class}</span></div>
                        </div>
                        <div className="space-y-2 text-sm">
                            <div className="flex"><span className="font-bold w-32">Gender:</span> <span className="uppercase border-b border-gray-400 flex-1">{student.gender}</span></div>
                            <div className="flex"><span className="font-bold w-32">Date of Birth:</span> <span className="uppercase border-b border-gray-400 flex-1">{student.dob}</span></div>
                            <div className="flex"><span className="font-bold w-32">Date Admitted:</span> <span className="uppercase border-b border-gray-400 flex-1">{student.admissionDate}</span></div>
                        </div>
                    </div>

                    {/* 3. Academic Record Table */}
                    <div className="mb-8">
                        <h3 className="font-bold text-md mb-2 uppercase border-b border-gray-800 inline-block">Academic Record</h3>
                        <table className="w-full transcript-table mt-2">
                            <thead>
                                <tr>
                                    <th className="text-left w-1/4">Subjects</th>
                                    {columns.map((col: string) => <th key={col}>{col}</th>)}
                                    <th>Total</th>
                                    <th>Average</th>
                                </tr>
                            </thead>
                            <tbody>
                                {enrichedSubjects.map((subj: any, idx: number) => (
                                    <tr key={idx}>
                                        <td className="subject-name">{subj.name}</td>
                                        {subj.scores.map((score: number | null, sIdx: number) => (
                                            <td key={sIdx}>{score !== null ? score : '-'}</td>
                                        ))}
                                        <td className="font-bold">{subj.total > 0 ? subj.total : '-'}</td>
                                        <td className="font-bold text-[#1E4DA6]">{subj.avg}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* 4. Notes & Legend */}
                    <div className="flex justify-between items-end mt-12 text-xs">
                        <div className="w-1/2">
                            <h4 className="font-bold underline mb-1">Grading System:</h4>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px]">
                                <div>75 - 100 : A (Excellent)</div>
                                <div>65 - 74 : B (Very Good)</div>
                                <div>55 - 64 : C (Good)</div>
                                <div>45 - 54 : D (Pass)</div>
                                <div>0 - 44 : F (Fail)</div>
                            </div>
                            {notes && notes.length > 0 && (
                                <div className="mt-4 text-[10px] text-gray-500 italic">
                                    * {notes.join(' ')}
                                </div>
                            )}
                        </div>
                        
                        {/* 5. Signature */}
                        <div className="w-1/3 text-center">
                            <div className="border-b-2 border-gray-800 h-10 mb-2"></div>
                            <p className="font-bold uppercase m-0">Principal's Signature & Date</p>
                            <p className="text-[10px] mt-1 text-gray-500">Official Seal / Stamp</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
