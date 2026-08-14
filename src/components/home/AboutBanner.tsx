import { GraduationCap, BookOpen, Users } from 'lucide-react';

const NAVY = '#15316B';
const NAVY_DEEP = '#0B1F4E';
const GOLD = '#F5B800';

/** Abstract stacked-cards composition — stands in for the old stock-photo
 *  collage. Suggests "layers of school life" without staged photography. */
function LayersGraphic() {
    return (
        <div className="relative w-full max-w-sm mx-auto aspect-square">
            <div className="absolute inset-x-6 top-10 bottom-0 rounded-3xl bg-white/10 rotate-[-4deg]" />
            <div className="absolute inset-x-3 top-5 bottom-3 rounded-3xl bg-white/15 rotate-[3deg]" />
            <div className="absolute inset-0 rounded-3xl flex flex-col items-center justify-center gap-6 shadow-2xl" style={{ backgroundColor: 'white' }}>
                <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ backgroundColor: `${NAVY}12` }}>
                        <GraduationCap className="w-7 h-7" style={{ color: NAVY }} />
                    </div>
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ backgroundColor: `${GOLD}22` }}>
                        <BookOpen className="w-7 h-7" style={{ color: '#8a6a00' }} />
                    </div>
                </div>
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ backgroundColor: '#0F766E12' }}>
                    <Users className="w-7 h-7 text-[#0F766E]" />
                </div>
                <p className="font-heading text-sm text-slate-400 px-8 text-center leading-snug">
                    Admins, teachers, parents & students — one platform
                </p>
            </div>
        </div>
    );
}

export function AboutBanner() {
    return (
        <section id="our-mission" className="text-white py-20 lg:py-28" style={{ background: `linear-gradient(135deg, ${NAVY} 0%, ${NAVY_DEEP} 100%)` }}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

                    {/* Text Content */}
                    <div className="order-2 lg:order-1 text-center lg:text-left">
                        <span className="inline-block text-xs font-bold uppercase tracking-[0.14em] mb-4" style={{ color: GOLD }}>Our mission</span>
                        <h2 className="text-4xl md:text-5xl font-heading font-medium mb-6 leading-tight tracking-tight text-white">
                            Nigerian schools deserve<br />software built for them.
                        </h2>
                        <p className="text-lg opacity-80 mb-8 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                            Too many schools are still run on scattered spreadsheets, paper registers, and WhatsApp groups.
                            Skcooly exists to bring it all into one reliable system — so administrators spend less time
                            chasing paperwork, and more time running their school.
                        </p>
                    </div>

                    {/* Graphic */}
                    <div className="order-1 lg:order-2">
                        <LayersGraphic />
                    </div>

                </div>
            </div>
        </section>
    );
}
