'use client';

import React from 'react';
import { useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import { User, Sun, Moon } from 'lucide-react';
import { useTheme } from '../theme-provider';
import { useTranslation } from '../language-provider';

export default function Header() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage, t } = useTranslation();

  let pageTitleKey = 'sidebar.dashboard';
  if (pathname?.includes('/workouts')) pageTitleKey = 'sidebar.workouts';
  if (pathname?.includes('/nutrition')) pageTitleKey = 'sidebar.nutrition';
  if (pathname?.includes('/settings')) pageTitleKey = 'sidebar.settings';

  return (
    <header className="h-16 flex-shrink-0 bg-white/80 dark:bg-zinc-950/80 border border-zinc-200 dark:border-zinc-900 rounded-3xl px-6 flex items-center justify-between mx-4 mt-4 shadow-[0_8px_30px_rgb(0,0,0,0.01)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.15)] backdrop-blur-md transition-colors duration-200">
      <div>
        <h1 className="text-xs font-bold tracking-widest uppercase text-zinc-550 dark:text-zinc-400">
          {t(pageTitleKey)}
        </h1>
      </div>

      <div className="flex items-center gap-3">
        {/* Language Toggle */}
        <button
          onClick={() => setLanguage(language === 'en' ? 'vi' : 'en')}
          className="text-[10px] font-bold px-2 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 transition-all uppercase"
          aria-label="Toggle Language"
        >
          {language}
        </button>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 transition-all"
          aria-label="Toggle Theme"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* User profile */}
        <div className="flex items-center gap-3">
          {session?.user ? (
            <div className="flex items-center gap-2.5">
              <div className="text-right hidden sm:block">
                <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-50">
                  {session.user.name || 'User Account'}
                </div>
                <div className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium">
                  {session.user.email}
                </div>
              </div>
              <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-zinc-700 dark:text-zinc-300">
                <User className="w-4 h-4" />
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 animate-pulse">
              <div className="w-16 h-3 bg-zinc-200 dark:bg-zinc-800 rounded" />
              <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-800" />
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
