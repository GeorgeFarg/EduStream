"use client";

import { useState } from "react";
import Navbar from "@/components/sections/classroom/Navbar";
import SearchBar from "@/components/sections/classroom/SearchBar";
import UploadBox from "@/components/sections/classroom/UploadBox";
import WeekSection from "@/components/sections/classroom/WeekSection";
import { useMaterials } from "@/hooks/useMaterials";
import { mapCategoryToFileType } from "@/lib/materials";
import { FileItem, Folder, Week } from "@/types";

const CLASS_ID = 1;

// ─── Loading Skeleton ─────────────────────────────────────────────────────────

function MaterialsSkeleton() {
  return (
    <div className="space-y-10 mt-8 animate-pulse">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="bg-white dark:bg-zinc-900 rounded-xl p-4"
        >
          <div className="h-6 w-40 bg-gray-200 dark:bg-neutral-700 rounded mb-6" />
          <div className="grid md:grid-cols-3 gap-6">
            {[1, 2, 3].map((j) => (
              <div
                key={j}
                className="h-36 bg-gray-100 dark:bg-neutral-800 rounded-2xl"
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MaterialsPage() {
  const {
    weeks,
    loading,
    error,
    uploading,
    uploadError,
    uploadMaterial,
    deleteFileFromWeek,
    renameFileInWeek,
    refetch,
  } = useMaterials();

  const [search, setSearch] = useState("");
  const [selectedWeek, setSelectedWeek] = useState("pdf"); // default category

  // ── Folder state (local-only — backend لا يدعم folders بعد) ─────────────────
  const [localFolders, setLocalFolders] = useState<Record<string, Folder[]>>({});

  // ─── الـ weeks مع الـ local folders مدموجين ──────────────────────────────────
  const mergedWeeks: Week[] = weeks.map((w) => ({
    ...w,
    folders: localFolders[w.id] ?? [],
  }));

  // ─── Upload Handler ───────────────────────────────────────────────────────────

  const handleUpload = async (files: File[], weekId: string) => {
    for (const file of files) {
      await uploadMaterial({
        title: file.name,
        category: weekId, // weekId = category
        classId: CLASS_ID,
        file,
      });
    }
  };

  // ─── Add Week / Folder ────────────────────────────────────────────────────────

  const addFolderOrWeek = () => {
    const action = prompt(
      `What do you want to create?\n\n1 = Add Category (Week)\n2 = Add Folder inside selected category`
    );
    if (action === "1") addWeek();
    if (action === "2") addFolder();
  };

  const addWeek = () => {
    const name = prompt("Category name (e.g. pdf, video, doc)");
    if (!name) return;
    // Weeks جاية من الـ API — لو category جديد هيظهر بعد أول upload فيه
    alert(
      `Category "${name}" will appear automatically after you upload a file with this category.`
    );
  };

  const addFolder = () => {
    const name = prompt("Folder name");
    if (!name) return;
    const newFolder: Folder = {
      id: crypto.randomUUID(),
      name,
      createdAt: new Date().toISOString(),
      files: [],
      folders: [],
    };
    setLocalFolders((prev) => ({
      ...prev,
      [selectedWeek]: [...(prev[selectedWeek] ?? []), newFolder],
    }));
  };

  // ─── Folder Actions ───────────────────────────────────────────────────────────

  const deleteFolder = (weekId: string, folderId: string) => {
    setLocalFolders((prev) => ({
      ...prev,
      [weekId]: (prev[weekId] ?? []).filter((f) => f.id !== folderId),
    }));
  };

  const uploadToFolder = (weekId: string, folderId: string) => {
    const input = document.createElement("input");
    input.type = "file";
    input.multiple = true;
    input.onchange = async (e: any) => {
      const files: File[] = Array.from(e.target.files);
      const formatted: FileItem[] = files.map((file) => ({
        id: crypto.randomUUID(),
        name: file.name,
        size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
        type: mapCategoryToFileType(file.type),
        uploadDate: "Today",
        url: URL.createObjectURL(file),
      }));
      setLocalFolders((prev) => ({
        ...prev,
        [weekId]: (prev[weekId] ?? []).map((f) =>
          f.id === folderId
            ? { ...f, files: [...f.files, ...formatted] }
            : f
        ),
      }));
    };
    input.click();
  };

  // ─── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-neutral-900 transition-colors">
      <Navbar />

      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* Header */}
        <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-semibold text-gray-800 dark:text-white">
              Course Materials
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              Manage and access all lecture notes and files.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <SearchBar value={search} onChange={setSearch} />

            <select
              value={selectedWeek}
              onChange={(e) => setSelectedWeek(e.target.value)}
              className="px-3 py-2 rounded-xl border bg-white dark:bg-neutral-800 dark:border-neutral-700 dark:text-white"
            >
              {mergedWeeks.map((week) => (
                <option key={week.id} value={week.id}>
                  {week.title}
                </option>
              ))}
            </select>

            <button
              onClick={addFolderOrWeek}
              className="bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition"
            >
              + Add Folder
            </button>
          </div>
        </div>

        {/* Upload Error */}
        {uploadError && (
          <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 text-red-600 dark:text-red-400 text-sm">
            ⚠️ {uploadError}
          </div>
        )}

        {/* Upload Box */}
        <div className="relative">
          <UploadBox
            weeks={mergedWeeks}
            selectedWeek={selectedWeek}
            onUpload={handleUpload}
          />
          {/* Loading overlay أثناء الرفع */}
          {uploading && (
            <div className="absolute inset-0 bg-white/60 dark:bg-neutral-900/60 rounded-2xl flex items-center justify-center">
              <div className="flex items-center gap-3 text-blue-600 dark:text-blue-400 font-medium">
                <svg
                  className="animate-spin h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8z"
                  />
                </svg>
                Uploading...
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        {loading ? (
          <MaterialsSkeleton />
        ) : error ? (
          <div className="mt-8 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-6 text-center">
            <p className="text-red-600 dark:text-red-400 font-medium">{error}</p>
            <button
              onClick={refetch}
              className="mt-3 text-sm text-red-500 underline hover:text-red-700"
            >
              Try again
            </button>
          </div>
        ) : (
          <div className="space-y-10 mt-8">
            {mergedWeeks.map((week) => (
              <WeekSection
                key={week.id}
                week={week}
                search={search}
                onRename={renameFileInWeek}
                onDelete={deleteFileFromWeek}
                onRenameFolder={() => {}}
                onDeleteFolder={deleteFolder}
                onUploadFolder={uploadToFolder}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}