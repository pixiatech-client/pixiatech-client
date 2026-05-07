'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import type { UserProfile, UserRole } from '@/lib/types';
import { Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Pagination } from '@/components/ui/Pagination';
import { motion, AnimatePresence } from 'framer-motion';
import { updateUser, deleteUsers, registerUser, getUsers } from '@/app/admin/actions';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore, useAuth, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { FiltersBar } from './filters-bar';
import { UserCard, type AdaptedUser } from './user-card';
import { UserRow } from './user-row';
import { DeleteConfirmationModal } from './delete-confirmation-modal';
import { UserProfileDrawer } from './user-profile-drawer';

const ITEMS_PER_PAGE = 8;

export function UserManager() {
  const { userProfile, isUserLoading } = useUser();
  const { toast } = useToast();
  const firestore = useFirestore();
  const auth = useAuth();

  // State
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [lastVisibleId, setLastVisibleId] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);

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
  const [selectedUser, setSelectedUser] = useState<AdaptedUser | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<AdaptedUser | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);

  // Roles
  const rolesQuery = useMemoFirebase(
    () => (firestore && auth.currentUser && !isUserLoading)
      ? query(collection(firestore, 'roles'), orderBy('name'))
      : null,
    [firestore, auth.currentUser, isUserLoading]
  );
  const { data: roles } = useCollection<UserRole>(rolesQuery, { suppressPermissionError: true });

  const isAdmin = userProfile?.role === 'admin';

  // Build role options for filters
  const roleOptions: { value: string; label: string; color?: string }[] = useMemo(() => {
    const options: { value: string; label: string; color?: string }[] = [{ value: '', label: 'Tous les Rôles' }];
    if (roles) {
      roles.forEach(r => {
        options.push({
          value: r.id,
          label: r.name,
          color: r.color || '#6b7280',
        });
      });
    }
    return options;
  }, [roles]);

  // Fetch users
  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await getUsers({ limit: ITEMS_PER_PAGE });
      setUsers(result.users);
      setTotalCount(result.totalCount);
      setLastVisibleId(result.lastId);
      setHasMore(result.users.length === ITEMS_PER_PAGE);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de charger les utilisateurs.' });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Adapt UserProfile to AdaptedUser
  const adaptUser = (profile: UserProfile): AdaptedUser => {
    const roleObj = roles?.find(r => r.id === profile.role);
    return {
      uid: profile.uid,
      displayName: profile.displayName,
      email: profile.email,
      phone: profile.phone,
      photoURL: profile.photoURL,
      role: profile.role,
      roleName: roleObj?.name || profile.role,
      roleColor: roleObj?.color,
      status: profile.status,
      createdAt: typeof profile.createdAt === 'string'
        ? profile.createdAt
        : profile.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
    };
  };

  // Filtered users (client-side for search)
  const filteredUsers = useMemo(() => {
    let filtered = users;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(u =>
        u.displayName?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.phone?.toLowerCase().includes(q)
      );
    }

    if (roleFilter) {
      filtered = filtered.filter(u => u.role === roleFilter);
    }

    if (statusFilter) {
      filtered = filtered.filter(u => u.status === statusFilter);
    }

    return filtered.map(adaptUser);
  }, [users, searchQuery, roleFilter, statusFilter, roles]);

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

  const handleEditUser = (user: AdaptedUser) => {
    setSelectedUser(user);
    setIsAddMode(false);
    setIsDrawerOpen(true);
  };

  const handleDeleteUser = (uid: string) => {
    const user = filteredUsers.find(u => u.uid === uid);
    if (user) {
      setUserToDelete(user);
      setIsDeleteModalOpen(true);
    }
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;
    setIsDeleteModalOpen(false);
    setDeletingUserId(userToDelete.uid);

    try {
      await new Promise(resolve => setTimeout(resolve, 400));
      await deleteUsers([userToDelete.uid]);
      setUsers(prev => prev.filter(u => u.uid !== userToDelete.uid));
      setTotalCount(prev => prev - 1);
      toast({ title: 'Succès', description: 'Utilisateur supprimé avec succès.' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de supprimer l\'utilisateur.' });
    } finally {
      setDeletingUserId(null);
      setUserToDelete(null);
    }
  };

  const handleSaveUser = async (data: any) => {
    try {
      if (isAddMode) {
        const result = await registerUser({
          email: data.email,
          password: data.password,
          displayName: data.displayName,
          phone: data.phone,
        });
        if (!result.success) throw new Error(result.error);
        toast({ title: 'Succès', description: 'Utilisateur créé avec succès.' });
        await fetchUsers();
      } else {
        await updateUser({
          uid: data.uid,
          displayName: data.displayName,
          phone: data.phone,
          photoURL: data.photoURL,
          role: data.role,
          status: data.status,
        });
        if (data.password) {
          const { updatePassword } = await import('@/app/admin/actions');
          await updatePassword({ uid: data.uid, password: data.password });
        }
        setUsers(prev => prev.map(u => u.uid === data.uid ? { ...u, ...data } : u));
        toast({ title: 'Succès', description: 'Profil mis à jour avec succès.' });
      }
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Erreur', description: error.message || 'Une erreur est survenue.' });
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
        isAdmin={isAdmin}
        roleOptions={roleOptions}
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
          <p className="text-xl font-bold text-gray-900 mb-2">Aucun utilisateur trouvé</p>
          <p className="text-sm font-medium text-gray-400 max-w-xs">
            {searchQuery ? 'Aucun résultat pour votre recherche.' : 'Aucun utilisateur enregistré pour le moment.'}
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
                key={user.uid}
                user={user}
                onEdit={handleEditUser}
                onDelete={handleDeleteUser}
                isDeleting={deletingUserId === user.uid}
                isAdmin={isAdmin}
              />
            ))}
          </motion.div>
        </AnimatePresence>
      ) : (
        <div className="bg-white rounded-[2rem] border border-gray-200 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-4 px-4 text-[10px] font-medium text-gray-400 uppercase tracking-widest">Utilisateur</th>
                <th className="text-left py-4 px-4 text-[10px] font-medium text-gray-400 uppercase tracking-widest">Rôle</th>
                <th className="text-left py-4 px-4 text-[10px] font-medium text-gray-400 uppercase tracking-widest">Statut</th>
                <th className="text-left py-4 px-4 text-[10px] font-medium text-gray-400 uppercase tracking-widest">Téléphone</th>
                <th className="text-right py-4 px-4 text-[10px] font-medium text-gray-400 uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence mode="wait">
                <motion.tr key="spacer" className="hidden" />
              </AnimatePresence>
              {paginatedUsers.map((user) => (
                <UserRow
                  key={user.uid}
                  user={user}
                  onEdit={handleEditUser}
                  onDelete={handleDeleteUser}
                  isAdmin={isAdmin}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}


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
        roles={roles || []}
        isAdmin={isAdmin}
      />

      {/* Delete Modal */}
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => { setIsDeleteModalOpen(false); setUserToDelete(null); }}
        onConfirm={confirmDeleteUser}
        userName={userToDelete?.displayName || ''}
      />
    </div>
  );
}
