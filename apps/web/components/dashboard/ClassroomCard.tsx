import React from 'react'
import { Copy, ExternalLink, MoreVertical } from 'lucide-react'
import {Badge} from '../ui/badge'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,    
} from '@/components/ui/dropdown-menu'

import { Classroom } from '@/types/classroom-return'
import { useRouter } from 'next/navigation'
import { BookOpen, Trash2 } from 'lucide-react'
import EditClassModal from './EditClassModal'
import DeleteClassConfirmModal from './DeleteClassConfirmModal'




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
    const router = useRouter()
    const classHref = `/stream?classId=${classroom.id}`

    const [editOpen, setEditOpen] = React.useState(false)
    const [deleteOpen, setDeleteOpen] = React.useState(false)

    const closeEdit = () => setEditOpen(false)
    const closeDelete = () => setDeleteOpen(false)

    // dashboard client passes refreshClassrooms via callback? If not available, we refresh by reloading the page.
    // NOTE: We'll keep it simple for now.
    // IMPORTANT: keep this from changing the URL while the modal is open.
    // Reloading via location.reload() may still trigger Next route re-evaluation.
    // Instead, simply close modals; the parent list should refresh naturally.
    const onOperationSuccess = () => {
        if (typeof window !== 'undefined') {
            window.location.reload();
        }
    }




    return (
        <div

            onClick={(e) => {
                if (editOpen || deleteOpen) return;
                e.stopPropagation();
                router.push(classHref);
            }}


            className="bg-[#1a1a2e] rounded-2xl overflow-hidden border border-white/10 shadow-sm hover:shadow-md transition-shadow duration-200 cursor-pointer"
        >

            {/* Coloured header strip */}
            <div className={`bg-linear-to-r ${gradient} px-5 py-4 flex items-start justify-between min-h-20`}>
                <div>
                    <h3 className="text-white font-bold text-base leading-tight">{classroom.name}</h3>
                    {classroom.description && (
                        <p className="text-white/70 text-xs mt-0.5 truncate max-w-[200px]">{classroom.description}</p>
                    )}
                </div>
                <div className="flex items-center gap-1">
                    {userId === classroom.ownerId && (
                        <Badge className={badgeColor}>Owner</Badge>
                    )}
                    <DropdownMenu>
                        <DropdownMenuTrigger
                            type="button"
                            className="rounded-md p-1 text-white/70 outline-none hover:text-white focus-visible:ring-2 focus-visible:ring-white/40"
                            onClick={(e) => e.stopPropagation()}
                            onPointerDown={(e) => e.stopPropagation()}
                        >
                            <MoreVertical className="h-4 w-4" />
                            <span className="sr-only">Class options</span>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                            align="end"
                            className="min-w-44 border-white/10 bg-[#252538] text-white"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <DropdownMenuItem
                                className="focus:bg-white/10 focus:text-white"
                                onSelect={() => {
                                    void navigator.clipboard.writeText(classroom.code)
                                }}
                            >
                                <Copy className="h-4 w-4" />
                                Copy class code
                            </DropdownMenuItem>
                    <DropdownMenuItem
                                className="focus:bg-white/10 focus:text-white"
                                onSelect={() => {
                                    router.push(classHref)
                                }}
                            >
                                <ExternalLink className="h-4 w-4" />
                                Open class
                            </DropdownMenuItem>

                            {userId === classroom.ownerId && (
                              <>

                                <DropdownMenuItem
                                  className="focus:bg-white/10 focus:text-white"
                                  onSelect={() => {
                                    setEditOpen(true)
                                  }}
                                >
                                  <BookOpen className="h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                              </>

                            )}


                                <DropdownMenuItem
                                  className="focus:bg-white/10 focus:text-white"
                                  onSelect={() => {
                                    setDeleteOpen(true)
                                  }}
                                >
                                  <Trash2 className="h-4 w-4 text-red-400" />
                                  Delete class
                                </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            <EditClassModal
              open={editOpen}
              onClose={closeEdit}
              onSuccess={onOperationSuccess}
              classId={classroom.id}
            />
            <DeleteClassConfirmModal
              open={deleteOpen}
              onClose={closeDelete}
              onSuccess={onOperationSuccess}
              classId={classroom.id}
            />


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

                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            router.push(classHref);
                        }}
                        className="text-main text-sm font-semibold hover:text-main/80 transition-colors"
                    >
                        Open Stream
                    </button>
                </div>
            </div>
        </div>
    )
}

export default ClassroomCard
