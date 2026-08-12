import { useRef } from 'react';
import { Send } from 'lucide-react';

export interface ChatMessage {
    id: string;
    sender: string;
    text: string;
    time: string;
}

interface Props {
    messages: ChatMessage[];
    onClose: () => void;
    onSend: (text: string) => void;
    input: string;
    onInputChange: (v: string) => void;
}

export function ChatPanel({ messages, onClose, onSend, input, onInputChange }: Props) {
    const endRef = useRef<HTMLDivElement>(null);

    const handleSend = () => {
        if (!input.trim()) return;
        onSend(input.trim());
    };

    return (
        <>
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
                <h3 className="text-white font-bold text-sm flex items-center gap-2">💬 Live Chat</h3>
                <button onClick={onClose} className="text-gray-400 hover:text-white text-lg leading-none">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map(msg => (
                    <div key={msg.id} className={`flex flex-col ${msg.sender === 'You (Teacher)' ? 'items-end' : 'items-start'}`}>
                        <span className="text-[10px] text-gray-500 mb-1">{msg.sender} · {msg.time}</span>
                        <div className={`max-w-[85%] px-3 py-2 rounded-xl text-sm ${msg.sender === 'You (Teacher)' ? 'bg-[#0036a1] text-white rounded-tr-none' : 'bg-white/10 text-gray-200 rounded-tl-none'}`}>
                            {msg.text}
                        </div>
                    </div>
                ))}
                <div ref={endRef} />
            </div>
            <div className="p-3 border-t border-white/10 flex gap-2">
                <input
                    value={input}
                    onChange={e => onInputChange(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSend()}
                    placeholder="Type a message..."
                    className="flex-1 bg-white/10 text-white text-sm px-3 py-2.5 rounded-lg outline-none placeholder-gray-500 border border-white/10 focus:border-[#0036a1]"
                />
                <button onClick={handleSend} className="w-10 h-10 bg-[#0036a1] rounded-lg flex items-center justify-center text-white hover:bg-[#001761] transition-colors shrink-0">
                    <Send className="w-4 h-4" />
                </button>
            </div>
        </>
    );
}
