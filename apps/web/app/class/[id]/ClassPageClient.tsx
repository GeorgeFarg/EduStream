"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { io, Socket } from "socket.io-client";
import Modal from "@/components/Cardsmodel";
import PostContent from "./PostContent";
import ClassBanner from "./classbanner";
import { Announcement_return } from "@/types/announcments";
import {
  BookOpen,
  FolderOpen,
  ListTodo,
  Megaphone,
  MessageCircle,
  PencilLine,
  Radio,
  Video,
} from "lucide-react";
import AnnouncementBox from "@/components/class/AnnouncementBox";
import ClassChat from "@/components/class/ClassChat";
import ClassMeeting from "@/components/class/ClassMeeting";
import { apiBaseUrl } from "@/config/env";

type TabType = "stream" | "chat" | "classwork" | "people" | "materials" | "meeting";

interface MeetingInfo {
  id: number;
  title: string;
  isActive: boolean;
  participants?: { id: number; user: { name: string } }[];
}

const TABS: { key: TabType; label: string; icon: ReactNode }[] = [
  { key: "stream", label: "Stream", icon: <Megaphone size={16} /> },
  { key: "meeting", label: "Meeting", icon: <Video size={16} /> },
  { key: "classwork", label: "Classwork", icon: <ListTodo size={16} /> },
  { key: "materials", label: "Materials", icon: <FolderOpen size={16} /> },
  { key: "people", label: "People", icon: <BookOpen size={16} /> },
  { key: "chat", label: "Chat", icon: <MessageCircle size={16} /> },
];

