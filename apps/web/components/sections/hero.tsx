'use client'
import Image from 'next/image'
import React from 'react'
import MainButton from '../ui/MainButton'
import { CirclePlay } from 'lucide-react'
import { GIFtext } from '../ui/GIFtext'

const Hero = () => {
    return (
        <div className="h-full gradient-bg border-b-2 border-b-blue-950 px-4 py-28">
            <div className="h-full flex justify-around items-center">
                <div>
                    {/* The new sections */}
                    <div className=" text-main inline-flex w-fit items-center gap-2 rounded-full border border-action-blue/30 bg-action-blue/10 px-3 py-1 text-xs font-semibold text-action-blue">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-main opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-main"></span>
                        </span>
                        New: Real-time video and chat
                    </div>

                    <div className="mt-3">
                        <div className="flex gap-2 justify-center md:justify-start md:block">
                            <h1 className="text-white text-2xl sm:text-4xl md:text-6xl xl:text-8xl font-bold">Learn.</h1>
                            <GIFtext GifName='twerken-twerk.gif' width={120} height={120}>
                                <h1 className="text-2xl sm:text-4xl md:text-6xl xl:text-8xl font-bold bg-linear-to-r from-blue-600 to-violet-500 bg-clip-text text-transparent">
                                    Collaborate.
                                </h1>
                            </GIFtext>
                            <h1 className="text-white text-2xl sm:text-4xl md:text-6xl xl:text-8xl font-bold">Succeed.</h1>

                        </div>
                        <p className="text-slate-400 mt-5 max-w-100">
                            Modern problems require modern solutions and for that. Learning
                            Managements System designed to unify compus leanring, drive
                            students to success, and simplify administration
                        </p>

                        <div className="flex items-center gap-6 mt-4">
                            <MainButton text={"Request Demo"} />
                            <button className="flex gap-2 items-center border-2 border-slate-500 rounded-md px-3 py-1">
                                <CirclePlay
                                    color="#000000"
                                    fill="#0d7ff2"
                                    size={30}
                                    strokeWidth={2}
                                    absoluteStrokeWidth
                                />
                                <p className="font-bold">Watch Demo</p>
                            </button>
                        </div>
                    </div>
                </div>
                <Image
                    src={"/landing.webp"}
                    width={500}
                    height={500}
                    alt="hero section"
                    className="hidden md:block aspect-video object-cover h-0 md:w-100 md:h-60 xl:w-140 xl:h-96  rounded-xl shadow-lg shadow-main"
                />
            </div>
        </div>
    )
}

export default Hero