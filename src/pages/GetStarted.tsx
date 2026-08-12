import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { CheckCircle2, Building2, User, Phone, Mail, MapPin, Layers, MessageSquare, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

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
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
                <div className="relative mb-8">
                    <div className="h-20 w-20 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                        <CheckCircle2 className="h-9 w-9 text-emerald-500" strokeWidth={1.5} />
                    </div>
                    <div className="absolute -inset-2 rounded-full border border-emerald-100 animate-ping opacity-30" />
                </div>
                <p className="text-xs font-semibold tracking-[0.2em] uppercase text-emerald-500 mb-3">You're all set</p>
                <h1 className="text-3xl font-bold text-slate-900 mb-4 tracking-tight">Inquiry received!</h1>
                <p className="text-slate-500 max-w-sm mx-auto mb-10 leading-relaxed text-sm">
                    Thank you for your interest in Skooly Plus. Our team will review your school's details and reach out within 24 hours.
                </p>
                <Link to="/">
                    <Button className="bg-[#1a2fa0] hover:bg-[#121f6e] text-white px-8 py-5 rounded-xl font-semibold text-sm tracking-wide shadow-lg shadow-blue-100 transition-all">
                        ← Back to Home
                    </Button>
                </Link>
            </div>
        );
    }

    const inputClass = "w-full bg-white border border-slate-200 rounded-xl px-4 py-3.5 text-sm font-medium text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-slate-300 hover:border-slate-300";
    const labelClass = "text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1.5 mb-2";

    const features = [
        {
            icon: <Building2 className="h-4 w-4 text-blue-300" strokeWidth={1.5} />,
            title: 'Custom branded portal',
            desc: 'Each school gets a unique, white-labelled instance tailored to your identity.'
        },
        {
            icon: <Layers className="h-4 w-4 text-blue-300" strokeWidth={1.5} />,
            title: 'All-in-one management',
            desc: 'Students, staff, finances, and communication — managed from one place.'
        },
        {
            icon: <CheckCircle2 className="h-4 w-4 text-blue-300" strokeWidth={1.5} />,
            title: 'Dedicated support',
            desc: 'A real team, always available to help your school grow and succeed.'
        }
    ];

    return (
        <div className="min-h-screen bg-white lg:flex">
            {/* Sidebar */}
            <div className="hidden lg:flex lg:w-[38%] xl:w-1/3 bg-[#0f1d6e] p-10 xl:p-14 flex-col justify-between text-white relative overflow-hidden">
                {/* Subtle dot-grid pattern */}
                <div
                    className="absolute inset-0 opacity-[0.04]"
                    style={{
                        backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)',
                        backgroundSize: '28px 28px'
                    }}
                />
                {/* Soft glow blobs */}
                <div className="absolute top-0 right-0 w-80 h-80 rounded-full opacity-10 blur-3xl"
                    style={{ background: 'radial-gradient(circle, #4f6bff, transparent)' }} />
                <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full opacity-10 blur-3xl"
                    style={{ background: 'radial-gradient(circle, #3b82f6, transparent)' }} />

                <div className="relative z-10 flex flex-col h-full">
                    {/* Back link */}
                    <Link to="/" className="inline-flex items-center gap-2 text-blue-200/60 hover:text-blue-100 transition-colors text-xs font-semibold tracking-widest uppercase mb-14 w-fit">
                        <ArrowLeft className="h-3.5 w-3.5" />
                        Back to Home
                    </Link>

                    {/* Brand mark */}
                    <div className="mb-2">
                        <span className="text-xs font-bold tracking-[0.25em] uppercase text-blue-300/70">Skooly Plus</span>
                    </div>

                    <h2 className="text-3xl xl:text-4xl font-bold tracking-tight leading-tight mb-5 text-white">
                        Transform your school's operations today.
                    </h2>
                    <p className="text-blue-200/60 text-sm leading-relaxed mb-12">
                        Complete this brief form and we'll set up your school's dedicated portal — no technical expertise required.
                    </p>

                    {/* Feature list */}
                    <div className="space-y-6 flex-1">
                        {features.map((item, i) => (
                            <div key={i} className="flex gap-4 items-start">
                                <div className="h-8 w-8 rounded-lg bg-white/[0.06] border border-white/10 flex items-center justify-center shrink-0 mt-0.5">
                                    {item.icon}
                                </div>
                                <div>
                                    <p className="font-semibold text-sm text-white mb-0.5">{item.title}</p>
                                    <p className="text-blue-200/50 text-xs leading-relaxed">{item.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Step indicator */}
                    <div className="mt-10 pt-8 border-t border-white/10">
                        <p className="text-xs text-blue-200/40 font-semibold tracking-widest uppercase mb-3">How it works</p>
                        <div className="space-y-2.5">
                            {['Fill in your school details', 'Our team reviews your inquiry', 'Get onboarded within 48hrs'].map((step, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <span className="text-[10px] font-bold text-blue-400/50 w-4 shrink-0">{i + 1}</span>
                                    <span className="text-xs text-blue-200/50 font-medium">{step}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <p className="relative z-10 text-blue-200/30 text-[11px] font-semibold mt-8">
                        © 2026 Skooly Plus. All rights reserved.
                    </p>
                </div>
            </div>

            {/* Form panel */}
            <div className="flex-1 flex flex-col justify-center py-12 px-6 lg:px-16 xl:px-24 bg-slate-50/50">
                <div className="max-w-xl w-full mx-auto">

                    {/* Mobile header */}
                    <div className="mb-10 lg:hidden">
                        <Link to="/" className="inline-flex items-center gap-1.5 text-slate-400 hover:text-slate-600 transition-colors text-xs font-semibold tracking-widest uppercase mb-6">
                            <ArrowLeft className="h-3 w-3" /> Home
                        </Link>
                        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Get started</h2>
                        <p className="text-slate-400 text-sm mt-1">Set up your school's Skooly Plus portal.</p>
                    </div>

                    {/* Desktop header */}
                    <div className="hidden lg:block mb-10">
                        <p className="text-xs font-bold tracking-[0.2em] uppercase text-blue-500 mb-2">School enrollment</p>
                        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Tell us about your school</h2>
                        <p className="text-slate-400 text-sm mt-1.5">All fields marked <span className="text-blue-500">*</span> are required.</p>
                    </div>

                    <form className="space-y-6" onSubmit={handleSubmit}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-5">

                            {/* School Name */}
                            <div>
                                <label className={labelClass}>
                                    <Building2 className="h-3 w-3" /> School Name <span className="text-blue-500">*</span>
                                </label>
                                <input name="schoolName" type="text" required value={formData.schoolName} onChange={handleChange}
                                    placeholder="e.g. Greenwood Academy" className={inputClass} />
                            </div>

                            {/* Contact Person */}
                            <div>
                                <label className={labelClass}>
                                    <User className="h-3 w-3" /> Contact Person <span className="text-blue-500">*</span>
                                </label>
                                <input name="contactPerson" type="text" required value={formData.contactPerson} onChange={handleChange}
                                    placeholder="Full name" className={inputClass} />
                            </div>

                            {/* Phone */}
                            <div>
                                <label className={labelClass}>
                                    <Phone className="h-3 w-3" /> Phone Number <span className="text-blue-500">*</span>
                                </label>
                                <input name="phoneNumber" type="tel" required value={formData.phoneNumber} onChange={handleChange}
                                    placeholder="+234 800 000 0000" className={inputClass} />
                            </div>

                            {/* Email */}
                            <div>
                                <label className={labelClass}>
                                    <Mail className="h-3 w-3" /> Email Address <span className="text-blue-500">*</span>
                                </label>
                                <input name="emailAddress" type="email" required value={formData.emailAddress} onChange={handleChange}
                                    placeholder="school@example.com" className={inputClass} />
                            </div>

                            {/* Location */}
                            <div>
                                <label className={labelClass}>
                                    <MapPin className="h-3 w-3" /> State & LGA
                                </label>
                                <input name="stateLga" type="text" value={formData.stateLga} onChange={handleChange}
                                    placeholder="e.g. Lagos, Ikeja" className={inputClass} />
                            </div>

                            {/* Plan */}
                            <div>
                                <label className={labelClass}>
                                    <Layers className="h-3 w-3" /> Preferred Plan
                                </label>
                                <div className="relative">
                                    <select name="preferredPlanId" value={formData.preferredPlanId} onChange={handleChange}
                                        className={`${inputClass} appearance-none pr-9 cursor-pointer`}>
                                        <option value="">Select a plan...</option>
                                        {plans.map((plan: any) => (
                                            <option key={plan.id} value={plan.id}>{plan.name}</option>
                                        ))}
                                    </select>
                                    <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
                                        <svg className="h-4 w-4 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Notes */}
                        <div>
                            <label className={labelClass}>
                                <MessageSquare className="h-3 w-3" /> Message / Additional Notes
                            </label>
                            <textarea name="notes" rows={4} value={formData.notes} onChange={handleChange}
                                placeholder="Tell us more about your school's specific needs or any questions you have..."
                                className={`${inputClass} resize-none rounded-xl`} />
                        </div>

                        {/* Divider */}
                        <div className="border-t border-slate-100 pt-6">
                            <Button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full py-7 bg-[#1a2fa0] hover:bg-[#121f6e] text-white rounded-xl font-semibold text-sm tracking-wide shadow-lg shadow-blue-100 transition-all active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? (
                                    <span className="flex items-center gap-2 justify-center">
                                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                        </svg>
                                        Processing inquiry...
                                    </span>
                                ) : 'Submit school request →'}
                            </Button>

                            <p className="text-center text-[11px] text-slate-300 font-medium mt-4">
                                By submitting, you agree to our{' '}
                                <span className="text-slate-400 underline underline-offset-2 cursor-pointer">Terms of Service</span>
                                {' '}and{' '}
                                <span className="text-slate-400 underline underline-offset-2 cursor-pointer">Privacy Policy</span>.
                            </p>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}