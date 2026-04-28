"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { apiBaseUrl } from "@/config/env";

export interface ParticipantState {
  isMicOn: boolean;
  isCameraOn: boolean;
  isScreenSharing: boolean;
}

export interface MeetingMessage {
  id: number;
  content: string;
  senderId: number;
  senderName: string;
  createdAt: string;
}

export interface MeetingParticipant {
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

export function useMeetingSocket(meetingId: number | null) {
  const socketRef = useRef<Socket | null>(null);
  const iceCandidateQueuesRef = useRef<Record<number, RTCIceCandidateInit[]>>({});

  const [isConnected, setIsConnected] = useState(false);
  const [participants, setParticipants] = useState<MeetingParticipant[]>([]);
  const [participantStates, setParticipantStates] = useState<
    Record<number, ParticipantState>
  >({});
  const [messages, setMessages] = useState<MeetingMessage[]>([]);
  const [meetingEnded, setMeetingEnded] = useState(false);
  const [remoteStreams, setRemoteStreams] = useState<
    Record<number, MediaStream>
  >({});
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  // ── Refs (never cause re-renders) ─────────────────────────────────────────
  const peerConnectionsRef = useRef<Record<number, RTCPeerConnection>>({});
  const localStreamRef = useRef<MediaStream | null>(null);
  const currentUserIdRef = useRef<number | null>(null);
  const meetingIdRef = useRef<number | null>(meetingId);
  const participantsRef = useRef<MeetingParticipant[]>([]);
  const hasCleanedUpRef = useRef(false);

  // Keep refs in sync
  useEffect(() => { currentUserIdRef.current = currentUserId; }, [currentUserId]);
  useEffect(() => { meetingIdRef.current = meetingId; }, [meetingId]);
  useEffect(() => { participantsRef.current = participants; }, [participants]);

  // ── Single cleanup function (prevents duplicate disconnect handlers) ──────
 const cleanupPeerConnections = useCallback(() => {
  if (hasCleanedUpRef.current) return;
  hasCleanedUpRef.current = true;

  Object.values(peerConnectionsRef.current).forEach((pc) => {
    try { pc.close(); } catch { }
  });
  peerConnectionsRef.current = {};
  iceCandidateQueuesRef.current = {}; // ✅ أضف ده
  setRemoteStreams({});
  localStreamRef.current = null;
}, []);

  // ── initPeerConnection ────────────────────────────────────────────────────
 const initPeerConnection = useCallback((targetUserId: number): RTCPeerConnection => {
  const existing = peerConnectionsRef.current[targetUserId];
  if (existing) {
    try { existing.close(); } catch { }
  }

  // امسح الـ queue القديمة لو في واحدة
  iceCandidateQueuesRef.current[targetUserId] = [];

  const pc = new RTCPeerConnection({
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
    ],
  });
  peerConnectionsRef.current[targetUserId] = pc;
    // Add local tracks immediately if available
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        const alreadyAdded = pc.getSenders().some(
          (s) => s.track?.id === track.id
        );
        if (!alreadyAdded) {
          pc.addTrack(track, localStreamRef.current!);
        }
      });
    }

    pc.ontrack = (event) => {
      const remoteStream = event.streams[0];
      if (!remoteStream) return;
      setRemoteStreams((prev) => ({ ...prev, [targetUserId]: remoteStream }));
    };

    pc.onicecandidate = (event) => {
      if (event.candidate && socketRef.current) {
        socketRef.current.emit("webrtc-ice-candidate", {
          meetingId: meetingIdRef.current,
          targetUserId,
          candidate: event.candidate,
        });
      }
    };

    pc.oniceconnectionstatechange = () => {
      if (["failed", "disconnected", "closed"].includes(pc.iceConnectionState)) {
        console.warn(`ICE ${pc.iceConnectionState} for user ${targetUserId}`);
        // Clean up dead connection after a delay
        if (pc.iceConnectionState === "failed") {
          setTimeout(() => {
            if (peerConnectionsRef.current[targetUserId] === pc) {
              try { pc.close(); } catch { /* ignore */ }
              delete peerConnectionsRef.current[targetUserId];
              setRemoteStreams((prev) => {
                const { [targetUserId]: _, ...rest } = prev;
                return rest;
              });
            }
          }, 3000);
        }
      }
    };

    // ✅ PERMANENT onnegotiationneeded — never null it
    // Both sides can initiate renegotiation with signaling state guards
    pc.onnegotiationneeded = async () => {
      try {
        if (pc.signalingState !== "stable") {
          console.log("Skipping negotiation — not stable:", pc.signalingState);
          return;
        }
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socketRef.current?.emit("webrtc-offer", {
          meetingId: meetingIdRef.current,
          targetUserId,
          offer,
        });
      } catch (err) {
        console.error("Error in onnegotiationneeded:", err);
      }
    };

    return pc;
  }, []);

  // ── getOrCreatePeerConnection ─────────────────────────────────────────────
  const getOrCreatePeerConnection = useCallback((targetUserId: number): RTCPeerConnection => {
    return peerConnectionsRef.current[targetUserId] ?? initPeerConnection(targetUserId);
  }, [initPeerConnection]);

  // ── Socket setup ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!apiBaseUrl) return;

    hasCleanedUpRef.current = false;

    const socket = io(apiBaseUrl, {
      withCredentials: true,
      transports: ["websocket", "polling"],
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("Socket connected:", socket.id);
      setIsConnected(true);
    });

    socket.on("disconnect", () => {
      console.log("Socket disconnected");
      setIsConnected(false);
      // ✅ Clean up peer connections on unexpected disconnect
      cleanupPeerConnections();
    });

    socket.on("connect_error", (err) => {
      console.error("Socket connection error:", err.message);
    });

    socket.on("meeting-joined", ({ userId }: { userId: number }) => {
      setCurrentUserId(userId);
      currentUserIdRef.current = userId;
    });

    socket.on("meeting-state", ({
      participants: p,
      mediaStates,
    }: {
      participants: MeetingParticipant[];
      mediaStates?: Record<number, ParticipantState>;
    }) => {
      setParticipants(p);
      participantsRef.current = p;

      // ✅ Initialize participant states from server-synced media states
      if (mediaStates) {
        setParticipantStates(mediaStates);
      }

      const selfId = currentUserIdRef.current;
      p.forEach((participant) => {
        if (participant.userId !== selfId) {
          initPeerConnection(participant.userId);
        }
      });
    });

    socket.on("participant-joined", ({ participants: p }: { participants: MeetingParticipant[] }) => {
      setParticipants(p);
      participantsRef.current = p;
      const selfId = currentUserIdRef.current;
      p.forEach((participant) => {
        if (participant.userId !== selfId && !peerConnectionsRef.current[participant.userId]) {
          initPeerConnection(participant.userId);
        }
      });
    });

    socket.on("participant-left", ({ userId, participants: p }: { userId: number; participants: MeetingParticipant[] }) => {
      setParticipants(p);
      participantsRef.current = p;
      const pc = peerConnectionsRef.current[userId];
      if (pc) {
        try { pc.close(); } catch { /* ignore */ }
        delete peerConnectionsRef.current[userId];
      }
      setRemoteStreams((prev) => {
        const { [userId]: _, ...rest } = prev;
        return rest;
      });
      // ✅ Clear media state for left participant
      setParticipantStates((prev) => {
        const { [userId]: _, ...rest } = prev;
        return rest;
      });
        delete iceCandidateQueuesRef.current[userId];

    });

    socket.on("participant-mic-changed", ({ userId, isMicOn }: { userId: number; isMicOn: boolean }) => {
      setParticipantStates((prev) => ({
        ...prev,
        [userId]: { ...(prev[userId] || { isCameraOn: true, isScreenSharing: false }), isMicOn },
      }));
    });

    socket.on("participant-camera-changed", ({ userId, isCameraOn }: { userId: number; isCameraOn: boolean }) => {
      setParticipantStates((prev) => ({
        ...prev,
        [userId]: { ...(prev[userId] || { isMicOn: true, isScreenSharing: false }), isCameraOn },
      }));
    });

    socket.on("participant-screen-share-changed", ({ userId, isScreenSharing }: { userId: number; isScreenSharing: boolean }) => {
      setParticipantStates((prev) => ({
        ...prev,
        [userId]: { ...(prev[userId] || { isMicOn: true, isCameraOn: true }), isScreenSharing },
      }));
    });

    socket.on("webrtc-offer", async ({ userId, offer }) => {
  const pc = getOrCreatePeerConnection(userId);
  try {
    if (pc.signalingState === "have-local-offer") {
      const selfId = currentUserIdRef.current;
      if (selfId !== null && userId < selfId) {
        await pc.setLocalDescription({ type: "rollback" });
      } else {
        return;
      }
    }

    await pc.setRemoteDescription(new RTCSessionDescription(offer));

    // ✅ flush الـ queued candidates بعد setRemoteDescription مباشرةً
    const queued = iceCandidateQueuesRef.current[userId] || [];
    for (const candidate of queued) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.warn("Error flushing queued candidate:", err);
      }
    }
    iceCandidateQueuesRef.current[userId] = [];

    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    socket.emit("webrtc-answer", {
      meetingId: meetingIdRef.current,
      targetUserId: userId,
      answer,
    });
  } catch (err) {
    console.error("Error handling webrtc-offer:", err);
  }
});

    socket.on("webrtc-answer", async ({ userId, answer }) => {
  const pc = peerConnectionsRef.current[userId];
  if (pc && pc.signalingState === "have-local-offer") {
    try {
      await pc.setRemoteDescription(new RTCSessionDescription(answer));

      // ✅ flush هنا كمان
      const queued = iceCandidateQueuesRef.current[userId] || [];
      for (const candidate of queued) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
          console.warn("Error flushing queued candidate:", err);
        }
      }
      iceCandidateQueuesRef.current[userId] = [];

    } catch (err) {
      console.error("Error handling webrtc-answer:", err);
    }
  }
});

   socket.on("webrtc-ice-candidate", async ({ userId, candidate }) => {
  const pc = peerConnectionsRef.current[userId];

  if (pc && pc.remoteDescription) {
    // remoteDescription موجودة → أضف مباشرةً
    try {
      await pc.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (err) {
      console.warn("Failed to add ICE candidate:", err);
    }
  } else {
    // ✅ قدّمها للـ queue بدل إنها تتضيع
    if (!iceCandidateQueuesRef.current[userId]) {
      iceCandidateQueuesRef.current[userId] = [];
    }
    iceCandidateQueuesRef.current[userId].push(candidate);
  }
});

    socket.on("meeting-chat-message", (msg: MeetingMessage) => {
      setMessages((prev) => [...prev, msg]);
    });

    socket.on("meeting-ended", () => {
      setMeetingEnded(true);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
      cleanupPeerConnections();
    };
  }, [initPeerConnection, getOrCreatePeerConnection, cleanupPeerConnections]);

  // ── Join / leave room ─────────────────────────────────────────────────────
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !isConnected) return;

    if (meetingId) {
      socket.emit("join-meeting", { meetingId });
      setMeetingEnded(false);
      setMessages([]);
      setParticipantStates({});
      hasCleanedUpRef.current = false;
    }

    return () => {
      if (meetingId) socket.emit("leave-meeting", { meetingId });
      cleanupPeerConnections();
    };
  }, [meetingId, isConnected, cleanupPeerConnections]);

  // ── initLocalStream ───────────────────────────────────────────────────────
  const initLocalStream = useCallback((stream: MediaStream) => {
    localStreamRef.current = stream;

    Object.entries(peerConnectionsRef.current).forEach(([userIdStr, pc]) => {
      const targetUserId = Number(userIdStr);
      stream.getTracks().forEach((track) => {
        const existing = pc.getSenders().find((s) => s.track?.kind === track.kind);
        if (!existing) {
          pc.addTrack(track, stream);
        }
      });
      // onnegotiationneeded will fire automatically when tracks are added
    });

    const selfId = currentUserIdRef.current;
    participantsRef.current.forEach((p) => {
      if (p.userId !== selfId && !peerConnectionsRef.current[p.userId]) {
        initPeerConnection(p.userId);
      }
    });
  }, [initPeerConnection]);
