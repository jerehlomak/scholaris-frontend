interface SettingsHeroProps {
    icon: React.ReactNode;
    title: string;
    subtitle: string;
    /** Optional extra content beneath the subtitle (e.g. stat pills) */
    children?: React.ReactNode;
}

export function SettingsHero({ icon, title, subtitle, children }: SettingsHeroProps) {
    return (
        <div className="mb-10 text-center">
            <div className="relative mx-auto mb-5 h-16 w-16">
                <div
                    className="absolute inset-0 rounded-2xl bg-[#1E4DA6]/20"
                    style={{ animation: 'ss-pulse 2.4s ease-out infinite' }}
                />
                <style>{`
                    @keyframes ss-pulse {
                        0%   { transform: scale(0.9); opacity: 0.4; }
                        100% { transform: scale(1.55); opacity: 0; }
                    }
                    @keyframes ss-float {
                        0%, 100% { transform: translateY(0); }
                        50%       { transform: translateY(-6px); }
                    }
                    .ss-float { animation: ss-float 3.5s ease-in-out infinite; }
                `}</style>
                <div className="ss-float relative flex h-full w-full items-center justify-center rounded-2xl bg-gradient-to-br from-[#173F8C] to-[#1E4DA6] shadow-lg shadow-[#1E4DA6]/20 text-white">
                    {icon}
                </div>
            </div>

            <h2 className="mb-2 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-[1.75rem]">
                {title}
            </h2>
            <p className="mx-auto max-w-md text-sm leading-relaxed text-slate-500">
                {subtitle}
            </p>
            {children}
        </div>
    );
}
