'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/components/language-provider';
import { useUnitStore } from '@/lib/stores/useUnitStore';
import { cmToInches, inchesToCm } from '@/lib/units';
import {
  Ruler,
  Plus,
  Trash2,
  X,
  Activity,
  Sparkles,
} from 'lucide-react';

interface MeasurementLog {
  id: string;
  chestCm: number | null;
  waistCm: number | null;
  hipsCm: number | null;
  bicepsCm: number | null;
  thighsCm: number | null;
  calvesCm: number | null;
  shouldersCm: number | null;
  neckCm: number | null;
  forearmsCm: number | null;
  notes: string | null;
  loggedAt: string;
}

export default function CircumferenceMapsPage() {
  const { status } = useSession();
  const router = useRouter();
  const { language, t } = useTranslation();
  const { unitSystem } = useUnitStore();
  const unitLabel = unitSystem === 'IMPERIAL' ? 'in' : 'cm';

  const [history, setHistory] = useState<MeasurementLog[]>([]);
  const [latest, setLatest] = useState<MeasurementLog | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showLogModal, setShowLogModal] = useState<boolean>(false);
  const [selectedPoint, setSelectedPoint] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Form input state
  const [formValues, setFormValues] = useState<{
    neck: string;
    shoulders: string;
    chest: string;
    biceps: string;
    forearms: string;
    waist: string;
    hips: string;
    thighs: string;
    calves: string;
    notes: string;
    date: string;
  }>({
    neck: '',
    shoulders: '',
    chest: '',
    biceps: '',
    forearms: '',
    waist: '',
    hips: '',
    thighs: '',
    calves: '',
    notes: '',
    date: new Date().toISOString().split('T')[0],
  });

  const fetchMeasurements = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/biometrics/measurements');
      if (res.ok) {
        const json = await res.json();
        setLatest(json.latest || null);
        setHistory(json.history || []);
      }
    } catch (err) {
      console.error('Error loading measurements:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    if (status === 'authenticated') {
      fetchMeasurements();
    }
  }, [status, router, fetchMeasurements]);

  const convertValue = useCallback((cmVal: number | null): string => {
    if (cmVal === null || cmVal === undefined) return '--';
    if (unitSystem === 'IMPERIAL') {
      return `${cmToInches(cmVal)} in`;
    }
    return `${cmVal} cm`;
  }, [unitSystem]);

  const parseInputToCm = (inputStr: string): number | undefined => {
    const val = Number.parseFloat(inputStr);
    if (Number.isNaN(val)) return undefined;
    return unitSystem === 'IMPERIAL' ? inchesToCm(val) : val;
  };

  const handleSaveLog = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const payload = {
        neckCm: parseInputToCm(formValues.neck),
        shouldersCm: parseInputToCm(formValues.shoulders),
        chestCm: parseInputToCm(formValues.chest),
        bicepsCm: parseInputToCm(formValues.biceps),
        forearmsCm: parseInputToCm(formValues.forearms),
        waistCm: parseInputToCm(formValues.waist),
        hipsCm: parseInputToCm(formValues.hips),
        thighsCm: parseInputToCm(formValues.thighs),
        calvesCm: parseInputToCm(formValues.calves),
        notes: formValues.notes.trim() || undefined,
        loggedAt: formValues.date ? new Date(formValues.date).toISOString() : new Date().toISOString(),
      };

      const res = await fetch('/api/biometrics/measurements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setShowLogModal(false);
        fetchMeasurements();
      }
    } catch (err) {
      console.error('Error saving measurement:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteLog = async (id: string) => {
    try {
      const res = await fetch(`/api/biometrics/measurements?id=${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        fetchMeasurements();
      }
    } catch (err) {
      console.error('Error deleting measurement:', err);
    }
  };

  const anatomicalPoints = [
    { id: 'neck', name: (t('measurements.neck' as any) || 'Neck') as string, top: '15%', left: '50%', val: latest?.neckCm },
    { id: 'shoulders', name: (t('measurements.shoulders' as any) || 'Shoulders') as string, top: '22%', left: '32%', val: latest?.shouldersCm },
    { id: 'chest', name: (t('measurements.chest' as any) || 'Chest') as string, top: '30%', left: '50%', val: latest?.chestCm },
    { id: 'biceps', name: (t('measurements.biceps' as any) || 'Biceps') as string, top: '34%', left: '26%', val: latest?.bicepsCm },
    { id: 'forearms', name: (t('measurements.forearms' as any) || 'Forearms') as string, top: '44%', left: '21%', val: latest?.forearmsCm },
    { id: 'waist', name: (t('measurements.waist' as any) || 'Waist') as string, top: '46%', left: '50%', val: latest?.waistCm },
    { id: 'hips', name: (t('measurements.hips' as any) || 'Hips') as string, top: '55%', left: '50%', val: latest?.hipsCm },
    { id: 'thighs', name: (t('measurements.thighs' as any) || 'Thighs') as string, top: '68%', left: '42%', val: latest?.thighsCm },
    { id: 'calves', name: (t('measurements.calves' as any) || 'Calves') as string, top: '84%', left: '42%', val: latest?.calvesCm },
  ];

  return (
    <div className="min-h-screen bg-zinc-50/60 dark:bg-zinc-950/40 p-6 md:p-10 space-y-8 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 bg-white dark:bg-zinc-900/80 p-6 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 shadow-sm backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/20 flex items-center justify-center border border-emerald-500/20">
            <Ruler className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              {(t('measurements.title' as any) || 'Circumference Log Maps') as string}
            </h1>
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              {(t('measurements.desc' as any) || '12-point anatomical body measurement map and progress tracker') as string}
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            setShowLogModal(true);
            if (latest) {
              setFormValues({
                neck: latest.neckCm ? String(unitSystem === 'IMPERIAL' ? cmToInches(latest.neckCm) : latest.neckCm) : '',
                shoulders: latest.shouldersCm ? String(unitSystem === 'IMPERIAL' ? cmToInches(latest.shouldersCm) : latest.shouldersCm) : '',
                chest: latest.chestCm ? String(unitSystem === 'IMPERIAL' ? cmToInches(latest.chestCm) : latest.chestCm) : '',
                biceps: latest.bicepsCm ? String(unitSystem === 'IMPERIAL' ? cmToInches(latest.bicepsCm) : latest.bicepsCm) : '',
                forearms: latest.forearmsCm ? String(unitSystem === 'IMPERIAL' ? cmToInches(latest.forearmsCm) : latest.forearmsCm) : '',
                waist: latest.waistCm ? String(unitSystem === 'IMPERIAL' ? cmToInches(latest.waistCm) : latest.waistCm) : '',
                hips: latest.hipsCm ? String(unitSystem === 'IMPERIAL' ? cmToInches(latest.hipsCm) : latest.hipsCm) : '',
                thighs: latest.thighsCm ? String(unitSystem === 'IMPERIAL' ? cmToInches(latest.thighsCm) : latest.thighsCm) : '',
                calves: latest.calvesCm ? String(unitSystem === 'IMPERIAL' ? cmToInches(latest.calvesCm) : latest.calvesCm) : '',
                notes: '',
                date: new Date().toISOString().split('T')[0],
              });
            }
          }}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-bold text-xs hover:opacity-90 transition-all shadow-sm cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{(t('measurements.logMeasurement' as any) || 'Log Measurements') as string}</span>
        </button>
      </div>

      {/* Main Grid: Body Map + Summary Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Interactive Body Silhouette Map */}
        <div className="lg:col-span-5 bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 shadow-sm space-y-4 relative min-h-[520px] flex flex-col items-center justify-center overflow-hidden">
          <div className="flex items-center justify-between w-full border-b border-zinc-100 dark:border-zinc-800 pb-3">
            <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-500" />
              {(t('measurements.bodyMapTitle' as any) || 'Interactive Body Map') as string}
            </h3>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-xl">
              {unitLabel}
            </span>
          </div>

          {/* SVG Body Silhouette Diagram */}
          <div className="relative w-full max-w-[280px] h-[440px] flex items-center justify-center my-auto">
            <svg
              viewBox="0 0 200 400"
              className="w-full h-full text-zinc-200 dark:text-zinc-800 stroke-zinc-300 dark:stroke-zinc-700 stroke-[1.5]"
              fill="currentColor"
            >
              {/* Head & Neck */}
              <circle cx="100" cy="40" r="22" />
              <path d="M92 62 h16 v14 h-16 z" />

              {/* Torso & Shoulders */}
              <path d="M60 80 Q100 70 140 80 L130 180 Q100 185 70 180 Z" />

              {/* Arms */}
              <path d="M58 82 L38 150 L28 200 L38 205 L50 155 L64 100 Z" />
              <path d="M142 82 L162 150 L172 200 L162 205 L150 155 L136 100 Z" />

              {/* Hips & Legs */}
              <path d="M70 180 Q100 185 130 180 L140 270 L115 380 L95 380 L88 270 L85 270 L78 380 L58 380 L60 270 Z" />
            </svg>

            {/* Hotspot Pins */}
            {anatomicalPoints.map((pt) => (
              <button
                key={pt.id}
                onClick={() => setSelectedPoint(pt.id)}
                style={{ top: pt.top, left: pt.left }}
                className={`absolute -translate-x-1/2 -translate-y-1/2 px-2.5 py-1 rounded-full text-[11px] font-extrabold shadow-md transition-all cursor-pointer flex items-center gap-1.5 ${
                  selectedPoint === pt.id
                    ? 'bg-emerald-600 text-white ring-4 ring-emerald-500/30 scale-110'
                    : 'bg-zinc-900/90 dark:bg-zinc-100/90 text-white dark:text-zinc-900 hover:scale-105'
                }`}
              >
                <span>{pt.name}:</span>
                <span className="text-emerald-400 dark:text-emerald-600">
                  {convertValue(pt.val ?? null)}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Right Column: 9-Point Cards Grid */}
        <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {anatomicalPoints.map((pt) => {
            const isSelected = selectedPoint === pt.id;
            return (
              <div
                key={pt.id}
                onClick={() => setSelectedPoint(pt.id)}
                className={`p-5 rounded-3xl border transition-all cursor-pointer space-y-2 ${
                  isSelected
                    ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-500 shadow-md ring-2 ring-emerald-500/20'
                    : 'bg-white dark:bg-zinc-900 border-zinc-200/80 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 shadow-sm'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    {pt.name}
                  </span>
                  <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-50">
                    {convertValue(pt.val ?? null)}
                  </span>
                </div>
                <p className="text-[10px] font-semibold text-zinc-400">
                  {latest?.loggedAt
                    ? new Date(latest.loggedAt).toLocaleDateString()
                    : 'No log record'}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* History Archive Table */}
      <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-zinc-200/80 dark:border-zinc-800 shadow-sm space-y-4">
        <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-50">
          {(t('measurements.historyTitle' as any) || 'Measurement Log History') as string}
        </h3>

        {history.length === 0 ? (
          <p className="text-xs text-zinc-400 italic">No measurement logs recorded yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs font-semibold">
              <thead>
                <tr className="border-b border-zinc-100 dark:border-zinc-800 text-zinc-400 uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Chest</th>
                  <th className="py-3 px-4">Waist</th>
                  <th className="py-3 px-4">Hips</th>
                  <th className="py-3 px-4">Biceps</th>
                  <th className="py-3 px-4">Thighs</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {history.map((log) => (
                  <tr key={log.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-zinc-900 dark:text-zinc-100">
                      {new Date(log.loggedAt).toLocaleDateString(
                        language === 'vi' ? 'vi-VN' : 'en-US',
                        { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-zinc-700 dark:text-zinc-300">{convertValue(log.chestCm)}</td>
                    <td className="py-3.5 px-4 text-zinc-700 dark:text-zinc-300">{convertValue(log.waistCm)}</td>
                    <td className="py-3.5 px-4 text-zinc-700 dark:text-zinc-300">{convertValue(log.hipsCm)}</td>
                    <td className="py-3.5 px-4 text-zinc-700 dark:text-zinc-300">{convertValue(log.bicepsCm)}</td>
                    <td className="py-3.5 px-4 text-zinc-700 dark:text-zinc-300">{convertValue(log.thighsCm)}</td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleDeleteLog(log.id)}
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Log Measurement Modal */}
      {showLogModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-2xl rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden p-6 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                  <Ruler className="w-4 h-4 text-emerald-500" />
                </div>
                <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-50">
                  Log Body Circumference ({unitLabel})
                </h3>
              </div>
              <button
                onClick={() => setShowLogModal(false)}
                className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveLog} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {[
                  { key: 'chest', label: 'Chest' },
                  { key: 'waist', label: 'Waist' },
                  { key: 'hips', label: 'Hips' },
                  { key: 'biceps', label: 'Biceps' },
                  { key: 'forearms', label: 'Forearms' },
                  { key: 'thighs', label: 'Thighs' },
                  { key: 'calves', label: 'Calves' },
                  { key: 'shoulders', label: 'Shoulders' },
                  { key: 'neck', label: 'Neck' },
                ].map((item) => (
                  <div key={item.key} className="space-y-1">
                    <label htmlFor={`input-${item.key}`} className="text-[11px] font-bold uppercase text-zinc-500 dark:text-zinc-400">
                      {item.label} ({unitLabel})
                    </label>
                    <input
                      id={`input-${item.key}`}
                      type="number"
                      step="0.1"
                      placeholder={`e.g. ${unitSystem === 'IMPERIAL' ? '32.5' : '82'}`}
                      value={(formValues as any)[item.key]}
                      onChange={(e) =>
                        setFormValues((prev) => ({ ...prev, [item.key]: e.target.value }))
                      }
                      className="w-full px-3.5 py-2.5 rounded-2xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 font-bold text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                ))}
              </div>

              <div className="space-y-1.5">
                <label htmlFor="log-date-input" className="text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-300">
                  Log Date
                </label>
                <input
                  id="log-date-input"
                  type="date"
                  value={formValues.date}
                  onChange={(e) => setFormValues((prev) => ({ ...prev, date: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-2xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 font-semibold text-xs text-zinc-900 dark:text-zinc-100"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowLogModal(false)}
                  className="flex-1 py-3 rounded-2xl font-bold text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-3 rounded-2xl font-bold text-xs bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 transition-all"
                >
                  {isSubmitting ? 'Saving...' : 'Save Log'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
