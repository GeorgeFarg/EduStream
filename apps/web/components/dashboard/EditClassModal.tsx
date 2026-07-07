'use client';

import React, { useEffect } from 'react';
import toast from 'react-hot-toast';
import { X, BookOpen, Save } from 'lucide-react';
import axiosClient from '@/util/axiosClient';

type Props = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  classId: number | null;
};

export default function EditClassModal({ open, onClose, onSuccess, classId }: Props) {
  const [name, setName] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [initializing, setInitializing] = React.useState(false);

  useEffect(() => {
    const load = async () => {
      if (!open || !classId) return;

      setInitializing(true);
      try {
        const res = await axiosClient.get(`/api/classes/${classId}`);
        const klass = res?.data?.class;
        setName(klass?.name ?? '');
        setDescription(klass?.description ?? '');
      } catch {
        toast.error('Failed to load class details');
      } finally {
        setInitializing(false);
      }
    };

    load();
  }, [open, classId]);


  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!classId) return;

    if (!name.trim()) {
      toast.error('Class name is required');
      return;
    }

    setLoading(true);
    try {
      await axiosClient.patch(`/api/classes/${classId}`, {
        name: name.trim(),
        description: description.trim(),
      });

      toast.success('Class updated successfully');
      onClose();
      onSuccess();
    } catch (err: any) {
      const msg =
        err?.response?.data?.error?.message ||
        err?.response?.data?.message ||
        'Failed to update class';
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
            <div className="w-9 h-9 bg-main/10 rounded-lg flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-main" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Edit Class</h2>
              <p className="text-xs text-slate-400">Update class name and description</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/5 transition-all"
            type="button"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={submit} className="px-6 py-5 space-y-5">
          <div>
            <label htmlFor="edit-class-name" className="block text-sm font-medium text-slate-300 mb-2">
              Class Name <span className="text-red-500">*</span>
            </label>
            <input
              id="edit-class-name"
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-main focus:border-transparent transition-all resize-none text-sm"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Advanced Mathematics"
              required
            />
          </div>

          <div>
            <label htmlFor="edit-class-description" className="block text-sm font-medium text-slate-300 mb-2">
              Description <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <textarea
              id="edit-class-description"
              rows={3}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-main focus:border-transparent transition-all resize-none text-sm"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this class about?"
            />
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 rounded-lg border border-white/10 text-slate-300 text-sm font-medium hover:bg-white/5 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`flex-1 py-2.5 px-4 rounded-lg bg-main text-white text-sm font-bold transition-all shadow-lg shadow-main/30 hover:bg-main/90 hover:shadow-main/50 ${loading ? 'opacity-50 cursor-progress' : ''}`}
            >
              <span className="inline-flex items-center justify-center gap-2">
                <Save className="w-4 h-4" />
                {loading ? 'Saving...' : 'Save Changes'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

