import React from 'react';
import { Printer, Download, Building2, CheckCircle2, ShieldCheck, Banknote, Calendar, User, Mail, Landmark } from 'lucide-react';
import { Button } from '../ui/button';
import { mobileSafePrint } from '../../lib/printUtils';

export interface PayslipData {
  period: { month: number; year: number; label: string };
  staff: {
    id: string;
    name: string;
    email?: string;
    department?: string;
    employeeId?: string;
    bankName?: string;
    accountNumber?: string;
    accountName?: string;
  };
  school: {
    name: string;
    phone?: string;
    address?: string;
    logoUrl?: string;
  };
  earningsBreakdown: { name: string; amount: number }[];
  deductionsBreakdown: { name: string; amount: number; loanId?: string }[];
  gross: number;
  totalDeductions: number;
  net: number;
  status: string;
  outstandingLoan?: number;
  totalPensionAccumulated?: number;
}

function fmt(n: number) {
  return '₦' + (n || 0).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function PayslipDocument({
  payslip,
  elementId = 'payslip-print-document',
  showActions = true,
}: {
  payslip: PayslipData;
  elementId?: string;
  showActions?: boolean;
}) {
  const handlePrint = () => {
    mobileSafePrint(elementId);
  };

  return (
    <div className="space-y-4">
      {showActions && (
        <div className="flex items-center justify-between gap-3 bg-slate-50/80 p-3 rounded-xl border border-slate-200">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Official Payslip Document • {payslip.period.label}
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={handlePrint}
              size="sm"
              className="h-8 gap-1.5 rounded-lg bg-[#0B1F4E] px-3 text-xs font-semibold text-white shadow-sm hover:bg-[#122B5C] active:scale-95"
            >
              <Printer className="h-3.5 w-3.5" />
              Print Payslip
            </Button>
          </div>
        </div>
      )}

      {/* Printable Paper Canvas */}
      <div
        id={elementId}
        className="mx-auto w-full max-w-[780px] bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xl print:m-0 print:w-full print:max-w-none print:border-none print:shadow-none print:p-4 text-slate-800"
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b-2 border-[#0B1F4E] pb-5 mb-6 gap-4">
          <div className="flex items-center gap-4">
            {payslip.school.logoUrl ? (
              <img
                src={payslip.school.logoUrl}
                alt="School Logo"
                className="h-16 w-16 object-contain rounded-lg border border-slate-100 p-1"
              />
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[#0B1F4E]/5 border border-[#0B1F4E]/15 text-[#0B1F4E]">
                <Building2 className="h-7 w-7" />
              </div>
            )}
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {payslip.school.name || 'School Name'}
              </h2>
              {payslip.school.address && (
                <p className="text-xs text-slate-500 max-w-sm mt-0.5">{payslip.school.address}</p>
              )}
              {payslip.school.phone && (
                <p className="text-xs font-medium text-slate-400 mt-0.5">Tel: {payslip.school.phone}</p>
              )}
            </div>
          </div>

          <div className="text-right">
            <span className="inline-block px-3 py-1 bg-[#FFC72C] text-[#0B1F4E] rounded-lg text-xs font-extrabold uppercase tracking-wider border border-[#F5B800]">
              PAYSLIP
            </span>
            <p className="text-base font-extrabold text-slate-900 mt-1.5">{payslip.period.label}</p>
            <div className="mt-1 flex items-center justify-end gap-1.5 text-xs font-semibold">
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                payslip.status === 'confirmed' || payslip.status === 'paid'
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-amber-100 text-amber-800'
              }`}>
                <CheckCircle2 className="h-3 w-3" />
                {payslip.status === 'confirmed' || payslip.status === 'paid' ? 'CONFIRMED' : 'DRAFT'}
              </span>
            </div>
          </div>
        </div>

        {/* Staff Information Grid */}
        <div className="bg-[#FDF6E3]/50 rounded-xl p-4 border border-[#F5B800]/20 mb-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-3 gap-x-4 text-xs">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                Staff Name
              </span>
              <span className="font-bold text-slate-900 text-sm">{payslip.staff.name}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                Employee ID
              </span>
              <span className="font-mono font-bold text-[#0B1F4E]">
                {payslip.staff.employeeId || 'N/A'}
              </span>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                Department
              </span>
              <span className="font-semibold text-slate-800">
                {payslip.staff.department || 'Academic'}
              </span>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                Bank Name
              </span>
              <span className="font-semibold text-slate-800">
                {payslip.staff.bankName || 'N/A'}
              </span>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                Account Number
              </span>
              <span className="font-mono font-semibold text-slate-800">
                {payslip.staff.accountNumber || 'N/A'}
              </span>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                Account Name
              </span>
              <span className="font-semibold text-slate-800 truncate block">
                {payslip.staff.accountName || payslip.staff.name}
              </span>
            </div>
          </div>
        </div>

        {/* Breakdown Tables (Earnings & Deductions Side-by-Side) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {/* Earnings */}
          <div className="border border-emerald-100 rounded-xl overflow-hidden bg-emerald-50/20">
            <div className="bg-emerald-600 px-4 py-2 text-white flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider">Earnings (Gross Items)</span>
              <span className="text-xs font-bold">Amount</span>
            </div>
            <div className="p-3 divide-y divide-emerald-100/60 min-h-[140px]">
              {payslip.earningsBreakdown && payslip.earningsBreakdown.length > 0 ? (
                payslip.earningsBreakdown.map((item, idx) => (
                  <div key={idx} className="py-2 flex items-center justify-between text-xs">
                    <span className="text-slate-700 font-medium">{item.name}</span>
                    <span className="font-mono font-bold text-emerald-700">{fmt(item.amount)}</span>
                  </div>
                ))
              ) : (
                <div className="py-4 text-center text-xs text-slate-400">No specific earnings configured</div>
              )}
            </div>
            <div className="bg-emerald-50 px-4 py-2.5 border-t border-emerald-200 flex items-center justify-between text-xs font-bold text-emerald-900">
              <span>GROSS EARNINGS</span>
              <span className="font-mono text-sm">{fmt(payslip.gross)}</span>
            </div>
          </div>

          {/* Deductions */}
          <div className="border border-rose-100 rounded-xl overflow-hidden bg-rose-50/20">
            <div className="bg-rose-600 px-4 py-2 text-white flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider">Deductions</span>
              <span className="text-xs font-bold">Amount</span>
            </div>
            <div className="p-3 divide-y divide-rose-100/60 min-h-[140px]">
              {payslip.deductionsBreakdown && payslip.deductionsBreakdown.length > 0 ? (
                payslip.deductionsBreakdown.map((item, idx) => (
                  <div key={idx} className="py-2 flex items-center justify-between text-xs">
                    <span className="text-slate-700 font-medium flex items-center gap-1">
                      {item.name}
                      {item.loanId && (
                        <span className="text-[9px] bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded font-bold">
                          Loan
                        </span>
                      )}
                    </span>
                    <span className="font-mono font-bold text-rose-700">{fmt(item.amount)}</span>
                  </div>
                ))
              ) : (
                <div className="py-4 text-center text-xs text-slate-400">No deductions for this period</div>
              )}
            </div>
            <div className="bg-rose-50 px-4 py-2.5 border-t border-rose-200 flex items-center justify-between text-xs font-bold text-rose-900">
              <span>TOTAL DEDUCTIONS</span>
              <span className="font-mono text-sm">{fmt(payslip.totalDeductions)}</span>
            </div>
          </div>
        </div>

        {/* Net Pay Banner */}
        <div className="bg-gradient-to-r from-[#0B1F4E] to-[#122B5C] text-white rounded-xl p-5 mb-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-md border-b-2 border-[#F5B800]">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-widest text-[#FFC72C] block mb-0.5">
              Total Net Take-Home Pay
            </span>
            <p className="text-xs text-slate-300">
              Transferred directly to staff bank account
            </p>
          </div>
          <div className="text-right sm:text-right">
            <span className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-white">
              {fmt(payslip.net)}
            </span>
          </div>
        </div>

        {/* Cumulative Stats (Pension & Outstanding Loan) */}
        {(payslip.totalPensionAccumulated !== undefined || payslip.outstandingLoan !== undefined) && (
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="p-3 rounded-lg border border-teal-100 bg-teal-50/50 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-teal-600" />
                <span className="text-slate-600 font-semibold">Total Pension Accumulated:</span>
              </div>
              <span className="font-mono font-bold text-teal-800">
                {fmt(payslip.totalPensionAccumulated || 0)}
              </span>
            </div>

            <div className="p-3 rounded-lg border border-amber-100 bg-amber-50/50 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Banknote className="h-4 w-4 text-amber-600" />
                <span className="text-slate-600 font-semibold">Active Loan Balance:</span>
              </div>
              <span className="font-mono font-bold text-amber-800">
                {fmt(payslip.outstandingLoan || 0)}
              </span>
            </div>
          </div>
        )}

        {/* Footer & Signature Section */}
        <div className="border-t border-slate-200 pt-6 mt-6">
          <div className="grid grid-cols-2 gap-8 text-xs text-slate-500">
            <div>
              <p className="text-[11px] font-medium text-slate-400">
                This is a computer-generated document and is valid with authorized digital verification.
              </p>
              <p className="text-[10px] text-slate-400 mt-1">
                Generated via {payslip.school.name || 'School'}'s Payroll Management System.
              </p>
            </div>
            <div className="flex flex-col items-end justify-end">
              <div className="w-48 border-b border-slate-300 pb-1 text-center font-semibold text-slate-700 text-xs">
                Authorized Signatory
              </div>
              <span className="text-[10px] text-slate-400 mt-1">Bursar / Accounts Office</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
