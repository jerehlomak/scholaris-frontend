import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wallet,
  Receipt,
  PiggyBank,
  Banknote,
  Calendar,
  Download,
  Printer,
  ChevronRight,
  TrendingUp,
  ShieldCheck,
  CreditCard,
  Building2,
  CheckCircle2,
  FileText,
  Clock,
  Eye,
  X,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  Layers,
  Loader2,
  Landmark,
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Separator } from '../../components/ui/separator';
import { PayslipDocument } from '../../components/payroll/PayslipDocument';
import type { PayslipData } from '../../components/payroll/PayslipDocument';
import { mobileSafePrint } from '../../lib/printUtils';
import { cn } from '../../lib/utils';

function fmt(n: number) {
  return '₦' + (n || 0).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function TeacherPayroll() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'payslips' | 'pension' | 'loans'>('overview');
  const [selectedPayslip, setSelectedPayslip] = useState<PayslipData | null>(null);
  const [showPayslipModal, setShowPayslipModal] = useState(false);

  useEffect(() => {
    fetchPayrollData();
  }, []);

  const fetchPayrollData = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/v1/payroll/me', { withCredentials: true });
      setData(res.data);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to load payroll details');
    } finally {
      setLoading(false);
    }
  };

  const openPayslipModal = (item: any) => {
    if (!data) return;
    const payslipObj: PayslipData = {
      period: {
        month: item.month,
        year: item.year,
        label: item.periodLabel,
      },
      staff: data.teacher,
      school: data.school,
      earningsBreakdown: item.earningsBreakdown || [],
      deductionsBreakdown: item.deductionsBreakdown || [],
      gross: item.gross,
      totalDeductions: item.totalDeductions,
      net: item.net,
      status: item.status,
      outstandingLoan: data.loans?.totalOutstanding,
      totalPensionAccumulated: data.pension?.totalAccumulated,
    };
    setSelectedPayslip(payslipObj);
    setShowPayslipModal(true);
  };

  const printStatement = (elementId: string) => {
    mobileSafePrint(elementId);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <p className="text-sm font-medium text-slate-500">Loading payroll and payslip records…</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-16">
        <AlertCircle className="h-10 w-10 text-amber-500 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-slate-800">Payroll Records Unavailable</h3>
        <p className="text-sm text-slate-500 mt-1">
          Your profile is not yet linked to active payroll records. Contact the school bursar or administrator.
        </p>
      </div>
    );
  }

  const { teacher, school, salaryStructure, payslips = [], pension, loans } = data;

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 pb-16">
      {/* ── Header Hero ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950 to-blue-900 p-6 text-white shadow-xl">
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: 'radial-gradient(circle at 80% 20%, white 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 text-[11px] font-bold uppercase tracking-wider">
                Staff Self-Service
              </span>
              <span className="text-xs text-blue-200">ID: {teacher.employeeId || 'N/A'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              My Payroll & Payslips
            </h1>
            <p className="mt-1 text-sm text-blue-200/90 max-w-xl">
              View your monthly compensation details, download stamped payslips, track accumulated pensions, and inspect active loan deduction records.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="rounded-xl bg-white/10 backdrop-blur-md px-5 py-3 border border-white/15 text-right">
              <p className="text-[10px] font-bold uppercase tracking-widest text-blue-200">Monthly Net Pay</p>
              <p className="text-2xl sm:text-3xl font-black font-mono text-emerald-400">
                {fmt(salaryStructure?.net || 0)}
              </p>
              <p className="text-[11px] text-blue-200 mt-0.5">
                Gross: {fmt(salaryStructure?.gross || 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── KPI Summary Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border border-slate-200 shadow-sm bg-white hover:shadow-md transition-shadow">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
              <Wallet size={20} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-500">Gross Monthly</p>
              <p className="text-lg sm:text-xl font-bold font-mono text-slate-900 truncate">
                {fmt(salaryStructure?.gross || 0)}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-200 shadow-sm bg-white hover:shadow-md transition-shadow">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
              <Receipt size={20} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-500">Payslips Issued</p>
              <p className="text-lg sm:text-xl font-bold font-mono text-slate-900">
                {payslips.length} <span className="text-xs font-normal text-slate-400">Records</span>
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-200 shadow-sm bg-white hover:shadow-md transition-shadow">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0 border border-teal-100">
              <PiggyBank size={20} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-500">Total Pension</p>
              <p className="text-lg sm:text-xl font-bold font-mono text-teal-700 truncate">
                {fmt(pension?.totalAccumulated || 0)}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-200 shadow-sm bg-white hover:shadow-md transition-shadow">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-100">
              <Banknote size={20} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-500">Active Loan Balance</p>
              <p className="text-lg sm:text-xl font-bold font-mono text-rose-700 truncate">
                {fmt(loans?.totalOutstanding || 0)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Navigation Tabs ── */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-1 overflow-x-auto">
        {[
          { id: 'overview', label: 'Salary Structure', icon: Layers },
          { id: 'payslips', label: `My Payslips (${payslips.length})`, icon: Receipt },
          { id: 'pension', label: 'Pension Ledger', icon: ShieldCheck },
          { id: 'loans', label: 'Loan Repayments', icon: Banknote },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap',
              activeTab === tab.id
                ? 'bg-blue-600 text-white shadow-sm shadow-blue-200'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            )}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── TAB 1: OVERVIEW / SALARY STRUCTURE ── */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Bank Details Card */}
            <Card className="bg-white border border-slate-200 shadow-sm md:col-span-1">
              <CardHeader className="pb-3 border-b border-slate-100">
                <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <Landmark className="h-4 w-4 text-blue-600" />
                  Direct Deposit Account
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-3.5 text-xs">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                    Bank Name
                  </span>
                  <p className="text-sm font-bold text-slate-800">{teacher.bankName || 'Not configured'}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                    Account Number
                  </span>
                  <p className="text-sm font-mono font-bold text-blue-700 tracking-wider">
                    {teacher.accountNumber || 'Not configured'}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                    Account Name
                  </span>
                  <p className="text-sm font-semibold text-slate-800">{teacher.accountName || teacher.name}</p>
                </div>
                <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-400">
                  To update your bank details, please contact the administration office.
                </div>
              </CardContent>
            </Card>

            {/* Earnings & Deductions Breakdown */}
            <div className="md:col-span-2 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Earnings */}
                <Card className="border border-emerald-200/80 bg-white shadow-sm overflow-hidden">
                  <div className="bg-emerald-600 px-4 py-2.5 text-white flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider">Earnings / Allowances</span>
                    <span className="text-xs font-mono font-bold">{fmt(salaryStructure?.gross || 0)}</span>
                  </div>
                  <div className="p-4 divide-y divide-slate-100">
                    {salaryStructure?.earnings && salaryStructure.earnings.length > 0 ? (
                      salaryStructure.earnings.map((item: any) => (
                        <div key={item.id} className="py-2.5 flex items-center justify-between text-xs">
                          <span className="font-semibold text-slate-700">{item.itemName}</span>
                          <span className="font-mono font-bold text-emerald-700">{fmt(item.amount)}</span>
                        </div>
                      ))
                    ) : (
                      <p className="py-4 text-center text-xs text-slate-400">No earnings items registered</p>
                    )}
                  </div>
                </Card>

                {/* Deductions */}
                <Card className="border border-rose-200/80 bg-white shadow-sm overflow-hidden">
                  <div className="bg-rose-600 px-4 py-2.5 text-white flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider">Recurring Deductions</span>
                    <span className="text-xs font-mono font-bold">{fmt(salaryStructure?.totalDeductions || 0)}</span>
                  </div>
                  <div className="p-4 divide-y divide-slate-100">
                    {salaryStructure?.deductions && salaryStructure.deductions.length > 0 ? (
                      salaryStructure.deductions.map((item: any) => (
                        <div key={item.id} className="py-2.5 flex items-center justify-between text-xs">
                          <span className="font-semibold text-slate-700">{item.itemName}</span>
                          <span className="font-mono font-bold text-rose-700">{fmt(item.amount)}</span>
                        </div>
                      ))
                    ) : (
                      <p className="py-4 text-center text-xs text-slate-400">No recurring deductions configured</p>
                    )}
                  </div>
                </Card>
              </div>

              {/* Latest Payslip Quick Card */}
              {payslips.length > 0 && (
                <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/60 shadow-sm p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
                        <Receipt size={20} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-blue-950">Latest Stamped Payslip: {payslips[0].periodLabel}</p>
                        <p className="text-xs text-blue-700 mt-0.5">
                          Net Disbursed: <span className="font-mono font-bold">{fmt(payslips[0].net)}</span> • Issued on {fmtDate(payslips[0].runDate)}
                        </p>
                      </div>
                    </div>
                    <Button
                      onClick={() => openPayslipModal(payslips[0])}
                      size="sm"
                      className="gap-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 text-xs font-semibold"
                    >
                      <Eye size={14} /> View & Print
                    </Button>
                  </div>
                </Card>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: MY PAYSLIPS & HISTORY ── */}
      {activeTab === 'payslips' && (
        <Card className="bg-white border border-slate-200 shadow-sm overflow-hidden">
          <CardHeader className="p-5 border-b border-slate-100 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold text-slate-800">Monthly Payslip Archive</CardTitle>
              <p className="text-xs text-slate-500 mt-0.5">
                All confirmed salary disbursements issued by the school. Click any month to view and print.
              </p>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {payslips.length === 0 ? (
              <div className="py-16 text-center text-slate-400">
                <Receipt className="h-10 w-10 mx-auto mb-2 opacity-40 text-slate-400" />
                <p className="font-semibold text-slate-600">No payslips have been confirmed yet</p>
                <p className="text-xs mt-1 text-slate-400">
                  When the bursar confirms the monthly payroll, your official stamped slip will automatically appear here.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/80 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-3 px-4">Period</th>
                      <th className="py-3 px-4">Gross Earnings</th>
                      <th className="py-3 px-4">Deductions</th>
                      <th className="py-3 px-4">Net Pay</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {payslips.map((slip: any) => (
                      <tr key={slip.id} className="hover:bg-blue-50/40 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-slate-800 flex items-center gap-2">
                          <Calendar className="h-3.5 w-3.5 text-blue-500" />
                          {slip.periodLabel}
                        </td>
                        <td className="py-3.5 px-4 font-mono font-semibold text-slate-700">
                          {fmt(slip.gross)}
                        </td>
                        <td className="py-3.5 px-4 font-mono font-semibold text-rose-600">
                          {fmt(slip.totalDeductions)}
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-emerald-700 text-sm">
                          {fmt(slip.net)}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            <CheckCircle2 className="h-3 w-3" /> Paid
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <Button
                            onClick={() => openPayslipModal(slip)}
                            size="sm"
                            variant="outline"
                            className="h-8 gap-1.5 text-xs font-semibold text-blue-700 border-blue-200 hover:bg-blue-50"
                          >
                            <Eye size={13} /> View Payslip
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── TAB 3: PENSION ACCUMULATION TRACKER ── */}
      {activeTab === 'pension' && (
        <div className="space-y-6">
          {/* Hero Banner */}
          <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-teal-700 to-emerald-800 p-6 text-white shadow-lg">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-teal-200 block mb-1">
                  Pension Fund Balance
                </span>
                <p className="text-3xl sm:text-4xl font-black font-mono tracking-tight">
                  {fmt(pension?.totalAccumulated || 0)}
                </p>
                <p className="text-xs text-teal-100 mt-1">
                  Accumulated across {pension?.entries?.length || 0} recorded contribution periods.
                </p>
              </div>
              <Button
                onClick={() => printStatement('pension-statement-print')}
                className="gap-2 bg-white/20 hover:bg-white/30 text-white border border-white/30 rounded-xl text-xs font-semibold"
              >
                <Printer size={15} /> Print Statement
              </Button>
            </div>
          </div>

          {/* Printable Statement Canvas */}
          <Card id="pension-statement-print" className="bg-white border border-slate-200 shadow-sm overflow-hidden p-6">
            <div className="border-b border-slate-100 pb-4 mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Pension Ledger Statement</h3>
                <p className="text-xs text-slate-500">Staff: {teacher.name} ({teacher.employeeId || 'ID N/A'})</p>
              </div>
              <span className="text-xs font-mono font-bold text-teal-700 bg-teal-50 border border-teal-200 px-3 py-1 rounded-lg">
                Total: {fmt(pension?.totalAccumulated || 0)}
              </span>
            </div>

            {(!pension?.entries || pension.entries.length === 0) ? (
              <div className="py-12 text-center text-slate-400">
                <PiggyBank className="h-10 w-10 mx-auto mb-2 opacity-40" />
                <p className="font-semibold text-slate-600">No pension contributions recorded yet</p>
                <p className="text-xs text-slate-400 mt-1">
                  Pension deductions automatically log to this ledger every time payroll is processed.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/80 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Reference / Period</th>
                      <th className="py-2.5 px-3 text-right">Contribution Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {pension.entries.map((entry: any) => (
                      <tr key={entry.id} className="hover:bg-slate-50">
                        <td className="py-3 px-3 text-slate-700 font-medium">{fmtDate(entry.date)}</td>
                        <td className="py-3 px-3 text-slate-800 font-semibold">
                          {entry.payrollRun
                            ? `Payroll Run — ${new Date(0, entry.payrollRun.month - 1).toLocaleString('en', { month: 'long' })} ${entry.payrollRun.year}`
                            : 'Direct Contribution / Adjustment'}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-teal-700">
                          {fmt(entry.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* ── TAB 4: LOAN & REPAYMENT LEDGER ── */}
      {activeTab === 'loans' && (
        <div className="space-y-6">
          {/* Summary Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="p-4 bg-slate-50 border border-slate-200">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-0.5">
                Total Principal Loaned
              </span>
              <p className="text-xl font-bold font-mono text-slate-900">{fmt(loans?.totalLoaned || 0)}</p>
            </Card>

            <Card className="p-4 bg-rose-50 border border-rose-200">
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 block mb-0.5">
                Remaining Outstanding Balance
              </span>
              <p className="text-xl font-bold font-mono text-rose-700">{fmt(loans?.totalOutstanding || 0)}</p>
            </Card>

            <Card className="p-4 bg-emerald-50 border border-emerald-200">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 block mb-0.5">
                Total Repaid To Date
              </span>
              <p className="text-xl font-bold font-mono text-emerald-700">
                {fmt((loans?.totalLoaned || 0) - (loans?.totalOutstanding || 0))}
              </p>
            </Card>
          </div>

          {/* Active & Historical Loans */}
          {(!loans?.list || loans.list.length === 0) ? (
            <Card className="p-12 text-center text-slate-400 bg-white border border-slate-200">
              <Banknote className="h-10 w-10 mx-auto mb-2 opacity-40" />
              <p className="font-semibold text-slate-600">No active or historical loans recorded</p>
              <p className="text-xs mt-1 text-slate-400">
                Any school loans and scheduled payroll deductions will be displayed here in full detail.
              </p>
            </Card>
          ) : (
            loans.list.map((loan: any) => (
              <Card key={loan.id} className="bg-white border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-900">
                        Loan #{loan.id.substring(loan.id.length - 6).toUpperCase()}
                      </span>
                      <Badge className={cn(
                        'text-[10px] font-bold',
                        loan.status === 'cleared'
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                          : 'bg-amber-100 text-amber-800 border-amber-200'
                      )}>
                        {loan.status === 'cleared' ? 'CLEARED' : 'ACTIVE DEDUCTIONS'}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Collected on {fmtDate(loan.dateCollected)} • Monthly Deduction: <span className="font-mono font-bold text-slate-700">{fmt(loan.repaymentPerMonth)}</span>
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Balance Remaining</span>
                    <span className="text-base font-bold font-mono text-rose-700">{fmt(loan.outstandingBalance)}</span>
                  </div>
                </div>

                <CardContent className="p-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                    Repayment Transaction Ledger
                  </h4>
                  {(!loan.repayments || loan.repayments.length === 0) ? (
                    <p className="text-xs text-slate-400 italic py-2">
                      No repayments logged yet for this loan.
                    </p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px]">
                          <tr>
                            <th className="py-2 px-3">Date</th>
                            <th className="py-2 px-3">Source / Channel</th>
                            <th className="py-2 px-3">Notes</th>
                            <th className="py-2 px-3 text-right">Repayment Amount</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {loan.repayments.map((rep: any) => (
                            <tr key={rep.id} className="hover:bg-slate-50">
                              <td className="py-2.5 px-3 text-slate-700">{fmtDate(rep.date)}</td>
                              <td className="py-2.5 px-3">
                                <span className={cn(
                                  'px-2 py-0.5 rounded text-[10px] font-bold',
                                  rep.source === 'PAYROLL'
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-purple-100 text-purple-800'
                                )}>
                                  {rep.source}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-slate-600">{rep.notes || '—'}</td>
                              <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-700">
                                -{fmt(rep.amount)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* ── Payslip View & Print Modal ── */}
      <AnimatePresence>
        {showPayslipModal && selectedPayslip && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden my-8"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
                <div className="flex items-center gap-2">
                  <Receipt className="h-5 w-5 text-indigo-600" />
                  <h3 className="font-bold text-slate-800">
                    Payslip Preview • {selectedPayslip.period.label}
                  </h3>
                </div>
                <button
                  onClick={() => setShowPayslipModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 max-h-[75vh] overflow-y-auto bg-slate-100/60">
                <PayslipDocument payslip={selectedPayslip} elementId="teacher-payslip-modal-doc" />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
