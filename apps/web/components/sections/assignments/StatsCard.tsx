"use client";

import { Clock, CheckCircle, AlertTriangle } from "lucide-react";

interface Props {
  title: string;
  value: number;
  color: "blue" | "green" | "red";
}

export default function StatsCard({ title, value, color }: Props) {

  const styles = {
    blue: {
      bg: "bg-blue-100 dark:bg-blue-900/30",
      text: "text-blue-600 dark:text-blue-400",
      icon: <Clock size={20} />
    },
    green: {
      bg: "bg-green-100 dark:bg-green-900/30",
      text: "text-green-600 dark:text-green-400",
      icon: <CheckCircle size={20} />
    },
    red: {
      bg: "bg-red-100 dark:bg-red-900/30",
      text: "text-red-600 dark:text-red-400",
      icon: <AlertTriangle size={20} />
    }
  };

  const current = styles[color];

  return (
    <div className="bg-white dark:bg-neutral-900 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-neutral-700 flex items-center justify-between">

      <div>
        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
          {title}
        </p>

        <p className="text-2xl font-bold mt-1 text-gray-800 dark:text-white">
          {value}
        </p>
      </div>

      <div className={`${current.bg} p-2 rounded-lg ${current.text}`}>
        {current.icon}
      </div>

    </div>
  );
}

