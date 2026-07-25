'use client';

import React, { useState, useRef, useCallback } from 'react';
import { ChevronsLeftRight } from 'lucide-react';

interface PhotoComparisonSliderProps {
  beforeImage: string;
  afterImage: string;
  beforeLabel?: string;
  afterLabel?: string;
  className?: string;
}

export function PhotoComparisonSlider({
  beforeImage,
  afterImage,
  beforeLabel = 'Before',
  afterLabel = 'After',
  className = '',
}: PhotoComparisonSliderProps) {
  const [sliderPosition, setSliderPosition] = useState<number>(50);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const handleMove = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    let percentage = (x / rect.width) * 100;
    if (percentage < 0) percentage = 0;
    if (percentage > 100) percentage = 100;
    setSliderPosition(percentage);
  }, []);

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!isDragging) return;
      handleMove(e.touches[0].clientX);
    },
    [isDragging, handleMove]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging) return;
      handleMove(e.clientX);
    },
    [isDragging, handleMove]
  );

  return (
    <div
      ref={containerRef}
      onMouseDown={() => setIsDragging(true)}
      onMouseUp={() => setIsDragging(false)}
      onMouseLeave={() => setIsDragging(false)}
      onMouseMove={handleMouseMove}
      onTouchStart={() => setIsDragging(true)}
      onTouchEnd={() => setIsDragging(false)}
      onTouchMove={handleTouchMove}
      className={`relative w-full overflow-hidden rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-zinc-950 select-none cursor-ew-resize ${className}`}
    >
      {/* After Image (Full background) */}
      <img
        src={afterImage}
        alt="After Transformation"
        className="w-full h-full object-cover pointer-events-none block"
      />
      <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md text-white text-xs font-extrabold px-3 py-1.5 rounded-xl border border-white/20 shadow-md">
        {afterLabel}
      </div>

      {/* Before Image (Clipped Overlay) */}
      <div
        className="absolute inset-0 overflow-hidden pointer-events-none"
        style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
      >
        <img
          src={beforeImage}
          alt="Before Transformation"
          className="w-full h-full object-cover block"
        />
        <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md text-white text-xs font-extrabold px-3 py-1.5 rounded-xl border border-white/20 shadow-md">
          {beforeLabel}
        </div>
      </div>

      {/* Vertical Slider Bar */}
      <div
        className="absolute top-0 bottom-0 w-1 bg-white shadow-[0_0_12px_rgba(255,255,255,0.8)] pointer-events-none"
        style={{ left: `${sliderPosition}%` }}
      >
        <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-9 h-9 rounded-full bg-white text-zinc-900 shadow-2xl flex items-center justify-center border-2 border-zinc-900">
          <ChevronsLeftRight className="w-4 h-4 text-zinc-900" />
        </div>
      </div>
    </div>
  );
}
