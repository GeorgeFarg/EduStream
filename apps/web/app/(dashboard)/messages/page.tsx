'use client';

import ClassChat from '@/components/class/ClassChat';
import { useClassContext } from '@/contexts/ClassContext';

export default function MessagesPage() {
  const { currentClass } = useClassContext();

  const classId = currentClass?.id ? String(currentClass.id) : null;

  if (!classId) {
    return (
      <div className="h-full min-h-[60vh] flex items-center justify-center text-white/40">
        Select a class to view public messages.
      </div>
    );
  }

  // Public class chat for all class members (replaces old private/DM UI)
  return (
    <div className="h-full">
      <ClassChat classId={classId} className={currentClass?.name} />
    </div>
  );
}

