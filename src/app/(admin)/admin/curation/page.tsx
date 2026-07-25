'use client';

import React, { useState, useEffect } from 'react';
import { Utensils, CheckCircle, XCircle, ShieldCheck, Flame, Barcode } from 'lucide-react';

interface UnverifiedFood {
  id: string;
  name: string;
  brand: string | null;
  servingSize: string | null;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  barcode: string | null;
  createdAt: string;
}

export default function FoodCurationPage() {
  const [foods, setFoods] = useState<UnverifiedFood[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  const fetchFoods = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/curation');
      if (res.ok) {
        const json = await res.json();
        setFoods(json.foods || []);
      }
    } catch (err) {
      console.error('Failed to fetch curation foods:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFoods();
  }, []);

  const handleAction = async (foodId: string, action: 'APPROVE' | 'REJECT') => {
    try {
      const res = await fetch('/api/admin/curation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ foodId, action }),
      });
      if (res.ok) {
        setMessage(`Successfully ${action === 'APPROVE' ? 'approved & verified' : 'rejected'} food item.`);
        fetchFoods();
      }
    } catch (err) {
      console.error('Failed to process food item:', err);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-3">
          <Utensils className="w-8 h-8 text-amber-400" /> Food & Exercise Curation Queue
        </h1>
        <p className="text-xs text-zinc-400 mt-1">
          Review user-submitted custom food items and barcode mappings. Verify nutrition accuracy before making them public for all users.
        </p>
      </div>

      {message && (
        <div className="p-4 rounded-2xl bg-amber-950/60 border border-amber-800 text-amber-300 text-xs font-semibold flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-amber-400 flex-shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {/* Curation List */}
      <div className="bg-[#0f0f13] rounded-3xl border border-zinc-800/80 p-6 space-y-5 shadow-lg">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-amber-400" /> Pending Verification Queue ({foods.length})
          </h2>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-xs text-zinc-500 animate-pulse">Loading curation queue...</div>
        ) : foods.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {foods.map((item) => (
              <div key={item.id} className="p-5 bg-zinc-950/90 rounded-2xl border border-zinc-800/80 space-y-4 shadow-sm hover:border-zinc-700 transition-colors">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-extrabold text-sm text-white">{item.name}</h3>
                    {item.brand && <p className="text-xs text-zinc-400">{item.brand}</p>}
                    <p className="text-[11px] text-zinc-500 mt-0.5">Serving: {item.servingSize || '100g'}</p>
                  </div>
                  {item.barcode && (
                    <span className="px-2.5 py-1 bg-zinc-900 text-zinc-300 text-[10px] font-mono rounded-lg border border-zinc-800 flex items-center gap-1">
                      <Barcode className="w-3 h-3 text-amber-400" /> {item.barcode}
                    </span>
                  )}
                </div>

                {/* Macro breakdown grid */}
                <div className="grid grid-cols-4 gap-2 text-center p-3 bg-[#0f0f13] rounded-xl text-xs border border-zinc-800/60">
                  <div>
                    <div className="text-[9px] text-zinc-500 uppercase font-bold flex items-center justify-center gap-0.5">
                      <Flame className="w-3 h-3 text-amber-500" /> Cal
                    </div>
                    <div className="font-black text-white mt-0.5">{item.calories}</div>
                  </div>
                  <div>
                    <div className="text-[9px] text-emerald-400 uppercase font-bold">Protein</div>
                    <div className="font-black text-emerald-400 mt-0.5">{Number(item.protein)}g</div>
                  </div>
                  <div>
                    <div className="text-[9px] text-amber-400 uppercase font-bold">Carbs</div>
                    <div className="font-black text-amber-400 mt-0.5">{Number(item.carbs)}g</div>
                  </div>
                  <div>
                    <div className="text-[9px] text-rose-400 uppercase font-bold">Fat</div>
                    <div className="font-black text-rose-400 mt-0.5">{Number(item.fat)}g</div>
                  </div>
                </div>

                {/* Approve / Reject Actions */}
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => handleAction(item.id, 'APPROVE')}
                    className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                  >
                    <CheckCircle className="w-4 h-4" /> Approve & Verify
                  </button>
                  <button
                    onClick={() => handleAction(item.id, 'REJECT')}
                    className="px-4 py-2.5 bg-zinc-900 hover:bg-rose-950 hover:text-rose-300 text-zinc-400 font-semibold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 border border-zinc-800 cursor-pointer"
                  >
                    <XCircle className="w-4 h-4" /> Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-xs text-zinc-500 border border-dashed border-zinc-800/80 rounded-2xl">
            No items pending curation review. Database is up to date!
          </div>
        )}
      </div>
    </div>
  );
}
