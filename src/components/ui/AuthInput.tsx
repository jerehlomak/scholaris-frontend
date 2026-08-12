import React, { type InputHTMLAttributes } from 'react';

interface AuthInputProps extends InputHTMLAttributes<HTMLInputElement> {
    icon?: React.ReactNode;
}

const AuthInput: React.FC<AuthInputProps> = ({ icon, className, ...props }) => {
    return (
        <div className="relative flex items-center">
            {icon && (
                <span className="absolute left-0 text-gray-500">
                    {icon}
                </span>
            )}
            <input
                className={`w-full bg-transparent border-b border-gray-400 focus:border-brand-teal outline-none py-2 transition-colors placeholder:text-gray-500 text-brand-dark font-primary ${icon ? 'pl-8' : 'pl-0'
                    } ${className || ''}`}
                {...props}
            />
        </div>
    );
};

export default AuthInput;
