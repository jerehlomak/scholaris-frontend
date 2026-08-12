import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Code, Loader2, Play, Terminal, CheckCircle2, XCircle } from 'lucide-react';
import { SettingsShell } from '../settings/shared/SettingsShell';
import { SettingsHero } from '../settings/shared/SettingsHero';

const API = '/api/v1/school/attendance';

export default function ScanSimulator() {
    const [qrToken, setQrToken] = useState('');
    const [log, setLog] = useState<{ time: string; type: 'success' | 'error' | 'duplicate'; msg: string; payload?: any } | null>(null);
    const [isScanning, setIsScanning] = useState(false);

    const handleSimulateScan = async () => {
        if (!qrToken.trim()) return toast.error('Please paste a raw QR token to simulate');
        
        setIsScanning(true);
        setLog(null);

        try {
            // First ensure we have a scanner device token (standard procedure)
            let scannerToken = localStorage.getItem('skooly_scanner_token');
            if (!scannerToken) {
                const regRes = await axios.post(`${API}/scanner/register`, { deviceInfo: 'Test Simulator Sandbox' }, { withCredentials: true });
                scannerToken = regRes.data.token;
                if (scannerToken) {
                    localStorage.setItem('skooly_scanner_token', scannerToken);
                }
            }

            const { data } = await axios.post(`${API}/scan`, { 
                qrToken, 
                scannerToken, 
                deviceInfo: 'Test Simulator Sandbox' 
            }, { withCredentials: true });

            setLog({
                time: new Date().toLocaleTimeString(),
                type: data.duplicate ? 'duplicate' : 'success',
                msg: data.msg,
                payload: data
            });
            toast[data.duplicate ? 'info' : 'success'](data.msg);
        } catch (err: any) {
            const errorMsg = err.response?.data?.msg || err.message;
            setLog({
                time: new Date().toLocaleTimeString(),
                type: 'error',
                msg: errorMsg,
                payload: err.response?.data
            });
            toast.error(errorMsg);
        } finally {
            setIsScanning(false);
        }
    };

    return (
        <SettingsShell breadcrumbParent="Attendance" breadcrumbCurrent="Scan Simulator" tabLabel="Sandbox Environment" tabIcon={<Terminal className="h-3.5 w-3.5" />}>
            <SettingsHero
                icon={<Code className="h-7 w-7 text-indigo-500" />}
                title="Scan Sandbox & Simulator"
                subtitle="Safely test cryptographic QR token payloads against the attendance engine without spinning up physical cameras."
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
                {/* Input Panel */}
                <div className="space-y-4">
                    <h3 className="font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400">Payload Injector</h3>
                    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6">
                        <label className="block text-sm font-bold text-slate-700 mb-2">Raw JWT Payload</label>
                        <textarea 
                            value={qrToken}
                            onChange={e => setQrToken(e.target.value)}
                            placeholder="eyJhbGciOiJIUzI1NiIsInR..."
                            className="w-full h-32 rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs font-mono text-slate-600 outline-none focus:border-indigo-400 focus:bg-white resize-none"
                        ></textarea>
                        
                        <button 
                            onClick={handleSimulateScan}
                            disabled={isScanning}
                            className="mt-4 w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-all"
                        >
                            {isScanning ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5" />}
                            Execute Scan Simulation
                        </button>
                    </div>
                </div>

                {/* Response Log Panel */}
                <div className="space-y-4">
                    <h3 className="font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400">Engine Response</h3>
                    <div className="rounded-2xl border border-slate-200 bg-slate-900 shadow-sm p-6 min-h-[240px] flex flex-col font-mono text-xs">
                        {log ? (
                            <div className={`flex flex-col gap-3 ${log.type === 'error' ? 'text-red-400' : log.type === 'duplicate' ? 'text-orange-400' : 'text-emerald-400'}`}>
                                <div className="flex items-center gap-2 font-bold text-sm">
                                    {log.type === 'error' ? <XCircle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
                                    [{log.time}] STATUS: {log.type.toUpperCase()}
                                </div>
                                <div className="text-slate-300">"{log.msg}"</div>
                                {log.payload && (
                                    <div className="mt-4 bg-black/30 p-4 rounded-lg overflow-x-auto text-slate-400">
                                        <pre>{JSON.stringify(log.payload, null, 2)}</pre>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-slate-600">
                                <Terminal className="w-8 h-8 mb-2 opacity-30" />
                                <p>Awaiting payload injection...</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </SettingsShell>
    );
}
