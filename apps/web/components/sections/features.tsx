'use client'
import features from "@/constants/features"
import FeatureCard from "../ui/landing-feature-cars"

const Features = () => {
    return (
        <section id="features" className="bg-slate-50 px-4 py-20 dark:bg-[#08111d]">
            <div className="mx-auto max-w-7xl">
                <div className="mx-auto max-w-3xl text-center">
                    <span className="text-sm font-semibold uppercase tracking-wide text-cyan-700 dark:text-cyan-300">Campus operating system</span>
                    <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-5xl dark:text-white">
                        Everything you need to manage a digital campus
                    </h2>
                    <p className="mt-5 text-lg leading-8 text-slate-600 dark:text-slate-300">
                        EduStream gives students, teachers, and administrators one connected space for classes, content, assessment, and communication.
                    </p>
                </div>
                <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-3">
                    {features.map((f, idx) => (
                        <FeatureCard {...f} key={idx} />
                    ))}
                </div>
            </div>
        </section>
    )
}

export default Features
