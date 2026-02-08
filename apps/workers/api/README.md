# Perfex API Worker

API backend pour Perfex ERP AI-Native, déployé sur Cloudflare Workers avec Hono.js.

## 🏗️ Architecture

- **Runtime**: Cloudflare Workers
- **Framework**: Hono.js
- **Database**: Cloudflare D1 (SQLite)
- **ORM**: Drizzle ORM
- **Storage**: KV (cache, sessions), R2 (files), Vectorize (embeddings)
- **Language**: TypeScript

## 📦 Stack

- `hono` - Fast web framework for edge
- `drizzle-orm` - Type-safe ORM
- `bcryptjs` - Password hashing
- `jsonwebtoken` - JWT authentication
- `zod` - Runtime validation

## 🚀 Démarrage

### Installation

```bash
pnpm install
```

### Configuration

1. **Cloudflare Resources** (déjà créés):
   - D1 Database: `perfex-db`
   - KV: `CACHE`, `SESSIONS`
   - Vectorize: `perfex-vectors`
   - Queue: `perfex-jobs`

2. **Secrets**:
```bash
# JWT Secret
wrangler secret put JWT_SECRET
# Entrer: HxPErEGceXFAl4ArKdMKzfhDKRcgxScS1FNRHwXVkhY=
```

3. **Database Migration**:
```bash
# Local
wrangler d1 migrations apply perfex-db --local

# Production
wrangler d1 migrations apply perfex-db --remote
```

### Développement

```bash
# Démarrer le serveur de dev
pnpm dev

# L'API sera disponible sur http://localhost:8787
```

### Tests

```bash
# Lancer les tests
pnpm test

# Avec coverage
pnpm test:coverage
```

### Déploiement

```bash
# Staging
pnpm deploy:staging

# Production
pnpm deploy
```

## 📚 API Endpoints

### Health Check

```
GET /
GET /api/v1/health
```

### Authentication

#### Register
```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe",
  "organizationName": "Acme Corp" // optional
}
```

#### Login
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

Response:
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    ...
  },
  "tokens": {
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc..."
  }
}
```

#### Refresh Token
```http
POST /api/v1/auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGc..."
}
```

#### Logout
```http
POST /api/v1/auth/logout
Content-Type: application/json

{
  "refreshToken": "eyJhbGc..."
}
```

#### Get Profile
```http
GET /api/v1/auth/me
Authorization: Bearer {accessToken}
```

#### Update Profile
```http
PUT /api/v1/auth/me
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "firstName": "Jane",
  "lastName": "Smith",
  "avatarUrl": "https://..."
}
```

#### Forgot Password
```http
POST /api/v1/auth/forgot-password
Content-Type: application/json

{
  "email": "user@example.com"
}
```

#### Reset Password
```http
POST /api/v1/auth/reset-password
Content-Type: application/json

{
  "token": "reset-token-from-email",
  "newPassword": "NewSecurePass123!"
}
```

## 🔒 Sécurité

### Password Requirements
- Minimum 8 caractères
- Au moins 1 majuscule
- Au moins 1 chiffre
- Au moins 1 caractère spécial

### Rate Limiting
- **Login**: 5 tentatives / 15 minutes
- **Register**: 3 tentatives / heure
- **Password Reset**: 3 tentatives / heure
- **API Auth**: 100 requêtes / minute
- **API Public**: 30 requêtes / minute

### JWT Tokens
- **Access Token**: 15 minutes
- **Refresh Token**: 7 jours

## 🧪 Tests

Les tests couvrent:
- ✅ Utilitaires crypto (hashing, JWT)
- ✅ Rate limiting
- ✅ AuthService
- ✅ Routes API

Coverage cible: **80%+**

## 📁 Structure

```
src/
├── index.ts                    # Entry point Hono.js
├── types.ts                    # Types globaux
├── openapi.ts                  # Documentation OpenAPI
│
├── middleware/
│   ├── auth.ts                 # JWT middleware
│   ├── csrf.ts                 # Protection CSRF
│   └── healthcare-auth.ts      # Auth spécifique santé
│
├── routes/
│   ├── auth.ts                 # Authentification
│   ├── accounts.ts             # Plan comptable
│   ├── invoices.ts             # Factures
│   ├── companies.ts            # Entreprises
│   ├── contacts.ts             # Contacts
│   ├── hr.ts                   # Ressources humaines
│   ├── inventory.ts            # Inventaire
│   ├── manufacturing.ts        # Production
│   ├── projects.ts             # Projets
│   ├── procurement.ts          # Achats
│   ├── sales.ts                # Ventes
│   ├── assets.ts               # Actifs
│   ├── workflows.ts            # Workflows
│   ├── documents.ts            # Documents
│   ├── notifications.ts        # Notifications
│   ├── audit.ts                # Audit
│   ├── ai.ts                   # Intelligence Artificielle
│   │
│   │   # --- MODULES HEALTHCARE ---
│   ├── dialyse.ts              # Dialyse (86KB, 150+ endpoints)
│   ├── cardiology.ts           # Cardiologie (93KB)
│   ├── ophthalmology.ts        # Ophtalmologie
│   ├── clinical-ai.ts          # IA clinique
│   ├── imaging-ai.ts           # IA imagerie
│   ├── rpm.ts                  # Remote Patient Monitoring
│   ├── patient-portal.ts       # Portail patient
│   ├── population-health.ts    # Santé populationnelle
│   ├── fhir.ts                 # Interopérabilité FHIR
│   ├── cdss.ts                 # Aide décision clinique
│   ├── healthcare-analytics.ts # Analytics santé
│   ├── healthcare-calculators.ts # Calculateurs médicaux
│   ├── healthcare-factory.ts   # Factory healthcare
│   └── healthcare-integrations.ts # Intégrations santé
│
├── services/
│   ├── auth.service.ts         # Authentification
│   ├── account.service.ts      # Comptes
│   ├── ai.service.ts           # IA générique
│   ├── audit.service.ts        # Audit
│   ├── cache.service.ts        # Cache
│   │
│   │   # --- SERVICES HEALTHCARE ---
│   ├── dialyse/
│   │   ├── patient.service.ts
│   │   ├── session.service.ts
│   │   ├── machine.service.ts
│   │   ├── lab.service.ts
│   │   ├── alert.service.ts
│   │   ├── scheduling.service.ts
│   │   └── ktv.calculator.ts   # Calcul Kt/V
│   │
│   ├── cardiology/
│   │   ├── risk-score.service.ts
│   │   ├── risk.calculator.ts
│   │   └── workflow.service.ts
│   │
│   ├── ophthalmology/
│   │   ├── iol.calculator.ts
│   │   └── surgery-workflow.service.ts
│   │
│   ├── clinical-ai/
│   │   └── healthcare-ai.service.ts
│   │
│   ├── imaging-ai/
│   │   ├── ecg-analysis.service.ts
│   │   ├── echo-analysis.service.ts
│   │   ├── oct-analysis.service.ts
│   │   └── imaging.service.ts
│   │
│   ├── rpm/
│   │   ├── device.service.ts
│   │   ├── reading.service.ts
│   │   ├── program.service.ts
│   │   └── compliance.service.ts
│   │
│   ├── patient-portal/
│   │   ├── portal.service.ts
│   │   └── portal-auth.service.ts
│   │
│   ├── population-health/
│   │   ├── cohort.service.ts
│   │   ├── quality-indicators.service.ts
│   │   └── risk-score.service.ts
│   │
│   ├── fhir/
│   │   └── fhir.service.ts
│   │
│   ├── cdss/
│   │   ├── cdss.service.ts
│   │   ├── clinical-protocols.service.ts
│   │   └── drug-interactions.service.ts
│   │
│   └── ... (autres services)
│
├── docs/
│   └── openapi.ts              # Spécification OpenAPI
│
├── __tests__/
│   ├── setup.ts
│   └── mocks/
│       ├── database.mock.ts
│       ├── fixtures.ts
│       └── hono.mock.ts
│
└── utils/
    ├── crypto.ts               # Hashing & JWT
    ├── email.ts                # Envoi emails
    ├── validation.ts           # Validation Zod
    ├── response.ts             # Réponses standardisées
    ├── monitoring.ts           # Monitoring
    └── soft-delete.ts          # Suppression logique
