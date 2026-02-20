# Architecture Multi-App Perfex

## Vue d'Ensemble

Perfex ERP utilise une architecture multi-variante qui permet de déployer différentes versions spécialisées de l'application à partir d'un seul code source.

```
┌────────────────────────────────────────────────────────────────┐
│                      Code Source Unique                        │
│                    (GitHub Repository)                         │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│   ┌──────────────┐   ┌──────────────┐   ┌──────────────┐     │
│   │ Perfex Full  │   │Perfex Bakery │   │Perfex Health │     │
│   │   (ERP)      │   │(Boulangerie) │   │   (Santé)    │     │
│   └──────┬───────┘   └──────┬───────┘   └──────┬───────┘     │
│          │                  │                  │              │
│          ▼                  ▼                  ▼              │
│   ┌──────────────┐   ┌──────────────┐   ┌──────────────┐     │
│   │  Build Full  │   │ Build Bakery │   │ Build Health │     │
│   │VITE_APP_     │   │VITE_APP_     │   │VITE_APP_     │     │
│   │VARIANT=full  │   │VARIANT=bakery│   │VARIANT=health│     │
│   └──────┬───────┘   └──────┬───────┘   └──────┬───────┘     │
│          │                  │                  │              │
│          ▼                  ▼                  ▼              │
│   ┌──────────────┐   ┌──────────────┐   ┌──────────────┐     │
│   │  Cloudflare  │   │  Cloudflare  │   │  Cloudflare  │     │
│   │perfex-web-   │   │perfex-bakery │   │perfex-health │     │
│   │staging       │   │              │   │              │     │
│   └──────────────┘   └──────────────┘   └──────────────┘     │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

## Variantes Disponibles

### 1. Perfex Full (`perfex-full`)

L'ERP complet avec tous les modules activés.

- **URL**: https://perfex-web-staging.pages.dev
- **Modules**: Tous les modules ERP
- **Cas d'usage**: Entreprises nécessitant l'ensemble des fonctionnalités

### 2. Perfex Bakery (`perfex-bakery`)

Solution spécialisée pour les boulangeries-pâtisseries.

- **URL**: https://perfex-bakery.pages.dev
- **Modules**:
  - Dashboard
  - Boulangerie (Stock, Production, Ventes, Maintenance)
  - Recettes & Formulations
  - Traçabilité HACCP
  - Point de Vente
  - Inventaire
  - RH
  - Finance
- **Couleur primaire**: Ambre/Orange (#F59E0B)

### 3. Perfex Health (`perfex-health`)

Solution de gestion pour établissements de santé.

- **URL**: https://perfex-health.pages.dev
- **Modules**:
  - Dashboard
  - Dialyse
  - Cardiologie
  - Ophtalmologie
  - Portail Patient
  - RPM (Remote Patient Monitoring)
  - Clinical AI
  - Imaging AI
  - Population Health
  - Inventaire
  - RH
  - Finance
- **Couleur primaire**: Émeraude/Vert (#10B981)

## Configuration

### Variables d'Environnement

| Variable | Description | Valeurs |
|----------|-------------|---------|
| `VITE_APP_VARIANT` | Variante de l'application | `perfex-full`, `perfex-bakery`, `perfex-health` |
| `VITE_APP_NAME` | Nom de l'application | Ex: "Perfex Bakery" |
| `VITE_API_URL` | URL de l'API backend | URL complète |

### Fichier de Configuration

Le fichier `apps/web/src/config/app-variants.ts` définit la configuration de chaque variante :

```typescript
export const APP_VARIANTS: Record<AppVariant, AppVariantConfig> = {
  'perfex-bakery': {
    id: 'perfex-bakery',
    name: 'Perfex Bakery',
    description: 'Solution complète de gestion pour boulangeries-pâtisseries',
    primaryColor: '#F59E0B',
    defaultRoute: '/bakery',
    enabledModules: ['dashboard', 'bakery', 'recipes', ...],
    features: {
      pos: true,
      bakery: true,
      healthcare: false,
      ...
    },
  },
  // ...
};
```

## Commandes de Build

### Build par variante

```bash
# Build Perfex Full (default)
cd apps/web && npm run build

# Build Perfex Bakery
cd apps/web && npm run build:bakery

# Build Perfex Health
cd apps/web && npm run build:health
```

### Développement local

```bash
# Dev Perfex Full
npm run dev

