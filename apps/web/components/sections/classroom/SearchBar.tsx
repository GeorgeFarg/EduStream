"use client";

import { Search } from "lucide-react";

interface Props {
  value: string;
  onChange: (val: string) => void;
}

export default function SearchBar({ value, onChange }: Props) {
  return (
    <div className="relative w-72">
      <Search
        className="absolute left-3 top-2.5 text-gray-400 dark:text-gray-500"
        size={17}
      />

      <input
        type="text"
        placeholder="Search files..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full pl-10 pr-4 py-2
                   rounded-xl
                   border border-gray-300 dark:border-neutral-700
                   bg-white dark:bg-neutral-900
                   text-gray-800 dark:text-gray-200
                   placeholder-gray-400 dark:placeholder-gray-500
                   focus:ring-2 focus:ring-blue-500
                   outline-none transition"
      />
    </div>
  );
}