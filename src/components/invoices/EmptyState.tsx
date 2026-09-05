'use client';

import type { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={`bg-white border border-gray-200 rounded-xl p-10 sm:p-14 text-center ${className ?? ''}`}>
      <div className="w-14 h-14 mx-auto mb-5 rounded-full bg-gray-50 flex items-center justify-center">
        <Icon className="w-6 h-6 text-gray-400" />
      </div>
      <p className="text-[16px] font-semibold text-gray-900 mb-1">{title}</p>
      {description && <p className="text-[13px] text-gray-500 max-w-md mx-auto leading-relaxed">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}