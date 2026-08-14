/**
 * BrandGraphic.tsx — decorative panel graphic shared by the auth pages'
 * navy right-hand panel. Abstract, geometric, education-adjacent (ascending
 * line = progress, overlapping rings = a connected cohort, open-book
 * silhouette) rather than a stock campus photo — illustrating "a school
 * system," not any specific school. Originally inline in PortalLogin.tsx;
 * extracted so PortalRecover.tsx (and any future auth screen) can reuse it
 * instead of re-authoring the same SVG.
 */
export function BrandGraphic() {
    return (
        <svg viewBox="0 0 480 480" fill="none" className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid slice">
            <circle cx="360" cy="120" r="180" stroke="#F5B800" strokeOpacity="0.12" strokeWidth="1" />
            <circle cx="360" cy="120" r="130" stroke="#F5B800" strokeOpacity="0.16" strokeWidth="1" />
            <circle cx="80" cy="380" r="140" stroke="white" strokeOpacity="0.06" strokeWidth="1" />
            <path
                d="M40 340 L120 300 L200 320 L280 240 L360 260 L440 160"
                stroke="#F5B800"
                strokeOpacity="0.35"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
            />
            {[[40, 340], [120, 300], [200, 320], [280, 240], [360, 260], [440, 160]].map(([x, y], i) => (
                <circle key={i} cx={x} cy={y} r={i === 5 ? 5 : 3} fill={i === 5 ? '#FFC72C' : '#F5B800'} fillOpacity={i === 5 ? 1 : 0.7} />
            ))}
            <g opacity="0.1" transform="translate(60,60)">
                <path d="M0 8 C 20 -4, 50 -4, 70 8 L 70 76 C 50 64, 20 64, 0 76 Z" fill="white" />
                <path d="M140 8 C 120 -4, 90 -4, 70 8 L 70 76 C 90 64, 120 64, 140 76 Z" fill="white" />
            </g>
        </svg>
    );
}
