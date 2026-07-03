"use client";

import { FileItem } from "@/types";
import { FileText, Video, File, FileArchive, Presentation } from "lucide-react";

interface Props {
  file: FileItem;
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
}

export default function FileCard({ file, onRename, onDelete }: Props) {

  const icons = {
    pdf: <FileText className="text-red-500" />,
    video: <Video className="text-purple-500" />,
    doc: <File className="text-blue-500" />,
    zip: <FileArchive className="text-gray-600 dark:text-gray-400" />,
    ppt: <Presentation className="text-orange-500" />,
    link: <File className="text-indigo-500" />,
  };

  return (
    <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-2xl p-6 shadow-sm hover:shadow-lg transition">

      <div className="mb-4">{icons[file.type]}</div>

      <h3 className="font-medium text-gray-800 dark:text-white">
        {file.name}
      </h3>

      <div className="flex justify-between text-sm text-gray-400 dark:text-gray-500 mt-4">
        <span>{file.size}</span>
        <span>{file.uploadDate}</span>
      </div>

      <div className="flex justify-end gap-3 mt-4 text-sm">

        <button
          onClick={() => {
            const newName = prompt("Rename file");
            if (newName) onRename(file.id, newName);
          }}
          className="text-blue-500 hover:underline"
        >
          Rename
        </button>

        <button
          onClick={() => onDelete(file.id)}
          className="text-red-500 hover:underline"
        >
          Delete
        </button>

      </div>

    </div>
  );
}