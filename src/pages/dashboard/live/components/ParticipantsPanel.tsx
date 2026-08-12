import { Mic, MicOff, VideoOff } from 'lucide-react';

interface Participant {
    id: string;
    name: string;
    avatar: string;
    color: string;
    muted: boolean;
}

interface Props {
    participants: Participant[];
    localMuted: boolean;
    localCamOn: boolean;
    onClose: () => void;
}

export function ParticipantsPanel({ participants, localMuted, localCamOn, onClose }: Props) {
    return (
        <>
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
                <h3 className="text-white font-bold text-sm">👥 Participants ({participants.length + 1})</h3>
                <button onClick={onClose} className="text-gray-400 hover:text-white text-lg leading-none">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {/* Host */}
                <div className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-[#0036a1] rounded-full flex items-center justify-center text-white text-xs font-bold">YOU</div>
                        <div>
                            <p className="text-white text-sm font-medium">You (Host)</p>
                            <p className="text-gray-500 text-xs">Presenter</p>
                        </div>
                    </div>
                    <div className="flex gap-1">
                        {!localMuted && <Mic className="w-4 h-4 text-[#6bc048]" />}
                        {localMuted && <MicOff className="w-4 h-4 text-red-400" />}
                        {!localCamOn && <VideoOff className="w-4 h-4 text-gray-500" />}
                    </div>
                </div>
                {participants.map(p => (
                    <div key={p.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5">
                        <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 ${p.color} rounded-full flex items-center justify-center text-white text-xs font-bold`}>{p.avatar}</div>
                            <p className="text-gray-200 text-sm">{p.name}</p>
                        </div>
                        {p.muted ? <MicOff className="w-4 h-4 text-gray-500" /> : <Mic className="w-4 h-4 text-[#6bc048]" />}
                    </div>
                ))}
            </div>
        </>
    );
}
