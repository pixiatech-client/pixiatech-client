import React from 'react';
import { useRoles } from '@/contexts/RoleContext';

interface RoleBadgeProps {
  role: string;
}

export const RoleBadge: React.FC<RoleBadgeProps> = ({ role }) => {
  const { getRoleName, getRoleColor } = useRoles();
  
  const name = getRoleName(role);
  const color = getRoleColor(role);

  return (
    <span 
      className="px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest border"
      style={{
        backgroundColor: `${color}20`, // 20% opacity
        color: color,
        borderColor: `${color}40`, // 40% opacity
      }}
    >
      {name}
    </span>
  );
};
