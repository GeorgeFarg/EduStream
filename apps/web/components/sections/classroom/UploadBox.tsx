"use client";

import { useRef } from "react";
import { UploadCloud } from "lucide-react";
import { Week } from "@/types";

interface Props {
  weeks: Week[];
  selectedWeek: string;
  onUpload: (files: File[], weekId: string) => void;
}

export default function UploadBox({ weeks, selectedWeek, onUpload }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedWeekData = weeks.find((w) => w.id === selectedWeek);

  const handleFiles = (files: FileList | null) => {
    if (!files) return;

    const allowed = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "video/mp4",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "application/zip",
    ];

    const validFiles: File[] = [];

    Array.from(files).forEach((file) => {
      if (!allowed.includes(file.type)) return;
      if (file.size > 500 * 1024 * 1024) return;
      validFiles.push(file);
    });

    if (validFiles.length > 0) {
      onUpload(validFiles, selectedWeek);
    }

    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="mb-8">

      <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
        Uploading to:
        <span className="font-semibold text-gray-800 dark:text-gray-200 ml-1">
          {selectedWeekData?.title || "Unknown Week"}
        </span>
      </p>

      <div
        onClick={() => inputRef.current?.click()}
        className="border-2 border-dashed border-gray-300 dark:border-neutral-600
                   bg-white dark:bg-neutral-900
                   rounded-2xl p-10 text-center cursor-pointer
                   hover:bg-gray-50 dark:hover:bg-neutral-800
                   transition"
      >
        <UploadCloud
          className="mx-auto mb-4 text-gray-400 dark:text-gray-500"
          size={40}
        />

        <p className="text-gray-600 dark:text-gray-300 font-medium">
          <span className="text-blue-600 dark:text-blue-400 hover:underline">
            Click to upload
          </span>{" "}
          or drag and drop
        </p>

        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
          PDF, DOCX, PPTX, MP4, ZIP (Max 500MB)
        </p>

        <input
          type="file"
          ref={inputRef}
          multiple
          hidden
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

    </div>
  );
}