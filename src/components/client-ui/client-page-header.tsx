import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ClientPageHeaderProps {
  title: string;
  subtitle?: string;
  icon: LucideIcon;
  online?: boolean;
  action?: React.ReactNode;
  iconClassName?: string;
  className?: string;
}

export function ClientPageHeader({
  title,
  subtitle,
  icon: Icon,
  online,
  action,
  iconClassName,
  className,
}: ClientPageHeaderProps) {
  return (
    <div
      className={cn(
        'bg-white rounded-3xl border border-neutral-200/80 p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4',
        className,
      )}
    >
      <div className="flex items-center gap-4 min-w-0">
        <div className="w-12 h-12 rounded-2xl bg-[#0A0D0E] text-white flex items-center justify-center shrink-0 shadow-md">
          <Icon className={cn('w-6 h-6 text-[#38E044]', iconClassName)} />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 tracking-tight">{title}</h1>
            {online && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-[#38E044]" />
                En ligne
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-xs sm:text-sm text-neutral-500 mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
