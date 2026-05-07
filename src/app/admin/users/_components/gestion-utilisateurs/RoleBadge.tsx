import React from 'react';
import { UserRole } from './types';

interface RoleBadgeProps {
  role: UserRole;
}

export const RoleBadge: React.FC<RoleBadgeProps> = ({ role }) => {
  const getRoleStyles = () => {
    switch (role) {
      case UserRole.ADMINISTRATEUR:
        return 'bg-[#f5f3ff] text-[#a855f7] border-[#ede9fe]';
      case UserRole.FOURNISSEUR:
        return 'bg-[#eff6ff] text-[#3b82f6] border-[#dbeafe]';
      case UserRole.COMMERCIAL:
        return 'bg-[#fffbeb] text-[#f59e0b] border-[#fef3c7]';
      default:
        return 'bg-gray-50 text-gray-400 border-gray-100';
    }
  };

  return (
    <span className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest bg-gray-50 border border-gray-100 ${getRoleStyles()}`}>
      {role}
    </span>
  );
};
