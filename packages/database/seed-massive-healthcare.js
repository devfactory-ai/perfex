/**
 * Massive Healthcare Data Seed Script
 * Generates thousands of records for Dialyse, Cardiology, and Ophthalmology modules
 */

const fs = require('fs');

// Configuration
const CONFIG = {
  dialyse: {
    patients: 2000,
    sessions: 5000,
    machines: 50,
    prescriptions: 2000,
    labResults: 8000,
    alerts: 500,
    vascularAccesses: 2500,
    protocols: 30,
    staff: 100,
    billing: 3000,
    transport: 1500,
    consumables: 200,
    maintenance: 300,
  },
  cardiology: {
    patients: 2000,
    consultations: 6000,
    ecg: 4000,
    echo: 3000,
    pacemakers: 400,
    stents: 800,
    riskScores: 5000,
    medications: 8000,
    events: 1500,
    alerts: 600,
    appointments: 4000,
  },
  ophthalmology: {
    patients: 2000,
    consultations: 5000,
    refraction: 4000,
    tonometry: 3500,
    oct: 2500,
    visualFields: 2000,
    biometry: 1500,
    iolImplants: 1200,
    surgeries: 1000,
    ivt: 800,
    osdi: 3000,
    alerts: 400,
  }
};

// Helper functions
const uuid = () => crypto.randomUUID();
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomFloat = (min, max, decimals = 2) => parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
const randomDate = (startYear = 2020, endYear = 2025) => {
  const start = new Date(startYear, 0, 1).getTime();
  const end = new Date(endYear, 11, 31).getTime();
  return new Date(start + Math.random() * (end - start)).toISOString();
};
const randomPastDate = (daysAgo = 365) => {
  const now = Date.now();
  const past = now - randomInt(1, daysAgo) * 24 * 60 * 60 * 1000;
  return new Date(past).toISOString();
};
const randomFutureDate = (daysAhead = 90) => {
  const now = Date.now();
  const future = now + randomInt(1, daysAhead) * 24 * 60 * 60 * 1000;
  return new Date(future).toISOString();
};
const pick = (arr) => arr[randomInt(0, arr.length - 1)];
const escape = (str) => str ? str.replace(/'/g, "''") : '';

// Data arrays
const firstNames = ['Mohamed', 'Fatima', 'Ahmed', 'Khadija', 'Youssef', 'Aicha', 'Omar', 'Salma', 'Hassan', 'Nadia', 'Rachid', 'Laila', 'Karim', 'Samira', 'Mehdi', 'Zineb', 'Hamid', 'Houda', 'Samir', 'Imane', 'Mustapha', 'Hafsa', 'Driss', 'Sanaa', 'Khalid', 'Najat', 'Brahim', 'Amina', 'Jamal', 'Farida', 'Aziz', 'Malika', 'Nabil', 'Souad', 'Tarik', 'Latifa', 'Reda', 'Naima', 'Adil', 'Karima', 'Amine', 'Jamila', 'Hicham', 'Hanane', 'Younes', 'Siham', 'Zakaria', 'Wafa', 'Ismail', 'Ghita'];
const lastNames = ['Alaoui', 'Bennani', 'Cherkaoui', 'Doukkali', 'El Fassi', 'Filali', 'Guerraoui', 'Hajji', 'Idrissi', 'Jabri', 'Kadiri', 'Lahlou', 'Mansouri', 'Naciri', 'Ouazzani', 'Berrada', 'Tazi', 'Chraibi', 'Sqalli', 'Benhima', 'Kettani', 'Benjelloun', 'Fassi Fihri', 'Sefrioui', 'Benkirane', 'Mekouar', 'Lahrichi', 'Tahiri', 'Zniber', 'Amrani'];
const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const serologyStatus = ['negative', 'positive', 'unknown'];
const patientStatuses = ['active', 'transferred', 'deceased', 'transplanted', 'recovered'];
const etiologies = ['Diabete', 'Hypertension', 'Glomerulonephrite', 'Polykystose renale', 'Idiopathique', 'Nephropathie obstructive'];
const allergies = ['Aucune', 'Penicilline', 'Iode', 'Latex', 'Sulfamides', 'Aspirine'];
const accessTypes = ['fav', 'catheter_permanent', 'catheter_temporary', 'graft'];
const accessLocations = ['Bras gauche', 'Bras droit', 'Avant-bras gauche', 'Avant-bras droit', 'Cuisse gauche', 'Cuisse droite', 'Jugulaire droite', 'Jugulaire gauche', 'Sous-claviere droite', 'Sous-claviere gauche'];
const machineStatuses = ['available', 'in_use', 'maintenance', 'out_of_service'];
const machineBrands = ['Fresenius', 'B.Braun', 'Nipro', 'Gambro', 'Baxter', 'NxStage'];
const sessionStatuses = ['scheduled', 'checked_in', 'in_progress', 'completed', 'cancelled', 'no_show'];
const alertSeverities = ['critical', 'high', 'medium', 'low'];
const alertTypes = ['lab_result', 'vital_sign', 'medication', 'infection', 'vascular_access', 'scheduling'];

// Cardiology specific
const cardioDiagnoses = ['Hypertension arterielle', 'Insuffisance cardiaque', 'Cardiopathie ischemique', 'Fibrillation auriculaire', 'Valvulopathie', 'Cardiomyopathie dilatee', 'Arythmie ventriculaire', 'Pericardite', 'Endocardite', 'Syndrome coronarien aigu'];
const ecgFindings = ['Normal', 'Tachycardie sinusale', 'Bradycardie sinusale', 'Fibrillation auriculaire', 'Flutter auriculaire', 'Bloc de branche gauche', 'Bloc de branche droit', 'Extrasystoles ventriculaires', 'Onde Q pathologique', 'Sus-decalage ST'];
const echoFindings = ['Normal', 'Hypertrophie VG', 'Dilatation VG', 'FEVG alteree', 'Valvulopathie mitrale', 'Valvulopathie aortique', 'Epanchement pericardique', 'Hypertension pulmonaire', 'Cardiopathie hypertrophique', 'Akinésie segmentaire'];
const pacemakerTypes = ['Simple chambre', 'Double chambre', 'Triple chambre (CRT)', 'DAI simple', 'DAI double', 'CRT-D'];
const pacemakerBrands = ['Medtronic', 'Boston Scientific', 'Abbott', 'Biotronik', 'MicroPort'];
const stentTypes = ['BMS (nu)', 'DES (actif)', 'BVS (resorbable)'];
const coronaryArteries = ['IVA', 'Cx', 'CD', 'Marginale', 'Diagonale', 'IVP', 'Bissectrice', 'Tronc commun'];
const medications = ['Bisoprolol', 'Ramipril', 'Amlodipine', 'Furosemide', 'Spironolactone', 'Aspirine', 'Clopidogrel', 'Atorvastatine', 'Warfarine', 'Rivaroxaban', 'Amiodarone', 'Digoxine'];
const cardioEvents = ['Infarctus du myocarde', 'AVC', 'Embolie pulmonaire', 'Arret cardiaque', 'Choc cardiogenique', 'Decompensation cardiaque', 'Syncope', 'Tachycardie ventriculaire'];

// Ophthalmology specific
const ophthalmoDiagnoses = ['Cataracte', 'Glaucome', 'DMLA', 'Retinopathie diabetique', 'Decollement de retine', 'Keratocone', 'Secheresse oculaire', 'Uveite', 'Neuropathie optique', 'Occlusion veineuse retinienne'];
const eyeOptions = ['OD', 'OS', 'OU'];
const refractionTypes = ['Myopie', 'Hypermetropie', 'Astigmatisme', 'Presbytie', 'Emmetropie'];
const surgeryTypes = ['Cataracte', 'Glaucome', 'Vitrectomie', 'Decollement de retine', 'Greffe de cornee', 'Chirurgie refractive', 'Strabisme', 'Ptosis'];
const iolTypes = ['Monofocale', 'Multifocale', 'Torique', 'EDOF', 'Accommodative'];
const iolBrands = ['Alcon', 'Johnson & Johnson', 'Zeiss', 'Bausch + Lomb', 'Hoya'];
const ivtDrugs = ['Eylea (aflibercept)', 'Lucentis (ranibizumab)', 'Avastin (bevacizumab)', 'Vabysmo (faricimab)', 'Ozurdex (dexamethasone)'];

let statements = [];
const ORG_ID = 'org-health-001';
const COMPANY_ID = 'company-0001';
const ADMIN_USER = 'user-admin-001';

// Store generated IDs for foreign key references
const generatedIds = {
  dialysePatients: [],
  dialyseContacts: [],
  dialyseMachines: [],
  dialysePrescriptions: [],
  dialyseProtocols: [],
  dialyseStaff: [],
  dialyseSessions: [],
  cardiologyPatients: [],
  cardiologyHealthcarePatients: [],
  ophthalmologyPatients: [],
  ophthalmologyHealthcarePatients: [],
};

console.log('Generating massive healthcare data...');

// ============================================================================
// DIALYSE MODULE
// ============================================================================

console.log('Generating Dialyse data...');

// Dialyse Patients (with contacts)
for (let i = 0; i < CONFIG.dialyse.patients; i++) {
  const contactId = `hc-contact-${String(i + 1000).padStart(5, '0')}`;
  const patientId = `dial-patient-${String(i + 1000).padStart(5, '0')}`;
  const firstName = pick(firstNames);
  const lastName = pick(lastNames);
  const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@email.com`;
  const phone = `+212${randomInt(600000000, 699999999)}`;

  generatedIds.dialyseContacts.push(contactId);
  generatedIds.dialysePatients.push(patientId);

  // Contact
  statements.push(`INSERT OR IGNORE INTO contacts (id, organization_id, first_name, last_name, email, phone, status, is_primary, created_by, created_at, updated_at) VALUES ('${contactId}', '${ORG_ID}', '${escape(firstName)}', '${escape(lastName)}', '${email}', '${phone}', 'active', 0, '${ADMIN_USER}', ${Date.now()}, ${Date.now()});`);

  // Patient
  const bloodType = pick(bloodTypes);
  const hivStatus = pick(serologyStatus);
  const hbvStatus = pick(serologyStatus);
  const hcvStatus = pick(serologyStatus);
  const requiresIsolation = (hivStatus === 'positive' || hbvStatus === 'positive' || hcvStatus === 'positive') ? 1 : 0;
  const patientStatus = pick(patientStatuses);
  const dryWeight = randomFloat(45, 95);
  const etiology = pick(etiologies);
  const allergy = pick(allergies);
  const dialysisStartDate = new Date(randomDate(2015, 2024)).getTime();

  statements.push(`INSERT OR IGNORE INTO dialyse_patients (id, organization_id, contact_id, medical_id, blood_type, dry_weight, renal_failure_etiology, allergies, hiv_status, hbv_status, hcv_status, requires_isolation, hepatitis_b_vaccinated, patient_status, dialysis_start_date, notes, created_by, created_at, updated_at) VALUES ('${patientId}', '${ORG_ID}', '${contactId}', 'MED${randomInt(10000, 99999)}', '${bloodType}', ${dryWeight}, '${etiology}', '${allergy}', '${hivStatus}', '${hbvStatus}', '${hcvStatus}', ${requiresIsolation}, ${randomInt(0, 1)}, '${patientStatus}', ${dialysisStartDate}, 'Patient dialyse', '${ADMIN_USER}', ${Date.now()}, ${Date.now()});`);
}

// Dialyse Machines
for (let i = 0; i < CONFIG.dialyse.machines; i++) {
  const machineId = `dial-machine-${String(i + 100).padStart(4, '0')}`;
  generatedIds.dialyseMachines.push(machineId);

  const brand = pick(machineBrands);
  const model = `${brand}-${randomInt(1000, 9999)}`;
  const serialNumber = `SN${randomInt(100000, 999999)}`;
  const status = pick(machineStatuses);
  const forIsolation = randomInt(0, 1);
  const installDate = new Date(randomDate(2018, 2024)).getTime();
  const lastMaintenance = new Date(randomPastDate(180)).getTime();
  const nextMaintenance = new Date(randomFutureDate(90)).getTime();

  statements.push(`INSERT OR IGNORE INTO dialyse_machines (id, organization_id, machine_code, brand, model, serial_number, status, for_isolation, installation_date, last_maintenance_date, next_maintenance_date, notes, created_by, created_at, updated_at) VALUES ('${machineId}', '${ORG_ID}', 'HD-${String(i + 1).padStart(3, '0')}', '${brand}', '${model}', '${serialNumber}', '${status}', ${forIsolation}, ${installDate}, ${lastMaintenance}, ${nextMaintenance}, 'Machine de dialyse', '${ADMIN_USER}', ${Date.now()}, ${Date.now()});`);
}

// Dialyse Protocols
for (let i = 0; i < CONFIG.dialyse.protocols; i++) {
  const protocolId = `dial-protocol-${String(i + 1).padStart(4, '0')}`;
  generatedIds.dialyseProtocols.push(protocolId);

  const name = `Protocole HD ${i + 1}`;
  const duration = pick([180, 210, 240, 270, 300]);
  const bloodFlow = randomInt(250, 400);
  const dialysateFlow = randomInt(500, 800);

  statements.push(`INSERT OR IGNORE INTO dialyse_protocols (id, organization_id, name, description, duration_minutes, blood_flow_rate, dialysate_flow_rate, dialyzer_type, anticoagulation_type, is_active, created_by, created_at, updated_at) VALUES ('${protocolId}', '${ORG_ID}', '${escape(name)}', 'Protocole standard de dialyse', ${duration}, ${bloodFlow}, ${dialysateFlow}, 'High-flux', 'Heparine', 1, '${ADMIN_USER}', ${Date.now()}, ${Date.now()});`);
}

// Dialyse Prescriptions
for (let i = 0; i < CONFIG.dialyse.prescriptions; i++) {
  const prescriptionId = `dial-presc-${String(i + 1).padStart(5, '0')}`;
  generatedIds.dialysePrescriptions.push(prescriptionId);

  const patientId = pick(generatedIds.dialysePatients);
  const protocolId = pick(generatedIds.dialyseProtocols);
  const sessionsPerWeek = pick([2, 3]);
  const duration = pick([180, 210, 240, 270]);
  const bloodFlow = randomInt(250, 400);
  const dialysateFlow = randomInt(500, 800);
  const startDate = new Date(randomDate(2023, 2025)).getTime();

  statements.push(`INSERT OR IGNORE INTO dialyse_prescriptions (id, organization_id, patient_id, protocol_id, sessions_per_week, duration_minutes, blood_flow_rate, dialysate_flow_rate, dialyzer_type, anticoagulation_type, anticoagulation_dose, dry_weight_target, is_active, start_date, created_by, created_at, updated_at) VALUES ('${prescriptionId}', '${ORG_ID}', '${patientId}', '${protocolId}', ${sessionsPerWeek}, ${duration}, ${bloodFlow}, ${dialysateFlow}, 'High-flux', 'Heparine', ${randomInt(2000, 5000)}, ${randomFloat(50, 90)}, 1, ${startDate}, '${ADMIN_USER}', ${Date.now()}, ${Date.now()});`);
}

// Dialyse Vascular Accesses
for (let i = 0; i < CONFIG.dialyse.vascularAccesses; i++) {
  const accessId = `dial-access-${String(i + 1).padStart(5, '0')}`;
  const patientId = pick(generatedIds.dialysePatients);
  const accessType = pick(accessTypes);
  const location = pick(accessLocations);
  const status = pick(['active', 'failed', 'removed', 'maturing']);
  const creationDate = new Date(randomDate(2018, 2024)).getTime();

  statements.push(`INSERT OR IGNORE INTO dialyse_vascular_accesses (id, organization_id, patient_id, type, location, creation_date, status, notes, created_by, created_at, updated_at) VALUES ('${accessId}', '${ORG_ID}', '${patientId}', '${accessType}', '${escape(location)}', ${creationDate}, '${status}', 'Acces vasculaire', '${ADMIN_USER}', ${Date.now()}, ${Date.now()});`);
}

// Dialyse Sessions
for (let i = 0; i < CONFIG.dialyse.sessions; i++) {
  const sessionId = `dial-session-${String(i + 1).padStart(6, '0')}`;
  generatedIds.dialyseSessions.push(sessionId);

  const patientId = pick(generatedIds.dialysePatients);
  const machineId = pick(generatedIds.dialyseMachines);
  const prescriptionId = pick(generatedIds.dialysePrescriptions);
  const status = pick(sessionStatuses);
  const sessionDate = new Date(randomDate(2024, 2025)).getTime();
  const duration = pick([180, 210, 240, 270, 300]);
  const preWeight = randomFloat(55, 95);
  const postWeight = preWeight - randomFloat(1, 4);
  const bloodFlow = randomInt(250, 400);

  statements.push(`INSERT OR IGNORE INTO dialyse_sessions (id, organization_id, patient_id, machine_id, prescription_id, session_number, session_date, scheduled_start_time, status, duration_minutes, pre_weight, post_weight, blood_flow_rate, notes, created_by, created_at, updated_at) VALUES ('${sessionId}', '${ORG_ID}', '${patientId}', '${machineId}', '${prescriptionId}', 'S${String(i + 1).padStart(6, '0')}', ${sessionDate}, '${pick(['08:00', '09:00', '10:00', '14:00', '15:00', '16:00'])}', '${status}', ${duration}, ${preWeight}, ${postWeight}, ${bloodFlow}, 'Seance de dialyse', '${ADMIN_USER}', ${Date.now()}, ${Date.now()});`);
}

// Dialyse Lab Results
for (let i = 0; i < CONFIG.dialyse.labResults; i++) {
  const labId = `dial-lab-${String(i + 1).padStart(6, '0')}`;
  const patientId = pick(generatedIds.dialysePatients);
  const testDate = new Date(randomDate(2024, 2025)).getTime();

  statements.push(`INSERT OR IGNORE INTO dialyse_lab_results (id, organization_id, patient_id, test_date, hemoglobin, hematocrit, potassium, sodium, calcium, phosphorus, urea_pre, urea_post, creatinine, albumin, kt_v, urr, iron, ferritin, pth, notes, created_by, created_at, updated_at) VALUES ('${labId}', '${ORG_ID}', '${patientId}', ${testDate}, ${randomFloat(8, 14)}, ${randomFloat(25, 45)}, ${randomFloat(3.5, 6.5)}, ${randomFloat(135, 145)}, ${randomFloat(8, 11)}, ${randomFloat(2.5, 7)}, ${randomFloat(80, 200)}, ${randomFloat(20, 80)}, ${randomFloat(400, 1200)}, ${randomFloat(30, 45)}, ${randomFloat(1.0, 1.8)}, ${randomFloat(60, 80)}, ${randomFloat(40, 150)}, ${randomFloat(100, 1000)}, ${randomFloat(100, 800)}, 'Resultats biologie', '${ADMIN_USER}', ${Date.now()}, ${Date.now()});`);
}

// Dialyse Alerts
for (let i = 0; i < CONFIG.dialyse.alerts; i++) {
  const alertId = `dial-alert-${String(i + 1).padStart(5, '0')}`;
  const patientId = pick(generatedIds.dialysePatients);
  const severity = pick(alertSeverities);
  const alertType = pick(alertTypes);
  const status = pick(['active', 'acknowledged', 'resolved']);
  const createdAt = new Date(randomPastDate(90)).getTime();

  statements.push(`INSERT OR IGNORE INTO dialyse_clinical_alerts (id, organization_id, patient_id, title, description, severity, alert_type, status, created_at, updated_at) VALUES ('${alertId}', '${ORG_ID}', '${patientId}', 'Alerte ${alertType}', 'Description de l alerte clinique', '${severity}', '${alertType}', '${status}', ${createdAt}, ${Date.now()});`);
}

// Dialyse Staff
for (let i = 0; i < CONFIG.dialyse.staff; i++) {
  const staffId = `dial-staff-${String(i + 1).padStart(4, '0')}`;
  generatedIds.dialyseStaff.push(staffId);

  const firstName = pick(firstNames);
  const lastName = pick(lastNames);
  const role = pick(['nephrologist', 'nurse', 'technician', 'dietitian', 'social_worker']);
  const specialization = pick(['Néphrologie', 'Dialyse', 'Soins intensifs', 'Nutrition']);

  statements.push(`INSERT OR IGNORE INTO dialyse_staff (id, organization_id, first_name, last_name, role, specialization, license_number, phone, email, is_active, created_at, updated_at) VALUES ('${staffId}', '${ORG_ID}', '${escape(firstName)}', '${escape(lastName)}', '${role}', '${specialization}', 'LIC${randomInt(10000, 99999)}', '+212${randomInt(600000000, 699999999)}', '${firstName.toLowerCase()}.${lastName.toLowerCase()}@clinique.ma', 1, ${Date.now()}, ${Date.now()});`);
}

// Dialyse Billing
for (let i = 0; i < CONFIG.dialyse.billing; i++) {
  const billingId = `dial-billing-${String(i + 1).padStart(5, '0')}`;
  const patientId = pick(generatedIds.dialysePatients);
  const sessionId = pick(generatedIds.dialyseSessions);
  const status = pick(['pending', 'paid', 'partial', 'cancelled']);
  const amount = randomFloat(500, 2000);
  const paidAmount = status === 'paid' ? amount : (status === 'partial' ? randomFloat(100, amount - 100) : 0);
  const billingDate = new Date(randomDate(2024, 2025)).getTime();

  statements.push(`INSERT OR IGNORE INTO dialyse_billing (id, organization_id, patient_id, session_id, billing_date, amount, paid_amount, status, payment_method, insurance_coverage, notes, created_at, updated_at) VALUES ('${billingId}', '${ORG_ID}', '${patientId}', '${sessionId}', ${billingDate}, ${amount}, ${paidAmount}, '${status}', '${pick(['cash', 'card', 'insurance', 'bank_transfer'])}', ${randomFloat(0, 100)}, 'Facturation seance', ${Date.now()}, ${Date.now()});`);
}

// Dialyse Transport
for (let i = 0; i < CONFIG.dialyse.transport; i++) {
  const transportId = `dial-transport-${String(i + 1).padStart(5, '0')}`;
  const patientId = pick(generatedIds.dialysePatients);
  const sessionId = pick(generatedIds.dialyseSessions);
  const transportType = pick(['ambulance', 'vsl', 'taxi', 'personal', 'family']);
  const status = pick(['scheduled', 'in_progress', 'completed', 'cancelled']);

  statements.push(`INSERT OR IGNORE INTO dialyse_transport (id, organization_id, patient_id, session_id, transport_type, pickup_address, pickup_time, return_time, status, driver_name, driver_phone, notes, created_at, updated_at) VALUES ('${transportId}', '${ORG_ID}', '${patientId}', '${sessionId}', '${transportType}', 'Adresse patient ${i}', '07:30', '13:30', '${status}', 'Chauffeur ${i}', '+212${randomInt(600000000, 699999999)}', 'Transport patient', ${Date.now()}, ${Date.now()});`);
}

// Dialyse Consumables
for (let i = 0; i < CONFIG.dialyse.consumables; i++) {
  const consumableId = `dial-consumable-${String(i + 1).padStart(4, '0')}`;
  const name = pick(['Dialyseur High-flux', 'Ligne arterielle', 'Ligne veineuse', 'Aiguille fistule', 'Catheter', 'Solution dialyse', 'Heparine', 'Serum physiologique', 'Compresses', 'Gants']);

  statements.push(`INSERT OR IGNORE INTO dialyse_consumables (id, organization_id, name, category, unit, current_stock, minimum_stock, unit_price, supplier, is_active, created_at, updated_at) VALUES ('${consumableId}', '${ORG_ID}', '${escape(name)} ${i}', '${pick(['dialyzer', 'tubing', 'needles', 'solutions', 'medications', 'accessories'])}', '${pick(['piece', 'box', 'liter', 'ml'])}', ${randomInt(50, 500)}, ${randomInt(10, 50)}, ${randomFloat(10, 500)}, '${pick(['Fresenius', 'B.Braun', 'Nipro', 'Baxter'])}', 1, ${Date.now()}, ${Date.now()});`);
}

// Dialyse Maintenance
for (let i = 0; i < CONFIG.dialyse.maintenance; i++) {
  const maintenanceId = `dial-maint-${String(i + 1).padStart(4, '0')}`;
  const machineId = pick(generatedIds.dialyseMachines);
  const maintenanceType = pick(['preventive', 'corrective', 'calibration', 'inspection']);
  const status = pick(['scheduled', 'in_progress', 'completed', 'cancelled']);
  const scheduledDate = new Date(randomDate(2024, 2025)).getTime();

  statements.push(`INSERT OR IGNORE INTO dialyse_maintenance_records (id, organization_id, machine_id, maintenance_type, description, scheduled_date, completed_date, status, technician_name, cost, notes, created_at, updated_at) VALUES ('${maintenanceId}', '${ORG_ID}', '${machineId}', '${maintenanceType}', 'Maintenance ${maintenanceType}', ${scheduledDate}, ${status === 'completed' ? Date.now() : 'NULL'}, '${status}', 'Technicien ${i}', ${randomFloat(100, 2000)}, 'Intervention maintenance', ${Date.now()}, ${Date.now()});`);
}

console.log(`Dialyse: ${statements.length} statements generated`);

// ============================================================================
// CARDIOLOGY MODULE
// ============================================================================

console.log('Generating Cardiology data...');
const cardioStartCount = statements.length;

// Healthcare Patients for Cardiology
for (let i = 0; i < CONFIG.cardiology.patients; i++) {
  const healthcarePatientId = `hc-patient-cardio-${String(i + 1).padStart(5, '0')}`;
  const cardiologyPatientId = `cardio-patient-${String(i + 1).padStart(5, '0')}`;
  const firstName = pick(firstNames);
  const lastName = pick(lastNames);
  const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}.cardio${i}@email.com`;
  const phone = `+212${randomInt(600000000, 699999999)}`;
  const birthDate = new Date(randomDate(1940, 2000)).getTime();

  generatedIds.cardiologyHealthcarePatients.push(healthcarePatientId);
  generatedIds.cardiologyPatients.push(cardiologyPatientId);

  // Healthcare Patient
  statements.push(`INSERT OR IGNORE INTO healthcare_patients (id, company_id, first_name, last_name, date_of_birth, gender, email, phone, address, city, medical_record_number, blood_type, allergies, notes, status, created_at, updated_at) VALUES ('${healthcarePatientId}', '${COMPANY_ID}', '${escape(firstName)}', '${escape(lastName)}', ${birthDate}, '${pick(['male', 'female'])}', '${email}', '${phone}', 'Adresse ${i}', '${pick(['Casablanca', 'Rabat', 'Marrakech', 'Fes', 'Tanger', 'Agadir'])}', 'MRN-C${String(i + 1).padStart(6, '0')}', '${pick(bloodTypes)}', '${pick(allergies)}', 'Patient cardiologie', 'active', ${Date.now()}, ${Date.now()});`);

  // Cardiology Patient
  const diagnosis = pick(cardioDiagnoses);
  const riskLevel = pick(['low', 'medium', 'high', 'critical']);
  const hasPacemaker = randomInt(0, 100) < 15 ? 1 : 0;
  const hasStent = randomInt(0, 100) < 25 ? 1 : 0;

  statements.push(`INSERT OR IGNORE INTO cardiology_patients (id, company_id, healthcare_patient_id, primary_diagnosis, secondary_diagnoses, risk_level, has_pacemaker, has_stent, smoking_status, family_history, notes, status, created_at, updated_at) VALUES ('${cardiologyPatientId}', '${COMPANY_ID}', '${healthcarePatientId}', '${escape(diagnosis)}', '${escape(pick(cardioDiagnoses))}', '${riskLevel}', ${hasPacemaker}, ${hasStent}, '${pick(['never', 'former', 'current'])}', '${pick(['none', 'positive_first_degree', 'positive_second_degree'])}', 'Patient cardiologie', 'active', ${Date.now()}, ${Date.now()});`);
}

// Cardiology Consultations
for (let i = 0; i < CONFIG.cardiology.consultations; i++) {
  const consultationId = `cardio-consult-${String(i + 1).padStart(6, '0')}`;
  const patientId = pick(generatedIds.cardiologyHealthcarePatients);
  const consultDate = new Date(randomDate(2024, 2025)).getTime();
  const reason = pick(['Suivi', 'Douleur thoracique', 'Dyspnee', 'Palpitations', 'Syncope', 'Controle post-intervention']);
  const status = pick(['scheduled', 'completed', 'cancelled']);

  statements.push(`INSERT OR IGNORE INTO healthcare_consultations (id, company_id, patient_id, module, consultation_date, reason, diagnosis, treatment_plan, notes, status, created_by, created_at, updated_at) VALUES ('${consultationId}', '${COMPANY_ID}', '${patientId}', 'cardiology', ${consultDate}, '${escape(reason)}', '${escape(pick(cardioDiagnoses))}', 'Plan de traitement cardiologique', 'Consultation cardiologie', '${status}', '${ADMIN_USER}', ${Date.now()}, ${Date.now()});`);
}

// Cardiology ECG
for (let i = 0; i < CONFIG.cardiology.ecg; i++) {
  const ecgId = `cardio-ecg-${String(i + 1).padStart(6, '0')}`;
  const patientId = pick(generatedIds.cardiologyPatients);
  const recordDate = new Date(randomDate(2024, 2025)).getTime();
  const finding = pick(ecgFindings);
  const heartRate = randomInt(50, 120);
  const prInterval = randomInt(120, 200);
  const qrsDuration = randomInt(80, 120);
  const qtInterval = randomInt(350, 450);

  statements.push(`INSERT OR IGNORE INTO cardiology_ecg_records (id, company_id, patient_id, record_date, heart_rate, pr_interval, qrs_duration, qt_interval, rhythm, interpretation, findings, is_abnormal, notes, performed_by, created_at, updated_at) VALUES ('${ecgId}', '${COMPANY_ID}', '${patientId}', ${recordDate}, ${heartRate}, ${prInterval}, ${qrsDuration}, ${qtInterval}, '${pick(['sinus', 'atrial_fibrillation', 'atrial_flutter', 'ventricular'])}', '${escape(finding)}', '${escape(finding)}', ${finding !== 'Normal' ? 1 : 0}, 'ECG enregistrement', '${ADMIN_USER}', ${Date.now()}, ${Date.now()});`);
}

// Cardiology Echo
for (let i = 0; i < CONFIG.cardiology.echo; i++) {
  const echoId = `cardio-echo-${String(i + 1).padStart(6, '0')}`;
  const patientId = pick(generatedIds.cardiologyPatients);
  const examDate = new Date(randomDate(2024, 2025)).getTime();
  const finding = pick(echoFindings);
  const lvef = randomInt(25, 70);
  const lvedd = randomInt(40, 70);
  const lvesd = randomInt(25, 50);

  statements.push(`INSERT OR IGNORE INTO cardiology_echocardiograms (id, company_id, patient_id, exam_date, lvef, lvedd, lvesd, la_diameter, rv_diameter, mitral_valve_status, aortic_valve_status, tricuspid_valve_status, wall_motion, pericardium, interpretation, notes, performed_by, created_at, updated_at) VALUES ('${echoId}', '${COMPANY_ID}', '${patientId}', ${examDate}, ${lvef}, ${lvedd}, ${lvesd}, ${randomInt(30, 50)}, ${randomInt(20, 40)}, '${pick(['normal', 'stenosis', 'regurgitation', 'prolapse'])}', '${pick(['normal', 'stenosis', 'regurgitation', 'bicuspid'])}', '${pick(['normal', 'regurgitation'])}', '${pick(['normal', 'hypokinesia', 'akinesia', 'dyskinesia'])}', '${pick(['normal', 'effusion', 'thickening'])}', '${escape(finding)}', 'Echocardiographie', '${ADMIN_USER}', ${Date.now()}, ${Date.now()});`);
}

// Cardiology Pacemakers
for (let i = 0; i < CONFIG.cardiology.pacemakers; i++) {
  const pacemakerId = `cardio-pm-${String(i + 1).padStart(5, '0')}`;
  const patientId = pick(generatedIds.cardiologyPatients);
  const implantDate = new Date(randomDate(2018, 2024)).getTime();
  const pmType = pick(pacemakerTypes);
  const brand = pick(pacemakerBrands);
  const batteryLife = randomInt(4, 12);

  statements.push(`INSERT OR IGNORE INTO cardiology_pacemakers (id, company_id, patient_id, device_type, manufacturer, model, serial_number, implant_date, implanting_physician, indication, mode, lower_rate, upper_rate, av_delay, battery_status, battery_life_years, lead_impedance_ra, lead_impedance_rv, lead_impedance_lv, last_check_date, next_check_date, notes, status, created_at, updated_at) VALUES ('${pacemakerId}', '${COMPANY_ID}', '${patientId}', '${pmType}', '${brand}', '${brand}-${randomInt(1000, 9999)}', 'SN${randomInt(100000, 999999)}', ${implantDate}, 'Dr. Cardiologue ${i}', '${pick(['BAV complet', 'Dysfonction sinusale', 'FA lente', 'Insuffisance cardiaque'])}', '${pick(['DDD', 'VVI', 'AAI', 'CRT'])}', ${randomInt(50, 70)}, ${randomInt(120, 150)}, ${randomInt(120, 200)}, '${pick(['good', 'fair', 'low', 'critical'])}', ${batteryLife}, ${randomInt(300, 800)}, ${randomInt(300, 800)}, ${randomInt(300, 800)}, ${new Date(randomPastDate(180)).getTime()}, ${new Date(randomFutureDate(180)).getTime()}, 'Pacemaker', 'active', ${Date.now()}, ${Date.now()});`);
}

// Cardiology Stents
for (let i = 0; i < CONFIG.cardiology.stents; i++) {
  const stentId = `cardio-stent-${String(i + 1).padStart(5, '0')}`;
  const patientId = pick(generatedIds.cardiologyPatients);
  const implantDate = new Date(randomDate(2018, 2024)).getTime();
  const stentType = pick(stentTypes);
  const artery = pick(coronaryArteries);

  statements.push(`INSERT OR IGNORE INTO cardiology_stents (id, company_id, patient_id, stent_type, manufacturer, model, diameter_mm, length_mm, artery, lesion_location, implant_date, implanting_physician, indication, pre_stenosis_percent, post_stenosis_percent, notes, status, created_at, updated_at) VALUES ('${stentId}', '${COMPANY_ID}', '${patientId}', '${stentType}', '${pick(['Abbott', 'Boston Scientific', 'Medtronic', 'Cordis'])}', 'Stent-${randomInt(1000, 9999)}', ${randomFloat(2.5, 4.0)}, ${randomInt(12, 38)}, '${artery}', '${pick(['proximal', 'mid', 'distal'])}', ${implantDate}, 'Dr. Interventionnel ${i}', '${pick(['SCA', 'Angor stable', 'Ischemie silencieuse'])}', ${randomInt(70, 99)}, ${randomInt(0, 20)}, 'Stent coronaire', 'active', ${Date.now()}, ${Date.now()});`);
}

// Cardiology Risk Scores
for (let i = 0; i < CONFIG.cardiology.riskScores; i++) {
  const scoreId = `cardio-risk-${String(i + 1).padStart(6, '0')}`;
  const patientId = pick(generatedIds.cardiologyPatients);
  const calcDate = new Date(randomDate(2024, 2025)).getTime();
  const scoreType = pick(['HEART', 'TIMI', 'GRACE', 'CHA2DS2-VASc', 'HAS-BLED', 'SCORE2']);
  const scoreValue = randomInt(0, 10);

  statements.push(`INSERT OR IGNORE INTO cardiology_risk_scores (id, company_id, patient_id, score_type, calculation_date, score_value, risk_category, components, notes, calculated_by, created_at, updated_at) VALUES ('${scoreId}', '${COMPANY_ID}', '${patientId}', '${scoreType}', ${calcDate}, ${scoreValue}, '${pick(['low', 'intermediate', 'high', 'very_high'])}', '{}', 'Score de risque', '${ADMIN_USER}', ${Date.now()}, ${Date.now()});`);
}

// Cardiology Medications
for (let i = 0; i < CONFIG.cardiology.medications; i++) {
  const medId = `cardio-med-${String(i + 1).padStart(6, '0')}`;
  const patientId = pick(generatedIds.cardiologyPatients);
  const medication = pick(medications);
  const startDate = new Date(randomDate(2022, 2025)).getTime();

  statements.push(`INSERT OR IGNORE INTO cardiology_medications (id, company_id, patient_id, medication_name, dosage, frequency, route, start_date, end_date, indication, prescribing_physician, is_active, notes, created_at, updated_at) VALUES ('${medId}', '${COMPANY_ID}', '${patientId}', '${medication}', '${randomInt(1, 10)} ${pick(['mg', 'mg/j', 'UI'])}', '${pick(['once_daily', 'twice_daily', 'three_times_daily', 'as_needed'])}', '${pick(['oral', 'iv', 'sc'])}', ${startDate}, NULL, '${escape(pick(cardioDiagnoses))}', 'Dr. Cardiologue', 1, 'Traitement cardiologique', ${Date.now()}, ${Date.now()});`);
}

// Cardiology Events
for (let i = 0; i < CONFIG.cardiology.events; i++) {
  const eventId = `cardio-event-${String(i + 1).padStart(5, '0')}`;
  const patientId = pick(generatedIds.cardiologyPatients);
  const eventDate = new Date(randomDate(2020, 2025)).getTime();
  const eventType = pick(cardioEvents);

  statements.push(`INSERT OR IGNORE INTO cardiology_cardiac_events (id, company_id, patient_id, event_type, event_date, severity, description, treatment_given, outcome, hospitalization_required, icu_admission, notes, created_at, updated_at) VALUES ('${eventId}', '${COMPANY_ID}', '${patientId}', '${escape(eventType)}', ${eventDate}, '${pick(['mild', 'moderate', 'severe', 'critical'])}', 'Evenement cardiaque', 'Traitement urgent', '${pick(['resolved', 'improved', 'stable', 'worsened', 'deceased'])}', ${randomInt(0, 1)}, ${randomInt(0, 1)}, 'Evenement cardiaque enregistre', ${Date.now()}, ${Date.now()});`);
}

// Cardiology Alerts
for (let i = 0; i < CONFIG.cardiology.alerts; i++) {
  const alertId = `cardio-alert-${String(i + 1).padStart(5, '0')}`;
  const patientId = pick(generatedIds.cardiologyHealthcarePatients);
  const severity = pick(alertSeverities);
  const status = pick(['active', 'acknowledged', 'resolved']);
  const createdAt = new Date(randomPastDate(90)).getTime();

  statements.push(`INSERT OR IGNORE INTO healthcare_alerts (id, company_id, patient_id, module, title, description, severity, alert_type, status, created_at, updated_at) VALUES ('${alertId}', '${COMPANY_ID}', '${patientId}', 'cardiology', 'Alerte cardiologie', 'Description alerte cardiologique', '${severity}', '${pick(['lab_result', 'vital_sign', 'medication', 'device', 'appointment'])}', '${status}', ${createdAt}, ${Date.now()});`);
}

// Cardiology Appointments
for (let i = 0; i < CONFIG.cardiology.appointments; i++) {
  const appointmentId = `cardio-appt-${String(i + 1).padStart(6, '0')}`;
  const patientId = pick(generatedIds.cardiologyHealthcarePatients);
  const appointmentDate = new Date(randomDate(2024, 2025)).getTime();
  const appointmentType = pick(['consultation', 'ecg', 'echo', 'stress_test', 'holter', 'follow_up']);
  const status = pick(['scheduled', 'confirmed', 'completed', 'cancelled', 'no_show']);

  statements.push(`INSERT OR IGNORE INTO healthcare_appointments (id, company_id, patient_id, module, appointment_date, appointment_time, appointment_type, provider_name, status, notes, created_at, updated_at) VALUES ('${appointmentId}', '${COMPANY_ID}', '${patientId}', 'cardiology', ${appointmentDate}, '${pick(['08:00', '09:00', '10:00', '11:00', '14:00', '15:00', '16:00'])}', '${appointmentType}', 'Dr. Cardiologue', '${status}', 'Rendez-vous cardiologie', ${Date.now()}, ${Date.now()});`);
}

console.log(`Cardiology: ${statements.length - cardioStartCount} statements generated`);

// ============================================================================
// OPHTHALMOLOGY MODULE
// ============================================================================

console.log('Generating Ophthalmology data...');
const ophthalmoStartCount = statements.length;

// Healthcare Patients for Ophthalmology
for (let i = 0; i < CONFIG.ophthalmology.patients; i++) {
  const healthcarePatientId = `hc-patient-ophth-${String(i + 1).padStart(5, '0')}`;
  const firstName = pick(firstNames);
  const lastName = pick(lastNames);
  const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}.ophth${i}@email.com`;
  const phone = `+212${randomInt(600000000, 699999999)}`;
  const birthDate = new Date(randomDate(1940, 2010)).getTime();

  generatedIds.ophthalmologyHealthcarePatients.push(healthcarePatientId);

  statements.push(`INSERT OR IGNORE INTO healthcare_patients (id, company_id, first_name, last_name, date_of_birth, gender, email, phone, address, city, medical_record_number, blood_type, allergies, notes, status, created_at, updated_at) VALUES ('${healthcarePatientId}', '${COMPANY_ID}', '${escape(firstName)}', '${escape(lastName)}', ${birthDate}, '${pick(['male', 'female'])}', '${email}', '${phone}', 'Adresse ${i}', '${pick(['Casablanca', 'Rabat', 'Marrakech', 'Fes', 'Tanger', 'Agadir'])}', 'MRN-O${String(i + 1).padStart(6, '0')}', '${pick(bloodTypes)}', '${pick(allergies)}', 'Patient ophtalmologie', 'active', ${Date.now()}, ${Date.now()});`);
}

// Ophthalmology Consultations
for (let i = 0; i < CONFIG.ophthalmology.consultations; i++) {
  const consultationId = `ophth-consult-${String(i + 1).padStart(6, '0')}`;
  const patientId = pick(generatedIds.ophthalmologyHealthcarePatients);
  const consultDate = new Date(randomDate(2024, 2025)).getTime();
  const reason = pick(['Controle annuel', 'Baisse de vision', 'Douleur oculaire', 'Secheresse', 'Suivi post-operatoire', 'Diabete']);
  const status = pick(['scheduled', 'completed', 'cancelled']);

  statements.push(`INSERT OR IGNORE INTO healthcare_consultations (id, company_id, patient_id, module, consultation_date, reason, diagnosis, treatment_plan, notes, status, created_by, created_at, updated_at) VALUES ('${consultationId}', '${COMPANY_ID}', '${patientId}', 'ophthalmology', ${consultDate}, '${escape(reason)}', '${escape(pick(ophthalmoDiagnoses))}', 'Plan de traitement ophtalmologique', 'Consultation ophtalmologie', '${status}', '${ADMIN_USER}', ${Date.now()}, ${Date.now()});`);
}

// Ophthalmology Refraction
for (let i = 0; i < CONFIG.ophthalmology.refraction; i++) {
  const refractionId = `ophth-refr-${String(i + 1).padStart(6, '0')}`;
  const patientId = pick(generatedIds.ophthalmologyHealthcarePatients);
  const examDate = new Date(randomDate(2024, 2025)).getTime();
  const eye = pick(eyeOptions);

  statements.push(`INSERT OR IGNORE INTO ophthalmology_refraction (id, company_id, patient_id, exam_date, eye, sphere_od, cylinder_od, axis_od, sphere_os, cylinder_os, axis_os, add_od, add_os, pd, visual_acuity_od, visual_acuity_os, notes, performed_by, created_at, updated_at) VALUES ('${refractionId}', '${COMPANY_ID}', '${patientId}', ${examDate}, '${eye}', ${randomFloat(-10, 5)}, ${randomFloat(-4, 0)}, ${randomInt(0, 180)}, ${randomFloat(-10, 5)}, ${randomFloat(-4, 0)}, ${randomInt(0, 180)}, ${randomFloat(0, 3)}, ${randomFloat(0, 3)}, ${randomInt(58, 70)}, '${pick(['10/10', '9/10', '8/10', '7/10', '6/10', '5/10'])}', '${pick(['10/10', '9/10', '8/10', '7/10', '6/10', '5/10'])}', 'Refraction', '${ADMIN_USER}', ${Date.now()}, ${Date.now()});`);
}

// Ophthalmology Tonometry
for (let i = 0; i < CONFIG.ophthalmology.tonometry; i++) {
  const tonometryId = `ophth-tono-${String(i + 1).padStart(6, '0')}`;
  const patientId = pick(generatedIds.ophthalmologyHealthcarePatients);
  const examDate = new Date(randomDate(2024, 2025)).getTime();

  statements.push(`INSERT OR IGNORE INTO ophthalmology_tonometry (id, company_id, patient_id, measurement_date, method, iop_od, iop_os, pachymetry_od, pachymetry_os, notes, performed_by, created_at, updated_at) VALUES ('${tonometryId}', '${COMPANY_ID}', '${patientId}', ${examDate}, '${pick(['goldmann', 'pneumatic', 'rebound', 'palpation'])}', ${randomInt(10, 28)}, ${randomInt(10, 28)}, ${randomInt(480, 600)}, ${randomInt(480, 600)}, 'Tonometrie', '${ADMIN_USER}', ${Date.now()}, ${Date.now()});`);
}

// Ophthalmology OCT
for (let i = 0; i < CONFIG.ophthalmology.oct; i++) {
  const octId = `ophth-oct-${String(i + 1).padStart(6, '0')}`;
  const patientId = pick(generatedIds.ophthalmologyHealthcarePatients);
  const examDate = new Date(randomDate(2024, 2025)).getTime();
  const eye = pick(['OD', 'OS']);

  statements.push(`INSERT OR IGNORE INTO ophthalmology_oct (id, company_id, patient_id, exam_date, eye, oct_type, central_thickness, average_thickness, rnfl_average, rnfl_superior, rnfl_inferior, rnfl_nasal, rnfl_temporal, interpretation, findings, notes, performed_by, created_at, updated_at) VALUES ('${octId}', '${COMPANY_ID}', '${patientId}', ${examDate}, '${eye}', '${pick(['macula', 'rnfl', 'anterior_segment'])}', ${randomInt(200, 400)}, ${randomInt(250, 350)}, ${randomInt(80, 120)}, ${randomInt(90, 140)}, ${randomInt(90, 140)}, ${randomInt(60, 100)}, ${randomInt(60, 90)}, '${pick(['Normal', 'Amincissement RNFL', 'Oedeme maculaire', 'Drusen', 'Membrane epiretinienne'])}', 'Resultats OCT', 'OCT realise', '${ADMIN_USER}', ${Date.now()}, ${Date.now()});`);
}

// Ophthalmology Visual Fields
for (let i = 0; i < CONFIG.ophthalmology.visualFields; i++) {
  const vfId = `ophth-vf-${String(i + 1).padStart(6, '0')}`;
  const patientId = pick(generatedIds.ophthalmologyHealthcarePatients);
  const testDate = new Date(randomDate(2024, 2025)).getTime();
  const eye = pick(['OD', 'OS']);

  statements.push(`INSERT OR IGNORE INTO ophthalmology_visual_fields (id, company_id, patient_id, test_date, eye, test_type, mean_deviation, pattern_standard_deviation, visual_field_index, false_positive_rate, false_negative_rate, fixation_loss, interpretation, ght_status, notes, performed_by, created_at, updated_at) VALUES ('${vfId}', '${COMPANY_ID}', '${patientId}', ${testDate}, '${eye}', '${pick(['humphrey_24_2', 'humphrey_30_2', 'humphrey_10_2', 'goldmann'])}', ${randomFloat(-15, 2)}, ${randomFloat(1, 8)}, ${randomInt(70, 100)}, ${randomInt(0, 15)}, ${randomInt(0, 15)}, ${randomInt(0, 20)}, '${pick(['Normal', 'Scotome arciforme', 'Deficit altitudinal', 'Deficits diffus', 'Ressaut nasal'])}', '${pick(['within_normal', 'borderline', 'outside_normal'])}', 'Champ visuel', '${ADMIN_USER}', ${Date.now()}, ${Date.now()});`);
}

// Ophthalmology Biometry
for (let i = 0; i < CONFIG.ophthalmology.biometry; i++) {
  const biometryId = `ophth-bio-${String(i + 1).padStart(5, '0')}`;
  const patientId = pick(generatedIds.ophthalmologyHealthcarePatients);
  const examDate = new Date(randomDate(2024, 2025)).getTime();
  const eye = pick(['OD', 'OS']);

  statements.push(`INSERT OR IGNORE INTO ophthalmology_biometry (id, company_id, patient_id, exam_date, eye, axial_length, keratometry_k1, keratometry_k2, keratometry_axis, anterior_chamber_depth, lens_thickness, white_to_white, target_refraction, iol_power, iol_model, formula_used, notes, performed_by, created_at, updated_at) VALUES ('${biometryId}', '${COMPANY_ID}', '${patientId}', ${examDate}, '${eye}', ${randomFloat(22, 27)}, ${randomFloat(42, 46)}, ${randomFloat(42, 46)}, ${randomInt(0, 180)}, ${randomFloat(2.5, 4)}, ${randomFloat(3.5, 5)}, ${randomFloat(11, 13)}, ${randomFloat(-1, 0.5)}, ${randomFloat(15, 28)}, '${pick(iolTypes)}', '${pick(['SRK/T', 'Holladay', 'Haigis', 'Barrett'])}', 'Biometrie', '${ADMIN_USER}', ${Date.now()}, ${Date.now()});`);
}

// Ophthalmology IOL Implants
for (let i = 0; i < CONFIG.ophthalmology.iolImplants; i++) {
  const iolId = `ophth-iol-${String(i + 1).padStart(5, '0')}`;
  const patientId = pick(generatedIds.ophthalmologyHealthcarePatients);
  const implantDate = new Date(randomDate(2020, 2025)).getTime();
  const eye = pick(['OD', 'OS']);

  statements.push(`INSERT OR IGNORE INTO ophthalmology_iol_implants (id, company_id, patient_id, eye, implant_date, iol_type, manufacturer, model, power, target_refraction, actual_refraction, surgeon, notes, status, created_at, updated_at) VALUES ('${iolId}', '${COMPANY_ID}', '${patientId}', '${eye}', ${implantDate}, '${pick(iolTypes)}', '${pick(iolBrands)}', 'IOL-${randomInt(1000, 9999)}', ${randomFloat(15, 28)}, ${randomFloat(-1, 0.5)}, ${randomFloat(-1, 1)}, 'Dr. Chirurgien ${i}', 'Implant IOL', 'active', ${Date.now()}, ${Date.now()});`);
}

// Ophthalmology Surgeries
for (let i = 0; i < CONFIG.ophthalmology.surgeries; i++) {
  const surgeryId = `ophth-surg-${String(i + 1).padStart(5, '0')}`;
  const patientId = pick(generatedIds.ophthalmologyHealthcarePatients);
  const surgeryDate = new Date(randomDate(2020, 2025)).getTime();
  const eye = pick(['OD', 'OS', 'OU']);
  const surgeryType = pick(surgeryTypes);

  statements.push(`INSERT OR IGNORE INTO ophthalmology_surgeries (id, company_id, patient_id, surgery_type, eye, surgery_date, lead_surgeon, assistant_surgeon, anesthesia_type, duration_minutes, complications, outcome, notes, status, created_at, updated_at) VALUES ('${surgeryId}', '${COMPANY_ID}', '${patientId}', '${surgeryType}', '${eye}', ${surgeryDate}, 'Dr. Chirurgien ${i}', 'Dr. Assistant', '${pick(['local', 'topical', 'general'])}', ${randomInt(15, 120)}, '${pick(['Aucune', 'Rupture capsulaire', 'Hemorragie', 'Oedeme corneen'])}', '${pick(['success', 'partial_success', 'complication'])}', 'Chirurgie ophtalmologique', '${pick(['scheduled', 'completed', 'cancelled'])}', ${Date.now()}, ${Date.now()});`);
}

// Ophthalmology IVT
for (let i = 0; i < CONFIG.ophthalmology.ivt; i++) {
  const ivtId = `ophth-ivt-${String(i + 1).padStart(5, '0')}`;
  const patientId = pick(generatedIds.ophthalmologyHealthcarePatients);
  const injectionDate = new Date(randomDate(2023, 2025)).getTime();
  const eye = pick(['OD', 'OS']);
  const drug = pick(ivtDrugs);

  statements.push(`INSERT OR IGNORE INTO ophthalmology_ivt (id, company_id, patient_id, eye, injection_date, drug_name, dose, lot_number, indication, injection_site, iop_pre, iop_post, complications, next_injection_date, notes, performed_by, created_at, updated_at) VALUES ('${ivtId}', '${COMPANY_ID}', '${patientId}', '${eye}', ${injectionDate}, '${escape(drug)}', '${pick(['0.5mg', '2mg', '0.3mg'])}', 'LOT${randomInt(100000, 999999)}', '${pick(['DMLA', 'OMD', 'OVR', 'Myopie forte'])}', '${pick(['temporal_inferior', 'temporal_superior', 'nasal_inferior', 'nasal_superior'])}', ${randomInt(12, 22)}, ${randomInt(10, 25)}, '${pick(['Aucune', 'Hemorragie sous-conjonctivale', 'Douleur'])}', ${new Date(randomFutureDate(60)).getTime()}, 'Injection intravitreenne', '${ADMIN_USER}', ${Date.now()}, ${Date.now()});`);
}

// Ophthalmology OSDI
for (let i = 0; i < CONFIG.ophthalmology.osdi; i++) {
  const osdiId = `ophth-osdi-${String(i + 1).padStart(6, '0')}`;
  const patientId = pick(generatedIds.ophthalmologyHealthcarePatients);
  const testDate = new Date(randomDate(2024, 2025)).getTime();
  const score = randomInt(0, 100);

  let severity;
  if (score <= 12) severity = 'normal';
  else if (score <= 22) severity = 'mild';
  else if (score <= 32) severity = 'moderate';
  else severity = 'severe';

  statements.push(`INSERT OR IGNORE INTO ophthalmology_osdi (id, company_id, patient_id, test_date, score, severity, vision_symptoms, environmental_triggers, activities_limited, notes, performed_by, created_at, updated_at) VALUES ('${osdiId}', '${COMPANY_ID}', '${patientId}', ${testDate}, ${score}, '${severity}', '${randomInt(0, 16)}', '${randomInt(0, 12)}', '${randomInt(0, 20)}', 'Test OSDI', '${ADMIN_USER}', ${Date.now()}, ${Date.now()});`);
}

// Ophthalmology Alerts
for (let i = 0; i < CONFIG.ophthalmology.alerts; i++) {
  const alertId = `ophth-alert-${String(i + 1).padStart(5, '0')}`;
  const patientId = pick(generatedIds.ophthalmologyHealthcarePatients);
  const severity = pick(alertSeverities);
  const status = pick(['active', 'acknowledged', 'resolved']);
  const createdAt = new Date(randomPastDate(90)).getTime();

  statements.push(`INSERT OR IGNORE INTO healthcare_alerts (id, company_id, patient_id, module, title, description, severity, alert_type, status, created_at, updated_at) VALUES ('${alertId}', '${COMPANY_ID}', '${patientId}', 'ophthalmology', 'Alerte ophtalmologie', 'Description alerte ophtalmologique', '${severity}', '${pick(['iop_high', 'vision_change', 'injection_due', 'follow_up'])}', '${status}', ${createdAt}, ${Date.now()});`);
}

console.log(`Ophthalmology: ${statements.length - ophthalmoStartCount} statements generated`);

// ============================================================================
// Write SQL file
// ============================================================================

const totalStatements = statements.length;
console.log(`\nTotal statements: ${totalStatements}`);

// Split into batches for D1
const BATCH_SIZE = 500;
const batches = [];
for (let i = 0; i < statements.length; i += BATCH_SIZE) {
  batches.push(statements.slice(i, i + BATCH_SIZE));
}

console.log(`Split into ${batches.length} batches of ${BATCH_SIZE} statements each`);

// Write batches to files
for (let i = 0; i < batches.length; i++) {
  const filename = `/Users/yastec/devfactory/perfex/packages/database/seed-massive-batch-${String(i + 1).padStart(3, '0')}.sql`;
  fs.writeFileSync(filename, batches[i].join('\n'));
  console.log(`Written: seed-massive-batch-${String(i + 1).padStart(3, '0')}.sql (${batches[i].length} statements)`);
}

console.log('\nDone! Execute batches with:');
console.log('for f in seed-massive-batch-*.sql; do wrangler d1 execute perfex-db-staging --remote --file="$f"; done');
