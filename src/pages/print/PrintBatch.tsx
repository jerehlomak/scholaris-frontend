import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import ReportCard from '../../components/report-blocks/ReportCard';
import { ReportCardPreview } from '../../components/report/ReportCardPreview';

const API = import.meta.env.VITE_API_URL || '/api/v1';

const DEFAULT_CFG = {
    showSchoolLogo: true, showSchoolAddress: true, showStudentPhoto: true,
    showAdmissionNo: true, showClass: true, showSession: true, showTerm: true,
    showAge: true, showGender: true, showTeacherName: true,
    showClassAverage: true, showSubjectPosition: false, showOverallPosition: true,
    showGradingKey: true, showAttendance: true, showEvaluation: true,
    showTeacherComment: true, showHeadComment: true, showPrincipalComment: true,
    showNextTerm: true, showPromotedTo: false,
    reportTitle: 'End of Term Academic Report',
    principalTitle: 'Principal', headTeacherTitle: 'Head Teacher', formTeacherTitle: 'Form Teacher', principalName: '',
    primaryColor: '#0B1F4E', headerBg: '#0B1F4E', fontFamily: 'serif',
    resultShowBorder: false, resultShowSignature: true, resultShowNextTermFees: false
};

export default function PrintBatch() {
    const [data, setData] = useState<any[]>([]);
    // Only set when the URL explicitly requests one template (e.g. an admin
    // previewing/exporting with a specific pick from ExportResults.tsx) —
    // otherwise every student uses their own per-section resolved template
    // (see templateConfig on each item in `data`, computed server-side by
    // reportTemplate.controller.js's resolveTemplateConfig).
    const [overrideConfig, setOverrideConfig] = useState<any>(null);
    const [globalSettings, setGlobalSettings] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchAll = async () => {
            const params = new URLSearchParams(window.location.search);
            let studentIds = params.get('studentIds'); // comma separated (fallback)
            const batchId = params.get('batchId'); // new way
            const term = params.get('term');
            const academicYear = params.get('academicYear');
            const classId = params.get('classId');
            const token = params.get('token');

            if ((!studentIds && !batchId) || !term || !academicYear || !token) {
                setError('Missing parameters');
                setLoading(false);
                setTimeout(() => {
                    const el = document.createElement('div');
                    el.id = 'print-ready';
                    document.body.appendChild(el);
                }, 500);
                return;
            }

            try {
                const headers = { Authorization: `Bearer ${token}` };

                if (batchId && !studentIds) {
                    try {
                        const batchRes = await axios.get(`${API}/results/print/batch-ids/${batchId}`, { headers });
                        studentIds = batchRes.data.studentIds.join(',');
                    } catch (e) {
                        setError('Batch not found or expired. Please try exporting again.');
                        setLoading(false);
                        return;
                    }
                }

                // 1. If a specific template was explicitly requested, fetch just
                // that one and use it for every student (an intentional
                // admin override). Otherwise leave overrideConfig null — each
                // student renders with their own already-resolved template.
                const targetTemplateId = params.get('templateId');
                if (targetTemplateId) {
                    try {
                        const tRes = await axios.get(`${API}/report-templates/${targetTemplateId}`, { headers });
                        setOverrideConfig(tRes.data.template?.config || null);
                    } catch (e) {
                        console.error('[PrintBatch] Failed to fetch override template, falling back to per-student templates:', e);
                    }
                }

                // 2. Fetch Global Settings
                const globalSettingsRes = await axios.get(`${API}/school-settings/result-config/unified`, { headers });
                setGlobalSettings(globalSettingsRes.data);

                // 3. Fetch Data for all students in a single batch request
                const resultType = params.get('resultType');
                const isCumulative = params.get('isCumulative');

                console.log(`[PrintBatch] Fetching batch report cards for ${studentIds?.split(',').length} students`);

                const batchRes = await axios.get(`${API}/results/batch-report-cards`, {
                    params: { studentProfileIds: studentIds, term, academicYear, classId, resultType, isCumulative },
                    headers
                });

                const resultsData = batchRes.data.data || [];
                console.log(`[PrintBatch] Batch fetch complete. Total data: ${resultsData.length}`);

                if (resultsData.length === 0) {
                    console.error('[PrintBatch] No report card data could be generated.');
                    setError('No report card data could be generated.');
                    setLoading(false);
                    // Still insert print-ready so puppeteer can capture the error
                    setTimeout(() => {
                        console.log('[PrintBatch] Appending #print-ready (empty data)');
                        const el = document.createElement('div');
                        el.id = 'print-ready';
                        document.body.appendChild(el);
                    }, 500);
                    return;
                }

                console.log(`[PrintBatch] All data fetched. Length: ${resultsData.length}. Setting data...`);
                setData(resultsData);
                setLoading(false);

                // Delay signaling print-ready to allow fonts/images to load
                setTimeout(() => {
                    console.log('[PrintBatch] Appending #print-ready (success)');
                    const el = document.createElement('div');
                    el.id = 'print-ready';
                    document.body.appendChild(el);
                }, 2000);

            } catch (err: any) {
                console.error('[PrintBatch] Error in fetchAll:', err);
                setError(err.response?.data?.msg || 'Failed to load data');
                setLoading(false);
                // Set print-ready even on error so Puppeteer doesn't timeout
                setTimeout(() => {
                    console.log('[PrintBatch] Appending #print-ready (error boundary)');
                    const el = document.createElement('div');
                    el.id = 'print-ready';
                    document.body.appendChild(el);
                }, 500);
            }
        };

        fetchAll();
    }, []);

    if (error) return <div className="p-8 text-red-500 font-bold">{error}</div>;
    if (loading || !globalSettings) return <div className="p-8 font-bold">Loading report cards...</div>;

    const resultType = new URLSearchParams(window.location.search).get('resultType');
    const isCommentBased = resultType === 'COMMENT_CA' || resultType === 'COMMENT_EXAM';

    class ErrorBoundary extends React.Component<{ children: any }, { hasError: boolean, error: any }> {
        constructor(props: any) { super(props); this.state = { hasError: false, error: null }; }
        static getDerivedStateFromError(error: any) { return { hasError: true, error }; }
        componentDidCatch(error: any, errorInfo: any) { console.error("ErrorBoundary caught an error", error, errorInfo); }
        render() {
            if (this.state.hasError) {
                return <div className="p-8 text-red-500 font-bold border-4 border-red-500">React Render Error: {this.state.error?.toString()}</div>;
            }
            return this.props.children;
        }
    }

    return createPortal(
        <div className="bg-white min-h-screen">
            <ErrorBoundary>
            {data.map((studentData, index) => {
                const effectiveConfig = { ...(overrideConfig || studentData.templateConfig || DEFAULT_CFG), globalSettings };
                return (
                    <div
                        key={studentData.student?.id || index}
                        style={{ pageBreakAfter: index < data.length - 1 ? 'always' : 'auto' }}
                        className="print:shadow-none shadow-lg mb-8 mx-auto w-[794px]"
                    >
                        {(effectiveConfig.blocks && effectiveConfig.blocks.length > 0) ? (
                            <ReportCard config={effectiveConfig} data={studentData} />
                        ) : (
                            <ReportCardPreview
                                templateConfig={effectiveConfig}
                                student={studentData.student}
                                results={studentData.results}
                                gradingScale={studentData.gradingScale}
                                comments={studentData.comments}
                                attendance={studentData.attendance}
                                school={studentData.schoolSettings}
                                summary={studentData.summary}
                                annualResults={studentData.annualResults}
                                isCommentBased={isCommentBased}
                            />
                        )}
                    </div>
                );
            })}
            </ErrorBoundary>
        </div>,
        document.body
    );
}