const EmptyTab = ({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) => (
  <div className="flex h-full items-center justify-center px-4 text-white/40">
    <div className="w-full max-w-sm rounded-lg border border-white/10 bg-white/[0.03] p-8 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-white/5 text-white/25">
        {icon}
      </div>
      <p className="text-sm font-medium text-white/70">{title}</p>
      <p className="mt-1 text-xs text-white/35">{description}</p>
    </div>
  </div>
);

export default function ClassPage({
  initialAnnouncements,
  classId,
  className,
}: {
  initialAnnouncements: Announcement_return;
  classId: string;
  className?: string;
}) {
  const [announcements] = useState<Announcement_return>(initialAnnouncements);
  const [isPostOpen, setIsPostOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("stream");
  const [activeMeeting, setActiveMeeting] = useState<MeetingInfo | null>(null);
  const [isTeacher, setIsTeacher] = useState(false);

  useEffect(() => {
    setIsTeacher(initialAnnouncements.memperShip?.isTeacher || false);
  }, [initialAnnouncements]);

  const fetchActiveMeeting = useCallback(async () => {
    try {
      const res = await fetch(`${apiBaseUrl}/api/classes/${classId}/meetings/active`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setActiveMeeting(data.meeting || null);
      }
    } catch {
      // Keep the stream usable if the meeting endpoint is temporarily unavailable.
    }
  }, [classId]);

  useEffect(() => {
    fetchActiveMeeting();
    const interval = setInterval(fetchActiveMeeting, 10000);
    return () => clearInterval(interval);
  }, [fetchActiveMeeting]);

  useEffect(() => {
    if (!apiBaseUrl) return;

    const socket: Socket = io(apiBaseUrl, {
      withCredentials: true,
      transports: ["websocket", "polling"],
    });

    socket.on("meeting-created", ({ classId: evtClassId, meeting }: { classId: number; meeting: MeetingInfo }) => {
      if (String(evtClassId) === classId) setActiveMeeting(meeting);
    });

    socket.on("meeting-ended-global", ({ classId: evtClassId }: { classId: number; meetingId: number }) => {
      if (String(evtClassId) === classId) setActiveMeeting(null);
    });

    return () => {
      socket.disconnect();
    };
  }, [classId]);

  const announcementCount = announcements.announcements?.length || 0;

  return (
    <div className="flex h-dvh flex-col bg-[#080b10] text-white">
      <div className="shrink-0">
        <ClassBanner className={className} />
      </div>

      <div className="shrink-0 border-b border-white/10 bg-[#0b1118]/95 px-3 backdrop-blur md:px-6">
        <div className="mx-auto flex max-w-6xl gap-1 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex min-h-12 items-center gap-2 border-b-2 px-3 text-xs font-medium transition-all sm:px-4 sm:text-sm ${
                activeTab === tab.key
                  ? "border-sky-400 text-sky-300"
                  : "border-transparent text-white/45 hover:bg-white/5 hover:text-white/80"
              }`}
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        {activeTab === "stream" && (
          <div className="h-full overflow-y-auto px-4 py-5 md:px-6">
            <div className="mx-auto grid max-w-6xl gap-5 lg:grid-cols-[minmax(0,1fr)_18rem]">
              <main className="min-w-0">
                <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-white">Class Stream</h2>
                    <p className="text-sm text-white/45">
                      {announcementCount} {announcementCount === 1 ? "announcement" : "announcements"} posted
                    </p>
                  </div>
                  {isTeacher && (
                    <button
                      onClick={() => setIsPostOpen(true)}
                      aria-label="Create new announcement"
                      className="inline-flex items-center justify-center gap-2 rounded-md bg-sky-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-sky-400"
                    >
                      <PencilLine size={15} />
                      <span>New Announcement</span>
                    </button>
                  )}
                </div>

                <div className="space-y-4">
                  {announcements.announcements?.map((announcement) => (
                    <AnnouncementBox key={announcement.id} announcement={announcement} />
                  ))}

                  {announcementCount === 0 && (
                    <div className="rounded-lg border border-white/10 bg-white/[0.03] py-12 text-center text-white/35">
                      <Megaphone size={40} className="mx-auto mb-3 text-white/15" />
                      <p className="text-sm">No announcements yet</p>
                    </div>
                  )}
                </div>
              </main>

              <aside className="space-y-4">
                {activeMeeting && (
                  <div className="rounded-lg border border-red-400/30 bg-red-500/10 p-4">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/20">
                          <Radio size={18} className="text-red-400" />
                        </div>
                        <span className="absolute -right-0.5 -top-0.5 h-3 w-3 animate-pulse rounded-full border-2 border-[#10151d] bg-red-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-white">{activeMeeting.title}</p>
                        <p className="text-xs text-red-400/80">
                          Live - {activeMeeting.participants?.length || 0} in meeting
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setActiveTab("meeting")}
                      className="mt-4 flex w-full items-center justify-center gap-2 rounded-md bg-red-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-400"
                    >
                      <Video size={14} />
                      Join Now
                    </button>
                  </div>
                )}

                {isTeacher && !activeMeeting && (
                  <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-400/15">
                        <Video size={18} className="text-sky-300" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">Start a Live Meeting</p>
                        <p className="text-xs text-white/40">Begin a video class for your students</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setActiveTab("meeting")}
                      className="mt-4 flex w-full items-center justify-center gap-2 rounded-md bg-sky-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-sky-400"
                    >
                      <Video size={14} />
                      Start Meeting
                    </button>
                  </div>
                )}

                <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
                  <p className="text-sm font-medium text-white">Workspace</p>
                  <div className="mt-4 space-y-3 text-sm text-white/55">
                    <div className="flex items-center justify-between">
                      <span>Announcements</span>
                      <span className="rounded-md bg-white/5 px-2 py-1 text-xs text-white/70">
                        {announcementCount}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Role</span>
                      <span className="rounded-md bg-white/5 px-2 py-1 text-xs text-white/70">
                        {isTeacher ? "Teacher" : "Student"}
                      </span>
                    </div>
                  </div>
                </div>
              </aside>
            </div>
          </div>
        )}

        {activeTab === "chat" && (
          <div className="h-full p-3 md:p-5">
            <ClassChat classId={classId} className={className} />
          </div>
        )}

        {activeTab === "classwork" && (
          <EmptyTab
            icon={<ListTodo size={24} />}
            title="Classwork coming soon"
            description="Assignments will appear here once they are connected to this class."
          />
        )}

        {activeTab === "materials" && (
          <EmptyTab
            icon={<FolderOpen size={24} />}
            title="Materials coming soon"
            description="Files, links, and class resources will be sorted here."
          />
        )}

        {activeTab === "people" && (
          <EmptyTab
            icon={<BookOpen size={24} />}
            title="People coming soon"
            description="Teachers and students will be listed in a clean roster view."
          />
        )}

        {activeTab === "meeting" && (
          <div className="h-full">
            <ClassMeeting classId={classId} />
          </div>
        )}
      </div>

      <Modal isOpen={isPostOpen} onClose={() => setIsPostOpen(false)} title="New Announcement">
        <PostContent classId={classId} />
      </Modal>
    </div>
  );
}
