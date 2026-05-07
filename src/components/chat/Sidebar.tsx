import React from 'react';
import { LayoutGrid, Briefcase, Users, Newspaper, Archive, User, Settings, LogOut, MessageSquare, Mail } from 'lucide-react';
import { cn } from '../../lib/utils';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onLogout: () => void;
  onOpenMiniChat: () => void;
}

export default function Sidebar({ 
  activeTab, 
  onTabChange, 
  onLogout, 
  onOpenMiniChat
}: SidebarProps) {
  const menuItems = [
    { id: 'all', icon: <MessageSquare size={22} />, label: 'Tous les messages', badge: 43 },
    { id: 'mini', icon: <Mail size={22} />, label: 'Mini Chat', onClick: onOpenMiniChat },
  ];

  const bottomItems = [
    { id: 'profile', icon: <User size={22} />, label: 'Profil' },
  ];

  return (
    <div className="w-20 bg-[#1a1d21] flex flex-col items-center py-6 h-full border-r border-white/5">
      <div className="mb-10">
        <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-white font-bold text-xl">
          A
        </div>
      </div>

      <div className="flex-1 flex flex-col gap-4 w-full px-2">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => item.onClick ? item.onClick() : onTabChange(item.id)}
            className={cn(
              "relative flex flex-col items-center justify-center py-3 rounded-2xl transition-all group",
              activeTab === item.id ? "bg-[#2a2d31] text-white shadow-lg" : "text-gray-500 hover:text-gray-300"
            )}
          >
            {item.icon}
            <span className="text-[10px] mt-1 font-medium">{item.label.split(' ')[0]}</span>
            {item.badge && (
              <span className="absolute top-2 right-2 bg-orange-500 text-white text-[9px] font-bold px-1 rounded-full min-w-[14px] h-[14px] flex items-center justify-center border border-[#1a1d21]">
                {item.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-4 w-full px-2 mt-auto">
        {bottomItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={cn(
              "flex flex-col items-center justify-center py-3 rounded-2xl transition-all",
              activeTab === item.id ? "bg-[#2a2d31] text-white" : "text-gray-500 hover:text-gray-300"
            )}
          >
            {item.icon}
            <span className="text-[10px] mt-1 font-medium">{item.label}</span>
          </button>
        ))}
        <button
          onClick={onLogout}
          className="flex flex-col items-center justify-center py-3 rounded-2xl text-gray-500 hover:text-red-400 transition-all"
        >
          <LogOut size={22} />
          <span className="text-[10px] mt-1 font-medium">Déconnexion</span>
        </button>
      </div>
    </div>
  );
}
