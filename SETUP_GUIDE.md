# Perfex Bakery - Guide d'Installation

## Prerequis

1. **Node.js** v18+ (`node --version`)
2. **pnpm** v8+ (`npm install -g pnpm`)
3. **Git** (`git --version`)
4. **Wrangler CLI** (`npm install -g wrangler`)
5. **Compte Cloudflare** (pour le deploiement)

## Installation Locale

### 1. Cloner et installer

```bash
git clone https://github.com/devfactory/perfex.git
cd perfex
pnpm install
```

### 2. Configurer les variables d'environnement

**Frontend** (`apps/web/.env`) :
```env
VITE_API_URL=http://localhost:8787/api/v1
VITE_APP_NAME=Perfex Bakery
VITE_APP_VARIANT=perfex-bakery
VITE_ENVIRONMENT=development
```

**API** (`apps/workers/api/.dev.vars`) :
```env
JWT_ACCESS_SECRET=votre-secret-access-min-32-chars
JWT_REFRESH_SECRET=votre-secret-refresh-min-32-chars
ENVIRONMENT=development
```

Generer les secrets : `openssl rand -base64 32`

### 3. Migrations base de donnees

```bash
pnpm db:migrate:local
```

### 4. Lancer l'application

```bash
# Tous les services
pnpm dev

# Ou separement :
cd apps/workers/api && pnpm dev    # API sur http://localhost:8787
cd apps/web && pnpm dev            # Frontend sur http://localhost:5173
```

### 5. Variable VITE_APP_VARIANT

Le projet utilise `VITE_APP_VARIANT=perfex-bakery` pour activer le build bakery. Cette variable controle les modules affiches dans le frontend et les routes disponibles. Assurez-vous qu'elle est definie dans `apps/web/.env`.

## Premiere Utilisation

1. Ouvrir http://localhost:5173/register
2. Creer une organisation et un compte admin
3. Se connecter et explorer le dashboard bakery

## Deploiement Cloudflare

Voir [DEPLOYMENT.md](./DEPLOYMENT.md) pour le guide complet.

Etapes resumees :

```bash
# 1. S'authentifier
wrangler login

# 2. Creer la base D1
wrangler d1 create perfex-db

# 3. Appliquer les migrations
pnpm db:migrate:prod

# 4. Deployer l'API
cd apps/workers/api && pnpm deploy

# 5. Deployer le frontend
cd apps/web && pnpm build && wrangler pages deploy dist
```

## Modifications de Schema

1. Modifier les fichiers dans `packages/database/src/schema/`
2. Generer la migration : `pnpm db:generate`
3. Appliquer localement : `pnpm db:migrate:local`
4. Tester, puis deployer en production

## Depannage

| Probleme | Solution |
|----------|----------|
| Migration echoue ("database locked") | Arreter le serveur dev, supprimer `.wrangler/`, relancer |
| Erreur CORS | Verifier `VITE_API_URL` dans `.env` |
| Erreurs TypeScript | Executer `pnpm build` pour reconstruire les packages |
| API ne demarre pas | `rm -rf node_modules && pnpm install` |

## Checklist de Securite (avant production)

- [ ] Secrets JWT uniques et securises
- [ ] HTTPS/SSL configure
- [ ] CORS restreint au domaine de production
- [ ] Rate limiting active
- [ ] Sauvegardes planifiees
- [ ] Audit logging verifie

---

**Contact** : support@perfex.com
