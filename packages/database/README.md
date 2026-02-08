# Perfex Database Package

Package de base de données pour Perfex ERP Healthcare utilisant Drizzle ORM et Cloudflare D1.

## Stack Technique

| Technologie | Description |
|-------------|-------------|
| Drizzle ORM | ORM TypeScript type-safe |
| Cloudflare D1 | Base de données SQLite edge |
| SQLite | Moteur de base de données |

## Structure

```
packages/database/
├── src/
│   └── schema/                  # Schémas Drizzle ORM
│       ├── index.ts             # Export de tous les schémas
│       │
│       │   # --- SCHÉMAS CORE ---
│       ├── users.ts             # Utilisateurs, Organisations, Rôles
│       ├── finance.ts           # Comptabilité, Factures, Paiements
│       ├── crm.ts               # CRM, Contacts, Opportunités
│       ├── hr.ts                # RH, Employés, Congés
│       ├── inventory.ts         # Inventaire, Stock, Entrepôts
│       ├── manufacturing.ts     # Production, BOMs, Ordres
│       ├── projects.ts          # Projets, Tâches, Time tracking
│       ├── procurement.ts       # Achats, Fournisseurs, PO
│       ├── sales.ts             # Ventes, Devis, Commandes
│       ├── assets.ts            # Actifs, Amortissements
│       ├── notifications.ts     # Notifications, Audit
│       ├── documents.ts         # Documents, Versions
│       ├── workflows.ts         # Workflows, Approbations
│       ├── integrations.ts      # Intégrations, Webhooks
│       ├── ai.ts                # IA, Embeddings
│       │
│       │   # --- SCHÉMAS HEALTHCARE ---
│       ├── healthcare.ts        # Schéma commun santé
│       ├── dialyse.ts           # Module Dialyse
│       ├── cardiology.ts        # Module Cardiologie
│       ├── ophthalmology.ts     # Module Ophtalmologie
│       ├── clinical-ai.ts       # IA Clinique
│       ├── imaging-ai.ts        # IA Imagerie
│       ├── rpm.ts               # Remote Patient Monitoring
│       ├── patient-portal.ts    # Portail Patient
│       └── population-health.ts # Santé Populationnelle
│
├── migrations/                  # Migrations SQL
│   ├── 0001_initial.sql
│   ├── 0002_...sql
│   ├── ...
│   ├── 0022_add_performance_indexes.sql
│   ├── 0022_audit_trail.sql
│   ├── 0022_clinical_ai_patient_portal.sql
│   ├── 0022_rpm_module.sql
│   └── 0023_imaging_population_health.sql
│
├── drizzle.config.ts            # Configuration Drizzle
├── package.json
└── README.md
```

## Schémas Healthcare

### Dialyse (`dialyse.ts`)

```typescript
// Patients dialysés
export const dialysePatients = sqliteTable('dialyse_patients', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id').notNull(),
  patientId: text('patient_id').notNull(),
  dialysisType: text('dialysis_type'),     // HD, HDF, PD
  vascularAccess: text('vascular_access'), // AVF, AVG, CVC
  dryWeight: real('dry_weight'),
  ktVTarget: real('ktv_target').default(1.4),
  // ...
});

// Séances de dialyse
export const dialyseSessions = sqliteTable('dialyse_sessions', {
  id: text('id').primaryKey(),
  patientId: text('patient_id').notNull(),
  machineId: text('machine_id'),
  sessionDate: text('session_date').notNull(),
  preWeight: real('pre_weight'),
  postWeight: real('post_weight'),
  ufGoal: real('uf_goal'),
  bloodFlow: integer('blood_flow'),
  ktV: real('ktv'),
  status: text('status').default('scheduled'),
  // ...
});

// Machines de dialyse
export const dialyseMachines = sqliteTable('dialyse_machines', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id').notNull(),
  serialNumber: text('serial_number').notNull(),
  model: text('model'),
  status: text('status').default('available'),
  // ...
});

// Résultats laboratoire
export const dialyseLabs = sqliteTable('dialyse_labs', {
  id: text('id').primaryKey(),
  patientId: text('patient_id').notNull(),
  hemoglobin: real('hemoglobin'),
  potassium: real('potassium'),
  creatinine: real('creatinine'),
  // ...
});
```

