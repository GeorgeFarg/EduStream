"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  open: boolean;
  onClose: () => void;
  onAdd: (data: {
    title: string;
    description: string;
    dueDate: string;
  }) => void;
}

export default function AddAssignmentModal({
  open,
  onClose,
  onAdd,
}: Props) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");

  const handleSubmit = () => {
    if (!title || !dueDate) return;
    onAdd({ title, description, dueDate });
    onClose();
    setTitle("");
    setDescription("");
    setDueDate("");
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.9 }}
            className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-2xl p-6 w-full max-w-md shadow-xl"
          >
            <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">
              Add Assignment
            </h2>

            <input
              placeholder="Title"
              className="w-full mb-3 p-2 rounded-xl border border-gray-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-gray-800 dark:text-white"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />

            <textarea
              placeholder="Description"
              className="w-full mb-3 p-2 rounded-xl border border-gray-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-gray-800 dark:text-white"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />

            <input
              type="datetime-local"
              className="w-full mb-4 p-2 rounded-xl border border-gray-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-gray-800 dark:text-white"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />

            <div className="flex justify-end gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-gray-200 dark:bg-neutral-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-neutral-600 transition"
              >
                Cancel
              </button>

              <button
                onClick={handleSubmit}
                className="px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition"
              >
                Add
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

