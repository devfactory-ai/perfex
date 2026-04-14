# Perfex Bakery - Vue d'Ensemble Technique

## Architecture

### Stack Technique

**Backend :**
- Runtime : Cloudflare Workers (edge serverless)
- Framework : Hono.js 4.6
- Base de donnees : Cloudflare D1 (SQLite)
- ORM : Drizzle ORM (type-safe)
- Auth : JWT (access + refresh tokens)
- Autorisation : RBAC (role-based access control)

**Frontend :**
- Framework : React 18.3 + TypeScript 5.7
- Build : Vite 6
- State serveur : TanStack Query 5
- State client : Zustand 5
- Formulaires : React Hook Form 7 + Zod
- Styling : TailwindCSS 3.4
- Routing : React Router 7

**Partage :**
- Monorepo : pnpm workspaces + Turborepo
- Types et validateurs partages via `packages/shared`

### Diagramme

```
┌──────────────────────────┐
│    Cloudflare Edge       │
│  (300+ locations)        │
└───────────┬──────────────┘
            │
   ┌────────┴────────┐
   │                 │
┌──▼─────┐    ┌──────▼──┐
│  API   │    │  Web    │
│ Worker │    │  App    │
│(Hono)  │    │(React)  │
└──┬─────┘    └─────────┘
   │
   ├─────┬──────┐
   │     │      │
┌──▼──┐ ┌▼──┐ ┌─▼──┐
│ D1  │ │KV │ │CDN │
│ DB  │ │   │ │    │
└─────┘ └───┘ └────┘
```

## Modules Bakery

### Production
- Tables : `bakery_production_orders`, `bakery_production_lots`, etc.
- Planification des fournees, suivi des lots, consommation matieres
- API : `/api/v1/bakery/production`

### Ventes & POS
- Tables : `bakery_sales`, `bakery_sale_items`, etc.
- Point de vente, commandes clients, analyse P&L, marges par produit
- API : `/api/v1/bakery/sales`

### Stock & Inventaire
- Gestion des matieres premieres et produits finis
- Mouvements de stock, seuils d'alerte, valorisation
- API : `/api/v1/inventory`

### Recettes
- Fiches techniques avec nomenclatures (BOM)
- Calcul automatique du cout de revient
- Gammes de fabrication

### Maintenance
- Registre des equipements (fours, petrins, vitrines refrigerees)
- Planification de la maintenance preventive et curative
- API : `/api/v1/bakery/maintenance`

### Qualite
- Controles qualite HACCP
- Indicateurs et audits
- Tracabilite des lots (DLUO/DLC)
- API : `/api/v1/bakery/quality`

## Modules Core

### Auth & Organisations
- JWT (access 24h + refresh 7j)
- RBAC : admin, owner, manager, member, viewer
- Multi-tenancy : organisations -> membres -> entreprises
- API : `/api/v1/auth`, `/api/v1/organizations`

### RH
- Employes, departements, conges, presences
- API : `/api/v1/hr`

### Finance
- Comptabilite en partie double, factures, paiements
- Dashboard P&L bakery
- API : `/api/v1/accounts`, `/api/v1/invoices`, `/api/v1/payments`

### Notifications & Audit
- Notifications utilisateur, audit trail, parametres systeme
- API : `/api/v1/notifications`

## Securite

- Authentification JWT avec rotation des tokens
- RBAC avec permissions granulaires
- Multi-tenancy avec isolation par `organizationId`
- Validation Zod sur toutes les entrees
- Audit logging complet
- Rate limiting via Cloudflare KV
- Prevention SQL injection (ORM), XSS, CSRF

## Format des Reponses API

```json
{ "success": true, "data": { } }
{ "success": false, "error": { "code": "ERROR_CODE", "message": "..." } }
```

## Multi-tenancy

Toutes les tables incluent `organizationId`. Les requetes filtrent automatiquement par organisation.

## Performance

- Latence globale : < 50ms (edge)
- Requetes simples : < 50ms (P95)
- Rapports complexes : < 500ms (P95)

---

**Statut** : Production | **Version** : 2.0.0
