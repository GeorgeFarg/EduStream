"use client";

import { FileItem } from "@/types";
import {
  FileText,
  Video,
  File,
  FileArchive,
  Presentation,
  Download,
  ExternalLink,
  Pencil,
  Trash2,
} from "lucide-react";
import { useState } from "react";

interface Props {
  file: FileItem;
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
}

export default function FileCard({ file, onRename, onDelete }: Props) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  const icons = {
    pdf: <FileText size={28} className="text-red-500" />,
    video: <Video size={28} className="text-purple-500" />,
    doc: <File size={28} className="text-blue-500" />,
    zip: <FileArchive size={28} className="text-gray-500 dark:text-gray-400" />,
    ppt: <Presentation size={28} className="text-orange-500" />,
    link: <File size={28} className="text-indigo-500" />,
  };

  const handleRename = () => {
    const newName = prompt("New file name:", file.name);
    if (newName && newName.trim() && newName !== file.name) {
      onRename(file.id, newName.trim());
    }
  };

  const handleOpen = () => {
    if (!file.url) return;
    window.open(file.url, "_blank", "noopener,noreferrer");
  };

  const handleDownload = () => {
    if (!file.url) return;
    const a = document.createElement("a");
    a.href = file.url;
    a.download = file.name;
    a.click();
  };

  const handleDelete = () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      // إلغاء الـ confirm بعد 3 ثواني لو ماضغطش تاني
      setTimeout(() => setConfirmDelete(false), 3000);
      return;
    }
    onDelete(file.id);
  };

  return (
    <div className="group bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-2xl p-5 shadow-sm hover:shadow-lg transition flex flex-col gap-4">

      {/* Icon + Name */}
      <div className="flex items-start gap-3">
        <div className="shrink-0 p-2 bg-gray-100 dark:bg-neutral-800 rounded-xl">
          {icons[file.type]}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-gray-800 dark:text-white leading-snug break-words">
            {file.name}
          </h3>
          <div className="flex gap-3 text-xs text-gray-400 dark:text-gray-500 mt-1">
            <span>{file.size}</span>
            <span>·</span>
            <span>{file.uploadDate}</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 mt-auto pt-3 border-t border-gray-100 dark:border-neutral-800">

        {/* Open */}
        <button
          onClick={handleOpen}
          disabled={!file.url}
          title="Open"
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg
                     bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400
                     hover:bg-blue-100 dark:hover:bg-blue-900/40
                     disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          <ExternalLink size={13} />
          Open
        </button>

        {/* Download */}
        <button
          onClick={handleDownload}
          disabled={!file.url}
          title="Download"
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg
                     bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400
                     hover:bg-green-100 dark:hover:bg-green-900/40
                     disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          <Download size={13} />
          Download
        </button>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Rename */}
        <button
          onClick={handleRename}
          title="Rename"
          className="p-1.5 rounded-lg text-gray-400 hover:text-blue-500
                     hover:bg-blue-50 dark:hover:bg-blue-900/20 transition"
        >
          <Pencil size={14} />
        </button>

        {/* Delete — double-click confirmation */}
        <button
          onClick={handleDelete}
          title={confirmDelete ? "Click again to confirm" : "Delete"}
          className={`flex items-center gap-1 p-1.5 rounded-lg transition text-xs font-medium
            ${
              confirmDelete
                ? "bg-red-500 text-white px-2"
                : "text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
            }`}
        >
          <Trash2 size={14} />
          {confirmDelete && "Sure?"}
        </button>

      </div>
    </div>
  );
}