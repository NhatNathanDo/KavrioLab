export default function CalendarLoading() {
  return (
    <div className="min-h-screen bg-zinc-50/60 dark:bg-zinc-950/40 p-6 md:p-10 space-y-8 max-w-6xl mx-auto">
      <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 flex items-center gap-4">
        <div className="w-10 h-10 rounded-2xl bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
        <div className="space-y-2 flex-1">
          <div className="h-6 w-56 rounded-xl bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
          <div className="h-3 w-80 rounded-full bg-zinc-100 dark:bg-zinc-800/60 animate-pulse" />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white dark:bg-zinc-900 p-5 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 h-24 animate-pulse" />
        ))}
      </div>
      <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 p-5 h-96 animate-pulse" />
    </div>
  );
}
