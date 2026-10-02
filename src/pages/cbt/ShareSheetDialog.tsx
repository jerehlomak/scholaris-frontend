import { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Copy, Link2, Loader2, Mail, MessageCircle, Send } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from '../../components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { CBT_API, apiError, inputCls } from './api';

type Tab = 'whatsapp' | 'email' | 'link';
const waNumber = (raw: string) => { const d = raw.replace(/\D/g, ''); return d.length === 11 && d.startsWith('0') ? `234${d.slice(1)}` : d; };

/** Share a results sheet or master sheet by WhatsApp, email or link. `target` says which sheet. */
export function ShareSheetDialog({ title, target, emailEnabled, onClose }: { title: string; target: Record<string, unknown>; emailEnabled: boolean; onClose: () => void }) {
    const [tab, setTab] = useState<Tab>('whatsapp');
    const [link, setLink] = useState<{ url: string; xlsxUrl: string; expiresAt: string } | null>(null);
    const [busy, setBusy] = useState(false);
    const [phone, setPhone] = useState('');
    const [format, setFormat] = useState<'pdf' | 'xlsx'>('pdf');
    const [to, setTo] = useState('');
    const [message, setMessage] = useState('');

    useEffect(() => {
        if (link || tab === 'email') return;
        axios.post(`${CBT_API}/share/link`, target).then(r => setLink(r.data)).catch(err => toast.error(apiError(err, 'Could not create the link.')));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tab]);

    const url = link ? (format === 'xlsx' ? link.xlsxUrl : link.url) : '';
    const whatsapp = () => window.open(`https://wa.me/${waNumber(phone)}?text=${encodeURIComponent(`${title}\n${url}`)}`, '_blank', 'noopener');
    const sendEmail = async () => {
        setBusy(true);
        try { const r = await axios.post(`${CBT_API}/share/email`, { ...target, to, message, format }); toast.success(r.data.msg); setTo(''); setMessage(''); }
        catch (err) { toast.error(apiError(err, 'Could not send the email.')); } finally { setBusy(false); }
    };
    const copy = async (t: string) => { try { await navigator.clipboard.writeText(t); toast.success('Copied.'); } catch { toast.error('Could not copy. Select the link and copy it manually.'); } };
    const FormatPick = () => <div className="flex gap-2">{(['pdf', 'xlsx'] as const).map(f => <button key={f} type="button" onClick={() => setFormat(f)} className={cn('rounded-lg border-2 px-3 py-1.5 text-xs font-bold', format === f ? 'border-[#1E4DA6] bg-[#1E4DA6]/5 text-[#173F8C]' : 'border-slate-200 text-slate-500')}>{f === 'pdf' ? 'PDF' : 'Excel'}</button>)}</div>;
    const TABS: [Tab, string, typeof Mail][] = [['whatsapp', 'WhatsApp', MessageCircle], ['email', 'Email', Mail], ['link', 'Link', Link2]];

    return (
        <Dialog open onOpenChange={o => !o && onClose()}>
            <DialogContent className="max-w-md">
                <DialogHeader><DialogTitle>Share “{title}”</DialogTitle><DialogDescription>Results contain students' names and scores. Share only with people who should see them.</DialogDescription></DialogHeader>
                <div className="flex gap-1 rounded-xl bg-slate-100 p-1">{TABS.filter(([k]) => k !== 'email' || emailEnabled).map(([k, l, Icon]) => <button key={k} onClick={() => setTab(k)} className={cn('flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-bold', tab === k ? 'bg-white text-[#173F8C] shadow-sm' : 'text-slate-500')}><Icon className="h-3.5 w-3.5" /> {l}</button>)}</div>
                {tab === 'whatsapp' && <div className="space-y-3"><FormatPick /><label className="block space-y-1"><span className="text-xs font-semibold text-slate-600">Phone number (optional)</span><input className={inputCls} value={phone} onChange={e => setPhone(e.target.value)} inputMode="tel" placeholder="e.g. 0803 123 4567, or leave empty to pick a contact" /></label>
                    <p className="text-xs text-slate-500">WhatsApp opens with the message and a download link{link ? ` that works until ${new Date(link.expiresAt).toLocaleDateString()}` : ''}. You press Send there.</p>
                    <Button className="w-full" disabled={!link} onClick={whatsapp}>{!link ? <Loader2 className="animate-spin" /> : <MessageCircle />} Open WhatsApp</Button></div>}
                {tab === 'email' && <div className="space-y-3"><FormatPick /><label className="block space-y-1"><span className="text-xs font-semibold text-slate-600">To (up to 5, separated by commas)</span><input className={inputCls} value={to} onChange={e => setTo(e.target.value)} placeholder="name@example.com" /></label>
                    <label className="block space-y-1"><span className="text-xs font-semibold text-slate-600">Message (optional)</span><textarea className={`${inputCls} !h-20 py-2`} value={message} onChange={e => setMessage(e.target.value)} maxLength={1000} /></label>
                    <Button className="w-full" disabled={busy || !to.trim()} onClick={sendEmail}>{busy ? <Loader2 className="animate-spin" /> : <Send />} Send with attachment</Button></div>}
                {tab === 'link' && <div className="space-y-3">{!link ? <Loader2 className="mx-auto h-5 w-5 animate-spin text-[#1E4DA6]" /> : <>
                    <p className="text-xs text-slate-500">Anyone with a link can download the sheet until {new Date(link.expiresAt).toLocaleDateString()}.</p>
                    {[['PDF', link.url], ['Excel', link.xlsxUrl]].map(([l, u]) => <div key={l} className="flex gap-2"><input readOnly className={inputCls} value={u} onFocus={e => e.target.select()} aria-label={`${l} link`} /><Button variant="outline" size="icon" onClick={() => copy(u)} aria-label={`Copy ${l} link`}><Copy /></Button></div>)}</>}</div>}
            </DialogContent>
        </Dialog>
    );
}
