'use client';

import { useEffect, useMemo, useState } from 'react';
import { Loader2, Plus } from 'lucide-react';

import { AddMaterialModal } from '@/components/materials/add-material-modal';
import { MaterialsList } from '@/components/materials/materials-list';
import { MaterialPreview } from '@/components/materials/material-preview';
import type { MaterialItemData, MaterialsUserRole } from '@/components/materials/types';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { mapApiMaterialToItem, uploadClassMaterial } from '@/lib/materials-api';
import type { Classroom } from '@/types/classroom-return.d';

interface MaterialsShellProps {
  initialMaterials: MaterialItemData[];
  userRole: MaterialsUserRole;
  currentClass: Classroom;
  onMaterialsChange?: (materials: MaterialItemData[]) => void;
}

type MaterialRecord = Record<string, MaterialItemData>;

function buildMaterialsRecord(materials: MaterialItemData[]) {
  return materials.reduce<MaterialRecord>((record, material) => {
    record[material.id] = material;
    return record;
  }, {});
}

function getMaterialTitle(baseTitle: string, file: File, fileCount: number): string {
  if (fileCount === 1) return baseTitle;

  const nameWithoutExt = file.name.replace(/\.[^.]+$/, '');
  return `${baseTitle} - ${nameWithoutExt}`;
}

export function MaterialsShell({
  initialMaterials,
  userRole,
  currentClass,
  onMaterialsChange,
}: MaterialsShellProps) {
  const [materialsById, setMaterialsById] = useState<MaterialRecord>(() =>
    buildMaterialsRecord(initialMaterials),
  );
  const [materialOrder, setMaterialOrder] = useState<string[]>(() =>
    initialMaterials.map((material) => material.id),
  );
  const [selectedMaterialId, setSelectedMaterialId] = useState<string | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    setMaterialsById(buildMaterialsRecord(initialMaterials));
    setMaterialOrder(initialMaterials.map((material) => material.id));
  }, [initialMaterials]);

  const materials = useMemo(
    () =>
      materialOrder
        .map((materialId) => materialsById[materialId])
        .filter((material): material is MaterialItemData => Boolean(material)),
    [materialOrder, materialsById],
  );

  const selectedMaterial = selectedMaterialId ? materialsById[selectedMaterialId] : null;
  const canAddMaterial = userRole === 'teacher' || userRole === 'admin';

  const syncMaterials = (nextMaterials: MaterialItemData[]) => {
    setMaterialsById(buildMaterialsRecord(nextMaterials));
    setMaterialOrder(nextMaterials.map((material) => material.id));
    onMaterialsChange?.(nextMaterials);
  };

  const handleAddMaterial = async (payload: { title: string; files: File[] }) => {
    if (payload.files.length === 0) return;

    setUploading(true);

    const uploadedMaterials: MaterialItemData[] = [];
    const failedFiles: string[] = [];

    try {
      for (const file of payload.files) {
        const title = getMaterialTitle(payload.title, file, payload.files.length);
        const result = await uploadClassMaterial(currentClass.id, file, title);

        if (result.ok) {
          uploadedMaterials.push(mapApiMaterialToItem(result.material));
        } else {
          failedFiles.push(`${file.name}: ${result.message}`);
        }
      }

      if (uploadedMaterials.length > 0) {
        const nextMaterials = [...uploadedMaterials, ...materials];
        syncMaterials(nextMaterials);
        setSelectedMaterialId(uploadedMaterials[0]?.id ?? null);

        toast({
          title: uploadedMaterials.length === 1 ? 'Material uploaded' : 'Materials uploaded',
          description:
            uploadedMaterials.length === 1
              ? 'The material is now available to your class.'
              : `${uploadedMaterials.length} materials are now available to your class.`,
        });
      }

      if (failedFiles.length > 0) {
        toast({
          title: 'Some uploads failed',
          description: failedFiles.join(' '),
          variant: 'destructive',
        });
      }
    } catch {
      toast({
        title: 'Upload failed',
        description: 'Network error. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Materials</h1>
          <p className="mt-1 text-muted-foreground">Course materials and resources</p>
        </div>
        {canAddMaterial && (
          <Button
            size="lg"
            className="gap-2 self-start sm:self-auto"
            onClick={() => setIsAddOpen(true)}
            disabled={uploading}
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
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
        <AddMaterialModal
          open={isAddOpen}
          onOpenChange={setIsAddOpen}
          onAdd={handleAddMaterial}
          uploading={uploading}
        />
      )}
    </div>
  );
}
