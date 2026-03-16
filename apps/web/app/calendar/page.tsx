"use client";
import React, { useState } from 'react';
import { DayPicker } from 'react-day-picker';
import { Calendar as CalendarIcon, ArrowLeft, Bell } from "lucide-react";
import Link from "next/link";
import 'react-day-picker/dist/style.css';

export default function CalendarPage() {
  const [selected, setSelected] = useState<Date | undefined>(new Date());

  return (
    <div className="flex min-h-screen bg-[#050505] text-white">
      {/* سايد بار جانبي مصغر لصفحة الكالندر فقط - اختياري */}
      <aside className="w-20 border-r border-white/5 flex flex-col items-center py-8 gap-8 bg-dark">
        <div className="text-main"><CalendarIcon size={28} /></div>
        <Link href="/" className="text-white/30 hover:text-white transition-colors">
          <ArrowLeft size={24} />
        </Link>
      </aside>

      {/* المحتوى الرئيسي */}
      <main className="flex-1 flex flex-col">
        {/* Header علوي */}
        <header className="h-20 border-b border-white/5 flex items-center justify-between px-10">
          <h2 className="text-xl font-bold tracking-tighter">MY SCHEDULE</h2>
          <button className="p-2 hover:bg-white/5 rounded-full"><Bell size={20} /></button>
        </header>

        {/* منطقة التقويم */}
        <div className="p-10 flex flex-col lg:flex-row gap-10">
          <div className="bg-[#111111] p-8 rounded-[2rem] border border-white/5 shadow-2xl">
            <DayPicker
              mode="single"
              selected={selected}
              onSelect={setSelected}
              className="rdp-custom"
              // هنا بنتحكم في الثيم بتاع الكالندر ليكون متناسق مع اللون الأزرق بتاعك
              modifiersStyles={{
                selected: { backgroundColor: '#0d7ff2', borderRadius: '50%' },
                today: { color: '#0d7ff2', border: '2px solid #0d7ff2' }
              }}
            />
          </div>

          {/* قسم التفاصيل والمواعيد */}
          <div className="flex-1 space-y-6">
             <h3 className="text-2xl font-light text-white/80">
                Events for <span className="text-main font-bold">{selected?.toDateString()}</span>
             </h3>
             <div className="grid gap-4">
                <div className="p-6 bg-white/5 rounded-2xl border-l-4 border-main">
                  <p className="font-bold">Project Review</p>
                  <p className="text-sm text-white/40">10:00 AM - 11:30 AM</p>
                </div>
                <div className="p-6 bg-white/5 rounded-2xl border-l-4 border-white/10 opacity-50">
                  <p className="font-bold text-white/60">No other events</p>
                </div>
             </div>
          </div>
        </div>
      </main>
    </div>
  );
}