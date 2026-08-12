
import { Cloud, ShieldCheck, Zap, Users } from 'lucide-react';

export function BenefitsBar() {
    const benefits = [
        { icon: <Cloud className="w-6 h-6 text-brand-teal" />, text: "100% Cloud Based" },
        { icon: <Zap className="w-6 h-6 text-brand-teal" />, text: "Automated Workflows" },
        { icon: <Users className="w-6 h-6 text-brand-teal" />, text: "Seamless Communication" },
        { icon: <ShieldCheck className="w-6 h-6 text-brand-teal" />, text: "Secure Data & Privacy" },
    ];

    return (
        <section className="bg-brand-gray-light py-6 border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    {benefits.map((benefit, index) => (
                        <div key={index} className="flex flex-col items-center justify-center p-2 group cursor-pointer transition-transform hover:-translate-y-1">
                            <div className="mb-3 p-3 bg-white rounded-full shadow-sm group-hover:shadow-md transition-shadow">
                                {benefit.icon}
                            </div>
                            <p className="text-brand-dark font-medium text-sm lg:text-base">{benefit.text}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
