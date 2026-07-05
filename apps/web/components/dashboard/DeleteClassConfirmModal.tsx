'use client';

import React, { useEffect } from 'react';
import toast from 'react-hot-toast';
import { X, Trash2 } from 'lucide-react';
import axiosClient from '@/util/axiosClient';

type Props = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  classId: number | null;
};

export default function DeleteClassConfirmModal({ open, onClose, onSuccess, classId }: Props) {
  const [loading, setLoading] = React.useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(false);
  }, [open]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const submit = async () => {
    if (!classId) return;
    setLoading(true);
    try {
      await axiosClient.delete(`/api/classes/${classId}`);
      toast.success('Class deleted successfully');
      onClose();
      onSuccess();
    } catch (err: any) {
      const msg =
        err?.response?.data?.error?.message ||
        err?.response?.data?.message ||
        'Failed to delete class';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center px-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-md bg-[#1a1a2e] rounded-2xl shadow-2xl border border-white/10 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-red-500/10 rounded-lg flex items-center justify-center">
              <Trash2 className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Delete Class</h2>
              <p className="text-xs text-slate-400">This action cannot be undone.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/5 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div className="text-sm text-slate-300">
            Are you sure you want to delete this class? All related data may be removed.
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              disabled={loading}
              onClick={onClose}
              className="flex-1 py-2.5 px-4 rounded-lg border border-white/10 text-slate-300 text-sm font-medium hover:bg-white/5 transition-all"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={submit}
              className={`flex-1 py-2.5 px-4 rounded-lg bg-red-500 text-white text-sm font-bold transition-all ${
                loading ? 'opacity-50 cursor-progress' : 'hover:bg-red-400'
              }`}
            >
              {loading ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

