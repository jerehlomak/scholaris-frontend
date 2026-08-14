import { ShieldCheck, Wifi, HeadphonesIcon } from 'lucide-react';

const NAVY = '#0E2450';
const GOLD = '#F5B800';

export function AnnouncementBar() {
    return (
        <div className="text-white py-2 px-4 text-xs sm:text-sm font-medium" style={{ backgroundColor: NAVY }}>
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-2">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4" style={{ color: GOLD }} />
                        <span>Secure, cloud-hosted data</span>
                    </div>
                    <div className="hidden md:flex items-center gap-2">
                        <Wifi className="w-4 h-4" style={{ color: GOLD }} />
                        <span>Works on any device</span>
                    </div>
                    <div className="hidden lg:flex items-center gap-2">
                        <HeadphonesIcon className="w-4 h-4" style={{ color: GOLD }} />
                        <span>Local support, Nigerian schools</span>
                    </div>
                </div>

                <a href="/apply" className="flex items-center gap-2">
                    <span className="opacity-90 hidden sm:inline">Ready to switch your school over?</span>
                    <span className="px-3 py-1 rounded-sm text-xs font-bold hover:bg-white transition-colors" style={{ backgroundColor: GOLD, color: NAVY }}>
                        GET STARTED
                    </span>
                </a>
            </div>
        </div>
    );
}
