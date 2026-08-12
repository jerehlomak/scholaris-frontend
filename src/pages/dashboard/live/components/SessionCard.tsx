import { motion } from 'framer-motion';
import { Radio, Calendar, BookOpen, Copy, CheckCircle2, ChevronRight, Play } from 'lucide-react';
import { Card } from '../../../../components/ui/card';
import { Button } from '../../../../components/ui/button';

export interface LiveSession {
    id: string;
    title: string;
    subject: string;
    classLevel: string;
    hostName: string;
    scheduledAt: string;
    durationMinutes: number;
    status: 'upcoming' | 'live' | 'ended';
    participants: number;
}

function StatusBadge({ status }: { status: LiveSession['status'] }) {
    if (status === 'live') return (
        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-600 animate-pulse">
            <Radio className="w-3 h-3" /> LIVE NOW
        </span>
    );
    if (status === 'upcoming') return (
        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-[#0036a1]/10 text-[#0036a1]">
            <Calendar className="w-3 h-3" /> Upcoming
        </span>
    );
    return (
        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-500">
            <CheckCircle2 className="w-3 h-3" /> Ended
        </span>
    );
}

interface Props {
    session: LiveSession;
    onJoin: () => void;
    onCopy: () => void;
    copied: boolean;
}

export function SessionCard({ session, onJoin, onCopy, copied }: Props) {
    return (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
            <Card className={`p-5 bg-white border shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${session.status === 'live' ? 'border-red-200 bg-red-50/30' : 'border-gray-100'}`}>
                <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${session.status === 'live' ? 'bg-red-100 text-red-600' : session.status === 'upcoming' ? 'bg-[#0036a1]/10 text-[#0036a1]' : 'bg-gray-100 text-gray-400'}`}>
                        {session.status === 'live' ? <Radio className="w-6 h-6" /> : session.status === 'upcoming' ? <Calendar className="w-6 h-6" /> : <BookOpen className="w-6 h-6" />}
                    </div>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <StatusBadge status={session.status} />
                            <span className="text-xs text-gray-500 font-medium">{session.subject} · {session.classLevel}</span>
                        </div>
                        <h4 className="font-bold text-gray-900">{session.title}</h4>
                        <p className="text-xs text-gray-500 mt-0.5">
                            {session.hostName} · {new Date(session.scheduledAt).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })} · {session.durationMinutes} min
                            {session.status !== 'upcoming' && ` · ${session.participants} joined`}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <button onClick={onCopy} className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                        {copied ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                        {copied ? 'Copied!' : 'Copy Link'}
                    </button>
                    {session.status !== 'ended' && (
                        <Button onClick={onJoin} className={`flex items-center gap-2 ${session.status === 'live' ? 'bg-red-600 hover:bg-red-700' : 'bg-[#0036a1] hover:bg-[#001761]'} text-white`}>
                            {session.status === 'live' ? <><Radio className="w-3.5 h-3.5" /> Join Live</> : <><Play className="w-3.5 h-3.5" /> Start</>}
                            <ChevronRight className="w-3.5 h-3.5" />
                        </Button>
                    )}
                </div>
            </Card>
        </motion.div>
    );
}
