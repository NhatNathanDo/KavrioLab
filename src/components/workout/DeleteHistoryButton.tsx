'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';
import ConfirmModal from '@/components/shared/ConfirmModal';

export function DeleteHistoryButton({ id }: { id: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleConfirmDelete = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/workouts/history/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        router.push('/workouts/history');
        router.refresh();
      }
    } catch (err) {
      console.error('Failed to delete workout session:', err);
    } finally {
      setLoading(false);
      setShowConfirm(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setShowConfirm(true)}
        disabled={loading}
        className="inline-flex items-center gap-1.5 px-4 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-semibold text-zinc-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all disabled:opacity-50 cursor-pointer"
        aria-label="Delete this workout log"
      >
        <Trash2 className="w-3.5 h-3.5" />
        {loading ? 'Deleting...' : 'Delete Log'}
      </button>

      <ConfirmModal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleConfirmDelete}
        isLoading={loading}
        title="Xóa buổi tập này?"
        description="Hành động này sẽ xóa vĩnh viễn buổi tập khỏi lịch sử của bạn và không thể hoàn tác."
        confirmText="Xóa ngay"
        cancelText="Hủy"
        variant="danger"
      />
    </>
  );
}
