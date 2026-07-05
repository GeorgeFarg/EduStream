"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Video, VideoOff, Mic, MicOff, PhoneOff, MessageCircle, Users, MonitorUp, Hand } from "lucide-react";
import { apiBaseUrl } from "@/config/env";

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
  const [chatMessages, setChatMessages] = useState<MeetingMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [meetingTitle, setMeetingTitle] = useState("");
  const [isTeacher, setIsTeacher] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);

  // Check if user is teacher
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

  // Fetch meetings history & active meeting
  const fetchMeetings = useCallback(async () => {
    try {
      setIsLoading(true);
      // Get active meeting
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

      // Get history
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
    // Poll every 10 seconds for active meeting updates
    const interval = setInterval(fetchMeetings, 10000);
    return () => clearInterval(interval);
  }, [fetchMeetings]);

  // Get local media stream
  const getLocalStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      setLocalStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      return stream;
    } catch (err) {
      console.error("Failed to get user media:", err);
      // Try audio only
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
        await getLocalStream();
        setIsInMeeting(true);
        setShowParticipants(true);
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
    // Stop all tracks
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
    setChatMessages([]);
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
      }
    }
  };

  const toggleCamera = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsCameraOn(videoTrack.enabled);
      }
    }
  };

  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      // Stop screen share
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((track) => track.stop());
        screenStreamRef.current = null;
      }
      setIsScreenSharing(false);
      // Restore camera
      if (localStream && videoRef.current) {
        videoRef.current.srcObject = localStream;
      }
    } else {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: false,
        });
        screenStreamRef.current = screenStream;
        if (videoRef.current) {
          videoRef.current.srcObject = screenStream;
        }
        setIsScreenSharing(true);
        // When screen share ends via browser UI
        screenStream.getVideoTracks()[0].onended = () => {
          setIsScreenSharing(false);
          screenStreamRef.current = null;
          if (localStream && videoRef.current) {
            videoRef.current.srcObject = localStream;
          }
        };
      } catch (e) {
        console.error("Screen share failed:", e);
      }
    }
  };

  const sendChatMessage = async () => {
    if (!chatInput.trim() || !activeMeeting) return;
    // Use class chat endpoint for in-meeting messages
    try {
      const res = await fetch(`${apiBaseUrl}/api/classes/${classId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ content: chatInput.trim() }),
      });
      if (res.ok) {
        setChatInput("");
      }
    } catch (e) {
      console.error("Error sending message:", e);
    }
  };

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  // Poll for chat messages when in meeting
  useEffect(() => {
    if (!isInMeeting) return;
    const pollChat = async () => {
      try {
        const res = await fetch(`${apiBaseUrl}/api/classes/${classId}/chat?page=1&limit=50`, {
          credentials: "include",
        });
        if (res.ok) {
          const data = await res.json();
          if (data.messages) {
            setChatMessages(data.messages.map((m: any) => ({
              id: m.id,
              content: m.content,
              senderId: m.senderId,
              senderName: m.sender?.name || "Unknown",
              createdAt: m.createdAt,
            })));
          }
        }
      } catch (e) {
        // ignore
      }
    };
    pollChat();
    const interval = setInterval(pollChat, 3000);
    return () => clearInterval(interval);
  }, [isInMeeting, classId]);

  // ==================== MEETING ROOM UI ====================
  if (isInMeeting) {
    return (
      <div className="h-full flex flex-col bg-[#0a0a0a]">
        {/* Main Video Area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Video Grid */}
          <div className="flex-1 relative bg-black flex items-center justify-center p-4">
            {isCameraOn || isScreenSharing ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-contain rounded-lg"
              />
            ) : (
              <div className="flex flex-col items-center text-white/30">
                <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center mb-3">
                  <VideoOff size={40} />
                </div>
                <p className="text-sm">Camera is turned off</p>
              </div>
            )}

            {/* Self label */}
            <div className="absolute bottom-6 left-6 bg-black/60 px-3 py-1 rounded-full text-xs text-white/80 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              You
            </div>

            {/* In-meeting chat overlay toggle (mobile) */}
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

          {/* Sidebar: Chat or Participants */}
          {(showChat || showParticipants) && (
            <div className="w-80 bg-[#111] border-l border-white/5 flex flex-col">
              {/* Tabs */}
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

              {/* Participants Panel */}
              {showParticipants && (
                <div className="flex-1 overflow-y-auto p-3">
                  <div className="space-y-2">
                    {activeMeeting?.participants?.map((p) => (
                      <div key={p.id} className="flex items-center gap-3 p-2 rounded-lg bg-white/5">
                        <div className="w-8 h-8 rounded-full bg-[#0d7ff2]/20 flex items-center justify-center text-[#0d7ff2] text-xs font-bold">
                          {p.user.name?.[0]?.toUpperCase() || "U"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white truncate">{p.user.name}</p>
                          <p className="text-[10px] text-[#0d7ff2]">{p.userId === activeMeeting?.createdBy ? "Host" : "Participant"}</p>
                        </div>
                        <div className="w-2 h-2 rounded-full bg-green-500" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Chat Panel */}
              {showChat && (
                <>
                  <div className="flex-1 overflow-y-auto p-3 space-y-3">
                    {chatMessages.length === 0 && (
                      <div className="text-center text-white/20 text-xs py-8">
                        No messages yet. Say hello!
                      </div>
                    )}
                    {chatMessages.map((msg) => (
                      <div key={msg.id} className="flex flex-col">
                        <span className="text-[10px] text-white/40 mb-0.5">{msg.senderName}</span>
                        <div className="bg-white/5 rounded-lg px-3 py-2 text-sm text-white/90">
                          {msg.content}
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
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Bottom Controls Bar */}
        <div className="shrink-0 px-4 py-3 bg-[#0a0a0a] border-t border-white/5 flex items-center justify-between">
          {/* Meeting Info */}
          <div className="hidden sm:block">
            <p className="text-sm text-white font-medium truncate max-w-[200px]">{activeMeeting?.title}</p>
            <p className="text-[10px] text-[#0d7ff2]">Live Meeting</p>
          </div>

          {/* Center Controls */}
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

            {/* Leave / End */}
            <button
              onClick={isTeacher ? endMeetingForAll : leaveMeetingRoom}
              className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2.5 rounded-full text-sm font-medium transition-all"
            >
              <PhoneOff size={16} />
              <span className="hidden sm:inline">{isTeacher ? "End for all" : "Leave"}</span>
            </button>
          </div>

          {/* Spacer for balance */}
          <div className="hidden sm:block w-[100px]" />
        </div>
      </div>
    );
  }

  // ==================== LOBBY / LIST UI ====================
  return (
    <div className="h-full overflow-y-auto p-4 md:p-6">
      <div className="max-w-3xl mx-auto">
        {/* Active Meeting Card */}
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
                          className="w-7 h-7 rounded-full bg-[#0d7ff2]/20 border border-[#0d7ff2]/30 flex items-center justify-center text-[10px] text-[#0d7ff2] font-bold"
                        >
                          {p.user.name?.[0]?.toUpperCase() || "U"}
                        </div>
                      ))}
                    </div>
                  )}
                  <span className="text-xs text-white/40">
                    {activeMeeting.participants?.filter(p => !p.leftAt).length || 0} in meeting
                  </span>
                </div>
              </div>
              <button
                onClick={() => joinMeetingRoom(activeMeeting.id)}
                className="bg-[#0d7ff2] hover:bg-[#0d7ff2]/80 text-white px-5 py-2.5 rounded-full text-sm font-medium transition-all flex items-center gap-2"
              >
                <Video size={16} />
                Join
              </button>
            </div>
          </div>
        )}

        {/* Start New Meeting (Teacher Only) */}
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
          </div>
        )}

        {/* Meeting History */}
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
                  </div>
                  <span className="text-[10px] text-white/20 px-2 py-1 rounded-full bg-white/5">Ended</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* No Active Meeting Message */}
        {!activeMeeting && !isTeacher && (
          <div className="text-center py-16">
            <Video size={48} className="mx-auto mb-4 text-white/10" />
            <p className="text-sm text-white/30">No active meeting in this class</p>
            <p className="text-xs text-white/15 mt-1">
              The teacher hasn&apos;t started a meeting yet
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

