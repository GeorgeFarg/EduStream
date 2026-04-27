"use client";

import { useState, useEffect } from "react";
import { Assignment } from "@/types";

interface Props {
  open: boolean;
  assignment: Assignment | null;
  onClose: () => void;
  onSave: (data: { title: string; description: string; dueDate: string }) => Promise<void>;
  loading?: boolean;
  serverError?: string | null;
}

export default function EditAssignmentModal({
  open,
  assignment,
  onClose,
  onSave,
  loading = false,
  serverError = null,
}: Props) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  // ابدأ الـ form بقيم الـ assignment الحالية
  useEffect(() => {
    if (assignment) {
      setTitle(assignment.title);
      setDescription(assignment.description);
      // حوّل الـ ISO string لـ datetime-local format
      setDueDate(assignment.dueDate.slice(0, 16));
    }
  }, [assignment]);

  if (!open || !assignment) return null;

  const handleSave = async () => {
    if (!title.trim() || !dueDate) {
      setValidationError("Title and due date are required.");
      return;
    }
    setValidationError(null);
    await onSave({ title: title.trim(), description: description.trim(), dueDate });
  };

  const displayError = validationError ?? serverError;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-md p-8 space-y-5">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
            Edit Assignment
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            ✕
          </button>
        </div>

        {displayError && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3 text-sm text-red-600 dark:text-red-400">
            {displayError}
          </div>
        )}

        <input
          placeholder="Title *"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full border border-gray-200 dark:border-neutral-700 rounded-xl px-4 py-3 text-sm bg-white dark:bg-neutral-800 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <textarea
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full border border-gray-200 dark:border-neutral-700 rounded-xl px-4 py-3 text-sm bg-white dark:bg-neutral-800 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />

        <div>
          <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">
            Due Date *
          </label>
          <input
            type="datetime-local"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full border border-gray-200 dark:border-neutral-700 rounded-xl px-4 py-3 text-sm bg-white dark:bg-neutral-800 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <button
          onClick={handleSave}
          disabled={loading}
          className="w-full bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading && (
            <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
          )}
          {loading ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
}