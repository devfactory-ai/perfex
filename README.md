# Perfex Bakery

> Solution complete de gestion pour boulangeries-patisseries, deployee sur le reseau edge Cloudflare

[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3-blue.svg)](https://reactjs.org/)
[![Hono](https://img.shields.io/badge/Hono-4.6-orange.svg)](https://hono.dev/)
[![Cloudflare](https://img.shields.io/badge/Cloudflare-Workers-orange.svg)](https://workers.cloudflare.com/)

## Presentation

Perfex Bakery est une application de gestion complete pour les boulangeries et patisseries. Elle couvre l'ensemble des besoins operationnels : production, ventes, stock, maintenance, recettes, tracabilite, point de vente, inventaire, ressources humaines et finance.

## Modules

| Module | Description |
|--------|-------------|
| **Production** | Planification des fournees, ordres de production, suivi des lots |
| **Ventes & POS** | Point de vente, commandes clients, P&L, marges |
| **Stock & Inventaire** | Gestion des matieres premieres, mouvements de stock, alertes seuils |
| **Recettes** | Fiches techniques, cout de revient, nomenclatures |
| **Tracabilite** | Suivi des lots, DLUO/DLC, conformite HACCP |
| **Maintenance** | Equipements (fours, petrins), planification maintenance |
| **Qualite** | Controles qualite, indicateurs, audits |
| **RH** | Employes, conges, presences, departements |
| **Finance** | Comptabilite, factures, paiements, rapports financiers |
| **Core** | Auth, organisations, multi-tenancy, audit trail |

## Quick Start

```bash
# Cloner le depot
git clone https://github.com/devfactory/perfex.git
cd perfex

# Installer les dependances
pnpm install

# Lancer les migrations locales
pnpm db:migrate:local

# Demarrer en mode bakery
cd apps/web && VITE_APP_VARIANT=perfex-bakery pnpm dev
# Dans un autre terminal :
cd apps/workers/api && pnpm dev
```

- Frontend : http://localhost:5173
- API : http://localhost:8787

## Architecture

```
perfex/
├── apps/
│   ├── web/                  # SPA React 18 + Vite + TailwindCSS
│   └── workers/api/          # API REST Hono.js (Cloudflare Workers)
├── packages/
│   ├── database/             # Schemas Drizzle ORM + migrations (D1)
│   ├── shared/               # Types TypeScript + validateurs Zod
│   ├── ai-core/              # Client Workers AI + prompts
│   └── integrations/         # Connecteurs tiers (paiement, SMS)
```

## Stack Technique

| Couche | Technologie |
|--------|-------------|
| Frontend | React 18, Vite 6, TailwindCSS 3.4, Zustand, TanStack Query |
| Backend | Cloudflare Workers, Hono.js 4.6, JWT, RBAC |
| Base de donnees | Cloudflare D1 (SQLite), Drizzle ORM |
| Validation | Zod (partage front/back) |
| Infra | Cloudflare Workers, Pages, KV, D1 |

## Developpement

```bash
pnpm install              # Installer les dependances
pnpm build                # Build tous les packages
pnpm test                 # Lancer les tests
pnpm type-check           # Verification TypeScript
pnpm lint                 # ESLint
pnpm format               # Prettier
pnpm db:generate          # Generer une migration
pnpm db:migrate:local     # Appliquer les migrations localement
```

## Deploiement

```bash
# API
cd apps/workers/api && pnpm deploy

# Frontend
cd apps/web && pnpm build && wrangler pages deploy dist
```

Voir [DEPLOYMENT.md](./DEPLOYMENT.md) pour le guide complet.

## Contribuer

1. Creer une branche feature (`git checkout -b feature/ma-feature`)
2. Committer (`git commit -m 'feat: ajout de ma feature'`)
3. Pousser (`git push origin feature/ma-feature`)
4. Ouvrir une Pull Request

Convention de commits : [Conventional Commits](https://www.conventionalcommits.org/)

## Licence

Proprietary - All rights reserved

---

**Perfex Bakery** | Version 2.0.0
