'use client';

export default function HabitsError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="min-h-screen bg-zinc-50/60 dark:bg-zinc-950/40 p-10 flex items-center justify-center">
      <div className="text-center space-y-4 max-w-sm">
        <div className="w-16 h-16 rounded-3xl bg-red-500/10 flex items-center justify-center mx-auto">
          <span className="text-2xl">⚠️</span>
        </div>
        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Không thể tải thói quen</h2>
        <p className="text-sm text-zinc-500">{error.message}</p>
        <button
          onClick={reset}
          className="px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm transition-all cursor-pointer"
        >
          Thử lại
        </button>
      </div>
    </div>
  );
}
