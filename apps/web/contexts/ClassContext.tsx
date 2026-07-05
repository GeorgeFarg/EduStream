'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { apiBaseUrl } from '@/config/env';
import type { Classroom, ClassRoom_return } from '@/types/classroom-return.d';

interface CurrentUser {
  id: number;
  name: string;
  email: string;
}

interface ClassContextValue {
  classes: Classroom[];
  currentClass: Classroom | null;
  currentUser: CurrentUser | null;
  userId: number | null;
  isTeacher: (classId: number) => boolean;
  setCurrentClass: (cls: Classroom) => void;
  refreshClasses: () => Promise<void>;
  loading: boolean;
}

const ClassContext = createContext<ClassContextValue>({
  classes: [],
  currentClass: null,
  currentUser: null,
  userId: null,
  isTeacher: () => false,
  setCurrentClass: () => {},
  refreshClasses: async () => {},
  loading: true,
});

export function ClassProvider({ children }: { children: React.ReactNode }) {
  const [classes, setClasses] = useState<Classroom[]>([]);
  const [currentClass, setCurrentClass] = useState<Classroom | null>(null);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [userId, setUserId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  // classId -> role mapping
  const [membershipRoles, setMembershipRoles] = useState<Record<number, string>>({});

  const selectCurrentClass = useCallback((cls: Classroom) => {
    setCurrentClass(cls);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('currentClassId', String(cls.id));
    }
  }, []);

  const fetchMe = useCallback(async () => {
    try {
      const res = await fetch(`${apiBaseUrl}/api/auth/me`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data.user);
      }
    } catch {
      setCurrentUser(null);
    }
  }, []);

  const refreshClasses = useCallback(async () => {
    try {
      const res = await fetch(`${apiBaseUrl}/api/classes`, { credentials: 'include' });
      if (res.ok) {
        const data: ClassRoom_return & { classes: Array<Classroom & { members: Array<{ userId: number; role: string }> }> } = await res.json();
        setClasses(data.classes);
        setUserId(data.userId);

        // Build role map
        const roles: Record<number, string> = {};
        for (const cls of data.classes) {
          const membership = cls.members?.find((m) => m.userId === data.userId);
          if (membership) roles[cls.id] = membership.role;
        }
        setMembershipRoles(roles);

        if (!currentClass && data.classes.length > 0) {
          const urlClassId =
            typeof window !== 'undefined'
              ? Number(new URLSearchParams(window.location.search).get('classId'))
              : NaN;
          const savedClassId =
            typeof window !== 'undefined'
              ? Number(window.localStorage.getItem('currentClassId'))
              : NaN;
          const preferredClass =
            data.classes.find((cls) => cls.id === urlClassId) ??
            data.classes.find((cls) => cls.id === savedClassId) ??
            data.classes[0];

          if (preferredClass) {
            selectCurrentClass(preferredClass);
          }
        }
      }
    } catch {
      setClasses([]);
      setMembershipRoles({});
    }
  }, [currentClass, selectCurrentClass]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await Promise.all([fetchMe(), refreshClasses()]);
      setLoading(false);
    })();
  }, [fetchMe, refreshClasses]);

  const isTeacher = useCallback(
    (classId: number) => membershipRoles[classId] === 'TEACHER',
    [membershipRoles],
  );

  return (
    <ClassContext.Provider
      value={{ classes, currentClass, currentUser, userId, isTeacher, setCurrentClass: selectCurrentClass, refreshClasses, loading }}
    >
      {children}
    </ClassContext.Provider>
  );
}

export function useClassContext() {
  return useContext(ClassContext);
}
