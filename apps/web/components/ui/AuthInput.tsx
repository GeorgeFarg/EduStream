import React from 'react';

interface AuthInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    icon?: React.ReactNode;
    isError?: boolean;
}

const AuthInput = ({ icon, isError, className, ...props }: AuthInputProps) => {
    return (
        <div className="relative">
            {icon && (
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    {icon}
                </div>
            )}
            <input
                className={`w-full ${icon ? 'pl-10' : 'pl-4'} pr-4 py-3 bg-white/5 border rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all ${isError
                    ? 'border-red-400 focus:ring-red-500'
                    : 'border-white/10 focus:ring-main'
                    } ${className ?? ''}`}
                {...props}
            />
        </div>
    );
};

export default AuthInput;
