"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Home() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [roomId, setRoomId] = useState("");
  const [loading, setLoading] = useState(false);

  // Function to create a new meeting
  const createMeeting = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/rooms", {
        method: "POST",
      });

      if (!res.ok) {
        throw new Error("Failed to create room");
      }

      const data = await res.json();
      router.push(`/meeting?room=${data.roomId}&name=${name || "Guest"}`);
    } catch (error) {
      console.error("Error creating meeting:", error);
      alert("Could not create meeting. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Function to join an existing meeting
  const joinMeeting = () => {
    if (!roomId.trim()) {
      alert("Please enter a Room ID");
      return;
    }
    router.push(`/meeting?room=${roomId}&name=${name || "Guest"}`);
  };

  return (
    <div style={{ padding: 40, maxWidth: 400, margin: "0 auto" }}>
      <h1>NexMeet</h1>

      <input
        type="text"
        placeholder="Your Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        style={{ width: "100%", padding: "8px", marginBottom: "16px" }}
      />

      <button
        onClick={createMeeting}
        style={{ width: "100%", padding: "10px", marginBottom: "24px" }}
        disabled={loading}
      >
        {loading ? "Creating..." : "New Meeting"}
      </button>

      <input
        type="text"
        placeholder="Room ID"
        value={roomId}
        onChange={(e) => setRoomId(e.target.value)}
        style={{ width: "100%", padding: "8px", marginBottom: "8px" }}
      />

      <button
        onClick={joinMeeting}
        style={{ width: "100%", padding: "10px" }}
      >
        Join Meeting
      </button>
    </div>
  );
}