```

## 🔧 Développement

### Ajouter une nouvelle route

1. Créer le fichier dans `src/routes/`
2. Monter dans `src/index.ts`:
```typescript
import myRoutes from './routes/my-routes';
apiV1.route('/my-endpoint', myRoutes);
```

### Ajouter une migration

```bash
cd packages/database
pnpm generate
wrangler d1 migrations apply perfex-db --local
```

## 📝 Variables d'environnement

Définies dans `wrangler.toml`:
- `ENVIRONMENT`: development | staging | production
- `LOG_LEVEL`: debug | info | warn | error

## 🐛 Debugging

```bash
# Logs en temps réel
wrangler tail

# Logs avec filtres
wrangler tail --format pretty
```

## 📊 Monitoring

- Cloudflare Dashboard: https://dash.cloudflare.com/
- Workers Analytics
- D1 Analytics
- KV Analytics

## 🚀 Performance

- Cold start: ~10ms
- Request latency: ~50ms (median)
- Global edge deployment
- Auto-scaling

## 🏥 Modules Healthcare

L'API inclut des modules spécialisés pour le secteur de la santé :

### Dialyse (`/api/v1/dialyse`)
- Gestion des patients dialysés
- Planification des séances
- Suivi des machines
- Résultats laboratoire
- Calcul Kt/V automatique

### Cardiologie (`/api/v1/cardiology`)
- Score de Framingham
- Score SCORE2
- CHA2DS2-VASc
- Gestion ECG/Echo

### Ophtalmologie (`/api/v1/ophthalmology`)
- Calculateur IOL
- Analyse OCT
- Workflow chirurgical

### IA Clinique (`/api/v1/clinical-ai`)
- Assistant diagnostic
- Résumés patients
- CDSS

### IA Imagerie (`/api/v1/imaging-ai`)
- Analyse ECG
- Analyse échocardiogramme
- Analyse OCT

### RPM (`/api/v1/rpm`)
- Appareils connectés
- Collecte mesures
- Programmes de suivi
- Compliance patient

### Portail Patient (`/api/v1/patient-portal`)
- Authentification patient
- Messagerie sécurisée
- Prise de rendez-vous
- Suivi symptômes

### Santé Populationnelle (`/api/v1/population-health`)
- Gestion cohortes
- Indicateurs qualité
- Stratification risques

### FHIR (`/api/v1/fhir`)
- API FHIR R4
- Ressources Patient, Observation, etc.

Pour plus de détails, voir [docs/HEALTHCARE.md](../../../docs/HEALTHCARE.md).

## 📖 Documentation

- [Architecture](../../../docs/ARCHITECTURE.md)
- [Healthcare](../../../docs/HEALTHCARE.md)
- [Database](../../../docs/DATABASE.md)
- [Hono.js Docs](https://hono.dev/)
- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [Drizzle ORM Docs](https://orm.drizzle.team/)

## 🤝 Contribution

Voir [CONTRIBUTING.md](../../../CONTRIBUTING.md)

## 📄 License

Proprietary - Perfex ERP

---

**Dernière mise à jour** : Février 2025
