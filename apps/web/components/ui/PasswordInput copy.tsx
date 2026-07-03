'use client'
import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react'

const PasswordInput = ({
    icon, id, placeholder, defaultValue, isError
}: {
    icon: React.ReactNode;
    id: string;
    placeholder: string;
    defaultValue?: string;
    isError?: boolean
}) => {
    const [showPassword, setShowPassword] = useState(false)
    return (
        <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                {icon}
            </div>
            <input
                id={id}
                name={id}
                className={
                    `w-full pl-10 pr-4 py-3 bg-white/5 border rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all
                    ${isError
                        ? "border-red-400 focus:ring-red-500"
                        : "border-white/10 focus:ring-main"
                    }`
                } type={showPassword ? 'text' : 'password'}
                placeholder={placeholder}
                defaultValue={defaultValue}
            />
            <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors"
            >
                {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                ) : (
                    <Eye className="h-5 w-5" />
                )}
            </button>
        </div>
    )
}

export default PasswordInput