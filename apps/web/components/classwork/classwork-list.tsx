import { ClipboardList } from 'lucide-react';

import { ClassworkItem } from '@/components/classwork/classwork-item';
import { Button } from '@/components/ui/button';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';

import type { ClassworkItemData, ClassworkUserRole } from '@/components/classwork/types';

interface ClassworkListProps {
  assignments: ClassworkItemData[];
  userRole: ClassworkUserRole;
  onSelect: (assignmentId: string) => void;
  onCreate: () => void;
}

export function ClassworkList({ assignments, userRole, onSelect, onCreate }: ClassworkListProps) {
  if (assignments.length === 0) {
    return (
      <Empty className="border border-border bg-card">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <ClipboardList />
          </EmptyMedia>
          <EmptyTitle>No classwork yet</EmptyTitle>
          <EmptyDescription>
            {userRole === 'student'
              ? 'Assignments will appear here as soon as your instructor posts them.'
              : 'Create your first classwork item to get this course moving.'}
          </EmptyDescription>
        </EmptyHeader>
        {(userRole === 'teacher' || userRole === 'admin') && (
          <EmptyContent>
            <Button onClick={onCreate}>Create Classwork</Button>
          </EmptyContent>
        )}
      </Empty>
    );
  }

  return (
    <div className="grid gap-4">
      {assignments.map((assignment) => (
        <ClassworkItem key={assignment.id} assignment={assignment} onSelect={onSelect} />
      ))}
    </div>
  );
}
