"use client";
import { useState } from "react";
import Modal from "@/components/Cardsmodel";
import PostContent from "./PostContent";
import ClassBanner from "./classbanner";

export default function StreamPage() {
  const [isPostOpen, setIsPostOpen] = useState(false);

  const openModal = () => setIsPostOpen(true);
  const closeModal = () => setIsPostOpen(false);

  return (
    <div className="p-4 md:p-10 max-w-5xl mx-auto flex flex-col gap-6">
      
      <ClassBanner />

      <div className="flex justify-end">
        <button
          onClick={openModal}
          aria-label="Create new announcement"
          className="flex items-center gap-3 bg-[#e3f2fd] hover:bg-[#d1e9ff] text-[#1a73e8] px-4 py-2 md:px-6 md:py-3 rounded-full shadow-md transition-all duration-300 hover:shadow-lg font-medium text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-[#1a73e8] focus:ring-offset-2"
        >
          <span>New Announcement</span>
          <svg 
            className="w-5 h-5" 
            fill="currentColor" 
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
          </svg>
        </button>
      </div>

      <Modal
        isOpen={isPostOpen}
        onClose={closeModal}
        title="New Announcement"  >
        <PostContent onClose={closeModal} />
      </Modal>
    </div>
  );
}