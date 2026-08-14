import React, { useRef, useState } from 'react';
import { X, Printer } from 'lucide-react';

import axios from 'axios';

const a4Css = `
    .receipt-print-wrapper, .receipt-print-wrapper * {box-sizing:border-box;margin:0;padding:0}
    .receipt-print-wrapper {font-family:'Segoe UI',sans-serif;color:#1e293b;background:#fff;padding:40px;text-align:left;}
    @media print{@page{size:A4 portrait;margin:10mm} body{width:100%} .receipt-print-wrapper{padding:0;width:100%}}
    .receipt-print-wrapper .hdr{background:linear-gradient(135deg,#0B1F4E,#122B5C);color:#fff;padding:24px 32px;border-radius:12px 12px 0 0;text-align:center;border-bottom:3px solid #F5B800;}
    .receipt-print-wrapper .hdr h1{font-size:24px;font-weight:800;margin-bottom:8px;color:#ffffff}
    .receipt-print-wrapper .hdr p{font-size:14px;opacity:.85;color:#FFC72C;text-transform:uppercase;letter-spacing:0.05em;font-weight:700}
    .receipt-print-wrapper .bdy{padding:32px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 12px 12px}
    .receipt-print-wrapper .meta{display:flex;justify-content:space-between;margin-bottom:32px;border-bottom:2px solid #FDF6E3;padding-bottom:24px}
    .receipt-print-wrapper .meta-col{display:flex;flex-direction:column;gap:12px}
    .receipt-print-wrapper .meta-col.right{text-align:right}
    .receipt-print-wrapper .meta-block{flex:1}
    .receipt-print-wrapper .meta-label{font-size:11px;color:#64748b;text-transform:uppercase;font-weight:700;letter-spacing:0.05em;margin-bottom:4px}
    .receipt-print-wrapper .meta-val{font-size:16px;font-weight:700;color:#0B1F4E}
    .receipt-print-wrapper .meta-sub{font-size:13px;color:#64748b;margin-top:2px}

    .receipt-print-wrapper .details-grid{display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-bottom:32px;background:#FDF6E3;padding:24px;border-radius:12px}
    .receipt-print-wrapper .detail-item{display:flex;flex-direction:column;gap:4px}
    .receipt-print-wrapper .detail-label{font-size:11px;color:#64748b;text-transform:uppercase;font-weight:600}
    .receipt-print-wrapper .detail-val{font-size:15px;font-weight:600;color:#1e293b}

    .receipt-print-wrapper .amount-box{background:#f0fdf4;border:1px solid #bbf7d0;padding:24px;border-radius:12px;text-align:center}
    .receipt-print-wrapper .amount-label{color:#166534;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:8px}
    .receipt-print-wrapper .amount-val{color:#15803d;font-size:36px;font-weight:800}

    .receipt-print-wrapper .breakdown-table{width:100%;border-collapse:collapse;margin-bottom:32px;font-size:13px}
    .receipt-print-wrapper .breakdown-table th{background:#0B1F4E;color:#fff;padding:12px;text-align:left;font-weight:600;text-transform:uppercase;font-size:11px;letter-spacing:0.05em}
    .receipt-print-wrapper .breakdown-table td{padding:12px;border-bottom:1px solid #f1f5f9;color:#1e293b}
    .receipt-print-wrapper .breakdown-table tr:nth-child(even) td{background:#FDF6E3}

    .receipt-print-wrapper .footer{margin-top:40px;text-align:center;font-size:12px;color:#94a3b8;border-top:1px solid #e2e8f0;padding-top:24px}
`;

