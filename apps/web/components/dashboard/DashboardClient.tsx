'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Plus, BookOpen, Hash, Moon, Grid3X3 } from 'lucide-react'
import { Classroom } from '@/types/classroom-return'
import ClassroomCard from '@/components/dashboard/ClassroomCard'
import CreateClassModal from '@/components/dashboard/CreateClassModal'
import JoinClassModal from '@/components/dashboard/JoinClassModal'

// ─── Types ──────────────────────────────────────────────────────────────────────

type ModalType = 'create' | 'join' | null

type Props = {
    // Initial classrooms fetched on the server — no browser fetch needed on first load
    initialClassrooms: Classroom[]
}

// ─── Component ─────────────────────────────────────────────────────────────────

const DashboardClient = ({ initialClassrooms }: Props) => {
    const [classrooms, setClassrooms] = useState<Classroom[]>(initialClassrooms)
    const [openModal, setOpenModal]   = useState<ModalType>(null)
    const [dropdownOpen, setDropdownOpen] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)

    // ── Refresh list after create/join (client-side, safe — no dotenv) ────────

    const refreshClassrooms = useCallback(async () => {
        try {
            // NEXT_PUBLIC_ variables are embedded at build time, safe in the browser
            const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL
            const res = await fetch(`${apiBaseUrl}/api/classes`, { credentials: 'include' })
            if (res.ok) {
                const data = await res.json()
                setClassrooms(Array.isArray(data) ? data : [])
            }
        } catch {
            // toasts are handled inside the modals
        }
    }, [])

    // ── Close dropdown when clicking outside ──────────────────────────────────

    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setDropdownOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClick)
        return () => document.removeEventListener('mousedown', handleClick)
    }, [])

    // ── Modal helpers ─────────────────────────────────────────────────────────

    const openCreateModal = () => { setDropdownOpen(false); setOpenModal('create') }
    const openJoinModal   = () => { setDropdownOpen(false); setOpenModal('join')   }
    const closeModal      = () => setOpenModal(null)

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <>
            {/* ─── Top header bar ─────────────────────────────────────────────── */}
            <header className="sticky top-0 z-30 bg-white dark:bg-[#1a1a2e] border-b border-slate-200 dark:border-white/10 px-8 py-3.5 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                    <span>ITC - EGC</span>
                    <span>/</span>
                    <span className="font-semibold text-slate-900 dark:text-white">IT 4th EGC</span>
                </div>

                <div className="flex items-center gap-3">
                    <button className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-all">
                        <Moon className="w-4 h-4" />
                    </button>
                    <button className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-all">
                        <Grid3X3 className="w-4 h-4" />
                    </button>
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 cursor-pointer" />
                </div>
            </header>

            {/* ─── Main content area ───────────────────────────────────────────── */}
            <div className="px-8 py-8">

                {/* Page heading + dropdown button */}
                <div className="flex items-start justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Active Classrooms</h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage your courses and assignments</p>
                    </div>

                    <div className="relative" ref={dropdownRef}>
                        <button
                            onClick={() => setDropdownOpen(v => !v)}
                            className="flex items-center gap-2 bg-main hover:bg-main/90 text-white font-bold px-5 py-2.5 rounded-xl shadow-lg shadow-main/30 hover:shadow-main/50 transition-all text-sm"
                        >
                            <Plus className="w-4 h-4" />
                            Join Class
                        </button>

                        {dropdownOpen && (
                            <div className="absolute right-0 mt-2 w-44 bg-white dark:bg-[#1a1a2e] rounded-xl border border-slate-200 dark:border-white/10 shadow-xl overflow-hidden z-40">
                                <button
                                    onClick={openCreateModal}
                                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
                                >
                                    <BookOpen className="w-4 h-4 text-main flex-shrink-0" />
                                    Create Class
                                </button>
                                <div className="mx-4 border-t border-slate-100 dark:border-white/10" />
                                <button
                                    onClick={openJoinModal}
                                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
                                >
                                    <Hash className="w-4 h-4 text-main flex-shrink-0" />
                                    Join Class
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* ─── Classroom grid / empty state ─────────────────────────────── */}
                {classrooms.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 text-center">
                        <div className="w-16 h-16 rounded-2xl bg-main/10 flex items-center justify-center mb-4">
                            <BookOpen className="w-8 h-8 text-main" />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">No classrooms yet</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs">
                            Create your first classroom or join one using a class code from your teacher.
                        </p>
                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={openCreateModal}
                                className="flex items-center gap-2 bg-main hover:bg-main/90 text-white font-bold px-5 py-2.5 rounded-xl shadow-lg shadow-main/30 text-sm transition-all"
                            >
                                <Plus className="w-4 h-4" /> Create Class
                            </button>
                            <button
                                onClick={openJoinModal}
                                className="flex items-center gap-2 border border-slate-300 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 font-medium px-5 py-2.5 rounded-xl text-sm transition-all"
                            >
                                <Hash className="w-4 h-4" /> Join Class
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {classrooms.map((classroom, index) => (
                            <ClassroomCard key={classroom.id} classroom={classroom} index={index} />
                        ))}
                    </div>
                )}
            </div>

            {/* ─── Modals ─────────────────────────────────────────────────────── */}
            <CreateClassModal
                isOpen={openModal === 'create'}
                onClose={closeModal}
                onSuccess={refreshClassrooms}
            />
            <JoinClassModal
                isOpen={openModal === 'join'}
                onClose={closeModal}
                onSuccess={refreshClassrooms}
            />
        </>
    )
}

export default DashboardClient