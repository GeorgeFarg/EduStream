"use client";
import Input from "@/components/ui/Input";
import axiosClient from "@/util/axiosClient";
import axios from "axios";
import dynamic from "next/dynamic";
import { useState } from "react";
import toast from "react-hot-toast";

import 'react-quill-new/dist/quill.snow.css';
interface PostContentProps {
  classId: string
}

const ReactQuill = dynamic(() => import('react-quill-new'), {
  ssr: false,
  loading: () => <div className="h-36 w-full bg-gray-100 animate-pulse rounded-md" />
});

const PostContent = ({ classId }: PostContentProps) => {
  const [content, setContent] = useState<{ content: string, title: string }>({
    content: "",
    title: ""
  });

  return (
    <div className="flex flex-col gap-6 w-full animate-in fade-in duration-500">
      {/* Link Modal */}
      <div>
        <label
          htmlFor="title"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Email Address
        </label>
        <Input
          // icon={<Mail className="h-5 w-5 text-slate-500 dark:text-slate-400" />}
          id='title'
          placeholder='title'
          type='text'
          maxLength={45}
          color="#050505"
          borderColor="#959595"
          onChange={(e) => {
            setContent(prev => ({
              ...prev,
              title: e.target.value
            }))
          }}
        />
      </div>
      <div className="ql-container">
        <ReactQuill
          theme="snow"
          value={content.content}
          onChange={(value) => setContent(prev => ({ ...prev, content: value }))}
          className="text-dark h-36"
          bounds={".ql-container"}
          modules={{
            toolbar: [
              [{ header: [1, 2, false] }],
              ["bold", "italic", "underline", "link"],
              [{ list: "ordered" }, { list: "bullet" }],
              ["clean"],
            ],
          }}
        />
      </div>

      {/* Share Button*/}
      <div className="flex items-center gap-3 mt-8">
        <button
          type="button"
          className="px-10 py-2.5 rounded-full font-medium bg-[#1a73e8] text-white shadow-md hover:shadow-lg transition-all cursor-default opacity-80"
          onClick={async () => {
            // const log = await axiosClient.get("/health")
            // console.log(log);

            const response = await axiosClient.post('/api/announcements', {
              title: content.title,
              content: content.content,
              classId: Number.parseInt(classId)
            })

            if (response?.data?.error) {
              // Show a toast like in the login page
              toast.error(response.data.error.message || "An error occurred while posting.");
            } else {
              toast.success("Announcement shared successfully!");
            }
          }}
        >
          Share
        </button>
      </div>
    </div>
  );
};

export default PostContent;