'use client'

import React from 'react'
import { GraduationCap, LayoutGrid, BookOpen, Users, Star, Settings } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

// ─── Sidebar navigation items ──────────────────────────────────────────────────

const navItems = [
    { label: 'Stream',    href: '/dashboard',           icon: LayoutGrid },
    { label: 'Classwork', href: '/dashboard/classwork', icon: BookOpen   },
    { label: 'People',    href: '/dashboard/people',    icon: Users      },
    { label: 'Grades',    href: '/dashboard/grades',    icon: Star       },
]

// ─── Component ─────────────────────────────────────────────────────────────────

const DashboardSidebar = () => {
    const pathname = usePathname()

    return (
        <aside className="fixed left-0 top-0 h-full w-[220px] bg-white dark:bg-[#1a1a2e] border-r border-slate-200 dark:border-white/10 flex flex-col z-40">

            {/* Logo */}
            <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-200 dark:border-white/10">
                <div className="w-9 h-9 bg-main rounded-lg flex items-center justify-center flex-shrink-0">
                    <GraduationCap className="w-5 h-5 text-white" />
                </div>
                <div>
                    <p className="font-bold text-slate-900 dark:text-white text-sm leading-tight">EduStream</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">Professional LMS</p>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 py-5 space-y-1">
                {navItems.map(({ label, href, icon: Icon }) => {
                    const isActive = pathname === href
                    return (
                        <Link
                            key={href}
                            href={href}
                            className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                                isActive
                                    ? 'bg-main/10 text-main'
                                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'
                            }`}
                        >
                            <Icon className="w-4.5 h-4.5 flex-shrink-0" />
                            {label}
                        </Link>
                    )
                })}
            </nav>

            {/* Bottom: Settings + User */}
            <div className="px-3 pb-5 space-y-1 border-t border-slate-200 dark:border-white/10 pt-4">
                <Link
                    href="/dashboard/settings"
                    className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white transition-all duration-150"
                >
                    <Settings className="w-4.5 h-4.5 flex-shrink-0" />
                    Settings
                </Link>

                {/* User */}
                <div className="flex items-center gap-3 px-4 py-3 mt-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex-shrink-0" />
                    <div className="overflow-hidden">
                        <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">Yousra Ousama</p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">Student</p>
                    </div>
                </div>
            </div>
        </aside>
    )
}

export default DashboardSidebar
