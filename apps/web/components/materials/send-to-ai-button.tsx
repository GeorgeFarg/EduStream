'use client';

import { Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';

import type { MaterialItemData } from '@/components/materials/types';
import { Button } from '@/components/ui/button';
import { writeAiChatDraft } from '@/lib/ai-chat-store';

interface SendToAIButtonProps {
  material: MaterialItemData;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon' | 'icon-sm' | 'icon-lg';
  className?: string;
}

export function SendToAIButton({
  material,
  variant = 'outline',
  size = 'sm',
  className,
}: SendToAIButtonProps) {
  const router = useRouter();

  const handleSendToAI = () => {
    writeAiChatDraft({
      message: `Explain this material: ${material.title}`,
      material: {
        id: material.id,
        title: material.title,
        type: material.type,
        description: material.description,
        uploadedAt: material.uploadedAt,
        externalLink: material.externalLink,
      },
    });

    router.push('/chat');
  };

  return (
    <Button variant={variant} size={size} className={className} onClick={handleSendToAI}>
      <Sparkles className="h-4 w-4" />
      Ask AI about this
    </Button>
  );
}
