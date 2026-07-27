'use client';

import React, { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
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
  HeartPulse,
  Sparkles,
  CheckSquare,
  Calendar,
  ChevronRight,
  Pin,
  PinOff,
  Lock,
  Unlock,
  CreditCard,
  ShieldCheck,
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
  id: string;
  titleKey: string;
  titleFallback: string;
  items: MenuItem[];
}

function SidebarComponent() {
  const pathname = usePathname();
  const { t, language } = useTranslation();
  const { isCollapsed, toggleSidebar, isMobileOpen, closeMobile } = useSidebarStore();

  useEffect(() => {
    closeMobile();
  }, [pathname, closeMobile]);

  const menuGroups: MenuGroup[] = useMemo(() => {
    return [
      {
        id: 'overview',
        titleKey: 'sidebar.groupOverview',
        titleFallback: 'Overview',
        items: [
          {
            name: (t('sidebar.dashboard' as any) || 'Dashboard') as string,
            href: '/dashboard',
            icon: LayoutDashboard,
            exact: true,
          },
          {
            name: (t('sidebar.analytics' as any) || 'Progression Analytics') as string,
            href: '/analytics',
            icon: Activity,
          },
          {
            name: (t('sidebar.coach' as any) || 'AI Fitness Coach') as string,
            href: '/coach',
            icon: Sparkles,
          },
        ],
      },
      {
        id: 'workouts',
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
        id: 'nutrition',
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
            exact: true,
          },
          {
            name: (t('sidebar.aiScanner' as any) || 'AI Food Scanner') as string,
            href: '/nutrition/scanner/ai',
            icon: Sparkles,
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
        id: 'biometrics',
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
          {
            name: (t('sidebar.cycleTracker' as any) || 'Cycle & Ovulation') as string,
            href: '/biometrics/cycle',
            icon: HeartPulse,
          },
        ],
      },
      {
        id: 'schedule',
        titleKey: 'sidebar.groupSchedule',
        titleFallback: 'Schedule & Habits',
        items: [
          {
            name: (t('sidebar.habits' as any) || 'Habits') as string,
            href: '/habits',
            icon: CheckSquare,
          },
          {
            name: (t('sidebar.calendar' as any) || 'Fitness Calendar') as string,
            href: '/calendar',
            icon: Calendar,
          },
        ],
      },
      {
        id: 'system',
        titleKey: 'sidebar.groupSystem',
        titleFallback: 'System',
        items: [
          {
            name: (t('sidebar.billing' as any) || 'Billing & Pro') as string,
            href: '/settings/billing',
            icon: CreditCard,
          },
          {
            name: (t('sidebar.settings' as any) || 'Settings') as string,
            href: '/settings',
            icon: Settings,
            exact: true,
          },
          {
            name: (t('sidebar.admin' as any) || 'Admin Portal') as string,
            href: '/admin',
            icon: ShieldCheck,
          },
        ],
      },
    ];
  }, [t]);

  // Lookup map for flat items
  const allItemsMap = useMemo(() => {
    const map = new Map<string, MenuItem>();
    for (const g of menuGroups) {
      for (const item of g.items) {
        map.set(item.href, item);
      }
    }
    return map;
  }, [menuGroups]);

  const isLinkActive = (href: string, exact?: boolean) => {
    if (exact) {
      return pathname === href;
    }
    return pathname === href || pathname.startsWith(href + '/');
  };

  // Track expanded groups
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    overview: true,
    workouts: false,
    nutrition: false,
    biometrics: false,
    schedule: false,
    system: false,
  });

  // Track pinned items and groups locked to "Always Open"
  const [pinnedItems, setPinnedItems] = useState<string[]>([]);
  const [alwaysOpenGroups, setAlwaysOpenGroups] = useState<string[]>([]);

  // Load settings from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedItems = localStorage.getItem('kavriolab_pinned_items');
        if (savedItems) setPinnedItems(JSON.parse(savedItems));
        const savedAlwaysOpen = localStorage.getItem('kavriolab_always_open_groups');
        if (savedAlwaysOpen) setAlwaysOpenGroups(JSON.parse(savedAlwaysOpen));
      } catch (e) {
        console.error('Failed to load nav settings:', e);
      }
    }
  }, []);

  // Automatically expand group containing active route
  useEffect(() => {
    for (const group of menuGroups) {
      const hasActiveChild = group.items.some((item) => isLinkActive(item.href, item.exact));
      if (hasActiveChild) {
        setOpenGroups((prev) => ({ ...prev, [group.id]: true }));
      }
    }
  }, [pathname, menuGroups]);

  const toggleGroup = (groupId: string) => {
    setOpenGroups((prev) => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  const togglePinItem = (href: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setPinnedItems((prev) => {
      const next = prev.includes(href) ? prev.filter((h) => h !== href) : [...prev, href];
      localStorage.setItem('kavriolab_pinned_items', JSON.stringify(next));
      return next;
    });
  };

  const toggleAlwaysOpenGroup = (groupId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setAlwaysOpenGroups((prev) => {
      const next = prev.includes(groupId) ? prev.filter((g) => g !== groupId) : [...prev, groupId];
      localStorage.setItem('kavriolab_always_open_groups', JSON.stringify(next));
      return next;
    });
  };

  const hasPinned = pinnedItems.length > 0;

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:flex ${
          isCollapsed ? 'w-20' : 'w-64'
        } my-4 ml-4 h-[calc(100vh-32px)] bg-white/80 dark:bg-zinc-950/80 border border-zinc-200/80 dark:border-zinc-900/90 rounded-[28px] flex-col justify-between p-4 shadow-[0_12px_40px_rgba(0,0,0,0.03)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.3)] sticky top-4 transition-all duration-300 ease-in-out shrink-0 select-none backdrop-blur-xl z-40`}
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
            className="p-2 rounded-xl text-zinc-400 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-900/60 transition-all cursor-pointer"
          >
            {isCollapsed ? (
              <PanelLeftOpen className="w-5 h-5 text-emerald-500" />
            ) : (
              <PanelLeftClose className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Scrollable Navigation Items */}
        <nav className="space-y-2.5 max-h-[calc(100vh-170px)] overflow-y-auto pr-0.5 scrollbar-none">

          {/* 📌 PINNED INDIVIDUAL SHORTCUTS */}
          {hasPinned && !isCollapsed && (
            <div className="space-y-1 bg-amber-500/5 dark:bg-amber-500/10 p-2.5 rounded-2xl border border-amber-500/20">
              <div className="px-2.5 py-1 flex items-center justify-between text-[10px] font-extrabold uppercase tracking-widest text-amber-600 dark:text-amber-400">
                <span className="flex items-center gap-1.5">
                  <Pin className="w-3 h-3 fill-amber-500 text-amber-500" />
                  {language === 'vi' ? 'Đã Ghim Yêu Thích' : 'Pinned Shortcuts'}
                </span>
                <span className="text-[9px] bg-amber-500/20 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded-full font-bold">
                  {pinnedItems.length}
                </span>
              </div>

              {/* Pinned Individual Items */}
              <div className="space-y-1">
                {pinnedItems.map((href) => {
                  const item = allItemsMap.get(href);
                  if (!item) return null;
                  const Icon = item.icon;
                  const active = isLinkActive(item.href, item.exact);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      prefetch={true}
                      className={`group relative flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                        active
                          ? 'bg-amber-500 text-white font-bold shadow-sm'
                          : 'text-zinc-700 dark:text-zinc-300 hover:bg-amber-500/10'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Icon className="w-3.5 h-3.5 shrink-0 text-amber-500" />
                        <span className="truncate">{item.name}</span>
                      </div>
                      <button
                        onClick={(e) => togglePinItem(item.href, e)}
                        title="Unpin"
                        className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-500 transition-opacity cursor-pointer"
                      >
                        <PinOff className="w-3 h-3" />
                      </button>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* MAIN MENU GROUPS */}
          {menuGroups.map((group) => {
            const groupTitle = (t(group.titleKey as any) || group.titleFallback) as string;
            const isAlwaysOpen = alwaysOpenGroups.includes(group.id);
            const isOpen = isAlwaysOpen || Boolean(openGroups[group.id]);
            const hasActiveChild = group.items.some((item) => isLinkActive(item.href, item.exact));

            // Overview Section
            if (group.id === 'overview') {
              return (
                <div key={group.id} className="space-y-1">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const active = isLinkActive(item.href, item.exact);
                    const isPinned = pinnedItems.includes(item.href);

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        prefetch={true}
                        className={`group relative flex items-center justify-between ${
                          isCollapsed ? 'p-3 justify-center' : 'px-3.5 py-2.5'
                        } rounded-2xl text-xs font-semibold tracking-wide transition-all duration-150 ${
                          active
                            ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-sm font-bold'
                            : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 hover:bg-zinc-100/80 dark:hover:bg-zinc-900/60'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <Icon
                            className={`w-4 h-4 shrink-0 transition-transform duration-150 group-hover:scale-110 ${
                              active
                                ? 'text-emerald-400 dark:text-emerald-600'
                                : 'text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-800 dark:group-hover:text-zinc-200'
                            }`}
                          />
                          {!isCollapsed && <span suppressHydrationWarning className="truncate">{item.name}</span>}
                        </div>

                        {!isCollapsed && (
                          <button
                            onClick={(e) => togglePinItem(item.href, e)}
                            title={isPinned ? 'Unpin shortcut' : 'Pin shortcut to top'}
                            className={`p-1 transition-all cursor-pointer ${
                              isPinned
                                ? 'text-amber-500 opacity-100'
                                : 'text-zinc-400 opacity-0 group-hover:opacity-100 hover:text-amber-500'
                            }`}
                          >
                            <Pin className={`w-3 h-3 ${isPinned ? 'fill-amber-500' : ''}`} />
                          </button>
                        )}

                        {isCollapsed && (
                          <div className="absolute left-14 px-3 py-1.5 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-bold shadow-xl opacity-0 group-hover:opacity-100 transition-all duration-150 pointer-events-none whitespace-nowrap z-50">
                            {item.name}
                          </div>
                        )}
                      </Link>
                    );
                  })}
                </div>
              );
            }

            // Collapsed Rail Mode
            if (isCollapsed) {
              return (
                <div key={group.id} className="space-y-1 pt-1 border-t border-zinc-100/80 dark:border-zinc-900/60">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const active = isLinkActive(item.href, item.exact);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        prefetch={true}
                        className={`group relative flex items-center justify-center p-3 rounded-2xl text-xs transition-all ${
                          active
                            ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-bold'
                            : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-900/60'
                        }`}
                      >
                        <Icon className={`w-4 h-4 ${active ? 'text-emerald-400 dark:text-emerald-600' : ''}`} />
                        <div className="absolute left-14 px-3 py-1.5 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-bold shadow-xl opacity-0 group-hover:opacity-100 transition-all duration-150 pointer-events-none whitespace-nowrap z-50">
                          {item.name}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              );
            }

            // Expanded Collapsible Group Header with Group Always-Open Lock Button
            return (
              <div key={group.id} className="space-y-1">
                <div
                  className={`group/header flex items-center justify-between px-3 py-2 rounded-xl text-[11px] font-extrabold uppercase tracking-widest transition-all cursor-pointer ${
                    hasActiveChild
                      ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-500/10'
                      : 'text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-100/60 dark:hover:bg-zinc-900/40'
                  }`}
                  onClick={() => {
                    if (!isAlwaysOpen) toggleGroup(group.id);
                  }}
                >
                  <span className="truncate flex items-center gap-1.5">
                    {groupTitle}
                    {isAlwaysOpen && (
                      <span className="text-[9px] font-bold text-indigo-500 bg-indigo-500/10 px-1.5 py-0.2 rounded-md tracking-normal normal-case">
                        {language === 'vi' ? 'Luôn mở' : 'Locked open'}
                      </span>
                    )}
                  </span>

                  <div className="flex items-center gap-1">
                    {/* Always Open Toggle Lock Icon */}
                    <button
                      onClick={(e) => toggleAlwaysOpenGroup(group.id, e)}
                      title={
                        isAlwaysOpen
                          ? language === 'vi' ? 'Đổi sang tự động đóng gập' : 'Switch to Auto-collapse'
                          : language === 'vi' ? 'Khóa nhóm luôn luôn mở' : 'Lock Group Always Open'
                      }
                      className={`p-1 transition-all cursor-pointer ${
                        isAlwaysOpen
                          ? 'text-indigo-500 opacity-100'
                          : 'text-zinc-400 opacity-0 group-hover/header:opacity-100 hover:text-indigo-500'
                      }`}
                    >
                      {isAlwaysOpen ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                    </button>

                    {!isAlwaysOpen && (
                      <ChevronRight
                        className={`w-3.5 h-3.5 transition-transform duration-200 ${
                          isOpen ? 'rotate-90 text-zinc-600 dark:text-zinc-300' : 'text-zinc-400'
                        }`}
                      />
                    )}
                  </div>
                </div>

                {/* Collapsible Sub-Items with Item Pin Button */}
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease: 'easeInOut' }}
                      className="overflow-hidden"
                    >
                      <div className="ml-3.5 pl-2.5 border-l-2 border-zinc-100 dark:border-zinc-800/80 space-y-1 py-1">
                        {group.items.map((item) => {
                          const Icon = item.icon;
                          const active = isLinkActive(item.href, item.exact);
                          const isItemPinned = pinnedItems.includes(item.href);

                          return (
                            <Link
                              key={item.href}
                              href={item.href}
                              prefetch={true}
                              className={`group/item relative flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium tracking-wide transition-all duration-150 ${
                                active
                                  ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-bold shadow-sm'
                                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 hover:bg-zinc-100/80 dark:hover:bg-zinc-900/60'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <Icon
                                  className={`w-3.5 h-3.5 shrink-0 transition-transform duration-150 group-hover/item:scale-110 ${
                                    active
                                      ? 'text-emerald-400 dark:text-emerald-600'
                                      : 'text-zinc-400 dark:text-zinc-500 group-hover/item:text-zinc-800 dark:group-hover/item:text-zinc-200'
                                  }`}
                                />
                                <span className="truncate">{item.name}</span>
                              </div>

                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={(e) => togglePinItem(item.href, e)}
                                  title={isItemPinned ? 'Unpin shortcut' : 'Pin shortcut to top'}
                                  className={`p-0.5 transition-all cursor-pointer ${
                                    isItemPinned
                                      ? 'text-amber-500 opacity-100'
                                      : 'text-zinc-400 opacity-0 group-hover/item:opacity-100 hover:text-amber-500'
                                  }`}
                                >
                                  <Pin className={`w-3 h-3 ${isItemPinned ? 'fill-amber-500' : ''}`} />
                                </button>
                                {active && (
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 dark:bg-emerald-600 shrink-0" />
                                )}
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
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
          } w-full rounded-2xl text-xs font-semibold text-zinc-500 dark:text-zinc-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50/80 dark:hover:bg-red-950/20 transition-all duration-150 group relative cursor-pointer`}
        >
          <div className="flex items-center gap-3">
            <LogOut className="w-4 h-4 text-zinc-400 dark:text-zinc-500 group-hover:text-red-500 transition-colors" />
            {!isCollapsed && <span>{t('common.logOut')}</span>}
          </div>

          {isCollapsed && (
            <div className="absolute left-14 px-3 py-1.5 rounded-xl bg-red-600 text-white text-xs font-bold shadow-xl opacity-0 group-hover:opacity-100 transition-all duration-150 pointer-events-none whitespace-nowrap z-50">
              {t('common.logOut')}
            </div>
          )}
        </button>
      </div>
    </aside>

    {/* Mobile Slide-out Drawer */}
    <AnimatePresence>
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeMobile}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
          />

          {/* Mobile Sheet */}
          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            className="relative w-[280px] max-w-[85vw] h-full bg-white dark:bg-zinc-950 p-4 shadow-2xl flex flex-col justify-between overflow-y-auto border-r border-zinc-200 dark:border-zinc-900 z-50"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between px-2 pt-1 pb-3 border-b border-zinc-100 dark:border-zinc-900">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-2xl bg-zinc-900 dark:bg-zinc-100 flex items-center justify-center text-white dark:text-zinc-900 shadow-sm">
                    <Activity className="w-4 h-4" />
                  </div>
                  <span className="font-bold text-base tracking-tight text-zinc-900 dark:text-zinc-50">
                    Kavrio<span className="font-normal text-zinc-400 dark:text-zinc-500">Lab</span>
                  </span>
                </div>

                <button
                  onClick={closeMobile}
                  className="p-2 rounded-xl text-zinc-400 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-900/60 transition-all cursor-pointer"
                >
                  <PanelLeftClose className="w-5 h-5" />
                </button>
              </div>

              {/* Mobile Nav Content */}
              <nav className="space-y-4">
                {menuGroups.map((group) => {
                  const groupTitle = t(group.titleKey as any) || group.titleFallback;
                  return (
                    <div key={group.id} className="space-y-1">
                      <div className="px-2 text-[10px] font-extrabold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                        {groupTitle}
                      </div>
                      <div className="space-y-1 pl-1">
                        {group.items.map((item) => {
                          const active = isLinkActive(item.href, item.exact);
                          const Icon = item.icon;
                          return (
                            <Link
                              key={item.href}
                              href={item.href}
                              onClick={closeMobile}
                              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-colors ${
                                active
                                  ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-bold'
                                  : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900'
                              }`}
                            >
                              <Icon className="w-4 h-4" />
                              <span>{item.name}</span>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </nav>
            </div>

            {/* Mobile Logout Button */}
            <div className="pt-3 border-t border-zinc-100 dark:border-zinc-900/80">
              <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="flex items-center justify-between px-3.5 py-2.5 w-full rounded-2xl text-xs font-semibold text-zinc-500 dark:text-zinc-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50/80 dark:hover:bg-red-950/20 transition-all"
              >
                <div className="flex items-center gap-3">
                  <LogOut className="w-4 h-4 text-zinc-400" />
                  <span>{t('common.logOut')}</span>
                </div>
              </button>
            </div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  </>
  );
}

export default React.memo(SidebarComponent);
