/**
 * ChatApp.tsx — Shared Chat / Messaging component
 * Used by both teachers (/teacher/messaging) and students (/student/messaging)
 *
 * Features:
 *  - Conversation sidebar (contact list with last message + unread badge)
 *  - Message thread with sent/received bubbles, timestamps, avatars
 *  - Message input with Enter to send
 *  - Group conversations (class groups) + direct messages
 *  - Online status indicators
 */
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Send, Users, ChevronRight, Circle, Phone, Video, MoreVertical, Smile, Paperclip } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Message {
    id: string;
    senderId: string;
    text: string;
    time: string;
    date: string;
    read: boolean;
}

interface Conversation {
    id: string;
    name: string;
    avatar: string;
    avatarColor: string;
    isGroup: boolean;
    isOnline: boolean;
    lastMessage: string;
    lastTime: string;
    unread: number;
    messages: Message[];
}

// ─── Mock Data ────────────────────────────────────────────────────────────────
function makeMsg(id: string, senderId: string, text: string, time: string, date = 'today', read = true): Message {
    return { id, senderId, text, time, date, read };
}

const CONVERSATIONS_TEACHER: Conversation[] = [
    {
        id: 'c1', name: 'SS 1A – Class Group', avatar: '1A', avatarColor: 'bg-[#0036a1]',
        isGroup: true, isOnline: false, lastMessage: 'When is the math test?', lastTime: '10:32', unread: 3,
        messages: [
            makeMsg('m1', 'other', 'Good morning sir!', '10:15'),
            makeMsg('m2', 'me', 'Good morning class. Please revise chapters 5 & 6 before Friday.', '10:17'),
            makeMsg('m3', 'other', 'When is the math test?', '10:32'),
        ],
    },
    {
        id: 'c2', name: 'Ayomide Balogun', avatar: 'AB', avatarColor: 'bg-purple-500',
        isGroup: false, isOnline: true, lastMessage: 'Thank you sir!', lastTime: '09:45', unread: 0,
        messages: [
            makeMsg('m4', 'other', 'Good morning sir, I missed class yesterday. Can I get the notes?', '09:40'),
            makeMsg('m5', 'me', 'Sure, I will send you the PDF after school.', '09:42'),
            makeMsg('m6', 'other', 'Thank you sir!', '09:45'),
        ],
    },
    {
        id: 'c3', name: 'Chinoso Obi', avatar: 'CO', avatarColor: 'bg-orange-500',
        isGroup: false, isOnline: false, lastMessage: 'Understood, sir.', lastTime: 'Yesterday', unread: 0,
        messages: [
            makeMsg('m7', 'me', 'Chinoso, please submit your assignment by Thursday.', '14:00', 'yesterday'),
            makeMsg('m8', 'other', 'Understood, sir.', '14:05', 'yesterday'),
        ],
    },
    {
        id: 'c4', name: 'Staff – Math Dept.', avatar: 'MD', avatarColor: 'bg-teal-600',
        isGroup: true, isOnline: false, lastMessage: 'Exam timetable updated', lastTime: 'Monday', unread: 1,
        messages: [
            makeMsg('m9', 'other', 'Please check the updated exam timetable on the portal.', '08:00', 'monday'),
            makeMsg('m10', 'me', 'Thanks, noted.', '08:15', 'monday'),
            makeMsg('m11', 'other', 'Exam timetable updated', '09:00', 'monday', false),
        ],
    },
];

