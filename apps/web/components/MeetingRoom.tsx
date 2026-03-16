"use client";

import { useEffect, useRef, useState } from "react";
import { socket } from "@/lib/socket";

interface Props {
  roomId: string;
  name: string;
}

interface RemoteStream {
  id: string;
  stream: MediaStream;
  name: string;
}

export default function MeetingRoom({ roomId, name }: Props) {
  const localVideo = useRef<HTMLVideoElement>(null);
  const [remoteStreams, setRemoteStreams] = useState<RemoteStream[]>([]);

  useEffect(() => {
    let localStream: MediaStream;

    async function start() {
      // Get local media
      localStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      if (localVideo.current) {
        localVideo.current.srcObject = localStream;
      }

      // Connect to socket
      socket.connect();

      socket.on("connect", () => {
        socket.emit("join-room", {
          roomId,
          userName: name,
        });
      });

      // Listen for new users joining
      socket.on("user-joined", (data) => {
        console.log("user joined", data);
      });

      // Example: receiving remote streams
      socket.on("remote-stream", (data: { id: string; stream: MediaStream; name: string }) => {
        setRemoteStreams((prev) => [...prev, data]);
      });

      socket.on("offer", (data) => {
        console.log("offer", data);
      });
    }

    start();

    return () => {
      localStream?.getTracks().forEach((track) => track.stop());
      socket.disconnect();
    };
  }, [roomId, name]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        padding: 20,
        alignItems: "center",
        minHeight: "100vh",
        background: "#1E1E2F",
        color: "#fff",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <h2 style={{ marginBottom: 20 }}>Room: {roomId}</h2>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
          gap: 20,
          width: "100%",
          maxWidth: 1200,
        }}
      >
        {/* Local Video */}
        <div style={{ position: "relative" }}>
          <video
            ref={localVideo}
            autoPlay
            playsInline
            muted
            style={{
              width: "100%",
              borderRadius: 12,
              backgroundColor: "#000",
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: 8,
              left: 8,
              padding: "2px 6px",
              backgroundColor: "rgba(0,0,0,0.6)",
              borderRadius: 4,
              fontSize: 14,
            }}
          >
            {name} (You)
          </div>
        </div>

        {/* Remote Videos */}
        {remoteStreams.map((remote) => (
          <div key={remote.id} style={{ position: "relative" }}>
            <video
              autoPlay
              playsInline
              style={{
                width: "100%",
                borderRadius: 12,
                backgroundColor: "#000",
              }}
              ref={(el) => {
                if (el) el.srcObject = remote.stream;
              }}
            />
            <div
              style={{
                position: "absolute",
                bottom: 8,
                left: 8,
                padding: "2px 6px",
                backgroundColor: "rgba(0,0,0,0.6)",
                borderRadius: 4,
                fontSize: 14,
              }}
            >
              {remote.name}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}