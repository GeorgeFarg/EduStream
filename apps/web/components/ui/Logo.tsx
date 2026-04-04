'use client'
import React from 'react'
import { GraduationCap } from "lucide-react"
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import Link from 'next/link'
const Logo = () => {
    const { contextSafe } = useGSAP()
    const hatRef = React.useRef<SVGSVGElement | null>(null);

    const onClickAnimation = contextSafe(() => {
        if (!hatRef.current) return;
        // Animate jump: up with rotate, then down with rotate back
        gsap.fromTo(
            hatRef.current,
            { y: 0, rotation: 0 },
            {
                y: -30,
                rotation: 360,
                duration: 0.5,
                ease: "power1.in",
                onComplete: () => {
                    // Land back down after jump with a smooth effect
                    gsap.to(hatRef.current, {
                        y: 0,
                        rotation: 360 * 2,
                        duration: 0.5,
                        ease: "power2.out",
                    });
                }
            }
        );
    });

    return (
        <div className='flex items-center gap-3 text-white'>
            <div className="w-fit bg-main p-2 rounded-md">
                <GraduationCap
                    ref={hatRef}
                    onClick={onClickAnimation}
                    width={35}
                    height={35}
                    style={{ cursor: 'pointer' }}
                />
            </div>
            <Link href={'/'} className='text-2xl font-bold'>EduStream</Link>
        </div>
    )
}

export default Logo