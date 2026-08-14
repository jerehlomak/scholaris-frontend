import { LayoutDashboard, BookOpenCheck, Users2, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const NAVY = '#15316B';
const NAVY_DEEP = '#0B1F4E';
const GOLD = '#F5B800';

const AUDIENCES = [
    {
        id: 1,
        icon: LayoutDashboard,
        title: 'For Administrators',
        subtitle: 'Total control, one dashboard. Manage students, staff, fees, and results without switching tools.',
        colSpan: 'col-span-12 md:col-span-8',
        gradient: `linear-gradient(135deg, ${NAVY} 0%, ${NAVY_DEEP} 100%)`,
    },
    {
        id: 2,
        icon: BookOpenCheck,
        title: 'For Teachers',
        subtitle: 'Record scores and take attendance from your phone — spend less time on paperwork.',
        colSpan: 'col-span-12 md:col-span-4',
        gradient: `linear-gradient(135deg, #7C3559 0%, #5A2440 100%)`,
    },
    {
        id: 3,
        icon: Users2,
        title: 'For Students & Parents',
        subtitle: "Check results, attendance, and fee balances the moment they're updated.",
        colSpan: 'col-span-12 md:col-span-4',
        gradient: `linear-gradient(135deg, #0F766E 0%, #0B5A54 100%)`,
    },
];

export function CategoriesGrid() {
    return (
        <section className="py-20 sm:py-24 bg-[#FBF9F5]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <h2 className="text-3xl md:text-4xl font-heading font-medium text-[#1C2333] mb-10 tracking-tight">Designed for everyone at your school</h2>

                <div className="grid grid-cols-12 gap-4 md:gap-6 auto-rows-[280px]">
                    {AUDIENCES.map((audience) => (
                        <Link
                            to="/get-started"
                            key={audience.id}
                            className={`${audience.colSpan} group relative overflow-hidden rounded-2xl p-8 flex flex-col justify-between text-white`}
                            style={{ background: audience.gradient }}
                        >
                            {/* Soft dot texture */}
                            <div
                                className="pointer-events-none absolute inset-0 opacity-[0.12]"
                                style={{ backgroundImage: 'radial-gradient(circle, #FFFFFF 1px, transparent 1px)', backgroundSize: '22px 22px' }}
                            />
                            <div className="relative z-10 w-12 h-12 rounded-xl flex items-center justify-center bg-white/15">
                                <audience.icon className="w-6 h-6" />
                            </div>
                            <div className="relative z-10">
                                <h3 className="font-heading text-2xl font-medium mb-2 text-white">{audience.title}</h3>
                                <p className="text-white/80 text-sm leading-relaxed max-w-sm mb-4">{audience.subtitle}</p>
                                <span className="inline-flex items-center gap-1.5 font-bold uppercase text-xs tracking-wide transition-transform group-hover:translate-x-1" style={{ color: GOLD }}>
                                    Get Started <ArrowUpRight className="w-3.5 h-3.5" />
                                </span>
                            </div>
                        </Link>
                    ))}
                </div>

            </div>
        </section>
    );
}
