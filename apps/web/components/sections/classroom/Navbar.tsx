"use client";

import Link from "next/link";
import { Bell, Moon, Sun } from "lucide-react";
import { useState } from "react";
import Logo from "@/components/ui/Logo";

export default function Navbar() {

  const [dark, setDark] = useState(false);

  const toggleDark = () => {
    setDark(!dark);
    document.documentElement.classList.toggle("dark");
  };

  return (
    <nav className="bg-white dark:bg-neutral-900 border-b border-gray-200 dark:border-neutral-700 sticky top-0 z-50 shadow-sm">

      <div className="max-w-7xl mx-auto px-6">

        <div className="flex justify-between h-16 items-center">

          {/* LEFT */}
          <div className="flex items-center gap-10">

            <Logo />

            <div className="hidden md:flex gap-8 text-sm">

              <Link
                href="#"
                className="text-gray-600 dark:text-gray-300 hover:text-blue-600"
              >
                Stream
              </Link>

              <Link
                href="/classroom/materials"
                className="text-gray-600 dark:text-gray-300 hover:text-blue-600"
              >
                Materials Hub
              </Link>

              <Link
                href="/classroom/assignments"
                className="text-gray-600 dark:text-gray-300 hover:text-blue-600"
              >
                Assignments
              </Link>

              <Link
                href="#"
                className="text-gray-600 dark:text-gray-300 hover:text-blue-600"
              >
                People
              </Link>

            </div>
          </div>

          {/* RIGHT */}
          <div className="flex items-center gap-4">

            <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-neutral-700 text-gray-600 dark:text-gray-300">
              <Bell size={20} />
            </button>

            <button
              onClick={toggleDark}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-neutral-700 text-gray-600 dark:text-gray-300"
            >
              {dark ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">
              ES
            </div>

          </div>

        </div>

      </div>

    </nav>
  );
}