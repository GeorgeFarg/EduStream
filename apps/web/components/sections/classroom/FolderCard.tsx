"use client";

import { Folder, Trash2, Upload } from "lucide-react";
import { Folder as FolderType } from "@/types";

interface Props {
  folder: FolderType;
  weekId: string;
  onDelete: (weekId: string, folderId: string) => void;
  onUpload: (weekId: string, folderId: string) => void;
}

export default function FolderCard({
  folder,
  weekId,
  onDelete,
  onUpload,
}: Props) {

  const handleUpload = (e: React.MouseEvent) => {
    e.stopPropagation()
    onUpload(weekId, folder.id)
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    onDelete(weekId, folder.id)
  }

  return (
    <div className="group bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-xl p-4 shadow-sm hover:shadow-md transition">

      <div className="flex items-start justify-between">

        <div className="flex items-center gap-3">

          <Folder className="text-blue-500" size={22} />

          <div>
            <h3 className="font-medium text-gray-800 dark:text-gray-200">
              {folder.name}
            </h3>

            <p className="text-xs text-gray-500 dark:text-gray-400">
              {folder.files.length} files
            </p>
          </div>

        </div>

        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition text-gray-600 dark:text-gray-300">

          <button
            onClick={handleUpload}
            className="p-1 hover:text-blue-600"
          >
            <Upload size={18} />
          </button>

          <button
            onClick={handleDelete}
            className="p-1 hover:text-red-500"
          >
            <Trash2 size={18} />
          </button>

        </div>

      </div>

    </div>
  );
}