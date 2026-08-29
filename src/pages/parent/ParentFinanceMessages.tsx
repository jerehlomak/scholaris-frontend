import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { MessageSquare, Send, Loader2, UploadCloud } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';

export default function ParentFinanceMessages() {
    const [messages, setMessages] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [replyBody, setReplyBody] = useState('');
    const [replyAttachment, setReplyAttachment] = useState<File | null>(null);
    const [isReplying, setIsReplying] = useState(false);

    const fetchMessages = async () => {
        try {
            const res = await axios.get('/api/v1/finance-v2/messages/parent', { withCredentials: true });
            setMessages(res.data.messages || []);
        } catch {
            toast.error('Failed to load finance messages');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMessages();
        axios.put('/api/v1/finance-v2/messages/parent/mark-read', {}, { withCredentials: true }).catch(() => {});
    }, []);

    const thread = [...messages].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    const handleReply = async () => {
        if (!replyBody.trim() && !replyAttachment) return;
        setIsReplying(true);
        try {
            const lastMessage = thread[thread.length - 1];
            const formData = new FormData();
            if (lastMessage) formData.append('replyToId', lastMessage.id);
            formData.append('body', replyBody);
            if (replyAttachment) formData.append('attachment', replyAttachment);

            await axios.post('/api/v1/finance-v2/messages/parent', formData, {
                withCredentials: true,
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            setReplyBody('');
            setReplyAttachment(null);
            await fetchMessages();
        } catch {
            toast.error('Failed to send reply');
        } finally {
            setIsReplying(false);
        }
    };

    if (loading) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-[#1E4DA6]" />
            </div>
        );
    }

    return (
        <div className="w-full max-w-3xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#173F8C] to-[#1E4DA6] shadow-lg shadow-[#1E4DA6]/20">
                    <MessageSquare className="h-6 w-6 text-white" />
                </div>
                <div>
                    <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Finance Messages</h1>
                    <p className="mt-0.5 text-sm text-slate-500">Payment reminders, disputes and messages from the school's finance office.</p>
                </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col h-[65vh] min-h-[420px]">
                <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50">
                    {thread.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center text-slate-400">
                            <MessageSquare className="h-10 w-10 text-slate-300 mb-3" />
                            <p className="font-semibold text-slate-600">No finance messages yet</p>
                            <p className="text-sm max-w-xs mt-1">Reminders and messages from the finance office will appear here.</p>
                        </div>
                    ) : (
                        thread.map((msg: any) => {
                            const isParent = msg.senderType === 'PARENT';
                            return (
                                <div key={msg.id} className={cn('flex flex-col max-w-[85%]', isParent ? 'ml-auto items-end' : 'mr-auto items-start')}>
                                    <span className="text-[10px] font-bold text-slate-400 mb-1 px-1">
                                        {isParent ? 'You' : 'School Admin'} • {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                    <div className={cn(
                                        'p-3 rounded-2xl text-sm shadow-sm',
                                        isParent ? 'bg-[#1E4DA6] text-white rounded-br-sm' : 'bg-white border border-slate-200 text-slate-700 rounded-bl-sm'
                                    )}>
                                        {msg.subject && msg.subject !== 'Fee Reminder' && !msg.subject.startsWith('Re:') && (
                                            <p className={cn('text-xs font-bold mb-2 pb-2 border-b', isParent ? 'border-[#1E4DA6] text-white/80' : 'border-slate-100 text-slate-500')}>
                                                {msg.subject}
                                            </p>
                                        )}
                                        <p className="whitespace-pre-wrap">{msg.body}</p>
                                        {msg.attachmentUrl && (
                                            <a href={msg.attachmentUrl} target="_blank" rel="noreferrer" className={cn('mt-2 flex items-center gap-1 text-[11px] font-bold underline', isParent ? 'text-white/70 hover:text-white' : 'text-[#1E4DA6] hover:text-[#122F69]')}>
                                                View Attachment
                                            </a>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                <div className="p-4 bg-white border-t border-slate-100 shrink-0">
                    <div className="flex flex-col gap-3">
                        <textarea
                            value={replyBody}
                            onChange={(e) => setReplyBody(e.target.value)}
                            placeholder="Type your message here..."
                            className="w-full min-h-[70px] p-3 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white shadow-sm focus:border-[#1E4DA6] focus:ring-1 focus:ring-[#1E4DA6] transition-all outline-none resize-none"
                        />
                        <div className="flex items-center justify-between gap-3">
                            <div className="relative flex-1 max-w-[200px]">
                                <UploadCloud className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <Input
                                    type="file"
                                    accept="image/jpeg, image/png, image/webp, application/pdf"
                                    onChange={(e) => setReplyAttachment(e.target.files ? e.target.files[0] : null)}
                                    className="pl-9 h-9 rounded-xl bg-slate-50 border-slate-200 focus:bg-white pt-[4px] text-xs"
                                />
                            </div>
                            <Button
                                onClick={handleReply}
                                disabled={(!replyBody.trim() && !replyAttachment) || isReplying}
                                className="rounded-xl h-9 px-5 gap-2 bg-[#1E4DA6] hover:bg-[#173F8C] font-bold shadow-md shadow-[#1E4DA6]/20"
                            >
                                {isReplying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                {isReplying ? 'Sending...' : 'Send'}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
