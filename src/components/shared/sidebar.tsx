'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import {
  LayoutDashboard,
  Dumbbell,
  Apple,
  Settings,
  LogOut,
  Activity,
  LayoutTemplate,
  History,
  CalendarDays,
  Utensils,
  ScanLine,
  ChefHat,
  ShoppingBag,
} from 'lucide-react';
import { useTranslation } from '../language-provider';

export default function Sidebar() {
  const pathname = usePathname();
  const { t } = useTranslation();

  const menuItems = [
    { name: t('sidebar.dashboard'), href: '/dashboard', icon: LayoutDashboard },
    { name: t('sidebar.workouts'), href: '/workouts', icon: Dumbbell },
    { name: t('sidebar.templates'), href: '/workouts/templates', icon: LayoutTemplate },
    { name: t('sidebar.history'), href: '/workouts/history', icon: History },
    { name: t('sidebar.schedule'), href: '/workouts/schedule', icon: CalendarDays },
    { name: t('sidebar.nutrition'), href: '/nutrition', icon: Apple },
    { name: (t('sidebar.dailyLog' as any) || 'Daily Tracker') as string, href: '/nutrition/daily', icon: Utensils },
    { name: (t('sidebar.scanner' as any) || 'Barcode Scanner') as string, href: '/nutrition/scanner', icon: ScanLine },
    { name: (t('sidebar.recipes' as any) || 'Recipes') as string, href: '/nutrition/recipes', icon: ChefHat },
    { name: (t('sidebar.planner' as any) || 'Shopping List') as string, href: '/nutrition/planner', icon: ShoppingBag },
    { name: t('sidebar.settings'), href: '/settings', icon: Settings },
  ];


  return (
    <aside className="w-64 my-4 ml-4 h-[calc(100vh-32px)] bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-3xl flex flex-col justify-between p-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] sticky top-4 transition-colors duration-200">
      <div className="space-y-8">
        {/* App Title */}
        <div className="flex items-center gap-2.5 px-2">
          <Activity className="w-5 h-5 text-zinc-900 dark:text-zinc-50" />
          <span className="font-semibold text-base tracking-tight text-zinc-900 dark:text-zinc-50">
            Kavrio<span className="font-light">Lab</span>
          </span>
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1.5">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all duration-150 ${
                  isActive
                    ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-sm font-bold'
                    : 'text-zinc-550 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 hover:bg-zinc-100 dark:hover:bg-zinc-900/30'
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Logout button */}
      <div>
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-xs font-semibold text-zinc-500 dark:text-zinc-400 hover:text-red-650 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all duration-150"
        >
          <LogOut className="w-4 h-4" />
          {t('common.logOut')}
        </button>
      </div>
    </aside>
  );
}
