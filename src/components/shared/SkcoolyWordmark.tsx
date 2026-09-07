/**
 * SkcoolyWordmark.tsx — temporary text-only logo mark.
 *
 * The real logo asset (assets/SkcoolyPlus.png) is the old Skcooly Plus mark
 * — wrong colors (green/blue, not navy/gold) and wrong name ("Skcooly Plus"
 * baked into the image, not "Skcooly"). It visibly clashed once the auth
 * page redesign went in. This is a placeholder until a real logo gets
 * designed — swap it out then, don't build on top of it.
 */
const NAVY = '#15316B';
const GOLD = '#F5B800';

export function SkcoolyWordmark({ className = '', size = 'md', variant = 'dark' }: { className?: string; size?: 'sm' | 'md' | 'lg'; variant?: 'dark' | 'light' }) {
    const textSize = size === 'lg' ? 'text-3xl' : size === 'sm' ? 'text-lg' : 'text-2xl';
    const barWidth = size === 'lg' ? 'w-10' : size === 'sm' ? 'w-6' : 'w-8';
    // 'light' — white wordmark text for use on a navy sidebar background
    // (teacher/parent/student portals), instead of the default navy-on-light
    // treatment meant for a white/cream surface.
    const textColor = variant === 'light' ? '#FFFFFF' : NAVY;

    return (
        <div className={`inline-flex flex-col ${className}`}>
            <span className={`font-heading font-black tracking-tight leading-none ${textSize}`} style={{ color: textColor }}>
                Skcooly
            </span>
            <span className={`h-[3px] ${barWidth} mt-1.5 rounded-full`} style={{ backgroundColor: GOLD }} />
        </div>
    );
}
