'use client';

import React from 'react';
import { cn } from '@/lib/utils';

/**
 * AnimatedButton — style "Vengeance UI" : surface avec effet de brillance (shine)
 * animé au survol, micro-interactions au clic, et libellé professionnel (jamais
 * une icône qui tourne en permanence). Pensé pour les actions du header admin
 * ("Mettre à jour" / "Réinitialiser").
 */
type Variant =
  | 'primary'
  | 'ghost'
  | 'danger'
  | 'outline';

interface AnimatedButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  children: React.ReactNode;
}

const variantClasses: Record<Variant, string> = {
  primary:
    'text-white bg-gradient-to-br from-blue-600 to-indigo-700 hover:from-blue-500 hover:to-indigo-600 border border-blue-400/40 shadow-[0_4px_14px_-2px_rgba(59,130,246,0.4)]',
  ghost:
    'bg-white text-gray-700 hover:text-blue-700 border border-gray-200 hover:border-blue-200 shadow-sm',
  danger:
    'text-white bg-gradient-to-br from-rose-600 to-red-700 hover:from-rose-500 hover:to-red-600 border border-rose-400/40 shadow-[0_4px_14px_-2px_rgba(244,63,94,0.4)]',
  outline:
    'bg-transparent text-gray-600 hover:text-gray-900 border border-gray-300 hover:border-gray-400',
};

const shineLight = 'rgba(255,255,255,0.45)';
const shineDark = 'rgba(255,255,255,0.1)';

export function AnimatedButton({
  variant = 'primary',
  className,
  children,
  onMouseEnter,
  onMouseLeave,
  ...props
}: AnimatedButtonProps) {
  const [hovered, setHovered] = React.useState(false);

  const handleEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
    setHovered(true);
    onMouseEnter?.(e);
  };
  const handleLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    setHovered(false);
    onMouseLeave?.(e);
  };

  return (
    <button
      type="button"
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      className={cn(
        'group relative isolate inline-flex h-11 items-center gap-2 overflow-hidden rounded-xl px-4',
        'font-black uppercase tracking-wider text-[11px]',
        'transition-all duration-200 active:scale-[0.97]',
        'outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60 focus-visible:ring-offset-2',
        variantClasses[variant],
        className
      )}
      {...props}
    >
      <span
        aria-hidden
        className={cn(
          'pointer-events-none absolute inset-0 z-0 transition-opacity duration-300',
          hovered ? 'opacity-100' : 'opacity-0'
        )}
        style={{
          background: `linear-gradient(105deg, transparent 20%, ${shineLight} 45%, ${shineDark} 50%, transparent 75%)`,
          backgroundSize: '200% 100%',
          backgroundPosition: hovered ? '200% 0' : '-100% 0',
          transitionProperty: 'background-position, opacity',
          transitionDuration: '700ms, 300ms',
          transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1), ease',
        }}
      />
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-white/10 to-white/5 transition-opacity duration-300"
        style={{ zIndex: 0 }}
      />
      <span className="relative z-10 inline-flex items-center gap-2">{children}</span>
    </button>
  );
}
