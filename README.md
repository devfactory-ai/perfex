# Perfex ERP Healthcare

> A modern, cloud-native Enterprise Resource Planning system built on Cloudflare's edge network, with comprehensive Healthcare modules

[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3-blue.svg)](https://reactjs.org/)
[![Hono](https://img.shields.io/badge/Hono-4.6-orange.svg)](https://hono.dev/)
[![Cloudflare](https://img.shields.io/badge/Cloudflare-Workers-orange.svg)](https://workers.cloudflare.com/)

## Overview

Perfex ERP Healthcare est un système de gestion d'entreprise complet, conçu pour le secteur de la santé. Il combine des modules ERP classiques avec des fonctionnalités healthcare avancées.

### Fonctionnalités Clés

- **20+ Modules Complets** : ERP (Finance, CRM, RH, etc.) + Healthcare (Dialyse, Cardiologie, Ophtalmologie, etc.)
- **120+ Tables** : Modèle de données complet couvrant ERP et Healthcare
- **300+ Endpoints API** : API RESTful avec FHIR R4 pour l'interopérabilité
- **Edge Computing** : Déployé sur 300+ locations Cloudflare globalement
- **Type-Safe** : Couverture TypeScript complète frontend et backend
- **Sécurisé** : JWT, RBAC, multi-tenancy, audit trail, conformité HDS
- **Scalable** : 1000+ utilisateurs simultanés, 10M+ enregistrements par table

### Modules ERP

- Finance & Comptabilité
- CRM & Gestion Clients
- Projets & Time Tracking
- Inventaire & Stock
- Ressources Humaines
- Achats & Fournisseurs
- Ventes & Commandes
- Production & Manufacturing
- Actifs & Amortissements
- Documents & Workflows

### Modules Healthcare

- **Dialyse** : Gestion complète d'un centre d'hémodialyse
- **Cardiologie** : Scores de risque, ECG, Échocardiogrammes
- **Ophtalmologie** : Calcul IOL, OCT, Workflow chirurgical
- **IA Clinique** : Assistant diagnostic, résumés patients, CDSS
- **IA Imagerie** : Analyse automatisée ECG, Echo, OCT
- **RPM** : Monitoring à distance des patients
- **Portail Patient** : Accès patient sécurisé
- **Santé Populationnelle** : Cohortes, indicateurs qualité
- **FHIR R4** : Interopérabilité standards de santé

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and pnpm 8+
- Cloudflare account (for deployment)
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/devfactory/perfex.git
cd perfex

# Install dependencies
pnpm install

# Set up environment variables
cp apps/web/.env.example apps/web/.env
cp apps/workers/api/.env.example apps/workers/api/.env

# Run database migrations
pnpm --filter @perfex/database migrate:local

# Start development servers
pnpm dev
```

The application will be available at:
- Frontend: http://localhost:5173
- API: http://localhost:8787

## 📁 Project Structure

```
perfex/
├── apps/
│   ├── web/                    # React frontend application
│   │   ├── src/
│   │   │   ├── components/     # Reusable UI components
│   │   │   ├── pages/          # Page components
│   │   │   ├── hooks/          # Custom React hooks
│   │   │   ├── lib/            # Utilities and API client
│   │   │   └── store/          # Zustand stores
│   │   └── package.json
│   └── workers/
│       └── api/                # Hono.js API worker
│           ├── src/
│           │   ├── routes/     # API route handlers
│           │   ├── services/   # Business logic services
│           │   ├── middleware/ # Express-style middleware
│           │   └── db/         # Database connection
│           └── package.json
├── packages/
│   ├── database/               # Database schemas and migrations
│   │   ├── src/
│   │   │   └── schema/         # Drizzle ORM schemas
│   │   ├── migrations/         # SQL migrations
│   │   └── drizzle.config.ts
│   └── shared/                 # Shared types and validators
│       ├── src/
│       │   ├── types/          # TypeScript interfaces
│       │   └── validators/     # Zod validation schemas
│       └── package.json
├── SYSTEM_OVERVIEW.md          # Comprehensive technical documentation
├── pnpm-workspace.yaml         # Monorepo configuration
└── README.md                   # This file
```

## 🏗️ Architecture

### Technology Stack

**Frontend**
- React 18.3 + TypeScript 5.7
- Vite 6 (build tool)
- TanStack Query 5 (server state)
- Zustand 5 (client state)
- React Hook Form 7 + Zod (forms & validation)
- TailwindCSS 3.4 (styling)
- React Router 7 (routing)

**Backend**
- Cloudflare Workers (serverless edge runtime)
- Hono.js 4.6 (web framework)
- Drizzle ORM (type-safe database)
- Cloudflare D1 (SQLite database)
- JWT authentication
- Role-Based Access Control (RBAC)

**Infrastructure**
- Cloudflare Workers (compute)
- Cloudflare D1 (database)
- Cloudflare KV (cache/sessions)
- Cloudflare CDN (static assets)

### Architecture Diagram

```
┌─────────────────────────────────────────┐
│           Cloudflare Edge               │
│  (300+ locations worldwide)             │
└────────────┬────────────────────────────┘
             │
    ┌────────┴────────┐
    │                 │
┌───▼──────┐    ┌─────▼────┐
│   API    │    │   Web    │
│  Worker  │    │   App    │
│ (Hono.js)│    │ (React)  │
└───┬──────┘    └──────────┘
    │
    ├──────┬──────┬────────┐
    │      │      │        │
┌───▼──┐ ┌▼──┐ ┌─▼─┐  ┌───▼───┐
│  D1  │ │KV │ │R2 │  │ Cache │
│  DB  │ │   │ │   │  │       │
└──────┘ └───┘ └───┘  └───────┘
```

## Modules Healthcare

### Dialyse
Gestion complète d'un centre d'hémodialyse avec suivi des patients, séances, machines et résultats de laboratoire.

**Fonctionnalités** : Patients dialysés, Planification séances, Gestion machines, Résultats labo, Alertes cliniques, Calcul Kt/V

### Cardiologie
Évaluation du risque cardiovasculaire et suivi cardiologique complet.

**Fonctionnalités** : Score Framingham, SCORE2, CHA2DS2-VASc, ECG, Échocardiogrammes, Workflow cardiologique

### Ophtalmologie
Gestion des patients ophtalmologiques avec calculs spécialisés.

**Fonctionnalités** : Calcul IOL (SRK/T, Haigis, Barrett), Analyse OCT, Workflow chirurgical, Suivi post-op

### IA Clinique
Intelligence artificielle pour l'aide au diagnostic et à la documentation.

**Fonctionnalités** : Assistant diagnostic, Résumés patients automatiques, NLP médical, CDSS

### IA Imagerie
Analyse automatisée des images médicales.

**Fonctionnalités** : Analyse ECG, Analyse échocardiogramme, Analyse OCT, Détection d'anomalies

### RPM (Remote Patient Monitoring)
Suivi à distance des patients via appareils connectés.

**Fonctionnalités** : Gestion appareils, Collecte mesures, Programmes de suivi, Alertes, Compliance

### Portail Patient
Accès sécurisé pour les patients à leur dossier médical.

**Fonctionnalités** : Authentification, Messagerie sécurisée, Prise RDV, Suivi symptômes, Résultats

### Santé Populationnelle
Outils pour la santé publique et la gestion de cohortes.

**Fonctionnalités** : Gestion cohortes, Indicateurs qualité (HAS, ROSP), Stratification risques, Analytics

### FHIR R4
Interopérabilité avec les standards de santé.

**Fonctionnalités** : API FHIR R4, Ressources (Patient, Observation, etc.), Bundles, Search

---

## Modules ERP

### 1. Finance & Accounting
Gestion financière complète avec comptabilité en partie double, multi-devises, facturation et reporting.

### 2. CRM
Gestion de la relation client, pipeline de ventes et opportunités.

### 3. Projects
Gestion de projets avec tâches, jalons et suivi du temps.

### 4. Inventory
Gestion multi-entrepôts avec mouvements de stock et valorisation.

### 5. Human Resources
Gestion des employés, congés et présences.

### 6. Procurement
Cycle complet d'achat avec gestion fournisseurs.

### 7. Sales
Processus devis-à-encaissement avec gestion des commandes.

### 8. Manufacturing
Planification et exécution de production avec BOM et gammes.

### 9. Asset Management
Registre des actifs avec amortissement et maintenance.

### 10. Notifications & Audit
Notifications système et piste d'audit complète.

### 11. Documents & Reporting
Gestion documentaire avec versioning et générateur de rapports.

### 12. Workflows & Integration
Automatisation des processus métier avec approbations et intégrations.

## 🛠️ Development

### Available Scripts

```bash
# Development
pnpm dev                    # Start all development servers
pnpm --filter @perfex/web dev       # Frontend only
pnpm --filter @perfex/api dev       # API only

# Building
pnpm build                  # Build all packages
pnpm --filter @perfex/web build     # Build frontend
pnpm --filter @perfex/api build     # Build API

# Database
pnpm --filter @perfex/database generate       # Generate migration
pnpm --filter @perfex/database migrate:local  # Apply locally
pnpm --filter @perfex/database migrate:remote # Apply to production

# Testing
pnpm test                   # Run all tests
pnpm test:unit             # Unit tests
pnpm test:integration      # Integration tests
pnpm test:e2e              # End-to-end tests

# Code Quality
pnpm lint                   # Run ESLint
pnpm format                 # Format with Prettier
pnpm type-check            # TypeScript type checking

# Deployment
pnpm --filter @perfex/api deploy    # Deploy API to Cloudflare
pnpm --filter @perfex/web deploy    # Deploy frontend
```

### Environment Variables

**Frontend (`apps/web/.env`)**
```env
VITE_API_URL=http://localhost:8787/api/v1
VITE_APP_NAME=Perfex ERP
```

**API (`apps/workers/api/.env`)**
```env
ENVIRONMENT=development
JWT_ACCESS_SECRET=your-access-secret
JWT_REFRESH_SECRET=your-refresh-secret
```

### Creating a New Module

1. **Create Database Schema**
   ```typescript
   // packages/database/src/schema/my-module.ts
   export const myTable = sqliteTable('my_table', {
     id: text('id').primaryKey(),
     organizationId: text('organization_id').notNull(),
     // ... other fields
   });
   ```

2. **Generate Migration**
   ```bash
   pnpm --filter @perfex/database generate
   ```

3. **Create Types & Validators**
   ```typescript
   // packages/shared/src/types/my-module.ts
   // packages/shared/src/validators/my-module.ts
   ```

4. **Create Service**
   ```typescript
   // apps/workers/api/src/services/my-module.service.ts
   ```

5. **Create API Routes**
   ```typescript
   // apps/workers/api/src/routes/my-module.ts
   ```

6. **Create Frontend Page**
   ```typescript
   // apps/web/src/pages/my-module/MyModulePage.tsx
   ```

## 🔐 Security

### Authentication
- JWT tokens (access + refresh)
- Secure token storage
- Token rotation
- Password hashing

### Authorization
- Role-Based Access Control (RBAC)
- Granular permissions per module
- Organization-level isolation
- API key authentication

### Data Protection
- Multi-tenancy with row-level security
- Audit logging for all operations
- Document access control
- IP whitelisting for API keys
- Rate limiting

## 🧪 Testing

### Running Tests

```bash
# Unit tests
pnpm test:unit

# Integration tests
pnpm test:integration

# E2E tests
pnpm test:e2e

# Coverage report
pnpm test:coverage
```

### Test Structure

```
tests/
├── unit/
│   ├── services/
│   └── utils/
├── integration/
│   └── api/
└── e2e/
    └── flows/
```

## 📊 Performance

### Benchmarks
- Authentication: < 100ms (P95)
- Simple queries: < 50ms (P95)
- Complex reports: < 500ms (P95)
- Global edge latency: < 50ms

### Scalability
- 1000+ concurrent users
- 10,000+ requests/minute
- 10M+ records per table
- 99.9% uptime SLA

## 🚢 Deployment

### Cloudflare Workers

```bash
# Login to Cloudflare
wrangler login

# Deploy API
cd apps/workers/api
pnpm deploy

# Deploy frontend to Cloudflare Pages
cd apps/web
pnpm build
wrangler pages deploy dist
```

### Environment Configuration

1. Set up D1 database
2. Configure environment variables in Cloudflare dashboard
3. Set up KV namespaces for sessions
4. Configure custom domain
5. Enable Cloudflare CDN

### CI/CD

GitHub Actions workflow (`.github/workflows/deploy.yml`):
```yaml
- Lint and type-check
- Run tests
- Build packages
- Deploy to staging
- Run smoke tests
- Deploy to production
```

## Documentation

- [Architecture](./docs/ARCHITECTURE.md) - Architecture technique détaillée
- [Healthcare](./docs/HEALTHCARE.md) - Documentation modules santé
- [Database](./docs/DATABASE.md) - Schémas de base de données
- [Deployment](./docs/DEPLOYMENT.md) - Guide de déploiement
- [System Overview](./SYSTEM_OVERVIEW.md) - Vue d'ensemble technique
- [API Backend](./apps/workers/api/README.md) - Documentation API
- [Frontend Web](./apps/web/README.md) - Documentation frontend
- [Database Package](./packages/database/README.md) - Documentation database

## 🤝 Contributing

We welcome contributions! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Commit Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):
- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation changes
- `refactor:` - Code refactoring
- `test:` - Test additions or changes
- `chore:` - Build process or auxiliary tool changes

## 📝 License

Proprietary - All rights reserved

## 🙏 Acknowledgments

Built with amazing open-source technologies:
- [React](https://reactjs.org/)
- [Hono.js](https://hono.dev/)
- [Drizzle ORM](https://orm.drizzle.team/)
- [TanStack Query](https://tanstack.com/query)
- [TailwindCSS](https://tailwindcss.com/)
- [Cloudflare Workers](https://workers.cloudflare.com/)

## 📞 Support

For support, email support@perfex.com or open an issue on GitHub.

## 🗺️ Roadmap

### Q1 2025
- [ ] Mobile application (React Native)
- [ ] Advanced analytics dashboard
- [ ] GraphQL API
- [ ] Multi-language support (i18n)

### Q2 2025
- [ ] Real-time collaboration
- [ ] Advanced workflow builder (visual)
- [ ] AI-powered insights
- [ ] Integration marketplace

### Q3 2025
- [ ] Offline mode (PWA)
- [ ] Advanced reporting (BI integration)
- [ ] Custom app builder
- [ ] White-label support

---

**Made with care by the Perfex Team**

**Status**: Production Ready | **Version**: 2.0.0 | **Last Updated**: Février 2025
