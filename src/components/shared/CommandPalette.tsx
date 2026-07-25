'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  X,
  LayoutDashboard,
  Dumbbell,
  LayoutTemplate,
  CalendarDays,
  History,
  Utensils,
  Apple,
  ScanLine,
  ChefHat,
  ShoppingBag,
  Settings,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { useTranslation } from '../language-provider';

interface CommandItem {
  id: string;
  name: string;
  category: 'navigation' | 'food';
  href?: string;
  icon: React.ElementType;
  keywords?: string[];
  action?: () => void;
  metadata?: string;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const router = useRouter();
  const { language } = useTranslation();

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [foodResults, setFoodResults] = useState<CommandItem[]>([]);
  const [isSearchingFood, setIsSearchingFood] = useState(false);

  // Static navigation routes
  const navItems: CommandItem[] = useMemo(
    () => [
      {
        id: 'nav-dashboard',
        name: language === 'vi' ? 'Bảng điều khiển (Dashboard)' : 'Dashboard',
        category: 'navigation',
        href: '/dashboard',
        icon: LayoutDashboard,
        keywords: ['home', 'overview', 'dashboard', 'trang chu', 'tong quan'],
      },
      {
        id: 'nav-workouts',
        name: language === 'vi' ? 'Luyện tập (Workouts Hub)' : 'Workouts Overview',
        category: 'navigation',
        href: '/workouts',
        icon: Dumbbell,
        keywords: ['workout', 'exercise', 'tap luyen', 'gym'],
      },
      {
        id: 'nav-templates',
        name: language === 'vi' ? 'Bài mẫu (Workout Templates)' : 'Workout Templates',
        category: 'navigation',
        href: '/workouts/templates',
        icon: LayoutTemplate,
        keywords: ['template', 'routine', 'bai mau'],
      },
      {
        id: 'nav-schedule',
        name: language === 'vi' ? 'Lịch tập tuần (Weekly Schedule)' : 'Weekly Schedule',
        category: 'navigation',
        href: '/workouts/schedule',
        icon: CalendarDays,
        keywords: ['schedule', 'calendar', 'lich tap'],
      },
      {
        id: 'nav-history',
        name: language === 'vi' ? 'Lịch sử tập (Workout History)' : 'Workout History',
        category: 'navigation',
        href: '/workouts/history',
        icon: History,
        keywords: ['history', 'logs', 'lich su'],
      },
      {
        id: 'nav-daily-nutrition',
        name: language === 'vi' ? 'Nhật ký dinh dưỡng hàng ngày' : 'Daily Nutrition Tracker',
        category: 'navigation',
        href: '/nutrition/daily',
        icon: Utensils,
        keywords: ['daily', 'nutrition', 'tracker', 'calories', 'macro', 'nhat ky', 'an uong'],
      },
      {
        id: 'nav-food-search',
        name: language === 'vi' ? 'Tra cứu thực phẩm (Food Database)' : 'Food Search Index',
        category: 'navigation',
        href: '/nutrition',
        icon: Apple,
        keywords: ['food', 'database', 'search', 'thuc pham', 'tim kiem'],
      },
      {
        id: 'nav-barcode',
        name: language === 'vi' ? 'Quét mã vạch (Barcode Scanner)' : 'Web Barcode Scanner',
        category: 'navigation',
        href: '/nutrition/scanner',
        icon: ScanLine,
        keywords: ['barcode', 'scanner', 'scan', 'ma vach', 'quet'],
      },
      {
        id: 'nav-recipes',
        name: language === 'vi' ? 'Công thức món (Recipes Creator)' : 'Custom Recipes Creator',
        category: 'navigation',
        href: '/nutrition/recipes',
        icon: ChefHat,
        keywords: ['recipe', 'custom', 'cong thuc', 'mon an'],
      },
      {
        id: 'nav-planner',
        name: language === 'vi' ? 'Đi chợ & Lịch ăn (Shopping List)' : 'Shopping List & Meal Plan',
        category: 'navigation',
        href: '/nutrition/planner',
        icon: ShoppingBag,
        keywords: ['shopping', 'planner', 'meal plan', 'di cho', 'ke hoach'],
      },
      {
        id: 'nav-settings',
        name: language === 'vi' ? 'Cài đặt hệ thống (Settings)' : 'Settings',
        category: 'navigation',
        href: '/settings',
        icon: Settings,
        keywords: ['settings', 'config', 'cai dat'],
      },
    ],
    [language]
  );

