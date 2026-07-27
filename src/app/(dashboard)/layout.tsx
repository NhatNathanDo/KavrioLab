import React from 'react';
import Sidebar from '@/components/shared/sidebar';
import Header from '@/components/shared/header';
import { PageTransition } from '@/components/shared/PageTransition';

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-screen bg-[var(--background)] text-[var(--foreground)] transition-colors duration-200">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="flex-1 px-2.5 py-3 md:px-4 md:py-4 overflow-y-auto">
          <PageTransition>{children}</PageTransition>
        </main>
      </div>
    </div>
  );
}