const CONVERSATIONS_STUDENT: Conversation[] = [
    {
        id: 's1', name: 'Mr. Adebayo (Maths)', avatar: 'MA', avatarColor: 'bg-[#0036a1]',
        isGroup: false, isOnline: true, lastMessage: 'Good luck with your revision!', lastTime: '10:30', unread: 1,
        messages: [
            makeMsg('sm1', 'other', 'Please revise chapters 5 and 6 before Friday.', '10:00'),
            makeMsg('sm2', 'me', 'Okay sir, thank you!', '10:25'),
            makeMsg('sm3', 'other', 'Good luck with your revision!', '10:30', 'today', false),
        ],
    },
    {
        id: 's2', name: 'SS 1A – Class Group', avatar: '1A', avatarColor: 'bg-[#6bc048]',
        isGroup: true, isOnline: false, lastMessage: 'Anyone have the chemistry notes?', lastTime: '09:55', unread: 5,
        messages: [
            makeMsg('sm4', 'other', 'Good morning everyone!', '09:30'),
            makeMsg('sm5', 'other', 'Anyone have the chemistry notes from yesterday?', '09:55'),
        ],
    },
    {
        id: 's3', name: 'Mrs. Chukwu (English)', avatar: 'EC', avatarColor: 'bg-[#6bc048]',
        isGroup: false, isOnline: false, lastMessage: 'Please complete your essay draft.', lastTime: 'Yesterday', unread: 0,
        messages: [
            makeMsg('sm6', 'other', 'Please complete your essay draft and submit by Monday.', '13:00', 'yesterday'),
            makeMsg('sm7', 'me', 'Yes ma, I will.', '13:10', 'yesterday'),
        ],
    },
    {
        id: 's4', name: 'Fatima Musa', avatar: 'FM', avatarColor: 'bg-pink-500',
        isGroup: false, isOnline: true, lastMessage: 'Sure, see you!', lastTime: '08:10', unread: 0,
        messages: [
            makeMsg('sm8', 'me', 'Are you going to the library later?', '08:05'),
            makeMsg('sm9', 'other', 'Sure, see you!', '08:10'),
        ],
    },
];

