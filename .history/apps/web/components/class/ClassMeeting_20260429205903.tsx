"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  PhoneOff,
  MessageCircle,
  Users,
  MonitorUp,
} from "lucide-react";
import { apiBaseUrl } from "@/config/env";
import { useMeetingSocket } from "@/hooks/useMeetingSocket";

interface Meeting {
  id: number;
  title: string;
  isActive: boolean;
  createdBy: number;
  classId: number;
  createdAt: string;
  startedAt?: string;
  endedAt?: string;
  participants?: MeetingParticipant[];
}
interface MeetingParticipant {
  id: number;
  meetingId: number;
  userId: number;
  joinedAt: string;
  leftAt?: string | null;
  user: { id: number; name: string; email: string };
}

const AVATAR_COLORS = [
  "bg-red-500/20 text-red-400",
  "bg-green-500/20 text-green-400",
  "bg-blue-500/20 text-blue-400",
  "bg-yellow-500/20 text-yellow-400",
  "bg-purple-500/20 text-purple-400",
  "bg-pink-500/20 text-pink-400",
  "bg-cyan-500/20 text-cyan-400",
  "bg-orange-500/20 text-orange-400",
];

function getAvatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++)
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// ✅ Dedicated video component — re-attaches srcObject whenever stream changes
function ParticipantVideo({
  stream,
  muted,
  contain,
}: {
  stream: MediaStream;
  muted: boolean;
  contain?: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    if (el.srcObject !== stream) {
      el.srcObject = stream;
    }
  }, [stream]);

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted={muted}
      className={`w-full h-full ${contain ? "object-contain" : "object-cover"}`}
    />
  );
}

