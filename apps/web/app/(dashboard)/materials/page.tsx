'use client';

import { useEffect, useState } from 'react';
import { MaterialsShell } from '@/components/materials/materials-shell';
import type { MaterialItemData, MaterialsUserRole } from '@/components/materials/types';
import { useClassContext } from '@/contexts/ClassContext';
import { fetchClassMaterials } from '@/lib/materials-api';
import { Loader2 } from 'lucide-react';

export default function MaterialsPage() {
  const { currentClass, userId, isTeacher, loading } = useClassContext();
  const [materials, setMaterials] = useState<MaterialItemData[]>([]);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [userRole, setUserRole] = useState<MaterialsUserRole>('student');

  useEffect(() => {
    if (!currentClass || !userId) return;

    setUserRole(isTeacher(currentClass.id) ? 'teacher' : 'student');
    setFetchLoading(true);

    fetchClassMaterials(currentClass.id)
      .then(setMaterials)
      .catch(() => setMaterials([]))
      .finally(() => setFetchLoading(false));
  }, [currentClass?.id, userId]);

  if (loading || !currentClass) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Materials</h1>
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
        <h1 className="text-3xl font-bold">Materials</h1>
        <div className="flex items-center gap-2 text-muted-foreground py-8 justify-center">
          <Loader2 className="w-5 h-5 animate-spin" /> Loading materials...
        </div>
      </div>
    );
  }

  return (
    <MaterialsShell
      initialMaterials={materials}
      userRole={userRole}
      currentClass={currentClass}
      onMaterialsChange={setMaterials}
    />
  );
}
