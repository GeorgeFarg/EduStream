import React from 'react'
import DashboardSidebar from '@/components/dashboard/DashboardSidebar'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex min-h-screen bg-slate-50 dark:bg-dark">
            {/* Persistent left sidebar */}
            <DashboardSidebar />

            {/* Main content — offset by sidebar width */}
            <main className="flex-1 ml-[220px] min-h-screen">
                {children}
            </main>
        </div>
    )
}
