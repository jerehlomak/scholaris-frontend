import { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Copy, Link2, Loader2, Mail, MessageCircle, Send } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { Button } from '../../../components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../../components/ui/dialog';
import { LD_API, apiError, inputCls, type DocSummary } from './api';

type Tab = 'whatsapp' | 'email' | 'link';

// Local Nigerian numbers (0803…) become international (234803…) as wa.me requires; other numbers keep their digits.
const waNumber = (raw: string) => {
    const d = raw.replace(/\D/g, '');
    return d.length === 11 && d.startsWith('0') ? `234${d.slice(1)}` : d;
};

export function ShareDialog({ doc, emailEnabled, onClose, onChanged }: { doc: DocSummary; emailEnabled: boolean; onClose: () => void; onChanged: () => void }) {
    const isUpload = doc.source === 'UPLOAD';
    const uploadFormat = doc.fileMime === 'application/pdf' ? 'pdf' : doc.fileMime === 'application/msword' ? 'doc' : 'docx';
    const [tab, setTab] = useState<Tab>('whatsapp');
    const [link, setLink] = useState<{ url: string; docxUrl: string | null; expiresAt: string } | null>(null);
    const [busy, setBusy] = useState(false);
    const [phone, setPhone] = useState('');
    const [format, setFormat] = useState<'pdf' | 'docx'>('pdf');
    const [to, setTo] = useState('');
    const [message, setMessage] = useState('');

    const makeLink = async () => {
        setBusy(true);
        try { const r = await axios.post(`${LD_API}/${doc.id}/share/link`); setLink(r.data); onChanged(); }
        catch (err) { toast.error(apiError(err, 'Could not create the link.')); }
        finally { setBusy(false); }
    };
    useEffect(() => { if ((tab === 'whatsapp' || tab === 'link') && !link) makeLink(); /* eslint-disable-next-line */ }, [tab]);

    const urlFor = (f: 'pdf' | 'docx') => (isUpload ? link?.url : f === 'docx' ? link?.docxUrl : link?.url) || '';
    const shareText = (url: string) => `${doc.title}${doc.weekLabel ? ` (${doc.weekLabel})` : ''}\n${url}`;

    const whatsapp = () => {
        const url = urlFor(format);
        if (!url) return;
        const n = waNumber(phone);
        window.open(`https://wa.me/${n}?text=${encodeURIComponent(shareText(url))}`, '_blank', 'noopener');
    };

    const sendEmail = async () => {
        setBusy(true);
        try {
            const r = await axios.post(`${LD_API}/${doc.id}/share/email`, { to, message, format: isUpload ? 'original' : format });
            toast.success(r.data.msg); setTo(''); setMessage('');
        } catch (err) { toast.error(apiError(err, 'Could not send the email.')); }
        finally { setBusy(false); }
    };

    const revoke = async () => {
        try { await axios.delete(`${LD_API}/${doc.id}/share/link`); setLink(null); toast.success('Link turned off.'); onChanged(); onClose(); }
        catch (err) { toast.error(apiError(err, 'Could not turn the link off.')); }
    };

    const copy = async (text: string) => { try { await navigator.clipboard.writeText(text); toast.success('Copied.'); } catch { toast.error('Could not copy. Select and copy the link manually.'); } };

    const FormatPick = () => isUpload ? (
        <p className="text-xs text-slate-500">Shared as the original file ({uploadFormat.toUpperCase()}).</p>
    ) : (
        <div className="flex gap-2">
            {(['pdf', 'docx'] as const).map(f => (
                <button key={f} type="button" onClick={() => setFormat(f)} className={cn('rounded-lg border-2 px-3 py-1.5 text-xs font-bold', format === f ? 'border-[#1E4DA6] bg-[#1E4DA6]/5 text-[#173F8C]' : 'border-slate-200 text-slate-500')}>{f === 'pdf' ? 'PDF' : 'Word'}</button>
            ))}
        </div>
    );

    const TABS: [Tab, string, typeof Mail][] = [['whatsapp', 'WhatsApp', MessageCircle], ['email', 'Email', Mail], ['link', 'Link', Link2]];

    return (
        <Dialog open onOpenChange={o => !o && onClose()}>
            <DialogContent className="max-w-md">
                <DialogHeader><DialogTitle>Share “{doc.title}”</DialogTitle><DialogDescription>{doc.weekLabel || 'Send this document to a colleague.'}</DialogDescription></DialogHeader>
                <div className="flex gap-1 rounded-xl bg-slate-100 p-1">
                    {TABS.filter(([k]) => k !== 'email' || emailEnabled).map(([k, label, Icon]) => (
                        <button key={k} onClick={() => setTab(k)} className={cn('flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-bold', tab === k ? 'bg-white text-[#173F8C] shadow-sm' : 'text-slate-500')}><Icon className="h-3.5 w-3.5" /> {label}</button>
                    ))}
                </div>

                {tab === 'whatsapp' && (
                    <div className="space-y-3">
                        <FormatPick />
                        <label className="block space-y-1"><span className="text-xs font-semibold text-slate-600">Phone number (optional)</span>
                            <input className={inputCls} value={phone} onChange={e => setPhone(e.target.value)} placeholder="e.g. 0803 123 4567 — leave empty to pick a contact in WhatsApp" inputMode="tel" /></label>
                        <p className="text-xs text-slate-500">WhatsApp opens with a message and a download link{link ? ` that works until ${new Date(link.expiresAt).toLocaleDateString()}` : ''}. You press Send there.</p>
                        <Button className="w-full" disabled={!link || busy} onClick={whatsapp}>{!link ? <Loader2 className="animate-spin" /> : <MessageCircle />} Open WhatsApp</Button>
                    </div>
                )}

                {tab === 'email' && (
                    <div className="space-y-3">
                        <FormatPick />
                        <label className="block space-y-1"><span className="text-xs font-semibold text-slate-600">To (up to 5, separated by commas)</span>
                            <input className={inputCls} value={to} onChange={e => setTo(e.target.value)} placeholder="name@example.com" type="email" multiple /></label>
                        <label className="block space-y-1"><span className="text-xs font-semibold text-slate-600">Message (optional)</span>
                            <textarea className={`${inputCls} !h-20 py-2`} value={message} onChange={e => setMessage(e.target.value)} maxLength={1000} /></label>
                        <Button className="w-full" disabled={busy || !to.trim()} onClick={sendEmail}>{busy ? <Loader2 className="animate-spin" /> : <Send />} Send with attachment</Button>
                    </div>
                )}

                {tab === 'link' && (
                    <div className="space-y-3">
                        {!link ? <Loader2 className="mx-auto h-5 w-5 animate-spin text-[#1E4DA6]" /> : (
                            <>
                                <p className="text-xs text-slate-500">Anyone with this link can download the document until {new Date(link.expiresAt).toLocaleDateString()}.</p>
                                <div className="flex gap-2"><input readOnly className={inputCls} value={link.url} onFocus={e => e.target.select()} /><Button variant="outline" size="icon" onClick={() => copy(link.url)} aria-label="Copy link"><Copy /></Button></div>
                                {link.docxUrl && <div className="flex gap-2"><input readOnly className={inputCls} value={link.docxUrl} onFocus={e => e.target.select()} /><Button variant="outline" size="icon" onClick={() => copy(link.docxUrl!)} aria-label="Copy Word link"><Copy /></Button></div>}
                                <Button variant="ghost" className="text-red-600" onClick={revoke}>Turn the link off</Button>
                            </>
                        )}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
