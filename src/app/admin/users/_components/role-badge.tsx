'use client';

import React from 'react';

interface RoleBadgeProps {
  roleName: string;
  roleColor?: string;
}

export const RoleBadge: React.FC<RoleBadgeProps> = ({ roleName, roleColor }) => {
  const getRoleStyles = () => {
    const name = roleName.toLowerCase();
    if (name.includes('admin')) return 'bg-[#f5f3ff] text-[#a855f7] border-[#ede9fe]';
    if (name.includes('fournisseur')) return 'bg-[#eff6ff] text-[#3b82f6] border-[#dbeafe]';
    if (name.includes('commercial')) return 'bg-[#fffbeb] text-[#f59e0b] border-[#fef3c7]';
    return 'bg-gray-50 text-gray-400 border-gray-100';
  };

  return (
    <span className={`px-2.5 py-1 rounded-xl text-[10px] font-bold uppercase tracking-widest border ${getRoleStyles()}`}>
      {roleName}
    </span>
  );
};
