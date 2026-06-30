'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import type { UserProfile, UserRole } from '@/lib/types';
import { Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Pagination } from '@/components/ui/Pagination';
import { motion, AnimatePresence } from 'framer-motion';
import { updateUser, deleteUsers, registerUser, getUsers } from '@/app/admin/actions';
import { useUser, useFirestore, useAuth, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { useI18n } from '@/lib/i18n';
import { useAdminT } from '@/hooks/useAdminT';

import { FiltersBar } from './FiltersBar';
import { UserCard } from './UserCard';
import { UserRow } from './UserRow';
import { DeleteConfirmationModal } from './DeleteConfirmationModal';
import { UserProfileDrawer } from './UserProfileDrawer';
import { UserTable } from './UserTable';
import { User, UserRole as LocalUserRole, UserStatus } from './types';
import { useRoles } from '@/contexts/RoleContext';
import { normalizeSearchText } from '@/lib/utils';

const ITEMS_PER_PAGE = 8;

export function UserManager() {
  const { t } = useI18n();
  const { t: ta } = useAdminT();
  const { userProfile, isUserLoading } = useUser();
  const firestore = useFirestore();
  const auth = useAuth();

  // State
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const [paginateDirection, setPaginateDirection] = useState(0);

  // Modals
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isAddMode, setIsAddMode] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);

  const { roles, getRoleName, getRoleColor, getRoleTemplate } = useRoles();

  const isAdmin = userProfile?.role === 'admin';

  // Fetch users
  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await getUsers({ limit: ITEMS_PER_PAGE });
      setUsers(result.users);
      setTotalCount(result.totalCount);
    } catch (error) {
      toast.error(ta('Unable to load users.'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Adapt Firebase UserProfile to local User type
  const adaptUser = useCallback((profile: UserProfile): User => {
    const roleId = profile.role;
    const mappedStatus = profile.status === 'approved' ? UserStatus.APPROVED
      : profile.status === 'pending' ? UserStatus.PENDING
      : UserStatus.PENDING;
    return {
      id: profile.uid,
      name: profile.displayName || '',
      email: profile.email || '',
      phone: profile.phone,
      role: roleId,
      roleName: getRoleName(roleId),
      roleColor: getRoleColor(roleId),
      status: mappedStatus,
      avatar: profile.photoURL || '',
      backgroundImage: profile.backgroundImage || '',
      description: profile.description || '',
      lastLogin: new Date().toISOString(),
      createdAt: typeof profile.createdAt === 'string'
        ? profile.createdAt
        : profile.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
    };
  }, [getRoleName, getRoleColor]);

  // Filtered users (client-side for search)
  const filteredUsers = useMemo(() => {
    let filtered = users;

    if (searchQuery) {
      const q = normalizeSearchText(searchQuery);
      filtered = filtered.filter(u =>
        normalizeSearchText(u.displayName ?? '').includes(q) ||
        normalizeSearchText(u.email ?? '').includes(q) ||
        normalizeSearchText(u.phone ?? '').includes(q)
      );
    }

    if (roleFilter) {
      filtered = filtered.filter(u => {
        const adapted = adaptUser(u);
        return adapted.role === roleFilter;
      });
    }

    if (statusFilter) {
      filtered = filtered.filter(u => {
        const adapted = adaptUser(u);
        return adapted.status === statusFilter;
      });
    }

    return filtered.map(adaptUser);
  }, [users, searchQuery, roleFilter, statusFilter, adaptUser]);

  // Paginated
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredUsers.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredUsers, currentPage]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / ITEMS_PER_PAGE));

  // Handlers
  const handleAddUser = () => {
    setSelectedUser(null);
    setIsAddMode(true);
    setIsDrawerOpen(true);
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setIsAddMode(false);
    setIsDrawerOpen(true);
  };

  const handleDeleteUser = (id: string) => {
    const user = filteredUsers.find(u => u.id === id);
    if (user) {
      setUserToDelete(user);
      setIsDeleteModalOpen(true);
    }
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;
    setIsDeleteModalOpen(false);
    setDeletingUserId(userToDelete.id);

    try {
      await new Promise(resolve => setTimeout(resolve, 400));
      await deleteUsers([userToDelete.id]);
      setUsers(prev => prev.filter(u => u.uid !== userToDelete.id));
      setTotalCount(prev => prev - 1);
      toast.success(ta('User deleted successfully.'));
    } catch (error) {
      toast.error(ta('Unable to delete user.'));
    } finally {
      setDeletingUserId(null);
      setUserToDelete(null);
    }
  };

  const handleApproveUser = async (id: string) => {
    try {
      const result = await updateUser({ uid: id, status: 'approved' });
      if (!result.success) throw new Error(result.error);
      toast.success(ta('User approved successfully.'));
      await fetchUsers();
    } catch (error: any) {
      toast.error(error.message || ta('Unable to approve user.'));
    }
  };

  const handleSuspendUser = async (id: string) => {
    try {
      const result = await updateUser({ uid: id, status: 'suspended' });
      if (!result.success) throw new Error(result.error);
      toast.success(ta('User suspended.'));
      await fetchUsers();
    } catch (error: any) {
      toast.error(error.message || ta('Unable to suspend user.'));
    }
  };

  const handleChangeRole = (user: User) => {
    setSelectedUser(user);
    setIsAddMode(false);
    setIsDrawerOpen(true);
  };

  const handleSaveUser = async (data: User) => {
    try {
      if (isAddMode) {
        const tempPassword = Math.random().toString(36).slice(-8) + 'Ab1!';
        const result = await registerUser({
          email: data.email,
          password: tempPassword,
          displayName: data.name,
          phone: data.phone,
        });
        if (!result.success) throw new Error(result.error);

        // Immediately update with role and status chosen by the admin
        const fbRole = data.role; // Now role is the ID directly
        const fbRoleTemplate = getRoleTemplate(fbRole);
        const fbStatus = data.status === UserStatus.APPROVED ? 'approved'
          : data.status === UserStatus.PENDING ? 'pending'
          : data.status === UserStatus.SUSPENDED ? 'suspended'
          : 'pending';

        const updateResult = await updateUser({
          uid: (result as any).uid,
          displayName: data.name,
          phone: data.phone,
          description: data.description,
          photoURL: data.avatar,
          backgroundImage: data.backgroundImage,
          role: fbRole,
          roleTemplate: fbRoleTemplate,
          status: fbStatus as any,
        });
        if (!updateResult.success) throw new Error(updateResult.error);

        toast.success(ta('User created successfully.'));
        await fetchUsers();
      } else {
        const fbRole = data.role; // Now role is the ID directly
        const fbRoleTemplate = getRoleTemplate(fbRole);
        const fbStatus = data.status === UserStatus.APPROVED ? 'approved'
          : data.status === UserStatus.PENDING ? 'pending'
          : data.status === UserStatus.SUSPENDED ? 'suspended'
          : 'pending';

        const updateResult = await updateUser({
          uid: data.id,
          email: data.email,
          displayName: data.name,
          phone: data.phone,
          description: data.description,
          photoURL: data.avatar,
          backgroundImage: data.backgroundImage,
          role: fbRole,
          roleTemplate: fbRoleTemplate,
          status: fbStatus as any,
        });

        if (!updateResult.success) throw new Error(updateResult.error || ta('Error during update.'));

        if ((data as any).password) {
          const { updatePassword } = await import('@/app/admin/actions');
          const pwResult = await updatePassword({ uid: data.id, password: (data as any).password });
          if (!pwResult.success) throw new Error(pwResult.error || ta('Error updating password.'));
        }

        toast.success(ta('Profile updated successfully.'));
        // Re-fetch from Firestore to ensure data is fresh
        await fetchUsers();
      }
    } catch (error: any) {
      toast.error(error.message || ta('An error occurred.'));
      throw error;
    }
  };

  // Loading skeletons
  if (isLoading && users.length === 0) {
    return (
      <div className="space-y-6">
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
          <Skeleton className="h-12 w-full rounded-xl" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-80 rounded-[2rem]" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight text-slate-900 hidden md:block">{t('admin.manageUsers')}</h1>
      <p className="mt-1 mb-6 text-sm text-slate-500 hidden md:block">
        {t('admin.manageUsersDesc')}
      </p>
      <FiltersBar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        roleFilter={roleFilter}
        setRoleFilter={setRoleFilter}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        onAddUser={handleAddUser}
        viewMode={viewMode}
        setViewMode={setViewMode}
      />

      {filteredUsers.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center py-20">
          <div className="w-24 h-24 bg-gray-50 rounded-[2rem] flex items-center justify-center mb-8 border border-gray-100">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <p className="text-xl font-bold text-gray-900 mb-2">{t('admin.noUsersFound')}</p>
          <p className="text-sm font-medium text-gray-400 max-w-xs">
            {searchQuery ? t('admin.noUsersMatch') : t('admin.noUsersYet')}
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPage}
            initial={{ opacity: 0, x: paginateDirection > 0 ? 50 : paginateDirection < 0 ? -50 : 0 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: paginateDirection > 0 ? -50 : 50 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            {paginatedUsers.map((user) => (
              <UserCard
                key={user.id}
                user={user}
                onEdit={handleEditUser}
                onDelete={handleDeleteUser}
                onApprove={handleApproveUser}
                onSuspend={handleSuspendUser}
                onChangeRole={handleChangeRole}
                isDeleting={deletingUserId === user.id}
              />
            ))}
          </motion.div>
        </AnimatePresence>
      ) : (
        <UserTable
          users={paginatedUsers}
          onEdit={handleEditUser}
          onDelete={handleDeleteUser}
          onApprove={handleApproveUser}
          onSuspend={handleSuspendUser}
          onChangeRole={handleChangeRole}
        />
      )}

      {/* Pagination */}

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={(page) => {
          setPaginateDirection(page > currentPage ? 1 : -1);
          setCurrentPage(page);
        }}
        totalItems={filteredUsers.length}
        itemsPerPage={ITEMS_PER_PAGE}
      />

      {/* Drawer */}
      <UserProfileDrawer
        isOpen={isDrawerOpen}
        onClose={() => { setIsDrawerOpen(false); setSelectedUser(null); setIsAddMode(false); }}
        user={selectedUser}
        onSave={handleSaveUser}
        isAddMode={isAddMode}
        onRoleChanged={fetchUsers}
      />

      {/* Delete Modal */}
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => { setIsDeleteModalOpen(false); setUserToDelete(null); }}
        onConfirm={confirmDeleteUser}
        userName={userToDelete?.name || ''}
      />
    </div>
  );
}
