/**
 * Bakery Articles Page
 * List and manage raw materials (articles) for bakery
 */

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { api, getErrorMessage, type ApiResponse } from '@/lib/api';
import { useLanguage } from '@/contexts/LanguageContext';
import { EmptyState } from '@/components/EmptyState';
import { Pagination } from '@/components/Pagination';
import {
  Plus,
  Search,
  AlertTriangle,
  Edit,
  Trash2,
  ArrowLeft,
} from 'lucide-react';

interface Article {
  id: string;
  reference: string;
  name: string;
  category: string;
  unit: string;
  currentStock: number;
  minStock: number;
  optimalStock: number;
  unitPrice: number;
  currency: string;
  supplierId: string | null;
  supplierName?: string;
  expirationDays: number | null;
  active: boolean;
  createdAt: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  farine: 'Farines',
  levure: 'Levures',
  sel: 'Sels',
  sucre: 'Sucres',
  beurre: 'Matières grasses',
  oeuf: 'Oeufs',
  lait: 'Produits laitiers',
  fruit: 'Fruits',
  chocolat: 'Chocolats',
  additif: 'Additifs',
  emballage: 'Emballages',
  autre: 'Autres',
};

const CATEGORY_COLORS: Record<string, string> = {
  farine: 'bg-amber-100 text-amber-800',
  levure: 'bg-green-100 text-green-800',
  sel: 'bg-gray-100 text-gray-800',
  sucre: 'bg-pink-100 text-pink-800',
  beurre: 'bg-yellow-100 text-yellow-800',
  oeuf: 'bg-orange-100 text-orange-800',
  lait: 'bg-blue-100 text-blue-800',
  fruit: 'bg-red-100 text-red-800',
  chocolat: 'bg-brown-100 text-brown-800',
  additif: 'bg-purple-100 text-purple-800',
  emballage: 'bg-cyan-100 text-cyan-800',
  autre: 'bg-gray-100 text-gray-800',
};

