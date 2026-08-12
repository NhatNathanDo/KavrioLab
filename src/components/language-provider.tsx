'use client';

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { dictionaries, Language } from '@/lib/translations/dictionaries';

type LanguageContextType = {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (keyPath: string) => string;
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const [language, setLang] = useState<Language>('en');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedLang = localStorage.getItem('language') as Language | null;
    if (savedLang === 'vi' || savedLang === 'en') {
      setLang(savedLang);
    } else {
      const browserLang = navigator.language.split('-')[0];
      if (browserLang === 'vi') setLang('vi');
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLang(lang);
    localStorage.setItem('language', lang);
    document.cookie = `language=${lang}; path=/; max-age=31536000; SameSite=Lax`;
    window.location.reload();
  };

  const t = (keyPath: string): string => {
    const keys = keyPath.split('.');
    let activeLang: Language = 'en';
    if (language && language in dictionaries) {
      activeLang = language;
    } else if ((language as string)?.startsWith('vi')) {
      activeLang = 'vi';
    }
    let current: any = dictionaries[activeLang] || dictionaries.en;
    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        return keyPath;
      }
    }
    return typeof current === 'string' ? current : keyPath;
  };

  const contextValue = useMemo(() => ({
    language,
    setLanguage,
    t,
  }), [language]);

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return context;
}
