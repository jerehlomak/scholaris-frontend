import { useEffect, useState, useCallback, useRef } from 'react';
import axios from 'axios';
import { MessageSquare, Send, Plus, X, Lock, CheckCheck, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

function api(method: 'get' | 'post' | 'put', path: string, data?: any) {
    return axios({ method, url: `${API_BASE}/api/v1${path}`, data, withCredentials: true });
}

function formatTime(dateStr: string) {
    return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDate(dateStr: string) {
    const d = new Date(dateStr);
    const today = new Date();
    if (d.toDateString() === today.toDateString()) return formatTime(dateStr);
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

interface Message {
    id: string;
    senderType: 'ADMIN' | 'SCHOOL';
    senderName: string;
    content: string;
    readAt: string | null;
    createdAt: string;
}

interface Conversation {
    id: string;
    subject: string;
    isClosed: boolean;
    lastMessageAt: string;
    unreadCount: number;
    messages: Message[];
}

export default function PlatformMessages() {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [activeConv, setActiveConv] = useState<Conversation | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [input, setInput] = useState('');
    const [showNew, setShowNew] = useState(false);
    const [newForm, setNewForm] = useState({ subject: 'General Inquiry', content: '' });
    const [showChat, setShowChat] = useState(false); // For mobile view toggle
    const bottomRef = useRef<HTMLDivElement>(null);

    const loadConversations = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api('get', '/messaging');
            setConversations(res.data.conversations || []);
        } catch { toast.error('Failed to load messages') }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { loadConversations(); }, [loadConversations]);

    const openConversation = async (conv: Conversation) => {
        setActiveConv(conv);
        setShowChat(true); // Show chat view on mobile
        try {
            const res = await api('get', `/messaging/${conv.id}`);
            setMessages(res.data.messages || []);
            setConversations(prev => prev.map(c => c.id === conv.id ? { ...c, unreadCount: 0 } : c));
            setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 80);
        } catch { toast.error('Failed to load messages') }
    };

    const closeChat = () => {
        setShowChat(false);
        setActiveConv(null);
    };

    const sendReply = async () => {
        if (!input.trim() || !activeConv) return;
        setSending(true);
        try {
            const res = await api('post', `/messaging/${activeConv.id}/reply`, { content: input.trim() });
            setMessages(prev => [...prev, res.data.message]);
            setInput('');
            setConversations(prev => prev.map(c =>
                c.id === activeConv.id ? { ...c, lastMessageAt: new Date().toISOString() } : c
            ));
            setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 80);
        } catch { toast.error('Failed to send') }
        finally { setSending(false); }
    };

    const startConversation = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newForm.content.trim()) return;
        try {
            await api('post', '/messaging', newForm);
            toast.success('Message sent to platform admin!');
            setShowNew(false);
            setNewForm({ subject: 'General Inquiry', content: '' });
            loadConversations();
        } catch { toast.error('Failed to send') }
    };

    return (
        <div className="max-w-[1200px] mx-auto w-full font-dash pb-4 md:pb-10 px-2 md:px-0" style={{ minHeight: '80vh' }}>
            {/* Header - Hidden on mobile when chat is open */}
            <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 md:mb-6 gap-3 ${showChat ? 'hidden md:flex' : 'flex'}`}>
                <div>
                    <h1 className="text-xl md:text-2xl font-bold text-gray-900">Platform Messages</h1>
                    <p className="text-xs text-gray-400 mt-1">
                        Direct communication with the Skooly platform team.
                    </p>
                </div>
                <button onClick={() => setShowNew(true)}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-xl shadow-md transition-all hover:-translate-y-0.5 active:scale-95"
                    style={{ background: 'linear-gradient(135deg, #0036a1, #4f46e5)' }}>
                    <Plus className="w-4 h-4" /> New Message
                </button>
            </div>

            <div className="flex gap-0 md:gap-5 h-[calc(100vh-180px)] md:h-[65vh]">
                {/* Left: Conversation list - Full width on mobile when chat is not open */}
                <div className={`${showChat ? 'hidden md:flex' : 'flex'} w-full md:w-72 md:flex-shrink-0 bg-white rounded-none md:rounded-2xl border-0 md:border border-gray-100 shadow-sm flex-col overflow-hidden`}>
                    <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-[#0036a1]" />
                        <span className="text-sm font-bold text-gray-800">Conversations</span>
                    </div>
                    <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <div className="w-6 h-6 border-2 border-[#0036a1] border-t-transparent rounded-full animate-spin" />
                            </div>
                        ) : conversations.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center px-4 gap-2">
                                <MessageSquare className="w-8 h-8 text-gray-200" />
                                <p className="text-sm text-gray-400">No messages yet.</p>
                                <button onClick={() => setShowNew(true)}
                                    className="text-xs font-semibold text-[#0036a1] hover:underline">
                                    Start a conversation
                                </button>
                            </div>
                        ) : conversations.map(conv => (
                            <button key={conv.id} onClick={() => openConversation(conv)}
                                className={`w-full text-left px-4 py-3.5 transition-colors hover:bg-blue-50/50 active:bg-blue-100/50 ${activeConv?.id === conv.id ? 'bg-blue-50 border-l-2 border-[#0036a1]' : ''}`}>
                                <div className="flex items-start justify-between gap-2 mb-1">
                                    <span className="text-xs md:text-sm font-bold text-gray-800 truncate flex-1">{conv.subject}</span>
                                    {conv.unreadCount > 0 && (
                                        <span className="flex-shrink-0 text-[10px] font-bold text-white bg-[#0036a1] rounded-full px-1.5 py-0.5">
                                            {conv.unreadCount}
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center justify-between">
                                    <p className="text-[11px] text-gray-400 truncate max-w-[150px] md:max-w-[180px]">
                                        {conv.messages?.[0]?.content || '—'}
                                    </p>
                                    <span className="text-[10px] text-gray-400 flex-shrink-0">
                                        {formatDate(conv.lastMessageAt)}
                                    </span>
                                </div>
                                {conv.isClosed && (
                                    <span className="mt-1 inline-flex items-center gap-1 text-[10px] text-amber-500">
                                        <Lock className="w-2.5 h-2.5" /> Closed
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Right: Message thread - Full width on mobile when chat is open */}
                <div className={`${showChat ? 'flex' : 'hidden md:flex'} flex-1 bg-white rounded-none md:rounded-2xl border-0 md:border border-gray-100 shadow-sm flex-col overflow-hidden`}>
                    {!activeConv ? (
                        <div className="flex-1 flex flex-col items-center justify-center gap-3 text-gray-400">
                            <MessageSquare className="w-14 h-14 opacity-10" />
                            <p className="text-sm">Select a conversation to view messages</p>
                        </div>
                    ) : (
                        <>
                            {/* Thread Header - With back button on mobile */}
                            <div className="px-3 md:px-5 py-3.5 border-b border-gray-100 flex items-center justify-between"
                                style={{ background: 'linear-gradient(135deg, #0036a1 0%, #4f46e5 100%)' }}>
                                <div className="flex items-center gap-3 flex-1">
                                    {/* Back button - only visible on mobile */}
                                    <button onClick={closeChat} className="md:hidden text-white">
                                        <ArrowLeft className="w-5 h-5" />
                                    </button>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-white text-sm truncate">{activeConv.subject}</h3>
                                        <p className="text-[11px] text-blue-200 mt-0.5">Platform Support Thread</p>
                                    </div>
                                </div>
                                {activeConv.isClosed && (
                                    <span className="flex items-center gap-1 text-[10px] md:text-xs text-amber-500 font-semibold bg-amber-50 px-2 md:px-3 py-1 rounded-lg border border-amber-200">
                                        <Lock className="w-3 h-3" /> Closed
                                    </span>
                                )}
                            </div>

                            {/* Messages */}
                            <div className="flex-1 overflow-y-auto p-3 md:p-5 space-y-3" style={{ background: '#f8fafc' }}>
                                {messages.map(msg => {
                                    const isMe = msg.senderType === 'SCHOOL';
                                    return (
                                        <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-[85%] md:max-w-[70%] rounded-2xl px-3 md:px-4 py-2.5 md:py-3 text-sm shadow-sm ${isMe
                                                ? 'text-white rounded-br-sm'
                                                : 'bg-white text-gray-800 rounded-bl-sm border border-gray-100'}`}
                                                style={isMe ? { background: 'linear-gradient(135deg, #0036a1, #4f46e5)' } : {}}>
                                                {!isMe && (
                                                    <p className="text-[10px] font-bold text-[#0036a1] mb-1">
                                                        Skooly Support
                                                    </p>
                                                )}
                                                <p className="leading-relaxed text-xs md:text-sm">{msg.content}</p>
                                                <div className={`flex items-center gap-1 mt-1.5 ${isMe ? 'justify-end' : 'justify-start'}`}>
                                                    <span className={`text-[10px] ${isMe ? 'text-blue-200' : 'text-gray-400'}`}>
                                                        {formatTime(msg.createdAt)}
                                                    </span>
                                                    {isMe && msg.readAt && <CheckCheck className="w-3 h-3 text-blue-200" />}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                                <div ref={bottomRef} />
                            </div>

                            {/* Input Box */}
                            {!activeConv.isClosed ? (
                                <div className="px-3 md:px-4 py-3 border-t border-gray-100 flex items-end gap-2 md:gap-3 bg-white">
                                    <textarea
                                        value={input}
                                        onChange={e => setInput(e.target.value)}
                                        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendReply(); } }}
                                        placeholder="Type a message…"
                                        rows={1}
                                        className="flex-1 resize-none rounded-xl px-3 md:px-4 py-2 md:py-2.5 text-sm outline-none border border-gray-200 bg-gray-50 focus:border-[#0036a1] focus:bg-white transition-colors"
                                    />
                                    <button onClick={sendReply} disabled={sending || !input.trim()}
                                        className="p-2.5 md:p-3 rounded-xl text-white disabled:opacity-50 transition-all hover:-translate-y-0.5 active:scale-95"
                                        style={{ background: 'linear-gradient(135deg, #0036a1, #4f46e5)' }}>
                                        <Send className="w-4 h-4" />
                                    </button>
                                </div>
                            ) : (
                                <div className="px-4 py-3 border-t border-gray-100 text-center text-xs md:text-sm text-amber-500 bg-amber-50">
                                    <Lock className="w-4 h-4 inline mr-1" /> This conversation has been closed by the platform team.
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* New Conversation Modal */}
            {showNew && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between"
                            style={{ background: 'linear-gradient(135deg, #0036a1 0%, #4f46e5 100%)' }}>
                            <div>
                                <h2 className="text-base font-bold text-white">New Platform Message</h2>
                                <p className="text-xs text-blue-200 mt-0.5">The support team will receive and reply shortly.</p>
                            </div>
                            <button onClick={() => setShowNew(false)} className="text-white/60 hover:text-white">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={startConversation} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Subject</label>
                                <input type="text" value={newForm.subject}
                                    onChange={e => setNewForm(p => ({ ...p, subject: e.target.value }))}
                                    className="w-full px-4 py-2.5 rounded-xl text-sm outline-none border border-gray-200 focus:border-[#0036a1] transition-colors" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Message *</label>
                                <textarea required rows={5} value={newForm.content}
                                    onChange={e => setNewForm(p => ({ ...p, content: e.target.value }))}
                                    placeholder="Describe your inquiry, issue, or request..."
                                    className="w-full px-4 py-2.5 rounded-xl text-sm outline-none border border-gray-200 focus:border-[#0036a1] transition-colors resize-none" />
                            </div>
                            <div className="flex gap-3 pt-1">
                                <button type="button" onClick={() => setShowNew(false)}
                                    className="flex-1 py-2.5 rounded-xl text-sm font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors">
                                    Cancel
                                </button>
                                <button type="submit"
                                    className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:-translate-y-0.5"
                                    style={{ background: 'linear-gradient(135deg, #0036a1, #4f46e5)' }}>
                                    Send Message
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}