import React from 'react';
import { Search, Filter, LayoutGrid, List, UserPlus, Shield, Clock } from 'lucide-react';
import { UserRole, UserStatus } from './types';
import { CustomSelect } from '@/components/ui/custom-select';

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
}) => {
  const roleOptions = [
    { value: '', label: 'Tous les Rôles' },
    { value: UserRole.ADMINISTRATEUR, label: 'Administrateur', color: '#a855f7', bgColor: '#f5f3ff' },
    { value: UserRole.FOURNISSEUR, label: 'Fournisseur', color: '#3b82f6', bgColor: '#eff6ff' },
    { value: UserRole.COMMERCIAL, label: 'Commercial', color: '#f59e0b', bgColor: '#fffbeb' },
  ];

  const statusOptions = [
    { value: '', label: 'Tous les Statuts' },
    { value: UserStatus.APPROUVE, label: 'Approuvé', color: '#00a86b', bgColor: '#e6f7f1' },
    { value: UserStatus.EN_ATTENTE, label: 'En attente', color: '#f97316', bgColor: '#fff7ed' },
    { value: UserStatus.REJETE, label: 'Rejeté', color: '#ef4444', bgColor: '#fef2f2' },
    { value: UserStatus.SUSPENDU, label: 'Suspendu', color: '#8744E0', bgColor: '#f5f3ff' },
  ];

  return (
    <div className="flex flex-col md:flex-row gap-4 mb-8 items-center justify-between bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
      <div className="relative w-full md:w-96">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
        <input
          type="text"
          placeholder="Rechercher par nom ou email..."
          className="w-full pl-11 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm text-gray-900 placeholder:text-gray-500"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="flex flex-wrap items-center gap-6 w-full md:w-auto">
        {/* View Toggle */}
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
          label="Rôle"
          icon={<Shield className="w-3.5 h-3.5 text-blue-500" />}
          placeholder="Tous les Rôles"
          options={roleOptions}
          value={roleFilter}
          onChange={setRoleFilter}
        />

        <CustomSelect
          label="Statut"
          icon={<Clock className="w-3.5 h-3.5 text-purple-500" />}
          placeholder="Tous les Statuts"
          options={statusOptions}
          value={statusFilter}
          onChange={setStatusFilter}
        />

        <button
          onClick={onAddUser}
          className="ml-auto md:ml-0 bg-blue-600 hover:bg-black text-white px-6 py-3.5 rounded-2xl text-sm font-bold transition-all flex items-center gap-3 shadow-lg shadow-blue-500/20 active:scale-[0.98] group"
        >
          <UserPlus size={18} className="transition-colors group-hover:text-blue-400" />
          Ajouter un Utilisateur
        </button>
      </div>
    </div>
  );
};
