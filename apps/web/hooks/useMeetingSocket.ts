"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { apiBaseUrl } from "@/config/env";

export interface ParticipantState {
  isMicOn: boolean;
  isCameraOn: boolean;
  isScreenSharing: boolean;
  isHandRaised: boolean;
}

export interface LocalMediaHealth {
  micEnabled: boolean;
  micReady: boolean;
  micPublished: boolean;
  cameraEnabled: boolean;
  cameraReady: boolean;
  cameraPublished: boolean;
  lastCheckedAt: string | null;
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
  const pendingRenegotiationRef = useRef<Record<number, boolean>>({});
  const negotiationInProgressRef = useRef<Record<number, boolean>>({});
  const screenShareSendersRef = useRef<Record<number, RTCRtpSender>>({});
  const activeScreenTrackRef = useRef<MediaStreamTrack | null>(null);

  const [isConnected, setIsConnected] = useState(false);
  const [participants, setParticipants] = useState<MeetingParticipant[]>([]);
  const [participantStates, setParticipantStates] = useState<Record<number, ParticipantState>>({});
  const [messages, setMessages] = useState<MeetingMessage[]>([]);
  const [meetingEnded, setMeetingEnded] = useState(false);
  const [remoteStreams, setRemoteStreams] = useState<Record<number, MediaStream>>({});
  const [remoteScreenStreams, setRemoteScreenStreams] = useState<Record<number, MediaStream>>({});
  const [participantMediaHealth, setParticipantMediaHealth] = useState<Record<number, LocalMediaHealth>>({});
  const [localMediaHealth, setLocalMediaHealth] = useState<LocalMediaHealth>({
    micEnabled: false,
    micReady: false,
    micPublished: false,
    cameraEnabled: false,
    cameraReady: false,
    cameraPublished: false,
    lastCheckedAt: null,
  });
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  const peerConnectionsRef = useRef<Record<number, RTCPeerConnection>>({});
  const localStreamRef = useRef<MediaStream | null>(null);
  const currentUserIdRef = useRef<number | null>(null);
  const meetingIdRef = useRef<number | null>(meetingId);
  const participantsRef = useRef<MeetingParticipant[]>([]);
  const participantStatesRef = useRef<Record<number, ParticipantState>>({});
  const remoteStreamsRef = useRef<Record<number, MediaStream>>({});
  const remoteScreenStreamsRef = useRef<Record<number, MediaStream>>({});
  const hasCleanedUpRef = useRef(false);

  useEffect(() => {
    currentUserIdRef.current = currentUserId;
  }, [currentUserId]);

  useEffect(() => {
    meetingIdRef.current = meetingId;
  }, [meetingId]);

  useEffect(() => {
    participantsRef.current = participants;
  }, [participants]);

  useEffect(() => {
    participantStatesRef.current = participantStates;
  }, [participantStates]);

  useEffect(() => {
    remoteStreamsRef.current = remoteStreams;
  }, [remoteStreams]);

  useEffect(() => {
    remoteScreenStreamsRef.current = remoteScreenStreams;
  }, [remoteScreenStreams]);

  const isLikelyScreenTrack = (track: MediaStreamTrack) => {
    return /screen|window|tab/i.test(track.label || "");
  };

  const refreshLocalMediaHealth = useCallback(() => {
    const stream = localStreamRef.current;
    const audioTrack = stream?.getAudioTracks()[0] || null;
    const videoTrack = stream?.getVideoTracks()[0] || null;

    const micEnabled = !!audioTrack && audioTrack.enabled;
    const cameraEnabled = !!videoTrack && videoTrack.enabled;
    const micReady = !!audioTrack && audioTrack.readyState === "live";
    const cameraReady = !!videoTrack && videoTrack.readyState === "live";

    const micPublished = Object.values(peerConnectionsRef.current).some((pc) =>
      pc.getSenders().some((sender) => sender.track?.kind === "audio" && sender.track?.id === audioTrack?.id)
    );

    const cameraPublished = Object.entries(peerConnectionsRef.current).some(([userIdStr, pc]) => {
      const screenSender = screenShareSendersRef.current[Number(userIdStr)];
      return pc
        .getSenders()
        .some((sender) => sender.track?.kind === "video" && sender !== screenSender && sender.track?.id === videoTrack?.id);
    });

    const nextHealth: LocalMediaHealth = {
      micEnabled,
      micReady,
      micPublished,
      cameraEnabled,
      cameraReady,
      cameraPublished,
      lastCheckedAt: new Date().toISOString(),
    };

    setLocalMediaHealth(nextHealth);

    if (socketRef.current && meetingIdRef.current) {
      socketRef.current.emit("participant-media-health", {
        meetingId: meetingIdRef.current,
        health: nextHealth,
      });
    }
  }, []);

