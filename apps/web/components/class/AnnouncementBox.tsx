import { Announcement } from '@/types/announcments'
import React from 'react'

const AnnouncementBox = ({ announcement }: { announcement: Announcement }) => {        // Dropdown for comments
    const [commentsOpen, setCommentsOpen] = React.useState(false);

    // Placeholder for fetching comments - replace with actual API call
    const [comments, setComments] = React.useState<string[] | null>(null);
    const [loading, setLoading] = React.useState(false);

    const handleToggleComments = async () => {
        setCommentsOpen((open) => !open);

        // Fetch comments when opening the dropdown for the first time
        if (!commentsOpen && comments === null) {
            setLoading(true);
            try {
                // Simulated fetch, replace with real API call as needed
                // Example: fetch(`/api/announcement-comments?announcementId=${announcement.id}`)
                //   .then(res => res.json()).then(data => setComments(data.comments))
                setTimeout(() => {
                    setComments([
                        "Great announcement!",
                        "Thanks for the update.",
                        "Is there a deadline for this?"
                    ]);
                    setLoading(false);
                }, 600);
            } catch (e) {
                setComments([]);
                setLoading(false);
            }
        }
    };
    return (
        <div className="bg-white w-full rounded-lg shadow-md p-5 mb-4 border border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2">
                <h3 className="text-lg font-semibold text-gray-800">{announcement.title}</h3>
                <span className="text-xs text-gray-400 mt-1 sm:mt-0">
                    {new Date(announcement.createdAt).toLocaleString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    })}
                </span>
            </div>
            <div
                className="text-gray-700 whitespace-pre-line wrap-break-word w-full max-w-full text-sm overflow-x-auto"
                style={{
                    wordBreak: "break-word",
                    overflowWrap: "break-word",
                }}
            >
                {announcement.content}
            </div>
            {/* If you want to display teacher or class info, add here */}


            <div className="mt-4 text-sm">
                <button
                    className="text-sm text-blue-700 hover:underline focus:outline-none"
                    onClick={handleToggleComments}
                    aria-expanded={commentsOpen}
                    type="button"
                >
                    {commentsOpen ? "Hide Comments" : "Show Comments"}
                </button>
                {commentsOpen && (
                    <div className="mt-2 bg-gray-50 border border-gray-200 rounded p-3">
                        {loading ? (
                            <div className="text-gray-400 text-xs">Loading comments...</div>
                        ) : comments && comments.length > 0 ? (
                            <ul className="space-y-2">
                                {comments.map((comment, idx) => (
                                    <li key={idx} className="text-gray-700 text-sm border-b last:border-b-0 pb-2">
                                        {comment}
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div className="text-gray-400 text-xs">No comments yet.</div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default AnnouncementBox