import React, { type ButtonHTMLAttributes } from 'react';

interface PrimaryButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    icon?: React.ReactNode;
    children: React.ReactNode;
}

const PrimaryButton: React.FC<PrimaryButtonProps> = ({ icon, children, className, ...props }) => {
    return (
        <button
            className={`w-full bg-brand-green hover:bg-brand-dark hover:text-brand-green text-brand-dark font-bold py-3 rounded-sm transition-all duration-300 flex items-center justify-center gap-2 transform hover:-translate-y-0.5 hover:shadow-lg ${className || ''}`}
            {...props}
        >
            {icon && <span>{icon}</span>}
            {children}
        </button>
    );
};

export default PrimaryButton;
