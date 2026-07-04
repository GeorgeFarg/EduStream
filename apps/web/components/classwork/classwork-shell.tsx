"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";

import { ClassworkDetails } from "@/components/classwork/classwork-details";
import { ClassworkList } from "@/components/classwork/classwork-list";
import { CreateClassworkModal } from "@/components/classwork/create-classwork-modal";
import type {
  ClassworkAttachment,
  ClassworkItemData,
  ClassworkSubmission,
  ClassworkUserRole,
  TeacherSubmissionEntry,
} from "@/components/classwork/types";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { apiBaseUrl } from "@/config/env";
import {
  fetchAssignmentSubmissions,
  gradeSubmissionWork,
  submitAssignmentWork,
} from "@/lib/classwork-api";
import type { Classroom } from "@/types/classroom-return.d";

interface ClassworkShellProps {
  initialAssignments: ClassworkItemData[];
  userRole: ClassworkUserRole;
  currentClass: Classroom;
  onAssignmentCreated?: (item: ClassworkItemData) => void;
}

type AssignmentRecord = Record<string, ClassworkItemData>;
type SubmissionRecord = Record<string, ClassworkSubmission | undefined>;

function buildAssignmentsRecord(assignments: ClassworkItemData[]) {
  return assignments.reduce<AssignmentRecord>((record, assignment) => {
    record[assignment.id] = assignment;
    return record;
  }, {});
}

function buildSubmissionRecord(assignments: ClassworkItemData[]) {
  return assignments.reduce<SubmissionRecord>((record, assignment) => {
    record[assignment.id] = assignment.submission;
    return record;
  }, {});
}

