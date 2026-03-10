'use client'

import React, { useActionState, useEffect } from 'react'
import { X, BookOpen } from 'lucide-react'
import { CreateClassAction } from '@/app/dashboard/action'
import { CreateClassReturnAction } from '@/types/classroom-return'
import { useToastAction } from '@/hooks/useToast'
import toast from 'react-hot-toast'
import Input from '@/components/ui/Input'

// ─── Initial state ──────────────────────────────────────────────────────────────

const initialState: CreateClassReturnAction = {
    success: false,
    errors: {},
    values: { name: '', description: '' },
}

// ─── Props ──────────────────────────────────────────────────────────────────────

type Props = {
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void   // called after class is created so the list refreshes
}

// ─── Component ─────────────────────────────────────────────────────────────────

const CreateClassModal = ({ isOpen, onClose, onSuccess }: Props) => {
    const [state, formAction, pending] = useActionState(CreateClassAction, initialState)

    useToastAction<CreateClassReturnAction>({
        state,
        pending,
        onSuccess: () => {
            toast.success('Class created successfully!')
            onSuccess()
            onClose()
        },
        onError: () => {
            if (state.success) return
            if (state.errors?.api) {
                toast.error(state.errors.api ?? 'Failed to create class')
            } else {
                toast.error('Please fill in the required fields')
            }
        },
    })

    // Close modal on Escape key
    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose()
        }
        window.addEventListener('keydown', handleKey)
        return () => window.removeEventListener('keydown', handleKey)
    }, [onClose])

    if (!isOpen) return null

    return (
        /* Backdrop */
        <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center px-4"
            onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
        >
            {/* Modal card */}
            <div className="w-full max-w-md bg-white dark:bg-[#1a1a2e] rounded-2xl shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200 dark:border-white/10">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-main/10 rounded-lg flex items-center justify-center">
                            <BookOpen className="w-5 h-5 text-main" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Create Class</h2>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Set up a new classroom</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-all"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Form */}
                <form action={formAction} className="px-6 py-5 space-y-5">

                    {/* Class Name */}
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Class Name <span className="text-red-500">*</span>
                        </label>
                        <Input
                            icon={<BookOpen className="h-5 w-5 text-slate-500 dark:text-slate-400" />}
                            id="name"
                            type="text"
                            placeholder="e.g. Advanced Mathematics"
                            defaultValue={!state.success ? state.values?.name : ''}
                            isError={!state.success ? !!state.errors?.name : false}
                        />
                        {!state.success && state.errors?.name && (
                            <p className="mt-1 text-xs text-red-500">{state.errors.name[0]}</p>
                        )}
                    </div>

                    {/* Description */}
                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Description <span className="text-slate-400 font-normal">(optional)</span>
                        </label>
                        <textarea
                            id="description"
                            name="description"
                            rows={3}
                            placeholder="What is this class about?"
                            defaultValue={!state.success ? state.values?.description : ''}
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-white/5 border border-slate-300 dark:border-white/10 rounded-lg text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-main focus:border-transparent transition-all resize-none text-sm"
                        />
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-3 pt-1">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-2.5 px-4 rounded-lg border border-slate-300 dark:border-white/10 text-slate-700 dark:text-slate-300 text-sm font-medium hover:bg-slate-100 dark:hover:bg-white/5 transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={pending}
                            className={`flex-1 py-2.5 px-4 rounded-lg bg-main text-white text-sm font-bold transition-all shadow-lg shadow-main/30 hover:bg-main/90 hover:shadow-main/50 ${pending ? 'opacity-50 cursor-progress' : ''}`}
                        >
                            {pending ? 'Creating...' : 'Create Class'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default CreateClassModal
