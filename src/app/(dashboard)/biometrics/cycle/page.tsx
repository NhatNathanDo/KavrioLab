'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/components/language-provider';
import PortalModal from '@/components/shared/PortalModal';
import {
  HeartPulse,
  Calendar as CalendarIcon,
  Plus,
  Trash2,
  Pencil,
  Sparkles,
  ShieldCheck,
  Activity,
  Smile,
  Clock,
  ChevronLeft,
  ChevronRight,
  Info,
  Sliders,
} from 'lucide-react';
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths, addDays } from '@/lib/utils/dateUtils';
import { getDayCycleStatus, CycleOverview } from '@/lib/calculations/cycle';

interface CycleLogItem {
  id: string;
  startDate: string;
  endDate?: string | null;
  cycleLengthDays?: number | null;
  periodLengthDays?: number | null;
  notes?: string | null;
}

interface SymptomLogItem {
  id: string;
  date: string;
  flowLevel?: 'LIGHT' | 'MEDIUM' | 'HEAVY' | 'SPOTTING' | null;
  symptoms: string[];
  mood?: string | null;
  basalBodyTemp?: number | null;
  ovulationTestResult: 'NOT_TESTED' | 'NEGATIVE' | 'POSITIVE';
  notes?: string | null;
}

const FLOW_OPTIONS = [
  { id: 'SPOTTING', labelEn: 'Spotting', labelVi: 'Lốm đốm' },
  { id: 'LIGHT', labelEn: 'Light', labelVi: 'Ít' },
  { id: 'MEDIUM', labelEn: 'Medium', labelVi: 'Vừa' },
  { id: 'HEAVY', labelEn: 'Heavy', labelVi: 'Nhiều' },
];

const COMMON_SYMPTOMS = [
  { id: 'cramps', labelEn: 'Cramps', labelVi: 'Đau bụng kinh' },
  { id: 'headache', labelEn: 'Headache', labelVi: 'Đau đầu' },
  { id: 'bloating', labelEn: 'Bloating', labelVi: 'Chướng bụng' },
  { id: 'fatigue', labelEn: 'Fatigue', labelVi: 'Mệt mỏi' },
  { id: 'acne', labelEn: 'Acne / Skin', labelVi: 'Mụn / Da liễu' },
  { id: 'backache', labelEn: 'Lower Back Pain', labelVi: 'Đau lưng' },
  { id: 'breast_tenderness', labelEn: 'Breast Tenderness', labelVi: 'Căng ngực' },
  { id: 'cravings', labelEn: 'Food Cravings', labelVi: 'Thèm ăn' },
];

const MOOD_OPTIONS = [
  { id: 'happy', labelEn: 'Happy 😊', labelVi: 'Vui vẻ 😊' },
  { id: 'calm', labelEn: 'Calm 😌', labelVi: 'Bình tĩnh 😌' },
  { id: 'anxious', labelEn: 'Anxious 😰', labelVi: 'Lo âu 😰' },
  { id: 'irritable', labelEn: 'Irritable 😠', labelVi: 'Cáu gắt 😠' },
  { id: 'sad', labelEn: 'Sad 😢', labelVi: 'Buồn 😢' },
  { id: 'energetic', labelEn: 'Energetic ⚡', labelVi: 'Tràn năng lượng ⚡' },
];

