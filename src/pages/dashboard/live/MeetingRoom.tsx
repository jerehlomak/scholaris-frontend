/**
 * MeetingRoom.tsx — Full-screen live video conference room
 *
 * Sub-components used:
 *  - MeetingToolbar  → bottom control bar (mic, cam, screen share, record, chat, participants)
 *  - ChatPanel       → slide-in right chat panel
 *  - ParticipantsPanel → slide-in right participants list
 *
 * Real browser APIs used:
 *  - navigator.mediaDevices.getUserMedia   → local camera + microphone
 *  - navigator.mediaDevices.getDisplayMedia → screen sharing
 *  - MediaRecorder                          → session recording (downloads .webm)
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Radio, Maximize2, Minimize2, ChevronLeft, Monitor, MicOff, VideoOff } from 'lucide-react';

import { MeetingToolbar } from './components/MeetingToolbar';
import { ChatPanel, type ChatMessage } from './components/ChatPanel';
import { ParticipantsPanel } from './components/ParticipantsPanel';

// ─── Mock participants ────────────────────────────────────────────────────────
const MOCK_PARTICIPANTS = [
    { id: 'p1', name: 'Ayomide Balogun', avatar: 'AB', color: 'bg-purple-500', muted: false },
    { id: 'p2', name: 'Chinoso Obi', avatar: 'CO', color: 'bg-orange-500', muted: true },
    { id: 'p3', name: 'Fatima Musa', avatar: 'FM', color: 'bg-pink-500', muted: false },
    { id: 'p4', name: 'Emmanuel Adeyemi', avatar: 'EA', color: 'bg-teal-500', muted: true },
    { id: 'p5', name: 'Blessing Nwosu', avatar: 'BN', color: 'bg-indigo-500', muted: false },
];

const INITIAL_CHAT: ChatMessage[] = [
    { id: '1', sender: 'Ayomide Balogun', text: 'Good afternoon, sir!', time: '14:01' },
    { id: '2', sender: 'Fatima Musa', text: 'Ready to learn 📖', time: '14:02' },
    { id: '3', sender: 'Chinoso Obi', text: 'Please can you repeat the last part?', time: '14:04' },
];

// ─── Participant tile ─────────────────────────────────────────────────────────
function ParticipantTile({ name, avatar, color, muted }: { name: string; avatar: string; color: string; muted: boolean }) {
    return (
        <div className="relative rounded-xl overflow-hidden bg-[#1a2035] flex items-center justify-center aspect-video">
            <div className={`w-14 h-14 ${color} rounded-full flex items-center justify-center font-bold text-white shadow-lg text-xl`}>
                {avatar}
            </div>
            <div className="absolute bottom-2 left-2 flex items-center gap-1.5 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-md">
                {muted && <MicOff className="w-3 h-3 text-red-400" />}
                <span className="text-white text-xs font-medium truncate max-w-[100px]">{name}</span>
            </div>
        </div>
    );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function MeetingRoom() {
    const { roomId } = useParams();
    const navigate = useNavigate();

    // ── Media refs ────────────────────────────────────────────────────────────
    const localVideoRef = useRef<HTMLVideoElement>(null);
    const screenVideoRef = useRef<HTMLVideoElement>(null);
    const localStreamRef = useRef<MediaStream | null>(null);
    const screenStreamRef = useRef<MediaStream | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const recordedChunksRef = useRef<Blob[]>([]);

    // ── UI state ──────────────────────────────────────────────────────────────
    const [micOn, setMicOn] = useState(true);
    const [camOn, setCamOn] = useState(true);
    const [screenSharing, setScreenSharing] = useState(false);
    const [recording, setRecording] = useState(false);
    const [handRaised, setHandRaised] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [sidePanel, setSidePanel] = useState<null | 'chat' | 'participants'>(null);
    const [elapsed, setElapsed] = useState(0);
    const [cameraError, setCameraError] = useState(false);

    // ── Chat state ────────────────────────────────────────────────────────────
    const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_CHAT);
    const [chatInput, setChatInput] = useState('');

    // ── Start camera on mount ─────────────────────────────────────────────────
    useEffect(() => {
        let active = true;
        (async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                if (!active) { stream.getTracks().forEach(t => t.stop()); return; }
                localStreamRef.current = stream;
                if (localVideoRef.current) localVideoRef.current.srcObject = stream;
            } catch {
                setCameraError(true);
            }
        })();
        const timer = setInterval(() => setElapsed(e => e + 1), 1000);
        return () => {
            active = false;
            clearInterval(timer);
            localStreamRef.current?.getTracks().forEach(t => t.stop());
            screenStreamRef.current?.getTracks().forEach(t => t.stop());
            mediaRecorderRef.current?.stop();
        };
    }, []);

    const formatTime = (s: number) =>
        `${String(Math.floor(s / 3600)).padStart(2, '0')}:${String(Math.floor((s % 3600) / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

    // ── Controls ──────────────────────────────────────────────────────────────
    const toggleMic = useCallback(() => {
        localStreamRef.current?.getAudioTracks().forEach(t => { t.enabled = !t.enabled; });
        setMicOn(m => !m);
    }, []);

    const toggleCam = useCallback(() => {
        localStreamRef.current?.getVideoTracks().forEach(t => { t.enabled = !t.enabled; });
        setCamOn(c => !c);
    }, []);

    const toggleScreen = useCallback(async () => {
        if (screenSharing) {
            screenStreamRef.current?.getTracks().forEach(t => t.stop());
            screenStreamRef.current = null;
            if (screenVideoRef.current) screenVideoRef.current.srcObject = null;
            setScreenSharing(false);
        } else {
            try {
                const stream = await (navigator.mediaDevices as any).getDisplayMedia({ video: true, audio: true });
                screenStreamRef.current = stream;
                if (screenVideoRef.current) screenVideoRef.current.srcObject = stream;
                setScreenSharing(true);
                stream.getVideoTracks()[0].addEventListener('ended', () => {
                    setScreenSharing(false);
                    screenStreamRef.current = null;
                });
            } catch { /* cancelled */ }
        }
    }, [screenSharing]);

    const toggleRecording = useCallback(() => {
        if (recording) {
            mediaRecorderRef.current?.stop();
            setRecording(false);
        } else {
            const stream = localStreamRef.current;
            if (!stream) return;
            recordedChunksRef.current = [];
            const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
            recorder.ondataavailable = e => { if (e.data.size > 0) recordedChunksRef.current.push(e.data); };
            recorder.onstop = () => {
                const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `class-${roomId}-${Date.now()}.webm`;
                a.click();
            };
            recorder.start();
            mediaRecorderRef.current = recorder;
            setRecording(true);
        }
    }, [recording, roomId]);

    const handleLeave = () => {
        localStreamRef.current?.getTracks().forEach(t => t.stop());
        screenStreamRef.current?.getTracks().forEach(t => t.stop());
        if (recording) mediaRecorderRef.current?.stop();
        navigate(-1);
    };

    const handleSendChat = (text: string) => {
        setMessages(m => [...m, {
            id: crypto.randomUUID(),
            sender: 'You (Host)',
            text,
            time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
        }]);
        setChatInput('');
    };

    // ─── Render ───────────────────────────────────────────────────────────────
    return (
        <div className="fixed inset-0 bg-[#0d1117] flex flex-col z-50 font-dash">

            {/* ── Top Bar ── */}
            <div className="flex items-center justify-between px-5 py-3 bg-[#161b22] border-b border-white/10 shrink-0">
                <div className="flex items-center gap-3">
                    <button onClick={handleLeave} className="p-2 rounded-lg hover:bg-white/10 text-gray-400 transition-colors">
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <p className="text-white font-bold text-sm truncate max-w-[180px]">Room: {roomId}</p>
                        <p className="text-gray-400 text-xs">{MOCK_PARTICIPANTS.length + 1} participants</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {recording ? (
                        <div className="flex items-center gap-1.5 text-red-400 text-xs font-bold animate-pulse">
                            🔴 REC {formatTime(elapsed)}
                        </div>
                    ) : (
                        <div className="flex items-center gap-1.5 text-gray-400 text-xs font-mono">
                            <Clock className="w-3.5 h-3.5" /> {formatTime(elapsed)}
                        </div>
                    )}
                    <div className="flex items-center gap-1.5 bg-red-500/20 text-red-400 px-3 py-1 rounded-full text-xs font-bold">
                        <Radio className="w-3 h-3" /> LIVE
                    </div>
                    <button onClick={() => setIsFullscreen(f => !f)} className="p-2 rounded-lg hover:bg-white/10 text-gray-400 transition-colors">
                        {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                    </button>
                </div>
            </div>

            {/* ── Main Area ── */}
            <div className="flex flex-1 overflow-hidden">

                {/* Video grid */}
                <div className="flex-1 flex flex-col overflow-hidden">

                    {/* Screen share view */}
                    {screenSharing && (
                        <div className="flex-1 relative bg-black">
                            <video ref={screenVideoRef} autoPlay muted className="w-full h-full object-contain" />
                            <div className="absolute top-3 left-3 bg-[#0036a1]/80 backdrop-blur-sm text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5">
                                <Monitor className="w-3.5 h-3.5" /> Your Screen
                            </div>
                        </div>
                    )}

                    {/* Participant tiles */}
                    <div className={`${screenSharing ? 'h-36 border-t border-white/10' : 'flex-1'} p-3`}>
                        <div className={`grid gap-3 h-full ${screenSharing ? 'grid-cols-6' : 'grid-cols-2 md:grid-cols-3'}`}>

                            {/* Local tile */}
                            <div className="relative rounded-xl overflow-hidden bg-[#1a2035] aspect-video">
                                {camOn && !cameraError ? (
                                    <video ref={localVideoRef} autoPlay muted playsInline className="w-full h-full object-cover scale-x-[-1]" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <div className="w-14 h-14 bg-[#0036a1] rounded-full flex items-center justify-center text-white font-bold text-xl">You</div>
                                    </div>
                                )}
                                <div className="absolute bottom-2 left-2 flex items-center gap-1.5 bg-black/60 px-2 py-1 rounded-md">
                                    {!micOn && <MicOff className="w-3 h-3 text-red-400" />}
                                    {!camOn && <VideoOff className="w-3 h-3 text-gray-400" />}
                                    <span className="text-white text-xs font-bold">You (Host)</span>
                                </div>
                                {handRaised && (
                                    <div className="absolute top-2 right-2 bg-[#ff9800] rounded-full w-7 h-7 flex items-center justify-center text-base">✋</div>
                                )}
                            </div>

                            {MOCK_PARTICIPANTS.map(p => (
                                <ParticipantTile key={p.id} name={p.name} avatar={p.avatar} color={p.color} muted={p.muted} />
                            ))}
                        </div>
                    </div>
                </div>

                {/* ── Side Panel ── */}
                <AnimatePresence>
                    {sidePanel && (
                        <motion.div
                            initial={{ width: 0, opacity: 0 }}
                            animate={{ width: 320, opacity: 1 }}
                            exit={{ width: 0, opacity: 0 }}
                            className="bg-[#161b22] border-l border-white/10 flex flex-col overflow-hidden shrink-0"
                        >
                            {sidePanel === 'chat' && (
                                <ChatPanel
                                    messages={messages}
                                    input={chatInput}
                                    onInputChange={setChatInput}
                                    onSend={handleSendChat}
                                    onClose={() => setSidePanel(null)}
                                />
                            )}
                            {sidePanel === 'participants' && (
                                <ParticipantsPanel
                                    participants={MOCK_PARTICIPANTS}
                                    localMuted={!micOn}
                                    localCamOn={camOn}
                                    onClose={() => setSidePanel(null)}
                                />
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* ── Toolbar ── */}
            <MeetingToolbar
                micOn={micOn}
                camOn={camOn}
                screenSharing={screenSharing}
                recording={recording}
                handRaised={handRaised}
                sidePanel={sidePanel}
                onToggleMic={toggleMic}
                onToggleCam={toggleCam}
                onToggleScreen={toggleScreen}
                onToggleRecording={toggleRecording}
                onToggleHand={() => setHandRaised(h => !h)}
                onToggleChat={() => setSidePanel(p => p === 'chat' ? null : 'chat')}
                onToggleParticipants={() => setSidePanel(p => p === 'participants' ? null : 'participants')}
                onLeave={handleLeave}
            />
        </div>
    );
}
