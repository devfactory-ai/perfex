/**
 * Modules Settings Page
 * Manage which modules are enabled for the organization
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Settings,
  Package,
  Factory,
  ChefHat,
  ScanLine,
  Store,
  ClipboardCheck,
  Wrench,
  CalendarClock,
  Sparkles,
  Shield,
  Banknote,
  BarChart3,
  Loader2,
  AlertTriangle,
  Info,
  Check,
} from 'lucide-react';
import { IndustrySelector } from '@/components/IndustrySelector';
import { industryPresets, type IndustryPreset } from '@/config/industryPresets';

interface Module {
  id: string;
  name: string;
  description: string | null;
  category: 'core' | 'industry' | 'advanced';
  icon: string;
  isDefault: boolean;
  sortOrder: number;
  enabled: boolean;
  settings: Record<string, unknown> | null;
  dependencies: string[] | null;
}

const ICON_MAP: Record<string, typeof Settings> = {
  LayoutDashboard: Settings,
  DollarSign: Settings,
  Users: Settings,
  Package: Package,
  Briefcase: Settings,
  ShoppingCart: Settings,
  TrendingUp: Settings,
  FolderKanban: Settings,
  Building2: Settings,
  Workflow: Settings,
  HelpCircle: Settings,
  Factory: Factory,
  ChefHat: ChefHat,
  ScanLine: ScanLine,
  Store: Store,
  ClipboardCheck: ClipboardCheck,
  Wrench: Wrench,
  CalendarClock: CalendarClock,
  Sparkles: Sparkles,
  Shield: Shield,
  Banknote: Banknote,
  BarChart3: BarChart3,
};

const CATEGORY_LABELS: Record<string, string> = {
  core: 'Modules de Base',
  industry: 'Modules Metier',
  advanced: 'Modules Avances',
};

const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  core: 'Fonctionnalites essentielles de l\'ERP, activees par defaut.',
  industry: 'Modules specialises pour boulangeries, usines et industries alimentaires.',
  advanced: 'Fonctionnalites avancees comme l\'IA et l\'audit automatise.',
};

export function ModulesSettingsPage() {
  const queryClient = useQueryClient();
  const [pendingChanges, setPendingChanges] = useState<Map<string, boolean>>(new Map());
  const [currentPreset, setCurrentPreset] = useState<string | undefined>(() => {
    return localStorage.getItem('industryPreset') || undefined;
  });
  const [showSuccess, setShowSuccess] = useState(false);

  // For now, use a mock organization ID - in production this would come from context
  const organizationId = 'default-org';
  const token = localStorage.getItem('accessToken');

  // Fetch modules
  const { data: modules, isLoading, error, refetch } = useQuery({
    queryKey: ['modules', organizationId],
    queryFn: async () => {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/modules/organization/${organizationId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch modules');
      }

      return response.json() as Promise<Module[]>;
    },
  });

  // Update module mutation
  const updateModule = useMutation({
    mutationFn: async ({ moduleId, enabled }: { moduleId: string; enabled: boolean }) => {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/modules/organization/${organizationId}/${moduleId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ enabled }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to update module');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modules'] });
      queryClient.invalidateQueries({ queryKey: ['enabledModules'] });
    },
  });

  // Apply preset - enable/disable modules based on preset
  const applyPreset = async (preset: IndustryPreset) => {
    if (!modules) return;

    const presetModules = new Set(preset.modules);

    // Update each module's enabled status
    const updates = modules.map(async (mod) => {
      const shouldBeEnabled = presetModules.has(mod.id);
      if (mod.enabled !== shouldBeEnabled) {
        return updateModule.mutateAsync({ moduleId: mod.id, enabled: shouldBeEnabled });
      }
      return Promise.resolve();
    });

    await Promise.all(updates);

    // Save preset to localStorage
    localStorage.setItem('industryPreset', preset.id);
    setCurrentPreset(preset.id);

    // Show success message
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);

    // Refetch modules
    await refetch();
  };

  // Handle toggle
  const handleToggle = async (moduleId: string, currentEnabled: boolean) => {
    const newEnabled = !currentEnabled;
    setPendingChanges(prev => new Map(prev).set(moduleId, newEnabled));

    // When manually toggling, switch to custom preset
    localStorage.setItem('industryPreset', 'custom');
    setCurrentPreset('custom');

    try {
      await updateModule.mutateAsync({ moduleId, enabled: newEnabled });
    } finally {
      setPendingChanges(prev => {
        const next = new Map(prev);
        next.delete(moduleId);
        return next;
      });
    }
  };

  // Group modules by category
  const modulesByCategory = modules?.reduce((acc, mod) => {
    if (!acc[mod.category]) {
      acc[mod.category] = [];
    }
    acc[mod.category].push(mod);
    return acc;
  }, {} as Record<string, Module[]>) || {};

  const getIcon = (iconName: string) => {
    return ICON_MAP[iconName] || Settings;
  };

  // Count enabled modules
  const enabledCount = modules?.filter(m => m.enabled).length || 0;
  const totalCount = modules?.length || 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 flex items-start">
          <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
          <div>
            <h3 className="font-medium text-red-800 dark:text-red-200">
              Erreur de chargement
            </h3>
            <p className="mt-1 text-sm text-red-700 dark:text-red-300">
              Impossible de charger les modules. Veuillez reessayer.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header with stats */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">
            Gestion des Modules
          </h1>
          <p className="mt-1 text-muted-foreground">
            Configurez les modules actifs selon votre type d'activite
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="px-4 py-2 bg-primary/10 rounded-lg">
            <span className="text-2xl font-bold text-primary">{enabledCount}</span>
            <span className="text-sm text-muted-foreground ml-1">/ {totalCount} modules actifs</span>
          </div>
        </div>
      </div>

      {/* Success Message */}
      {showSuccess && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 flex items-center gap-3">
          <Check className="h-5 w-5 text-green-600" />
          <span className="text-green-800 dark:text-green-200 font-medium">
            Configuration appliquee avec succes ! Les modules ont ete mis a jour.
          </span>
        </div>
      )}

      {/* Industry Preset Selector */}
      <div className="bg-card rounded-xl border p-6">
        <IndustrySelector
          currentPreset={currentPreset}
          onSelectPreset={applyPreset}
          isLoading={updateModule.isPending}
        />
      </div>

      {/* Current Preset Info */}
      {currentPreset && currentPreset !== 'custom' && (
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 flex items-start gap-3">
          <Info className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-medium text-primary">
              Configuration active : {industryPresets.find(p => p.id === currentPreset)?.name}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Vous pouvez ajuster les modules individuellement ci-dessous. Cela passera en mode "Configuration Personnalisee".
            </p>
          </div>
        </div>
      )}

      {/* Manual Module Toggle Section */}
      <div className="space-y-2">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Configuration Manuelle des Modules
        </h2>
        <p className="text-sm text-muted-foreground">
          Activez ou desactivez individuellement chaque module selon vos besoins specifiques.
        </p>
      </div>

      {/* Modules by Category */}
      {(['core', 'industry', 'advanced'] as const).map((category) => {
        const categoryModules = modulesByCategory[category] || [];
        if (categoryModules.length === 0) return null;

        const enabledInCategory = categoryModules.filter(m => m.enabled).length;

        return (
          <div key={category} className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">
                  {CATEGORY_LABELS[category]}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {CATEGORY_DESCRIPTIONS[category]}
                </p>
              </div>
              <span className="text-sm text-muted-foreground">
                {enabledInCategory}/{categoryModules.length} actifs
              </span>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {categoryModules.map((mod) => {
                const Icon = getIcon(mod.icon);
                const isUpdating = pendingChanges.has(mod.id);
                const displayEnabled = pendingChanges.has(mod.id)
                  ? pendingChanges.get(mod.id)
                  : mod.enabled;

                return (
                  <div
                    key={mod.id}
                    className={`bg-card rounded-lg shadow-sm p-4 border-2 transition-all ${
                      displayEnabled
                        ? 'border-green-500 bg-green-50/50 dark:bg-green-900/10'
                        : 'border-transparent'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <div
                          className={`p-2 rounded-lg ${
                            displayEnabled
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                              : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium">
                            {mod.name}
                          </h3>
                          {mod.description && (
                            <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                              {mod.description}
                            </p>
                          )}
                          {mod.isDefault && (
                            <span className="inline-flex items-center mt-2 px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                              Par defaut
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Toggle Button */}
                      <button
                        onClick={() => handleToggle(mod.id, mod.enabled)}
                        disabled={isUpdating}
                        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                          displayEnabled ? 'bg-green-500' : 'bg-muted'
                        } ${isUpdating ? 'opacity-50' : ''}`}
                      >
                        <span className="sr-only">
                          {displayEnabled ? 'Desactiver' : 'Activer'} {mod.name}
                        </span>
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            displayEnabled ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        >
                          {isUpdating && (
                            <Loader2 className="h-3 w-3 m-1 animate-spin text-muted-foreground" />
                          )}
                        </span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Empty State if no modules */}
      {modules?.length === 0 && (
        <div className="text-center py-12 bg-card rounded-lg shadow border">
          <Package className="h-12 w-12 mx-auto text-muted-foreground" />
          <h3 className="mt-4 text-lg font-medium">
            Aucun module disponible
          </h3>
          <p className="mt-2 text-muted-foreground">
            Les modules seront disponibles une fois le systeme initialise.
          </p>
        </div>
      )}
    </div>
  );
}
