import React from 'react'
import DashboardSidebar from '@/components/dashboard/DashboardSidebar'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen bg-dark">
            {/* Persistent left sidebar */}
            {/* <DashboardSidebar /> */}

            {/* Main content — offset by sidebar width */}
            <main className="flex-1 min-h-screen">
                {children}
            </main>
        </div>
    )
}
