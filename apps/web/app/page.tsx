'use client'
import Hero from "@/components/sections/hero";
import Features from "@/components/sections/features";
import { Testimonials } from "@/components/sections/Testimonials";
import Footer from "@/components/sections/footer";
import NavBar from "@/components/NavBar";

export default function Home() {
  return (
    <>
      <NavBar />
      <Hero />
      <Features />
      <Testimonials />
      <section className="bg-[#10251f] px-4 py-20 text-center text-white">
        <h2 className="mx-auto max-w-3xl text-3xl font-bold tracking-tight sm:text-5xl">Start your digital transformation</h2>
        <p className="mx-auto mt-5 mb-10 max-w-2xl text-lg leading-8 text-white/80">
          Join universities modernizing education delivery. Schedule a personalized demo for your team today.
        </p>
        <div className="flex flex-col justify-center gap-3 sm:flex-row">
          <button className="rounded-md bg-white px-5 py-3 font-bold text-[#10251f] transition hover:bg-slate-100">Contact Sales</button>
          <button className="rounded-md border border-white/30 px-5 py-3 font-bold text-white transition hover:bg-white/10">View Pricing</button>
        </div>
      </section>
      <Footer />
    </>
  );
}
