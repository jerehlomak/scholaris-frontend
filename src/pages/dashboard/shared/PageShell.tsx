import React from 'react';

interface PageShellProps {
    children: React.ReactNode;
    maxWidth?: 'md' | 'lg' | 'xl' | '2xl' | '7xl';
}

const MAX_W = {
    md: 'max-w-3xl',
    lg: 'max-w-4xl',
    xl: 'max-w-5xl',
    '2xl': 'max-w-6xl',
    '7xl': 'max-w-7xl',
};

export function PageShell({ children, maxWidth = '7xl' }: PageShellProps) {
    return (
        <>
            {/* Font injection */}
            <style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&family=DM+Mono:wght@400;500&display=swap');`}</style>

            {/* Full-page gradient background with dot-grid */}
            <div
                className="min-h-screen w-full relative"
                style={{
                    fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
                    background: 'linear-gradient(135deg, #f8fafc 0%, #eff6ff 40%, #eef2ff 100%)',
                }}
            >
                {/* Dot grid overlay */}
                <div
                    className="pointer-events-none absolute inset-0"
                    style={{
                        backgroundImage: 'radial-gradient(circle, #94a3b820 1px, transparent 1px)',
                        backgroundSize: '22px 22px',
                    }}
                />
                {/* Content */}
                <div className={`relative z-10 ${MAX_W[maxWidth]} mx-auto px-4 sm:px-6 py-8`}>
                    {children}
                </div>
            </div>
        </>
    );
}
