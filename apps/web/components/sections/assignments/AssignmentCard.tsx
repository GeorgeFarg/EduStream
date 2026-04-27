"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { MoreVertical } from "lucide-react";
import Countdown from "./Countdown";
import { Assignment } from "@/types";

interface Props {
  assignment: Assignment & {
    status: "pending" | "missing" | "submitted";
  };
  onClick: () => void;
  onDelete: () => void;
  onEdit: () => void;
}

export default function AssignmentCard({
  assignment,
  onClick,
  onDelete,
  onEdit,
}: Props) {

  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      transition={{ type: "spring", stiffness: 260 }}
      onClick={() => {
        if (!menuOpen) onClick();
      }}
      className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-2xl p-5 shadow-sm hover:shadow-md transition cursor-pointer relative"
    >

      <div className="flex justify-between items-start">

        <div>
          <h3 className="font-medium text-gray-800 dark:text-white">
            {assignment.title}
          </h3>

          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {assignment.description}
          </p>
        </div>

        <div className="flex items-center gap-3 relative">

          <span
            className={`px-3 py-1 rounded-full text-xs font-medium
            ${
              assignment.status === "missing"
                ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                : assignment.status === "submitted"
                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
            }`}
          >
            {assignment.status}
          </span>

          <button
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen(!menuOpen);
            }}
            className="p-1 rounded hover:bg-gray-200 dark:hover:bg-neutral-700 text-gray-600 dark:text-gray-300"
          >
            <MoreVertical size={18} />
          </button>

          {menuOpen && (
            <div
              onClick={(e) => e.stopPropagation()}
              className="absolute right-0 top-8 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 shadow-lg rounded-xl w-32 p-2 text-sm z-20"
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen(false);
                  onEdit(); // ← أضف
                }}
                className="block w-full text-left px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-neutral-700 text-gray-700 dark:text-gray-200"
              >
                Edit
              </button>

              <button
                      onClick={(e) => {
                      e.stopPropagation();
                      onDelete();
                    }}
                className="block w-full text-left px-2 py-1 text-red-500 rounded hover:bg-gray-100 dark:hover:bg-neutral-700"
              >
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 flex justify-between items-center text-sm text-gray-500 dark:text-gray-400">
        <span>
          Due {new Date(assignment.dueDate).toLocaleDateString()}
        </span>

        <Countdown dueDate={assignment.dueDate} />
      </div>

    </motion.div>
  );
}

