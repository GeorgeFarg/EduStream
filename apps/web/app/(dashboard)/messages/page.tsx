'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import Input from '@/components/ui/input';
import { Search, MessageCircle, Loader2, Send } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { apiBaseUrl } from '@/config/env';
import { useClassContext } from '@/contexts/ClassContext';

interface User {
  id: number;
  name: string;
  email: string;
}

interface Message {
  id: number;
  content: string;
  senderId: number;
  receiverId: number;
  createdAt: string;
  sender: User;
  receiver: User;
}

interface Conversation {
  partner: User;
  lastMessage: {
    id: number;
    content: string;
    createdAt: string;
    sentByMe: boolean;
  };
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'Yesterday';
  return `${diffDays}d`;
}

export default function MessagesPage() {
  const { currentUser, userId } = useClassContext();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedPartner, setSelectedPartner] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loadingConvs, setLoadingConvs] = useState(false);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!userId) return;
    setLoadingConvs(true);
    fetch(`${apiBaseUrl}/api/private-chat/conversations`, { credentials: 'include' })
      .then((res) => res.json())
      .then((data: { conversations: Conversation[] }) => {
        setConversations(data.conversations || []);
      })
      .catch(() => {})
      .finally(() => setLoadingConvs(false));
  }, [userId]);

  useEffect(() => {
    if (!selectedPartner) return;
    setLoadingMsgs(true);
    fetch(`${apiBaseUrl}/api/private-chat/messages/${selectedPartner.id}`, {
      credentials: 'include',
    })
      .then((res) => res.json())
      .then((data: { messages: Message[] }) => {
        setMessages(data.messages || []);
        setTimeout(() => {
          if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
          }
        }, 50);
      })
      .catch(() => {})
      .finally(() => setLoadingMsgs(false));
  }, [selectedPartner?.id]);

  const handleSend = async () => {
    if (!selectedPartner || !newMessage.trim()) return;
    setSending(true);
    try {
      const res = await fetch(
        `${apiBaseUrl}/api/private-chat/messages/${selectedPartner.id}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ content: newMessage.trim() }),
        },
      );
      const data: Message = await res.json();
      if (res.ok) {
        setMessages((prev) => [...prev, data]);
        setNewMessage('');
        setTimeout(() => {
          if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
          }
        }, 50);
      }
    } catch {}
    setSending(false);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
      {/* Conversations List */}
      <div className="bg-card border border-border rounded-lg flex flex-col md:col-span-1">
        <div className="p-4 border-b border-border">
          <h2 className="font-semibold mb-3">Messages</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search..." className="pl-10 bg-input" />
          </div>
        </div>

        <ScrollArea className="flex-1">
          {loadingConvs ? (
            <div className="flex items-center gap-2 justify-center py-8 text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading...
            </div>
          ) : conversations.length === 0 ? (
            <p className="text-center py-8 text-sm text-muted-foreground">
              No conversations yet
            </p>
          ) : (
            <div className="divide-y divide-border">
              {conversations.map((conv) => (
                <button
                  key={conv.partner.id}
                  onClick={() => setSelectedPartner(conv.partner)}
                  className={`w-full p-4 text-left transition border-l-2 ${
                    selectedPartner?.id === conv.partner.id
                      ? 'bg-muted border-l-primary'
                      : 'hover:bg-muted/50 border-l-transparent'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                        {conv.partner.name[0]}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-sm truncate">
                          {conv.partner.name}
                        </h3>
                        <p className="text-xs text-muted-foreground truncate">
                          {conv.lastMessage.sentByMe ? 'You: ' : ''}
                          {conv.lastMessage.content}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground flex-shrink-0">
                      {formatTime(conv.lastMessage.createdAt)}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Chat Area */}
      <div
        className={`${
          selectedPartner ? 'flex' : 'hidden md:flex'
        } md:col-span-2 bg-card border border-border rounded-lg flex-col`}
      >
        {!selectedPartner ? (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            Select a conversation to start messaging
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full gradient-accent flex items-center justify-center text-white text-sm font-bold">
                  {selectedPartner.name[0]}
                </div>
                <div>
                  <h2 className="font-semibold">{selectedPartner.name}</h2>
                  <p className="text-xs text-muted-foreground">{selectedPartner.email}</p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4" ref={scrollRef}>
              {loadingMsgs ? (
                <div className="flex items-center gap-2 justify-center py-8 text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" /> Loading messages...
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((msg) => {
                    const isMe = msg.senderId === userId;
                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-xs px-4 py-2 rounded-lg text-sm ${
                            isMe
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted text-foreground'
                          }`}
                        >
                          {msg.content}
                          <div
                            className={`text-xs mt-1 ${
                              isMe ? 'text-primary-foreground/70' : 'text-muted-foreground'
                            }`}
                          >
                            {formatTime(msg.createdAt)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>

            {/* Input */}
            <div className="border-t border-border p-4 flex gap-2">
              <Input
                placeholder="Type a message..."
                className="bg-input flex-1"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
              />
              <Button size="icon" onClick={handleSend} disabled={sending || !newMessage.trim()}>
                {sending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
