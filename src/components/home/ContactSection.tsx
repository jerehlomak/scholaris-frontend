import { Phone, Mail, HelpCircle } from 'lucide-react';

export function ContactSection() {
    return (
        <section id="contact-section" className="py-20 bg-white">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

                <h2 className="text-3xl md:text-5xl font-heading text-brand-dark mb-20 text-center mx-auto leading-tight">
                    Help or advice – please get <br className="hidden md:block" />
                    in touch with us
                </h2>

                <div className="bg-[#1a2fa0] rounded-[32px] p-10 md:p-14 md:py-16 relative flex flex-col md:flex-row shadow-lg mt-20">

                    {/* Image Circle Wrapper - Overlapping Left */}
                    <div className="absolute top-8 left-24 sm:left-12 md:-top-20 md:left-4 lg:-left-16  -translate-y-1/2 md:top-1/2 md:-translate-y-1/2 md:-left-12 z-10 flex flex-col items-center">
                        <div className="w-[180px] h-[180px] md:w-[220px] md:h-[220px] rounded-full overflow-hidden shadow-xl border-4 border-brand-dark/10 relative bg-[#6bc048]">
                            <img
                                src="https://images.unsplash.com/photo-1542596594-649edbc13630?auto=format&fit=crop&q=80&w=400"
                                alt="Support Team Jana & Saskia"
                                className="w-full h-full object-cover"
                            />
                        </div>
                        {/* Name Badges overlapping the image */}
                        <div className="absolute bottom-2 left-[-10px] bg-[#6bc048] text-white text-[11px] font-bold px-4 py-1 rounded-full shadow-md whitespace-nowrap tracking-wide">
                            Jana & Leto
                        </div>
                        <div className="absolute bottom-6 right-[-10px] bg-[#6bc048] text-white text-[11px] font-bold px-4 py-1 rounded-full shadow-md tracking-wide">
                            Saskia
                        </div>
                    </div>

                    {/* Spacer for mobile */}
                    <div className="h-28 md:hidden"></div>

                    {/* Content Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:pl-[140px] lg:pl-[200px] w-full text-white text-center">

                        {/* Phone Column */}
                        <div className="flex flex-col items-center">
                            <Phone className="w-8 h-8 md:w-9 md:h-9 mb-6 text-white" strokeWidth={1.5} />
                            <p className="text-[13px] md:text-sm mb-5 font-medium opacity-90 tracking-wide">
                                Phone: <a href="tel:+18001234567" className="font-bold hover:text-[#6bc048] transition-colors">
                                    +1 (800) 123-4567
                                </a>
                            </p>
                            <p className="text-[13px] md:text-sm font-bold mb-1.5 tracking-wide">Real people instead of waiting on hold!</p>
                            <p className="text-[13px] md:text-sm text-white/80 leading-relaxed font-secondary">
                                Jana & Saskia are here for you.<br />
                                Mon–Fri: 09:30–12 & 14–17
                            </p>
                        </div>

                        {/* Email Column */}
                        <div className="flex flex-col items-center">
                            <Mail className="w-8 h-8 md:w-9 md:h-9 mb-6 text-white" strokeWidth={1.5} />
                            <p className="text-[13px] md:text-sm mb-5 font-medium opacity-90 tracking-wide">
                                E-Mail: <a href="mailto:support@skoolyplus.com" className="font-bold hover:text-[#6bc048] transition-colors break-all">
                                    support@skoolyplus.com
                                </a>
                            </p>
                            <p className="text-[13px] md:text-sm font-bold mb-1.5 tracking-wide">Write to us</p>
                            <p className="text-[13px] md:text-sm text-white/80 leading-relaxed font-secondary">
                                – we answer every message<br />personally within 24 hours.
                            </p>
                        </div>

                        {/* Service Center Column */}
                        <div className="flex flex-col items-center">
                            <HelpCircle className="w-8 h-8 md:w-9 md:h-9 mb-6 text-white" strokeWidth={1.5} />
                            <a href="#" className="text-[13px] md:text-sm font-bold mb-5 hover:text-[#6bc048] transition-colors inline-block tracking-wide">
                                To the Service Center
                            </a>
                            <p className="text-[13px] md:text-sm text-white/80 leading-relaxed font-secondary">
                                Questions about implementation? Need a demo?<br />Still have an open question? Find the<br />fastest solution in our Service Center.
                            </p>
                        </div>

                    </div>
                </div>

            </div>
        </section>
    );
}
