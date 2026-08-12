import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { useFinanceMeta } from '../../../hooks/useFinanceMeta';
import { toast } from 'sonner';
import {
    FileText, Download, ChevronRight, Loader2, PieChart,
    CreditCard, Users, Filter, BarChart3, Search, Calendar,
    TrendingUp, TrendingDown, DollarSign, Briefcase, ArrowUpRight,
    ArrowDownRight, Layers, RefreshCw, Printer, ShieldAlert,
    CheckCircle2, ArrowUpDown, ChevronDown, Sparkles, Phone,
    SlidersHorizontal, X, User, Hash, Tag
} from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';

const TABS = [
    { id: 'executive', label: 'Executive Overview', shortLabel: 'Overview', icon: BarChart3, color: 'text-indigo-600', bg: 'bg-indigo-50 border-indigo-200' },
    { id: 'bills', label: 'School Fees & Invoices', shortLabel: 'Fees & Invoices', icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200' },
    { id: 'payments', label: 'Fee Collections', shortLabel: 'Collections', icon: CreditCard, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200' },
    { id: 'outstanding', label: 'Debtors Ledger', shortLabel: 'Debtors', icon: Users, color: 'text-rose-600', bg: 'bg-rose-50 border-rose-200' },
    { id: 'payroll', label: 'Staff Payroll', shortLabel: 'Payroll', icon: Briefcase, color: 'text-violet-600', bg: 'bg-violet-50 border-violet-200' },
    { id: 'income', label: 'Income & Receipts', shortLabel: 'Income', icon: TrendingUp, color: 'text-teal-600', bg: 'bg-teal-50 border-teal-200' },
    { id: 'expenses', label: 'Operating Expenses', shortLabel: 'Expenses', icon: TrendingDown, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200' }
];

const MONTHS = [
    { value: '1', label: 'January' },
    { value: '2', label: 'February' },
    { value: '3', label: 'March' },
    { value: '4', label: 'April' },
    { value: '5', label: 'May' },
    { value: '6', label: 'June' },
    { value: '7', label: 'July' },
    { value: '8', label: 'August' },
    { value: '9', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' }
];

function fmt(n: number | undefined | null): string {
    return '₦' + (n || 0).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtShort(n: number | undefined | null): string {
    if (!n) return '₦0';
    if (Math.abs(n) >= 1_000_000) return '₦' + (n / 1_000_000).toFixed(2) + 'M';
    if (Math.abs(n) >= 1_000) return '₦' + (n / 1_000).toFixed(1) + 'k';
    return '₦' + n.toLocaleString('en-NG');
}

export default function FinanceReports() {
    const { terms: metaTerms, sessions: metaSessions } = useFinanceMeta();
    const [activeTab, setActiveTab] = useState('executive');
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<any>(null);
    const [executiveSummary, setExecutiveSummary] = useState<any>(null);
    const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

    // Global Filters
    const [filters, setFilters] = useState({
        term: '',
        academicYear: '',
        month: '',
        year: new Date().getFullYear().toString(),
        status: '',
        method: '',
        from: '',
        to: ''
    });

    // Search and Sorting
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState('date');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

    // Fetch Executive KPI banner summary
    const fetchExecutiveSummary = useCallback(async () => {
        try {
            const params = new URLSearchParams(
                Object.fromEntries(
                    Object.entries({
                        term: filters.term,
                        academicYear: filters.academicYear,
                        month: filters.month,
                        year: filters.year,
                        from: filters.from,
                        to: filters.to
                    }).filter(([, v]) => v)
                )
            );
            const res = await axios.get(`/api/v1/finance-v2/reports/executive-summary?${params}`, { withCredentials: true });
            setExecutiveSummary(res.data);
        } catch (err) {
            console.error('Failed to fetch executive summary', err);
        }
    }, [filters]);

    // Fetch Active Tab Data
    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            let endpoint = '';
            let paramsObj: Record<string, string> = {
                search: searchQuery,
                sortBy,
                sortOrder
            };

            if (filters.term) paramsObj.term = filters.term;
            if (filters.academicYear) paramsObj.academicYear = filters.academicYear;
            if (filters.month) paramsObj.month = filters.month;
            if (filters.year) paramsObj.year = filters.year;
            if (filters.from) paramsObj.from = filters.from;
            if (filters.to) paramsObj.to = filters.to;

            if (activeTab === 'executive') {
                endpoint = '/api/v1/finance-v2/reports/executive-summary';
            } else if (activeTab === 'bills') {
                endpoint = '/api/v1/finance-v2/reports/bills';
                if (filters.status) paramsObj.status = filters.status;
            } else if (activeTab === 'payments') {
                endpoint = '/api/v1/finance-v2/reports/payments';
                if (filters.method) paramsObj.method = filters.method;
            } else if (activeTab === 'outstanding') {
                endpoint = '/api/v1/finance-v2/reports/outstanding';
            } else if (activeTab === 'payroll') {
                endpoint = '/api/v1/finance-v2/reports/payroll';
                if (filters.status) paramsObj.status = filters.status;
            } else if (activeTab === 'income') {
                endpoint = '/api/v1/finance-v2/reports/income-expense';
                paramsObj.type = 'INCOME';
            } else if (activeTab === 'expenses') {
                endpoint = '/api/v1/finance-v2/reports/income-expense';
                paramsObj.type = 'EXPENSE';
            }

            const params = new URLSearchParams(paramsObj);
            const res = await axios.get(`${endpoint}?${params}`, { withCredentials: true });
            setData(res.data);

            if (activeTab === 'executive') {
                setExecutiveSummary(res.data);
            }
        } catch (err: any) {
            toast.error(err.response?.data?.msg || `Failed to fetch ${activeTab} report`);
            setData(null);
        } finally {
            setLoading(false);
        }
    }, [activeTab, filters, searchQuery, sortBy, sortOrder]);

    useEffect(() => {
        fetchExecutiveSummary();
    }, [fetchExecutiveSummary]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleSort = (field: string) => {
        if (sortBy === field) {
            setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
        } else {
            setSortBy(field);
            setSortOrder('desc');
        }
    };

    const clearFilters = () => {
        setFilters({
            term: '',
            academicYear: '',
            month: '',
            year: new Date().getFullYear().toString(),
            status: '',
            method: '',
            from: '',
            to: ''
        });
        setSearchQuery('');
        setSortBy('date');
        setSortOrder('desc');
    };

    const activeFilterCount = useMemo(() => {
        let count = 0;
        if (filters.term) count++;
        if (filters.academicYear) count++;
        if (filters.month) count++;
        if (filters.status) count++;
        if (filters.method) count++;
        if (filters.from || filters.to) count++;
        if (searchQuery) count++;
        return count;
    }, [filters, searchQuery]);

    // Client-side Excel Export using SheetJS
    const handleExportExcel = () => {
        if (!data) {
            toast.error('No data available to export');
            return;
        }

        try {
            let exportRows: any[] = [];
            let fileName = `Skooly_${activeTab}_Report_${new Date().toISOString().split('T')[0]}.xlsx`;

            if (activeTab === 'executive') {
                exportRows = [
                    { Metric: 'Total Fee Collections', Amount: data.summary?.totalFeeCollected || 0 },
                    { Metric: 'Direct Non-Fee Income', Amount: data.summary?.totalDirectIncome || 0 },
                    { Metric: 'Total Inflow (Revenue)', Amount: data.summary?.totalInflow || 0 },
                    { Metric: 'Staff Payroll Disbursements', Amount: data.summary?.totalPayrollNet || 0 },
                    { Metric: 'Direct Operating Expenses', Amount: data.summary?.totalDirectExpenses || 0 },
                    { Metric: 'Total Outflow (Expenditure)', Amount: data.summary?.totalOutflow || 0 },
                    { Metric: 'Net Operating Balance (Surplus/Deficit)', Amount: data.summary?.netOperatingBalance || 0 },
                    { Metric: 'Total Outstanding Debtor Balance', Amount: data.summary?.totalOutstanding || 0 },
                    { Metric: 'Debtor Students Count', Amount: data.summary?.totalDebtorsCount || 0 },
                    { Metric: 'Fee Collection Rate (%)', Amount: data.summary?.collectionRate || 0 }
                ];
            } else if (activeTab === 'bills' && data.invoices) {
                exportRows = data.invoices.map((inv: any) => ({
                    'Invoice Number': inv.invoiceNumber,
                    'Student Name': inv.studentName,
                    'Admission No': inv.admissionNo,
                    'Class': inv.className,
                    'Status': inv.status,
                    'Total Amount (₦)': inv.totalAmount,
                    'Amount Paid (₦)': inv.amountPaid,
                    'Balance Due (₦)': inv.balanceDue,
                    'Issue Date': new Date(inv.createdAt).toLocaleDateString()
                }));
                if (data.totals) {
                    exportRows.push({
                        'Invoice Number': 'TOTAL SUMMARY',
                        'Student Name': '',
                        'Admission No': '',
                        'Class': '',
                        'Status': '',
                        'Total Amount (₦)': data.totals.expected,
                        'Amount Paid (₦)': data.totals.collected,
                        'Balance Due (₦)': data.totals.outstanding,
                        'Issue Date': ''
                    });
                }
            } else if (activeTab === 'payments' && data.transactions) {
                exportRows = data.transactions.map((tx: any) => ({
                    'Transaction Reference': tx.reference,
                    'Student Name': tx.studentName,
                    'Class': tx.className,
                    'Payment Method': tx.method,
                    'Receipt Number': tx.receiptNumber || '—',
                    'Amount Paid (₦)': tx.amount,
                    'Payment Date': new Date(tx.paidAt).toLocaleDateString()
                }));
                exportRows.push({
                    'Transaction Reference': 'TOTAL COLLECTIONS',
                    'Student Name': '',
                    'Class': '',
                    'Payment Method': '',
                    'Receipt Number': '',
                    'Amount Paid (₦)': data.totalAmount,
                    'Payment Date': `${data.total} Transactions`
                });
            } else if (activeTab === 'outstanding' && data.students) {
                exportRows = data.students.map((s: any) => ({
                    'Student Name': s.studentName,
                    'Admission No': s.admissionNo,
                    'Class': s.className,
                    'Parent Name': s.parentName,
                    'Parent Phone': s.parentPhone,
                    'Parent Email': s.parentEmail,
                    'Invoice #': s.invoiceNumber,
                    'Total Invoiced (₦)': s.totalAmount,
                    'Amount Paid (₦)': s.amountPaid,
                    'Balance Due (₦)': s.balanceDue,
                    'Invoice Date': new Date(s.createdAt).toLocaleDateString()
                }));
                exportRows.push({
                    'Student Name': 'TOTAL DEBTORS SUMMARY',
                    'Admission No': '',
                    'Class': '',
                    'Parent Name': '',
                    'Parent Phone': '',
                    'Parent Email': '',
                    'Invoice #': `${data.count} Students`,
                    'Total Invoiced (₦)': '',
                    'Amount Paid (₦)': '',
                    'Balance Due (₦)': data.totalOutstanding,
                    'Invoice Date': ''
                });
            } else if (activeTab === 'payroll' && data.records) {
                exportRows = data.records.map((p: any) => ({
                    'Staff Name': p.staffName,
                    'Employee ID': p.employeeId,
                    'Department': p.department,
                    'Period': `${MONTHS.find(m => m.value === String(p.month))?.label || p.month} ${p.year}`,
                    'Status': p.status?.toUpperCase(),
                    'Gross Pay (₦)': p.gross,
                    'Total Deductions (₦)': p.deductions,
                    'Net Salary (₦)': p.net,
                    'Payment Run Date': new Date(p.runDate).toLocaleDateString()
                }));
                exportRows.push({
                    'Staff Name': 'TOTAL PAYROLL SUMMARY',
                    'Employee ID': '',
                    'Department': '',
                    'Period': '',
                    'Status': '',
                    'Gross Pay (₦)': data.totalGross,
                    'Total Deductions (₦)': data.totalDeductions,
                    'Net Salary (₦)': data.totalNet,
                    'Payment Run Date': `${data.totalStaffCount} Staff`
                });
            } else if ((activeTab === 'income' || activeTab === 'expenses') && data.records) {
                exportRows = data.records.map((r: any) => ({
                    'Date': new Date(r.date).toLocaleDateString(),
                    'Category': r.category?.name || 'Uncategorized',
                    'Description': r.description,
                    'Source Type': r.source,
                    'Reference Code': r.referenceId || '—',
                    'Amount (₦)': r.amount
                }));
                exportRows.push({
                    'Date': 'TOTAL AMOUNT',
                    'Category': '',
                    'Description': '',
                    'Source Type': '',
                    'Reference Code': `${data.totalRecords} Records`,
                    'Amount (₦)': activeTab === 'income' ? data.totalIncome : data.totalExpense
                });
            }

            const worksheet = XLSX.utils.json_to_sheet(exportRows);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, activeTab.toUpperCase());

            const max_width = exportRows.reduce((w: any, r: any) => {
                Object.keys(r).forEach((k: string) => {
                    const l = Math.max(k.length, String(r[k] || '').length);
                    w[k] = Math.max(w[k] || 12, l + 2);
                });
                return w;
            }, {});
            worksheet['!cols'] = Object.keys(max_width).map(k => ({ wch: Math.min(max_width[k], 40) }));

            XLSX.writeFile(workbook, fileName);
            toast.success(`Exported ${activeTab} report to Excel successfully!`);
        } catch (err) {
            console.error('Failed to export Excel:', err);
            toast.error('Failed to generate Excel document');
        }
    };

    // Client-side PDF Export using jsPDF
    const handleExportPDF = () => {
        if (!data) {
            toast.error('No data available to export');
            return;
        }

        try {
            const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

            // Document Header Banner
            doc.setFillColor(30, 41, 59);
            doc.rect(0, 0, 210, 28, 'F');

            doc.setTextColor(255, 255, 255);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(14);
            doc.text('SKOOLY COMPREHENSIVE FINANCE REPORT', 14, 12);

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8.5);
            doc.setTextColor(203, 213, 225);
            const tabTitle = TABS.find(t => t.id === activeTab)?.label.toUpperCase() || 'FINANCIAL REPORT';
            doc.text(`MODULE: ${tabTitle} | GENERATED: ${new Date().toLocaleString()}`, 14, 19);

            // Filter metadata bar
            doc.setFillColor(248, 250, 252);
            doc.rect(0, 28, 210, 10, 'F');
            doc.setFontSize(7.5);
            doc.setTextColor(100, 116, 139);
            const sessionStr = filters.academicYear ? `Session: ${filters.academicYear}` : 'All Sessions';
            const termStr = filters.term ? `Term: ${filters.term}` : 'All Terms';
            const monthStr = filters.month ? `Month: ${MONTHS.find(m => m.value === filters.month)?.label}` : '';
            doc.text(`FILTERS APPLIED: ${sessionStr} • ${termStr} ${monthStr ? `• ${monthStr}` : ''}`, 14, 34);

            let y = 46;

            if (activeTab === 'executive' && data?.summary) {
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(11);
                doc.setTextColor(15, 23, 42);
                doc.text('EXECUTIVE FINANCIAL HEALTH OVERVIEW', 14, y);
                y += 8;

                const summaryItems = [
                    ['Total Fee Collections (Tuition)', fmt(data.summary?.totalFeeCollected)],
                    ['Direct & Non-Fee Incomes', fmt(data.summary?.totalDirectIncome)],
                    ['TOTAL INFLOW VOLUME (REVENUE)', fmt(data.summary?.totalInflow)],
                    ['Staff Payroll Disbursements (Net)', fmt(data.summary?.totalPayrollNet)],
                    ['Direct Operating & Facility Expenses', fmt(data.summary?.totalDirectExpenses)],
                    ['TOTAL OUTFLOW VOLUME (EXPENDITURES)', fmt(data.summary?.totalOutflow)],
                    ['NET OPERATING BALANCE (SURPLUS/DEFICIT)', fmt(data.summary?.netOperatingBalance)],
                    ['Total Outstanding Student Debt', fmt(data.summary?.totalOutstanding)],
                    ['Debtor Students Count', `${data.summary?.totalDebtorsCount} Students`],
                    ['Fee Collection Rate', `${data.summary?.collectionRate}%`]
                ];

                summaryItems.forEach(([label, val], idx) => {
                    const isTotal = label.includes('TOTAL') || label.includes('NET');
                    doc.setFont('helvetica', isTotal ? 'bold' : 'normal');
                    doc.setFontSize(8.5);
                    if (isTotal) {
                        doc.setFillColor(241, 245, 249);
                        doc.rect(14, y - 4, 182, 6.5, 'F');
                        doc.setTextColor(15, 23, 42);
                    } else {
                        doc.setTextColor(51, 65, 85);
                    }
                    doc.text(label, 16, y);
                    doc.text(val, 192, y, { align: 'right' });
                    y += 7;
                });
            } else if (activeTab === 'bills' && data?.invoices) {
                doc.setFillColor(241, 245, 249);
                doc.rect(14, y - 4, 182, 8, 'F');
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(8);
                doc.setTextColor(71, 85, 105);
                doc.text('INVOICE #', 16, y);
                doc.text('STUDENT', 48, y);
                doc.text('CLASS', 95, y);
                doc.text('STATUS', 120, y);
                doc.text('TOTAL', 145, y);
                doc.text('PAID', 168, y);
                doc.text('BAL', 186, y);
                y += 6;

                doc.setFont('helvetica', 'normal');
                data.invoices.forEach((inv: any, idx: number) => {
                    if (y > 275) {
                        doc.addPage();
                        y = 20;
                    }
                    if (idx % 2 === 1) {
                        doc.setFillColor(250, 250, 250);
                        doc.rect(14, y - 3.5, 182, 6, 'F');
                    }
                    doc.text(inv.invoiceNumber?.slice(0, 14) || '—', 16, y);
                    doc.text(inv.studentName?.slice(0, 22) || '—', 48, y);
                    doc.text(inv.className?.slice(0, 12) || '—', 95, y);
                    doc.text(inv.status?.replace('_', ' ') || '—', 120, y);
                    doc.text(fmtShort(inv.totalAmount), 145, y);
                    doc.text(fmtShort(inv.amountPaid), 168, y);
                    doc.text(fmtShort(inv.balanceDue), 186, y);
                    y += 6;
                });

                y += 4;
                doc.setFont('helvetica', 'bold');
                doc.text(`TOTAL EXPECTED: ${fmt(data.totals?.expected)} | COLLECTED: ${fmt(data.totals?.collected)} | OUTSTANDING: ${fmt(data.totals?.outstanding)}`, 14, y);
            } else if (activeTab === 'payments' && data?.transactions) {
                doc.setFillColor(241, 245, 249);
                doc.rect(14, y - 4, 182, 8, 'F');
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(8);
                doc.setTextColor(71, 85, 105);
                doc.text('REFERENCE', 16, y);
                doc.text('STUDENT', 55, y);
                doc.text('METHOD', 105, y);
                doc.text('RECEIPT #', 140, y);
                doc.text('AMOUNT', 175, y);
                y += 6;

                doc.setFont('helvetica', 'normal');
                data.transactions.forEach((tx: any, idx: number) => {
                    if (y > 275) {
                        doc.addPage();
                        y = 20;
                    }
                    if (idx % 2 === 1) {
                        doc.setFillColor(250, 250, 250);
                        doc.rect(14, y - 3.5, 182, 6, 'F');
                    }
                    doc.text(tx.reference?.slice(0, 18) || '—', 16, y);
                    doc.text(tx.studentName?.slice(0, 22) || '—', 55, y);
                    doc.text(tx.method || '—', 105, y);
                    doc.text(tx.receiptNumber || '—', 140, y);
                    doc.text(fmt(tx.amount), 175, y);
                    y += 6;
                });

                y += 4;
                doc.setFont('helvetica', 'bold');
                doc.text(`TOTAL COLLECTIONS: ${fmt(data.totalAmount)} (${data.total} Transactions)`, 14, y);
            } else if (activeTab === 'outstanding' && data?.students) {
                doc.setFillColor(241, 245, 249);
                doc.rect(14, y - 4, 182, 8, 'F');
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(8);
                doc.setTextColor(71, 85, 105);
                doc.text('STUDENT', 16, y);
                doc.text('CLASS', 65, y);
                doc.text('PARENT / CONTACT', 95, y);
                doc.text('INVOICE #', 140, y);
                doc.text('BALANCE DUE', 172, y);
                y += 6;

                doc.setFont('helvetica', 'normal');
                data.students.forEach((s: any, idx: number) => {
                    if (y > 275) {
                        doc.addPage();
                        y = 20;
                    }
                    if (idx % 2 === 1) {
                        doc.setFillColor(250, 250, 250);
                        doc.rect(14, y - 3.5, 182, 6, 'F');
                    }
                    doc.text(s.studentName?.slice(0, 22) || '—', 16, y);
                    doc.text(s.className?.slice(0, 12) || '—', 65, y);
                    doc.text(`${s.parentName?.slice(0, 14) || '—'} (${s.parentPhone?.slice(0, 12) || '—'})`, 95, y);
                    doc.text(s.invoiceNumber?.slice(0, 14) || '—', 140, y);
                    doc.text(fmt(s.balanceDue), 172, y);
                    y += 6;
                });

                y += 4;
                doc.setFont('helvetica', 'bold');
                doc.text(`TOTAL OUTSTANDING: ${fmt(data.totalOutstanding)} (${data.count} Debtors)`, 14, y);
            } else if (activeTab === 'payroll' && data?.records) {
                doc.setFillColor(241, 245, 249);
                doc.rect(14, y - 4, 182, 8, 'F');
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(8);
                doc.setTextColor(71, 85, 105);
                doc.text('STAFF NAME', 16, y);
                doc.text('EMP ID', 60, y);
                doc.text('DEPARTMENT', 85, y);
                doc.text('GROSS', 130, y);
                doc.text('DEDUCT', 155, y);
                doc.text('NET PAY', 178, y);
                y += 6;

                doc.setFont('helvetica', 'normal');
                data.records.forEach((p: any, idx: number) => {
                    if (y > 275) {
                        doc.addPage();
                        y = 20;
                    }
                    if (idx % 2 === 1) {
                        doc.setFillColor(250, 250, 250);
                        doc.rect(14, y - 3.5, 182, 6, 'F');
                    }
                    doc.text(p.staffName?.slice(0, 20) || 'Staff', 16, y);
                    doc.text(p.employeeId || '—', 60, y);
                    doc.text(p.department?.slice(0, 16) || 'Academic', 85, y);
                    doc.text(fmtShort(p.gross), 130, y);
                    doc.text(fmtShort(p.deductions), 155, y);
                    doc.text(fmtShort(p.net), 178, y);
                    y += 6;
                });

                y += 4;
                doc.setFont('helvetica', 'bold');
                doc.text(`TOTAL GROSS: ${fmt(data.totalGross)} | DEDUCTIONS: ${fmt(data.totalDeductions)} | NET SALARY: ${fmt(data.totalNet)}`, 14, y);
            } else if ((activeTab === 'income' || activeTab === 'expenses') && data?.records) {
                doc.setFillColor(241, 245, 249);
                doc.rect(14, y - 4, 182, 8, 'F');
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(8);
                doc.setTextColor(71, 85, 105);
                doc.text('DATE', 16, y);
                doc.text('CATEGORY', 42, y);
                doc.text('DESCRIPTION', 85, y);
                doc.text('SOURCE', 145, y);
                doc.text('AMOUNT', 175, y);
                y += 6;

                doc.setFont('helvetica', 'normal');
                data.records.forEach((r: any, idx: number) => {
                    if (y > 275) {
                        doc.addPage();
                        y = 20;
                    }
                    if (idx % 2 === 1) {
                        doc.setFillColor(250, 250, 250);
                        doc.rect(14, y - 3.5, 182, 6, 'F');
                    }
                    doc.text(new Date(r.date).toLocaleDateString(), 16, y);
                    doc.text(r.category?.name?.slice(0, 18) || 'Other', 42, y);
                    doc.text(r.description?.slice(0, 28) || '—', 85, y);
                    doc.text(r.source || 'MANUAL', 145, y);
                    doc.text(fmt(r.amount), 175, y);
                    y += 6;
                });

                y += 4;
                doc.setFont('helvetica', 'bold');
                doc.text(`TOTAL AMOUNT: ${fmt(activeTab === 'income' ? data.totalIncome : data.totalExpense)} (${data.totalRecords} Records)`, 14, y);
            }

            const timestamp = new Date().toISOString().split('T')[0];
            doc.save(`Skooly_Financial_Report_${activeTab}_${timestamp}.pdf`);
            toast.success(`Exported ${activeTab} report to PDF successfully!`);
        } catch (err) {
            console.error('Failed to export PDF:', err);
            toast.error('Failed to generate PDF document');
        }
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=DM+Mono:wght@400;500;600&display=swap');
                .fd-root, .fd-root * { font-family: 'Plus Jakarta Sans', sans-serif !important; }
                .fd-root .mono { font-family: 'DM Mono', monospace !important; }
                @media print {
                    body * { visibility: hidden; }
                    #printable-report, #printable-report * { visibility: visible; }
                    #printable-report { position: absolute; left: 0; top: 0; width: 100%; padding: 20px; }
                    .no-print { display: none !important; }
                }
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>

            <div className="fd-root min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-indigo-50/30 px-3 py-4 sm:px-6 sm:py-6 lg:px-8">
                <div className="pointer-events-none fixed inset-0 opacity-[0.22]" style={{ backgroundImage: 'radial-gradient(circle,#94a3b8 1px,transparent 1px)', backgroundSize: '28px 28px' }} />
                <div className="relative z-10 mx-auto max-w-7xl">

                    {/* Breadcrumb */}
                    <div className="mb-3 flex items-center gap-1.5 no-print text-[9px] sm:text-[10px]">
                        <span className="mono font-bold uppercase tracking-widest text-slate-500">Finance Hub</span>
                        <ChevronRight className="h-3 w-3 text-slate-400" />
                        <span className="mono font-bold uppercase tracking-widest text-indigo-600">General Financial Reports</span>
                    </div>

                    {/* Header Banner - Responsive */}
                    <div className="mb-4 sm:mb-6 rounded-2xl sm:rounded-3xl border border-slate-200/80 bg-white/90 p-4 sm:p-6 shadow-xl shadow-slate-100/50 backdrop-blur-xl no-print">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-start sm:items-center gap-3 sm:gap-4">
                                <div className="flex h-12 w-12 sm:h-16 sm:w-16 shrink-0 items-center justify-center rounded-xl sm:rounded-2xl bg-gradient-to-tr from-indigo-700 via-blue-600 to-indigo-500 shadow-lg shadow-indigo-200 text-white">
                                    <BarChart3 className="h-6 w-6 sm:h-8 sm:w-8" />
                                </div>
                                <div>
                                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                                        <h1 className="text-lg sm:text-2xl font-black tracking-tight text-slate-900">General Financial Reports</h1>
                                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] sm:text-[10px] font-bold text-emerald-800">
                                            <Sparkles className="h-2.5 w-2.5 sm:h-3 sm:w-3" /> Live Intelligence
                                        </span>
                                    </div>
                                    <p className="mt-0.5 text-[11px] sm:text-xs text-slate-500 line-clamp-2 sm:line-clamp-none">
                                        Holistic financial analytics spanning School Fees, Payroll, Incomes, Expenses, and Debtor Ledgers.
                                    </p>
                                </div>
                            </div>

                            {/* Action Buttons - Responsive 3-grid on mobile, flex on desktop */}
                            <div className="grid grid-cols-3 gap-1.5 sm:flex sm:flex-wrap sm:items-center sm:gap-2">
                                <button
                                    onClick={handlePrint}
                                    className="flex items-center justify-center gap-1 sm:gap-1.5 rounded-xl border border-slate-200 bg-white px-2.5 py-2 sm:px-3.5 sm:py-2 text-[11px] sm:text-xs font-bold text-slate-700 shadow-sm transition-all hover:bg-slate-50 active:scale-95 cursor-pointer"
                                    title="Clean Print Preview"
                                >
                                    <Printer className="h-3.5 w-3.5 text-slate-500" />
                                    <span>Print</span>
                                </button>
                                <button
                                    onClick={handleExportPDF}
                                    className="flex items-center justify-center gap-1 sm:gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-2.5 py-2 sm:px-3.5 sm:py-2 text-[11px] sm:text-xs font-bold text-rose-700 shadow-sm transition-all hover:bg-rose-100 active:scale-95 cursor-pointer"
                                    title="Download as PDF"
                                >
                                    <FileText className="h-3.5 w-3.5 text-rose-600" />
                                    <span>PDF</span>
                                </button>
                                <button
                                    onClick={handleExportExcel}
                                    className="flex items-center justify-center gap-1 sm:gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-2.5 py-2 sm:px-4 sm:py-2 text-[11px] sm:text-xs font-bold text-white shadow-md shadow-emerald-200 transition-all hover:from-emerald-700 hover:to-teal-700 active:scale-95 cursor-pointer"
                                    title="Download as Excel .xlsx"
                                >
                                    <Download className="h-3.5 w-3.5" />
                                    <span>Excel</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Executive KPI Summary Banner - Fully responsive 2-column mobile grid */}
                    {executiveSummary && (
                        <div className="mb-4 sm:mb-6 grid grid-cols-2 gap-2 sm:gap-3 sm:grid-cols-3 lg:grid-cols-5 no-print">
                            <div className="rounded-xl sm:rounded-2xl border border-slate-200/80 bg-white p-3 sm:p-4 shadow-sm">
                                <div className="flex items-center justify-between text-slate-400">
                                    <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider">Total Inflow</span>
                                    <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
                                </div>
                                <p className="mono mt-0.5 sm:mt-1 text-base sm:text-lg font-black text-slate-900">{fmtShort(executiveSummary.summary?.totalInflow)}</p>
                                <p className="text-[9px] sm:text-[10px] font-semibold text-emerald-600 mt-0.5 truncate">Fees + Incomes</p>
                            </div>

                            <div className="rounded-xl sm:rounded-2xl border border-slate-200/80 bg-white p-3 sm:p-4 shadow-sm">
                                <div className="flex items-center justify-between text-slate-400">
                                    <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider">Total Outflow</span>
                                    <TrendingDown className="h-3.5 w-3.5 text-rose-500" />
                                </div>
                                <p className="mono mt-0.5 sm:mt-1 text-base sm:text-lg font-black text-slate-900">{fmtShort(executiveSummary.summary?.totalOutflow)}</p>
                                <p className="text-[9px] sm:text-[10px] font-semibold text-rose-600 mt-0.5 truncate">Payroll + Expenses</p>
                            </div>

                            <div className="rounded-xl sm:rounded-2xl border border-slate-200/80 bg-white p-3 sm:p-4 shadow-sm">
                                <div className="flex items-center justify-between text-slate-400">
                                    <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider">Net Margin</span>
                                    <DollarSign className={`h-3.5 w-3.5 ${executiveSummary.summary?.netOperatingBalance >= 0 ? 'text-emerald-500' : 'text-rose-500'}`} />
                                </div>
                                <p className={`mono mt-0.5 sm:mt-1 text-base sm:text-lg font-black ${executiveSummary.summary?.netOperatingBalance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                    {fmtShort(executiveSummary.summary?.netOperatingBalance)}
                                </p>
                                <p className="text-[9px] sm:text-[10px] font-semibold text-slate-500 mt-0.5 truncate">
                                    {executiveSummary.summary?.netOperatingBalance >= 0 ? 'Operating Surplus' : 'Operating Deficit'}
                                </p>
                            </div>

                            <div className="rounded-xl sm:rounded-2xl border border-slate-200/80 bg-white p-3 sm:p-4 shadow-sm">
                                <div className="flex items-center justify-between text-slate-400">
                                    <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider">Collection Rate</span>
                                    <CheckCircle2 className="h-3.5 w-3.5 text-blue-500" />
                                </div>
                                <p className="mono mt-0.5 sm:mt-1 text-base sm:text-lg font-black text-blue-700">{executiveSummary.summary?.collectionRate || 0}%</p>
                                <p className="text-[9px] sm:text-[10px] font-semibold text-slate-500 mt-0.5 truncate">Of Invoiced Total</p>
                            </div>

                            <div className="col-span-2 sm:col-span-1 rounded-xl sm:rounded-2xl border border-rose-100 bg-rose-50/50 p-3 sm:p-4 shadow-sm">
                                <div className="flex items-center justify-between text-rose-400">
                                    <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-rose-700">Total Debtors</span>
                                    <ShieldAlert className="h-3.5 w-3.5 text-rose-600" />
                                </div>
                                <div className="flex sm:block items-baseline justify-between">
                                    <p className="mono mt-0.5 sm:mt-1 text-base sm:text-lg font-black text-rose-700">{fmtShort(executiveSummary.summary?.totalOutstanding)}</p>
                                    <p className="text-[9px] sm:text-[10px] font-semibold text-rose-600 mt-0.5">{executiveSummary.summary?.totalDebtorsCount} Unpaid Students</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Navigation Tabs - Touch-friendly smooth scroll on mobile */}
                    <div className="mb-4 sm:mb-6 -mx-3 px-3 sm:mx-0 sm:px-0 flex gap-1.5 sm:gap-2 overflow-x-auto pb-2 no-print no-scrollbar">
                        {TABS.map(tab => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => {
                                        setActiveTab(tab.id);
                                        setData(null);
                                    }}
                                    className={`flex shrink-0 items-center gap-1.5 sm:gap-2 rounded-xl sm:rounded-2xl px-3 py-2 sm:px-4 sm:py-2.5 text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                                        isActive
                                            ? 'bg-slate-900 text-white shadow-md shadow-slate-300'
                                            : 'border border-slate-200/80 bg-white text-slate-600 hover:bg-slate-50'
                                    }`}
                                >
                                    <Icon className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${isActive ? 'text-white' : tab.color}`} />
                                    <span className="hidden sm:inline">{tab.label}</span>
                                    <span className="inline sm:hidden">{tab.shortLabel}</span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Comprehensive Filter & Search Bar - Responsive */}
                    <div className="mb-4 sm:mb-6 rounded-2xl sm:rounded-3xl border border-slate-200/80 bg-white/90 p-3 sm:p-4 shadow-sm backdrop-blur-xl no-print">
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">

                            {/* Mobile Filter Toggle and Search Header */}
                            <div className="flex items-center gap-2">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="text"
                                        className="h-9 w-full rounded-xl border border-slate-200 bg-white pl-8 pr-3 text-xs font-medium text-slate-700 outline-none focus:border-indigo-500"
                                        placeholder="Search name, ID, reference..."
                                        value={searchQuery}
                                        onChange={e => setSearchQuery(e.target.value)}
                                    />
                                    {searchQuery && (
                                        <button
                                            onClick={() => setSearchQuery('')}
                                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                        >
                                            <X className="h-3.5 w-3.5" />
                                        </button>
                                    )}
                                </div>

                                <button
                                    onClick={() => setMobileFiltersOpen(o => !o)}
                                    className={`lg:hidden flex items-center gap-1.5 h-9 rounded-xl border px-3 text-xs font-bold transition-all cursor-pointer ${
                                        mobileFiltersOpen || activeFilterCount > 0
                                            ? 'border-indigo-300 bg-indigo-50 text-indigo-700'
                                            : 'border-slate-200 bg-white text-slate-700'
                                    }`}
                                >
                                    <SlidersHorizontal className="h-3.5 w-3.5" />
                                    <span>Filters</span>
                                    {activeFilterCount > 0 && (
                                        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-indigo-600 text-[9px] font-bold text-white">
                                            {activeFilterCount}
                                        </span>
                                    )}
                                </button>
                            </div>

                            {/* Filter Controls (Collapsible on mobile, always visible on lg) */}
                            <div className={`${mobileFiltersOpen ? 'flex' : 'hidden'} lg:flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100`}>
                                <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2">
                                    {/* Academic Session Filter */}
                                    <select
                                        className="h-8.5 rounded-xl border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 outline-none focus:border-indigo-500 cursor-pointer"
                                        value={filters.academicYear}
                                        onChange={e => setFilters(s => ({ ...s, academicYear: e.target.value }))}
                                    >
                                        <option value="">All Sessions</option>
                                        {metaSessions?.map((s: any) => (
                                            <option key={s.id} value={s.name}>{s.name} {s.isCurrent ? '(Current)' : ''}</option>
                                        ))}
                                    </select>

                                    {/* Academic Term Filter */}
                                    <select
                                        className="h-8.5 rounded-xl border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 outline-none focus:border-indigo-500 cursor-pointer"
                                        value={filters.term}
                                        onChange={e => setFilters(s => ({ ...s, term: e.target.value }))}
                                    >
                                        <option value="">All Terms</option>
                                        {metaTerms?.map((t: string) => (
                                            <option key={t} value={t}>{t}</option>
                                        ))}
                                    </select>

                                    {/* Month Filter */}
                                    <select
                                        className="h-8.5 rounded-xl border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 outline-none focus:border-indigo-500 cursor-pointer"
                                        value={filters.month}
                                        onChange={e => setFilters(s => ({ ...s, month: e.target.value }))}
                                    >
                                        <option value="">All Months</option>
                                        {MONTHS.map(m => (
                                            <option key={m.value} value={m.value}>{m.label}</option>
                                        ))}
                                    </select>

                                    {/* Status Filter (Tab specific) */}
                                    {(activeTab === 'bills' || activeTab === 'payroll') && (
                                        <select
                                            className="h-8.5 rounded-xl border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 outline-none focus:border-indigo-500 cursor-pointer"
                                            value={filters.status}
                                            onChange={e => setFilters(s => ({ ...s, status: e.target.value }))}
                                        >
                                            <option value="">All Statuses</option>
                                            {activeTab === 'bills' ? (
                                                ['OPEN', 'SENT', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'CANCELLED'].map(s => (
                                                    <option key={s} value={s}>{s.replace('_', ' ')}</option>
                                                ))
                                            ) : (
                                                ['draft', 'confirmed'].map(s => (
                                                    <option key={s} value={s}>{s.toUpperCase()}</option>
                                                ))
                                            )}
                                        </select>
                                    )}

                                    {/* Payment Method Filter */}
                                    {activeTab === 'payments' && (
                                        <select
                                            className="h-8.5 rounded-xl border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 outline-none focus:border-indigo-500 cursor-pointer"
                                            value={filters.method}
                                            onChange={e => setFilters(s => ({ ...s, method: e.target.value }))}
                                        >
                                            <option value="">All Gateways / Methods</option>
                                            {['FLUTTERWAVE', 'PAYSTACK', 'MONNIFY', 'BANK_TRANSFER', 'POS', 'CASH', 'WALLET'].map(m => (
                                                <option key={m} value={m}>{m.replace('_', ' ')}</option>
                                            ))}
                                        </select>
                                    )}
                                </div>

                                {/* Custom Date Range */}
                                <div className="flex items-center gap-1">
                                    <Input
                                        type="date"
                                        className="h-8.5 flex-1 sm:w-28 sm:flex-none rounded-xl border-slate-200 text-xs px-2"
                                        value={filters.from}
                                        onChange={e => setFilters(s => ({ ...s, from: e.target.value }))}
                                        title="From Date"
                                    />
                                    <span className="text-xs text-slate-400">-</span>
                                    <Input
                                        type="date"
                                        className="h-8.5 flex-1 sm:w-28 sm:flex-none rounded-xl border-slate-200 text-xs px-2"
                                        value={filters.to}
                                        onChange={e => setFilters(s => ({ ...s, to: e.target.value }))}
                                        title="To Date"
                                    />
                                </div>

                                {activeFilterCount > 0 && (
                                    <button
                                        onClick={clearFilters}
                                        className="h-8.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-500 hover:bg-slate-50 cursor-pointer"
                                    >
                                        Reset
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Main Report Container */}
                    <div id="printable-report" className="overflow-hidden rounded-2xl sm:rounded-3xl border border-slate-200/80 bg-white shadow-xl backdrop-blur-xl print:border-none print:shadow-none">

                        {/* Print Header */}
                        <div className="hidden print:block border-b border-slate-200 p-6 text-center">
                            <h2 className="text-2xl font-bold uppercase tracking-tight text-slate-900">{TABS.find(t => t.id === activeTab)?.label}</h2>
                            <p className="text-xs text-slate-500">Skooly Enterprise Financial Management System • {new Date().toLocaleString()}</p>
                            <p className="mt-1 text-xs font-semibold text-slate-700">
                                {filters.term || 'All Terms'} • {filters.academicYear || 'All Sessions'} {filters.month ? `• ${MONTHS.find(m => m.value === filters.month)?.label}` : ''}
                            </p>
                        </div>

                        {loading ? (
                            <div className="flex h-64 sm:h-72 flex-col items-center justify-center gap-3 no-print">
                                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                                <span className="text-xs font-bold text-slate-500">Compiling financial report...</span>
                            </div>
                        ) : !data ? (
                            <div className="flex h-64 items-center justify-center text-slate-400 no-print text-xs sm:text-sm">Select filters to view financial data</div>
                        ) : (
                            <div>
                                {/* ─── 1. EXECUTIVE OVERVIEW TAB ─── */}
                                {activeTab === 'executive' && (
                                    <div className="p-4 sm:p-6">
                                        <div className="mb-4 sm:mb-6 grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-3">
                                            {/* Revenue Streams */}
                                            <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4 sm:p-5">
                                                <h3 className="text-xs font-bold uppercase tracking-widest text-emerald-700 flex items-center gap-1.5 mb-3">
                                                    <TrendingUp className="h-4 w-4" /> Revenue Inflow Streams
                                                </h3>
                                                <div className="space-y-2.5 sm:space-y-3">
                                                    <div className="flex items-center justify-between rounded-xl bg-white p-3 border border-slate-100">
                                                        <span className="text-xs font-semibold text-slate-600">Student Tuition & Fees</span>
                                                        <span className="mono text-xs sm:text-sm font-bold text-slate-900">{fmt(data.summary?.totalFeeCollected)}</span>
                                                    </div>
                                                    <div className="flex items-center justify-between rounded-xl bg-white p-3 border border-slate-100">
                                                        <span className="text-xs font-semibold text-slate-600">Direct & Non-Fee Incomes</span>
                                                        <span className="mono text-xs sm:text-sm font-bold text-slate-900">{fmt(data.summary?.totalDirectIncome)}</span>
                                                    </div>
                                                    <div className="flex items-center justify-between rounded-xl bg-emerald-50 p-3 border border-emerald-100">
                                                        <span className="text-xs font-bold text-emerald-900">Total Inflow Volume</span>
                                                        <span className="mono text-xs sm:text-sm font-black text-emerald-700">{fmt(data.summary?.totalInflow)}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Expenditure Streams */}
                                            <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4 sm:p-5">
                                                <h3 className="text-xs font-bold uppercase tracking-widest text-rose-700 flex items-center gap-1.5 mb-3">
                                                    <TrendingDown className="h-4 w-4" /> Outflow & Expenses
                                                </h3>
                                                <div className="space-y-2.5 sm:space-y-3">
                                                    <div className="flex items-center justify-between rounded-xl bg-white p-3 border border-slate-100">
                                                        <span className="text-xs font-semibold text-slate-600">Staff Payroll (Salaries)</span>
                                                        <span className="mono text-xs sm:text-sm font-bold text-slate-900">{fmt(data.summary?.totalPayrollNet)}</span>
                                                    </div>
                                                    <div className="flex items-center justify-between rounded-xl bg-white p-3 border border-slate-100">
                                                        <span className="text-xs font-semibold text-slate-600">Operational Expenses</span>
                                                        <span className="mono text-xs sm:text-sm font-bold text-slate-900">{fmt(data.summary?.totalDirectExpenses)}</span>
                                                    </div>
                                                    <div className="flex items-center justify-between rounded-xl bg-rose-50 p-3 border border-rose-100">
                                                        <span className="text-xs font-bold text-rose-900">Total Outflow Volume</span>
                                                        <span className="mono text-xs sm:text-sm font-black text-rose-700">{fmt(data.summary?.totalOutflow)}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Net Operating Health */}
                                            <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4 sm:p-5">
                                                <h3 className="text-xs font-bold uppercase tracking-widest text-indigo-700 flex items-center gap-1.5 mb-3">
                                                    <BarChart3 className="h-4 w-4" /> Net Operating Balance
                                                </h3>
                                                <div className="rounded-2xl bg-white p-3.5 sm:p-4 border border-slate-100 text-center mb-3">
                                                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Net Surplus / Deficit</p>
                                                    <p className={`mono text-xl sm:text-2xl font-black mt-1 ${data.summary?.netOperatingBalance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                        {fmt(data.summary?.netOperatingBalance)}
                                                    </p>
                                                </div>
                                                <div className="grid grid-cols-2 gap-2 text-center">
                                                    <div className="bg-white p-2.5 rounded-xl border border-slate-100">
                                                        <p className="text-[9px] font-bold text-slate-400 uppercase">Collection Rate</p>
                                                        <p className="mono text-xs sm:text-sm font-bold text-blue-700">{data.summary?.collectionRate || 0}%</p>
                                                    </div>
                                                    <div className="bg-white p-2.5 rounded-xl border border-slate-100">
                                                        <p className="text-[9px] font-bold text-slate-400 uppercase">Debtors Bal</p>
                                                        <p className="mono text-xs sm:text-sm font-bold text-rose-600">{fmtShort(data.summary?.totalOutstanding)}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Breakdowns Grid */}
                                        <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-3">
                                            {/* Payment Gateway Distribution */}
                                            <div className="rounded-2xl border border-slate-100 p-4 bg-slate-50/30">
                                                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">Payment Methods</h4>
                                                <div className="space-y-2">
                                                    {data.breakdowns?.paymentMethods?.map((m: any) => (
                                                        <div key={m.method} className="flex items-center justify-between text-xs py-1.5 border-b border-slate-100/60 last:border-0">
                                                            <span className="font-semibold text-slate-700">{m.method.replace('_', ' ')}</span>
                                                            <div className="text-right">
                                                                <span className="mono font-bold text-slate-900">{fmt(m.amount)}</span>
                                                                <span className="text-[10px] text-slate-400 ml-1.5">({m.count})</span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Top Income Categories */}
                                            <div className="rounded-2xl border border-slate-100 p-4 bg-slate-50/30">
                                                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">Income Categories</h4>
                                                <div className="space-y-2">
                                                    {data.breakdowns?.incomeCategories?.map((c: any, i: number) => (
                                                        <div key={i} className="flex items-center justify-between text-xs py-1.5 border-b border-slate-100/60 last:border-0">
                                                            <span className="font-semibold text-slate-700">{c.name}</span>
                                                            <div className="text-right">
                                                                <span className="mono font-bold text-emerald-700">{fmt(c.amount)}</span>
                                                                <span className="text-[10px] text-slate-400 ml-1.5">({c.count})</span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                    {(!data.breakdowns?.incomeCategories || data.breakdowns.incomeCategories.length === 0) && (
                                                        <p className="text-xs text-slate-400 py-3 text-center">No category records</p>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Top Expense Categories */}
                                            <div className="rounded-2xl border border-slate-100 p-4 bg-slate-50/30">
                                                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">Expense Categories</h4>
                                                <div className="space-y-2">
                                                    {data.breakdowns?.expenseCategories?.map((c: any, i: number) => (
                                                        <div key={i} className="flex items-center justify-between text-xs py-1.5 border-b border-slate-100/60 last:border-0">
                                                            <span className="font-semibold text-slate-700">{c.name}</span>
                                                            <div className="text-right">
                                                                <span className="mono font-bold text-rose-600">{fmt(c.amount)}</span>
                                                                <span className="text-[10px] text-slate-400 ml-1.5">({c.count})</span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                    {(!data.breakdowns?.expenseCategories || data.breakdowns.expenseCategories.length === 0) && (
                                                        <p className="text-xs text-slate-400 py-3 text-center">No category records</p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* ─── 2. SCHOOL FEES & BILLS TAB ─── */}
                                {activeTab === 'bills' && data.invoices && (
                                    <>
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 border-b border-slate-100 bg-slate-50/50 p-4 sm:p-5">
                                            <div className="rounded-xl bg-white sm:bg-transparent p-3 sm:p-0 border sm:border-0 border-slate-100">
                                                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Total Invoiced Amount</p>
                                                <p className="mono text-xl sm:text-2xl font-black text-slate-900">{fmt(data.totals?.expected)}</p>
                                            </div>
                                            <div className="rounded-xl bg-white sm:bg-transparent p-3 sm:p-0 border sm:border-0 border-slate-100">
                                                <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600">Total Collected</p>
                                                <p className="mono text-xl sm:text-2xl font-black text-emerald-700">{fmt(data.totals?.collected)}</p>
                                            </div>
                                            <div className="rounded-xl bg-white sm:bg-transparent p-3 sm:p-0 border sm:border-0 border-slate-100">
                                                <p className="text-[10px] font-bold uppercase tracking-widest text-rose-600">Total Outstanding Due</p>
                                                <p className="mono text-xl sm:text-2xl font-black text-rose-600">{fmt(data.totals?.outstanding)}</p>
                                            </div>
                                        </div>

                                        {/* Mobile Card View */}
                                        <div className="block md:hidden divide-y divide-slate-100">
                                            {data.invoices.map((inv: any) => (
                                                <div key={inv.id} className="p-4 space-y-2.5">
                                                    <div className="flex items-center justify-between">
                                                        <span className="mono text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                                                            {inv.invoiceNumber}
                                                        </span>
                                                        <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                                            inv.status === 'PAID' ? 'bg-emerald-100 text-emerald-800' :
                                                            inv.status === 'PARTIALLY_PAID' ? 'bg-amber-100 text-amber-800' :
                                                            inv.status === 'OVERDUE' ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-700'
                                                        }`}>
                                                            {inv.status.replace('_', ' ')}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-slate-900">{inv.studentName}</p>
                                                        <p className="text-xs text-slate-500">{inv.className} • {inv.admissionNo}</p>
                                                    </div>
                                                    <div className="grid grid-cols-3 gap-2 rounded-xl bg-slate-50 p-2.5 text-center">
                                                        <div>
                                                            <span className="text-[9px] font-bold text-slate-400 uppercase">Total</span>
                                                            <p className="mono text-xs font-bold text-slate-800">{fmtShort(inv.totalAmount)}</p>
                                                        </div>
                                                        <div>
                                                            <span className="text-[9px] font-bold text-slate-400 uppercase">Paid</span>
                                                            <p className="mono text-xs font-bold text-emerald-600">{fmtShort(inv.amountPaid)}</p>
                                                        </div>
                                                        <div>
                                                            <span className="text-[9px] font-bold text-slate-400 uppercase">Balance</span>
                                                            <p className="mono text-xs font-bold text-rose-600">{fmtShort(inv.balanceDue)}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                                                        <span>Issued: {new Date(inv.createdAt).toLocaleDateString()}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Desktop Table View */}
                                        <div className="hidden md:block overflow-x-auto">
                                            <table className="w-full text-left text-xs">
                                                <thead className="border-b border-slate-100 bg-white text-slate-400">
                                                    <tr>
                                                        <th className="px-5 py-3.5 font-bold uppercase tracking-wider">Invoice #</th>
                                                        <th className="px-5 py-3.5 font-bold uppercase tracking-wider cursor-pointer hover:text-slate-700" onClick={() => handleSort('student')}>
                                                            <div className="flex items-center gap-1">Student <ArrowUpDown className="h-3 w-3" /></div>
                                                        </th>
                                                        <th className="px-5 py-3.5 font-bold uppercase tracking-wider cursor-pointer hover:text-slate-700" onClick={() => handleSort('class')}>
                                                            <div className="flex items-center gap-1">Class <ArrowUpDown className="h-3 w-3" /></div>
                                                        </th>
                                                        <th className="px-5 py-3.5 font-bold uppercase tracking-wider">Status</th>
                                                        <th className="px-5 py-3.5 font-bold uppercase tracking-wider cursor-pointer hover:text-slate-700 text-right" onClick={() => handleSort('amount')}>
                                                            <div className="flex items-center justify-end gap-1">Total <ArrowUpDown className="h-3 w-3" /></div>
                                                        </th>
                                                        <th className="px-5 py-3.5 font-bold uppercase tracking-wider cursor-pointer hover:text-slate-700 text-right" onClick={() => handleSort('paid')}>
                                                            <div className="flex items-center justify-end gap-1">Paid <ArrowUpDown className="h-3 w-3" /></div>
                                                        </th>
                                                        <th className="px-5 py-3.5 font-bold uppercase tracking-wider cursor-pointer hover:text-slate-700 text-right" onClick={() => handleSort('balance')}>
                                                            <div className="flex items-center justify-end gap-1">Balance <ArrowUpDown className="h-3 w-3" /></div>
                                                        </th>
                                                        <th className="px-5 py-3.5 font-bold uppercase tracking-wider cursor-pointer hover:text-slate-700" onClick={() => handleSort('date')}>
                                                            <div className="flex items-center gap-1">Date <ArrowUpDown className="h-3 w-3" /></div>
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-50">
                                                    {data.invoices.map((inv: any) => (
                                                        <tr key={inv.id} className="hover:bg-slate-50/60 transition-colors">
                                                            <td className="mono px-5 py-3 text-slate-600 font-semibold">{inv.invoiceNumber}</td>
                                                            <td className="px-5 py-3 font-bold text-slate-900">
                                                                <div>{inv.studentName}</div>
                                                                <div className="text-[10px] text-slate-400 font-normal">{inv.admissionNo}</div>
                                                            </td>
                                                            <td className="px-5 py-3 text-slate-600 font-medium">{inv.className}</td>
                                                            <td className="px-5 py-3">
                                                                <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                                                                    inv.status === 'PAID' ? 'bg-emerald-100 text-emerald-800' :
                                                                    inv.status === 'PARTIALLY_PAID' ? 'bg-amber-100 text-amber-800' :
                                                                    inv.status === 'OVERDUE' ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-700'
                                                                }`}>
                                                                    {inv.status.replace('_', ' ')}
                                                                </span>
                                                            </td>
                                                            <td className="mono px-5 py-3 text-right font-medium text-slate-800">{fmt(inv.totalAmount)}</td>
                                                            <td className="mono px-5 py-3 text-right font-bold text-emerald-700">{fmt(inv.amountPaid)}</td>
                                                            <td className="mono px-5 py-3 text-right font-black text-rose-600">{fmt(inv.balanceDue)}</td>
                                                            <td className="px-5 py-3 text-slate-500 whitespace-nowrap">{new Date(inv.createdAt).toLocaleDateString()}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </>
                                )}

                                {/* ─── 3. FEE COLLECTIONS TAB ─── */}
                                {activeTab === 'payments' && data.transactions && (
                                    <>
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 border-b border-slate-100 bg-slate-50/50 p-4 sm:p-5">
                                            {data.byMethod?.map((m: any) => (
                                                <div key={m.method} className="rounded-xl sm:rounded-2xl border border-slate-100 bg-white p-3 sm:p-3.5 shadow-sm">
                                                    <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-400 truncate">{m.method.replace('_', ' ')}</p>
                                                    <p className="mono mt-0.5 sm:mt-1 text-sm sm:text-base font-black text-slate-900">{fmtShort(m.total)}</p>
                                                    <p className="text-[9px] sm:text-[10px] text-slate-400 mt-0.5">{m.count} payments</p>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Mobile Card View */}
                                        <div className="block md:hidden divide-y divide-slate-100">
                                            {data.transactions.map((tx: any) => (
                                                <div key={tx.id} className="p-4 space-y-2.5">
                                                    <div className="flex items-center justify-between">
                                                        <span className="mono text-[11px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md truncate max-w-[180px]">
                                                            {tx.reference}
                                                        </span>
                                                        <span className="inline-flex rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800">
                                                            {tx.method}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <p className="text-sm font-bold text-slate-900">{tx.studentName}</p>
                                                            <p className="text-xs text-slate-500">{tx.className}</p>
                                                        </div>
                                                        <p className="mono text-base font-black text-emerald-700">{fmt(tx.amount)}</p>
                                                    </div>
                                                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-50">
                                                        <span className="mono">Receipt: {tx.receiptNumber || '—'}</span>
                                                        <span>{new Date(tx.paidAt).toLocaleDateString()}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Desktop Table View */}
                                        <div className="hidden md:block overflow-x-auto">
                                            <table className="w-full text-left text-xs">
                                                <thead className="border-b border-slate-100 bg-white text-slate-400">
                                                    <tr>
                                                        <th className="px-5 py-3.5 font-bold uppercase tracking-wider">Reference</th>
                                                        <th className="px-5 py-3.5 font-bold uppercase tracking-wider cursor-pointer hover:text-slate-700" onClick={() => handleSort('student')}>
                                                            <div className="flex items-center gap-1">Student <ArrowUpDown className="h-3 w-3" /></div>
                                                        </th>
                                                        <th className="px-5 py-3.5 font-bold uppercase tracking-wider">Class</th>
                                                        <th className="px-5 py-3.5 font-bold uppercase tracking-wider cursor-pointer hover:text-slate-700" onClick={() => handleSort('method')}>
                                                            <div className="flex items-center gap-1">Method <ArrowUpDown className="h-3 w-3" /></div>
                                                        </th>
                                                        <th className="px-5 py-3.5 font-bold uppercase tracking-wider">Receipt #</th>
                                                        <th className="px-5 py-3.5 font-bold uppercase tracking-wider cursor-pointer hover:text-slate-700 text-right" onClick={() => handleSort('amount')}>
                                                            <div className="flex items-center justify-end gap-1">Amount <ArrowUpDown className="h-3 w-3" /></div>
                                                        </th>
                                                        <th className="px-5 py-3.5 font-bold uppercase tracking-wider cursor-pointer hover:text-slate-700" onClick={() => handleSort('date')}>
                                                            <div className="flex items-center gap-1">Paid Date <ArrowUpDown className="h-3 w-3" /></div>
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-50">
                                                    {data.transactions.map((tx: any) => (
                                                        <tr key={tx.id} className="hover:bg-slate-50/60 transition-colors">
                                                            <td className="mono px-5 py-3 text-slate-600 font-semibold">{tx.reference}</td>
                                                            <td className="px-5 py-3 font-bold text-slate-900">{tx.studentName}</td>
                                                            <td className="px-5 py-3 text-slate-600">{tx.className}</td>
                                                            <td className="px-5 py-3">
                                                                <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-slate-700">
                                                                    {tx.method}
                                                                </span>
                                                            </td>
                                                            <td className="mono px-5 py-3 text-slate-600">{tx.receiptNumber}</td>
                                                            <td className="mono px-5 py-3 text-right font-black text-emerald-700">{fmt(tx.amount)}</td>
                                                            <td className="px-5 py-3 text-slate-500 whitespace-nowrap">{new Date(tx.paidAt).toLocaleDateString()}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </>
                                )}

                                {/* ─── 4. DEBTORS LEDGER TAB ─── */}
                                {activeTab === 'outstanding' && data.students && (
                                    <>
                                        <div className="flex items-center justify-between border-b border-rose-100 bg-rose-50/60 p-4 sm:p-5">
                                            <div>
                                                <p className="text-[10px] font-bold uppercase tracking-widest text-rose-700">Outstanding Debtors Total</p>
                                                <p className="mono text-xl sm:text-2xl font-black text-rose-700">{fmt(data.totalOutstanding)}</p>
                                            </div>
                                            <div className="rounded-xl sm:rounded-2xl bg-white px-3 py-1.5 sm:px-4 sm:py-2 border border-rose-200 shadow-sm text-right">
                                                <span className="mono text-base sm:text-lg font-black text-rose-600">{data.count}</span>
                                                <p className="text-[9px] sm:text-[10px] font-semibold text-slate-500 uppercase">Debtors</p>
                                            </div>
                                        </div>

                                        {/* Mobile Card View */}
                                        <div className="block md:hidden divide-y divide-slate-100">
                                            {data.students.map((s: any) => (
                                                <div key={s.invoiceId} className="p-4 space-y-2.5">
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <p className="text-sm font-bold text-slate-900">{s.studentName}</p>
                                                            <p className="text-xs text-slate-500">{s.className} • {s.admissionNo}</p>
                                                        </div>
                                                        <div className="text-right">
                                                            <span className="text-[9px] font-bold text-rose-500 uppercase block">Balance Due</span>
                                                            <span className="mono text-sm font-black text-rose-600">{fmt(s.balanceDue)}</span>
                                                        </div>
                                                    </div>
                                                    <div className="rounded-xl bg-slate-50 p-2.5 flex items-center justify-between text-xs">
                                                        <div className="truncate pr-2">
                                                            <span className="text-[9px] text-slate-400 font-bold uppercase block">Parent</span>
                                                            <span className="font-semibold text-slate-700">{s.parentName}</span>
                                                        </div>
                                                        {s.parentPhone && s.parentPhone !== '—' ? (
                                                            <a
                                                                href={`tel:${s.parentPhone}`}
                                                                className="flex items-center gap-1 text-[11px] font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-lg shrink-0"
                                                            >
                                                                <Phone className="h-3 w-3" />
                                                                <span>{s.parentPhone}</span>
                                                            </a>
                                                        ) : (
                                                            <span className="text-slate-400 text-[11px]">No phone</span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                                                        <span className="mono">Invoice: {s.invoiceNumber}</span>
                                                        <span>Paid: {fmtShort(s.amountPaid)} / {fmtShort(s.totalAmount)}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Desktop Table View */}
                                        <div className="hidden md:block overflow-x-auto">
                                            <table className="w-full text-left text-xs">
                                                <thead className="border-b border-slate-100 bg-white text-slate-400">
                                                    <tr>
                                                        <th className="px-5 py-3.5 font-bold uppercase tracking-wider cursor-pointer hover:text-slate-700" onClick={() => handleSort('name')}>
                                                            <div className="flex items-center gap-1">Student <ArrowUpDown className="h-3 w-3" /></div>
                                                        </th>
                                                        <th className="px-5 py-3.5 font-bold uppercase tracking-wider">Class</th>
                                                        <th className="px-5 py-3.5 font-bold uppercase tracking-wider">Parent Contact</th>
                                                        <th className="px-5 py-3.5 font-bold uppercase tracking-wider">Invoice #</th>
                                                        <th className="px-5 py-3.5 font-bold uppercase tracking-wider text-right">Expected</th>
                                                        <th className="px-5 py-3.5 font-bold uppercase tracking-wider text-right">Paid</th>
                                                        <th className="px-5 py-3.5 font-bold uppercase tracking-wider cursor-pointer hover:text-slate-700 text-right" onClick={() => handleSort('balance')}>
                                                            <div className="flex items-center justify-end gap-1">Balance Due <ArrowUpDown className="h-3 w-3" /></div>
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-50">
                                                    {data.students.map((s: any) => (
                                                        <tr key={s.invoiceId} className="hover:bg-slate-50/60 transition-colors">
                                                            <td className="px-5 py-3 font-bold text-slate-900">
                                                                <div>{s.studentName}</div>
                                                                <div className="text-[10px] text-slate-400 font-normal">{s.admissionNo}</div>
                                                            </td>
                                                            <td className="px-5 py-3 text-slate-600 font-medium">{s.className}</td>
                                                            <td className="px-5 py-3 text-slate-700">
                                                                <div className="font-semibold">{s.parentName}</div>
                                                                <div className="mono text-[10px] text-slate-500">{s.parentPhone}</div>
                                                            </td>
                                                            <td className="mono px-5 py-3 text-slate-600">{s.invoiceNumber}</td>
                                                            <td className="mono px-5 py-3 text-right text-slate-700 font-medium">{fmt(s.totalAmount)}</td>
                                                            <td className="mono px-5 py-3 text-right text-emerald-700 font-bold">{fmt(s.amountPaid)}</td>
                                                            <td className="mono px-5 py-3 text-right font-black text-rose-600">{fmt(s.balanceDue)}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </>
                                )}

                                {/* ─── 5. STAFF PAYROLL TAB ─── */}
                                {activeTab === 'payroll' && data.records && (
                                    <>
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 border-b border-slate-100 bg-slate-50/50 p-4 sm:p-5">
                                            <div className="rounded-xl bg-white sm:bg-transparent p-3 sm:p-0 border sm:border-0 border-slate-100">
                                                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Gross Salary Volume</p>
                                                <p className="mono text-xl sm:text-2xl font-black text-slate-900">{fmt(data.totalGross)}</p>
                                            </div>
                                            <div className="rounded-xl bg-white sm:bg-transparent p-3 sm:p-0 border sm:border-0 border-slate-100">
                                                <p className="text-[10px] font-bold uppercase tracking-widest text-amber-600">Total Deductions</p>
                                                <p className="mono text-xl sm:text-2xl font-black text-amber-700">{fmt(data.totalDeductions)}</p>
                                            </div>
                                            <div className="rounded-xl bg-white sm:bg-transparent p-3 sm:p-0 border sm:border-0 border-slate-100">
                                                <p className="text-[10px] font-bold uppercase tracking-widest text-violet-600">Net Salary Disbursed</p>
                                                <p className="mono text-xl sm:text-2xl font-black text-violet-700">{fmt(data.totalNet)}</p>
                                            </div>
                                        </div>

                                        {/* Mobile Card View */}
                                        <div className="block md:hidden divide-y divide-slate-100">
                                            {data.records.map((p: any) => (
                                                <div key={p.id} className="p-4 space-y-2.5">
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <p className="text-sm font-bold text-slate-900">{p.staffName}</p>
                                                            <p className="text-xs text-slate-500">{p.department} • <span className="mono">{p.employeeId}</span></p>
                                                        </div>
                                                        <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                                            p.status === 'confirmed' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                                                        }`}>
                                                            {p.status.toUpperCase()}
                                                        </span>
                                                    </div>
                                                    <div className="grid grid-cols-3 gap-2 rounded-xl bg-slate-50 p-2.5 text-center">
                                                        <div>
                                                            <span className="text-[9px] font-bold text-slate-400 uppercase">Gross</span>
                                                            <p className="mono text-xs font-bold text-slate-700">{fmtShort(p.gross)}</p>
                                                        </div>
                                                        <div>
                                                            <span className="text-[9px] font-bold text-slate-400 uppercase">Deduct</span>
                                                            <p className="mono text-xs font-bold text-rose-600">-{fmtShort(p.deductions)}</p>
                                                        </div>
                                                        <div>
                                                            <span className="text-[9px] font-bold text-slate-400 uppercase">Net Pay</span>
                                                            <p className="mono text-xs font-black text-violet-700">{fmtShort(p.net)}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                                                        <span>Period: {MONTHS.find(m => m.value === String(p.month))?.label || p.month} {p.year}</span>
                                                        <span>Run: {new Date(p.runDate).toLocaleDateString()}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Desktop Table View */}
                                        <div className="hidden md:block overflow-x-auto">
                                            <table className="w-full text-left text-xs">
                                                <thead className="border-b border-slate-100 bg-white text-slate-400">
                                                    <tr>
                                                        <th className="px-5 py-3.5 font-bold uppercase tracking-wider cursor-pointer hover:text-slate-700" onClick={() => handleSort('staff')}>
                                                            <div className="flex items-center gap-1">Staff Member <ArrowUpDown className="h-3 w-3" /></div>
                                                        </th>
                                                        <th className="px-5 py-3.5 font-bold uppercase tracking-wider cursor-pointer hover:text-slate-700" onClick={() => handleSort('department')}>
                                                            <div className="flex items-center gap-1">Department <ArrowUpDown className="h-3 w-3" /></div>
                                                        </th>
                                                        <th className="px-5 py-3.5 font-bold uppercase tracking-wider">Period</th>
                                                        <th className="px-5 py-3.5 font-bold uppercase tracking-wider">Status</th>
                                                        <th className="px-5 py-3.5 font-bold uppercase tracking-wider cursor-pointer hover:text-slate-700 text-right" onClick={() => handleSort('gross')}>
                                                            <div className="flex items-center justify-end gap-1">Gross <ArrowUpDown className="h-3 w-3" /></div>
                                                        </th>
                                                        <th className="px-5 py-3.5 font-bold uppercase tracking-wider cursor-pointer hover:text-slate-700 text-right" onClick={() => handleSort('deductions')}>
                                                            <div className="flex items-center justify-end gap-1">Deductions <ArrowUpDown className="h-3 w-3" /></div>
                                                        </th>
                                                        <th className="px-5 py-3.5 font-bold uppercase tracking-wider cursor-pointer hover:text-slate-700 text-right" onClick={() => handleSort('net')}>
                                                            <div className="flex items-center justify-end gap-1">Net Pay <ArrowUpDown className="h-3 w-3" /></div>
                                                        </th>
                                                        <th className="px-5 py-3.5 font-bold uppercase tracking-wider cursor-pointer hover:text-slate-700" onClick={() => handleSort('date')}>
                                                            <div className="flex items-center gap-1">Run Date <ArrowUpDown className="h-3 w-3" /></div>
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-50">
                                                    {data.records.map((p: any) => (
                                                        <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                                                            <td className="px-5 py-3 font-bold text-slate-900">
                                                                <div>{p.staffName}</div>
                                                                <div className="mono text-[10px] text-slate-400 font-normal">{p.employeeId}</div>
                                                            </td>
                                                            <td className="px-5 py-3 text-slate-600 font-medium">{p.department}</td>
                                                            <td className="px-5 py-3 mono font-semibold text-slate-700">
                                                                {MONTHS.find(m => m.value === String(p.month))?.label || p.month} {p.year}
                                                            </td>
                                                            <td className="px-5 py-3">
                                                                <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                                                                    p.status === 'confirmed' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                                                                }`}>
                                                                    {p.status.toUpperCase()}
                                                                </span>
                                                            </td>
                                                            <td className="mono px-5 py-3 text-right font-medium text-slate-700">{fmt(p.gross)}</td>
                                                            <td className="mono px-5 py-3 text-right font-semibold text-rose-600">-{fmt(p.deductions)}</td>
                                                            <td className="mono px-5 py-3 text-right font-black text-violet-700">{fmt(p.net)}</td>
                                                            <td className="px-5 py-3 text-slate-500 whitespace-nowrap">{new Date(p.runDate).toLocaleDateString()}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </>
                                )}

                                {/* ─── 6 & 7. INCOME / EXPENSE LEDGER TAB ─── */}
                                {(activeTab === 'income' || activeTab === 'expenses') && data.records && (
                                    <>
                                        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 p-4 sm:p-5">
                                            <div>
                                                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                                                    {activeTab === 'income' ? 'Total Non-Fee Incomes' : 'Total Operating Expenses'}
                                                </p>
                                                <p className={`mono text-xl sm:text-2xl font-black ${activeTab === 'income' ? 'text-teal-700' : 'text-amber-700'}`}>
                                                    {fmt(activeTab === 'income' ? data.totalIncome : data.totalExpense)}
                                                </p>
                                            </div>
                                            <div className="rounded-xl sm:rounded-2xl bg-white px-3 py-1.5 sm:px-4 sm:py-2 border border-slate-200 shadow-sm text-right">
                                                <span className="mono text-base sm:text-lg font-black text-slate-800">{data.totalRecords}</span>
                                                <p className="text-[9px] sm:text-[10px] font-semibold text-slate-500 uppercase">Records</p>
                                            </div>
                                        </div>

                                        {/* Mobile Card View */}
                                        <div className="block md:hidden divide-y divide-slate-100">
                                            {data.records.map((r: any) => (
                                                <div key={r.id} className="p-4 space-y-2">
                                                    <div className="flex items-center justify-between">
                                                        <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-slate-800">
                                                            {r.category?.name || 'Uncategorized'}
                                                        </span>
                                                        <span className={`mono text-base font-black ${
                                                            activeTab === 'income' ? 'text-teal-700' : 'text-amber-700'
                                                        }`}>
                                                            {fmt(r.amount)}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs font-semibold text-slate-800">{r.description}</p>
                                                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                                                        <div className="flex items-center gap-1.5">
                                                            <span className={`inline-flex rounded px-1.5 py-0.2 text-[9px] font-bold ${
                                                                r.source === 'AUTO' ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-100 text-slate-600'
                                                            }`}>
                                                                {r.source}
                                                            </span>
                                                            <span className="mono">{r.referenceId || '—'}</span>
                                                        </div>
                                                        <span>{new Date(r.date).toLocaleDateString()}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Desktop Table View */}
                                        <div className="hidden md:block overflow-x-auto">
                                            <table className="w-full text-left text-xs">
                                                <thead className="border-b border-slate-100 bg-white text-slate-400">
                                                    <tr>
                                                        <th className="px-5 py-3.5 font-bold uppercase tracking-wider cursor-pointer hover:text-slate-700" onClick={() => handleSort('date')}>
                                                            <div className="flex items-center gap-1">Date <ArrowUpDown className="h-3 w-3" /></div>
                                                        </th>
                                                        <th className="px-5 py-3.5 font-bold uppercase tracking-wider cursor-pointer hover:text-slate-700" onClick={() => handleSort('category')}>
                                                            <div className="flex items-center gap-1">Category <ArrowUpDown className="h-3 w-3" /></div>
                                                        </th>
                                                        <th className="px-5 py-3.5 font-bold uppercase tracking-wider cursor-pointer hover:text-slate-700" onClick={() => handleSort('description')}>
                                                            <div className="flex items-center gap-1">Description <ArrowUpDown className="h-3 w-3" /></div>
                                                        </th>
                                                        <th className="px-5 py-3.5 font-bold uppercase tracking-wider">Source</th>
                                                        <th className="px-5 py-3.5 font-bold uppercase tracking-wider">Reference</th>
                                                        <th className="px-5 py-3.5 font-bold uppercase tracking-wider cursor-pointer hover:text-slate-700 text-right" onClick={() => handleSort('amount')}>
                                                            <div className="flex items-center justify-end gap-1">Amount <ArrowUpDown className="h-3 w-3" /></div>
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-50">
                                                    {data.records.map((r: any) => (
                                                        <tr key={r.id} className="hover:bg-slate-50/60 transition-colors">
                                                            <td className="px-5 py-3 font-semibold text-slate-700 whitespace-nowrap">{new Date(r.date).toLocaleDateString()}</td>
                                                            <td className="px-5 py-3">
                                                                <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-slate-800">
                                                                    {r.category?.name || 'Uncategorized'}
                                                                </span>
                                                            </td>
                                                            <td className="px-5 py-3 font-medium text-slate-900">{r.description}</td>
                                                            <td className="px-5 py-3">
                                                                <span className={`inline-flex rounded-md px-2 py-0.5 text-[9px] font-bold ${
                                                                    r.source === 'AUTO' ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-100 text-slate-600'
                                                                }`}>
                                                                    {r.source}
                                                                </span>
                                                            </td>
                                                            <td className="mono px-5 py-3 text-slate-500">{r.referenceId || '—'}</td>
                                                            <td className={`mono px-5 py-3 text-right font-black ${
                                                                activeTab === 'income' ? 'text-teal-700' : 'text-amber-700'
                                                            }`}>
                                                                {fmt(r.amount)}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </>
                                )}

                                {/* Empty State */}
                                {((activeTab === 'bills' && data.invoices?.length === 0) ||
                                    (activeTab === 'payments' && data.transactions?.length === 0) ||
                                    (activeTab === 'outstanding' && data.students?.length === 0) ||
                                    (activeTab === 'payroll' && data.records?.length === 0) ||
                                    ((activeTab === 'income' || activeTab === 'expenses') && data.records?.length === 0)) && (
                                    <div className="py-16 sm:py-20 text-center text-slate-500 font-semibold no-print text-xs sm:text-sm">
                                        No financial records found matching the active filter criteria.
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
