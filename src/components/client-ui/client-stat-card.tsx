import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ClientStatCardProps {
  label: string;
  value: React.ReactNode;
  icon: LucideIcon;
  sub?: React.ReactNode;
  subRight?: React.ReactNode;
  iconClassName?: string;
  className?: string;
}

export function ClientStatCard({
  label,
  value,
  icon: Icon,
  sub,
  subRight,
  iconClassName,
  className,
}: ClientStatCardProps) {
  return (
    <div className={cn('bg-white rounded-2xl border border-neutral-200/80 p-5 shadow-xs hover:border-neutral-300 transition-all', className)}>
      <div className="flex items-center justify-between text-neutral-500 mb-2">
        <span className="text-xs font-semibold uppercase tracking-wider">{label}</span>
        <div className={cn('p-2 rounded-xl bg-neutral-100 text-neutral-700', iconClassName)}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div className="text-2xl sm:text-3xl font-extrabold text-neutral-900 font-mono tracking-tight">
        {value}
      </div>
      {(sub || subRight) && (
        <div className="mt-2 text-xs text-neutral-500 flex items-center justify-between gap-2">
          {sub ? <span className="truncate">{sub}</span> : <span />}
          {subRight && <span className="shrink-0">{subRight}</span>}
        </div>
      )}
    </div>
  );
}
