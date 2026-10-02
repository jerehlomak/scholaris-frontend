import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { BadgeCheck, Loader2, RotateCw, ShieldAlert, Printer } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { IdCardView } from './IdCardView';
import { ID_CARD_API } from './useIdCard';
import type { CardItem, IdCardConfig, SchoolInfo } from './types';

interface DigitalPayload { config: IdCardConfig; school: SchoolInfo; item: CardItem }

function statusOf(item: CardItem, config: IdCardConfig) {
    if (!item.card) return { label: 'Not issued', tone: 'bad' as const };
    if (item.card.status === 'REVOKED') return { label: 'Revoked', tone: 'bad' as const };
    if (!item.valid) return { label: 'Expired', tone: 'bad' as const };
    return { label: 'Valid', tone: 'ok' as const, expiry: config.expiry.enabled ? item.card.expiresAt : null };
}

/** The card itself, flippable, with a validity banner. Used by the public and the logged-in page. */
export function DigitalCardPanel({ payload }: { payload: DigitalPayload }) {
    const { config, school, item } = payload;
    const [side, setSide] = useState<'front' | 'back'>('front');
    const st = statusOf(item, config);
    const vertical = config.orientation === 'vertical';
    // Fill the phone screen: vertical cards are scaled up, horizontal ones to the available width.
    const [scale, setScale] = useState(1.25);
    useEffect(() => {
        const fit = () => {
            const avail = Math.min(window.innerWidth - 40, 460);
            const base = vertical ? 204 : 324;
            setScale(Math.max(0.8, Math.min(vertical ? 1.5 : 1.4, avail / base)));
        };
        fit();
        window.addEventListener('resize', fit);
        return () => window.removeEventListener('resize', fit);
    }, [vertical]);

    return (
        <div className="mx-auto flex max-w-md flex-col items-center gap-5 px-5 py-6">
            <div className={cn('flex w-full items-center gap-3 rounded-2xl border px-4 py-3', st.tone === 'ok' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-red-200 bg-red-50 text-red-800')}>
                {st.tone === 'ok' ? <BadgeCheck className="h-6 w-6 shrink-0" /> : <ShieldAlert className="h-6 w-6 shrink-0" />}
                <div>
                    <p className="text-sm font-black uppercase tracking-wide">{st.label} ID card</p>
                    <p className="text-xs font-semibold opacity-80">
                        {item.person.name} · {school.name}
                        {st.tone === 'ok' && 'expiry' in st && st.expiry ? ` · valid until ${new Date(st.expiry).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}` : ''}
                    </p>
                </div>
            </div>

            <IdCardView config={config} school={school} person={item.person} card={item.card} qr={item.qr} side={side} scale={scale}
                style={{ boxShadow: '0 12px 32px rgba(15,23,42,.3)' }} />

            <div className="flex gap-3">
                <button onClick={() => setSide(s => (s === 'front' ? 'back' : 'front'))} className="flex items-center gap-2 rounded-xl bg-[#173F8C] px-5 py-2.5 text-sm font-bold text-white shadow hover:bg-[#122F69]">
                    <RotateCw className="h-4 w-4" /> Show {side === 'front' ? 'back' : 'front'}
                </button>
                <button onClick={() => window.print()} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 print:hidden">
                    <Printer className="h-4 w-4" /> Print
                </button>
            </div>
            <p className="text-center text-xs text-slate-400">Tip: add this page to your phone's home screen to keep your digital ID handy.</p>
        </div>
    );
}

/** Public page opened by scanning the QR printed on a card: /id/:token */
export function PublicDigitalIdCard() {
    const { token } = useParams<{ token: string }>();
    const [payload, setPayload] = useState<DigitalPayload | null>(null);
    const [error, setError] = useState('');

    useEffect(() => {
        axios.get(`${ID_CARD_API}/verify/${token}`, { params: { origin: window.location.origin } })
            .then(res => setPayload(res.data))
            .catch(err => setError(err.response?.data?.msg || 'This ID card could not be verified.'));
    }, [token]);

    return (
        <div className="min-h-screen bg-slate-100">
            {!payload && !error && <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-[#1E4DA6]" /></div>}
            {error && (
                <div className="mx-auto flex h-screen max-w-sm flex-col items-center justify-center gap-3 px-6 text-center">
                    <ShieldAlert className="h-12 w-12 text-red-500" />
                    <h1 className="text-xl font-black text-slate-800">Card not verified</h1>
                    <p className="text-sm text-slate-500">{error}</p>
                </div>
            )}
            {payload && <DigitalCardPanel payload={payload} />}
        </div>
    );
}

/** Logged-in student / staff member's own digital card. */
export function MyIdCard() {
    const [state, setState] = useState<{ loading: boolean; payload?: DigitalPayload; msg?: string }>({ loading: true });

    useEffect(() => {
        axios.get(`${ID_CARD_API}/me`, { withCredentials: true, params: { origin: window.location.origin } })
            .then(res => setState(res.data.issued ? { loading: false, payload: res.data } : { loading: false, msg: res.data.msg }))
            .catch(err => setState({ loading: false, msg: err.response?.data?.msg || 'Could not load your ID card.' }));
    }, []);

    return (
        <div className="p-4 sm:p-6">
            <h1 className="mb-1 text-2xl font-black text-slate-800">My ID Card</h1>
            <p className="mb-4 text-sm text-slate-500">Your digital identity card. Show it on your phone or scan the QR code to verify it.</p>
            {state.loading && <div className="flex h-40 items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-[#1E4DA6]" /></div>}
            {state.msg && <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm font-semibold text-slate-500">{state.msg}</div>}
            {state.payload && <DigitalCardPanel payload={state.payload} />}
        </div>
    );
}