// ─── Sub-components ───────────────────────────────────────────────────────────
function OnlineDot({ isOnline }: { isOnline: boolean }) {
    if (!isOnline) return null;
    return <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-[#6bc048] rounded-full border-2 border-white" />;
}

interface Props {
    role: 'teacher' | 'student';
    userName?: string;
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function ChatApp({ role, userName: _userName = role === 'teacher' ? 'Mr. Adebayo' : 'You' }: Props) {
    const conversations = role === 'teacher' ? CONVERSATIONS_TEACHER : CONVERSATIONS_STUDENT;

    const [selected, setSelected] = useState<string>(conversations[0].id);
    const [allConvos, setAllConvos] = useState(conversations);
    const [input, setInput] = useState('');
    const [search, setSearch] = useState('');
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const bottomRef = useRef<HTMLDivElement>(null);

    const activeConvo = allConvos.find(c => c.id === selected)!;
    const filtered = allConvos.filter(c =>
        !search || c.name.toLowerCase().includes(search.toLowerCase())
    );

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [selected, allConvos]);

    // Mark as read when opening
    useEffect(() => {
        setAllConvos(prev => prev.map(c =>
            c.id === selected ? { ...c, unread: 0, messages: c.messages.map(m => ({ ...m, read: true })) } : c
        ));
    }, [selected]);

    const sendMessage = () => {
        if (!input.trim()) return;
        const newMsg: Message = {
            id: crypto.randomUUID(),
            senderId: 'me',
            text: input.trim(),
            time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
            date: 'today',
            read: true,
        };
        setAllConvos(prev => prev.map(c =>
            c.id === selected
                ? { ...c, messages: [...c.messages, newMsg], lastMessage: newMsg.text, lastTime: newMsg.time }
                : c
        ));
        setInput('');
    };

    const totalUnread = allConvos.reduce((s, c) => s + c.unread, 0);

    return (
        <div className="flex h-[calc(100vh-80px)] bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">

            {/* ── Sidebar ── */}
            <div className={`${sidebarOpen ? 'w-72' : 'w-0'} shrink-0 flex flex-col border-r border-gray-100 transition-all duration-200 overflow-hidden`}>
                {/* Header */}
                <div className="p-4 border-b border-gray-100 shrink-0">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="font-bold text-gray-900 text-base">Messages</h3>
                        {totalUnread > 0 && (
                            <span className="bg-[#0036a1] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{totalUnread}</span>
                        )}
                    </div>
                    <div className="relative">
                        <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search conversations..."
                            className="w-full pl-8 pr-3 py-2 bg-gray-50 border border-gray-100 rounded-lg text-xs outline-none focus:border-[#0036a1]"
                        />
                    </div>
                </div>

                {/* Conversation list */}
                <div className="flex-1 overflow-y-auto">
                    {filtered.map(conv => (
                        <button
                            key={conv.id}
                            onClick={() => setSelected(conv.id)}
                            className={`w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors text-left border-b border-gray-50 ${selected === conv.id ? 'bg-[#0036a1]/5 border-l-2 border-[#0036a1]' : ''}`}
                        >
                            <div className="relative shrink-0">
                                <div className={`w-10 h-10 ${conv.avatarColor} rounded-full flex items-center justify-center text-white text-xs font-bold`}>
                                    {conv.avatar}
                                </div>
                                <OnlineDot isOnline={conv.isOnline} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                    <span className="font-semibold text-gray-900 text-sm truncate">{conv.name}</span>
                                    <span className="text-[10px] text-gray-400 shrink-0 ml-1">{conv.lastTime}</span>
                                </div>
                                <div className="flex items-center justify-between mt-0.5">
                                    <p className="text-xs text-gray-400 truncate">{conv.lastMessage}</p>
                                    {conv.unread > 0 && (
                                        <span className="ml-1 bg-[#0036a1] text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center shrink-0">
                                            {conv.unread}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* ── Chat Panel ── */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Chat header */}
                <div className="h-14 shrink-0 border-b border-gray-100 px-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button onClick={() => setSidebarOpen(o => !o)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors">
                            <ChevronRight className={`w-4 h-4 transition-transform ${sidebarOpen ? 'rotate-180' : ''}`} />
                        </button>
                        <div className="relative">
                            <div className={`w-9 h-9 ${activeConvo.avatarColor} rounded-full flex items-center justify-center text-white text-xs font-bold`}>
                                {activeConvo.avatar}
                            </div>
                            <OnlineDot isOnline={activeConvo.isOnline} />
                        </div>
                        <div>
                            <p className="font-bold text-gray-900 text-sm">{activeConvo.name}</p>
                            <p className="text-[10px] text-gray-400 flex items-center gap-1">
                                {activeConvo.isGroup
                                    ? <><Users className="w-3 h-3" /> Group</>
                                    : activeConvo.isOnline
                                        ? <><Circle className="w-2 h-2 fill-[#6bc048] text-[#6bc048]" /> Online</>
                                        : 'Offline'}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-1">
                        <button className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors"><Phone className="w-4 h-4" /></button>
                        <button className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors"><Video className="w-4 h-4" /></button>
                        <button className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors"><MoreVertical className="w-4 h-4" /></button>
                    </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
                    <AnimatePresence initial={false}>
                        {activeConvo.messages.map(msg => {
                            const isMe = msg.senderId === 'me';
                            return (
                                <motion.div
                                    key={msg.id}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`flex items-end gap-2 ${isMe ? 'justify-end' : 'justify-start'}`}
                                >
                                    {!isMe && (
                                        <div className={`w-7 h-7 ${activeConvo.avatarColor} rounded-full flex items-center justify-center text-white text-[9px] font-bold shrink-0 mb-0.5`}>
                                            {activeConvo.avatar}
                                        </div>
                                    )}
                                    <div className={`max-w-[70%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                        <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${isMe
                                            ? 'bg-[#0036a1] text-white rounded-br-sm'
                                            : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                                            }`}>
                                            {msg.text}
                                        </div>
                                        <span className="text-[10px] text-gray-400 mt-1">{msg.time}</span>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                    <div ref={bottomRef} />
                </div>

                {/* Input */}
                <div className="shrink-0 border-t border-gray-100 p-4 flex items-center gap-3">
                    <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors"><Smile className="w-5 h-5" /></button>
                    <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors"><Paperclip className="w-5 h-5" /></button>
                    <input
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                        placeholder={`Message ${activeConvo.name}...`}
                        className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#0036a1] transition-colors"
                    />
                    <button
                        onClick={sendMessage}
                        disabled={!input.trim()}
                        className="w-10 h-10 bg-[#0036a1] disabled:bg-gray-200 rounded-xl flex items-center justify-center text-white transition-colors hover:bg-[#001761]"
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}
