"use client";

import { useEffect, useRef } from "react";

function avatarColor(name: string): string {
  const colors = ["#3b82f6","#6366f1","#8b5cf6","#ec4899","#f59e0b","#10b981","#14b8a6","#f97316"];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % colors.length;
  return colors[h];
}

interface VideoTileProps {
  socketId: string;
  name: string;
  stream: MediaStream | null;
  isLocal?: boolean;
  isMuted?: boolean;
  isCamOff?: boolean;
}

export default function VideoTile({ name, stream, isLocal, isMuted, isCamOff }: VideoTileProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const initial = (name || "G")[0].toUpperCase();
  const color = avatarColor(name || "Guest");

  const hasVideo = stream && stream.getVideoTracks().some((t) => t.enabled && t.readyState === "live");
  const showAvatar = isCamOff || !hasVideo;

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (stream) {
      video.srcObject = stream;
      // Try to play in case autoplay was blocked
      video.play().catch(() => {});
    } else {
      video.srcObject = null;
    }
  }, [stream]);

  return (
    <div className="relative bg-[#0f141d] rounded-xl overflow-hidden min-h-[100px]">
      {/* Avatar fallback */}
      {showAvatar && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#161d2a]">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center font-['Syne'] text-[22px] font-extrabold text-white"
            style={{ background: color }}>
            {initial}
          </div>
        </div>
      )}

      {/* Video */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={isLocal}
        className={`w-full h-full object-cover block ${isLocal ? "-scale-x-100" : ""} ${showAvatar ? "opacity-0" : "opacity-100"}`}
      />

      {/* Gradient overlay + name */}
      <div className="absolute inset-0 flex flex-col justify-end pointer-events-none"
        style={{ background: "linear-gradient(transparent 50%, rgba(0,0,0,0.7))" }}>
        <div className="px-2.5 pb-1.5 pt-2 text-[11px] font-semibold text-white flex items-center gap-1.5">
          {name}
          {isLocal && (
            <span className="bg-red-500 rounded px-1.5 py-px text-[9px] tracking-wide">YOU</span>
          )}
        </div>
      </div>

      {/* Muted mic icon */}
      {isMuted && (
        <div className="absolute top-2 right-2 bg-black/60 rounded-full w-[26px] h-[26px] flex items-center justify-center">
          <svg viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" className="w-3.5 h-3.5">
            <line x1="1" y1="1" x2="23" y2="23" />
            <path d="M9 9v3a3 3 0 005.12 2.12M15 9.34V4a3 3 0 00-5.94-.6" />
            <path d="M17 16.95A7 7 0 015 12v-2m14 0v2a7 7 0 01-.11 1.23M12 19v3M8 23h8" />
          </svg>
        </div>
      )}
    </div>
  );
}