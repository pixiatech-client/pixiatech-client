import React from 'react';
import { useRoles } from '@/contexts/RoleContext';
import { useI18n } from '@/lib/i18n';

interface RoleBadgeProps {
  role: string;
}

const roleNameMap: Record<string, string> = {
  'administrateur': 'Administrator',
  'admin': 'Administrator',
  'fournisseur': 'Supplier',
  'commercial': 'Sales Rep',
};

export const RoleBadge: React.FC<RoleBadgeProps> = ({ role }) => {
  const { getRoleName, getRoleColor } = useRoles();
  const { locale } = useI18n();
  
  const name = getRoleName(role);
  const color = getRoleColor(role);
  const displayName = locale === 'fr' ? name : (roleNameMap[name.toLowerCase()] || name);

  return (
    <span 
      className="px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest border"
      style={{
        backgroundColor: `${color}20`, // 20% opacity
        color: color,
        borderColor: `${color}40`, // 40% opacity
      }}
    >
      {displayName}
    </span>
  );
};
