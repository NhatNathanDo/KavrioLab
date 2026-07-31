'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/components/language-provider';
import PortalModal from '@/components/shared/PortalModal';
import ConfirmModal from '@/components/shared/ConfirmModal';
import { useUnitStore } from '@/lib/stores/useUnitStore';
import { cmToInches, inchesToCm } from '@/lib/units';
import {
  Ruler,
  Plus,
  Trash2,
  X,
  TrendingDown,
  TrendingUp,
  Minus,
  Calendar,
  Activity,
  Edit3,
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
  const { language } = useTranslation();
  const { unitSystem } = useUnitStore();
  const unitLabel = unitSystem === 'IMPERIAL' ? 'in' : 'cm';

  const [history, setHistory] = useState<MeasurementLog[]>([]);
  const [latest, setLatest] = useState<MeasurementLog | null>(null);
  const [previous, setPrevious] = useState<MeasurementLog | null>(null);
  const [, setIsLoading] = useState<boolean>(true);
  const [showLogModal, setShowLogModal] = useState<boolean>(false);
  const [activeRegionFilter, setActiveRegionFilter] = useState<'all' | 'upper' | 'lower' | 'limbs'>('all');
  const [selectedPointKey, setSelectedPointKey] = useState<string>('chest');
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [deleteLogId, setDeleteLogId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

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
        if (json.history && json.history.length > 1) {
          setPrevious(json.history[1]);
        } else {
          setPrevious(null);
        }
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

  const convertValue = useCallback(
    (cmVal: number | null): string => {
      if (cmVal === null || cmVal === undefined) return '--';
      if (unitSystem === 'IMPERIAL') {
        return `${cmToInches(cmVal)} in`;
      }
      return `${cmVal} cm`;
    },
    [unitSystem]
  );

  const getDeltaBadge = (currCm: number | null, prevCm: number | null) => {
    if (currCm === null || prevCm === null || currCm === undefined || prevCm === undefined) return null;
    const diff = currCm - prevCm;
    if (Math.abs(diff) < 0.1) {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full">
          <Minus className="w-2.5 h-2.5" />
          0.0
        </span>
      );
    }

    const diffVal = unitSystem === 'IMPERIAL' ? cmToInches(diff) : Number(diff.toFixed(1));
    const sign = diffVal > 0 ? '+' : '';
    const formatted = `${sign}${diffVal} ${unitLabel}`;

    if (diffVal > 0) {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/30 px-2 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-900/40">
          <TrendingUp className="w-2.5 h-2.5" />
          {formatted}
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-900/40">
        <TrendingDown className="w-2.5 h-2.5" />
        {formatted}
      </span>
    );
  };

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

  const handleConfirmDelete = async () => {
    if (!deleteLogId) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/biometrics/measurements?id=${deleteLogId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        fetchMeasurements();
      }
    } catch (err) {
      console.error('Error deleting measurement:', err);
    } finally {
      setIsDeleting(false);
      setDeleteLogId(null);
    }
  };

  const openModalWithFocus = (fieldKey?: string) => {
    setFocusedField(fieldKey || null);
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
    setShowLogModal(true);
  };

  const metricCards = [
    {
      key: 'chest',
      nameVi: 'Vòng Ngực',
      nameEn: 'Chest',
      region: 'upper',
      regionTag: 'UPPER BODY',
      currVal: latest?.chestCm ?? null,
      prevVal: previous?.chestCm ?? null,
      pinY: 29,
      pinX: 50,
    },
    {
      key: 'waist',
      nameVi: 'Vòng Eo',
      nameEn: 'Waist',
      region: 'upper',
      regionTag: 'CORE & WAIST',
      currVal: latest?.waistCm ?? null,
      prevVal: previous?.waistCm ?? null,
      pinY: 41.5,
      pinX: 50,
    },
    {
      key: 'hips',
      nameVi: 'Vòng Mông',
      nameEn: 'Hips',
      region: 'lower',
      regionTag: 'LOWER BODY',
      currVal: latest?.hipsCm ?? null,
      prevVal: previous?.hipsCm ?? null,
      pinY: 52.5,
      pinX: 50,
    },
    {
      key: 'biceps',
      nameVi: 'Bắp Tay',
      nameEn: 'Biceps',
      region: 'limbs',
      regionTag: 'UPPER LIMBS',
      currVal: latest?.bicepsCm ?? null,
      prevVal: previous?.bicepsCm ?? null,
      pinY: 33,
      pinX: 36.5,
    },
    {
      key: 'forearms',
      nameVi: 'Cẳng Tay',
      nameEn: 'Forearms',
      region: 'limbs',
      regionTag: 'UPPER LIMBS',
      currVal: latest?.forearmsCm ?? null,
      prevVal: previous?.forearmsCm ?? null,
      pinY: 46,
      pinX: 29.5,
    },
    {
      key: 'thighs',
      nameVi: 'Vòng Đùi',
      nameEn: 'Thighs',
      region: 'lower',
      regionTag: 'LOWER LIMBS',
      currVal: latest?.thighsCm ?? null,
      prevVal: previous?.thighsCm ?? null,
      pinY: 66,
      pinX: 56.5,
    },
    {
      key: 'calves',
      nameVi: 'Bắp Chân',
      nameEn: 'Calves',
      region: 'lower',
      regionTag: 'LOWER LIMBS',
      currVal: latest?.calvesCm ?? null,
      prevVal: previous?.calvesCm ?? null,
      pinY: 79,
      pinX: 56.5,
    },
    {
      key: 'shoulders',
      nameVi: 'Vòng Vai',
      nameEn: 'Shoulders',
      region: 'upper',
      regionTag: 'UPPER BODY',
      currVal: latest?.shouldersCm ?? null,
      prevVal: previous?.shouldersCm ?? null,
      pinY: 21,
      pinX: 50,
    },
    {
      key: 'neck',
      nameVi: 'Vòng Cổ',
      nameEn: 'Neck',
      region: 'upper',
      regionTag: 'UPPER BODY',
      currVal: latest?.neckCm ?? null,
      prevVal: previous?.neckCm ?? null,
      pinY: 16,
      pinX: 50,
    },
  ];

  const filteredCards = metricCards.filter((c) =>
    activeRegionFilter === 'all' ? true : c.region === activeRegionFilter
  );

  const loggedCount = metricCards.filter((c) => c.currVal !== null).length;

  return (
    <div className="min-h-screen bg-[#fcfcfd] dark:bg-[#0f0f11] text-zinc-900 dark:text-zinc-50 p-4 md:p-8 space-y-8 max-w-7xl mx-auto font-sans transition-colors duration-200">
      {/* Header Banner - Apple Minimalist Style */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-zinc-200/80 dark:border-zinc-900 pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
              {language === 'vi' ? 'CHỈ SỐ THỂ HÌNH' : 'ANATOMICAL BIOMETRICS'}
            </span>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            {language === 'vi' ? 'Sơ đồ & Số đo Cơ thể' : 'Body Circumference Map & Metrics'}
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {language === 'vi'
              ? 'Minh họa giải phẫu cơ thể chân thực & theo dõi 9 chỉ số vòng cơ thể'
              : 'Realistic anatomical body vector diagram and 9-point circumference tracker'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => openModalWithFocus()}
            className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-900 dark:bg-zinc-50 text-zinc-50 dark:text-zinc-900 rounded-full text-xs font-semibold hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{language === 'vi' ? 'Ghi nhận số đo mới' : 'Log New Measurements'}</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-3xl border border-zinc-200/80 dark:border-zinc-900 bg-white dark:bg-zinc-900/50 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
              {language === 'vi' ? 'TIẾN TRÌNH THEO DÕI' : 'LOGGED COVERAGE'}
            </span>
            <div className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
              {loggedCount} / 9 {language === 'vi' ? 'vị trí' : 'points'}
            </div>
          </div>
          <div className="w-9 h-9 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
            <Activity className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
          </div>
        </div>

        <div className="p-5 rounded-3xl border border-zinc-200/80 dark:border-zinc-900 bg-white dark:bg-zinc-900/50 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
              {language === 'vi' ? 'LẦN GHI NHẬN GẦN NHẤT' : 'LAST RECORDED'}
            </span>
            <div className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
              {latest?.loggedAt
                ? new Date(latest.loggedAt).toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })
                : language === 'vi'
                  ? 'Chưa có bản ghi'
                  : 'No records'}
            </div>
          </div>
          <div className="w-9 h-9 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
            <Calendar className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
          </div>
        </div>

        <div className="p-5 rounded-3xl border border-zinc-200/80 dark:border-zinc-900 bg-white dark:bg-zinc-900/50 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
              {language === 'vi' ? 'ĐƠN VỊ ĐO LƯỜNG' : 'UNIT SYSTEM'}
            </span>
            <div className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
              {unitSystem === 'IMPERIAL' ? 'Inches (in)' : 'Centimeters (cm)'}
            </div>
          </div>
          <div className="w-9 h-9 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
            <Ruler className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
          </div>
        </div>
      </div>

      {/* Single Unified Section: Interactive Vector Map (Left) + 9 Cards Grid (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Anatomical Vector Body Map */}
        <div className="lg:col-span-4 rounded-3xl border border-zinc-200/80 dark:border-zinc-900 bg-white dark:bg-zinc-900 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
            <div>
              <h3 className="font-semibold text-sm text-zinc-900 dark:text-zinc-50">
                {language === 'vi' ? 'Sơ đồ Định vị' : 'Anatomical Map'}
              </h3>
              <p className="text-[11px] text-zinc-400">
                {language === 'vi'
                  ? 'Nhấp chọn điểm để vị trí thẻ tương ứng'
                  : 'Click any node to locate metric'}
              </p>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-xl border border-emerald-200 dark:border-emerald-900/40">
              {unitLabel}
            </span>
          </div>

          {/* Calibrated 320px x 320px Square Body Figure Wrapper */}
          <div className="relative w-[320px] h-[320px] aspect-square my-4 flex items-center justify-center mx-auto">
            <Image
              src="/images/body_vector_realistic.png"
              alt="Realistic Anatomical Human Body Vector"
              width={320}
              height={320}
              className="mix-blend-multiply dark:mix-blend-screen dark:invert opacity-90 transition-all object-contain select-none w-full h-full"
              priority
            />

            {/* Interactive Hotspots */}
            {metricCards.map((pt) => {
              const isSelected = selectedPointKey === pt.key;
              return (
                <button
                  key={pt.key}
                  onClick={() => setSelectedPointKey(pt.key)}
                  style={{ top: `${pt.pinY}%`, left: `${pt.pinX}%` }}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full transition-all cursor-pointer ${
                    isSelected
                      ? 'w-6 h-6 bg-emerald-500 ring-4 ring-emerald-500/30 border-2 border-white dark:border-zinc-900 scale-125 z-20 shadow-md'
                      : 'w-3.5 h-3.5 bg-zinc-900 dark:bg-zinc-100 hover:bg-emerald-500 border-2 border-white dark:border-zinc-900 hover:scale-125 shadow-xs z-10 opacity-75 hover:opacity-100'
                  }`}
                  title={`${language === 'vi' ? pt.nameVi : pt.nameEn}: ${convertValue(pt.currVal)}`}
                />
              );
            })}
          </div>
        </div>

        {/* Right Column: Filter Bar & 9 Cards Grid */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h3 className="font-semibold text-base text-zinc-900 dark:text-zinc-50">
              {language === 'vi' ? 'Danh sách Chỉ số Vóc dáng' : 'Anatomical Metrics'}
            </h3>

            <div className="flex items-center gap-1.5 p-1 bg-zinc-100 dark:bg-zinc-900 rounded-2xl border border-zinc-200/60 dark:border-zinc-800/80">
              {[
                { key: 'all', labelVi: 'Tất cả 9 vị trí', labelEn: 'All 9 Points' },
                { key: 'upper', labelVi: 'Thân trên', labelEn: 'Upper Body' },
                { key: 'lower', labelVi: 'Thân dưới', labelEn: 'Lower Body' },
                { key: 'limbs', labelVi: 'Tay & Chân', labelEn: 'Limbs' },
              ].map((f) => (
                <button
                  key={f.key}
                  onClick={() => setActiveRegionFilter(f.key as any)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                    activeRegionFilter === f.key
                      ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 shadow-xs font-semibold'
                      : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                  }`}
                >
                  {language === 'vi' ? f.labelVi : f.labelEn}
                </button>
              ))}
            </div>
          </div>

          {/* Metric Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCards.map((card) => {
              const delta = getDeltaBadge(card.currVal, card.prevVal);
              const isSelected = selectedPointKey === card.key;
              return (
                <div
                  key={card.key}
                  onClick={() => setSelectedPointKey(card.key)}
                  className={`p-5 rounded-3xl border transition-all cursor-pointer space-y-4 group ${
                    isSelected
                      ? 'bg-emerald-50/50 dark:bg-emerald-950/30 border-emerald-500 dark:border-emerald-700 shadow-xs ring-2 ring-emerald-500/20'
                      : 'bg-white dark:bg-zinc-900 border-zinc-200/80 dark:border-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-800 shadow-xs'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                      {card.regionTag}
                    </span>
                    {delta}
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 group-hover:text-zinc-900 dark:group-hover:text-zinc-50 transition-colors">
                      {language === 'vi' ? card.nameVi : card.nameEn}
                    </h3>
                    <div className="text-3xl font-normal tracking-tight text-zinc-900 dark:text-zinc-50">
                      {convertValue(card.currVal)}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-zinc-100 dark:border-zinc-800/80 text-xs text-zinc-400">
                    <span>
                      {card.prevVal !== null
                        ? `${language === 'vi' ? 'Trước đó' : 'Prev'}: ${convertValue(card.prevVal)}`
                        : language === 'vi'
                          ? 'Chưa có bản ghi cũ'
                          : 'First record'}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedPointKey(card.key);
                        openModalWithFocus(card.key);
                      }}
                      className="inline-flex items-center gap-1 text-zinc-900 dark:text-zinc-50 font-semibold hover:underline cursor-pointer"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>{language === 'vi' ? 'Sửa' : 'Edit'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* History Archive Table */}
      <div className="rounded-3xl border border-zinc-200/80 dark:border-zinc-900 bg-white dark:bg-zinc-900 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-base text-zinc-900 dark:text-zinc-50">
            {language === 'vi' ? 'Lịch sử Ghi nhận Số đo' : 'Measurement Log History'}
          </h3>
          <span className="text-xs text-zinc-400">
            {history.length} {language === 'vi' ? 'bản ghi' : 'entries'}
          </span>
        </div>

        {history.length === 0 ? (
          <p className="text-xs text-zinc-400 italic py-4">
            {language === 'vi' ? 'Chưa có bản ghi số đo nào được lưu' : 'No measurement logs recorded yet'}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs font-normal">
              <thead>
                <tr className="border-b border-zinc-100 dark:border-zinc-800 text-zinc-400 uppercase text-[10px] tracking-wider font-semibold">
                  <th className="py-3 px-4">{language === 'vi' ? 'Ngày' : 'Date'}</th>
                  <th className="py-3 px-4">{language === 'vi' ? 'Vòng Ngực' : 'Chest'}</th>
                  <th className="py-3 px-4">{language === 'vi' ? 'Vòng Eo' : 'Waist'}</th>
                  <th className="py-3 px-4">{language === 'vi' ? 'Vòng Mông' : 'Hips'}</th>
                  <th className="py-3 px-4">{language === 'vi' ? 'Bắp Tay' : 'Biceps'}</th>
                  <th className="py-3 px-4">{language === 'vi' ? 'Vòng Đùi' : 'Thighs'}</th>
                  <th className="py-3 px-4 text-right">{language === 'vi' ? 'Thao tác' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80 text-zinc-700 dark:text-zinc-300">
                {history.map((log) => (
                  <tr key={log.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-zinc-900 dark:text-zinc-100">
                      {new Date(log.loggedAt).toLocaleDateString(
                        language === 'vi' ? 'vi-VN' : 'en-US',
                        { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }
                      )}
                    </td>
                    <td className="py-3.5 px-4">{convertValue(log.chestCm)}</td>
                    <td className="py-3.5 px-4">{convertValue(log.waistCm)}</td>
                    <td className="py-3.5 px-4">{convertValue(log.hipsCm)}</td>
                    <td className="py-3.5 px-4">{convertValue(log.bicepsCm)}</td>
                    <td className="py-3.5 px-4">{convertValue(log.thighsCm)}</td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setDeleteLogId(log.id)}
                        className="p-1.5 rounded-xl text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all cursor-pointer"
                        aria-label="Delete log"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
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
      <PortalModal
        isOpen={showLogModal}
        onClose={() => setShowLogModal(false)}
        maxWidth="2xl"
        className="space-y-6"
      >
        <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
              <Ruler className="w-4 h-4 text-zinc-900 dark:text-zinc-100" />
            </div>
            <h3 className="font-semibold text-base text-zinc-900 dark:text-zinc-50">
              {language === 'vi'
                ? `Ghi nhận Số đo Cơ thể (${unitLabel})`
                : `Log Body Circumference (${unitLabel})`}
            </h3>
          </div>
          <button
            onClick={() => setShowLogModal(false)}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSaveLog} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { key: 'chest', label: language === 'vi' ? 'Vòng Ngực' : 'Chest' },
              { key: 'waist', label: language === 'vi' ? 'Vòng Eo' : 'Waist' },
              { key: 'hips', label: language === 'vi' ? 'Vòng Mông' : 'Hips' },
              { key: 'biceps', label: language === 'vi' ? 'Vòng Bắp Tay' : 'Biceps' },
              { key: 'forearms', label: language === 'vi' ? 'Vòng Cẳng Tay' : 'Forearms' },
              { key: 'thighs', label: language === 'vi' ? 'Vòng Đùi' : 'Thighs' },
              { key: 'calves', label: language === 'vi' ? 'Vòng Bắp Chân' : 'Calves' },
              { key: 'shoulders', label: language === 'vi' ? 'Vòng Vai' : 'Shoulders' },
              { key: 'neck', label: language === 'vi' ? 'Vòng Cổ' : 'Neck' },
            ].map((item) => (
              <div key={item.key} className="space-y-1">
                <label htmlFor={`input-${item.key}`} className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  {item.label} ({unitLabel})
                </label>
                <input
                  id={`input-${item.key}`}
                  type="number"
                  step="0.1"
                  placeholder={language === 'vi' ? `Ví dụ: ${unitSystem === 'IMPERIAL' ? '32.5' : '82'}` : `e.g. ${unitSystem === 'IMPERIAL' ? '32.5' : '82'}`}
                  autoFocus={focusedField === item.key}
                  value={(formValues as any)[item.key]}
                  onChange={(e) =>
                    setFormValues((prev) => ({ ...prev, [item.key]: e.target.value }))
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 font-normal text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-50 transition-all"
                />
              </div>
            ))}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="log-date-input" className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              {language === 'vi' ? 'Ngày ghi nhận' : 'Log Date'}
            </label>
            <input
              id="log-date-input"
              type="date"
              value={formValues.date}
              onChange={(e) => setFormValues((prev) => ({ ...prev, date: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 font-normal text-xs text-zinc-900 dark:text-zinc-100"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowLogModal(false)}
              className="flex-1 py-2.5 rounded-xl font-medium text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 cursor-pointer"
            >
              {language === 'vi' ? 'Hủy' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2.5 rounded-xl font-medium text-xs bg-zinc-900 dark:bg-zinc-50 text-zinc-50 dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all cursor-pointer disabled:opacity-50"
            >
              {isSubmitting
                ? language === 'vi'
                  ? 'Đang lưu...'
                  : 'Saving...'
                : language === 'vi'
                  ? 'Lưu số đo'
                  : 'Save Log'}
            </button>
          </div>
        </form>
      </PortalModal>

      <ConfirmModal
        isOpen={!!deleteLogId}
        onClose={() => setDeleteLogId(null)}
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
        title="Xóa bản ghi số đo này?"
        description="Hành động này sẽ xóa vĩnh viễn bản ghi số đo khỏi lịch sử theo dõi vóc dáng của bạn."
        confirmText="Xóa ngay"
        cancelText="Hủy"
        variant="danger"
      />
    </div>
  );
}
