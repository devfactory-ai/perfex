# Architecture Technique - Perfex Bakery

> Documentation technique de l'architecture du systeme Perfex Bakery ERP.

## Table des Matieres

1. [Vue d'Ensemble](#vue-densemble)
2. [Stack Technologique](#stack-technologique)
3. [Architecture Monorepo](#architecture-monorepo)
4. [Backend (API)](#backend-api)
5. [Frontend (Web)](#frontend-web)
6. [Base de Donnees](#base-de-donnees)
7. [Authentification & Securite](#authentification--securite)
8. [Integrations](#integrations)
9. [Patterns et Conventions](#patterns-et-conventions)

---

## Vue d'Ensemble

Perfex Bakery est un ERP specialise pour les boulangeries-patisseries, deploye sur Cloudflare.

### Diagramme d'Architecture

```
                    +-----------------------------------------------------+
                    |                   Cloudflare Edge                     |
                    +-------------------------+---------------------------+
                                              |
                           +------------------+------------------+
                           |                  |                  |
                    +------v------+    +------v------+    +------v------+
                    |  CDN/Pages  |    |   Workers   |    |   Workers   |
                    |  (Static)   |    |   (API)     |    |   (Cron)    |
                    |   React     |    |   Hono.js   |    |  Scheduled  |
                    +-------------+    +------+------+    +-------------+
                                              |
                    +-------------------------+-------------------------+
                    |                         |                         |
             +------v------+          +-------v-------+         +-------v-------+
             |     D1      |          |      KV       |         |      R2       |
             |  (SQLite)   |          |   (Session)   |         |   (Storage)   |
             |  Database   |          |    Cache      |         |    Files      |
             +-------------+          +---------------+         +---------------+
```

---

## Stack Technologique

### Frontend

| Technologie | Version | Utilisation |
|------------|---------|-------------|
| React | 18.3 | UI Framework |
| TypeScript | 5.7 | Typage statique |
| Vite | 6.0 | Build tool |
| TanStack Query | 5.x | Server state management |
| Zustand | 5.x | Client state management |
| React Hook Form | 7.x | Forms |
| Zod | 3.x | Validation |
| TailwindCSS | 3.4 | Styling |
| React Router | 7.x | Routing |
| Axios | 1.x | HTTP Client |
| Lucide React | - | Icons |

### Backend

| Technologie | Version | Utilisation |
|------------|---------|-------------|
| Cloudflare Workers | - | Runtime serverless |
| Hono.js | 4.6 | Web framework |
| Drizzle ORM | 0.37 | Database ORM |
| Cloudflare D1 | - | SQLite Database |
| Cloudflare KV | - | Key-Value Store |
| bcryptjs | 2.4 | Password hashing |
| jsonwebtoken | 9.0 | JWT tokens |
| Zod | 3.x | Validation |

### Infrastructure

| Service | Utilisation |
|---------|-------------|
| Cloudflare Workers | Compute (API) |
| Cloudflare Pages | Frontend hosting |
| Cloudflare D1 | SQLite Database |
| Cloudflare KV | Sessions & Cache |
| Cloudflare R2 | File storage (optionnel) |

---

## Architecture Monorepo

### Structure des Packages

```
perfex/
+-- apps/
|   +-- web/                          # Frontend React (Bakery SPA)
|   |   +-- src/
|   |   |   +-- components/           # Composants reutilisables
|   |   |   |   +-- layouts/          # Layouts (DashboardLayout)
|   |   |   |   +-- forms/            # Composants de formulaires
|   |   |   |   +-- ui/               # Composants UI de base
|   |   |   +-- pages/                # Pages par module (~44 pages)
|   |   |   |   +-- auth/             # Login, Register
|   |   |   |   +-- bakery/           # Module boulangerie
|   |   |   |   +-- finance/          # Comptabilite
|   |   |   |   +-- hr/               # Ressources Humaines
|   |   |   |   +-- inventory/        # Inventaire
|   |   |   |   +-- recipes/          # Recettes & Formulations
|   |   |   |   +-- pos/              # Point de Vente
|   |   |   |   +-- settings/         # Parametres
|   |   |   +-- hooks/                # Custom React hooks
|   |   |   +-- lib/                  # Utilitaires
|   |   |   +-- stores/               # Zustand stores
|   |   |   +-- contexts/             # React Contexts (i18n, Theme)
|   |   |   +-- config/               # Configuration (app-variants)
|   |   |   +-- App.tsx               # Root component
|   |   |   +-- main.tsx              # Entry point
|   |   +-- vite.config.ts
|   |   +-- tailwind.config.js
|   |   +-- package.json
|   |
|   +-- workers/
|       +-- api/                      # Backend API
|           +-- src/
|           |   +-- index.ts          # Entry point Hono
|           |   +-- routes/           # Route handlers (~19 route files)
|           |   +-- services/         # Business logic (~25 service files)
|           |   +-- middleware/       # auth.ts, rbac.ts, cors.ts
|           |   +-- db.ts             # Database connection
|           |   +-- types.ts          # TypeScript types
|           +-- wrangler.toml         # Cloudflare config
|           +-- package.json
|
+-- packages/
|   +-- database/                     # Schema & Migrations
|   |   +-- src/schema/               # Drizzle schemas (12 fichiers)
|   |   |   +-- users.ts             # Users, Organizations, Roles
|   |   |   +-- finance.ts           # Comptabilite
|   |   |   +-- inventory.ts         # Inventaire
|   |   |   +-- hr.ts                # Ressources Humaines
|   |   |   +-- bakery.ts            # 43 tables boulangerie
|   |   |   +-- recipes.ts           # Recettes & Formulations
|   |   |   +-- traceability.ts      # Tracabilite & HACCP
|   |   |   +-- notifications.ts     # Notifications
|   |   |   +-- audit.ts             # Audit trail
|   |   |   +-- modules.ts           # Configuration modules
|   |   |   +-- integrations.ts      # Integrations externes
|   |   |   +-- index.ts             # Export all schemas
|   |   +-- migrations/               # SQL migrations
|   |   +-- drizzle.config.ts
|   |   +-- package.json
|   |
|   +-- shared/                       # Types & Validators partages
|   |   +-- src/
|   |   |   +-- types/                # TypeScript interfaces
|   |   |   +-- validators/           # Zod schemas
|   |   +-- package.json
|   |
|   +-- integrations/                 # Integrations externes
|       +-- src/providers/            # Paiement, SMS, Shipping
|
+-- docs/                             # Documentation
+-- pnpm-workspace.yaml               # Monorepo config
+-- turbo.json                        # Turborepo config
+-- package.json                      # Root package
```

---

## Backend (API)

### API REST Hono.js

L'API expose ~19 groupes de routes avec ~25 services metier. Architecture basee sur Hono.js deploye sur Cloudflare Workers.

**Routes principales:**

| Groupe | Prefix | Description |
|--------|--------|-------------|
| auth | `/api/v1/auth` | Authentification (login, register, refresh) |
| bakery | `/api/v1/bakery` | Module boulangerie (stock, production, ventes, maintenance) |
| accounts | `/api/v1/accounts` | Plan comptable |
| invoices | `/api/v1/invoices` | Facturation |
| payments | `/api/v1/payments` | Paiements |
| inventory | `/api/v1/inventory` | Gestion inventaire |
| hr | `/api/v1/hr` | Ressources humaines |
| recipes | `/api/v1/recipes` | Recettes & Formulations |
| traceability | `/api/v1/traceability` | Tracabilite HACCP |
| seed | `/api/v1/seed` | Donnees de demonstration |

### Pattern Service

Chaque route delegue la logique metier a un service:

```
Route (validation) -> Service (logique) -> Drizzle ORM -> D1
```

- Routes: validation Zod des entrees, appel service, formatage reponse
- Services: logique metier, requetes DB, calculs
- Middleware: auth JWT, RBAC, CORS, rate-limiting

---

## Frontend (Web)

### React SPA (~44 pages)

L'application frontend est un SPA React configure pour la variante `perfex-bakery` via `VITE_APP_VARIANT`.

**Modules frontend actifs:**

| Module | Pages | Description |
|--------|-------|-------------|
| Dashboard | 1 | Vue d'ensemble production/ventes/stock |
| Boulangerie | ~12 | Stock, Production, Pousse, Fours, Qualite, Ventes, Maintenance |
| Recettes | ~4 | Categories, Recettes, Ingredients, Versions |
| Tracabilite | ~3 | Lots, HACCP, Temperature |
| Point de Vente | ~3 | Sessions, Ventes comptoir, Cloture |
| Inventaire | ~4 | Articles, Mouvements, Ajustements |
| Finance | ~6 | Comptes, Ecritures, Factures, Paiements |
| RH | ~4 | Employes, Conges, Presence |
| Parametres | ~3 | Organisation, Utilisateurs, Roles |
| Auth | ~2 | Login, Register |

### State Management

- **Zustand**: Etat global (auth, theme, langue)
- **TanStack Query**: Cache serveur, synchronisation API
- **React Context**: i18n (LanguageContext), Theming (ThemeContext)

---

## Base de Donnees

### Cloudflare D1 (SQLite)

- **ORM**: Drizzle ORM
- **Schemas**: 12 fichiers de schema
- **Tables**: ~44 tables bakery + ~30 tables support (users, finance, inventory, hr, etc.)
- **Multi-tenancy**: `organization_id` sur chaque table principale
- **Conventions**: UUID primary keys, timestamps `created_at`/`updated_at`

Voir `docs/DATABASE.md` pour le schema complet.

---

## Authentification & Securite

### JWT Authentication

- **Access Token**: JWT signe, expire en 24h
- **Refresh Token**: JWT signe, expire en 7 jours
- **Stockage**: Access token en memoire, refresh token en KV

### Securite

| Mesure | Implementation |
|--------|---------------|
| Password hashing | bcryptjs (salt rounds: 10) |
| CSRF | Token CSRF sur mutations |
| Rate limiting | KV-based (5 login/15min, 100 req/min) |
| CORS | Whitelist origines autorisees |
| Input validation | Zod schemas sur chaque endpoint |
| RBAC | Roles (owner, admin, manager, member, viewer) |

### Matrice des Roles (Bakery)

| Module | Gerant | Boulanger | Vendeur | Livreur |
|--------|--------|-----------|---------|---------|
| Dashboard | Complet | Production | Ventes | Limite |
| Stock | CRUD | Lecture/Mouv | Lecture | -- |
| Production | CRUD | CRUD | -- | -- |
| Ventes | CRUD | -- | CRUD | Livraisons |
| Maintenance | CRUD | Lecture | -- | -- |
| Rapports | Tous | Production | Ventes | -- |
| Configuration | Oui | -- | -- | -- |

---

## Integrations

### Marche Tunisien

| Integration | Statut | Description |
|------------|--------|-------------|
| Paiement | Prevu | Flouci, Konnect (paiement mobile TND) |
| SMS | Prevu | Ooredoo, Tunisie Telecom (notifications) |
| Shipping | Prevu | Aramex, Tunisie Poste (livraisons) |
| Comptable | Actif | Export CSV/Excel, formats Sage/Ciel |

### Notifications

- Email: alertes stock minimum, rapports automatiques, confirmations commandes
- WhatsApp (futur): alertes critiques, notifications livreur

---

## Patterns et Conventions

### API

- Routes Hono dans `routes/`, logique dans `services/`, validation Zod
- Format erreur: `{ error: { code, message } }` avec status HTTP standard
- IDs: UUID v4 (`crypto.randomUUID()`)
- Dates: objets `Date` natifs

### Frontend

- Pages dans `pages/`, composants dans `components/`, hooks dans `hooks/`
- Variante bakery via `VITE_APP_VARIANT=perfex-bakery`
- Couleur primaire: Ambre/Orange (#F59E0B)

### Database

- Drizzle ORM, schemas dans `packages/database/src/schema/`
- Prefix `bakery_` pour toutes les tables du module boulangerie
- Multi-tenancy via `organization_id`
