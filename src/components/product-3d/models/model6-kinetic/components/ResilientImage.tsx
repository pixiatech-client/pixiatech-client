'use client';
import { useState } from 'react';
import { Layers } from 'lucide-react';

interface ResilientImageProps {
  src: string;
  alt: string;
  className?: string;
  fallbackTitle?: string;
}

export function ResilientImage({
  src,
  alt,
  className = '',
  fallbackTitle = 'TESSERA MK-250',
}: ResilientImageProps) {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={`flex flex-col items-center justify-center bg-gradient-to-br from-[#14161C] via-[#0E1014] to-[#1A1410] border border-white/10 p-6 text-center ${className}`}
      >
        <Layers className="w-8 h-8 text-[#E87A24]/70 mb-3" aria-hidden="true" />
        <p className="text-sm font-medium text-[#F4F4F5]">{fallbackTitle}</p>
        <p className="text-xs text-[#9CA3AF] mt-1 max-w-xs">{alt}</p>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setHasError(true)}
      className={className}
    />
  );
}
