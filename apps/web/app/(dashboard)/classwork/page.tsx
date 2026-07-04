'use client';

import { useEffect, useState } from 'react';
import { ClassworkShell } from '@/components/classwork/classwork-shell';
import type { ClassworkItemData, ClassworkUserRole } from '@/components/classwork/types';
import { useClassContext } from '@/contexts/ClassContext';
import {
  fetchClassAssignments,
  fetchMySubmissions,
  mapApiAssignmentToClassworkItem,
  type ApiStudentSubmission,
} from '@/lib/classwork-api';
import { Loader2 } from 'lucide-react';

export default function ClassworkPage() {
  const { currentClass, userId, isTeacher, loading } = useClassContext();
  const [assignments, setAssignments] = useState<ClassworkItemData[]>([]);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [userRole, setUserRole] = useState<ClassworkUserRole>('student');

  useEffect(() => {
    if (!currentClass || !userId) return;

    const teacher = isTeacher(currentClass.id);
    setUserRole(teacher ? 'teacher' : 'student');
    setFetchLoading(true);

    const loadClasswork = async () => {
      try {
        const apiAssignments = await fetchClassAssignments(currentClass.id);

        if (teacher) {
          const mapped = apiAssignments.map((assignment) =>
            mapApiAssignmentToClassworkItem(assignment),
          );
          setAssignments(mapped);
          return;
        }

        const mySubmissions = await fetchMySubmissions();
        const submissionsByAssignmentId = mySubmissions.reduce<
          Record<number, ApiStudentSubmission>
        >((record, submission) => {
          if (submission.assignment.id) {
            record[submission.assignmentId] = submission;
          }
          return record;
        }, {});

        const mapped = apiAssignments.map((assignment) =>
          mapApiAssignmentToClassworkItem(
            assignment,
            submissionsByAssignmentId[assignment.id] ?? null,
          ),
        );
        setAssignments(mapped);
      } catch {
        setAssignments([]);
      } finally {
        setFetchLoading(false);
      }
    };

    void loadClasswork();
  }, [currentClass?.id, userId]);

  if (loading || !currentClass) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Classwork</h1>
        {loading ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading...
          </div>
        ) : (
          <p className="text-muted-foreground">No class selected.</p>
        )}
      </div>
    );
  }

  if (fetchLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Classwork</h1>
        <div className="flex items-center gap-2 text-muted-foreground py-8 justify-center">
          <Loader2 className="w-5 h-5 animate-spin" /> Loading assignments...
        </div>
      </div>
    );
  }

  return (
    <ClassworkShell
      initialAssignments={assignments}
      userRole={userRole}
      currentClass={currentClass}
      onAssignmentCreated={async (newItem) => {
        setAssignments((prev) => [newItem, ...prev]);
      }}
    />
  );
}
