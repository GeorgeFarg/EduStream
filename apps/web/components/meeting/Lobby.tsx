"use client";

import { useState, useRef } from "react";

const SERVER_URL = "http://localhost:5000";

interface LobbyProps {
  onEnterMeeting: (roomId: string, userName: string, stream: MediaStream) => void;
}

export default function Lobby({ onEnterMeeting }: LobbyProps) {
  const [userName, setUserName] = useState("");
  const [roomIdInput, setRoomIdInput] = useState("");
  const [toast, setToast] = useState("");
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = (msg: string, duration = 3000) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), duration);
  };

  const initLocalStream = async (): Promise<MediaStream | null> => {
    try {
      return await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    } catch {
      try {
        const s = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
        showToast("Camera unavailable — audio only mode");
        return s;
      } catch {
        showToast("No microphone access. Grant permissions and try again.", 5000);
        return null;
      }
    }
  };

  const handleNewMeeting = async () => {
    const name = userName.trim() || "Guest";
    const stream = await initLocalStream();
    if (!stream) return;

    let roomId: string;
    try {
      const res = await fetch(SERVER_URL + "/api/rooms", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        roomId = data.roomId;
      } else {
        roomId = Math.random().toString(36).slice(2, 10).toUpperCase();
        showToast("Server API failed — using random room ID");
      }
    } catch {
      roomId = Math.random().toString(36).slice(2, 10).toUpperCase();
      showToast("Server unreachable — using random room ID");
    }

    onEnterMeeting(roomId, name, stream);
  };

  const handleJoinMeeting = async () => {
    const name = userName.trim() || "Guest";
    const roomId = roomIdInput.trim().toUpperCase();
    if (!roomId) { showToast("Enter a Meeting ID"); return; }
    const stream = await initLocalStream();
    if (!stream) return;
    onEnterMeeting(roomId, name, stream);
  };

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen px-6 bg-[#080b10] overflow-hidden">
      {/* Radial glow */}
      <div className="pointer-events-none absolute inset-0"
        style={{ background: "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(59,130,246,0.18) 0%, transparent 65%)" }} />

      {/* Logo */}
      <h1 className="font-['Syne'] text-[clamp(28px,7vw,42px)] font-extrabold tracking-tight mb-1.5"
        style={{ background: "linear-gradient(135deg,#fff 40%,#3b82f6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
        NexMeet
      </h1>
      <p className="text-xs text-slate-500 tracking-widest uppercase mb-9">WebRTC Video Conferencing</p>

      {/* Card */}
      <div className="w-full max-w-[380px] bg-[#0f141d] border border-white/[0.07] rounded-2xl p-7 flex flex-col gap-3.5 shadow-[0_30px_80px_rgba(0,0,0,0.5)]">

        {/* Name */}
        <div className="flex flex-col gap-1">
          <label className="text-[11px] tracking-widest uppercase text-slate-500">Your Name</label>
          <input
            type="text"
            value={userName}
            maxLength={30}
            placeholder="Enter your name"
            onChange={(e) => setUserName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleNewMeeting()}
            className="w-full bg-[#161d2a] border border-white/[0.07] rounded-[10px] px-4 py-3.5 text-[#f0f4ff] text-[15px] outline-none placeholder:text-slate-500 focus:border-blue-500 transition-colors"
          />
        </div>

        {/* New Meeting */}
        <button
          onClick={handleNewMeeting}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-[10px] font-['Syne'] text-[15px] font-bold text-white tracking-[0.02em] transition-transform active:scale-[0.97]"
          style={{ background: "linear-gradient(135deg,#3b82f6,#6366f1)", boxShadow: "0 4px 20px rgba(59,130,246,0.35)" }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-[18px] h-[18px]">
            <path d="M15 10l5-5m0 0h-4m4 0v4M9 14l-5 5m0 0h4m-4 0v-4" />
          </svg>
          New Meeting
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3 text-slate-500 text-xs">
          <span className="flex-1 h-px bg-white/[0.07]" />
          or join existing
          <span className="flex-1 h-px bg-white/[0.07]" />
        </div>

        {/* Room ID */}
        <div className="flex flex-col gap-1">
          <label className="text-[11px] tracking-widest uppercase text-slate-500">Meeting ID</label>
          <input
            type="text"
            value={roomIdInput}
            maxLength={8}
            placeholder="e.g. AB12CD34"
            onChange={(e) => setRoomIdInput(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === "Enter" && handleJoinMeeting()}
            className="w-full bg-[#161d2a] border border-white/[0.07] rounded-[10px] px-4 py-3.5 text-[#f0f4ff] text-[15px] font-semibold tracking-[0.15em] outline-none placeholder:text-slate-500 focus:border-blue-500 transition-colors uppercase"
          />
        </div>

        {/* Join */}
        <button
          onClick={handleJoinMeeting}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-[10px] font-['Syne'] text-[15px] font-bold text-[#f0f4ff] bg-[#161d2a] border border-white/[0.07] tracking-[0.02em] transition-transform active:scale-[0.97]">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-[18px] h-[18px]">
            <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M15 12H3" />
          </svg>
          Join Meeting
        </button>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed top-[70px] left-1/2 -translate-x-1/2 bg-[#161d2a] border border-white/[0.07] rounded-[10px] px-[18px] py-2.5 text-[13px] text-[#f0f4ff] z-[999] whitespace-nowrap max-w-[90vw] overflow-hidden text-ellipsis pointer-events-none">
          {toast}
        </div>
      )}
    </div>
  );
}