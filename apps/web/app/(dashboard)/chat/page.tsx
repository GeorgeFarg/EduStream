'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import Input from '@/components/ui/input';
import { Send, Paperclip, Sparkles, X } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { clearAiChatDraft, readAiChatDraft, subscribeToAiChatDraft, writeAiChatDraft } from '@/lib/ai-chat-store';
import type { ChatMaterialContext } from '@/components/materials/types';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  material?: ChatMaterialContext | null;
}

const mockMessages: ChatMessage[] = [
  {
    id: '1',
    role: 'user',
    content: 'Can you explain how to solve differential equations?',
    timestamp: '2 minutes ago',
  },
  {
    id: '2',
    role: 'assistant',
    content:
      'Of course! Differential equations are fundamental in mathematics and physics. There are several methods depending on the type of equation. For first-order linear equations, we use integrating factors...',
    timestamp: '1 minute ago',
  },
  {
    id: '3',
    role: 'user',
    content: 'Can you provide an example?',
    timestamp: 'Just now',
  },
];

const suggestedPrompts = [
  'Explain calculus concepts',
  'Help with homework',
  'Review notes',
  'Practice problems',
];

export default function ChatPage() {
  const [messages, setMessages] = useState(mockMessages);
  const [message, setMessage] = useState('');
  const [attachedMaterial, setAttachedMaterial] = useState<ChatMaterialContext | null>(null);

  useEffect(() => {
    const applyDraft = (draft: ReturnType<typeof readAiChatDraft>) => {
      if (!draft) {
        return;
      }

      setMessage(draft.message ?? '');
      setAttachedMaterial(draft.material ?? null);
    };

    applyDraft(readAiChatDraft());

    return subscribeToAiChatDraft((draft) => {
      if (!draft) {
        return;
      }

      setMessage(draft.message ?? '');
      setAttachedMaterial(draft.material ?? null);
    });
  }, []);

  const visiblePrompts = useMemo(() => messages.length === 0, [messages.length]);

  const handleSend = () => {
    const nextValue = message.trim();

    if (!nextValue && !attachedMaterial) {
      return;
    }

    const userMessage: ChatMessage = {
      id: `${Date.now()}`,
      role: 'user',
      content: nextValue || `Explain this material: ${attachedMaterial?.title}`,
      timestamp: 'Just now',
      material: attachedMaterial,
    };

    const assistantMessage: ChatMessage = {
      id: `${Date.now()}-assistant`,
      role: 'assistant',
      content: attachedMaterial
        ? `Here is a study-oriented explanation for "${attachedMaterial.title}". I can summarize it, break it into key points, or turn it into review questions.`
        : 'I can help with that. Ask a follow-up and I will keep building on the explanation.',
      timestamp: 'Just now',
    };

    setMessages((current) => [...current, userMessage, assistantMessage]);
    setMessage('');
    setAttachedMaterial(null);
    clearAiChatDraft();
  };

  const handleRemoveAttachment = () => {
    setAttachedMaterial(null);
    writeAiChatDraft({ message, material: undefined });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">AI Chat</h1>
        <p className="text-muted-foreground mt-1">Get help with your coursework</p>
      </div>

      {/* Chat Container */}
      <div className="bg-card border border-border rounded-lg flex flex-col h-[600px]">
        {/* Messages */}
        <ScrollArea className="flex-1 p-6">
          <div className="space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
              >
                <div
                  className={`max-w-xs lg:max-w-md xl:max-w-lg px-4 py-3 rounded-lg ${msg.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-foreground'
                    }`}
                >
                  {msg.material && (
                    <div className="mb-2 rounded-md border border-current/20 bg-black/5 px-3 py-2 text-left text-xs">
                      <p className="font-medium">{msg.material.title}</p>
                      <p className="opacity-80">{msg.material.type.toUpperCase()}</p>
                    </div>
                  )}
                  <p className="text-sm">{msg.content}</p>
                  <span className="text-xs opacity-70 mt-2 block">
                    {msg.timestamp}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="border-t border-border p-6 space-y-3">
          {visiblePrompts && (
            <div className="grid grid-cols-2 gap-2">
              {suggestedPrompts.map((prompt) => (
                <Button
                  key={prompt}
                  variant="outline"
                  size="sm"
                  className="text-left justify-start"
                  onClick={() => setMessage(prompt)}
                >
                  {prompt}
                </Button>
              ))}
            </div>
          )}
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
            <Button variant="outline" size="icon" className="flex-shrink-0">
              <Paperclip className="w-4 h-4" />
            </Button>
            <Input
              placeholder="Ask your question..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="bg-input"
            />
            <Button size="icon" className="flex-shrink-0" onClick={handleSend}>
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
