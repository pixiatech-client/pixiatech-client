import React from 'react';
import { CheckSquare, Clock, XCircle, AlertCircle } from 'lucide-react';
import { UserStatus } from './types';

interface StatusBadgeProps {
  status: UserStatus;
  className?: string;
  variant?: 'default' | 'glass';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  className = "",
  variant = 'default'
}) => {
  const getStatusConfig = () => {
    const isGlass = variant === 'glass';

    switch (status) {
      case UserStatus.APPROUVE:
        return {
          styles: isGlass
            ? 'bg-[#00a86b]/25 text-white border-white/20 backdrop-blur-xl shadow-lg shadow-emerald-900/20'
            : 'bg-[#e6f7f1] text-[#00a86b] border-[#c2ebd9]',
          icon: <CheckSquare className="w-3.5 h-3.5" />,
          label: 'APPROUVÉ'
        };
      case UserStatus.EN_ATTENTE:
        return {
          styles: isGlass
            ? 'bg-orange-500/25 text-white border-white/20 backdrop-blur-xl shadow-lg shadow-orange-900/20'
            : 'bg-[#fff7ed] text-[#f97316] border-[#ffedd5]',
          icon: <Clock className="w-3.5 h-3.5" />,
          label: status
        };
      case UserStatus.REJETE:
        return {
          styles: isGlass
            ? 'bg-rose-500/25 text-white border-white/20 backdrop-blur-xl shadow-lg shadow-rose-900/20'
            : 'bg-[#fef2f2] text-[#ef4444] border-[#fee2e2]',
          icon: <XCircle className="w-3.5 h-3.5" />,
          label: status
        };
      case UserStatus.SUSPENDU:
        return {
          styles: isGlass
            ? 'bg-[#8744E0]/25 text-white border-white/20 backdrop-blur-xl shadow-lg shadow-purple-900/20'
            : 'bg-[#f5f3ff] text-[#8744E0] border-[#ede9fe]',
          icon: <AlertCircle className="w-3.5 h-3.5" />,
          label: status
        };
      default:
        return {
          styles: isGlass
            ? 'bg-white/10 text-white border-white/20 backdrop-blur-md'
            : 'bg-gray-100 text-gray-700 border-gray-200',
          icon: null,
          label: status
        };
    }
  };

  const config = getStatusConfig();

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black tracking-widest border transition-all duration-300 ${config.styles} ${className}`}>
      {config.icon}
      {config.label}
    </span>
  );
};
