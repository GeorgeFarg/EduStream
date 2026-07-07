'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import Input from '@/components/ui/input';
import { Search, Mail, MessageSquare, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useClassContext } from '@/contexts/ClassContext';
import { apiBaseUrl } from '@/config/env';
import Link from 'next/link';

interface ClassMember {
  userId: number;
  role: string;
}

interface ClassWithMembers {
  id: number;
  members: ClassMember[];
}

interface UserInfo {
  id: number;
  name: string;
  email: string;
}

export default function PeoplePage() {
  const { currentClass, loading, currentUser } = useClassContext();
  const [members, setMembers] = useState<ClassMember[]>([]);
  const [userInfo, setUserInfo] = useState<Record<number, UserInfo>>({});
  const [fetchLoading, setFetchLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [teacherAddOpen, setTeacherAddOpen] = useState(false);
  const [teacherSearch, setTeacherSearch] = useState('');
  const [teacherSearchLoading, setTeacherSearchLoading] = useState(false);
  const [teacherSearchResults, setTeacherSearchResults] = useState<UserInfo[]>([]);
  const [teacherAddLoadingById, setTeacherAddLoadingById] = useState<Record<number, boolean>>({});

  useEffect(() => {
    if (!currentClass) return;

    const fetchMembers = async () => {
      setFetchLoading(true);
      try {
        const res = await fetch(`${apiBaseUrl}/api/classes`, { credentials: 'include' });
        const data: { classes: ClassWithMembers[] } = await res.json();
        const cls = data.classes?.find((c) => c.id === currentClass.id);

        if (cls?.members) {
          setMembers(cls.members);
          // Fetch actual users from DB for these class members
          const memberIds = cls.members?.map((m) => m.userId) || [];

          if (memberIds.length === 0) {
            setUserInfo({});
            return;
          }

          const resUsers = await fetch(
            `${apiBaseUrl}/api/classes/users?classId=${encodeURIComponent(String(currentClass.id))}&ids=${encodeURIComponent(memberIds.join(','))}`,
            { credentials: 'include' }
          );

          if (resUsers.ok) {
            const dataUsers: { users: UserInfo[] } = await resUsers.json();
            const infoMap: Record<number, UserInfo> = {};
            (dataUsers.users || []).forEach((u) => {
              infoMap[u.id] = u;
            });
            setUserInfo(infoMap);
          }
        }
      } catch {
        // ignore
      } finally {
        setFetchLoading(false);
      }
    };

    fetchMembers();
  }, [currentClass?.id]);


  const refetchMembers = async () => {
    if (!currentClass) return;

    setFetchLoading(true);
    try {
      const res = await fetch(`${apiBaseUrl}/api/classes`, { credentials: 'include' });
      const data: { classes: ClassWithMembers[] } = await res.json();
      const cls = data.classes?.find((c) => c.id === currentClass.id);

      if (cls?.members) {
        setMembers(cls.members);

        const memberIds = cls.members?.map((m) => m.userId) || [];
        if (memberIds.length === 0) {
          setUserInfo({});
          return;
        }

        const resUsers = await fetch(
          `${apiBaseUrl}/api/classes/users?classId=${encodeURIComponent(String(currentClass.id))}&ids=${encodeURIComponent(memberIds.join(','))}`,
          { credentials: 'include' },
        );

        if (resUsers.ok) {
          const dataUsers: { users: UserInfo[] } = await resUsers.json();
          const infoMap: Record<number, UserInfo> = {};
          (dataUsers.users || []).forEach((u) => {
            infoMap[u.id] = u;
          });
          setUserInfo(infoMap);
        }
      }
    } catch {
      // ignore
    } finally {
      setFetchLoading(false);
    }
  };


  const filteredMembers = members.filter((m) => {
    const user = userInfo[m.userId];
    if (!user) return false;
    return (
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const canManage =
    !!members.length &&
    members.some((m) => m.userId === currentUser?.id && m.role === 'TEACHER');

  const searchUsersToAdd = async () => {
    if (!currentClass) return;

    const q = teacherSearch.trim();
    if (!q) {
      setTeacherSearchResults([]);
      return;
    }

    setTeacherSearchLoading(true);
    try {
      const res = await fetch(
        `${apiBaseUrl}/api/classes/${currentClass.id}/users/search?q=${encodeURIComponent(q)}`,
        {
          credentials: 'include',
        },
      );
      const data = await res.json();
      setTeacherSearchResults(data?.users || []);
    } catch {
      setTeacherSearchResults([]);
    } finally {
      setTeacherSearchLoading(false);
    }
  };

  const addUserToClass = async (userId: number) => {
    if (!currentClass) return;

    setTeacherAddLoadingById((prev) => ({ ...prev, [userId]: true }));
    try {
      await fetch(`${apiBaseUrl}/api/classes/${currentClass.id}/users/add`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      setTeacherSearchResults((prev) => prev.filter((u) => u.id !== userId));
      await refetchMembers();
    } catch {
      // ignore
    } finally {
      setTeacherAddLoadingById((prev) => ({ ...prev, [userId]: false }));
    }
  };

  if (loading || !currentClass) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">People</h1>
        {loading ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading...
          </div>
        ) : (
          <p className="text-muted-foreground">No class selected.</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">People</h1>
          <p className="text-muted-foreground mt-1">
            {currentClass.name} participants
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search people..."
          className="pl-10 bg-input"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Teacher: Add members */}
      {canManage && (
        <div className="border border-border rounded-lg p-4 space-y-3 bg-card">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold">Add members</h2>
              <p className="text-sm text-muted-foreground">
                Search users from Prisma and add them to this class.
              </p>
            </div>
            <Button
              variant="secondary"
              onClick={() => setTeacherAddOpen((v) => !v)}
            >
              {teacherAddOpen ? 'Hide' : 'Add'}
            </Button>
          </div>

          {teacherAddOpen && (
            <div className="space-y-3">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or email..."
                  className="pl-10 bg-input"
                  value={teacherSearch}
                  onChange={(e) => setTeacherSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') searchUsersToAdd();
                  }}
                />
              </div>

              {teacherSearchLoading ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" /> Searching...
                </div>
              ) : teacherSearchResults.length === 0 ? (
                <p className="text-muted-foreground text-sm">No users found.</p>
              ) : (
                <div className="grid gap-2">
                  {teacherSearchResults.map((u) => (
                    <div
                      key={u.id}
                      className="flex items-center justify-between border border-border rounded-md p-2"
                    >
                      <div>
                        <div className="font-medium">{u.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {u.email}
                        </div>
                      </div>
                      <Button
                        disabled={!!teacherAddLoadingById[u.id]}
                        onClick={() => addUserToClass(u.id)}
                        variant="outline"
                      >
                        {teacherAddLoadingById[u.id] ? 'Adding...' : 'Add'}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* People Grid */}
      {fetchLoading ? (
        <div className="flex items-center gap-2 text-muted-foreground py-8 justify-center">
          <Loader2 className="w-5 h-5 animate-spin" /> Loading members...
        </div>
      ) : filteredMembers.length === 0 ? (
        <p className="text-center py-12 text-muted-foreground">
          {searchTerm
            ? 'No matching members found.'
            : 'No members in this class yet.'}
        </p>
      ) : (
        <div className="grid gap-4">
          {filteredMembers.map((member) => {
            const user = userInfo[member.userId];
            if (!user) return null;

            const isCurrentUser = user.id === currentUser?.id;
            const displayName = isCurrentUser ? currentUser.name : user.name;
            const displayEmail = isCurrentUser
              ? currentUser.email
              : user.email;

            const initials = displayName
              .split(' ')
              .map((n) => n[0])
              .join('')
              .toUpperCase()
              .slice(0, 2);
            const isTeacher = member.role === 'TEACHER';

            return (
              <div
                key={member.userId}
                className="bg-card border border-border rounded-lg p-4 flex items-center justify-between hover:border-primary transition"
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className="relative flex-shrink-0">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold ${isTeacher ? 'gradient-primary' : 'gradient-accent'
                        }`}
                    >
                      {initials}
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">
                        {displayName}
                        {isCurrentUser && ' (You)'}
                      </h3>
                      <Badge
                        variant="outline"
                        className={`text-xs ${isTeacher
                            ? 'bg-primary/10 text-primary border-primary/20'
                            : 'bg-accent/10 text-accent border-accent/20'
                          }`}
                      >
                        {isTeacher ? 'Teacher' : 'Student'}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {displayEmail}
                    </p>
                  </div>
                </div>
                {!isCurrentUser && (
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" title="Send email">
                      <Mail className="w-4 h-4" />
                    </Button>
                    <Link href={`/private-chat?to=${member.userId}`}>
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Send message"
                      >
                        <MessageSquare className="w-4 h-4" />
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
