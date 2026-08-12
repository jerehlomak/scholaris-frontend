import { motion } from 'framer-motion';
import { Construction } from 'lucide-react';

export default function Placeholders({ title, desc }: { title: string; desc: string }) {
    return (
        <div className="flex min-h-[60vh] flex-col items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="flex max-w-sm flex-col items-center text-center"
            >
                <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-blue-50/50 shadow-inner">
                    <Construction className="h-10 w-10 text-blue-500" />
                </div>
                <h2 className="mb-2 text-2xl font-bold tracking-tight text-slate-900">{title}</h2>
                <p className="mb-6 text-sm leading-relaxed text-slate-500">
                    {desc}. This module is part of the upcoming Phase 2 platform upgrade.
                </p>
                <div className="rounded-full bg-slate-100 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-slate-500">
                    Coming Soon
                </div>
            </motion.div>
        </div>
    );
}