### Cardiologie (`cardiology.ts`)

```typescript
// Patients cardiologie
export const cardiologyPatients = sqliteTable('cardiology_patients', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id').notNull(),
  patientId: text('patient_id').notNull(),
  framinghamScore: real('framingham_score'),
  score2Risk: real('score2_risk'),
  cha2ds2VascScore: integer('cha2ds2_vasc_score'),
  // ...
});

// ECGs
export const cardiologyEcgs = sqliteTable('cardiology_ecgs', {
  id: text('id').primaryKey(),
  patientId: text('patient_id').notNull(),
  recordingDate: text('recording_date').notNull(),
  heartRate: integer('heart_rate'),
  rhythm: text('rhythm'),
  interpretation: text('interpretation'),
  // ...
});

// Échocardiogrammes
export const cardiologyEchos = sqliteTable('cardiology_echos', {
  id: text('id').primaryKey(),
  patientId: text('patient_id').notNull(),
  lvef: real('lvef'),
  lvedd: real('lvedd'),
  findings: text('findings'),
  // ...
});
```

### Ophtalmologie (`ophthalmology.ts`)

```typescript
// Patients ophtalmologie
export const ophthalmologyPatients = sqliteTable('ophthalmology_patients', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id').notNull(),
  patientId: text('patient_id').notNull(),
  // ...
});

// Mesures biométriques
export const ophthalmologyBiometry = sqliteTable('ophthalmology_biometry', {
  id: text('id').primaryKey(),
  patientId: text('patient_id').notNull(),
  eye: text('eye').notNull(), // left, right
  axialLength: real('axial_length'),
  k1: real('k1'),
  k2: real('k2'),
  acd: real('acd'),
  // ...
});

// Chirurgies
export const ophthalmologySurgeries = sqliteTable('ophthalmology_surgeries', {
  id: text('id').primaryKey(),
  patientId: text('patient_id').notNull(),
  surgeryType: text('surgery_type'),
  eye: text('eye'),
  iolPower: real('iol_power'),
  iolModel: text('iol_model'),
  status: text('status'),
  // ...
});
```

### Clinical AI (`clinical-ai.ts`)

```typescript
// Sessions d'aide au diagnostic
export const clinicalAiSessions = sqliteTable('clinical_ai_sessions', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id').notNull(),
  patientId: text('patient_id'),
  sessionType: text('session_type'), // diagnostic, summary, documentation
  input: text('input'),
  output: text('output'),
  confidence: real('confidence'),
  // ...
});

// Recommandations CDSS
export const cdssRecommendations = sqliteTable('cdss_recommendations', {
  id: text('id').primaryKey(),
  patientId: text('patient_id').notNull(),
  type: text('type'), // alert, screening, medication
  severity: text('severity'),
  message: text('message'),
  status: text('status').default('active'),
  // ...
});
```

### RPM (`rpm.ts`)

```typescript
// Appareils RPM
export const rpmDevices = sqliteTable('rpm_devices', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id').notNull(),
  patientId: text('patient_id').notNull(),
  deviceType: text('device_type'), // bp, glucose, spo2, weight
  brand: text('brand'),
  model: text('model'),
  serialNumber: text('serial_number'),
  status: text('status').default('active'),
  // ...
});

// Mesures RPM
export const rpmReadings = sqliteTable('rpm_readings', {
  id: text('id').primaryKey(),
  deviceId: text('device_id').notNull(),
  patientId: text('patient_id').notNull(),
  readingType: text('reading_type'),
  values: text('values'), // JSON
  timestamp: integer('timestamp', { mode: 'timestamp' }),
  isOutOfRange: integer('is_out_of_range', { mode: 'boolean' }),
  // ...
});

// Programmes de suivi
export const rpmPrograms = sqliteTable('rpm_programs', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id').notNull(),
  name: text('name').notNull(),
  measurementSchedule: text('measurement_schedule'), // JSON
  alertThresholds: text('alert_thresholds'), // JSON
  // ...
});
```

### Patient Portal (`patient-portal.ts`)

