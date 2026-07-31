'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

function ProgressContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isNavigating, setIsNavigating] = useState(false);

  useEffect(() => {
    setIsNavigating(false);
  }, [pathname, searchParams]);

  useEffect(() => {
    const handleAnchorClick = (e: MouseEvent) => {
      const target = e.currentTarget as HTMLAnchorElement | null;
      if (
        target &&
        target.href &&
        target.href.startsWith(window.location.origin) &&
        !target.href.includes('#') &&
        target.target !== '_blank'
      ) {
        const url = new URL(target.href);
        if (url.pathname !== window.location.pathname) {
          setIsNavigating(true);
        }
      }
    };

    const anchors = document.querySelectorAll('a[href]');
    anchors.forEach((a) => a.addEventListener('click', handleAnchorClick as EventListener));

    return () => {
      anchors.forEach((a) => a.removeEventListener('click', handleAnchorClick as EventListener));
    };
  }, [pathname]);

  if (!isNavigating) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] h-1 w-full overflow-hidden bg-zinc-200/50 dark:bg-zinc-800/50">
      <div className="h-full w-full bg-gradient-to-r from-rose-500 via-indigo-500 to-purple-500 animate-pulse transition-all duration-300" />
    </div>
  );
}

export function NavigationProgress() {
  return (
    <Suspense fallback={null}>
      <ProgressContent />
    </Suspense>
  );
}
