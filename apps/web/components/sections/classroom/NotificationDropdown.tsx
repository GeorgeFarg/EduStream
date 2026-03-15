"use client";

import { motion, AnimatePresence } from "framer-motion";

interface Props {
  open: boolean;
}

export default function NotificationDropdown({ open }: Props) {

  const notifications = [
    "New assignment added",
    "Deadline approaching",
    "New material uploaded",
  ];

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="absolute right-0 top-12 w-72
                     bg-white dark:bg-neutral-900
                     border border-gray-200 dark:border-neutral-700
                     shadow-xl rounded-2xl p-4 z-50"
        >

          <h3 className="font-semibold mb-3 text-gray-800 dark:text-white">
            Notifications
          </h3>

          {notifications.map((note, i) => (
            <div
              key={i}
              className="p-2 rounded-xl
                         text-gray-700 dark:text-gray-300
                         hover:bg-gray-100 dark:hover:bg-neutral-700
                         text-sm cursor-pointer transition"
            >
              {note}
            </div>
          ))}

        </motion.div>
      )}
    </AnimatePresence>
  );
}