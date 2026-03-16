"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import VideoTile from "@/components/meeting/VideoTile";
import ControlBar from "@/components/meeting/ControlBar";
import ChatPanel from "@/components/meeting/ChatPanel";
import ScreenShareView from "@/components/meeting/ScreenShareView";

const SERVER_URL = "http://localhost:5000";

const ICE_SERVERS = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
  { urls: "stun:stun2.l.google.com:19302" },
];

export interface PeerInfo {
  socketId: string;
  name: string;
  pc: RTCPeerConnection;
  stream: MediaStream | null;
  videoEnabled: boolean;
  audioEnabled: boolean;
}

export interface ChatMessage {
  socketId: string;
  userName: string;
  message: string;
  timestamp: number;
}

interface MeetingRoomProps {
  roomId: string;
  userName: string;
  localStream: MediaStream;
  onLeave: () => void;
}

export default function MeetingRoom({ roomId, userName, localStream, onLeave }: MeetingRoomProps) {
  const socketRef = useRef<Socket | null>(null);
  const mySocketIdRef = useRef<string>("");
  const peersRef = useRef<Record<string, PeerInfo>>({});
  const screenStreamRef = useRef<MediaStream | null>(null);

  const [peers, setPeers] = useState<PeerInfo[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [isCamOff, setIsCamOff] = useState(false);
  const [isSharingScreen, setIsSharingScreen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [toast, setToast] = useState("");
  const [screenShareInfo, setScreenShareInfo] = useState<{ socketId: string; name: string; stream: MediaStream | null } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((msg: string, duration = 3000) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), duration);
  }, []);

  const syncPeers = () => {
    setPeers(Object.values(peersRef.current).map((p) => ({ ...p })));
  };

  const createPeerConnection = useCallback((remoteSocketId: string, remoteName: string): RTCPeerConnection => {
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

    localStream.getTracks().forEach((t) => pc.addTrack(t, localStream));

    pc.onicecandidate = ({ candidate }) => {
      if (candidate) {
        socketRef.current?.emit("ice-candidate", { targetSocketId: remoteSocketId, candidate });
      }
    };

    pc.ontrack = ({ streams }) => {
      const stream = streams[0];
      if (peersRef.current[remoteSocketId]) {
        peersRef.current[remoteSocketId].stream = stream;

        if (screenShareInfo?.socketId === remoteSocketId) {
          setScreenShareInfo((prev) => prev ? { ...prev, stream: stream || null } : null);
        }

        syncPeers();
      }
    };

    pc.oniceconnectionstatechange = () => {
      if (["disconnected", "failed", "closed"].includes(pc.iceConnectionState)) {
        handlePeerLeft(remoteSocketId);
      }
    };

    peersRef.current[remoteSocketId] = {
      socketId: remoteSocketId,
      name: remoteName,
      pc,
      stream: null,
      videoEnabled: true,
      audioEnabled: true,
    };

    syncPeers();
    return pc;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localStream]);

  const handlePeerLeft = useCallback((socketId: string) => {
    const p = peersRef.current[socketId];
    if (!p) return;
    p.pc.close();
    delete peersRef.current[socketId];
    syncPeers();
    showToast(`${p.name} left`);
    setScreenShareInfo((prev) => prev?.socketId === socketId ? null : prev);
  }, [showToast]);

  const callPeer = useCallback(async (remoteSocketId: string, remoteName: string) => {
    const pc = createPeerConnection(remoteSocketId, remoteName);
    const offer = await pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true });
    await pc.setLocalDescription(offer);
    socketRef.current?.emit("offer", { targetSocketId: remoteSocketId, offer, senderName: userName });
  }, [createPeerConnection, userName]);

  useEffect(() => {
    const socket = io(SERVER_URL, { transports: ["websocket", "polling"] });
    socketRef.current = socket;

    socket.on("connect", () => {
      console.log('Socket connected:', socket.id);
      mySocketIdRef.current = socket.id ?? "";
      socket.emit("join-room", { roomId, userName });
      showToast("Connected to meeting");
    });
    
    socket.on("connect_error", (err) => {
      console.error('Socket connect error:', err);
      showToast(`Connection failed: ${err.message}`);
    });
    
    socket.on("disconnect", (reason) => {
      console.log('Socket disconnect:', reason);
      showToast(`Disconnected: ${reason}`);
    });

    socket.on("room-joined", async ({ socketId, existingPeers }: { roomId: string; socketId: string; existingPeers: { socketId: string; userName: string }[] }) => {
      mySocketIdRef.current = socketId;
      for (const peer of existingPeers) {
        await callPeer(peer.socketId, peer.userName);
      }
      showToast(`Joined room ${roomId} 🎉`);
    });

    socket.on("user-joined", ({ socketId, userName: uName }: { socketId: string; userName: string }) => {
      // Create the peer entry immediately so when their offer arrives we're ready.
      // The joining peer will send us an offer; we just prepare our side here.
      if (!peersRef.current[socketId]) {
        peersRef.current[socketId] = {
          socketId,
          name: uName,
          pc: null as unknown as RTCPeerConnection, // will be replaced on offer
          stream: null,
          videoEnabled: true,
          audioEnabled: true,
        };
        syncPeers();
      }
      showToast(`${uName} joined`);
    });

    socket.on("offer", async ({ offer, senderSocketId, senderName }: { offer: RTCSessionDescriptionInit; senderSocketId: string; senderName: string }) => {
      // Always (re)create a fresh RTCPeerConnection for this offer.
      // If we already have a stub entry from user-joined, replace the pc.
      const existing = peersRef.current[senderSocketId];
      if (existing?.pc && existing.pc.signalingState !== "closed") {
        existing.pc.close();
      }
      createPeerConnection(senderSocketId, senderName);
      const pc = peersRef.current[senderSocketId].pc;
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit("answer", { targetSocketId: senderSocketId, answer });
    });

    socket.on("answer", async ({ answer, senderSocketId }: { answer: RTCSessionDescriptionInit; senderSocketId: string }) => {
      const p = peersRef.current[senderSocketId];
      if (p && p.pc.signalingState !== "stable") {
        await p.pc.setRemoteDescription(new RTCSessionDescription(answer));
      }
    });

    socket.on("ice-candidate", async ({ candidate, senderSocketId }: { candidate: RTCIceCandidateInit; senderSocketId: string }) => {
      const p = peersRef.current[senderSocketId];
      if (p) {
        try { await p.pc.addIceCandidate(new RTCIceCandidate(candidate)); } catch {}
      }
    });

    socket.on("user-left", ({ socketId }: { socketId: string }) => handlePeerLeft(socketId));

    socket.on("peer-media-state", ({ socketId, video, audio }: { socketId: string; video: boolean; audio: boolean }) => {
      if (peersRef.current[socketId]) {
        peersRef.current[socketId].videoEnabled = video;
        peersRef.current[socketId].audioEnabled = audio;
        syncPeers();
      }
    });

    socket.on("peer-screen-share-started", ({ socketId, userName: uName }: { socketId: string; userName: string }) => {
      showToast(`${uName} is sharing their screen`);
      setScreenShareInfo({ socketId, name: uName, stream: peersRef.current[socketId]?.stream ?? null });
    });

    socket.on("peer-screen-share-stopped", () => setScreenShareInfo(null));

    socket.on("chat-message", (msg: ChatMessage) => {
      // Skip if server echoes our own message back (we already added it locally)
      if (msg.socketId === mySocketIdRef.current) return;
      setChatMessages((prev) => [...prev, msg]);
      setChatOpen((open) => {
        if (!open) setUnreadCount((n) => n + 1);
        return open;
      });
    });

    return () => { socket.disconnect(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Controls
  const toggleMic = () => {
    const next = !isMuted;
    localStream.getAudioTracks().forEach((t) => { t.enabled = !next; });
    setIsMuted(next);
    socketRef.current?.emit("media-state", { roomId, video: !isCamOff, audio: !next });
  };

  const toggleCam = () => {
    const next = !isCamOff;
    localStream.getVideoTracks().forEach((t) => { t.enabled = !next; });
    setIsCamOff(next);
    socketRef.current?.emit("media-state", { roomId, video: !next, audio: !isMuted });
  };

  const startScreenShare = async () => {
    try {
      const ss = await navigator.mediaDevices.getDisplayMedia({ video: { cursor: "always" } as MediaTrackConstraints, audio: false });
      screenStreamRef.current = ss;
      setIsSharingScreen(true);
      setScreenShareInfo({ socketId: mySocketIdRef.current, name: userName + " (You)", stream: ss });
      showToast("Screen sharing started");

      const videoTrack = ss.getVideoTracks()[0!] || null;
      Object.values(peersRef.current).forEach(({ pc }) => {
        const sender = pc.getSenders().find((s) => s.track?.kind === "video");
        if (sender && videoTrack) sender.replaceTrack(videoTrack).catch(() => {});
      });

      socketRef.current?.emit("screen-share-started", { roomId });
      videoTrack.onended = stopScreenShare;
    } catch {
      showToast("Screen share cancelled or not supported");
    }
  };

  const stopScreenShare = () => {
    if (!isSharingScreen) return;
    setIsSharingScreen(false);
    screenStreamRef.current?.getTracks().forEach((t) => t.stop());
    screenStreamRef.current = null;
    setScreenShareInfo(null);

    const camTrack = localStream.getVideoTracks()[0] || null;
    if (camTrack) {
      Object.values(peersRef.current).forEach(({ pc }) => {
        const sender = pc.getSenders().find((s) => s.track?.kind === "video");
        if (sender) sender.replaceTrack(camTrack).catch(() => {});
      });
    }

    socketRef.current?.emit("screen-share-stopped", { roomId });
    showToast("Screen sharing stopped");
  };

  const handleLeave = () => {
    if (confirm("Leave meeting?")) {
      socketRef.current?.disconnect();
      Object.values(peersRef.current).forEach(({ pc }) => pc.close());
      screenStreamRef.current?.getTracks().forEach((t) => t.stop());
      onLeave();
    }
  };

  const sendChatMessage = (message: string) => {
    if (!socketRef.current || !message.trim()) return;
    // Add own message immediately so it shows up without waiting for echo
    const ownMsg: ChatMessage = {
      socketId: mySocketIdRef.current,
      userName,
      message,
      timestamp: Date.now(),
    };
    setChatMessages((prev) => [...prev, ownMsg]);
    socketRef.current.emit("chat-message", { roomId, message });
  };

  const copyRoomId = () => {
    navigator.clipboard.writeText(roomId).catch(() => {});
    showToast("Meeting ID copied! 📋");
  };

  const gridClass = (() => {
    const n = peers.length + 1; // +1 for local
    if (n === 1) return "grid-cols-1";
    if (n === 2) return "grid-cols-2";
    if (n <= 4) return "grid-cols-2";
    if (n <= 6) return "grid-cols-3";
    return "grid-cols-[repeat(auto-fit,minmax(160px,1fr))]";
  })();

  return (
    <div className="flex flex-col h-screen bg-[#080b10] text-[#f0f4ff] overflow-hidden font-['DM_Sans',sans-serif]">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-[rgba(8,11,16,0.9)] backdrop-blur-md border-b border-white/[0.07] z-30 shrink-0">
        <span className="font-['Syne'] text-[15px] font-bold">NexMeet</span>
        <button
          onClick={copyRoomId}
          className="font-['Syne'] text-[13px] font-bold tracking-widest text-blue-400 bg-blue-500/10 border border-blue-500/25 px-3 py-1.5 rounded-full cursor-pointer hover:bg-blue-500/20 transition-colors">
          {roomId}
        </button>
        <div className="flex items-center gap-1.5 text-[12px] text-slate-500">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
            <circle cx="9" cy="7" r="4" /><path d="M3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2" />
            <path d="M16 3.13a4 4 0 010 7.75M21 21v-2a4 4 0 00-3-3.87" />
          </svg>
          <span>{peers.length + 1}</span>
        </div>
      </div>

      {/* Video / Screen Share Area */}
      <div className="flex-1 relative overflow-hidden">
        {screenShareInfo ? (
          <ScreenShareView
            screenInfo={screenShareInfo}
            localStream={localStream}
            localName={userName}
            peers={peers}
          />
        ) : (
          <div className={`grid ${gridClass} gap-1 p-1 w-full h-full`}>
            {/* Local tile */}
            <VideoTile
              socketId={mySocketIdRef.current || "local"}
              name={userName}
              stream={localStream}
              isLocal
              isMuted={isMuted}
              isCamOff={isCamOff}
            />
            {/* Remote tiles */}
            {peers.map((p) => (
              <VideoTile
                key={p.socketId}
                socketId={p.socketId}
                name={p.name}
                stream={p.stream}
                isLocal={false}
                isMuted={!p.audioEnabled}
                isCamOff={!p.videoEnabled}
              />
            ))}
          </div>
        )}
      </div>

      {/* Controls */}
      <ControlBar
        isMuted={isMuted}
        isCamOff={isCamOff}
        isSharingScreen={isSharingScreen}
        unreadCount={unreadCount}
        onToggleMic={toggleMic}
        onToggleCam={toggleCam}
        onToggleShare={isSharingScreen ? stopScreenShare : startScreenShare}
        onToggleChat={() => {
          setChatOpen((o) => {
            if (!o) setUnreadCount(0);
            return !o;
          });
        }}
        onLeave={handleLeave}
      />

      {/* Chat Panel */}
      <ChatPanel
        isOpen={chatOpen}
        messages={chatMessages}
        mySocketId={mySocketIdRef.current}
        onClose={() => setChatOpen(false)}
        onSend={sendChatMessage}
      />

      {/* Toast */}
      {toast && (
        <div className="fixed top-[70px] left-1/2 -translate-x-1/2 bg-[#161d2a] border border-white/[0.07] rounded-[10px] px-[18px] py-2.5 text-[13px] text-[#f0f4ff] z-[999] whitespace-nowrap max-w-[90vw] overflow-hidden text-ellipsis pointer-events-none">
          {toast}
        </div>
      )}
    </div>
  );
}