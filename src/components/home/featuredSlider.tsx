import { GraduationCap, FileCheck2, CalendarCheck2, Wallet, MessageSquare, CalendarClock, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const NAVY = '#15316B';
const GOLD = '#F5B800';

const FEATURES = [
    { icon: GraduationCap, title: 'Admissions & Enrollment', description: 'Take applications online and move accepted students straight into class rosters — no re-typing.' },
    { icon: FileCheck2, title: 'Result Management', description: 'Configure your grading scale once, then generate and print report cards for every class in minutes.' },
    { icon: CalendarCheck2, title: 'Attendance Tracking', description: 'Mark student and staff attendance daily, with a live dashboard showing who\'s in and who\'s out.' },
    { icon: Wallet, title: 'Fees & Finance', description: 'Track fee collection by class, record payments, and keep a clear ledger of income and expenses.' },
    { icon: MessageSquare, title: 'Parent Communication', description: 'Send announcements and results updates straight to parents — no separate app for them to install.' },
    { icon: CalendarClock, title: 'Timetable & Scheduling', description: 'Build a conflict-free timetable for every class and teacher, and keep it up to date all term.' },
];

export function FeaturedSlider() {
    return (
        <section id="features-section" className="py-20 sm:py-24 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                <div className="max-w-2xl mb-14">
                    <span className="text-xs font-bold uppercase tracking-[0.14em]" style={{ color: NAVY }}>What's included</span>
                    <h2 className="text-3xl md:text-4xl font-heading font-medium text-[#1C2333] mt-3 tracking-tight">
                        Everything your school office needs, in one place
                    </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {FEATURES.map((feature) => (
                        <div key={feature.title} className="rounded-2xl border border-[#EEEAE0] bg-[#FBF9F5] p-7 transition-all hover:border-[#15316B]/20 hover:shadow-sm">
                            <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-5" style={{ backgroundColor: `${NAVY}12` }}>
                                <feature.icon className="w-5 h-5" style={{ color: NAVY }} />
                            </div>
                            <h3 className="font-heading text-lg font-medium text-[#1C2333] mb-2">{feature.title}</h3>
                            <p className="text-sm text-slate-500 leading-relaxed">{feature.description}</p>
                        </div>
                    ))}
                </div>

                <div className="mt-12 text-center">
                    <Link
                        to="/get-started"
                        className="inline-flex items-center gap-2 font-bold border-b-2 pb-1 transition-colors"
                        style={{ color: NAVY, borderColor: GOLD }}
                    >
                        See the full feature list <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>
            </div>
        </section>
    );
}
