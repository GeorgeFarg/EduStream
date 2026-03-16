"use client";

import { useState } from "react";
import Lobby from "@/components/meeting/Lobby";
import MeetingRoom from "@/components/meeting/MeetingRoom";

export default function MeetingPage() {
  const [inMeeting, setInMeeting] = useState(false);
  const [meetingData, setMeetingData] = useState<{
    roomId: string;
    userName: string;
    localStream: MediaStream | null;
  } | null>(null);

  const handleEnterMeeting = (roomId: string, userName: string, localStream: MediaStream) => {
    setMeetingData({ roomId, userName, localStream });
    setInMeeting(true);
  };

  const handleLeaveMeeting = () => {
    meetingData?.localStream?.getTracks().forEach((t) => t.stop());
    setMeetingData(null);
    setInMeeting(false);
  };

  if (inMeeting && meetingData) {
    return (
      <MeetingRoom
        roomId={meetingData.roomId}
        userName={meetingData.userName}
        localStream={meetingData.localStream!}
        onLeave={handleLeaveMeeting}
      />
    );
  }

  return <Lobby onEnterMeeting={handleEnterMeeting} />;
}