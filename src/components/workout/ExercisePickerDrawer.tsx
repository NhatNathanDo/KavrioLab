'use client';

import { useState, useCallback, useEffect } from 'react';
import { X, Search, Dumbbell } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '../language-provider';

type ExerciseCategory =
  | 'CHEST' | 'BACK' | 'SHOULDERS' | 'BICEPS' | 'TRICEPS'
  | 'LEGS' | 'GLUTES' | 'CORE' | 'CARDIO' | 'FULL_BODY' | 'OTHER';

interface ExerciseSearchResult {
  id: string;
  name: string;
  slug: string;
  category: ExerciseCategory;
  primaryMuscle: string;
  equipment: string;
}

interface ExercisePickerDrawerProps {
  open: boolean;
  onClose: () => void;
  onSelect: (exerciseId: string, name: string) => void;
}

const CATEGORIES: Array<{ value: ExerciseCategory | ''; labelKey: string }> = [
  { value: '', labelKey: 'workouts.categories.all' },
  { value: 'CHEST', labelKey: 'workouts.categories.chest' },
  { value: 'BACK', labelKey: 'workouts.categories.back' },
  { value: 'SHOULDERS', labelKey: 'workouts.categories.shoulders' },
  { value: 'BICEPS', labelKey: 'workouts.categories.biceps' },
  { value: 'TRICEPS', labelKey: 'workouts.categories.triceps' },
  { value: 'LEGS', labelKey: 'workouts.categories.legs' },
  { value: 'GLUTES', labelKey: 'workouts.categories.glutes' },
  { value: 'CORE', labelKey: 'workouts.categories.core' },
];

const EQUIPMENT_EMOJI: Record<string, string> = {
  BARBELL: '🏋️',
  DUMBBELL: '💪',
  CABLE: '⛓️',
  MACHINE: '⚙️',
  BODYWEIGHT: '🧘',
  KETTLEBELL: '🔔',
  RESISTANCE_BAND: '🪢',
  SMITH_MACHINE: '🏗️',
  OTHER: '•',
};

function getExerciseMode(equipment: string, locale: string): { label: string; className: string } {
  const isVi = locale === 'vi-VN' || locale === 'vi';
  if (equipment === 'BODYWEIGHT') {
    return {
      label: 'Calisthenics',
      className: 'bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 border border-blue-100/50 dark:border-blue-900/30'
    };
  }
  if (['BARBELL', 'CABLE', 'SMITH_MACHINE', 'MACHINE'].includes(equipment)) {
    return {
      label: isVi ? 'Phòng Gym' : 'Gym',
      className: 'bg-purple-50 dark:bg-purple-950/20 text-purple-600 dark:text-purple-400 border border-purple-100/50 dark:border-purple-900/30'
    };
  }
  return {
    label: isVi ? 'Nhà / Gym' : 'Home / Gym',
    className: 'bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border border-amber-100/50 dark:border-amber-900/30'
  };
}

