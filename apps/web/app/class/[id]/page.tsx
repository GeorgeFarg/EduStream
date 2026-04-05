import { apiBaseUrl } from '@/config/env';
import ClassPage from './ClassPageClient';
import React from 'react'
import { cookies } from 'next/headers';
import { Announcement_return } from '@/types/announcments';

async function getAnnouncments(id: string): Promise<Announcement_return> {
    "use server"
    if (!apiBaseUrl) throw new Error("something wrong");

    const cookieStore = await cookies();
    const session = cookieStore.get("session")?.value;

    const res = await fetch(`${apiBaseUrl}/api/announcements?classId=${id}`, {
        cache: "no-store",
        headers: session ? { Cookie: `session=${session}` } : {},
    });

    if (!res.ok) {
        if (res.status === 404)
            return {
                announcements: [],
                // userId: (await res.json()).userId
            }
        throw new Error(res.status.toString())
    };

    const data: any = await res.json();


    return {
        announcements: data
    };
}



const ClassDetails = async ({
    params,
}: {
    params: Promise<{ id: string }>
}) => {
    const { id } = await params;
    const initialAnnouncements = await getAnnouncments(id);

    return (
        <div><ClassPage initialAnnouncements={initialAnnouncements} /></div>
    )
}

export default ClassDetails