"use client";

import Image from "next/image";
import { BookOpen, Radio, Users } from "lucide-react";

export default function ClassBanner({ className }: { className?: string }) {
  return (
    <div className="relative w-full overflow-hidden border-b border-white/10 bg-[#111827]">
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(135deg, rgba(13,127,242,0.25), rgba(22,163,74,0.12) 45%, rgba(17,24,39,0.9))",
        }}
      />

      <div className="relative mx-auto flex min-h-44 max-w-6xl items-center justify-between gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <div className="min-w-0">
          <div className="mb-4 flex flex-wrap items-center gap-2 text-[11px] font-medium uppercase tracking-[0.18em] text-sky-200/80">
            <span className="inline-flex items-center gap-1.5 rounded-md border border-sky-300/20 bg-sky-300/10 px-2 py-1">
              <BookOpen size={12} />
              Classroom
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-md border border-emerald-300/20 bg-emerald-300/10 px-2 py-1">
              <Radio size={12} />
              Live ready
            </span>
          </div>

          <h1 className="max-w-2xl truncate text-3xl font-semibold text-white sm:text-4xl">
            {className || "Class"}
          </h1>
          <p className="mt-2 max-w-xl text-sm text-white/60">
            Stream updates, class chat, meetings, and materials are organized in one focused workspace.
          </p>

          <div className="mt-5 inline-flex items-center gap-2 rounded-md border border-white/10 bg-black/20 px-3 py-2 text-xs text-white/70">
            <Users size={14} className="text-emerald-300" />
            Learning space
          </div>
        </div>

        <div className="hidden h-36 w-36 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/5 p-3 sm:flex">
          <Image
            src="/hand-drawn-microlearning-illustration.png"
            alt="Microlearning Illustration"
            height={144}
            width={144}
            className="h-full w-auto object-contain"
            priority
          />
        </div>
      </div>
    </div>
  );
}
