"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import axiosClient from "@/util/axiosClient";
import { MessageCircle, Search, Send, Users } from "lucide-react";
import { useRouter } from "next/navigation";

interface ChatMessage {
  id: number;
  content: string;
  classId: number;
  senderId: number;
  createdAt: string;
  updatedAt: string;
  sender: {
    id: number;
    name: string;
    email: string;
  };
}

interface ClassChatProps {
  classId: string;
  className?: string;
}

const AVATAR_COLORS = [
  "bg-rose-500",
  "bg-orange-500",
  "bg-amber-500",
  "bg-emerald-500",
  "bg-teal-500",
  "bg-cyan-500",
  "bg-sky-500",
  "bg-indigo-500",
  "bg-violet-500",
  "bg-fuchsia-500",
];

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function getAvatarColor(userId: number) {
  return AVATAR_COLORS[userId % AVATAR_COLORS.length];
}

function getErrorMessage(error: unknown, fallback: string) {
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error &&
    typeof (error as { response?: { data?: { error?: { message?: unknown } } } }).response?.data?.error?.message ===
      "string"
  ) {
    return (error as { response: { data: { error: { message: string } } } }).response.data.error.message;
  }

  return fallback;
}

export default function ClassChat({ classId, className }: ClassChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const res = await axiosClient.get("/api/auth/me");
        if (res.data?.user?.id) setCurrentUserId(res.data.user.id);
      } catch {
        // Chat still renders; messages simply won't be aligned as "mine" yet.
      }
    };

    fetchCurrentUser();
  }, []);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const res = await axiosClient.get(`/api/classes/${classId}/chat`);
        setMessages(res.data.messages || []);
        setError(null);
      } catch (err) {
        if (!intervalRef.current) {
          setError(getErrorMessage(err, "Failed to load messages"));
        }
      }
    };

    fetchMessages();
    intervalRef.current = setInterval(fetchMessages, 3000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = null;
    };
  }, [classId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    const content = input.trim();
    if (!content) return;

    setLoading(true);
    try {
      const res = await axiosClient.post(`/api/classes/${classId}/chat`, { content });
      setMessages((prev) => [...prev, res.data]);
      setInput("");
      setError(null);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to send message"));
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (dateStr: string) =>
    new Date(dateStr).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <section className="mx-auto flex h-full max-w-6xl overflow-hidden rounded-lg border border-white/10 bg-[#101820] shadow-2xl shadow-black/20">
      <aside className="hidden w-72 shrink-0 border-r border-white/10 bg-[#0c1219] p-4 lg:block">
        <div className="mb-5">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-white/35">Class chat</p>
          <h2 className="mt-2 truncate text-lg font-semibold text-white">{className || "Class Chat"}</h2>
          <p className="mt-1 text-sm text-white/45">Keep class questions and quick updates in one place.</p>
        </div>

        <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-white/55">Messages</span>
            <span className="font-medium text-white">{messages.length}</span>
          </div>
          <div className="mt-3 flex items-center gap-2 text-xs text-emerald-300">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            Auto refresh active
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex shrink-0 items-center gap-3 border-b border-white/10 bg-[#0c1219]/90 px-4 py-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-400/15 text-sky-300">
            <MessageCircle size={18} />
          </div>
          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold text-white">{className || "Class Chat"}</h3>
            <p className="text-xs text-white/40">{messages.length} messages</p>
          </div>
          <div className="ml-auto hidden items-center gap-2 rounded-md border border-white/10 bg-white/[0.03] px-2.5 py-1.5 text-xs text-white/45 sm:flex">
            <Users size={13} />
            Class room
          </div>
        </header>

        <div className="flex-1 overflow-y-auto bg-[#0b1118] p-3 sm:p-5">
          {messages.length === 0 && (
            <div className="flex h-full min-h-80 items-center justify-center">
              <div className="max-w-sm text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-white/5 text-white/20">
                  <Search size={22} />
                </div>
                <p className="text-sm font-medium text-white/70">No messages yet</p>
                <p className="mt-1 text-xs text-white/35">Start the class conversation with a clear question or update.</p>
              </div>
            </div>
          )}

          <div className="space-y-2">
            {messages.map((msg, index) => {
              const isMe = msg.senderId === currentUserId;
              const prevMsg = index > 0 ? messages[index - 1] : null;
              const showMeta = !prevMsg || prevMsg.senderId !== msg.senderId;

              return (
                <div key={msg.id} className={`flex gap-2 ${isMe ? "justify-end" : "justify-start"}`}>
                  {!isMe && showMeta && (
                    <button
                      onClick={() => router.push(`/private-chat?to=${msg.senderId}`)}
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${getAvatarColor(
                        msg.senderId,
                      )} text-[10px] font-bold text-white transition-opacity hover:opacity-80`}
                      title={`Chat with ${msg.sender.name}`}
                    >
                      {getInitials(msg.sender.name)}
                    </button>
                  )}
                  {!isMe && !showMeta && <div className="w-8 shrink-0" />}

                  <div className={`flex max-w-[82%] flex-col ${isMe ? "items-end" : "items-start"}`}>
                    {showMeta && (
                      <span className="mb-1 px-1 text-[11px] text-white/35">
                        {isMe ? "You" : msg.sender.name}
                      </span>
                    )}
                    <div
                      className={`rounded-2xl px-3 py-2 text-sm leading-5 shadow-sm ${
                        isMe
                          ? "rounded-br-md bg-sky-500 text-white"
                          : "rounded-bl-md border border-white/10 bg-white/[0.06] text-white/85"
                      }`}
                    >
                      <p className="break-words">{msg.content}</p>
                      <span className={`mt-1 block text-[10px] ${isMe ? "text-sky-100/80" : "text-white/35"}`}>
                        {formatTime(msg.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div ref={messagesEndRef} />
        </div>

        {error && (
          <div className="border-t border-red-400/20 bg-red-500/10 px-4 py-2 text-center text-xs text-red-300">
            {error}
          </div>
        )}

        <footer className="shrink-0 border-t border-white/10 bg-[#0c1219] p-3">
          <div className="flex items-end gap-2 rounded-lg border border-white/10 bg-white/[0.04] p-2 focus-within:border-sky-400/50">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              rows={1}
              className="max-h-28 min-h-10 flex-1 resize-none bg-transparent px-2 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none"
            />
            <button
              type="button"
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-sky-500 text-white transition-colors hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-45"
              aria-label="Send message"
            >
              <Send size={16} />
            </button>
          </div>
        </footer>
      </div>
    </section>
  );
}
