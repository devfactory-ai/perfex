# CAHIER DES CHARGES

## PERFEX HEALTHCARE
### Modules Cardiologie & Ophtalmologie

*Extension verticale santé de l'ERP AI-native Perfex*

---

| | |
|---|---|
| **Document** | CDC - Perfex Healthcare Cardiologie & Ophtalmologie |
| **Version** | 1.0 |
| **Date** | Décembre 2025 |
| **Auteur** | DevFactory |
| **Statut** | Draft |

---

## TABLE DES MATIÈRES

1. [Contexte et Objectifs](#1-contexte-et-objectifs)
2. [Intégration Perfex](#2-intégration-perfex)
3. [Module Cardiologie](#3-module-cardiologie)
4. [Module Ophtalmologie](#4-module-ophtalmologie)
5. [Spécifications Techniques](#5-spécifications-techniques)
6. [Planning Prévisionnel](#6-planning-prévisionnel)
7. [Estimation Budgétaire](#7-estimation-budgétaire)
8. [Annexes](#8-annexes)

---

## 1. CONTEXTE ET OBJECTIFS

### 1.1 Contexte

Ce projet vise à étendre la suite **Perfex Healthcare** avec deux nouveaux modules verticaux : **Cardiologie** et **Ophtalmologie**. Ces modules spécialisés s'intègrent nativement à l'écosystème Perfex, tirant parti de l'architecture multi-agents et de l'interface conversationnelle déjà en place avec le module Dialyse.

Les modules s'appuient sur les modules core de Perfex existants :

- **Finance** : facturation des actes et consultations
- **CRM** : dossiers patients enrichis
- **Inventory** : stock consommables et dispositifs
- **HR** : planning praticiens et équipes
- **Projects** : protocoles de soins et études cliniques

L'enrichissement IA permet une interaction en langage naturel pour les équipes médicales, avec des agents spécialisés par domaine.

### 1.2 Objectifs Globaux

1. **Compléter l'offre Perfex Healthcare** avec deux spécialités à forte demande
2. **Mutualiser les composants communs** (patient, agenda, facturation, IA)
3. **Accélérer le time-to-market** grâce à l'architecture modulaire existante
4. **Positionner DevFactory** comme éditeur de référence ERP santé en Afrique

### 1.3 Proposition de Valeur Combinée

| Bénéfice | Cardiologie | Ophtalmologie |
|----------|-------------|---------------|
| Réduction temps administratif | -50% | -55% |
| Amélioration suivi chronique | +45% | +50% |
| Réduction erreurs/oublis | -60% | -80% |
| Satisfaction équipes | +40% | +45% |
| Coût infrastructure | <500 TND/mois | <550 TND/mois |

---

## 2. INTÉGRATION PERFEX

### 2.1 Architecture Globale Perfex Healthcare

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           PERFEX CORE                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐     │
│  │   CRM    │  │ Finance  │  │Inventory │  │    HR    │  │ Projects │     │
│  │          │  │          │  │          │  │          │  │          │     │
│  │ Patients │  │Factura-  │  │ Stock &  │  │ Planning │  │Protocoles│     │
│  │ enrichis │  │tion actes│  │ Devices  │  │ équipes  │  │ cliniques│     │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘     │
│       │             │             │             │             │            │
│       └─────────────┴──────┬──────┴─────────────┴─────────────┘            │
│                            │                                                │
│  ┌─────────────────────────▼─────────────────────────────────────────────┐ │
│  │                    PERFEX HEALTHCARE PLATFORM                          │ │
│  ├────────────────┬────────────────┬────────────────┬────────────────────┤ │
│  │    DIALYSE     │  CARDIOLOGIE   │ OPHTALMOLOGIE  │     [FUTUR]        │ │
│  │   (existant)   │   (nouveau)    │   (nouveau)    │   Oncologie...     │ │
│  └────────────────┴────────────────┴────────────────┴────────────────────┘ │
│                            │                                                │
│              ┌─────────────▼─────────────┐                                 │
│              │    PERFEX AI CORE         │                                 │
│              │  ┌─────────────────────┐  │                                 │
│              │  │ Healthcare Agents   │  │                                 │
│              │  │ • Dialysis Agent    │  │                                 │
│              │  │ • Cardio Agent      │  │                                 │
│              │  │ • Ophtalmo Agent    │  │                                 │
│              │  └─────────────────────┘  │                                 │
│              └───────────────────────────┘                                 │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Mapping Entités Perfex → Healthcare

| Perfex Core | Cardiologie | Ophtalmologie |
|-------------|-------------|---------------|
| Contact (CRM) | Patient cardiologique | Patient ophtalmologique |
| Invoice (Finance) | Facturation consultation/acte | Facturation consultation/chirurgie |
| Product (Inventory) | Consommables (électrodes, stents) | Implants IOL, collyres |
| Employee (HR) | Cardiologue, IDE | Ophtalmologue, orthoptiste |
| Task (Projects) | Protocole IC, suivi FA | Protocole glaucome, injections IVT |

### 2.3 Composants Partagés Healthcare

Les deux modules partagent des composants communs déjà développés :

| Composant | Description |
|-----------|-------------|
| `healthcare/patient` | Dossier patient médical enrichi |
| `healthcare/consultation` | Gestion des consultations |
| `healthcare/examination` | Stockage examens et images |
| `healthcare/prescription` | Ordonnances et protocoles |
| `healthcare/device-registry` | Traçabilité dispositifs implantés |
| `healthcare/chronic-condition` | Suivi pathologies chroniques |
| `healthcare/ai-agent` | Agent conversationnel spécialisé |

---

## 3. MODULE CARDIOLOGIE

### 3.1 Périmètre Fonctionnel

#### 3.1.1 Dossier Patient Cardiologique

**Données administratives** (héritées Perfex CRM)
- Identité complète, coordonnées, personne de confiance
- Couverture sociale (CNAM, CNSS, mutuelle)
- Médecin traitant et correspondants

**Antécédents cardiovasculaires**
- Facteurs de risque CV : HTA, diabète, tabac, dyslipidémie, hérédité
- Score de risque calculé automatiquement (SCORE2, Framingham)
- Antécédents cardiaques : IDM, AVC, artériopathie, insuffisance cardiaque
- Interventions passées : angioplastie, pontage, ablation, implantation device
- Allergies et intolérances médicamenteuses

**Traitement en cours**
- Liste médicaments avec posologie et date de début
- Anticoagulants avec suivi INR si AVK
- Alertes interactions médicamenteuses
- Historique des modifications thérapeutiques

#### 3.1.2 Gestion des Consultations

| Type | Contenu |
|------|---------|
| **Initiale** | Motif, histoire maladie, examen clinique structuré, classification NYHA, prescription examens |
| **Suivi** | Évolution, tolérance traitement, observance, contrôle FDR, mise à jour traitement |
| **Post-intervention** | Suivi cicatrisation, contrôle dispositif, réadaptation cardiaque |
| **Urgence** | Évaluation rapide, orientation, transmission données |

#### 3.1.3 Gestion des Examens Complémentaires

| Examen | Fonctionnalités |
|--------|-----------------|
| **ECG** | Stockage tracés, interprétation structurée, comparaison automatique, alertes modifications |
| **Échocardiographie** | Rapport structuré, FEVG, dimensions, valvulopathies, suivi évolutif |
| **Holter ECG/TA** | Import rapports, synthèse événements, corrélation symptômes |
| **Épreuve d'effort** | Protocole, durée, FC max, anomalies ECG, conclusion |
| **Coronarographie** | Rapport intervention, lésions, stents posés, traitement antiplaquettaire |

#### 3.1.4 Suivi Dispositifs Implantés

**Pacemakers et DAI**
- Fiche dispositif : marque, modèle, N° série, date implantation
- Paramètres de programmation
- Historique contrôles avec télémétrie
- Alertes fin de vie batterie

**Stents coronaires**
- Registre complet des stents posés
- Date, artère, caractéristiques
- Durée double antiagrégation
- Alertes arrêt prématuré traitement

**Prothèses valvulaires**
- Type (mécanique/biologique), position, date
- Suivi anticoagulation si mécanique
- Échéances contrôle échographique

#### 3.1.5 Suivi Pathologies Chroniques

| Pathologie | Fonctionnalités |
|------------|-----------------|
| **Insuffisance cardiaque** | Classification NYHA évolutive, suivi poids, titration traitements, éducation thérapeutique |
| **HTA** | Relevés tensionnels (cabinet + auto-mesure), atteinte organes cibles, objectifs personnalisés |
| **Fibrillation auriculaire** | CHA2DS2-VASc et HAS-BLED calculés, stratégie, anticoagulation |
| **Coronaropathie** | Suivi post-SCA, contrôle FDR, réadaptation |

#### 3.1.6 Enrichissement IA (Cardio Agent)

**Assistant conversationnel**
- "Quels patients ont une FEVG < 40% ?"
- "Liste des pacemakers à contrôler ce mois"
- "Montre-moi les ECG de M. Ben Ali"

**Aide à la décision**
- Calcul automatique scores de risque
- Suggestions thérapeutiques basées sur guidelines ESC
- Alertes interactions médicamenteuses
- Détection dégradation (variation FEVG, prise de poids IC)

**Automatisations**
- OCR comptes-rendus externes
- Transcription vocale consultations
- Génération courriers de liaison

---

## 4. MODULE OPHTALMOLOGIE

### 4.1 Périmètre Fonctionnel

#### 4.1.1 Dossier Patient Ophtalmologique

**Données administratives** (héritées Perfex CRM)
- Identité complète, coordonnées
- Couverture sociale
- Correspondants (diabétologue, neurologue)

**Antécédents ophtalmologiques**
- Pathologies oculaires : glaucome, cataracte, DMLA, rétinopathie
- Chirurgies antérieures : cataracte, laser, vitrectomie, greffe
- Traitements en cours (collyres, injections IVT)
- Port de correction optique (lunettes, lentilles)

**Antécédents généraux pertinents**
- Diabète (type, ancienneté, HbA1c)
- HTA et maladies cardiovasculaires
- Maladies auto-immunes
- Allergies (notamment collyres)

#### 4.1.2 Gestion des Consultations

| Type | Contenu |
|------|---------|
| **Réfraction** | AV loin/près, réfraction objective/subjective, prescription optique, génération ordonnance |
| **Spécialisée** | Segment antérieur, PIO, fond d'œil, diagnostic, plan traitement |
| **Pré-opératoire** | Bilan pré-anesthésique, biométrie, calcul implant, consentement |
| **Post-opératoire** | J1/J7/J30/J90, contrôle AV, biomicroscopie, complications |

#### 4.1.3 Gestion des Examens Complémentaires

| Examen | Fonctionnalités |
|--------|-----------------|
| **OCT maculaire** | Épaisseur rétinienne, œdème, membranes, comparaison évolutive, alertes progression |
| **OCT papillaire** | RNFL, suivi glaucome, analyse progression |
| **Champ visuel** | Indices MD/PSD/VFI, carte déficits, GPA, corrélation OCT |
| **Angiographie** | Fluorescéine/ICG, stockage vidéo, rapport annoté |
| **Topographie** | Courbure/élévation, pachymétrie, dépistage kératocône |
| **Biométrie** | Longueur axiale, kératométrie, formules calcul implant (Barrett, Hill-RBF) |

#### 4.1.4 Gestion des Implants et Dispositifs

**Implants intraoculaires (IOL)**
- Catalogue implants (monofocaux, multifocaux, toriques, EDOF)
- Stock par référence et puissance
- Traçabilité : lot, N° série, péremption
- Lien automatique patient-implant après chirurgie

**Lentilles de contact**
- Fiche adaptation
- Paramètres : rayon, diamètre, puissance, addition
- Type : souples, rigides, sclérales
- Suivi renouvellements

#### 4.1.5 Gestion du Bloc Opératoire

**Planning opératoire**
- Programmation interventions par type
- Estimation durée par procédure
- Gestion salles et équipements

**Check-list chirurgicale**
- Vérification identité patient et œil
- Consentement signé
- Biométrie et implant validés
- Dilatation effectuée

**Compte-rendu opératoire**
- Type intervention, anesthésie, technique
- Implant posé (traçabilité complète)
- Incidents peropératoires
- Prescriptions post-op

#### 4.1.6 Suivi Pathologies Chroniques

| Pathologie | Fonctionnalités |
|------------|-----------------|
| **Glaucome** | Type, PIO cible, suivi PIO évolutif (courbe), progression CV et OCT, alertes progression rapide |
| **DMLA** | Type (sèche/humide), suivi OCT, protocole injections anti-VEGF, planning, évaluation réponse |
| **Rétinopathie diabétique** | Stade ETDRS, œdème maculaire, suivi photo, laser si indiqué, coordination diabétologue |
| **Sécheresse oculaire** | Score OSDI, tests (Schirmer, BUT), traitement, suivi efficacité |

#### 4.1.7 Enrichissement IA (Ophtalmo Agent)

**Assistant conversationnel**
- "Quels patients ont un glaucome évolutif ?"
- "Liste des DMLA à injecter cette semaine"
- "Montre-moi les OCT de Mme Trabelsi"

**Aide à la décision**
- Détection progression glaucome (OCT + CV)
- Analyse images fond d'œil (dépistage RD, DMLA)
- Suggestions calcul implant optimisé
- Alertes paramètres hors normes

**Automatisations**
- OCR comptes-rendus externes
- Import automatique examens depuis appareils
- Génération ordonnances type
- Courriers vers correspondants

---

## 5. SPÉCIFICATIONS TECHNIQUES

### 5.1 Stack Technique (Architecture Perfex)

```
┌─────────────────────────────────────────────────────────────┐
│                    CLOUDFLARE EDGE                          │
└─────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
   ┌────▼────┐        ┌────▼────┐        ┌────▼────┐
   │  Pages  │        │ Workers │        │   R2    │
   │ (React) │        │(Hono.js)│        │(Storage)│
   └─────────┘        └────┬────┘        └─────────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
   ┌────▼────┐       ┌────▼────┐       ┌────▼────┐
   │   D1    │       │   KV    │       │ Queues  │
   │(Database│       │ (Cache) │       │ (Async) │
   └─────────┘       └─────────┘       └─────────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
   ┌────▼────┐       ┌────▼────┐       ┌────▼────┐
   │ Claude  │       │Vectorize│       │  Vision │
   │   API   │       │  (RAG)  │       │   API   │
   └─────────┘       └─────────┘       └─────────┘
```

### 5.2 Composants Techniques

| Composant | Technologie |
|-----------|-------------|
| Frontend | React 18+ / TypeScript / TailwindCSS / shadcn/ui |
| Backend API | Hono.js sur Cloudflare Workers |
| Base de données | Cloudflare D1 (SQLite) + Drizzle ORM |
| Stockage fichiers | Cloudflare R2 |
| Cache/Sessions | Cloudflare KV |
| Authentification | Clerk / Cloudflare Access |
| Temps réel | Cloudflare Durable Objects |
| AI / LLM | Claude API + Agents spécialisés |
| RAG / Embeddings | Cloudflare Vectorize + BGE embeddings |
| Vision | Claude Vision API (analyse images rétine/ECG) |

### 5.3 Modèle de Données (Extensions D1)

#### Tables Communes Healthcare

```sql
-- Extension Patient (hérite de crm_contacts)
CREATE TABLE healthcare_patients (
  id TEXT PRIMARY KEY,
  contact_id TEXT REFERENCES crm_contacts(id),
  medical_history JSON,
  allergies JSON,
  current_medications JSON,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Consultations génériques
CREATE TABLE healthcare_consultations (
  id TEXT PRIMARY KEY,
  patient_id TEXT REFERENCES healthcare_patients(id),
  practitioner_id TEXT REFERENCES hr_employees(id),
  module TEXT CHECK(module IN ('cardiology', 'ophthalmology', 'dialysis')),
  type TEXT,
  date DATETIME,
  clinical_data JSON,
  prescriptions JSON,
  next_appointment DATE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Examens avec stockage R2
CREATE TABLE healthcare_examinations (
  id TEXT PRIMARY KEY,
  patient_id TEXT REFERENCES healthcare_patients(id),
  module TEXT,
  type TEXT,
  date DATETIME,
  device TEXT,
  raw_data JSON,
  r2_documents JSON,  -- références R2
  interpretation TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Registre dispositifs implantés
CREATE TABLE healthcare_implanted_devices (
  id TEXT PRIMARY KEY,
  patient_id TEXT REFERENCES healthcare_patients(id),
  module TEXT,
  device_type TEXT,
  brand TEXT,
  model TEXT,
  serial_number TEXT UNIQUE,
  lot_number TEXT,
  implant_date DATE,
  implant_center TEXT,
  surgeon_id TEXT REFERENCES hr_employees(id),
  parameters JSON,
  next_control DATE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Suivi pathologies chroniques
CREATE TABLE healthcare_chronic_conditions (
  id TEXT PRIMARY KEY,
  patient_id TEXT REFERENCES healthcare_patients(id),
  module TEXT,
  condition_type TEXT,
  status JSON,
  target_values JSON,
  treatment_protocol JSON,
  last_assessment DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### Tables Spécifiques Cardiologie

```sql
-- Scores de risque cardiovasculaire
CREATE TABLE cardio_risk_scores (
  id TEXT PRIMARY KEY,
  patient_id TEXT REFERENCES healthcare_patients(id),
  score_type TEXT CHECK(score_type IN ('SCORE2', 'Framingham', 'CHA2DS2VASc', 'HASBLED')),
  value REAL,
  components JSON,
  calculated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Contrôles dispositifs (pacemakers, DAI)
CREATE TABLE cardio_device_controls (
  id TEXT PRIMARY KEY,
  device_id TEXT REFERENCES healthcare_implanted_devices(id),
  date DATETIME,
  telemetry JSON,
  battery_status TEXT,
  parameters_adjusted JSON,
  alerts JSON,
  next_control DATE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### Tables Spécifiques Ophtalmologie

```sql
-- Réfractions
CREATE TABLE ophtalmo_refractions (
  id TEXT PRIMARY KEY,
  patient_id TEXT REFERENCES healthcare_patients(id),
  consultation_id TEXT REFERENCES healthcare_consultations(id),
  od_sphere REAL, od_cylinder REAL, od_axis INTEGER,
  og_sphere REAL, og_cylinder REAL, og_axis INTEGER,
  addition REAL,
  visual_acuity_od TEXT,
  visual_acuity_og TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Injections intravitréennes
CREATE TABLE ophtalmo_ivt_injections (
  id TEXT PRIMARY KEY,
  patient_id TEXT REFERENCES healthcare_patients(id),
  eye TEXT CHECK(eye IN ('OD', 'OG')),
  date DATETIME,
  drug TEXT,
  lot_number TEXT,
  surgeon_id TEXT REFERENCES hr_employees(id),
  oct_response JSON,
  next_injection DATE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Chirurgies avec traçabilité implant
CREATE TABLE ophtalmo_surgeries (
  id TEXT PRIMARY KEY,
  patient_id TEXT REFERENCES healthcare_patients(id),
  eye TEXT CHECK(eye IN ('OD', 'OG')),
  surgery_type TEXT,
  date DATETIME,
  surgeon_id TEXT REFERENCES hr_employees(id),
  anesthesia TEXT,
  technique TEXT,
  implant_id TEXT REFERENCES healthcare_implanted_devices(id),
  complications TEXT,
  prescriptions JSON,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 5.4 Intégrations

#### Standards Médicaux
- HL7 FHIR R4 pour interopérabilité
- Format DICOM pour images (écho, OCT)
- Export PDF structuré des comptes-rendus

#### Connecteurs Appareils

| Module | Appareils |
|--------|-----------|
| Cardiologie | ECG numériques (XML/SCP-ECG), télémétrie pacemakers |
| Ophtalmologie | OCT (Zeiss, Heidelberg, Topcon), CV (Humphrey, Octopus), biométrie (IOLMaster) |

#### Perfex Core
- CRM : patients comme contacts enrichis
- Finance : facturation des actes
- Inventory : stock consommables et dispositifs
- Projects : protocoles et études cliniques

### 5.5 Sécurité et Conformité

- Chiffrement AES-256 des données patient et images
- Authentification multi-facteur pour accès médecin
- Audit trail complet des accès et modifications
- Conformité RGPD et réglementations santé tunisiennes
- Préparation certification HDS pour déploiement France

---

## 6. PLANNING PRÉVISIONNEL

### 6.1 Vue d'Ensemble

| Module | Durée | Période |
|--------|-------|---------|
| Cardiologie | 16 semaines | S1 → S16 |
| Ophtalmologie | 17 semaines | S1 → S17 |
| **Développement parallèle** | **20 semaines** | Mutualisation composants |

### 6.2 Planning Cardiologie (16 semaines)

| Phase | Semaines | Activités/Livrables |
|-------|----------|---------------------|
| **Phase 1 - Immersion** | S1-S3 | Observation terrain, interviews, specs détaillées |
| **Phase 2 - MVP Core** | S4-S8 | Dossier patient, consultations, examens (ECG, écho) |
| **Phase 3 - Avancé** | S9-S13 | Dispositifs implantés, pathologies chroniques, alertes, IA |
| **Phase 4 - Production** | S14-S16 | Tests, formation, déploiement |

### 6.3 Planning Ophtalmologie (17 semaines)

| Phase | Semaines | Activités/Livrables |
|-------|----------|---------------------|
| **Phase 1 - Immersion** | S1-S3 | Observation terrain, analyse équipements, specs |
| **Phase 2 - MVP Core** | S4-S9 | Dossier patient, consultations, examens (OCT, CV) |
| **Phase 3 - Avancé** | S10-S14 | Bloc opératoire, implants, pathologies chroniques, IA |
| **Phase 4 - Production** | S15-S17 | Tests, formation, déploiement |

### 6.4 Mutualisation (Développement Parallèle)

```
Semaine  1  2  3  4  5  6  7  8  9  10 11 12 13 14 15 16 17 18 19 20
         ├──┴──┴──┴──┴──┴──┴──┴──┴──┴──┴──┴──┴──┴──┴──┴──┴──┴──┴──┤
         │                                                        │
Communs  ████████████                                             │ Composants partagés
         │                                                        │
Cardio   │     ████████████████████████████████████               │ Module Cardiologie
         │                                                        │
Ophtalmo │           ████████████████████████████████████████     │ Module Ophtalmologie
         │                                                        │
IA       │                               ██████████████████████   │ Agents spécialisés
```

---

## 7. ESTIMATION BUDGÉTAIRE

### 7.1 Hypothèses

- Équipe basée en Tunisie
- Salaire moyen développeur : 2 500 TND/mois
- Coût chargé mensuel : 3 200 TND/mois
- Coût journalier : ~150 TND/jour

### 7.2 Estimation par Module

#### Module Cardiologie

| Phase | Jours/homme | Coût (TND) |
|-------|-------------|------------|
| Phase 1 - Immersion | 15 j | 2 250 |
| Phase 2 - MVP Core | 40 j | 6 000 |
| Phase 3 - Avancé | 35 j | 5 250 |
| Phase 4 - Production | 15 j | 2 250 |
| **Sous-total Cardiologie** | **105 j** | **15 750 TND** |

#### Module Ophtalmologie

| Phase | Jours/homme | Coût (TND) |
|-------|-------------|------------|
| Phase 1 - Immersion | 15 j | 2 250 |
| Phase 2 - MVP Core | 50 j | 7 500 |
| Phase 3 - Avancé | 40 j | 6 000 |
| Phase 4 - Production | 15 j | 2 250 |
| **Sous-total Ophtalmologie** | **120 j** | **18 000 TND** |

#### Composants Partagés (Mutualisation)

| Composant | Jours/homme | Coût (TND) |
|-----------|-------------|------------|
| Healthcare Platform Core | 20 j | 3 000 |
| AI Agents Framework | 15 j | 2 250 |
| Intégrations appareils | 10 j | 1 500 |
| **Sous-total Partagés** | **45 j** | **6 750 TND** |

### 7.3 Récapitulatif Budget Global

| Poste | Jours/homme | Coût (TND) | Coût (EUR) |
|-------|-------------|------------|------------|
| Module Cardiologie | 105 j | 15 750 | ~4 725 € |
| Module Ophtalmologie | 120 j | 18 000 | ~5 400 € |
| Composants Partagés | 45 j | 6 750 | ~2 025 € |
| **TOTAL DÉVELOPPEMENT** | **270 j** | **40 500 TND** | **~12 150 €** |

*Taux de conversion : 1 EUR ≈ 3,33 TND*

### 7.4 Équipe Projet

| Rôle | Allocation | Modules |
|------|------------|---------|
| Tech Lead / Architecte | 40% | Tous |
| Développeur Full-Stack Senior | 100% | Cardio + Partagés |
| Développeur Full-Stack Senior | 100% | Ophtalmo + Partagés |
| Développeur Full-Stack Junior | 100% | Support les deux modules |
| QA / Testeur | 30% | Tous |

### 7.5 Coûts Infrastructure (mensuel)

| Service | Coût estimé (TND) |
|---------|-------------------|
| Cloudflare Workers/Pages | 100 |
| Cloudflare D1 + R2 (images) | 250 |
| Claude API (+ Vision) | 300 |
| Vectorize (RAG) | 50 |
| **TOTAL mensuel** | **700 TND** |

---

## 8. ANNEXES

### 8.1 Glossaire Cardiologie

| Terme | Définition |
|-------|------------|
| **FEVG** | Fraction d'Éjection du Ventricule Gauche |
| **NYHA** | Classification insuffisance cardiaque (I à IV) |
| **IDM** | Infarctus Du Myocarde |
| **FA** | Fibrillation Auriculaire |
| **DAI** | Défibrillateur Automatique Implantable |
| **CHA2DS2-VASc** | Score risque thromboembolique dans FA |
| **HAS-BLED** | Score risque hémorragique |
| **SCORE2** | Risque cardiovasculaire à 10 ans |
| **Holter** | Enregistrement ECG continu 24-48h |
| **Coronarographie** | Visualisation artères coronaires |

### 8.2 Glossaire Ophtalmologie

| Terme | Définition |
|-------|------------|
| **OD / OG / OU** | Œil Droit / Œil Gauche / Les deux yeux |
| **AV** | Acuité Visuelle |
| **PIO** | Pression Intraoculaire |
| **OCT** | Tomographie par Cohérence Optique |
| **RNFL** | Couche fibres nerveuses rétiniennes |
| **CV** | Champ Visuel |
| **DMLA** | Dégénérescence Maculaire Liée à l'Âge |
| **RD** | Rétinopathie Diabétique |
| **IOL** | Implant Intraoculaire |
| **IVT** | Injection Intravitréenne |
| **Anti-VEGF** | Traitement DMLA humide (aflibercept, ranibizumab) |

### 8.3 Rôles et Permissions

| Rôle | Cardiologie | Ophtalmologie |
|------|-------------|---------------|
| Médecin spécialiste | Accès complet | Accès complet |
| Médecin assistant | Consultations, prescription limitée | Consultations, prescription limitée |
| Infirmier(e) | Constantes, préparation | Préparation, instillation collyres |
| Technicien examens | ECG, Holter | OCT, CV, biométrie |
| Orthoptiste | - | Bilan orthoptique |
| Secrétaire médicale | Agenda, facturation | Agenda, facturation |
| Administrateur | Configuration système | Configuration système |

### 8.4 Scores et Classifications Implémentés

#### Cardiologie
- SCORE2 (risque CV à 10 ans)
- CHA2DS2-VASc (risque AVC dans FA)
- HAS-BLED (risque hémorragique)
- Classification NYHA (insuffisance cardiaque)

#### Ophtalmologie
- Classification ETDRS (rétinopathie diabétique)
- Stades DMLA (précoce → atrophique/humide)
- Classification Hodapp-Parrish-Anderson (glaucome)
- Score OSDI (sécheresse oculaire)

---

*Document généré par DevFactory - Décembre 2025*
*Perfex Healthcare - Extension verticale santé de l'ERP AI-native Perfex*
