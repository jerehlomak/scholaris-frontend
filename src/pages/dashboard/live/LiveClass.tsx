/**
 * LiveClass.tsx — Hub page for Live Classes
 *
 * Components used:
 *  - LiveStats     → top stat cards
 *  - CreateClassForm → "create a class" panel
 *  - JoinClassCard   → "join with code" panel
 *  - SessionCard     → individual session row card
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Radio, Calendar, CheckCircle2 } from 'lucide-react';

import { LiveStats } from './components/LiveStats';
import { SessionCard, type LiveSession } from './components/SessionCard';
import { CreateClassForm, type ClassFormState } from './components/CreateClassForm';
import { JoinClassCard } from './components/JoinClassCard';

// ─── Seed data ────────────────────────────────────────────────────────────────
const INITIAL_SESSIONS: LiveSession[] = [
    { id: 'room-1', title: 'Introduction to Calculus', subject: 'Mathematics', classLevel: 'SS 3', hostName: 'Mr. Adebayo', scheduledAt: new Date(Date.now() - 600000).toISOString(), durationMinutes: 60, status: 'live', participants: 24 },
    { id: 'room-2', title: 'Human Digestive System', subject: 'Biology', classLevel: 'JSS 2', hostName: 'Mrs. Okafor', scheduledAt: new Date(Date.now() + 3600000).toISOString(), durationMinutes: 45, status: 'upcoming', participants: 0 },
    { id: 'room-3', title: 'English Essay Writing', subject: 'English', classLevel: 'SS 1', hostName: 'Mr. Chukwu', scheduledAt: new Date(Date.now() + 7200000).toISOString(), durationMinutes: 60, status: 'upcoming', participants: 0 },
    { id: 'room-4', title: "Newton's Laws of Motion", subject: 'Physics', classLevel: 'SS 2', hostName: 'Mrs. Emeka', scheduledAt: new Date(Date.now() - 86400000).toISOString(), durationMinutes: 50, status: 'ended', participants: 31 },
    { id: 'room-5', title: 'Organic Chemistry Basics', subject: 'Chemistry', classLevel: 'SS 1', hostName: 'Mr. Ibrahim', scheduledAt: new Date(Date.now() - 172800000).toISOString(), durationMinutes: 55, status: 'ended', participants: 28 },
];

const BLANK_FORM: ClassFormState = { title: '', subject: '', classLevel: '', durationMinutes: 60, scheduledAt: '' };

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function LiveClass() {
    const navigate = useNavigate();

    const [sessions, setSessions] = useState<LiveSession[]>(INITIAL_SESSIONS);
    const [form, setForm] = useState<ClassFormState>(BLANK_FORM);
    const [joinCode, setJoinCode] = useState('');
    const [copied, setCopied] = useState<string | null>(null);

    // Derived lists
    const liveSessions = sessions.filter(s => s.status === 'live');
    const upcomingSessions = sessions.filter(s => s.status === 'upcoming');
    const endedSessions = sessions.filter(s => s.status === 'ended');

    // Detect which base path the user is coming from (student, teacher, or dashboard)
    const basePath = window.location.pathname.startsWith('/student')
        ? '/student'
        : window.location.pathname.startsWith('/teacher')
            ? '/teacher'
            : '/dashboard';

    const handleCreate = () => {
        if (!form.title || !form.subject || !form.classLevel) return;
        const newSession: LiveSession = {
            id: 'room-' + crypto.randomUUID().slice(0, 8),
            title: form.title,
            subject: form.subject,
            classLevel: form.classLevel,
            hostName: 'You',
            scheduledAt: form.scheduledAt || new Date().toISOString(),
            durationMinutes: form.durationMinutes,
            status: 'live',
            participants: 0,
        };
        setSessions(prev => [newSession, ...prev]);
        setForm(BLANK_FORM);
        navigate(`${basePath}/live-class/room/${newSession.id}`);
    };

    const handleJoin = () => {
        const code = joinCode.trim();
        if (code) navigate(`${basePath}/live-class/room/${code}`);
    };

    const copyLink = (id: string) => {
        navigator.clipboard.writeText(`${window.location.origin}${basePath}/live-class/room/${id}`);
        setCopied(id);
        setTimeout(() => setCopied(null), 2000);
    };

    return (
        <div className="space-y-6 font-dash pb-10 px-4">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Live Classes</h2>
                    <p className="text-sm text-gray-500 mt-1">Host or join interactive video lessons in real time.</p>
                </div>
            </div>

            {/* Stats */}
            <LiveStats
                liveCount={liveSessions.length}
                upcomingCount={upcomingSessions.length}
                totalCount={sessions.length}
            />

            {/* Create + Join */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <CreateClassForm form={form} onChange={setForm} onSubmit={handleCreate} />
                <JoinClassCard joinCode={joinCode} onCodeChange={setJoinCode} onJoin={handleJoin} />
            </div>

            {/* ── Session Sections ── */}
            {liveSessions.length > 0 && (
                <section className="space-y-3">
                    <h3 className="font-bold text-gray-900 flex items-center gap-2">
                        <Radio className="w-4 h-4 text-red-500 animate-pulse" /> Live Now
                    </h3>
                    {liveSessions.map(s => (
                        <SessionCard
                            key={s.id}
                            session={s}
                            onJoin={() => navigate(`${basePath}/live-class/room/${s.id}`)}
                            onCopy={() => copyLink(s.id)}
                            copied={copied === s.id}
                        />
                    ))}
                </section>
            )}

            {upcomingSessions.length > 0 && (
                <section className="space-y-3">
                    <h3 className="font-bold text-gray-900 flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-[#0036a1]" /> Upcoming Sessions
                    </h3>
                    {upcomingSessions.map(s => (
                        <SessionCard
                            key={s.id}
                            session={s}
                            onJoin={() => navigate(`${basePath}/live-class/room/${s.id}`)}
                            onCopy={() => copyLink(s.id)}
                            copied={copied === s.id}
                        />
                    ))}
                </section>
            )}

            {endedSessions.length > 0 && (
                <section className="space-y-3">
                    <h3 className="font-bold text-gray-900 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-gray-400" /> Past Sessions
                    </h3>
                    {endedSessions.map(s => (
                        <SessionCard
                            key={s.id}
                            session={s}
                            onJoin={() => { }}
                            onCopy={() => copyLink(s.id)}
                            copied={copied === s.id}
                        />
                    ))}
                </section>
            )}
        </div>
    );
}
