import React from 'react';
import { MessageSquare, Users, User, Mail } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MobileNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  unreadCount?: number;
}

export default function MobileNav({ 
  activeTab, 
  onTabChange, 
  unreadCount = 0
}: MobileNavProps) {
  const tabs = [
    { id: 'all', icon: <MessageSquare size={24} />, label: 'Discussions', badge: unreadCount },
    { id: 'contacts', icon: <Users size={24} />, label: 'Annuaire' },
    { id: 'profile', icon: <User size={24} />, label: 'Profil' },
  ];

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-[#1a1d21] border-t border-white/5 px-6 py-3 flex items-center justify-between z-[100] safe-area-bottom">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={cn(
            "relative flex flex-col items-center gap-1 transition-all",
            activeTab === tab.id ? "text-blue-500 scale-110" : "text-gray-500"
          )}
        >
          <div className={cn(
            "p-2 rounded-xl transition-all",
            activeTab === tab.id ? "bg-blue-500/10" : ""
          )}>
            {tab.icon}
          </div>
          <span className="text-[10px] font-bold uppercase tracking-tighter">{tab.label}</span>
          {tab.badge > 0 && (
            <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-[10px] font-black h-5 w-5 rounded-full flex items-center justify-center border-2 border-[#1a1d21] shadow-lg">
              {tab.badge > 99 ? '99+' : tab.badge}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
