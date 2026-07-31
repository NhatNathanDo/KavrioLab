'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/components/language-provider';
import PortalModal from '@/components/shared/PortalModal';
import {
  ChefHat,
  Plus,
  Trash2,
  Search,
  CheckCircle2,
  X,
  Sparkles,
  ArrowLeft,
  Flame,
  Clock,
  Users,
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
}

interface RecipeIngredientItem {
  foodItemId: string;
  foodItem?: FoodItemProfile;
  servingQuantity: number;
  unit: string;
}

interface SavedRecipe {
  id: string;
  name: string;
  description?: string;
  servings: number;
  prepTimeMin?: number;
  ingredients: {
    id: string;
    servingQuantity: number | string;
    unit?: string;
    foodItem: FoodItemProfile;
  }[];
  totals: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  perServing: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
}

export default function RecipesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { language } = useTranslation();

  const [recipes, setRecipes] = useState<SavedRecipe[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showBuilder, setShowBuilder] = useState<boolean>(false);

  // Builder State
  const [recipeName, setRecipeName] = useState<string>('');
  const [recipeDescription, setRecipeDescription] = useState<string>('');
  const [recipeServings, setRecipeServings] = useState<number>(2);
  const [prepTimeMin, setPrepTimeMin] = useState<number>(15);
  const [ingredients, setIngredients] = useState<RecipeIngredientItem[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<FoodItemProfile[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const fetchRecipes = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/nutrition/recipes');
      if (res.ok) {
        const data = await res.json();
        setRecipes(data || []);
      }
    } catch (e) {
      console.error('Error fetching recipes:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      fetchRecipes();
    }
  }, [status, router, fetchRecipes]);

  // Food search for ingredient builder
  useEffect(() => {
    if (!showBuilder || !searchQuery.trim() || searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/nutrition/foods?q=${encodeURIComponent(searchQuery.trim())}&source=all&pageSize=10`);
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data.foods || []);
        }
      } catch (e) {
        console.error('Search error:', e);
      } finally {
        setIsSearching(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [searchQuery, showBuilder]);

  const handleAddIngredient = (food: FoodItemProfile) => {
    setIngredients((prev) => [
      ...prev,
      {
        foodItemId: food.id,
        foodItem: food,
        servingQuantity: 1,
        unit: 'serving',
      },
    ]);
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleRemoveIngredient = (index: number) => {
    setIngredients((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateQuantity = (index: number, qty: number) => {
    setIngredients((prev) =>
      prev.map((item, i) => (i === index ? { ...item, servingQuantity: Math.max(0.1, qty) } : item))
    );
  };

  const handleSaveRecipe = async () => {
    if (!recipeName.trim() || ingredients.length === 0) return;
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/nutrition/recipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: recipeName.trim(),
          description: recipeDescription.trim(),
          servings: recipeServings,
          prepTimeMin: prepTimeMin,
          ingredients: ingredients.map((ing) => ({
            foodItemId: ing.foodItemId,
            servingQuantity: ing.servingQuantity,
            unit: ing.unit,
          })),
        }),
      });

      if (res.ok) {
        setShowBuilder(false);
        setRecipeName('');
        setRecipeDescription('');
        setIngredients([]);
        fetchRecipes();
      }
    } catch (e) {
      console.error('Error saving recipe:', e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteRecipe = async (id: string) => {
    try {
      const res = await fetch(`/api/nutrition/recipes?id=${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        fetchRecipes();
      }
    } catch (e) {
      console.error('Error deleting recipe:', e);
    }
  };

  // Calculate live builder totals
  const builderTotals = ingredients.reduce(
    (acc, ing) => {
      const f = ing.foodItem;
      if (!f) return acc;
      const q = ing.servingQuantity;
      return {
        calories: acc.calories + Math.round(f.calories * q),
        protein: Number((acc.protein + Number(f.protein) * q).toFixed(1)),
        carbs: Number((acc.carbs + Number(f.carbs) * q).toFixed(1)),
        fat: Number((acc.fat + Number(f.fat) * q).toFixed(1)),
      };
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  const builderPerServing = {
    calories: Math.round(builderTotals.calories / Math.max(1, recipeServings)),
    protein: Number((builderTotals.protein / Math.max(1, recipeServings)).toFixed(1)),
    carbs: Number((builderTotals.carbs / Math.max(1, recipeServings)).toFixed(1)),
    fat: Number((builderTotals.fat / Math.max(1, recipeServings)).toFixed(1)),
  };

  return (
    <div className="min-h-screen bg-zinc-50/60 dark:bg-zinc-950/40 p-6 md:p-10 space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 bg-white dark:bg-zinc-900/80 p-6 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 shadow-sm backdrop-blur-md">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/nutrition')}
            aria-label="Back to nutrition search"
            className="p-2.5 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="w-10 h-10 rounded-2xl bg-purple-500/10 dark:bg-purple-500/20 flex items-center justify-center border border-purple-500/20">
            <ChefHat className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              {language === 'vi' ? 'Sáng tạo Công thức & Món ăn (M15)' : 'Custom Recipes & Meal Builder'}
            </h1>
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              {language === 'vi'
                ? 'Tổng hợp nhiều nguyên liệu, tính toán tự động calo & đa lượng trên từng phần ăn'
                : 'Combine multiple ingredients and automatically compute macro splits per serving'}
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowBuilder(true)}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-500/20 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>{language === 'vi' ? 'Tạo Công thức mới' : 'Create New Recipe'}</span>
        </button>
      </div>

      {/* Recipes Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse">
          {[1, 2].map((i) => (
            <div key={i} className="h-48 bg-zinc-200 dark:bg-zinc-800 rounded-3xl" />
          ))}
        </div>
      ) : recipes.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 p-12 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-purple-500/10 flex items-center justify-center mx-auto text-purple-500">
            <ChefHat className="w-8 h-8" />
          </div>
          <h3 className="font-bold text-lg text-zinc-900 dark:text-zinc-50">
            {language === 'vi' ? 'Chưa có công thức nào' : 'No Custom Recipes Yet'}
          </h3>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto">
            {language === 'vi'
              ? 'Tạo công thức đầu tiên của bạn (vd: Sinh tố Protein yến mạch, Cơm gà xào nấm...) để ghi nhận vào nhật ký nhanh chóng.'
              : 'Create your first custom recipe (e.g. Protein Berry Bowl, Chicken Stir-fry) to quick-log anytime.'}
          </p>
          <button
            onClick={() => setShowBuilder(true)}
            className="px-6 py-3 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition-all shadow-md"
          >
            {language === 'vi' ? '+ Tạo Công thức ngay' : '+ Build Recipe Now'}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {recipes.map((r) => (
            <div
              key={r.id}
              className="bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-zinc-200/80 dark:border-zinc-800 shadow-sm flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-extrabold text-lg text-zinc-900 dark:text-zinc-50">{r.name}</h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-1">
                      {r.description || (language === 'vi' ? 'Công thức tự chế biến' : 'Custom prepared meal')}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteRecipe(r.id)}
                    aria-label="Delete recipe"
                    className="p-2 rounded-xl text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center gap-4 text-xs font-semibold text-zinc-500">
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-purple-500" />
                    {r.servings} {language === 'vi' ? 'phần' : 'servings'}
                  </span>
                  {r.prepTimeMin && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-amber-500" />
                      {r.prepTimeMin} {language === 'vi' ? 'phút' : 'mins'}
                    </span>
                  )}
                  <span className="text-purple-600 dark:text-purple-400 font-bold">
                    {r.ingredients.length} {language === 'vi' ? 'nguyên liệu' : 'ingredients'}
                  </span>
                </div>
              </div>

              {/* Ingredients list mini view */}
              <div className="space-y-1.5 max-h-32 overflow-y-auto bg-zinc-50 dark:bg-zinc-800/50 p-3 rounded-2xl border border-zinc-150 dark:border-zinc-800">
                {r.ingredients.map((ing) => (
                  <div key={ing.id} className="flex justify-between text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    <span className="line-clamp-1">{ing.foodItem.name}</span>
                    <span className="font-bold text-zinc-500 shrink-0 ml-2">
                      {ing.servingQuantity} serving ({Math.round(Number(ing.servingQuantity) * ing.foodItem.calories)} kcal)
                    </span>
                  </div>
                ))}
              </div>

              {/* Per Serving Breakdown */}
              <div className="border-t border-zinc-100 dark:border-zinc-800 pt-3 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-zinc-400 block">
                    {language === 'vi' ? 'Một phần ăn cung cấp:' : 'Per Serving:'}
                  </span>
                  <span className="text-base font-extrabold text-orange-500">{r.perServing?.calories} kcal</span>
                </div>
                <div className="flex gap-3 text-right">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-emerald-600 block">Đạm</span>
                    <span className="font-bold text-zinc-800 dark:text-zinc-200">{r.perServing?.protein}g</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-amber-600 block">Carbs</span>
                    <span className="font-bold text-zinc-800 dark:text-zinc-200">{r.perServing?.carbs}g</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-indigo-600 block">Béo</span>
                    <span className="font-bold text-zinc-800 dark:text-zinc-200">{r.perServing?.fat}g</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Recipe Builder Modal */}
      <PortalModal
        isOpen={showBuilder}
        onClose={() => setShowBuilder(false)}
        maxWidth="3xl"
        className="flex flex-col max-h-[85vh] overflow-hidden !p-0"
      >
            <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg text-zinc-900 dark:text-zinc-50">
                  {language === 'vi' ? 'Thiết kế Công thức món ăn mới' : 'Build Custom Recipe'}
                </h3>
                <p className="text-xs text-zinc-500">
                  {language === 'vi' ? 'Thêm tên, khẩu phần và nguyên liệu vào công thức' : 'Add name, servings, and ingredients'}
                </p>
              </div>
              <button
                onClick={() => setShowBuilder(false)}
                aria-label="Close modal"
                className="p-2 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left: Metadata & Ingredients List */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-300">
                    {language === 'vi' ? 'Tên món ăn / Công thức' : 'Recipe Name'}
                  </label>
                  <input
                    type="text"
                    autoFocus
                    placeholder="e.g. High Protein Overnight Oats"
                    value={recipeName}
                    onChange={(e) => setRecipeName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm font-bold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-300">
                      {language === 'vi' ? 'Số phần ăn' : 'Servings'}
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={recipeServings}
                      onChange={(e) => setRecipeServings(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full px-3 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-bold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-300">
                      {language === 'vi' ? 'Thời gian (phút)' : 'Prep Time (mins)'}
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={prepTimeMin}
                      onChange={(e) => setPrepTimeMin(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-full px-3 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-bold"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-300 block">
                    {language === 'vi' ? `Nguyên liệu đã chọn (${ingredients.length})` : `Selected Ingredients (${ingredients.length})`}
                  </span>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {ingredients.length === 0 ? (
                      <p className="text-xs text-zinc-400 italic py-4 text-center">
                        {language === 'vi' ? 'Chưa chọn nguyên liệu. Tìm kiếm bên phải để thêm.' : 'No ingredients added yet. Search on the right.'}
                      </p>
                    ) : (
                      ingredients.map((ing, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200/60 dark:border-zinc-700 text-xs"
                        >
                          <div className="flex-1 pr-2">
                            <span className="font-bold text-zinc-800 dark:text-zinc-200 line-clamp-1">{ing.foodItem?.name}</span>
                            <span className="text-[10px] text-zinc-400">{ing.foodItem?.calories} kcal/serving</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              step="0.5"
                              min="0.1"
                              value={ing.servingQuantity}
                              onChange={(e) => handleUpdateQuantity(idx, parseFloat(e.target.value) || 1)}
                              className="w-14 px-1.5 py-1 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-600 text-center font-bold text-xs"
                            />
                            <button
                              onClick={() => handleRemoveIngredient(idx)}
                              aria-label="Remove ingredient"
                              className="text-zinc-400 hover:text-red-500 p-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Right: Search Food to Add & Live Nutrition */}
              <div className="space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3.5 top-3 text-zinc-400" />
                    <input
                      type="text"
                      placeholder={language === 'vi' ? 'Tìm món ăn để thêm nguyên liệu...' : 'Search ingredient to add...'}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-bold"
                    />
                  </div>

                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {searchResults.map((f) => (
                      <button
                        key={f.id}
                        onClick={() => handleAddIngredient(f)}
                        className="w-full text-left p-2.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 text-xs transition-all flex items-center justify-between"
                      >
                        <span className="font-bold text-zinc-800 dark:text-zinc-200 line-clamp-1">{f.name}</span>
                        <span className="text-purple-600 dark:text-purple-400 font-extrabold ml-2">+{f.calories} kcal</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Live Recipe Breakdown Box */}
                <div className="bg-zinc-900 dark:bg-zinc-950 p-4 rounded-2xl border border-zinc-800 text-white space-y-3">
                  <div className="flex justify-between items-center text-xs font-bold text-zinc-400">
                    <span>{language === 'vi' ? 'Dinh dưỡng trên 1 phần ăn:' : 'Nutritional split per 1 serving:'}</span>
                    <span className="text-purple-400">({recipeServings} servings total)</span>
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-center">
                    <div className="p-2 bg-zinc-800/80 rounded-xl">
                      <span className="block text-[9px] font-bold text-orange-400 uppercase">Calo</span>
                      <span className="font-extrabold text-sm">{builderPerServing.calories}</span>
                    </div>
                    <div className="p-2 bg-zinc-800/80 rounded-xl">
                      <span className="block text-[9px] font-bold text-emerald-400 uppercase">Đạm</span>
                      <span className="font-extrabold text-sm">{builderPerServing.protein}g</span>
                    </div>
                    <div className="p-2 bg-zinc-800/80 rounded-xl">
                      <span className="block text-[9px] font-bold text-amber-400 uppercase">Carbs</span>
                      <span className="font-extrabold text-sm">{builderPerServing.carbs}g</span>
                    </div>
                    <div className="p-2 bg-zinc-800/80 rounded-xl">
                      <span className="block text-[9px] font-bold text-indigo-400 uppercase">Béo</span>
                      <span className="font-extrabold text-sm">{builderPerServing.fat}g</span>
                    </div>
                  </div>

                  <button
                    onClick={handleSaveRecipe}
                    disabled={isSubmitting || !recipeName.trim() || ingredients.length === 0}
                    className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white font-extrabold text-xs transition-all flex items-center justify-center gap-1.5 shadow-lg"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{isSubmitting ? 'Saving...' : (language === 'vi' ? 'Lưu Công thức' : 'Save Recipe')}</span>
                  </button>
                </div>
              </div>
            </div>
      </PortalModal>
    </div>
  );
}
