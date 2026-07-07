'use client';

import { useEffect, useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Button } from '@/components/ui/button';
import Input from '@/components/ui/input';
import { Loader2, Paperclip, Send, Sparkles, X } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  clearAiChatDraft,
  readAiChatDraft,
  subscribeToAiChatDraft,
  writeAiChatDraft,
} from '@/lib/ai-chat-store';
import { fetchClassMaterials } from '@/lib/materials-api';
import { useClassContext } from '@/contexts/ClassContext';
import { apiBaseUrl } from '@/config/env';
import type { ChatMaterialContext, MaterialItemData } from '@/components/materials/types';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  material?: ChatMaterialContext | null;
}

const suggestedPrompts = [
  'Explain calculus concepts',
  'Help with homework',
  'Review notes',
  'Practice problems',
];

function toChatMaterialContext(material: MaterialItemData): ChatMaterialContext {
  return {
    id: material.id,
    title: material.title,
    type: material.type,
    description: material.description,
    uploadedAt: material.uploadedAt,
    externalLink: material.externalLink,
  };
}

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [message, setMessage] = useState('');
  const [attachedMaterial, setAttachedMaterial] = useState<ChatMaterialContext | null>(null);
  const [selectedMaterialId, setSelectedMaterialId] = useState('');
  const [materials, setMaterials] = useState<MaterialItemData[]>([]);
  const [isLoadingMaterials, setIsLoadingMaterials] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { currentClass } = useClassContext();

  useEffect(() => {
    const applyDraft = (draft: ReturnType<typeof readAiChatDraft>) => {
      if (!draft) {
        return;
      }

      setMessage(draft.message ?? '');
      setAttachedMaterial(draft.material ?? null);
      setSelectedMaterialId(draft.material?.id ?? '');
    };

    applyDraft(readAiChatDraft());

    return subscribeToAiChatDraft((draft) => {
      if (!draft) {
        return;
      }

      setMessage(draft.message ?? '');
      setAttachedMaterial(draft.material ?? null);
      setSelectedMaterialId(draft.material?.id ?? '');
    });
  }, []);

  useEffect(() => {
    if (!currentClass?.id) {
      setMaterials([]);
      setSelectedMaterialId('');
      setAttachedMaterial(null);
      return;
    }

    let isMounted = true;

    const loadMaterials = async () => {
      setIsLoadingMaterials(true);
      setError(null);

      try {
        const nextMaterials = await fetchClassMaterials(Number(currentClass.id));
        if (!isMounted) {
          return;
        }

        setMaterials(nextMaterials);
        if (selectedMaterialId && !nextMaterials.some((material) => material.id === selectedMaterialId)) {
          setSelectedMaterialId('');
          setAttachedMaterial(null);
        }
      } catch {
        if (isMounted) {
          setError('We could not load the materials for this class right now.');
        }
      } finally {
        if (isMounted) {
          setIsLoadingMaterials(false);
        }
      }
    };

    void loadMaterials();

    return () => {
      isMounted = false;
    };
  }, [currentClass?.id]);

  const visiblePrompts = useMemo(() => messages.length === 0, [messages.length]);

  const handleSelectMaterial = (materialId: string) => {
    const nextMaterial = materials.find((material) => material.id === materialId) ?? null;
    const materialContext = nextMaterial ? toChatMaterialContext(nextMaterial) : null;

    setSelectedMaterialId(materialId);
    setAttachedMaterial(materialContext);
    writeAiChatDraft({ message, material: materialContext ?? undefined });
  };

  const handleSend = async () => {
    const nextValue = message.trim();

    if (!attachedMaterial || !currentClass?.id) {
      setError('Select a material from your class before asking the AI a question.');
      return;
    }

    const userMessage: ChatMessage = {
      id: `${Date.now()}`,
      role: 'user',
      content: nextValue || `Explain this material: ${attachedMaterial.title}`,
      timestamp: 'Just now',
      material: attachedMaterial,
    };

    const assistantMessageId = `${Date.now()}-assistant`;
    const assistantMessage: ChatMessage = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: 'Just now',
    };

    setMessages((current) => [...current, userMessage, assistantMessage]);
    setMessage('');
    setIsSending(true);
    setError(null);

    try {
      const response = await fetch(`${apiBaseUrl ?? ''}/api/classes/${currentClass.id}/materials/${attachedMaterial.id}/ask`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: nextValue || `Explain this material: ${attachedMaterial.title}`,
        }),
      });

      if (!response.ok) {
        throw new Error('The AI service could not answer that question right now.');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('The AI response could not be streamed.');
      }

      let streamedText = '';
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const chunks = buffer.split('\n\n');
        buffer = chunks.pop() ?? '';

        for (const chunk of chunks) {
          if (!chunk.startsWith('data:')) {
            continue;
          }

          const payload = chunk.replace(/^data:\s*/, '').trim();
          if (!payload) {
            continue;
          }

          try {
            const eventData = JSON.parse(payload) as { delta?: string; done?: boolean; answer?: string };
            if (eventData.delta) {
              streamedText += eventData.delta;
              setMessages((current) =>
                current.map((msg) =>
                  msg.id === assistantMessageId ? { ...msg, content: streamedText } : msg,
                ),
              );
            }

            if (eventData.done) {
              const finalText = eventData.answer?.trim() || streamedText.trim();
              setMessages((current) =>
                current.map((msg) =>
                  msg.id === assistantMessageId ? { ...msg, content: finalText } : msg,
                ),
              );
            }
          } catch {
            // Ignore malformed stream events and continue.
          }
        }
      }

      const leftover = buffer.trim();
      if (leftover.startsWith('data:')) {
        try {
          const eventData = JSON.parse(leftover.replace(/^data:\s*/, '').trim()) as {
            delta?: string;
            done?: boolean;
            answer?: string;
          };
          if (eventData.delta) {
            streamedText += eventData.delta;
          }
          if (eventData.done) {
            streamedText = eventData.answer?.trim() || streamedText.trim();
          }
        } catch {
          // Ignore malformed stream events and continue.
        }
      }

      if (!streamedText.trim()) {
        streamedText = 'I could not produce an answer from the uploaded material.';
      }

      setMessages((current) =>
        current.map((msg) =>
          msg.id === assistantMessageId ? { ...msg, content: streamedText } : msg,
        ),
      );

      writeAiChatDraft({ message: '', material: attachedMaterial });
    } catch {
      setError('The AI service could not answer that question right now.');
      setMessages((current) =>
        current.map((msg) =>
          msg.id === assistantMessageId ? { ...msg, content: 'Sorry, I could not generate a response.' } : msg,
        ),
      );
    } finally {
      setIsSending(false);
    }
  };

  const handleRemoveAttachment = () => {
    setAttachedMaterial(null);
    setSelectedMaterialId('');
    writeAiChatDraft({ message, material: undefined });
  };

  const handleInputChange = (value: string) => {
    setMessage(value);
    writeAiChatDraft({ message: value, material: attachedMaterial ?? undefined });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">AI Chat</h1>
        <p className="text-muted-foreground mt-1">Get help with your coursework</p>
      </div>

      <div className="bg-card border border-border rounded-lg flex flex-col min-h-112 max-h-[calc(100vh-14rem)] overflow-hidden">
        <ScrollArea className="flex-1 overflow-y-auto p-6">
          <div className="space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md xl:max-w-lg px-4 py-3 rounded-lg ${msg.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-foreground'}`}
                >
                  {msg.material && (
                    <div className="mb-2 rounded-md border border-current/20 bg-black/5 px-3 py-2 text-left text-xs">
                      <p className="font-medium">{msg.material.title}</p>
                      <p className="opacity-80">{msg.material.type.toUpperCase()}</p>
                    </div>
                  )}
                  {msg.role === 'assistant' ? (
                    <div className="text-sm leading-6 [&_ul]:ml-5 [&_ul]:list-disc [&_ol]:ml-5 [&_ol]:list-decimal [&_li]:mt-1 [&_code]:rounded [&_code]:bg-black/10 [&_code]:px-1.5 [&_code]:py-0.5 [&_pre]:overflow-x-auto [&_pre]:rounded [&_pre]:bg-black/10 [&_pre]:p-2">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  )}
                  <span className="text-xs opacity-70 mt-2 block">{msg.timestamp}</span>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="border-t border-border p-6 space-y-3">
          {visiblePrompts && (
            <div className="grid grid-cols-2 gap-2">
              {suggestedPrompts.map((prompt) => (
                <Button
                  key={prompt}
                  variant="outline"
                  size="sm"
                  className="text-left justify-start"
                  onClick={() => handleInputChange(prompt)}
                >
                  {prompt}
                </Button>
              ))}
            </div>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-2 md:flex-row md:items-center">
              <label className="text-sm text-muted-foreground">Material</label>
              <select
                className="rounded-md border border-border bg-background px-3 py-2 text-sm"
                value={selectedMaterialId}
                onChange={(event) => handleSelectMaterial(event.target.value)}
                disabled={isLoadingMaterials || materials.length === 0}
              >
                <option value="">Select a material to ask about</option>
                {materials.map((material) => (
                  <option key={material.id} value={material.id}>
                    {material.title}
                  </option>
                ))}
              </select>
            </div>

            {attachedMaterial && (
              <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/40 px-3 py-2">
                <div className="flex min-w-0 items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{attachedMaterial.title}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className="text-[10px]">
                        {attachedMaterial.type.toUpperCase()}
                      </Badge>
                      <p className="truncate text-xs text-muted-foreground">{attachedMaterial.description}</p>
                    </div>
                  </div>
                </div>
                <Button variant="ghost" size="icon-sm" onClick={handleRemoveAttachment}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}

            <div className="flex gap-2">
              <Button variant="outline" size="icon" className="shrink-0">
                <Paperclip className="w-4 h-4" />
              </Button>
              <Input
                placeholder="Ask your question..."
                value={message}
                onChange={(event) => handleInputChange(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    void handleSend();
                  }
                }}
                className="bg-input"
              />
              <Button size="icon" className="shrink-0" onClick={() => void handleSend()} disabled={isSending}>
                {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
