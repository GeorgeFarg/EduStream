'use client';

import { useEffect, useState } from 'react';
import { MaterialsShell } from '@/components/materials/materials-shell';
import type { MaterialItemData, MaterialsUserRole } from '@/components/materials/types';
import { useClassContext } from '@/contexts/ClassContext';
import { apiBaseUrl } from '@/config/env';
import { Loader2 } from 'lucide-react';

interface ApiMaterial {
  id: number;
  title: string;
  fileUrl: string;
  category: string;
  uploadedBy: number;
  uploaderName: string;
  createdAt: string;
}

function categoryToType(category: string): MaterialItemData['type'] {
  const lower = category.toLowerCase();
  if (lower.includes('pdf')) return 'pdf';
  if (lower.includes('doc')) return 'docx';
  if (lower.includes('image') || lower.includes('img') || lower.includes('png') || lower.includes('jpg')) return 'image';
  if (lower.includes('link') || lower.includes('url')) return 'link';
  return 'pdf';
}

export default function MaterialsPage() {
  const { currentClass, userId, isTeacher, loading } = useClassContext();
  const [materials, setMaterials] = useState<MaterialItemData[]>([]);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [userRole, setUserRole] = useState<MaterialsUserRole>('student');

  useEffect(() => {
    if (!currentClass || !userId) return;
    setUserRole(isTeacher(currentClass.id) ? 'teacher' : 'student');
    setFetchLoading(true);

    fetch(`${apiBaseUrl}/api/materials?classId=${currentClass.id}`, {
      credentials: 'include',
    })
      .then((res) => res.json())
      .then((data: ApiMaterial[]) => {
        const mapped: MaterialItemData[] = (Array.isArray(data) ? data : []).map((m) => ({
          id: String(m.id),
          title: m.title,
          type: categoryToType(m.category),
          description: `Uploaded by ${m.uploaderName} · ${m.category}`,
          uploadedAt: m.createdAt,
          sourceName: m.fileUrl.split('/').pop(),
          attachment: {
            url: m.fileUrl.startsWith('http')
              ? m.fileUrl
              : `${apiBaseUrl}${m.fileUrl}`,
          },
        }));
        setMaterials(mapped);
      })
      .catch(() => {})
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
    />
  );
}
