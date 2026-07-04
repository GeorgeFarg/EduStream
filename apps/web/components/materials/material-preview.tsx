'use client';

import { ArrowLeft, Download, ExternalLink } from 'lucide-react';

import { SendToAIButton } from '@/components/materials/send-to-ai-button';
import type { MaterialItemData } from '@/components/materials/types';
import { formatMaterialDate, materialTypeConfig } from '@/components/materials/materials-utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface MaterialPreviewProps {
  material: MaterialItemData;
  onBack: () => void;
}

function MaterialContentPreview({ material }: { material: MaterialItemData }) {
  if (material.type === 'image' && material.attachment?.url) {
    return (
      <img
        src={material.attachment.url}
        alt={material.title}
        className="max-h-[420px] w-full rounded-lg border border-border object-contain"
      />
    );
  }

  if (material.type === 'pdf') {
    if (material.attachment?.url) {
      return (
        <iframe
          src={material.attachment.url}
          title={material.title}
          className="h-[420px] w-full rounded-lg border border-border bg-background"
        />
      );
    }

    return (
      <iframe
        title={material.title}
        srcDoc={`<html><body style="font-family:Arial,sans-serif;padding:24px;color:#111827;"><h2>${material.title}</h2><p>${material.description}</p><p>This PDF preview is ready for uploaded files and stored material URLs.</p></body></html>`}
        className="h-[420px] w-full rounded-lg border border-border bg-background"
      />
    );
  }

  if (material.type === 'docx') {
    return (
      <div className="rounded-lg border border-border bg-background p-6">
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
          {material.attachment?.previewText ??
            `${material.title}\n\n${material.description}\n\nThis frontend preview shows the available summary for DOCX materials.`}
        </p>
      </div>
    );
  }

  if (material.type === 'link') {
    return (
      <div className="rounded-lg border border-border bg-background p-6">
        <p className="mb-4 text-sm text-muted-foreground">
          This material links to an external resource.
        </p>
        {material.externalLink && (
          <a
            href={material.externalLink}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 text-sm font-medium text-primary"
          >
            Open resource
            <ExternalLink className="h-4 w-4" />
          </a>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-background p-6">
      <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
        {material.attachment?.previewText ?? material.description}
      </p>
    </div>
  );
}

export function MaterialPreview({ material, onBack }: MaterialPreviewProps) {
  const config = materialTypeConfig[material.type];
  const MaterialIcon = config.icon;

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" className="gap-2" onClick={onBack}>
        <ArrowLeft className="h-4 w-4" />
        Back to materials list
      </Button>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_320px]">
        <div className="space-y-6">
          <div className="rounded-lg border border-border bg-card p-6 transition-all duration-200">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <h1 className="text-3xl font-bold">{material.title}</h1>
                  <Badge variant="outline" className="gap-1.5 text-xs">
                    <MaterialIcon className="h-3 w-3" />
                    {config.label}
                  </Badge>
                </div>
                <p className="text-muted-foreground">{material.description}</p>
              </div>
              <SendToAIButton material={material} />
            </div>

            <MaterialContentPreview material={material} />
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="mb-1 text-xs text-muted-foreground">TYPE</p>
            <p className="text-lg font-semibold">{config.label}</p>
          </div>

          <div className="rounded-lg border border-border bg-card p-4">
            <p className="mb-1 text-xs text-muted-foreground">UPLOADED</p>
            <p className="text-lg font-semibold">{formatMaterialDate(material.uploadedAt)}</p>
          </div>

          {material.sourceName && (
            <div className="rounded-lg border border-border bg-card p-4">
              <p className="mb-1 text-xs text-muted-foreground">SOURCE</p>
              <p className="text-sm font-medium">{material.sourceName}</p>
            </div>
          )}

          {material.externalLink && (
            <div className="rounded-lg border border-border bg-card p-4">
              <p className="mb-2 text-xs text-muted-foreground">LINK</p>
              <a
                href={material.externalLink}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-sm text-primary"
              >
                Open resource
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          )}

          <div className="rounded-lg border border-border bg-card p-4">
            <p className="mb-2 text-xs text-muted-foreground">ACTIONS</p>
            <div className="flex flex-col gap-2">
              <SendToAIButton material={material} className="w-full justify-center" />
              {material.attachment?.url && (
                <Button variant="outline" className="w-full justify-center gap-2" asChild>
                  <a href={material.attachment.url} target="_blank" rel="noopener noreferrer" download>
                    <Download className="h-4 w-4" />
                    Download file
                  </a>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
