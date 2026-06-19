'use client';

import React from 'react';
import { CheckSquare, Clock } from 'lucide-react';
import { useAdminT } from '@/hooks/useAdminT';

interface StatusBadgeProps {
  status: 'pending' | 'approved';
  className?: string;
  variant?: 'default' | 'glass';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  className = '',
  variant = 'default',
}) => {
  const { t } = useAdminT();
  const isGlass = variant === 'glass';

  const config = status === 'approved'
    ? {
        styles: isGlass
          ? 'bg-[#00a86b]/25 text-white border-white/20 backdrop-blur-xl shadow-lg shadow-emerald-900/20'
          : 'bg-[#e6f7f1] text-[#00a86b] border-[#c2ebd9]',
        icon: <CheckSquare className="w-3.5 h-3.5" />,
        label: t('Approved'),
      }
    : {
        styles: isGlass
          ? 'bg-orange-500/25 text-white border-white/20 backdrop-blur-xl shadow-lg shadow-orange-900/20'
          : 'bg-[#fff7ed] text-[#f97316] border-[#ffedd5]',
        icon: <Clock className="w-3.5 h-3.5" />,
        label: t('Pending'),
      };

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold tracking-widest border transition-all duration-300 ${config.styles} ${className}`}>
      {config.icon}
      {config.label}
    </span>
  );
};