# Dev Perfex Bakery
npm run dev:bakery

# Dev Perfex Health
npm run dev:health
```

## Déploiement

### Scripts de Déploiement

```bash
# Déployer une variante spécifique
./scripts/deploy-bakery.sh
./scripts/deploy-health.sh

# Menu interactif pour choisir la variante
./scripts/deploy-variants.sh
```

### Déploiement Manuel

```bash
# Perfex Bakery
cd apps/web
VITE_APP_VARIANT=perfex-bakery npm run build
npx wrangler pages deploy dist --project-name=perfex-bakery

# Perfex Health
cd apps/web
VITE_APP_VARIANT=perfex-health npm run build
npx wrangler pages deploy dist --project-name=perfex-health
```

## Comptes de Démo

### Perfex Bakery

| Rôle | Email | Mot de passe |
|------|-------|--------------|
| Gérant | demo@perfex.io | Demo@2024! |
| Boulanger | boulanger@perfex.io | Baker@2024! |
| Vendeur | vente@perfex.io | Sales@2024! |
| Livreur | livraison@perfex.io | Delivery@2024! |

### Perfex Health

| Rôle | Email | Mot de passe |
|------|-------|--------------|
| Administrateur | admin@perfex-health.io | Admin@2024! |
| Médecin | medecin@perfex-health.io | Doctor@2024! |
| Infirmier | infirmier@perfex-health.io | Nurse@2024! |

## Architecture Technique

### Filtrage des Modules

Le hook `useModules.ts` gère le filtrage des modules selon :

1. **La variante active** (`VITE_APP_VARIANT`)
2. **Le rôle de l'utilisateur** (basé sur l'email)
3. **La configuration API** (si disponible)

```typescript
// Vérification de la variante
const variant = getCurrentVariant();
if (!isModuleEnabled(moduleId)) {
  return false;
}

// Vérification basée sur le rôle
const userModules = BAKERY_ROLE_MODULES[user.email];
return userModules?.includes(moduleId);
```

### Structure des Fichiers

```
perfex/
├── apps/
│   └── web/
│       ├── src/
│       │   ├── config/
│       │   │   └── app-variants.ts    # Configuration des variantes
│       │   └── hooks/
│       │       └── useModules.ts      # Hook de filtrage des modules
│       ├── .env.bakery                # Env pour bakery
│       └── .env.health                # Env pour health
├── scripts/
│   ├── deploy-bakery.sh               # Déploiement bakery
│   ├── deploy-health.sh               # Déploiement health
│   └── deploy-variants.sh             # Menu de déploiement
└── docs/
    └── MULTI_APP_DEPLOYMENT.md        # Cette documentation
```

## Ajouter une Nouvelle Variante

1. **Définir la variante** dans `app-variants.ts`:

```typescript
'perfex-restaurant': {
  id: 'perfex-restaurant',
  name: 'Perfex Restaurant',
  description: 'Solution pour restaurants',
  primaryColor: '#EF4444',
  defaultRoute: '/restaurant',
  enabledModules: [...],
  features: {...},
},
```

2. **Ajouter les commandes de build** dans `package.json`:

```json
"build:restaurant": "VITE_APP_VARIANT=perfex-restaurant vite build"
```

3. **Créer le fichier d'environnement**:

```bash
# .env.restaurant
VITE_APP_VARIANT=perfex-restaurant
VITE_APP_NAME=Perfex Restaurant
```

4. **Créer le script de déploiement**:

```bash
# scripts/deploy-restaurant.sh
export VITE_APP_VARIANT=perfex-restaurant
npm run build
npx wrangler pages deploy dist --project-name=perfex-restaurant
```

5. **Configurer les rôles** dans `useModules.ts`

## Cloudflare Pages Projects

| Projet | Variante | URL |
|--------|----------|-----|
| perfex-web-staging | perfex-full | perfex-web-staging.pages.dev |
| perfex-bakery | perfex-bakery | perfex-bakery.pages.dev |
| perfex-health | perfex-health | perfex-health.pages.dev |

## Support

- Documentation Bakery: [BAKERY_MODULE.md](./BAKERY_MODULE.md)
- Guide Utilisateur Bakery: [BAKERY_USER_GUIDE.md](./BAKERY_USER_GUIDE.md)
- API Bakery: [BAKERY_API.md](./BAKERY_API.md)
