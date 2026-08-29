import { SkcoolyWordmark } from '../shared/SkcoolyWordmark';

const NAVY = '#15316B';

// TODO: replace with the school's real sales/support email once confirmed.
const SALES_EMAIL = 'hello@skcooly.com';

const COLUMNS = [
    {
        title: 'Product',
        links: [
            { label: 'Features', href: '#features-section' },
            { label: 'Pricing', href: '#pricing' },
            { label: 'Why Skcooly', href: '#why-skcooly' },
        ],
    },
    {
        title: 'Company',
        links: [
            { label: 'Our Mission', href: '#our-mission' },
            { label: 'Contact', href: '#contact-section' },
            { label: 'Apply', href: '/apply' },
        ],
    },
    {
        title: 'Account',
        links: [
            { label: 'Login', href: '/portal/login' },
            { label: 'Get Started', href: '/get-started' },
        ],
    },
];

export function Footer() {
    return (
        <footer className="bg-[#FBF9F5] pt-16 pb-8 border-t border-[#EEEAE0]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* Main Footer Content */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">

                    {/* Brand column */}
                    <div className="lg:col-span-1">
                        <SkcoolyWordmark size="md" />
                        <p className="text-slate-500 text-sm mt-4 leading-relaxed max-w-[220px]">
                            One platform to run admissions, results, attendance, and fees for your school.
                        </p>
                    </div>

                    {COLUMNS.map(col => (
                        <div key={col.title}>
                            <h4 className="font-bold text-[#1C2333] mb-6 text-base">{col.title}</h4>
                            <ul className="space-y-3">
                                {col.links.map(link => (
                                    <li key={link.label}>
                                        <a href={link.href} className="text-slate-500 hover:text-[#15316B] transition-colors text-sm">
                                            {link.label}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}

                </div>

                <div className="mb-16 max-w-sm">
                    <h4 className="font-bold text-[#1C2333] mb-2 text-base">Contact sales</h4>
                    <a href={`mailto:${SALES_EMAIL}`} className="text-sm hover:underline" style={{ color: NAVY }}>{SALES_EMAIL}</a>
                </div>

                {/* Bottom Bar */}
                <div className="pt-8 border-t border-[#EEEAE0] flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="text-slate-400 text-xs text-center md:text-left">
                        &copy; {new Date().getFullYear()} Skcooly. All rights reserved.
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-400">
                        <span>🇳🇬 Made for Nigerian schools</span>
                    </div>
                </div>

            </div>
        </footer>
    );
}
