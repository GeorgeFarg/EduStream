"use client";

"use client";

import ClassMeeting from "@/components/class/ClassMeeting";
import { useClassContext } from "@/contexts/ClassContext";

export default function MeetingPage() {
  const { currentClass } = useClassContext();

  const classId = currentClass?.id ? String(currentClass.id) : null;

  if (!classId) {
    return (
      <div className="h-full min-h-[60vh] flex items-center justify-center text-white/40">
        Meeting requires a selected class.
      </div>
    );
  }

  return (
    <div className="h-full">
      <ClassMeeting classId={classId} />
    </div>
  );
}


