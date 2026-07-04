"use client";

import { ArrowLeft, Download, ExternalLink, FileIcon, Paperclip } from "lucide-react";

import { SubmissionForm } from "@/components/classwork/submission-form";
import { TeacherSubmissionsPanel } from "@/components/classwork/teacher-submissions-panel";
import type {
  ClassworkItemData,
  ClassworkUserRole,
  TeacherSubmissionEntry,
} from "@/components/classwork/types";
import { formatDueDate, statusConfig } from "@/components/classwork/utils";
import { resolveUploadUrl } from "@/lib/classwork-api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface ClassworkDetailsProps {
  assignment: ClassworkItemData;
  userRole: ClassworkUserRole;
  onBack: () => void;
  onSubmit: (payload: { files: File[] }) => void;
  submitting?: boolean;
  teacherSubmissions?: TeacherSubmissionEntry[];
  teacherSubmissionsLoading?: boolean;
  onGrade?: (submissionId: number, grade: number) => Promise<void>;
}

export function ClassworkDetails({
  assignment,
  userRole,
  onBack,
  onSubmit,
  submitting = false,
  teacherSubmissions,
  teacherSubmissionsLoading = false,
  onGrade,
}: ClassworkDetailsProps) {
  const config = statusConfig[assignment.status];
  const StatusIcon = config.icon;
  const isTeacherView = userRole === "teacher" || userRole === "admin";
  const showSubmissionForm =
    userRole === "student" &&
    !assignment.submission &&
    assignment.status !== "graded";

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" className="gap-2" onClick={onBack}>
        <ArrowLeft className="h-4 w-4" />
        Back to list
      </Button>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_320px]">
        <div className="space-y-6">
          <div className="rounded-lg border border-border bg-card p-6 transition-all duration-200">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h1 className="text-3xl font-bold">{assignment.title}</h1>
                <p className="mt-2 text-muted-foreground">
                  Due {formatDueDate(assignment.dueDate)}
                </p>
              </div>
              <Badge
                variant="outline"
                className={`gap-1.5 text-xs ${config.color}`}
              >
                <StatusIcon className="h-3 w-3" />
                {config.label}
              </Badge>
            </div>

            <div className="space-y-3 text-sm leading-relaxed text-foreground">
              {assignment.description.split("\n").map((paragraph, index) => (
                <p key={`${assignment.id}-paragraph-${index}`}>{paragraph}</p>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-6">
            <h2 className="mb-4 text-lg font-semibold">Attachments</h2>
            {assignment.attachments.length > 0 ? (
              <div className="space-y-2">
                {assignment.attachments.map((attachment) => (
                  <div
                    key={attachment.id}
                    className="flex items-center gap-3 rounded-md border border-border/60 bg-background/40 p-3"
                  >
                    <FileIcon className="h-5 w-5 text-primary" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {attachment.name}
                      </p>
                      {attachment.sizeLabel && (
                        <p className="text-xs text-muted-foreground">
                          {attachment.sizeLabel}
                        </p>
                      )}
                    </div>
                    {attachment.url ? (
                      <Button variant="outline" size="sm" className="gap-2" asChild>
                        <a
                          href={resolveUploadUrl(attachment.url)}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="h-4 w-4" />
                          Open
                        </a>
                      </Button>
                    ) : (
                      <Paperclip className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No attachments for this classwork item.
              </p>
            )}
          </div>

          {showSubmissionForm && (
            <div className="rounded-lg border border-border bg-card p-6 transition-all duration-200">
              <h2 className="mb-4 text-lg font-semibold">Your Submission</h2>
              <SubmissionForm
                assignment={assignment}
                submitting={submitting}
                onSubmit={onSubmit}
              />
            </div>
          )}

          {assignment.submission && !isTeacherView && (
            <div className="rounded-lg border border-border bg-card p-6">
              <h2 className="mb-4 text-lg font-semibold">Submitted Work</h2>
              <div className="space-y-3">
                {assignment.submission.isLate && (
                  <Badge variant="outline" className="border-red-500/20 bg-red-500/10 text-red-400">
                    Submitted late
                  </Badge>
                )}
                {assignment.submission.fileUrl && (
                  <div className="flex items-center gap-3 rounded-md border border-border/60 bg-background/40 p-3">
                    <FileIcon className="h-5 w-5 text-primary" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {assignment.submission.fileName ?? "Submitted file"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Submitted for: {assignment.title}
                      </p>
                    </div>
                    <Button variant="outline" size="sm" className="gap-2" asChild>
                      <a
                        href={resolveUploadUrl(assignment.submission.fileUrl)}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Download className="h-4 w-4" />
                        Download
                      </a>
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}

          {isTeacherView && onGrade && (
            <div className="rounded-lg border border-border bg-card p-6">
              <h2 className="mb-4 text-lg font-semibold">Student Submissions</h2>
              <TeacherSubmissionsPanel
                submissions={teacherSubmissions ?? []}
                loading={teacherSubmissionsLoading}
                onGrade={onGrade}
              />
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="mb-1 text-xs text-muted-foreground">DUE DATE</p>
            <p className="text-lg font-semibold">
              {formatDueDate(assignment.dueDate)}
            </p>
          </div>

          <div className="rounded-lg border border-border bg-card p-4">
            <p className="mb-1 text-xs text-muted-foreground">POINTS</p>
            <p className="text-lg font-semibold">
              {assignment.grade !== undefined
                ? `${assignment.grade} / ${assignment.points}`
                : assignment.points}
            </p>
          </div>

          <div className="rounded-lg border border-border bg-card p-4">
            <p className="mb-2 text-xs text-muted-foreground">STATUS</p>
            <Badge
              variant="outline"
              className={`w-full justify-center gap-1.5 ${config.color}`}
            >
              <StatusIcon className="h-3 w-3" />
              {config.label}
            </Badge>
          </div>

          {assignment.feedback && (
            <div className="rounded-lg border border-border bg-card p-4">
              <p className="mb-2 text-xs text-muted-foreground">FEEDBACK</p>
              <p className="text-sm leading-relaxed">{assignment.feedback}</p>
            </div>
          )}

          {assignment.submission && !isTeacherView && (
            <div className="rounded-lg border border-border bg-card p-4">
              <p className="mb-1 text-xs text-muted-foreground">SUBMITTED</p>
              <p className="text-sm font-medium">
                {assignment.submission.submittedAt}
              </p>
            </div>
          )}

          {isTeacherView && teacherSubmissions && (
            <div className="rounded-lg border border-border bg-card p-4">
              <p className="mb-1 text-xs text-muted-foreground">SUBMISSIONS</p>
              <p className="text-lg font-semibold">{teacherSubmissions.length}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
