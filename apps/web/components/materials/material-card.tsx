'use client';

import { Eye } from 'lucide-react';

import { SendToAIButton } from '@/components/materials/send-to-ai-button';
import type { MaterialItemData } from '@/components/materials/types';
import { formatMaterialDate, materialTypeConfig } from '@/components/materials/materials-utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface MaterialCardProps {
  material: MaterialItemData;
  onSelect: (materialId: string) => void;
}

export function MaterialCard({ material, onSelect }: MaterialCardProps) {
  const config = materialTypeConfig[material.type];
  const MaterialIcon = config.icon;

  return (
    <div className="rounded-lg border border-border bg-card p-4 transition hover:border-primary">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 flex-1 items-start gap-4">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <MaterialIcon className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <h3 className="font-semibold">{material.title}</h3>
              <Badge variant="outline" className="text-xs">
                {config.label}
              </Badge>
            </div>
            <p className="line-clamp-2 text-sm text-muted-foreground">{material.description}</p>
            <p className="mt-3 text-xs text-muted-foreground">Uploaded {formatMaterialDate(material.uploadedAt)}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 lg:justify-end">
          <Button variant="ghost" size="sm" className="gap-2" onClick={() => onSelect(material.id)}>
            <Eye className="h-4 w-4" />
            Preview
          </Button>
          <SendToAIButton material={material} />
        </div>
      </div>
    </div>
  );
}
