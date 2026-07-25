'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import { Sun, Moon, Search, Sparkles, ChevronRight } from 'lucide-react';
import { useTheme } from '../theme-provider';
import { useTranslation } from '../language-provider';
import { CommandPalette } from './CommandPalette';

export default function Header() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage } = useTranslation();
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  // Global keydown listener for ⌘K / Ctrl+K shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  interface Crumb {
    label: string;
    href?: string;
  }

  // Dynamic breadcrumb generation
  const getBreadcrumbs = (): Crumb[] => {
    if (!pathname || pathname === '/dashboard') {
      return [
        { label: 'KavrioLab', href: '/dashboard' },
        { label: language === 'vi' ? 'Bảng điều khiển' : 'Dashboard' },
      ];
    }

    const segments = pathname.split('/').filter(Boolean);
    const crumbs: Crumb[] = [{ label: 'KavrioLab', href: '/dashboard' }];

    if (segments[0] === 'workouts') {
      crumbs.push({ label: language === 'vi' ? 'Luyện tập' : 'Workouts', href: '/workouts' });
      if (segments[1] === 'templates') crumbs.push({ label: language === 'vi' ? 'Bài mẫu' : 'Templates' });
      if (segments[1] === 'schedule') crumbs.push({ label: language === 'vi' ? 'Lịch tập tuần' : 'Schedule' });
      if (segments[1] === 'history') crumbs.push({ label: language === 'vi' ? 'Lịch sử' : 'History' });
      if (segments[1] === 'active') crumbs.push({ label: language === 'vi' ? 'Đang tập' : 'Live Session' });
    } else if (segments[0] === 'nutrition') {
      crumbs.push({ label: language === 'vi' ? 'Dinh dưỡng' : 'Nutrition', href: '/nutrition' });
      if (segments[1] === 'daily') crumbs.push({ label: language === 'vi' ? 'Nhật ký hàng ngày' : 'Daily Tracker' });
      if (segments[1] === 'scanner') crumbs.push({ label: language === 'vi' ? 'Quét mã vạch' : 'Barcode Scanner' });
      if (segments[1] === 'recipes') crumbs.push({ label: language === 'vi' ? 'Công thức món' : 'Recipes' });
      if (segments[1] === 'planner') crumbs.push({ label: language === 'vi' ? 'Đi chợ & Lịch ăn' : 'Planner' });
    } else if (segments[0] === 'biometrics') {
      crumbs.push({ label: language === 'vi' ? 'Sinh học & Thể chất' : 'Biometrics', href: '/biometrics/weight' });
      if (segments[1] === 'weight') crumbs.push({ label: language === 'vi' ? 'Theo dõi cân nặng' : 'Weight Tracker' });
      if (segments[1] === 'measurements') crumbs.push({ label: language === 'vi' ? 'Số đo cơ thể' : 'Body Measurements' });
      if (segments[1] === 'photos') crumbs.push({ label: language === 'vi' ? 'Ảnh tiến trình' : 'Progress Photos' });
      if (segments[1] === 'water') crumbs.push({ label: language === 'vi' ? 'Theo dõi uống nước' : 'Water Tracker' });
      if (segments[1] === 'sleep') crumbs.push({ label: language === 'vi' ? 'Giấc ngủ & Phục hồi' : 'Sleep Analytics' });
    } else if (segments[0] === 'coach') {
      crumbs.push({ label: language === 'vi' ? 'AI Coach Thể Chất' : 'AI Fitness Coach' });
    } else if (segments[0] === 'settings') {
      crumbs.push({ label: language === 'vi' ? 'Cài đặt' : 'Settings' });
    }

    return crumbs;
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <>
      <header className="h-16 flex-shrink-0 bg-white/80 dark:bg-zinc-950/80 border border-zinc-200/80 dark:border-zinc-900/90 rounded-[28px] px-6 flex items-center justify-between mx-4 mt-4 shadow-[0_8px_30px_rgb(0,0,0,0.02)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] backdrop-blur-xl transition-all duration-200 select-none z-30">
        {/* Breadcrumb Navigation Trail */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-1">
          {breadcrumbs.map((crumb, idx) => (
            <React.Fragment key={`${crumb.label}-${idx}`}>
              {idx > 0 && <ChevronRight className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-600 shrink-0" />}
              <span
                className={`text-xs whitespace-nowrap transition-colors ${
                  idx === breadcrumbs.length - 1
                    ? 'text-zinc-900 dark:text-zinc-50 font-bold'
                    : 'text-zinc-500 dark:text-zinc-400 font-medium hover:text-zinc-800 dark:hover:text-zinc-200'
                }`}
              >
                {crumb.label}
              </span>
            </React.Fragment>
          ))}
        </div>

        {/* Center / Right Action Controls */}
        <div className="flex items-center gap-3">
          {/* Caloric Coach Active Badge */}
          <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[11px] font-extrabold tracking-wide">
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            <span>{language === 'vi' ? 'Coach TDEE Đang chạy' : 'Coach Active'}</span>
          </div>

          {/* Quick Search Cmd+K Trigger Pill */}
          <button
            onClick={() => setIsCommandPaletteOpen(true)}
            className="hidden md:flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 text-xs font-semibold text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-200 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all cursor-pointer"
          >
            <Search className="w-3.5 h-3.5" />
            <span className="text-[11px]">{language === 'vi' ? 'Tìm nhanh...' : 'Quick search...'}</span>
            <kbd className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400">
              ⌘K
            </kbd>
          </button>

          {/* Language Toggle Pill */}
          <button
            onClick={() => setLanguage(language === 'en' ? 'vi' : 'en')}
            className="text-[10px] font-bold px-2.5 py-1.5 rounded-xl border border-zinc-200/80 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 transition-all uppercase"
            aria-label="Toggle Language"
          >
            {language}
          </button>

          {/* Theme Toggle Pill */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl border border-zinc-200/80 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 transition-all"
            aria-label="Toggle Theme"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-zinc-700" />}
          </button>

          {/* User Profile Card */}
          <div className="flex items-center gap-3 pl-2 border-l border-zinc-200/80 dark:border-zinc-800">
            {session?.user ? (
              <div className="flex items-center gap-2.5">
                <div className="text-right hidden sm:block">
                  <div className="text-xs font-bold text-zinc-900 dark:text-zinc-50">
                    {session.user.name || 'User Account'}
                  </div>
                  <div className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium truncate max-w-[120px]">
                    {session.user.email}
                  </div>
                </div>
                <div className="w-8 h-8 rounded-2xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-extrabold flex items-center justify-center text-xs shadow-sm">
                  {(session.user.name?.[0] || 'U').toUpperCase()}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 animate-pulse">
                <div className="w-16 h-3 bg-zinc-200 dark:bg-zinc-800 rounded" />
                <div className="w-8 h-8 rounded-2xl bg-zinc-200 dark:bg-zinc-800" />
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Command Palette Modal */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
      />
    </>
  );
}
