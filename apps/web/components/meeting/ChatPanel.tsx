"use client";

import { useState, useEffect, useRef } from "react";
import type { ChatMessage } from "@/components/meeting/MeetingRoom";

interface ChatPanelProps {
  isOpen: boolean;
  messages: ChatMessage[];
  mySocketId: string;
  onClose: () => void;
  onSend: (message: string) => void;
}

function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function escapeHtml(t: string) {
  return t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export default function ChatPanel({ isOpen, messages, mySocketId, onClose, onSend }: ChatPanelProps) {
  const [inputVal, setInputVal] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    const msg = inputVal.trim();
    if (!msg) return;
    onSend(msg);
    setInputVal("");
  };

  return (
    <div className={`absolute right-0 top-0 bottom-0 w-[min(320px,100vw)] bg-[#0f141d] border-l border-white/[0.07] flex flex-col z-40 transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${isOpen ? "translate-x-0" : "translate-x-full"}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/[0.07]">
        <h3 className="font-['Syne'] text-[15px] font-bold">Meeting Chat</h3>
        <button onClick={onClose} className="text-slate-500 hover:text-white p-1 rounded-md transition-colors">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2.5 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-white/[0.07] [&::-webkit-scrollbar-thumb]:rounded-sm">
        {messages.map((msg, i) => {
          const isSelf = msg.socketId === mySocketId;
          return (
            <div key={i} className="flex flex-col gap-0.5">
              <span className={`text-[11px] font-semibold ${isSelf ? "text-green-400" : "text-blue-400"}`}>
                {isSelf ? "You" : msg.userName}
              </span>
              <div
                className={`text-[13px] leading-relaxed max-w-[90%] px-3 py-2 break-words ${
                  isSelf
                    ? "self-end bg-blue-500/15 border border-blue-500/20 rounded-[10px_0_10px_10px]"
                    : "bg-[#161d2a] rounded-[0_10px_10px_10px]"
                }`}
                dangerouslySetInnerHTML={{ __html: escapeHtml(msg.message) }}
              />
              <span className="text-[10px] text-slate-500 px-1">{formatTime(msg.timestamp)}</span>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="flex gap-2 p-3 border-t border-white/[0.07]">
        <input
          type="text"
          value={inputVal}
          maxLength={500}
          placeholder="Type a message…"
          onChange={(e) => setInputVal(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          className="flex-1 bg-[#161d2a] border border-white/[0.07] rounded-lg px-3 py-2.5 text-[#f0f4ff] text-sm outline-none focus:border-blue-500 transition-colors placeholder:text-slate-500 select-text"
        />
        <button
          onClick={handleSend}
          className="bg-blue-500 border-none rounded-lg w-10 flex items-center justify-center text-white cursor-pointer hover:bg-blue-600 transition-colors shrink-0">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-[18px] h-[18px]">
            <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </div>
    </div>
  );
}