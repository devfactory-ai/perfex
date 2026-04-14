# BRIEF.md - Perfex Bakery ERP

## Identite du projet

- **Nom** : Perfex Bakery
- **Description** : Solution complete de gestion pour boulangeries-patisseries
- **Auteur** : Yassine Techini <yassine.techini@devfactory.ai>
- **Version** : 0.1.0
- **Licence** : UNLICENSED (proprietaire)

## Stack technique

| Couche       | Technologie                                         |
|-------------|-----------------------------------------------------|
| Frontend    | React 18, Vite 6, TypeScript 5.7, TailwindCSS 3.4  |
| State       | Zustand 5, React Query 5, React Hook Form 7         |
| Backend     | Hono.js 4.7 sur Cloudflare Workers                  |
| Database    | Cloudflare D1 (SQLite), Drizzle ORM 0.37            |
| Cache/KV    | Cloudflare KV (sessions, cache, rate-limit)          |
| Auth        | JWT (jsonwebtoken), bcryptjs, CSRF tokens            |
| Monorepo    | pnpm 10 workspaces, Turborepo                        |
| CI/CD       | GitHub Actions -> Cloudflare Workers/Pages            |
| i18n        | i18next, react-i18next (FR, EN, AR)                  |

## Architecture monorepo

```
perfex/
  apps/
    web/              # Frontend React SPA (Vite + TailwindCSS)
    workers/
      api/            # API Hono.js (Cloudflare Workers)
  packages/
    shared/           # Types partages + validateurs Zod
    database/         # Schemas Drizzle + migrations D1
    integrations/     # Connecteurs: paiement, SMS, shipping (Tunisie)
  perfex-vitrine/     # Site vitrine boulangerie (sous-repo git)
```

## Modules fonctionnels

### Bakery (module principal)
- **Stock** : Articles (matieres premieres), mouvements, inventaires, alertes, commandes fournisseurs, PUMP
- **Production** : Chambres de pousse, fours, controle qualite, defauts, comparaisons theorique/reel, energie
- **Maintenance (CMMS)** : Equipements, interventions, plans preventifs, pieces detachees, KPIs (MTBF, MTTR)
- **Ventes** : Clients B2B, commandes livraison, bons de livraison, points de vente, sessions POS
- **Reporting** : Rapports quotidiens/mensuels, exports comptables (Sage, Ciel, CSV, Excel)
- **Finance** : Dashboard P&L, calcul cout de revient par recette, facturation auto depuis BL, ecritures POS

### Recettes
- CRUD, scaling, allergenes (14 types EU), versioning, HACCP integration
- Compositions avec cout automatique (PUMP des articles)

### Tracabilite
- Lots (matieres premieres, semi-finis, finis), mouvements
- HACCP (points de controle critiques, registres, temperature)
- Rappels produits, registres de nettoyage

### POS (Caisse)
- Sessions de vente (matin/apres-midi), stock par produit
- Revenu calcule vs declare, variance, passation d'equipe

### Core ERP
- **Finance** : Comptabilite (plan comptable), factures, paiements, journaux, rapports
- **Inventaire** : Articles, entrepots, mouvements de stock
- **RH** : Employes, conges, pointage
- **Auth** : JWT (access 24h + refresh 7j), CSRF, rate-limiting, 2FA (pret mais non branche)

### Integrations (marche tunisien)
- Paiement : D17, Flouci, Konnect, Paymee
- SMS : Ooredoo, Tunisie Telecom
- Shipping : Aramex (SOAP), Livrili (REST)
- Fiscal : CNSS

## Statistiques du code (post-nettoyage)

| Metrique               | Valeur |
|------------------------|--------|
| Routes API              | 19    |
| Services API            | ~25   |
| Pages frontend          | ~44   |
| Schemas DB              | 12    |
| Tables DB bakery        | 44    |
| Fichiers de tests       | ~20   |

## Deploiement

- **API** : Cloudflare Workers (wrangler deploy)
- **Frontend** : Cloudflare Pages
- **DB** : Cloudflare D1 (3 instances: dev, staging, prod)
- **Build** : `VITE_APP_VARIANT=perfex-bakery pnpm build`
- **Environnements** : dev, staging, production
