# Fonctionnalites Manquantes - Perfex ERP

**Date** : 2026-04-14
**Base** : Audit croise backend/frontend/packages

---

## 1. BLOQUANT - Fonctionnalites declarees mais non fonctionnelles

### 1.1 Moteur d'execution de Workflows (MISSING)
- **Fichier** : `apps/workers/api/src/services/workflows.service.ts`
- **Etat** : Les workflows peuvent etre crees/lus/mis a jour via CRUD, mais `triggerWorkflow()` cree juste un record "pending" sans jamais executer les etapes.
- **Manque** : Execution engine, evaluateur de conditions, processeur d'approbation, retry/error handling.
- **Impact** : Les workflows d'approbation (achats, conges, factures) ne fonctionnent pas.

### 1.2 2FA non integre dans le flow d'auth (MISSING)
- **Fichier** : `apps/workers/api/src/services/two-factor.service.ts`
- **Etat** : Le service 2FA est **entierement implemente** (TOTP, backup codes, verification) mais **aucun endpoint** n'est expose dans `routes/auth.ts`.
- **Manque** :
  - `POST /auth/2fa/setup` - Demarrer le setup 2FA
  - `POST /auth/2fa/verify` - Verifier le code TOTP
  - `POST /auth/2fa/disable` - Desactiver 2FA
  - `POST /auth/login/verify-2fa` - Challenge 2FA au login
- **Impact** : Pas de securite 2FA malgre le service pret.

### 1.3 Portail Patient - Service placeholder (STUB)
- **Fichier** : `apps/workers/api/src/services/patient-portal/portal.service.ts`
- **Etat** : Les routes existent, le service est appele, mais les methodes retournent des donnees placeholder.
- **Manque** : Implementation reelle de `getDashboard()`, `getUpcomingAppointments()`, `getLabResults()`, `getMedications()`, `getMessages()`, `requestAppointment()`, `trackSymptoms()`.
- **Impact** : Le portail patient ne montre pas de vraies donnees.

---

## 2. IMPORTANT - Services partiellement implementes

### 2.1 Specialites medicales - Persistence DB manquante (PARTIAL)
8 services cliniques ont toute la logique metier mais **aucune persistence en base** :

| Service | Fichier | Methodes vides |
|---------|---------|----------------|
| Endocrinologie | `services/specialties/endocrinology.service.ts` | `saveEndocrinologyPatient()`, `updateEndocrinologyPatient()`, `getEndocrinologyPatient()` |
| Psychiatrie | `services/specialties/psychiatry.service.ts` | `savePsychiatryPatient()`, `triggerSuicideScreening()`, `initiateSafetyPlan()`, `alertCareTeam()` + 6 autres |
| Neurologie | `services/specialties/neurology.service.ts` | `getNeurologyPatient()` et methodes DB |
| Oncologie | `services/specialties/oncology.service.ts` | `getOncologyPatient()` retourne `null` |
| Pneumologie | `services/specialties/pulmonology.service.ts` | `getPulmonologyPatient()` et methodes DB |
| ADT (Admissions) | `services/adt/adt.service.ts` | `getActiveAdmissions()`, `getAllBeds()`, `findAvailableBedInUnit()` + 6 autres retournent `[]` |
| Urgences | `services/emergency/emergency-department.service.ts` | Stubs DB |
| Bloc operatoire | `services/surgery/operating-room.service.ts` | Stubs DB |

**Impact** : Les donnees cliniques de ces specialites fonctionnent en memoire uniquement, rien n'est sauvegarde.

### 2.2 Prescriptions electroniques - Stubs securite (PARTIAL)
- **Fichier** : `apps/workers/api/src/services/prescribing/e-prescribing.service.ts`
- **Manque** : `getPrescription()`, `getInteractionBetween()`, `checkLactationSafety()`, `checkRenalContraindication()`, `getRenalDoseAdjustment()` retournent `null`.
- **Impact** : Les alertes de securite medicamenteuse sont des placeholders.

---

## 3. MINEUR - Gaps frontend et i18n

