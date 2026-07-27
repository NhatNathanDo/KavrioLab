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

  // Account & Security state
  const [accountName, setAccountName] = useState<string>('');
  const [accountEmail, setAccountEmail] = useState<string>('');
  const [isGoogleAccount, setIsGoogleAccount] = useState<boolean>(false);
  const [currentPassword, setCurrentPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmNewPassword, setConfirmNewPassword] = useState<string>('');
  const [accountSaving, setAccountSaving] = useState<boolean>(false);
  const [accountError, setAccountError] = useState<string>('');
  const [accountSuccess, setAccountSuccess] = useState<string>('');

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

      fetch('/api/user/account')
        .then((res) => res.json())
        .then((data) => {
          if (data.name) setAccountName(data.name);
          if (data.email) setAccountEmail(data.email);
          if (data.isGoogleAccount !== undefined) setIsGoogleAccount(data.isGoogleAccount);
        })
        .catch((err) => console.error('Error loading account:', err));
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

  const handleSaveAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setAccountSaving(true);
    setAccountError('');
    setAccountSuccess('');

    if (newPassword && newPassword !== confirmNewPassword) {
      setAccountError(t('register.passwordMismatch') || 'Mật khẩu mới không khớp');
      setAccountSaving(false);
      return;
    }

    try {
      const res = await fetch('/api/user/account', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: accountName,
          email: accountEmail,
          currentPassword: currentPassword || undefined,
          newPassword: newPassword || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setAccountError(data.error || 'Cập nhật thất bại');
      } else {
        setAccountSuccess(language === 'vi' ? 'Cập nhật thông tin tài khoản thành công!' : 'Account details updated successfully!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
        setTimeout(() => setAccountSuccess(''), 4000);
      }
    } catch (err: any) {
      setAccountError(err.message || 'Lỗi hệ thống');
    } finally {
      setAccountSaving(false);
    }
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
    <div className="bg-zinc-50/60 dark:bg-zinc-950/40 px-2 py-4 md:px-4 md:py-8 space-y-4 md:space-y-8 max-w-5xl mx-auto pb-24 font-sans">
      {/* Header */}
      <div className="flex items-center gap-3.5 bg-white dark:bg-zinc-900/80 p-4 md:p-6 rounded-2xl md:rounded-3xl border border-zinc-200/80 dark:border-zinc-800 shadow-xs">
        <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 flex items-center justify-center font-bold shadow-md shrink-0">
          <SettingsIcon className="w-5 h-5 md:w-6 md:h-6" />
        </div>
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            {(t('settings.title' as any) || 'Preferences & Settings') as string}
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            {(t('settings.desc' as any) || 'Configure global unit systems, anthropometric baselines, and language') as string}
          </p>
        </div>
      </div>

      {/* Account & Security Card */}
      <div className="bg-white dark:bg-zinc-900 p-4 md:p-6 rounded-2xl md:rounded-3xl border border-zinc-200/80 dark:border-zinc-800 shadow-xs space-y-4 md:space-y-6">
        <div className="flex items-center gap-3 border-b border-zinc-100 dark:border-zinc-800 pb-4">
          <User className="w-5 h-5 text-indigo-500" />
          <div>
            <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-50">
              {language === 'vi' ? 'Tài khoản & Bảo mật' : 'Account & Security'}
            </h2>
            <p className="text-xs text-zinc-400">
              {language === 'vi' ? 'Quản lý tên hiển thị, địa chỉ email và mật khẩu đăng nhập' : 'Manage display name, email address, and change password'}
            </p>
          </div>
        </div>

        {accountError && (
          <div className="p-3.5 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-xl text-red-600 dark:text-red-400 text-xs font-medium">
            {accountError}
          </div>
        )}

        {accountSuccess && (
          <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 rounded-xl text-emerald-600 dark:text-emerald-400 text-xs font-medium flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            {accountSuccess}
          </div>
        )}

        {isGoogleAccount && (
          <div className="p-3.5 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200/80 dark:border-indigo-900/40 rounded-xl text-indigo-700 dark:text-indigo-300 text-xs leading-relaxed flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-500 flex-shrink-0" />
            <span>
              {language === 'vi'
                ? 'Tài khoản của bạn được liên kết với Google. Email và mật khẩu được quản lý trực tiếp qua tài khoản Google.'
                : 'Your account is authenticated via Google. Email and security settings are managed through Google.'}
            </span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label htmlFor="account-name-input" className="block text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
              {language === 'vi' ? 'Họ và tên' : 'Display Name'}
            </label>
            <input
              id="account-name-input"
              type="text"
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 font-medium text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-500 transition-all"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="account-email-input" className="block text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
              {language === 'vi' ? 'Địa chỉ Email' : 'Email Address'}
            </label>
            <input
              id="account-email-input"
              type="email"
              value={accountEmail}
              onChange={(e) => setAccountEmail(e.target.value)}
              disabled={isGoogleAccount}
              className="w-full px-4 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 font-medium text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-500 disabled:opacity-60 transition-all"
            />
          </div>
        </div>

        {!isGoogleAccount && (
          <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              {language === 'vi' ? 'Đổi Mật Khẩu (Tùy chọn)' : 'Change Password (Optional)'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="current-password-input" className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">
                  {language === 'vi' ? 'Mật khẩu hiện tại' : 'Current Password'}
                </label>
                <input
                  id="current-password-input"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label htmlFor="new-password-input" className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">
                  {language === 'vi' ? 'Mật khẩu mới' : 'New Password'}
                </label>
                <input
                  id="new-password-input"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label htmlFor="confirm-new-password-input" className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">
                  {language === 'vi' ? 'Xác nhận mật khẩu mới' : 'Confirm New Password'}
                </label>
                <input
                  id="confirm-new-password-input"
                  type="password"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={handleSaveAccount}
            disabled={accountSaving}
            className="px-5 py-2 bg-zinc-900 dark:bg-zinc-100 text-zinc-50 dark:text-zinc-900 font-bold text-xs rounded-xl hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all disabled:opacity-50 cursor-pointer"
          >
            {accountSaving ? (language === 'vi' ? 'Đang cập nhật...' : 'Updating...') : (language === 'vi' ? 'Cập nhật tài khoản' : 'Update Account')}
          </button>
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
