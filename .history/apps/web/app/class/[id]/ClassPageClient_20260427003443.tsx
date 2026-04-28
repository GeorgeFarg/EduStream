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
  const [participantStates, setParticipantStates] = useState<
    Record<number, ParticipantState>
  >({});
  const [messages, setMessages] = useState<MeetingMessage[]>([]);
  const [meetingEnded, setMeetingEnded] = useState(false);
  const [remoteStreams, setRemoteStreams] = useState<
    Record<number, MediaStream>
  >({});
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  // Refs for WebRTC
  const peerConnectionsRef = useRef<Record<number, RTCPeerConnection>>({});
  const localStreamRef = useRef<MediaStream | null>(null);
  const currentUserIdRef = useRef<number | null>(null);
  const meetingIdRef = useRef<number | null>(meetingId);

  // Keep meetingIdRef in sync
  useEffect(() => {
    meetingIdRef.current = meetingId;
  }, [meetingId]);

  useEffect(() => {
    currentUserIdRef.current = currentUserId;
  }, [currentUserId]);

  // ─── Create a peer connection for a remote user ───────────────────────────
  const initPeerConnection = useCallback(
    (targetUserId: number): RTCPeerConnection => {
      // Close existing if any
      if (peerConnectionsRef.current[targetUserId]) {
        peerConnectionsRef.current[targetUserId].close();
      }

      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun1.l.google.com:19302" },
        ],
      });

      peerConnectionsRef.current[targetUserId] = pc;

      // ✅ Add local tracks BEFORE creating offer so the remote side gets media
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => {
          pc.addTrack(track, localStreamRef.current!);
        });
      }

      // Handle incoming remote stream
