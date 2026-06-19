'use client'

import { useGSAP } from "@gsap/react"
import gsap from "gsap"
import { PencilLine, BookCopy, CalendarCheck } from "lucide-react"
import { useRef } from "react"


const iconsComponents = {
    'draw': <PencilLine />,
    'folder_copy': <BookCopy />,
    'fact_check': <CalendarCheck />
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

    const sphere = useRef(null)
    var tOrigin = { top: 0, left: 100 };

    const { contextSafe } = useGSAP()

    const onMouseEnter = contextSafe(() => {
        gsap.to(
            sphere.current,
            { scale: 4, opacity: 1, duration: 1, ease: "power2.out" }
        )
    })

    const onMouseleave = contextSafe(() => {
        gsap.to(
            sphere.current,
            { scale: 1, opacity: 0.7, duration: 1, ease: "power2.out" }
        )
    })

    return (

        <div onMouseEnter={onMouseEnter} onMouseLeave={onMouseleave} className="border-2 border-slate-900/55 hover:border-slate-700 group relative rounded-2xl glass-card p-8 shadow-sm transition-colors duration-700 overflow-hidden">
            <div className="relative">
                <div className={`mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl ${colorClass}`}>
                    {iconsComponents[icon as keyof typeof iconsComponents]}
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{title}</h3>
                <p className="text-slate-400 leading-relaxed">
                    {description}
                </p>
                <div ref={sphere} className={`absolute h-72 w-72 rounded-full -top-48 left-3/5 ${colorClass}`}></div>
            </div>
        </div>
    )
}

export default FeatureCard