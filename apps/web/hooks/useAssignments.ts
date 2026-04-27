import { useState, useEffect, useCallback } from "react";
import { Assignment } from "@/types";
import {
  getAssignments,
  getMySubmissions,
  createAssignment,
  CreateAssignmentPayload,
} from "@/lib/assignments";

interface UseAssignmentsReturn {
  assignments: Assignment[];
  submittedIds: string[];
  loading: boolean;
  error: string | null;
  addAssignment: (payload: CreateAssignmentPayload) => Promise<void>;
  deleteAssignment: (id: string) => void;
  markSubmitted: (id: string) => void;
  updateAssignmentInState: (updated: Assignment) => void; // ✅ أضفناها
  refetch: () => void;
}

export function useAssignments(classId: number): UseAssignmentsReturn {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submittedIds, setSubmittedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [assignmentsData, submissionsData] = await Promise.all([
        getAssignments(classId),
        getMySubmissions(),
      ]);
      setAssignments(assignmentsData);
      const submittedAssignmentIds = submissionsData.map((s) =>
        String(s.assignmentId)
      );
      setSubmittedIds(submittedAssignmentIds);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [classId]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const addAssignment = useCallback(
    async (payload: CreateAssignmentPayload) => {
      const tempId = `temp-${Date.now()}`;
      const optimistic: Assignment = {
        id: tempId,
        title: payload.title,
        description: payload.description,
        dueDate: payload.dueDate,
        teacherName: "Dr. Ahmed Ali",
      };
      setAssignments((prev) => [optimistic, ...prev]);
      try {
        const created = await createAssignment(payload);
        setAssignments((prev) =>
          prev.map((a) => (a.id === tempId ? created : a))
        );
      } catch (err) {
        setAssignments((prev) => prev.filter((a) => a.id !== tempId));
        throw err;
      }
    },
    []
  );

  const deleteAssignment = useCallback((id: string) => {
    setAssignments((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const markSubmitted = useCallback((id: string) => {
    setSubmittedIds((prev) => [...prev, id]);
  }, []);

  // ✅ دالة جديدة جوه الـ hook
  const updateAssignmentInState = useCallback((updated: Assignment) => {
    setAssignments((prev) =>
      prev.map((a) => (a.id === updated.id ? updated : a))
    );
  }, []);

  return {
    assignments,
    submittedIds,
    loading,
    error,
    addAssignment,
    deleteAssignment,
    markSubmitted,
    updateAssignmentInState, // ✅
    refetch: fetchAll,
  };
}