"use client"

import React from "react"
import { useRouter } from "next/navigation"
import { Frown } from "lucide-react"

export default function ErrorPage({ error, reset }: { error: Error; reset: () => void }) {
    const router = useRouter()

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            <div className="mb-6 bg-red-100 dark:bg-red-900/20 rounded-full p-5">
                <Frown className="w-12 h-12 text-red-500" />
            </div>
            <h1 className="text-2xl font-bold mb-3 text-red-600 dark:text-red-400">Something went wrong</h1>
            <p className="text-slate-600 dark:text-slate-300 mb-6 max-w-lg">
                Sorry, we couldn&apos;t load this page. <br />
                {error?.message && (
                    <span className="block text-xs mt-2 text-slate-500 dark:text-slate-400">
                        {error.message}
                    </span>
                )}
            </p>
            <div className="flex gap-3">
                <button
                    onClick={() => reset()}
                    className="px-4 py-2 rounded-xl bg-main text-white font-medium hover:bg-main/90 transition"
                >
                    Try Again
                </button>
                <button
                    onClick={() => router.push("/dashboard")}
                    className="px-4 py-2 rounded-xl border border-slate-300 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 font-medium transition"
                >
                    Go to Dashboard
                </button>
            </div>
        </div>
    )
}
