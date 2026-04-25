"use client";

import { useEffect, useRef, useState } from "react";
import axiosClient from "@/util/axiosClient";
import { Send, MessageCircle, Users } from "lucide-react";
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
        if (res.data?.user?.id) {
          setCurrentUserId(res.data.user.id);
        }
      } catch {
        // fallback
      }
    };
    fetchCurrentUser();
  }, []);

  const fetchMessages = async () => {
    try {
      const res = await axiosClient.get(`/api/classes/${classId}/chat`);
      setMessages(res.data.messages || []);
      setError(null);
    } catch (err: any) {
      if (!intervalRef.current) {
        setError(err?.response?.data?.error?.message || "Failed to load messages");
      }
    }
  };

  useEffect(() => {
    fetchMessages();
    intervalRef.current = setInterval(fetchMessages, 3000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [classId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;
    setLoading(true);
    try {
      const res = await axiosClient.post(`/api/classes/${classId}/chat`, {
        content: input.trim(),
      });
      setMessages((prev) => [...prev, res.data]);
      setInput("");
      setError(null);
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || "Failed to send message");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handlePrivateChat = (userId: number) => {
    router.push(`/private-chat?to=${userId}`);
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getAvatarColor = (userId: number) => {
    const colors = [
      "bg-red-500",
      "bg-orange-500",
      "bg-amber-500",
      "bg-green-500",
      "bg-emerald-500",
      "bg-teal-500",
      "bg-cyan-500",
      "bg-sky-500",
      "bg-blue-500",
      "bg-indigo-500",
      "bg-violet-500",
      "bg-purple-500",
      "bg-fuchsia-500",
      "bg-pink-500",
      "bg-rose-500",
    ];
    return colors[userId % colors.length];
  };

  return (
    <div className="flex flex-col h-full rounded-xl border border-white/10 bg-[#0a0a0a]/60 backdrop-blur-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 sm:px-4 py-2.5 sm:py-3 border-b border-white/10 bg-[#0a0a0a]/50 shrink-0">
        <MessageCircle size={16} className="text-[#0d7ff2]" />
        <h3 className="font-semibold text-xs sm:text-sm text-white truncate">
          {className ? className : "Class Chat"}
        </h3>
        <div className="ml-auto flex items-center gap-1.5 text-white/30">
          <Users size={12} />
          <span className="text-[10px] sm:text-xs">{messages.length}</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 custom-scrollbar">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center text-white/30 text-xs sm:text-sm py-8 sm:py-12 gap-2">
            <MessageCircle size={32} className="text-white/10" />
            <p>No messages yet. Start the conversation!</p>
          </div>
        )}
        {messages.map((msg, index) => {
          const isMe = msg.senderId === currentUserId;
          const prevMsg = index > 0 ? messages[index - 1] : null;
          const showName = !isMe && (!prevMsg || prevMsg.senderId !== msg.senderId);

          return (
            <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"} gap-2`}>
              {/* Avatar for other users */}
              {!isMe && showName && (
                <button
                  onClick={() => handlePrivateChat(msg.senderId)}
                  className={`w-8 h-8 rounded-full ${getAvatarColor(msg.senderId)} flex items-center justify-center text-white text-[10px] font-bold shrink-0 cursor-pointer hover:opacity-80 transition-opacity`}
                  title={`Chat with ${msg.sender.name}`}
                >
                  {getInitials(msg.sender.name)}
                </button>
              )}
              {/* Spacer for consecutive messages from same user */}
              {!isMe && !showName && <div className="w-8 shrink-0" />}

              <div className={`max-w-[75%] flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                {showName && (
                  <span className="text-[10px] text-white/40 mb-0.5 ml-1">
                    {msg.sender.name}
                  </span>
                )}
                <div
                  className={`px-3 py-2 rounded-2xl text-xs sm:text-sm ${
                    isMe
                      ? "bg-[#0d7ff2] text-white rounded-br-md"
                      : "bg-white/10 text-white rounded-bl-md"
                  }`}
                >
                  <p className="break-words">{msg.content}</p>
                  <span className={`text-[9px] mt-1 block ${isMe ? "text-blue-200" : "text-white/40"}`}>
                    {formatTime(msg.createdAt)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Error */}
      {error && (
        <div className="px-3 py-1.5 text-[10px] sm:text-xs text-red-400 bg-red-500/10 text-center">
          {error}
        </div>
      )}

      {/* Input */}
      <div className="flex items-center gap-2 px-2 sm:px-3 py-2 border-t border-white/10 bg-[#0a0a0a]/50 shrink-0">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          className="flex-1 text-xs sm:text-sm px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#0d7ff2] focus:ring-offset-0"
        />
        <button
          type="button"
          onClick={sendMessage}
          disabled={loading || !input.trim()}
          className="p-2 rounded-lg bg-[#0d7ff2] hover:bg-[#0b6fd1] disabled:opacity-50 disabled:cursor-not-allowed text-white transition-colors"
          aria-label="Send message"
        >
          <Send size={14} />
        </button>
      </div>
    </div>
  );
}

