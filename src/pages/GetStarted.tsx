import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { CheckCircle2, Building2, User, Phone, Mail, MapPin, Layers, MessageSquare, ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { Link } from 'react-router-dom';

const NAVY = '#15316B';
const NAVY_DEEP = '#0B1F4E';
const NAVY_HOVER = '#173F8C';
const GOLD = '#F5B800';

/** Small network-graphic motif — same device used on the homepage hero,
 *  scaled down, for visual continuity between the two pages. */
function NetworkGraphic() {
    const nodes = [
        { x: 20, y: 30, r: 3 }, { x: 90, y: 10, r: 4 }, { x: 150, y: 45, r: 3 },
        { x: 60, y: 80, r: 3.5 }, { x: 130, y: 95, r: 3 },
    ];
    const edges: [number, number][] = [[0, 1], [1, 2], [1, 3], [3, 4]];
    return (
        <svg viewBox="0 0 170 110" className="w-full h-full" fill="none" aria-hidden="true">
            {edges.map(([a, b], i) => (
                <line key={i} x1={nodes[a].x} y1={nodes[a].y} x2={nodes[b].x} y2={nodes[b].y} stroke={GOLD} strokeOpacity={0.4} strokeWidth={1.2} />
            ))}
            {nodes.map((n, i) => (
                <circle key={i} cx={n.x} cy={n.y} r={n.r} fill={i % 2 === 0 ? GOLD : '#FFFFFF'} fillOpacity={i % 2 === 0 ? 0.9 : 0.55} />
            ))}
        </svg>
    );
}

const inputBase = "w-full bg-white border border-slate-200 rounded-xl pl-11 pr-4 py-3.5 text-sm font-medium text-slate-800 outline-none focus:border-[#15316B] focus:ring-2 focus:ring-[#15316B]/10 transition-all placeholder:text-slate-300 hover:border-slate-300";
const labelClass = "text-[11px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1.5 mb-2";

function Field({ icon: Icon, label, required, children }: { icon: React.ElementType; label: string; required?: boolean; children: React.ReactNode }) {
    return (
        <div>
            <label className={labelClass}>
                {label} {required && <span style={{ color: GOLD }}>*</span>}
            </label>
            <div className="relative">
                <Icon className="h-4 w-4 text-slate-300 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                {children}
            </div>
        </div>
    );
}

export default function GetStarted() {
    const location = useLocation();
    const [plans, setPlans] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [formData, setFormData] = useState({
        schoolName: '',
        contactPerson: '',
        phoneNumber: '',
        emailAddress: '',
        stateLga: '',
        preferredPlanId: '',
        notes: ''
    });

    useEffect(() => {
        const queryParams = new URLSearchParams(location.search);
        const planId = queryParams.get('plan');
        if (planId) {
            setFormData(prev => ({ ...prev, preferredPlanId: planId }));
        }

        const fetchPlans = async () => {
            try {
                const response = await axios.get('/api/v1/central/plans');
                if (response.data && response.data.plans) {
                    setPlans(response.data.plans.filter((p: any) => p.isActive));
                }
            } catch (error) {
                console.error('Failed to load plans', error);
            }
        };
        fetchPlans();
    }, [location.search]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await axios.post('/api/v1/central/leads', formData);
            setSubmitted(true);
            toast.success('Inquiry submitted successfully!');
        } catch (error) {
            toast.error('Failed to submit inquiry. Please try again later.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (submitted) {
        return (
            <div className="min-h-screen bg-[#FBF9F5] flex flex-col items-center justify-center p-6 text-center">
                <div className="relative mb-8">
                    <div className="h-20 w-20 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                        <CheckCircle2 className="h-9 w-9 text-emerald-500" strokeWidth={1.5} />
                    </div>
                    <div className="absolute -inset-2 rounded-full border border-emerald-100 animate-ping opacity-30" />
                </div>
                <p className="text-xs font-semibold tracking-[0.2em] uppercase text-emerald-500 mb-3">You're all set</p>
                <h1 className="font-heading text-3xl font-medium text-[#1C2333] mb-4 tracking-tight">Inquiry received!</h1>
                <p className="text-slate-500 max-w-sm mx-auto mb-10 leading-relaxed text-sm">
                    Thank you for your interest in Skcooly. Our team will review your school's details and reach out within 24 hours.
                </p>
                <Link to="/">
                    <Button className="bg-[#15316B] hover:bg-[#0E2450] text-white px-8 py-5 rounded-xl font-semibold text-sm tracking-wide shadow-sm transition-all">
                        ← Back to Home
                    </Button>
                </Link>
            </div>
        );
    }

    const features = [
        { icon: Building2, title: 'Custom branded portal', desc: 'Each school gets a unique, white-labelled instance tailored to your identity.' },
        { icon: Layers, title: 'All-in-one management', desc: 'Students, staff, finances, and communication — managed from one place.' },
        { icon: CheckCircle2, title: 'Dedicated support', desc: 'A real team, always available to help your school grow and succeed.' },
    ];

    const steps = ['Fill in your school details', 'Our team reviews your inquiry', 'Get onboarded within 48hrs'];

    return (
        <div className="min-h-screen bg-white lg:flex">
            {/* Sidebar */}
            <div className="hidden lg:flex lg:w-[38%] xl:w-1/3 p-10 xl:p-14 flex-col justify-between text-white relative overflow-hidden"
                style={{ background: `linear-gradient(160deg, ${NAVY_DEEP} 0%, #081634 100%)` }}>
                {/* Subtle dot-grid pattern */}
                <div
                    className="absolute inset-0 opacity-[0.06]"
                    style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '26px 26px' }}
                />
                {/* Network graphic, top right */}
                <div className="pointer-events-none absolute top-8 right-6 w-40 h-28 opacity-80">
                    <NetworkGraphic />
                </div>

                <div className="relative z-10 flex flex-col h-full">
                    {/* Back link */}
                    <Link to="/" className="inline-flex items-center gap-2 text-white/60 hover:text-white/90 transition-colors text-xs font-semibold tracking-widest uppercase mb-14 w-fit">
                        <ArrowLeft className="h-3.5 w-3.5" />
                        Back to Home
                    </Link>

                    {/* Brand mark */}
                    <div className="mb-2">
                        <span className="text-xs font-bold tracking-[0.25em] uppercase" style={{ color: GOLD }}>Skcooly</span>
                    </div>

                    <h2 className="font-heading text-3xl xl:text-4xl font-medium tracking-tight leading-tight mb-5 text-white">
                        Transform your school's operations today.
                    </h2>
                    <p className="text-white/65 text-sm leading-relaxed mb-12 max-w-sm">
                        Complete this brief form and we'll set up your school's dedicated portal — no technical expertise required.
                    </p>

                    {/* Feature list */}
                    <div className="space-y-6 flex-1">
                        {features.map((item, i) => (
                            <div key={i} className="flex gap-4 items-start">
                                <div className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5" style={{ backgroundColor: `${GOLD}1A`, border: `1px solid ${GOLD}30` }}>
                                    <item.icon className="h-4 w-4" style={{ color: GOLD }} strokeWidth={1.75} />
                                </div>
                                <div>
                                    <p className="font-semibold text-sm text-white mb-0.5">{item.title}</p>
                                    <p className="text-white/55 text-xs leading-relaxed">{item.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Step indicator — real vertical tracker with connecting line */}
                    <div className="mt-10 pt-8 border-t border-white/10">
                        <p className="text-xs text-white/45 font-semibold tracking-widest uppercase mb-4">How it works</p>
                        <div className="relative">
                            <div className="absolute left-[9px] top-2 bottom-2 w-px bg-white/15" />
                            <div className="space-y-4">
                                {steps.map((step, i) => (
                                    <div key={i} className="flex items-center gap-3.5 relative">
                                        <span
                                            className="w-[19px] h-[19px] rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 relative z-10"
                                            style={{ backgroundColor: i === 0 ? GOLD : 'rgba(255,255,255,0.08)', color: i === 0 ? NAVY_DEEP : 'rgba(255,255,255,0.5)', border: i === 0 ? 'none' : '1px solid rgba(255,255,255,0.15)' }}
                                        >
                                            {i + 1}
                                        </span>
                                        <span className="text-xs text-white/70 font-medium">{step}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <p className="relative z-10 text-white/35 text-[11px] font-semibold mt-8">
                        © 2026 Skcooly. All rights reserved.
                    </p>
                </div>
            </div>

            {/* Form panel */}
            <div className="flex-1 flex flex-col justify-center py-12 px-6 lg:px-16 xl:px-24 bg-[#FBF9F5]">
                <div className="max-w-xl w-full mx-auto">

                    {/* Mobile header */}
                    <div className="mb-8 lg:hidden">
                        <Link to="/" className="inline-flex items-center gap-1.5 text-slate-400 hover:text-slate-600 transition-colors text-xs font-semibold tracking-widest uppercase mb-6">
                            <ArrowLeft className="h-3 w-3" /> Home
                        </Link>
                        <h2 className="font-heading text-2xl font-medium text-[#1C2333] tracking-tight">Get started</h2>
                        <p className="text-slate-400 text-sm mt-1">Set up your school's Skcooly portal.</p>
                    </div>

                    {/* Desktop header */}
                    <div className="hidden lg:block mb-8">
                        <p className="text-xs font-bold tracking-[0.2em] uppercase mb-2" style={{ color: NAVY }}>School enrollment</p>
                        <h2 className="font-heading text-[28px] font-medium text-[#1C2333] tracking-tight">Tell us about your school</h2>
                        <p className="text-slate-400 text-sm mt-1.5">All fields marked <span style={{ color: GOLD }}>*</span> are required.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="rounded-2xl border border-[#EEEAE0] bg-white p-6 sm:p-8 shadow-sm">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-5">

                            <Field icon={Building2} label="School Name" required>
                                <input name="schoolName" type="text" required value={formData.schoolName} onChange={handleChange}
                                    placeholder="e.g. Greenwood Academy" className={inputBase} />
                            </Field>

                            <Field icon={User} label="Contact Person" required>
                                <input name="contactPerson" type="text" required value={formData.contactPerson} onChange={handleChange}
                                    placeholder="Full name" className={inputBase} />
                            </Field>

                            <Field icon={Phone} label="Phone Number" required>
                                <input name="phoneNumber" type="tel" required value={formData.phoneNumber} onChange={handleChange}
                                    placeholder="+234 800 000 0000" className={inputBase} />
                            </Field>

                            <Field icon={Mail} label="Email Address" required>
                                <input name="emailAddress" type="email" required value={formData.emailAddress} onChange={handleChange}
                                    placeholder="school@example.com" className={inputBase} />
                            </Field>

                            <Field icon={MapPin} label="State & LGA">
                                <input name="stateLga" type="text" value={formData.stateLga} onChange={handleChange}
                                    placeholder="e.g. Lagos, Ikeja" className={inputBase} />
                            </Field>

                            <Field icon={Layers} label="Preferred Plan">
                                <select name="preferredPlanId" value={formData.preferredPlanId} onChange={handleChange}
                                    className={`${inputBase} appearance-none pr-9 cursor-pointer`}>
                                    <option value="">Select a plan...</option>
                                    {plans.map((plan: any) => (
                                        <option key={plan.id} value={plan.id}>{plan.name}</option>
                                    ))}
                                </select>
                                <div className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2">
                                    <svg className="h-4 w-4 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                    </svg>
                                </div>
                            </Field>
                        </div>

                        {/* Notes */}
                        <div className="mt-5">
                            <label className={labelClass}>
                                <MessageSquare className="h-3 w-3" /> Message / Additional Notes
                            </label>
                            <textarea name="notes" rows={4} value={formData.notes} onChange={handleChange}
                                placeholder="Tell us more about your school's specific needs or any questions you have..."
                                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3.5 text-sm font-medium text-slate-800 outline-none focus:border-[#15316B] focus:ring-2 focus:ring-[#15316B]/10 transition-all placeholder:text-slate-300 hover:border-slate-300 resize-none" />
                        </div>

                        {/* Submit */}
                        <div className="border-t border-slate-100 pt-6 mt-6">
                            <Button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full py-7 text-white rounded-xl font-semibold text-sm tracking-wide shadow-sm transition-all active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
                                style={{ backgroundColor: NAVY }}
                                onMouseEnter={e => !isSubmitting && (e.currentTarget.style.backgroundColor = NAVY_HOVER)}
                                onMouseLeave={e => (e.currentTarget.style.backgroundColor = NAVY)}
                            >
                                {isSubmitting ? (
                                    <span className="flex items-center gap-2 justify-center">
                                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                        </svg>
                                        Processing inquiry...
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-2 justify-center">
                                        Submit school request <ArrowRight className="h-4 w-4" />
                                    </span>
                                )}
                            </Button>

                            <p className="text-center text-[11px] text-slate-400 font-medium mt-4">
                                By submitting, you agree to our{' '}
                                <span className="text-slate-500 underline underline-offset-2 cursor-pointer">Terms of Service</span>
                                {' '}and{' '}
                                <span className="text-slate-500 underline underline-offset-2 cursor-pointer">Privacy Policy</span>.
                            </p>
                        </div>
                    </form>

                    {/* Reassurance strip */}
                    <div className="flex items-center gap-5 justify-center mt-6 text-xs text-slate-400 font-medium">
                        <span className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-emerald-500" /> No card required</span>
                        <span className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-emerald-500" /> Free setup</span>
                        <span className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-emerald-500" /> Reply within 24h</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
