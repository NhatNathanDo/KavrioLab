'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/components/language-provider';
import PortalModal from '@/components/shared/PortalModal';
import { useOfflineNutritionSync } from '@/lib/hooks/useOfflineNutritionSync';
import {
  Utensils,
  Plus,
  Trash2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Flame,
  Activity,
  Wifi,
  WifiOff,
  Search,
  Sparkles,
  CheckCircle2,
  X,
  RefreshCw,
  Clock,
} from 'lucide-react';

interface FoodItemProfile {
  id: string;
  name: string;
  brand?: string;
  servingSize?: string;
  calories: number;
  protein: number | string;
  carbs: number | string;
  fat: number | string;
  verified?: boolean;
}

interface LoggedMealItem {
  id: string;
  servingQuantity: number | string;
  unit?: string;
  foodItem: FoodItemProfile;
  calculated: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
}

interface MealLogSection {
  id: string;
  name: string;
  orderIndex: number;
  items: LoggedMealItem[];
  totals: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
}

interface DailyLogResponse {
  dailyLogId: string;
  date: string;
  notes?: string;
  targets: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  consumed: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  meals: MealLogSection[];
}

export default function DailyNutritionPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { language } = useTranslation();

  const [currentDate, setCurrentDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [dailyData, setDailyData] = useState<DailyLogResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeMealModal, setActiveMealModal] = useState<string | null>(null); // 'Breakfast', 'Lunch', etc.
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<FoodItemProfile[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [selectedFood, setSelectedFood] = useState<FoodItemProfile | null>(null);
  const [quantityInput, setQuantityInput] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const fetchDailyData = useCallback(async (dateStr: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/nutrition/daily?date=${dateStr}`);
      if (res.ok) {
        const data: DailyLogResponse = await res.json();
        setDailyData(data);
      }
    } catch (err) {
      console.error('Error fetching daily log:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const { isOnline, queue, isSyncing, logMutationOffline, syncNow } = useOfflineNutritionSync(() => {
    fetchDailyData(currentDate);
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    if (status === 'authenticated') {
      fetchDailyData(currentDate);
    }
  }, [status, currentDate, router, fetchDailyData]);

  // Food search inside modal
  useEffect(() => {
    if (!activeMealModal || !searchQuery.trim() || searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/nutrition/foods?q=${encodeURIComponent(searchQuery.trim())}&source=all&pageSize=15`);
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data.foods || []);
        }
      } catch (e) {
        console.error('Search modal error:', e);
      } finally {
        setIsSearching(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [searchQuery, activeMealModal]);

  const handleDateChange = (daysOffset: number) => {
    const dt = new Date(currentDate);
    dt.setDate(dt.getDate() + daysOffset);
    setCurrentDate(dt.toISOString().split('T')[0]);
  };

  const handleAddItemToMeal = async () => {
    if (!selectedFood || !activeMealModal || !dailyData) return;
    setIsSubmitting(true);

    try {
      if (!isOnline) {
        // Log to offline queue
        logMutationOffline({
          date: currentDate,
          mealName: activeMealModal,
          foodItemId: selectedFood.id,
          servingQuantity: quantityInput,
          unit: 'serving',
        });
        setActiveMealModal(null);
        setSelectedFood(null);
        setSearchQuery('');
        return;
      }

      const res = await fetch('/api/nutrition/daily/item', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dailyLogId: dailyData.dailyLogId,
          mealName: activeMealModal,
          foodItemId: selectedFood.id,
          servingQuantity: quantityInput,
          unit: 'serving',
          foodItem: selectedFood,
        }),
      });

      if (res.ok) {
        setActiveMealModal(null);
        setSelectedFood(null);
        setSearchQuery('');
        fetchDailyData(currentDate);
      }
    } catch (e) {
      console.error('Error logging meal item:', e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    try {
      const res = await fetch(`/api/nutrition/daily/item?id=${itemId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        fetchDailyData(currentDate);
      }
    } catch (e) {
      console.error('Error deleting item:', e);
    }
  };

  const targets = dailyData?.targets || { calories: 2200, protein: 150, carbs: 250, fat: 65 };
  const consumed = dailyData?.consumed || { calories: 0, protein: 0, carbs: 0, fat: 0 };

  const calProgress = Math.min(100, Math.round((consumed.calories / Math.max(1, targets.calories)) * 100));
  const proProgress = Math.min(100, Math.round((consumed.protein / Math.max(1, targets.protein)) * 100));
  const carProgress = Math.min(100, Math.round((consumed.carbs / Math.max(1, targets.carbs)) * 100));
  const fatProgress = Math.min(100, Math.round((consumed.fat / Math.max(1, targets.fat)) * 100));

  return (
    <div className="min-h-screen bg-zinc-50/60 dark:bg-zinc-950/40 p-6 md:p-10 space-y-8 max-w-7xl mx-auto">
      {/* Header & Date Selector */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 bg-white dark:bg-zinc-900/80 p-6 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 shadow-sm backdrop-blur-md">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/20 flex items-center justify-center border border-emerald-500/20">
              <Utensils className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                {language === 'vi' ? 'Nhật ký dinh dưỡng hàng ngày' : 'Daily Nutrition Tracker'}
              </h1>
              <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                {language === 'vi'
                  ? 'Theo dõi lượng calo và đa lượng theo từng bữa ăn'
                  : 'Log calories and macros across breakfast, lunch, dinner, and snacks'}
              </p>
            </div>
          </div>
        </div>

        {/* Date Controls & Offline Indicator & AI Scanner Link */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-end flex-wrap">
          <button
            onClick={() => router.push('/nutrition/scanner/ai')}
            className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs shadow-md shadow-indigo-500/20 transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-indigo-200" />
            <span>{language === 'vi' ? 'Quét Món AI' : 'AI Food Scanner'}</span>
          </button>

          {!isOnline && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-xs font-bold">
              <WifiOff className="w-3.5 h-3.5" />
              <span>{language === 'vi' ? 'Ngoại tuyến (Lưu tạm)' : 'Offline Mode (Queue active)'}</span>
            </span>
          )}
          {isOnline && queue.length > 0 && (
            <button
              onClick={syncNow}
              disabled={isSyncing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-700 dark:text-indigo-400 text-xs font-bold hover:bg-indigo-500/20 transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{language === 'vi' ? `Đồng bộ ${queue.length} mục` : `Sync ${queue.length} Queued`}</span>
            </button>
          )}

          <div className="flex items-center gap-1.5 bg-zinc-100 dark:bg-zinc-800/80 p-1 rounded-2xl border border-zinc-200 dark:border-zinc-700">
            <button
              onClick={() => handleDateChange(-1)}
              aria-label="Previous day"
              className="p-2 rounded-xl hover:bg-white dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2 px-3 py-1.5 font-bold text-xs text-zinc-800 dark:text-zinc-200">
              <Calendar className="w-4 h-4 text-emerald-500" />
              <span>
                {new Date(currentDate).toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
            </div>
            <button
              onClick={() => handleDateChange(1)}
              aria-label="Next day"
              className="p-2 rounded-xl hover:bg-white dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Macro Rings / Overview Dashboard */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-pulse">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-40 bg-zinc-200 dark:bg-zinc-800 rounded-3xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Calorie Card */}
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 shadow-sm relative overflow-hidden flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                {language === 'vi' ? 'Năng lượng' : 'Calories'}
              </span>
              <div className="w-8 h-8 rounded-full bg-orange-500/10 flex items-center justify-center">
                <Flame className="w-4 h-4 text-orange-500" />
              </div>
            </div>
            <div className="mt-4 space-y-1">
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
                  {consumed.calories.toLocaleString()}
                </span>
                <span className="text-sm font-semibold text-zinc-400">/ {targets.calories.toLocaleString()} kcal</span>
              </div>
              <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-orange-500 to-amber-500 h-full transition-all duration-500 rounded-full"
                  style={{ width: `${calProgress}%` }}
                />
              </div>
            </div>
            <div className="mt-4 text-[11px] font-bold text-zinc-500 dark:text-zinc-400 flex justify-between">
              <span>{calProgress}% {language === 'vi' ? 'mục tiêu' : 'of goal'}</span>
              <span>{Math.max(0, targets.calories - consumed.calories)} kcal {language === 'vi' ? 'còn lại' : 'remaining'}</span>
            </div>
          </div>

          {/* Protein Card */}
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                {language === 'vi' ? 'Đạm (Protein)' : 'Protein'}
              </span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                {proProgress}%
              </span>
            </div>
            <div className="mt-4 space-y-1">
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-50">{consumed.protein}g</span>
                <span className="text-xs font-semibold text-zinc-400">/ {targets.protein}g</span>
              </div>
              <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-full transition-all duration-500 rounded-full"
                  style={{ width: `${proProgress}%` }}
                />
              </div>
            </div>
          </div>

          {/* Carbs Card */}
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                {language === 'vi' ? 'Tinh bột (Carbs)' : 'Carbs'}
              </span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400">
                {carProgress}%
              </span>
            </div>
            <div className="mt-4 space-y-1">
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-50">{consumed.carbs}g</span>
                <span className="text-xs font-semibold text-zinc-400">/ {targets.carbs}g</span>
              </div>
              <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-amber-500 h-full transition-all duration-500 rounded-full"
                  style={{ width: `${carProgress}%` }}
                />
              </div>
            </div>
          </div>

          {/* Fat Card */}
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                {language === 'vi' ? 'Chất béo (Fat)' : 'Fat'}
              </span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                {fatProgress}%
              </span>
            </div>
            <div className="mt-4 space-y-1">
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-50">{consumed.fat}g</span>
                <span className="text-xs font-semibold text-zinc-400">/ {targets.fat}g</span>
              </div>
              <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-indigo-500 h-full transition-all duration-500 rounded-full"
                  style={{ width: `${fatProgress}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Meals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {(dailyData?.meals || [
          { id: '1', name: 'Breakfast', orderIndex: 0, items: [], totals: { calories: 0, protein: 0, carbs: 0, fat: 0 } },
          { id: '2', name: 'Lunch', orderIndex: 1, items: [], totals: { calories: 0, protein: 0, carbs: 0, fat: 0 } },
          { id: '3', name: 'Dinner', orderIndex: 2, items: [], totals: { calories: 0, protein: 0, carbs: 0, fat: 0 } },
          { id: '4', name: 'Snacks', orderIndex: 3, items: [], totals: { calories: 0, protein: 0, carbs: 0, fat: 0 } },
        ]).map((meal) => (
          <div
            key={meal.id}
            className="bg-white dark:bg-zinc-900/90 rounded-3xl p-6 border border-zinc-200/80 dark:border-zinc-800 shadow-sm flex flex-col justify-between space-y-4"
          >
            {/* Meal Header */}
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center font-bold text-xs text-zinc-700 dark:text-zinc-300">
                  {meal.name === 'Breakfast' ? '🍳' : meal.name === 'Lunch' ? '🥗' : meal.name === 'Dinner' ? '🥩' : '🍎'}
                </div>
                <div>
                  <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-50">
                    {language === 'vi'
                      ? meal.name === 'Breakfast'
                        ? 'Bữa Sáng'
                        : meal.name === 'Lunch'
                          ? 'Bữa Trưa'
                          : meal.name === 'Dinner'
                            ? 'Bữa Tối'
                            : 'Bữa Nhẹ'
                      : meal.name}
                  </h3>
                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    {meal.totals.calories} kcal • {meal.totals.protein}g P
                  </span>
                </div>
              </div>
              <button
                onClick={() => {
                  setActiveMealModal(meal.name);
                  setSelectedFood(null);
                  setSearchQuery('');
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-bold text-xs hover:opacity-90 transition-all shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{language === 'vi' ? 'Thêm món' : 'Add Food'}</span>
              </button>
            </div>

            {/* Meal Items List */}
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {meal.items.length === 0 ? (
                <div className="py-6 text-center">
                  <p className="text-xs font-medium text-zinc-400 italic">
                    {language === 'vi' ? 'Chưa ghi nhận món ăn nào trong bữa này' : 'No foods logged for this meal yet'}
                  </p>
                </div>
              ) : (
                meal.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-150 dark:border-zinc-700/60 hover:border-emerald-500/30 transition-all"
                  >
                    <div className="space-y-0.5">
                      <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100 line-clamp-1">
                        {item.foodItem?.name || 'Logged Food'}
                      </p>
                      <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                        {item.servingQuantity} {item.unit || 'serving'} ({item.foodItem?.servingSize || '100g'}) •{' '}
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                          {item.calculated?.calories} kcal
                        </span>
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteItem(item.id)}
                      aria-label="Delete item"
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Food Search Drawer / Modal */}
      <PortalModal
        isOpen={!!activeMealModal}
        onClose={() => setActiveMealModal(null)}
        maxWidth="lg"
        className="flex flex-col max-h-[80vh] overflow-hidden !p-0"
      >
            <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg text-zinc-900 dark:text-zinc-50">
                  {language === 'vi' ? `Thêm vào ${activeMealModal}` : `Add Food to ${activeMealModal}`}
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {language === 'vi' ? 'Tìm món ăn từ kho hoặc nhập mã vạch' : 'Search local & OpenFoodFacts database'}
                </p>
              </div>
              <button
                onClick={() => setActiveMealModal(null)}
                aria-label="Close modal"
                className="p-2 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {selectedFood ? (
              <div className="p-6 space-y-6 flex-1 overflow-y-auto">
                <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl space-y-1">
                  <h4 className="font-bold text-base text-zinc-900 dark:text-zinc-50">{selectedFood.name}</h4>
                  <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
                    {selectedFood.brand || 'Generic'} • {selectedFood.servingSize || '100g'}
                  </p>
                </div>

                <div className="space-y-2">
                  <label htmlFor="quantity-input" className="text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-300">
                    {language === 'vi' ? 'Số lượng khẩu phần (Serving Quantity)' : 'Serving Quantity (e.g. 1, 1.5, 2)'}
                  </label>
                  <input
                    id="quantity-input"
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={quantityInput}
                    onChange={(e) => setQuantityInput(Math.max(0.1, parseFloat(e.target.value) || 1))}
                    className="w-full px-4 py-3 rounded-2xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 font-bold text-lg text-zinc-900 dark:text-zinc-100"
                  />
                </div>

                <div className="grid grid-cols-4 gap-3">
                  <div className="p-3 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-center">
                    <span className="block text-[10px] font-bold text-zinc-400 uppercase">Calo</span>
                    <span className="text-base font-extrabold text-orange-500">
                      {Math.round(selectedFood.calories * quantityInput)}
                    </span>
                  </div>
                  <div className="p-3 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-center">
                    <span className="block text-[10px] font-bold text-zinc-400 uppercase">Đạm</span>
                    <span className="text-base font-extrabold text-emerald-500">
                      {(Number(selectedFood.protein) * quantityInput).toFixed(1)}g
                    </span>
                  </div>
                  <div className="p-3 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-center">
                    <span className="block text-[10px] font-bold text-zinc-400 uppercase">Tinh bột</span>
                    <span className="text-base font-extrabold text-amber-500">
                      {(Number(selectedFood.carbs) * quantityInput).toFixed(1)}g
                    </span>
                  </div>
                  <div className="p-3 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-center">
                    <span className="block text-[10px] font-bold text-zinc-400 uppercase">Chất béo</span>
                    <span className="text-base font-extrabold text-indigo-500">
                      {(Number(selectedFood.fat) * quantityInput).toFixed(1)}g
                    </span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setSelectedFood(null)}
                    className="flex-1 py-3 rounded-2xl font-bold text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
                  >
                    {language === 'vi' ? 'Chọn lại' : 'Back to Search'}
                  </button>
                  <button
                    onClick={handleAddItemToMeal}
                    disabled={isSubmitting}
                    className="flex-1 py-3 rounded-2xl font-bold text-xs bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                  >
                    {isSubmitting
                      ? 'Saving...'
                      : language === 'vi'
                        ? 'Ghi vào nhật ký'
                        : 'Log to Meal'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-6 space-y-4 flex-1 overflow-y-auto">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-zinc-400" />
                  <input
                    type="text"
                    autoFocus
                    placeholder={language === 'vi' ? 'Gõ tên món ăn (vd: Phở bò, Trứng, Whey...)' : 'Type food name or barcode...'}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-2xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-semibold focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {isSearching && (
                  <div className="py-8 text-center text-xs font-semibold text-zinc-400 animate-pulse">
                    {language === 'vi' ? 'Đang tìm kiếm món ăn...' : 'Searching foods...'}
                  </div>
                )}

                <div className="space-y-2">
                  {searchResults.map((f) => (
                    <button
                      key={f.id}
                      onClick={() => {
                        setSelectedFood(f);
                        setQuantityInput(1);
                      }}
                      className="w-full text-left p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 hover:bg-emerald-500/10 border border-zinc-200/60 dark:border-zinc-700/60 transition-all flex items-center justify-between"
                    >
                      <div>
                        <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 line-clamp-1">{f.name}</p>
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">
                          {f.brand || 'Generic'} • {f.servingSize || '100g'}
                        </p>
                      </div>
                      <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 shrink-0 ml-3">
                        {f.calories} kcal
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
      </PortalModal>
    </div>
  );
}
