import { useState } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { ChevronRight, ChevronDown, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';

interface AttendancePanelProps {
    title: string;
    titleColorClass: string;
}

export function AttendancePanel({ title, titleColorClass }: AttendancePanelProps) {
    const [isOpen, setIsOpen] = useState(true);

    // Convert color class to a background color for the indicator dot
    const isDanger = titleColorClass.includes('danger') || titleColorClass.includes('red');
    const indicatorClass = isDanger ? 'bg-red-500' : 'bg-[#0036a1]';

    return (
        <Card className="mb-4 overflow-hidden rounded-2xl bg-white/90 backdrop-blur-xl border border-white/40 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] transition-all duration-300">
            <Button
                variant="ghost"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-5 bg-transparent hover:bg-gray-50/50 transition-colors h-auto rounded-none border-b border-gray-100/50 group"
            >
                <div className="flex items-center gap-3">
                    <div className={cn("w-2 h-2 rounded-full", indicatorClass)} />
                    <h3 className={cn("font-bold text-[15px] tracking-tight", titleColorClass)}>{title}</h3>
                </div>
                <div className="w-8 h-8 flex items-center justify-center rounded-full flex-shrink-0 bg-gray-50 text-gray-400 group-hover:bg-gray-100 group-hover:text-gray-600 transition-colors">
                    {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </div>
            </Button>

            <AnimatePresence initial={false}>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="overflow-hidden"
                    >
                        <div className="p-8 flex flex-col items-center justify-center bg-gray-50/30">
                            <motion.div
                                animate={{ scale: [1, 1.05, 1] }}
                                transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                                className="mb-4"
                            >
                                <div className="w-16 h-16 rounded-2xl bg-white shadow-sm flex items-center justify-center border border-gray-100 relative">
                                    <div className="absolute inset-0 bg-orange-500/10 rounded-2xl animate-pulse" />
                                    <Clock className="w-8 h-8 text-orange-400 relative z-10" strokeWidth={2} />
                                </div>
                            </motion.div>
                            <span className="text-gray-600 font-bold text-sm tracking-wide">Pending Records</span>
                            <span className="text-gray-400 text-xs mt-1 font-medium">No attendance marked yet</span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </Card>
    );
}
