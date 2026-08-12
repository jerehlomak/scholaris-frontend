import {
    Mic, MicOff, Video, VideoOff, Monitor, MonitorOff,
    MessageSquare, Users, Circle, Square, MoreVertical, PhoneOff
} from 'lucide-react';

interface Props {
    micOn: boolean;
    camOn: boolean;
    screenSharing: boolean;
    recording: boolean;
    handRaised: boolean;
    sidePanel: null | 'chat' | 'participants';
    onToggleMic: () => void;
    onToggleCam: () => void;
    onToggleScreen: () => void;
    onToggleRecording: () => void;
    onToggleHand: () => void;
    onToggleChat: () => void;
    onToggleParticipants: () => void;
    onLeave: () => void;
}

function ToolBtn({ onClick, icon, label, danger, highlight }: {
    onClick: () => void;
    icon: React.ReactNode;
    label: string;
    danger?: boolean;
    highlight?: boolean;
}) {
    return (
        <button
            onClick={onClick}
            className={`flex flex-col items-center gap-1 px-3 py-2.5 rounded-xl transition-all
        ${danger ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                    : highlight ? 'bg-[#0036a1]/60 text-blue-300 hover:bg-[#0036a1]'
                        : 'bg-white/10 text-gray-300 hover:bg-white/20'}`}
        >
            {icon}
            <span className="text-[10px] font-bold whitespace-nowrap">{label}</span>
        </button>
    );
}

export function MeetingToolbar({
    micOn, camOn, screenSharing, recording, handRaised, sidePanel,
    onToggleMic, onToggleCam, onToggleScreen, onToggleRecording,
    onToggleHand, onToggleChat, onToggleParticipants, onLeave,
}: Props) {
    return (
        <div className="bg-[#161b22] border-t border-white/10 px-6 py-4 flex items-center justify-between shrink-0">
            {/* Left: mic / cam */}
            <div className="flex items-center gap-2">
                <ToolBtn onClick={onToggleMic}
                    icon={micOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                    label={micOn ? 'Mute' : 'Unmute'}
                    danger={!micOn}
                />
                <ToolBtn onClick={onToggleCam}
                    icon={camOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
                    label={camOn ? 'Camera Off' : 'Camera On'}
                    danger={!camOn}
                />
            </div>

            {/* Centre */}
            <div className="flex items-center gap-2">
                <ToolBtn onClick={onToggleScreen}
                    icon={screenSharing ? <MonitorOff className="w-5 h-5" /> : <Monitor className="w-5 h-5" />}
                    label={screenSharing ? 'Stop Share' : 'Share Screen'}
                    highlight={screenSharing}
                />
                <ToolBtn onClick={onToggleRecording}
                    icon={recording
                        ? <Square className="w-5 h-5 fill-red-500 text-red-500" />
                        : <Circle className="w-5 h-5" />}
                    label={recording ? 'Stop Rec.' : 'Record'}
                    danger={recording}
                    highlight={recording}
                />
                <ToolBtn onClick={onToggleHand}
                    icon={<span className="text-lg">✋</span>}
                    label="Raise Hand"
                    highlight={handRaised}
                />
                <ToolBtn onClick={onToggleChat}
                    icon={<MessageSquare className="w-5 h-5" />}
                    label="Chat"
                    highlight={sidePanel === 'chat'}
                />
                <ToolBtn onClick={onToggleParticipants}
                    icon={<Users className="w-5 h-5" />}
                    label="People"
                    highlight={sidePanel === 'participants'}
                />
                <ToolBtn onClick={() => { }} icon={<MoreVertical className="w-5 h-5" />} label="More" />
            </div>

            {/* Right: leave */}
            <button
                onClick={onLeave}
                className="flex flex-col items-center gap-1 px-5 py-2.5 bg-red-600 hover:bg-red-700 rounded-xl text-white transition-colors"
            >
                <PhoneOff className="w-5 h-5" />
                <span className="text-[10px] font-bold">Leave</span>
            </button>
        </div>
    );
}

// Needed to avoid TS warning — active is passed from toolbar consumers but intentionally unused in ToolBtn styling
declare module './MeetingToolbar' {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    interface _ToolBtnProps { active?: boolean; }
}
