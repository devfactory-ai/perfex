# @perfex/dialyse-sdk

SDK TypeScript pour intégrer le module Dialyse (Hémodialyse) de Perfex dans des systèmes ERP externes.

## Installation

```bash
npm install @perfex/dialyse-sdk
# ou
yarn add @perfex/dialyse-sdk
# ou
pnpm add @perfex/dialyse-sdk
```

## Configuration

```typescript
import { DialyseClient } from '@perfex/dialyse-sdk';

const client = new DialyseClient({
  baseUrl: 'https://your-perfex-instance.com',
  accessToken: 'your-jwt-token',
  organizationId: 'org-uuid', // optionnel, peut être défini plus tard
  timeout: 30000, // optionnel, défaut: 30000ms
});

// Ou utiliser une API Key
const clientWithApiKey = new DialyseClient({
  baseUrl: 'https://your-perfex-instance.com',
  apiKey: 'your-api-key',
});
```

## Utilisation

### Dashboard

```typescript
// Obtenir les données du tableau de bord
const dashboard = await client.getDashboard();
console.log(`Patients actifs: ${dashboard.patients.activePatients}`);
console.log(`Sessions en cours: ${dashboard.sessions.inProgressSessions}`);
```

### Patients

```typescript
import { DialysePatient, CreatePatientInput } from '@perfex/dialyse-sdk';

// Lister les patients
const patients = await client.listPatients({
  search: 'dupont',
  status: 'active',
  requiresIsolation: false,
  limit: 20,
});

// Obtenir un patient
const patient = await client.getPatient('patient-uuid');

// Créer un patient
const newPatient = await client.createPatient({
  contactId: 'contact-uuid',
  medicalId: 'MED-001',
  bloodType: 'A+',
  dryWeight: 70.5,
  hivStatus: 'negative',
  hbvStatus: 'negative',
  hcvStatus: 'negative',
  requiresIsolation: false,
  patientStatus: 'active',
  dialysisStartDate: new Date('2024-01-15'),
});

// Mettre à jour la sérologie
await client.updatePatientSerology('patient-uuid', {
  hbvStatus: 'positive',
});

// Statistiques
const stats = await client.getPatientStats();
```

### Accès Vasculaires

```typescript
// Lister les accès d'un patient
const accesses = await client.listVascularAccesses('patient-uuid');

// Créer un accès
const access = await client.createVascularAccess({
  patientId: 'patient-uuid',
  type: 'fav', // 'fav' | 'catheter_permanent' | 'catheter_temporary' | 'graft'
  location: 'Avant-bras gauche',
  creationDate: new Date('2024-01-10'),
  surgeon: 'Dr. Martin',
  status: 'active',
});

// Mettre à jour le statut
await client.updateVascularAccessStatus('access-uuid', 'failed', 'Thrombose');
```

### Prescriptions

```typescript
// Lister les prescriptions
const prescriptions = await client.listPrescriptions('patient-uuid', 'active');

// Obtenir la prescription active
const activePrescription = await client.getActivePrescription('patient-uuid');

// Créer une prescription
const prescription = await client.createPrescription({
  patientId: 'patient-uuid',
  type: 'hemodialysis', // 'hemodialysis' | 'hemofiltration' | 'hemodiafiltration'
  durationMinutes: 240,
  frequencyPerWeek: 3,
  dryWeight: 70.5,
  bloodFlowRate: 300,
  dialysateFlowRate: 500,
  dialyzerType: 'FX80',
  anticoagulationType: 'heparin',
  anticoagulationDose: '5000 UI',
  dialysateSodium: 138,
  dialysatePotassium: 2,
  dialysateBicarbonate: 32,
  startDate: new Date(),
});

// Renouveler une prescription
const renewed = await client.renewPrescription('prescription-uuid', {
  dryWeight: 69.0, // nouvelles valeurs
});

// Annuler une prescription
await client.cancelPrescription('prescription-uuid');
```

### Machines

```typescript
// Lister les machines
const machines = await client.listMachines({
  status: 'available',
  isolationOnly: false,
});

// Obtenir une machine
const machine = await client.getMachine('machine-uuid');

// Créer une machine
const newMachine = await client.createMachine({
  machineNumber: 'HD-001',
  model: 'Fresenius 5008S',
  manufacturer: 'Fresenius',
  serialNumber: 'SN123456',
  status: 'available',
  isolationOnly: false,
  location: 'Salle A - Poste 1',
  installationDate: new Date('2023-06-01'),
});

// Mettre à jour le statut
await client.updateMachineStatus('machine-uuid', 'maintenance');

// Machines disponibles pour isolation
const isolationMachines = await client.getAvailableMachines(true);

// Statistiques
const machineStats = await client.getMachineStats();
```

### Maintenance des Machines

