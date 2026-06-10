'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useI18n } from '@/lib/i18n';

interface BlurredPriceProps {
  price: string;
  isPriceHidden: boolean;
  className?: string;
  priceClassName?: string;
  overlayClassName?: string;
}

export function BlurredPrice({ 
  price, 
  isPriceHidden, 
  className = "", 
  priceClassName = "", 
  overlayClassName = ""
}: BlurredPriceProps) {
  const { locale } = useI18n();
  const [dotCount, setDotCount] = useState(0);

  useEffect(() => {
    if (!isPriceHidden) return;
    const interval = setInterval(() => {
      setDotCount(prev => (prev >= 3 ? 0 : prev + 1));
    }, 500);
    return () => clearInterval(interval);
  }, [isPriceHidden]);

  if (!isPriceHidden) {
    return <span className={priceClassName}>{price}</span>;
  }

  const estimatingText = locale === 'en' ? 'Estimating' : 'Estimation en cours';
  const defaultOverlayClass = overlayClassName || "bg-gradient-to-r from-[#7182ff] to-[#8b5cf6] bg-clip-text text-transparent font-extrabold";

  return (
    <span className={cn("relative inline-flex items-center justify-center select-none cursor-default", className)}>
      {/* Blurred Price in background (absolute) */}
      <span className={cn("absolute inset-0 flex items-center justify-center blur-[5px] opacity-25 select-none pointer-events-none filter transition-all", priceClassName)}>
        {price}
      </span>
      {/* Animating text as main flow element with fixed dots to prevent layout shift */}
      <span className={cn("inline-flex items-center gap-0.5 tracking-normal whitespace-nowrap", defaultOverlayClass)}>
        <span>{estimatingText}</span>
        <span className="inline-flex gap-0.5 ml-0.5 select-none pointer-events-none font-extrabold text-inherit">
          <span className={cn("transition-opacity duration-200", dotCount >= 1 ? "opacity-100" : "opacity-0")}>.</span>
          <span className={cn("transition-opacity duration-200", dotCount >= 2 ? "opacity-100" : "opacity-0")}>.</span>
          <span className={cn("transition-opacity duration-200", dotCount >= 3 ? "opacity-100" : "opacity-0")}>.</span>
        </span>
      </span>
    </span>
  );
}
