# BRIEF.md - Perfex ERP AI-Native

## Identite du projet

- **Nom** : Perfex ERP AI-Native
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
| AI          | Cloudflare Workers AI                                |
| Auth        | JWT (jsonwebtoken), bcryptjs, CSRF tokens            |
| Monorepo    | pnpm 10 workspaces, Turborepo                        |
| CI/CD       | GitHub Actions -> Cloudflare Workers/Pages            |
| i18n        | i18next, react-i18next                               |

## Architecture monorepo

```
perfex/
  apps/
    web/              # Frontend React (Vite + TailwindCSS)
    workers/
      api/            # API Hono.js (Cloudflare Workers)
      ai/             # [A CONFIRMER] Worker AI dedie
      jobs/            # [A CONFIRMER] Worker jobs/queues
  packages/
    shared/           # Types partages + validateurs Zod
    database/         # Schemas Drizzle + migrations D1
    ai-core/          # Client AI + prompts
    dialyse-sdk/      # SDK client dialyse
    integrations/     # Connecteurs: paiement, SMS, shipping (Tunisie)
  perfex-vitrine/     # Site vitrine (sous-repo git separe)
```

## Modules fonctionnels

### ERP Core
- Finance (comptabilite, factures, paiements, journaux)
- CRM (contacts, entreprises, pipeline, opportunites)
- Projets (taches, jalons, feuilles de temps)
- Inventaire (articles, entrepots, mouvements de stock)
- RH (employes, conges, pointage)
- Approvisionnement (fournisseurs, bons de commande)
- Ventes (devis, commandes, bons de livraison)
- Production/Manufacturing (nomenclatures, ordres de fabrication)
- Actifs immobilises (categories, depreciations, maintenance)
- Paie (bulletins, cotisations sociales - systeme francais)

### Healthcare (Sante)
- Dialyse (patients, prescriptions, sessions, machines, alertes)
- Cardiologie (ECG, echocardiographies, pacemakers, scores de risque)
- Ophtalmologie (OCT, biometrie, IOL, chirurgies)
- IA Clinique (documentation, suggestions diagnostiques)
- Portail Patient (rendez-vous, messagerie, suivi symptomes)
- RPM - Monitoring Patient a Distance (IoT, compliance, alertes)
- IA Imagerie (analyse ECG, OCT, fond d'oeil, echo)
- Sante Populationnelle (cohortes, indicateurs qualite, IQSS)
- FHIR R4 (interoperabilite HL7)
- CDSS (aide a la decision clinique)

### Bakery (Boulangerie)
- Gestion de stock (articles, mouvements, inventaires, alertes)
- Production (chambres de pousse, fours, controle qualite)
- Maintenance (equipements, plans preventifs, pieces detachees)
- Ventes B2B (clients, commandes livraison, points de vente)
- Reporting (rapports quotidiens/mensuels, exports comptables)

### Transversal
- Audit intelligent (taches, constats, evaluations de risque, copilote)
- Workflows (moteur d'approbation, webhooks, cles API)
- Notifications
- Documents (GED, versionning, partage)
- AI Chat (recherche intelligente, extraction factures, insights)
- Tracabilite (lots, HACCP, rappels produits)
- Recettes (formulation, mise a l'echelle, allergenes)
- Multi-organisation, multi-tenant

## Statistiques du code

| Metrique               | Valeur |
|------------------------|--------|
| Fichiers sources TS/TSX | 567   |
| Routes API              | 49    |
| Services API            | 133   |
| Pages frontend          | 173   |
| Composants frontend     | 39    |
| Schemas DB              | 31    |
| Migrations SQL          | 35    |
| Fichiers de tests       | 14    |
| **Couverture de test**  | **~2.5%** |

## Deploiement

- **API** : Cloudflare Workers (wrangler deploy)
- **Frontend** : Cloudflare Pages
- **DB** : Cloudflare D1 (3 instances: dev, staging, prod)
- **Variantes de build** : `perfex-bakery`, `perfex-health` (via VITE_APP_VARIANT)
- **Environnements** : dev, staging (health), production

## Etat actuel

Le projet est en phase de **developpement actif** avec une base de code tres large couvrant de nombreux domaines metier (ERP, sante, boulangerie). La couverture de tests est tres faible (~2.5%). Plusieurs problemes de coherence existent entre les migrations, les types declares, et les bindings Cloudflare configures. Le CI/CD existe mais les versions Node/pnpm declarees dans le pipeline ne correspondent pas au package.json.
