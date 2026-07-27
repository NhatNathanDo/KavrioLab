'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  X,
  Plus,
  CheckCircle2,
  Globe,
  Sparkles,
  Flame,
  Barcode,
  PieChart,
  ArrowRight,
  Filter,
  Utensils,
  Loader2,
} from 'lucide-react';
import { useTranslation } from '@/components/language-provider';
import { dictionaries } from '@/lib/translations/dictionaries';
import { PageTransition } from '@/components/shared/PageTransition';
import { Skeleton } from '@/components/ui/skeleton';

interface FoodItem {
  id: string;
  name: string;
  brand: string | null;
  servingSize: string | null;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  barcode: string | null;
  verified: boolean;
  isCustom: boolean;
  source: 'local' | 'off' | 'usda';
}

export default function NutritionPage() {
  const { t, language } = useTranslation();
  const dict = dictionaries[language].nutrition;

  const [query, setQuery] = useState('');
  const [source, setSource] = useState<'all' | 'local' | 'off' | 'usda'>('all');
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);

  // Selected food detail modal
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);

  // Custom food modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [customForm, setCustomForm] = useState({
    name: '',
    brand: '',
    servingSize: '100g',
    calories: '',
    protein: '',
    carbs: '',
    fat: '',
    barcode: '',
  });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 24,
    totalCount: 0,
    totalPages: 1,
  });

  const fetchFoods = useCallback(
    async (searchQuery: string, searchSource: 'all' | 'local' | 'off' | 'usda', searchPage: number = 1) => {

      setSearching(true);
      try {
        const res = await fetch(
          `/api/nutrition/foods?q=${encodeURIComponent(searchQuery)}&source=${searchSource}&page=${searchPage}&pageSize=24`
        );
        if (res.ok) {
          const data = await res.json();
          setFoods(data.foods || []);
          if (data.pagination) {
            setPagination(data.pagination);
          }
        }
      } catch (err) {
        console.error('Error fetching foods:', err);
      } finally {
        setLoading(false);
        setSearching(false);
      }
    },
    []
  );

  // When query or source changes, reset page to 1
  useEffect(() => {
    setPage(1);
  }, [query, source]);

  // Initial load & debounced search (600ms for OFF/all to respect 10 req/min rate limit, 250ms for local)
  useEffect(() => {
    const delay = source === 'local' ? 250 : 600;
    const timer = setTimeout(() => {
      fetchFoods(query, source, page);
    }, delay);

    return () => clearTimeout(timer);
  }, [query, source, page, fetchFoods]);

  const handleCreateCustomFood = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setCreateError(null);

    try {
      const payload = {
        name: customForm.name.trim(),
        brand: customForm.brand.trim() || null,
        servingSize: customForm.servingSize.trim() || '100g',
        calories: Number(customForm.calories) || 0,
        protein: Number(customForm.protein) || 0,
        carbs: Number(customForm.carbs) || 0,
        fat: Number(customForm.fat) || 0,
        barcode: customForm.barcode.trim() || null,
      };

      const res = await fetch('/api/nutrition/foods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        // Insert new custom food to top of list
        setFoods((prev) => [
          {
            id: data.food.id,
            name: data.food.name,
            brand: data.food.brand,
            servingSize: data.food.servingSize,
            calories: data.food.calories,
            protein: Number(data.food.protein),
            carbs: Number(data.food.carbs),
            fat: Number(data.food.fat),
            barcode: data.food.barcode,
            verified: false,
            isCustom: true,
            source: 'local',
          },
          ...prev,
        ]);
        setShowCreateModal(false);
        setCustomForm({
          name: '',
          brand: '',
          servingSize: '100g',
          calories: '',
          protein: '',
          carbs: '',
          fat: '',
          barcode: '',
        });
      } else {
        const errData = await res.json();
        setCreateError(
          typeof errData.error === 'string'
            ? errData.error
            : 'Please check invalid fields and try again.'
        );
      }
    } catch (err) {
      console.error('Error creating custom food:', err);
      setCreateError('An unexpected error occurred while saving.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <PageTransition>
      <div className="space-y-4 md:space-y-6 max-w-6xl mx-auto px-2 py-4 md:px-4 md:py-8 pb-16">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              {dict.title}
            </h1>
            <p className="text-xs md:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              {dict.subtitle}
            </p>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 font-semibold text-xs md:text-sm transition-all shadow-sm active:scale-[0.98] w-full sm:w-auto"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Create Custom Food</span>
          </button>
        </div>

        {/* Search & Filter Bar */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={dict.searchPlaceholder}
              className="w-full pl-12 pr-12 py-3 md:py-3.5 rounded-2xl bg-white dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 text-xs md:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all shadow-sm"
            />
            {query ? (
              <button
                onClick={() => setQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            ) : searching ? (
              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />
              </div>
            ) : null}
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1 py-0.5">
            <button
              onClick={() => setSource('all')}
              className={`whitespace-nowrap px-4 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all flex items-center gap-1.5 ${
                source === 'all'
                  ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-sm'
                  : 'bg-zinc-100 dark:bg-zinc-900/60 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800'
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              <span>{dict.filterAll}</span>
            </button>

            <button
              onClick={() => setSource('local')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all flex items-center gap-1.5 ${
                source === 'local'
                  ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-500/20'
                  : 'bg-zinc-100 dark:bg-zinc-900/60 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{dict.filterLocal}</span>
            </button>

            <button
              onClick={() => setSource('off')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all flex items-center gap-1.5 ${
                source === 'off'
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/20'
                  : 'bg-zinc-100 dark:bg-zinc-900/60 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>{dict.filterOpenFoodFacts}</span>
            </button>

            <button
              onClick={() => setSource('usda')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all flex items-center gap-1.5 ${
                source === 'usda'
                  ? 'bg-amber-600 text-white shadow-sm shadow-amber-500/20'
                  : 'bg-zinc-100 dark:bg-zinc-900/60 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{dict.filterUsda || 'USDA FoodData'}</span>
            </button>


            {searching && (
              <div className="ml-auto flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400 animate-pulse">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-500" />
                <span>{dict.loading}</span>
              </div>
            )}
          </div>
        </div>

        {/* Food Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="p-5 rounded-3xl border border-zinc-200 dark:border-zinc-800/80 space-y-4"
              >
                <Skeleton className="h-6 w-3/4 rounded-lg" />
                <Skeleton className="h-4 w-1/2 rounded-md" />
                <div className="flex gap-2 pt-2">
                  <Skeleton className="h-7 w-20 rounded-full" />
                  <Skeleton className="h-7 w-16 rounded-xl" />
                  <Skeleton className="h-7 w-16 rounded-xl" />
                </div>
              </div>
            ))}
          </div>
        ) : foods.length === 0 ? (
          <div className="text-center py-16 px-4 rounded-3xl border border-dashed border-zinc-300 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30">
            <Utensils className="w-12 h-12 mx-auto text-zinc-400 mb-3 opacity-60" />
            <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
              {dict.noResults}
            </h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-md mx-auto mt-1">
              {dict.noResultsDesc}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {foods.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => setSelectedFood(item)}
                className="p-5 rounded-3xl border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/60 hover:border-zinc-400 dark:hover:border-zinc-700 transition-all cursor-pointer group shadow-sm hover:shadow-md flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors line-clamp-1">
                      {item.name}
                    </h3>

                    {/* Source Badges with Explicit Readable Labels */}
                    {item.source === 'usda' ? (
                      <span
                        title={dict.usdaBadge || 'USDA FoodData'}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 font-bold text-[11px] shrink-0"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-amber-500" />
                        <span>{dict.usdaBadge || 'USDA FoodData'}</span>
                      </span>
                    ) : item.verified ? (
                      <span
                        title={dict.verifiedBadge}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 font-bold text-[11px] shrink-0"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{dict.verifiedBadge}</span>
                      </span>
                    ) : item.isCustom ? (
                      <span
                        title={dict.customBadge || 'Custom Food'}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-700 dark:text-purple-400 font-bold text-[11px] shrink-0"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>{dict.customBadge || 'Custom'}</span>
                      </span>
                    ) : (
                      <span
                        title={dict.offBadge}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-700 dark:text-indigo-400 font-bold text-[11px] shrink-0"
                      >
                        <Globe className="w-3.5 h-3.5" />
                        <span>{dict.offBadge}</span>
                      </span>
                    )}

                  </div>

                  <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider line-clamp-1">
                    {item.brand || 'Generic'} • {item.servingSize || '100g'}
                  </p>
                </div>

                {/* Macro Pills */}
                <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-zinc-100 dark:border-zinc-800/60">
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-bold text-xs">
                    <Flame className="w-3.5 h-3.5 fill-current" />
                    {item.calories} {dict.kcal}
                  </span>

                  <span className="px-2.5 py-1 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-semibold">
                    {item.protein}g P
                  </span>

                  <span className="px-2.5 py-1 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-semibold">
                    {item.carbs}g C
                  </span>

                  <span className="px-2.5 py-1 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-semibold">
                    {item.fat}g F
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Pagination Controls */}
        {!loading && foods.length > 0 && pagination.totalPages > 1 && (
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 py-4 px-6 bg-white dark:bg-zinc-900/60 rounded-3xl border border-zinc-200 dark:border-zinc-800/80 shadow-sm">
            <div className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
              Trang <span className="font-bold text-zinc-900 dark:text-zinc-100">{pagination.page}</span> / <span className="font-bold text-zinc-900 dark:text-zinc-100">{pagination.totalPages}</span> ({pagination.totalCount} món)
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setPage((p) => Math.max(1, p - 1));
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                disabled={pagination.page <= 1 || searching}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1.5"
              >
                ← Trang trước
              </button>
              <button
                onClick={() => {
                  setPage((p) => Math.min(pagination.totalPages, p + 1));
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                disabled={pagination.page >= pagination.totalPages || searching}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm shadow-emerald-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1.5"
              >
                Trang sau →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ─── Detail Modal ──────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {selectedFood && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 shadow-2xl space-y-6"
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs uppercase font-bold tracking-widest text-emerald-600 dark:text-emerald-400">
                      {selectedFood.brand || 'Generic'}
                    </span>
                    {selectedFood.verified && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
                        <CheckCircle2 className="w-3 h-3" />
                        Verified
                      </span>
                    )}
                  </div>
                  <h3 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                    {selectedFood.name}
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                    {dict.servingSize}: {selectedFood.servingSize || '100g'}
                  </p>
                </div>

                <button
                  onClick={() => setSelectedFood(null)}
                  className="p-2 rounded-xl text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Big Calorie Box */}
              <div className="p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/60 dark:border-zinc-800 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    {dict.calories}
                  </p>
                  <p className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-100 mt-0.5">
                    {selectedFood.calories}{' '}
                    <span className="text-base font-semibold text-zinc-500">{dict.kcal}</span>
                  </p>
                </div>
                {selectedFood.barcode && (
                  <div className="flex items-center gap-1.5 text-xs text-zinc-400 bg-white dark:bg-zinc-900 px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 font-mono">
                    <Barcode className="w-4 h-4" />
                    <span>{selectedFood.barcode}</span>
                  </div>
                )}
              </div>

              {/* Macro Bars */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                  <PieChart className="w-4 h-4 text-emerald-500" />
                  <span>{dict.detailMacros}</span>
                </h4>

                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                    <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">
                      {dict.protein}
                    </p>
                    <p className="text-lg font-extrabold text-emerald-700 dark:text-emerald-300 mt-0.5">
                      {selectedFood.protein}g
                    </p>
                  </div>

                  <div className="p-3 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-center">
                    <p className="text-[11px] font-bold text-sky-600 dark:text-sky-400 uppercase">
                      {dict.carbs}
                    </p>
                    <p className="text-lg font-extrabold text-sky-700 dark:text-sky-300 mt-0.5">
                      {selectedFood.carbs}g
                    </p>
                  </div>

                  <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-center">
                    <p className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase">
                      {dict.fat}
                    </p>
                    <p className="text-lg font-extrabold text-amber-700 dark:text-amber-300 mt-0.5">
                      {selectedFood.fat}g
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => setSelectedFood(null)}
                  className="px-5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 font-semibold text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  {dict.detailClose}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── Create Custom Food Modal ───────────────────────────────────────────── */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                    <Sparkles className="w-5 h-5" />
                  </span>
                  <div>
                    <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                      Create Custom Food
                    </h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      Save custom meals or ingredients to your verified local index.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-2 rounded-xl text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {createError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-medium">
                  {createError}
                </div>
              )}

              <form onSubmit={handleCreateCustomFood} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                    Food Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Grandma's Chicken Soup"
                    value={customForm.name}
                    onChange={(e) => setCustomForm({ ...customForm, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                      Brand / Source
                    </label>
                    <input
                      type="text"
                      placeholder="Optional"
                      value={customForm.brand}
                      onChange={(e) => setCustomForm({ ...customForm, brand: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                      Serving Size *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 100g or 1 bowl"
                      value={customForm.servingSize}
                      onChange={(e) => setCustomForm({ ...customForm, servingSize: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30 transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                  <div>
                    <label className="block text-xs font-bold text-emerald-600 dark:text-emerald-400 mb-1.5">
                      Calories (kcal) *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      max="10000"
                      placeholder="0"
                      value={customForm.calories}
                      onChange={(e) => setCustomForm({ ...customForm, calories: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                      Protein (g) *
                    </label>
                    <input
                      type="number"
                      required
                      step="0.1"
                      min="0"
                      max="1000"
                      placeholder="0"
                      value={customForm.protein}
                      onChange={(e) => setCustomForm({ ...customForm, protein: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 text-sm font-semibold focus:outline-none focus:ring-2 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                      Carbs (g) *
                    </label>
                    <input
                      type="number"
                      required
                      step="0.1"
                      min="0"
                      max="1000"
                      placeholder="0"
                      value={customForm.carbs}
                      onChange={(e) => setCustomForm({ ...customForm, carbs: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 text-sm font-semibold focus:outline-none focus:ring-2 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                      Fat (g) *
                    </label>
                    <input
                      type="number"
                      required
                      step="0.1"
                      min="0"
                      max="1000"
                      placeholder="0"
                      value={customForm.fat}
                      onChange={(e) => setCustomForm({ ...customForm, fat: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 text-sm font-semibold focus:outline-none focus:ring-2 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                    Barcode (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 8410000123456"
                    value={customForm.barcode}
                    onChange={(e) => setCustomForm({ ...customForm, barcode: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 text-sm font-mono focus:outline-none focus:ring-2 transition-all"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 font-semibold text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={creating}
                    className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-sm transition-all shadow-sm flex items-center gap-2 disabled:opacity-50"
                  >
                    {creating && <Loader2 className="w-4 h-4 animate-spin" />}
                    <span>Save Custom Food</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </PageTransition>
  );
}
