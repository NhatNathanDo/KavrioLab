'use client';

import React, { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Activity, Sun, Moon } from 'lucide-react';
import { useTheme } from '@/components/theme-provider';
import { useTranslation } from '@/components/language-provider';

export default function LoginPage() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage, t } = useTranslation();
  const [email, setEmail] = useState('developer@kavriolab.com');
  const [password, setPassword] = useState('AdminPassword123!');
  const [error, setError] = useState('');
  const [isPending, setIsPending] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setIsPending(true);

    try {
      const res = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (res?.error) {
        setError(t('login.errorInvalid'));
      } else {
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || t('login.errorGeneric'));
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 flex flex-col justify-center items-center px-4 transition-colors duration-200">
      {/* Back to Home & Language/Theme Toggles */}
      <div className="absolute top-6 max-w-sm w-full flex justify-between items-center text-xs px-2">
        <a href="/" className="text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50 font-medium">
          &larr; {t('login.home')}
        </a>
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
        </div>
      </div>

      <div className="w-full max-w-sm border border-zinc-200 dark:border-zinc-900 rounded-3xl p-8 bg-zinc-50/50 dark:bg-zinc-900/10 backdrop-blur shadow-sm space-y-6">
        <div className="flex flex-col items-center text-center space-y-2">
          <Activity className="w-6 h-6 text-zinc-900 dark:text-zinc-50" />
          <h2 className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            {t('login.title')}
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {t('login.subtitle')}
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-55 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-xl text-red-650 dark:text-red-400 text-xs text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-xs font-medium mb-1 text-zinc-500 dark:text-zinc-400">
              {t('login.email')}
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-50 text-sm text-zinc-900 dark:text-zinc-50 transition-all"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-xs font-medium mb-1 text-zinc-500 dark:text-zinc-400">
              {t('login.password')}
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-50 text-sm text-zinc-900 dark:text-zinc-50 transition-all"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full py-2 bg-zinc-900 dark:bg-zinc-50 text-zinc-50 dark:text-zinc-900 font-medium text-xs rounded-xl hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:opacity-50 transition-all"
          >
            {isPending ? t('login.signingIn') : t('common.signIn')}
          </button>
        </form>
      </div>
    </div>
  );
}
