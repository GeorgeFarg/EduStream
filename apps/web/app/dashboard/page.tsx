// ─── Server Component (no 'use client') ────────────────────────────────────────
// Data fetching happens here on the server, so dotenv / 'fs' never touch the browser.

import { ClassRoom_return } from "@/types/classroom-return";
import DashboardClient from "@/components/dashboard/DashboardClient";
import { apiBaseUrl } from "@/config/env";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

async function getClassrooms(): Promise<ClassRoom_return> {
  "use server"
  if (!apiBaseUrl) throw new Error("something wrong");

  const cookieStore = await cookies();
  const session = cookieStore.get("session")?.value;

  const res = await fetch(`${apiBaseUrl}/api/classes`, {
    cache: "no-store",
    headers: session ? { Cookie: `session=${session}` } : {},
  });

  if (!res.ok) {
    if (res.status === 404)
      return {
        classes: [],
        userId: (await res.json()).userId
      }
    throw new Error(res.status.toString())
  };

  const data: ClassRoom_return = await res.json();
  return data;
}

// This is the Next.js page — it's a Server Component by default (no 'use client')
export default async function DashboardPage() {
  const cookieStore = await cookies();
  const session = cookieStore.has("session");

  if (!session) {
    redirect("/login");
  }

  const initialClassrooms = await getClassrooms();

  // Pass the fetched data to the client component that handles all interactivity
  return <DashboardClient initialClassrooms={initialClassrooms} />;
}
