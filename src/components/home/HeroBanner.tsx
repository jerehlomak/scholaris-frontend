import { ArrowRight, Play } from 'lucide-react';
import { Link } from 'react-router-dom';

const NAVY = '#0B1F4E';
const NAVY_DEEP = '#081634';
const GOLD = '#F5B800';

/** Abstract network-of-nodes graphic — replaces the old stock-photo slideshow.
 *  Evokes a connected school community (admins, teachers, parents, students)
 *  without pretending to show real people. */
function NetworkGraphic() {
    const nodes = [
        { x: 70, y: 80, r: 5 }, { x: 200, y: 40, r: 7 }, { x: 320, y: 110, r: 4 },
        { x: 150, y: 190, r: 6 }, { x: 300, y: 230, r: 5 }, { x: 60, y: 260, r: 4 },
        { x: 380, y: 60, r: 4 }, { x: 250, y: 300, r: 5 }, { x: 400, y: 200, r: 6 },
    ];
    const edges = [[0, 1], [1, 2], [1, 3], [3, 4], [3, 5], [4, 7], [2, 6], [4, 8], [2, 8]];
    return (
        <svg viewBox="0 0 440 340" className="w-full h-full" fill="none" aria-hidden="true">
            {edges.map(([a, b], i) => (
                <line key={i} x1={nodes[a].x} y1={nodes[a].y} x2={nodes[b].x} y2={nodes[b].y}
                    stroke={GOLD} strokeOpacity={0.35} strokeWidth={1.5} />
            ))}
            {nodes.map((n, i) => (
                <circle key={i} cx={n.x} cy={n.y} r={n.r} fill={i % 3 === 0 ? GOLD : '#FFFFFF'} fillOpacity={i % 3 === 0 ? 0.9 : 0.5} />
            ))}
        </svg>
    );
}

export function HeroBanner() {
    const scrollToFeatures = () => {
        const el = document.getElementById('features-section');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <section className="relative w-full overflow-hidden" style={{ background: `linear-gradient(135deg, ${NAVY} 0%, ${NAVY_DEEP} 100%)` }}>
            {/* Decorative network graphic — top right, partially bleeding off */}
            <div className="pointer-events-none absolute -top-10 -right-16 w-[420px] h-[340px] opacity-90 hidden md:block">
                <NetworkGraphic />
            </div>
            {/* Soft dot-grid texture across the whole section */}
            <div
                className="pointer-events-none absolute inset-0 opacity-[0.15]"
                style={{ backgroundImage: 'radial-gradient(circle, #FFFFFF 1px, transparent 1px)', backgroundSize: '26px 26px' }}
            />

            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 lg:py-36">
                <div className="max-w-3xl">
                    <span className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-[0.14em] mb-6"
                        style={{ backgroundColor: `${GOLD}1A`, color: GOLD, border: `1px solid ${GOLD}40` }}>
                        Built for Nigerian schools
                    </span>
                    <h1 className="text-white text-4xl sm:text-5xl md:text-6xl lg:text-[68px] font-heading font-medium leading-[1.05] mb-6 tracking-tight">
                        One platform to run your <span style={{ color: GOLD }}>entire school.</span>
                    </h1>
                    <p className="text-white/80 text-lg sm:text-xl mb-10 max-w-2xl leading-relaxed">
                        Skcooly brings admissions, results, attendance, fees, and communication into a single
                        cloud platform — built for the way Nigerian schools actually run.
                    </p>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                        <Link
                            to="/get-started"
                            className="inline-flex items-center gap-2 px-8 py-4 rounded-full text-base font-bold transition-transform hover:scale-[1.02] shadow-lg"
                            style={{ backgroundColor: GOLD, color: NAVY_DEEP }}
                        >
                            Get Started <ArrowRight className="w-4 h-4" />
                        </Link>
                        <button
                            onClick={scrollToFeatures}
                            className="inline-flex items-center gap-2 px-6 py-4 rounded-full text-base font-semibold text-white border border-white/25 hover:bg-white/10 transition-colors"
                        >
                            <Play className="w-4 h-4 fill-current" /> See how it works
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
}
