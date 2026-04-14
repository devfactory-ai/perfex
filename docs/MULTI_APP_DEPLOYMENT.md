# Deploiement Perfex Bakery

## Vue d'Ensemble

Perfex Bakery est la seule variante de l'application deployee. L'application utilise la variable `VITE_APP_VARIANT=perfex-bakery` pour configurer les modules actifs et le theming.

## Configuration

### Variables d'Environnement

| Variable | Valeur | Description |
|----------|--------|-------------|
| `VITE_APP_VARIANT` | `perfex-bakery` | Variante de l'application |
| `VITE_APP_NAME` | `Perfex Bakery` | Nom affiche |
| `VITE_API_URL` | URL de l'API | URL complete du backend |

### Fichier de Configuration

Le fichier `apps/web/src/config/app-variants.ts` definit la configuration:

```typescript
'perfex-bakery': {
  id: 'perfex-bakery',
  name: 'Perfex Bakery',
  description: 'Solution complete de gestion pour boulangeries-patisseries',
  primaryColor: '#F59E0B',
  defaultRoute: '/bakery',
  enabledModules: ['dashboard', 'bakery', 'recipes', 'traceability', 'pos', 'inventory', 'hr', 'finance'],
  features: {
    pos: true,
    bakery: true,
  },
},
```

## Modules Actifs

- Dashboard
- Boulangerie (Stock, Production, Ventes B2B, Maintenance)
- Recettes & Formulations
- Tracabilite HACCP
- Point de Vente
- Inventaire
- Ressources Humaines
- Finance
- Parametres

**Couleur primaire**: Ambre/Orange (#F59E0B)

## Commandes de Build

```bash
# Developpement local
cd apps/web && pnpm dev:bakery

# Build production
cd apps/web && pnpm build:bakery

# Ou manuellement
cd apps/web
VITE_APP_VARIANT=perfex-bakery pnpm build
```

## Deploiement

```bash
# Build et deploiement sur Cloudflare Pages
cd apps/web
VITE_APP_VARIANT=perfex-bakery pnpm build
npx wrangler pages deploy dist --project-name=perfex-bakery
```

### URLs

| Environnement | URL |
|--------------|-----|
| Production | `https://perfex-bakery.pages.dev` |
| Staging | `https://staging.perfex-bakery.pages.dev` |

## Comptes de Demo

| Role | Email | Mot de passe |
|------|-------|--------------|
| Gerant | demo@perfex.io | Demo@2024! |
| Boulanger | boulanger@perfex.io | Baker@2024! |
| Vendeur | vente@perfex.io | Sales@2024! |
| Livreur | livraison@perfex.io | Delivery@2024! |

## Architecture Technique

### Filtrage des Modules

Le hook `useModules.ts` filtre les modules selon:

1. La variante active (`VITE_APP_VARIANT=perfex-bakery`)
2. Le role de l'utilisateur
3. La configuration API (si disponible)

### Structure des Fichiers

```
perfex/
+-- apps/web/
|   +-- src/config/app-variants.ts    # Configuration variante bakery
|   +-- src/hooks/useModules.ts       # Filtrage des modules
|   +-- .env.bakery                   # Variables d'environnement bakery
+-- scripts/
|   +-- deploy-bakery.sh              # Script de deploiement
+-- docs/
    +-- MULTI_APP_DEPLOYMENT.md       # Cette documentation
```

## Support

- Documentation module: [BAKERY_MODULE.md](./BAKERY_MODULE.md)
- Guide utilisateur: [BAKERY_USER_GUIDE.md](./BAKERY_USER_GUIDE.md)
- API: [BAKERY_API.md](./BAKERY_API.md)