pc.ontrack = (event) => {
  const stream = new MediaStream([event.track]);

  setRemoteStreams((prev) => ({
    ...prev,
    [targetUserId]: stream,
  }));
};

      // Send ICE candidates to the remote peer
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
        if (
          pc.iceConnectionState === "failed" ||
          pc.iceConnectionState === "disconnected"
        ) {
          console.warn(
            `ICE connection ${pc.iceConnectionState} for user ${targetUserId}`
          );
        }
      };

      // ✅ Only the peer with the lower userId initiates the offer
      // This avoids duplicate / glare offers.
      const selfId = currentUserIdRef.current;
      if (selfId !== null && selfId < targetUserId) {
        const startOffer = async () => {
          try {
            if (pc.signalingState !== "stable") return;
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            socketRef.current?.emit("webrtc-offer", {
              meetingId: meetingIdRef.current,
              targetUserId,
              offer,
            });
          } catch (err) {
            console.error("Error creating offer:", err);
          }
        };

        if (
          localStreamRef.current &&
          localStreamRef.current.getTracks().length > 0
        ) {
          // ✅ Tracks already added — trigger offer immediately
          startOffer();
        } else {
          // ✅ Fallback: wait for browser to fire negotiationneeded once tracks arrive
          pc.onnegotiationneeded = () => {
            startOffer();
            // Remove handler after first use to avoid duplicate offers
            pc.onnegotiationneeded = null;
          };
        }
      }

      return pc;
    },
    [] // No deps — uses refs only
  );

  const getOrCreatePeerConnection = useCallback(
    (targetUserId: number): RTCPeerConnection => {
      if (peerConnectionsRef.current[targetUserId]) {
        return peerConnectionsRef.current[targetUserId];
      }
      return initPeerConnection(targetUserId);
    },
    [initPeerConnection]
  );

  // ─── Socket setup (run once) ──────────────────────────────────────────────
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
      currentUserIdRef.current = userId;
    });

    socket.on(
      "meeting-state",
      ({ participants: p }: { participants: MeetingParticipant[] }) => {
        setParticipants(p);
        const selfId = currentUserIdRef.current;
        p.forEach((participant) => {
          if (participant.userId !== selfId) {
            initPeerConnection(participant.userId);
          }
        });
      }
    );

    socket.on(
      "participant-joined",
      ({ participants: p }: { participants: MeetingParticipant[] }) => {
        setParticipants(p);
        const selfId = currentUserIdRef.current;
        p.forEach((participant) => {
          if (
            participant.userId !== selfId &&
            !peerConnectionsRef.current[participant.userId]
          ) {
            initPeerConnection(participant.userId);
          }
        });
      }
    );

    socket.on(
      "participant-left",
      ({
        userId,
        participants: p,
      }: {
        userId: number;
        participants: MeetingParticipant[];
      }) => {
        setParticipants(p);
        const pc = peerConnectionsRef.current[userId];
        if (pc) {
          pc.close();
          delete peerConnectionsRef.current[userId];
        }
        setRemoteStreams((prev) => {
          const { [userId]: _, ...rest } = prev;
          return rest;
        });
      }
    );

    socket.on(
      "participant-mic-changed",
      ({ userId, isMicOn }: { userId: number; isMicOn: boolean }) => {
        setParticipantStates((prev) => ({
          ...prev,
          [userId]: {
            ...(prev[userId] || { isCameraOn: true, isScreenSharing: false }),
            isMicOn,
          },
        }));
      }
    );

    socket.on(
      "participant-camera-changed",
      ({ userId, isCameraOn }: { userId: number; isCameraOn: boolean }) => {
        setParticipantStates((prev) => ({
          ...prev,
          [userId]: {
            ...(prev[userId] || { isMicOn: true, isScreenSharing: false }),
            isCameraOn,
          },
        }));
      }
    );

    socket.on(
      "participant-screen-share-changed",
      ({
        userId,
        isScreenSharing,
      }: {
        userId: number;
        isScreenSharing: boolean;
      }) => {
        setParticipantStates((prev) => ({
          ...prev,
          [userId]: {
            ...(prev[userId] || { isMicOn: true, isCameraOn: true }),
            isScreenSharing,
          },
        }));
      }
    );

    // ─── WebRTC signalling handlers ───────────────────────────────────────
    socket.on(
      "webrtc-offer",
      async ({
        userId,
        offer,
      }: {
        userId: number;
        offer: RTCSessionDescriptionInit;
      }) => {
        const pc = getOrCreatePeerConnection(userId);

        // Guard against unexpected state
        if (
          pc.signalingState !== "stable" &&
          pc.signalingState !== "have-local-offer"
        ) {
          console.warn(
            "Unexpected signalingState when receiving offer:",
            pc.signalingState
          );
        }

        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        socket.emit("webrtc-answer", {
          meetingId: meetingIdRef.current,
          targetUserId: userId,
          answer,
        });
      }
    );

    socket.on(
      "webrtc-answer",
      async ({
        userId,
        answer,
      }: {
        userId: number;
        answer: RTCSessionDescriptionInit;
      }) => {
        const pc = peerConnectionsRef.current[userId];
        if (pc && pc.signalingState === "have-local-offer") {
          await pc.setRemoteDescription(new RTCSessionDescription(answer));
        }
      }
    );

    socket.on(
      "webrtc-ice-candidate",
      async ({
        userId,
        candidate,
      }: {
        userId: number;
        candidate: RTCIceCandidateInit;
      }) => {
        const pc = peerConnectionsRef.current[userId];
        if (pc) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
          } catch (err) {
            console.warn("Failed to add ICE candidate:", err);
          }
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
      Object.values(peerConnectionsRef.current).forEach((pc) => pc.close());
      peerConnectionsRef.current = {};
      localStreamRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Join / leave room when meetingId changes ─────────────────────────────
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !isConnected) return;

    if (meetingId) {
      socket.emit("join-meeting", { meetingId });
      setMeetingEnded(false);
      setMessages([]);
    }

    return () => {
      if (meetingId) {
        socket.emit("leave-meeting", { meetingId });
      }
      Object.values(peerConnectionsRef.current).forEach((pc) => pc.close());
      peerConnectionsRef.current = {};
      setRemoteStreams({});
    };
  }, [meetingId, isConnected]);

  // ─── Called once we have the local MediaStream ────────────────────────────
  const initLocalStream = useCallback(
    (stream: MediaStream) => {
      localStreamRef.current = stream;

      // Add tracks to every existing peer connection & renegotiate
      Object.entries(peerConnectionsRef.current).forEach(
        ([userIdStr, pc]) => {
          const targetUserId = Number(userIdStr);

          stream.getTracks().forEach((track) => {
            const senders = pc.getSenders();
            const existing = senders.find(
              (s) => s.track?.kind === track.kind
            );
            if (!existing) {
              pc.addTrack(track, stream);
            }
          });

          // ✅ Renegotiate after adding tracks so the remote side gets media
          const selfId = currentUserIdRef.current;
          if (selfId !== null && selfId < targetUserId) {
            pc.createOffer()
              .then((offer) => pc.setLocalDescription(offer))
              .then(() => {
                socketRef.current?.emit("webrtc-offer", {
                  meetingId: meetingIdRef.current,
                  targetUserId,
                  offer: pc.localDescription,
                });
              })
              .catch((err) =>
                console.error("Error renegotiating after stream init:", err)
              );
          }
        }
      );

      // Create connections for any participants not yet connected
      const selfId = currentUserIdRef.current;
      // Access participants via closure isn't reliable here — 
      // new participants will trigger initPeerConnection via socket events.
      // Existing ones at the time of join were handled in "meeting-state".
    },
    [initPeerConnection]
  );

  // ─── Replace video track (camera ↔ screen share) ─────────────────────────
  const replaceVideoTrack = useCallback(
    (newTrack: MediaStreamTrack | null) => {
      if (!newTrack) return;
      Object.values(peerConnectionsRef.current).forEach((pc) => {
        const sender = pc
          .getSenders()
          .find((s) => s.track?.kind === "video");
        if (sender) {
          sender.replaceTrack(newTrack).catch((err) => {
            console.error("Error replacing video track:", err);
          });
        }
      });
    },
    []
  );

  // ─── Signalling helpers ───────────────────────────────────────────────────
  const toggleMic = useCallback(
    (isMicOn: boolean) => {
      if (!socketRef.current || !meetingIdRef.current) return;
      socketRef.current.emit("toggle-mic", {
        meetingId: meetingIdRef.current,
        isMicOn,
      });
    },
    []
  );

  const toggleCamera = useCallback(
    (isCameraOn: boolean) => {
      if (!socketRef.current || !meetingIdRef.current) return;
      socketRef.current.emit("toggle-camera", {
        meetingId: meetingIdRef.current,
        isCameraOn,
      });
    },
    []
  );

  const toggleScreenShare = useCallback(
    (isScreenSharing: boolean) => {
      if (!socketRef.current || !meetingIdRef.current) return;
      socketRef.current.emit("screen-share", {
        meetingId: meetingIdRef.current,
        isScreenSharing,
      });
    },
    []
  );

  const sendChatMessage = useCallback(
    (content: string) => {
      if (!socketRef.current || !meetingIdRef.current) return;
      socketRef.current.emit("meeting-chat", {
        meetingId: meetingIdRef.current,
        content,
      });
    },
    []
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