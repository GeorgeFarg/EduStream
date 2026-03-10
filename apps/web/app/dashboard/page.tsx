// ─── Server Component (no 'use client') ────────────────────────────────────────
// Data fetching happens here on the server, so dotenv / 'fs' never touch the browser.

import { Classroom } from '@/types/classroom-return'
import DashboardClient from '@/components/dashboard/DashboardClient'

async function getClassrooms(): Promise<Classroom[]> {
    // process.env is safe here because this runs only on the server
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL
    if (!apiBaseUrl) return []

    try {
        const res = await fetch(`${apiBaseUrl}/api/classes`, {
            // Revalidate every 0 seconds = always fresh (like useEffect fetch)
            cache: 'no-store',
        })
        if (!res.ok) return []
        const data = await res.json()
        return Array.isArray(data) ? data : []
    } catch {
        return []
    }
}

// This is the Next.js page — it's a Server Component by default (no 'use client')
export default async function DashboardPage() {
    const initialClassrooms = await getClassrooms()

    // Pass the fetched data to the client component that handles all interactivity
    return <DashboardClient initialClassrooms={initialClassrooms} />
}