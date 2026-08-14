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
        <div className="min-h-screen w-full relative bg-[#FBF9F5]">
            {/* Content */}
            <div className={`relative z-10 ${MAX_W[maxWidth]} mx-auto px-4 sm:px-6 py-8`}>
                {children}
            </div>
        </div>
    );
}