const posCss = `
    .receipt-print-wrapper, .receipt-print-wrapper * {box-sizing:border-box;margin:0;padding:0}
    .receipt-print-wrapper {font-family:monospace;color:#000;background:#fff;padding:0;width:80mm;margin:0 auto;font-size:12px;text-align:left;}
    @media print{@page{size:80mm auto;margin:0} .receipt-print-wrapper{padding:0}}
    .receipt-print-wrapper .hdr{background:none!important;color:#000!important;padding:15px 0;text-align:center!important;border-bottom:1px dashed #000;margin-bottom:15px}
    .receipt-print-wrapper .hdr h1{font-size:16px;font-weight:bold;margin-bottom:5px;color:#000}
    .receipt-print-wrapper .hdr p{font-size:12px}
    .receipt-print-wrapper .bdy{padding:0}
    .receipt-print-wrapper .meta{display:block;margin-bottom:15px;border-bottom:1px dashed #000;padding-bottom:15px}
    .receipt-print-wrapper .meta-block{margin-bottom:10px}
    .receipt-print-wrapper .meta-label{font-size:11px;font-weight:bold;margin-bottom:2px;text-transform:uppercase}
    .receipt-print-wrapper .meta-val{font-size:13px;font-weight:bold}
    .receipt-print-wrapper .details-grid{display:block;margin-bottom:15px;background:none;padding:0;border:none}
    .receipt-print-wrapper .detail-item{margin-bottom:10px}
    .receipt-print-wrapper .detail-label{font-size:11px;font-weight:bold}
    .receipt-print-wrapper .detail-val{font-size:13px;font-weight:bold}
    .receipt-print-wrapper .amount-box{background:none;border:1px dashed #000;padding:15px;border-radius:0;text-align:center;margin-bottom:20px}
    .receipt-print-wrapper .amount-label{font-size:12px;font-weight:bold;margin-bottom:5px;color:#000}
    .receipt-print-wrapper .amount-val{font-size:20px;font-weight:bold;color:#000}
    .receipt-print-wrapper .breakdown-table{width:100%;border-collapse:collapse;margin-bottom:20px;font-size:11px}
    .receipt-print-wrapper .breakdown-table th{background:none;padding:5px 0;text-align:left;border-bottom:1px dashed #000;border-top:1px dashed #000;color:#000}
    .receipt-print-wrapper .breakdown-table td{padding:5px 0;border-bottom:1px dashed #eee;color:#000}
    .receipt-print-wrapper .footer{margin-top:20px;text-align:center;font-size:11px;border-top:1px dashed #000;padding-top:15px}
`;

