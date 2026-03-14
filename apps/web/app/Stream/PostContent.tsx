"use client";
import { useState, useRef } from "react";
import { FiBold, FiItalic, FiUnderline, FiList, FiLink, FiYoutube, FiUpload, FiX } from "react-icons/fi";
import { SiGoogledrive } from "react-icons/si";

interface PostContentProps {
  onClose: () => void;
}

const PostContent = ({ onClose }: PostContentProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkUrl, setLinkUrl] = useState("https://");
  const [showYoutubeModal, setShowYoutubeModal] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Execute formatting commands
  const execCommand = (command: string, value: string = "") => {
    document.execCommand(command, false, value);
  };

  // Add link from modal
  const addLinkFromModal = () => {
    if (linkUrl && linkUrl !== "https://") {
      execCommand("createLink", linkUrl);
      setShowLinkModal(false);
      setLinkUrl("https://");
    }
  };

  // Add YouTube video
  const addYoutubeVideo = () => {
    if (!youtubeUrl) return;

    // Extract video ID from URL
    let videoId = "";
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /youtube\.com\/shorts\/([^&\n?#]+)/
    ];
    for (const pattern of patterns) {
      const match = youtubeUrl.match(pattern);
      if (match && typeof match[1] === 'string') {
        videoId = match[1];
        break;
      }
    }

    if (!videoId) return;

    const iframe = `<div class="youtube-container my-4" style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; max-width: 100%; background: #000; border-radius: 12px;">
      <iframe 
        src="https://www.youtube.com/embed/${videoId}" 
        style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: 0;" 
        allowfullscreen
        loading="lazy"
      ></iframe>
    </div>`;

    document.execCommand('insertHTML', false, iframe);
    setShowYoutubeModal(false);
    setYoutubeUrl("");
  };

  return (
    <div className="flex flex-col gap-6 w-full animate-in fade-in duration-500">
      {/* Link Modal */}
      {showLinkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setShowLinkModal(false)}
          />

          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 mx-4">
            <h3 className="text-xl font-semibold text-zinc-800 mb-4 text-center">
              Add Link
            </h3>

            <input
              type="url"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https://example.com"
              className="w-full px-4 py-3 border border-zinc-200 rounded-xl mb-6 focus:outline-none focus:ring-2 focus:ring-[#1a73e8] focus:border-transparent text-left"
              dir="ltr"
              autoFocus
            />

            <div className="flex gap-3">
              <button
                onClick={() => setShowLinkModal(false)}
                className="flex-1 px-4 py-2.5 border border-zinc-200 rounded-xl text-zinc-600 hover:bg-zinc-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={addLinkFromModal}
                className="flex-1 px-4 py-2.5 bg-[#1a73e8] text-white rounded-xl hover:bg-[#1557b0] transition-colors font-medium"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}

      {/* YouTube Modal */}
      {showYoutubeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setShowYoutubeModal(false)}
          />

          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 mx-4">
            <h3 className="text-xl font-semibold text-zinc-800 mb-4 text-center">
              Add YouTube Video
            </h3>

            <input
              type="url"
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              placeholder="https://youtube.com/watch?v=..."
              className="w-full px-4 py-3 border border-zinc-200 rounded-xl mb-2 focus:outline-none focus:ring-2 focus:ring-[#1a73e8] focus:border-transparent text-left"
              dir="ltr"
              autoFocus
            />

            <p className="text-xs text-zinc-500 mb-6 text-right">
              Example: https://youtube.com/watch?v=abcd1234
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowYoutubeModal(false)}
                className="flex-1 px-4 py-2.5 border border-zinc-200 rounded-xl text-zinc-600 hover:bg-zinc-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={addYoutubeVideo}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-medium"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Editor Area */}
      <div className="bg-[#f8f9fa] rounded-xl border border-transparent transition-all overflow-hidden shadow-[0_1px_2px_0_rgba(60,64,67,0.3)] focus-within:shadow-[0_1px_3px_1px_rgba(60,64,67,0.15)] focus-within:bg-white">
        <div
          ref={editorRef}
          contentEditable
          className="w-full min-h-[200px] p-6 outline-none text-right text-zinc-700 text-lg overflow-y-auto 
                     [&_ul]:list-disc [&_ul]:list-inside [&_ol]:list-decimal [&_ol]:list-inside
                     [&_a]:text-blue-600 [&_a]:underline
                     [&_.youtube-container]:my-4 [&_.youtube-container]:rounded-xl [&_iframe]:rounded-xl"
          dir="rtl"
          spellCheck="false"
          data-placeholder="Write your announcement here..."
        ></div>

        {/* Formatting Toolbar */}
        <div className="flex flex-row-reverse items-center gap-1 p-2 border-t border-zinc-200 bg-white/50 flex-wrap">
          <button
            type="button"
            onClick={() => execCommand("bold")}
            className="p-2 hover:bg-zinc-200 rounded text-zinc-500 transition-colors"
            title="Bold"
          >
            <FiBold size={20} />
          </button>

          <button
            type="button"
            onClick={() => execCommand("italic")}
            className="p-2 hover:bg-zinc-200 rounded text-zinc-500 transition-colors"
            title="Italic"
          >
            <FiItalic size={20} />
          </button>

          <button
            type="button"
            onClick={() => execCommand("underline")}
            className="p-2 hover:bg-zinc-200 rounded text-zinc-500 transition-colors"
            title="Underline"
          >
            <FiUnderline size={20} />
          </button>

          <button
            type="button"
            onClick={() => execCommand("insertUnorderedList")}
            className="p-2 hover:bg-zinc-200 rounded text-zinc-500 transition-colors"
            title="Bullet List"
          >
            <FiList size={20} />
          </button>

          <div className="h-6 w-[1px] bg-zinc-300 mx-2"></div>

          <button
            type="button"
            onClick={() => execCommand("removeFormat")}
            className="px-3 py-1 hover:bg-zinc-200 rounded text-zinc-500 text-sm font-medium"
          >
            Clear Format
          </button>
        </div>
      </div>

      {/* Attachments and Action Buttons */}
      <div className="flex flex-row-reverse items-center justify-between flex-wrap gap-4">
        <div className="flex flex-row-reverse gap-3 flex-wrap">
          {/* Google Drive Button  */}
          <button
            type="button"
            onClick={() => window.open('https://drive.google.com', '_blank')}
            className="w-11 h-11 flex items-center justify-center border border-zinc-200 rounded-full hover:bg-zinc-50 text-zinc-600 shadow-sm"
            title="Google Drive"
          >
            <SiGoogledrive size={18} />
          </button>

          {/* YouTube Button */}
          <button
            type="button"
            onClick={() => setShowYoutubeModal(true)}
            className="w-11 h-11 flex items-center justify-center border border-zinc-200 rounded-full hover:bg-zinc-50 text-zinc-600 shadow-sm"
            title="YouTube"
          >
            <FiYoutube size={20} />
          </button>

          {/* File Upload Button */}
          <div className="relative">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className={`w-11 h-11 flex items-center justify-center border rounded-full transition-all shadow-sm ${selectedFile ? 'bg-blue-50 border-blue-200 text-blue-600' : 'border-zinc-200 text-zinc-600 hover:bg-zinc-50'
                }`}
              title="Attach File"
            >
              <FiUpload size={20} />
            </button>

            {selectedFile && (
              <div className="absolute top-full mt-2 left-0 bg-blue-50 text-blue-700 text-xs px-3 py-1.5 rounded-full flex items-center gap-2 whitespace-nowrap">
                <span className="max-w-[150px] truncate">{selectedFile.name}</span>
                <button
                  onClick={() => setSelectedFile(null)}
                  className="hover:text-red-600 transition-colors"
                >
                  <FiX size={14} />
                </button>
              </div>
            )}
          </div>

          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file && file.size <= 5 * 1024 * 1024) {
                setSelectedFile(file);
              }
            }}
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.ppt,.pptx"
          />

          {/* Link Button */}
          <button
            type="button"
            onClick={() => setShowLinkModal(true)}
            className="w-11 h-11 flex items-center justify-center border border-zinc-200 rounded-full hover:bg-zinc-50 text-zinc-600 shadow-sm"
            title="Add Link"
          >
            <FiLink size={20} />
          </button>
        </div>

        {/* Share Button*/}
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="px-10 py-2.5 rounded-full font-medium bg-[#1a73e8] text-white shadow-md hover:shadow-lg transition-all cursor-default opacity-80"
          >
            Share
          </button>
        </div>
      </div>
    </div>
  );
};

export default PostContent;