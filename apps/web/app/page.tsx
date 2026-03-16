'use client'
import Hero from "@/components/sections/hero";
import Features from "@/components/sections/features";
import { Testimonials } from "@/components/sections/Testimonials";
import Footer from "@/components/sections/footer";
import NavBar from "@/components/NavBar";
import { GIFtext } from "@/components/ui/GIFtext";

export default function Home() {
  return (
    <>
      <NavBar />
      <Hero />
      <Features />
      <Testimonials />
      {/* Small section not worth seperation */}
      <div className="dark:bg-main py-20 px-6 text-center">
        <h2 className="text-5xl font-bold text-center mt-5">Start Your Digital Transformation</h2>
        <p className="text-xl text-white/90 mb-10 max-w-2xl mx-auto text-center mt-3">
          Join over 500 universities modernizing their education delivery. Schedule a <GIFtext GifName="best-banana-cat.gif" width={70} height={70}>personalized</GIFtext> demo for your team today.
        </p>
        <div className="flex gap-6 justify-center">
          <button className="bg-white text-main px-4 py-2 rounded-md font-bold">Contact Sales</button>
          <button className="border px-4 py-2 rounded-md font-bold">View Prices</button>
        </div>
      </div>
      <Footer />
    </>
  );
}