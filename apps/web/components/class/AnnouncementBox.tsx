import { Announcement } from "@/types/announcments";
import { ChevronDown, MessageCircle, Megaphone } from "lucide-react";
import React from "react";
import parse from "html-react-parser";

const AnnouncementBox = ({ announcement }: { announcement: Announcement }) => {
  const [commentsOpen, setCommentsOpen] = React.useState(false);
  const [comments, setComments] = React.useState<string[] | null>(null);
  const [loading, setLoading] = React.useState(false);

  const handleToggleComments = async () => {
    setCommentsOpen((open) => !open);

    if (!commentsOpen && comments === null) {
      setLoading(true);
      try {
        setTimeout(() => {
          setComments([
            "Great announcement!",
            "Thanks for the update.",
            "Is there a deadline for this?",
          ]);
          setLoading(false);
        }, 600);
      } catch {
        setComments([]);
        setLoading(false);
      }
    }
  };

  return (
    <article className="w-full rounded-lg border border-white/10 bg-[#101820] p-4 shadow-sm transition-colors hover:border-white/15 sm:p-5">
      <div className="mb-4 flex gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sky-400/15 text-sky-300">
          <Megaphone size={18} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
            <h3 className="truncate text-base font-semibold text-white">
              {announcement.title}
            </h3>
            <span className="shrink-0 text-xs text-white/35">
              {new Date(announcement.createdAt).toLocaleString(undefined, {
                year: "numeric",
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
        </div>
      </div>

      <div
        className="prose prose-invert prose-sm max-w-none overflow-x-auto whitespace-pre-line text-sm leading-6 text-white/70"
        style={{
          wordBreak: "break-word",
          overflowWrap: "break-word",
        }}
      >
        {parse(announcement.content)}
      </div>

      <div className="mt-5 border-t border-white/10 pt-3 text-sm">
        <button
          className="inline-flex items-center gap-2 rounded-md px-2 py-1 text-sm text-sky-300 transition-colors hover:bg-sky-400/10 focus:outline-none"
          onClick={handleToggleComments}
          aria-expanded={commentsOpen}
          type="button"
        >
          <MessageCircle size={14} />
          {commentsOpen ? "Hide comments" : "Show comments"}
          <ChevronDown
            size={14}
            className={`transition-transform ${commentsOpen ? "rotate-180" : ""}`}
          />
        </button>

        {commentsOpen && (
          <div className="mt-3 rounded-lg border border-white/10 bg-white/[0.03] p-3">
            {loading ? (
              <div className="text-xs text-white/35">Loading comments...</div>
            ) : comments && comments.length > 0 ? (
              <ul className="space-y-2">
                {comments.map((comment, idx) => (
                  <li
                    key={idx}
                    className="border-b border-white/10 pb-2 text-sm text-white/65 last:border-b-0 last:pb-0"
                  >
                    {comment}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-xs text-white/35">No comments yet.</div>
            )}
          </div>
        )}
      </div>
    </article>
  );
};

export default AnnouncementBox;
