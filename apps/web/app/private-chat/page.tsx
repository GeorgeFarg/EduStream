"use client";

import { useEffect, useRef, useState, useCallback, type KeyboardEvent } from "react";
import axiosClient from "@/util/axiosClient";
import { Send, MessageSquare, ChevronLeft, Search, UserPlus, X, Inbox } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

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

interface SearchUser {
  id: number;
  name: string;
  email: string;
}

const getInitial = (name?: string) => name?.charAt(0).toUpperCase() || "?";

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

export default function PrivateChatPage() {
  const searchParams = useSearchParams();
  const toUserId = Number(searchParams.get("to"));

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activePartnerId, setActivePartnerId] = useState<number | null>(null);
  const [messages, setMessages] = useState<PrivateMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSidebar, setShowSidebar] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Get current user id from localStorage or a global store
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

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

  const fetchConversations = useCallback(async () => {
    try {
      const res = await axiosClient.get("/api/private-chat/conversations");
      setConversations(res.data.conversations || []);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load conversations"));
    }
  }, []);

  const fetchMessages = useCallback(async (partnerId: number) => {
    try {
      const res = await axiosClient.get(`/api/private-chat/messages/${partnerId}`);
      setMessages(res.data.messages || []);
      setError(null);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load messages"));
    }
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Auto-select user from URL ?to= parameter
  useEffect(() => {
    if (!toUserId || isNaN(toUserId)) return;

    // Wait for conversations to load first
    if (conversations.length > 0) {
      const exists = conversations.some((c) => c.partner.id === toUserId);
      if (exists) {
        setActivePartnerId(toUserId);
        setShowSidebar(false);
      } else {
        // User not in conversations yet - try to load messages anyway
        // The API will work if there's any prior messages
        setActivePartnerId(toUserId);
        setShowSidebar(false);
        fetchConversations();
      }
    }
  }, [toUserId, conversations, fetchConversations]);

  useEffect(() => {
    if (activePartnerId !== null) {
      fetchMessages(activePartnerId);
      intervalRef.current = setInterval(() => fetchMessages(activePartnerId), 3000);
      return () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
      };
    }
  }, [activePartnerId, fetchMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Debounced search
  const performSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    setSearchLoading(true);
    try {
      const res = await axiosClient.get(`/api/private-chat/search?q=${encodeURIComponent(query.trim())}`);
      setSearchResults(res.data.users || []);
    } catch {
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  }, []);

  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      performSearch(searchQuery);
    }, 300);
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [searchQuery, performSearch]);

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

  const startConversation = (user: SearchUser) => {
    setActivePartnerId(user.id);
    setShowSidebar(false);
    setShowSearch(false);
    setSearchQuery("");
    setSearchResults([]);
    // Refresh conversations so the new partner appears in the list
    fetchConversations();
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const activePartner = conversations.find((c) => c.partner.id === activePartnerId)?.partner
    || searchResults.find((u) => u.id === activePartnerId);

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-[#080b10] font-sans text-white">
      <header className="z-50 flex w-full shrink-0 items-center gap-3 border-b border-white/10 bg-[#0c1219] px-4 py-3">
        <Link href="/dashboard" className="rounded-md p-1 text-white/60 transition-colors hover:bg-white/5 hover:text-white">
          <ChevronLeft size={20} />
        </Link>
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-400/15 text-sky-300">
          <MessageSquare size={18} />
        </div>
        <div>
          <h1 className="text-sm font-semibold">Private Chat</h1>
          <p className="text-xs text-white/40">Direct conversations</p>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <div
          className={`${
            showSidebar ? "flex" : "hidden"
          } w-full flex-col border-r border-white/10 bg-[#0c1219] md:flex md:w-80`}
        >
          <div className="space-y-3 border-b border-white/10 px-4 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-white">Conversations</h2>
                <p className="text-xs text-white/40">{conversations.length} active threads</p>
              </div>
              <button
                onClick={() => {
                  setShowSearch(!showSearch);
                  if (showSearch) {
                    setSearchQuery("");
                    setSearchResults([]);
                  }
                }}
                className="rounded-md bg-white/5 p-2 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
                title="Search users"
              >
                {showSearch ? <X size={15} /> : <Search size={15} />}
              </button>
            </div>

            {showSearch && (
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name or email..."
                  autoFocus
                  className="w-full rounded-lg border border-white/10 bg-white/[0.04] py-2.5 pl-9 pr-3 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-sky-400/40"
                />
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto">
            {showSearch ? (
              <>
                {searchLoading && (
                  <div className="py-4 text-center text-xs text-white/30">Searching...</div>
                )}
                {!searchLoading && searchQuery.trim() && searchResults.length === 0 && (
                  <div className="px-4 py-8 text-center text-xs text-white/30">
                    No users found matching &quot;{searchQuery}&quot;
                  </div>
                )}
                {!searchLoading && !searchQuery.trim() && (
                  <div className="px-4 py-8 text-center text-xs text-white/30">
                    Type to search for users...
                  </div>
                )}
                {searchResults.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => startConversation(user)}
                    className="w-full border-b border-white/5 px-4 py-3 text-left transition-colors hover:bg-white/5"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sky-400/15 text-xs font-bold text-sky-300">
                        {getInitial(user.name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{user.name}</p>
                        <p className="text-[10px] text-white/40 truncate">{user.email}</p>
                      </div>
                      <UserPlus size={14} className="text-[#0d7ff2] shrink-0" />
                    </div>
                  </button>
                ))}
              </>
            ) : (
              <>
                {conversations.length === 0 && (
                  <div className="flex h-full min-h-80 items-center justify-center px-6 text-center">
                    <div>
                      <Inbox size={36} className="mx-auto mb-3 text-white/15" />
                      <p className="text-sm font-medium text-white/60">No conversations yet</p>
                      <p className="mt-1 text-xs text-white/30">Use search to start a direct chat.</p>
                    </div>
                  </div>
                )}
                {conversations.map((conv) => (
                  <button
                    key={conv.partner.id}
                    onClick={() => {
                      setActivePartnerId(conv.partner.id);
                      setShowSidebar(false);
                    }}
                    className={`w-full border-b border-white/5 px-4 py-3 text-left transition-colors ${
                      activePartnerId === conv.partner.id
                        ? "border-l-2 border-l-sky-400 bg-sky-400/10"
                        : "hover:bg-white/5"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sky-400/15 text-xs font-bold text-sky-300">
                        {getInitial(conv.partner.name)}
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
              </>
            )}
          </div>
        </div>

        <div className={`${showSidebar ? "hidden" : "flex"} flex-1 flex-col bg-[#0b1118] md:flex`}>
          {activePartnerId === null ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center text-sm text-white/30">
              <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-white/5">
                <MessageSquare size={28} className="text-white/15" />
              </div>
              <p>Select a conversation or search for someone to start chatting</p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 border-b border-white/10 bg-[#0c1219]/90 px-4 py-3">
                <button
                  onClick={() => setShowSidebar(true)}
                  className="rounded-md p-1 text-white/60 hover:bg-white/5 hover:text-white md:hidden"
                >
                  <ChevronLeft size={20} />
                </button>
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sky-400/15 text-xs font-bold text-sky-300">
                  {getInitial(activePartner?.name)}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium">{activePartner?.name}</p>
                  <p className="truncate text-[11px] text-white/40">{activePartner?.email}</p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-3 sm:p-5">
                {messages.length === 0 && (
                  <div className="flex h-full min-h-80 items-center justify-center text-center">
                    <div>
                      <MessageSquare size={36} className="mx-auto mb-3 text-white/15" />
                      <p className="text-sm font-medium text-white/60">No messages with this person yet</p>
                      <p className="mt-1 text-xs text-white/30">Send the first message when you are ready.</p>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  {messages.map((msg, index) => {
                  const isMe = msg.senderId === currentUserId;
                  const prevMsg = index > 0 ? messages[index - 1] : null;
                  const showMeta = !prevMsg || prevMsg.senderId !== msg.senderId;
                  return (
                    <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[82%] rounded-2xl px-3 py-2 text-sm leading-5 shadow-sm ${
                          isMe
                            ? "rounded-br-md bg-sky-500 text-white"
                            : "rounded-bl-md border border-white/10 bg-white/[0.06] text-white/85"
                        }`}
                      >
                        {showMeta && !isMe && (
                          <span className="mb-1 block text-[11px] text-white/35">{msg.sender.name}</span>
                        )}
                        <p className="break-words">{msg.content}</p>
                        <span className={`mt-1 block text-[10px] ${isMe ? "text-sky-100/80" : "text-white/35"}`}>
                          {formatTime(msg.createdAt)}
                        </span>
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

              <div className="border-t border-white/10 bg-[#0c1219] p-3">
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
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

