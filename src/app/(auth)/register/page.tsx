'use client';

import React, { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Activity, Sun, Moon } from 'lucide-react';
import { useTheme } from '@/components/theme-provider';
import { useTranslation } from '@/components/language-provider';

export default function RegisterPage() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage, t } = useTranslation();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isPending, setIsPending] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError(t('register.passwordMismatch'));
      return;
    }

    if (password.length < 6) {
      setError(t('register.passwordTooShort'));
      return;
    }

    setIsPending(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.error === 'Email address is already in use') {
          setError(t('register.errorEmailTaken'));
        } else {
          setError(data.error || t('register.errorGeneric'));
        }
        setIsPending(false);
        return;
      }

      // Automatically sign in the new user
      const loginRes = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (loginRes?.error) {
        router.push('/login');
      } else {
        router.push('/onboarding');
      }
    } catch (err: any) {
      setError(err.message || t('register.errorGeneric'));
      setIsPending(false);
    }
  };

  const handleGoogleSignIn = () => {
    signIn('google', { callbackUrl: '/dashboard' });
  };

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 flex flex-col justify-center items-center px-4 py-8 transition-colors duration-200">
      {/* Header controls */}
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

      <div className="w-full max-w-sm border border-zinc-200 dark:border-zinc-900 rounded-3xl p-8 bg-zinc-50/50 dark:bg-zinc-900/10 backdrop-blur shadow-sm space-y-5 my-auto">
        <div className="flex flex-col items-center text-center space-y-2">
          <Activity className="w-6 h-6 text-zinc-900 dark:text-zinc-50" />
          <h2 className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            {t('register.title')}
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {t('register.subtitle')}
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-xl text-red-600 dark:text-red-400 text-xs text-center">
            {error}
          </div>
        )}

        {/* Google Sign In Option */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          className="w-full py-2 px-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          {t('login.googleSignIn')}
        </button>

        <div className="relative flex py-1 items-center">
          <div className="flex-grow border-t border-zinc-200 dark:border-zinc-800"></div>
          <span className="flex-shrink mx-3 text-[10px] uppercase font-semibold text-zinc-400 dark:text-zinc-600">
            {t('login.orContinueWith')}
          </span>
          <div className="flex-grow border-t border-zinc-200 dark:border-zinc-800"></div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label htmlFor="name" className="block text-xs font-medium mb-1 text-zinc-500 dark:text-zinc-400">
              {t('register.name')}
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
              className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-50 text-sm text-zinc-900 dark:text-zinc-50 transition-all"
              required
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-xs font-medium mb-1 text-zinc-500 dark:text-zinc-400">
              {t('register.email')}
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-50 text-sm text-zinc-900 dark:text-zinc-50 transition-all"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-xs font-medium mb-1 text-zinc-500 dark:text-zinc-400">
              {t('register.password')}
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

          <div>
            <label htmlFor="confirmPassword" className="block text-xs font-medium mb-1 text-zinc-500 dark:text-zinc-400">
              {t('register.confirmPassword')}
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-50 text-sm text-zinc-900 dark:text-zinc-50 transition-all"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full py-2 mt-2 bg-zinc-900 dark:bg-zinc-50 text-zinc-50 dark:text-zinc-900 font-medium text-xs rounded-xl hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:opacity-50 transition-all"
          >
            {isPending ? t('register.creatingAccount') : t('register.signUpBtn')}
          </button>
        </form>

        <div className="text-center text-xs text-zinc-500 dark:text-zinc-400 pt-2">
          {t('register.haveAccount')}{' '}
          <a href="/login" className="text-zinc-900 dark:text-zinc-50 font-medium hover:underline">
            {t('register.signInLink')}
          </a>
        </div>
      </div>
    </div>
  );
}
