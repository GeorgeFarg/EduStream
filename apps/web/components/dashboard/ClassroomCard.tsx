import React from 'react'
import { MoreVertical } from 'lucide-react'
import { Classroom } from '@/types/classroom-return'

// ─── Card gradient palette ──────────────────────────────────────────────────────
// Each card gets a gradient based on its position index, just like the design.

const gradients = [
    'from-violet-500 to-purple-600',
    'from-blue-500 to-indigo-600',
    'from-emerald-400 to-teal-500',
    'from-orange-400 to-red-500',
    'from-pink-500 to-rose-600',
    'from-purple-500 to-violet-700',
]

// ─── Props ──────────────────────────────────────────────────────────────────────

type Props = {
    classroom: Classroom
    index: number
}

// ─── Component ─────────────────────────────────────────────────────────────────

const ClassroomCard = ({ classroom, index }: Props) => {
    const gradient = gradients[index % gradients.length]

    return (
        <div className="bg-white dark:bg-[#1a1a2e] rounded-2xl overflow-hidden border border-slate-200 dark:border-white/10 shadow-sm hover:shadow-md transition-shadow duration-200">

            {/* Coloured header strip */}
            <div className={`bg-gradient-to-r ${gradient} px-5 py-4 flex items-start justify-between`}>
                <div>
                    <h3 className="text-white font-bold text-base leading-tight">{classroom.name}</h3>
                    {classroom.description && (
                        <p className="text-white/70 text-xs mt-0.5 truncate max-w-[200px]">{classroom.description}</p>
                    )}
                </div>
                <button className="text-white/70 hover:text-white transition-colors mt-0.5">
                    <MoreVertical className="w-4 h-4" />
                </button>
            </div>

            {/* Card body */}
            <div className="px-5 py-4">
                {/* Class code badge */}
                <div className="flex items-center gap-2 mb-4">
                    <span className="text-xs text-slate-500 dark:text-slate-400">Class code:</span>
                    <span className="text-xs font-mono font-bold text-main bg-main/10 px-2 py-0.5 rounded-md tracking-widest">
                        {classroom.code}
                    </span>
                </div>

                {/* Footer: member avatars + Open Stream */}
                <div className="flex items-center justify-between">
                    {/* Placeholder avatars (will be real members in a future update) */}
                    <div className="flex -space-x-2">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-orange-300 to-pink-400 border-2 border-white dark:border-[#1a1a2e]" />
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-300 to-indigo-400 border-2 border-white dark:border-[#1a1a2e]" />
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-300 to-teal-400 border-2 border-white dark:border-[#1a1a2e] flex items-center justify-center">
                            <span className="text-[9px] font-bold text-white">+</span>
                        </div>
                    </div>

                    <button className="text-main text-sm font-semibold hover:text-main/80 transition-colors">
                        Open Stream
                    </button>
                </div>
            </div>
        </div>
    )
}

export default ClassroomCard