export function ExercisePickerDrawer({ open, onClose, onSelect }: ExercisePickerDrawerProps) {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<ExerciseCategory | ''>('');
  const [exercises, setExercises] = useState<ExerciseSearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchExercises = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (query) params.set('q', query);
      if (category) params.set('category', category);
      const res = await fetch(`/api/exercises?${params.toString()}`);
      const data = await res.json() as { exercises: ExerciseSearchResult[] };
      setExercises(data.exercises ?? []);
    } catch {
      setExercises([]);
    } finally {
      setLoading(false);
    }
  }, [query, category]);

  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(fetchExercises, 200);
    return () => clearTimeout(timer);
  }, [open, fetchExercises]);

  const handleSelect = (ex: ExerciseSearchResult) => {
    onSelect(ex.id, ex.name);
    onClose();
    setQuery('');
    setCategory('');
  };

  const setTabsRef = useCallback((el: HTMLDivElement | null) => {
    if (!el) return;
    let isDown = false;
    let startX = 0;
    let scrollLeft = 0;

    const handleMouseDown = (e: MouseEvent) => {
      isDown = true;
      startX = e.pageX - el.offsetLeft;
      scrollLeft = el.scrollLeft;
    };

    const handleMouseLeave = () => {
      isDown = false;
    };

    const handleMouseUp = () => {
      isDown = false;
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - el.offsetLeft;
      const walk = (x - startX) * 1.5;
      el.scrollLeft = scrollLeft - walk;
    };

    const handleWheel = (e: WheelEvent) => {
      if (e.deltaY !== 0) {
        e.preventDefault();
        el.scrollLeft += e.deltaY;
      }
    };

    el.addEventListener('mousedown', handleMouseDown);
    el.addEventListener('mouseleave', handleMouseLeave);
    el.addEventListener('mouseup', handleMouseUp);
    el.addEventListener('mousemove', handleMouseMove);
    el.addEventListener('wheel', handleWheel, { passive: false });
  }, []);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-xs"
          />

          {/* Drawer / Centered Modal */}
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="relative z-10 w-full max-w-md max-h-[80vh] bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-3xl flex flex-col overflow-hidden shadow-2xl"
          >

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100 dark:border-zinc-900 flex-shrink-0">
              <div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
                  {t('workouts.pickerTitle')}
                </h3>
                <p className="text-[10px] text-zinc-400 mt-0.5">
                  {t('workouts.foundCount').replace('{count}', String(exercises.length))}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                aria-label="Close exercise picker"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Search */}
            <div className="px-5 py-3 border-b border-zinc-100 dark:border-zinc-900 flex-shrink-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
                <input
                  type="search"
                  placeholder={t('workouts.searchPlaceholder')}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-700 text-zinc-900 dark:text-zinc-50 placeholder:text-zinc-400"
                  autoFocus
                />
              </div>
            </div>

            {/* Category tabs */}
            <div className="relative flex-shrink-0 border-b border-zinc-100 dark:border-zinc-900">
              {/* Left fade overlay */}
              <div className="absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-white dark:from-zinc-950 to-transparent pointer-events-none z-10" />

              <div
                ref={setTabsRef}
                className="flex gap-2 px-6 py-3 overflow-x-auto scrollbar-none select-none cursor-grab active:cursor-grabbing"
              >
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => setCategory(cat.value)}
                    className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-[10px] font-bold transition-all duration-150 ${
                      category === cat.value
                        ? 'bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900'
                        : 'bg-zinc-50 dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                    }`}
                  >
                    {t(cat.labelKey as any)}
                  </button>
                ))}
              </div>

              {/* Right fade overlay */}
              <div className="absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-white dark:from-zinc-950 to-transparent pointer-events-none z-10" />
            </div>

            {/* Exercise list */}
            <div className="flex-1 overflow-y-auto px-5 py-3 space-y-1.5 bg-zinc-50/50 dark:bg-zinc-900/20">
              {loading ? (
                <div className="space-y-2 py-4">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="h-14 bg-zinc-100 dark:bg-zinc-900 rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : exercises.length === 0 ? (
                <div className="py-16 text-center space-y-3">
                  <Dumbbell className="w-8 h-8 text-zinc-200 dark:text-zinc-800 mx-auto" />
                  <p className="text-xs text-zinc-400">
                    {t('workouts.noExercisesFound')}
                  </p>
                </div>
              ) : (
                exercises.map((ex) => (
                  <button
                    key={ex.id}
                    type="button"
                    onClick={() => handleSelect(ex)}
                    className="w-full flex items-center gap-3 px-4 py-3 bg-white dark:bg-zinc-950 hover:bg-zinc-50 dark:hover:bg-zinc-900/80 border border-zinc-150 dark:border-zinc-900 rounded-2xl text-left transition-all duration-150 shadow-[0_4px_12px_rgba(0,0,0,0.01)] hover:shadow-sm"
                  >
                    <span className="text-base flex-shrink-0" aria-hidden="true">
                      {EQUIPMENT_EMOJI[ex.equipment] ?? '•'}
                    </span>
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <div className="flex items-center gap-2 flex-wrap min-w-0">
                        <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-50 truncate">
                          {ex.name}
                        </p>
                        {(() => {
                          const mode = getExerciseMode(ex.equipment, t('common.locale' as any));
                          return (
                            <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wider flex-shrink-0 ${mode.className}`}>
                              {mode.label}
                            </span>
                          );
                        })()}
                      </div>
                      <p className="text-[10px] text-zinc-400 font-medium">
                        {t(`workouts.categories.${ex.category.toLowerCase()}` as any)} ·{' '}
                        {ex.primaryMuscle.replace('_', ' ').toLowerCase()}
                      </p>
                    </div>
                    <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-650 flex-shrink-0 bg-zinc-50 dark:bg-zinc-900 px-2 py-1 rounded-md">
                      + Add
                    </span>
                  </button>
                ))
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
