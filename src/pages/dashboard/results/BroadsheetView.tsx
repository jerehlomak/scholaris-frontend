import React, { useState, useEffect } from 'react';
import { Button } from '../../../components/ui/button';
import { Printer, Download, EyeOff, Eye, Share2 } from 'lucide-react';
import html2pdf from 'html2pdf.js';

interface BroadsheetProps {
    classId: string;
    term: string;
    year: string;
    categoryId?: string;
    API: string;
    classStructure?: any[];
    resultPrintType?: string;
}

export default function BroadsheetView({ classId, term, year, categoryId, API, classStructure = [], resultPrintType = 'FULL' }: BroadsheetProps) {
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<any>(null);
    const [internalClassStructure, setInternalClassStructure] = useState<any[]>(classStructure || []);
    const [printMode, setPrintMode] = useState<'FILLED' | 'EMPTY'>('FILLED');
    const [printTypeFilter, setPrintTypeFilter] = useState<'COMBINED' | 'CA_ONLY'>('COMBINED');
    const [paperSize, setPaperSize] = useState<'A4' | 'A3'>('A4');
    const [orientation, setOrientation] = useState<'landscape' | 'portrait'>('landscape');
    const [selectedSubjectId, setSelectedSubjectId] = useState<string>('ALL');
    const [allSubjects, setAllSubjects] = useState<any[]>([]);

    const loadBroadsheet = async (subjectId = selectedSubjectId) => {
        if (!classId) return;
        setLoading(true);
        try {
            const [res, structRes] = await Promise.all([
                fetch(`${API}/results/broadsheet?classId=${classId}&term=${encodeURIComponent(term)}&academicYear=${encodeURIComponent(year)}${categoryId && categoryId !== 'all' ? `&categoryId=${categoryId}` : ''}${subjectId !== 'ALL' ? `&subjectId=${subjectId}` : ''}`, { credentials: 'include' }),
                fetch(`${API}/assessments/structure?classId=${classId}`, { credentials: 'include' })
            ]);
            const json = await res.json();
            const structData = await structRes.json();
            
            setInternalClassStructure(structData.parts || classStructure || []);
            setData(json);
            if (subjectId === 'ALL' && json.subjects) {
                setAllSubjects(json.subjects);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (classId) {
            loadBroadsheet('ALL');
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [classId, term, year, categoryId]);

    const handlePrint = () => {
        const content = document.getElementById('broadsheet-printable');
        if (!content) return;
        
        const html = `
            <html><head><title>Broadsheet - ${printMode}</title>
            <style>
                body { font-family: sans-serif; margin: 0; padding: 20px; font-size: 11px; }
                table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                th, td { border: 1px solid #000; padding: 4px; text-align: center; }
                th { background-color: #f3f4f6; }
                .header { text-align: center; margin-bottom: 20px; }
                .header img { max-width: 80px; max-height: 80px; margin-bottom: 10px; }
                .header h1 { margin: 0; font-size: 18px; text-transform: uppercase; }
                .header p.address { margin: 2px 0 10px; font-size: 11px; color: #555; }
                .header h2 { margin: 0; font-size: 14px; }
                @media print { @page { size: ${paperSize.toLowerCase()} ${orientation}; margin: 10mm; } }
            </style>
            </head><body>
            ${content.outerHTML}
            </body></html>
        `;
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        document.body.appendChild(iframe);
        iframe.contentDocument?.write(html);
        iframe.contentDocument?.close();
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        setTimeout(() => document.body.removeChild(iframe), 1000);
    };

    const handleSharePDF = async () => {
        const content = document.getElementById('broadsheet-printable');
        if (!content) return;

        try {
            // temporarily adjust styling for pdf generation
            const originalStyle = content.style.cssText;
            content.style.padding = '20px';
            content.style.backgroundColor = '#fff';
            content.style.width = paperSize === 'A3' ? '1600px' : '1100px';

            const opt = {
                margin:       10,
                filename:     `broadsheet_${(data?.classInfo?.name || 'class').replace(/\s+/g, '_')}.pdf`,
                image:        { type: 'jpeg' as const, quality: 0.98 },
                html2canvas:  { scale: 2, useCORS: true },
                jsPDF:        { unit: 'mm', format: paperSize.toLowerCase(), orientation: orientation }
            };

            const pdfBlob = await html2pdf().set(opt).from(content).output('blob');
            content.style.cssText = originalStyle;

            if (navigator.share && navigator.canShare && navigator.canShare({ files: [new File([pdfBlob], opt.filename, { type: 'application/pdf' })] })) {
                const file = new File([pdfBlob], opt.filename, { type: 'application/pdf' });
                await navigator.share({
                    files: [file],
                    title: 'Class Broadsheet',
                    text: `Broadsheet for ${data?.classInfo?.name}`
                });
            } else {
                // Fallback
                const url = window.URL.createObjectURL(pdfBlob);
                const a = document.createElement('a');
                a.href = url;
                a.download = opt.filename;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
            }
        } catch (error) {
            console.error('Error generating PDF for sharing:', error);
            alert('Failed to generate PDF for sharing.');
        }
    };

    if (!data && !loading) {
        return (
            <div className="py-20 text-center text-gray-500">
                <p>No broadsheet data found for this class.</p>
            </div>
        );
    }

    if (loading) return <div className="py-20 text-center text-gray-500">Loading broadsheet data...</div>;

    const subjects = data?.subjects || [];
    const students = data?.students || [];
    const passMark = data?.passMark || 40;

    const visibleParts = printTypeFilter === 'CA_ONLY' 
        ? internalClassStructure.filter((p: any) => p.name.toLowerCase() !== 'exam') 
        : internalClassStructure;
    const showTotalCol = printTypeFilter === 'COMBINED';

    return (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden p-5 animate-in fade-in">
            <div className="flex flex-col gap-4 mb-4 border-b border-gray-100 pb-4">
                <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                    <h3 className="font-bold text-lg text-gray-900">
                        {selectedSubjectId !== 'ALL' && allSubjects.find(s => s.id === selectedSubjectId) 
                            ? `Broadsheet for ${allSubjects.find(s => s.id === selectedSubjectId)?.name} - ${data?.classInfo?.name}` 
                            : `Class Broadsheet: ${data?.classInfo?.name}`}
                    </h3>
                    <div className="flex gap-2 items-center flex-wrap">
                        {allSubjects.length > 0 && (
                            <select 
                                className="border border-gray-300 rounded-md px-3 py-1.5 text-sm outline-none focus:border-[#0036a1] transition-colors"
                                value={selectedSubjectId}
                                onChange={(e) => {
                                    setSelectedSubjectId(e.target.value);
                                    loadBroadsheet(e.target.value);
                                }}
                            >
                                <option value="ALL">All Subjects</option>
                                {allSubjects.map(sub => (
                                    <option key={sub.id} value={sub.id}>{sub.name}</option>
                                ))}
                            </select>
                        )}
                        <div className="flex bg-gray-100 p-1 rounded-lg">
                            <Button 
                                variant={printMode === 'FILLED' ? 'default' : 'ghost'} 
                                size="sm" 
                                onClick={() => setPrintMode('FILLED')} 
                                className={`gap-2 h-8 ${printMode === 'FILLED' ? 'bg-white text-[#0036a1] shadow-sm' : 'text-gray-500'}`}
                            >
                                <Eye className="w-4 h-4" /> Score
                            </Button>
                            <Button 
                                variant={printMode === 'EMPTY' ? 'default' : 'ghost'} 
                                size="sm" 
                                onClick={() => setPrintMode('EMPTY')} 
                                className={`gap-2 h-8 ${printMode === 'EMPTY' ? 'bg-white text-[#0036a1] shadow-sm' : 'text-gray-500'}`}
                            >
                                <EyeOff className="w-4 h-4" /> Empty
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row items-start lg:items-center gap-3 bg-gray-50 p-3 rounded-lg border border-gray-200 justify-between">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-wrap w-full lg:w-auto">
                        <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider shrink-0">Format:</span>
                            <select 
                                className="flex-1 sm:flex-none border border-gray-300 bg-white rounded px-2 py-1 text-xs outline-none focus:border-[#0036a1] min-w-[140px]"
                                value={printTypeFilter}
                                onChange={(e) => setPrintTypeFilter(e.target.value as any)}
                            >
                                <option value="COMBINED">CA & Exam Combined</option>
                                <option value="CA_ONLY">CA Result Only</option>
                            </select>
                        </div>
                        <div className="flex items-center gap-2 sm:border-l border-gray-300 sm:pl-3 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-200 flex-wrap">
                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider shrink-0">Size:</span>
                            <select 
                                className="flex-1 sm:flex-none border border-gray-300 bg-white rounded px-2 py-1 text-xs outline-none focus:border-[#0036a1] min-w-[80px]"
                                value={paperSize}
                                onChange={(e) => setPaperSize(e.target.value as any)}
                            >
                                <option value="A4">A4</option>
                                <option value="A3">A3 (For many subjects)</option>
                            </select>
                            <select 
                                className="flex-1 sm:flex-none border border-gray-300 bg-white rounded px-2 py-1 text-xs outline-none focus:border-[#0036a1] min-w-[100px]"
                                value={orientation}
                                onChange={(e) => setOrientation(e.target.value as any)}
                            >
                                <option value="landscape">Landscape</option>
                                <option value="portrait">Portrait</option>
                            </select>
                        </div>
                    </div>
                    <div className="flex justify-center lg:justify-end gap-2 w-full lg:w-auto mt-2 lg:mt-0 pt-3 lg:pt-0 border-t border-gray-200 lg:border-t-0">
                        <Button variant="outline" size="sm" onClick={handleSharePDF} className="gap-2 text-[#0036a1] border-[#0036a1]/30 bg-white">
                            <Share2 className="w-4 h-4" /> Share PDF
                        </Button>
                        <Button variant="default" size="sm" onClick={handlePrint} className="gap-2 bg-[#0036a1] hover:bg-[#001761]">
                            <Printer className="w-4 h-4" /> Print View
                        </Button>
                    </div>
                </div>
            </div>

            <div className="overflow-x-auto">
                <div id="broadsheet-printable">
                    <style>{`
                        #broadsheet-printable .text-gray-900 { color: #111827 !important; }
                        #broadsheet-printable .text-gray-700 { color: #374151 !important; }
                        #broadsheet-printable .text-gray-600 { color: #4b5563 !important; }
                        #broadsheet-printable .text-gray-500 { color: #6b7280 !important; }
                        #broadsheet-printable .border-gray-400 { border-color: #9ca3af !important; }
                        #broadsheet-printable .border-gray-300 { border-color: #d1d5db !important; }
                        #broadsheet-printable .bg-gray-200 { background-color: #e5e7eb !important; }
                        #broadsheet-printable .bg-gray-100 { background-color: #f3f4f6 !important; }
                        #broadsheet-printable .bg-blue-50\\/50 { background-color: rgba(239, 246, 255, 0.5) !important; }
                        #broadsheet-printable .bg-blue-100\\/50 { background-color: rgba(219, 234, 254, 0.5) !important; }
                        #broadsheet-printable .text-blue-900 { color: #1e3a8a !important; }
                    `}</style>
                    <div className="header text-center mb-6 mt-2">
                        {data?.school?.logoUrl && <img src={data.school.logoUrl} alt="School Logo" className="h-16 mx-auto mb-2 object-contain" />}
                        <h1 className="text-xl font-bold uppercase m-0 text-gray-900">{data?.school?.name || 'School Name'}</h1>
                        <h2 className="text-md font-semibold m-0 mt-1 text-gray-700">{data?.classInfo?.name} - {term} ({year})</h2>
                        <p className="text-sm text-gray-500 m-0 mt-1 font-bold">
                            MASTER BROADSHEET {printTypeFilter === 'CA_ONLY' ? '(CONTINUOUS ASSESSMENT)' : '(CA & EXAM)'}
                            {printMode === 'EMPTY' ? ' - EMPTY FOR ENTRY' : ''}
                        </p>
                    </div>
                    <table className="w-full text-xs min-w-[800px] border border-gray-300">
                    <thead className="bg-gray-100 border-b border-gray-300">
                        <tr>
                            <th rowSpan={visibleParts.length > 0 ? 2 : 1} className="border border-gray-300 p-2 text-left whitespace-nowrap min-w-[30px]">#</th>
                            <th rowSpan={visibleParts.length > 0 ? 2 : 1} className="border border-gray-300 p-2 text-left whitespace-nowrap min-w-[150px]">Student Name</th>
                            <th rowSpan={visibleParts.length > 0 ? 2 : 1} className="border border-gray-300 p-2 text-center whitespace-nowrap min-w-[50px]">M/F</th>
                            {subjects.map((sub: any) => (
                                <th key={sub.id} colSpan={visibleParts.length > 0 ? visibleParts.length + (showTotalCol ? 1 : 0) : 1} className="border border-gray-300 p-2 py-2 text-center bg-gray-200">
                                    <div className="mx-auto font-bold" title={sub.name}>
                                        {sub.name}
                                    </div>
                                </th>
                            ))}
                            <th rowSpan={visibleParts.length > 0 ? 2 : 1} className="border border-gray-300 p-2 text-center whitespace-nowrap min-w-[60px] bg-gray-200">Total</th>
                            <th rowSpan={visibleParts.length > 0 ? 2 : 1} className="border border-gray-300 p-2 text-center whitespace-nowrap min-w-[60px] bg-gray-200">Avg</th>
                            <th rowSpan={visibleParts.length > 0 ? 2 : 1} className="border border-gray-300 p-2 text-center whitespace-nowrap min-w-[50px] bg-gray-200">Pos</th>
                        </tr>
                        {visibleParts.length > 0 && (
                            <tr>
                                {subjects.map((sub: any) => (
                                    <React.Fragment key={`subcols-${sub.id}`}>
                                        {visibleParts.map((cs: any) => (
                                            <th key={`${sub.id}-${cs.id}`} className="border border-gray-300 p-1 text-center bg-gray-50 text-[10px]">
                                                {cs.name}
                                            </th>
                                        ))}
                                        {showTotalCol && <th className="border border-gray-300 p-1 text-center bg-blue-50 text-[10px] font-bold text-blue-800">Total</th>}
                                    </React.Fragment>
                                ))}
                            </tr>
                        )}
                    </thead>
                    <tbody>
                        {students.map((st: any, idx: number) => (
                            <tr key={st.studentProfileId} className="hover:bg-gray-50">
                                <td className="border border-gray-300 p-2 text-center">{idx + 1}</td>
                                <td className="border border-gray-300 p-2 font-semibold text-gray-800">{st.name}</td>
                                <td className="border border-gray-300 p-2 text-center text-gray-500">{st.gender?.charAt(0)}</td>
                                {subjects.map((sub: any) => {
                                    const sc = st.scores[sub.id];
                                    const breakdown = sc?.breakdown || {};
                                    return (
                                        <React.Fragment key={`score-${sub.id}`}>
                                            {visibleParts.length > 0 ? (
                                                <>
                                                    {visibleParts.map((cs: any) => (
                                                        <td key={`${sub.id}-${cs.id}`} className="border border-gray-300 p-1 text-center text-gray-600">
                                                            {printMode === 'EMPTY' ? '' : (breakdown[cs.name] !== undefined ? breakdown[cs.name] : '-')}
                                                        </td>
                                                    ))}
                                                    {showTotalCol && (
                                                        <td className="border border-gray-300 p-1 text-center font-bold bg-blue-50/50" style={{ color: (sc && typeof sc.score === 'number' && sc.score < passMark) ? '#dc2626' : 'inherit' }}>
                                                            {printMode === 'EMPTY' ? '' : (sc ? sc.score : '-')}
                                                        </td>
                                                    )}
                                                </>
                                            ) : (
                                                <td className="border border-gray-300 p-2 text-center font-bold" style={{ color: (sc && typeof sc.score === 'number' && sc.score < passMark) ? '#dc2626' : 'inherit' }}>
                                                    {printMode === 'EMPTY' ? '' : (sc ? sc.score : '-')}
                                                </td>
                                            )}
                                        </React.Fragment>
                                    );
                                })}
                                <td className="border border-gray-300 p-2 text-center font-bold bg-gray-100">{printMode === 'EMPTY' ? '' : st.overallTotal}</td>
                                <td className="border border-gray-300 p-2 text-center font-bold text-[#0036a1] bg-gray-100">{printMode === 'EMPTY' ? '' : st.averageStr}</td>
                                <td className="border border-gray-300 p-2 text-center font-bold bg-gray-100">{printMode === 'EMPTY' ? '' : st.position}</td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot className="bg-gray-200 border-t-2 border-gray-400 font-bold">
                        <tr>
                            <td colSpan={3} className="border border-gray-300 p-2 text-right uppercase">Class Totals</td>
                            {subjects.map((sub: any) => {
                                return (
                                    <React.Fragment key={`total-${sub.id}`}>
                                        {visibleParts.length > 0 ? (
                                            <>
                                                {visibleParts.map((cs: any) => {
                                                    let sum = 0;
                                                    students.forEach((st: any) => {
                                                        const val = st.scores[sub.id]?.breakdown?.[cs.name];
                                                        const num = parseFloat(val as any);
                                                        if (!isNaN(num)) sum += num;
                                                    });
                                                    sum = Math.round(sum * 10) / 10;
                                                    return (
                                                        <td key={`${sub.id}-${cs.id}-total`} className="border border-gray-300 p-1 text-center text-gray-700">
                                                            {printMode === 'EMPTY' ? '' : sum}
                                                        </td>
                                                    );
                                                })}
                                                {showTotalCol && (
                                                    <td className="border border-gray-300 p-1 text-center bg-blue-100/50 text-blue-900">
                                                        {printMode === 'EMPTY' ? '' : (() => {
                                                            let sum = 0;
                                                            students.forEach((st: any) => {
                                                                const val = st.scores[sub.id]?.score;
                                                                const num = parseFloat(val as any);
                                                                if (!isNaN(num)) sum += num;
                                                            });
                                                            return Math.round(sum * 10) / 10;
                                                        })()}
                                                    </td>
                                                )}
                                            </>
                                        ) : (
                                            <td className="border border-gray-300 p-2 text-center text-gray-700">
                                                {printMode === 'EMPTY' ? '' : (() => {
                                                    let sum = 0;
                                                    students.forEach((st: any) => {
                                                        const val = st.scores[sub.id]?.score;
                                                        const num = parseFloat(val as any);
                                                        if (!isNaN(num)) sum += num;
                                                    });
                                                    return Math.round(sum * 10) / 10;
                                                })()}
                                            </td>
                                        )}
                                    </React.Fragment>
                                );
                            })}
                            <td className="border border-gray-300 p-2 text-center text-gray-900">
                                {printMode === 'EMPTY' ? '' : (() => {
                                    let sum = 0;
                                    students.forEach((st: any) => {
                                        const num = parseFloat(st.overallTotal as any);
                                        if (!isNaN(num)) sum += num;
                                    });
                                    return Math.round(sum * 10) / 10;
                                })()}
                            </td>
                            <td className="border border-gray-300 p-2 text-center text-[#0036a1]">
                                {printMode === 'EMPTY' ? '' : (() => {
                                    let sum = 0;
                                    students.forEach((st: any) => sum += parseFloat(st.averageStr || '0'));
                                    return students.length > 0 ? (sum / students.length).toFixed(1) : '0.0';
                                })()}
                            </td>
                            <td className="border border-gray-300 p-2 text-center text-gray-500">-</td>
                        </tr>
                    </tfoot>
                </table>
                </div>
            </div>
            {students.length === 0 && (
                <div className="py-10 text-center text-gray-500">No students found in this class.</div>
            )}
        </div>
    );
}
