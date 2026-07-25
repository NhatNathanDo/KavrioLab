'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Activity, Dumbbell, Apple, LineChart, Sun, Moon, ChevronDown } from 'lucide-react';
import { useTheme } from '@/components/theme-provider';
import { useTranslation } from '@/components/language-provider';

export default function HomePage() {
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage, t } = useTranslation();

  // Interactive Calculator State
  const [calcGender, setCalcGender] = useState<'MALE' | 'FEMALE'>('FEMALE');
  const [calcWeight, setCalcWeight] = useState(65);
  const [calcHeight, setCalcHeight] = useState(168);
  const [calcAge, setCalcAge] = useState(25);
  const [calcActivity, setCalcActivity] = useState(1.375); // Active multipliers

  const calculatedTdee = Math.round(
    (10 * calcWeight + 6.25 * calcHeight - 5 * calcAge + (calcGender === 'MALE' ? 5 : -161)) * calcActivity
  );

  // FAQ Accordion State
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 flex flex-col justify-between font-sans transition-colors duration-200">
      {/* Apple-style Navbar */}
      <header className="sticky top-0 z-50 w-full bg-white/70 dark:bg-zinc-950/70 backdrop-blur-md border-b border-zinc-200/80 dark:border-zinc-900/80 transition-colors duration-200">
        <div className="max-w-5xl w-full mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Activity className="w-5 h-5 text-zinc-900 dark:text-zinc-55" />
            <span className="font-semibold text-base tracking-tight">
              Kavrio<span className="font-light text-zinc-500">Lab</span>
            </span>
          </div>

          <div className="flex items-center gap-4">
            {/* Language Switch */}
            <button
              onClick={() => setLanguage(language === 'en' ? 'vi' : 'en')}
              className="text-[10px] font-bold px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 transition-all uppercase"
            >
              {language}
            </button>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 transition-all"
              aria-label="Toggle Theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            <Link
              href="/login"
              className="text-xs font-medium px-3.5 py-1.5 bg-zinc-900 dark:bg-zinc-50 text-zinc-50 dark:text-zinc-900 rounded-full hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all duration-150"
            >
              {t('common.signIn')}
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="max-w-4xl mx-auto px-6 py-24 text-center space-y-12">
          <div className="space-y-6">
            <span className="text-[10px] font-bold tracking-widest uppercase text-zinc-400 dark:text-zinc-500">
              {t('landing.tag')}
            </span>
            <h1 className="text-4xl md:text-6xl font-normal tracking-tight text-zinc-900 dark:text-zinc-50 leading-none">
              {t('landing.title1')} <br />
              <span className="font-light text-zinc-400 dark:text-zinc-500">{t('landing.title2')}</span>
            </h1>
            <p className="max-w-lg mx-auto text-zinc-500 dark:text-zinc-400 text-sm md:text-base font-normal leading-relaxed">
              {t('landing.subtitle')}
            </p>
          </div>

          <div className="flex gap-3 justify-center">
            <Link
              href="/login"
              className="px-6 py-2.5 bg-zinc-900 dark:bg-zinc-50 text-zinc-50 dark:text-zinc-900 font-medium text-xs rounded-full hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all shadow"
            >
              {t('landing.getStarted')}
            </Link>
            <a
              href="#calculator"
              className="px-6 py-2.5 border border-zinc-200 dark:border-zinc-800 rounded-full text-xs font-medium hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-all"
            >
              {t('landing.learnMore')}
            </a>
          </div>
        </section>

        {/* Interactive Showcase Mockup (Dashboard Preview) */}
        <section className="max-w-5xl mx-auto px-6 pb-24">
          <div className="bg-zinc-50/80 dark:bg-zinc-900/10 border border-zinc-200 dark:border-zinc-900 rounded-3xl p-6 md:p-8 shadow-sm space-y-8 transition-colors duration-200">
            {/* Top Stats Bar */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-zinc-200 dark:border-zinc-900 pb-6 gap-4">
              <div>
                <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">{t('landing.mockTitle')}</h3>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">{t('landing.mockDesc')}</p>
              </div>
              <div className="flex gap-2">
                <span className="px-3 py-1 bg-zinc-100 dark:bg-zinc-900 text-zinc-650 dark:text-zinc-400 text-[10px] font-bold rounded-lg border border-zinc-200 dark:border-zinc-800">
                  {t('landing.mockStatus')}
                </span>
              </div>
            </div>

            {/* Mockup Widgets Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Daily Calorie Goal Ring */}
              <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 p-5 rounded-2xl space-y-4">
                <div className="flex justify-between items-center text-zinc-500">
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">{t('landing.mockCalProgress')}</span>
                  <Apple className="w-3.5 h-3.5" />
                </div>
                <div className="relative flex items-center justify-center py-4">
                  {/* SVG Circle */}
                  <svg className="w-28 h-28 transform -rotate-90">
                    <circle cx="56" cy="56" r="48" strokeWidth="8" stroke="currentColor" className="text-zinc-100 dark:text-zinc-900" fill="transparent" />
                    <circle cx="56" cy="56" r="48" strokeWidth="8" stroke="currentColor" className="text-emerald-500" fill="transparent" strokeDasharray="301" strokeDashoffset="90" strokeLinecap="round" />
                  </svg>
                  <div className="absolute text-center">
                    <span className="text-lg font-bold text-zinc-900 dark:text-zinc-50">2,100</span>
                    <p className="text-[9px] text-zinc-450">/ 2,650 kcal</p>
                  </div>
                </div>
                <p className="text-[10px] text-zinc-500 dark:text-zinc-450 text-center">{t('landing.mockCalMeta')}</p>
              </div>

              {/* Weekly Workouts Activity log */}
              <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 p-5 rounded-2xl space-y-4">
                <div className="flex justify-between items-center text-zinc-500">
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">{t('landing.mockWeekly')}</span>
                  <Dumbbell className="w-3.5 h-3.5" />
                </div>
                <div className="space-y-2">
                  {[
                    { label: t('landing.mockPush'), day: t('landing.mockMon'), completed: true },
                    { label: t('landing.mockPull'), day: t('landing.mockWed'), completed: true },
                    { label: t('landing.mockLegs'), day: t('landing.mockFri'), completed: false },
                  ].map((w) => (
                    <div key={w.label} className="flex justify-between items-center bg-zinc-50/50 dark:bg-zinc-900/20 p-2.5 rounded-xl border border-zinc-100 dark:border-zinc-900">
                      <div className="space-y-0.5">
                        <span className="text-[11px] font-medium text-zinc-900 dark:text-zinc-100">{w.label}</span>
                        <p className="text-[9px] text-zinc-450">{w.day}</p>
                      </div>
                      <span className={`w-2.5 h-2.5 rounded-full ${w.completed ? 'bg-emerald-500' : 'bg-zinc-200 dark:bg-zinc-800'}`} />
                    </div>
                  ))}
                </div>
              </div>

              {/* TDEE Weight Trends Graph */}
              <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 p-5 rounded-2xl space-y-4">
                <div className="flex justify-between items-center text-zinc-500">
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">{t('landing.mockTrend')}</span>
                  <LineChart className="w-3.5 h-3.5" />
                </div>
                <div className="h-28 flex items-end justify-between pt-4 px-2">
                  {[
                    { val: 75.5, label: '1d' },
                    { val: 75.2, label: '2d' },
                    { val: 74.9, label: '3d' },
                    { val: 74.8, label: '4d' },
                    { val: 74.5, label: '5d' },
                    { val: 74.2, label: '6d' },
                    { val: 74.0, label: '7d' }
                  ].map((h) => (
                    <div key={h.label} className="flex flex-col items-center gap-1.5 w-6">
                      <div
                        className="w-full bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-900 dark:hover:bg-zinc-50 rounded transition-all duration-300"
                        style={{ height: `${(h.val - 73) * 35}px` }}
                      />
                      <span className="text-[9px] text-zinc-400">{h.label}</span>
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-zinc-550 dark:text-zinc-450 text-center">{t('landing.mockTrendMeta')}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Live TDEE Interactive Calculator */}
        <section id="calculator" className="max-w-4xl mx-auto px-6 py-24 border-t border-zinc-150 dark:border-zinc-900">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <span className="text-[10px] font-bold tracking-widest uppercase text-zinc-400 dark:text-zinc-500">
                Calculator Widget
              </span>
              <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
                {t('landing.calculatorTitle')}
              </h2>
              <p className="text-xs text-zinc-550 dark:text-zinc-400 leading-relaxed">
                {t('landing.calculatorDesc')} Get immediate feedback on daily metabolic indicators based on biometric formulas.
              </p>

              <div className="p-6 bg-zinc-50/50 dark:bg-zinc-900/10 border border-zinc-200 dark:border-zinc-900 rounded-3xl flex justify-between items-center">
                <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">{t('landing.resultText')}</span>
                <span className="text-2xl font-black text-zinc-900 dark:text-zinc-50">
                  {calculatedTdee} <span className="text-xs font-normal text-zinc-400">kcal / day</span>
                </span>
              </div>
            </div>

            <div className="bg-zinc-50/80 dark:bg-zinc-900/20 border border-zinc-200 dark:border-zinc-900 p-8 rounded-3xl space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {['FEMALE', 'MALE'].map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setCalcGender(g as any)}
                    className={`py-2 text-xs font-medium rounded-xl border transition-all duration-150 ${
                      calcGender === g
                        ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 border-transparent'
                        : 'bg-white dark:bg-zinc-950 text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800'
                    }`}
                  >
                    {g === 'FEMALE' ? t('landing.female') : t('landing.male')}
                  </button>
                ))}
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label htmlFor="calcWeight" className="block text-[10px] font-semibold text-zinc-405 mb-1 uppercase tracking-wider">
                    {t('landing.weight')}
                  </label>
                  <input
                    id="calcWeight"
                    type="number"
                    value={calcWeight}
                    onChange={(e) => setCalcWeight(Number(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none"
                  />
                </div>

                <div>
                  <label htmlFor="calcHeight" className="block text-[10px] font-semibold text-zinc-405 mb-1 uppercase tracking-wider">
                    {t('landing.height')}
                  </label>
                  <input
                    id="calcHeight"
                    type="number"
                    value={calcHeight}
                    onChange={(e) => setCalcHeight(Number(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none"
                  />
                </div>

                <div>
                  <label htmlFor="calcAge" className="block text-[10px] font-semibold text-zinc-405 mb-1 uppercase tracking-wider">
                    {t('landing.age')}
                  </label>
                  <input
                    id="calcAge"
                    type="number"
                    value={calcAge}
                    onChange={(e) => setCalcAge(Number(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none"
                  />
                </div>

                <div>
                  <label htmlFor="calcActivity" className="block text-[10px] font-semibold text-zinc-405 mb-1 uppercase tracking-wider">
                    {t('landing.activity')}
                  </label>
                  <select
                    id="calcActivity"
                    value={calcActivity}
                    onChange={(e) => setCalcActivity(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none text-sm text-zinc-900 dark:text-zinc-100"
                  >
                    <option value={1.2}>{t('landing.activitySedentary')}</option>
                    <option value={1.375}>{t('landing.activityLight')}</option>
                    <option value={1.55}>{t('landing.activityModerate')}</option>
                    <option value={1.725}>{t('landing.activityVery')}</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How it Works / Core Pillars */}
        <section className="max-w-4xl mx-auto px-6 py-24 border-t border-zinc-150 dark:border-zinc-900">
          <div className="text-center space-y-4 mb-16">
            <span className="text-[10px] font-bold tracking-widest uppercase text-zinc-400 dark:text-zinc-500">
              Methodology
            </span>
            <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
              {t('landing.howTitle')}
            </h2>
            <p className="max-w-md mx-auto text-xs text-zinc-500 dark:text-zinc-450 leading-relaxed">
              {t('landing.howDesc')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 text-left">
            <div className="space-y-2">
              <h3 className="font-semibold text-xs tracking-tight text-zinc-900 dark:text-zinc-50">{t('landing.step1')}</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                {t('landing.step1Desc')}
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-xs tracking-tight text-zinc-900 dark:text-zinc-50">{t('landing.step2')}</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                {t('landing.step2Desc')}
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-xs tracking-tight text-zinc-900 dark:text-zinc-50">{t('landing.step3')}</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                {t('landing.step3Desc')}
              </p>
            </div>
          </div>
        </section>

        {/* Collapsible FAQ Section */}
        <section className="max-w-3xl mx-auto px-6 py-24 border-t border-zinc-150 dark:border-zinc-900">
          <div className="text-center space-y-4 mb-16">
            <span className="text-[10px] font-bold tracking-widest uppercase text-zinc-400 dark:text-zinc-500">
              Support
            </span>
            <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
              {t('landing.faqTitle')}
            </h2>
          </div>

          <div className="space-y-4">
            {[
              { q: t('landing.faqQ1'), a: t('landing.faqA1') },
              { q: t('landing.faqQ2'), a: t('landing.faqA2') },
              { q: t('landing.faqQ3'), a: t('landing.faqA3') },
            ].map((faq) => (
              <div
                key={faq.q}
                className="bg-zinc-50/50 dark:bg-zinc-900/10 border border-zinc-200 dark:border-zinc-900 rounded-2xl overflow-hidden transition-all duration-200"
              >
                <button
                  type="button"
                  onClick={() => {
                    const qText = faq.q;
                    const idx = [t('landing.faqQ1'), t('landing.faqQ2'), t('landing.faqQ3')].indexOf(qText);
                    toggleFaq(Math.max(0, idx));
                  }}
                  className="w-full px-6 py-4 flex justify-between items-center text-left text-xs font-semibold text-zinc-900 dark:text-zinc-100 focus:outline-none"
                >
                  <span>{faq.q}</span>
                  {/* Since openFaq holds the index, let's map index carefully */}
                  <ChevronDown className={`w-4 h-4 text-zinc-400 transform transition-transform duration-200 ${openFaq === [t('landing.faqQ1'), t('landing.faqQ2'), t('landing.faqQ3')].indexOf(faq.q) ? 'rotate-180' : ''}`} />
                </button>
                {openFaq === [t('landing.faqQ1'), t('landing.faqQ2'), t('landing.faqQ3')].indexOf(faq.q) && (
                  <div className="px-6 pb-5 pt-1 text-xs text-zinc-500 dark:text-zinc-400 border-t border-zinc-200/50 dark:border-zinc-900/50 leading-relaxed">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="h-16 border-t border-zinc-100 dark:border-zinc-900 flex items-center justify-center text-[10px] text-zinc-450 dark:text-zinc-550 transition-colors duration-200">
        &copy; {new Date().getFullYear()} KavrioLab. Designed in California.
      </footer>
    </div>
  );
}
