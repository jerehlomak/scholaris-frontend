import { Mail, ArrowRight, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';

const NAVY = '#15316B';
const NAVY_DEEP = '#0B1F4E';
const GOLD = '#F5B800';

// TODO: replace with the school's real support email once confirmed.
const SUPPORT_EMAIL = 'hello@skcooly.com';

export function ContactSection() {
    return (
        <section id="contact-section" className="py-20 sm:py-24 bg-white">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="rounded-[32px] p-10 md:p-16 relative text-white" style={{ background: `linear-gradient(135deg, ${NAVY} 0%, ${NAVY_DEEP} 100%)` }}>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
                        <div>
                            <span className="inline-block text-xs font-bold uppercase tracking-[0.14em] mb-4" style={{ color: GOLD }}>Get in touch</span>
                            <h2 className="text-3xl md:text-4xl font-heading font-medium mb-4 leading-tight tracking-tight text-white">
                                Questions before you switch over?
                            </h2>
                            <p className="text-white/75 leading-relaxed max-w-md">
                                Whether you want a walkthrough of the platform or just want to know if Skcooly fits
                                your school, we're happy to talk it through.
                            </p>
                        </div>

                        <div className="flex flex-col gap-4">
                            <a
                                href={`mailto:${SUPPORT_EMAIL}`}
                                className="flex items-center gap-4 bg-white/10 hover:bg-white/15 rounded-2xl p-5 transition-colors"
                            >
                                <div className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
                                    <Mail className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-xs uppercase tracking-wide text-white/60 font-semibold">Email us</p>
                                    <p className="font-bold">{SUPPORT_EMAIL}</p>
                                </div>
                            </a>

                            <Link
                                to="/apply"
                                className="flex items-center justify-between gap-4 rounded-2xl p-5 font-bold transition-transform hover:scale-[1.01]"
                                style={{ backgroundColor: GOLD, color: NAVY_DEEP }}
                            >
                                <span className="flex items-center gap-3">
                                    <FileText className="w-5 h-5" /> Apply for your school
                                </span>
                                <ArrowRight className="w-4 h-4" />
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
