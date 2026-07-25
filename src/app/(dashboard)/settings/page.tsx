'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/components/language-provider';
import { useUnitStore } from '@/lib/stores/useUnitStore';
import { UnitSystem, kgToLbs, lbsToKg, cmToInches, inchesToCm } from '@/lib/units';
import {
  Settings as SettingsIcon,
  Globe,
  Sliders,
  CheckCircle2,
  Sparkles,
  User,
  Scale,
  Ruler,
  Save,
  Activity,
  Target,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { PushNotificationToggle } from '@/components/shared/PushNotificationToggle';

export default function SettingsPage() {
  const { status } = useSession();
  const router = useRouter();
  const { language, setLanguage, t } = useTranslation();
  const { unitSystem, setUnitSystem } = useUnitStore();

  const [heightValue, setHeightValue] = useState<string>('');
  const [currentWeightValue, setCurrentWeightValue] = useState<string>('');
  const [targetWeightValue, setTargetWeightValue] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    if (status === 'authenticated') {
      fetch('/api/user/profile')
        .then((res) => res.json())
        .then((data) => {
          if (data.unitSystem) {
            setUnitSystem(data.unitSystem as UnitSystem);
          }
          if (data.heightCm) {
            const h =
              data.unitSystem === 'IMPERIAL'
                ? cmToInches(data.heightCm)
                : Math.round(data.heightCm);
            setHeightValue(String(h));
          }
          if (data.currentWeightKg) {
            const cw =
              data.unitSystem === 'IMPERIAL'
                ? kgToLbs(data.currentWeightKg)
                : data.currentWeightKg;
            setCurrentWeightValue(String(cw));
          }
          if (data.targetWeightKg) {
            const tw =
              data.unitSystem === 'IMPERIAL'
                ? kgToLbs(data.targetWeightKg)
                : data.targetWeightKg;
            setTargetWeightValue(String(tw));
          }
        })
        .catch((err) => console.error('Error loading profile:', err));
    }
  }, [status, router, setUnitSystem]);

  const handleUnitSystemChange = (newSystem: UnitSystem) => {
    if (newSystem === unitSystem) return;

    if (heightValue) {
      const hNum = Number.parseFloat(heightValue);
      if (!Number.isNaN(hNum)) {
        if (newSystem === 'IMPERIAL') {
          setHeightValue(String(cmToInches(hNum)));
        } else {
          setHeightValue(String(Math.round(inchesToCm(hNum))));
        }
      }
    }

    if (currentWeightValue) {
      const cwNum = Number.parseFloat(currentWeightValue);
      if (!Number.isNaN(cwNum)) {
        if (newSystem === 'IMPERIAL') {
          setCurrentWeightValue(String(kgToLbs(cwNum)));
        } else {
          setCurrentWeightValue(String(lbsToKg(cwNum)));
        }
      }
    }

    if (targetWeightValue) {
      const twNum = Number.parseFloat(targetWeightValue);
      if (!Number.isNaN(twNum)) {
        if (newSystem === 'IMPERIAL') {
          setTargetWeightValue(String(kgToLbs(twNum)));
        } else {
          setTargetWeightValue(String(lbsToKg(twNum)));
        }
      }
    }

    setUnitSystem(newSystem);
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSavedSuccess(false);

    try {
      const hNum = Number.parseFloat(heightValue);
      const cwNum = Number.parseFloat(currentWeightValue);
      const twNum = Number.parseFloat(targetWeightValue);

      const heightCm = !Number.isNaN(hNum)
        ? unitSystem === 'IMPERIAL'
          ? inchesToCm(hNum)
          : hNum
        : undefined;

      const currentWeightKg = !Number.isNaN(cwNum)
        ? unitSystem === 'IMPERIAL'
          ? lbsToKg(cwNum)
          : cwNum
        : undefined;

      const targetWeightKg = !Number.isNaN(twNum)
        ? unitSystem === 'IMPERIAL'
          ? lbsToKg(twNum)
          : twNum
        : undefined;

      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          unitSystem,
          heightCm,
          currentWeightKg,
          targetWeightKg,
        }),
      });

      if (res.ok) {
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 3000);
      }
    } catch (err) {
      console.error('Error saving settings:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Live BMI & Weight Gap calculations
  const hNumber = Number.parseFloat(heightValue);
  const cwNumber = Number.parseFloat(currentWeightValue);
  const twNumber = Number.parseFloat(targetWeightValue);

  const heightInMeters = unitSystem === 'IMPERIAL' ? inchesToCm(hNumber) / 100 : hNumber / 100;
  const currentKg = unitSystem === 'IMPERIAL' ? lbsToKg(cwNumber) : cwNumber;
  const targetKg = unitSystem === 'IMPERIAL' ? lbsToKg(twNumber) : twNumber;

  const bmi = !isNaN(currentKg) && !isNaN(heightInMeters) && heightInMeters > 0
    ? (currentKg / (heightInMeters * heightInMeters)).toFixed(1)
    : null;

  const weightDiff = !isNaN(currentKg) && !isNaN(targetKg)
    ? (currentKg - targetKg).toFixed(1)
    : null;

  return (
    <div className="min-h-screen bg-zinc-50/60 dark:bg-zinc-950/40 p-6 md:p-10 space-y-8 max-w-5xl mx-auto pb-24 font-sans">
      {/* Header */}
      <div className="flex items-center gap-4 bg-white dark:bg-zinc-900/80 p-6 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 shadow-xs backdrop-blur-md">
        <div className="w-12 h-12 rounded-2xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 flex items-center justify-center font-bold shadow-md">
          <SettingsIcon className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            {(t('settings.title' as any) || 'Preferences & Settings') as string}
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            {(t('settings.desc' as any) || 'Configure global unit systems, anthropometric baselines, and language') as string}
          </p>
        </div>
      </div>

      <form onSubmit={handleSaveSettings} className="space-y-8">
        {/* Section 1: Unit System Selection */}
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 shadow-xs space-y-4">
          <div className="flex items-center gap-3 border-b border-zinc-100 dark:border-zinc-800 pb-4">
            <Sliders className="w-5 h-5 text-indigo-500" />
            <div>
              <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-50">
                {(t('settings.unitSystemTitle' as any) || 'Unit System') as string}
              </h2>
              <p className="text-xs text-zinc-400">
                {(t('settings.unitSystemDesc' as any) || 'Choose your measurement units for weight, height, and body dimensions.') as string}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {/* Metric Option */}
            <button
              type="button"
              onClick={() => handleUnitSystemChange('METRIC')}
              className={`p-5 rounded-2xl border text-left transition-all cursor-pointer space-y-2 ${
                unitSystem === 'METRIC'
                  ? 'border-indigo-600 bg-indigo-50/40 dark:bg-indigo-950/20 text-zinc-900 dark:text-zinc-50 shadow-xs'
                  : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/40 hover:border-zinc-300 dark:hover:border-zinc-700 text-zinc-600 dark:text-zinc-400'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-sm tracking-tight text-zinc-900 dark:text-zinc-100">
                  {(t('settings.metricLabel' as any) || 'Metric System (kg, cm)') as string}
                </span>
                {unitSystem === 'METRIC' && (
                  <CheckCircle2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                )}
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                {(t('settings.metricDesc' as any) || 'Standard international units. Weight in kilograms (`kg`), height in centimeters (`cm`), body measurements in `cm`.') as string}
              </p>
            </button>

            {/* Imperial Option */}
            <button
              type="button"
              onClick={() => handleUnitSystemChange('IMPERIAL')}
              className={`p-5 rounded-2xl border text-left transition-all cursor-pointer space-y-2 ${
                unitSystem === 'IMPERIAL'
                  ? 'border-indigo-600 bg-indigo-50/40 dark:bg-indigo-950/20 text-zinc-900 dark:text-zinc-50 shadow-xs'
                  : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/40 hover:border-zinc-300 dark:hover:border-zinc-700 text-zinc-600 dark:text-zinc-400'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-sm tracking-tight text-zinc-900 dark:text-zinc-100">
                  {(t('settings.imperialLabel' as any) || 'Imperial System (lbs, in)') as string}
                </span>
                {unitSystem === 'IMPERIAL' && (
                  <CheckCircle2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                )}
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                {(t('settings.imperialDesc' as any) || 'US customary units. Weight in pounds (`lbs`), height in inches (`in`), body measurements in `inches`.') as string}
              </p>
            </button>
          </div>
        </div>

        {/* Section 2: Body Profile Goals */}
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-4">
            <div className="flex items-center gap-3">
              <User className="w-5 h-5 text-indigo-500" />
              <div>
                <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-50">
                  {(t('settings.profileTitle' as any) || 'Body Profile & Goal Targets') as string}
                </h2>
                <p className="text-xs text-zinc-400">
                  {(t('settings.profileDesc' as any) || 'Update height baseline, current weight, and target weight goal') as string}
                </p>
              </div>
            </div>

            {bmi && (
              <span className="px-3 py-1 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 text-xs font-bold rounded-full flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5" /> BMI: {bmi}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Height Input */}
            <div className="space-y-2">
              <label htmlFor="height-setting-input" className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                <span className="flex items-center gap-1.5">
                  <Ruler className="w-3.5 h-3.5 text-zinc-400" />
                  {(t('settings.heightLabel' as any) || 'Height Baseline') as string}
                </span>
                <span className="text-[10px] font-extrabold text-indigo-600 dark:text-indigo-400">
                  {unitSystem === 'IMPERIAL' ? 'INCHES' : 'CM'}
                </span>
              </label>
              <input
                id="height-setting-input"
                type="number"
                step="0.1"
                placeholder={unitSystem === 'IMPERIAL' ? 'e.g. 70' : 'e.g. 178'}
                value={heightValue}
                onChange={(e) => setHeightValue(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 font-bold text-lg text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Current Weight Input */}
            <div className="space-y-2">
              <label htmlFor="current-weight-input" className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                <span className="flex items-center gap-1.5">
                  <Scale className="w-3.5 h-3.5 text-emerald-500" />
                  {(t('settings.currentWeightLabel' as any) || 'Current Weight') as string}
                </span>
                <span className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400">
                  {unitSystem === 'IMPERIAL' ? 'LBS' : 'KG'}
                </span>
              </label>
              <input
                id="current-weight-input"
                type="number"
                step="0.1"
                placeholder={unitSystem === 'IMPERIAL' ? 'e.g. 175' : 'e.g. 79'}
                value={currentWeightValue}
                onChange={(e) => setCurrentWeightValue(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-zinc-100 dark:bg-zinc-800 border border-emerald-500/40 dark:border-emerald-500/40 font-bold text-lg text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Target Weight Input */}
            <div className="space-y-2">
              <label htmlFor="target-weight-input" className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                <span className="flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5 text-indigo-500" />
                  {(t('settings.targetWeightLabel' as any) || 'Target Weight Goal') as string}
                </span>
                <span className="text-[10px] font-extrabold text-indigo-600 dark:text-indigo-400">
                  {unitSystem === 'IMPERIAL' ? 'LBS' : 'KG'}
                </span>
              </label>
              <input
                id="target-weight-input"
                type="number"
                step="0.1"
                placeholder={unitSystem === 'IMPERIAL' ? 'e.g. 165' : 'e.g. 75'}
                value={targetWeightValue}
                onChange={(e) => setTargetWeightValue(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 font-bold text-lg text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Goal Gap Summary Banner */}
          {weightDiff !== null && !isNaN(Number(weightDiff)) && (
            <div className="p-4 rounded-2xl bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700/80 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 font-semibold text-zinc-700 dark:text-zinc-200">
                {Number(weightDiff) > 0 ? (
                  <TrendingDown className="w-4 h-4 text-emerald-500" />
                ) : Number(weightDiff) < 0 ? (
                  <TrendingUp className="w-4 h-4 text-indigo-500" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                )}
                <span>
                  {Number(weightDiff) > 0
                    ? (language === 'vi'
                        ? `Mục tiêu: Cần giảm ${Math.abs(Number(weightDiff))} ${unitSystem === 'IMPERIAL' ? 'lbs' : 'kg'} để đạt mốc.`
                        : `Goal Gap: Need to lose ${Math.abs(Number(weightDiff))} ${unitSystem === 'IMPERIAL' ? 'lbs' : 'kg'} to reach target.`)
                    : Number(weightDiff) < 0
                    ? (language === 'vi'
                        ? `Mục tiêu: Cần tăng ${Math.abs(Number(weightDiff))} ${unitSystem === 'IMPERIAL' ? 'lbs' : 'kg'} để đạt mốc.`
                        : `Goal Gap: Need to gain ${Math.abs(Number(weightDiff))} ${unitSystem === 'IMPERIAL' ? 'lbs' : 'kg'} to reach target.`)
                    : (language === 'vi' ? '🎉 Đã đạt mục tiêu cân nặng!' : '🎉 Target weight goal achieved!')}
                </span>
              </div>

              <div className="text-zinc-500 text-[11px] font-mono">
                {currentWeightValue} → {targetWeightValue} {unitSystem === 'IMPERIAL' ? 'lbs' : 'kg'}
              </div>
            </div>
          )}
        </div>

        {/* Section 3: Web Push Notifications */}
        <PushNotificationToggle />

        {/* Section 4: Language Preference */}
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Globe className="w-5 h-5 text-indigo-500" />
              <div>
                <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-50">
                  {(t('settings.languageTitle' as any) || 'Interface Language') as string}
                </h2>
                <p className="text-xs text-zinc-400">
                  {(t('settings.languageDesc' as any) || 'Switch between English and Vietnamese') as string}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-2xl border border-zinc-200 dark:border-zinc-700">
              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  language === 'en'
                    ? 'bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'
                }`}
              >
                English 🇺🇸
              </button>
              <button
                type="button"
                onClick={() => setLanguage('vi')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  language === 'vi'
                    ? 'bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'
                }`}
              >
                Tiếng Việt 🇻🇳
              </button>
            </div>
          </div>
        </div>

        {/* Save Bar */}
        <div className="flex items-center justify-between pt-4">
          {savedSuccess ? (
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              {(t('settings.saveSuccess' as any) || 'Preferences and body goals updated successfully!') as string}
            </span>
          ) : (
            <span className="text-xs text-zinc-400">
              {(t('settings.changesNotice' as any) || 'Changes apply instantly across your dashboard & TDEE engine.') as string}
            </span>
          )}

          <button
            type="submit"
            disabled={isSaving}
            className="px-7 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[13px] rounded-2xl transition-all shadow-md hover:shadow-indigo-500/25 flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {isSaving
              ? ((t('settings.saving' as any) || 'Saving...') as string)
              : ((t('settings.saveChanges' as any) || 'Save Settings') as string)}
          </button>
        </div>
      </form>
    </div>
  );
}
