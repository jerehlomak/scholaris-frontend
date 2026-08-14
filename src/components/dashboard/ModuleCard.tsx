import { Card } from '../ui/card';
import { cn } from '../../lib/utils';
import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import { LayoutGrid } from 'lucide-react';

interface ModuleCardProps {
    title: string;
    value: React.ReactNode;
    subtitle: string;
    icon?: LucideIcon;
    colorTheme?: 'primary' | 'accent' | 'purple' | 'orange' | 'teal' | 'blue';
    delay?: number;
}

export function ModuleCard({ title, value, subtitle, icon: Icon, colorTheme = 'primary', delay = 0 }: ModuleCardProps) {
    const getThemeColors = () => {
        switch (colorTheme) {
            case 'accent': return { from: 'from-emerald-400', to: 'to-emerald-600', text: 'text-emerald-600', bg: 'bg-emerald-50' };
            case 'purple': return { from: 'from-[#1E4DA6]/60', to: 'to-[#1E4DA6]', text: 'text-[#1E4DA6]', bg: 'bg-[#1E4DA6]/5' };
            case 'orange': return { from: 'from-orange-400', to: 'to-orange-600', text: 'text-orange-600', bg: 'bg-orange-50' };
            case 'teal': return { from: 'from-teal-400', to: 'to-teal-600', text: 'text-teal-600', bg: 'bg-teal-50' };
            case 'blue': return { from: 'from-[#1E4DA6]/60', to: 'to-[#1E4DA6]', text: 'text-[#1E4DA6]', bg: 'bg-[#1E4DA6]/5' };
            case 'primary':
            default: return { from: 'from-[#1E4DA6]', to: 'to-[#1E4DA6]', text: 'text-[#1E4DA6]', bg: 'bg-[#1E4DA6]/5' };
        }
    };

    const colors = getThemeColors();
    const IconComponent = Icon || LayoutGrid;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay }}
            whileHover={{ y: -4, scale: 1.02 }}
            className="h-full"
        >
            <Card className="relative overflow-hidden bg-white/90 border border-white/40 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300 rounded-2xl p-6 h-full flex flex-col justify-between group cursor-pointer">

                {/* Decorative background gradient orb */}
                <div className={cn(
                    "absolute -right-10 -top-10 w-32 h-32 rounded-full opacity-10 bg-gradient-to-br blur-2xl group-hover:scale-150 group-hover:opacity-20 transition-all duration-700 ease-in-out",
                    colors.from, colors.to
                )} />

                <div className="flex justify-between items-start mb-6 relative z-10">
                    <div className={cn(
                        "w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm",
                        colors.bg
                    )}>
                        <IconComponent className={cn("w-7 h-7", colors.text)} strokeWidth={2} />
                    </div>
                </div>

                <div className="relative z-10">
                    <h3 className="text-gray-500 font-semibold text-sm mb-1 uppercase tracking-wider">{title}</h3>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-extrabold text-gray-900 tracking-tight">{value}</span>
                    </div>
                    <p className="text-[13px] text-gray-400 mt-2 font-medium flex items-center gap-1">
                        {subtitle}
                    </p>
                </div>

                {/* Left accent line */}
                <div className={cn(
                    "absolute left-0 top-0 bottom-0 w-1.5 opacity-0 group-hover:opacity-100 transition-all duration-300 bg-gradient-to-b",
                    colors.from, colors.to
                )} />
            </Card>
        </motion.div>
    );
}
