'use client';

import { useState } from 'react';
import { Download, FileIcon, Loader2 } from 'lucide-react';

import type { TeacherSubmissionEntry } from '@/components/classwork/types';
import { resolveUploadUrl } from '@/lib/classwork-api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Input from '@/components/ui/input';

interface TeacherSubmissionsPanelProps {
  submissions: TeacherSubmissionEntry[];
  loading: boolean;
  onGrade: (submissionId: number, grade: number) => Promise<void>;
}

export function TeacherSubmissionsPanel({
  submissions,
  loading,
  onGrade,
}: TeacherSubmissionsPanelProps) {
  const [gradeInputs, setGradeInputs] = useState<Record<number, string>>({});
  const [gradingId, setGradingId] = useState<number | null>(null);

  const handleGrade = async (submission: TeacherSubmissionEntry) => {
    const raw = gradeInputs[submission.id] ?? String(submission.grade ?? '');
    const grade = Number(raw);

    if (Number.isNaN(grade) || grade < 0 || grade > 100) {
      return;
    }

    setGradingId(submission.id);
    try {
      await onGrade(submission.id, grade);
    } finally {
      setGradingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-8 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading submissions...
      </div>
    );
  }

  if (submissions.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No students have submitted work for this assignment yet.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {submissions.map((submission) => (
        <div
          key={submission.id}
          className="rounded-md border border-border/60 bg-background/40 p-4"
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium">{submission.studentName}</p>
                <Badge variant="outline" className="text-xs">
                  {submission.studentEmail}
                </Badge>
                {submission.isLate && (
                  <Badge variant="outline" className="border-red-500/20 bg-red-500/10 text-xs text-red-400">
                    Late
                  </Badge>
                )}
                {submission.grade !== null && (
                  <Badge variant="outline" className="border-purple-500/20 bg-purple-500/10 text-xs text-purple-400">
                    Graded
                  </Badge>
                )}
              </div>

              <p className="text-xs text-muted-foreground">
                Submitted {submission.submittedAt}
              </p>

              <div className="flex items-center gap-3 rounded-md border border-border/60 bg-card p-3">
                <FileIcon className="h-5 w-5 text-primary" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{submission.fileName}</p>
                </div>
                <Button variant="outline" size="sm" className="gap-2" asChild>
                  <a
                    href={resolveUploadUrl(submission.fileUrl)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Download className="h-4 w-4" />
                    Download
                  </a>
                </Button>
              </div>
            </div>

            <div className="flex w-full items-end gap-2 lg:w-auto">
              <div className="flex-1 lg:w-24">
                <label className="mb-1 block text-xs text-muted-foreground">Grade / 100</label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={gradeInputs[submission.id] ?? String(submission.grade ?? '')}
                  onChange={(event) =>
                    setGradeInputs((current) => ({
                      ...current,
                      [submission.id]: event.target.value,
                    }))
                  }
                />
              </div>
              <Button
                size="sm"
                onClick={() => handleGrade(submission)}
                disabled={gradingId === submission.id}
              >
                {gradingId === submission.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : submission.grade !== null ? (
                  'Update'
                ) : (
                  'Grade'
                )}
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
