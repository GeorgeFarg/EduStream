import { useState, useEffect, useCallback } from "react";
import { Week, FileItem } from "@/types";
import {
  getMaterials,
  createMaterial,
  CreateMaterialPayload,
  mapApiMaterialToFileItem,
  groupMaterialsIntoWeeks,
   deleteMaterial as apiDelete, renameMaterial as apiRename ,
} from "@/lib/materials";

const CLASS_ID = 1;

interface UseMaterialsReturn {
  weeks: Week[];
  loading: boolean;
  error: string | null;
  uploading: boolean;
  uploadError: string | null;
  uploadMaterial: (payload: CreateMaterialPayload) => Promise<void>;
  addFileToWeek: (weekId: string, file: FileItem) => void;
  deleteFileFromWeek: (fileId: string) => void;
  renameFileInWeek: (fileId: string, newName: string) => void;
  refetch: () => void;
}

export function useMaterials(): UseMaterialsReturn {
  const [weeks, setWeeks] = useState<Week[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getMaterials(CLASS_ID);
      setWeeks(groupMaterialsIntoWeeks(data));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load materials");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const deleteFileFromWeek = useCallback(async (fileId: string) => {
  try {
    await apiDelete(Number(fileId));
    setWeeks((prev) =>
      prev.map((w) => ({
        ...w,
        files: w.files.filter((f) => f.id !== fileId),
      }))
    );
  } catch {
    setError('Failed to delete file');
  }
}, []);

const renameFileInWeek = useCallback(async (fileId: string, newName: string) => {
  try {
    await apiRename(Number(fileId), newName);
    setWeeks((prev) =>
      prev.map((w) => ({
        ...w,
        files: w.files.map((f) =>
          f.id === fileId ? { ...f, name: newName } : f
        ),
      }))
    );
  } catch {
    setError('Failed to rename file');
  }
}, []);
  // ── Upload مع Optimistic UI ─────────────────────────────────────────────────
  const uploadMaterial = useCallback(async (payload: CreateMaterialPayload) => {
    setUploading(true);
    setUploadError(null);

    const tempId = `temp-${Date.now()}`;
    const optimisticFile: FileItem = {
      id: tempId,
      name: payload.title,
      type: "link",
      size: `${(payload.file.size / 1024 / 1024).toFixed(2)} MB`,
      uploadDate: "Uploading...",
      url: URL.createObjectURL(payload.file),
    };

    // أضفه optimistically في الـ week الصح
    setWeeks((prev) => {
      const existing = prev.find((w) => w.id === payload.category);
      if (existing) {
        return prev.map((w) =>
          w.id === payload.category
            ? { ...w, files: [optimisticFile, ...w.files] }
            : w
        );
      }
      // لو category جديد، ابعت week جديد
      return [
        ...prev,
        {
          id: payload.category,
          title:
            payload.category.charAt(0).toUpperCase() +
            payload.category.slice(1),
          folders: [],
          files: [optimisticFile],
        },
      ];
    });

    try {
      const created = await createMaterial(payload);
      const realFile = mapApiMaterialToFileItem(created);

      // استبدل الـ temp بالـ real
      setWeeks((prev) =>
        prev.map((w) =>
          w.id === payload.category
            ? {
                ...w,
                files: w.files.map((f) => (f.id === tempId ? realFile : f)),
              }
            : w
        )
      );
    } catch (err) {
      // شيل الـ optimistic لو فشل
      setWeeks((prev) =>
        prev.map((w) => ({
          ...w,
          files: w.files.filter((f) => f.id !== tempId),
        }))
      );
      setUploadError(
        err instanceof Error ? err.message : "Upload failed"
      );
      throw err;
    } finally {
      setUploading(false);
    }
  }, []);

  const addFileToWeek = useCallback((weekId: string, file: FileItem) => {
    setWeeks((prev) =>
      prev.map((w) =>
        w.id === weekId ? { ...w, files: [file, ...w.files] } : w
      )
    );
  }, []);

  return {
    weeks,
    loading,
    error,
    uploading,
    uploadError,
    uploadMaterial,
    addFileToWeek,
    deleteFileFromWeek,
    renameFileInWeek,
    refetch: fetchAll,
  };
}
