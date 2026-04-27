// app/assignments/page.tsx
"use client";

import { useState, useMemo } from "react";
import Navbar from "@/components/sections/classroom/Navbar";
import StatsCard from "@/components/sections/assignments/StatsCard";
import AssignmentCard from "@/components/sections/assignments/AssignmentCard";
import AddAssignmentModal from "@/components/sections/assignments/AddAssignmentModal";
import AssignmentSkeleton from "@/components/sections/assignments/AssignmentSkeleton";
import { useAssignments } from "@/hooks/useAssignments";
import { Assignment } from "@/types";
import { CreateAssignmentPayload ,submitAssignment, deleteAssignment as deleteAssignmentApi,updateAssignment } from "@/lib/assignments";
import EditAssignmentModal from "@/components/sections/assignments/EditAssignmentModal";


// ─── Types ────────────────────────────────────────────────────────────────────

interface AssignmentWithStatus extends Assignment {
  status: "pending" | "missing" | "submitted";
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function calculateStatus(
  dueDate: string,
  submitted: boolean
): "pending" | "missing" | "submitted" {
  if (submitted) return "submitted";
  const now = new Date();
  const due = new Date(dueDate);
  return due < now ? "missing" : "pending";
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const CLASS_ID = 1; // Replace with dynamic value from route/context if needed

export default function AssignmentsPage() {
const { assignments, submittedIds, loading, error, addAssignment, deleteAssignment, markSubmitted, updateAssignmentInState: updateAssignmentInState } =
  useAssignments(CLASS_ID);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const [filter] = useState("all");
  const [selected, setSelected] = useState<AssignmentWithStatus | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  // ── Derived state ──────────────────────────────────────────────────────────

  const assignmentsWithStatus: AssignmentWithStatus[] = useMemo(() => {
    return assignments.map((a) => ({
      ...a,
      status: calculateStatus(a.dueDate, submittedIds.includes(a.id)),
    }));
  }, [assignments, submittedIds]);

  const filteredAssignments = assignmentsWithStatus.filter((a) => {
    if (filter === "all") return true;
    return a.status === filter;
  });

  const stats = {
    pending: assignmentsWithStatus.filter((a) => a.status === "pending").length,
    missing: assignmentsWithStatus.filter((a) => a.status === "missing").length,
    submitted: assignmentsWithStatus.filter((a) => a.status === "submitted").length,
  };

const [editModalOpen, setEditModalOpen] = useState(false);
const [editTarget, setEditTarget] = useState<Assignment | null>(null);
const [editLoading, setEditLoading] = useState(false);
const [editError, setEditError] = useState<string | null>(null);

  
  // ── Handlers ───────────────────────────────────────────────────────────────
const handleSubmit = async (id: string) => {
  if (!uploadedFile) {
    alert("Please upload a file first.");
    return;
  }

  try {
    await submitAssignment(id, uploadedFile);
    markSubmitted(id);
    setUploadedFile(null);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Submission failed";
    if (message.includes("already exists") || message.includes("409")) {
      markSubmitted(id);
    } else {
      alert(message);
    }
  }
};
  /**
   * Called by AddAssignmentModal — data comes as { title, description, dueDate, file? }
   * We add classId here before sending to the API layer.
   */
  const handleAddAssignment = async (data: {
    title: string;
    description: string;
    dueDate: string;
    file?: File | null;
  }) => {
    setModalLoading(true);
    setModalError(null);

    const payload: CreateAssignmentPayload = {
      title: data.title,
      description: data.description,
      dueDate: data.dueDate,
      classId: CLASS_ID,
      file: data.file ?? null,
    };

    try {
      await addAssignment(payload);
      setModalOpen(false); // close modal on success
    } catch (err) {
      setModalError(
        err instanceof Error ? err.message : "Failed to add assignment"
      );
    } finally {
      setModalLoading(false);
    }
  };
  const handleDelete = async (id: string) => {
  try {
    await deleteAssignmentApi(id);
    deleteAssignment(id); // يشيله من الـ UI
  } catch (err) {
    alert(err instanceof Error ? err.message : "Delete failed");
  }
};

const handleEdit = async (data: { title: string; description: string; dueDate: string }) => {
  if (!editTarget) return;
  setEditLoading(true);
  setEditError(null);
  try {
    const updated = await updateAssignment(editTarget.id, data); // API call
    updateAssignmentInState(updated);                          
    setEditModalOpen(false);
  } catch (err) {
    setEditError(err instanceof Error ? err.message : "Update failed");
  } finally {
    setEditLoading(false);
  }
};

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-neutral-950 transition-colors">
      <Navbar />

      <div className="max-w-7xl mx-auto px-6 py-10 grid lg:grid-cols-3 gap-8">

        {/* ── LEFT SIDE ──────────────────────────────────────────────────── */}
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
              onClick={() => {
                setModalError(null);
                setModalOpen(true);
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded-xl hover:scale-105 transition"
            >
              + Add Assignment
            </button>
          </div>

          {/* Stats */}
          <div className="grid md:grid-cols-3 gap-6">
            <StatsCard title="Pending"   value={stats.pending}   color="blue"  />
            <StatsCard title="Submitted" value={stats.submitted} color="green" />
            <StatsCard title="Missing"   value={stats.missing}   color="red"   />
          </div>

          {/* Assignments list */}
          {loading ? (
            <AssignmentSkeleton />
          ) : error ? (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-6 text-center">
              <p className="text-red-600 dark:text-red-400 font-medium">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-3 text-sm text-red-500 underline hover:text-red-700"
              >
                Try again
              </button>
            </div>
          ) : filteredAssignments.length === 0 ? (
            <div className="text-center py-16 text-gray-400 dark:text-gray-600">
              <p className="text-lg">No assignments yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredAssignments.map((assignment) => (
                <AssignmentCard
                  key={assignment.id}
                  assignment={assignment}
                  onClick={() => {
                    setSelected(assignment);
                    setUploadedFile(null);
                  }}
                  onDelete={() => handleDelete(assignment.id)}
                  onEdit={() => {
                  setEditTarget(assignment);
                  setEditModalOpen(true);
}}
                />
              ))}
            </div>
          )}
        </div>

        {/* ── RIGHT PANEL ─────────────────────────────────────────────────── */}
        {selected && (
          <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-3xl shadow-xl h-fit sticky top-10 overflow-hidden">

            {/* Header */}
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
                  100{" "}
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    points
                  </span>
                </div>
                <span className="bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-xs px-3 py-1 rounded-full">
                  Assigned
                </span>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">

              {/* Your Work */}
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
                      if (e.target.files?.[0]) {
                        setUploadedFile(e.target.files[0]);
                      }
                    }}
                  />
                </label>

              <button
                onClick={() => handleSubmit(selected.id)}
                disabled={selected.status === "submitted"}
                className="w-full bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {selected.status === "submitted" ? "✓ Submitted" : "Turn in"}
              </button>
              </div>

              {/* Instructions */}
              <div>
                <h3 className="font-medium mb-2 text-gray-700 dark:text-gray-200">
                  Instructions
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {selected.description}
                </p>
              </div>

              {/* Private Comments */}
              <div className="border-t border-gray-200 dark:border-neutral-700 pt-4 space-y-4">
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  🔒 Private comments
                </h3>

                <div className="flex gap-3">
                  <div className="w-8 h-8 bg-gray-300 dark:bg-neutral-700 rounded-full" />
                  <div className="bg-gray-100 dark:bg-neutral-800 p-3 rounded-xl text-sm text-gray-600 dark:text-gray-300">
                    Does the bonus part require specific colors for negative numbers?
                  </div>
                </div>

                <div className="flex gap-2">
                  <input
                    placeholder="Add private comment..."
                    className="flex-1 border border-gray-200 dark:border-neutral-700 rounded-xl px-3 py-2 text-sm bg-white dark:bg-neutral-900 text-gray-700 dark:text-gray-200"
                  />
                  <button className="text-blue-600 dark:text-blue-400">➤</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add Assignment Modal */}
      <AddAssignmentModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setModalError(null);
        }}
        loading={modalLoading}
        serverError={modalError}
        onAdd={handleAddAssignment}
      />
      <EditAssignmentModal
      open={editModalOpen}
      assignment={editTarget}
      onClose={() => { setEditModalOpen(false); setEditError(null); }}
      onSave={handleEdit}
      loading={editLoading}
      serverError={editError}
    />
    </div>
  );
}