export function BakeryArticlesPage() {
  useLanguage(); // For future translations
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [stockFilter, setStockFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  // Fetch articles
  const { data: articles, isLoading, error } = useQuery({
    queryKey: ['bakery-articles', searchTerm, categoryFilter, stockFilter],
    queryFn: async () => {
      let url = '/bakery/articles';
      const params: string[] = [];

      if (searchTerm) params.push(`search=${encodeURIComponent(searchTerm)}`);
      if (categoryFilter !== 'all') params.push(`category=${encodeURIComponent(categoryFilter)}`);

      if (params.length > 0) url += `?${params.join('&')}`;

      const response = await api.get<ApiResponse<Article[]>>(url);
      return response.data.data || [];
    },
  });

  // Delete mutation
  const deleteArticle = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/bakery/articles/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bakery-articles'] });
    },
    onError: (error) => {
      alert(`Erreur: ${getErrorMessage(error)}`);
    },
  });

  // Filter articles
  const filteredArticles = useMemo(() => {
    if (!articles) return [];

    return articles.filter(article => {
      // Stock filter
      if (stockFilter === 'low' && article.currentStock >= article.minStock) return false;
      if (stockFilter === 'ok' && article.currentStock < article.minStock) return false;

      return true;
    });
  }, [articles, stockFilter]);

  // Pagination
  const paginatedArticles = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return {
      data: filteredArticles.slice(startIndex, endIndex),
      total: filteredArticles.length,
      totalPages: Math.ceil(filteredArticles.length / itemsPerPage),
    };
  }, [filteredArticles, currentPage, itemsPerPage]);

  // Get unique categories
  const categories = useMemo(() => {
    if (!articles) return [];
    return Array.from(new Set(articles.map(a => a.category).filter(Boolean)));
  }, [articles]);

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Êtes-vous sûr de vouloir supprimer "${name}" ?`)) {
      deleteArticle.mutate(id);
    }
  };

  const formatCurrency = (amount: number, currency: string = 'EUR') => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency,
    }).format(amount);
  };

  const getStockStatus = (current: number, min: number, optimal: number) => {
    if (current <= 0) return { label: 'Rupture', color: 'bg-red-100 text-red-800' };
    if (current < min) return { label: 'Bas', color: 'bg-orange-100 text-orange-800' };
    if (current < optimal) return { label: 'OK', color: 'bg-yellow-100 text-yellow-800' };
    return { label: 'Optimal', color: 'bg-green-100 text-green-800' };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            to="/bakery"
            className="p-2 rounded-lg border hover:bg-muted"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Articles</h1>
            <p className="text-muted-foreground">
              Gestion des matières premières
            </p>
          </div>
        </div>
        <Link
          to="/bakery/stock/articles/new"
          className="inline-flex items-center gap-2 rounded-md bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700"
        >
          <Plus className="h-4 w-4" />
          Nouvel Article
        </Link>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-lg border bg-card p-4">
          <div className="text-sm text-muted-foreground">Total Articles</div>
          <div className="mt-1 text-2xl font-bold">{articles?.length ?? 0}</div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="text-sm text-muted-foreground">Stock Bas</div>
          <div className="mt-1 text-2xl font-bold text-orange-600">
            {articles?.filter(a => a.currentStock < a.minStock && a.currentStock > 0).length ?? 0}
          </div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="text-sm text-muted-foreground">Ruptures</div>
          <div className="mt-1 text-2xl font-bold text-red-600">
            {articles?.filter(a => a.currentStock <= 0).length ?? 0}
          </div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="text-sm text-muted-foreground">Stock Optimal</div>
          <div className="mt-1 text-2xl font-bold text-green-600">
            {articles?.filter(a => a.currentStock >= a.optimalStock).length ?? 0}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Rechercher un article..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 rounded-md border border-input bg-background text-sm"
            />
          </div>
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => {
            setCategoryFilter(e.target.value);
            setCurrentPage(1);
          }}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="all">Toutes catégories</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>
              {CATEGORY_LABELS[cat] || cat}
            </option>
          ))}
        </select>
        <select
          value={stockFilter}
          onChange={(e) => {
            setStockFilter(e.target.value);
            setCurrentPage(1);
          }}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="all">Tous les stocks</option>
          <option value="low">Stock bas / Rupture</option>
          <option value="ok">Stock OK</option>
        </select>
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-card">
        {isLoading ? (
          <div className="flex items-center justify-center p-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
          </div>
        ) : error ? (
          <div className="p-12 text-center">
            <p className="text-destructive">Erreur: {getErrorMessage(error)}</p>
          </div>
        ) : paginatedArticles.data.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Référence</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Nom</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Catégorie</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Stock</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Statut</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Prix Unit.</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {paginatedArticles.data.map((article) => {
                    const stockStatus = getStockStatus(article.currentStock, article.minStock, article.optimalStock);
                    return (
                      <tr key={article.id} className="hover:bg-muted/50">
                        <td className="px-4 py-3 font-mono text-sm">{article.reference}</td>
                        <td className="px-4 py-3">
                          <div className="font-medium">{article.name}</div>
                          {article.supplierName && (
                            <div className="text-xs text-muted-foreground">{article.supplierName}</div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${CATEGORY_COLORS[article.category] || 'bg-gray-100 text-gray-800'}`}>
                            {CATEGORY_LABELS[article.category] || article.category}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="font-medium">{article.currentStock}</span>
                          <span className="text-muted-foreground text-xs ml-1">{article.unit}</span>
                          {article.currentStock < article.minStock && (
                            <AlertTriangle className="inline-block ml-2 h-4 w-4 text-orange-500" />
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${stockStatus.color}`}>
                            {stockStatus.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-sm">
                          {formatCurrency(article.unitPrice, article.currency)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => navigate(`/bakery/stock/articles/${article.id}/edit`)}
                              className="p-1 rounded hover:bg-muted"
                              title="Modifier"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(article.id, article.name)}
                              className="p-1 rounded hover:bg-muted text-destructive"
                              title="Supprimer"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <Pagination
              currentPage={currentPage}
              totalPages={paginatedArticles.totalPages}
              totalItems={paginatedArticles.total}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={setItemsPerPage}
            />
          </>
        ) : (
          <EmptyState
            title="Aucun article trouvé"
            description="Commencez par ajouter vos matières premières"
            icon="box"
            action={{
              label: 'Nouvel Article',
              onClick: () => navigate('/bakery/stock/articles/new'),
            }}
          />
        )}
      </div>
    </div>
  );
}
