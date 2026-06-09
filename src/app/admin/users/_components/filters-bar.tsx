'use client';

import React, { useState } from 'react';
import { Search, LayoutGrid, List, UserPlus, Shield, Clock } from 'lucide-react';
import { CustomSelect } from './custom-select';
import { useAdminT } from '@/hooks/useAdminT';

interface FiltersBarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  roleFilter: string;
  setRoleFilter: (role: string) => void;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  onAddUser: () => void;
  viewMode: 'grid' | 'table';
  setViewMode: (mode: 'grid' | 'table') => void;
  isAdmin: boolean;
  roleOptions: { value: string; label: string; color?: string; bgColor?: string }[];
}

export const FiltersBar: React.FC<FiltersBarProps> = ({
  searchQuery,
  setSearchQuery,
  roleFilter,
  setRoleFilter,
  statusFilter,
  setStatusFilter,
  onAddUser,
  viewMode,
  setViewMode,
  isAdmin,
  roleOptions,
}) => {
  const { t } = useAdminT();
  const statusOptions = [
    { value: '', label: t('All Statuses') },
    { value: 'approved', label: t('Approved'), color: '#00a86b', bgColor: '#e6f7f1' },
    { value: 'pending', label: t('Pending'), color: '#f97316', bgColor: '#fff7ed' },
  ];

  return (
    <div className="flex flex-col md:flex-row gap-4 mb-8 items-center justify-between bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
      <div className="relative w-full md:w-96">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
        <input
          type="text"
          placeholder={t('Search by name or email...')}
          className="w-full pl-11 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm text-gray-900 placeholder:text-gray-500"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
        <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl p-1">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`p-1.5 rounded-lg transition-all ${viewMode === 'table' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <List className="w-4 h-4" />
          </button>
        </div>

        <CustomSelect
          label={t('Role')}
          icon={<Shield className="w-3.5 h-3.5 text-blue-500" />}
          placeholder={t('All Roles')}
          options={roleOptions}
          value={roleFilter}
          onChange={setRoleFilter}
          isActive={!!roleFilter}
        />

        <CustomSelect
          label={t('Status')}
          icon={<Clock className="w-3.5 h-3.5 text-purple-500" />}
          placeholder={t('All Statuses')}
          options={statusOptions}
          value={statusFilter}
          onChange={setStatusFilter}
          isActive={!!statusFilter}
        />

        {isAdmin && (
          <button
            onClick={onAddUser}
            className="ml-auto md:ml-0 bg-blue-600 hover:bg-black text-white px-6 py-3.5 rounded-2xl text-sm font-bold transition-all flex items-center gap-3 shadow-lg shadow-blue-500/20 active:scale-[0.98] group"
          >
            <UserPlus size={18} className="transition-colors group-hover:text-blue-400" />
            {t('Add User')}
          </button>
        )}
      </div>
    </div>
  );
};