```typescript
// Lister les maintenances
const maintenances = await client.listMachineMaintenance('machine-uuid');

// Planifier une maintenance
const maintenance = await client.createMaintenance({
  machineId: 'machine-uuid',
  type: 'preventive', // 'preventive' | 'corrective' | 'calibration' | 'inspection'
  scheduledDate: new Date('2024-02-01'),
  description: 'Maintenance préventive trimestrielle',
  vendor: 'Fresenius Service',
});

// Compléter une maintenance
await client.completeMaintenance('maintenance-uuid', {
  workPerformed: 'Remplacement des filtres et calibration',
  cost: 450.00,
  partsReplaced: ['Filtre HEPA', 'Joint pompe'],
});
```

### Créneaux de Sessions

```typescript
// Lister les créneaux
const slots = await client.listSlots();

// Créer un créneau
const slot = await client.createSlot({
  name: 'Matin',
  startTime: '07:00',
  endTime: '12:00',
  daysOfWeek: [1, 3, 5], // Lundi, Mercredi, Vendredi
  maxPatients: 8,
  active: true,
});

// Mettre à jour un créneau
await client.updateSlot('slot-uuid', { maxPatients: 10 });
```

### Sessions de Dialyse

```typescript
// Lister les sessions
const sessions = await client.listSessions({
  patientId: 'patient-uuid',
  status: 'scheduled',
  dateFrom: '2024-01-01',
  dateTo: '2024-01-31',
});

// Obtenir une session
const session = await client.getSession('session-uuid');

// Créer une session
const newSession = await client.createSession({
  patientId: 'patient-uuid',
  prescriptionId: 'prescription-uuid',
  machineId: 'machine-uuid',
  sessionDate: new Date('2024-01-15'),
  scheduledStartTime: '08:00',
  primaryNurseId: 'nurse-uuid',
});

// Créer des sessions récurrentes (4 semaines)
const recurringSessions = await client.createRecurringSessions({
  patientId: 'patient-uuid',
  prescriptionId: 'prescription-uuid',
  sessionDate: new Date('2024-01-15'),
  scheduledStartTime: '08:00',
}, 4);

// Workflow de session
await client.checkInSession('session-uuid');      // Patient arrivé
await client.startSession('session-uuid');        // Démarrer la dialyse
await client.completeSession('session-uuid');     // Terminer la session

// Annuler une session
await client.cancelSession('session-uuid', 'Patient malade');
```

### Monitoring Per-Dialytique

```typescript
import { SessionPhase } from '@perfex/dialyse-sdk';

// Lister les enregistrements
const records = await client.listSessionRecords('session-uuid');

// Ajouter un enregistrement pré-dialyse
await client.createSessionRecord('session-uuid', {
  phase: 'pre', // 'pre' | 'intra' | 'post'
  weightKg: 72.5,
  systolicBp: 140,
  diastolicBp: 85,
  heartRate: 78,
  temperature: 36.8,
});

// Enregistrement intra-dialyse
await client.createSessionRecord('session-uuid', {
  phase: 'intra',
  systolicBp: 125,
  diastolicBp: 75,
  heartRate: 82,
  arterialPressure: -180,
  venousPressure: 150,
  transmembranePressure: 200,
  bloodFlowRate: 300,
  dialysateFlowRate: 500,
  cumulativeUf: 1.5,
});

// Enregistrement post-dialyse
await client.createSessionRecord('session-uuid', {
  phase: 'post',
  weightKg: 70.5,
  systolicBp: 110,
  diastolicBp: 70,
  heartRate: 72,
  ufAchieved: 2.0,
  ufPrescribed: 2.0,
  compressionTime: 10,
});
```

### Incidents de Session

```typescript
// Lister les incidents
const incidents = await client.listSessionIncidents('session-uuid');

// Signaler un incident
await client.createSessionIncident('session-uuid', {
  type: 'hypotension', // 'hypotension' | 'cramps' | 'nausea' | 'bleeding' | etc.
  severity: 'moderate', // 'mild' | 'moderate' | 'severe'
  description: 'Chute de tension à 90/60',
  intervention: 'Position Trendelenburg, NaCl 0.9% 100ml',
  outcome: 'Récupération complète après 15 minutes',
});
```

### Résultats de Laboratoire

```typescript
// Lister les résultats
const labResults = await client.listLabResults('patient-uuid', 10);

// Dernier résultat
const latest = await client.getLatestLabResult('patient-uuid');

// Créer un résultat
const labResult = await client.createLabResult({
  patientId: 'patient-uuid',
  labDate: new Date(),
  ureaPre: 120,
  ureaPost: 35,
  creatinine: 850,
  hemoglobin: 10.5,
  potassium: 5.2,
  calcium: 2.3,
  phosphorus: 1.8,
  pth: 450,
  ferritin: 350,
});

// Importer des résultats
const importResult = await client.importLabResults('patient-uuid', [
  { marker: 'hemoglobin', value: 10.5, unit: 'g/dL' },
  { marker: 'potassium', value: 5.2, unit: 'mmol/L' },
]);

// Calculer Kt/V
const ktv = await client.calculateKtV({
  ureaPre: 120,
  ureaPost: 35,
  postWeight: 70,
  durationMinutes: 240,
  ufVolume: 2.0,
});
console.log(`Kt/V: ${ktv}`); // Ex: 1.45

// Tendance d'un marqueur
const trend = await client.getLabTrend('patient-uuid', 'hemoglobin', 6);
```

