import React, { createContext, useContext } from 'react';
import { useAuth } from '../context/AuthContext';

export type PlanType = 'Basic' | 'Pro' | 'Premium' | string;

interface SubscriptionContextType {
    currentPlan: PlanType;
    hasAccess: (requiredPlan: PlanType) => boolean;
    hasFeatureAccess: (featureKey: string) => boolean;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

const PLAN_LEVELS: Record<string, number> = {
    'Basic': 1,
    'Pro': 2,
    'Premium': 3,
    'Enterprise': 4
};

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();

    // Default to 'Basic' if no plan is found
    const currentPlan = user?.school?.plan?.name || 'Basic';

    const hasAccess = (requiredPlan: PlanType) => {
        if (user?.role === 'ADMIN' && !user?.schoolId) return true; // Central admin

        const currentLevel = PLAN_LEVELS[currentPlan] || 0;
        const requiredLevel = PLAN_LEVELS[requiredPlan] || 0;
        return currentLevel >= requiredLevel;
    };

    const hasFeatureAccess = (featureKey: string) => {
        if (!user) return false;
        if (user.role === 'ADMIN' && !user.schoolId) return true; // Central admin overrides

        // 1. Check specific school overrides (featureFlags)
        const flag = user.school?.featureFlags?.find(f => f.feature === featureKey);
        if (flag) {
            return flag.enabled;
        }

        // 2. Check Plan features
        const planFeatures = user.school?.plan?.features || [];
        if (planFeatures.includes(featureKey)) {
            return true;
        }

        return false;
    };

    return (
        <SubscriptionContext.Provider value={{ currentPlan, hasAccess, hasFeatureAccess }}>
            {children}
        </SubscriptionContext.Provider>
    );
}

export function useSubscription() {
    const context = useContext(SubscriptionContext);
    if (context === undefined) {
        throw new Error('useSubscription must be used within a SubscriptionProvider');
    }
    return context;
}
