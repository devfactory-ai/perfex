/**
 * Industry Selector Component
 * Allows users to select an industry preset to auto-configure modules
 */

import { useState } from 'react';
import {
  ChefHat,
  Factory,
  Store,
  Briefcase,
  Truck,
  HardHat,
  Stethoscope,
  Pill,
  Wheat,
  UtensilsCrossed,
  Shield,
  Settings,
  Check,
  ChevronRight,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { industryPresets, presetColors, type IndustryPreset } from '@/config/industryPresets';

// Icon mapping
const PRESET_ICONS: Record<string, typeof ChefHat> = {
  ChefHat,
  Factory,
  Store,
  Briefcase,
  Truck,
  HardHat,
  Stethoscope,
  Pill,
  Wheat,
  UtensilsCrossed,
  Shield,
  Settings,
};

interface IndustrySelectorProps {
  currentPreset?: string;
  onSelectPreset: (preset: IndustryPreset) => Promise<void>;
  isLoading?: boolean;
}

export function IndustrySelector({ currentPreset, onSelectPreset, isLoading }: IndustrySelectorProps) {
  const [selectedId, setSelectedId] = useState<string | null>(currentPreset || null);
  const [applying, setApplying] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState<IndustryPreset | null>(null);

  const handleSelect = async (preset: IndustryPreset) => {
    if (applying) return;

    // Show confirmation for non-custom presets
    if (preset.id !== 'custom') {
      setShowConfirm(preset);
    } else {
      // For custom, just select without applying
      setSelectedId(preset.id);
    }
  };

  const handleConfirm = async () => {
    if (!showConfirm || applying) return;

    setApplying(showConfirm.id);
    try {
      await onSelectPreset(showConfirm);
      setSelectedId(showConfirm.id);
      setShowConfirm(null);
    } catch (error) {
      console.error('Failed to apply preset:', error);
    } finally {
      setApplying(null);
    }
  };

  const getIcon = (iconName: string) => {
    return PRESET_ICONS[iconName] || Settings;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Sparkles className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">Configuration par Activite</h2>
          <p className="text-sm text-muted-foreground">
            Selectionnez votre type d'activite pour activer automatiquement les modules adaptes
          </p>
        </div>
      </div>

      {/* Presets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {industryPresets.map((preset) => {
          const Icon = getIcon(preset.icon);
          const colors = presetColors[preset.color] || presetColors.gray;
          const isSelected = selectedId === preset.id;
          const isApplying = applying === preset.id;

          return (
            <button
              key={preset.id}
              onClick={() => handleSelect(preset)}
              disabled={isApplying || isLoading}
              className={`relative flex flex-col p-4 rounded-xl border-2 transition-all text-left ${
                isSelected
                  ? `${colors.border} ${colors.bg}`
                  : 'border-border hover:border-primary/50 bg-card'
              } ${isApplying ? 'opacity-70' : ''}`}
            >
              {/* Selected indicator */}
              {isSelected && (
                <div className="absolute top-3 right-3">
                  <div className={`p-1 rounded-full ${colors.bg} ${colors.border} border`}>
                    <Check className={`h-4 w-4 ${colors.icon}`} />
                  </div>
                </div>
              )}

              {/* Icon and Title */}
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${colors.bg}`}>
                  <Icon className={`h-6 w-6 ${colors.icon}`} />
                </div>
                <div className="flex-1 min-w-0 pr-6">
                  <h3 className="font-semibold text-sm">{preset.name}</h3>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {preset.description}
                  </p>
                </div>
              </div>

              {/* Module count */}
              <div className="mt-3 flex items-center justify-between text-xs">
                <span className={`${colors.text}`}>
                  {preset.modules.length} modules actifs
                </span>
                {isApplying ? (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
              </div>

              {/* Recommended badge for Super Admin */}
              {preset.id === 'superadmin' && (
                <div className="absolute -top-2 -right-2">
                  <span className="px-2 py-0.5 bg-red-600 text-white text-xs font-medium rounded-full">
                    Admin
                  </span>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-card rounded-xl shadow-xl max-w-md w-full mx-4 p-6 border">
            <div className="flex items-start gap-4">
              {(() => {
                const Icon = getIcon(showConfirm.icon);
                const colors = presetColors[showConfirm.color];
                return (
                  <div className={`p-3 rounded-lg ${colors.bg}`}>
                    <Icon className={`h-8 w-8 ${colors.icon}`} />
                  </div>
                );
              })()}
              <div>
                <h3 className="text-lg font-semibold">Appliquer cette configuration ?</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {showConfirm.name}
                </p>
              </div>
            </div>

            <div className="mt-4 p-4 bg-muted/50 rounded-lg">
              <p className="text-sm font-medium mb-2">Modules qui seront actives :</p>
              <div className="flex flex-wrap gap-1.5">
                {showConfirm.modules.map((mod) => (
                  <span
                    key={mod}
                    className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full"
                  >
                    {mod}
                  </span>
                ))}
              </div>
              {showConfirm.recommended && showConfirm.recommended.length > 0 && (
                <div className="mt-3 pt-3 border-t border-border">
                  <p className="text-xs text-muted-foreground mb-2">Modules recommandes (a activer manuellement) :</p>
                  <div className="flex flex-wrap gap-1.5">
                    {showConfirm.recommended.map((mod) => (
                      <span
                        key={mod}
                        className="px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 text-xs rounded-full"
                      >
                        {mod}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 flex gap-3 justify-end">
              <button
                onClick={() => setShowConfirm(null)}
                disabled={applying !== null}
                className="px-4 py-2 text-sm font-medium rounded-lg border border-border hover:bg-muted transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleConfirm}
                disabled={applying !== null}
                className="px-4 py-2 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex items-center gap-2"
              >
                {applying ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Application...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    Appliquer
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
