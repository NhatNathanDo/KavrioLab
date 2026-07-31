'use client';

import React from 'react';
import PortalModal from '@/components/shared/PortalModal';
import { AlertTriangle, Trash2 } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  isLoading?: boolean;
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Xác nhận',
  cancelText = 'Hủy',
  variant = 'danger',
  isLoading = false,
}: ConfirmModalProps) {
  const iconColorClass =
    variant === 'danger'
      ? 'bg-rose-500/10 text-rose-500'
      : variant === 'warning'
      ? 'bg-amber-500/10 text-amber-500'
      : 'bg-indigo-500/10 text-indigo-500';

  const confirmBtnClass =
    variant === 'danger'
      ? 'bg-rose-500 hover:bg-rose-600 dark:bg-rose-600 dark:hover:bg-rose-500 text-white'
      : variant === 'warning'
      ? 'bg-amber-500 hover:bg-amber-600 text-white'
      : 'bg-indigo-600 hover:bg-indigo-700 text-white';

  return (
    <PortalModal isOpen={isOpen} onClose={onClose} maxWidth="sm">
      <div className="flex flex-col items-center text-center space-y-4 py-2">
        <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${iconColorClass}`}>
          {variant === 'danger' ? <Trash2 className="h-7 w-7" /> : <AlertTriangle className="h-7 w-7" />}
        </div>

        <div>
          <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{title}</h3>
          <p className="mt-1.5 text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
            {description}
          </p>
        </div>

        <div className="flex items-center justify-end gap-3 w-full pt-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 rounded-xl border border-zinc-200 bg-white py-2.5 text-sm font-medium text-zinc-700 shadow-sm transition hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={async () => {
              await onConfirm();
              onClose();
            }}
            disabled={isLoading}
            className={`flex-1 rounded-xl py-2.5 text-sm font-semibold shadow-sm transition active:scale-95 disabled:opacity-50 ${confirmBtnClass}`}
          >
            {isLoading ? 'Đang xử lý...' : confirmText}
          </button>
        </div>
      </div>
    </PortalModal>
  );
}
