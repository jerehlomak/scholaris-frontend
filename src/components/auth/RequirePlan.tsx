import React from 'react';
import { useSubscription, type PlanType } from '../../contexts/SubscriptionContext';
import { Lock, Zap } from 'lucide-react';
import { Button } from '../ui/button';
import { useNavigate } from 'react-router-dom';

interface RequirePlanProps {
    plan?: PlanType;
    featureKey?: string;
    children: React.ReactNode;
    fallback?: React.ReactNode;
}

export const RequirePlan: React.FC<RequirePlanProps> = ({ plan, featureKey, children, fallback }) => {
    const { hasAccess, hasFeatureAccess } = useSubscription();
    const navigate = useNavigate();

    // Determine access: prioritize explicit featureKey check, fallback to general plan tier check
    const isAllowed = featureKey ? hasFeatureAccess(featureKey) : plan ? hasAccess(plan) : true;

    if (isAllowed) {
        return <>{children}</>;
    }

    // If a custom fallback is provided (like rendering a disabled button), use that
    if (fallback) {
        return <>{fallback}</>;
    }

    // Otherwise, render the default full-page blur lock screen overlay
    return (
        <div className="w-full flex-1 h-[600px] flex items-center justify-center p-6 animate-in fade-in duration-500 rounded-2xl relative overflow-hidden bg-white/50 border border-gray-100">
            {/* Blurry Background abstraction of the hidden content */}
            <div className="absolute inset-0 bg-white/60 backdrop-blur-[6px] z-10"></div>

            <div className="max-w-md w-full text-center space-y-6 bg-white p-8 rounded-3xl shadow-xl border border-gray-100 relative z-20">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-orange-400 to-rose-500"></div>

                <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-2 text-orange-500 shadow-inner">
                    <Lock className="w-8 h-8" />
                </div>

                <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2 font-heading">Premium Feature Locked</h2>
                    <p className="text-sm text-gray-500 leading-relaxed">
                        This module is exclusive to the <strong className="text-gray-900">{plan}</strong> plan. Upgrade your school's subscription to unlock advanced capabilities and SaaS configurations.
                    </p>
                </div>

                <div className="pt-4 flex flex-col gap-3">
                    <Button
                        className="w-full bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white shadow-lg shadow-orange-500/20 border-0 py-6 font-bold tracking-wide"
                    >
                        <Zap className="w-4 h-4 mr-2" />
                        Upgrade Required
                    </Button>
                    <Button
                        variant="ghost"
                        onClick={() => navigate('/')}
                        className="text-gray-500 font-semibold"
                    >
                        View Pricing Plans on Home
                    </Button>
                </div>
            </div>
        </div>
    );
};
