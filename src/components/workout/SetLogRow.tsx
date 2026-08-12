'use client';

import { useState, useCallback } from 'react';
import { Trash2, ChevronDown } from 'lucide-react';
import { useWorkoutStore, type ActiveSet, type SetType } from '@/lib/stores/useWorkoutStore';
import { useTranslation } from '@/components/language-provider';
import { PlateCalculatorWidget } from './PlateCalculatorWidget';
import { RestTimerAutoStart } from './RestTimerOverlay';

const SET_TYPE_KEYS: Record<SetType, 'normal' | 'warmup' | 'drop' | 'failure'> = {
  NORMAL: 'normal',
  WARMUP: 'warmup',
  DROP: 'drop',
  FAILURE: 'failure',
};

const SET_TYPE_COLORS: Record<SetType, string> = {
  NORMAL: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700',
  WARMUP: 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800',
  DROP: 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800',
  FAILURE: 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800',
};
const SET_TYPES: SetType[] = ['NORMAL', 'WARMUP', 'DROP', 'FAILURE'];

const BARBELL_CATEGORIES = new Set(['CHEST', 'BACK', 'LEGS', 'SHOULDERS']);

interface SetLogRowProps {
  readonly exerciseClientId: string;
  readonly set: ActiveSet;
  readonly setNumber: number;
  readonly exerciseCategory?: string;
  readonly isBarbell?: boolean;
}