### 3.1 Pages d'aide sans API (DISPLAY-ONLY)
| Page | Probleme |
|------|----------|
| `pages/help/HelpCenterPage.tsx` | Contenu hardcode, pas de fetch API |
| `pages/help/FAQPage.tsx` | FAQ entierement statique |
| `pages/help/GettingStartedPage.tsx` | Guide statique |

### 3.2 Texte francais hardcode sans i18n
| Page | Probleme |
|------|----------|
| `HelpCenterPage.tsx` | Tout le texte en francais hardcode |
| `FAQPage.tsx` | Toutes les Q&A hardcodees |
| `GettingStartedPage.tsx` | Guide en francais uniquement |

### 3.3 HACCP formulaire incomplet
- **Fichier** : `pages/traceability/TraceabilityPage.tsx:114`
- **Code** : `void showCpForm; // To be implemented - HACCP control point form`

### 3.4 LoginPage-simple.tsx non fonctionnel
- **Fichier** : `pages/auth/LoginPage-simple.tsx`
- **Code** : `alert('Login clicked!')` au lieu d'appeler l'API
- **Note** : Page de demo/test, pas utilisee en production.

---

## 4. GAPS PACKAGES

### 4.1 Validateurs Zod manquants pour 6 types
| Type | Fichier type | Validateur |
|------|-------------|------------|
| API responses | `shared/src/types/api.ts` | MANQUANT |
| Clinical AI | `shared/src/types/clinical-ai.ts` | MANQUANT |
| Imaging AI | `shared/src/types/imaging-ai.ts` | MANQUANT |
| Patient Portal | `shared/src/types/patient-portal.ts` | MANQUANT |
| Population Health | `shared/src/types/population-health.ts` | MANQUANT |
| RPM | `shared/src/types/rpm.ts` | MANQUANT |

### 4.2 Tables DB sans API de requetage
| Table | Probleme |
|-------|----------|
| `audit_logs` | Pas d'endpoints de recherche/filtrage |
| `document_shares` | Pas d'API de partage de documents |
| `webhook_logs` | Logs crees mais non consultables |
| `api_key_usage` | Metriques d'usage non exposees |
| `entity_tags` | API de tagging incomplete |

---

## 5. CE QUI FONCTIONNE (Confirme)

| Composant | Statut |
|-----------|--------|
| Email (Resend) | COMPLET - Templates healthcare inclus |
| SMS (Twilio/SNS) | COMPLET - Production + dev mode |
| Token revocation (logout) | COMPLET - KV + D1 |
| AI Chat (Workers AI) | COMPLET - 6 roles supportes |
| Integrations paiement (D17, Flouci, Konnect, Paymee) | COMPLET - Vrais appels API |
| Integrations SMS (Ooredoo, Tunisie Telecom) | COMPLET - Vrais appels API |
| Integrations shipping (Aramex SOAP, Livrili REST) | COMPLET - Vrais appels API |
| Fiscal CNSS | COMPLET |
| Dialyse SDK | COMPLET - 51 endpoints |
| 31 schemas DB | COMPLET - Tous references |
| 173 pages frontend | COMPLET - Toutes connectees |

---

## 6. MATRICE DE PRIORITE

| # | Fonctionnalite | Severite | Effort | Priorite |
|---|---------------|----------|--------|----------|
| 1.1 | Workflow execution engine | CRITIQUE | 20h | P0 |
| 1.2 | 2FA endpoints dans auth | HAUTE | 4h | P0 |
| 1.3 | Patient portal service impl | HAUTE | 8h | P1 |
| 2.1 | DB persistence specialites (8 services) | HAUTE | 16h | P1 |
| 2.2 | E-prescribing safety checks | HAUTE | 6h | P1 |
| 3.1 | Pages aide via API | BASSE | 4h | P2 |
| 3.2 | i18n pages aide | BASSE | 2h | P2 |
| 3.3 | HACCP formulaire | MOYENNE | 3h | P2 |
| 4.1 | Validateurs Zod manquants | MOYENNE | 4h | P2 |
| 4.2 | API audit_logs/tags/shares | BASSE | 6h | P3 |

**Total estime** : ~73h de travail pour completer toutes les fonctionnalites manquantes.
