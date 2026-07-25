'use client';

import React, { useMemo } from 'react';
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
  PanelLeftClose,
  PanelLeftOpen,
  Scale,
  Ruler,
  Camera,
  Droplets,
  Moon,
} from 'lucide-react';
import { useTranslation } from '../language-provider';
import { useSidebarStore } from '@/lib/stores/useSidebarStore';

interface MenuItem {
  name: string;
  href: string;
  icon: React.ElementType;
  exact?: boolean;
}

interface MenuGroup {
  titleKey: string;
  titleFallback: string;
  items: MenuItem[];
}

function SidebarComponent() {
  const pathname = usePathname();
  const { t } = useTranslation();
  const { isCollapsed, toggleSidebar } = useSidebarStore();

  const menuGroups: MenuGroup[] = useMemo(() => {
    return [
      {
        titleKey: 'sidebar.groupOverview',
        titleFallback: 'Overview',
        items: [
          {
            name: (t('sidebar.dashboard' as any) || 'Dashboard') as string,
            href: '/dashboard',
            icon: LayoutDashboard,
            exact: true,
          },
        ],
      },
      {
        titleKey: 'sidebar.groupWorkouts',
        titleFallback: 'Workouts',
        items: [
          {
            name: (t('sidebar.workouts' as any) || 'Workouts') as string,
            href: '/workouts',
            icon: Dumbbell,
            exact: true,
          },
          {
            name: (t('sidebar.templates' as any) || 'Templates') as string,
            href: '/workouts/templates',
            icon: LayoutTemplate,
          },
          {
            name: (t('sidebar.schedule' as any) || 'Schedule') as string,
            href: '/workouts/schedule',
            icon: CalendarDays,
          },
          {
            name: (t('sidebar.history' as any) || 'History') as string,
            href: '/workouts/history',
            icon: History,
          },
        ],
      },
      {
        titleKey: 'sidebar.groupNutrition',
        titleFallback: 'Nutrition',
        items: [
          {
            name: (t('sidebar.dailyLog' as any) || 'Daily Tracker') as string,
            href: '/nutrition/daily',
            icon: Utensils,
          },
          {
            name: (t('sidebar.nutrition' as any) || 'Food Search') as string,
            href: '/nutrition',
            icon: Apple,
            exact: true,
          },
          {
            name: (t('sidebar.scanner' as any) || 'Barcode Scanner') as string,
            href: '/nutrition/scanner',
            icon: ScanLine,
          },
          {
            name: (t('sidebar.recipes' as any) || 'Recipes') as string,
            href: '/nutrition/recipes',
            icon: ChefHat,
          },
          {
            name: (t('sidebar.planner' as any) || 'Shopping List') as string,
            href: '/nutrition/planner',
            icon: ShoppingBag,
          },
        ],
      },
      {
        titleKey: 'sidebar.groupBiometrics',
        titleFallback: 'Biometrics',
        items: [
          {
            name: (t('sidebar.weightTracker' as any) || 'Weight Tracker') as string,
            href: '/biometrics/weight',
            icon: Scale,
          },
          {
            name: (t('sidebar.measurementsTracker' as any) || 'Body Measurements') as string,
            href: '/biometrics/measurements',
            icon: Ruler,
          },
          {
            name: (t('sidebar.photosTracker' as any) || 'Progress Photos') as string,
            href: '/biometrics/photos',
            icon: Camera,
          },
          {
            name: (t('sidebar.waterTracker' as any) || 'Water Tracker') as string,
            href: '/biometrics/water',
            icon: Droplets,
          },
          {
            name: (t('sidebar.sleepTracker' as any) || 'Sleep & Recovery') as string,
            href: '/biometrics/sleep',
            icon: Moon,
          },
        ],
      },
      {
        titleKey: 'sidebar.groupSystem',
        titleFallback: 'System',
        items: [
          {
            name: (t('sidebar.settings' as any) || 'Settings') as string,
            href: '/settings',
            icon: Settings,
          },
        ],
      },
    ];
  }, [t]);

  const isLinkActive = (href: string, exact?: boolean) => {
    if (exact) {
      return pathname === href;
    }
    return pathname === href || pathname.startsWith(href + '/');
  };

  return (
    <aside
      className={`${
        isCollapsed ? 'w-20' : 'w-64'
      } my-4 ml-4 h-[calc(100vh-32px)] bg-white/80 dark:bg-zinc-950/80 border border-zinc-200/80 dark:border-zinc-900/90 rounded-[28px] flex flex-col justify-between p-4 shadow-[0_12px_40px_rgba(0,0,0,0.03)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.3)] sticky top-4 transition-all duration-300 ease-in-out shrink-0 select-none backdrop-blur-xl z-40`}
    >
      {/* Top Header & Collapse Toggle */}
      <div className="space-y-4">
        <div
          className={`flex items-center ${
            isCollapsed ? 'justify-center' : 'justify-between'
          } px-2 pt-1 pb-1`}
        >
          {!isCollapsed && (
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-2xl bg-zinc-900 dark:bg-zinc-100 flex items-center justify-center text-white dark:text-zinc-900 shadow-sm">
                <Activity className="w-4 h-4" />
              </div>
              <span className="font-bold text-base tracking-tight text-zinc-900 dark:text-zinc-50">
                Kavrio<span className="font-normal text-zinc-400 dark:text-zinc-500">Lab</span>
              </span>
            </div>
          )}

          {/* Toggle Rail Button */}
          <button
            onClick={toggleSidebar}
            aria-label={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            className="p-2 rounded-xl text-zinc-400 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-900/60 transition-all"
          >
            {isCollapsed ? (
              <PanelLeftOpen className="w-5 h-5 text-emerald-500" />
            ) : (
              <PanelLeftClose className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Scrollable Navigation Items */}
        <nav className="space-y-4 max-h-[calc(100vh-160px)] overflow-y-auto pr-0.5 scrollbar-none">
          {menuGroups.map((group, groupIdx) => {
            const groupTitle = (t(group.titleKey as any) || group.titleFallback) as string;

            return (
              <div key={groupIdx} className="space-y-1">
                {/* Section Header Title (Shown when expanded) */}
                {!isCollapsed && (
                  <div className="px-3 py-1 text-[10px] font-extrabold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                    {groupTitle}
                  </div>
                )}

                {/* Group Items */}
                <div className="space-y-1">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const active = isLinkActive(item.href, item.exact);

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        prefetch={true}
                        className={`group relative flex items-center ${
                          isCollapsed ? 'justify-center p-3' : 'gap-3 px-3.5 py-2.5'
                        } rounded-2xl text-xs font-semibold tracking-wide transition-all duration-150 ${
                          active
                            ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-sm font-bold'
                            : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 hover:bg-zinc-100/80 dark:hover:bg-zinc-900/60'
                        }`}
                      >
                        <Icon
                          className={`w-4 h-4 shrink-0 transition-transform duration-150 group-hover:scale-110 ${
                            active
                              ? 'text-emerald-400 dark:text-emerald-600'
                              : 'text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-800 dark:group-hover:text-zinc-200'
                          }`}
                        />

                        {!isCollapsed && <span className="truncate">{item.name}</span>}

                        {/* Hover Tooltip in Collapsed Mode */}
                        {isCollapsed && (
                          <div className="absolute left-14 px-3 py-1.5 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-bold shadow-xl opacity-0 group-hover:opacity-100 transition-all duration-150 pointer-events-none whitespace-nowrap z-50 border border-zinc-700/40 dark:border-zinc-300/40">
                            {item.name}
                          </div>
                        )}

                        {active && !isCollapsed && (
                          <span className="absolute right-2.5 w-1.5 h-1.5 rounded-full bg-emerald-400 dark:bg-emerald-600" />
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>
      </div>

      {/* Logout Footer */}
      <div className="pt-2 border-t border-zinc-100 dark:border-zinc-900/80">
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className={`flex items-center ${
            isCollapsed ? 'justify-center p-3' : 'justify-between px-3.5 py-2.5'
          } w-full rounded-2xl text-xs font-semibold text-zinc-500 dark:text-zinc-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50/80 dark:hover:bg-red-950/20 transition-all duration-150 group relative`}
        >
          <div className="flex items-center gap-3">
            <LogOut className="w-4 h-4 text-zinc-400 dark:text-zinc-500 group-hover:text-red-500 transition-colors" />
            {!isCollapsed && <span>{t('common.logOut')}</span>}
          </div>

          {/* Collapsed Tooltip for Logout */}
          {isCollapsed && (
            <div className="absolute left-14 px-3 py-1.5 rounded-xl bg-red-600 text-white text-xs font-bold shadow-xl opacity-0 group-hover:opacity-100 transition-all duration-150 pointer-events-none whitespace-nowrap z-50">
              {t('common.logOut')}
            </div>
          )}
        </button>
      </div>
    </aside>
  );
}

export default React.memo(SidebarComponent);
