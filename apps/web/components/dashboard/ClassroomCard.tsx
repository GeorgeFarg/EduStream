import React from 'react'
import { MoreVertical } from 'lucide-react'
import Badge from '../ui/badge'

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

const badgeColors: string[] = [
    'bg-violet-100 text-violet-700',
    'bg-blue-100 text-blue-700',
    'bg-emerald-100 text-emerald-700',
    'bg-orange-100 text-orange-700',
    'bg-pink-100 text-pink-700',
    'bg-purple-100 text-purple-700'

]

// ─── Props ──────────────────────────────────────────────────────────────────────

type Props = {
    classroom: Classroom
    index: number,
    userId: number
}

// ─── Component ─────────────────────────────────────────────────────────────────

const ClassroomCard = ({ classroom, index, userId }: Props) => {
    const gradient = gradients[index % gradients.length]
    const badgeColor: string = badgeColors[index % badgeColors.length] ?? ''

    return (
        <div className="bg-[#1a1a2e] rounded-2xl overflow-hidden border border-white/10 shadow-sm hover:shadow-md transition-shadow duration-200">

            {/* Coloured header strip */}
            <div className={`bg-linear-to-r ${gradient} px-5 py-4 flex items-start justify-between min-h-20`}>
                <div>
                    <h3 className="text-white font-bold text-base leading-tight">{classroom.name}</h3>
                    {classroom.description && (
                        <p className="text-white/70 text-xs mt-0.5 truncate max-w-[200px]">{classroom.description}</p>
                    )}
                </div>
                <div className='flex items-center'>
                    {userId === classroom.ownerId && <Badge badgeColor={badgeColor} text={'Owner'} />}
                    <button className="text-white/70 hover:text-white transition-colors mt-0.5">
                        <MoreVertical className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Card body */}
            <div className="px-5 py-4">
                {/* Class code badge */}
                <div className="flex items-center gap-2 mb-4">
                    <span className="text-xs text-slate-400">Class code:</span>
                    <span className="text-xs font-mono font-bold text-main bg-main/10 px-2 py-0.5 rounded-md tracking-widest">
                        {classroom.code}
                    </span>
                </div>

                {/* Footer: member avatars + Open Stream */}
                <div className="flex items-center justify-between">
                    {/* Placeholder avatars (will be real members in a future update) */}
                    <div className="flex -space-x-2">
                        <div className="w-7 h-7 rounded-full bg-linear-to-br from-orange-300 to-pink-400 border-2 border-[#1a1a2e]" />
                        <div className="w-7 h-7 rounded-full bg-linear-to-br from-blue-300 to-indigo-400 border-2 border-[#1a1a2e]" />
                        <div className="w-7 h-7 rounded-full bg-linear-to-br from-emerald-300 to-teal-400 border-2 border-[#1a1a2e] flex items-center justify-center">
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
