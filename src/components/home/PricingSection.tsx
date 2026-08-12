import { useState, useEffect } from 'react';
import { Check } from 'lucide-react';
import { Button } from '../ui/button';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

// Local types matching the backend Prisma SubscriptionPlan
interface SubscriptionPlan {
    id: string;
    name: string;
    description: string;
    monthlyPrice: number;
    yearlyPrice: number;
    priceLabel?: string;
    maxStudents: number;
    maxTeachers: number;
    features: string[];
    isActive: boolean;
}

export const PricingSection = () => {
    const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchPlans = async () => {
            try {
                const response = await axios.get('/api/v1/central/plans');
                if (response.data && response.data.plans) {
                    setPlans(response.data.plans.filter((p: SubscriptionPlan) => p.isActive));
                }
            } catch (error) {
                console.error('Failed to fetch pricing plans:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchPlans();
    }, []);

    // Helper to determine plan styling
    const getPlanStyle = (index: number, total: number) => {
        // Highlight the "Pro" or middle plan if 3, otherwise index 1
        const isHighlighted = total === 3 ? index === 1 : index === 1;
        if (isHighlighted) return { color: 'border-[#1a2fa0] ring-2 ring-[#1a2fa0] scale-105 z-10', isPopular: true };
        return { color: 'border-gray-200', isPopular: false };
    };

    if (loading) {
        return (
            <section className="py-24 bg-gray-50 flex justify-center items-center h-96" id="pricing">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1a2fa0]"></div>
            </section>
        );
    }

    return (
        <section className="py-24 bg-gray-50" id="pricing">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center max-w-3xl mx-auto mb-20">
                    <h2 className="text-4xl font-black text-slate-900 sm:text-5xl font-heading mb-4 tracking-tight">
                        Simple, transparent pricing
                    </h2>
                    <p className="text-lg text-slate-500 font-medium">
                        Choose the perfect plan for your school's needs. Upgrade at any time as your school grows.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch">
                    {plans.map((plan, index) => {
                        const style = getPlanStyle(index, plans.length);
                        const hasCustomLabel = !!plan.priceLabel;

                        return (
                            <motion.div
                                key={plan.id}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                                viewport={{ once: true }}
                                className={`bg-white rounded-3xl shadow-xl flex flex-col overflow-hidden relative border transition-all hover:shadow-2xl ${style.color}`}
                            >
                                {style.isPopular && (
                                    <div className="absolute top-0 inset-x-0 h-10 bg-[#1a2fa0] flex items-center justify-center">
                                        <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Recommended</span>
                                    </div>
                                )}

                                <div className={`p-8 ${style.isPopular ? 'pt-14' : ''}`}>
                                    <h3 className="text-2xl font-black text-slate-900 mb-2 font-heading tracking-tight">{plan.name}</h3>
                                    <p className="text-sm font-medium text-slate-400 mb-8 min-h-[40px] leading-relaxed">{plan.description}</p>
                                    
                                    <div className="mb-8">
                                        {hasCustomLabel ? (
                                            <span className="text-3xl font-black text-slate-900 tracking-tight">
                                                {plan.priceLabel}
                                            </span>
                                        ) : (
                                            <div className="flex items-baseline gap-1">
                                                <span className="text-4xl font-black text-slate-900 tracking-tighter">
                                                    ₦{plan.monthlyPrice.toLocaleString()}
                                                </span>
                                                <span className="text-slate-400 font-bold text-sm">/mo</span>
                                            </div>
                                        )}
                                    </div>

                                    <Button 
                                        onClick={() => navigate(`/get-started?plan=${plan.id}`)}
                                        className={`w-full py-7 rounded-2xl font-black text-sm uppercase tracking-widest ${style.isPopular ? 'bg-[#1a2fa0] hover:bg-[#121f6e] text-white shadow-lg shadow-blue-200' : 'bg-slate-100 hover:bg-slate-200 text-slate-900'} transition-all active:scale-[0.98]`}>
                                        Get Started
                                    </Button>
                                </div>

                                <div className="p-8 border-t border-slate-50 bg-slate-50/50 flex-1">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6">Key Features</p>
                                    <ul className="space-y-4">
                                        {plan.features.map((feature, idx) => (
                                            <li key={idx} className="flex items-start gap-3">
                                                <div className="flex-shrink-0 mt-0.5">
                                                    <div className="h-5 w-5 rounded-full bg-emerald-100 flex items-center justify-center">
                                                        <Check className="h-3 w-3 text-emerald-600 stroke-[3]" />
                                                    </div>
                                                </div>
                                                <p className="text-sm font-bold text-slate-600 leading-tight capitalize">{feature.replace(/-/g, ' ')}</p>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
};
