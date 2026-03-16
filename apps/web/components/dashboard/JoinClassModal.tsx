'use client'

import React, { useActionState, useEffect } from 'react'
import { X, Hash } from 'lucide-react'
import { JoinClassAction } from '@/app/dashboard/action'
import { JoinClassReturnAction } from '@/types/classroom-return'
import { useToastAction } from '@/hooks/useToast'
import toast from 'react-hot-toast'
import Input from '@/components/ui/Input'

// ─── Initial state ──────────────────────────────────────────────────────────────

const initialState: JoinClassReturnAction = {
    success: false,
    errors: {},
    values: { code: '' },
}

// ─── Props ──────────────────────────────────────────────────────────────────────

type Props = {
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void   // called after joining so the list refreshes
}

// ─── Component ─────────────────────────────────────────────────────────────────

const JoinClassModal = ({ isOpen, onClose, onSuccess }: Props) => {
    const [state, formAction, pending] = useActionState(JoinClassAction, initialState)

    useToastAction<JoinClassReturnAction>({
        state,
        pending,
        onSuccess: () => {
            toast.success('You joined the class successfully!')
            onSuccess()
            onClose()
        },
        onError: () => {
            if (state.success) return
            if (state.errors?.api) {
                toast.error(state.errors.api ?? 'Failed to join class')
            } else {
                toast.error('Please enter a valid class code')
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
                            <Hash className="w-5 h-5 text-main" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Join Class</h2>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Enter the class code from your teacher</p>
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

                    {/* Class Code */}
                    <div>
                        <label htmlFor="code" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Class Code <span className="text-red-500">*</span>
                        </label>
                        <Input
                            icon={<Hash className="h-5 w-5 text-slate-500 dark:text-slate-400" />}
                            id="code"
                            type="text"
                            placeholder="e.g. ABC123"
                            defaultValue={!state.success ? state.values?.code : ''}
                            isError={!state.success ? !!state.errors?.code : false}
                        />
                        {!state.success && state.errors?.code && (
                            <p className="mt-1 text-xs text-red-500">{state.errors.code[0]}</p>
                        )}
                        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                            Ask your teacher for the 6-character class code.
                        </p>
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
                            {pending ? 'Joining...' : 'Join Class'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default JoinClassModal