  const syncLocalMediaState = useCallback(() => {
    if (!socketRef.current || !meetingIdRef.current) return;

    const stream = localStreamRef.current;
    if (!stream) return;

    const audioTrack = stream.getAudioTracks()[0];
    const videoTrack = stream.getVideoTracks()[0];

    socketRef.current.emit("toggle-mic", {
      meetingId: meetingIdRef.current,
      isMicOn: !!audioTrack && audioTrack.enabled,
    });

    socketRef.current.emit("toggle-camera", {
      meetingId: meetingIdRef.current,
      isCameraOn: !!videoTrack && videoTrack.enabled,
    });

    refreshLocalMediaHealth();
  }, [refreshLocalMediaHealth]);

  const flushIceCandidates = useCallback(async (userId: number, pc: RTCPeerConnection) => {
    const queued = iceCandidateQueuesRef.current[userId] || [];
    if (queued.length === 0) return;

    for (const candidate of queued) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.warn(`Error flushing queued ICE candidate for user ${userId}:`, err);
      }
    }

    iceCandidateQueuesRef.current[userId] = [];
  }, []);

  const renegotiatePeer = useCallback(async (targetUserId: number, pc: RTCPeerConnection) => {
    if (!socketRef.current || pc.signalingState === "closed") return;

    if (pc.signalingState !== "stable") {
      pendingRenegotiationRef.current[targetUserId] = true;
      return;
    }

    if (negotiationInProgressRef.current[targetUserId]) {
      pendingRenegotiationRef.current[targetUserId] = true;
      return;
    }

    negotiationInProgressRef.current[targetUserId] = true;
    pendingRenegotiationRef.current[targetUserId] = false;

    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socketRef.current?.emit("webrtc-offer", {
        meetingId: meetingIdRef.current,
        targetUserId,
        offer,
      });
    } catch (err) {
      console.error(`Error renegotiating with user ${targetUserId}:`, err);
      pendingRenegotiationRef.current[targetUserId] = true;
    } finally {
      negotiationInProgressRef.current[targetUserId] = false;
    }
  }, []);

  const cleanupPeerConnections = useCallback(() => {
    if (hasCleanedUpRef.current) return;
    hasCleanedUpRef.current = true;

    Object.values(peerConnectionsRef.current).forEach((pc) => {
      try {
        pc.close();
      } catch {
        /* ignore */
      }
    });

    peerConnectionsRef.current = {};
    iceCandidateQueuesRef.current = {};
    pendingRenegotiationRef.current = {};
    negotiationInProgressRef.current = {};
    screenShareSendersRef.current = {};
    activeScreenTrackRef.current = null;
    setRemoteStreams({});
    setRemoteScreenStreams({});
    setParticipantMediaHealth({});
    localStreamRef.current = null;
    setLocalMediaHealth({
      micEnabled: false,
      micReady: false,
      micPublished: false,
      cameraEnabled: false,
      cameraReady: false,
      cameraPublished: false,
      lastCheckedAt: null,
    });
  }, []);

  const initPeerConnection = useCallback((targetUserId: number): RTCPeerConnection => {
    const existing = peerConnectionsRef.current[targetUserId];
    if (existing) {
      try {
        existing.close();
      } catch {
        /* ignore */
      }
    }

    iceCandidateQueuesRef.current[targetUserId] = [];
    pendingRenegotiationRef.current[targetUserId] = false;
    negotiationInProgressRef.current[targetUserId] = false;

    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
      ],
    });

    peerConnectionsRef.current[targetUserId] = pc;

    pc.ontrack = (event) => {
      const incomingStream = event.streams[0] ?? new MediaStream([event.track]);

      const isScreenSharing = participantStatesRef.current[targetUserId]?.isScreenSharing ?? false;
      const hasCameraStream = !!remoteStreamsRef.current[targetUserId];
      const currentScreenStream = remoteScreenStreamsRef.current[targetUserId];
      const looksLikeScreen = event.track.kind === "video" && isLikelyScreenTrack(event.track);
      const secondVideoWhileSharing =
        event.track.kind === "video" &&
        isScreenSharing &&
        hasCameraStream &&
        !currentScreenStream &&
        remoteStreamsRef.current[targetUserId]?.id !== incomingStream.id;

      if (looksLikeScreen || secondVideoWhileSharing) {
        setRemoteScreenStreams((prev) => ({ ...prev, [targetUserId]: incomingStream }));
        return;
      }

      if (event.track.kind === "video") {
        setRemoteStreams((prev) => ({ ...prev, [targetUserId]: incomingStream }));
        return;
      }

      setRemoteStreams((prev) => ({ ...prev, [targetUserId]: incomingStream }));
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

        if (pc.iceConnectionState === "failed") {
          setTimeout(() => {
            if (peerConnectionsRef.current[targetUserId] === pc) {
              try {
                pc.close();
              } catch {
                /* ignore */
              }
              delete peerConnectionsRef.current[targetUserId];
              delete iceCandidateQueuesRef.current[targetUserId];
              delete pendingRenegotiationRef.current[targetUserId];
              delete negotiationInProgressRef.current[targetUserId];
              setRemoteStreams((prev) => {
                const { [targetUserId]: _, ...rest } = prev;
                return rest;
              });
            }
          }, 3000);
        }
      }
    };

    pc.onsignalingstatechange = () => {
      if (pc.signalingState === "stable" && pendingRenegotiationRef.current[targetUserId]) {
        void renegotiatePeer(targetUserId, pc);
      }
    };

    pc.onnegotiationneeded = () => {
      void renegotiatePeer(targetUserId, pc);
    };

    let needsRenegotiation = false;
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        const alreadyAdded = pc.getSenders().some((s) => s.track?.id === track.id);
        if (!alreadyAdded) {
          pc.addTrack(track, localStreamRef.current!);
          needsRenegotiation = true;
        }
      });
    }

    if (activeScreenTrackRef.current) {
      const screenStream = new MediaStream([activeScreenTrackRef.current]);
      const sender = pc.addTrack(activeScreenTrackRef.current, screenStream);
      screenShareSendersRef.current[targetUserId] = sender;
      needsRenegotiation = true;
    }

    if (needsRenegotiation) {
      void renegotiatePeer(targetUserId, pc);
    }

    return pc;
  }, [renegotiatePeer]);

  const getOrCreatePeerConnection = useCallback((targetUserId: number): RTCPeerConnection => {
    return peerConnectionsRef.current[targetUserId] ?? initPeerConnection(targetUserId);
  }, [initPeerConnection]);

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
      cleanupPeerConnections();
    });

    socket.on("connect_error", (err) => {
      console.error("Socket connection error:", err.message);
    });

    socket.on("meeting-joined", ({ userId }: { userId: number }) => {
      setCurrentUserId(userId);
      currentUserIdRef.current = userId;
      syncLocalMediaState();
    });

    socket.on(
      "meeting-state",
      ({
        participants: p,
        mediaStates,
        mediaHealthStates,
      }: {
        participants: MeetingParticipant[];
        mediaStates?: Record<number, ParticipantState>;
        mediaHealthStates?: Record<number, LocalMediaHealth>;
      }) => {
        setParticipants(p);
        participantsRef.current = p;

        if (mediaStates) {
          setParticipantStates(mediaStates);
        }

        if (mediaHealthStates) {
          setParticipantMediaHealth(mediaHealthStates);
        }

        const selfId = currentUserIdRef.current;
        p.forEach((participant) => {
          if (participant.userId !== selfId) {
            initPeerConnection(participant.userId);
          }
        });

        syncLocalMediaState();
      }
    );

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

    socket.on(
      "participant-left",
      ({ userId, participants: p }: { userId: number; participants: MeetingParticipant[] }) => {
        setParticipants(p);
        participantsRef.current = p;

        const pc = peerConnectionsRef.current[userId];
        if (pc) {
          try {
            pc.close();
          } catch {
            /* ignore */
          }
          delete peerConnectionsRef.current[userId];
        }

        delete iceCandidateQueuesRef.current[userId];
        delete pendingRenegotiationRef.current[userId];
        delete negotiationInProgressRef.current[userId];
        delete screenShareSendersRef.current[userId];

        setRemoteStreams((prev) => {
          const { [userId]: _, ...rest } = prev;
          return rest;
        });
        setRemoteScreenStreams((prev) => {
          const { [userId]: _, ...rest } = prev;
          return rest;
        });

        setParticipantMediaHealth((prev) => {
          const { [userId]: _, ...rest } = prev;
          return rest;
        });

        setParticipantStates((prev) => {
          const { [userId]: _, ...rest } = prev;
          return rest;
        });
      }
    );

    socket.on("participant-mic-changed", ({ userId, isMicOn }: { userId: number; isMicOn: boolean }) => {
      setParticipantStates((prev) => ({
        ...prev,
        [userId]: { ...(prev[userId] || { isCameraOn: false, isScreenSharing: false, isHandRaised: false }), isMicOn },
      }));
    });

    socket.on("participant-camera-changed", ({ userId, isCameraOn }: { userId: number; isCameraOn: boolean }) => {
      setParticipantStates((prev) => ({
        ...prev,
        [userId]: { ...(prev[userId] || { isMicOn: false, isScreenSharing: false, isHandRaised: false }), isCameraOn },
      }));
    });

    socket.on(
      "participant-screen-share-changed",
      ({ userId, isScreenSharing }: { userId: number; isScreenSharing: boolean }) => {
        setParticipantStates((prev) => ({
          ...prev,
          [userId]: { ...(prev[userId] || { isMicOn: false, isCameraOn: false, isHandRaised: false }), isScreenSharing },
        }));

        if (!isScreenSharing) {
          setRemoteScreenStreams((prev) => {
            const { [userId]: _, ...rest } = prev;
            return rest;
          });
        }
      }
    );

    socket.on(
      "participant-hand-raised-changed",
      ({ userId, isHandRaised }: { userId: number; isHandRaised: boolean }) => {
        setParticipantStates((prev) => ({
          ...prev,
          [userId]: { ...(prev[userId] || { isMicOn: false, isCameraOn: false, isScreenSharing: false }), isHandRaised },
        }));
      }
    );

    socket.on(
      "participant-media-health-changed",
      ({ userId, health }: { userId: number; health: LocalMediaHealth }) => {
        setParticipantMediaHealth((prev) => ({
          ...prev,
          [userId]: health,
        }));
      }
    );

    socket.on("webrtc-offer", async ({ userId, offer }: { userId: number; offer: RTCSessionDescriptionInit }) => {
      const pc = getOrCreatePeerConnection(userId);

      try {
        if (pc.signalingState === "have-local-offer") {
          const selfId = currentUserIdRef.current;
          if (selfId !== null && userId < selfId) {
            await pc.setLocalDescription({ type: "rollback" });
          } else {
            console.log("Offer collision - ignoring remote offer (we have lower ID)");
            return;
          }
        }

        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        await flushIceCandidates(userId, pc);

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

    socket.on("webrtc-answer", async ({ userId, answer }: { userId: number; answer: RTCSessionDescriptionInit }) => {
      const pc = peerConnectionsRef.current[userId];
      if (pc && pc.signalingState === "have-local-offer") {
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(answer));
          await flushIceCandidates(userId, pc);
        } catch (err) {
          console.error("Error handling webrtc-answer:", err);
        }
      }
    });

    socket.on(
      "webrtc-ice-candidate",
      async ({ userId, candidate }: { userId: number; candidate: RTCIceCandidateInit }) => {
        const pc = peerConnectionsRef.current[userId];

        if (pc && pc.remoteDescription) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
          } catch (err) {
            console.warn("Failed to add ICE candidate:", err);
          }
        } else {
          if (!iceCandidateQueuesRef.current[userId]) {
            iceCandidateQueuesRef.current[userId] = [];
          }
          iceCandidateQueuesRef.current[userId].push(candidate);
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
      cleanupPeerConnections();
    };
  }, [cleanupPeerConnections, flushIceCandidates, getOrCreatePeerConnection, initPeerConnection]);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !isConnected) return;

    if (meetingId) {
      socket.emit("join-meeting", { meetingId });
      setMeetingEnded(false);
      setMessages([]);
      setParticipantStates({});
      hasCleanedUpRef.current = false;
      setTimeout(() => {
        syncLocalMediaState();
      }, 0);
    }

    return () => {
      if (meetingId) socket.emit("leave-meeting", { meetingId });
      cleanupPeerConnections();
    };
  }, [cleanupPeerConnections, isConnected, meetingId, syncLocalMediaState]);

  const initLocalStream = useCallback(
    (stream: MediaStream) => {
      localStreamRef.current = stream;

      Object.entries(peerConnectionsRef.current).forEach(([userIdStr, pc]) => {
        const targetUserId = Number(userIdStr);
        const screenSender = screenShareSendersRef.current[targetUserId];

        stream.getTracks().forEach((track) => {
          const existing =
            pc.getSenders().find((s) => s.track?.id === track.id) ||
            (track.kind === "video"
              ? pc.getSenders().find((s) => s.track?.kind === "video" && s !== screenSender)
              : pc.getSenders().find((s) => s.track?.kind === track.kind));
          if (!existing) {
            pc.addTrack(track, stream);
          }
        });

        void renegotiatePeer(targetUserId, pc);
      });

      const selfId = currentUserIdRef.current;
      participantsRef.current.forEach((p) => {
        if (p.userId !== selfId && !peerConnectionsRef.current[p.userId]) {
          initPeerConnection(p.userId);
        }
      });
      syncLocalMediaState();
      refreshLocalMediaHealth();
    },
    [initPeerConnection, renegotiatePeer, refreshLocalMediaHealth, syncLocalMediaState]
  );

  const replaceVideoTrack = useCallback(
    (newTrack: MediaStreamTrack | null) => {
      Object.entries(peerConnectionsRef.current).forEach(([userIdStr, pc]) => {
        const targetUserId = Number(userIdStr);
        const screenSender = screenShareSendersRef.current[targetUserId];
        const sender = pc.getSenders().find((s) => s.track?.kind === "video" && s !== screenSender);

        if (sender) {
          sender
            .replaceTrack(newTrack)
            .then(() => void renegotiatePeer(targetUserId, pc))
            .catch((err) => console.error("Error replacing video track:", err));
        } else if (newTrack) {
          const stream = localStreamRef.current || new MediaStream([newTrack]);
          if (!localStreamRef.current) localStreamRef.current = stream;
          pc.addTrack(newTrack, stream);
          void renegotiatePeer(targetUserId, pc);
        }
      });

      refreshLocalMediaHealth();
    },
    [refreshLocalMediaHealth, renegotiatePeer]
  );

  const replaceAudioTrack = useCallback(
    (newTrack: MediaStreamTrack | null) => {
      Object.entries(peerConnectionsRef.current).forEach(([userIdStr, pc]) => {
        const targetUserId = Number(userIdStr);
        const sender = pc.getSenders().find((s) => s.track?.kind === "audio");

        if (sender) {
          sender
            .replaceTrack(newTrack)
            .then(() => void renegotiatePeer(targetUserId, pc))
            .catch((err) => console.error("Error replacing audio track:", err));
        } else if (newTrack) {
          const stream = localStreamRef.current || new MediaStream([newTrack]);
          if (!localStreamRef.current) localStreamRef.current = stream;
          pc.addTrack(newTrack, stream);
          void renegotiatePeer(targetUserId, pc);
        }
      });

      refreshLocalMediaHealth();
    },
    [refreshLocalMediaHealth, renegotiatePeer]
  );

  const addScreenShareTrack = useCallback(
    (newTrack: MediaStreamTrack | null) => {
      activeScreenTrackRef.current = newTrack;
      Object.entries(peerConnectionsRef.current).forEach(([userIdStr, pc]) => {
        const targetUserId = Number(userIdStr);
        const existingSender = screenShareSendersRef.current[targetUserId];

        if (existingSender) {
          try {
            pc.removeTrack(existingSender);
          } catch {
            /* ignore */
          }
          delete screenShareSendersRef.current[targetUserId];
        }

        if (!newTrack) return;

        const screenStream = new MediaStream([newTrack]);
        const sender = pc.addTrack(newTrack, screenStream);
        screenShareSendersRef.current[targetUserId] = sender;
        void renegotiatePeer(targetUserId, pc);
      });

      refreshLocalMediaHealth();
    },
    [refreshLocalMediaHealth, renegotiatePeer]
  );

  const removeScreenShareTrack = useCallback(() => {
    Object.entries(peerConnectionsRef.current).forEach(([userIdStr, pc]) => {
      const targetUserId = Number(userIdStr);
      const sender = screenShareSendersRef.current[targetUserId];
      if (!sender) return;

      try {
        pc.removeTrack(sender);
      } catch {
        /* ignore */
      }

      delete screenShareSendersRef.current[targetUserId];
      void renegotiatePeer(targetUserId, pc);
    });
    activeScreenTrackRef.current = null;
    refreshLocalMediaHealth();
  }, [refreshLocalMediaHealth, renegotiatePeer]);

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

  const toggleHandRaise = useCallback((isHandRaised: boolean) => {
    if (!socketRef.current || !meetingIdRef.current) return;
    socketRef.current.emit("toggle-hand", { meetingId: meetingIdRef.current, isHandRaised });
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
    remoteScreenStreams,
    participantMediaHealth,
    localMediaHealth,
    initLocalStream,
    replaceAudioTrack,
    replaceVideoTrack,
    addScreenShareTrack,
    removeScreenShareTrack,
    refreshLocalMediaHealth,
    toggleMic,
    toggleCamera,
    toggleScreenShare,
    toggleHandRaise,
    sendChatMessage,
  };
}
