'use client';

import React from 'react';
import { SessionProvider } from 'next-auth/react';
import { ThemeProvider } from './theme-provider';
import { LanguageProvider } from './language-provider';

export function Providers({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <SessionProvider>
      <LanguageProvider>
        <ThemeProvider>{children}</ThemeProvider>
      </LanguageProvider>
    </SessionProvider>
  );
}
