'use client'

import { PencilLine, BookCopy, CalendarCheck } from "lucide-react"

const iconsComponents = {
    'draw': PencilLine,
    'folder_copy': BookCopy,
    'fact_check': CalendarCheck
}


const FeatureCard = ({
    colorClass,
    icon,
    description,
    title
}: {
    colorClass: string,
    icon: string,
    description: string,
    title: string
}) => {
    const Icon = iconsComponents[icon as keyof typeof iconsComponents]

    return (
        <div className="group relative overflow-hidden rounded-lg border border-slate-200 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-slate-300 hover:shadow-xl dark:border-white/10 dark:bg-white/[0.04] dark:hover:border-white/20">
            <div className="relative z-10">
                <div className={`mb-5 inline-flex h-12 w-12 items-center justify-center rounded-md ${colorClass}`}>
                    {Icon ? <Icon size={24} /> : null}
                </div>
                <h3 className="mb-3 text-xl font-bold text-slate-950 dark:text-white">{title}</h3>
                <p className="leading-7 text-slate-600 dark:text-slate-300">
                    {description}
                </p>
            </div>
        </div>
    )
}

export default FeatureCard
