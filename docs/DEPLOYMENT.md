# Guide de Deploiement Cloudflare

> Documentation complete pour deployer Perfex ERP sur Cloudflare Workers, D1, KV et Pages.

## Table des Matieres

1. [Pre-requis](#pre-requis)
2. [Configuration Initiale](#configuration-initiale)
3. [Configuration de la Base de Donnees D1](#configuration-de-la-base-de-donnees-d1)
4. [Configuration KV (Sessions & Cache)](#configuration-kv-sessions--cache)
5. [Deploiement de l'API](#deploiement-de-lapi)
6. [Deploiement du Frontend](#deploiement-du-frontend)
7. [Configuration des Secrets](#configuration-des-secrets)
8. [Environnements (Dev/Staging/Production)](#environnements-devstagingproduction)
9. [Domaines Personnalises](#domaines-personnalises)
10. [Monitoring et Logs](#monitoring-et-logs)
11. [CI/CD avec GitHub Actions](#cicd-avec-github-actions)
12. [Troubleshooting](#troubleshooting)

---

## Pre-requis

### Outils Requis

```bash
# Node.js 18+
node --version  # v18.0.0 ou superieur

# pnpm 8+
pnpm --version  # 8.0.0 ou superieur

# Wrangler CLI (Cloudflare)
npm install -g wrangler
wrangler --version  # 3.0.0 ou superieur
```

### Compte Cloudflare

1. Creer un compte sur [Cloudflare](https://dash.cloudflare.com/sign-up)
2. Activer Cloudflare Workers (plan gratuit disponible)
3. Recuperer votre `Account ID` depuis le dashboard

### Authentification

```bash
# Se connecter a Cloudflare
wrangler login

# Verifier la connexion
wrangler whoami
```

---

## Configuration Initiale

### 1. Cloner le Projet

```bash
git clone https://github.com/devfactory/perfex.git
cd perfex-erp
pnpm install
```

### 2. Structure du Projet

```
perfex/
├── apps/
│   ├── web/                    # Frontend React
│   └── workers/
│       └── api/                # API Hono.js
│           └── wrangler.toml   # Configuration Wrangler
├── packages/
│   └── database/
│       └── migrations/         # Migrations SQL
└── docs/
    └── DEPLOYMENT.md           # Ce fichier
```

---

## Configuration de la Base de Donnees D1

### 1. Creer les Bases de Donnees

```bash
# Base de donnees de developpement
wrangler d1 create perfex-db-dev

# Base de donnees de staging
wrangler d1 create perfex-db-staging

# Base de donnees de production
wrangler d1 create perfex-db-prod
```

Chaque commande retourne un `database_id`. Notez-les pour la configuration.

### 2. Configurer wrangler.toml

Editez `apps/workers/api/wrangler.toml` :

```toml
# Configuration principale
name = "perfex-api"
main = "src/index.ts"
compatibility_date = "2024-11-24"
account_id = "VOTRE_ACCOUNT_ID"

# Compatibilite Node.js
compatibility_flags = ["nodejs_compat"]

# ===============================================
# ENVIRONNEMENT DEV
# ===============================================
[env.dev]
name = "perfex-api-dev"
vars = { ENVIRONMENT = "development", LOG_LEVEL = "debug" }

[[env.dev.d1_databases]]
binding = "DB"
database_name = "perfex-db-dev"
database_id = "VOTRE_DATABASE_ID_DEV"
migrations_dir = "../../../packages/database/migrations"

# ===============================================
# ENVIRONNEMENT STAGING
# ===============================================
[env.staging]
name = "perfex-api-staging"
vars = { ENVIRONMENT = "staging", LOG_LEVEL = "info" }

[[env.staging.d1_databases]]
binding = "DB"
database_name = "perfex-db-staging"
database_id = "VOTRE_DATABASE_ID_STAGING"
migrations_dir = "../../../packages/database/migrations"

# ===============================================
# ENVIRONNEMENT PRODUCTION
# ===============================================
[env.production]
name = "perfex-api"
vars = { ENVIRONMENT = "production", LOG_LEVEL = "warn" }

[[env.production.d1_databases]]
binding = "DB"
database_name = "perfex-db-prod"
database_id = "VOTRE_DATABASE_ID_PROD"
migrations_dir = "../../../packages/database/migrations"
```

### 3. Appliquer les Migrations

```bash
cd apps/workers/api

# Migrations en local (pour developpement)
wrangler d1 migrations apply perfex-db-dev --local

# Migrations en dev distant
wrangler d1 migrations apply perfex-db-dev --remote --env dev

# Migrations en staging
wrangler d1 migrations apply perfex-db-staging --remote --env staging

# Migrations en production
wrangler d1 migrations apply perfex-db-prod --remote --env production
```

### 4. Verifier les Migrations

```bash
# Lister les migrations appliquees
wrangler d1 migrations list perfex-db-prod --remote --env production
```

---

## Configuration KV (Sessions & Cache)

### 1. Creer les Namespaces KV

```bash
# Sessions - Dev
wrangler kv:namespace create "SESSIONS" --env dev
wrangler kv:namespace create "SESSIONS" --preview --env dev

# Cache - Dev
wrangler kv:namespace create "CACHE" --env dev
wrangler kv:namespace create "CACHE" --preview --env dev

# Sessions - Staging
wrangler kv:namespace create "SESSIONS" --env staging

# Cache - Staging
wrangler kv:namespace create "CACHE" --env staging

# Sessions - Production
wrangler kv:namespace create "SESSIONS" --env production

# Cache - Production
wrangler kv:namespace create "CACHE" --env production
```

### 2. Configurer les KV dans wrangler.toml

```toml
# Dev
[[env.dev.kv_namespaces]]
binding = "SESSIONS"
id = "VOTRE_SESSIONS_ID_DEV"
preview_id = "VOTRE_SESSIONS_PREVIEW_ID"

[[env.dev.kv_namespaces]]
binding = "CACHE"
id = "VOTRE_CACHE_ID_DEV"
preview_id = "VOTRE_CACHE_PREVIEW_ID"

# Staging
[[env.staging.kv_namespaces]]
binding = "SESSIONS"
id = "VOTRE_SESSIONS_ID_STAGING"

[[env.staging.kv_namespaces]]
binding = "CACHE"
id = "VOTRE_CACHE_ID_STAGING"

# Production
[[env.production.kv_namespaces]]
binding = "SESSIONS"
id = "VOTRE_SESSIONS_ID_PROD"

[[env.production.kv_namespaces]]
binding = "CACHE"
id = "VOTRE_CACHE_ID_PROD"
```

---

## Deploiement de l'API

### 1. Build et Deploy

```bash
cd apps/workers/api

# Deployer en dev
wrangler deploy --env dev

# Deployer en staging
wrangler deploy --env staging

# Deployer en production
wrangler deploy --env production
```

### 2. Verifier le Deploiement

```bash
# Verifier le statut
wrangler deployments list --env production

# Tester l'API
curl https://perfex-api.votre-compte.workers.dev/api/v1/health
```

### 3. URLs de l'API

| Environnement | URL |
|--------------|-----|
| Dev | `https://perfex-api-dev.votre-compte.workers.dev` |
| Staging | `https://perfex-api-staging.votre-compte.workers.dev` |
| Production | `https://perfex-api.votre-compte.workers.dev` |

---

## Deploiement du Frontend

### 1. Creer le Projet Pages

```bash
# Creer le projet Cloudflare Pages
wrangler pages project create perfex-web
```

### 2. Build du Frontend

```bash
cd apps/web

# Build pour dev
VITE_API_URL=https://perfex-api-dev.votre-compte.workers.dev/api/v1 \
VITE_ENVIRONMENT=development \
pnpm build

# Build pour staging
VITE_API_URL=https://perfex-api-staging.votre-compte.workers.dev/api/v1 \
VITE_ENVIRONMENT=staging \
pnpm build

# Build pour production
VITE_API_URL=https://perfex-api.votre-compte.workers.dev/api/v1 \
VITE_ENVIRONMENT=production \
pnpm build
```

### 3. Deployer sur Pages

```bash
# Deployer (branche main = production)
wrangler pages deploy dist --project-name=perfex-web --branch=main

# Deployer sur une branche de preview
wrangler pages deploy dist --project-name=perfex-web --branch=staging
```

### 4. URLs du Frontend

| Environnement | URL |
|--------------|-----|
| Production | `https://perfex-web.pages.dev` |
| Staging | `https://staging.perfex-web.pages.dev` |
| Preview | `https://<commit-hash>.perfex-web.pages.dev` |

---

## Configuration des Secrets

### 1. Definir les Secrets

```bash
cd apps/workers/api

# Secrets pour dev
wrangler secret put JWT_ACCESS_SECRET --env dev
wrangler secret put JWT_REFRESH_SECRET --env dev

# Secrets pour staging
wrangler secret put JWT_ACCESS_SECRET --env staging
wrangler secret put JWT_REFRESH_SECRET --env staging

# Secrets pour production
wrangler secret put JWT_ACCESS_SECRET --env production
wrangler secret put JWT_REFRESH_SECRET --env production
```

### 2. Generer des Secrets Securises

```bash
# Generer un secret aleatoire
openssl rand -hex 32
```

### 3. Liste des Secrets Requis

| Secret | Description | Exemple |
|--------|-------------|---------|
| `JWT_ACCESS_SECRET` | Cle pour tokens d'acces | `openssl rand -hex 32` |
| `JWT_REFRESH_SECRET` | Cle pour tokens de refresh | `openssl rand -hex 32` |
| `SMTP_PASSWORD` | Mot de passe SMTP (optionnel) | - |
| `AI_API_KEY` | Cle API Cloudflare AI (optionnel) | - |

---

## Environnements (Dev/Staging/Production)

### Tableau Recapitulatif

| Element | Dev | Staging | Production |
|---------|-----|---------|------------|
| **API Worker** | `perfex-api-dev` | `perfex-api-staging` | `perfex-api` |
| **Base D1** | `perfex-db-dev` | `perfex-db-staging` | `perfex-db-prod` |
| **KV Sessions** | `sessions-dev` | `sessions-staging` | `sessions-prod` |
| **KV Cache** | `cache-dev` | `cache-staging` | `cache-prod` |
| **Log Level** | `debug` | `info` | `warn` |
| **Frontend** | `dev.perfex-web.pages.dev` | `staging.perfex-web.pages.dev` | `perfex-web.pages.dev` |

### Variables d'Environnement

```toml
# wrangler.toml
[env.dev.vars]
ENVIRONMENT = "development"
LOG_LEVEL = "debug"
CORS_ORIGINS = "http://localhost:5173,https://dev.perfex-web.pages.dev"

[env.staging.vars]
ENVIRONMENT = "staging"
LOG_LEVEL = "info"
CORS_ORIGINS = "https://staging.perfex-web.pages.dev"

[env.production.vars]
ENVIRONMENT = "production"
LOG_LEVEL = "warn"
CORS_ORIGINS = "https://perfex-web.pages.dev,https://app.perfex.com"
```

---

## Domaines Personnalises

### 1. API - Custom Domain

```bash
# Via Dashboard Cloudflare:
# Workers & Pages > perfex-api > Settings > Domains & Routes
# Ajouter: api.votredomaine.com

# Ou via wrangler.toml:
routes = [
  { pattern = "api.votredomaine.com/*", zone_name = "votredomaine.com" }
]
```

### 2. Frontend - Custom Domain

```bash
# Via Dashboard Cloudflare:
# Workers & Pages > perfex-web > Custom domains
# Ajouter: app.votredomaine.com
```

### 3. Configuration DNS

Ajouter dans votre zone DNS Cloudflare:

```
# API
api.votredomaine.com    CNAME    perfex-api.votre-compte.workers.dev

# Frontend
app.votredomaine.com    CNAME    perfex-web.pages.dev
```

---

## Monitoring et Logs

### 1. Logs en Temps Reel

```bash
# Voir les logs de l'API
wrangler tail --env production

# Filtrer par statut
wrangler tail --env production --status error

# Filtrer par methode
wrangler tail --env production --method POST
```

### 2. Analytics

Acceder au dashboard Cloudflare:
- **Workers Analytics**: Requetes, latence, erreurs
- **D1 Analytics**: Requetes SQL, taille de la DB
- **Pages Analytics**: Visites, bande passante

### 3. Alertes

Configurer des alertes dans Cloudflare Dashboard:
- Taux d'erreur > 5%
- Latence P95 > 500ms
- CPU time > 10ms

---

## CI/CD avec GitHub Actions

### 1. Fichier Workflow

Creer `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Cloudflare

on:
  push:
    branches: [main, staging]
  pull_request:
    branches: [main]

env:
  CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
  CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}

jobs:
  lint-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm lint
      - run: pnpm type-check
      - run: pnpm test

  deploy-api:
    needs: lint-and-test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      - run: pnpm install

      - name: Deploy API to Staging
        if: github.ref == 'refs/heads/staging'
        run: |
          cd apps/workers/api
          npx wrangler deploy --env staging

      - name: Deploy API to Production
        if: github.ref == 'refs/heads/main'
        run: |
          cd apps/workers/api
          npx wrangler deploy --env production

  deploy-frontend:
    needs: lint-and-test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      - run: pnpm install

      - name: Build and Deploy to Staging
        if: github.ref == 'refs/heads/staging'
        run: |
          cd apps/web
          VITE_API_URL=${{ secrets.STAGING_API_URL }} pnpm build
          npx wrangler pages deploy dist --project-name=perfex-web --branch=staging

      - name: Build and Deploy to Production
        if: github.ref == 'refs/heads/main'
        run: |
          cd apps/web
          VITE_API_URL=${{ secrets.PROD_API_URL }} pnpm build
          npx wrangler pages deploy dist --project-name=perfex-web --branch=main
```

### 2. Secrets GitHub

Ajouter dans GitHub > Settings > Secrets:

| Secret | Description |
|--------|-------------|
| `CLOUDFLARE_API_TOKEN` | Token API Cloudflare (avec permissions Workers) |
| `CLOUDFLARE_ACCOUNT_ID` | ID de votre compte Cloudflare |
| `STAGING_API_URL` | URL de l'API staging |
| `PROD_API_URL` | URL de l'API production |

### 3. Creer un Token API Cloudflare

1. Aller sur [Cloudflare API Tokens](https://dash.cloudflare.com/profile/api-tokens)
2. Creer un token avec les permissions:
   - Account > Workers Scripts > Edit
   - Account > Workers KV Storage > Edit
   - Account > D1 > Edit
   - Account > Cloudflare Pages > Edit

---

## Troubleshooting

### Erreurs Courantes

#### 1. "Error: D1_ERROR: no such table"

```bash
# Appliquer les migrations
wrangler d1 migrations apply perfex-db-prod --remote --env production
```

#### 2. "Error: KV namespace not found"

```bash
# Verifier les IDs dans wrangler.toml
wrangler kv:namespace list
```

#### 3. "Error: Invalid binding"

Verifier que les noms de bindings correspondent dans:
- `wrangler.toml`
- `src/types.ts` (interface Env)

#### 4. "CORS error"

Ajouter l'origine dans les variables d'environnement:
```toml
[env.production.vars]
CORS_ORIGINS = "https://app.votredomaine.com"
```

#### 5. "JWT verification failed"

```bash
# Verifier que les secrets sont configures
wrangler secret list --env production

# Reconfigurer si necessaire
wrangler secret put JWT_ACCESS_SECRET --env production
```

### Commandes de Debug

```bash
# Voir la configuration
wrangler config

# Lister les deployments
wrangler deployments list --env production

# Voir les logs
wrangler tail --env production

# Tester en local
wrangler dev --env dev --local
```

### Support

- [Documentation Cloudflare Workers](https://developers.cloudflare.com/workers/)
- [Documentation Cloudflare D1](https://developers.cloudflare.com/d1/)
- [Documentation Cloudflare Pages](https://developers.cloudflare.com/pages/)
- [Discord Cloudflare Developers](https://discord.gg/cloudflaredev)

---

## Checklist de Deploiement

### Premier Deploiement

- [ ] Compte Cloudflare cree et verifie
- [ ] Wrangler installe et authentifie
- [ ] Bases de donnees D1 creees (dev, staging, prod)
- [ ] Namespaces KV crees
- [ ] Secrets configures
- [ ] Migrations appliquees
- [ ] API deployee et testee
- [ ] Frontend deploye et teste
- [ ] CORS configure
- [ ] Domaines personnalises (optionnel)
- [ ] CI/CD configure (optionnel)

### Deploiement de Mise a Jour

- [ ] Tests passes en local
- [ ] Build reussi
- [ ] Migrations appliquees (si nouvelles)
- [ ] Deploy sur staging
- [ ] Tests sur staging
- [ ] Deploy sur production
- [ ] Verification post-deploiement

---

**Derniere mise a jour**: Decembre 2024
