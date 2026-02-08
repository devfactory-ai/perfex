# Documentation des Modules Healthcare

> Guide complet des modules santé de Perfex ERP Healthcare

## Table des Matières

1. [Introduction](#introduction)
2. [Architecture Healthcare](#architecture-healthcare)
3. [Module Dialyse](#module-dialyse)
4. [Module Cardiologie](#module-cardiologie)
5. [Module Ophtalmologie](#module-ophtalmologie)
6. [Module IA Clinique](#module-ia-clinique)
7. [Module IA Imagerie](#module-ia-imagerie)
8. [Module RPM](#module-rpm-remote-patient-monitoring)
9. [Module Portail Patient](#module-portail-patient)
10. [Module Santé Populationnelle](#module-santé-populationnelle)
11. [Interopérabilité](#interopérabilité)
12. [Sécurité et Conformité](#sécurité-et-conformité)

---

## Introduction

Perfex ERP Healthcare est une suite complète de modules conçus pour répondre aux besoins spécifiques des établissements de santé. Les modules couvrent :

- **Spécialités médicales** : Dialyse, Cardiologie, Ophtalmologie
- **Intelligence Artificielle** : Aide au diagnostic, analyse d'imagerie
- **Télémédecine** : Portail patient, monitoring à distance (RPM)
- **Santé publique** : Indicateurs qualité, santé populationnelle
- **Interopérabilité** : FHIR R4, HL7v2

### Prérequis

- Node.js 22+
- pnpm 10+
- Compte Cloudflare (pour le déploiement)

### Installation

```bash
# Cloner le repository
git clone https://github.com/yassine-techini/perfex-erp.git
cd perfex

# Installer les dépendances
pnpm install

# Démarrer en développement
pnpm dev
```

---

## Architecture Healthcare

### Diagramme des Modules

```
                         ┌─────────────────────────────┐
                         │       PERFEX HEALTHCARE     │
                         │        (Hono.js API)        │
                         └──────────────┬──────────────┘
                                        │
     ┌──────────────┬───────────────────┼───────────────────┬──────────────┐
     │              │                   │                   │              │
     ▼              ▼                   ▼                   ▼              ▼
┌─────────┐  ┌───────────┐  ┌─────────────────┐  ┌───────────────┐  ┌──────────┐
│ DIALYSE │  │ CARDIOLOGY│  │  OPHTHALMOLOGY  │  │  CLINICAL AI  │  │ IMAGING  │
│         │  │           │  │                 │  │               │  │    AI    │
│Sessions │  │Risk Score │  │ IOL Calculator  │  │ Diagnostic    │  │ECG/Echo  │
│Machines │  │ECG/Echo   │  │ OCT Analysis    │  │ NLP           │  │OCT Anal. │
│Labs     │  │Workflow   │  │ Surgery         │  │ CDSS          │  │Detection │
└─────────┘  └───────────┘  └─────────────────┘  └───────────────┘  └──────────┘
     │              │                   │                   │              │
     └──────────────┴───────────────────┼───────────────────┴──────────────┘
                                        │
                                        ▼
                         ┌─────────────────────────────┐
                         │       CLOUDFLARE D1         │
                         │    (SQLite Database)        │
                         └─────────────────────────────┘
```

### Structure des Fichiers

```
apps/workers/api/src/
├── routes/
│   ├── dialyse.ts              # 150+ endpoints dialyse
│   ├── cardiology.ts           # Endpoints cardiologie
│   ├── ophthalmology.ts        # Endpoints ophtalmologie
│   ├── clinical-ai.ts          # Endpoints IA clinique
│   ├── imaging-ai.ts           # Endpoints IA imagerie
│   ├── rpm.ts                  # Endpoints RPM
│   ├── patient-portal.ts       # Endpoints portail patient
│   ├── population-health.ts    # Endpoints santé pop.
│   ├── fhir.ts                 # API FHIR R4
│   └── cdss.ts                 # Aide décision clinique
│
├── services/
│   ├── dialyse/                # Services dialyse
│   ├── cardiology/             # Services cardiologie
│   ├── ophthalmology/          # Services ophtalmologie
│   ├── clinical-ai/            # Services IA clinique
│   ├── imaging-ai/             # Services IA imagerie
│   ├── rpm/                    # Services RPM
│   ├── patient-portal/         # Services portail
│   ├── population-health/      # Services santé pop.
│   ├── fhir/                   # Services FHIR
│   └── cdss/                   # Services CDSS
│
packages/database/src/schema/
├── dialyse.ts                  # Schéma dialyse
├── cardiology.ts               # Schéma cardiologie
├── ophthalmology.ts            # Schéma ophtalmologie
├── clinical-ai.ts              # Schéma IA clinique
├── imaging-ai.ts               # Schéma IA imagerie
├── rpm.ts                      # Schéma RPM
├── patient-portal.ts           # Schéma portail
├── population-health.ts        # Schéma santé pop.
└── healthcare.ts               # Schéma commun
```

---

## Module Dialyse

### Vue d'ensemble

Le module Dialyse permet la gestion complète d'un centre d'hémodialyse :

- Dossiers patients dialysés
- Planification des séances
- Gestion du parc de machines
- Suivi biologique
- Alertes cliniques
- Calcul d'efficacité (Kt/V)

### Schéma de Base de Données

```typescript
// packages/database/src/schema/dialyse.ts

// Patients dialysés
export const dialysePatients = sqliteTable('dialyse_patients', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id').notNull(),
  patientId: text('patient_id').notNull(), // Lien patient général
  dialysisType: text('dialysis_type'), // HD, HDF, PD
  vascularAccess: text('vascular_access'), // AVF, AVG, CVC
  dryWeight: real('dry_weight'),
  ktVTarget: real('ktv_target').default(1.4),
  createdAt: integer('created_at', { mode: 'timestamp' }),
});

// Séances de dialyse
export const dialyseSessions = sqliteTable('dialyse_sessions', {
  id: text('id').primaryKey(),
  patientId: text('patient_id').notNull(),
  machineId: text('machine_id'),
  sessionDate: text('session_date').notNull(),
  startTime: text('start_time'),
  endTime: text('end_time'),
  preWeight: real('pre_weight'),
  postWeight: real('post_weight'),
  ufGoal: real('uf_goal'), // Ultrafiltration goal
  bloodFlow: integer('blood_flow'),
  dialysateFlow: integer('dialysate_flow'),
  ktV: real('ktv'), // Kt/V calculé
  status: text('status').default('scheduled'),
});

// Machines de dialyse
export const dialyseMachines = sqliteTable('dialyse_machines', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id').notNull(),
  serialNumber: text('serial_number').notNull(),
  model: text('model'),
  brand: text('brand'),
  status: text('status').default('available'),
  lastMaintenanceDate: text('last_maintenance_date'),
  nextMaintenanceDate: text('next_maintenance_date'),
});

// Résultats laboratoire
export const dialyseLabs = sqliteTable('dialyse_labs', {
  id: text('id').primaryKey(),
  patientId: text('patient_id').notNull(),
  testDate: text('test_date').notNull(),
  hemoglobin: real('hemoglobin'),
  potassium: real('potassium'),
  phosphorus: real('phosphorus'),
  pth: real('pth'),
  albumin: real('albumin'),
  creatinine: real('creatinine'),
  urea: real('urea'),
});
```

### Endpoints API

#### Patients

```http
# Liste des patients dialysés
GET /api/v1/dialyse/patients
Authorization: Bearer <token>

# Créer un patient dialysé
POST /api/v1/dialyse/patients
Content-Type: application/json

{
  "patientId": "patient-uuid",
  "dialysisType": "HD",
  "vascularAccess": "AVF",
  "dryWeight": 72.5,
  "ktVTarget": 1.4
}

# Détail d'un patient
GET /api/v1/dialyse/patients/:id

# Modifier un patient
PUT /api/v1/dialyse/patients/:id

# Supprimer un patient
DELETE /api/v1/dialyse/patients/:id
```

#### Séances

```http
# Liste des séances
GET /api/v1/dialyse/sessions?date=2025-02-08

# Créer une séance
POST /api/v1/dialyse/sessions
{
  "patientId": "patient-uuid",
  "machineId": "machine-uuid",
  "sessionDate": "2025-02-08",
  "startTime": "08:00",
  "ufGoal": 2.5,
  "bloodFlow": 350,
  "dialysateFlow": 500
}

# Terminer une séance et calculer Kt/V
PUT /api/v1/dialyse/sessions/:id/complete
{
  "endTime": "12:00",
  "postWeight": 70.0,
  "preUrea": 150,
  "postUrea": 45
}

# Calculer Kt/V
GET /api/v1/dialyse/sessions/:id/ktv
```

#### Machines

```http
# Liste des machines
GET /api/v1/dialyse/machines

# Machines disponibles
GET /api/v1/dialyse/machines/available

# Planifier maintenance
PUT /api/v1/dialyse/machines/:id/maintenance
{
  "maintenanceType": "preventive",
  "scheduledDate": "2025-02-15"
}
```

### Calcul Kt/V

Le Kt/V est un indicateur clé de l'efficacité de la dialyse :

```typescript
// apps/workers/api/src/services/dialyse/ktv.calculator.ts

export function calculateKtV(params: {
  preUrea: number;      // Urée pré-dialyse (mg/dL)
  postUrea: number;     // Urée post-dialyse (mg/dL)
  sessionDuration: number; // Durée en minutes
  ufVolume: number;     // Volume ultrafiltré (L)
  postWeight: number;   // Poids post-dialyse (kg)
}): number {
  const { preUrea, postUrea, sessionDuration, ufVolume, postWeight } = params;

  // Formule de Daugirdas (2ème génération)
  const R = postUrea / preUrea;
  const t = sessionDuration / 60; // Convertir en heures
  const UF = ufVolume;
  const W = postWeight;

  const ktv = -Math.log(R - 0.008 * t) + (4 - 3.5 * R) * (UF / W);

  return Math.round(ktv * 100) / 100;
}
```

### Alertes Cliniques

Le système génère des alertes automatiques :

```typescript
// Types d'alertes
type AlertType =
  | 'LOW_KTV'           // Kt/V < 1.2
  | 'HIGH_POTASSIUM'    // K+ > 6.0
  | 'LOW_HEMOGLOBIN'    // Hb < 10
  | 'HIGH_PHOSPHORUS'   // P > 5.5
  | 'MISSED_SESSION'    // Séance manquée
  | 'MACHINE_MAINTENANCE'; // Maintenance requise

// Exemple d'alerte
{
  "id": "alert-uuid",
  "patientId": "patient-uuid",
  "type": "LOW_KTV",
  "severity": "warning",
  "message": "Kt/V inférieur à la cible (1.15 vs 1.40)",
  "createdAt": "2025-02-08T12:00:00Z"
}
```

---

## Module Cardiologie

### Vue d'ensemble

Le module Cardiologie offre :

- Calcul des scores de risque cardiovasculaire
- Gestion des ECG
- Suivi échocardiographique
- Workflow de prise en charge

### Calculateurs de Risque

#### Score de Framingham

```http
POST /api/v1/cardiology/risk-score/framingham
Content-Type: application/json

{
  "age": 55,
  "sex": "male",
  "totalCholesterol": 240,
  "hdlCholesterol": 45,
  "systolicBP": 145,
  "isTreatedBP": true,
  "isSmoker": false,
  "hasDiabetes": false
}

# Réponse
{
  "score": 18,
  "risk10Year": 0.21,
  "riskCategory": "high",
  "recommendations": [
    "Envisager traitement hypolipémiant",
    "Contrôle tensionnel optimal recommandé"
  ]
}
```

#### Score SCORE2

```http
POST /api/v1/cardiology/risk-score/score2
Content-Type: application/json

{
  "age": 55,
  "sex": "male",
  "systolicBP": 145,
  "totalCholesterol": 6.2,  // mmol/L
  "hdlCholesterol": 1.2,    // mmol/L
  "isSmoker": true,
  "region": "europe_high_risk"  // low, moderate, high, very_high
}

# Réponse
{
  "score": 12.5,
  "riskCategory": "very_high",
  "recommendations": [...]
}
```

#### CHA2DS2-VASc (Fibrillation auriculaire)

```http
POST /api/v1/cardiology/risk-score/cha2ds2-vasc
Content-Type: application/json

{
  "age": 72,
  "sex": "female",
  "hasCongestiveHeartFailure": true,
  "hasHypertension": true,
  "hasDiabetes": false,
  "hasStrokeTIA": false,
  "hasVascularDisease": true
}

# Réponse
{
  "score": 5,
  "annualStrokeRisk": 0.067,
  "anticoagulationRecommended": true,
  "recommendations": [
    "Anticoagulation orale recommandée",
    "AOD préférés aux AVK si éligible"
  ]
}
```

### Gestion des ECG

```http
# Enregistrer un ECG
POST /api/v1/cardiology/ecgs
Content-Type: application/json

{
  "patientId": "patient-uuid",
  "recordingDate": "2025-02-08",
  "heartRate": 72,
  "rhythm": "sinus",
  "prInterval": 160,
  "qrsDuration": 90,
  "qtInterval": 400,
  "qtcInterval": 420,
  "axis": 45,
  "findings": ["Normal sinus rhythm"],
  "interpretation": "ECG normal"
}

# Analyse automatique (IA)
POST /api/v1/imaging-ai/ecg/analyze
Content-Type: multipart/form-data

file: [ECG PDF or image]

# Réponse
{
  "heartRate": 72,
  "rhythm": "sinus",
  "findings": [
    "Rythme sinusal régulier",
    "Pas d'anomalie de repolarisation"
  ],
  "abnormalities": [],
  "confidence": 0.95
}
```

---

## Module Ophtalmologie

### Vue d'ensemble

Le module Ophtalmologie comprend :

- Calcul de puissance IOL
- Analyse OCT
- Workflow chirurgical
- Suivi post-opératoire

### Calculateur IOL

```http
POST /api/v1/ophthalmology/iol/calculate
Content-Type: application/json

{
  "eye": "right",
  "axialLength": 23.5,      // mm
  "keratometry": {
    "k1": 43.25,            // dioptries
    "k2": 44.50,
    "axis": 90
  },
  "acd": 3.2,               // mm - Profondeur chambre antérieure
  "lensThickness": 4.5,     // mm
  "targetRefraction": -0.25, // dioptries
  "formula": "SRK/T"        // SRK/T, Haigis, Holladay, Barrett
}

# Réponse
{
  "recommendedPower": 21.5,
  "predictedRefraction": -0.18,
  "formula": "SRK/T",
  "alternatives": [
    { "power": 21.0, "refraction": 0.15 },
    { "power": 22.0, "refraction": -0.52 }
  ]
}
```

### Formules IOL Supportées

- **SRK/T** : Formule standard de 3ème génération
- **Haigis** : Utilise 3 constantes (a0, a1, a2)
- **Holladay 1 & 2** : Pour yeux normaux et atypiques
- **Barrett Universal II** : Moderne, excellente précision

### Workflow Chirurgical

```http
# Créer une chirurgie
POST /api/v1/ophthalmology/surgeries
{
  "patientId": "patient-uuid",
  "surgeryType": "cataract",
  "eye": "right",
  "scheduledDate": "2025-02-15",
  "surgeon": "Dr. Martin",
  "iolPower": 21.5,
  "iolModel": "Alcon SN60WF"
}

# Progression du workflow
PUT /api/v1/ophthalmology/surgeries/:id/workflow
{
  "step": "induction",
  "timestamp": "2025-02-15T08:30:00Z",
  "notes": "Patient stable"
}

# Étapes du workflow
# 1. pre_op_check
# 2. induction
# 3. surgery_start
# 4. phaco_complete
# 5. iol_inserted
# 6. surgery_end
# 7. recovery
# 8. discharge
```

---

## Module IA Clinique

### Vue d'ensemble

Le module IA Clinique utilise l'intelligence artificielle pour :

- Assister le diagnostic
- Générer des résumés patients
- Traiter le langage naturel médical
- Fournir une aide à la décision (CDSS)

### Assistant Diagnostic

```http
POST /api/v1/clinical-ai/diagnostic-assist
Content-Type: application/json

{
  "patientId": "patient-uuid",
  "symptoms": [
    "Douleur thoracique rétrosternale",
    "Irradiation bras gauche",
    "Dyspnée d'effort"
  ],
  "vitalSigns": {
    "bloodPressure": "150/90",
    "heartRate": 95,
    "temperature": 37.2,
    "oxygenSaturation": 96
  },
  "medicalHistory": ["Hypertension", "Diabète type 2"],
  "currentMedications": ["Metformine", "Amlodipine"]
}

# Réponse
{
  "differentialDiagnosis": [
    {
      "diagnosis": "Syndrome coronarien aigu",
      "probability": 0.75,
      "urgency": "high",
      "recommendedTests": ["Troponine", "ECG", "Coronarographie"]
    },
    {
      "diagnosis": "Angor stable",
      "probability": 0.15,
      "urgency": "moderate"
    }
  ],
  "immediateActions": [
    "ECG 12 dérivations en urgence",
    "Dosage troponine haute sensibilité",
    "Aspirine 250mg si pas de contre-indication"
  ],
  "disclaimer": "Ceci est une aide à la décision. Le jugement clinique reste primordial."
}
```

### Résumé Patient Automatique

```http
POST /api/v1/clinical-ai/patient-summary
Content-Type: application/json

{
  "patientId": "patient-uuid",
  "summaryType": "admission", // admission, discharge, consultation
  "includeLabResults": true,
  "includeMedications": true,
  "language": "fr"
}

# Réponse
{
  "summary": "Patient de 65 ans, hypertendu et diabétique, admis pour douleur thoracique...",
  "keyPoints": [
    "Facteurs de risque cardiovasculaires multiples",
    "Troponine initiale négative",
    "ECG : sus-décalage ST V1-V4"
  ],
  "activeMedications": [...],
  "pendingTests": [...],
  "generatedAt": "2025-02-08T10:00:00Z"
}
```

### Aide à la Décision Clinique (CDSS)

```http
GET /api/v1/cdss/recommendations/:patientId

# Réponse
{
  "patientId": "patient-uuid",
  "recommendations": [
    {
      "type": "medication_alert",
      "severity": "high",
      "message": "Interaction potentielle entre Metformine et produit de contraste iodé",
      "action": "Suspendre Metformine 48h avant et après injection"
    },
    {
      "type": "screening",
      "severity": "medium",
      "message": "Dépistage rétinopathie diabétique recommandé",
      "lastScreening": "2023-06-15",
      "action": "Planifier fond d'oeil"
    }
  ]
}
```

---

## Module IA Imagerie

### Vue d'ensemble

Le module IA Imagerie analyse automatiquement :

- ECG
- Échocardiogrammes
- OCT (Tomographie par Cohérence Optique)
- Radiographies

### Analyse ECG

```http
POST /api/v1/imaging-ai/ecg/analyze
Content-Type: multipart/form-data

file: [ECG PDF/Image]
patientId: patient-uuid

# Réponse
{
  "analysisId": "analysis-uuid",
  "measurements": {
    "heartRate": 78,
    "prInterval": 162,
    "qrsDuration": 88,
    "qtInterval": 380,
    "qtcInterval": 412,
    "axis": 35
  },
  "rhythm": {
    "type": "sinus",
    "regular": true,
    "confidence": 0.98
  },
  "findings": [
    {
      "finding": "Rythme sinusal normal",
      "confidence": 0.98
    },
    {
      "finding": "Pas d'anomalie ST",
      "confidence": 0.95
    }
  ],
  "abnormalities": [],
  "overallInterpretation": "ECG dans les limites de la normale",
  "qualityScore": 0.92
}
```

### Analyse Échocardiogramme

```http
POST /api/v1/imaging-ai/echo/analyze
Content-Type: multipart/form-data

file: [Echo video/images]
patientId: patient-uuid

# Réponse
{
  "analysisId": "analysis-uuid",
  "measurements": {
    "lvef": 55,                    // Fraction d'éjection VG (%)
    "lvedd": 48,                   // Diamètre télédiastolique VG (mm)
    "lvesd": 32,                   // Diamètre télésystolique VG (mm)
    "ivs": 10,                     // Septum interventriculaire (mm)
    "pw": 9,                       // Paroi postérieure (mm)
    "la": 38,                      // Oreillette gauche (mm)
    "aorticRoot": 32               // Racine aortique (mm)
  },
  "valves": {
    "mitral": { "status": "normal", "regurgitation": "trace" },
    "aortic": { "status": "normal", "stenosis": "none" },
    "tricuspid": { "status": "normal" },
    "pulmonary": { "status": "normal" }
  },
  "findings": [
    "Fonction systolique VG conservée",
    "Pas de valvulopathie significative"
  ],
  "overallInterpretation": "Échocardiogramme normal"
}
```

### Analyse OCT

```http
POST /api/v1/imaging-ai/oct/analyze
Content-Type: multipart/form-data

file: [OCT image]
patientId: patient-uuid
eye: right

# Réponse
{
  "analysisId": "analysis-uuid",
  "measurements": {
    "centralMacularThickness": 265,  // µm
    "rnflThickness": {
      "average": 98,
      "superior": 120,
      "inferior": 115,
      "nasal": 72,
      "temporal": 68
    }
  },
  "findings": [
    {
      "finding": "Épaisseur maculaire normale",
      "confidence": 0.96
    },
    {
      "finding": "RNFL dans les limites de la normale",
      "confidence": 0.94
    }
  ],
  "abnormalities": [],
  "qualityScore": 0.89
}
```

---

## Module RPM (Remote Patient Monitoring)

### Vue d'ensemble

Le module RPM permet le suivi à distance des patients via appareils connectés :

- Tensiomètres
- Glucomètres
- Oxymètres
- Balances
- Cardiofréquencemètres

### Gestion des Appareils

```http
# Enregistrer un appareil
POST /api/v1/rpm/devices
{
  "patientId": "patient-uuid",
  "deviceType": "blood_pressure_monitor",
  "brand": "Withings",
  "model": "BPM Connect",
  "serialNumber": "ABC123",
  "connectionType": "bluetooth"
}

# Types d'appareils supportés
- blood_pressure_monitor
- glucometer
- pulse_oximeter
- weight_scale
- heart_rate_monitor
- thermometer
- spirometer
```

### Collecte des Mesures

```http
# Enregistrer une mesure
POST /api/v1/rpm/readings
{
  "patientId": "patient-uuid",
  "deviceId": "device-uuid",
  "readingType": "blood_pressure",
  "values": {
    "systolic": 135,
    "diastolic": 85,
    "pulse": 72
  },
  "timestamp": "2025-02-08T08:30:00Z",
  "notes": "Mesure au réveil"
}

# Historique des mesures
GET /api/v1/rpm/readings/patient/:patientId?type=blood_pressure&from=2025-01-01

# Réponse
{
  "readings": [
    {
      "id": "reading-uuid",
      "timestamp": "2025-02-08T08:30:00Z",
      "values": { "systolic": 135, "diastolic": 85, "pulse": 72 },
      "isOutOfRange": false
    }
  ],
  "statistics": {
    "averageSystolic": 132,
    "averageDiastolic": 82,
    "readingsCount": 28,
    "outOfRangeCount": 3
  }
}
```

### Programmes de Suivi

```http
# Créer un programme
POST /api/v1/rpm/programs
{
  "name": "Suivi HTA",
  "description": "Programme de suivi de l'hypertension",
  "measurementSchedule": {
    "blood_pressure": {
      "frequency": "twice_daily",
      "times": ["08:00", "20:00"]
    }
  },
  "alertThresholds": {
    "blood_pressure": {
      "systolic": { "min": 90, "max": 140 },
      "diastolic": { "min": 60, "max": 90 }
    }
  }
}

# Inscrire un patient
POST /api/v1/rpm/programs/:id/enrollments
{
  "patientId": "patient-uuid",
  "startDate": "2025-02-08",
  "devices": ["device-uuid-1", "device-uuid-2"]
}
```

### Suivi de Compliance

```http
GET /api/v1/rpm/compliance/:patientId

# Réponse
{
  "patientId": "patient-uuid",
  "programId": "program-uuid",
  "complianceRate": 0.85,
  "lastReading": "2025-02-08T08:30:00Z",
  "expectedReadings": 56,
  "actualReadings": 48,
  "missedReadings": [
    { "date": "2025-02-05", "time": "20:00", "type": "blood_pressure" }
  ],
  "alerts": [
    {
      "type": "high_bp",
      "reading": { "systolic": 165, "diastolic": 100 },
      "timestamp": "2025-02-07T08:30:00Z"
    }
  ]
}
```

---

## Module Portail Patient

### Vue d'ensemble

Le Portail Patient offre aux patients un accès sécurisé à :

- Leurs dossiers médicaux
- La messagerie avec l'équipe soignante
- La prise de rendez-vous
- Le suivi des symptômes
- Les résultats d'examens

### Authentification Patient

```http
# Inscription
POST /api/v1/patient-portal/auth/register
{
  "email": "patient@example.com",
  "password": "SecureP@ss123",
  "firstName": "Jean",
  "lastName": "Dupont",
  "dateOfBirth": "1960-05-15",
  "phoneNumber": "+33612345678"
}

# Connexion
POST /api/v1/patient-portal/auth/login
{
  "email": "patient@example.com",
  "password": "SecureP@ss123"
}

# Réponse
{
  "accessToken": "eyJ...",
  "refreshToken": "eyJ...",
  "patient": {
    "id": "patient-uuid",
    "firstName": "Jean",
    "lastName": "Dupont"
  }
}
```

### Messagerie Sécurisée

```http
# Liste des conversations
GET /api/v1/patient-portal/messages

# Envoyer un message
POST /api/v1/patient-portal/messages
{
  "recipientId": "practitioner-uuid",
  "subject": "Question sur mon traitement",
  "body": "Bonjour, j'ai une question concernant...",
  "priority": "normal"
}

# Lire un message
GET /api/v1/patient-portal/messages/:id
PUT /api/v1/patient-portal/messages/:id/read
```

### Prise de Rendez-vous

```http
# Créneaux disponibles
GET /api/v1/patient-portal/appointments/slots?practitionerId=xxx&date=2025-02-15

# Prendre rendez-vous
POST /api/v1/patient-portal/appointments
{
  "practitionerId": "practitioner-uuid",
  "slotId": "slot-uuid",
  "reason": "Consultation de suivi",
  "notes": "Suite à mes dernières analyses"
}

# Annuler
DELETE /api/v1/patient-portal/appointments/:id
```

### Suivi des Symptômes

```http
# Enregistrer des symptômes
POST /api/v1/patient-portal/symptoms
{
  "date": "2025-02-08",
  "symptoms": [
    {
      "type": "pain",
      "location": "chest",
      "intensity": 4,
      "duration": "30min"
    },
    {
      "type": "fatigue",
      "intensity": 6
    }
  ],
  "notes": "Douleur apparue après l'effort"
}

# Historique
GET /api/v1/patient-portal/symptoms?from=2025-01-01
```

---

## Module Santé Populationnelle

### Vue d'ensemble

Le module Santé Populationnelle permet :

- La gestion de cohortes de patients
- Le suivi des indicateurs qualité
- La stratification des risques
- L'analyse des données de santé publique

### Gestion des Cohortes

```http
# Créer une cohorte
POST /api/v1/population-health/cohorts
{
  "name": "Diabétiques HbA1c > 8%",
  "description": "Patients diabétiques mal équilibrés",
  "criteria": {
    "conditions": ["diabetes_type_2"],
    "labResults": {
      "hba1c": { "min": 8.0 }
    }
  },
  "autoUpdate": true
}

# Patients de la cohorte
GET /api/v1/population-health/cohorts/:id/patients

# Statistiques
GET /api/v1/population-health/cohorts/:id/statistics
{
  "totalPatients": 156,
  "averageHbA1c": 8.7,
  "ageDistribution": {...},
  "comorbidities": {...}
}
```

### Indicateurs Qualité

```http
# Liste des indicateurs
GET /api/v1/population-health/quality-indicators

# Indicateur spécifique
GET /api/v1/population-health/quality-indicators/HAS-DIAB-01

# Réponse
{
  "code": "HAS-DIAB-01",
  "name": "Contrôle HbA1c annuel",
  "description": "Pourcentage de diabétiques avec HbA1c mesurée dans l'année",
  "target": 0.80,
  "currentValue": 0.72,
  "numerator": 234,
  "denominator": 325,
  "trend": "improving",
  "lastUpdated": "2025-02-01"
}
```

### Stratification des Risques

```http
POST /api/v1/population-health/risk-stratification
{
  "cohortId": "cohort-uuid",
  "riskModel": "cardiovascular_10year"
}

# Réponse
{
  "stratification": {
    "veryHigh": { "count": 45, "percentage": 0.15 },
    "high": { "count": 78, "percentage": 0.25 },
    "moderate": { "count": 120, "percentage": 0.38 },
    "low": { "count": 67, "percentage": 0.22 }
  },
  "priorityPatients": [
    {
      "patientId": "patient-uuid",
      "riskScore": 0.35,
      "category": "veryHigh",
      "modifiableFactors": ["smoking", "uncontrolled_bp"]
    }
  ]
}
```

---

## Interopérabilité

### FHIR R4

Le système implémente l'API FHIR R4 pour l'interopérabilité :

```http
# Patient
GET /api/v1/fhir/Patient?identifier=123456
GET /api/v1/fhir/Patient/:id

# Observation (résultats)
GET /api/v1/fhir/Observation?patient=patient-uuid&code=blood-pressure
POST /api/v1/fhir/Observation

# Bundle (ensemble de ressources)
POST /api/v1/fhir/Bundle
{
  "resourceType": "Bundle",
  "type": "transaction",
  "entry": [...]
}
```

### Ressources FHIR Supportées

| Ressource | Opérations | Description |
|-----------|------------|-------------|
| Patient | CRUD, Search | Données démographiques |
| Practitioner | CRUD, Search | Professionnels de santé |
| Observation | CRUD, Search | Résultats, mesures |
| DiagnosticReport | CRUD, Search | Comptes-rendus |
| MedicationRequest | CRUD, Search | Prescriptions |
| Appointment | CRUD, Search | Rendez-vous |
| Condition | CRUD, Search | Diagnostics |
| Procedure | CRUD, Search | Actes médicaux |

---

## Sécurité et Conformité

### Authentification

- JWT tokens (access + refresh)
- Authentification à deux facteurs (2FA)
- Sessions avec expiration

### Autorisation

- RBAC (Role-Based Access Control)
- Permissions granulaires par module
- Isolation multi-tenant

### Audit Trail

Toutes les actions sont journalisées :

```typescript
{
  "id": "audit-uuid",
  "userId": "user-uuid",
  "action": "READ",
  "entityType": "dialyse_patient",
  "entityId": "patient-uuid",
  "ipAddress": "192.168.1.1",
  "userAgent": "Mozilla/5.0...",
  "timestamp": "2025-02-08T10:00:00Z"
}
```

### Conformité

- **RGPD** : Droit à l'effacement, portabilité des données
- **HDS** : Hébergement de Données de Santé (via Cloudflare)
- **Sécurité** : Chiffrement TLS 1.3, données au repos chiffrées

### Consentement Patient

```http
# Enregistrer un consentement
POST /api/v1/consents
{
  "patientId": "patient-uuid",
  "type": "data_processing",
  "purpose": "Suivi médical",
  "granted": true,
  "validUntil": "2026-02-08"
}

# Vérifier le consentement
GET /api/v1/consents/check?patientId=xxx&type=data_sharing
```

---

## Ressources Supplémentaires

- [Architecture Technique](./ARCHITECTURE.md)
- [Base de Données](./DATABASE.md)
- [Déploiement](./DEPLOYMENT.md)
- [Guide de Contribution](../CONTRIBUTING.md)

---

**Dernière mise à jour** : Février 2025
