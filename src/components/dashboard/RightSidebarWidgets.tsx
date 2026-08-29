import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Gift, Apple, Monitor, ChevronLeft, ChevronRight, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

export function ReviewEarnWidget() {
    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
            <Card className="relative overflow-hidden p-6 bg-gradient-to-br from-amber-500 to-orange-600 outline-none border-none rounded-2xl flex items-center justify-between shadow-lg shadow-orange-500/30 group cursor-pointer hover:-translate-y-1 transition-transform duration-300">

                {/* Decorative background */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl group-hover:scale-150 transition-transform duration-700" />
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-orange-400/30 rounded-full -ml-10 -mb-10 blur-xl" />

                <div className="relative z-10 text-white">
                    <div className="flex gap-1 mb-3">
                        {[1, 2, 3, 4, 5].map(i => (
                            <Star key={i} className="w-4 h-4 text-amber-200 fill-amber-200 drop-shadow-sm" />
                        ))}
                    </div>
                    <h3 className="font-extrabold text-xl leading-tight mb-1 text-white drop-shadow-sm">Review & Earn</h3>
                    <p className="text-sm text-orange-100 max-w-[150px] leading-snug font-medium">
                        Receive <span className="font-white text-white bg-white/20 px-1.5 py-0.5 rounded-md">₦10,000 reward</span> plus a Desktop plan.
                    </p>
                </div>
                <div className="relative z-10 text-orange-600 bg-white shadow-xl shadow-orange-900/10 p-4 rounded-2xl rotate-3 group-hover:rotate-12 transition-transform duration-300">
                    <Gift className="w-8 h-8" strokeWidth={2.5} />
                </div>
            </Card>
        </motion.div>
    );
}

export function DesktopAppWidget() {
    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
            <Card className="p-6 bg-white/90 border border-white/40 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] relative overflow-hidden transition-all duration-300 group">
                {/* Subtle accent background shape instead of full gradient */}
                <div className="absolute top-0 right-0 w-48 h-48 bg-[#1E4DA6]/10 rounded-full -mr-20 -mt-20 blur-3xl pointer-events-none group-hover:bg-[#1E4DA6]/20 transition-colors duration-500" />

                <div className="absolute top-6 right-6 flex items-center justify-center opacity-5 group-hover:opacity-10 transition-opacity duration-300 group-hover:scale-110 transform">
                    <Monitor className="w-20 h-20 text-[#0E2450]" />
                </div>

                <div className="relative z-10 w-full">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#1E4DA6]/5 text-[#1E4DA6] text-xs font-bold mb-3 border border-[#1E4DA6]/10">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#1E4DA6]/60 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#1E4DA6]"></span>
                        </span>
                        New Release
                    </div>
                    <h3 className="font-extrabold text-gray-900 text-xl leading-tight mb-1">Desktop App</h3>
                    <p className="text-sm text-gray-500 mb-5 leading-tight font-medium">
                        Faster experience native to your PC.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3">
                        <Button className="flex-1 bg-gradient-to-br from-[#1E4DA6] to-[#1E4DA6] hover:from-[#1E4DA6] hover:to-[#173F8C] text-white text-sm py-6 rounded-xl flex items-center justify-center transition-all shadow-md shadow-[#1E4DA6]/20 hover:shadow-lg hover:-translate-y-0.5 border-none">
                            <Monitor className="w-4 h-4 mr-2" /><span className="font-bold">Windows</span>
                        </Button>
                        <Button className="flex-1 bg-gradient-to-br from-gray-800 to-gray-950 hover:from-gray-700 hover:to-gray-900 text-white text-sm py-6 rounded-xl flex items-center justify-center transition-all shadow-md shadow-gray-900/20 hover:shadow-lg hover:-translate-y-0.5 border-none">
                            <Apple className="w-4 h-4 mr-2" /><span className="font-bold">macOS</span>
                        </Button>
                    </div>
                </div>
            </Card>
        </motion.div>
    );
}

export function CalendarWidget() {
    const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    const dates: number[] = [];
    for (let i = 1; i <= 28; i++) dates.push(i);

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}>
            <Card className="p-6 bg-white/90 border border-white/40 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300">
                <div className="flex items-center justify-between mb-5">
                    <Button variant="ghost" size="icon" className="rounded-xl bg-gray-50/50 text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors h-9 w-9 border border-gray-100">
                        <ChevronLeft className="w-4 h-4 flex-shrink-0" />
                    </Button>
                    <div className="text-center">
                        <h4 className="text-gray-900 font-extrabold text-[15px] tracking-wide">FEBRUARY 2026</h4>
                        <p className="text-[#1E4DA6] text-[11px] uppercase font-bold mt-0.5 tracking-wider">Upcoming Events</p>
                    </div>
                    <Button variant="ghost" size="icon" className="rounded-xl bg-gray-50/50 text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors h-9 w-9 border border-gray-100">
                        <ChevronRight className="w-4 h-4 flex-shrink-0" />
                    </Button>
                </div>

                <div className="grid grid-cols-7 gap-y-3 mb-2 border-b border-t border-gray-100/50 py-3">
                    {days.map(d => (
                        <div key={d} className={cn(
                            "text-[10px] font-bold text-center",
                            d === 'SUN' || d === 'SAT' ? 'text-gray-400' : 'text-[#1E4DA6]'
                        )}>
                            {d}
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-7 gap-y-3 px-1 mt-3">
                    {dates.map((date) => (
                        <div
                            key={date}
                            className={cn(
                                "text-[13px] font-semibold text-center flex items-center justify-center w-8 h-8 mx-auto rounded-full cursor-pointer transition-all duration-200",
                                date === 27
                                    ? "bg-gradient-to-br from-[#1E4DA6] to-[#1E4DA6] text-white shadow-md shadow-[#1E4DA6]/30 scale-110"
                                    : "text-gray-700 hover:bg-[#1E4DA6]/5 hover:text-[#1E4DA6]"
                            )}
                        >
                            {date}
                        </div>
                    ))}
                </div>
            </Card>
        </motion.div>
    );
}
