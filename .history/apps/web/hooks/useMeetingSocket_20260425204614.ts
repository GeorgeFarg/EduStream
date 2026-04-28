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

    socket.on("meeting-state", ({ participants: p }: { participants: MeetingParticipant[] }) => {
      setParticipants(p);
    });

    socket.on("participant-joined", ({ participants: p }: { participants: MeetingParticipant[] }) => {
      setParticipants(p);
    });

    socket.on("participant-left", ({ participants: p }: { participants: MeetingParticipant[] }) => {
      setParticipants(p);
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

    socket.on("meeting-chat-message", (msg: MeetingMessage) => {
      setMessages((prev) => [...prev, msg]);
    });

    socket.on("meeting-ended", () => {
      setMeetingEnded(true);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
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
    };
  }, [meetingId, isConnected]);

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
    participants,
    participantStates,
    messages,
    meetingEnded,
    toggleMic,
    toggleCamera,
    toggleScreenShare,
    sendChatMessage,
  };
}

