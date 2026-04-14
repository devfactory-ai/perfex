# Perfex Bakery - Resume du Projet

## Statut : EN PRODUCTION

## Statistiques

| Metrique | Valeur |
|----------|--------|
| Tables DB | ~44 (bakery + core) |
| Migrations | 35 |
| Routes API | 19 fichiers de routes |
| Services backend | 10+ classes de services |
| Pages frontend | 15+ pages React |
| Couverture TypeScript | 100% |
| Base de donnees | Cloudflare D1 (SQLite) |
| Multi-tenancy | Isolation par organisation |

## Modules

### Modules Bakery (6)

1. **Production** - Ordres de production, lots, fournees, planification
2. **Ventes & POS** - Point de vente, commandes, P&L, marges par produit
3. **Stock & Inventaire** - Matieres premieres, mouvements, seuils d'alerte
4. **Recettes** - Fiches techniques, nomenclatures, cout de revient
5. **Maintenance** - Equipements (fours, petrins, vitrines), planning maintenance
6. **Qualite** - Controles HACCP, indicateurs qualite, audits

### Modules Core (4)

1. **Auth & Organisations** - JWT, RBAC, multi-tenancy, gestion des membres
2. **RH** - Employes, departements, conges, presences
3. **Finance** - Comptabilite, factures, paiements, P&L
4. **Notifications & Audit** - Alertes, audit trail, parametres systeme

## Structure du Depot

```
perfex/
├── apps/
│   ├── web/                  # Frontend React (Vite 6)
│   └── workers/api/          # API Hono.js (Cloudflare Workers)
├── packages/
│   ├── database/             # Schemas Drizzle + migrations
│   ├── shared/               # Types + validateurs partages
│   ├── ai-core/              # Workers AI
│   └── integrations/         # Connecteurs tiers
```

## Securite

- Authentification JWT (access 24h + refresh 7j)
- RBAC avec permissions granulaires par module
- Multi-tenancy avec isolation par `organizationId`
- Audit trail complet
- Rate limiting via KV
- Validation Zod sur toutes les entrees

## Demarrage Rapide

```bash
git clone https://github.com/devfactory/perfex.git
cd perfex && pnpm install
pnpm db:migrate:local
VITE_APP_VARIANT=perfex-bakery pnpm dev
```

- Frontend : http://localhost:5173
- API : http://localhost:8787

---

**Derniere mise a jour** : Avril 2026
