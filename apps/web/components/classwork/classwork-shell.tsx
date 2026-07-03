"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";

import { ClassworkDetails } from "@/components/classwork/classwork-details";
import { ClassworkList } from "@/components/classwork/classwork-list";
import { CreateClassworkModal } from "@/components/classwork/create-classwork-modal";
import type {
  ClassworkAttachment,
  ClassworkItemData,
  ClassworkSubmission,
  ClassworkUserRole,
} from "@/components/classwork/types";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { apiBaseUrl } from "@/config/env";
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
  const [isCreateOpen, setIsCreateOpen] = useState(false);

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

  const handleSelectAssignment = (assignmentId: string) => {
    setSelectedAssignmentId(assignmentId);
  };

  const handleBackToList = () => {
    setSelectedAssignmentId(null);
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

  const handleSubmitAssignment = (
    assignmentId: string,
    payload: { text: string; files: File[] },
  ) => {
    const nextSubmission: ClassworkSubmission = {
      text: payload.text,
      files: payload.files,
      submittedAt: new Date().toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

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
      description: "Your assignment has been marked as submitted.",
    });
  };

  const assignmentsWithSubmissionState = assignments.map((assignment) => ({
    ...assignment,
    submission: submissionsById[assignment.id] ?? assignment.submission,
  }));

  const selectedWithSubmissionState = selectedAssignment
    ? {
        ...selectedAssignment,
        submission:
          submissionsById[selectedAssignment.id] ??
          selectedAssignment.submission,
      }
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
