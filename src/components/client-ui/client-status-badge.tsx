import { cn } from '@/lib/utils';

type Tone = 'neutral' | 'emerald' | 'amber' | 'sky' | 'red';

const toneStyles: Record<Tone, { bg: string; text: string; border: string; dot?: string }> = {
  neutral: { bg: 'bg-neutral-100', text: 'text-neutral-700', border: 'border-neutral-200' },
  emerald: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-[#38E044]' },
  amber: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-500' },
  sky: { bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200', dot: 'bg-sky-500' },
  red: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', dot: 'bg-red-500' },
};

interface ClientStatusBadgeProps {
  label: string;
  tone?: Tone;
  dot?: boolean;
  className?: string;
}

export function ClientStatusBadge({ label, tone = 'neutral', dot, className }: ClientStatusBadgeProps) {
  const s = toneStyles[tone];
  return (
    <span className={cn('inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border', s.bg, s.text, s.border, className)}>
      {(dot || s.dot) && <span className={cn('w-1.5 h-1.5 rounded-full', s.dot ?? 'bg-current')} />}
      {label}
    </span>
  );
}