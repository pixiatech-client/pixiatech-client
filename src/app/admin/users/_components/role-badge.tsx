'use client';

import React from 'react';

interface RoleBadgeProps {
  roleName: string;
  roleColor?: string;
}

const roleNameMap: Record<string, string> = {
  'administrateur': 'Administrator',
  'admin': 'Administrator',
  'fournisseur': 'Supplier',
  'commercial': 'Sales Rep',
};

export const RoleBadge: React.FC<RoleBadgeProps> = ({ roleName, roleColor }) => {
  const getRoleStyles = () => {
    const name = roleName.toLowerCase();
    if (name.includes('admin')) return 'bg-[#fef2f2] text-[#ef4444] border-[#fecaca]';
    if (name.includes('fournisseur')) return 'bg-[#ecfdf5] text-[#22c55e] border-[#d1fae5]';
    if (name.includes('commercial')) return 'bg-[#fff7ed] text-[#f97316] border-[#ffedd5]';
    return 'bg-[#eff6ff] text-[#3b82f6] border-[#dbeafe]';
  };

  const displayName = roleNameMap[roleName.toLowerCase()] || roleName;

  return (
    <span className={`px-2.5 py-1 rounded-xl text-[10px] font-bold uppercase tracking-widest border ${getRoleStyles()}`}>
      {displayName}
    </span>
  );
};
