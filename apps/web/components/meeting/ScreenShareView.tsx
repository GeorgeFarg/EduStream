"use client";

import { useEffect, useRef } from "react";
import type { PeerInfo } from "@/components/meeting/MeetingRoom";

interface ScreenShareInfo {
  socketId: string;
  name: string;
  stream: MediaStream | null;
}

interface ScreenShareViewProps {
  screenInfo: ScreenShareInfo;
  localStream: MediaStream;
  localName: string;
  peers: PeerInfo[];
}

function ThumbTile({ stream, name, isLocal }: { stream: MediaStream | null; name: string; isLocal?: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) videoRef.current.srcObject = stream;
  }, [stream]);

  return (
    <div className="w-[100px] h-[75px] rounded-lg overflow-hidden border-2 border-white/[0.07] shrink-0 relative bg-[#0f141d]">
      <video ref={videoRef} autoPlay playsInline muted={isLocal} className="w-full h-full object-cover" />
      <div className="absolute bottom-0 left-0 right-0 py-1.5 px-1 text-center text-[9px] text-white whitespace-nowrap overflow-hidden text-ellipsis"
        style={{ background: "linear-gradient(transparent, rgba(0,0,0,0.8))" }}>
        {name}
      </div>
    </div>
  );
}

export default function ScreenShareView({ screenInfo, localStream, localName, peers }: ScreenShareViewProps) {
  const screenVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (screenVideoRef.current && screenInfo.stream) {
      screenVideoRef.current.srcObject = screenInfo.stream;
    }
  }, [screenInfo.stream]);

  return (
    <div className="absolute inset-0 bg-black flex flex-col z-10">
      {/* Label */}
      <div className="absolute top-2.5 left-1/2 -translate-x-1/2 bg-black/70 backdrop-blur-md border border-white/[0.07] rounded-full px-3.5 py-1.5 text-[12px] text-amber-400 z-20 flex items-center gap-1.5">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
          <rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8M12 17v4" />
        </svg>
        <span>{screenInfo.name} is sharing screen</span>
      </div>

      {/* Screen Video */}
      <video
        ref={screenVideoRef}
        autoPlay
        playsInline
        className="w-full h-full object-contain bg-black"
      />

      {/* Thumbnail strip */}
      <div className="absolute bottom-20 right-2.5 z-20 flex flex-col gap-1.5 max-h-[calc(100%-160px)] overflow-y-auto overflow-x-hidden p-1">
        <ThumbTile stream={localStream} name={`${localName} (You)`} isLocal />
        {peers
          .filter((p) => p.socketId !== screenInfo.socketId)
          .map((p) => (
            <ThumbTile key={p.socketId} stream={p.stream} name={p.name} />
          ))}
      </div>
    </div>
  );
}