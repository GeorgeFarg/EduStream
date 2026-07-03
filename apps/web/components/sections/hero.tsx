'use client'
import Image from 'next/image'
import React from 'react'
import MainButton from '../ui/MainButton'
import { CirclePlay, ShieldCheck, Sparkles, Users } from 'lucide-react'

const Hero = () => {
    return (
        <section className="relative isolate overflow-hidden bg-[linear-gradient(145deg,#07111f_0%,#0f1f2e_48%,#13261f_100%)] px-4 pt-28 pb-16 sm:pt-32 lg:pb-24">
            <div className="absolute inset-x-0 top-0 h-px bg-white/15" />
            <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1.02fr_0.98fr]">
                <div className="max-w-3xl">
                    <div className="inline-flex w-fit items-center gap-2 rounded-full border border-cyan-300/25 bg-cyan-300/10 px-3 py-1 text-xs font-semibold text-cyan-100">
                        <span className="relative flex h-2 w-2">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-300 opacity-75"></span>
                            <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-200"></span>
                        </span>
                        New: real-time video, chat, and classroom streams
                    </div>

                    <div className="mt-6">
                        <h1 className="max-w-4xl text-4xl font-bold leading-tight text-white sm:text-6xl lg:text-7xl">
                            Learn, collaborate, and manage every class in one place.
                        </h1>
                        <p className="mt-6 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
                            EduStream is a modern learning management system built to unify campus learning, simplify administration, and keep students connected wherever they study.
                        </p>

                        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                            <MainButton text="Request Demo" />
                            <button className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-white/15 bg-white/5 px-5 text-sm font-semibold text-white transition hover:bg-white/10">
                                <CirclePlay size={20} />
                                Watch Demo
                            </button>
                        </div>

                        <div className="mt-10 grid max-w-2xl grid-cols-1 gap-3 text-sm text-slate-300 sm:grid-cols-3">
                            {[
                                { icon: Users, label: 'Student-first collaboration' },
                                { icon: ShieldCheck, label: 'Secure course spaces' },
                                { icon: Sparkles, label: 'Smart learning workflows' },
                            ].map(({ icon: Icon, label }) => (
                                <div key={label} className="flex items-center gap-2 rounded-md border border-white/10 bg-white/[0.04] px-3 py-2">
                                    <Icon size={17} className="text-cyan-200" />
                                    <span>{label}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="relative">
                    <div className="absolute -inset-4 rounded-2xl bg-cyan-300/10 blur-3xl" />
                    <Image
                        src="/landing.webp"
                        width={860}
                        height={560}
                        priority
                        alt="EduStream digital classroom dashboard"
                        className="relative aspect-[16/11] w-full rounded-lg border border-white/10 object-cover shadow-2xl shadow-black/40"
                    />
                    <div className="absolute bottom-4 left-4 right-4 grid grid-cols-3 gap-2 rounded-lg border border-white/10 bg-slate-950/80 p-3 text-center text-white shadow-xl backdrop-blur">
                        <div>
                            <div className="text-lg font-bold">40%</div>
                            <div className="text-xs text-slate-400">more engagement</div>
                        </div>
                        <div>
                            <div className="text-lg font-bold">24/7</div>
                            <div className="text-xs text-slate-400">class access</div>
                        </div>
                        <div>
                            <div className="text-lg font-bold">1 hub</div>
                            <div className="text-xs text-slate-400">for materials</div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}

export default Hero
