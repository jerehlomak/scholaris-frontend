import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from '../ui/card';
import { cn } from '../../lib/utils';
import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
    title: string;
    value: number;
    subtitle: string;
    icon: LucideIcon;
    colorTheme?: 'primary' | 'accent' | 'purple' | 'orange';
    prefix?: string;
    delay?: number;
    trend?: number;
}

export function StatCard({ title, value, subtitle, icon: Icon, colorTheme = 'primary', prefix = '', delay = 0, trend = 12 }: StatCardProps) {
    const [displayValue, setDisplayValue] = useState(0);

    useEffect(() => {
        const duration = 1000;
        const steps = 20;
        const stepTime = Math.abs(Math.floor(duration / steps));
        let current = 0;
        const increment = value / steps;

        const timer = setInterval(() => {
            current += increment;
            if (current >= value) {
                setDisplayValue(value);
                clearInterval(timer);
            } else {
                setDisplayValue(Math.floor(current));
            }
        }, stepTime);

        return () => clearInterval(timer);
    }, [value]);

    const getThemeClasses = () => {
        switch (colorTheme) {
            case 'accent': return 'bg-dash-accent/10 text-dash-accent';
            case 'purple': return 'bg-[#1E4DA6]/10 text-[#1E4DA6]';
            case 'orange': return 'bg-orange-500/10 text-orange-600';
            case 'primary':
            default: return 'bg-dash-primary/10 text-dash-primary';
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay }}
            whileHover={{ y: -4 }}
            className="h-full"
        >
            <Card className="bg-white rounded-[20px] p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all h-full flex flex-col justify-between relative overflow-hidden group">
                <div className="flex justify-between items-start mb-4">
                    <div className="flex flex-col">
                        <span className="text-gray-500 text-[13px] font-semibold tracking-wide uppercase">{title}</span>
                        <div className="flex items-baseline gap-1 mt-2">
                            {prefix && <span className="text-2xl font-bold text-gray-800 font-poppins">{prefix}</span>}
                            <span className="text-4xl font-bold text-gray-900 font-poppins tracking-tight">{displayValue.toLocaleString()}</span>
                        </div>
                    </div>
                    <div className={cn("p-3.5 rounded-2xl transition-colors duration-300", getThemeClasses())}>
                        <Icon strokeWidth={2.5} className="w-6 h-6" />
                    </div>
                </div>

                <div className="mt-4 flex items-center text-sm">
                    <span className="text-dash-accent bg-dash-accent/10 px-2 py-0.5 rounded-md text-xs font-bold flex items-center mr-2">
                        +{trend}%
                    </span>
                    <span className="text-gray-400 font-medium">{subtitle}</span>
                </div>
            </Card>
        </motion.div>
    );
}
