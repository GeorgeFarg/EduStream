'use client'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap';
import Link from 'next/link';
import { useRef } from 'react'

const NavRoute = ({
    route,
    underLineOnHover,
    href = '#',
}: { route: string; underLineOnHover: boolean; href?: string }) => {
    const underline = useRef<HTMLSpanElement | null>(null);

    // Animate width on hover in, and reset on hover out
    const { contextSafe } = useGSAP();

    const onHover = contextSafe(() => {
        if (underline.current) {
            gsap.to(underline.current, {
                duration: 0.4,
                width: '100%',
                ease: 'power2.out',
            });
        }
    });

    const onLeave = contextSafe(() => {
        if (underline.current) {
            gsap.to(underline.current, {
                duration: 0.4,
                width: '0%',
                ease: 'power2.in',
            });
        }
    });

    return (
        <div
            className="flex flex-col"
            onMouseEnter={underLineOnHover ? onHover : undefined}
            onMouseLeave={underLineOnHover ? onLeave : undefined}
        >
            <Link href={href} className="text-white">{route}</Link>
            {underLineOnHover && (
                <span
                    ref={underline}
                    className="bg-white h-0.5 rounded-3xl"
                    style={{ display: 'block', width: '0%' }}
                />
            )}
        </div>
    );

}

export default NavRoute