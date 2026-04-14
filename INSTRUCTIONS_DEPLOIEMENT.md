# Perfex Bakery - Instructions de Deploiement Rapide

## Etape 1 : Pousser sur GitHub

```bash
git remote add origin https://github.com/devfactory/perfex.git
git branch -M main
git push -u origin main
```

## Etape 2 : Configuration Cloudflare

```bash
# S'authentifier
wrangler login

# Creer les bases de donnees
wrangler d1 create perfex-db-dev
wrangler d1 create perfex-db-staging
wrangler d1 create perfex-db-prod

# Creer les KV Namespaces
wrangler kv:namespace create SESSIONS --preview
wrangler kv:namespace create CACHE --preview

# Configurer les secrets (pour chaque env)
openssl rand -base64 32  # Generer les secrets
wrangler secret put JWT_ACCESS_SECRET --env dev
wrangler secret put JWT_REFRESH_SECRET --env dev
```

Mettre a jour `apps/workers/api/wrangler.toml` avec les IDs obtenus.

## Etape 3 : Deploiement

### API

```bash
cd apps/workers/api
wrangler deploy --env dev
wrangler deploy --env staging
wrangler deploy --env production
```

### Migrations

```bash
cd packages/database
wrangler d1 migrations apply perfex-db-dev --remote
wrangler d1 migrations apply perfex-db-staging --remote
wrangler d1 migrations apply perfex-db-prod --remote
```

### Frontend

```bash
cd apps/web

# Build bakery
VITE_APP_VARIANT=perfex-bakery \
VITE_API_URL=https://perfex-api.VOTRE-SUBDOMAIN.workers.dev/api/v1 \
VITE_ENVIRONMENT=production \
pnpm build

# Deployer
wrangler pages deploy dist --project-name=perfex-web
```

## Etape 4 : Verification

```bash
curl https://perfex-api-dev.VOTRE-SUBDOMAIN.workers.dev/
# {"status":"ok","service":"perfex-api"}
```

Ouvrir dans le navigateur : https://perfex-web.pages.dev

## Notes

- Toujours definir `VITE_APP_VARIANT=perfex-bakery` pour le build frontend
- Ne jamais committer `.env` ou `.dev.vars`
- Guide complet : [DEPLOYMENT.md](./DEPLOYMENT.md)

---

**Depot** : https://github.com/devfactory/perfex
