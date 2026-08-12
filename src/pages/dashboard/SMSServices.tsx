/**
 * SMSServices.tsx — Professional Bulk SMS Composer
 * Connects to /api/v1/communicate/sms/* for real recipient counts and log persistence.
 */
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    MessageSquare, Users, Send, Clock, CheckCheck,
    AlertTriangle, BookOpen, CreditCard, Calendar,
    Megaphone, Shield, ChevronDown, ChevronUp, Search,
    X, BarChart2, Smartphone, Loader2, RefreshCw
} from 'lucide-react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import axios from 'axios';

const API = '/api/v1/communicate';

// ─── Types ─────────────────────────────────────────────────────────────────────
interface RecipientGroup {
    id: string;
    label: string;
    count: number;
    type: 'all' | 'class' | 'role';
}

interface SmsLog {
    id: string;
    category: string;
    message: string;
    recipientGroup: string;
    recipientCount: number;
    sentBy: string;
    status: 'DELIVERED' | 'PARTIAL' | 'FAILED';
    createdAt: string;
}

interface SmsStats {
    totalBatches: number;
    totalRecipients: number;
    deliveryRate: number;
}

// ─── SMS Category Templates ───────────────────────────────────────────────────
const SMS_CATEGORIES = [
    { id: 'pta', label: 'PTA Meeting', description: 'Notify parents of upcoming PTA meetings', icon: <Users className="w-5 h-5" />, color: 'bg-blue-100 text-blue-700 border-blue-200', template: 'Dear Parent/Guardian, you are cordially invited to attend the PTA meeting scheduled for [DATE] at [TIME] in the school hall. Your presence is important. Thank you.' },
    { id: 'fees', label: 'Fee Payment Reminder', description: 'Remind parents about outstanding fee payments', icon: <CreditCard className="w-5 h-5" />, color: 'bg-orange-100 text-orange-700 border-orange-200', template: 'Dear Parent/Guardian, this is a reminder that school fees for [TERM] are due on [DATE]. Kindly visit the bursary to make payment. Thank you.' },
    { id: 'exam', label: 'Exam / CBT Schedule', description: 'Inform students & parents of upcoming exams', icon: <BookOpen className="w-5 h-5" />, color: 'bg-purple-100 text-purple-700 border-purple-200', template: 'Dear Student/Parent, the [TERM] examinations are scheduled to commence on [DATE]. Students are advised to be punctual and come prepared. Best of luck!' },
    { id: 'resumption', label: 'School Resumption', description: 'Alert parents of term resumption dates', icon: <Calendar className="w-5 h-5" />, color: 'bg-green-100 text-green-700 border-green-200', template: 'Dear Parent/Guardian, kindly note that [TERM] resumption is on [DATE]. Ensure your ward reports to school by 8:00 AM. Thank you.' },
    { id: 'event', label: 'School Event / Celebration', description: 'Announce inter-house sports, graduation, etc.', icon: <Megaphone className="w-5 h-5" />, color: 'bg-pink-100 text-pink-700 border-pink-200', template: 'Dear Parent/Guardian, we invite you to our [EVENT NAME] holding on [DATE] at [TIME]. We look forward to your presence and support!' },
    { id: 'result', label: 'Result Notification', description: 'Notify parents that results are ready', icon: <BarChart2 className="w-5 h-5" />, color: 'bg-teal-100 text-teal-700 border-teal-200', template: 'Dear Parent/Guardian, the [TERM] results for your ward are now available. You can collect them from the school or view them via the student portal.' },
    { id: 'emergency', label: 'Emergency / Urgent Alert', description: 'Send urgent notices to all stakeholders', icon: <Shield className="w-5 h-5" />, color: 'bg-red-100 text-red-700 border-red-200', template: 'URGENT: Dear Parent/Guardian, please be informed that [MESSAGE]. Kindly contact the school immediately for further information.' },
    { id: 'custom', label: 'Custom Message', description: 'Write your own message from scratch', icon: <MessageSquare className="w-5 h-5" />, color: 'bg-gray-100 text-gray-700 border-gray-200', template: '' },
];

