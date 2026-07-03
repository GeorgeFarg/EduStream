"use client";
import { useState } from "react";
import Modal from "@/components/Cardsmodel";
import PostContent from "./PostContent";
import ClassBanner from "./classbanner";
import { Announcement_return } from "@/types/announcments";
import { PencilLine } from "lucide-react";
import AnnouncementBox from "@/components/class/AnnouncementBox";
import ClassChat from "@/components/class/ClassChat";
import parse from "html-react-parser"

export default function ClassPage({ initialAnnouncements, classId, className }: { initialAnnouncements: Announcement_return, classId: string, className?: string }) {
  const [announcements, setAnnouncements] = useState<Announcement_return>(initialAnnouncements);
  const [isPostOpen, setIsPostOpen] = useState(false);

  const openModal = () => setIsPostOpen(true);
  const closeModal = () => {
    setIsPostOpen(false);
  }

  return (
    <div className="md:p-10 p-6 max-w-5xl mx-auto flex flex-col gap-6">
      <ClassBanner />
      <div className="flex w-full gap-6 overflow-x-hidden">
        <div className="lg:block hidden w-80 h-[calc(100vh-12rem)] sticky top-4">
          <ClassChat classId={classId} className={className} />
        </div>
        <div className="flex flex-1 flex-col">
          <div className="flex justify-end">
            {announcements.memperShip.isTeacher && <button
              onClick={openModal}
              aria-label="Create new announcement"
              className="flex items-center gap-3 bg-[#e3f2fd] hover:bg-[#d1e9ff] text-[#1a73e8] px-4 py-1 md:px-6 md:py-3 rounded-full shadow-md transition-all duration-300 hover:shadow-lg font-medium text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-[#1a73e8] focus:ring-offset-2"
            >
              <span>New Announcement</span>
              <PencilLine width={17} />
            </button>}
          </div>

          <div className="w-auto mt-14 px-0">
            {announcements.announcements.map((announcement) => {
              return <AnnouncementBox key={announcement.id} announcement={announcement} />
            })}
          </div>
      </div>
      <Modal
        isOpen={isPostOpen}
        onClose={closeModal}
        title="New Announcement"  >
        <PostContent classId={classId} />
      </Modal>
    </div>
  );
}
