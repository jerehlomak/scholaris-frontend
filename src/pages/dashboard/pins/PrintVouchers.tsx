import { useAuth } from '../../../context/AuthContext';
import { createPortal } from 'react-dom';

interface PrintVouchersProps {
    pins: any[];
    onClose: () => void;
}

export default function PrintVouchers({ pins, onClose }: PrintVouchersProps) {
    const { user } = useAuth();
    const schoolName = (user as any)?.schoolName || (user as any)?.school?.name || (user as any)?.schoolDetails?.name || 'School Name';
    const logoUrl = (user as any)?.school?.logoUrl || (user as any)?.schoolDetails?.logoUrl;

    const handlePrint = () => {
        window.print();
    };

    const content = (
        <div id="print-voucher-container" className="fixed inset-0 z-[200] bg-white overflow-y-auto print:relative print:overflow-visible text-black flex flex-col">
            <div className="print:hidden sticky top-0 z-[210] flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 gap-4 bg-slate-900 text-white shadow-md">
                <div>
                    <h2 className="text-lg font-bold tracking-widest text-white">Print PIN Vouchers</h2>
                    <p className="text-sm text-white">Showing {pins.length} PINs formatted for A4 printing (20 cards per page).</p>
                </div>
                <div className="flex gap-4 w-full sm:w-auto">
                    <button onClick={handlePrint} className="flex-1 sm:flex-none px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors">
                        Print Now
                    </button>
                    <button onClick={onClose} className="flex-1 sm:flex-none px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-lg transition-colors">
                        Close
                    </button>
                </div>
            </div>

            <div className="p-4 sm:p-8 print:p-0 mx-auto w-full max-w-[210mm] print:w-[210mm] print:max-w-none grid grid-cols-1 sm:grid-cols-2 print:grid-cols-2 gap-4 print:gap-[5mm] content-start">
                {pins.map((pin) => (
                    <div key={pin.id} className="border-2 border-black p-3 flex items-center break-inside-avoid min-h-[120px] sm:h-[35mm] print:h-[35mm] bg-white rounded-lg relative overflow-hidden">
                        {/* Left Logo */}
                        <div className="w-[30%] flex justify-center items-center pr-3 border-r-2 border-dashed border-gray-300 h-full">
                            {logoUrl ? (
                                <img src={logoUrl} alt="Logo" className="w-16 h-16 object-contain" />
                            ) : (
                                <div className="w-14 h-14 rounded-full border-2 border-black flex items-center justify-center text-[10px] font-bold text-center bg-gray-50">LOGO</div>
                            )}
                        </div>
                        
                        {/* Right Text */}
                        <div className="w-[70%] flex flex-col items-center justify-center text-center pl-3">
                            <h3 className="font-bold text-[14px] text-black leading-tight mb-2 uppercase truncate w-full">{schoolName}</h3>
                            <div className="text-[14px] text-black font-black flex items-center justify-center gap-2 mb-2 w-full bg-gray-100 py-1.5 border border-black">
                                <span className="uppercase text-[10px] font-bold text-gray-700">PIN:</span>
                                <span className="tracking-widest">{pin.pinCode}</span>
                            </div>
                            <div className="flex justify-between items-end w-full">
                                <div className="text-left">
                                    <p className="text-[10px] text-black font-bold uppercase mb-0.5">
                                        {pin.pinType.replace(/_/g, ' ')}
                                    </p>
                                    <p className="text-[9px] text-gray-600 leading-tight">
                                        S/N: {pin.serialNumber}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[8px] text-gray-500 leading-tight">
                                        {window.location.hostname}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <style>{`
                @media print {
                    @page {
                        size: A4;
                        margin: 10mm;
                    }
                    body > :not(#print-voucher-container) {
                        display: none !important;
                    }
                    #print-voucher-container {
                        position: relative !important;
                        left: 0;
                        top: 0;
                        width: 100%;
                        height: auto !important;
                        overflow: visible !important;
                        display: block !important;
                    }
                    .print\\:hidden {
                        display: none !important;
                    }
                    body {
                        margin: 0;
                        padding: 0;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    * {
                        color: black !important;
                    }
                    img {
                        color: transparent !important;
                    }
                }
            `}</style>
        </div>
    );

    return createPortal(content, document.body);
}
