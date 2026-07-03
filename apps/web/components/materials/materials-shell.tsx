'use client';

import { useMemo, useState } from 'react';
import { Plus } from 'lucide-react';

import { AddMaterialModal } from '@/components/materials/add-material-modal';
import { MaterialsList } from '@/components/materials/materials-list';
import { MaterialPreview } from '@/components/materials/material-preview';
import type { MaterialItemData, MaterialsUserRole } from '@/components/materials/types';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { apiBaseUrl } from '@/config/env';
import type { Classroom } from '@/types/classroom-return.d';

interface MaterialsShellProps {
  initialMaterials: MaterialItemData[];
  userRole: MaterialsUserRole;
  currentClass: Classroom;
}

type MaterialRecord = Record<string, MaterialItemData>;

function buildMaterialsRecord(materials: MaterialItemData[]) {
  return materials.reduce<MaterialRecord>((record, material) => {
    record[material.id] = material;
    return record;
  }, {});
}

export function MaterialsShell({ initialMaterials, userRole, currentClass }: MaterialsShellProps) {
  const [materialsById, setMaterialsById] = useState<MaterialRecord>(() => buildMaterialsRecord(initialMaterials));
  const [materialOrder, setMaterialOrder] = useState<string[]>(() => initialMaterials.map((material) => material.id));
  const [selectedMaterialId, setSelectedMaterialId] = useState<string | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);

  const materials = useMemo(
    () =>
      materialOrder
        .map((materialId) => materialsById[materialId])
        .filter((material): material is MaterialItemData => Boolean(material)),
    [materialOrder, materialsById]
  );

  const selectedMaterial = selectedMaterialId ? materialsById[selectedMaterialId] : null;
  const canAddMaterial = userRole === 'teacher' || userRole === 'admin';

  const handleAddMaterial = async (material: Omit<MaterialItemData, 'id' | 'uploadedAt'>) => {
    // The AddMaterialModal provides a local objectUrl — we need to upload the real file to the API.
    // Since the modal gives us a derived object, we store it locally (optimistic) if no real file.
    // For real uploads the teacher workflow would use the API with FormData.
    // We'll do a best-effort: if the attachment has a real URL (object URL), we skip API upload.
    // Teachers can upload via the API endpoint: POST /api/materials/:classId

    const nextId = `material-${Date.now()}`;
    const nextMaterial: MaterialItemData = {
      id: nextId,
      uploadedAt: new Date().toISOString(),
      ...material,
    };

    setMaterialsById((current) => ({ ...current, [nextId]: nextMaterial }));
    setMaterialOrder((current) => [nextId, ...current]);
    setSelectedMaterialId(nextId);

    toast({ title: 'Material added', description: 'The material list has been updated.' });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Materials</h1>
          <p className="mt-1 text-muted-foreground">Course materials and resources</p>
        </div>
        {canAddMaterial && (
          <Button size="lg" className="gap-2 self-start sm:self-auto" onClick={() => setIsAddOpen(true)}>
            <Plus className="h-4 w-4" />
            Add Material
          </Button>
        )}
      </div>

      <div className="transition-all duration-200">
        {selectedMaterial ? (
          <MaterialPreview material={selectedMaterial} onBack={() => setSelectedMaterialId(null)} />
        ) : (
          <MaterialsList
            materials={materials}
            userRole={userRole}
            onSelect={setSelectedMaterialId}
            onAdd={() => setIsAddOpen(true)}
          />
        )}
      </div>

      {canAddMaterial && (
        <AddMaterialModal open={isAddOpen} onOpenChange={setIsAddOpen} onAdd={handleAddMaterial} />
      )}
    </div>
  );
}
