/**
 * Organizations Management Page
 * List, create, edit and delete organizations
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Building2,
  Plus,
  Search,
  Users,
  Trash2,
  Edit,
  MoreVertical,
  Store,
  Stethoscope,
  Factory,
  ShoppingBag,
} from 'lucide-react';
import { api, type ApiResponse } from '@/lib/api';

interface Organization {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  settings?: {
    industry?: string;
    modules?: Record<string, boolean>;
  };
  memberCount: number;
  createdAt: string;
}

export function OrganizationsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null);

  const { data: organizations, isLoading } = useQuery({
    queryKey: ['admin-organizations'],
    queryFn: async () => {
      const response = await api.get<ApiResponse<Organization[]>>('/admin/organizations');
      return response.data.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (orgId: string) => {
      await api.delete(`/admin/organizations/${orgId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-organizations'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
    },
  });

  const filteredOrgs = organizations?.filter(
    (org) =>
      org.name.toLowerCase().includes(search.toLowerCase()) ||
      org.slug.toLowerCase().includes(search.toLowerCase())
  );

  const getIndustryIcon = (industry?: string) => {
    switch (industry) {
      case 'bakery':
        return <Store className="h-5 w-5" />;
      case 'healthcare':
        return <Stethoscope className="h-5 w-5" />;
      case 'manufacturing':
        return <Factory className="h-5 w-5" />;
      case 'retail':
        return <ShoppingBag className="h-5 w-5" />;
      default:
        return <Building2 className="h-5 w-5" />;
    }
  };

  const getIndustryLabel = (industry?: string) => {
    switch (industry) {
      case 'bakery':
        return 'Boulangerie';
      case 'healthcare':
        return 'Sante';
      case 'manufacturing':
        return 'Industrie';
      case 'retail':
        return 'Commerce';
      case 'services':
        return 'Services';
      default:
        return 'Autre';
    }
  };

  const handleDelete = async (org: Organization) => {
    if (window.confirm(`Supprimer l'organisation "${org.name}" ? Cette action est irreversible.`)) {
      await deleteMutation.mutateAsync(org.id);
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
            Gestion des Organisations
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            {organizations?.length || 0} organisation(s) sur la plateforme
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Nouvelle organisation
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder="Rechercher une organisation..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Organizations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredOrgs?.map((org) => (
          <div
            key={org.id}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-xl flex items-center justify-center text-gray-500">
                  {getIndustryIcon(org.settings?.industry)}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{org.name}</h3>
                  <p className="text-sm text-gray-500">/{org.slug}</p>
                </div>
              </div>
              <div className="relative group">
                <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                  <MoreVertical className="h-5 w-5 text-gray-400" />
                </button>
                <div className="absolute right-0 mt-1 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 hidden group-hover:block z-10">
                  <button
                    onClick={() => setEditingOrg(org)}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <Edit className="h-4 w-4" />
                    Modifier
                  </button>
                  <button
                    onClick={() => handleDelete(org)}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <Trash2 className="h-4 w-4" />
                    Supprimer
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span>{org.memberCount} membres</span>
              </div>
              <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded-full text-xs">
                {getIndustryLabel(org.settings?.industry)}
              </span>
            </div>

            {/* Modules */}
            {org.settings?.modules && (
              <div className="mt-3 flex flex-wrap gap-1">
                {Object.entries(org.settings.modules)
                  .filter(([, enabled]) => enabled)
                  .slice(0, 4)
                  .map(([module]) => (
                    <span
                      key={module}
                      className="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded text-xs"
                    >
                      {module}
                    </span>
                  ))}
                {Object.values(org.settings.modules).filter(Boolean).length > 4 && (
                  <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-500 rounded text-xs">
                    +{Object.values(org.settings.modules).filter(Boolean).length - 4}
                  </span>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {filteredOrgs?.length === 0 && (
        <div className="text-center py-12">
          <Building2 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Aucune organisation trouvee
          </h3>
          <p className="text-gray-500">
            {search ? 'Essayez une autre recherche' : 'Creez votre premiere organisation'}
          </p>
        </div>
      )}

      {/* Create/Edit Modal */}
      {(showCreateModal || editingOrg) && (
        <OrganizationModal
          organization={editingOrg}
          onClose={() => {
            setShowCreateModal(false);
            setEditingOrg(null);
          }}
        />
      )}
    </div>
  );
}

interface OrganizationModalProps {
  organization?: Organization | null;
  onClose: () => void;
}

function OrganizationModal({ organization, onClose }: OrganizationModalProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: organization?.name || '',
    slug: organization?.slug || '',
    industry: organization?.settings?.industry || 'bakery',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (organization) {
        await api.put(`/admin/organizations/${organization.id}`, {
          name: formData.name,
          settings: { industry: formData.industry },
        });
      } else {
        await api.post('/admin/organizations', formData);
      }
      queryClient.invalidateQueries({ queryKey: ['admin-organizations'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      onClose();
    } catch (error) {
      console.error('Failed to save organization:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md mx-4">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {organization ? 'Modifier l\'organisation' : 'Nouvelle organisation'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nom de l'organisation
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => {
                setFormData({
                  ...formData,
                  name: e.target.value,
                  slug: organization ? formData.slug : generateSlug(e.target.value),
                });
              }}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Identifiant (slug)
            </label>
            <input
              type="text"
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              required
              disabled={!!organization}
              pattern="[a-z0-9-]+"
            />
            <p className="text-xs text-gray-500 mt-1">Lettres minuscules, chiffres et tirets uniquement</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Type d'activite
            </label>
            <select
              value={formData.industry}
              onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="bakery">Boulangerie / Patisserie</option>
              <option value="healthcare">Sante / Medical</option>
              <option value="retail">Commerce / Retail</option>
              <option value="manufacturing">Industrie / Production</option>
              <option value="services">Services</option>
              <option value="other">Autre</option>
            </select>
          </div>

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
              {isSubmitting ? 'Enregistrement...' : organization ? 'Modifier' : 'Creer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default OrganizationsPage;
