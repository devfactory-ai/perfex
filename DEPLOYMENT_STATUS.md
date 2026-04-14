# Perfex Bakery - Statut de Deploiement

**Derniere verification** : Novembre 2025
**Statut Global** : Operationnel

## Environnements

### Production
- **Frontend** : https://perfex-web.pages.dev
- **API** : https://perfex-api.yassine-techini.workers.dev
- **Base de donnees** : perfex-db-prod
- **Statut** : Operationnel

### Staging
- **Frontend** : https://perfex-web-staging.pages.dev
- **API** : https://perfex-api-staging.yassine-techini.workers.dev
- **Base de donnees** : perfex-db-staging
- **Statut** : Operationnel

### Dev
- **Frontend** : https://perfex-web-dev.pages.dev
- **API** : https://perfex-api-dev.yassine-techini.workers.dev
- **Base de donnees** : perfex-db-dev
- **Statut** : Operationnel

## Ressources Cloudflare

### Bases de Donnees D1

| Env | Nom | Database ID |
|-----|-----|-------------|
| Dev | perfex-db-dev | 990c74a6-b0b6-4904-8d52-5f1968e06768 |
| Staging | perfex-db-staging | 23e79bcb-34c8-467c-a582-4f363fa1779c |
| Production | perfex-db-prod | b615d292-465b-4292-9914-2263fd7a66eb |

### KV Namespaces

| Env | Type | ID |
|-----|------|-----|
| Dev | SESSIONS | 2fc4dbf91ef149f4810d0614f3fc7dde |
| Dev | CACHE | d9edec6c56cb4f3bbe68be2747d6d7e6 |
| Staging | SESSIONS | 7a0c3cb3fbf047ca9d7f8977c9b98004 |
| Staging | CACHE | db57371d4269410bb4459e519f5c33c3 |
| Production | SESSIONS | 85379b8924b444188374361b23898c75 |
| Production | CACHE | f7fff34646004bdd80b6ce1f17fdc7aa |

## Commandes de Redeploiement

```bash
# API
cd apps/workers/api
wrangler deploy --env dev
wrangler deploy --env staging
wrangler deploy --env production

# Frontend (avec VITE_APP_VARIANT=perfex-bakery)
cd apps/web
VITE_APP_VARIANT=perfex-bakery VITE_API_URL=https://perfex-api.yassine-techini.workers.dev/api/v1 pnpm build
wrangler pages deploy dist --project-name=perfex-web
```

## Verification Rapide

```bash
curl https://perfex-api-dev.yassine-techini.workers.dev/
curl https://perfex-api-staging.yassine-techini.workers.dev/
curl https://perfex-api.yassine-techini.workers.dev/
```

---

**Compte Cloudflare** : yassine.techini@devfactory.ai
