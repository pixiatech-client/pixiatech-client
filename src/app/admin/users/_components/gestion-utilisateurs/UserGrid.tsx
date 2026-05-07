import React from 'react';
import { AnimatePresence } from 'framer-motion';
import { User } from './types';
import { UserCard } from './UserCard';

interface UserGridProps {
  users: User[];
  onEdit: (user: User) => void;
  onDelete: (id: string) => void;
  onApprove: (id: string) => void;
  onSuspend: (id: string) => void;
  onChangeRole: (user: User) => void;
  deletingUserId?: string | null;
  onDirectDelete?: (id: string) => void;
}

export const UserGrid: React.FC<UserGridProps> = ({
  users,
  onEdit,
  onDelete,
  onApprove,
  onSuspend,
  onChangeRole,
  deletingUserId,
  onDirectDelete,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
      <AnimatePresence mode="popLayout">
        {users.length > 0 ? (
          users.map((user) => (
            <UserCard
              key={user.id}
              user={user}
              onEdit={onEdit}
              onDelete={onDirectDelete || onDelete}
              onApprove={onApprove}
              onSuspend={onSuspend}
              onChangeRole={onChangeRole}
              isDeleting={deletingUserId === user.id}
            />
          ))
        ) : (
          <div className="col-span-full py-20 text-center text-gray-400 italic bg-white rounded-3xl border border-dashed border-gray-200">
            Aucun utilisateur trouvé.
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
