'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { saveOnboarding } from '../actions/onboarding';
import { calculateInitialTargets } from '@/lib/calculations';
import { Sun, Moon, Activity, LogOut } from 'lucide-react';
import { useTheme } from '@/components/theme-provider';
import { useTranslation } from '@/components/language-provider';

export default function OnboardingPage() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage, t } = useTranslation();
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [isPending, setIsPending] = useState(false);

  const [formData, setFormData] = useState({
    gender: 'FEMALE' as 'MALE' | 'FEMALE' | 'OTHER',
    birthDate: '1995-01-01',
    heightCm: 170,
    weightKg: 70,
    targetWeightKg: 65,
    activityTier: 'SEDENTARY' as
      | 'SEDENTARY'
      | 'LIGHTLY_ACTIVE'
      | 'MODERATELY_ACTIVE'
      | 'VERY_ACTIVE'
      | 'EXTRA_ACTIVE',
    unitSystem: 'METRIC' as 'METRIC' | 'IMPERIAL',
    goal: 'MAINTENANCE' as
      | 'AGGRESSIVE_LOSS'
      | 'MODERATE_LOSS'
      | 'MAINTENANCE'
      | 'LEAN_GAIN'
      | 'AGGRESSIVE_GAIN',
  });

  const nextStep = () => setStep((s) => Math.min(s + 1, 4));
  const prevStep = () => setStep((s) => Math.max(s - 1, 1));

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === 'heightCm' || name === 'weightKg' || name === 'targetWeightKg'
          ? Number.parseFloat(value) || 0
          : value,
    }));
  };

  const calculatedTargets = calculateInitialTargets({
    ...formData,
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setIsPending(true);

    try {
      const res = await saveOnboarding(formData);
      if (res.success) {
        router.push('/dashboard');
      } else {
        if (res.error === 'USER_NOT_FOUND') {
          setError(
            language === 'vi'
              ? 'Tài khoản không tồn tại trên hệ thống (phiên đăng nhập cũ). Vui lòng đăng xuất và đăng nhập lại.'
              : 'Account not found in database (stale session). Please log out and sign in again.'
          );
        } else {
          setError(res.error || (language === 'vi' ? 'Có lỗi xảy ra' : 'Something went wrong'));
        }
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 flex flex-col justify-center items-center px-4 py-8 transition-colors duration-200">
      {/* Top navbar */}
      <div className="absolute top-6 max-w-lg w-full flex justify-between items-center px-4">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-zinc-900 dark:text-zinc-50" />
          <span className="font-semibold text-xs">KavrioLab</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setLanguage(language === 'en' ? 'vi' : 'en')}
            className="text-[10px] font-bold px-2 py-1 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 transition-all uppercase"
          >
            {language}
          </button>
          <button
            onClick={toggleTheme}
            className="p-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 transition-all"
          >
            {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            title="Log Out"
            className="flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 px-2.5 py-1 rounded-lg border border-red-200 dark:border-red-900/50 transition-all cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="text-[10px] font-semibold uppercase">{language === 'vi' ? 'Đăng xuất' : 'Log Out'}</span>
          </button>
        </div>
      </div>

      <div className="w-full max-w-lg border border-zinc-200 dark:border-zinc-900 rounded-3xl p-8 bg-zinc-50/50 dark:bg-zinc-900/10 backdrop-blur shadow-sm">
        {/* Progress Bar */}
        <div className="flex items-center justify-between mb-8">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex items-center flex-1 last:flex-initial">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all duration-300 ${
                  step >= s
                    ? 'bg-zinc-900 dark:bg-zinc-55 text-white dark:text-zinc-950'
                    : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-400 dark:text-zinc-650'
                }`}
              >
                {s}
              </div>
              {s < 4 && (
                <div
                  className={`h-[1px] flex-1 mx-2 rounded transition-all duration-300 ${
                    step > s ? 'bg-zinc-900 dark:bg-zinc-50' : 'bg-zinc-200 dark:bg-zinc-800'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-2xl text-red-600 dark:text-red-400 text-xs text-center space-y-3">
            <p className="font-medium">{error}</p>
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl transition-all inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <LogOut className="w-3.5 h-3.5" />
              {language === 'vi' ? 'Đăng xuất & Đăng nhập lại' : 'Log Out & Sign In Again'}
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* STEP 1 */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold tracking-tight mb-1 text-zinc-900 dark:text-zinc-50">
                  {t('onboarding.step1Title')}
                </h2>
                <p className="text-xs text-zinc-400 dark:text-zinc-550">
                  {t('onboarding.step1Desc')}
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label htmlFor="gender" className="block text-xs font-medium mb-1 text-zinc-500 dark:text-zinc-400">
                    {t('onboarding.gender')}
                  </label>
                  <select
                    id="gender"
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-50 text-sm"
                  >
                    <option value="FEMALE">{t('onboarding.female')}</option>
                    <option value="MALE">{t('onboarding.male')}</option>
                    <option value="OTHER">{t('onboarding.other')}</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="birthDate" className="block text-xs font-medium mb-1 text-zinc-500 dark:text-zinc-400">
                    {t('onboarding.birthdate')}
                  </label>
                  <input
                    id="birthDate"
                    type="date"
                    name="birthDate"
                    value={formData.birthDate}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-50 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1 text-zinc-500 dark:text-zinc-400">
                    {t('onboarding.unitSystem')}
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    {['METRIC', 'IMPERIAL'].map((u) => (
                      <button
                        key={u}
                        type="button"
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            unitSystem: u as any,
                          }))
                        }
                        className={`py-2 text-xs font-medium rounded-xl border transition-all duration-150 ${
                          formData.unitSystem === u
                            ? 'bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 border-transparent'
                            : 'bg-white dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
                        }`}
                      >
                        {u === 'METRIC'
                          ? t('onboarding.metric')
                          : t('onboarding.imperial')}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold tracking-tight mb-1 text-zinc-900 dark:text-zinc-50">
                  {t('onboarding.step2Title')}
                </h2>
                <p className="text-xs text-zinc-400 dark:text-zinc-550">
                  {t('onboarding.step2Desc')}
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label htmlFor="heightCm" className="block text-xs font-medium mb-1 text-zinc-500 dark:text-zinc-400">
                    {t('onboarding.height')} ({formData.unitSystem === 'METRIC' ? 'cm' : 'in'})
                  </label>
                  <input
                    id="heightCm"
                    type="number"
                    name="heightCm"
                    value={formData.heightCm}
                    onChange={handleChange}
                    min="50"
                    max="300"
                    className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-50 text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="weightKg" className="block text-xs font-medium mb-1 text-zinc-500 dark:text-zinc-400">
                    {t('onboarding.currentWeight')} ({formData.unitSystem === 'METRIC' ? 'kg' : 'lb'})
                  </label>
                  <input
                    id="weightKg"
                    type="number"
                    name="weightKg"
                    value={formData.weightKg}
                    onChange={handleChange}
                    min="20"
                    max="500"
                    className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-50 text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="targetWeightKg" className="block text-xs font-medium mb-1 text-zinc-500 dark:text-zinc-400">
                    {t('onboarding.targetWeight')} ({formData.unitSystem === 'METRIC' ? 'kg' : 'lb'})
                  </label>
                  <input
                    id="targetWeightKg"
                    type="number"
                    name="targetWeightKg"
                    value={formData.targetWeightKg}
                    onChange={handleChange}
                    min="20"
                    max="500"
                    className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-50 text-sm"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold tracking-tight mb-1 text-zinc-900 dark:text-zinc-50">
                  {t('onboarding.step3Title')}
                </h2>
                <p className="text-xs text-zinc-400 dark:text-zinc-550">
                  {t('onboarding.step3Desc')}
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label htmlFor="activityTier" className="block text-xs font-medium mb-1 text-zinc-500 dark:text-zinc-400">
                    {t('onboarding.activityLevel')}
                  </label>
                  <select
                    id="activityTier"
                    name="activityTier"
                    value={formData.activityTier}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-50 text-sm"
                  >
                    <option value="SEDENTARY">{t('onboarding.activitySedentary')}</option>
                    <option value="LIGHTLY_ACTIVE">{t('onboarding.activityLight')}</option>
                    <option value="MODERATELY_ACTIVE">{t('onboarding.activityModerate')}</option>
                    <option value="VERY_ACTIVE">{t('onboarding.activityVery')}</option>
                    <option value="EXTRA_ACTIVE">{t('onboarding.activityExtra')}</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="goal" className="block text-xs font-medium mb-1 text-zinc-500 dark:text-zinc-400">
                    {t('onboarding.fitnessGoal')}
                  </label>
                  <select
                    id="goal"
                    name="goal"
                    value={formData.goal}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-50 text-sm"
                  >
                    <option value="AGGRESSIVE_LOSS">{t('onboarding.goalAggressiveLoss')}</option>
                    <option value="MODERATE_LOSS">{t('onboarding.goalModerateLoss')}</option>
                    <option value="MAINTENANCE">{t('onboarding.goalMaintenance')}</option>
                    <option value="LEAN_GAIN">{t('onboarding.goalLeanGain')}</option>
                    <option value="AGGRESSIVE_GAIN">{t('onboarding.goalAggressiveGain')}</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4 */}
          {step === 4 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold tracking-tight mb-1 text-zinc-900 dark:text-zinc-50">
                  {t('onboarding.step4Title')}
                </h2>
                <p className="text-xs text-zinc-400 dark:text-zinc-550">
                  {t('onboarding.step4Desc')}
                </p>
              </div>

              <div className="bg-zinc-100/50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 space-y-4">
                <div className="flex justify-between items-center border-b border-zinc-200 dark:border-zinc-800 pb-3">
                  <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">{t('onboarding.bmr')}</span>
                  <span className="text-sm font-semibold">{calculatedTargets.bmr} kcal</span>
                </div>
                <div className="flex justify-between items-center border-b border-zinc-200 dark:border-zinc-800 pb-3">
                  <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">{t('onboarding.tdee')}</span>
                  <span className="text-sm font-semibold">{calculatedTargets.tdee} kcal</span>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <span className="text-xs text-zinc-900 dark:text-zinc-50 font-bold">{t('onboarding.calorieTarget')}</span>
                  <span className="text-xl font-black text-zinc-900 dark:text-zinc-50">
                    {calculatedTargets.calories} <span className="text-xs font-normal text-zinc-500">kcal</span>
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-800 text-center text-xs">
                  <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 py-2.5 rounded-xl">
                    <div className="text-[10px] text-zinc-450 dark:text-zinc-500 font-semibold uppercase">{t('onboarding.protein')}</div>
                    <div className="font-bold text-zinc-900 dark:text-zinc-50 mt-0.5">{calculatedTargets.protein}g</div>
                  </div>
                  <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 py-2.5 rounded-xl">
                    <div className="text-[10px] text-zinc-450 dark:text-zinc-500 font-semibold uppercase">{t('onboarding.carbs')}</div>
                    <div className="font-bold text-zinc-900 dark:text-zinc-50 mt-0.5">{calculatedTargets.carbs}g</div>
                  </div>
                  <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 py-2.5 rounded-xl">
                    <div className="text-[10px] text-zinc-450 dark:text-zinc-500 font-semibold uppercase">{t('onboarding.fats')}</div>
                    <div className="font-bold text-zinc-900 dark:text-zinc-50 mt-0.5">{calculatedTargets.fat}g</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Controls */}
          <div className="flex justify-between items-center mt-8 pt-6 border-t border-zinc-200 dark:border-zinc-800">
            {step > 1 ? (
              <button
                type="button"
                onClick={prevStep}
                disabled={isPending}
                className="px-4 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 transition-all"
              >
                {t('common.back')}
              </button>
            ) : (
              <div />
            )}

            {step < 4 ? (
              <button
                type="button"
                onClick={nextStep}
                className="px-5 py-2 bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 font-semibold text-xs rounded-xl hover:bg-zinc-800 dark:hover:bg-zinc-200 active:scale-95 transition-all"
              >
                {t('common.continue')}
              </button>
            ) : (
              <button
                type="submit"
                disabled={isPending}
                className="px-6 py-2 bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 font-semibold text-xs rounded-xl hover:bg-zinc-850 dark:hover:bg-zinc-150 active:scale-95 disabled:opacity-50 transition-all shadow"
              >
                {isPending ? t('onboarding.saving') : t('onboarding.startApp')}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
