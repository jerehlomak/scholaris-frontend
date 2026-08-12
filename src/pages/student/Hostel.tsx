/**
 * Hostel.tsx — Student hostel / accommodation page
 */
import { Home as HomeIcon, ChevronRight, BedDouble, MapPin, Wifi, Users, Star, Phone, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card } from '../../components/ui/card';

const ROOMMATES = [
    { name: 'Chinoso Obi', avatar: 'CO', color: 'bg-orange-500', bed: 'Bed B' },
    { name: 'Kelechi Eze', avatar: 'KE', color: 'bg-green-500', bed: 'Bed C' },
    { name: 'David Okonkwo', avatar: 'DO', color: 'bg-blue-500', bed: 'Bed D' },
];

const AMENITIES = [
    { icon: '💡', label: 'Electricity (24h)' },
    { icon: '💧', label: 'Running Water' },
    { icon: '🌐', label: 'Wi-Fi Access' },
    { icon: '🔒', label: 'Security Guard' },
    { icon: '🧹', label: 'Daily Cleaning' },
    { icon: '📺', label: 'Common Room TV' },
    { icon: '🏋️', label: 'Gym Access' },
    { icon: '🍽️', label: 'Dining Hall' },
];

const RULES = [
    'Lights out by 10:30 PM on weekdays, 11:00 PM on weekends.',
    'No visitors allowed in dormitories.',
    'Keep your section clean at all times.',
    'No cooking in the dormitory.',
    'All exeats must be approved by the housemaster.',
    'No electronic devices during quiet hours (9–10:30 PM).',
];

export default function Hostel() {
    return (
        <div className="w-full max-w-6xl mx-auto space-y-6">
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Hostel</h1>
                    <div className="flex items-center text-xs text-slate-400 gap-1 mt-1">
                        <HomeIcon size={12} />
                        <Link to="/student" className="hover:text-blue-600 transition-colors">Home</Link>
                        <ChevronRight size={12} className="opacity-50" />
                        <span>Hostel</span>
                    </div>
                </div>
            </div>

            {/* Summary banner */}
            <Card className="p-5 mb-6 bg-gradient-to-r from-blue-700 to-indigo-700 text-white shadow-lg">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
                            <BedDouble className="w-7 h-7" />
                        </div>
                        <div>
                            <p className="font-bold text-xl mb-0.5">Obadiah House</p>
                            <p className="text-blue-200 text-sm flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" />Block A, Room 14 — Bed A</p>
                            <p className="text-blue-200 text-sm mt-0.5">Housemaster: Mr. Femi Oladele</p>
                        </div>
                    </div>
                    <div className="flex gap-5">
                        <div className="text-center"><p className="text-2xl font-black">A14</p><p className="text-blue-200 text-xs">Room No.</p></div>
                        <div className="text-center"><p className="text-2xl font-black">4</p><p className="text-blue-200 text-xs">Bedspace</p></div>
                        <div className="flex items-center gap-1 bg-[#6bc048]/20 px-3 py-1.5 rounded-full">
                            <Star className="w-4 h-4 text-[#6bc048] fill-[#6bc048]" />
                            <span className="text-sm font-bold text-[#6bc048]">Active</span>
                        </div>
                    </div>
                </div>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left col */}
                <div className="lg:col-span-2 space-y-5">

                    {/* Roommates */}
                    <Card className="bg-white border border-slate-100 shadow-sm overflow-hidden">
                        <div className="p-4 border-b border-slate-100 flex items-center gap-2">
                            <Users className="w-4 h-4 text-blue-600" />
                            <h3 className="font-bold text-slate-900">Roommates</h3>
                        </div>
                        <div className="divide-y divide-slate-50">
                            {/* Self */}
                            <div className="flex items-center gap-4 p-4">
                                <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0">AB</div>
                                <div className="flex-1">
                                    <p className="font-bold text-slate-900">Ayomide Balogun <span className="text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-full ml-1">You</span></p>
                                    <p className="text-xs text-slate-500">Bed A · SS 1A</p>
                                </div>
                            </div>
                            {ROOMMATES.map(r => (
                                <div key={r.name} className="flex items-center gap-4 p-4 hover:bg-slate-50/40 transition-colors">
                                    <div className={`w-10 h-10 ${r.color} rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0`}>{r.avatar}</div>
                                    <div className="flex-1">
                                        <p className="font-semibold text-slate-900">{r.name}</p>
                                        <p className="text-xs text-slate-500">{r.bed} · SS 1A</p>
                                    </div>
                                    <a href="tel:+" className="flex items-center gap-1.5 text-xs text-blue-600 font-semibold hover:underline">
                                        <Phone className="w-3.5 h-3.5" /> Contact
                                    </a>
                                </div>
                            ))}
                        </div>
                    </Card>

                    {/* Hostel rules */}
                    <Card className="bg-white border border-slate-100 shadow-sm overflow-hidden">
                        <div className="p-4 border-b border-slate-100 flex items-center gap-2">
                            <Shield className="w-4 h-4 text-blue-600" />
                            <h3 className="font-bold text-slate-900">Hostel Rules & Regulations</h3>
                        </div>
                        <ul className="divide-y divide-slate-50">
                            {RULES.map((rule, i) => (
                                <li key={i} className="flex items-start gap-3 p-4 text-sm text-slate-600 hover:bg-slate-50/40 transition-colors">
                                    <span className="w-5 h-5 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">{i + 1}</span>
                                    {rule}
                                </li>
                            ))}
                        </ul>
                    </Card>
                </div>

                {/* Right col */}
                <div className="space-y-5">
                    {/* Amenities */}
                    <Card className="bg-white border border-slate-100 shadow-sm overflow-hidden">
                        <div className="p-4 border-b border-slate-100 flex items-center gap-2">
                            <Wifi className="w-4 h-4 text-blue-600" />
                            <h3 className="font-bold text-slate-900">Amenities</h3>
                        </div>
                        <div className="p-4 grid grid-cols-2 gap-3">
                            {AMENITIES.map((a, i) => (
                                <div key={i} className="flex items-center gap-2.5 p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                                    <span className="text-xl">{a.icon}</span>
                                    <span className="text-xs font-medium text-slate-700">{a.label}</span>
                                </div>
                            ))}
                        </div>
                    </Card>

                    {/* Housemaster contact */}
                    <Card className="p-5 bg-blue-700 text-white shadow-lg">
                        <h4 className="font-bold mb-3 text-sm">Housemaster Contact</h4>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-lg font-bold">FO</div>
                            <div>
                                <p className="font-bold">Mr. Femi Oladele</p>
                                <p className="text-blue-200 text-xs">Obadiah House · Block A</p>
                            </div>
                        </div>
                        <a href="tel:+2348012345678" className="flex items-center justify-center gap-2 w-full bg-white/10 hover:bg-white/20 text-white py-2.5 rounded-xl text-sm font-semibold transition-colors">
                            <Phone className="w-4 h-4" /> +234 801 234 5678
                        </a>
                    </Card>
                </div>
            </div>
        </div>
    );
}
