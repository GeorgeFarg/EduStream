import { FolderOpen } from 'lucide-react';

import { MaterialCard } from '@/components/materials/material-card';
import type { MaterialItemData, MaterialsUserRole } from '@/components/materials/types';
import { Button } from '@/components/ui/button';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';

interface MaterialsListProps {
  materials: MaterialItemData[];
  userRole: MaterialsUserRole;
  onSelect: (materialId: string) => void;
  onAdd: () => void;
}

export function MaterialsList({ materials, userRole, onSelect, onAdd }: MaterialsListProps) {
  if (materials.length === 0) {
    return (
      <Empty className="border border-border bg-card">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <FolderOpen />
          </EmptyMedia>
          <EmptyTitle>No materials yet</EmptyTitle>
          <EmptyDescription>
            {userRole === 'student'
              ? 'Course materials will appear here when your instructor shares them.'
              : 'Add the first material to start building this course library.'}
          </EmptyDescription>
        </EmptyHeader>
        {userRole !== 'student' && (
          <EmptyContent>
            <Button onClick={onAdd}>Add Material</Button>
          </EmptyContent>
        )}
      </Empty>
    );
  }

  return (
    <div className="space-y-3">
      {materials.map((material) => (
        <MaterialCard key={material.id} material={material} onSelect={onSelect} />
      ))}
    </div>
  );
}