export function ClassworkShell({
  initialAssignments,
  userRole,
  currentClass,
  onAssignmentCreated,
}: ClassworkShellProps) {
  const [assignmentsById, setAssignmentsById] = useState<AssignmentRecord>(() =>
    buildAssignmentsRecord(initialAssignments),
  );
  const [assignmentOrder, setAssignmentOrder] = useState<string[]>(() =>
    initialAssignments.map((assignment) => assignment.id),
  );
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<
    string | null
  >(null);
  const [submissionsById, setSubmissionsById] = useState<SubmissionRecord>(() =>
    buildSubmissionRecord(initialAssignments),
  );
  const [teacherSubmissions, setTeacherSubmissions] = useState<
    TeacherSubmissionEntry[]
  >([]);
  const [teacherSubmissionsLoading, setTeacherSubmissionsLoading] =
    useState(false);
  const [submittingAssignmentId, setSubmittingAssignmentId] = useState<
    string | null
  >(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  useEffect(() => {
    setAssignmentsById(buildAssignmentsRecord(initialAssignments));
    setAssignmentOrder(initialAssignments.map((assignment) => assignment.id));
    setSubmissionsById(buildSubmissionRecord(initialAssignments));
  }, [initialAssignments]);

  const assignments = useMemo(
    () =>
      assignmentOrder
        .map((assignmentId) => assignmentsById[assignmentId])
        .filter((assignment): assignment is ClassworkItemData =>
          Boolean(assignment),
        ),
    [assignmentOrder, assignmentsById],
  );

  const selectedAssignment = selectedAssignmentId
    ? assignmentsById[selectedAssignmentId]
    : null;
  const canCreateClasswork = userRole === "teacher" || userRole === "admin";
  const isTeacherView = userRole === "teacher" || userRole === "admin";

  useEffect(() => {
    if (!selectedAssignmentId || !isTeacherView) {
      setTeacherSubmissions([]);
      return;
    }

    setTeacherSubmissionsLoading(true);
    fetchAssignmentSubmissions(selectedAssignmentId)
      .then(setTeacherSubmissions)
      .catch(() => setTeacherSubmissions([]))
      .finally(() => setTeacherSubmissionsLoading(false));
  }, [selectedAssignmentId, isTeacherView]);

  const handleSelectAssignment = (assignmentId: string) => {
    setSelectedAssignmentId(assignmentId);
  };

  const handleBackToList = () => {
    setSelectedAssignmentId(null);
    setTeacherSubmissions([]);
  };

  const handleCreateAssignment = async (payload: {
    title: string;
    description: string;
    dueDate: string;
    attachments: ClassworkAttachment[];
  }) => {
    try {
      const res = await fetch(`${apiBaseUrl}/api/assignments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          title: payload.title,
          description: payload.description,
          dueDate: new Date(payload.dueDate).toISOString(),
          classId: currentClass.id,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast({
          title: "Error",
          description: data?.error?.message ?? "Failed to create assignment",
          variant: "destructive",
        });
        return;
      }

      const nextId = String(data.id);
      const nextAssignment: ClassworkItemData = {
        id: nextId,
        title: data.title,
        description: data.description,
        dueDate: data.dueDate,
        status: "assigned",
        points: 100,
        attachments: payload.attachments,
      };

      setAssignmentsById((current) => ({ ...current, [nextId]: nextAssignment }));
      setAssignmentOrder((current) => [nextId, ...current]);
      setSelectedAssignmentId(nextId);
      onAssignmentCreated?.(nextAssignment);

      toast({
        title: "Classwork created",
        description: "The new classwork item has been added.",
      });
    } catch {
      toast({
        title: "Error",
        description: "Network error. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSubmitAssignment = async (
    assignmentId: string,
    payload: { files: File[] },
  ) => {
    if (payload.files.length === 0) {
      toast({
        title: "File required",
        description: "Please upload a PDF, DOCX, or ZIP file to submit.",
        variant: "destructive",
      });
      return;
    }

    const file = payload.files[0];
    if (!file) return;

    setSubmittingAssignmentId(assignmentId);

    try {
      const result = await submitAssignmentWork(assignmentId, file);

      if (!result.ok) {
        toast({
          title: "Submission failed",
          description: result.message,
          variant: "destructive",
        });
        return;
      }

      const nextSubmission = result.submission;

      setSubmissionsById((current) => ({
        ...current,
        [assignmentId]: nextSubmission,
      }));

      setAssignmentsById((current) => {
        const assignment = current[assignmentId];
        if (!assignment) return current;
        return {
          ...current,
          [assignmentId]: {
            ...assignment,
            status: "submitted" as const,
            submission: nextSubmission,
          },
        };
      });

      toast({
        title: "Submission received",
        description: "Your assignment has been submitted successfully.",
      });
    } catch {
      toast({
        title: "Error",
        description: "Network error. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmittingAssignmentId(null);
    }
  };

  const handleGradeSubmission = async (submissionId: number, grade: number) => {
    const result = await gradeSubmissionWork(submissionId, grade);

    if (!result.ok) {
      toast({
        title: "Grading failed",
        description: result.message,
        variant: "destructive",
      });
      return;
    }

    setTeacherSubmissions((current) =>
      current.map((submission) =>
        submission.id === submissionId ? { ...submission, grade } : submission,
      ),
    );

    toast({
      title: "Grade saved",
      description: `Submission graded with ${grade}/100.`,
    });
  };

  const assignmentsWithSubmissionState = assignments.map((assignment) => {
    const submission = submissionsById[assignment.id] ?? assignment.submission;
    if (!submission) return assignment;

    const status =
      assignment.grade !== undefined ? ("graded" as const) : ("submitted" as const);

    return { ...assignment, submission, status };
  });

  const selectedWithSubmissionState = selectedAssignment
    ? (() => {
        const submission =
          submissionsById[selectedAssignment.id] ?? selectedAssignment.submission;
        if (!submission) return selectedAssignment;

        const status =
          selectedAssignment.grade !== undefined
            ? ("graded" as const)
            : ("submitted" as const);

        return { ...selectedAssignment, submission, status };
      })()
    : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Classwork</h1>
          <p className="mt-1 text-muted-foreground">
            View and manage your assignments
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {canCreateClasswork && (
            <Button
              size="lg"
              className="gap-2"
              onClick={() => setIsCreateOpen(true)}
            >
              <Plus className="h-4 w-4" />
              Create Classwork
            </Button>
          )}
        </div>
      </div>

      <div className="transition-all duration-200">
        {selectedWithSubmissionState ? (
          <ClassworkDetails
            assignment={selectedWithSubmissionState}
            userRole={userRole}
            onBack={handleBackToList}
            onSubmit={(payload) =>
              handleSubmitAssignment(selectedWithSubmissionState.id, payload)
            }
            submitting={submittingAssignmentId === selectedWithSubmissionState.id}
            teacherSubmissions={isTeacherView ? teacherSubmissions : undefined}
            teacherSubmissionsLoading={isTeacherView ? teacherSubmissionsLoading : false}
            onGrade={isTeacherView ? handleGradeSubmission : undefined}
          />
        ) : (
          <ClassworkList
            assignments={assignmentsWithSubmissionState}
            userRole={userRole}
            onSelect={handleSelectAssignment}
            onCreate={() => setIsCreateOpen(true)}
          />
        )}
      </div>

      {canCreateClasswork && (
        <CreateClassworkModal
          open={isCreateOpen}
          onOpenChange={setIsCreateOpen}
          onCreate={handleCreateAssignment}
        />
      )}
    </div>
  );
}
