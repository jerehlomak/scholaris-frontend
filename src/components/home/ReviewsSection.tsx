import { ShieldCheck, Smartphone, Headset, LayoutGrid } from 'lucide-react';

const NAVY = '#15316B';

const PILLARS = [
    {
        icon: LayoutGrid,
        title: 'One platform, not five',
        text: 'Admissions, results, attendance, and fees used to live in separate spreadsheets and apps. Skcooly brings them under one roof, so nothing falls through the cracks.',
    },
    {
        icon: Smartphone,
        title: 'Built for how your staff actually work',
        text: 'A teacher marking attendance from a phone in the classroom. An admin printing report cards for 30 classes at once. Every screen is designed around the task, not the org chart.',
    },
    {
        icon: ShieldCheck,
        title: 'Your data, kept secure',
        text: "Student and staff records are encrypted and backed up automatically — no more single spreadsheet that's one lost laptop away from disaster.",
    },
    {
        icon: Headset,
        title: 'Support that understands Nigerian schools',
        text: "From term structures to WAEC-style grading, Skcooly is set up around how Nigerian schools actually run — and our support team speaks that language.",
    },
];

export function ReviewsSection() {
    return (
        <section id="why-skcooly" className="py-20 sm:py-24 bg-[#FBF9F5]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                <div className="max-w-2xl mb-14">
                    <span className="text-xs font-bold uppercase tracking-[0.14em]" style={{ color: NAVY }}>Why Skcooly</span>
                    <h2 className="text-3xl md:text-4xl font-heading font-medium text-[#1C2333] mt-3 tracking-tight">
                        Built to replace the spreadsheet chaos
                    </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-12">
                    {PILLARS.map((pillar) => (
                        <div key={pillar.title} className="flex gap-5">
                            <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${NAVY}12` }}>
                                <pillar.icon className="w-5 h-5" style={{ color: NAVY }} />
                            </div>
                            <div>
                                <h3 className="font-heading text-lg font-medium text-[#1C2333] mb-2">{pillar.title}</h3>
                                <p className="text-sm text-slate-500 leading-relaxed">{pillar.text}</p>
                            </div>
                        </div>
                    ))}
                </div>

            </div>
        </section>
    );
}
