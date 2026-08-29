import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import {
    MessageSquare, Send, User, Search, Loader2, ChevronRight, ArrowLeft, UserPlus, Megaphone, X
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { cn } from '../../../lib/utils';
import debounce from 'lodash.debounce';
import BulkFinanceMessageModal from './components/BulkFinanceMessageModal';

export default function FinanceMessages() {
    const [messages, setMessages] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [replyText, setReplyText] = useState('');
    const [activeContactId, setActiveContactId] = useState<string | null>(null);
    const [isSending, setIsSending] = useState(false);
    const [searchParams] = useSearchParams();
    const [searchQuery, setSearchQuery] = useState('');
    const [parentResults, setParentResults] = useState<any[]>([]);
    const [searchingParents, setSearchingParents] = useState(false);
    const [pendingNewContact, setPendingNewContact] = useState<{ parentId: string; parentName: string; studentName: string } | null>(null);
    const [showBulkModal, setShowBulkModal] = useState(false);

    const fetchMessages = async () => {
        try {
            const res = await axios.get('/api/v1/finance-v2/messages', { withCredentials: true });
            setMessages(res.data.messages || []);
        } catch (e) {
            toast.error('Failed to load messages');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMessages();
    }, []);

    // Group messages by Parent
    const threadsByParent = messages.reduce((acc, msg) => {
        const parentId = msg.senderType === 'PARENT' ? msg.senderId : msg.receiverId;
        if (!parentId) return acc;
        
        if (!acc[parentId]) {
            // Prefer the resolved contact (works even when the message has no invoice, e.g. bulk reminders);
            // fall back to the invoice relation for older data.
            const parentName = msg.contact?.name || msg.invoice?.student?.parent?.user?.name || "Parent";
            const studentName = msg.contact?.studentName || msg.invoice?.student?.user?.name || "Unknown Student";
            
            acc[parentId] = {
                parentId,
                parentName,
                studentName,
                messages: []
            };
        }
        acc[parentId].messages.push(msg);
        return acc;
    }, {} as Record<string, any>);

    // Sort messages chronologically and prepare contact list
    const contacts = Object.values(threadsByParent).map((contact: any) => {
        contact.messages.sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        contact.lastMessage = contact.messages[contact.messages.length - 1];
        return contact;
    }).sort((a: any, b: any) => new Date(b.lastMessage.createdAt).getTime() - new Date(a.lastMessage.createdAt).getTime());

    useEffect(() => {
        const contactId = searchParams.get('contactId');
        if (contactId && contacts.some(c => c.parentId === contactId)) {
            setActiveContactId(contactId);
        }
    }, [searchParams, contacts.length]);

    const activeContact = contacts.find(c => c.parentId === activeContactId);

    const filteredContacts = useMemo(() => {
        if (!searchQuery.trim()) return contacts;
        const q = searchQuery.toLowerCase();
        return contacts.filter((c: any) => c.parentName.toLowerCase().includes(q) || c.studentName.toLowerCase().includes(q));
    }, [contacts, searchQuery]);

    // Search for parents to start a brand-new conversation with (not just existing threads)
    const searchParents = useMemo(() => debounce(async (q: string) => {
        if (q.trim().length < 2) { setParentResults([]); return; }
        setSearchingParents(true);
        try {
            const res = await axios.get(`/api/v1/parents/all?search=${encodeURIComponent(q)}&limit=8`, { withCredentials: true });
            setParentResults(res.data.parents || []);
        } catch {
            setParentResults([]);
        } finally {
            setSearchingParents(false);
        }
    }, 350), []);

    useEffect(() => {
        searchParents(searchQuery);
        return () => searchParents.cancel();
    }, [searchQuery, searchParents]);

    const existingParentIds = new Set(contacts.map((c: any) => c.parentId));
    const newParentResults = parentResults.filter((p: any) => !existingParentIds.has(p.user?.id));

    const startNewConversation = (parent: any) => {
        setPendingNewContact({
            parentId: parent.user?.id,
            parentName: parent.user?.name || parent.fatherName || parent.motherName || 'Parent',
            studentName: (parent.students || []).map((s: any) => s.user?.name).filter(Boolean).join(', ') || 'No linked student'
        });
        setActiveContactId(null);
        setSearchQuery('');
        setParentResults([]);
    };

    const handleReply = async () => {
        if (!replyText.trim() || (!activeContact && !pendingNewContact)) return;
        setIsSending(true);

        const target = activeContact || pendingNewContact!;
        const lastMsg = activeContact?.lastMessage;

        try {
            await axios.post('/api/v1/finance-v2/messages', {
                receiverId: target.parentId,
                subject: lastMsg ? (lastMsg.subject.startsWith('Re:') ? lastMsg.subject : `Re: ${lastMsg.subject}`) : 'Message from Finance Office',
                body: replyText,
                invoiceId: lastMsg?.invoiceId
            }, { withCredentials: true });

            toast.success(activeContact ? 'Reply sent' : 'Message sent');
            setReplyText('');
            setActiveContactId(target.parentId);
            setPendingNewContact(null);
            fetchMessages();
        } catch {
            toast.error('Failed to send reply');
        } finally {
            setIsSending(false);
        }
    };

    if (loading) {
        return (
            <div className="fd-root min-h-screen bg-[#FBF9F5] flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-[#1E4DA6]" />
            </div>
        );
    }

    return (
        <>
            <style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap'); .fd-root .mono{font-family:'DM Mono',monospace!important}`}</style>
            <div className="fd-root min-h-screen bg-[#FBF9F5] px-4 pb-20 pt-8 sm:px-6 lg:px-8">
                <div className="relative z-10 mx-auto max-w-6xl">

                    {/* Breadcrumb */}
                    <div className="mb-5 flex items-center gap-1.5">
                        <span className="mono text-[10px] font-bold uppercase tracking-widest text-slate-500">Finance</span>
                        <ChevronRight className="h-3 w-3 text-slate-400" />
                        <span className="mono text-[10px] font-bold uppercase tracking-widest text-[#1E4DA6]">Messages</span>
                    </div>

                    {/* Header */}
                    <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="flex h-14 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#173F8C] to-[#1E4DA6] shadow-lg shadow-slate-200">
                                <MessageSquare className="h-7 w-7 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Finance Messages</h1>
                                <p className="mt-0.5 text-sm text-slate-500">Unified inbox for parent payment queries, disputes, and automated reminders.</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setShowBulkModal(true)}
                            className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white shadow-md hover:bg-indigo-700 transition-colors shrink-0"
                        >
                            <Megaphone className="h-4 w-4" /> Bulk Message / Fee Reminder
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[75vh] min-h-[600px]">

                        {/* Left Sidebar: Contact List */}
                        <div className={cn(
                            "md:col-span-1 bg-white/90 backdrop-blur-md rounded-2xl border border-slate-200 shadow-xl shadow-[#0E2450]/5 overflow-hidden flex-col",
                            activeContactId ? "hidden md:flex" : "flex"
                        )}>
                            <div className="p-4 border-b border-slate-100 bg-slate-50/60">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <input
                                        type="text"
                                        placeholder="Search parents (existing or new)..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E4DA6] focus:border-transparent transition-all shadow-sm"
                                    />
                                </div>
                            </div>

                            {searchQuery.trim().length >= 2 && (
                                <div className="border-b border-slate-100 bg-[#1E4DA6]/8">
                                    <p className="px-4 pt-3 pb-1 text-[10px] font-bold uppercase tracking-widest text-[#1E4DA6] flex items-center gap-1.5">
                                        <UserPlus className="h-3 w-3" /> Start New Conversation
                                    </p>
                                    {searchingParents ? (
                                        <div className="px-4 py-3 text-xs text-slate-400 flex items-center gap-2"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Searching parents...</div>
                                    ) : newParentResults.length === 0 ? (
                                        <div className="px-4 py-3 text-xs text-slate-400">No new parents match "{searchQuery}"</div>
                                    ) : (
                                        <div className="pb-2">
                                            {newParentResults.map((p: any) => (
                                                <button
                                                    key={p.id}
                                                    onClick={() => startNewConversation(p)}
                                                    className="w-full flex items-center gap-3 px-4 py-2 hover:bg-white/80 text-left transition-colors"
                                                >
                                                    <div className="h-8 w-8 shrink-0 rounded-full bg-[#1E4DA6]/10 flex items-center justify-center">
                                                        <User className="h-4 w-4 text-[#1E4DA6]" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-semibold text-slate-800 truncate">{p.user?.name}</p>
                                                        <p className="text-[11px] text-slate-500 truncate">{p.user?.email || p.phone || 'No contact info'}</p>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="flex-1 overflow-y-auto">
                                {filteredContacts.length === 0 ? (
                                    <div className="p-8 text-center text-slate-400 text-sm">
                                        {searchQuery ? 'No matching conversations.' : 'No conversations found.'}
                                    </div>
                                ) : (
                                    filteredContacts.map(contact => (
                                        <div
                                            key={contact.parentId}
                                            onClick={() => { setActiveContactId(contact.parentId); setPendingNewContact(null); }}
                                            className={cn(
                                                "p-4 border-b border-slate-50 cursor-pointer transition-all hover:bg-slate-50/80",
                                                activeContactId === contact.parentId ? "bg-[#1E4DA6]/8 border-l-4 border-l-[#1E4DA6]" : "border-l-4 border-l-transparent"
                                            )}
                                        >
                                            <div className="flex items-center gap-3 mb-1">
                                                <div className="h-10 w-10 shrink-0 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center border border-slate-200 shadow-sm">
                                                    <User className="h-5 w-5 text-slate-500" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex justify-between items-start">
                                                        <h3 className="text-sm font-bold text-slate-800 truncate">{contact.parentName}</h3>
                                                        <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap ml-2">
                                                            {new Date(contact.lastMessage.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                        </span>
                                                    </div>
                                                    <p className="text-[11px] text-[#1E4DA6] font-medium truncate mb-1">Child: {contact.studentName}</p>
                                                    <p className="text-xs text-slate-500 truncate">{contact.lastMessage.body}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Right Side: Chat Thread */}
                        <div className={cn(
                            "md:col-span-2 bg-white/90 backdrop-blur-md rounded-2xl border border-slate-200 shadow-xl shadow-[#0E2450]/5 flex-col overflow-hidden",
                            (activeContactId || pendingNewContact) ? "flex" : "hidden md:flex"
                        )}>
                            {(activeContact || pendingNewContact) ? (
                                <>
                                    {/* Chat Header */}
                                    <div className="px-4 md:px-6 py-4 border-b border-slate-100 bg-slate-50/60 flex items-center gap-3 md:gap-4 shrink-0">
                                        <button
                                            onClick={() => { setActiveContactId(null); setPendingNewContact(null); }}
                                            className="md:hidden p-2 -ml-2 text-slate-500 hover:bg-slate-200 rounded-lg transition-colors"
                                        >
                                            <ArrowLeft className="h-5 w-5" />
                                        </button>
                                        <div className="h-10 w-10 shrink-0 rounded-full bg-gradient-to-br from-[#1E4DA6]/10 to-[#1E4DA6]/20 flex items-center justify-center border border-[#1E4DA6]/20 shadow-sm">
                                            <User className="h-5 w-5 text-[#1E4DA6]" />
                                        </div>
                                        <div>
                                            <h2 className="text-base font-bold text-slate-800">{(activeContact || pendingNewContact)!.parentName}</h2>
                                            <p className="text-xs text-slate-500 font-medium">
                                                {pendingNewContact && !activeContact ? <span className="text-indigo-600 font-bold">New conversation</span> : `Student: ${(activeContact || pendingNewContact)!.studentName}`}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Chat Messages */}
                                    <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-slate-50/30">
                                        {!activeContact && pendingNewContact && (
                                            <div className="text-center text-xs text-slate-400 py-8">
                                                Send the first message to start this conversation with {pendingNewContact.parentName}.
                                            </div>
                                        )}
                                        {(activeContact?.messages || []).map((msg: any) => {
                                            const isAdmin = msg.senderType === 'ADMIN';
                                            return (
                                                <div key={msg.id} className={cn("flex flex-col max-w-[80%]", isAdmin ? "ml-auto items-end" : "mr-auto items-start")}>
                                                    <span className="text-[10px] font-bold text-slate-400 mb-1 px-1">
                                                        {isAdmin ? 'System / Admin' : activeContact.parentName} • {new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                                    </span>
                                                    <div className={cn(
                                                        "p-4 rounded-2xl text-sm shadow-sm relative group",
                                                        isAdmin 
                                                            ? "bg-[#1E4DA6] text-white rounded-tr-sm" 
                                                            : "bg-white border border-slate-200 text-slate-700 rounded-tl-sm"
                                                    )}>
                                                        {msg.subject && msg.subject !== 'Fee Reminder' && !msg.subject.startsWith('Re:') && (
                                                            <p className={cn("text-xs font-bold mb-2 pb-2 border-b", isAdmin ? "border-[#1E4DA6] text-white/80" : "border-slate-100 text-slate-500")}>
                                                                {msg.subject}
                                                            </p>
                                                        )}
                                                        
                                                        <p className="whitespace-pre-wrap">{msg.body}</p>
                                                        
                                                        {msg.attachmentUrl && (
                                                            <div className="mt-3 pt-3 border-t border-slate-100/20">
                                                                <a href={msg.attachmentUrl} target="_blank" rel="noreferrer" className="block w-full max-w-[200px] overflow-hidden rounded-lg border border-slate-200 shadow-sm transition-transform hover:scale-[1.02]">
                                                                    <img src={msg.attachmentUrl} alt="Attachment" className="w-full object-cover bg-white" />
                                                                </a>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Chat Input */}
                                    <div className="p-4 bg-white border-t border-slate-100 shrink-0">
                                        <div className="flex items-end gap-3 bg-slate-50 border border-slate-200 rounded-2xl p-2 focus-within:bg-white focus-within:border-[#1E4DA6]/35 focus-within:ring-4 focus-within:ring-[#1E4DA6]/5 transition-all shadow-sm">
                                            <textarea 
                                                className="flex-1 bg-transparent border-0 px-3 py-2 text-sm focus:ring-0 resize-none max-h-32 min-h-[44px] outline-none"
                                                placeholder="Type a message to the parent..."
                                                value={replyText}
                                                onChange={(e) => setReplyText(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter' && !e.shiftKey) {
                                                        e.preventDefault();
                                                        handleReply();
                                                    }
                                                }}
                                                rows={1}
                                            />
                                            <button 
                                                onClick={handleReply}
                                                disabled={!replyText.trim() || isSending}
                                                className="h-11 px-5 bg-[#1E4DA6] text-white rounded-xl flex items-center justify-center gap-2 font-bold shadow-md hover:bg-[#173F8C] hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                                            >
                                                {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                                                <span className="hidden sm:inline">Send</span>
                                            </button>
                                        </div>
                                        <p className="text-[10px] text-slate-400 mt-2 text-center font-medium">Press Enter to send, Shift + Enter for new line.</p>
                                    </div>
                                </>
                            ) : (
                                <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8 text-center bg-slate-50/30">
                                    <div className="h-20 w-20 rounded-full bg-slate-100 flex items-center justify-center mb-6 border border-slate-200 shadow-sm">
                                        <MessageSquare className="h-8 w-8 text-slate-300" />
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-700 mb-2">No Chat Selected</h3>
                                    <p className="text-sm max-w-sm">Select a parent from the left sidebar to view their full conversation history and send replies.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {showBulkModal && (
                <BulkFinanceMessageModal
                    onClose={() => setShowBulkModal(false)}
                    onSent={() => { setShowBulkModal(false); fetchMessages(); }}
                />
            )}
        </>
    );
}
