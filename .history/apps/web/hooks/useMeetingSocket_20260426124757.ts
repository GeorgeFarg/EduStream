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
  const [isConnected, setIsConnected] = useState(false);
  const [participants, setParticipants] = useState<MeetingParticipant[]>([]);
  const [participantStates, setParticipantStates] = useState<Record<number, ParticipantState>>({});
  const [messages, setMessages] = useState<MeetingMessage[]>([]);
  const [meetingEnded, setMeetingEnded] = useState(false);
  const [remoteStreams, setRemoteStreams] = useState<Record<number, MediaStream>>({});
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  // Refs for WebRTC
  const peerConnectionsRef = useRef<Record<number, RTCPeerConnection>>({});
  const localStreamRef = useRef<MediaStream | null>(null);
  const currentUserIdRef = useRef<number | null>(null);

  useEffect(() => {
    currentUserIdRef.current = currentUserId;
  }, [currentUserId]);

  useEffect(() => {
    if (!apiBaseUrl) return;

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
    });

    socket.on("connect_error", (err) => {
      console.error("Socket connection error:", err.message);
    });

    socket.on("meeting-joined", ({ userId }: { userId: number }) => {
      setCurrentUserId(userId);
    });

    socket.on("meeting-state", ({ participants: p }: { participants: MeetingParticipant[] }) => {
      setParticipants(p);
      // Init peer connections for existing participants (except self)
      const selfId = currentUserIdRef.current;
      p.forEach((participant) => {
        if (participant.userId !== selfId) {
          initPeerConnection(participant.userId);
        }
      });
    });

    socket.on("participant-joined", ({ participants: p }: { participants: MeetingParticipant[] }) => {
      setParticipants(p);
      const selfId = currentUserIdRef.current;
      // Find newly joined participants and connect
      p.forEach((participant) => {
        if (participant.userId !== selfId && !peerConnectionsRef.current[participant.userId]) {
          initPeerConnection(participant.userId);
        }
      });
    });

    socket.on("participant-left", ({ userId, participants: p }: { userId: number; participants: MeetingParticipant[] }) => {
      setParticipants(p);
      // Close and cleanup peer connection
      const pc = peerConnectionsRef.current[userId];
      if (pc) {
        pc.close();
        delete peerConnectionsRef.current[userId];
      }
      setRemoteStreams((prev) => {
        const next: Record<number, MediaStream> = { ...prev };
        delete next[userId];
        return next;
      });
    });

    socket.on(
      "participant-mic-changed",
      ({ userId, isMicOn }: { userId: number; isMicOn: boolean }) => {
        setParticipantStates((prev) => ({
          ...prev,
          [userId]: { ...(prev[userId] || { isCameraOn: true, isScreenSharing: false }), isMicOn },
        }));
      }
    );

    socket.on(
      "participant-camera-changed",
      ({ userId, isCameraOn }: { userId: number; isCameraOn: boolean }) => {
        setParticipantStates((prev) => ({
          ...prev,
          [userId]: { ...(prev[userId] || { isMicOn: true, isScreenSharing: false }), isCameraOn },
        }));
      }
    );

    socket.on(
      "participant-screen-share-changed",
      ({ userId, isScreenSharing }: { userId: number; isScreenSharing: boolean }) => {
        setParticipantStates((prev) => ({
          ...prev,
          [userId]: { ...(prev[userId] || { isMicOn: true, isCameraOn: true }), isScreenSharing },
        }));
      }
    );

    // WebRTC handlers
    socket.on(
      "webrtc-offer",
      async ({ userId, offer }: { userId: number; offer: RTCSessionDescriptionInit }) => {
        const pc = getOrCreatePeerConnection(userId);
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit("webrtc-answer", {
          meetingId,
          targetUserId: userId,
          answer,
        });
      }
    );

    socket.on(
      "webrtc-answer",
      async ({ userId, answer }: { userId: number; answer: RTCSessionDescriptionInit }) => {
        const pc = peerConnectionsRef.current[userId];
        if (pc) {
          await pc.setRemoteDescription(new RTCSessionDescription(answer));
        }
      }
    );

    socket.on(
      "webrtc-ice-candidate",
      async ({ userId, candidate }: { userId: number; candidate: RTCIceCandidateInit }) => {
        const pc = peerConnectionsRef.current[userId];
        if (pc) {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        }
      }
    );

    socket.on("meeting-chat-message", (msg: MeetingMessage) => {
      setMessages((prev) => [...prev, msg]);
    });

    socket.on("meeting-ended", () => {
      setMeetingEnded(true);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
      // Cleanup all peer connections
      Object.values(peerConnectionsRef.current).forEach((pc) => pc.close());
      peerConnectionsRef.current = {};
      localStreamRef.current = null;
    };
  }, []);

  // Join/leave meeting room when meetingId changes
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !isConnected) return;

    if (meetingId) {
      socket.emit("join-meeting", { meetingId });
      setMeetingEnded(false);
    }

    return () => {
      if (meetingId) {
        socket.emit("leave-meeting", { meetingId });
      }
      // Cleanup peer connections on leave
      Object.values(peerConnectionsRef.current).forEach((pc) => pc.close());
      peerConnectionsRef.current = {};
      setRemoteStreams({});
    };
  }, [meetingId, isConnected]);

  const getOrCreatePeerConnection = useCallback(
    (targetUserId: number): RTCPeerConnection => {
      if (peerConnectionsRef.current[targetUserId]) {
        return peerConnectionsRef.current[targetUserId];
      }
      return initPeerConnection(targetUserId);
    },
    [meetingId]
  );

  const initPeerConnection = useCallback(
    (targetUserId: number): RTCPeerConnection => {
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
      });

      peerConnectionsRef.current[targetUserId] = pc;

      // Add local tracks if available
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => {
          pc.addTrack(track, localStreamRef.current!);
        });
      }

      // Handle remote stream
      pc.ontrack = (event) => {
        const [remoteStream] = event.streams;
        setRemoteStreams((prev) => ({
          ...prev,
          [targetUserId]: remoteStream,
        }));
      };

      // Handle ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate && socketRef.current) {
          socketRef.current.emit("webrtc-ice-candidate", {
            meetingId,
            targetUserId,
            candidate: event.candidate,
          });
        }
      };

      // Initiate offer if current user has lower ID (to avoid duplicate offers)
      const selfId = currentUserIdRef.current;
      if (selfId !== null && selfId < targetUserId) {
        pc.onnegotiationneeded = async () => {
          try {
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            socketRef.current?.emit("webrtc-offer", {
              meetingId,
              targetUserId,
              offer,
            });
          } catch (err) {
            console.error("Error creating offer:", err);
          }
        };
      }

      return pc;
    },
    [meetingId]
  );

  // Called after local media stream is obtained
  const initLocalStream = useCallback(
    (stream: MediaStream) => {
      localStreamRef.current = stream;
      // Add tracks to all existing peer connections
      Object.entries(peerConnectionsRef.current).forEach(([userId, pc]) => {
        stream.getTracks().forEach((track) => {
          // Check if track already added
          const senders = pc.getSenders();
          const existing = senders.find((s) => s.track?.kind === track.kind);
          if (!existing) {
            pc.addTrack(track, stream);
          }
        });
      });
      // Initiate connections with all participants
      const selfId = currentUserIdRef.current;
      participants.forEach((p) => {
        if (p.userId !== selfId && !peerConnectionsRef.current[p.userId]) {
          initPeerConnection(p.userId);
        }
      });
    },
    [participants, initPeerConnection]
  );

  // Replace video track (for screen share / camera switch)
  const replaceVideoTrack = useCallback(
    (newTrack: MediaStreamTrack | null) => {
      if (!newTrack) return;
      Object.values(peerConnectionsRef.current).forEach((pc) => {
        const sender = pc.getSenders().find((s) => s.track?.kind === "video");
        if (sender) {
          sender.replaceTrack(newTrack).catch((err) => {
            console.error("Error replacing track:", err);
          });
        }
      });
    },
    []
  );

  const toggleMic = useCallback(
    (isMicOn: boolean) => {
      if (!socketRef.current || !meetingId) return;
      socketRef.current.emit("toggle-mic", { meetingId, isMicOn });
    },
    [meetingId]
  );

  const toggleCamera = useCallback(
    (isCameraOn: boolean) => {
      if (!socketRef.current || !meetingId) return;
      socketRef.current.emit("toggle-camera", { meetingId, isCameraOn });
    },
    [meetingId]
  );

  const toggleScreenShare = useCallback(
    (isScreenSharing: boolean) => {
      if (!socketRef.current || !meetingId) return;
      socketRef.current.emit("screen-share", { meetingId, isScreenSharing });
    },
    [meetingId]
  );

  const sendChatMessage = useCallback(
    (content: string) => {
      if (!socketRef.current || !meetingId) return;
      socketRef.current.emit("meeting-chat", { meetingId, content });
    },
    [meetingId]
  );

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

