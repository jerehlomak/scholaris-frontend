import { useViewPreference } from '../../../hooks/useViewPreference';
import { useFinanceMeta } from '../../../hooks/useFinanceMeta';
import { useState, useEffect, useCallback, useRef, Fragment } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import {
    FileText, Search, ChevronDown, ChevronUp, ChevronRight,
    Printer, Send, X, Loader2, CheckCircle2, Clock, AlertCircle, Ban, Trash2
} from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { ViewToggle } from '../../../components/shared/ViewToggle';
import { Pagination } from '../../../components/shared/Pagination';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n: number) => '₦' + (n || 0).toLocaleString('en-NG');

function Skeleton({ className }: { className?: string }) {
    return <div className={`animate-pulse bg-slate-200 rounded-lg ${className}`} />;
}

const STATUS_STYLES: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
    DRAFT:          { bg: 'bg-slate-100',  text: 'text-slate-600',   icon: <Clock className="h-3 w-3" /> },
    OPEN:           { bg: 'bg-blue-50',    text: 'text-blue-700',    icon: <AlertCircle className="h-3 w-3" /> },
    SENT:           { bg: 'bg-indigo-50',  text: 'text-indigo-700',  icon: <Send className="h-3 w-3" /> },
    PARTIALLY_PAID: { bg: 'bg-amber-50',   text: 'text-amber-700',   icon: <Clock className="h-3 w-3" /> },
    PAID:           { bg: 'bg-emerald-50', text: 'text-emerald-700', icon: <CheckCircle2 className="h-3 w-3" /> },
    OVERDUE:        { bg: 'bg-red-50',     text: 'text-red-700',     icon: <AlertCircle className="h-3 w-3" /> },
    CANCELLED:      { bg: 'bg-slate-100',  text: 'text-slate-400',   icon: <X className="h-3 w-3" /> },
    VOID:           { bg: 'bg-slate-100',  text: 'text-slate-400',   icon: <X className="h-3 w-3" /> },
};