export default function CycleTrackerPage() {
  const { status } = useSession();
  const router = useRouter();
  const { language } = useTranslation();

  const isVi = language === 'vi';

  const [overview, setOverview] = useState<CycleOverview | null>(null);
  const [cycles, setCycles] = useState<CycleLogItem[]>([]);
  const [symptoms, setSymptoms] = useState<SymptomLogItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Modal States
  const [isPeriodModalOpen, setIsPeriodModalOpen] = useState<boolean>(false);
  const [editingCycleId, setEditingCycleId] = useState<string | null>(null);
  const [periodStartDate, setPeriodStartDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [periodEndDate, setPeriodEndDate] = useState<string>('');
  const [periodNotes, setPeriodNotes] = useState<string>('');
  const [isSubmittingPeriod, setIsSubmittingPeriod] = useState<boolean>(false);

  // Custom Settings States
  const [typicalCycleLength, setTypicalCycleLength] = useState<number>(28);
  const [typicalPeriodDuration, setTypicalPeriodDuration] = useState<number>(5);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<boolean>(false);
  const [newTypicalCycle, setNewTypicalCycle] = useState<string>('28');
  const [newTypicalPeriod, setNewTypicalPeriod] = useState<string>('5');
  const [isSavingSettings, setIsSavingSettings] = useState<boolean>(false);

  const handleEditCycle = (c: CycleLogItem) => {
    setEditingCycleId(c.id);
    setPeriodStartDate(format(parseISO(c.startDate), 'yyyy-MM-dd'));
    setPeriodEndDate(c.endDate ? format(parseISO(c.endDate), 'yyyy-MM-dd') : '');
    setPeriodNotes(c.notes || '');
    setIsPeriodModalOpen(true);
  };

  // Symptom Drawer States
  const [isSymptomModalOpen, setIsSymptomModalOpen] = useState<boolean>(false);
  const [symptomDate, setSymptomDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [selectedFlow, setSelectedFlow] = useState<string>('MEDIUM');
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [selectedMood, setSelectedMood] = useState<string>('calm');
  const [bbt, setBbt] = useState<string>('');
  const [ovulationTest, setOvulationTest] = useState<string>('NOT_TESTED');
  const [symptomNotes, setSymptomNotes] = useState<string>('');
  const [isSubmittingSymptom, setIsSubmittingSymptom] = useState<boolean>(false);

  // Onboarding Setup Wizard States (when cycles.length === 0)
  const [setupStep, setSetupStep] = useState<number>(1);
  const [setupStartDate, setSetupStartDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [setupPeriodDuration, setSetupPeriodDuration] = useState<number>(5);
  const [setupCycleLength, setSetupCycleLength] = useState<number>(28);
  const [isSubmittingSetup, setIsSubmittingSetup] = useState<boolean>(false);

  const handleSetupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingSetup(true);
    try {
      const start = parseISO(setupStartDate);
      const end = addDays(start, setupPeriodDuration - 1);
      const res = await fetch('/api/biometrics/cycle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startDate: format(start, 'yyyy-MM-dd'),
          endDate: format(end, 'yyyy-MM-dd'),
          notes: `Initial Setup — Duration: ${setupPeriodDuration} days, Avg Cycle: ${setupCycleLength} days`,
        }),
      });

      if (res.ok) {
        await fetchCycleData();
      }
    } catch (err) {
      console.error('Failed setup submission:', err);
    } finally {
      setIsSubmittingSetup(false);
    }
  };

  // Quick Log State
  const [isQuickLogging, setIsQuickLogging] = useState<boolean>(false);

  const handleQuickLogToday = async () => {
    setIsQuickLogging(true);
    try {
      const todayStr = format(new Date(), 'yyyy-MM-dd');
      const latestCycle = cycles[0];
      const isPeriodOngoing = latestCycle && !latestCycle.endDate;

      let payload;
      if (isPeriodOngoing) {
        payload = {
          id: latestCycle.id,
          startDate: format(parseISO(latestCycle.startDate), 'yyyy-MM-dd'),
          endDate: todayStr,
          notes: latestCycle.notes,
        };
      } else {
        payload = {
          startDate: todayStr,
          notes: isVi ? 'Tới tháng hôm nay (Đánh dấu nhanh)' : 'Period started today (Quick Log)',
        };
      }

      const res = await fetch('/api/biometrics/cycle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        await fetchCycleData();
      }
    } catch (err) {
      console.error('Quick log failed:', err);
    } finally {
      setIsQuickLogging(false);
    }
  };

  // Calendar Month View State & Memoized Day Statuses
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());

  const monthDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    return eachDayOfInterval({ start: monthStart, end: monthEnd });
  }, [currentMonth]);

  const dayStatuses = useMemo(() => {
    const avgCycle = overview?.avgCycleLength || 28;
    const avgPeriod = overview?.avgPeriodLength || 5;
    return monthDays.map((day) => ({
      day,
      dateStr: format(day, 'yyyy-MM-dd'),
      dayNumber: format(day, 'd'),
      status: getDayCycleStatus(day, cycles, avgCycle, avgPeriod),
    }));
  }, [monthDays, cycles, overview?.avgCycleLength, overview?.avgPeriodLength]);

  const fetchCycleData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/biometrics/cycle');
      if (res.ok) {
        const json = await res.json();
        setOverview(json.overview || null);
        setCycles(json.cycles || []);
        setSymptoms(json.symptoms || []);
      }
    } catch (err) {
      console.error('Failed to load cycle data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      fetchCycleData();
    }
  }, [status, router, fetchCycleData]);

  useEffect(() => {
    if (cycles.length > 0) {
      let defaultCycle = 28;
      let defaultPeriod = 5;
      cycles.forEach((c) => {
        if (c.notes) {
          const cycleMatch = c.notes.match(/\[DefaultCycle:\s*(\d+)\]/i);
          const periodMatch = c.notes.match(/\[DefaultPeriod:\s*(\d+)\]/i);
          if (cycleMatch) {
            defaultCycle = parseInt(cycleMatch[1], 10);
          } else {
            const obCycleMatch = c.notes.match(/Avg Cycle:\s*(\d+)/i);
            if (obCycleMatch) {
              defaultCycle = parseInt(obCycleMatch[1], 10);
            }
          }
          if (periodMatch) {
            defaultPeriod = parseInt(periodMatch[1], 10);
          } else {
            const obPeriodMatch = c.notes.match(/Duration:\s*(\d+)/i);
            if (obPeriodMatch) {
              defaultPeriod = parseInt(obPeriodMatch[1], 10);
            }
          }
        }
      });
      setTypicalCycleLength(defaultCycle);
      setTypicalPeriodDuration(defaultPeriod);
    }
  }, [cycles]);

  const handleOpenSettings = () => {
    setNewTypicalCycle(String(typicalCycleLength));
    setNewTypicalPeriod(String(typicalPeriodDuration));
    setIsSettingsModalOpen(true);
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cycles.length === 0) return;
    setIsSavingSettings(true);

    try {
      const oldest = cycles[cycles.length - 1];
      const cycleLen = parseInt(newTypicalCycle, 10);
      const periodLen = parseInt(newTypicalPeriod, 10);

      let cleanNotes = (oldest.notes || '')
        .replace(/\[DefaultCycle:\s*\d+\]/gi, '')
        .replace(/\[DefaultPeriod:\s*\d+\]/gi, '')
        .trim();
      const updatedNotes = `${cleanNotes} [DefaultCycle: ${cycleLen}] [DefaultPeriod: ${periodLen}]`.trim();

      const res = await fetch('/api/biometrics/cycle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: oldest.id,
          startDate: oldest.startDate,
          endDate: oldest.endDate || null,
          notes: updatedNotes,
        }),
      });

      if (res.ok) {
        setIsSettingsModalOpen(false);
        await fetchCycleData();
      }
    } catch (err) {
      console.error('Failed to save settings:', err);
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleLogPeriodSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingPeriod(true);
    try {
      const res = await fetch('/api/biometrics/cycle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingCycleId || undefined,
          startDate: periodStartDate,
          endDate: periodEndDate || null,
          notes: periodNotes || null,
        }),
      });

      if (res.ok) {
        setIsPeriodModalOpen(false);
        setEditingCycleId(null);
        setPeriodNotes('');
        await fetchCycleData();
      }
    } catch (err) {
      console.error('Failed to log period:', err);
    } finally {
      setIsSubmittingPeriod(false);
    }
  };

  const handleLogSymptomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingSymptom(true);
    try {
      const res = await fetch('/api/biometrics/cycle/symptoms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: symptomDate,
          flowLevel: selectedFlow,
          symptoms: selectedSymptoms,
          mood: selectedMood,
          basalBodyTemp: bbt ? parseFloat(bbt) : null,
          ovulationTestResult: ovulationTest,
          notes: symptomNotes || null,
        }),
      });

      if (res.ok) {
        setIsSymptomModalOpen(false);
        await fetchCycleData();
      }
    } catch (err) {
      console.error('Failed to log symptoms:', err);
    } finally {
      setIsSubmittingSymptom(false);
    }
  };

  const handleDeleteCycle = async (id: string) => {
    if (!confirm(isVi ? 'Bạn có chắc chắn muốn xóa kỳ hành kinh này?' : 'Are you sure you want to delete this period record?')) {
      return;
    }
    try {
      const res = await fetch(`/api/biometrics/cycle?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchCycleData();
      }
    } catch (err) {
      console.error('Failed to delete cycle log:', err);
    }
  };

  const toggleSymptom = (symId: string) => {
    setSelectedSymptoms((prev) =>
      prev.includes(symId) ? prev.filter((id) => id !== symId) : [...prev, symId]
    );
  };

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-rose-500 border-t-transparent" />
      </div>
    );
  }

  // Calendar rendering helpers
  const getPhaseBadgeColor = (phase?: string) => {
    switch (phase) {
      case 'MENSTRUAL':
        return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
      case 'FOLLICULAR':
        return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'OVULATORY':
        return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      case 'LUTEAL':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      default:
        return 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20';
    }
  };

  const getFertilityBadgeColor = (status?: string) => {
    switch (status) {
      case 'HIGH_FERTILE':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'MODERATE_FERTILE':
        return 'bg-violet-500/20 text-violet-400 border-violet-500/30';
      case 'PERIOD':
        return 'bg-rose-500/20 text-rose-400 border-rose-500/30';
      case 'SAFE':
      default:
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    }
  };

  const latestCycle = cycles[0];
  const isPeriodOngoing = !!(latestCycle && !latestCycle.endDate);

  let quickLogButtonText = isVi ? '🩸 Hôm nay tới tháng' : '🩸 Period Started Today';
  if (isQuickLogging) {
    quickLogButtonText = isVi ? 'Đang lưu...' : 'Logging...';
  } else if (isPeriodOngoing) {
    quickLogButtonText = isVi ? '🟢 Hôm nay hết tháng' : '🟢 Period Ended Today';
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8 p-4 md:p-8">
      {/* Top Header & Quick Action Buttons */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-500">
              <HeartPulse className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                {isVi ? 'Chu Kỳ Kinh Nguyệt & Rụng Trứng' : 'Menstrual Cycle & Ovulation Tracker'}
              </h1>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                {isVi
                  ? 'Theo dõi sức khỏe sinh sản, rụng trứng và dự đoán ngày an toàn / nguy hiểm'
                  : 'Track period dates, ovulation window, fertility status, and daily wellness'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleQuickLogToday}
            disabled={isQuickLogging}
            className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold shadow-sm transition active:scale-95 disabled:opacity-50 cursor-pointer ${
              isPeriodOngoing
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20'
            }`}
          >
            <HeartPulse className={`h-4 w-4 animate-pulse ${isPeriodOngoing ? 'text-emerald-500' : 'text-rose-500'}`} />
            {quickLogButtonText}
          </button>

          <button
            onClick={() => setIsSymptomModalOpen(true)}
            className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-800 shadow-sm transition hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800/80"
          >
            <Smile className="h-4 w-4 text-purple-500" />
            {isVi ? 'Ghi triệu chứng' : 'Log Symptoms'}
          </button>

          <button
            onClick={() => {
              setEditingCycleId(null);
              setPeriodStartDate(format(new Date(), 'yyyy-MM-dd'));
              setPeriodEndDate('');
              setPeriodNotes('');
              setIsPeriodModalOpen(true);
            }}
            className="flex items-center gap-2 rounded-xl bg-rose-500 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-rose-600 dark:bg-rose-600 dark:hover:bg-rose-500"
          >
            <Plus className="h-4 w-4" />
            {isVi ? 'Tùy chỉnh ngày' : 'Custom Log'}
          </button>
        </div>
      </div>

      {/* Main Stats Hub & Cycle Wheel Widget OR Onboarding Setup Wizard */}
      {cycles.length === 0 ? (
        <div className="mx-auto max-w-2xl rounded-3xl border border-zinc-200 bg-white p-6 md:p-10 shadow-sm dark:border-zinc-800/80 dark:bg-[#0f0f11] text-center space-y-6">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-rose-500/10 text-rose-500">
            <HeartPulse className="h-8 w-8" />
          </div>

          <div>
            <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              {isVi ? 'Thiết Lập Chu Kỳ Sinh Sản Ban Đầu' : 'Initial Cycle Setup'}
            </h2>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              {isVi
                ? 'Nhập 3 thông tin cơ bản để KavrioLab dự đoán chính xác ngày tới tháng, rụng trứng và cửa sổ thụ thai cho bạn.'
                : 'Answer 3 quick questions so KavrioLab can calculate your period dates, ovulation, and fertile days accurately.'}
            </p>
          </div>

          {/* Progress Step Bar */}
          <div className="flex items-center justify-center gap-2">
            {[1, 2, 3].map((step) => (
              <div
                key={step}
                className={`h-2 rounded-full transition-all duration-300 ${
                  setupStep === step
                    ? 'w-10 bg-rose-500'
                    : setupStep > step
                    ? 'w-6 bg-rose-500/40'
                    : 'w-6 bg-zinc-200 dark:bg-zinc-800'
                }`}
              />
            ))}
          </div>

          <form onSubmit={handleSetupSubmit} className="space-y-6 text-left pt-2">
            {/* STEP 1 */}
            {setupStep === 1 && (
              <div className="space-y-4">
                <div className="text-center">
                  <span className="text-xs font-semibold text-rose-500 uppercase tracking-widest">
                    {isVi ? 'Bước 1 trên 3' : 'Step 1 of 3'}
                  </span>
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mt-1">
                    {isVi ? 'Lần gần nhất bạn tới tháng là ngày nào?' : 'When did your last period start?'}
                  </h3>
                </div>

                <div>
                  <input
                    type="date"
                    required
                    value={setupStartDate}
                    onChange={(e) => setSetupStartDate(e.target.value)}
                    className="w-full rounded-2xl border border-zinc-200 bg-white p-4 text-center text-lg font-bold text-zinc-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-rose-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
                  />
                </div>

                {/* Quick presets */}
                <div className="flex flex-wrap justify-center gap-2">
                  {[
                    { labelVi: 'Hôm nay', labelEn: 'Today', daysAgo: 0 },
                    { labelVi: '3 ngày trước', labelEn: '3 days ago', daysAgo: 3 },
                    { labelVi: '5 ngày trước', labelEn: '5 days ago', daysAgo: 5 },
                    { labelVi: '7 ngày trước', labelEn: '7 days ago', daysAgo: 7 },
                    { labelVi: '14 ngày trước', labelEn: '14 days ago', daysAgo: 14 },
                  ].map((p) => {
                    const pDate = format(addDays(new Date(), -p.daysAgo), 'yyyy-MM-dd');
                    const active = setupStartDate === pDate;
                    return (
                      <button
                        type="button"
                        key={p.daysAgo}
                        onClick={() => setSetupStartDate(pDate)}
                        className={`rounded-xl px-3.5 py-2 text-xs font-medium border transition ${
                          active
                            ? 'border-rose-500 bg-rose-500/10 text-rose-500 font-semibold'
                            : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900'
                        }`}
                      >
                        {isVi ? p.labelVi : p.labelEn}
                      </button>
                    );
                  })}
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setSetupStep(2)}
                    className="w-full rounded-2xl bg-rose-500 py-3.5 text-sm font-semibold text-white shadow-sm hover:bg-rose-600 transition"
                  >
                    {isVi ? 'Tiếp theo' : 'Next Step'}
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2 */}
            {setupStep === 2 && (
              <div className="space-y-4">
                <div className="text-center">
                  <span className="text-xs font-semibold text-rose-500 uppercase tracking-widest">
                    {isVi ? 'Bước 2 trên 3' : 'Step 2 of 3'}
                  </span>
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mt-1">
                    {isVi ? 'Kỳ hành kinh của bạn thường kéo dài bao lâu?' : 'How long does your period usually last?'}
                  </h3>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {[3, 4, 5, 6, 7, 8, 9, 10].map((dur) => (
                    <button
                      type="button"
                      key={dur}
                      onClick={() => setSetupPeriodDuration(dur)}
                      className={`rounded-2xl p-4 text-center border transition ${
                        setupPeriodDuration === dur
                          ? 'border-rose-500 bg-rose-500/10 text-rose-500 font-bold'
                          : 'border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900'
                      }`}
                    >
                      <div className="text-xl font-black">{dur}</div>
                      <div className="text-[10px] text-zinc-400 uppercase">{isVi ? 'ngày' : 'days'}</div>
                    </button>
                  ))}
                </div>

                <div className="pt-4 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => setSetupStep(1)}
                    className="rounded-2xl border border-zinc-200 px-5 py-3 text-sm font-medium text-zinc-600 dark:border-zinc-800 dark:text-zinc-400"
                  >
                    {isVi ? 'Quay lại' : 'Back'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSetupStep(3)}
                    className="flex-1 rounded-2xl bg-rose-500 py-3 text-sm font-semibold text-white shadow-sm hover:bg-rose-600 transition"
                  >
                    {isVi ? 'Tiếp theo' : 'Next Step'}
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3 */}
            {setupStep === 3 && (
              <div className="space-y-4">
                <div className="text-center">
                  <span className="text-xs font-semibold text-rose-500 uppercase tracking-widest">
                    {isVi ? 'Bước 3 trên 3' : 'Step 3 of 3'}
                  </span>
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mt-1">
                    {isVi ? 'Độ dài chu kỳ trung bình của bạn là bao nhiêu?' : 'What is your typical cycle length?'}
                  </h3>
                  <p className="text-xs text-zinc-400 mt-1">
                    {isVi ? '(Khoảng cách giữa 2 ngày bắt đầu của 2 kỳ liên tiếp)' : '(Days from start of one period to start of the next)'}
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {[24, 26, 28, 30, 32, 35].map((len) => (
                    <button
                      type="button"
                      key={len}
                      onClick={() => setSetupCycleLength(len)}
                      className={`rounded-2xl p-4 text-center border transition ${
                        setupCycleLength === len
                          ? 'border-rose-500 bg-rose-500/10 text-rose-500 font-bold'
                          : 'border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900'
                      }`}
                    >
                      <div className="text-xl font-black">{len} {len === 28 && <span className="text-xs font-normal text-rose-500">★</span>}</div>
                      <div className="text-[10px] text-zinc-400 uppercase">{isVi ? (len === 28 ? 'ngày (Chuẩn)' : 'ngày') : (len === 28 ? 'days (Std)' : 'days')}</div>
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => setSetupCycleLength(28)}
                  className="w-full text-center text-xs text-zinc-400 hover:text-rose-500 transition py-1"
                >
                  {isVi ? 'Tôi không rõ — Dùng chuẩn mặc định 28 ngày' : 'Not sure — Use default 28 days'}
                </button>

                <div className="pt-4 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => setSetupStep(2)}
                    className="rounded-2xl border border-zinc-200 px-5 py-3.5 text-sm font-medium text-zinc-600 dark:border-zinc-800 dark:text-zinc-400"
                  >
                    {isVi ? 'Quay lại' : 'Back'}
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingSetup}
                    className="flex-1 rounded-2xl bg-rose-500 py-3.5 text-sm font-semibold text-white shadow-sm hover:bg-rose-600 transition disabled:opacity-50"
                  >
                    {isSubmittingSetup
                      ? isVi ? 'Đang tính toán...' : 'Calculating...'
                      : isVi ? 'Hoàn tất & Tính toán ngay 🚀' : 'Finish & Calculate Now 🚀'}
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      ) : overview && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Cycle Ring Hero Card */}
          <div className="relative overflow-hidden rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800/80 dark:bg-[#0f0f11] lg:col-span-2">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              {/* Cycle Ring Gauge */}
              <div className="flex flex-col items-center justify-center p-4">
                <div className={`relative flex h-52 w-52 items-center justify-center rounded-full border-8 ${
                  overview.isLate
                    ? 'border-amber-500/30 bg-amber-500/5'
                    : 'border-rose-500/10 dark:border-rose-500/20 bg-rose-500/5'
                }`}>
                  <div className="text-center">
                    <span className="text-xs uppercase tracking-widest text-zinc-400">
                      {overview.isLate ? (isVi ? 'Trễ kinh' : 'Late Period') : (isVi ? 'Ngày chu kỳ' : 'Cycle Day')}
                    </span>
                    <div className={`text-5xl font-black tracking-tight ${
                      overview.isLate ? 'text-amber-500' : 'text-zinc-900 dark:text-zinc-100'
                    }`}>
                      {overview.isLate ? `+${overview.daysLate}` : overview.currentCycleDay}
                    </div>
                    <span className="text-xs text-zinc-500">
                      {overview.isLate
                        ? (isVi ? `ngày trễ (dự kiến ${format(parseISO(overview.expectedNextPeriod), 'dd/MM')})` : `days late (expected ${format(parseISO(overview.expectedNextPeriod), 'MMM dd')})`)
                        : `/ ${overview.avgCycleLength} ${isVi ? 'ngày' : 'days'}`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Cycle Status & Risk Indicators */}
              <div className="flex-1 space-y-4">
                <div className="flex flex-wrap gap-2">
                  {overview.isLate && (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-600 dark:text-amber-400 animate-pulse">
                      <Info className="h-3.5 w-3.5 text-amber-500" />
                      {isVi
                        ? `⚠️ Trễ kinh ${overview.daysLate} ngày (Dự kiến từ ${format(parseISO(overview.expectedNextPeriod), 'dd/MM')})`
                        : `⚠️ ${overview.daysLate} Days Late (Expected ${format(parseISO(overview.expectedNextPeriod), 'MMM dd')})`}
                    </span>
                  )}

                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wider ${getPhaseBadgeColor(
                      overview.currentPhase
                    )}`}
                  >
                    <Activity className="h-3.5 w-3.5" />
                    {overview.currentPhase === 'MENSTRUAL'
                      ? isVi ? 'Giai đoạn Hành kinh' : 'Menstrual Phase'
                      : overview.currentPhase === 'FOLLICULAR'
                      ? isVi ? 'Giai đoạn Nang trứng' : 'Follicular Phase'
                      : overview.currentPhase === 'OVULATORY'
                      ? isVi ? 'Giai đoạn Rụng trứng' : 'Ovulation Phase'
                      : isVi ? 'Giai đoạn Hoàng thể' : 'Luteal Phase'}
                  </span>

                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold tracking-wider ${getFertilityBadgeColor(
                      overview.fertilityStatus
                    )}`}
                  >
                    <ShieldCheck className="h-3.5 w-3.5" />
                    {overview.fertilityStatus === 'HIGH_FERTILE'
                      ? isVi ? 'Ngày Nguy Hiểm (Dễ Thụ Thai)' : 'High Fertility Window'
                      : overview.fertilityStatus === 'MODERATE_FERTILE'
                      ? isVi ? 'Khả năng Thụ Thai Vừa' : 'Moderate Fertility'
                      : overview.fertilityStatus === 'PERIOD'
                      ? isVi ? 'Ngày Đèn Đỏ' : 'Period Days'
                      : isVi ? 'Ngày An Toàn' : 'Safe Window'}
                  </span>
                </div>

                <div className="rounded-2xl border border-zinc-200/80 bg-zinc-50/50 p-4 dark:border-zinc-800 dark:bg-zinc-900/50">
                  <div className="flex items-start gap-3">
                    <Sparkles className="mt-0.5 h-5 w-5 text-rose-500 shrink-0" />
                    <div>
                      <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                        {isVi ? 'Đánh giá khả năng thụ thai' : 'Fertility Evaluation'}
                      </h4>
                      <p className="mt-0.5 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
                        {overview.pregnancyRiskText[isVi ? 'vi' : 'en']}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Key Target Projection Dates */}
                <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
                  <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900">
                    <span className="text-zinc-400">{isVi ? 'Tới tháng tiếp theo' : 'Next Period'}</span>
                    <div className="mt-1 font-bold text-zinc-800 dark:text-zinc-200">
                      {overview.predictedNextPeriod}
                    </div>
                    <span className="text-[10px] text-rose-500 font-medium">
                      ({overview.daysUntilNextPeriod} {isVi ? 'ngày tới' : 'days away'})
                    </span>
                  </div>

                  <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900">
                    <span className="text-zinc-400">{isVi ? 'Ngày rụng trứng' : 'Ovulation Day'}</span>
                    <div className="mt-1 font-bold text-purple-400">
                      {overview.predictedOvulationDate}
                    </div>
                    <span className="text-[10px] text-purple-400 font-medium">
                      ({overview.fertileWindowStart} - {overview.fertileWindowEnd})
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Metrics Summary Sidebar Card */}
          <div className="flex flex-col justify-between rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800/80 dark:bg-[#0f0f11]">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-rose-500" />
                  <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    {isVi ? 'Thống kê Chu kỳ' : 'Cycle Metrics'}
                  </h3>
                </div>
                {cycles.length > 0 && (
                  <button
                    onClick={handleOpenSettings}
                    title={isVi ? 'Cài đặt chu kỳ' : 'Cycle Settings'}
                    className="rounded-lg p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-indigo-500 transition active:scale-95 cursor-pointer"
                  >
                    <Sliders className="h-4 w-4" />
                  </button>
                )}
              </div>

              <div className="divide-y divide-zinc-100 dark:divide-zinc-800/80 text-sm">
                <div className="flex justify-between py-2.5">
                  <span className="text-zinc-500">{isVi ? 'Độ dài chu kỳ TB' : 'Avg Cycle Length'}</span>
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                    {overview.avgCycleLength} {isVi ? 'ngày' : 'days'}
                  </span>
                </div>

                <div className="flex justify-between py-2.5">
                  <span className="text-zinc-500">{isVi ? 'Thời gian tới tháng TB' : 'Avg Period Duration'}</span>
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                    {overview.avgPeriodLength} {isVi ? 'ngày' : 'days'}
                  </span>
                </div>

                <div className="flex justify-between py-2.5">
                  <span className="text-zinc-500">{isVi ? 'Khởi đầu tới tháng vừa rồi' : 'Last Period Start'}</span>
                  <span className="font-medium text-zinc-800 dark:text-zinc-200">
                    {overview.lastPeriodStartDate}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-2xl bg-rose-500/10 p-3.5 text-xs text-rose-600 dark:text-rose-400">
              <div className="flex items-center gap-1.5 font-semibold">
                <Info className="h-4 w-4" />
                {isVi ? 'Ghi chú an toàn' : 'Safety Note'}
              </div>
              <p className="mt-1 leading-relaxed text-[11px] opacity-90">
                {isVi
                  ? 'Dự đoán dựa trên phương pháp Ogino-Knaus. Kết quả mang tính tham khảo, khuyến cáo kết hợp cùng biện pháp an toàn.'
                  : 'Calculations based on Ogino-Knaus calendar method. Always consult health professionals for medical decisions.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Month Calendar Visualizer */}
      <div className="rounded-2xl md:rounded-3xl border border-zinc-200 bg-white p-3.5 sm:p-6 shadow-sm dark:border-zinc-800/80 dark:bg-[#0f0f11]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-3 flex-wrap">
            <CalendarIcon className="h-5 w-5 text-rose-500 shrink-0" />
            <h2 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100">
              {isVi ? 'Lịch Theo Dõi Chu Kỳ' : 'Cycle Calendar'}
            </h2>
            <span className="text-xs sm:text-sm font-medium text-zinc-500">
              {format(currentMonth, 'MMMM yyyy', isVi)}
            </span>
          </div>

          <div className="flex items-center gap-1 self-end sm:self-auto">
            <button
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              className="rounded-lg p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              className="rounded-lg p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-3 sm:gap-4 text-xs mb-4 pb-4 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded-full bg-rose-500" />
            <span className="text-zinc-600 dark:text-zinc-400">{isVi ? 'Ngày hành kinh' : 'Period Day'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded-full bg-purple-500" />
            <span className="text-zinc-600 dark:text-zinc-400">{isVi ? 'Thời gian dễ thụ thai' : 'Fertile Window'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded-full border-2 border-dashed border-rose-400 bg-rose-500/20" />
            <span className="text-zinc-600 dark:text-zinc-400">{isVi ? 'Dự đoán tới tháng' : 'Predicted Period'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded-full bg-emerald-500/20 border border-emerald-500/40" />
            <span className="text-zinc-600 dark:text-zinc-400">{isVi ? 'Ngày an toàn' : 'Safe Day'}</span>
          </div>
        </div>

        {/* Grid Days */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center">
          {(isVi ? ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'] : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']).map((d) => (
            <div key={d} className="py-1 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              {d}
            </div>
          ))}

          {dayStatuses.map(({ day, dateStr, dayNumber, status: dayStatus }) => {
            let dayStyle = 'hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300';
            let probColor = 'text-zinc-400 dark:text-zinc-500';

            if (dayStatus.isLoggedPeriod) {
              dayStyle = 'bg-rose-500 text-white font-bold rounded-xl shadow-sm';
              probColor = 'text-rose-100';
            } else if (dayStatus.isPredictedPeriod) {
              dayStyle = 'border-2 border-dashed border-rose-400 bg-rose-500/10 text-rose-500 font-semibold rounded-xl';
              probColor = 'text-rose-600 dark:text-rose-400';
            } else if (dayStatus.isFertileWindow) {
              dayStyle = dayStatus.isOvulationDay
                ? 'bg-purple-600 text-white font-bold ring-2 ring-purple-300 rounded-xl shadow-sm'
                : 'bg-purple-500/20 text-purple-400 font-semibold rounded-xl';
              probColor = dayStatus.isOvulationDay ? 'text-purple-100' : 'text-purple-600 dark:text-purple-400 font-bold';
            } else if (dayStatus.isSafeDay) {
              dayStyle = 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium rounded-xl hover:bg-emerald-500/20';
              probColor = 'text-emerald-600 dark:text-emerald-400';
            }

            return (
              <div
                key={dateStr}
                onClick={() => {
                  setSymptomDate(dateStr);
                  setIsSymptomModalOpen(true);
                }}
                className={`flex flex-col items-center justify-center p-1.5 text-xs transition cursor-pointer h-14 rounded-2xl ${dayStyle}`}
              >
                <span className="text-sm font-semibold">{dayNumber}</span>
                {dayStatus.isOvulationDay ? (
                  <span className="text-[9px] font-bold leading-tight tracking-tight mt-0.5">
                    33% ({isVi ? 'Rụng trứng' : 'Ov'})
                  </span>
                ) : (
                  <span className={`text-[9px] font-medium leading-tight tracking-tight mt-0.5 ${probColor}`}>
                    {dayStatus.pregnancyProbability}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Cycle Log History Table */}
      <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800/80 dark:bg-[#0f0f11]">
        <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-4">
          {isVi ? 'Lịch Sử Các Kỳ Hành Kinh' : 'Period Log History'}
        </h3>

        {cycles.length === 0 ? (
          <div className="py-8 text-center text-sm text-zinc-400">
            {isVi ? 'Chưa có kỳ hành kinh nào được ghi chép.' : 'No period logs recorded yet.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-zinc-600 dark:text-zinc-400">
              <thead className="border-b border-zinc-100 text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:border-zinc-800">
                <tr>
                  <th className="py-3 px-4">{isVi ? 'Ngày bắt đầu' : 'Start Date'}</th>
                  <th className="py-3 px-4">{isVi ? 'Ngày kết thúc' : 'End Date'}</th>
                  <th className="py-3 px-4">{isVi ? 'Số ngày hành kinh' : 'Duration'}</th>
                  <th className="py-3 px-4">{isVi ? 'Độ dài chu kỳ' : 'Cycle Length'}</th>
                  <th className="py-3 px-4 text-right">{isVi ? 'Thao tác' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                {cycles.map((c) => (
                  <tr key={c.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/40">
                    <td className="py-3 px-4 font-medium text-zinc-900 dark:text-zinc-100">
                      {c.startDate ? format(parseISO(c.startDate), 'MMM dd, yyyy') : '-'}
                    </td>
                    <td className="py-3 px-4">
                      {c.endDate ? format(parseISO(c.endDate), 'MMM dd, yyyy') : (isVi ? 'Đang diễn ra' : 'Ongoing')}
                    </td>
                    <td className="py-3 px-4">
                      {c.periodLengthDays ? `${c.periodLengthDays} ${isVi ? 'ngày' : 'days'}` : '-'}
                    </td>
                    <td className="py-3 px-4 font-medium text-zinc-900 dark:text-zinc-100">
                      {c.cycleLengthDays
                        ? `${c.cycleLengthDays} ${isVi ? 'ngày' : 'days'}`
                        : overview?.avgCycleLength
                        ? `${overview.avgCycleLength} ${isVi ? 'ngày (Dự kiến)' : 'days (Est.)'}`
                        : '-'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleEditCycle(c)}
                          title={isVi ? 'Chỉnh sửa' : 'Edit'}
                          className="text-zinc-400 hover:text-indigo-500 transition p-1"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteCycle(c.id)}
                          title={isVi ? 'Xóa' : 'Delete'}
                          className="text-zinc-400 hover:text-rose-500 transition p-1"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Log Period Modal */}
      <PortalModal
        isOpen={isPeriodModalOpen}
        onClose={() => setIsPeriodModalOpen(false)}
        maxWidth="md"
      >
            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
              {editingCycleId
                ? (isVi ? 'Chỉnh Sửa Kỳ Hành Kinh' : 'Edit Period Entry')
                : (isVi ? 'Ghi Kỳ Hành Kinh Mới' : 'Log Period Dates')}
            </h3>

            <form onSubmit={handleLogPeriodSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">
                  {isVi ? 'Ngày bắt đầu tới tháng *' : 'Period Start Date *'}
                </label>
                <input
                  type="date"
                  required
                  value={periodStartDate}
                  onChange={(e) => setPeriodStartDate(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-rose-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">
                  {isVi ? 'Ngày kết thúc (không bắt buộc)' : 'Period End Date (optional)'}
                </label>
                <input
                  type="date"
                  value={periodEndDate}
                  onChange={(e) => setPeriodEndDate(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-rose-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">
                  {isVi ? 'Ghi chú' : 'Notes'}
                </label>
                <textarea
                  rows={2}
                  value={periodNotes}
                  onChange={(e) => setPeriodNotes(e.target.value)}
                  placeholder={isVi ? 'Nhập ghi chú cá nhân...' : 'Personal notes...'}
                  className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-rose-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPeriodModalOpen(false)}
                  className="rounded-xl border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-600 dark:border-zinc-800 dark:text-zinc-400"
                >
                  {isVi ? 'Hủy' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingPeriod}
                  className="rounded-xl bg-rose-500 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-rose-600 disabled:opacity-50"
                >
                  {isSubmittingPeriod ? (isVi ? 'Đang lưu...' : 'Saving...') : (isVi ? 'Lưu' : 'Save')}
                </button>
              </div>
            </form>
      </PortalModal>

      {/* Log Symptoms Modal */}
      <PortalModal
        isOpen={isSymptomModalOpen}
        onClose={() => setIsSymptomModalOpen(false)}
        maxWidth="lg"
      >
            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
              {isVi ? 'Ghi Triệu Chứng Hàng Ngày' : 'Log Daily Symptoms'}
            </h3>

            <form onSubmit={handleLogSymptomSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">
                  {isVi ? 'Ngày ghi nhận *' : 'Log Date *'}
                </label>
                <input
                  type="date"
                  required
                  value={symptomDate}
                  onChange={(e) => setSymptomDate(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-rose-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
                />
              </div>

              {/* Flow Level */}
              <div>
                <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
                  {isVi ? 'Lượng kinh nguyệt' : 'Flow Intensity'}
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {FLOW_OPTIONS.map((fl) => (
                    <button
                      type="button"
                      key={fl.id}
                      onClick={() => setSelectedFlow(fl.id)}
                      className={`rounded-xl py-2.5 text-xs font-semibold border transition ${
                        selectedFlow === fl.id
                          ? 'border-rose-500 bg-rose-500/10 text-rose-500'
                          : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400'
                      }`}
                    >
                      {isVi ? fl.labelVi : fl.labelEn}
                    </button>
                  ))}
                </div>
              </div>

              {/* Symptoms checklist */}
              <div>
                <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
                  {isVi ? 'Triệu chứng cơ thể' : 'Physical Symptoms'}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {COMMON_SYMPTOMS.map((sym) => {
                    const active = selectedSymptoms.includes(sym.id);
                    return (
                      <button
                        type="button"
                        key={sym.id}
                        onClick={() => toggleSymptom(sym.id)}
                        className={`rounded-xl p-2.5 text-xs font-medium border text-left transition ${
                          active
                            ? 'border-purple-500 bg-purple-500/10 text-purple-400'
                            : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400'
                        }`}
                      >
                        {isVi ? sym.labelVi : sym.labelEn}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Mood selector */}
              <div>
                <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
                  {isVi ? 'Tâm trạng' : 'Mood'}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {MOOD_OPTIONS.map((m) => (
                    <button
                      type="button"
                      key={m.id}
                      onClick={() => setSelectedMood(m.id)}
                      className={`rounded-xl py-2 text-xs font-medium border transition ${
                        selectedMood === m.id
                          ? 'border-rose-500 bg-rose-500/10 text-rose-500'
                          : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400'
                      }`}
                    >
                      {isVi ? m.labelVi : m.labelEn}
                    </button>
                  ))}
                </div>
              </div>

              {/* BBT and Ovulation test */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">
                    {isVi ? 'Nhiệt độ BBT (°C)' : 'BBT Temp (°C)'}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="36.50"
                    value={bbt}
                    onChange={(e) => setBbt(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-rose-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">
                    {isVi ? 'Test rụng trứng' : 'Ovulation Test'}
                  </label>
                  <select
                    value={ovulationTest}
                    onChange={(e) => setOvulationTest(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-rose-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
                  >
                    <option value="NOT_TESTED">{isVi ? 'Chưa test' : 'Not Tested'}</option>
                    <option value="NEGATIVE">{isVi ? 'Âm tính (-)' : 'Negative (-)'}</option>
                    <option value="POSITIVE">{isVi ? 'Dương tính (+)' : 'Positive (+)'}</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsSymptomModalOpen(false)}
                  className="rounded-xl border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-600 dark:border-zinc-800 dark:text-zinc-400"
                >
                  {isVi ? 'Hủy' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingSymptom}
                  className="rounded-xl bg-purple-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-purple-700 disabled:opacity-50"
                >
                  {isSubmittingSymptom ? (isVi ? 'Đang lưu...' : 'Saving...') : (isVi ? 'Lưu triệu chứng' : 'Save Symptoms')}
                </button>
              </div>
            </form>
      </PortalModal>

      {/* Cycle Settings Modal */}
      <PortalModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        maxWidth="md"
      >
            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
              {isVi ? 'Cài Đặt Chu Kỳ Kinh Nguyệt' : 'Menstrual Cycle Settings'}
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              {isVi 
                ? 'Thiết lập các thông số chu kỳ điển hình của bạn. Hệ thống sẽ sử dụng các thông số này để dự đoán nếu chưa có đủ dữ liệu lịch sử.' 
                : 'Configure your typical cycle details. These will be used for predictions when there is limited historical log data.'}
            </p>

            <form onSubmit={handleSaveSettings} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">
                  {isVi ? 'Độ dài chu kỳ điển hình (ngày) *' : 'Typical Cycle Length (days) *'}
                </label>
                <input
                  type="number"
                  required
                  min="15"
                  max="50"
                  value={newTypicalCycle}
                  onChange={(e) => setNewTypicalCycle(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-rose-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">
                  {isVi ? 'Số ngày hành kinh điển hình (ngày) *' : 'Typical Period Duration (days) *'}
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  max="15"
                  value={newTypicalPeriod}
                  onChange={(e) => setNewTypicalPeriod(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-rose-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsSettingsModalOpen(false)}
                  className="rounded-xl border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-600 dark:border-zinc-800 dark:text-zinc-400"
                >
                  {isVi ? 'Hủy' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isSavingSettings}
                  className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50"
                >
                  {isSavingSettings ? (isVi ? 'Đang lưu...' : 'Saving...') : (isVi ? 'Lưu' : 'Save')}
                </button>
              </div>
            </form>
      </PortalModal>
    </div>
  );
}
