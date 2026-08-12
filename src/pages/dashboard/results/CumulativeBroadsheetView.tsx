import { useState, useEffect } from 'react';
import { Button } from '../../../components/ui/button';
import { Printer, Share2 } from 'lucide-react';
import html2pdf from 'html2pdf.js';

interface CumulativeBroadsheetProps {
    classId: string;
    year: string;
    API: string;
}

export default function CumulativeBroadsheetView({ classId, year, API }: CumulativeBroadsheetProps) {
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<any>(null);

    const loadBroadsheet = async () => {
        if (!classId) return;
        setLoading(true);
        try {
            const res = await fetch(`${API}/results/cumulative-broadsheet?classId=${classId}&academicYear=${encodeURIComponent(year)}`, { credentials: 'include' });
            const json = await res.json();
            setData(json);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (classId) {
            loadBroadsheet();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [classId, year]);

    const handlePrint = () => {
        const content = document.getElementById('cumulative-broadsheet-printable');
        if (!content) return;
        const html = `
            <html><head><title>Cumulative Broadsheet</title>
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
                @media print { @page { size: landscape; margin: 10mm; } }
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
        const content = document.getElementById('cumulative-broadsheet-printable');
        if (!content) return;

        try {
            const originalStyle = content.style.cssText;
            content.style.padding = '20px';
            content.style.backgroundColor = '#fff';

            const opt = {
                margin:       10,
                filename:     `cumulative_broadsheet_${(data?.classInfo?.name || 'class').replace(/\s+/g, '_')}.pdf`,
                image:        { type: 'jpeg' as const, quality: 0.98 },
                html2canvas:  { scale: 2, useCORS: true },
                jsPDF:        { unit: 'mm', format: 'a4', orientation: 'landscape' as const }
            };

            const pdfBlob = await html2pdf().set(opt).from(content).output('blob');
            content.style.cssText = originalStyle;

            if (navigator.share && navigator.canShare && navigator.canShare({ files: [new File([pdfBlob], opt.filename, { type: 'application/pdf' })] })) {
                const file = new File([pdfBlob], opt.filename, { type: 'application/pdf' });
                await navigator.share({
                    files: [file],
                    title: 'Cumulative Broadsheet',
                    text: `Cumulative Broadsheet for ${data?.classInfo?.name}`
                });
            } else {
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
                <p>No cumulative data found for this class.</p>
            </div>
        );
    }

    if (loading) return <div className="py-20 text-center text-gray-500">Loading cumulative data...</div>;

    const students = data?.students || [];
    const uniqueTerms = data?.uniqueTerms || ['First Term', 'Second Term', 'Third Term'];

    return (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden p-5 animate-in fade-in">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                <h3 className="font-bold text-lg text-gray-900">Cumulative Broadsheet: {data?.classInfo?.name}</h3>
                <div className="flex justify-center sm:justify-end gap-2 flex-wrap w-full sm:w-auto">
                    <Button variant="outline" size="sm" onClick={handleSharePDF} className="gap-2 text-[#0036a1] border-[#0036a1]/30">
                        <Share2 className="w-4 h-4" /> Share PDF
                    </Button>
                    <Button variant="outline" size="sm" onClick={handlePrint} className="gap-2 text-[#0036a1] border-[#0036a1]/30">
                        <Printer className="w-4 h-4" /> Print
                    </Button>
                </div>
            </div>

            <div className="overflow-x-auto">
                <div id="cumulative-broadsheet-printable">
                    <style>{`
                        #cumulative-broadsheet-printable .text-gray-900 { color: #111827 !important; }
                        #cumulative-broadsheet-printable .text-gray-800 { color: #1f2937 !important; }
                        #cumulative-broadsheet-printable .text-gray-700 { color: #374151 !important; }
                        #cumulative-broadsheet-printable .text-gray-600 { color: #4b5563 !important; }
                        #cumulative-broadsheet-printable .text-gray-500 { color: #6b7280 !important; }
                        #cumulative-broadsheet-printable .border-gray-300 { border-color: #d1d5db !important; }
                        #cumulative-broadsheet-printable .bg-gray-100 { background-color: #f3f4f6 !important; }
                        #cumulative-broadsheet-printable .hover\\:bg-gray-50:hover { background-color: #f9fafb !important; }
                        #cumulative-broadsheet-printable .text-green-700 { color: #15803d !important; }
                    `}</style>
                    <div className="header text-center mb-6 mt-2">
                        {data?.school?.logoUrl && <img src={data.school.logoUrl} alt="School Logo" className="h-16 mx-auto mb-2 object-contain" />}
                        <h1 className="text-xl font-bold uppercase m-0 text-gray-900">{data?.school?.name || 'School Name'}</h1>
                        <h2 className="text-md font-semibold m-0 mt-1 text-gray-700">{data?.classInfo?.name} - CUMULATIVE ({year})</h2>
                        <p className="text-sm text-gray-500 m-0 mt-1 font-bold">SESSION BROADSHEET SUMMARY</p>
                    </div>
                    <table className="w-full text-xs min-w-[600px] border border-gray-300">
                    <thead className="bg-gray-100 border-b border-gray-300">
                        <tr>
                            <th className="border border-gray-300 p-2 text-left whitespace-nowrap min-w-[30px]">#</th>
                            <th className="border border-gray-300 p-2 text-left whitespace-nowrap min-w-[150px]">Student Name</th>
                            {uniqueTerms.map((term: string) => (
                                <th key={term} className="border border-gray-300 p-2 text-center">{term} Avg</th>
                            ))}
                            <th className="border border-gray-300 p-2 text-center">Cum. Total</th>
                            <th className="border border-gray-300 p-2 text-center">Cum. Avg</th>
                            <th className="border border-gray-300 p-2 text-center">Grade</th>
                            <th className="border border-gray-300 p-2 text-center">Remark</th>
                            <th className="border border-gray-300 p-2 text-center">Rank</th>
                        </tr>
                    </thead>
                    <tbody>
                        {students.map((st: any, idx: number) => (
                            <tr key={st.studentProfileId} className="hover:bg-gray-50">
                                <td className="border border-gray-300 p-2 text-center">{idx + 1}</td>
                                <td className="border border-gray-300 p-2 font-semibold text-gray-800">{st.name}</td>
                                {uniqueTerms.map((term: string) => (
                                    <td key={term} className="border border-gray-300 p-2 text-center">
                                        {st.termAverages[term] !== null && st.termAverages[term] !== undefined 
                                            ? st.termAverages[term].toFixed(1) 
                                            : '—'}
                                    </td>
                                ))}
                                <td className="border border-gray-300 p-2 text-center font-bold">{st.cumTotal}</td>
                                <td className="border border-gray-300 p-2 text-center font-bold text-[#0036a1]">{st.averageStr}</td>
                                <td className="border border-gray-300 p-2 text-center font-semibold text-green-700">{st.grade || '-'}</td>
                                <td className="border border-gray-300 p-2 text-center text-gray-600">{st.remark || '-'}</td>
                                <td className="border border-gray-300 p-2 text-center font-bold">{st.position}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                </div>
            </div>
        </div>
    );
}
