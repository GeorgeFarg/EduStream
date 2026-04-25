"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Week } from "@/types";
import FileCard from "./FileCard";
import FolderCard from "./FolderCard";

interface Props {
  week: Week;
  search: string;
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
  onRenameFolder: (id: string, name: string) => void;
  onDeleteFolder: (weekId: string, folderId: string) => void;
  onUploadFolder: (weekId: string, folderId: string) => void;
}

export default function WeekSection({
  week,
  search,
  onRename,
  onDelete,
  onRenameFolder,
  onDeleteFolder,
  onUploadFolder,
}: Props) {

  const [open, setOpen] = useState(true);

  const filteredFiles = week.files.filter((file) =>
    file.name.toLowerCase().includes(search.toLowerCase())
  );

  const downloadAll = () => {
    week.files.forEach((file) => {
      if (!file.url) return;

      const link = document.createElement("a");
      link.href = file.url;
      link.download = file.name;
      link.click();
    });
  };

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl p-4 transition-colors">

      <div
        className="flex justify-between items-center cursor-pointer mb-4"
        onClick={() => setOpen(!open)}
      >

        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          {week.title}
        </h2>

        <button
          onClick={(e) => {
            e.stopPropagation();
            downloadAll();
          }}
          className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
        >
          Download All
        </button>

      </div>

      <AnimatePresence>
  {open && (
    <>
      {week.files.length === 0 && week.folders.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="border-2 border-dashed border-gray-300 dark:border-zinc-700 
          rounded-xl p-8 text-center text-gray-500 dark:text-gray-400"
        >
          No materials uploaded for this week yet.
        </motion.div>
      ) : (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="grid md:grid-cols-3 gap-6"
        >
          {/* FOLDERS */}
          {week.folders.map((folder) => (
            <FolderCard
              key={folder.id}
              folder={folder}
              weekId={week.id}
              onDelete={onDeleteFolder}
              onUpload={onUploadFolder}
            />
          ))}

          {/* FILES */}
          {filteredFiles.map((file) => (
            <FileCard
              key={file.id}
              file={file}
              onRename={onRename}
              onDelete={onDelete}
            />
          ))}
        </motion.div>
      )}
    </>
  )}
</AnimatePresence>
    </div>
  );
}