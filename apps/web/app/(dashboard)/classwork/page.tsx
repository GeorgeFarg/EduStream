'use client';

import { useEffect, useState } from 'react';
import { ClassworkShell } from '@/components/classwork/classwork-shell';
import type { ClassworkItemData, ClassworkUserRole } from '@/components/classwork/types';
import { useClassContext } from '@/contexts/ClassContext';
import { apiBaseUrl } from '@/config/env';
import { Loader2 } from 'lucide-react';

interface ApiAssignment {
  id: number;
  title: string;
  description: string;
  dueDate: string;
  classId: number;
  fileUrl: string | null;
  teacher: { id: number; name: string; email: string };
}

export default function ClassworkPage() {
  const { currentClass, userId, isTeacher, loading } = useClassContext();
  const [assignments, setAssignments] = useState<ClassworkItemData[]>([]);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [userRole, setUserRole] = useState<ClassworkUserRole>('student');

  useEffect(() => {
    if (!currentClass || !userId) return;
    setUserRole(isTeacher(currentClass.id) ? 'teacher' : 'student');
    setFetchLoading(true);

    fetch(`${apiBaseUrl}/api/assignments?classId=${currentClass.id}`, {
      credentials: 'include',
    })
      .then((res) => res.json())
      .then((data: ApiAssignment[]) => {
        const now = new Date();
        const mapped: ClassworkItemData[] = (Array.isArray(data) ? data : []).map((a) => ({
          id: String(a.id),
          title: a.title,
          description: a.description,
          dueDate: a.dueDate,
          status: new Date(a.dueDate) < now ? 'missing' : 'assigned',
          points: 100,
          attachments: a.fileUrl
            ? [{ id: `${a.id}-file`, name: 'Attachment', sizeLabel: '' }]
            : [],
        }));
        setAssignments(mapped);
      })
      .catch(() => {})
      .finally(() => setFetchLoading(false));
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
