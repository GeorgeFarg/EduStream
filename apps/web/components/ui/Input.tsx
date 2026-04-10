"use client"
import { useState } from 'react'


type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
    icon?: React.ReactNode;
    isError?: boolean;
    id: string;
    type: string;
    placeholder: string;
    defaultValue?: string;
    maxLength?: number;
    color?: string;
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
};

const Input = ({
    icon,
    isError = false,
    className,
    id,
    type,
    maxLength,
    color,
    onChange,
    borderColor, // <-- new prop to specify border color
    ...inputProps
}: InputProps & { borderColor?: string }) => {
    const [Length, setLength] = useState(0);

    return (
        <div className="flex-col">
            <div className="relative w-full">
                {!!icon && (
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        {icon}
                    </div>
                )}
                <input
                    id={id}
                    name={id}
                    type={type}
                    onChange={(e) => {
                        setLength(e.target.value.length);
                        !!onChange && onChange(e);
                    }}
                    className={
                        `w-full ${!!icon ? "pl-10" : "px-2"} pr-4 py-3 bg-white/5 border rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all
                        ${isError
                            ? "border-red-400 focus:ring-red-500"
                            : borderColor
                                ? ""
                                : "border-white/10 focus:ring-main"
                        }`
                    }
                    {...inputProps}
                    maxLength={maxLength}
                    style={{
                        color,
                        ...(borderColor && !isError ? { borderColor: borderColor } : {})
                    }}
                />
            </div>
            {!!maxLength && <span className={`text-dark/40`}>{Length}/{maxLength}</span>}
        </div>
    );
}

export default Input