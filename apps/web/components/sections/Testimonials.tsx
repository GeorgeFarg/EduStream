'use client'
import testimonials from "@/constants/testimonials";
import Image from "next/image";
import { useRef } from "react";
import { ArrowLeft, ArrowRight, Star } from 'lucide-react'

export const Testimonials: React.FC = () => {
    const scrollRef = useRef<HTMLDivElement>(null);


    const scroll = (direction: 'left' | 'right') => {
        if (scrollRef.current) {
            const { current } = scrollRef;
            const scrollAmount = direction === 'left' ? -400 : 400;
            current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
    };

    return (
        <section id="cases" className="relative border-y border-slate-200 bg-white py-20 dark:border-white/10 dark:bg-[#0b1420]">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="mb-12 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
                    <div>
                        <span className="text-sm font-semibold uppercase tracking-wide text-cyan-700 dark:text-cyan-300">Success stories</span>
                        <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl dark:text-white">Trusted by academic teams</h2>
                        <p className="mt-4 max-w-2xl text-lg text-slate-600 dark:text-slate-300">Hear from academic leaders transforming their institutions with clearer workflows and stronger student engagement.</p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => scroll('left')}
                            aria-label="Scroll testimonials left"
                            className="rounded-md border border-slate-200 p-3 text-slate-800 transition hover:bg-slate-100 dark:border-white/10 dark:text-white dark:hover:bg-white/10"
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <button
                            onClick={() => scroll('right')}
                            aria-label="Scroll testimonials right"
                            className="rounded-md border border-slate-200 p-3 text-slate-800 transition hover:bg-slate-100 dark:border-white/10 dark:text-white dark:hover:bg-white/10"
                        >
                            <ArrowRight size={20} />
                        </button>
                    </div>
                </div>

                <div
                    ref={scrollRef}
                    className="flex overflow-x-auto hide-scrollbar gap-6 scrollbar-hide pb-4 snap-x snap-mandatory"
                >
                    {testimonials.map((t) => (
                        <div key={t.id} className="flex min-w-[300px] snap-center flex-col justify-between rounded-lg border border-slate-200 bg-slate-50 p-6 shadow-sm transition hover:shadow-lg sm:min-w-[360px] md:min-w-[400px] dark:border-white/10 dark:bg-white/[0.04]">
                            <div>
                                <div className="mb-6 flex gap-1 text-amber-400">
                                    {[...Array(t.rating)].map((_, i) => (
                                        <Star key={i} size={18} fill="currentColor" />
                                    ))}
                                </div>
                                <blockquote className="text-lg font-medium leading-8 text-slate-900 dark:text-white">
                                    {t.quote}
                                </blockquote>
                            </div>
                            <div className="mt-8 flex items-center gap-4">
                                <Image alt={t.name} className="h-12 w-12 rounded-full object-cover ring-2 ring-white/10" src={t.avatar} width={48} height={48} />
                                <div>
                                    <div className="font-bold text-slate-950 dark:text-white">{t.name}</div>
                                    <div className="text-sm text-slate-500 dark:text-slate-400">{t.role}, {t.institution}</div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};