export default function ReceiptPrintModal({ tx, settings, onClose, onSuccess }: { tx: any; settings: any; onClose: () => void; onSuccess?: () => void }) {
    const printRef = useRef<HTMLDivElement>(null);
    const [format, setFormat] = useState<'A4' | 'POS'>('A4');

    const handlePrint = () => {
        const content = printRef.current?.innerHTML;
        if (!content) return;
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        document.body.appendChild(iframe);
        const win = iframe.contentWindow;
        if (!win) return;
        win.document.open();
        
        win.document.write(`
            <html>
                <head>
                    <title>Print Receipt</title>
                    <style>${format === 'A4' ? a4Css : posCss}</style>
                </head>
                <body>
                    <div class="receipt-print-wrapper">
                        ${content}
                    </div>
                    <script>
                        window.onload = function() {
                            window.print();
                        }
                    </script>
                </body>
            </html>
        `);
        win.document.close();
        
        setTimeout(() => {
            if (onSuccess && tx.receipt && tx.receipt.id) {
                try {
                    axios.post(`/api/v1/finance-v2/receipts/${tx.receipt.id}/print`, {}, { withCredentials: true });
                    onSuccess();
                } catch (e) {
                    console.error('Failed to mark as printed', e);
                }
            }
            setTimeout(() => { document.body.removeChild(iframe); }, 1000);
        }, 500);
    };

    const receipt = tx.receipt || {};

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 px-4 sm:px-6 py-4 shrink-0 gap-4">
                    <div className="flex items-center justify-between w-full sm:w-auto">
                        <h2 className="font-bold text-slate-900">Receipt Preview</h2>
                        <button onClick={onClose} className="rounded-xl border border-slate-200 p-2 text-slate-500 hover:bg-slate-50 sm:hidden">
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0" style={{ scrollbarWidth: 'none' }}>
                        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl shrink-0">
                            <button 
                                onClick={() => setFormat('A4')}
                                className={`px-3 py-1.5 text-xs font-bold rounded-lg ${format === 'A4' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                A4 Standard
                            </button>
                            <button 
                                onClick={() => setFormat('POS')}
                                className={`px-3 py-1.5 text-xs font-bold rounded-lg ${format === 'POS' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                POS Thermal
                            </button>
                        </div>
                        <button onClick={handlePrint}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-2 rounded-xl bg-[#0B1F4E] px-4 py-2 text-sm font-bold text-white hover:bg-[#122B5C] shrink-0 whitespace-nowrap">
                            <Printer className="h-4 w-4 shrink-0" /> Print / Save
                        </button>
                        <button onClick={onClose}
                            className="hidden sm:block rounded-xl border border-slate-200 p-2 text-slate-500 hover:bg-slate-50 shrink-0">
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                </div>

                <div className="overflow-auto p-4 sm:p-6 bg-slate-50">
                    <div ref={printRef} className={`receipt-print-wrapper bg-white mx-auto shadow-sm relative ${format === 'POS' ? 'w-[300px]' : 'w-full max-w-lg rounded-xl overflow-hidden'}`}>
                        <style>{format === 'A4' ? a4Css : posCss}</style>

                        {/* Watermark for A4 */}
                        {format === 'A4' && settings?.financeModuleToggles?.display?.showWatermark !== false && (
                            <div style={{
                                position: 'absolute',
                                top: '50%',
                                left: '50%',
                                transform: 'translate(-50%, -50%) rotate(-30deg)',
                                fontSize: '56px',
                                fontWeight: 900,
                                opacity: 0.05,
                                pointerEvents: 'none',
                                textTransform: 'uppercase',
                                color: '#15803d',
                                zIndex: 0,
                                letterSpacing: '0.1em'
                            }}>
                                OFFICIAL RECEIPT
                            </div>
                        )}

                        {/* Header */}
                        {(() => {
                            const headerMode = settings?.financeModuleToggles?.display?.headerLayoutMode || 'CLASSIC_LEFT';
                            const showLogo = settings?.financeModuleToggles?.display?.showSchoolLogo !== false && (settings?.logoUrl || tx.student?.school?.logoUrl);
                            const logoSrc = settings?.logoUrl || tx.student?.school?.logoUrl;
                            const schoolName = tx.student?.school?.name || settings?.schoolName || 'School Receipt';

                            if (format === 'POS') {
                                return (
                                    <div className="hdr pos-hdr">
                                        <h1>{schoolName}</h1>
                                        <p>PAYMENT RECEIPT</p>
                                    </div>
                                );
                            }

                            if (headerMode === 'CENTERED') {
                                return (
                                    <div className="hdr" style={{textAlign:'center'}}>
                                        {showLogo && <img src={logoSrc} alt="Logo" className="h-12 mx-auto mb-3 object-contain" />}
                                        <h1>{schoolName}</h1>
                                        <p>OFFICIAL PAYMENT RECEIPT</p>
                                    </div>
                                );
                            }

                            if (headerMode === 'MINIMAL_RIGHT') {
                                return (
                                    <div className="hdr" style={{display:'flex',justifyContent:'space-between',alignItems:'center',textAlign:'left'}}>
                                        <div style={{display:'flex',alignItems:'center',gap:'12px'}}>
                                            {showLogo && <img src={logoSrc} alt="Logo" className="h-10 object-contain" />}
                                            <div>
                                                <h1 style={{fontSize:'18px',marginBottom:'2px'}}>{schoolName}</h1>
                                                <p style={{fontSize:'11px'}}>Official Payment Receipt</p>
                                            </div>
                                        </div>
                                        <div style={{textAlign:'right'}}>
                                            <span style={{fontSize:'11px',background:'rgba(255,255,255,0.2)',padding:'4px 8px',borderRadius:'4px',fontFamily:'monospace',fontWeight:700}}>
                                                {receipt.receiptNumber}
                                            </span>
                                        </div>
                                    </div>
                                );
                            }

                            return (
                                <div className="hdr" style={{display:'flex',alignItems:'center',gap:'16px',textAlign:'left'}}>
                                    {showLogo && <img src={logoSrc} alt="Logo" className="h-12 object-contain" />}
                                    <div>
                                        <h1>{schoolName}</h1>
                                        <p>OFFICIAL PAYMENT RECEIPT</p>
                                    </div>
                                </div>
                            );
                        })()}
                        
                        <div className="bdy" style={{position:'relative',zIndex:1}}>
                            <div className="meta">
                                <div className="meta-block">
                                    <p className="meta-label">Received From</p>
                                    <p className="meta-val">{tx.student?.user?.name}</p>
                                    <p className="meta-sub">Adm No: {tx.student?.admissionNo}</p>
                                    {settings?.financeModuleToggles?.display?.showParentInfo !== false && tx.student?.parent?.user && (
                                        <p className="meta-sub">Parent: {tx.student.parent.user.name}</p>
                                    )}
                                </div>
                                {format === 'A4' && (
                                    <div className="meta-block" style={{textAlign: 'right'}}>
                                        <p className="meta-label">Receipt No.</p>
                                        <p className="meta-val" style={{fontFamily:'monospace'}}>{receipt.receiptNumber}</p>
                                        <p className="meta-sub">{new Date(tx.createdAt).toLocaleDateString()}</p>
                                    </div>
                                )}
                                {format === 'POS' && (
                                    <div className="meta-block">
                                        <p className="meta-label">Receipt No.</p>
                                        <p className="meta-val" style={{fontFamily:'monospace'}}>{receipt.receiptNumber}</p>
                                        <p className="meta-sub">{new Date(tx.createdAt).toLocaleDateString()} {new Date(tx.createdAt).toLocaleTimeString()}</p>
                                    </div>
                                )}
                            </div>
                            
                            <div className="details-grid">
                                <div className="detail-item">
                                    <p className="detail-label">Payment Method</p>
                                    <p className="detail-val">{tx.method?.replace(/_/g, ' ')}</p>
                                </div>
                                <div className="detail-item">
                                    <p className="detail-label">Reference</p>
                                    <p className="detail-val" style={{fontFamily:'monospace'}}>{tx.reference}</p>
                                </div>
                                {receipt.invoiceNumbers && receipt.invoiceNumbers.length > 0 && (
                                    <div className="detail-item" style={{gridColumn: format === 'A4' ? '1 / -1' : 'auto'}}>
                                        <p className="detail-label">Applied To</p>
                                        <p className="detail-val">{receipt.invoiceNumbers.join(', ')}</p>
                                    </div>
                                )}
                            </div>
                            
                            <div className="amount-box">
                                <p className="amount-label">Amount Paid</p>
                                <p className="amount-val">{settings?.currencySymbol || '₦'}{Number(tx.amount).toLocaleString()}</p>
                            </div>

                            {settings?.financeModuleToggles?.display?.showItemizedBreakdown !== false && settings?.showItemizedBreakdown !== false && tx.allocations && tx.allocations.length > 0 && (
                                <table className="breakdown-table">
                                    <thead>
                                        <tr>
                                            <th>Description</th>
                                            <th style={{textAlign: 'right'}}>Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {tx.allocations.map((alloc: any, i: number) => (
                                            <React.Fragment key={i}>
                                                <tr>
                                                    <td colSpan={2} style={{fontWeight: 700, backgroundColor: format === 'POS' ? 'transparent' : '#f8fafc', fontSize: format === 'POS' ? '10px' : '12px'}}>
                                                        Invoice {alloc.invoice?.invoiceNumber}
                                                    </td>
                                                </tr>
                                                {alloc.invoice?.items?.map((item: any, j: number) => (
                                                    <tr key={j}>
                                                        <td>{item.label || item.name}</td>
                                                        <td style={{textAlign: 'right'}}>{settings?.currencySymbol || '₦'}{Number(item.amount).toLocaleString()}</td>
                                                    </tr>
                                                ))}
                                            </React.Fragment>
                                        ))}
                                    </tbody>
                                </table>
                            )}

                            {/* Signatures & Stamp Line for A4 */}
                            {format === 'A4' && settings?.financeModuleToggles?.display?.showSignatureLine !== false && (
                                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-end',marginTop:'32px',paddingTop:'16px'}}>
                                    <div style={{textAlign:'center',width:'150px'}}>
                                        <div style={{borderBottom:'1px dashed #94a3b8',height:'24px',marginBottom:'4px'}}></div>
                                        <p style={{fontSize:'9px',color:'#64748b',fontWeight:700,textTransform:'uppercase'}}>Cashier Signature</p>
                                    </div>
                                    <div style={{textAlign:'center',width:'150px'}}>
                                        <div style={{borderBottom:'1px dashed #94a3b8',height:'24px',marginBottom:'4px'}}></div>
                                        <p style={{fontSize:'9px',color:'#64748b',fontWeight:700,textTransform:'uppercase'}}>Official Stamp & Date</p>
                                    </div>
                                </div>
                            )}
                            
                            <div className="footer">
                                <p>{settings?.financeModuleToggles?.display?.footerNote || 'Thank you for your payment!'}</p>
                                <p style={{marginTop: '4px', opacity: 0.7}}>Generated by Bursary & Finance Dept</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
