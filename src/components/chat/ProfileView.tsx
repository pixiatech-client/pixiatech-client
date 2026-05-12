'use client';

import React from 'react';
import { User, LogOut, Shield, Bell, Settings, ChevronRight, Mail } from 'lucide-react';
import { UserProfileChat as UserProfile } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useRoles } from '@/contexts/RoleContext';

interface ProfileViewProps {
  user: UserProfile;
  onLogout: () => void;
}

export default function ProfileView({ user, onLogout }: ProfileViewProps) {
  const { getRoleName, getRoleColor } = useRoles();
  const roleColor = getRoleColor(user.role);

  const stats = [
    { 
      label: 'Rôle', 
      value: getRoleName(user.role).toUpperCase(), 
      icon: <Shield size={16} style={{ color: roleColor }} /> 
    },
    { label: 'Statut', value: user.isOnline ? 'En ligne' : 'Hors ligne', icon: <div className={cn("h-2 w-2 rounded-full", user.isOnline ? "bg-green-500" : "bg-gray-500")} /> },
  ];

  const menuItems = [
    { label: 'Paramètres du compte', icon: <Settings size={20} /> },
    { label: 'Notifications', icon: <Bell size={20} /> },
    { label: 'Sécurité', icon: <Shield size={20} /> },
  ];

  return (
    <div className="flex-1 bg-[#f4f4f9] overflow-y-auto pb-20">
      <div className="bg-[#1a1d21] pt-12 pb-8 px-6 text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-10">
          <div className="absolute -top-24 -left-24 w-64 h-64 bg-blue-500 rounded-full blur-[100px]" />
          <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-emerald-500 rounded-full blur-[100px]" />
        </div>

        <div className="relative z-10">
          <div className="w-24 h-24 mx-auto rounded-[32px] border-4 border-white/10 p-1 mb-4 shadow-2xl">
            <img 
              src={user.photoURL} 
              alt={user.displayName} 
              className="w-full h-full rounded-[24px] object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <h2 className="text-2xl font-black text-white mb-1">{user.displayName}</h2>
          <p className="text-white/40 text-xs font-bold uppercase tracking-widest">{user.email}</p>
        </div>
      </div>

      <div className="px-6 -mt-6 relative z-20">
        <div className="bg-white rounded-3xl shadow-xl shadow-black/5 p-6 flex justify-around border border-gray-100">
          {stats.map((stat, i) => (
            <div key={i} className="text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                {stat.icon}
                <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">{stat.label}</span>
              </div>
              <p className="text-sm font-black text-gray-900">{stat.value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="p-6 space-y-6">
        <div className="space-y-2">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 px-2">Général</h3>
          <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden">
            {menuItems.map((item, i) => (
              <button 
                key={i}
                className={cn(
                  "w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors",
                  i !== menuItems.length - 1 && "border-b border-gray-50"
                )}
              >
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500">
                    {item.icon}
                  </div>
                  <span className="font-bold text-sm text-gray-700">{item.label}</span>
                </div>
                <ChevronRight size={18} className="text-gray-300" />
              </button>
            ))}
          </div>
        </div>

        <button 
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-3 p-5 rounded-3xl bg-red-50 text-red-500 font-black uppercase tracking-widest text-xs hover:bg-red-100 transition-all border border-red-100"
        >
          <LogOut size={18} />
          Déconnexion
        </button>
      </div>
    </div>
  );
}
