"use client";

import { useState, useMemo } from "react";
import Navbar from "@/components/sections/classroom/Navbar";
import StatsCard from "@/components/sections/assignments/StatsCard";
import AssignmentCard from "@/components/sections/assignments/AssignmentCard";
import AddAssignmentModal from "@/components/sections/assignments/AddAssignmentModal";
import { Assignment } from "@/types";

interface AssignmentWithStatus extends Assignment {
  status: "pending" | "missing" | "submitted";
}

function calculateStatus(
  dueDate: string,
  submitted: boolean
): "pending" | "missing" | "submitted" {
  if (submitted) return "submitted";

  const now = new Date();
  const due = new Date(dueDate);

  return due < now ? "missing" : "pending";
}

export default function AssignmentsPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [filter] = useState("all");
  const [selected, setSelected] =
    useState<AssignmentWithStatus | null>(null);

  const [submittedIds, setSubmittedIds] = useState<string[]>([]);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const [assignments, setAssignments] = useState<Assignment[]>([
    {
      id: "1",
      title: "Calculator Sheet",
      description:
        "Create a spreadsheet that functions as a simple calculator.",
      dueDate: "2026-03-18T23:59",
       teacherName: "Dr. Ali"
    },
    {
      id: "2",
      title: "Sheet 1 (3rd problem)",
      description: "Solve only the third problem.",
      dueDate: "2026-02-20T23:59",
       teacherName: "Dr. Ahmed "
    },
    {
      id: "3",
      title: "Upload Today Assignment",
      description: "Submit today's task.",
      dueDate: "2026-02-10T23:59",
       teacherName: "Dr. Ahmed Ali"
    },
  ]);

  const assignmentsWithStatus: AssignmentWithStatus[] =
    useMemo(() => {
      return assignments.map((a) => ({
        ...a,
        status: calculateStatus(
          a.dueDate,
          submittedIds.includes(a.id)
        ),
      }));
    }, [assignments, submittedIds]);

  const filteredAssignments = assignmentsWithStatus.filter(
    (a) => {
      if (filter === "all") return true;
      return a.status === filter;
    }
  );

  const handleSubmit = (id: string) => {
    setSubmittedIds((prev) => [...prev, id]);
  };

  const stats = {
    pending: assignmentsWithStatus.filter(
      (a) => a.status === "pending"
    ).length,
    missing: assignmentsWithStatus.filter(
      (a) => a.status === "missing"
    ).length,
    submitted: assignmentsWithStatus.filter(
      (a) => a.status === "submitted"
    ).length,
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-neutral-950 transition-colors">
      <Navbar />

      <div className="max-w-7xl mx-auto px-6 py-10 grid lg:grid-cols-3 gap-8">

        {/* LEFT SIDE */}
        <div className="lg:col-span-2 space-y-8">

          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-semibold text-gray-800 dark:text-white">
                IT 4th EGC Assignments
              </h1>

              <p className="text-gray-500 dark:text-gray-400 mt-1">
                Manage your submissions and feedback
              </p>
            </div>

            <button
              onClick={() => setModalOpen(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-xl hover:scale-105 transition"
            >
              + Add Assignment
            </button>
          </div>

          {/* Stats */}
          <div className="grid md:grid-cols-3 gap-6">
            <StatsCard title="Pending" value={stats.pending} color="blue" />
            <StatsCard title="Submitted" value={stats.submitted} color="green" />
            <StatsCard title="Missing" value={stats.missing} color="red" />
          </div>

          {/* Assignments */}
          <div className="space-y-4">
            {filteredAssignments.map((assignment) => (
              <AssignmentCard
                key={assignment.id}
                assignment={assignment}
                onClick={() => {
                  setSelected(assignment);
                  setUploadedFile(null);
                }}
                onDelete={() =>
                  setAssignments((prev) =>
                    prev.filter((a) => a.id !== assignment.id)
                  )
                }
              />
            ))}
          </div>
        </div>

        {/* RIGHT PANEL */}
        {selected && (
          <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-3xl shadow-xl h-fit sticky top-10 overflow-hidden">

            {/* HEADER */}
            <div className="p-6 border-b border-gray-200 dark:border-neutral-700">

              <div className="flex justify-between items-start">

                <div>
                  <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                    {selected.title}
                  </h2>

                  <p className="text-sm text-gray-500 dark:text-gray-400">
                   {selected.teacherName} •{" "}
                    {new Date(selected.dueDate).toLocaleString()}
                  </p>
                </div>

                <button
                  onClick={() => setSelected(null)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-lg"
                >
                  ✕
                </button>

              </div>

              <div className="flex justify-between items-center mt-4">

                <div className="text-3xl font-bold text-blue-600">
                  100 <span className="text-sm text-gray-500 dark:text-gray-400">points</span>
                </div>

                <span className="bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-xs px-3 py-1 rounded-full">
                  Assigned
                </span>

              </div>
            </div>

            {/* CONTENT */}
            <div className="p-6 space-y-6">

              {/* YOUR WORK */}
              <div className="border border-gray-200 dark:border-neutral-700 rounded-2xl p-4 space-y-4 bg-gray-50 dark:bg-neutral-800">

                <h3 className="font-medium text-gray-700 dark:text-gray-200">
                  Your Work
                </h3>

                {uploadedFile && (
                  <div className="flex items-center justify-between bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 p-3 rounded-xl group">

                    <div className="flex items-center gap-3">
                      <div className="bg-green-100 dark:bg-green-900/30 p-2 rounded-lg">
                        📄
                      </div>

                      <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                        {uploadedFile.name}
                      </span>
                    </div>

                    <button
                      onClick={() => setUploadedFile(null)}
                      className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition"
                    >
                      ✕
                    </button>

                  </div>
                )}

                <label className="w-full border border-dashed border-blue-400 py-3 rounded-xl text-blue-600 dark:text-blue-400 flex justify-center cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20 transition">

                  + Add or create

                  <input
                    type="file"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setUploadedFile(e.target.files[0]);
                      }
                    }}
                  />

                </label>

                <button
                  onClick={() => handleSubmit(selected.id)}
                  className="w-full bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700 transition"
                >
                  Turn in
                </button>

              </div>

              {/* INSTRUCTIONS */}
              <div>

                <h3 className="font-medium mb-2 text-gray-700 dark:text-gray-200">
                  Instructions
                </h3>

                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Create a spreadsheet that functions as a simple calculator.
                  It should support arithmetic operations (+ - * /) using formulas.
                  Ensure proper formatting and labels. Bonus points for
                  conditional formatting on negative results.
                </p>

              </div>

              {/* PRIVATE COMMENTS */}
              <div className="border-t border-gray-200 dark:border-neutral-700 pt-4 space-y-4">

                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  🔒 Private comments
                </h3>

                <div className="flex gap-3">

                  <div className="w-8 h-8 bg-gray-300 dark:bg-neutral-700 rounded-full"></div>

                  <div className="bg-gray-100 dark:bg-neutral-800 p-3 rounded-xl text-sm text-gray-600 dark:text-gray-300">
                    Does the bonus part require specific colors for negative numbers?
                  </div>

                </div>

                <div className="flex gap-2">

                  <input
                    placeholder="Add private comment..."
                    className="flex-1 border border-gray-200 dark:border-neutral-700 rounded-xl px-3 py-2 text-sm bg-white dark:bg-neutral-900 text-gray-700 dark:text-gray-200"
                  />

                  <button className="text-blue-600 dark:text-blue-400">
                    ➤
                  </button>

                </div>

              </div>

            </div>

          </div>
        )}
      </div>

      <AddAssignmentModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onAdd={(data) =>
  setAssignments((prev) => [
    ...prev,
    {
      id: Date.now().toString(),
      ...data,
      teacherName: "Dr. Ahmed Ali",
    },
  ])
}
      />
    </div>
  );
}