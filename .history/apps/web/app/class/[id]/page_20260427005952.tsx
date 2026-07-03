import { apiBaseUrl } from '@/config/env';
import {ClassPage} from './ClassPageClient';
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

    const data: any = await res.json();

    if (!res.ok) {
        if (res.status === 404)
            return Promise.reject({
                message: "Announcements not found",
                data,
                success: false
            });

        throw new Error(res.status.toString())
    };

    return data;
}

async function getClassName(id: string): Promise<string> {
    "use server"
    if (!apiBaseUrl) return "Class";

    const cookieStore = await cookies();
    const session = cookieStore.get("session")?.value;

    const res = await fetch(`${apiBaseUrl}/api/classes`, {
        cache: "no-store",
        headers: session ? { Cookie: `session=${session}` } : {},
    });

    const data: any = await res.json();

    if (!res.ok || !data?.classes) return "Class";

    const found = data.classes.find((c: any) => String(c.id) === id);
    return found?.name || "Class";
}



const ClassDetails = async ({
    params,
}: {
    params: Promise<{ id: string }>
}) => {
    const { id } = await params;
    const [initialAnnouncements, className] = await Promise.all([
        getAnnouncments(id),
        getClassName(id),
    ]);     

    return (
        <div><ClassPage initialAnnouncements={initialAnnouncements} classId={id} className={className} /></div>
    )
}

export default ClassDetails
