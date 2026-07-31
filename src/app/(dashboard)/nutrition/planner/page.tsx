'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/components/language-provider';
import ConfirmModal from '@/components/shared/ConfirmModal';
import {
  ShoppingBag,
  Plus,
  Trash2,
  CheckCircle2,
  Circle,
  Sparkles,
  RefreshCw,
  ArrowLeft,
  ListChecks,
  Filter,
  CheckSquare,
} from 'lucide-react';

interface FoodItemProfile {
  id: string;
  name: string;
  calories: number;
  protein: number | string;
}

interface ShoppingListItem {
  id: string;
  name: string;
  category: string;
  quantity: number | string;
  unit?: string;
  checked: boolean;
  foodItem?: FoodItemProfile;
}

interface ShoppingListResponse {
  id: string;
  name: string;
  items: ShoppingListItem[];
}

export default function ShoppingPlannerPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { language } = useTranslation();

  const [shoppingList, setShoppingList] = useState<ShoppingListResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // New item form
  const [newItemName, setNewItemName] = useState<string>('');
  const [newItemCategory, setNewItemCategory] = useState<string>('Proteins & Meats');
  const [newItemQty, setNewItemQty] = useState<number>(1);
  const [newItemUnit, setNewItemUnit] = useState<string>('g / pack');
  const [isAdding, setIsAdding] = useState<boolean>(false);

  const fetchShoppingList = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/nutrition/shopping-list');
      if (res.ok) {
        const data = await res.json();
        setShoppingList(data);
      }
    } catch (e) {
      console.error('Error fetching shopping list:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      fetchShoppingList();
    }
  }, [status, router, fetchShoppingList]);

  const handleToggleCheck = async (id: string, currentChecked: boolean) => {
    if (!shoppingList) return;
    // Optimistic UI update
    setShoppingList({
      ...shoppingList,
      items: shoppingList.items.map((it) => (it.id === id ? { ...it, checked: !currentChecked } : it)),
    });

    try {
      await fetch('/api/nutrition/shopping-list', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, checked: !currentChecked }),
      });
    } catch (e) {
      console.error('Error updating checkbox:', e);
      fetchShoppingList();
    }
  };

  const handleAddItem = async () => {
    if (!newItemName.trim()) return;
    setIsAdding(true);
    try {
      const res = await fetch('/api/nutrition/shopping-list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add_item',
          name: newItemName.trim(),
          category: newItemCategory,
          quantity: newItemQty,
          unit: newItemUnit,
        }),
      });
      if (res.ok) {
        setNewItemName('');
        setNewItemQty(1);
        fetchShoppingList();
      }
    } catch (e) {
      console.error('Error adding item:', e);
    } finally {
      setIsAdding(false);
    }
  };

  const handleAutoGenerate = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch('/api/nutrition/shopping-list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'auto_generate' }),
      });
      if (res.ok) {
        fetchShoppingList();
      }
    } catch (e) {
      console.error('Error auto-generating staples:', e);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDeleteItem = async (id: string) => {
    try {
      const res = await fetch(`/api/nutrition/shopping-list?id=${id}`, { method: 'DELETE' });
      if (res.ok) fetchShoppingList();
    } catch (e) {
      console.error('Error deleting item:', e);
    }
  };

  const [showClearAllConfirm, setShowClearAllConfirm] = useState(false);
  const [isClearingAll, setIsClearingAll] = useState(false);

  const handleClearChecked = async () => {
    try {
      const res = await fetch('/api/nutrition/shopping-list?clearChecked=true', { method: 'DELETE' });
      if (res.ok) fetchShoppingList();
    } catch (e) {
      console.error('Error clearing checked:', e);
    }
  };

  const handleClearAll = async () => {
    setIsClearingAll(true);
    try {
      const res = await fetch('/api/nutrition/shopping-list?clearAll=true', { method: 'DELETE' });
      if (res.ok) fetchShoppingList();
    } catch (e) {
      console.error('Error clearing all items:', e);
    } finally {
      setIsClearingAll(false);
      setShowClearAllConfirm(false);
    }
  };

  const categories = ['All', 'Proteins & Meats', 'Grains & Carbs', 'Produce & Fruits', 'Dairy & Supplements', 'General'];

  const filteredItems = (shoppingList?.items || []).filter((item) =>
    selectedCategory === 'All' ? true : item.category === selectedCategory
  );

  const checkedCount = (shoppingList?.items || []).filter((i) => i.checked).length;
  const totalCount = (shoppingList?.items || []).length;

  return (
    <div className="min-h-screen bg-zinc-50/60 dark:bg-zinc-950/40 p-6 md:p-10 space-y-8 max-w-5xl mx-auto">
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
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/20 flex items-center justify-center border border-emerald-500/20">
            <ShoppingBag className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              {language === 'vi' ? 'Danh sách Đi chợ & Chuẩn bị món ăn' : 'Shopping List & Meal Prep Planner'}
            </h1>
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              {language === 'vi'
                ? 'Tự động tạo danh sách nguyên liệu từ công thức và thực phẩm thiết yếu hàng tuần'
                : 'Auto-generate grocery checklist from your custom recipes and weekly training staples'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleAutoGenerate}
            disabled={isGenerating}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50 cursor-pointer"
          >
            <Sparkles className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
            <span>
              {isGenerating
                ? 'Generating...'
                : language === 'vi'
                  ? '⚡ Tự động tạo danh sách Staples & Công thức'
                  : '⚡ Auto-Generate Weekly Staples & Recipes'}
            </span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left / Top: Add custom grocery item form */}
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 shadow-sm space-y-4 md:col-span-1 h-fit">
          <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
            <Plus className="w-4 h-4 text-emerald-500" />
            <span>{language === 'vi' ? 'Thêm món cần mua' : 'Add Grocery Item'}</span>
          </h3>

          <div className="space-y-3">
            <div>
              <label className="text-[11px] font-bold uppercase text-zinc-500 block mb-1">
                {language === 'vi' ? 'Tên nguyên liệu / thực phẩm' : 'Item Name'}
              </label>
              <input
                type="text"
                placeholder="e.g. Avocado, Beef Sirloin..."
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-bold text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase text-zinc-500 block mb-1">
                {language === 'vi' ? 'Phân loại (Category)' : 'Category'}
              </label>
              <select
                value={newItemCategory}
                onChange={(e) => setNewItemCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-bold text-zinc-900 dark:text-zinc-100"
              >
                <option value="Proteins & Meats">{language === 'vi' ? 'Thịt & Đạm (Proteins)' : 'Proteins & Meats'}</option>
                <option value="Grains & Carbs">{language === 'vi' ? 'Tinh bột & Ngũ cốc (Carbs)' : 'Grains & Carbs'}</option>
                <option value="Produce & Fruits">{language === 'vi' ? 'Rau & Trái cây (Produce)' : 'Produce & Fruits'}</option>
                <option value="Dairy & Supplements">{language === 'vi' ? 'Sữa & Bổ sung' : 'Dairy & Supplements'}</option>
                <option value="General">{language === 'vi' ? 'Khác (General)' : 'General'}</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] font-bold uppercase text-zinc-500 block mb-1">
                  {language === 'vi' ? 'Số lượng' : 'Quantity'}
                </label>
                <input
                  type="number"
                  min="0.1"
                  step="1"
                  value={newItemQty}
                  onChange={(e) => setNewItemQty(Math.max(0.1, parseFloat(e.target.value) || 1))}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-bold"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold uppercase text-zinc-500 block mb-1">
                  {language === 'vi' ? 'Đơn vị' : 'Unit'}
                </label>
                <input
                  type="text"
                  value={newItemUnit}
                  onChange={(e) => setNewItemUnit(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-bold"
                />
              </div>
            </div>

            <button
              onClick={handleAddItem}
              disabled={isAdding || !newItemName.trim()}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all shadow-md mt-2 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{isAdding ? 'Adding...' : (language === 'vi' ? 'Thêm vào danh sách' : 'Add to Checklist')}</span>
            </button>
          </div>
        </div>

        {/* Right / Main: Checklist view */}
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 shadow-sm space-y-6 md:col-span-2 flex flex-col justify-between min-h-[450px]">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 dark:border-zinc-800 pb-4">
              <div className="flex flex-wrap items-center gap-2">
                <ListChecks className="w-5 h-5 text-emerald-500" />
                <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-50">
                  {language === 'vi'
                    ? (shoppingList?.name === 'Weekly Grocery Essentials' || shoppingList?.name === 'Grocery Essentials'
                        ? 'Danh sách Đi chợ Hàng tuần'
                        : shoppingList?.name || 'Danh sách Đi chợ Hàng tuần')
                    : (shoppingList?.name || 'Weekly Grocery Essentials')}
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-xs font-extrabold text-zinc-600 dark:text-zinc-400">
                  {checkedCount} / {totalCount} {language === 'vi' ? 'hoàn tất' : 'done'}
                </span>
              </div>

              {/* Card Action Buttons */}
              <div className="flex items-center gap-2">
                {checkedCount > 0 && (
                  <button
                    onClick={handleClearChecked}
                    className="px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold text-xs transition-all flex items-center gap-1 border border-amber-500/20 cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{language === 'vi' ? `Xóa ${checkedCount} đã mua` : `Clear ${checkedCount} Checked`}</span>
                  </button>
                )}

                {totalCount > 0 && (
                  <button
                    onClick={() => setShowClearAllConfirm(true)}
                    className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 font-bold text-xs transition-all flex items-center gap-1 border border-rose-500/20 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{language === 'vi' ? 'Xóa tất cả' : 'Clear All'}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Category Filter Pills */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 max-w-full">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all ${
                    selectedCategory === cat
                      ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-xs'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200'
                  }`}
                >
                  {language === 'vi' && cat === 'Proteins & Meats'
                    ? 'Thịt & Đạm'
                    : language === 'vi' && cat === 'Grains & Carbs'
                      ? 'Tinh bột'
                      : language === 'vi' && cat === 'Produce & Fruits'
                        ? 'Rau quả'
                        : language === 'vi' && cat === 'Dairy & Supplements'
                          ? 'Sữa & Bổ sung'
                          : cat}
                </button>
              ))}
            </div>

            {/* Checklist items */}
            {isLoading ? (
              <div className="space-y-3 animate-pulse py-6">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-14 bg-zinc-100 dark:bg-zinc-800 rounded-2xl" />
                ))}
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="text-center py-16 text-zinc-400 space-y-2">
                <CheckSquare className="w-12 h-12 stroke-1 text-zinc-300 dark:text-zinc-700 mx-auto" />
                <p className="text-xs font-semibold">
                  {language === 'vi'
                    ? 'Chưa có mục nào trong phân loại này. Nhấn nút tự động tạo hoặc thêm mới ở bên trái.'
                    : 'No items in this category. Click Auto-Generate Staples or add items on the left.'}
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                {filteredItems.map((item) => (
                  <div
                    key={item.id}
                    className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
                      item.checked
                        ? 'bg-zinc-100/60 dark:bg-zinc-800/40 border-zinc-200/60 dark:border-zinc-800 opacity-60 line-through'
                        : 'bg-zinc-50 dark:bg-zinc-800/80 border-zinc-200/80 dark:border-zinc-700/80 hover:border-emerald-500/40'
                    }`}
                  >
                    <button
                      onClick={() => handleToggleCheck(item.id, item.checked)}
                      className="flex items-center gap-3 flex-1 text-left"
                    >
                      {item.checked ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 fill-emerald-500/10" />
                      ) : (
                        <Circle className="w-5 h-5 text-zinc-400 shrink-0" />
                      )}
                      <div>
                        <span className={`font-bold text-xs ${item.checked ? 'text-zinc-500' : 'text-zinc-900 dark:text-zinc-100'}`}>
                          {item.name}
                        </span>
                        <span className="block text-[10px] font-semibold text-zinc-400">
                          {item.category} • {item.quantity} {item.unit || ''}
                        </span>
                      </div>
                    </button>

                    <button
                      onClick={() => handleDeleteItem(item.id)}
                      aria-label="Delete shopping item"
                      className="p-2 rounded-xl text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={showClearAllConfirm}
        onClose={() => setShowClearAllConfirm(false)}
        onConfirm={handleClearAll}
        isLoading={isClearingAll}
        title="Xóa toàn bộ danh sách đi chợ?"
        description="Hành động này sẽ xóa tất cả các thực phẩm và nguyên liệu hiện có khỏi danh sách đi chợ của bạn."
        confirmText="Xóa tất cả"
        cancelText="Hủy"
        variant="danger"
      />
    </div>
  );
}
