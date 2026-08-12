
import { Truck, ShieldCheck, CreditCard } from 'lucide-react';

export function AnnouncementBar() {
    return (
        <div className="bg-brand-teal text-white py-2 px-4 text-xs sm:text-sm font-medium">
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-2">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-brand-green" />
                        <span>Bank-grade Security</span>
                    </div>
                    <div className="hidden md:flex items-center gap-2">
                        <Truck className="w-4 h-4 text-brand-green" />
                        <span>100% Free Setup</span>
                    </div>
                    <div className="hidden lg:flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-brand-green" />
                        <span>No Credit Card Required</span>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <span className="opacity-90">Start your free 7-day trial today!</span>
                    <button className="bg-brand-green text-brand-teal px-3 py-1 rounded-sm text-xs font-bold hover:bg-white transition-colors">
                        GET STARTED
                    </button>
                </div>
            </div>
        </div>
    );
}
