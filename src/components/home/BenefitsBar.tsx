import { Cloud, Zap, Users, ShieldCheck } from 'lucide-react';

const NAVY = '#15316B';

export function BenefitsBar() {
    const benefits = [
        { icon: Cloud, text: 'Cloud-based, anywhere access' },
        { icon: Zap, text: 'Automated workflows' },
        { icon: Users, text: 'Built-in parent communication' },
        { icon: ShieldCheck, text: 'Secure student data' },
    ];

    return (
        <section className="bg-[#FBF9F5] py-6 border-b border-[#EEEAE0]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    {benefits.map(({ icon: Icon, text }, index) => (
                        <div key={index} className="flex flex-col items-center justify-center p-2 group cursor-default transition-transform hover:-translate-y-1">
                            <div className="mb-3 p-3 bg-white rounded-full shadow-sm border border-[#EEEAE0] group-hover:shadow-md transition-shadow">
                                <Icon className="w-6 h-6" style={{ color: NAVY }} />
                            </div>
                            <p className="text-slate-700 font-medium text-sm lg:text-base">{text}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
