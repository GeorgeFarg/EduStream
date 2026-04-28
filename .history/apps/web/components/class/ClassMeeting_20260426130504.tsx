"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Video, VideoOff, Mic, MicOff, PhoneOff, MessageCircle, Users, MonitorUp } from "lucide-react";
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
  user: {
    id: number;
    name: string;
    email: string;
  };
}

interface MeetingMessage {
  id: number;
  content: string;
  senderId: number;
  senderName: string;
  createdAt: string;
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
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
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

export default function ClassMeeting({ classId, className }: { classId: string; className?: string }) {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [activeMeeting, setActiveMeeting] = useState<Meeting | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInMeeting, setIsInMeeting] = useState(false);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [meetingTitle, setMeetingTitle] = useState("");
  const [isTeacher, setIsTeacher] = useState(false);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);

  const {
    currentUserId,
    participants: socketParticipants,
    participantStates,
    messages: socketMessages,
    meetingEnded,
    remoteStreams,
    initLocalStream,
    replaceVideoTrack,
    toggleMic: emitToggleMic,
    toggleCamera: emitToggleCamera,
    toggleScreenShare: emitToggleScreenShare,
    sendChatMessage: emitSendChatMessage,
  } = useMeetingSocket(isInMeeting && activeMeeting ? activeMeeting.id : null);

  useEffect(() => {
    if (meetingEnded && isInMeeting) {
      leaveMeetingRoom();
    }
  }, [meetingEnded]);

  useEffect(() => {
    const checkMembership = async () => {
      try {
        const res = await fetch(`${apiBaseUrl}/api/announcements?classId=${classId}`, {
          credentials: "include",
        });
        if (res.ok) {
          const data = await res.json();
          setIsTeacher(data.memperShip?.isTeacher || false);
        }
      } catch (e) {
        // ignore
      }
    };
    checkMembership();
  }, [classId]);

  const fetchMeetings = useCallback(async () => {
    try {
      setIsLoading(true);
      const activeRes = await fetch(`${apiBaseUrl}/api/classes/${classId}/meetings/active`, {
        credentials: "include",
      });
      if (activeRes.ok) {
        const activeData = await activeRes.json();
        if (activeData.meeting) {
          setActiveMeeting(activeData.meeting);
        } else {
          setActiveMeeting(null);
        }
      }

      const historyRes = await fetch(`${apiBaseUrl}/api/classes/${classId}/meetings/history`, {
        credentials: "include",
      });
      if (historyRes.ok) {
        const historyData = await historyRes.json();
        setMeetings(historyData.meetings || []);
      }
    } catch (e) {
      console.error("Error fetching meetings:", e);
    } finally {
      setIsLoading(false);
    }
  }, [classId]);

  useEffect(() => {
    fetchMeetings();
    const interval = setInterval(fetchMeetings, 10000);
    return () => clearInterval(interval);
  }, [fetchMeetings]);

  const getLocalStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      setLocalStream(stream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      return stream;
    } catch (err) {
      console.error("Failed to get user media:", err);
      try {
        const audioOnly = await navigator.mediaDevices.getUserMedia({
          video: false,
          audio: true,
        });
        setLocalStream(audioOnly);
        return audioOnly;
      } catch (e) {
        console.error("Failed to get audio:", e);
      }
    }
  };

  const startMeeting = async () => {
    if (!meetingTitle.trim()) return;
    try {
      const res = await fetch(`${apiBaseUrl}/api/classes/${classId}/meetings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ title: meetingTitle.trim() }),
      });
      if (res.ok) {
        const data = await res.json();
        setActiveMeeting(data);
        setMeetingTitle("");
        await joinMeetingRoom(data.id);
      }
    } catch (e) {
      console.error("Error starting meeting:", e);
    }
  };

  const joinMeetingRoom = async (meetingId: number) => {
    try {
      const res = await fetch(`${apiBaseUrl}/api/classes/${classId}/meetings/${meetingId}/join`, {
        method: "POST",
        credentials: "include",
      });
      if (res.ok) {
        const stream = await getLocalStream();
        setIsInMeeting(true);
        setShowParticipants(true);
        setTimeout(() => {
          if (stream) {
            initLocalStream(stream);
          }
        }, 500);
      }
    } catch (e) {
      console.error("Error joining meeting:", e);
    }
  };

  const leaveMeetingRoom = async () => {
    if (activeMeeting) {
      try {
        await fetch(`${apiBaseUrl}/api/classes/${classId}/meetings/${activeMeeting.id}/leave`, {
          method: "POST",
          credentials: "include",
        });
      } catch (e) {
        console.error("Error leaving meeting:", e);
      }
    }
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
      setLocalStream(null);
    }
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((track) => track.stop());
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
      const res = await fetch(`${apiBaseUrl}/api/classes/${classId}/meetings/${activeMeeting.id}/end`, {
        method: "POST",
        credentials: "include",
      });
      if (res.ok) {
        await leaveMeetingRoom();
      }
    } catch (e) {
      console.error("Error ending meeting:", e);
    }
  };

  const toggleMic = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMicOn(audioTrack.enabled);
        emitToggleMic(audioTrack.enabled);
      }
    }
  };

  const toggleCamera = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsCameraOn(videoTrack.enabled);
        emitToggleCamera(videoTrack.enabled);
      }
    }
  };

  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((track) => track.stop());
        screenStreamRef.current = null;
      }
      setIsScreenSharing(false);
      emitToggleScreenShare(false);
      if (localStream && localVideoRef.current) {
        localVideoRef.current.srcObject = localStream;
      }
      const cameraTrack = localStream?.getVideoTracks()[0];
      if (cameraTrack) {
        replaceVideoTrack(cameraTrack);
      }
    } else {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: false,
        });
        screenStreamRef.current = screenStream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = screenStream;
        }
        setIsScreenSharing(true);
        emitToggleScreenShare(true);
        const screenTrack = screenStream.getVideoTracks()[0];
        if (screenTrack) {
          replaceVideoTrack(screenTrack);
        }
        screenTrack.onended = () => {
          setIsScreenSharing(false);
          emitToggleScreenShare(false);
          screenStreamRef.current = null;
          if (localStream && localVideoRef.current) {
            localVideoRef.current.srcObject = localStream;
          }
          const cameraTrack = localStream?.getVideoTracks()[0];
          if (cameraTrack) {
            replaceVideoTrack(cameraTrack);
          }
        };
      } catch (e) {
        console.error("Screen share failed:", e);
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

  const gridParticipants = useCallback(() => {
    const list: {
      userId: number;
      name: string;
      isLocal: boolean;
      stream?: MediaStream;
      isCameraOn: boolean;
      isMicOn: boolean;
      isScreenSharing: boolean;
    }[] = [];

    if (currentUserId !== null) {
      list.push({
        userId: currentUserId,
        name: "You",
        isLocal: true,
        stream: localStream || undefined,
        isCameraOn,
        isMicOn,
        isScreenSharing,
      });
    }

    socketParticipants.forEach((p) => {
      if (p.userId === currentUserId) return;
      const state = participantStates[p.userId] || { isMicOn: true, isCameraOn: true, isScreenSharing: false };
      list.push({
        userId: p.userId,
        name: p.user.name,
        isLocal: false,
        stream: remoteStreams[p.userId],
        isCameraOn: state.isCameraOn,
        isMicOn: state.isMicOn,
        isScreenSharing: state.isScreenSharing,
      });
    });

    return list;
  }, [currentUserId, socketParticipants, participantStates, remoteStreams, localStream, isCameraOn, isMicOn, isScreenSharing]);

  const getGridClasses = (count: number) => {
    if (count === 1) return "grid-cols-1";
    if (count === 2) return "grid-cols-1 md:grid-cols-2";
    if (count <= 4) return "grid-cols-2";
    if (count <= 6) return "grid-cols-2 md:grid-cols-3";
    return "grid-cols-2 md:grid-cols-3 lg:grid-cols-4";
  };

  // ==================== MEETING ROOM UI ====================
  if (isInMeeting) {
    const participantsList = gridParticipants();
    const gridClasses = getGridClasses(participantsList.length);

    return (
      <div className="h-full flex flex-col bg-[#0a0a0a]">
        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 bg-black p-2 md:p-4 overflow-y-auto relative">
            <div className={`grid ${gridClasses} gap-2 md:gap-3 h-full`}>
              {participantsList.map((participant) => {
                const showVideo = (participant.isCameraOn || participant.isScreenSharing) && participant.stream;
                const isScreenShare = participant.isScreenSharing;

                return (
                  <div
                    key={participant.userId}
                    className={`relative bg-[#1a1a1a] rounded-xl overflow-hidden flex items-center justify-center min-h-[200px] ${
                      isScreenShare ? "col-span-full row-span-2" : ""
                    }`}
                  >
                    {showVideo ? (
                      <video
                        ref={(el) => {
                          if (el && participant.stream) {
                            el.srcObject = participant.stream;
                          }
                        }}
                        autoPlay
                        playsInline
                        muted={participant.isLocal}
                        className={`w-full h-full ${isScreenShare ? "object-contain" : "object-cover"}`}
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-white/40">
                        <div
                          className={`w-20 h-20 md:w-28 md:h-28 rounded-full flex items-center justify-center mb-3 text-2xl md:text-3xl font-bold ${getAvatarColor(
                            participant.name
                          )}`}
                        >
                          {getInitials(participant.name)}
                        </div>
                        <p className="text-sm font-medium">{participant.name}</p>
                      </div>
                    )}

                    <div className="absolute bottom-3 left-3 bg-black/60 px-2.5 py-1 rounded-full text-xs text-white/80 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                      {participant.name}
                      {!participant.isMicOn && <MicOff size={10} className="text-red-400" />}
                      {!participant.isCameraOn && <VideoOff size={10} className="text-red-400" />}
                      {participant.isScreenSharing && <MonitorUp size={10} className="text-[#0d7ff2]" />}
                    </div>
                );
              })}
            </div>

            <video ref={localVideoRef} autoPlay playsInline muted className="hidden" />

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

          {(showChat || showParticipants) && (
            <div className="w-80 bg-[#111] border-l border-white/5 flex flex-col">
              <div className="flex border-b border-white/5">
                <button
                  onClick={() => { setShowParticipants(true); setShowChat(false); }}
                  className={`flex-1 py-3 text-xs font-medium flex items-center justify-center gap-2 ${
                    showParticipants ? "text-[#0d7ff2] border-b-2 border-[#0d7ff2]" : "text-white/50 hover:text-white/80"
                  }`}
                >
                  <Users size={14} /> People
                </button>
                <button
                  onClick={() => { setShowChat(true); setShowParticipants(false); }}
                  className={`flex-1 py-3 text-xs font-medium flex items-center justify-center gap-2 ${
                    showChat ? "text-[#0d7ff2] border-b-2 border-[#0d7ff2]" : "text-white/50 hover:text-white/80"
                  }`}
                >
                  <MessageCircle size={14} /> Chat
                </button>
              </div>

              {showParticipants && (
                <div className="flex-1 overflow-y-auto p-3">
                  <div className="space-y-2">
                    {socketParticipants.map((p) => {
                      const state = participantStates[p.userId];
                      return (
                        <div key={p.id} className="flex items-center gap-3 p-2 rounded-lg bg-white/5">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${getAvatarColor(p.user.name)}`}>
                            {getInitials(p.user.name)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-white truncate">{p.user.name}</p>
                            <p className="text-[10px] text-[#0d7ff2]">{p.userId === (activeMeeting?.createdBy ?? -1) ? "Host" : "Participant"}</p>
                          </div>
                          <div className="flex items-center gap-1.5">
                            {state?.isMicOn === false && <MicOff size={12} className="text-red-400" />}
                            {state?.isCameraOn === false && <VideoOff size={12} className="text-red-400" />}
                            {state?.isScreenSharing && <MonitorUp size={12} className="text-[#0d7ff2]" />}
                            <div className="w-2 h-2 rounded-full bg-green-500" />
                          </div>
                      );
                    })}
                  </div>
              )}

              {showChat && (
                <>
                  <div className="flex-1 overflow-y-auto p-3 space-y-3">
                    {socketMessages.length === 0 && (
                      <div className="text-center text-white/20 text-xs py-8">No messages yet. Say hello!</div>
                    )}
                    {socketMessages.map((msg) => (
                      <div key={msg.id} className="flex flex-col">
                        <span className="text-[10px] text-white/40 mb-0.5">{msg.senderName}</span>
                        <div className="bg-white/5 rounded-lg px-3 py-2 text-sm text-white/90">{msg.content}</div>
                    ))}
                    <div ref={chatEndRef} />
                  </div>
                  <div className="p-3 border-t border-white/5">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && sendChatMessage()}
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
                </>
              )}
            </div>
          )}
        </div>

        <div className="shrink-0 px-4 py-3 bg-[#0a0a0a] border-t border-white/5 flex items-center justify-between">
          <div className="hidden sm:block">
            <p className="text-sm text-white font-medium truncate max-w-[200px]">{activeMeeting?.title}</p>
            <p className="text-[10px] text-[#0d7ff2]">Live Meeting</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={toggleMic}
              className={`p-3 rounded-full transition-all ${
                isMicOn ? "bg-white/10 text-white hover:bg-white/20" : "bg-red-500/20 text-red-400 hover:bg-red-500/30"
              }`}
              title={isMicOn ? "Mute" : "Unmute"}
            >
              {isMicOn ? <Mic size={18} /> : <MicOff size={18} />}
            </button>

            <button
              onClick={toggleCamera}
              className={`p-3 rounded-full transition-all ${
                isCameraOn ? "bg-white/10 text-white hover:bg-white/20" : "bg-red-500/20 text-red-400 hover:bg-red-500/30"
              }`}
              title={isCameraOn ? "Turn off camera" : "Turn on camera"}
            >
              {isCameraOn ? <Video size={18} /> : <VideoOff size={18} />}
            </button>

            <button
              onClick={toggleScreenShare}
              className={`p-3 rounded-full transition-all ${
                isScreenSharing ? "bg-[#0d7ff2]/30 text-[#0d7ff2]" : "bg-white/10 text-white hover:bg-white/20"
              }`}
              title="Share screen"
            >
              <MonitorUp size={18} />
            </button>

            <button
              onClick={() => { setShowParticipants(!showParticipants); setShowChat(false); }}
              className={`hidden md:flex p-3 rounded-full transition-all ${
                showParticipants ? "bg-[#0d7ff2]/30 text-[#0d7ff2]" : "bg-white/10 text-white hover:bg-white/20"
              }`}
              title="People"
            >
              <Users size={18} />
            </button>

            <button
              onClick={() => { setShowChat(!showChat); setShowParticipants(false); }}
              className={`hidden md:flex p-3 rounded-full transition-all ${
                showChat ? "bg-[#0d7ff2]/30 text-[#0d7ff2]" : "bg-white/10 text-white hover:bg-white/20"
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
              <span className="hidden sm:inline">{isTeacher ? "End for all" : "Leave"}</span>
            </button>
          </div>

          <div className="hidden sm:block w-[100px]" />
        </div>
    );
  }

  // ==================== LOBBY / LIST UI ====================
  return (
    <div className="h-full overflow-y-auto p-4 md:p-6">
      <div className="max-w-3xl mx-auto">
        {activeMeeting && (
          <div className="mb-6 rounded-2xl border border-[#0d7ff2]/30 bg-[#0d7ff2]/5 p-5">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-xs font-medium text-red-400 uppercase tracking-wide">Live Now</span>
                </div>
                <h3 className="text-lg font-semibold text-white">{activeMeeting.title}</h3>
                <p className="text-sm text-white/40 mt-1">
                  Started {activeMeeting.startedAt ? new Date(activeMeeting.startedAt).toLocaleTimeString() : "Just now"}
                </p>
                <div className="flex items-center gap-2 mt-3">
                  {activeMeeting.participants && activeMeeting.participants.length > 0 && (
                    <div className="flex -space-x-2">
                      {activeMeeting.participants.slice(0, 4).map((p) => (
                        <div
                          key={p.id}
                          className={`w-7 h-7 rounded-full border border-white/10 flex items-center justify-center text-[10px] font-bold ${getAvatarColor(p.user.name)}`}
                        >
                          {getInitials(p.user.name)}
                        </div>
                      ))}
                    </div>
                  )}
                  <span className="text-xs text-white/40">
                    {activeMeeting.participants?.filter(p => !p.leftAt).length || 0} in meeting
                  </span>
                </div>
              <button
                onClick={() => joinMeetingRoom(activeMeeting.id)}
                className="bg-[#0d7ff2] hover:bg-[#0d7ff2]/80 text-white px-5 py-2.5 rounded-full text-sm font-medium transition-all flex items-center gap-2"
              >
                <Video size={16} />
                Join
              </button>
            </div>
        )}

        {isTeacher && (
          <div className="mb-8 rounded-2xl border border-white/10 bg-white/[0.02] p-5">
            <h3 className="text-base font-medium text-white mb-3">Start Class Meeting</h3>
            <div className="flex gap-3">
              <input
                type="text"
                value={meetingTitle}
                onChange={(e) => setMeetingTitle(e.target.value)}
                placeholder="Meeting title (e.g., Live Lecture - Week 3)"
                onKeyDown={(e) => e.key === "Enter" && startMeeting()}
                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-white/20 outline-none focus:border-[#0d7ff2]/50 focus:ring-1 focus:ring-[#0d7ff2]/20"
              />
              <button
                onClick={startMeeting}
                disabled={!meetingTitle.trim()}
                className="bg-[#0d7ff2] hover:bg-[#0d7ff2]/80 disabled:opacity-40 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2"
              >
                <Video size={16} />
                <span className="hidden sm:inline">Start Meeting</span>
              </button>
            </div>
        )}

        <div>
          <h3 className="text-sm font-medium text-white/60 mb-4 uppercase tracking-wide">Past Meetings</h3>
          {isLoading ? (
            <div className="text-center text-white/20 text-sm py-12">Loading...</div>
          ) : meetings.filter(m => !m.isActive).length === 0 ? (
            <div className="text-center py-12">
              <Video size={40} className="mx-auto mb-3 text-white/10" />
              <p className="text-sm text-white/30">No past meetings</p>
            </div>
          ) : (
            <div className="space-y-3">
              {meetings.filter(m => !m.isActive).map((meeting) => (
                <div
                  key={meeting.id}
                  className="flex items-center justify-between p-4 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                      <Video size={18} className="text-white/30" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{meeting.title}</p>
                      <p className="text-xs text-white/30 mt-0.5">
                        {meeting.startedAt && meeting.endedAt
                          ? `${new Date(meeting.startedAt).toLocaleDateString()} · ${
                              Math.round((new Date(meeting.endedAt!).getTime() - new Date(meeting.startedAt!).getTime()) / 60000)
                            } min`
                          : new Date(meeting.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  <span className="text-[10px] text-white/20 px-2 py-1 rounded-full bg-white/5">Ended</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {!activeMeeting && !isTeacher && (
          <div className="text-center py-16">
            <Video size={48} className="mx-auto mb-4 text-white/10" />
            <p className="text-sm text-white/30">No active meeting in this class</p>
            <p className="text-xs text-white/15 mt-1">The teacher hasn&apos;t started a meeting yet</p>
          </div>
        )}
      </div>
  );
}
