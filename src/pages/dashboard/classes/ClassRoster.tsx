import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { Loader2, Printer, Users, ArrowLeft } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import { SettingsShell } from '../settings/shared/SettingsShell';
import { SettingsHero } from '../settings/shared/SettingsHero';

interface Student {
    id: string;
    admissionNo: string;
    gender: string;
    profilePicture?: string | null;
    user: { name: string };
}

export function ClassRoster() {
    const { classId } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    
    // Fallback to fetching class name if not provided in state
    const [className, setClassName] = useState<string>(location.state?.className || '');
    const [students, setStudents] = useState<Student[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (!classId) return;

        const loadData = async () => {
            setIsLoading(true);
            try {
                // If we didn't get className from router state, fetch it
                if (!className) {
                    try {
                        const classRes = await axios.get(`/api/v1/classes/${classId}`, { withCredentials: true });
                        setClassName(classRes.data.classInfo?.name || 'Unknown Class');
                    } catch (e) {
                        console.error('Failed to fetch class info', e);
                        setClassName('Unknown Class');
                    }
                }

                const res = await axios.get(`/api/v1/students/all?classId=${classId}&limit=1000`, { withCredentials: true });
                setStudents(res.data.students || []);
            } catch (err) {
                toast.error('Failed to load class roster');
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, [classId, className]);

    const handlePrint = () => {
        const printContent = `
            <html>
            <head>
                <title>Class Roster - ${className}</title>
                <style>
                    body { font-family: sans-serif; padding: 24px; color: #1e293b; }
                    h1 { font-size: 24px; margin-bottom: 4px; text-align: center; }
                    p { font-size: 14px; color: #64748b; margin: 0 0 24px; text-align: center; }
                    table { width: 100%; border-collapse: collapse; font-size: 14px; }
                    th { background: #f1f5f9; padding: 12px; text-align: left; text-transform: uppercase; font-size: 12px; border: 1px solid #e2e8f0; }
                    td { padding: 12px; border: 1px solid #e2e8f0; vertical-align: middle; }
                    .avatar { width: 40px; height: 40px; border-radius: 50%; object-fit: cover; }
                    .no-avatar { width: 40px; height: 40px; border-radius: 50%; background: #e2e8f0; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold; color: #64748b; line-height: 40px; text-align: center; }
                    @media print {
                        body { padding: 0; }
                        button { display: none; }
                    }
                </style>
            </head>
            <body>
                <h1>Class Roster: ${className}</h1>
                <p>Total Students: ${students.length} &nbsp;|&nbsp; Printed: ${new Date().toLocaleDateString()}</p>
                <table>
                    <thead>
                        <tr>
                            <th style="width: 50px;">#</th>
                            <th style="width: 60px;">Photo</th>
                            <th>Name</th>
                            <th>Admission No.</th>
                            <th>Gender</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${students.map((s, i) => `
                            <tr>
                                <td>${i + 1}</td>
                                <td>
                                    ${s.profilePicture 
                                        ? `<img src="${s.profilePicture}" class="avatar" alt="Photo" />`
                                        : `<div class="no-avatar">${(s.user?.name || 'U').charAt(0).toUpperCase()}</div>`
                                    }
                                </td>
                                <td><strong>${s.user?.name || 'Unknown'}</strong></td>
                                <td>${s.admissionNo}</td>
                                <td>${s.gender}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </body>
            </html>
        `;
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        document.body.appendChild(iframe);
        iframe.contentWindow?.document.write(printContent);
        iframe.contentWindow?.document.close();
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        setTimeout(() => document.body.removeChild(iframe), 500);
    };

    return (
        <SettingsShell
            breadcrumbParent="Dashboard"
            breadcrumbCurrent="Class Roster"
            tabLabel={`Class Roster`}
            tabIcon={<Users className="h-3.5 w-3.5" />}
        >
            <SettingsHero
                icon={<Users className="h-7 w-7" />}
                title={`Class Roster: ${className}`}
                subtitle="View and print the complete list of students in this class."
            />

            <div className="mb-4">
                <button 
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-[#1E4DA6] transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" /> Back to Classes
                </button>
            </div>

            {isLoading ? (
                <div className="py-20 flex justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-[#1E4DA6]" />
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center gap-3 mb-6">
                        <div className="text-sm font-semibold text-[#173F8C] bg-[#1E4DA6]/5 border border-[#1E4DA6]/10 px-4 py-2 rounded-xl w-full sm:w-auto text-center">
                            Total Students: <span className="font-bold text-lg ml-1">{students.length}</span>
                        </div>
                        <div className="flex w-full sm:w-auto">
                            <button
                                onClick={handlePrint}
                                className="w-full sm:w-auto flex justify-center items-center gap-2 rounded-xl border-2 border-slate-200 bg-white px-6 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-colors shadow-sm"
                            >
                                <Printer className="h-4 w-4" /> Print / Save as PDF
                            </button>
                        </div>
                    </div>

                    <div className="overflow-x-auto rounded-xl border border-slate-200">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-slate-500 bg-slate-50 uppercase border-b border-slate-200">
                                <tr>
                                    <th className="px-5 py-4 font-semibold whitespace-nowrap w-16">Photo</th>
                                    <th className="px-5 py-4 font-semibold whitespace-nowrap">Name</th>
                                    <th className="px-5 py-4 font-semibold whitespace-nowrap">Admission No.</th>
                                    <th className="px-5 py-4 font-semibold whitespace-nowrap">Gender</th>
                                </tr>
                            </thead>
                            <tbody>
                                {students.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-5 py-12 text-center">
                                            <div className="flex flex-col items-center justify-center text-slate-400">
                                                <Users className="w-12 h-12 mb-3 text-slate-200" />
                                                <p className="font-semibold text-base">No students found in this class.</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    students.map((student) => (
                                        <tr key={student.id} className="border-b border-slate-100 hover:bg-[#1E4DA6]/8 transition-colors">
                                            <td className="px-5 py-3">
                                                {student.profilePicture ? (
                                                    <img src={student.profilePicture} alt={student.user.name} className="w-10 h-10 rounded-full object-cover border border-slate-200 shadow-sm" />
                                                ) : (
                                                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-lg border border-slate-200">
                                                        {student.user.name.charAt(0).toUpperCase()}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-5 py-3 font-bold text-slate-700 whitespace-nowrap">{student.user.name}</td>
                                            <td className="px-5 py-3 font-mono text-slate-500 whitespace-nowrap bg-slate-50/50">{student.admissionNo}</td>
                                            <td className="px-5 py-3 text-slate-500 whitespace-nowrap">{student.gender}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </SettingsShell>
    );
}
