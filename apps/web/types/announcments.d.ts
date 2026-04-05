export type Announcement = {
    id: number,
    title: string,
    content: string,
    teacherId: number,
    classId: number,
    createdAt: string,
    updatedAt: string,
    // teacher: { id: 2, name: 'asdasd', email: 'ticekes118@naprb.com' }
}

export type Announcement_return = {
    announcements: Announcement[],
}