//
  // ── replaceVideoTrack ─────────────────────────────────────────────────────
  // ✅ Now triggers renegotiation so remote peers see the new track
 const replaceVideoTrack = useCallback((newTrack: MediaStreamTrack | null) => {
  Object.entries(peerConnectionsRef.current).forEach(([userIdStr, pc]) => {
    const targetUserId = Number(userIdStr);
    const sender = pc.getSenders().find((s) => s.track?.kind === "video");

    if (sender) {
      sender.replaceTrack(newTrack).then(async () => {
        // ✅ force renegotiation بعد replaceTrack
        if (pc.signalingState !== "stable") return;
        try {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          socketRef.current?.emit("webrtc-offer", {
            meetingId: meetingIdRef.current,
            targetUserId,
            offer,
          });
        } catch (err) {
          console.error("Error renegotiating after replaceTrack:", err);
        }
      }).catch((err) => console.error("Error replacing video track:", err));

    } else if (newTrack) {
      // No existing sender — add the track
      const stream = localStreamRef.current || new MediaStream([newTrack]);
      if (!localStreamRef.current) localStreamRef.current = stream;
      pc.addTrack(newTrack, stream);
      // onnegotiationneeded fires automatically here
    }
  });
}, []);

  // ── Emitters ──────────────────────────────────────────────────────────────
  const toggleMic = useCallback((isMicOn: boolean) => {
    if (!socketRef.current || !meetingIdRef.current) return;
    socketRef.current.emit("toggle-mic", { meetingId: meetingIdRef.current, isMicOn });
  }, []);

  const toggleCamera = useCallback((isCameraOn: boolean) => {
    if (!socketRef.current || !meetingIdRef.current) return;
    socketRef.current.emit("toggle-camera", { meetingId: meetingIdRef.current, isCameraOn });
  }, []);

  const toggleScreenShare = useCallback((isScreenSharing: boolean) => {
    if (!socketRef.current || !meetingIdRef.current) return;
    socketRef.current.emit("screen-share", { meetingId: meetingIdRef.current, isScreenSharing });
  }, []);

  const sendChatMessage = useCallback((content: string) => {
    if (!socketRef.current || !meetingIdRef.current) return;
    socketRef.current.emit("meeting-chat", { meetingId: meetingIdRef.current, content });
  }, []);

  return {
    isConnected,
    currentUserId,
    participants,
    participantStates,
    messages,
    meetingEnded,
    remoteStreams,
    initLocalStream,
    replaceVideoTrack,
    toggleMic,
    toggleCamera,
    toggleScreenShare,
    sendChatMessage,
  };
}

