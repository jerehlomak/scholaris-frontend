import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import axios from 'axios';
import { toast } from 'sonner';
import { Scan, ShieldCheck, ShieldAlert, Loader2, Upload, Camera, X } from 'lucide-react';
import { SettingsShell } from '../settings/shared/SettingsShell';

const API = '/api/v1/school/attendance';

type ScanMode = 'camera' | 'file';
type ScanState = 'idle' | 'processing' | 'success' | 'error';

const TeacherWrapper = ({ children }: { children: React.ReactNode }) => (
    <div className="w-full max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
                <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                    <Scan className="w-6 h-6 text-indigo-600" />
                    Scanner Terminal
                </h1>
                <p className="text-slate-500 text-sm mt-1">
                    Scan student or staff ID cards to mark attendance instantly.
                </p>
            </div>
        </div>
        <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-6 md:p-8 min-h-[600px] w-full mx-auto">
            {children}
        </div>
    </div>
);

export default function ScannerApp({ isTeacherDashboard }: { isTeacherDashboard?: boolean } = {}) {
    const [scannerToken, setScannerToken] = useState<string | null>(null);
    const [tokenLoading, setTokenLoading] = useState(true);
    const [mode, setMode] = useState<ScanMode>('camera');
    const [scanState, setScanState] = useState<ScanState>('idle');
    const [message, setMessage] = useState('');
    const [cameraActive, setCameraActive] = useState(false);
    const [dragOver, setDragOver] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const html5QrRef = useRef<Html5Qrcode | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const isScanningRef = useRef(false);

    // Provision hardware session token
    useEffect(() => {
        const initSession = async () => {
            try {
                const { data } = await axios.post(
                    `${API}/scanner/register`,
                    { deviceInfo: navigator.userAgent },
                    { withCredentials: true }
                );
                setScannerToken(data.token);
            } catch {
                toast.error('Failed to authenticate scanner session. Check your permissions.');
            } finally {
                setTokenLoading(false);
            }
        };
        initSession();
    }, []);

    const processScan = useCallback(async (qrToken: string) => {
        if (isScanningRef.current || !scannerToken) return;
        isScanningRef.current = true;
        setScanState('processing');

        try {
            // Stop camera during processing
            if (html5QrRef.current?.isScanning) {
                await html5QrRef.current.stop();
                setCameraActive(false);
            }

            const { data } = await axios.post(
                `${API}/scan`,
                { qrToken, scannerToken, deviceInfo: navigator.userAgent },
                { withCredentials: true }
            );

            setScanState('success');
            setMessage(data.msg || 'Attendance recorded!');
        } catch (err: any) {
            setScanState('error');
            setMessage(err.response?.data?.msg || 'Invalid or unrecognized QR code');
        }

        // Reset after 3 seconds
        setTimeout(() => {
            setScanState('idle');
            setMessage('');
            setPreviewUrl(null);
            isScanningRef.current = false;
        }, 3000);
    }, [scannerToken]);

    // Start camera
    const startCamera = useCallback(async () => {
        if (!scannerToken || cameraActive) return;

        // Create reader element if necessary
        const readerId = 'qr-camera-reader';
        const el = document.getElementById(readerId);
        if (!el) return;

        try {
            const qr = new Html5Qrcode(readerId);
            html5QrRef.current = qr;

            await qr.start(
                { facingMode: 'environment' },
                { fps: 10, qrbox: { width: 240, height: 240 }, disableFlip: false },
                (decoded) => processScan(decoded),
                undefined // suppress verbose errors
            );
            setCameraActive(true);
        } catch (err: any) {
            toast.error('Camera access denied. Check browser permissions or use image upload.');
            setCameraActive(false);
        }
    }, [scannerToken, cameraActive, processScan]);

    // Stop camera
    const stopCamera = useCallback(async () => {
        if (html5QrRef.current?.isScanning) {
            await html5QrRef.current.stop();
            html5QrRef.current = null;
        }
        setCameraActive(false);
    }, []);

    // Auto-start camera when in camera mode and token ready
    useEffect(() => {
        if (mode === 'camera' && scannerToken && !tokenLoading) {
            // Small delay so DOM element is ready
            const t = setTimeout(() => startCamera(), 300);
            return () => clearTimeout(t);
        }
        if (mode === 'file') {
            stopCamera();
        }
    }, [mode, scannerToken, tokenLoading]);

    // Cleanup on unmount
    useEffect(() => {
        return () => { stopCamera(); };
    }, []);

    // Scan image file (for image drop / file upload)
    const scanImageFile = useCallback(async (file: File) => {
        if (!scannerToken) { toast.error('Scanner session not ready yet.'); return; }
        if (!file.type.startsWith('image/')) { toast.error('Please upload an image file.'); return; }

        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
        setScanState('processing');
        setMessage('Reading QR code from image...');

        try {
            const readerId = 'qr-file-reader';
            // Html5Qrcode.scanFile needs a separate instance (not tied to DOM video)
            const qr = new Html5Qrcode(readerId);
            const decoded = await qr.scanFile(file, /* showImage */ false);
            await processScan(decoded);
        } catch {
            setScanState('error');
            setMessage('No valid QR code found in this image. Try a clearer photo.');
            setTimeout(() => {
                setScanState('idle');
                setMessage('');
                setPreviewUrl(null);
                isScanningRef.current = false;
            }, 3000);
        }
    }, [scannerToken, processScan]);

    const handleFileDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files[0];
        if (file) scanImageFile(file);
    };

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) scanImageFile(file);
        e.target.value = '';
    };

    const switchMode = async (newMode: ScanMode) => {
        if (newMode === mode) return;
        await stopCamera();
        setScanState('idle');
        setMessage('');
        setPreviewUrl(null);
        isScanningRef.current = false;
        setMode(newMode);
    };

    const Wrapper: any = isTeacherDashboard ? TeacherWrapper : SettingsShell;
    const wrapperProps = isTeacherDashboard ? {} : {
        breadcrumbParent: "Attendance",
        breadcrumbCurrent: "Scanner Terminal",
        tabLabel: "Scanner Terminal",
        tabIcon: <Scan className="h-3.5 w-3.5" />
    };

    return (
        <Wrapper {...wrapperProps}>
            <div className="max-w-2xl mx-auto py-2">
                {/* Header */}
                {!isTeacherDashboard && (
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <Scan className="w-6 h-6 text-indigo-600" />
                        Scanner Terminal
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">
                        Scan student or staff ID cards to mark attendance instantly.
                    </p>
                </div>
                )}

            {/* Session badge */}
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold mb-6 w-fit ${
                tokenLoading ? 'bg-slate-100 text-slate-500' :
                scannerToken ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                'bg-red-50 text-red-700 border border-red-200'
            }`}>
                {tokenLoading ? <Loader2 className="w-3 h-3 animate-spin" /> :
                    scannerToken ? <ShieldCheck className="w-3 h-3" /> : <ShieldAlert className="w-3 h-3" />}
                {tokenLoading ? 'Initializing session...' :
                    scannerToken ? 'Hardware session authenticated' : 'Session failed — refresh to retry'}
            </div>

            {/* Mode tabs */}
            <div className="flex bg-slate-100 rounded-xl p-1 mb-6">
                <button
                    onClick={() => switchMode('camera')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                        mode === 'camera' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                    }`}
                >
                    <Camera className="w-4 h-4" /> Camera
                </button>
                <button
                    onClick={() => switchMode('file')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                        mode === 'file' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                    }`}
                >
                    <Upload className="w-4 h-4" /> Upload Image
                </button>
            </div>

            {/* Result overlay */}
            {(scanState === 'success' || scanState === 'error') && (
                <div className={`flex items-center gap-4 p-5 rounded-2xl mb-6 border-2 ${
                    scanState === 'success' ? 'bg-emerald-50 border-emerald-300 text-emerald-800' :
                    'bg-red-50 border-red-300 text-red-800'
                }`}>
                    {scanState === 'success' ?
                        <ShieldCheck className="w-10 h-10 text-emerald-600 shrink-0" /> :
                        <ShieldAlert className="w-10 h-10 text-red-500 shrink-0" />}
                    <div>
                        <p className="font-bold text-lg">{scanState === 'success' ? 'Attendance Recorded!' : 'Scan Failed'}</p>
                        <p className="text-sm opacity-80">{message}</p>
                    </div>
                </div>
            )}

            {scanState === 'processing' && (
                <div className="flex items-center gap-4 p-5 rounded-2xl mb-6 bg-indigo-50 border-2 border-indigo-200 text-indigo-800">
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-500 shrink-0" />
                    <p className="font-semibold">{message || 'Processing...'}</p>
                </div>
            )}

            {/* Camera viewfinder */}
            {mode === 'camera' && (
                <div className="rounded-3xl overflow-hidden bg-black border-4 border-slate-900 shadow-2xl relative aspect-square sm:aspect-video">
                    {/* Hidden div used purely to init html5-qrcode VideoElement */}
                    <div id="qr-camera-reader" className="absolute inset-0 [&_video]:w-full [&_video]:h-full [&_video]:object-cover [&_img]:hidden [&>div:last-child]:hidden"></div>

                    {/* Corner brackets overlay */}
                    {scanState === 'idle' && cameraActive && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                            <div className="w-48 h-48 sm:w-64 sm:h-64 relative">
                                <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-indigo-400 rounded-tl-lg" />
                                <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-indigo-400 rounded-tr-lg" />
                                <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-indigo-400 rounded-bl-lg" />
                                <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-indigo-400 rounded-br-lg" />
                            </div>
                        </div>
                    )}

                    {/* Loading camera state */}
                    {!cameraActive && scanState === 'idle' && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-white/70 z-10 bg-black">
                            {tokenLoading || !scannerToken ? (
                                <><Loader2 className="w-8 h-8 animate-spin mb-3" /><p className="text-sm">Initializing...</p></>
                            ) : (
                                <><Camera className="w-10 h-10 mb-3 opacity-60" /><p className="text-sm">Starting camera...</p></>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Image upload / drop zone */}
            {mode === 'file' && (
                <div>
                    {/* Hidden element required by html5-qrcode scanFile */}
                    <div id="qr-file-reader" className="hidden"></div>

                    {previewUrl && scanState !== 'idle' ? (
                        <div className="relative rounded-2xl overflow-hidden bg-black aspect-video flex items-center justify-center">
                            <img src={previewUrl} alt="Scanning" className="max-h-full max-w-full object-contain opacity-60" />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <Loader2 className="w-10 h-10 text-white animate-spin" />
                            </div>
                        </div>
                    ) : (
                        <div
                            onDrop={handleFileDrop}
                            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                            onDragLeave={() => setDragOver(false)}
                            onClick={() => fileInputRef.current?.click()}
                            className={`border-2 border-dashed rounded-2xl p-12 flex flex-col items-center justify-center cursor-pointer transition-all text-center ${
                                dragOver ? 'border-indigo-500 bg-indigo-50 scale-[1.02]' : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50'
                            }`}
                        >
                            <Upload className={`w-12 h-12 mb-4 ${dragOver ? 'text-indigo-500' : 'text-slate-400'}`} />
                            <p className="text-slate-700 font-semibold text-lg">Drop an ID card image here</p>
                            <p className="text-slate-400 text-sm mt-1">or click to browse a photo</p>
                            <p className="text-slate-300 text-xs mt-4">Accepts PNG, JPG, WEBP screenshots of ID cards</p>
                        </div>
                    )}
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileInput}
                    />
                </div>
            )}

            {/* Info footer */}
            <div className="mt-8 bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-500 flex gap-3">
                <Scan className="w-5 h-5 shrink-0 text-slate-400 mt-0.5" />
                <p>
                    <strong className="text-slate-700">Camera mode:</strong> Position the QR code within the bracket guides. A 3-second cooldown prevents double scans. &nbsp;
                    <strong className="text-slate-700">Image upload:</strong> Drop or upload a screenshot of any student or staff ID card — the system will decode the embedded QR code automatically.
                </p>
            </div>
            </div>
        </Wrapper>
    );
}
