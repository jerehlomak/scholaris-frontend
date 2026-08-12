import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import AuthInput from './AuthInput';

interface PasswordInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    icon?: React.ReactNode;
}

const PasswordInput: React.FC<PasswordInputProps> = (props) => {
    const [showPassword, setShowPassword] = useState(false);

    return (
        <div className="relative">
            <AuthInput
                {...props}
                type={showPassword ? 'text' : 'password'}
                className={`${props.className || ''} pr-10`}
            />
            <button
                type="button"
                onMouseDown={(e) => e.preventDefault()} // Prevent focus loss
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition focus:outline-none"
            >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
        </div>
    );
};

export default PasswordInput;
