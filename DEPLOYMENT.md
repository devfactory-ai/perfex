# Perfex Bakery - Guide de Deploiement

## Environnements

| Env | API | Frontend | Branche |
|-----|-----|----------|---------|
| Dev | `perfex-api-dev.workers.dev` | `perfex-web-dev.pages.dev` | `develop` |
| Staging | `perfex-api-staging.workers.dev` | `perfex-web-staging.pages.dev` | `develop` |
| Production | `perfex-api.workers.dev` | `perfex-web.pages.dev` | `main` |

## Prerequis

1. Compte Cloudflare
2. Wrangler CLI installe et authentifie (`wrangler login`)
3. Depot GitHub configure

## 1. Creer les Ressources Cloudflare

```bash
# Bases de donnees D1
wrangler d1 create perfex-db-dev
wrangler d1 create perfex-db-staging
wrangler d1 create perfex-db-prod

# KV Namespaces (pour chaque env)
wrangler kv:namespace create SESSIONS --preview
wrangler kv:namespace create CACHE --preview
```

Mettre a jour `apps/workers/api/wrangler.toml` avec les IDs obtenus.

## 2. Configurer les Secrets

```bash
# Pour chaque environnement (dev, staging, production) :
wrangler secret put JWT_ACCESS_SECRET --env <env>
wrangler secret put JWT_REFRESH_SECRET --env <env>
```

## 3. Deployer

### API (Cloudflare Workers)

```bash
cd apps/workers/api
wrangler deploy --env dev        # Dev
wrangler deploy --env staging    # Staging
wrangler deploy --env production # Production
```

### Frontend (Cloudflare Pages)

```bash
cd apps/web

# Build avec la bonne config
VITE_API_URL=https://perfex-api.workers.dev/api/v1 \
VITE_APP_VARIANT=perfex-bakery \
VITE_ENVIRONMENT=production \
pnpm build

# Deployer
wrangler pages deploy dist --project-name=perfex-web
```

### Migrations

```bash
cd packages/database
wrangler d1 migrations apply perfex-db-dev --remote
wrangler d1 migrations apply perfex-db-staging --remote
wrangler d1 migrations apply perfex-db-prod --remote
```

## 4. Verification

```bash
# Tester chaque API
curl https://perfex-api-dev.YOUR-SUBDOMAIN.workers.dev/
# {"status":"ok","service":"perfex-api","environment":"development"}
```

## 5. CI/CD (GitHub Actions)

Secrets GitHub a configurer :
- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

Workflow :
1. Push sur `develop` -> deploiement dev automatique
2. PR vers `main` -> deploiement staging
3. Merge sur `main` -> deploiement production

## 6. Domaines Personnalises (optionnel)

Dans le dashboard Cloudflare :
- API : Workers > Custom Domains > `api.votredomaine.com`
- Frontend : Pages > Custom Domains > `app.votredomaine.com`

## 7. Monitoring

```bash
# Logs en temps reel
wrangler tail perfex-api

# Rollback si necessaire
wrangler rollback --name perfex-api
```

## Checklist

- [ ] D1 databases creees et migrees
- [ ] KV namespaces configures
- [ ] Secrets JWT definis
- [ ] API deploye et repond
- [ ] Frontend deploye et accessible
- [ ] Login fonctionne
- [ ] Pas d'erreurs dans les logs

---

**Documentation** : [SETUP_GUIDE.md](./SETUP_GUIDE.md) | [DEPLOYMENT_STATUS.md](./DEPLOYMENT_STATUS.md)
