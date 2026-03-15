"use client";

import { useState } from "react";
import Navbar from "@/components/sections/classroom/Navbar";
import SearchBar from "@/components/sections/classroom/SearchBar";
import UploadBox from "@/components/sections/classroom/UploadBox";
import WeekSection from "@/components/sections/classroom/WeekSection";
import { Week, FileItem, FileType, Folder } from "@/types";

const initialWeeks: Week[] = [
  { id: "1", title: "Week 1", folders: [], files: [] },
  { id: "2", title: "Week 2", folders: [], files: [] },
  { id: "3", title: "Week 3", folders: [], files: [] },
];

export default function MaterialsPage() {

  const [weeks, setWeeks] = useState<Week[]>(initialWeeks);
  const [search, setSearch] = useState("");
  const [selectedWeek, setSelectedWeek] = useState("1");

  /* ===============================
     Map MIME type → FileType
  =============================== */

  const mapFileType = (type: string): FileType => {
    if (type.includes("pdf")) return "pdf";
    if (type.includes("word")) return "doc";
    if (type.includes("video")) return "video";
    if (type.includes("presentation")) return "ppt";
    if (type.includes("zip")) return "zip";
    return "link";
  };

  /* ===============================
     Upload Files
  =============================== */

  const handleUpload = (files: File[], weekId: string) => {

    const formatted: FileItem[] = files.map((file) => ({
      id: crypto.randomUUID(),
      name: file.name,
      size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
      type: mapFileType(file.type),
      uploadDate: "Today",
      url: URL.createObjectURL(file),
    }));

    setWeeks((prev) =>
      prev.map((week) =>
        week.id === weekId
          ? { ...week, files: [...week.files, ...formatted] }
          : week
      )
    );
  };

  /* ===============================
     File Actions
  =============================== */

  const renameFile = (fileId: string, newName: string) => {

    setWeeks((prev) =>
      prev.map((week) => ({
        ...week,
        files: week.files.map((file) =>
          file.id === fileId ? { ...file, name: newName } : file
        ),
      }))
    );
  };

  const deleteFile = (fileId: string) => {

    setWeeks((prev) =>
      prev.map((week) => ({
        ...week,
        files: week.files.filter((file) => file.id !== fileId),
      }))
    );
  };

  /* ===============================
     Add Week OR Folder
  =============================== */

  const addFolderOrWeek = () => {

    const action = prompt(
`What do you want to create?

1 = Add Week
2 = Add Folder inside selected week`
    );

    if (action === "1") addWeek();
    if (action === "2") addFolder();
  };

  /* ===============================
     Add Week
  =============================== */

  const addWeek = () => {

    const nextWeekNumber = weeks.length + 1;

    const name = prompt(
      `Write the name for Week ${nextWeekNumber}\nExample: Algorithms`
    );

    const newWeek: Week = {
      id: crypto.randomUUID(),
      title: name
        ? `Week ${nextWeekNumber} - ${name}`
        : `Week ${nextWeekNumber}`,
      folders: [],
      files: [],
    };

    setWeeks((prev) => [...prev, newWeek]);
  };

  /* ===============================
     Add Folder
  =============================== */

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

    setWeeks((prev) =>
      prev.map((week) =>
        week.id === selectedWeek
          ? { ...week, folders: [...week.folders, newFolder] }
          : week
      )
    );
  };

  /* ===============================
     Delete Folder
  =============================== */

  const deleteFolder = (weekId: string, folderId: string) => {

    setWeeks((prev) =>
      prev.map((week) =>
        week.id === weekId
          ? {
              ...week,
              folders: week.folders.filter((f) => f.id !== folderId),
            }
          : week
      )
    );
  };

  /* ===============================
     Upload to Folder
  =============================== */

  const uploadToFolder = (weekId: string, folderId: string) => {

    const input = document.createElement("input");
    input.type = "file";
    input.multiple = true;

    input.onchange = (e: any) => {

      const files: File[] = Array.from(e.target.files);

      const formatted: FileItem[] = files.map((file) => ({
        id: crypto.randomUUID(),
        name: file.name,
        size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
        type: mapFileType(file.type),
        uploadDate: "Today",
        url: URL.createObjectURL(file),
      }));

      setWeeks((prev) =>
        prev.map((week) => {

          if (week.id !== weekId) return week;

          return {
            ...week,
            folders: week.folders.map((folder) =>
              folder.id === folderId
                ? { ...folder, files: [...folder.files, ...formatted] }
                : folder
            ),
          };

        })
      );
    };

    input.click();
  };

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
              {weeks.map((week) => (
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

        {/* Upload */}

        <UploadBox
          weeks={weeks}
          selectedWeek={selectedWeek}
          onUpload={handleUpload}
        />

        {/* Weeks */}

        <div className="space-y-10 mt-8">

          {weeks.map((week) => (
            <WeekSection
              key={week.id}
              week={week}
              search={search}
              onRename={renameFile}
              onDelete={deleteFile}
              onRenameFolder={() => {}}
              onDeleteFolder={deleteFolder}
              onUploadFolder={uploadToFolder}
            />
          ))}

        </div>

      </div>

    </div>
  );
}