  // Debounced search for food database if query typed
  useEffect(() => {
    if (!query.trim() || query.trim().length < 2) {
      setFoodResults([]);
      setIsSearchingFood(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingFood(true);
      try {
        const res = await fetch(`/api/nutrition/foods?q=${encodeURIComponent(query.trim())}&pageSize=5`);
        if (res.ok) {
          const data = await res.json();
          const items: CommandItem[] = (data.foods || []).map((f: any) => ({
            id: `food-${f.id}`,
            name: f.name,
            category: 'food',
            href: `/nutrition?q=${encodeURIComponent(f.name)}`,
            icon: Apple,
            metadata: `${f.calories} kcal • ${f.protein}g P • ${f.carbs}g C • ${f.fat}g F`,
          }));
          setFoodResults(items);
        }
      } catch (e) {
        console.error('Command palette food search error:', e);
      } finally {
        setIsSearchingFood(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Filter navigation items
  const filteredNav = useMemo(() => {
    if (!query.trim()) return navItems;
    const q = query.toLowerCase().trim();
    return navItems.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.keywords?.some((k) => k.toLowerCase().includes(q))
    );
  }, [query, navItems]);

  const allFilteredItems = useMemo(() => [...filteredNav, ...foodResults], [filteredNav, foodResults]);

  // Handle execution of selected item
  const handleSelectItem = useCallback(
    (item: CommandItem) => {
      if (item.action) {
        item.action();
      } else if (item.href) {
        router.push(item.href);
      }
      onClose();
    },
    [router, onClose]
  );

  // Keyboard navigation inside command palette
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (allFilteredItems.length > 0 ? (prev + 1) % allFilteredItems.length : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (allFilteredItems.length > 0 ? (prev - 1 + allFilteredItems.length) % allFilteredItems.length : 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (allFilteredItems[selectedIndex]) {
          handleSelectItem(allFilteredItems[selectedIndex]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, allFilteredItems, handleSelectItem, onClose]);

  // Reset selected index when query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-start justify-center pt-16 md:pt-24 p-4 animate-in fade-in duration-200">
      {/* Backdrop overlay click */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Spotlight Command Modal */}
      <div className="relative w-full max-w-xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] z-10">
        {/* Input Header */}
        <div className="flex items-center px-4 py-3.5 border-b border-zinc-100 dark:border-zinc-800/80">
          <Search className="w-5 h-5 text-zinc-400 dark:text-zinc-500 mr-3 shrink-0" />
          <input
            type="text"
            autoFocus
            placeholder={
              language === 'vi'
                ? 'Tìm nhanh tính năng, bài tập, món ăn... (vd: Nhật ký, Phở bò)'
                : 'Search pages, workouts, foods... (e.g. Daily Tracker, Whey)'
            }
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-sm font-semibold text-zinc-900 dark:text-zinc-50 focus:outline-none placeholder-zinc-400 dark:placeholder-zinc-500"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:block text-[10px] font-mono font-bold px-2 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-400 border border-zinc-200 dark:border-zinc-700 ml-2 shrink-0">
            ESC
          </kbd>
        </div>

        {/* Results Body */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4 max-h-[60vh] scrollbar-none">
          {isSearchingFood && (
            <div className="py-4 text-center text-xs font-semibold text-zinc-400 animate-pulse">
              {language === 'vi' ? 'Đang tra cứu kho thực phẩm...' : 'Searching food database...'}
            </div>
          )}

          {allFilteredItems.length === 0 && !isSearchingFood ? (
            <div className="py-12 text-center space-y-2">
              <p className="text-sm font-bold text-zinc-500 dark:text-zinc-400">
                {language === 'vi' ? 'Không tìm thấy kết quả nào' : 'No matching results found'}
              </p>
              <p className="text-xs text-zinc-400">
                {language === 'vi' ? 'Thử gõ từ khóa khác như "Daily", "Phở", "Lịch tập"' : 'Try searching for "Daily", "Workout", or "Food"'}
              </p>
            </div>
          ) : (
            <>
              {/* Navigation Items Group */}
              {filteredNav.length > 0 && (
                <div className="space-y-1">
                  <div className="px-3 py-1 text-[10px] font-extrabold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                    {language === 'vi' ? 'Trang & Tính năng' : 'Pages & Features'}
                  </div>
                  {filteredNav.map((item: CommandItem) => {
                    const globalIdx = allFilteredItems.findIndex((i: CommandItem) => i.id === item.id);
                    const isSelected = globalIdx === selectedIndex;
                    const Icon = item.icon;

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleSelectItem(item)}
                        onMouseEnter={() => setSelectedIndex(globalIdx)}
                        className={`w-full text-left flex items-center justify-between px-3.5 py-2.5 rounded-2xl cursor-pointer text-xs font-bold transition-all ${
                          isSelected
                            ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-sm'
                            : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100/80 dark:hover:bg-zinc-800/60'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className={`w-4 h-4 shrink-0 ${isSelected ? 'text-emerald-400 dark:text-emerald-600' : 'text-zinc-400 dark:text-zinc-500'}`} />
                          <span>{item.name}</span>
                        </div>
                        <ArrowRight className={`w-3.5 h-3.5 transition-transform ${isSelected ? 'translate-x-1 opacity-100' : 'opacity-0'}`} />
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Food Items Group */}
              {foodResults.length > 0 && (
                <div className="space-y-1 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                  <div className="px-3 py-1 text-[10px] font-extrabold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3" />
                    <span>{language === 'vi' ? 'Thực phẩm khớp từ khóa' : 'Matching Foods'}</span>
                  </div>
                  {foodResults.map((item: CommandItem) => {
                    const globalIdx = allFilteredItems.findIndex((i: CommandItem) => i.id === item.id);
                    const isSelected = globalIdx === selectedIndex;
                    const Icon = item.icon;

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleSelectItem(item)}
                        onMouseEnter={() => setSelectedIndex(globalIdx)}
                        className={`w-full text-left flex items-center justify-between px-3.5 py-2.5 rounded-2xl cursor-pointer text-xs font-bold transition-all ${
                          isSelected
                            ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-sm'
                            : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100/80 dark:hover:bg-zinc-800/60'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className={`w-4 h-4 shrink-0 ${isSelected ? 'text-emerald-400 dark:text-emerald-600' : 'text-emerald-500'}`} />
                          <div>
                            <p className="font-bold line-clamp-1 text-left">{item.name}</p>
                            {item.metadata && (
                              <p className={`text-[10px] font-medium text-left ${isSelected ? 'text-zinc-300 dark:text-zinc-600' : 'text-zinc-400'}`}>
                                {item.metadata}
                              </p>
                            )}
                          </div>
                        </div>
                        <ArrowRight className={`w-3.5 h-3.5 transition-transform ${isSelected ? 'translate-x-1 opacity-100' : 'opacity-0'}`} />
                      </button>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Shortcut Hints */}
        <div className="px-4 py-2.5 bg-zinc-50 dark:bg-zinc-950/60 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between text-[11px] font-semibold text-zinc-400 dark:text-zinc-500">
          <div className="flex items-center gap-3">
            <span>
              <kbd className="font-mono px-1 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 text-[10px]">↑</kbd>{' '}
              <kbd className="font-mono px-1 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 text-[10px]">↓</kbd>{' '}
              {language === 'vi' ? 'Di chuyển' : 'Navigate'}
            </span>
            <span>
              <kbd className="font-mono px-1 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 text-[10px]">↵</kbd>{' '}
              {language === 'vi' ? 'Chọn' : 'Select'}
            </span>
          </div>
          <span>
            <kbd className="font-mono px-1 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 text-[10px]">ESC</kbd>{' '}
            {language === 'vi' ? 'Đóng' : 'Close'}
          </span>
        </div>
      </div>
    </div>
  );
}
