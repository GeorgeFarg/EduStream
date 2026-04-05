"use client";
import Image from "next/image";
import bannerImg from "./classimage.jpg";

export default function ClassBanner() {
  return (
    <div className="w-full h-48 md:h-64 rounded-2xl overflow-hidden shadow-sm mb-6 relative">
      {/* <Image
        src={bannerImg}
        alt="Class Banner"
        fill
        className="object-cover"
        priority /> */}
      {/* Linear 135deg dark blue gradient background, class name left, illustration right */}
      <div
        className="absolute inset-0 w-full h-full flex items-center justify-between px-8"
        style={{
          background: "linear-gradient(220deg, #2474D2 0%, #18395c 100%)"
        }}
      >
        <h1 className="text-white text-3xl md:text-5xl font-bold drop-shadow-lg bg-black/30 px-6 py-2 rounded-lg">
          Class Name
        </h1>
        <div className="h-32 md:h-44">
          <Image
            src="/hand-drawn-microlearning-illustration.png"
            alt="Microlearning Illustration"
            height={176}
            width={176}
            className="object-contain h-full w-auto"
            priority
          />
        </div>
      </div>
    </div>
  );
}