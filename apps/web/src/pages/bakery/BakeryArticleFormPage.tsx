/**
 * Bakery Article Form Page
 * Create or edit a raw material article
 */

import { useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { api, getErrorMessage, type ApiResponse } from '@/lib/api';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';

interface ArticleForm {
  reference: string;
  name: string;
  category: string;
  unit: string;
  currentStock: number;
  minStock: number;
  optimalStock: number;
  unitPrice: number;
  currency: string;
  supplierId: string;
  expirationDays: number | null;
  notes: string;
  active: boolean;
}

interface Supplier {
  id: string;
  name: string;
}

const CATEGORIES = [
  { value: 'farine', label: 'Farines' },
  { value: 'levure', label: 'Levures' },
  { value: 'sel', label: 'Sels' },
  { value: 'sucre', label: 'Sucres' },
  { value: 'beurre', label: 'Matières grasses' },
  { value: 'oeuf', label: 'Oeufs' },
  { value: 'lait', label: 'Produits laitiers' },
  { value: 'fruit', label: 'Fruits' },
  { value: 'chocolat', label: 'Chocolats' },
  { value: 'additif', label: 'Additifs' },
  { value: 'emballage', label: 'Emballages' },
  { value: 'autre', label: 'Autres' },
];

const UNITS = [
  { value: 'kg', label: 'Kilogrammes (kg)' },
  { value: 'g', label: 'Grammes (g)' },
  { value: 'l', label: 'Litres (l)' },
  { value: 'ml', label: 'Millilitres (ml)' },
  { value: 'unit', label: 'Unités' },
  { value: 'pack', label: 'Packs' },
  { value: 'box', label: 'Cartons' },
];

export function BakeryArticleFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const queryClient = useQueryClient();
  const isEdit = Boolean(id);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<ArticleForm>({
    defaultValues: {
      reference: '',
      name: '',
      category: 'farine',
      unit: 'kg',
      currentStock: 0,
      minStock: 0,
      optimalStock: 0,
      unitPrice: 0,
      currency: 'EUR',
      supplierId: '',
      expirationDays: null,
      notes: '',
      active: true,
    },
  });

  // Fetch article if editing
  const { data: article, isLoading: loadingArticle } = useQuery({
    queryKey: ['bakery-article', id],
    queryFn: async () => {
      const response = await api.get<ApiResponse<ArticleForm>>(`/bakery/articles/${id}`);
      return response.data.data;
    },
    enabled: isEdit,
  });

  // Fetch suppliers
  const { data: suppliers } = useQuery({
    queryKey: ['suppliers-list'],
    queryFn: async () => {
      const response = await api.get<ApiResponse<Supplier[]>>('/procurement/suppliers?active=true');
      return response.data.data || [];
    },
  });

  // Reset form when article loads
  useEffect(() => {
    if (article) {
      reset(article);
    }
  }, [article, reset]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async (data: ArticleForm) => {
      if (isEdit) {
        await api.put(`/bakery/articles/${id}`, data);
      } else {
        await api.post('/bakery/articles', data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bakery-articles'] });
      navigate('/bakery/stock/articles');
    },
    onError: (error) => {
      alert(`Erreur: ${getErrorMessage(error)}`);
    },
  });

  const onSubmit = (data: ArticleForm) => {
    saveMutation.mutate(data);
  };

  if (isEdit && loadingArticle) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          to="/bakery/stock/articles"
          className="p-2 rounded-lg border hover:bg-muted"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {isEdit ? 'Modifier l\'article' : 'Nouvel Article'}
          </h1>
          <p className="text-muted-foreground">
            {isEdit ? 'Mettre à jour les informations de l\'article' : 'Ajouter une nouvelle matière première'}
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="rounded-lg border bg-card p-6 space-y-4">
          <h2 className="font-semibold">Informations Générales</h2>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium">Référence *</label>
              <input
                {...register('reference', { required: 'Référence requise' })}
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="ex: FAR-001"
              />
              {errors.reference && (
                <p className="mt-1 text-xs text-destructive">{errors.reference.message}</p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium">Nom *</label>
              <input
                {...register('name', { required: 'Nom requis' })}
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="ex: Farine T55"
              />
              {errors.name && (
                <p className="mt-1 text-xs text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium">Catégorie *</label>
              <select
                {...register('category', { required: true })}
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {CATEGORIES.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium">Unité *</label>
              <select
                {...register('unit', { required: true })}
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {UNITS.map(unit => (
                  <option key={unit.value} value={unit.value}>{unit.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-card p-6 space-y-4">
          <h2 className="font-semibold">Stock & Prix</h2>

          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="text-sm font-medium">Stock Actuel</label>
              <input
                type="number"
                step="0.01"
                {...register('currentStock', { valueAsNumber: true })}
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Stock Minimum</label>
              <input
                type="number"
                step="0.01"
                {...register('minStock', { valueAsNumber: true })}
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
              <p className="mt-1 text-xs text-muted-foreground">Seuil d'alerte</p>
            </div>

            <div>
              <label className="text-sm font-medium">Stock Optimal</label>
              <input
                type="number"
                step="0.01"
                {...register('optimalStock', { valueAsNumber: true })}
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
              <p className="mt-1 text-xs text-muted-foreground">Objectif de stock</p>
            </div>

            <div>
              <label className="text-sm font-medium">Prix Unitaire</label>
              <input
                type="number"
                step="0.01"
                {...register('unitPrice', { valueAsNumber: true })}
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Devise</label>
              <select
                {...register('currency')}
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="EUR">EUR (€)</option>
                <option value="TND">TND (DT)</option>
                <option value="USD">USD ($)</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium">Durée de péremption (jours)</label>
              <input
                type="number"
                {...register('expirationDays', { valueAsNumber: true })}
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="ex: 30"
              />
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-card p-6 space-y-4">
          <h2 className="font-semibold">Fournisseur & Notes</h2>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium">Fournisseur</label>
              <select
                {...register('supplierId')}
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Aucun fournisseur</option>
                {suppliers?.map(supplier => (
                  <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 pt-6">
              <input
                type="checkbox"
                id="active"
                {...register('active')}
                className="rounded border-input"
              />
              <label htmlFor="active" className="text-sm font-medium">
                Article actif
              </label>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Notes</label>
            <textarea
              {...register('notes')}
              rows={3}
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              placeholder="Notes internes..."
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <Link
            to="/bakery/stock/articles"
            className="rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            Annuler
          </Link>
          <button
            type="submit"
            disabled={isSubmitting || saveMutation.isPending}
            className="inline-flex items-center gap-2 rounded-md bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50"
          >
            {(isSubmitting || saveMutation.isPending) ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {isEdit ? 'Mettre à jour' : 'Créer l\'article'}
          </button>
        </div>
      </form>
    </div>
  );
}
