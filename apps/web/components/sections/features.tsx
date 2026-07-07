'use client'
import features from "@/constants/features"
import FeatureCard from "../ui/landing-feature-cars"
import { GIFtext } from "../ui/GIFtext"


const Features = () => {


    return (
        <div className="px-4 py-4 bg-dark flex justify-center items-center flex-col">
            <h2 className="text-6xl max-w-6xl text-center mt-24 text-slate-300">
                Everything you need to manage a digital campus
            </h2>
            <h5 className="text-slate-400 mt-8 text-xl text-center"><GIFtext GifName="catjam.gif" width={100} height={100}>EduStream</GIFtext> provides a unified ecosystem for students, teachers, and administrators</h5>
            <div className="mt-24">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">

                    {features.map((f, idx) => (
                        <FeatureCard {...f} key={idx} />
                    ))}

                </div>
            </div>
        </div>
    )
}

export default Features
