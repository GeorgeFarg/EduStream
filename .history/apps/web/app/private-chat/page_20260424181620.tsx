"use client";

import { useEffect, useRef, useState } from "react";
import axiosClient from "@/util/axiosClient";
import { Send, MessageSquare, ChevronLeft, User } from "lucide-react";
import Link from "next/link";

interface ConversationPartner {
  id: number;
  name: string;
  email: string;
}

interface LastMessage {
  id: number;
  content: string;
  createdAt: string;
  sentByMe: boolean;
}

interface Conversation {
  partner: ConversationPartner;
  lastMessage: LastMessage;
}

interface PrivateMessage {
  id: number;
  content: string;
  senderId: number;
  receiverId: number;
  createdAt: string;
  sender: {
    id: number;
    name: string;
    email: string;
  };
  receiver: {
    id: number;
    name: string;
    email: string;
  };
}

export default function PrivateChatPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activePartnerId, setActivePartnerId] = useState<number | null>(null);
  const [messages, setMessages] = useState<PrivateMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSidebar, setShowSidebar] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Get current user id from localStorage or a global store
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  useEffect(() => {
    // Try to get user info from localStorage or an API
    const fetchCurrentUser = async () => {
      try {
        const res = await axiosClient.get("/api/auth/me");
        if (res.data?.user?.id) {
          setCurrentUserId(res.data.user.id);
        }
      } catch {
        // fallback: try to parse from any stored data
      }
    };
    fetchCurrentUser();
  }, []);

  const fetchConversations = async () => {
    try {
      const res = await axiosClient.get("/api/private-chat/conversations");
      setConversations(res.data.conversations || []);
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || "Failed to load conversations");
    }
  };

  const fetchMessages = async (partnerId: number) => {
    try {
      const res = await axiosClient.get(`/api/private-chat/messages/${partnerId}`);
      setMessages(res.data.messages || []);
      setError(null);
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || "Failed to load messages");
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (activePartnerId !== null) {
      fetchMessages(activePartnerId);
      intervalRef.current = setInterval(() => fetchMessages(activePartnerId), 3000);
      return () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
      };
    }
  }, [activePartnerId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || activePartnerId === null) return;
    setLoading(true);
    try {
      const res = await axiosClient.post(`/api/private-chat/messages/${activePartnerId}`, {
        content: input.trim(),
      });
      setMessages((prev) => [...prev, res.data]);
      setInput("");
      setError(null);
      fetchConversations();
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

  const activePartner = conversations.find((c) => c.partner.id === activePartnerId)?.partner;

  return (
    <div className="h-screen flex flex-col gradient-bg overflow-hidden text-white font-sans">
      <header className="w-full shrink-0 z-50 px-4 py-3 border-b border-white/10 flex items-center gap-3">
        <Link href="/dashboard" className="text-white/60 hover:text-white transition-colors">
          <ChevronLeft size={20} />
        </Link>
        <MessageSquare size={18} className="text-[#0d7ff2]" />
        <h1 className="font-semibold text-sm">Private Chat</h1>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Conversations Sidebar */}
        <div
          className={`${
            showSidebar ? "flex" : "hidden"
          } md:flex w-full md:w-72 flex-col border-r border-white/10 bg-[#0a0a0a]/50`}
        >
          <div className="px-4 py-3 border-b border-white/10">
            <h2 className="text-xs font-bold uppercase tracking-wider text-white/40">Conversations</h2>
          </div>
          <div className="flex-1 overflow-y-auto">
            {conversations.length === 0 && (
              <div className="text-center text-xs text-white/30 py-8 px-4">
                No conversations yet. Start chatting with someone!
              </div>
            )}
            {conversations.map((conv) => (
              <button
                key={conv.partner.id}
                onClick={() => {
                  setActivePartnerId(conv.partner.id);
                  setShowSidebar(false);
                }}
                className={`w-full text-left px-4 py-3 border-b border-white/5 transition-all ${
                  activePartnerId === conv.partner.id
                    ? "bg-[#0d7ff2]/10 border-l-2 border-l-[#0d7ff2]"
                    : "hover:bg-white/5"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#0d7ff2]/20 flex items-center justify-center text-[#0d7ff2] text-xs font-bold shrink-0">
                    {conv.partner.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{conv.partner.name}</p>
                    <p className="text-[10px] text-white/40 truncate">
                      {conv.lastMessage.sentByMe ? "You: " : ""}
                      {conv.lastMessage.content}
                    </p>
                  </div>
                  <span className="text-[9px] text-white/30 shrink-0">
                    {formatTime(conv.lastMessage.createdAt)}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Chat Area */}
        <div className={`${showSidebar ? "hidden" : "flex"} md:flex flex-1 flex-col bg-[#0a0a0a]/30`}>
          {activePartnerId === null ? (
            <div className="flex-1 flex items-center justify-center text-white/30 text-sm">
              Select a conversation to start chatting
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div className="px-4 py-3 border-b border-white/10 flex items-center gap-3">
                <button
                  onClick={() => setShowSidebar(true)}
                  className="md:hidden text-white/60 hover:text-white"
                >
                  <ChevronLeft size={20} />
                </button>
                <div className="w-8 h-8 rounded-full bg-[#0d7ff2]/20 flex items-center justify-center text-[#0d7ff2] text-xs font-bold shrink-0">
                  {activePartner?.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium">{activePartner?.name}</p>
                  <p className="text-[10px] text-white/40">{activePartner?.email}</p>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map((msg) => {
                  const isMe = msg.senderId === currentUserId;
                  return (
                    <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[75%] px-3 py-2 rounded-2xl text-xs sm:text-sm ${
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
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="px-3 py-2 border-t border-white/10 flex items-center gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type a message..."
                  className="flex-1 text-sm px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#0d7ff2] focus:ring-offset-0"
                />
                <button
                  type="button"
                  onClick={sendMessage}
                  disabled={loading || !input.trim()}
                  className="p-2 rounded-lg bg-[#0d7ff2] hover:bg-[#0b6fd1] disabled:opacity-50 disabled:cursor-not-allowed text-white transition-colors"
                >
                  <Send size={16} />
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
