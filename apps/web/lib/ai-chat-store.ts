'use client';

import type { ChatMaterialContext } from '@/components/materials/types';

const STORAGE_KEY = 'edustream-ai-chat-draft';
const EVENT_NAME = 'edustream:ai-chat-draft';

export interface AiChatDraft {
  message: string;
  material?: ChatMaterialContext;
}

function isBrowser() {
  return typeof window !== 'undefined';
}

export function readAiChatDraft(): AiChatDraft | null {
  if (!isBrowser()) {
    return null;
  }

  const rawValue = window.localStorage.getItem(STORAGE_KEY);

  if (!rawValue) {
    return null;
  }

  try {
    return JSON.parse(rawValue) as AiChatDraft;
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export function writeAiChatDraft(draft: AiChatDraft) {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
  window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: draft }));
}

export function clearAiChatDraft() {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: null }));
}

export function subscribeToAiChatDraft(callback: (draft: AiChatDraft | null) => void) {
  if (!isBrowser()) {
    return () => undefined;
  }

  const handleCustomEvent = (event: Event) => {
    const customEvent = event as CustomEvent<AiChatDraft | null>;
    callback(customEvent.detail ?? null);
  };

  const handleStorage = (event: StorageEvent) => {
    if (event.key !== STORAGE_KEY) {
      return;
    }

    callback(readAiChatDraft());
  };

  window.addEventListener(EVENT_NAME, handleCustomEvent);
  window.addEventListener('storage', handleStorage);

  return () => {
    window.removeEventListener(EVENT_NAME, handleCustomEvent);
    window.removeEventListener('storage', handleStorage);
  };
}
