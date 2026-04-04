import React from 'react'

const Input = ({
    icon, id, type, placeholder, defaultValue, isError
}: {
    icon: React.ReactNode;
    id: string;
    type: string;
    placeholder: string;
    defaultValue?: string;
    isError?: boolean;
}) => {
    return (
        <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                {icon}
            </div>
            <input
                id={id}
                name={id}
                type={type}
                className={
                    `w-full pl-10 pr-4 py-3 bg-white/5  border rounded-lg  text-white  placeholder-slate-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all
                    ${isError
                        ? "border-red-400 focus:ring-red-500"
                        : "border-white/10 focus:ring-main"
                    }`
                }
                placeholder={placeholder}
                defaultValue={defaultValue}
            />

        </div>
    )
}

export default Input