// ─── Sub Components ───────────────────────────────────────────────────────────
function StatCard({ icon, label, value, sub, color }: { icon: React.ReactNode; label: string; value: string; sub: string; color: string }) {
    return (
        <Card className="p-5 bg-white border border-gray-100 shadow-sm flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${color}`}>{icon}</div>
            <div>
                <p className="text-sm text-gray-500 font-medium">{label}</p>
                <h4 className="text-2xl font-bold text-gray-900">{value}</h4>
                <p className="text-xs text-gray-400">{sub}</p>
            </div>
        </Card>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function SMSServices() {
    const [selectedCategory, setSelectedCategory] = useState<typeof SMS_CATEGORIES[0] | null>(null);
    const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
    const [message, setMessage] = useState('');
    const [groupSearch, setGroupSearch] = useState('');
    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [isSending, setIsSending] = useState(false);
    const [sentSuccess, setSentSuccess] = useState(false);

    const [recipientGroups, setRecipientGroups] = useState<RecipientGroup[]>([]);
    const [smsLogs, setSmsLogs] = useState<SmsLog[]>([]);
    const [stats, setStats] = useState<SmsStats>({ totalBatches: 0, totalRecipients: 0, deliveryRate: 100 });
    const [loadingGroups, setLoadingGroups] = useState(true);
    const [loadingLogs, setLoadingLogs] = useState(true);
    const [showHistory, setShowHistory] = useState(true);

    // ── Data Fetching ──
    const fetchData = useCallback(async () => {
        try {
            const [groupRes, logRes] = await Promise.all([
                axios.get(`${API}/sms/groups`, { withCredentials: true }),
                axios.get(`${API}/sms/logs`, { withCredentials: true }),
            ]);
            setRecipientGroups(groupRes.data.groups);
            setSmsLogs(logRes.data.logs);
            setStats(logRes.data.stats);
        } catch (err) {
            console.error('Failed to fetch SMS data', err);
        } finally {
            setLoadingGroups(false);
            setLoadingLogs(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    // ── Composer Logic ──
    const pickCategory = (cat: typeof SMS_CATEGORIES[0]) => {
        setSelectedCategory(cat);
        setMessage(cat.template);
        setStep(2);
    };

    const toggleGroup = (id: string) => {
        setSelectedGroups(prev => prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id]);
    };

    const totalRecipients = selectedGroups.reduce((acc, id) => {
        const group = recipientGroups.find(g => g.id === id);
        return acc + (group?.count ?? 0);
    }, 0);

    const filteredGroups = recipientGroups.filter(g =>
        g.label.toLowerCase().includes(groupSearch.toLowerCase())
    );

    const handleSend = async () => {
        if (!message.trim() || selectedGroups.length === 0 || message.includes('[')) return;
        setIsSending(true);
        try {
            const res = await axios.post(`${API}/sms/send`, {
                category: selectedCategory?.label || 'Custom',
                message,
                recipientGroups: selectedGroups,
            }, { withCredentials: true });
            setSentSuccess(true);
            setSmsLogs(prev => [res.data.log, ...prev]);
            setStats(s => ({ ...s, totalBatches: s.totalBatches + 1, totalRecipients: s.totalRecipients + totalRecipients }));
            setTimeout(() => {
                setSentSuccess(false);
                setStep(1);
                setSelectedCategory(null);
                setSelectedGroups([]);
                setMessage('');
            }, 3000);
        } catch (err) {
            console.error('Failed to send SMS', err);
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="space-y-6 font-dash pb-10">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 tracking-tight">SMS Services</h2>
                    <p className="text-sm text-gray-500 mt-1">Send targeted bulk messages to parents, students, or staff.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={fetchData} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#0036a1] transition-colors">
                        <RefreshCw className="w-4 h-4" /> Refresh
                    </button>
                    <div className="flex items-center gap-2 bg-[#0036a1]/5 border border-[#0036a1]/20 px-4 py-2 rounded-xl">
                        <Smartphone className="w-4 h-4 text-[#0036a1]" />
                        <span className="text-sm font-bold text-[#0036a1]">
                            {(stats.totalRecipients).toLocaleString()} total SMS sent
                        </span>
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <StatCard icon={<Send className="w-5 h-5" />} label="SMS Batches Sent" value={stats.totalBatches.toLocaleString()} sub="All time" color="bg-[#0036a1]/10 text-[#0036a1]" />
                <StatCard icon={<CheckCheck className="w-5 h-5" />} label="Delivery Rate" value={`${stats.deliveryRate}%`} sub="Based on all sent batches" color="bg-[#6bc048]/10 text-[#6bc048]" />
                <StatCard icon={<Clock className="w-5 h-5" />} label="Total Recipients Reached" value={stats.totalRecipients.toLocaleString()} sub="Across all SMS campaigns" color="bg-[#ff9800]/10 text-[#ff9800]" />
            </div>

            {/* Composer */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-4">

                    {/* Step 1 */}
                    <Card className="bg-white border border-gray-100 shadow-sm overflow-hidden">
                        <button className="w-full flex items-center justify-between p-5 hover:bg-gray-50 transition-colors"
                            onClick={() => setStep(step === 1 ? 2 : 1)}>
                            <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step > 1 ? 'bg-[#6bc048] text-white' : 'bg-[#0036a1] text-white'}`}>
                                    {step > 1 ? <CheckCheck className="w-4 h-4" /> : '1'}
                                </div>
                                <div className="text-left">
                                    <p className="font-bold text-gray-900">Choose Category</p>
                                    {selectedCategory && <p className="text-sm text-[#0036a1] font-medium">{selectedCategory.label}</p>}
                                </div>
                            </div>
                            {step === 1 ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                        </button>
                        <AnimatePresence>
                            {step === 1 && (
                                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                                    className="overflow-hidden border-t border-gray-100">
                                    <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {SMS_CATEGORIES.map(cat => (
                                            <button key={cat.id} onClick={() => pickCategory(cat)}
                                                className={`flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all hover:shadow-sm ${selectedCategory?.id === cat.id ? cat.color + ' border-current' : 'border-gray-100 hover:border-gray-200 bg-gray-50'}`}>
                                                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${cat.color}`}>{cat.icon}</div>
                                                <div>
                                                    <p className="font-bold text-sm text-gray-900">{cat.label}</p>
                                                    <p className="text-xs text-gray-500 mt-0.5">{cat.description}</p>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </Card>

                    {/* Step 2 */}
                    <Card className="bg-white border border-gray-100 shadow-sm overflow-hidden">
                        <button className="w-full flex items-center justify-between p-5 hover:bg-gray-50 transition-colors"
                            onClick={() => setStep(step === 2 ? 3 : 2)}>
                            <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${selectedGroups.length > 0 ? 'bg-[#6bc048] text-white' : step >= 2 ? 'bg-[#0036a1] text-white' : 'bg-gray-200 text-gray-500'}`}>
                                    {selectedGroups.length > 0 ? <CheckCheck className="w-4 h-4" /> : '2'}
                                </div>
                                <div className="text-left">
                                    <p className="font-bold text-gray-900">Select Recipients</p>
                                    {selectedGroups.length > 0 && <p className="text-sm text-[#0036a1] font-medium">{totalRecipients.toLocaleString()} recipients</p>}
                                </div>
                            </div>
                            {step === 2 ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                        </button>
                        <AnimatePresence>
                            {step === 2 && (
                                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                                    className="overflow-hidden border-t border-gray-100">
                                    <div className="p-5 space-y-3">
                                        <div className="relative">
                                            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                            <input type="text" value={groupSearch} onChange={e => setGroupSearch(e.target.value)} placeholder="Search groups..."
                                                className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#0036a1]" />
                                        </div>
                                        {loadingGroups ? (
                                            <div className="flex justify-center py-6"><Loader2 className="w-6 h-6 animate-spin text-[#0036a1]" /></div>
                                        ) : (
                                            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                                                {filteredGroups.map(group => (
                                                    <label key={group.id}
                                                        className={`flex items-center justify-between p-3 rounded-xl border-2 cursor-pointer transition-all ${selectedGroups.includes(group.id) ? 'border-[#0036a1] bg-[#0036a1]/5' : 'border-gray-100 hover:border-gray-200'}`}>
                                                        <div className="flex items-center gap-3">
                                                            <input type="checkbox" checked={selectedGroups.includes(group.id)} onChange={() => toggleGroup(group.id)}
                                                                className="w-4 h-4 accent-[#0036a1]" />
                                                            <span className="text-sm font-medium text-gray-800">{group.label}</span>
                                                        </div>
                                                        <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                                                            {group.count.toLocaleString()}
                                                        </span>
                                                    </label>
                                                ))}
                                            </div>
                                        )}
                                        <div className="flex justify-end pt-2">
                                            <Button onClick={() => setStep(3)} disabled={selectedGroups.length === 0} className="bg-[#0036a1] text-white">
                                                Continue →
                                            </Button>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </Card>

                    {/* Step 3 */}
                    <Card className="bg-white border border-gray-100 shadow-sm overflow-hidden">
                        <button className="w-full flex items-center justify-between p-5 hover:bg-gray-50 transition-colors" onClick={() => setStep(3)}>
                            <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step === 3 ? 'bg-[#0036a1] text-white' : 'bg-gray-200 text-gray-500'}`}>3</div>
                                <p className="font-bold text-gray-900">Compose & Send</p>
                            </div>
                            {step === 3 ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                        </button>
                        <AnimatePresence>
                            {step === 3 && (
                                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                                    className="overflow-hidden border-t border-gray-100">
                                    <div className="p-5 space-y-4">
                                        <div className="relative">
                                            <textarea value={message} onChange={e => setMessage(e.target.value)} rows={5} maxLength={320}
                                                placeholder="Type your SMS message here..."
                                                className="w-full border border-gray-200 rounded-xl p-4 text-sm outline-none focus:border-[#0036a1] resize-none" />
                                            <span className="absolute bottom-3 right-3 text-xs font-bold text-gray-400">{message.length}/320</span>
                                        </div>
                                        {message.includes('[') && (
                                            <div className="flex items-center gap-2 text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2.5 text-sm">
                                                <AlertTriangle className="w-4 h-4 shrink-0" />
                                                Replace all <strong>[PLACEHOLDERS]</strong> with actual values before sending.
                                            </div>
                                        )}
                                        <AnimatePresence mode="wait">
                                            {sentSuccess ? (
                                                <motion.div key="sent" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                                                    className="flex items-center justify-center gap-3 py-3 bg-[#6bc048]/10 border border-[#6bc048]/30 rounded-xl text-[#6bc048] font-bold">
                                                    <CheckCheck className="w-5 h-5" /> SMS sent to {totalRecipients.toLocaleString()} recipients!
                                                </motion.div>
                                            ) : (
                                                <motion.div key="btn">
                                                    <Button onClick={handleSend}
                                                        disabled={!message.trim() || selectedGroups.length === 0 || message.includes('[') || isSending}
                                                        className="w-full h-12 text-base font-bold bg-[#0036a1] hover:bg-[#001761] text-white shadow-md">
                                                        {isSending ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                                                        {isSending ? 'Sending...' : `Send to ${totalRecipients.toLocaleString()} Recipients`}
                                                    </Button>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </Card>
                </div>

                {/* Right: Preview + Tips */}
                <div className="space-y-5">
                    <Card className="bg-[#1e2230] text-white p-5 rounded-2xl shadow-lg space-y-4">
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                            <Smartphone className="w-4 h-4" /> SMS Preview
                        </h3>
                        <div className="bg-[#2a3244] rounded-xl p-4 min-h-[120px] relative">
                            {message ? (
                                <p className="text-sm text-gray-200 leading-relaxed whitespace-pre-wrap">{message}</p>
                            ) : (
                                <p className="text-sm text-gray-500 italic">Your message will appear here...</p>
                            )}
                            {message && (
                                <span className="absolute top-2 right-2 text-[10px] font-bold text-gray-500 bg-[#1e2230] px-2 py-0.5 rounded-full">
                                    ~{Math.ceil(message.length / 160)} SMS unit{Math.ceil(message.length / 160) > 1 ? 's' : ''}
                                </span>
                            )}
                        </div>
                        {selectedGroups.length > 0 && (
                            <div className="flex flex-wrap gap-2 pt-1">
                                {selectedGroups.map(id => {
                                    const g = recipientGroups.find(gr => gr.id === id);
                                    return (
                                        <span key={id} className="flex items-center gap-1 bg-white/10 text-xs font-medium px-2 py-1 rounded-full">
                                            {g?.label}
                                            <button onClick={() => toggleGroup(id)} className="text-gray-400 hover:text-white">
                                                <X className="w-3 h-3" />
                                            </button>
                                        </span>
                                    );
                                })}
                            </div>
                        )}
                    </Card>

                    <Card className="bg-white border border-gray-100 p-5 space-y-3 shadow-sm">
                        <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Quick Tips</h3>
                        <ul className="space-y-2 text-sm text-gray-600">
                            <li className="flex gap-2"><span className="text-[#6bc048] font-bold">•</span>Keep messages under 160 characters for 1 SMS credit.</li>
                            <li className="flex gap-2"><span className="text-[#ff9800] font-bold">•</span>Replace all <strong>[PLACEHOLDERS]</strong> before sending.</li>
                            <li className="flex gap-2"><span className="text-[#0036a1] font-bold">•</span>You can select multiple recipient groups.</li>
                            <li className="flex gap-2"><span className="text-purple-500 font-bold">•</span>Emergency alerts are sent at the highest priority.</li>
                            <li className="flex gap-2"><span className="text-teal-500 font-bold">•</span>Recipient counts are pulled from live student & staff database.</li>
                        </ul>
                    </Card>
                </div>
            </div>

            {/* SMS History */}
            <Card className="bg-white border-none shadow-sm overflow-hidden">
                <button onClick={() => setShowHistory(h => !h)}
                    className="w-full flex items-center justify-between p-5 border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <h3 className="text-lg font-bold text-[#1e2230] flex items-center gap-2">
                        <Clock className="w-5 h-5 text-gray-400" /> SMS History
                        {loadingLogs && <Loader2 className="w-4 h-4 animate-spin text-gray-400 ml-1" />}
                    </h3>
                    {showHistory ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                </button>
                <AnimatePresence>
                    {showHistory && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                            {smsLogs.length === 0 ? (
                                <div className="py-10 text-center text-sm text-gray-400">No SMS sent yet. Start your first campaign above!</div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead className="bg-[#f8fafc] text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                            <tr>
                                                <th className="px-6 py-3">Category</th>
                                                <th className="px-6 py-3">Message</th>
                                                <th className="px-6 py-3">Recipients</th>
                                                <th className="px-6 py-3">Sent By</th>
                                                <th className="px-6 py-3">Date</th>
                                                <th className="px-6 py-3">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {smsLogs.map(sms => (
                                                <tr key={sms.id} className="hover:bg-gray-50/50 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <span className="text-sm font-bold text-gray-800">{sms.category}</span>
                                                    </td>
                                                    <td className="px-6 py-4 max-w-xs">
                                                        <p className="text-sm text-gray-600 truncate">{sms.message}</p>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="text-sm font-bold text-gray-700">{sms.recipientCount.toLocaleString()}</span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="text-sm text-gray-600">{sms.sentBy}</span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="text-sm text-gray-500">
                                                            {new Date(sms.createdAt).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${sms.status === 'DELIVERED' ? 'bg-[#6bc048]/10 text-[#6bc048]' : sms.status === 'PARTIAL' ? 'bg-[#ff9800]/10 text-[#ff9800]' : 'bg-red-100 text-red-600'}`}>
                                                            {sms.status === 'DELIVERED' ? <CheckCheck className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                                                            {sms.status.charAt(0) + sms.status.slice(1).toLowerCase()}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </Card>
        </div>
    );
}
