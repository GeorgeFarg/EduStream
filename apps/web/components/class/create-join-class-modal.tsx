'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { apiBaseUrl } from '@/config/env';
import toast from 'react-hot-toast';

type Mode = 'choose' | 'create' | 'join';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => Promise<void>;
}

export function CreateJoinClassModal({ open, onOpenChange, onSuccess }: Props) {
  const [mode, setMode] = useState<Mode>('choose');
  const [loading, setLoading] = useState(false);

  // Create form
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  // Join form
  const [code, setCode] = useState('');

  const handleClose = () => {
    onOpenChange(false);
    setMode('choose');
    setName('');
    setDescription('');
    setCode('');
  };

  const handleCreate = async () => {
    if (!name.trim()) return toast.error('Class name is required');
    setLoading(true);
    try {
      const res = await fetch(`${apiBaseUrl}/api/classes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name: name.trim(), description: description.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error?.message ?? 'Failed to create class');
      } else {
        toast.success(`Class "${data.name}" created!`);
        await onSuccess();
        handleClose();
      }
    } catch {
      toast.error('Network error');
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!code.trim()) return toast.error('Class code is required');
    setLoading(true);
    try {
      const res = await fetch(`${apiBaseUrl}/api/classes/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ code: code.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error?.message ?? 'Failed to join class');
      } else {
        toast.success(`Joined "${data.class.name}"!`);
        await onSuccess();
        handleClose();
      }
    } catch {
      toast.error('Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode === 'choose' ? 'Join or Create a Class' : mode === 'create' ? 'Create Class' : 'Join Class'}
          </DialogTitle>
        </DialogHeader>

        {mode === 'choose' && (
          <div className="flex flex-col gap-3 pt-2">
            <Button onClick={() => setMode('create')}>Create a new class</Button>
            <Button variant="outline" onClick={() => setMode('join')}>Join with a code</Button>
          </div>
        )}

        {mode === 'create' && (
          <div className="space-y-4 pt-2">
            <div>
              <label className="text-sm font-medium block mb-1">Class Name</label>
              <input
                className="w-full px-3 py-2 rounded-md border border-border bg-input text-sm"
                placeholder="e.g. Advanced Calculus"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">Description (optional)</label>
              <textarea
                className="w-full px-3 py-2 rounded-md border border-border bg-input text-sm resize-none"
                rows={3}
                placeholder="Short description..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setMode('choose')}>Back</Button>
              <Button onClick={handleCreate} disabled={loading}>
                {loading ? 'Creating...' : 'Create'}
              </Button>
            </div>
          </div>
        )}

        {mode === 'join' && (
          <div className="space-y-4 pt-2">
            <div>
              <label className="text-sm font-medium block mb-1">Class Code</label>
              <input
                className="w-full px-3 py-2 rounded-md border border-border bg-input text-sm uppercase tracking-widest"
                placeholder="Enter code..."
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setMode('choose')}>Back</Button>
              <Button onClick={handleJoin} disabled={loading}>
                {loading ? 'Joining...' : 'Join'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