function StatusBadge({ status }: { status: string }) {
    const s = STATUS_STYLES[status] || STATUS_STYLES.DRAFT;
    return (
        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${s.bg} ${s.text}`}>
            {s.icon}{status.replace(/_/g, ' ')}
        </span>
    );
}

// ─── Print Modal ──────────────────────────────────────────────────────────────
function InvoicePrint({ inv, settings, onClose, onSuccess }: { inv: any; settings: any; onClose: () => void; onSuccess?: () => void }) {
    const printRef = useRef<HTMLDivElement>(null);
    const [printSize, setPrintSize] = useState('A4');

    const handlePrint = () => {
        const content = printRef.current?.innerHTML;
        const win = window.open('', '_blank');
        if (!win || !content) {
            // Most likely a mobile/desktop popup blocker silently ate window.open() — say so
            // instead of the button doing nothing with zero feedback.
            toast.error('Could not open the print preview. Please allow pop-ups for this site and try again.');
            return;
        }

        const thermalCss = `
            @media print {
                @page { size: 80mm auto; margin: 0; }
                body { padding: 0; margin: 0; width: 80mm; font-family: monospace; color: #000; background: #fff; }
                .hdr { background: transparent !important; color: #000 !important; padding: 10px 0; text-align: center; border-bottom: 1px dashed #000; border-radius: 0; }
                .hdr h1 { font-size: 16px; font-weight: bold; }
                .hdr p { font-size: 10px; }
                .bdy { padding: 10px 0; border: none; }
                .meta { display: block; margin-bottom: 10px; }
                .meta > div { text-align: left !important; margin-bottom: 10px; }
                table { width: 100%; border: none; margin: 10px 0; }
                thead { background: transparent; }
                th { padding: 4px 0; text-align: left; font-size: 10px; border-bottom: 1px dashed #000; color: #000; }
                td { padding: 4px 0; font-size: 10px; border: none; }
                .totals { margin-top: 10px; padding-top: 10px; border-top: 1px dashed #000; }
                .trow { font-size: 10px; padding: 2px 0; }
                .trow.grand { font-size: 12px; font-weight: bold; color: #000 !important; border-top: 1px dashed #000; padding-top: 5px; margin-top: 5px; }
                .footer { margin-top: 20px; text-align: center; font-size: 10px; color: #000; }
            }
        `;
        
        win.document.write(`
            <html><head><title>Invoice ${inv.invoiceNumber}</title>
            <style>
                *{box-sizing:border-box;margin:0;padding:0}
                body{font-family:'Segoe UI',sans-serif;color:#1e293b;background:#fff;padding:40px}
                @media print{
                    @page{size:A4 portrait;margin:10mm}
                    body{padding:0;width:100%}
                }
                .hdr{background:#1e40af;color:#fff;padding:24px 32px;border-radius:12px 12px 0 0}
                .hdr h1{font-size:20px;font-weight:800}
                .hdr p{font-size:12px;opacity:.7;margin-top:4px}
                .bdy{padding:24px 32px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 12px 12px}
                .meta{display:flex;justify-content:space-between;margin-bottom:20px}
                .meta-label{font-size:10px;color:#64748b;text-transform:uppercase;font-weight:700}
                .meta-val{font-weight:700;margin-top:4px}
                .meta-sub{font-size:12px;color:#64748b}
                table{width:100%;border-collapse:collapse;margin:16px 0;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden}
                thead{background:#f8fafc}
                th{padding:10px 14px;text-align:left;font-size:11px;text-transform:uppercase;color:#64748b;font-weight:700}
                td{padding:10px 14px;border-top:1px solid #f1f5f9;font-size:13px}
                td:last-child{text-align:right;font-weight:600}
                .totals{margin-top:16px;padding-top:16px;border-top:2px solid #e2e8f0}
                .trow{display:flex;justify-content:space-between;padding:4px 0;font-size:13px}
                .trow.grand{font-size:18px;font-weight:800;color:#1e40af;border-top:2px solid #1e40af;padding-top:10px;margin-top:8px}
                .trow.disc{color:#15803d}
                .trow.bal{color:#dc2626;font-weight:700}
                .footer{margin-top:28px;text-align:center;font-size:11px;color:#94a3b8}
                ${printSize === 'THERMAL' ? thermalCss : ''}
            </style></head>
            <body>${content}</body></html>
        `);
        win.document.close();
        win.focus();
        setTimeout(async () => {
            win.print();
            try {
                await axios.post(`/api/v1/finance-v2/invoices/${inv.id}/print`, {}, { withCredentials: true });
                if (onSuccess) onSuccess();
            } catch (e) {
                console.error('Failed to mark as printed', e);
            }
        }, 500);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                {/* Modal header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 px-4 sm:px-6 py-4 shrink-0 gap-4">
                    <div className="flex items-center justify-between w-full sm:w-auto">
                        <h2 className="font-bold text-slate-900">Invoice Preview</h2>
                        <button onClick={onClose} className="rounded-xl border border-slate-200 p-2 text-slate-500 hover:bg-slate-50 sm:hidden">
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <select className="h-10 sm:h-9 flex-1 sm:flex-none rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 outline-none"
                            value={printSize} onChange={(e) => setPrintSize(e.target.value)}>
                            <option value="A4">A4 Paper</option>
                            <option value="THERMAL">POS Thermal</option>
                        </select>
                        <button onClick={handlePrint}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 h-10 sm:h-9 text-sm font-bold text-white hover:bg-blue-800 whitespace-nowrap">
                            <Printer className="h-4 w-4 shrink-0" /> Print / Save
                        </button>
                        <button onClick={onClose}
                            className="hidden sm:block rounded-xl border border-slate-200 p-2 text-slate-500 hover:bg-slate-50">
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                </div>

                <div className="overflow-auto p-4 sm:p-6 bg-slate-50/50">
                    <div ref={printRef} className="min-w-[600px] mx-auto bg-white relative" style={{ maxWidth: '800px' }}>
                        {/* Status Watermark */}
                        {settings?.financeModuleToggles?.display?.showWatermark !== false && (
                            <div style={{
                                position: 'absolute',
                                top: '45%',
                                left: '50%',
                                transform: 'translate(-50%, -50%) rotate(-30deg)',
                                fontSize: '64px',
                                fontWeight: 900,
                                opacity: 0.06,
                                pointerEvents: 'none',
                                textTransform: 'uppercase',
                                color: inv.status === 'PAID' ? '#15803d' : inv.balanceDue > 0 ? '#b91c1c' : '#1e40af',
                                zIndex: 0,
                                letterSpacing: '0.1em'
                            }}>
                                {inv.status === 'PAID' ? 'PAID IN FULL' : inv.amountPaid > 0 ? 'PARTIAL PAYMENT' : 'PAYMENT DUE'}
                            </div>
                        )}

                        {/* Header Branding */}
                        {(() => {
                            const headerMode = settings?.financeModuleToggles?.display?.headerLayoutMode || 'CLASSIC_LEFT';
                            const showLogo = settings?.financeModuleToggles?.display?.showSchoolLogo !== false && (settings?.logoUrl || inv.school?.logoUrl);
                            const logoSrc = settings?.logoUrl || inv.school?.logoUrl;

                            if (headerMode === 'CENTERED') {
                                return (
                                    <div className="hdr" style={{background:'#1e40af',color:'#fff',padding:'24px 32px',borderRadius:'12px 12px 0 0',textAlign:'center'}}>
                                        {showLogo && <img src={logoSrc} alt="Logo" style={{height:'48px',margin:'0 auto 10px',objectFit:'contain'}} />}
                                        <h1 style={{fontSize:'22px',fontWeight:800,color:'#ffffff'}}>{inv.school?.name || settings?.schoolName || 'School Invoice'}</h1>
                                        <p style={{fontSize:'12px',opacity:.8,marginTop:'4px'}}>
                                            Bursary & Finance Dept · {inv.academicYear || settings?.currentYear}{inv.term ? ` · ${inv.term.replace(/_/g,' ')}` : ''}
                                        </p>
                                    </div>
                                );
                            }

                            if (headerMode === 'MINIMAL_RIGHT') {
                                return (
                                    <div className="hdr" style={{background:'#1e40af',color:'#fff',padding:'24px 32px',borderRadius:'12px 12px 0 0',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                                        <div style={{display:'flex',alignItems:'center',gap:'14px'}}>
                                            {showLogo && <img src={logoSrc} alt="Logo" style={{height:'44px',objectFit:'contain'}} />}
                                            <div>
                                                <h1 style={{fontSize:'18px',fontWeight:800,color:'#ffffff'}}>{inv.school?.name || settings?.schoolName || 'School Invoice'}</h1>
                                                <p style={{fontSize:'11px',opacity:.8,marginTop:'2px'}}>Official Statement of Fees</p>
                                            </div>
                                        </div>
                                        <div style={{textAlign:'right'}}>
                                            <span style={{fontSize:'10px',background:'rgba(255,255,255,0.2)',padding:'3px 8px',borderRadius:'4px',fontWeight:700,letterSpacing:'0.05em'}}>
                                                {inv.invoiceNumber}
                                            </span>
                                        </div>
                                    </div>
                                );
                            }

                            return (
                                <div className="hdr" style={{background:'#1e40af',color:'#fff',padding:'24px 32px',borderRadius:'12px 12px 0 0',display:'flex',alignItems:'center',gap:'16px'}}>
                                    {showLogo && <img src={logoSrc} alt="Logo" style={{height:'48px',objectFit:'contain',borderRadius:'6px'}} />}
                                    <div>
                                        <h1 style={{fontSize:'20px',fontWeight:800,color:'#ffffff'}}>{inv.school?.name || settings?.schoolName || 'School Invoice'}</h1>
                                        <p style={{fontSize:'12px',opacity:.8,marginTop:'4px'}}>
                                            Finance Dept · {inv.academicYear || settings?.currentYear}{inv.term ? ` · ${inv.term.replace(/_/g,' ')}` : ''}
                                        </p>
                                    </div>
                                </div>
                            );
                        })()}

                        <div style={{padding:'24px 32px',border:'1px solid #e2e8f0',borderTop:'none',borderRadius:'0 0 12px 12px',position:'relative',zIndex:1}}>
                            <div style={{display:'flex',justifyContent:'space-between',marginBottom:'20px'}}>
                                <div>
                                    <p style={{fontSize:'10px',color:'#64748b',textTransform:'uppercase',fontWeight:700}}>Billed To</p>
                                    <p style={{fontWeight:700,marginTop:'4px',color:'#0f172a'}}>{inv.student?.user?.name}</p>
                                    <p style={{fontSize:'12px',color:'#64748b'}}>Adm No: {inv.student?.admissionNo || 'N/A'}</p>
                                    {inv.student?.classLevel && <p style={{fontSize:'12px',color:'#64748b'}}>Class: {inv.student?.classLevel}</p>}
                                    {settings?.financeModuleToggles?.display?.showParentInfo !== false && inv.student?.parent?.user && (
                                        <p style={{fontSize:'11px',color:'#64748b',marginTop:'4px'}}>
                                            Parent: {inv.student.parent.user.name} ({inv.student.parent.user.phone || inv.student.parent.user.email})
                                        </p>
                                    )}
                                </div>
                                <div style={{textAlign:'right'}}>
                                    <p style={{fontSize:'10px',color:'#64748b',textTransform:'uppercase',fontWeight:700}}>Invoice Details</p>
                                    <p style={{fontFamily:'monospace',fontWeight:700,marginTop:'4px',color:'#1e293b'}}>{inv.invoiceNumber}</p>
                                    <p style={{fontSize:'12px',color:'#64748b'}}>Date: {new Date(inv.createdAt).toLocaleDateString()}</p>
                                    {settings?.financeModuleToggles?.display?.showDueDate !== false && inv.dueDate && (
                                        <p style={{fontSize:'12px',color:'#dc2626',fontWeight:600}}>Due Date: {new Date(inv.dueDate).toLocaleDateString()}</p>
                                    )}
                                </div>
                            </div>

                            {/* Items table */}
                            {settings?.financeModuleToggles?.display?.showItemizedBreakdown !== false && settings?.showItemizedBreakdown !== false ? (
                                <table style={{width: '100%', borderCollapse: 'collapse', marginTop: '16px'}}>
                                    <thead>
                                        <tr style={{borderBottom: '2px solid #e2e8f0', color: '#64748b', fontSize: '10px', textTransform: 'uppercase'}}>
                                            <th style={{textAlign:'left', paddingBottom: '8px'}}>Description</th>
                                            <th style={{textAlign:'center', paddingBottom: '8px'}}>Qty</th>
                                            <th style={{textAlign:'right', paddingBottom: '8px'}}>Unit Price</th>
                                            <th style={{textAlign:'right', paddingBottom: '8px'}}>Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody style={{fontSize: '12px'}}>
                                        {(inv.items || []).map((item: any) => (
                                            <tr key={item.id} style={{borderBottom: '1px solid #f1f5f9'}}>
                                                <td style={{padding: '12px 0'}}>{item.label}</td>
                                                <td style={{textAlign:'center', padding: '12px 0'}}>{item.quantity || 1}</td>
                                                <td style={{textAlign:'right', padding: '12px 0'}}>{settings?.currencySymbol || '₦'}{item.unitPrice?.toLocaleString()}</td>
                                                <td style={{textAlign:'right', padding: '12px 0', fontWeight: 600}}>{settings?.currencySymbol || '₦'}{item.amount?.toLocaleString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <table style={{width: '100%', borderCollapse: 'collapse', marginTop: '16px'}}>
                                    <thead>
                                        <tr style={{borderBottom: '2px solid #e2e8f0', color: '#64748b', fontSize: '10px', textTransform: 'uppercase'}}>
                                            <th style={{textAlign:'left', paddingBottom: '8px'}}>Description</th>
                                            <th style={{textAlign:'right', paddingBottom: '8px'}}>Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody style={{fontSize: '12px'}}>
                                        <tr style={{borderBottom: '1px solid #f1f5f9'}}>
                                            <td style={{padding: '12px 0', fontWeight: 600}}>Consolidated School Fees & Levies</td>
                                            <td style={{textAlign:'right', padding: '12px 0', fontWeight: 600}}>{settings?.currencySymbol || '₦'}{inv.subTotal?.toLocaleString()}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            )}

                            {/* Totals */}
                            <div style={{marginTop:'16px',paddingTop:'16px',borderTop:'2px solid #e2e8f0'}}>
                                <div style={{display:'flex',justifyContent:'space-between',padding:'4px 0',fontSize:'13px'}}>
                                    <span style={{color:'#64748b'}}>Subtotal</span>
                                    <span>{settings?.currencySymbol || '₦'}{inv.subTotal?.toLocaleString()}</span>
                                </div>
                                {settings?.financeModuleToggles?.display?.showDiscountColumn !== false && inv.discountTotal > 0 && (
                                    <div style={{display:'flex',justifyContent:'space-between',padding:'4px 0',fontSize:'13px',color:'#15803d'}}>
                                        <span>Scholarship / Discount Waiver</span>
                                        <span>− {settings?.currencySymbol || '₦'}{inv.discountTotal?.toLocaleString()}</span>
                                    </div>
                                )}
                                <div style={{display:'flex',justifyContent:'space-between',padding:'10px 0 4px',fontSize:'18px',fontWeight:800,color:'#1e40af',borderTop:'2px solid #1e40af',marginTop:'8px'}}>
                                    <span>Total Due</span>
                                    <span>{settings?.currencySymbol || '₦'}{inv.totalAmount?.toLocaleString()}</span>
                                </div>
                                {inv.amountPaid > 0 && (
                                    <div style={{display:'flex',justifyContent:'space-between',padding:'4px 0',fontSize:'13px',color:'#15803d'}}>
                                        <span>Amount Paid</span>
                                        <span>{settings?.currencySymbol || '₦'}{inv.amountPaid?.toLocaleString()}</span>
                                    </div>
                                )}
                                {inv.balanceDue > 0 && (
                                    <div style={{display:'flex',justifyContent:'space-between',padding:'4px 0',fontSize:'14px',fontWeight:700,color:'#dc2626'}}>
                                        <span>Balance Due</span>
                                        <span>{settings?.currencySymbol || '₦'}{inv.balanceDue?.toLocaleString()}</span>
                                    </div>
                                )}
                            </div>

                            {/* Payment Instructions & Bank Details */}
                            {settings?.financeModuleToggles?.display?.showPaymentInstructions !== false && (
                                <div style={{marginTop:'20px',padding:'12px 16px',background:'#f8fafc',borderRadius:'8px',border:'1px solid #e2e8f0',fontSize:'11px',color:'#475569'}}>
                                    <p style={{fontWeight:700,color:'#1e293b',marginBottom:'3px'}}>Payment Instructions:</p>
                                    <p>{settings?.financeModuleToggles?.display?.instructionsText || 'Please quote the Student Admission Number or Invoice Number on all bank deposits and direct transfers.'}</p>
                                </div>
                            )}

                            {/* Signatures & Stamp Line */}
                            {settings?.financeModuleToggles?.display?.showSignatureLine !== false && (
                                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-end',marginTop:'36px',paddingTop:'20px'}}>
                                    <div style={{textAlign:'center',width:'180px'}}>
                                        <div style={{borderBottom:'1px dashed #94a3b8',height:'30px',marginBottom:'6px'}}></div>
                                        <p style={{fontSize:'10px',color:'#64748b',fontWeight:700,textTransform:'uppercase'}}>Bursar / Cashier Signature</p>
                                    </div>
                                    <div style={{textAlign:'center',width:'180px'}}>
                                        <div style={{borderBottom:'1px dashed #94a3b8',height:'30px',marginBottom:'6px'}}></div>
                                        <p style={{fontSize:'10px',color:'#64748b',fontWeight:700,textTransform:'uppercase'}}>Official Stamp & Date</p>
                                    </div>
                                </div>
                            )}

                            {/* Footer Note */}
                            <p style={{marginTop:'24px',fontSize:'11px',color:'#94a3b8',textAlign:'center'}}>
                                {settings?.financeModuleToggles?.display?.footerNote || 'Thank you for your prompt payment. Generated by Skooly Plus Finance System.'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Record Payment Modal ───────────────────────────────────────────────────
function RecordPaymentModal({ inv, settings, onClose, onSuccess }: { inv: any; settings: any; onClose: () => void; onSuccess: () => void }) {
    const [amount, setAmount] = useState(inv.balanceDue.toString());
    const [method, setMethod] = useState('CASH');
    const [discountAmount, setDiscountAmount] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            if (method === 'WALLET') {
                const res = await axios.post('/api/v1/finance-v2/wallet/apply', {
                    studentId: inv.studentId,
                    invoiceId: inv.id,
                    amount: Number(amount)
                }, { withCredentials: true });
                toast.success(
                    <div className="flex flex-col gap-1">
                        <span className="font-bold text-sm">Payment from Wallet Successful</span>
                        <span className="text-xs text-slate-500">Amount: ₦{Number(amount).toLocaleString('en-NG')}</span>
                        <span className="text-xs text-slate-500">Balance Before: ₦{(res.data.balanceBefore || 0).toLocaleString('en-NG')}</span>
                        <span className="text-xs font-semibold text-emerald-600">Balance After: ₦{(res.data.balanceAfter || 0).toLocaleString('en-NG')}</span>
                    </div>,
                    { duration: 5000 }
                );
            } else {
                await axios.post(`/api/v1/finance-v2/invoices/${inv.id}/pay`, {
                    amount: Number(amount),
                    method,
                    discountAmount: discountAmount ? Number(discountAmount) : 0
                }, { withCredentials: true });
                toast.success('Payment recorded successfully');
            }
            onSuccess();
        } catch (err: any) {
            toast.error(err.response?.data?.msg || 'Failed to record payment');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden">
                <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                    <h2 className="font-bold text-slate-900">Record Payment</h2>
                    <button onClick={onClose} className="rounded-xl border border-slate-200 p-2 text-slate-500 hover:bg-slate-50">
                        <X className="h-4 w-4" />
                    </button>
                </div>
                <div className="bg-slate-50 px-6 py-4 flex justify-between items-center text-sm">
                    <div>
                        <p className="text-slate-500 text-xs uppercase tracking-wider font-semibold">Invoice</p>
                        <p className="font-bold text-slate-900">{inv.invoiceNumber}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-slate-500 text-xs uppercase tracking-wider font-semibold">Balance Due</p>
                        <p className="font-bold text-red-600">₦{inv.balanceDue.toLocaleString()}</p>
                    </div>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Amount Paid (₦)</label>
                        <Input type="number" required min={1} max={settings?.allowOverpayment ? undefined : inv.balanceDue} value={amount} onChange={e => setAmount(e.target.value)} />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Payment Method</label>
                        <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            value={method} onChange={e => setMethod(e.target.value)}>
                            <option value="CASH">Cash</option>
                            <option value="POS">POS Terminal</option>
                            <option value="BANK_TRANSFER">Bank Transfer</option>
                            <option value="WALLET">Wallet</option>
                        </select>
                    </div>
                    {method !== 'WALLET' && (
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Discount Amount (Optional ₦)</label>
                            <p className="text-xs text-slate-500 mb-2">Apply an on-the-spot discount to reduce the balance due.</p>
                            <Input type="number" min={0} value={discountAmount} onChange={e => setDiscountAmount(e.target.value)} placeholder="0" />
                        </div>
                    )}
                    
                    <div className="pt-4 flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                        <Button type="submit" disabled={submitting} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                            {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                            Record Payment
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function InvoiceManager() {
    const { terms: metaTerms, sessions: metaSessions } = useFinanceMeta();
    const [invoices, setInvoices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(25); // was hardcoded at 10, which also capped "Select All" bulk-send to 10 at a time
    const [view, setView] = useViewPreference('invoicemanager');
    const [filters, setFilters] = useState({ status: '', term: '', academicYear: '', search: '', isSent: '', isPrinted: '' });
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [printInv, setPrintInv] = useState<any | null>(null);
    const [payInv, setPayInv] = useState<any | null>(null);
    const [sending, setSending] = useState<string | null>(null);
    const [settings, setSettings] = useState<any>(null);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [isBulkSending, setIsBulkSending] = useState(false);

    const fetchInvoices = useCallback(async () => {
        setLoading(true);
        try {
            const [invRes, setRes] = await Promise.all([
                axios.get(`/api/v1/finance-v2/invoices?${new URLSearchParams({ page: String(page), limit: String(limit), ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v)) })}`, { withCredentials: true }),
                axios.get('/api/v1/finance-v2/settings', { withCredentials: true }).catch(() => ({ data: {} }))
            ]);
            setInvoices(invRes.data.invoices || []);
            setTotal(invRes.data.total || 0);
            if(setRes.data.settings) setSettings(setRes.data.settings);
        } catch {
            toast.error('Failed to load invoices');
        } finally {
            setLoading(false);
        }
    }, [page, limit, filters]);

    useEffect(() => { fetchInvoices(); }, [fetchInvoices]);

    const handleSend = async (inv: any) => {
        setSending(inv.id);
        try {
            await axios.post(`/api/v1/finance-v2/invoices/${inv.id}/send`, {}, { withCredentials: true });
            toast.success('Invoice sent to parent / student');
            fetchInvoices();
        } catch (e: any) {
            toast.error(e.response?.data?.msg || 'Failed to send email');
        } finally {
            setSending(null);
        }
    };

    const handleBulkSend = async () => {
        if (!selectedIds.length) return;
        setIsBulkSending(true);
        try {
            await axios.post('/api/v1/finance-v2/invoices/bulk-send', { invoiceIds: selectedIds }, { withCredentials: true });
            toast.success('Invoices sent successfully');
            setSelectedIds([]);
            fetchInvoices();
        } catch (e: any) {
            toast.error(e.response?.data?.msg || 'Failed to bulk send invoices');
        } finally {
            setIsBulkSending(false);
        }
    };

    const [cancelling, setCancelling] = useState<string | null>(null);
    const [isBulkCancelling, setIsBulkCancelling] = useState(false);

    const handleCancelInvoice = async (inv: any) => {
        if (!confirm(`Cancel invoice ${inv.invoiceNumber}? This clears its outstanding balance and cannot be undone.`)) return;
        setCancelling(inv.id);
        try {
            const r = await axios.post(`/api/v1/finance-v2/invoices/${inv.id}/cancel`, {}, { withCredentials: true });
            toast.success(r.data.msg || 'Invoice cancelled');
            fetchInvoices();
        } catch (e: any) {
            toast.error(e.response?.data?.msg || 'Failed to cancel invoice');
        } finally {
            setCancelling(null);
        }
    };

    const handleBulkCancel = async () => {
        if (!selectedIds.length) return;
        if (!confirm(`Cancel ${selectedIds.length} selected invoice(s)? This clears their outstanding balance and cannot be undone.`)) return;
        setIsBulkCancelling(true);
        try {
            const r = await axios.post('/api/v1/finance-v2/invoices/bulk-cancel', { invoiceIds: selectedIds }, { withCredentials: true });
            toast.success(r.data.msg || 'Invoices cancelled');
            setSelectedIds([]);
            fetchInvoices();
        } catch (e: any) {
            toast.error(e.response?.data?.msg || 'Failed to bulk cancel invoices');
        } finally {
            setIsBulkCancelling(false);
        }
    };

    const [deleting, setDeleting] = useState<string | null>(null);
    const [isBulkDeleting, setIsBulkDeleting] = useState(false);

    const handleBulkDelete = async () => {
        if (!selectedIds.length) return;
        if (!confirm(`Permanently delete ${selectedIds.length} selected invoice(s)? Any that already have payments recorded will be skipped — cancel those instead.`)) return;
        setIsBulkDeleting(true);
        try {
            const r = await axios.post('/api/v1/finance-v2/invoices/bulk-delete', { invoiceIds: selectedIds }, { withCredentials: true });
            toast.success(r.data.msg || 'Invoices deleted');
            setSelectedIds([]);
            fetchInvoices();
        } catch (e: any) {
            toast.error(e.response?.data?.msg || 'Failed to bulk delete invoices');
        } finally {
            setIsBulkDeleting(false);
        }
    };

    // Only offered for invoices with no payment recorded — anything with money on it must be
    // cancelled instead, so its payment/receipt trail is never silently erased.
    const handleDeleteInvoice = async (inv: any) => {
        if (!confirm(`Permanently delete invoice ${inv.invoiceNumber}? This cannot be undone.`)) return;
        setDeleting(inv.id);
        try {
            await axios.delete(`/api/v1/finance-v2/invoices/${inv.id}`, { withCredentials: true });
            toast.success('Invoice deleted');
            fetchInvoices();
        } catch (e: any) {
            toast.error(e.response?.data?.msg || 'Failed to delete invoice');
        } finally {
            setDeleting(null);
        }
    };

    return (
        <>
            <style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap');.im-root,.im-root *{font-family:'Plus Jakarta Sans',sans-serif!important}.im-root .mono{font-family:'DM Mono',monospace!important}`}</style>
            <div className="im-root min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-indigo-50/30 px-4 pb-20 pt-8 sm:px-6 lg:px-8">
                <div className="pointer-events-none fixed inset-0 opacity-[0.22]" style={{ backgroundImage: 'radial-gradient(circle,#94a3b8 1px,transparent 1px)', backgroundSize: '28px 28px' }} />
                <div className="relative z-10 mx-auto max-w-7xl">

                    {/* Breadcrumb */}
                    <div className="mb-5 flex items-center gap-1.5">
                        <span className="mono text-[10px] font-bold uppercase tracking-widest text-slate-500">Finance</span>
                        <ChevronRight className="h-3 w-3 text-slate-400" />
                        <span className="mono text-[10px] font-bold uppercase tracking-widest text-blue-600">Invoices</span>
                    </div>

                    <div className="mb-6 flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-700 to-indigo-500 shadow-lg shadow-blue-200">
                            <FileText className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-extrabold text-slate-900">Invoices</h1>
                            <p className="mono text-[10px] text-slate-400 uppercase tracking-widest">{total} total records</p>
                        </div>
                    </div>

                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white/80 p-4 shadow-sm backdrop-blur-xl">
                        <div className="flex flex-wrap items-center gap-3">
                            <div className="relative flex-1 min-w-[180px]">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <Input className="pl-9 h-9 rounded-xl border-slate-200 text-sm"
                                placeholder="Search invoice #..."
                                value={filters.search}
                                onChange={e => setFilters(s => ({ ...s, search: e.target.value }))} />
                        </div>
                        <select className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 outline-none focus:border-blue-400"
                            value={filters.status} onChange={e => setFilters(s => ({ ...s, status: e.target.value }))}>
                            <option value="">All Statuses</option>
                            {['DRAFT','OPEN','SENT','PARTIALLY_PAID','PAID','OVERDUE','CANCELLED','VOID'].map(s =>
                                <option key={s} value={s}>{s.replace(/_/g,' ')}</option>
                            )}
                        </select>
                        <select className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 outline-none focus:border-blue-400"
                            value={filters.term} onChange={e => setFilters(s => ({ ...s, term: e.target.value }))}>
                            <option value="">All Terms</option>
                            {metaTerms.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                        <select className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 outline-none focus:border-blue-400"
                            value={filters.academicYear} onChange={e => setFilters(s => ({ ...s, academicYear: e.target.value }))}>
                            <option value="">All Sessions</option>
                            {metaSessions.map(sess => <option key={sess.id} value={sess.name}>{sess.name}</option>)}
                        </select>
                        <select className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 outline-none focus:border-blue-400"
                            value={filters.isSent} onChange={e => setFilters(s => ({ ...s, isSent: e.target.value }))}>
                            <option value="">Any Sent Status</option>
                            <option value="true">Sent</option>
                            <option value="false">Not Sent</option>
                        </select>
                        <select className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 outline-none focus:border-blue-400"
                            value={filters.isPrinted} onChange={e => setFilters(s => ({ ...s, isPrinted: e.target.value }))}>
                            <option value="">Any Print Status</option>
                            <option value="true">Printed</option>
                            <option value="false">Not Printed</option>
                        </select>
                        <button onClick={() => { setFilters({ status:'',term:'',academicYear:'',search:'',isSent:'',isPrinted:'' }); setPage(1); }}
                            className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-500 hover:bg-slate-50">
                            Clear
                        </button>
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={() => {
                                const csv = ['Invoice #,Student,Term,Total,Paid,Balance,Status'].concat(
                                    invoices.map(i => `${i.invoiceNumber},"${i.student?.user?.name || ''}",${i.term || ''},${i.totalAmount},${i.amountPaid},${i.balanceDue},${i.status}`)
                                ).join('\n');
                                const blob = new Blob([csv], { type: 'text/csv' });
                                const url = URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = 'invoices.csv';
                                a.click();
                            }} className="h-9 px-3 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-1">
                                <FileText className="h-4 w-4" /> Export CSV
                            </button>
                            <select
                                value={limit}
                                onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
                                className="h-9 rounded-xl border border-slate-200 bg-white px-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                                title="Rows per page"
                            >
                                {[10, 25, 50, 100, 200].map(n => <option key={n} value={n}>{n} / page</option>)}
                            </select>
                            {view === 'grid' && (
                                <label className="flex items-center gap-2 cursor-pointer h-9 px-3 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50">
                                    <input type="checkbox" className="rounded border-slate-300"
                                        checked={invoices.length > 0 && selectedIds.length === invoices.length}
                                        onChange={(e) => setSelectedIds(e.target.checked ? invoices.map(i => i.id) : [])}
                                    />
                                    Select All ({invoices.length})
                                </label>
                            )}
                            {selectedIds.length > 0 && (
                                <>
                                    <button onClick={handleBulkSend} disabled={isBulkSending}
                                        className="h-9 px-3 rounded-xl bg-indigo-700 text-white text-xs font-semibold hover:bg-indigo-800 flex items-center gap-1 disabled:opacity-50">
                                        {isBulkSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Bulk Send ({selectedIds.length})
                                    </button>
                                    <button onClick={handleBulkCancel} disabled={isBulkCancelling}
                                        className="h-9 px-3 rounded-xl bg-red-50 text-red-600 text-xs font-semibold hover:bg-red-100 flex items-center gap-1 disabled:opacity-50">
                                        {isBulkCancelling ? <Loader2 className="h-4 w-4 animate-spin" /> : <Ban className="h-4 w-4" />} Cancel ({selectedIds.length})
                                    </button>
                                    <button onClick={handleBulkDelete} disabled={isBulkDeleting}
                                        title="Delete selected (invoices with payments recorded are skipped)"
                                        className="h-9 px-3 rounded-xl border border-slate-200 bg-white text-slate-500 text-xs font-semibold hover:bg-slate-50 hover:text-red-600 flex items-center gap-1 disabled:opacity-50">
                                        {isBulkDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />} Delete
                                    </button>
                                </>
                            )}
                            <ViewToggle view={view} onChange={setView} />
                        </div>
                    </div>

                    {/* Content */}
                    {loading ? (
                        <div className="space-y-2">{[...Array(6)].map((_,i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
                    ) : invoices.length === 0 ? (
                        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 py-20">
                            <FileText className="h-12 w-12 text-slate-200 mb-3" />
                            <p className="font-semibold text-slate-500">No invoices found</p>
                            <p className="text-sm text-slate-400">Generate invoices from Single Billing</p>
                        </div>
                    ) : (
                        <div className="flex flex-col min-h-0">
                            {view === 'table' && (
                                <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left whitespace-nowrap min-w-[900px] border-collapse border border-slate-200 [&_th]:border [&_th]:border-slate-200 [&_td]:border [&_td]:border-slate-200">
                                <thead className="bg-slate-50/60 border-b border-slate-50">
                                    <tr>
                                        <th className="px-6 py-2.5 w-10 text-center">
                                            <input type="checkbox" className="rounded border-slate-300" checked={invoices.length > 0 && selectedIds.length === invoices.length} onChange={(e) => setSelectedIds(e.target.checked ? invoices.map(i => i.id) : [])} />
                                        </th>
                                        <th className="px-6 py-2.5 mono text-[9px] font-bold uppercase tracking-widest text-slate-400">Invoice #</th>
                                        <th className="px-6 py-2.5 mono text-[9px] font-bold uppercase tracking-widest text-slate-400">Student</th>
                                        <th className="px-6 py-2.5 mono text-[9px] font-bold uppercase tracking-widest text-slate-400">Term</th>
                                        <th className="px-6 py-2.5 mono text-[9px] font-bold uppercase tracking-widest text-slate-400 text-right">Total</th>
                                        <th className="px-6 py-2.5 mono text-[9px] font-bold uppercase tracking-widest text-slate-400 text-right">Paid</th>
                                        <th className="px-6 py-2.5 mono text-[9px] font-bold uppercase tracking-widest text-slate-400 text-right">Balance</th>
                                        <th className="px-6 py-2.5 mono text-[9px] font-bold uppercase tracking-widest text-slate-400">Status</th>
                                        <th className="px-6 py-2.5 w-24"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {invoices.map(inv => (
                                        <Fragment key={inv.id}>
                                            <tr className="hover:bg-slate-50/50 transition-colors">
                                                <td className="px-6 py-3.5 text-center">
                                                    <input type="checkbox" className="rounded border-slate-300" checked={selectedIds.includes(inv.id)} onChange={(e) => setSelectedIds(prev => e.target.checked ? [...prev, inv.id] : prev.filter(id => id !== inv.id))} />
                                                </td>
                                                <td className="px-6 py-3.5 mono text-xs font-bold text-blue-700">{inv.invoiceNumber}</td>
                                                <td className="px-6 py-3.5">
                                                    <p className="font-semibold text-slate-900 text-sm">{inv.student?.user?.name}</p>
                                                    <p className="mono text-[10px] text-slate-400">{inv.student?.admissionNo}</p>
                                                </td>
                                                <td className="px-6 py-3.5 text-xs text-slate-500">{inv.term?.replace(/_/g,' ') || '—'}</td>
                                                <td className="px-6 py-3.5 mono font-bold text-slate-800 text-right">{fmt(inv.totalAmount)}</td>
                                                <td className="px-6 py-3.5 mono font-semibold text-emerald-700 text-right">{fmt(inv.amountPaid)}</td>
                                                <td className={`px-6 py-3.5 mono font-bold text-right ${inv.balanceDue > 0 ? 'text-red-600' : 'text-emerald-600'}`}>{fmt(inv.balanceDue)}</td>
                                                <td className="px-6 py-3.5 flex items-center gap-1">
                                                    <StatusBadge status={inv.status} />
                                                    {inv.isSent && <span title="Sent" className="text-indigo-500 bg-indigo-50 rounded-full p-1"><Send className="w-3 h-3"/></span>}
                                                    {inv.isPrinted && <span title="Printed" className="text-slate-500 bg-slate-100 rounded-full p-1"><Printer className="w-3 h-3"/></span>}
                                                </td>
                                                <td className="px-6 py-3.5 text-right">
                                                    <div className="flex items-center justify-end gap-0.5">
                                                        <button onClick={() => setPrintInv(inv)} title="Print"
                                                            className="rounded-lg p-1.5 text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition-colors">
                                                            <Printer className="h-4 w-4" />
                                                        </button>
                                                        <button onClick={() => handleSend(inv)} title="Send to Parent" disabled={sending === inv.id}
                                                            className="rounded-lg p-1.5 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 transition-colors disabled:opacity-40">
                                                            {sending === inv.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                                                        </button>
                                                        <button onClick={() => setExpandedId(expandedId === inv.id ? null : inv.id)}
                                                            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 transition-colors">
                                                            {expandedId === inv.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>

                                            {expandedId === inv.id && (
                                                <tr className="bg-slate-50/60 border-t-0">
                                                    <td colSpan={8} className="p-0 border-t-0">
                                                        <div className="px-6 py-4">
                                                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                                                {/* Line items */}
                                                                <div>
                                                                    <p className="mono mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">Line Items</p>
                                                                    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white divide-y divide-slate-50 whitespace-normal">
                                                                        {(inv.items || []).map((item: any) => (
                                                                            <div key={item.id} className="flex items-center justify-between px-4 py-2.5">
                                                                                <div className="pr-4">
                                                                                    <p className="text-sm font-semibold text-slate-800">{item.label}</p>
                                                                                    <p className="mono text-[10px] text-slate-400">Qty {item.quantity} × {fmt(item.unitPrice)}</p>
                                                                                </div>
                                                                                <p className="mono font-bold text-slate-800 shrink-0">{fmt(item.amount)}</p>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>

                                                                {/* Summary + actions */}
                                                                <div>
                                                                    <p className="mono mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">Summary</p>
                                                                    <div className="rounded-xl border border-slate-200 bg-white divide-y divide-slate-50 mb-3 whitespace-normal">
                                                                        <div className="flex justify-between px-4 py-2.5 text-sm">
                                                                            <span className="text-slate-500">Subtotal</span>
                                                                            <span className="mono font-semibold">{fmt(inv.subTotal)}</span>
                                                                        </div>
                                                                        {inv.discountTotal > 0 && (
                                                                            <div className="flex justify-between px-4 py-2.5 text-sm text-emerald-700">
                                                                                <span>Discount</span>
                                                                                <span className="mono font-semibold">− {fmt(inv.discountTotal)}</span>
                                                                            </div>
                                                                        )}
                                                                        <div className="flex justify-between px-4 py-2.5 text-sm font-bold">
                                                                            <span>Total</span>
                                                                            <span className="mono text-blue-700">{fmt(inv.totalAmount)}</span>
                                                                        </div>
                                                                        <div className="flex justify-between px-4 py-2.5 text-sm text-emerald-700">
                                                                            <span>Paid</span>
                                                                            <span className="mono font-semibold">{fmt(inv.amountPaid)}</span>
                                                                        </div>
                                                                        <div className="flex justify-between px-4 py-2.5 text-sm font-bold text-red-600">
                                                                            <span>Balance</span>
                                                                            <span className="mono">{fmt(inv.balanceDue)}</span>
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex gap-2">
                                                                        {inv.balanceDue > 0 && (
                                                                            <button onClick={() => setPayInv(inv)}
                                                                                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 py-2 text-xs font-bold text-white hover:bg-emerald-700">
                                                                                <CheckCircle2 className="h-3.5 w-3.5" />
                                                                                Pay
                                                                            </button>
                                                                        )}
                                                                        <button onClick={() => setPrintInv(inv)}
                                                                            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-2 text-xs font-bold text-slate-700 hover:bg-slate-50">
                                                                            <Printer className="h-3.5 w-3.5" /> Print
                                                                        </button>
                                                                        <button onClick={() => handleSend(inv)} disabled={sending === inv.id}
                                                                            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-700 py-2 text-xs font-bold text-white hover:bg-indigo-800 disabled:opacity-60">
                                                                            {sending === inv.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                                                                            Send
                                                                        </button>
                                                                        {!['CANCELLED', 'VOID'].includes(inv.status) && (
                                                                            <button onClick={() => handleCancelInvoice(inv)} disabled={cancelling === inv.id}
                                                                                title="Cancel invoice"
                                                                                className="flex items-center justify-center gap-2 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-100 disabled:opacity-60">
                                                                                {cancelling === inv.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Ban className="h-3.5 w-3.5" />}
                                                                            </button>
                                                                        )}
                                                                        {inv.amountPaid === 0 && (
                                                                            <button onClick={() => handleDeleteInvoice(inv)} disabled={deleting === inv.id}
                                                                                title="Delete invoice (no payments recorded)"
                                                                                className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-500 hover:bg-slate-50 hover:text-red-600 disabled:opacity-60">
                                                                                {deleting === inv.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </Fragment>
                                    ))}
                                </tbody>
                            </table>

                                </div>
                            )}

                            {view === 'grid' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                                    {invoices.map(inv => (
                                        <div key={inv.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-all flex flex-col relative">
                                            <div className="absolute top-5 right-5 z-10">
                                                <input type="checkbox" className="rounded border-slate-300 w-4 h-4 cursor-pointer"
                                                    checked={selectedIds.includes(inv.id)}
                                                    onChange={(e) => setSelectedIds(prev => e.target.checked ? [...prev, inv.id] : prev.filter(id => id !== inv.id))}
                                                />
                                            </div>
                                            <div className="flex justify-between items-start mb-3 pr-8">
                                                <div>
                                                    <p className="font-bold text-slate-900 text-sm">{inv.student?.user?.name}</p>
                                                    <p className="mono text-xs text-slate-500">{inv.student?.admissionNo}</p>
                                                </div>
                                                <div className="flex flex-col items-end gap-1">
                                                    <StatusBadge status={inv.status} />
                                                    <div className="flex gap-1 mt-1">
                                                        {inv.isSent && <span title="Sent" className="text-indigo-500 bg-indigo-50 rounded-full p-1"><Send className="w-3 h-3"/></span>}
                                                        {inv.isPrinted && <span title="Printed" className="text-slate-500 bg-slate-100 rounded-full p-1"><Printer className="w-3 h-3"/></span>}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="mono text-[10px] font-bold text-blue-700 mb-4 tracking-widest">{inv.invoiceNumber}</div>
                                            
                                            <div className="flex justify-between text-xs text-slate-500 mb-2">
                                                <span>Term</span>
                                                <span className="font-medium text-slate-700">{inv.term?.replace(/_/g,' ') || '—'}</span>
                                            </div>
                                            
                                            <div className="flex justify-between text-xs text-slate-500 mb-2 border-t border-slate-100 pt-2">
                                                <span>Total Amount</span>
                                                <span className="mono font-bold text-slate-800">{fmt(inv.totalAmount)}</span>
                                            </div>
                                            
                                            <div className="flex justify-between text-xs text-slate-500 mb-2">
                                                <span>Amount Paid</span>
                                                <span className="mono font-semibold text-emerald-700">{fmt(inv.amountPaid)}</span>
                                            </div>
                                            
                                            <div className="flex justify-between text-xs font-bold mt-1 pt-2 border-t border-slate-100">
                                                <span className="text-slate-600">Balance Due</span>
                                                <span className={`mono ${inv.balanceDue > 0 ? 'text-red-600' : 'text-emerald-600'}`}>{fmt(inv.balanceDue)}</span>
                                            </div>
                                            
                                            <div className="mt-4 flex gap-2 pt-4 border-t border-slate-100">
                                                {inv.balanceDue > 0 && (
                                                    <button onClick={() => setPayInv(inv)}
                                                        className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-600 py-2 text-xs font-bold text-white hover:bg-emerald-700">
                                                        <CheckCircle2 className="h-3.5 w-3.5" /> Pay
                                                    </button>
                                                )}
                                                <button onClick={() => setPrintInv(inv)}
                                                    className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white py-2 text-xs font-bold text-slate-700 hover:bg-slate-50">
                                                    <Printer className="h-3.5 w-3.5" /> Print
                                                </button>
                                                <button onClick={() => handleSend(inv)} disabled={sending === inv.id}
                                                    className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-indigo-700 py-2 text-xs font-bold text-white hover:bg-indigo-800 disabled:opacity-60">
                                                    {sending === inv.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                                                </button>
                                                {!['CANCELLED', 'VOID'].includes(inv.status) && (
                                                    <button onClick={() => handleCancelInvoice(inv)} disabled={cancelling === inv.id}
                                                        title="Cancel invoice"
                                                        className="flex items-center justify-center gap-1.5 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-100 disabled:opacity-60">
                                                        {cancelling === inv.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Ban className="h-3.5 w-3.5" />}
                                                    </button>
                                                )}
                                                {inv.amountPaid === 0 && (
                                                    <button onClick={() => handleDeleteInvoice(inv)} disabled={deleting === inv.id}
                                                        title="Delete invoice (no payments recorded)"
                                                        className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-500 hover:bg-slate-50 hover:text-red-600 disabled:opacity-60">
                                                        {deleting === inv.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <Pagination currentPage={page} totalPages={Math.ceil(total / limit)} totalRecords={total} onPageChange={setPage} />
                        </div>
                    )}
                </div>
            </div>

            {printInv && <InvoicePrint inv={printInv} settings={settings} onClose={() => setPrintInv(null)} onSuccess={() => fetchInvoices()} />}
            {payInv && (
                <RecordPaymentModal 
                    inv={payInv} 
                    settings={settings}
                    onClose={() => setPayInv(null)} 
                    onSuccess={() => {
                        setPayInv(null);
                        fetchInvoices();
                    }} 
                />
            )}
        </>
    );
}
