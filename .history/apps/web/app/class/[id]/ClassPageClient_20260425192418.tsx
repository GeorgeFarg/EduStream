"use client";
import { useState } from "react";
import Modal from "@/components/Cardsmodel";
import PostContent from "./PostContent";
import ClassBanner from "./classbanner";
import { Announcement_return } from "@/types/announcments";
import { PencilLine, MessageCircle, Megaphone, BookOpen, ListTodo, FolderOpen } from "lucide-react";
import AnnouncementBox from "@/components/class/AnnouncementBox";
import ClassChat from "@/components/class/ClassChat";
import ClassMeeting from "@/components/class/ClassMeeting";

type TabType = "stream" | "chat" | "classwork" | "people" | "materials" | "meeting";

export default function ClassPage({ initialAnnouncements, classId, className }: { initialAnnouncements: Announcement_return, classId: string, className?: string }) {
  const [announcements, setAnnouncements] = useState<Announcement_return>(initialAnnouncements);
  const [isPostOpen, setIsPostOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("stream");

  const openModal = () => setIsPostOpen(true);
  const closeModal = () => setIsPostOpen(false);

  const tabs: { key: TabType; label: string; icon: React.ReactNode }[] = [
    { key: "stream", label: "Stream", icon: <Megaphone size={16} /> },
    { key: "classwork", label: "Classwork", icon: <ListTodo size={16} /> },
    { key: "materials", label: "Materials", icon: <FolderOpen size={16} /> },
    { key: "people", label: "People", icon: <BookOpen size={16} /> },
    { key: "chat", label: "Chat", icon: <MessageCircle size={16} /> },
  ];

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      {/* Banner - fixed height */}
      <div className="shrink-0">
        <ClassBanner />
      </div>

      {/* Tabs Navigation */}
      <div className="shrink-0 px-4 md:px-6 border-b border-white/10 bg-[#0a0a0a]/40">
        <div className="flex gap-1 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-medium border-b-2 transition-all whitespace-nowrap ${
                activeTab === tab.key
                  ? "border-[#0d7ff2] text-[#0d7ff2]"
                  : "border-transparent text-white/50 hover:text-white/80 hover:bg-white/5"
              }`}
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden">
        {/* STREAM TAB */}
        {activeTab === "stream" && (
          <div className="h-full overflow-y-auto p-4 md:p-6">
            <div className="max-w-3xl mx-auto">
              <div className="flex justify-end mb-6">
                {announcements.memperShip?.isTeacher && (
                  <button
                    onClick={openModal}
                    aria-label="Create new announcement"
                    className="flex items-center gap-2 bg-[#0d7ff2]/20 hover:bg-[#0d7ff2]/30 text-[#0d7ff2] px-4 py-2 md:px-5 md:py-2.5 rounded-full transition-all text-sm font-medium"
                  >
                    <span>New Announcement</span>
                    <PencilLine size={15} />
                  </button>
                )}
              </div>

              <div className="space-y-4">
                {announcements.announcements?.map((announcement) => (
                  <AnnouncementBox key={announcement.id} announcement={announcement} />
                ))}
                {(!announcements.announcements || announcements.announcements.length === 0) && (
                  <div className="text-center text-white/30 py-12">
                    <Megaphone size={40} className="mx-auto mb-3 text-white/10" />
                    <p className="text-sm">No announcements yet</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* CHAT TAB - Full Size */}
        {activeTab === "chat" && (
          <div className="h-full p-2 md:p-4">
            <ClassChat classId={classId} className={className} />
          </div>
        )}

        {/* CLASSWORK TAB */}
        {activeTab === "classwork" && (
          <div className="h-full flex items-center justify-center text-white/30">
            <div className="text-center">
              <ListTodo size={48} className="mx-auto mb-3 text-white/10" />
              <p className="text-sm">Classwork coming soon...</p>
            </div>
          </div>
        )}

        {/* MATERIALS TAB */}
        {activeTab === "materials" && (
          <div className="h-full flex items-center justify-center text-white/30">
            <div className="text-center">
              <FolderOpen size={48} className="mx-auto mb-3 text-white/10" />
              <p className="text-sm">Materials coming soon...</p>
            </div>
          </div>
        )}

        {/* PEOPLE TAB */}
        {activeTab === "people" && (
          <div className="h-full flex items-center justify-center text-white/30">
            <div className="text-center">
              <BookOpen size={48} className="mx-auto mb-3 text-white/10" />
              <p className="text-sm">People coming soon...</p>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      <Modal isOpen={isPostOpen} onClose={closeModal} title="New Announcement">
        <PostContent classId={classId} />
      </Modal>
    </div>
  );
}

