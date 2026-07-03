"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send } from "lucide-react";
import type { StreamAuthor } from "@/components/stream/types";

interface PostFormProps {
  currentUser?: StreamAuthor;
  onSubmit?: (content: string, title?: string) => void;
  submitting?: boolean;
}

export function PostForm({ currentUser, onSubmit, submitting }: PostFormProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const handleSubmit = () => {
    if (content.trim()) {
      onSubmit?.(content, title);
      setTitle("");
      setContent("");
    }
  };

  return (
    <div className="bg-card border border-border rounded-lg p-6 space-y-4 mb-6">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center flex-shrink-0 text-white font-semibold">
          {currentUser?.avatar ?? "?"}
        </div>
        <div className="flex-1 space-y-3">
          <input
            className="w-full px-3 py-2 rounded-md border border-border bg-input text-sm"
            placeholder="Announcement title..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <Textarea
            placeholder="Share an announcement with your class..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-20 bg-input border-border resize-none"
          />
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
        <Button
          size="sm"
          className="gap-2"
          onClick={handleSubmit}
          disabled={!content.trim() || submitting}
        >
          <Send className="w-4 h-4" />
          {submitting ? "Posting..." : "Post"}
        </Button>
      </div>
    </div>
  );
}
