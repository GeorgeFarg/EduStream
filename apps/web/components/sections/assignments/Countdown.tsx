"use client";

import { useEffect, useState } from "react";

export default function Countdown({ dueDate }: { dueDate: string }) {

  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {

    const interval = setInterval(() => {

      const now = new Date().getTime();
      const due = new Date(dueDate).getTime();
      const diff = due - now;

      if (diff <= 0) {
        setTimeLeft("Expired");
        clearInterval(interval);
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);

      setTimeLeft(`${days}d ${hours}h left`);

    }, 1000);

    return () => clearInterval(interval);

  }, [dueDate]);

  return (
    <span
      className={`font-medium ${
        timeLeft === "Expired"
          ? "text-red-600 dark:text-red-400"
          : "text-red-500 dark:text-red-400"
      }`}
    >
      {timeLeft}
    </span>
  );
}

