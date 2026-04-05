"use client";
import Image from "next/image";
import bannerImg from "./classimage.jpg"; 

export default function ClassBanner() {
  return (
    <div className="w-full h-48 md:h-64 rounded-2xl overflow-hidden shadow-sm mb-6 relative">
      <Image 
        src={bannerImg} 
        alt="Class Banner"
        fill 
        className="object-cover"
        priority   />
    </div>
  );
}