export function SetLogRow({
  exerciseClientId,
  set,
  setNumber,
  exerciseCategory,
  isBarbell = false,
}: SetLogRowProps) {
  const { t } = useTranslation();
  const { updateSet, deleteSet, toggleSetComplete } = useWorkoutStore();
  const [showTypeMenu, setShowTypeMenu] = useState(false);
  const [showRestTimer, setShowRestTimer] = useState(false);
  const [showPlates, setShowPlates] = useState(false);

  const getTypeInfo = useCallback((type: SetType) => {
    const key = SET_TYPE_KEYS[type];
    return {
      badge: t(`workouts.setTypes.${key}.badge`),
      name: t(`workouts.setTypes.${key}.name`),
      desc: t(`workouts.setTypes.${key}.desc`),
    };
  }, [t]);

  const activeInfo = getTypeInfo(set.setType);

  const showBarbellCalc =
    isBarbell ||
    (exerciseCategory && BARBELL_CATEGORIES.has(exerciseCategory));

  const handleToggleComplete = useCallback(() => {
    const wasCompleted = set.completed;
    toggleSetComplete(exerciseClientId, set.id);
    // Trigger rest timer when marking as complete
    if (!wasCompleted) {
      setShowRestTimer(true);
    }
  }, [exerciseClientId, set.id, set.completed, toggleSetComplete]);

  return (
    <>
      <div
        className={`grid items-center gap-2 rounded-xl px-3 py-2.5 border transition-colors duration-200 ${
          set.completed
            ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900'
            : 'bg-zinc-50/50 dark:bg-zinc-900/20 border-zinc-100 dark:border-zinc-800'
        }`}
        style={{ gridTemplateColumns: '28px 52px 1fr 1fr 52px 28px' }}
      >
        {/* Set number + type */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowTypeMenu(!showTypeMenu)}
            title={`${activeInfo.name}: ${activeInfo.desc}`}
            className={`w-7 h-7 rounded-lg text-[11px] font-bold flex items-center justify-center border transition-colors ${SET_TYPE_COLORS[set.setType]}`}
            aria-label={`Set type: ${activeInfo.name}`}
          >
            {activeInfo.badge}
          </button>
          {/* Type dropdown */}
          {showTypeMenu && (
            <div className="absolute left-0 top-8 z-20 w-60 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl overflow-hidden py-1">
              <div className="px-3 py-1.5 border-b border-zinc-100 dark:border-zinc-800">
                <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                  {t('workouts.setTypesTitle')}
                </p>
              </div>
              {SET_TYPES.map((type) => {
                const info = getTypeInfo(type);
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => {
                      updateSet(exerciseClientId, set.id, { setType: type });
                      setShowTypeMenu(false);
                    }}
                    className={`w-full px-3 py-2 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800/80 transition-colors flex items-start gap-2.5 ${
                      set.setType === type ? 'bg-zinc-50/80 dark:bg-zinc-800/50' : ''
                    }`}
                  >
                    <span className={`w-5 h-5 rounded text-[10px] font-bold flex items-center justify-center shrink-0 border mt-0.5 ${SET_TYPE_COLORS[type]}`}>
                      {info.badge}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-zinc-900 dark:text-zinc-100 leading-tight">
                        {info.name}
                      </p>
                      <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5 leading-tight">
                        {info.desc}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Set number */}
        <span className="text-[11px] text-zinc-400 text-center">{setNumber}</span>

        {/* Weight input */}
        <div className="relative">
          <input
            type="number"
            inputMode="decimal"
            min={0}
            max={999}
            step={0.5}
            value={set.weightKg || ''}
            onChange={(e) =>
              updateSet(exerciseClientId, set.id, { weightKg: Number(e.target.value) })
            }
            placeholder="0"
            className="w-full text-center text-sm font-semibold bg-transparent border border-zinc-200 dark:border-zinc-800 rounded-lg px-1 py-1.5 focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-600 text-zinc-900 dark:text-zinc-50 tabular-nums"
            aria-label="Weight in kg"
          />
          <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[9px] text-zinc-400">kg</span>
        </div>

        {/* Reps input */}
        <div className="relative">
          <input
            type="number"
            inputMode="numeric"
            min={0}
            max={999}
            step={1}
            value={set.repsCompleted || ''}
            onChange={(e) =>
              updateSet(exerciseClientId, set.id, { repsCompleted: Number(e.target.value) })
            }
            placeholder="0"
            className="w-full text-center text-sm font-semibold bg-transparent border border-zinc-200 dark:border-zinc-800 rounded-lg px-1 py-1.5 focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-600 text-zinc-900 dark:text-zinc-50 tabular-nums"
            aria-label="Reps completed"
          />
          <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[9px] text-zinc-400">×</span>
        </div>

        {/* RPE (optional small) */}
        <input
          type="number"
          inputMode="decimal"
          min={1}
          max={10}
          step={0.5}
          value={set.rpe ?? ''}
          onChange={(e) =>
            updateSet(exerciseClientId, set.id, {
              rpe: e.target.value ? Number(e.target.value) : null,
            })
          }
          placeholder="RPE"
          className="w-full text-center text-xs bg-transparent border border-zinc-200 dark:border-zinc-800 rounded-lg px-1 py-1.5 focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-600 text-zinc-500 dark:text-zinc-400 tabular-nums"
          aria-label="RPE (Rate of Perceived Exertion)"
        />

        {/* Complete checkbox + delete */}
        <div className="flex flex-col items-center gap-1">
          <button
            type="button"
            onClick={handleToggleComplete}
            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
              set.completed
                ? 'bg-emerald-500 border-emerald-500'
                : 'border-zinc-300 dark:border-zinc-700 hover:border-emerald-400'
            }`}
            aria-label={set.completed ? 'Mark incomplete' : 'Mark complete'}
          >
            {set.completed && (
              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            )}
          </button>
          <button
            type="button"
            onClick={() => deleteSet(exerciseClientId, set.id)}
            className="text-zinc-300 dark:text-zinc-700 hover:text-red-400 dark:hover:text-red-500 transition-colors"
            aria-label="Delete set"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Plate calculator (barbell exercises) */}
      {showBarbellCalc && set.weightKg > 20 && (
        <div className="px-1">
          <button
            type="button"
            onClick={() => setShowPlates(!showPlates)}
            className="flex items-center gap-1 text-[10px] text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors mt-1"
          >
            <ChevronDown className={`w-3 h-3 transition-transform ${showPlates ? 'rotate-180' : ''}`} />
            {showPlates ? 'Hide' : 'Show'} plates
          </button>
          {showPlates && <PlateCalculatorWidget weightKg={set.weightKg} />}
        </div>
      )}

      {/* Rest timer overlay */}
      {showRestTimer && (
        <RestTimerAutoStart
          initialSeconds={90}
          onClose={() => setShowRestTimer(false)}
        />
      )}
    </>
  );
}
