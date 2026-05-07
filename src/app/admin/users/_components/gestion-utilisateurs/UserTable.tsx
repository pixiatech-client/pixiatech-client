import React from 'react';
import { User } from './types';
import { UserRow } from './UserRow';

interface UserTableProps {
  users: User[];
  onEdit: (user: User) => void;
  onDelete: (id: string) => void;
  onApprove: (id: string) => void;
  onSuspend: (id: string) => void;
  onChangeRole: (user: User) => void;
}

export const UserTable: React.FC<UserTableProps> = ({
  users,
  onEdit,
  onDelete,
  onApprove,
  onSuspend,
  onChangeRole,
}) => {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50/50 border-b border-gray-200">
              <th className="py-4 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">ID</th>
              <th className="py-4 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Utilisateur</th>
              <th className="py-4 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Rôle</th>
              <th className="py-4 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Statut</th>
              <th className="py-4 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Dernier Accès</th>
              <th className="py-4 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Création</th>
              <th className="py-4 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.length > 0 ? (
              users.map((user) => (
                <UserRow
                  key={user.id}
                  user={user}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onApprove={onApprove}
                  onSuspend={onSuspend}
                  onChangeRole={onChangeRole}
                />
              ))
            ) : (
              <tr>
                <td colSpan={7} className="py-12 text-center text-gray-400 italic">
                  Aucun utilisateur trouvé.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
