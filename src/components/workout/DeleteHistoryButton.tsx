'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';

export function DeleteHistoryButton({ id }: { id: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this workout session?')) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/workouts/history/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        router.push('/workouts/history');
        router.refresh();
      } else {
        alert('Failed to delete workout session.');
      }
    } catch (err) {
      alert('An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="inline-flex items-center gap-1.5 px-4 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-semibold text-zinc-500 hover:text-red-550 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all disabled:opacity-50"
      aria-label="Delete this workout log"
    >
      <Trash2 className="w-3.5 h-3.5" />
      {loading ? 'Deleting...' : 'Delete Log'}
    </button>
  );
}
