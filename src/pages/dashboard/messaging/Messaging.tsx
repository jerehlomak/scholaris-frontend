/**
 * Messaging.tsx — Internal Chat System
 * Full-stack: connects to /api/v1/communicate/messages
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Plus, Send, Trash2, MessageSquare, Loader2, X, RefreshCw } from 'lucide-react';
import { Card } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { cn } from '../../../lib/utils';

const API = '/api/v1/communicate';

interface Thread {
    id: string;
    name: string;
    isOwn: boolean;
    senderId: string;
    senderName: string;
    recipientGroup: string;
    lastMessage: string;
    unreadCount: number;
    createdAt: string;
}

interface Message {
    id: string;
    senderId: string;
    senderName: string;
    recipientGroup: string;
    subject?: string;
    body: string;
    isRead: boolean;
    createdAt: string;
}

const GROUPS = [
    { id: 'all', label: 'Everyone' },
    { id: 'teachers', label: 'All Teachers' },
    { id: 'students', label: 'All Students' },
    { id: 'parents', label: 'All Parents' },
];

function formatTime(iso: string) {
    const d = new Date(iso);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
    if (diffDays === 0) return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    if (diffDays === 1) return 'Yesterday';
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

function Avatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' | 'lg' }) {
    const colors = ['bg-indigo-600', 'bg-emerald-600', 'bg-violet-600', 'bg-rose-600', 'bg-amber-600', 'bg-cyan-600'];
    const color = colors[name.charCodeAt(0) % colors.length];
    const sizeClass = size === 'sm' ? 'w-8 h-8 text-xs' : size === 'lg' ? 'w-12 h-12 text-lg' : 'w-10 h-10 text-sm';
    return (
        <div className={cn('rounded-full flex items-center justify-center text-white font-bold shrink-0', color, sizeClass)}>
            {name.substring(0, 2).toUpperCase()}
        </div>
    );
}

export default function Messaging() {
    const [threads, setThreads] = useState<Thread[]>([]);
    const [activeThread, setActiveThread] = useState<Thread | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [search, setSearch] = useState('');
    const [isComposing, setIsComposing] = useState(false);
    const [composeTo, setComposeTo] = useState('all');
    const [composeSubject, setComposeSubject] = useState('');
    const [composeBody, setComposeBody] = useState('');
    const [sending, setSending] = useState(false);
    const [loading, setLoading] = useState(true);
    const [threadLoading, setThreadLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const fetchThreads = useCallback(async () => {
        try {
            const res = await axios.get(`${API}/messages/threads`, { withCredentials: true });
            setThreads(res.data.threads);
            setError(null);
        } catch (err: any) {
            const status = err?.response?.status;
            const msg = err?.response?.data?.msg || err?.message || 'Unknown error';
            if (status === 401) setError('Session expired — please log in again.');
            else setError(`Failed to load messages: ${msg}`);
            console.error('[Messaging] fetchThreads error:', err?.response?.data || err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchThreads(); }, [fetchThreads]);

    const openThread = async (thread: Thread) => {
        setActiveThread(thread);
        setIsComposing(false);
        setThreadLoading(true);
        try {
            const res = await axios.get(
                `${API}/messages/thread?senderId=${thread.senderId}&recipientGroup=${thread.recipientGroup}`,
                { withCredentials: true }
            );
            setMessages(res.data.messages);
            setThreads(prev => prev.map(t => t.id === thread.id ? { ...t, unreadCount: 0 } : t));
        } catch (err: any) {
            const msg = err?.response?.data?.msg || err?.message || 'Unknown error';
            setError(`Failed to load thread: ${msg}`);
            console.error('[Messaging] openThread error:', err?.response?.data || err);
        } finally { setThreadLoading(false); }
    };

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async () => {
        if (!composeBody.trim()) return;
        setSending(true);
        try {
            await axios.post(`${API}/messages`, {
                recipientGroup: composeTo,
                subject: composeSubject || undefined,
                body: composeBody,
            }, { withCredentials: true });
            setComposeBody('');
            setComposeSubject('');
            setIsComposing(false);
            await fetchThreads();
        } catch (err: any) {
            const msg = err?.response?.data?.msg || err?.response?.data?.message || err?.message || 'Failed to send message';
            setError(`Send failed: ${msg}`);
            console.error('[Messaging] Send error:', err?.response?.data || err);
        } finally { setSending(false); }
    };

    const handleDelete = async (msgId: string) => {
        try {
            await axios.delete(`${API}/messages/${msgId}`, { withCredentials: true });
            setMessages(prev => prev.filter(m => m.id !== msgId));
        } catch { setError('Could not delete message'); }
    };

    const filtered = threads.filter(t =>
        !search || t.name.toLowerCase().includes(search.toLowerCase()) ||
        t.lastMessage.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="h-[calc(100vh-140px)] flex gap-4 font-dash">

            {/* ── Sidebar ── */}
            <Card className="w-full max-w-[320px] flex flex-col bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3.5 border-b border-gray-100">
                    <h2 className="text-lg font-bold text-gray-900">Messages</h2>
                    <div className="flex gap-2">
                        <Button size="sm" variant="ghost" onClick={fetchThreads} className="w-8 h-8 p-0 text-gray-400">
                            <RefreshCw className="w-4 h-4" />
                        </Button>
                        <Button size="sm" onClick={() => { setIsComposing(true); setActiveThread(null); }}
                            className="h-8 bg-[#1E4DA6] text-white text-xs px-3 flex items-center gap-1">
                            <Plus className="w-3.5 h-3.5" /> New
                        </Button>
                    </div>
                </div>

                <div className="px-3 py-2 border-b border-gray-50">
                    <div className="relative">
                        <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input value={search} onChange={e => setSearch(e.target.value)}
                            placeholder="Search messages..."
                            className="w-full pl-8 pr-3 py-2 bg-gray-50 rounded-lg text-sm outline-none focus:bg-white focus:ring-1 focus:ring-[#1E4DA6]/20 transition-all border border-transparent focus:border-gray-200" />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto min-h-0">
                    {loading ? (
                        <div className="flex items-center justify-center py-16">
                            <Loader2 className="w-6 h-6 animate-spin text-[#1E4DA6]" />
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center px-4">
                            <MessageSquare className="w-10 h-10 text-gray-200 mb-3" />
                            <p className="text-sm text-gray-400">No messages yet.<br />Start a new conversation.</p>
                        </div>
                    ) : (
                        <div className="p-2 space-y-0.5">
                            {filtered.map(thread => (
                                <button key={thread.id} onClick={() => openThread(thread)}
                                    className={cn(
                                        'w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all hover:bg-gray-50',
                                        activeThread?.id === thread.id && 'bg-[#1E4DA6]/5 border border-[#1E4DA6]/10'
                                    )}>
                                    <Avatar name={thread.isOwn ? composeTo : thread.senderName} size="md" />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-1">
                                            <p className="text-sm font-semibold text-gray-900 truncate">{thread.name}</p>
                                            <span className="text-[10px] text-gray-400 shrink-0">{formatTime(thread.createdAt)}</span>
                                        </div>
                                        <p className="text-xs text-gray-500 truncate mt-0.5">{thread.lastMessage}</p>
                                    </div>
                                    {thread.unreadCount > 0 && (
                                        <span className="shrink-0 w-5 h-5 bg-[#1E4DA6] text-white text-[10px] font-bold flex items-center justify-center rounded-full">
                                            {thread.unreadCount}
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </Card>

            {/* ── Main Panel ── */}
            <Card className="flex-1 flex flex-col bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

                <AnimatePresence mode="wait">
                    {/* Empty State */}
                    {!activeThread && !isComposing && (
                        <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="flex-1 flex flex-col items-center justify-center p-10 text-center bg-gray-50/50">
                            <div className="w-20 h-20 rounded-full bg-[#1E4DA6]/5 flex items-center justify-center mb-5">
                                <MessageSquare className="w-9 h-9 text-[#1E4DA6]/40" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-800 mb-2">Stay Connected</h2>
                            <p className="text-sm text-gray-500 max-w-sm mb-6">
                                Communicate instantly with teachers, students, parents, and staff. All messages are stored securely.
                            </p>
                            <Button onClick={() => setIsComposing(true)} className="bg-[#1E4DA6] text-white">
                                <Plus className="w-4 h-4 mr-2" /> New Message
                            </Button>
                        </motion.div>
                    )}

                    {/* Compose */}
                    {isComposing && (
                        <motion.div key="compose" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                            className="flex-1 flex flex-col">
                            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                                    <Plus className="w-4 h-4 text-[#1E4DA6]" /> New Message
                                </h3>
                                <Button size="sm" variant="ghost" onClick={() => setIsComposing(false)} className="w-8 h-8 p-0">
                                    <X className="w-4 h-4" />
                                </Button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-6">
                                <div className="max-w-2xl mx-auto space-y-5">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Send To *</label>
                                        <select value={composeTo} onChange={e => setComposeTo(e.target.value)}
                                            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#1E4DA6] transition-colors bg-white">
                                            {GROUPS.map(g => <option key={g.id} value={g.id}>{g.label}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Subject <span className="text-gray-400 font-normal">(optional)</span></label>
                                        <input value={composeSubject} onChange={e => setComposeSubject(e.target.value)}
                                            placeholder="e.g. Examination Schedule Update"
                                            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#1E4DA6] transition-colors" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Message *</label>
                                        <div className="relative">
                                            <textarea value={composeBody} onChange={e => setComposeBody(e.target.value)}
                                                rows={6} placeholder="Write your message here..."
                                                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#1E4DA6] transition-colors resize-none" />
                                            <span className="absolute bottom-3 right-3 text-xs text-gray-400">{composeBody.length}</span>
                                        </div>
                                    </div>
                                    <div className="flex justify-end gap-3 pt-2">
                                        <Button variant="outline" onClick={() => setIsComposing(false)}>Cancel</Button>
                                        <Button onClick={handleSend} disabled={!composeBody.trim() || sending}
                                            className="bg-[#1E4DA6] text-white min-w-[120px]">
                                            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Send className="w-4 h-4 mr-2" />Send</>}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* Thread View */}
                    {activeThread && !isComposing && (
                        <motion.div key="thread" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="flex-1 flex flex-col min-h-0">
                            <div className="flex items-center gap-4 px-5 py-4 border-b border-gray-100 bg-white">
                                <Avatar name={activeThread.senderName} />
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-gray-900">{activeThread.senderName}</h3>
                                    <p className="text-xs text-gray-500">
                                        To: <span className="font-semibold text-[#1E4DA6] capitalize">{activeThread.recipientGroup}</span>
                                    </p>
                                </div>
                                <Button size="sm" variant="ghost" onClick={() => setActiveThread(null)} className="w-8 h-8 p-0">
                                    <X className="w-4 h-4" />
                                </Button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-gray-50/30">
                                {threadLoading ? (
                                    <div className="flex items-center justify-center py-10">
                                        <Loader2 className="w-6 h-6 animate-spin text-[#1E4DA6]" />
                                    </div>
                                ) : messages.length === 0 ? (
                                    <div className="text-center py-10 text-sm text-gray-400">No messages in this thread.</div>
                                ) : messages.map(msg => (
                                    <div key={msg.id} className="group flex gap-3">
                                        <Avatar name={msg.senderName} size="sm" />
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-xs font-bold text-gray-800">{msg.senderName}</span>
                                                <span className="text-[10px] text-gray-400">{formatTime(msg.createdAt)}</span>
                                                {msg.subject && <span className="text-[10px] bg-[#1E4DA6]/10 text-[#1E4DA6] px-1.5 py-0.5 rounded-full font-medium">{msg.subject}</span>}
                                            </div>
                                            <div className="bg-white rounded-xl rounded-tl-sm px-4 py-3 shadow-sm border border-gray-100 text-sm text-gray-700 leading-relaxed relative">
                                                {msg.body}
                                                <button onClick={() => handleDelete(msg.id)}
                                                    className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-100 text-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                    <Trash2 className="w-3 h-3" />
                                                </button>
                                            </div>
                                            <p className="text-[10px] text-gray-400 mt-1 ml-1">
                                                Sent to: <span className="capitalize font-medium">{msg.recipientGroup}</span>
                                            </p>
                                        </div>
                                    </div>
                                ))}
                                <div ref={messagesEndRef} />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Error Toast */}
                {error && (
                    <div className="absolute bottom-4 right-4 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2 rounded-xl shadow flex items-center gap-2">
                        {error}
                        <button onClick={() => setError(null)}><X className="w-3 h-3" /></button>
                    </div>
                )}
            </Card>
        </div>
    );
}
