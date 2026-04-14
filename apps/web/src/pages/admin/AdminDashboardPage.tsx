/**
 * Admin Dashboard Page
 * Platform administration overview and quick stats
 */

import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Users,
  Building2,
  ShieldCheck,
  Crown,
  UserPlus,
  Settings,
} from 'lucide-react';
import { api, type ApiResponse } from '@/lib/api';

interface AdminStats {
  totalUsers: number;
  totalOrganizations: number;
  adminCount: number;
  superAdminCount: number;
}

export function AdminDashboardPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const response = await api.get<ApiResponse<AdminStats>>('/admin/stats');
      return response.data.data;
    },
  });

  const statCards = [
    {
      title: 'Utilisateurs totaux',
      value: stats?.totalUsers || 0,
      icon: Users,
      color: 'bg-blue-500',
      link: '/admin/users',
    },
    {
      title: 'Organisations',
      value: stats?.totalOrganizations || 0,
      icon: Building2,
      color: 'bg-green-500',
      link: '/admin/organizations',
    },
    {
      title: 'Administrateurs',
      value: stats?.adminCount || 0,
      icon: ShieldCheck,
      color: 'bg-purple-500',
      link: '/admin/users?role=admin',
    },
    {
      title: 'Super Admins',
      value: stats?.superAdminCount || 0,
      icon: Crown,
      color: 'bg-amber-500',
      link: '/admin/users?role=super_admin',
    },
  ];

  const quickActions = [
    {
      title: 'Nouvelle organisation',
      description: 'Creer une nouvelle boulangerie ou entreprise',
      icon: Building2,
      link: '/admin/organizations/new',
      color: 'text-green-600',
    },
    {
      title: 'Nouvel utilisateur',
      description: 'Ajouter un utilisateur a la plateforme',
      icon: UserPlus,
      link: '/admin/users/new',
      color: 'text-blue-600',
    },
    {
      title: 'Parametres plateforme',
      description: 'Configurer les parametres globaux',
      icon: Settings,
      link: '/admin/settings',
      color: 'text-gray-600',
    },
  ];

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
            Administration Plateforme
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Gerez les organisations, utilisateurs et parametres de la plateforme
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-full text-sm font-medium">
          <Crown className="h-4 w-4" />
          Super Admin
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <Link
            key={stat.title}
            to={stat.link}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{stat.title}</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                  {stat.value}
                </p>
              </div>
              <div className={`${stat.color} p-3 rounded-lg`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Actions rapides
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {quickActions.map((action) => (
            <Link
              key={action.title}
              to={action.link}
              className="flex items-start gap-4 p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
              <div className={`${action.color}`}>
                <action.icon className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">{action.title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{action.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Organizations */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Organisations recentes
            </h2>
            <Link
              to="/admin/organizations"
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              Voir tout
            </Link>
          </div>
          <RecentOrganizations />
        </div>

        {/* Recent Users */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Utilisateurs recents
            </h2>
            <Link
              to="/admin/users"
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              Voir tout
            </Link>
          </div>
          <RecentUsers />
        </div>
      </div>
    </div>
  );
}

function RecentOrganizations() {
  const { data: orgs, isLoading } = useQuery({
    queryKey: ['admin-recent-orgs'],
    queryFn: async () => {
      const response = await api.get<ApiResponse<any[]>>('/admin/organizations?limit=5');
      return response.data.data;
    },
  });

  if (isLoading) {
    return <div className="animate-pulse h-32 bg-gray-100 dark:bg-gray-700 rounded" />;
  }

  if (!orgs || orgs.length === 0) {
    return (
      <p className="text-gray-500 dark:text-gray-400 text-center py-4">
        Aucune organisation
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {orgs.slice(0, 5).map((org) => (
        <div
          key={org.id}
          className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
              <Building2 className="h-5 w-5 text-gray-500" />
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-white">{org.name}</p>
              <p className="text-sm text-gray-500">{org.memberCount || 0} membres</p>
            </div>
          </div>
          <Link
            to={`/admin/organizations/${org.id}`}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            Gerer
          </Link>
        </div>
      ))}
    </div>
  );
}

function RecentUsers() {
  const { data: users, isLoading } = useQuery({
    queryKey: ['admin-recent-users'],
    queryFn: async () => {
      const response = await api.get<ApiResponse<any[]>>('/admin/users?limit=5');
      return response.data.data;
    },
  });

  if (isLoading) {
    return <div className="animate-pulse h-32 bg-gray-100 dark:bg-gray-700 rounded" />;
  }

  if (!users || users.length === 0) {
    return (
      <p className="text-gray-500 dark:text-gray-400 text-center py-4">
        Aucun utilisateur
      </p>
    );
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'super_admin':
        return (
          <span className="px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 rounded-full">
            Super Admin
          </span>
        );
      case 'admin':
        return (
          <span className="px-2 py-0.5 text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 rounded-full">
            Admin
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 rounded-full">
            Utilisateur
          </span>
        );
    }
  };

  return (
    <div className="space-y-3">
      {users.slice(0, 5).map((user) => (
        <div
          key={user.id}
          className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0"
        >
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
          {getRoleBadge(user.platformRole)}
        </div>
      ))}
    </div>
  );
}

export default AdminDashboardPage;
