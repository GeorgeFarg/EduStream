"use client";

import { useSearchParams } from "next/navigation";
import MeetingRoom from "@/components/MeetingRoom";

export default function MeetingPage() {
  const params = useSearchParams();

  const roomId = params.get("room");
  const name = params.get("name");

  if (!roomId) return <div>No room</div>;

  return <MeetingRoom roomId={roomId} name={name || "Guest"} />;
}