"use client";

import { useEffect, useRef, useState } from "react";
import axiosClient from "@/util/axiosClient";
import { Send, MessageCircle } from "lucide-react";

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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

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

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
        <MessageCircle size={18} className="text-[#1a73e8]" />
        <h3 className="font-semibold text-sm text-slate-800 dark:text-slate-100 truncate">
          {className ? `${className} Chat` : "Class Chat"}
        </h3>
        <span className="ml-auto text-xs text-slate-500 dark:text-slate-400 shrink-0">
          {messages.length}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
        {messages.length === 0 && (
          <div className="text-center text-xs text-slate-400 dark:text-slate-500 py-8">
            No messages yet. Start the conversation!
          </div>
        )}
        {messages.map((msg) => (
          <div key={msg.id} className="flex flex-col gap-0.5">
            <div className="flex items-baseline gap-2">
              <span className="text-xs font-semibold text-[#1a73e8]">
                {msg.sender.name}
              </span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500">
                {formatTime(msg.createdAt)}
              </span>
            </div>
            <p className="text-sm text-slate-700 dark:text-slate-300 break-words">
              {msg.content}
            </p>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {error && (
        <div className="px-3 py-1.5 text-xs text-red-600 bg-red-50 dark:bg-red-900/20 text-center">
          {error}
        </div>
      )}

      <div className="flex items-center gap-2 px-3 py-2 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">

          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          className="flex-1 text-sm px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1a73e8] focus:ring-offset-1"
        />

          onClick={sendMessage}
          disabled={loading || !input.trim()}
          className="p-2 rounded-lg bg-[#1a73e8] hover:bg-[#1557b0] disabled:opacity-50 disabled:cursor-not-allowed text-white transition-colors"
          aria-label="Send message"
        >
          <Send size={16} />
        </button>
      </div>
  );
}