export default function ClassMeeting({ classId }: { classId: string }) {
  // ✅ Prevent SSR/CSR hydration mismatch — render nothing until mounted on client
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => { setIsMounted(true); }, []);

  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [activeMeeting, setActiveMeeting] = useState<Meeting | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInMeeting, setIsInMeeting] = useState(false);
  const [isMicOn, setIsMicOn] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [meetingTitle, setMeetingTitle] = useState("");
  const [isTeacher, setIsTeacher] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);
  // ✅ screenStreamRef — used for track replacement, NOT for rendering
  const screenStreamRef = useRef<MediaStream | null>(null);

  const {
    currentUserId,
    participants: socketParticipants,
    participantStates,
    messages: socketMessages,
    meetingEnded,
    remoteStreams,
    remoteScreenStreams,
    participantMediaHealth,
    localMediaHealth,
    initLocalStream,
    replaceAudioTrack,
    replaceVideoTrack,
    addScreenShareTrack,
    removeScreenShareTrack,
    refreshLocalMediaHealth,
    toggleMic: emitToggleMic,
    toggleCamera: emitToggleCamera,
    toggleScreenShare: emitToggleScreenShare,
    sendChatMessage: emitSendChatMessage,
  } = useMeetingSocket(isInMeeting && activeMeeting ? activeMeeting.id : null);

  useEffect(() => {
    if (meetingEnded && isInMeeting) leaveMeetingRoom();
  }, [meetingEnded]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch(
          `${apiBaseUrl}/api/announcements?classId=${classId}`,
          { credentials: "include" }
        );
        if (res.ok) {
          const d = await res.json();
          setIsTeacher(d.memperShip?.isTeacher || false);
        }
      } catch (e) {}
    };
    check();
  }, [classId]);

  const fetchMeetings = useCallback(async () => {
    try {
      setIsLoading(true);
      const a = await fetch(
        `${apiBaseUrl}/api/classes/${classId}/meetings/active`,
        { credentials: "include" }
      );
      if (a.ok) {
        const d = await a.json();
        setActiveMeeting(d.meeting || null);
      }
      const h = await fetch(
        `${apiBaseUrl}/api/classes/${classId}/meetings/history`,
        { credentials: "include" }
      );
      if (h.ok) {
        const d = await h.json();
        setMeetings(d.meetings || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, [classId]);

  useEffect(() => {
    fetchMeetings();
    const i = setInterval(fetchMeetings, 10000);
    return () => clearInterval(i);
  }, [fetchMeetings]);

  // ✅ Get local camera + mic stream
  const getLocalStream = async (): Promise<MediaStream | null> => {
    const stream = new MediaStream();

    const [audioResult, videoResult] = await Promise.allSettled([
      navigator.mediaDevices.getUserMedia({
        video: false,
        audio: true,
      }),
      navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false,
      }),
    ]);

    if (audioResult.status === "fulfilled") {
      audioResult.value.getAudioTracks().forEach((track) => stream.addTrack(track));
    }

    if (videoResult.status === "fulfilled") {
      videoResult.value.getVideoTracks().forEach((track) => stream.addTrack(track));
    }

    return stream.getTracks().length > 0 ? stream : null;
  };

  const startMeeting = async () => {
    if (!meetingTitle.trim()) return;
    try {
      const res = await fetch(
        `${apiBaseUrl}/api/classes/${classId}/meetings`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ title: meetingTitle.trim() }),
        }
      );
      if (res.ok) {
        const d = await res.json();
        setActiveMeeting(d);
        setMeetingTitle("");
        await joinMeetingRoom(d.id);
      }
    } catch (e) {}
  };

  const joinMeetingRoom = async (meetingId: number) => {
    try {
      const res = await fetch(
        `${apiBaseUrl}/api/classes/${classId}/meetings/${meetingId}/join`,
        { method: "POST", credentials: "include" }
      );
      if (res.ok) {
        const s = await getLocalStream();
        // ✅ Set state first so the socket hook becomes active
        setIsInMeeting(true);
        setShowParticipants(true);
        if (s) {
          s.getAudioTracks().forEach((track) => {
            track.enabled = false;
          });
          s.getVideoTracks().forEach((track) => {
            track.enabled = false;
          });
          setLocalStream(s);
          setIsMicOn(false);
          setIsCameraOn(false);
          // ✅ Pass stream directly — no setTimeout needed
          initLocalStream(s);
        }
      }
    } catch (e) {}
  };

  const leaveMeetingRoom = async () => {
    if (activeMeeting) {
      try {
        await fetch(
          `${apiBaseUrl}/api/classes/${classId}/meetings/${activeMeeting.id}/leave`,
          { method: "POST", credentials: "include" }
        );
      } catch (e) {}
    }
    if (localStream) {
      localStream.getTracks().forEach((t) => t.stop());
      setLocalStream(null);
    }
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((t) => t.stop());
      screenStreamRef.current = null;
    }
    setIsInMeeting(false);
    setIsScreenSharing(false);
    setShowChat(false);
    setShowParticipants(false);
    await fetchMeetings();
  };

  const endMeetingForAll = async () => {
    if (!activeMeeting) return;
    try {
      const res = await fetch(
        `${apiBaseUrl}/api/classes/${classId}/meetings/${activeMeeting.id}/end`,
        { method: "POST", credentials: "include" }
      );
      if (res.ok) await leaveMeetingRoom();
    } catch (e) {}
  };

  const toggleMic = () => {
    if (localStream) {
      const t = localStream.getAudioTracks()[0];
      if (t) {
        t.enabled = !t.enabled;
        setIsMicOn(t.enabled);
        emitToggleMic(t.enabled);
        if (t.enabled) {
          replaceAudioTrack(t);
        }
        refreshLocalMediaHealth();
      }
    }
  };

  const toggleCamera = async () => {
    if (localStream) {
      const currentTrack = localStream.getVideoTracks()[0];

      if (isCameraOn) {
        if (currentTrack) {
          currentTrack.enabled = false;
        }
        setIsCameraOn(false);
        emitToggleCamera(false);
        replaceVideoTrack(null);
        refreshLocalMediaHealth();
        return;
      }

      try {
        const cameraStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
        const freshTrack = cameraStream.getVideoTracks()[0];
        if (!freshTrack) return;

        freshTrack.enabled = true;
        if (currentTrack) {
          try {
            currentTrack.stop();
          } catch {}
        }

        const audioTracks = localStream.getAudioTracks();
        const nextStream = new MediaStream([...audioTracks, freshTrack]);
        setLocalStream(nextStream);
        setIsCameraOn(true);
        emitToggleCamera(true);
        initLocalStream(nextStream);
        replaceVideoTrack(freshTrack);
        refreshLocalMediaHealth();
      } catch (e) {
        console.error("Error re-enabling camera:", e);
      }
    }
  };

  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      // ✅ Stop screen share and revert to camera
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((t) => t.stop());
        screenStreamRef.current = null;
      }
      setIsScreenSharing(false);
      emitToggleScreenShare(false);

      // Replace video track back to camera
      const cameraTrack = localStream?.getVideoTracks()[0];
      if (cameraTrack) replaceVideoTrack(cameraTrack);
      removeScreenShareTrack();
      refreshLocalMediaHealth();
    } else {
      try {
        const ss = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: false,
        });
        screenStreamRef.current = ss;
        setIsScreenSharing(true);
        emitToggleScreenShare(true);

        const screenTrack = ss.getVideoTracks()[0];
        if (screenTrack) {
          screenTrack.contentHint = "detail";
          // ✅ Replace track in all peer connections so remote users see the screen
          addScreenShareTrack(screenTrack);

          // ✅ When user stops sharing via browser UI button
          screenTrack.onended = () => {
            screenStreamRef.current = null;
            setIsScreenSharing(false);
            emitToggleScreenShare(false);
            removeScreenShareTrack();
            const cameraTrack = localStream?.getVideoTracks()[0];
            if (cameraTrack) replaceVideoTrack(cameraTrack);
            refreshLocalMediaHealth();
          };
        }
      } catch (e) {
        // User cancelled or permission denied — silently ignore
      }
    }
  };

  const sendChatMessage = async () => {
    if (!chatInput.trim() || !activeMeeting) return;
    emitSendChatMessage(chatInput.trim());
    setChatInput("");
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [socketMessages]);

  // ✅ Build the participant grid list
  // Local user's stream: use screenStream when sharing, else localStream
  const buildGrid = useCallback(() => {
    type P = {
      userId: number;
      name: string;
      isLocal: boolean;
      stream?: MediaStream;
      isCameraOn: boolean;
      isMicOn: boolean;
      isScreenSharing: boolean;
      mediaHealth: typeof localMediaHealth | null;
    };

    const list: P[] = [];

    if (currentUserId !== null) {
      // ✅ Show screen stream when sharing, camera stream otherwise
      const activeLocalStream =
        isScreenSharing && screenStreamRef.current
          ? screenStreamRef.current
          : localStream || undefined;

      list.push({
        userId: currentUserId,
        name: "You",
        isLocal: true,
        stream: activeLocalStream,
        isCameraOn,
        isMicOn,
        isScreenSharing,
        mediaHealth: localMediaHealth,
      });
    }

    socketParticipants.forEach((p) => {
      if (p.userId === currentUserId) return;
      const s = participantStates[p.userId] || {
        isMicOn: false,
        isCameraOn: false,
        isScreenSharing: false,
      };
      list.push({
        userId: p.userId,
        name: p.user.name,
        isLocal: false,
        stream:
          s.isScreenSharing && remoteScreenStreams[p.userId]
            ? remoteScreenStreams[p.userId]
            : remoteStreams[p.userId],
        isCameraOn: s.isCameraOn,
        isMicOn: s.isMicOn,
        isScreenSharing: s.isScreenSharing,
        mediaHealth: participantMediaHealth[p.userId] || null,
      });
    });

    return list;
  }, [
    currentUserId,
    socketParticipants,
    participantStates,
    remoteStreams,
    remoteScreenStreams,
    localStream,
    isCameraOn,
    isMicOn,
    isScreenSharing,
    participantMediaHealth,
  ]);

  const gridCols = (count: number) => {
    if (count === 1) return "grid-cols-1";
    if (count === 2) return "grid-cols-1 md:grid-cols-2";
    if (count <= 4) return "grid-cols-2";
    if (count <= 6) return "grid-cols-2 md:grid-cols-3";
    return "grid-cols-2 md:grid-cols-3 lg:grid-cols-4";
  };

  const healthBadge = (label: string, ok: boolean, detail: string) => (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-medium ${
        ok ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/15 text-red-400"
      }`}
      title={detail}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${ok ? "bg-emerald-400" : "bg-red-400"}`} />
      {label}
    </span>
  );

  // ✅ Don't render anything on the server — avoids hydration mismatch
  // from browser-only APIs (MediaStream, navigator, socket.io, etc.)
  if (!isMounted) return null;

  // ==================== MEETING ROOM ====================
  if (isInMeeting) {
    const plist = buildGrid();
    const gc = gridCols(plist.length);

    return (
      <div className="h-full flex flex-col bg-[#0a0a0a]">
        <div className="flex-1 flex overflow-hidden">
          {/* ── Video grid ── */}
          <div className="flex-1 bg-black p-2 md:p-4 overflow-y-auto relative">
            <div className={`grid ${gc} gap-2 md:gap-3 h-full`}>
              {plist.map((p) => {
                // ✅ Show video when camera or screen share is on AND stream exists
                const showVideo =
                  (p.isCameraOn || p.isScreenSharing) && !!p.stream;

                return (
                  <div
                    key={p.userId}
                    className={`relative bg-[#1a1a1a] rounded-xl overflow-hidden flex items-center justify-center min-h-[200px] ${
                      p.isScreenSharing ? "col-span-full row-span-2" : ""
                    }`}
                  >
                    {p.mediaHealth && (
                      <div className="absolute top-3 left-3 z-10 flex items-center gap-2">
                        {healthBadge(
                          "Mic",
                          p.isLocal
                            ? isMicOn
                            : p.mediaHealth.micEnabled && p.mediaHealth.micReady && p.mediaHealth.micPublished,
                          p.isLocal
                            ? `localMic=${isMicOn}`
                            : `micEnabled=${p.mediaHealth.micEnabled}, micReady=${p.mediaHealth.micReady}, micPublished=${p.mediaHealth.micPublished}`
                        )}
                        {healthBadge(
                          "Cam",
                          p.isLocal
                            ? isCameraOn
                            : p.mediaHealth.cameraEnabled && p.mediaHealth.cameraReady && p.mediaHealth.cameraPublished,
                          p.isLocal
                            ? `localCamera=${isCameraOn}`
                            : `cameraEnabled=${p.mediaHealth.cameraEnabled}, cameraReady=${p.mediaHealth.cameraReady}, cameraPublished=${p.mediaHealth.cameraPublished}`
                        )}
                      </div>
                    )}

                    {/* ✅ Use ParticipantVideo so srcObject stays in sync */}
                    {showVideo && p.stream ? (
                      <ParticipantVideo
                        stream={p.stream}
                        muted={p.isLocal}
                        contain={p.isScreenSharing}
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-white/40">
                        <div
                          className={`w-20 h-20 md:w-28 md:h-28 rounded-full flex items-center justify-center mb-3 text-2xl md:text-3xl font-bold ${getAvatarColor(
                            p.name
                          )}`}
                        >
                          {getInitials(p.name)}
                        </div>
                        <p className="text-sm font-medium">{p.name}</p>
                      </div>
                    )}

                    {/* Name badge */}
                    <div className="absolute bottom-3 left-3 bg-black/60 px-2.5 py-1 rounded-full text-xs text-white/80 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                      {p.name}
                      {!p.isMicOn && (
                        <MicOff size={10} className="text-red-400" />
                      )}
                      {!p.isCameraOn && (
                        <VideoOff size={10} className="text-red-400" />
                      )}
                      {p.isScreenSharing && (
                        <MonitorUp size={10} className="text-[#0d7ff2]" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Mobile chat toggle */}
            <button
              onClick={() => {
                setShowChat(!showChat);
                setShowParticipants(false);
              }}
              className="absolute top-4 right-4 md:hidden bg-black/60 p-2 rounded-full text-white/80"
            >
              <MessageCircle size={18} />
            </button>
          </div>

          {/* ── Side panel (chat / participants) ── */}
          {(showChat || showParticipants) && (
            <div className="w-80 bg-[#111] border-l border-white/5 flex flex-col">
              <div className="flex border-b border-white/5">
                <button
                  onClick={() => {
                    setShowParticipants(true);
                    setShowChat(false);
                  }}
                  className={`flex-1 py-3 text-xs font-medium flex items-center justify-center gap-2 ${
                    showParticipants
                      ? "text-[#0d7ff2] border-b-2 border-[#0d7ff2]"
                      : "text-white/50 hover:text-white/80"
                  }`}
                >
                  <Users size={14} /> People
                </button>
                <button
                  onClick={() => {
                    setShowChat(true);
                    setShowParticipants(false);
                  }}
                  className={`flex-1 py-3 text-xs font-medium flex items-center justify-center gap-2 ${
                    showChat
                      ? "text-[#0d7ff2] border-b-2 border-[#0d7ff2]"
                      : "text-white/50 hover:text-white/80"
                  }`}
                >
                  <MessageCircle size={14} /> Chat
                </button>
              </div>

              {showParticipants && (
                <div className="flex-1 overflow-y-auto p-3">
                  <div className="space-y-2">
                    {socketParticipants.map((p) => {
                      const s = participantStates[p.userId];
                      return (
                        <div
                          key={p.id}
                          className="flex items-center gap-3 p-2 rounded-lg bg-white/5"
                        >
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${getAvatarColor(
                              p.user.name
                            )}`}
                          >
                            {getInitials(p.user.name)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-white truncate">
                              {p.user.name}
                            </p>
                            <p className="text-[10px] text-[#0d7ff2]">
                              {p.userId === (activeMeeting?.createdBy ?? -1)
                                ? "Host"
                                : "Participant"}
                            </p>
                          </div>
                          <div className="flex items-center gap-1.5">
                            {(() => {
                              const health =
                                p.userId === currentUserId
                                  ? localMediaHealth
                                  : participantMediaHealth[p.userId];
                              if (!health) return null;
                              return (
                                <>
                                  {healthBadge(
                                    "Mic",
                                    health.micEnabled && health.micReady && health.micPublished,
                                    `micEnabled=${health.micEnabled}, micReady=${health.micReady}, micPublished=${health.micPublished}`
                                  )}
                                  {healthBadge(
                                    "Cam",
                                    health.cameraEnabled && health.cameraReady && health.cameraPublished,
                                    `cameraEnabled=${health.cameraEnabled}, cameraReady=${health.cameraReady}, cameraPublished=${health.cameraPublished}`
                                  )}
                                </>
                              );
                            })()}
                            {s?.isMicOn === false && (
                              <MicOff size={12} className="text-red-400" />
                            )}
                            {s?.isCameraOn === false && (
                              <VideoOff size={12} className="text-red-400" />
                            )}
                            {s?.isScreenSharing && (
                              <MonitorUp
                                size={12}
                                className="text-[#0d7ff2]"
                              />
                            )}
                            <div className="w-2 h-2 rounded-full bg-green-500" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {showChat && (
                <>
                  <div className="flex-1 overflow-y-auto p-3 space-y-3">
                    {socketMessages.length === 0 && (
                      <div className="text-center text-white/20 text-xs py-8">
                        No messages yet. Say hello!
                      </div>
                    )}
                    {socketMessages.map((m) => (
                      <div key={m.id} className="flex flex-col">
                        <span className="text-[10px] text-white/40 mb-0.5">
                          {m.senderName}
                        </span>
                        <div className="bg-white/5 rounded-lg px-3 py-2 text-sm text-white/90">
                          {m.content}
                        </div>
                      </div>
                    ))}
                    <div ref={chatEndRef} />
                  </div>
                  <div className="p-3 border-t border-white/5">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyDown={(e) =>
                          e.key === "Enter" && sendChatMessage()
                        }
                        placeholder="Type a message..."
                        className="flex-1 bg-white/5 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/20 outline-none focus:ring-1 focus:ring-[#0d7ff2]/50"
                      />
                      <button
                        onClick={sendChatMessage}
                        className="bg-[#0d7ff2] hover:bg-[#0d7ff2]/80 text-white px-3 py-2 rounded-lg text-xs font-medium transition-all"
                      >
                        Send
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* ── Controls bar ── */}
        <div className="shrink-0 px-4 py-3 bg-[#0a0a0a] border-t border-white/5 flex items-center justify-between">
          <div className="hidden sm:block">
            <p className="text-sm text-white font-medium truncate max-w-[200px]">
              {activeMeeting?.title}
            </p>
            <p className="text-[10px] text-[#0d7ff2]">Live Meeting</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden lg:flex items-center gap-2 mr-1">
              {healthBadge(
                "Mic",
                localMediaHealth.micEnabled && localMediaHealth.micReady && localMediaHealth.micPublished,
                `micEnabled=${localMediaHealth.micEnabled}, micReady=${localMediaHealth.micReady}, micPublished=${localMediaHealth.micPublished}`
              )}
              {healthBadge(
                "Cam",
                localMediaHealth.cameraEnabled && localMediaHealth.cameraReady && localMediaHealth.cameraPublished,
                `cameraEnabled=${localMediaHealth.cameraEnabled}, cameraReady=${localMediaHealth.cameraReady}, cameraPublished=${localMediaHealth.cameraPublished}`
              )}
            </div>

            <button
              onClick={toggleMic}
              className={`p-3 rounded-full transition-all ${
                isMicOn
                  ? "bg-white/10 text-white hover:bg-white/20"
                  : "bg-red-500/20 text-red-400 hover:bg-red-500/30"
              }`}
              title={isMicOn ? "Mute" : "Unmute"}
            >
              {isMicOn ? <Mic size={18} /> : <MicOff size={18} />}
            </button>

            <button
              onClick={toggleCamera}
              className={`p-3 rounded-full transition-all ${
                isCameraOn
                  ? "bg-white/10 text-white hover:bg-white/20"
                  : "bg-red-500/20 text-red-400 hover:bg-red-500/30"
              }`}
              title={isCameraOn ? "Turn off camera" : "Turn on camera"}
            >
              {isCameraOn ? <Video size={18} /> : <VideoOff size={18} />}
            </button>

            <button
              onClick={toggleScreenShare}
              className={`p-3 rounded-full transition-all ${
                isScreenSharing
                  ? "bg-[#0d7ff2]/30 text-[#0d7ff2]"
                  : "bg-white/10 text-white hover:bg-white/20"
              }`}
              title="Share screen"
            >
              <MonitorUp size={18} />
            </button>

            <button
              onClick={() => {
                setShowParticipants(!showParticipants);
                setShowChat(false);
              }}
              className={`hidden md:flex p-3 rounded-full transition-all ${
                showParticipants
                  ? "bg-[#0d7ff2]/30 text-[#0d7ff2]"
                  : "bg-white/10 text-white hover:bg-white/20"
              }`}
              title="People"
            >
              <Users size={18} />
            </button>

            <button
              onClick={() => {
                setShowChat(!showChat);
                setShowParticipants(false);
              }}
              className={`hidden md:flex p-3 rounded-full transition-all ${
                showChat
                  ? "bg-[#0d7ff2]/30 text-[#0d7ff2]"
                  : "bg-white/10 text-white hover:bg-white/20"
              }`}
              title="Chat"
            >
              <MessageCircle size={18} />
            </button>

            <button
              onClick={isTeacher ? endMeetingForAll : leaveMeetingRoom}
              className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2.5 rounded-full text-sm font-medium transition-all"
            >
              <PhoneOff size={16} />
              <span className="hidden sm:inline">
                {isTeacher ? "End for all" : "Leave"}
              </span>
            </button>
          </div>

          <div className="hidden sm:block w-[100px]" />
        </div>
      </div>
    );
  }

  // ==================== LOBBY ====================
  return (
    <div className="h-full overflow-y-auto p-4 md:p-6">
      <div className="max-w-3xl mx-auto">
        {activeMeeting && (
          <div className="mb-6 rounded-2xl border border-[#0d7ff2]/30 bg-[#0d7ff2]/5 p-5">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-xs font-medium text-red-400 uppercase tracking-wide">
                    Live Now
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-white">
                  {activeMeeting.title}
                </h3>
                <p className="text-sm text-white/40 mt-1">
                  Started{" "}
                  {activeMeeting.startedAt
                    ? new Date(activeMeeting.startedAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: false,
                      })
                    : "Just now"}
                </p>
                <div className="flex items-center gap-2 mt-3">
                  {activeMeeting.participants &&
                    activeMeeting.participants.length > 0 && (
                      <div className="flex -space-x-2">
                        {activeMeeting.participants.slice(0, 4).map((p) => (
                          <div
                            key={p.id}
                            className={`w-7 h-7 rounded-full border border-white/10 flex items-center justify-center text-[10px] font-bold ${getAvatarColor(
                              p.user.name
                            )}`}
                          >
                            {getInitials(p.user.name)}
                          </div>
                        ))}
                      </div>
                    )}
                  <span className="text-xs text-white/40">
                    {activeMeeting.participants?.filter((p) => !p.leftAt)
                      .length || 0}{" "}
                    in meeting
                  </span>
                </div>
              </div>
              <button
                onClick={() => joinMeetingRoom(activeMeeting.id)}
                className="bg-[#0d7ff2] hover:bg-[#0d7ff2]/80 text-white px-5 py-2.5 rounded-full text-sm font-medium transition-all flex items-center gap-2"
              >
                <Video size={16} /> Join
              </button>
            </div>
          </div>
        )}

        {isTeacher && (
          <div className="mb-8 rounded-2xl border border-white/10 bg-white/[0.02] p-5">
            <h3 className="text-base font-medium text-white mb-3">
              Start Class Meeting
            </h3>
            <div className="flex gap-3">
              <input
                type="text"
                value={meetingTitle}
                onChange={(e) => setMeetingTitle(e.target.value)}
                placeholder="Meeting title"
                onKeyDown={(e) => e.key === "Enter" && startMeeting()}
                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-white/20 outline-none focus:border-[#0d7ff2]/50 focus:ring-1 focus:ring-[#0d7ff2]/20"
              />
              <button
                onClick={startMeeting}
                disabled={!meetingTitle.trim()}
                className="bg-[#0d7ff2] hover:bg-[#0d7ff2]/80 disabled:opacity-40 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2"
              >
                <Video size={16} />
                <span className="hidden sm:inline">Start</span>
              </button>
            </div>
          </div>
        )}

        <div>
          <h3 className="text-sm font-medium text-white/60 mb-4 uppercase tracking-wide">
            Past Meetings
          </h3>
          {isLoading ? (
            <div className="text-center text-white/20 text-sm py-12">
              Loading...
            </div>
          ) : meetings.filter((m) => !m.isActive).length === 0 ? (
            <div className="text-center py-12">
              <Video size={40} className="mx-auto mb-3 text-white/10" />
              <p className="text-sm text-white/30">No past meetings</p>
            </div>
          ) : (
            <div className="space-y-3">
              {meetings
                .filter((m) => !m.isActive)
                .map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between p-4 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                        <Video size={18} className="text-white/30" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">
                          {m.title}
                        </p>
                        <p className="text-xs text-white/30 mt-0.5">
                          {m.startedAt && m.endedAt
                            ? `${new Date(m.startedAt).toLocaleDateString("en-CA")} · ${Math.round(
                                (new Date(m.endedAt).getTime() -
                                  new Date(m.startedAt).getTime()) /
                                  60000
                              )} min`
                            : new Date(m.createdAt).toLocaleDateString("en-CA")}
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] text-white/20 px-2 py-1 rounded-full bg-white/5">
                      Ended
                    </span>
                  </div>
                ))}
            </div>
          )}
        </div>

        {!activeMeeting && !isTeacher && (
          <div className="text-center py-16">
            <Video size={48} className="mx-auto mb-4 text-white/10" />
            <p className="text-sm text-white/30">No active meeting</p>
            <p className="text-xs text-white/15 mt-1">
              The teacher hasn&apos;t started a meeting yet
            </p>
          </div>
        )}
      </div>
    </div>
  );
}