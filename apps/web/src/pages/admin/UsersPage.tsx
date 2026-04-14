/**
 * Users Management Page
 * List, create, edit and manage platform users
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Users,
  Plus,
  Search,
  Crown,
  ShieldCheck,
  User,
  Edit,
  Trash2,
  ArrowUpCircle,
  ArrowDownCircle,
  Building2,
  Check,
  X,
} from 'lucide-react';
import { api, type ApiResponse } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';

interface AdminUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  platformRole: 'super_admin' | 'admin' | 'user';
  active: boolean;
  emailVerified: boolean;
  createdAt: string;
  lastLoginAt?: string;
  organizations?: Array<{
    organizationId: string;
    role: string;
    orgName: string;
  }>;
}

export function UsersPage() {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);

  const isSuperAdmin = currentUser?.platformRole === 'super_admin';

  const { data: users, isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const response = await api.get<ApiResponse<AdminUser[]>>('/admin/users');
      return response.data.data;
    },
  });

  const promoteMutation = useMutation({
    mutationFn: async (userId: string) => {
      await api.post('/admin/promote', { userId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
    },
  });

  const demoteMutation = useMutation({
    mutationFn: async (userId: string) => {
      await api.post('/admin/demote', { userId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (userId: string) => {
      await api.delete(`/admin/users/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
    },
  });

  const filteredUsers = users?.filter((user) => {
    const matchesSearch =
      user.email.toLowerCase().includes(search.toLowerCase()) ||
      (user.firstName?.toLowerCase() || '').includes(search.toLowerCase()) ||
      (user.lastName?.toLowerCase() || '').includes(search.toLowerCase());

    const matchesRole = roleFilter === 'all' || user.platformRole === roleFilter;

    return matchesSearch && matchesRole;
  });

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'super_admin':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 rounded-full">
            <Crown className="h-3 w-3" />
            Super Admin
          </span>
        );
      case 'admin':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 rounded-full">
            <ShieldCheck className="h-3 w-3" />
            Admin
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 rounded-full">
            <User className="h-3 w-3" />
            Utilisateur
          </span>
        );
    }
  };

  const handlePromote = async (user: AdminUser) => {
    if (window.confirm(`Promouvoir ${user.email} en administrateur ?`)) {
      await promoteMutation.mutateAsync(user.id);
    }
  };

  const handleDemote = async (user: AdminUser) => {
    if (window.confirm(`Revoquer les droits admin de ${user.email} ?`)) {
      await demoteMutation.mutateAsync(user.id);
    }
  };

  const handleDelete = async (user: AdminUser) => {
    if (window.confirm(`Desactiver l'utilisateur ${user.email} ?`)) {
      await deleteMutation.mutateAsync(user.id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Gestion des Utilisateurs
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            {users?.length || 0} utilisateur(s) sur la plateforme
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Nouvel utilisateur
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher un utilisateur..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        >
          <option value="all">Tous les roles</option>
          <option value="super_admin">Super Admins</option>
          <option value="admin">Admins</option>
          <option value="user">Utilisateurs</option>
        </select>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Utilisateur
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Organisations
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredUsers?.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                          {(user.firstName?.[0] || '') + (user.lastName?.[0] || user.email[0].toUpperCase())}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {user.firstName} {user.lastName}
                        </p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getRoleBadge(user.platformRole)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {user.organizations && user.organizations.length > 0 ? (
                      <div className="flex items-center gap-1">
                        <Building2 className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-600 dark:text-gray-300">
                          {user.organizations.length} org.
                        </span>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">Aucune</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {user.active ? (
                      <span className="inline-flex items-center gap-1 text-sm text-green-600">
                        <Check className="h-4 w-4" />
                        Actif
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-sm text-red-600">
                        <X className="h-4 w-4" />
                        Inactif
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-2">
                      {isSuperAdmin && user.platformRole === 'user' && (
                        <button
                          onClick={() => handlePromote(user)}
                          className="p-1 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded"
                          title="Promouvoir en admin"
                        >
                          <ArrowUpCircle className="h-5 w-5" />
                        </button>
                      )}
                      {isSuperAdmin && user.platformRole === 'admin' && (
                        <button
                          onClick={() => handleDemote(user)}
                          className="p-1 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded"
                          title="Revoquer admin"
                        >
                          <ArrowDownCircle className="h-5 w-5" />
                        </button>
                      )}
                      <button
                        onClick={() => setEditingUser(user)}
                        className="p-1 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                        title="Modifier"
                      >
                        <Edit className="h-5 w-5" />
                      </button>
                      {isSuperAdmin && user.platformRole !== 'super_admin' && user.id !== currentUser?.id && (
                        <button
                          onClick={() => handleDelete(user)}
                          className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                          title="Desactiver"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredUsers?.length === 0 && (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Aucun utilisateur trouve
            </h3>
            <p className="text-gray-500">
              {search || roleFilter !== 'all' ? 'Essayez d\'autres filtres' : 'Creez votre premier utilisateur'}
            </p>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {(showCreateModal || editingUser) && (
        <UserModal
          user={editingUser}
          onClose={() => {
            setShowCreateModal(false);
            setEditingUser(null);
          }}
        />
      )}
    </div>
  );
}

interface UserModalProps {
  user?: AdminUser | null;
  onClose: () => void;
}

function UserModal({ user, onClose }: UserModalProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    email: user?.email || '',
    password: '',
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    platformRole: user?.platformRole || 'user',
    active: user?.active ?? true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (user) {
        await api.put(`/admin/users/${user.id}`, {
          firstName: formData.firstName,
          lastName: formData.lastName,
          active: formData.active,
        });
      } else {
        await api.post('/admin/users', formData);
      }
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      onClose();
    } catch (error) {
      console.error('Failed to save user:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md mx-4">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {user ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {!user && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Mot de passe
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                  minLength={8}
                />
              </div>
            </>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Prenom
              </label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nom
              </label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
              />
            </div>
          </div>

          {user && (
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="active"
                checked={formData.active}
                onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="active" className="text-sm text-gray-700 dark:text-gray-300">
                Compte actif
              </label>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {isSubmitting ? 'Enregistrement...' : user ? 'Modifier' : 'Creer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default UsersPage;