```typescript
// Comptes patient portail
export const portalAccounts = sqliteTable('portal_accounts', {
  id: text('id').primaryKey(),
  patientId: text('patient_id').notNull(),
  email: text('email').notNull(),
  passwordHash: text('password_hash').notNull(),
  isVerified: integer('is_verified', { mode: 'boolean' }).default(false),
  lastLogin: integer('last_login', { mode: 'timestamp' }),
  // ...
});

// Messages
export const portalMessages = sqliteTable('portal_messages', {
  id: text('id').primaryKey(),
  senderId: text('sender_id').notNull(),
  recipientId: text('recipient_id').notNull(),
  subject: text('subject'),
  body: text('body'),
  isRead: integer('is_read', { mode: 'boolean' }).default(false),
  // ...
});

// Rendez-vous
export const portalAppointments = sqliteTable('portal_appointments', {
  id: text('id').primaryKey(),
  patientId: text('patient_id').notNull(),
  practitionerId: text('practitioner_id').notNull(),
  scheduledAt: integer('scheduled_at', { mode: 'timestamp' }),
  status: text('status').default('scheduled'),
  // ...
});
```

### Population Health (`population-health.ts`)

```typescript
// Cohortes
export const populationCohorts = sqliteTable('population_cohorts', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id').notNull(),
  name: text('name').notNull(),
  description: text('description'),
  criteria: text('criteria'), // JSON
  patientCount: integer('patient_count').default(0),
  // ...
});

// Indicateurs qualité
export const qualityIndicators = sqliteTable('quality_indicators', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id').notNull(),
  code: text('code').notNull(),
  name: text('name').notNull(),
  target: real('target'),
  currentValue: real('current_value'),
  numerator: integer('numerator'),
  denominator: integer('denominator'),
  // ...
});
```

## Commandes

### Génération de migration

```bash
# Depuis la racine du projet
pnpm --filter @perfex/database generate

# Ou depuis ce répertoire
pnpm generate
```

### Application des migrations

```bash
# Local (développement)
wrangler d1 migrations apply perfex-db --local

# Staging
wrangler d1 migrations apply perfex-db-staging --remote

# Production
wrangler d1 migrations apply perfex-db --remote
```

### Seed de données

```bash
# Données de test healthcare
node seed-healthcare-staging.js

# Données massives (183 batches)
./run-all-batches.sh
```

## Conventions

### Naming

| Élément | Convention | Exemple |
|---------|------------|---------|
| Tables | snake_case | `dialyse_patients` |
| Colonnes | snake_case | `created_at` |
| Clés primaires | `id` (text UUID) | `id: text('id').primaryKey()` |
| Clés étrangères | `entity_id` | `patient_id`, `organization_id` |
| Timestamps | `created_at`, `updated_at` | integer mode timestamp |
| Booléens | `is_*` ou `has_*` | `is_active`, `has_diabetes` |

### Multi-tenancy

Toutes les tables incluent `organization_id` pour l'isolation des données :

```typescript
export const myTable = sqliteTable('my_table', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id')
    .notNull()
    .references(() => organizations.id),
  // ... autres colonnes
});
```

### Soft Delete

Pour les entités qui nécessitent une suppression logique :

```typescript
export const myTable = sqliteTable('my_table', {
  // ...
  deletedAt: integer('deleted_at', { mode: 'timestamp' }),
  deletedBy: text('deleted_by'),
});
```

### Index

Indexer les colonnes fréquemment utilisées en WHERE/JOIN :

```typescript
// Dans la migration SQL
CREATE INDEX idx_dialyse_sessions_patient ON dialyse_sessions(patient_id);
CREATE INDEX idx_dialyse_sessions_date ON dialyse_sessions(session_date);
CREATE INDEX idx_dialyse_sessions_org ON dialyse_sessions(organization_id);
```

## Statistiques

| Métrique | Valeur |
|----------|--------|
| Tables totales | 120+ |
| Schémas core | 15 |
| Schémas healthcare | 9 |
| Migrations | 25+ |
| Fichiers seed | 183 batches |

## Documentation

- [Architecture](../../docs/ARCHITECTURE.md)
- [Healthcare](../../docs/HEALTHCARE.md)
- [Database](../../docs/DATABASE.md)
- [Drizzle ORM](https://orm.drizzle.team/)

## License

Proprietary - Perfex ERP

---

**Dernière mise à jour** : Février 2025