### Alertes Cliniques

```typescript
// Lister les alertes
const alerts = await client.listAlerts({
  status: 'active',
  severity: 'critical',
  type: 'serology_update',
});

// Obtenir une alerte
const alert = await client.getAlert('alert-uuid');

// Créer une alerte
const newAlert = await client.createAlert({
  patientId: 'patient-uuid',
  alertType: 'custom',
  severity: 'warning',
  title: 'Poids sec à réévaluer',
  description: 'Le patient a pris 5kg en 2 semaines',
  dueDate: new Date('2024-02-01'),
});

// Workflow d'alerte
await client.acknowledgeAlert('alert-uuid');
await client.resolveAlert('alert-uuid', 'Prescription modifiée, nouveau poids sec: 68kg');

// Ou rejeter
await client.dismissAlert('alert-uuid');

// Statistiques
const alertStats = await client.getAlertStats();

// Générer les alertes automatiques
const generated = await client.generateAutomatedAlerts();
console.log(`Alertes générées: ${generated.serology + generated.vascularAccess + generated.lab}`);
```

## Gestion des Erreurs

```typescript
import { DialyseClient, DialyseApiError } from '@perfex/dialyse-sdk';

try {
  const patient = await client.getPatient('invalid-uuid');
} catch (error) {
  if (error instanceof DialyseApiError) {
    console.error(`Erreur API: ${error.message}`);
    console.error(`Code HTTP: ${error.statusCode}`);
    console.error(`Réponse:`, error.response);
  }
}
```

## Types TypeScript

Tous les types sont exportés pour une utilisation directe:

```typescript
import type {
  // Patient
  DialysePatient,
  CreatePatientInput,
  PatientStats,
  SerologyStatus,
  PatientStatus,
  BloodType,

  // Accès vasculaire
  VascularAccess,
  VascularAccessType,
  VascularAccessStatus,

  // Prescription
  DialysePrescription,
  DialysisType,
  PrescriptionStatus,

  // Machine
  DialysisMachine,
  MachineStatus,
  MachineMaintenance,
  MaintenanceType,

  // Session
  DialysisSession,
  SessionStatus,
  SessionPhase,
  SessionRecord,
  SessionIncident,
  IncidentType,
  IncidentSeverity,

  // Lab
  LabResult,

  // Alertes
  ClinicalAlert,
  AlertType,
  AlertSeverity,
  AlertStatus,

  // Dashboard
  DashboardData,

  // API
  ApiResponse,
  PaginatedResponse,
  DialyseSdkConfig,
} from '@perfex/dialyse-sdk';
```

## Valeurs des Enums

### Statuts Sérologie
- `negative` - Négatif
- `positive` - Positif
- `unknown` - Inconnu

### Statuts Patient
- `active` - Actif
- `transferred` - Transféré
- `deceased` - Décédé
- `transplanted` - Transplanté
- `recovered` - Récupéré

### Types d'Accès Vasculaire
- `fav` - Fistule artério-veineuse
- `catheter_permanent` - Cathéter permanent
- `catheter_temporary` - Cathéter temporaire
- `graft` - Pontage

### Types de Dialyse
- `hemodialysis` - Hémodialyse
- `hemofiltration` - Hémofiltration
- `hemodiafiltration` - Hémodiafiltration

### Statuts Machine
- `available` - Disponible
- `in_use` - En utilisation
- `maintenance` - En maintenance
- `out_of_service` - Hors service

### Statuts Session
- `scheduled` - Planifiée
- `checked_in` - Patient arrivé
- `in_progress` - En cours
- `completed` - Terminée
- `cancelled` - Annulée
- `no_show` - Absent

### Types d'Incident
- `hypotension` - Hypotension
- `cramps` - Crampes
- `nausea` - Nausées
- `bleeding` - Saignement
- `clotting` - Coagulation
- `fever` - Fièvre
- `chest_pain` - Douleur thoracique
- `arrhythmia` - Arythmie
- `access_problem` - Problème d'accès
- `other` - Autre

### Types d'Alerte
- `prescription_renewal` - Renouvellement de prescription
- `lab_due` - Bilan à faire
- `vaccination` - Vaccination
- `vascular_access` - Accès vasculaire
- `serology_update` - Mise à jour sérologie
- `weight_deviation` - Déviation de poids
- `custom` - Personnalisée

## Licence

MIT
