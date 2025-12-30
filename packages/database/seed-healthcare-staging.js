/**
 * Healthcare Seed Data Generator for Staging
 * Generates hundreds of demo data for Dialyse, Cardiologie, and Ophtalmologie
 */

const { execSync } = require('child_process');

// Helper functions
const uuid = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomFloat = (min, max, decimals = 2) => parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
const randomChoice = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randomDate = (start, end) => {
  const d = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  return d.toISOString().split('T')[0];
};
const randomTimestamp = (start, end) => {
  return Math.floor(start.getTime() / 1000 + Math.random() * (end.getTime() - start.getTime()) / 1000);
};

// Data pools
const firstNames = ['Mohammed', 'Ahmed', 'Youssef', 'Omar', 'Ali', 'Hassan', 'Karim', 'Mehdi', 'Rachid', 'Samir',
  'Fatima', 'Aicha', 'Khadija', 'Meriem', 'Zineb', 'Salma', 'Nadia', 'Houda', 'Samira', 'Laila',
  'Jean', 'Pierre', 'Michel', 'Philippe', 'François', 'Marie', 'Sophie', 'Isabelle', 'Catherine', 'Nathalie'];
const lastNames = ['Bennani', 'Alaoui', 'Tazi', 'Fassi', 'Idrissi', 'Berrada', 'Cherkaoui', 'Benkirane', 'Kettani', 'Benjelloun',
  'Martin', 'Bernard', 'Dubois', 'Thomas', 'Robert', 'Richard', 'Petit', 'Durand', 'Leroy', 'Moreau'];
const cities = ['Casablanca', 'Rabat', 'Marrakech', 'Fès', 'Tanger', 'Agadir', 'Meknès', 'Oujda', 'Kenitra', 'Tétouan'];
const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const genders = ['male', 'female'];

// Company ID (must exist in staging)
const COMPANY_ID = 'demo-company-001';
const ORG_ID = 'demo-org-001';
const USER_ID = 'demo-user-001';

// Generate SQL statements
let sql = [];

// =====================================================
// HEALTHCARE PATIENTS (shared base)
// =====================================================
console.log('Generating healthcare patients...');
const healthcarePatientIds = [];
for (let i = 0; i < 150; i++) {
  const id = uuid();
  healthcarePatientIds.push(id);
  const firstName = randomChoice(firstNames);
  const lastName = randomChoice(lastNames);
  const gender = randomChoice(genders);
  const dob = randomDate(new Date('1940-01-01'), new Date('2000-12-31'));
  const bloodType = randomChoice(bloodTypes);
  const city = randomChoice(cities);

  sql.push(`INSERT INTO healthcare_patients (id, company_id, first_name, last_name, date_of_birth, gender, national_id, phone, email, address, city, postal_code, emergency_contact, emergency_phone, blood_type, allergies, medical_history, insurance_provider, insurance_number, status, created_at, updated_at) VALUES ('${id}', '${COMPANY_ID}', '${firstName}', '${lastName}', '${dob}', '${gender}', 'ID${randomInt(100000, 999999)}', '+212${randomInt(600000000, 699999999)}', '${firstName.toLowerCase()}.${lastName.toLowerCase()}@email.com', '${randomInt(1, 200)} Rue ${randomChoice(['Mohammed V', 'Hassan II', 'Al Massira', 'Ibn Sina', 'Al Amal'])}', '${city}', '${randomInt(10000, 99999)}', '${randomChoice(firstNames)} ${randomChoice(lastNames)}', '+212${randomInt(600000000, 699999999)}', '${bloodType}', '${randomChoice(['Pénicilline', 'Aspirine', 'Iode', 'Latex', 'Aucune', 'Aucune', 'Aucune'])}', '${randomChoice(['Diabète type 2', 'Hypertension', 'Insuffisance rénale chronique', 'Maladie cardiaque', 'Aucun antécédent notable'])}', '${randomChoice(['CNSS', 'CNOPS', 'SAHAM', 'Wafa Assurance', 'RMA Watanya'])}', 'POL${randomInt(1000000, 9999999)}', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);`);
}

// =====================================================
// DIALYSE CONTACTS (for dialyse_patients FK)
// =====================================================
console.log('Generating contacts for dialyse...');
const contactIds = [];
for (let i = 0; i < 120; i++) {
  const id = uuid();
  contactIds.push(id);
  const firstName = randomChoice(firstNames);
  const lastName = randomChoice(lastNames);

  sql.push(`INSERT OR IGNORE INTO contacts (id, organization_id, first_name, last_name, email, phone, type, status, created_at, updated_at) VALUES ('${id}', '${ORG_ID}', '${firstName}', '${lastName}', '${firstName.toLowerCase()}.${lastName.toLowerCase()}@email.com', '+212${randomInt(600000000, 699999999)}', 'patient', 'active', ${Date.now()}, ${Date.now()});`);
}

// =====================================================
// DIALYSE MODULE
// =====================================================
console.log('Generating dialyse patients...');
const dialysePatientIds = [];
for (let i = 0; i < 120; i++) {
  const id = uuid();
  dialysePatientIds.push(id);
  const contactId = contactIds[i];
  const bloodType = randomChoice(bloodTypes);
  const dryWeight = randomFloat(45, 95, 1);
  const etiology = randomChoice(['Diabète', 'Hypertension', 'Glomérulonéphrite', 'Polykystose rénale', 'Néphropathie obstructive', 'Idiopathique']);
  const hivStatus = randomChoice(['negative', 'negative', 'negative', 'positive', 'unknown']);
  const hbvStatus = randomChoice(['negative', 'negative', 'negative', 'positive', 'unknown']);
  const hcvStatus = randomChoice(['negative', 'negative', 'negative', 'positive', 'unknown']);
  const requiresIsolation = (hivStatus === 'positive' || hbvStatus === 'positive' || hcvStatus === 'positive') ? 1 : 0;
  const startDate = randomTimestamp(new Date('2018-01-01'), new Date('2024-06-01'));

  sql.push(`INSERT INTO dialyse_patients (id, organization_id, contact_id, medical_id, blood_type, dry_weight, renal_failure_etiology, medical_history, allergies, hiv_status, hbv_status, hcv_status, requires_isolation, hepatitis_b_vaccinated, patient_status, dialysis_start_date, notes, created_by, created_at, updated_at) VALUES ('${id}', '${ORG_ID}', '${contactId}', 'MED${randomInt(10000, 99999)}', '${bloodType}', ${dryWeight}, '${etiology}', '${randomChoice(['Diabète type 2, HTA', 'HTA stade 3', 'Insuffisance cardiaque compensée', 'Hépatite B traitée', 'Aucun antécédent majeur'])}', '${randomChoice(['Pénicilline', 'Iode', 'Aucune', 'Aucune', 'Aucune'])}', '${hivStatus}', '${hbvStatus}', '${hcvStatus}', ${requiresIsolation}, ${randomChoice([0, 1])}, 'active', ${startDate}, 'Patient dialysé chronique', '${USER_ID}', ${Date.now()}, ${Date.now()});`);
}

// DIALYSE MACHINES
console.log('Generating dialyse machines...');
const machineIds = [];
const machineModels = ['Fresenius 5008S', 'Fresenius 4008S', 'Gambro AK 200', 'Nipro Surdial 55', 'Baxter PrisMax', 'B.Braun Dialog+'];
for (let i = 0; i < 25; i++) {
  const id = uuid();
  machineIds.push(id);
  const model = randomChoice(machineModels);
  const manufacturer = model.split(' ')[0];
  const installDate = randomTimestamp(new Date('2018-01-01'), new Date('2023-12-31'));

  sql.push(`INSERT INTO dialyse_machines (id, organization_id, machine_number, model, manufacturer, serial_number, status, isolation_only, location, total_hours, total_sessions, installation_date, last_maintenance_date, next_maintenance_date, notes, created_by, created_at, updated_at) VALUES ('${id}', '${ORG_ID}', 'HD${String(i + 1).padStart(3, '0')}', '${model}', '${manufacturer}', 'SN${randomInt(100000, 999999)}', '${randomChoice(['available', 'available', 'available', 'in_use', 'maintenance'])}', ${i < 3 ? 1 : 0}, '${randomChoice(['Salle A', 'Salle B', 'Salle C', 'Salle Isolation'])}', ${randomInt(500, 15000)}, ${randomInt(100, 5000)}, ${installDate}, ${randomTimestamp(new Date('2024-01-01'), new Date('2024-11-30'))}, ${randomTimestamp(new Date('2025-01-01'), new Date('2025-06-30'))}, 'Machine en bon état', '${USER_ID}', ${Date.now()}, ${Date.now()});`);
}

// DIALYSE SESSION SLOTS
console.log('Generating dialyse session slots...');
const slotIds = [];
const slots = [
  { name: 'Matin', start: '07:00', end: '11:00', days: 'monday,wednesday,friday' },
  { name: 'Matin', start: '07:00', end: '11:00', days: 'tuesday,thursday,saturday' },
  { name: 'Après-midi', start: '12:00', end: '16:00', days: 'monday,wednesday,friday' },
  { name: 'Après-midi', start: '12:00', end: '16:00', days: 'tuesday,thursday,saturday' },
  { name: 'Soir', start: '17:00', end: '21:00', days: 'monday,wednesday,friday' },
  { name: 'Soir', start: '17:00', end: '21:00', days: 'tuesday,thursday,saturday' }
];
for (const slot of slots) {
  const id = uuid();
  slotIds.push(id);
  sql.push(`INSERT INTO dialyse_session_slots (id, organization_id, name, start_time, end_time, days_of_week, max_patients, active, created_at, updated_at) VALUES ('${id}', '${ORG_ID}', '${slot.name}', '${slot.start}', '${slot.end}', '${slot.days}', ${randomInt(8, 15)}, 1, ${Date.now()}, ${Date.now()});`);
}

// DIALYSE PRESCRIPTIONS
console.log('Generating dialyse prescriptions...');
const prescriptionIds = [];
const dialyzerTypes = ['F60', 'F70', 'F80', 'FX80', 'FX100', 'Polyflux 170H', 'Polyflux 210H'];
for (let i = 0; i < dialysePatientIds.length; i++) {
  const id = uuid();
  prescriptionIds.push(id);
  const patientId = dialysePatientIds[i];
  const duration = randomChoice([180, 210, 240, 270]);
  const frequency = randomChoice([2, 3]);
  const bloodFlow = randomChoice([250, 280, 300, 320, 350]);
  const dialysateFlow = randomChoice([500, 600, 700]);
  const startDate = randomTimestamp(new Date('2023-01-01'), new Date('2024-06-01'));

  sql.push(`INSERT INTO dialyse_prescriptions (id, organization_id, patient_id, prescribed_by, prescription_number, type, is_permanent, duration_minutes, frequency_per_week, dry_weight, blood_flow_rate, dialysate_flow_rate, dialyzer_type, membrane_surface, anticoagulation_type, anticoagulation_dose, dialysate_sodium, dialysate_potassium, dialysate_bicarbonate, dialysate_calcium, start_date, status, notes, created_at, updated_at) VALUES ('${id}', '${ORG_ID}', '${patientId}', '${USER_ID}', 'RX${String(randomInt(10000, 99999))}', 'hemodialysis', 1, ${duration}, ${frequency}, ${randomFloat(45, 95, 1)}, ${bloodFlow}, ${dialysateFlow}, '${randomChoice(dialyzerTypes)}', ${randomFloat(1.4, 2.2, 1)}, '${randomChoice(['heparin', 'lovenox', 'citrate', 'none'])}', '${randomChoice(['5000 UI', '4000 UI', '3000 UI', '40mg', '60mg'])}', ${randomChoice([138, 140, 142])}, ${randomFloat(1.5, 3.0, 1)}, ${randomChoice([32, 34, 36])}, ${randomFloat(1.25, 1.75, 2)}, ${startDate}, 'active', 'Prescription standard', ${Date.now()}, ${Date.now()});`);
}

// DIALYSE SESSIONS (generate 500+ sessions)
console.log('Generating dialyse sessions...');
const sessionIds = [];
for (let i = 0; i < 600; i++) {
  const id = uuid();
  sessionIds.push(id);
  const patientIdx = i % dialysePatientIds.length;
  const patientId = dialysePatientIds[patientIdx];
  const prescriptionId = prescriptionIds[patientIdx];
  const machineId = randomChoice(machineIds);
  const slotId = randomChoice(slotIds);
  const sessionDate = randomTimestamp(new Date('2024-01-01'), new Date('2024-12-15'));
  const status = randomChoice(['completed', 'completed', 'completed', 'completed', 'scheduled', 'in_progress', 'cancelled']);

  sql.push(`INSERT INTO dialyse_sessions (id, organization_id, patient_id, prescription_id, machine_id, slot_id, session_number, session_date, status, scheduled_start_time, actual_start_time, actual_end_time, actual_duration_minutes, notes, created_by, created_at, updated_at) VALUES ('${id}', '${ORG_ID}', '${patientId}', '${prescriptionId}', '${machineId}', '${slotId}', 'S${String(randomInt(100000, 999999))}', ${sessionDate}, '${status}', '${randomChoice(['07:00', '12:00', '17:00'])}', ${status === 'completed' ? sessionDate : 'NULL'}, ${status === 'completed' ? sessionDate + 14400 : 'NULL'}, ${status === 'completed' ? randomChoice([180, 210, 240]) : 'NULL'}, '${randomChoice(['Session normale', 'Patient stable', 'Légère hypotension traitée', 'RAS'])}', '${USER_ID}', ${Date.now()}, ${Date.now()});`);
}

// DIALYSE VASCULAR ACCESSES
console.log('Generating vascular accesses...');
const accessTypes = ['fav_brachiocephalique', 'fav_radiocephalique', 'fav_humerocephalique', 'catheter_jugulaire', 'catheter_femoral', 'catheter_sous_clavier'];
const locations = ['Bras gauche', 'Bras droit', 'Avant-bras gauche', 'Avant-bras droit', 'Cou', 'Cuisse droite', 'Cuisse gauche'];
for (let i = 0; i < dialysePatientIds.length; i++) {
  const id = uuid();
  const patientId = dialysePatientIds[i];
  const accessType = randomChoice(accessTypes);
  const creationDate = randomTimestamp(new Date('2018-01-01'), new Date('2024-06-01'));

  sql.push(`INSERT INTO dialyse_vascular_accesses (id, organization_id, patient_id, type, location, creation_date, surgeon, status, last_control_date, next_control_date, notes, created_by, created_at, updated_at) VALUES ('${id}', '${ORG_ID}', '${patientId}', '${accessType}', '${randomChoice(locations)}', ${creationDate}, 'Dr. ${randomChoice(lastNames)}', '${randomChoice(['active', 'active', 'active', 'monitoring', 'failed'])}', ${randomTimestamp(new Date('2024-06-01'), new Date('2024-11-30'))}, ${randomTimestamp(new Date('2025-01-01'), new Date('2025-06-30'))}, '${randomChoice(['Bon débit', 'Accès fonctionnel', 'Surveillance thrill', 'À surveiller'])}', '${USER_ID}', ${Date.now()}, ${Date.now()});`);
}

// DIALYSE LAB RESULTS
console.log('Generating lab results...');
for (let i = 0; i < 400; i++) {
  const id = uuid();
  const patientId = randomChoice(dialysePatientIds);
  const labDate = randomTimestamp(new Date('2024-01-01'), new Date('2024-12-15'));

  sql.push(`INSERT INTO dialyse_lab_results (id, organization_id, patient_id, lab_date, urea_pre, urea_post, creatinine, kt_v, hemoglobin, hematocrit, pth, calcium, phosphorus, potassium, sodium, albumin, ferritin, has_out_of_range_values, notes, created_by, created_at, updated_at) VALUES ('${id}', '${ORG_ID}', '${patientId}', ${labDate}, ${randomFloat(80, 180, 1)}, ${randomFloat(20, 60, 1)}, ${randomFloat(400, 1200, 0)}, ${randomFloat(1.0, 1.8, 2)}, ${randomFloat(8.0, 13.0, 1)}, ${randomFloat(25, 42, 1)}, ${randomFloat(50, 800, 0)}, ${randomFloat(2.0, 2.6, 2)}, ${randomFloat(3.0, 7.0, 1)}, ${randomFloat(3.5, 6.5, 1)}, ${randomFloat(135, 145, 0)}, ${randomFloat(30, 45, 1)}, ${randomFloat(100, 800, 0)}, ${randomChoice([0, 0, 0, 1])}, '${randomChoice(['Valeurs dans les normes', 'À surveiller', 'Anémie légère', 'PTH élevée'])}', '${USER_ID}', ${Date.now()}, ${Date.now()});`);
}

// DIALYSE MACHINE MAINTENANCE
console.log('Generating machine maintenance records...');
for (let i = 0; i < 80; i++) {
  const id = uuid();
  const machineId = randomChoice(machineIds);
  const scheduledDate = randomTimestamp(new Date('2024-01-01'), new Date('2024-12-31'));
  const maintenanceType = randomChoice(['preventive', 'corrective', 'calibration', 'inspection']);

  sql.push(`INSERT INTO dialyse_machine_maintenance (id, organization_id, machine_id, maintenance_number, type, status, scheduled_date, completed_date, performed_by, description, work_performed, cost, notes, created_by, created_at, updated_at) VALUES ('${id}', '${ORG_ID}', '${machineId}', 'MAINT${randomInt(10000, 99999)}', '${maintenanceType}', '${randomChoice(['completed', 'completed', 'scheduled', 'in_progress'])}', ${scheduledDate}, ${randomChoice([scheduledDate, 'NULL'])}, '${randomChoice(['Technicien Fresenius', 'Technicien interne', 'Biomedical Services'])}', '${randomChoice(['Maintenance préventive mensuelle', 'Remplacement pompe', 'Calibration capteurs', 'Inspection générale'])}', '${randomChoice(['Nettoyage complet, vérification pompes', 'Remplacement filtre, test pression', 'Calibration effectuée', 'RAS'])}', ${randomFloat(0, 2500, 2)}, 'Maintenance effectuée', '${USER_ID}', ${Date.now()}, ${Date.now()});`);
}

// =====================================================
// CARDIOLOGY MODULE
// =====================================================
console.log('Generating cardiology patients...');
const cardiologyPatientIds = [];
const usedHealthcarePatientIds = [];
for (let i = 0; i < 100; i++) {
  const id = uuid();
  cardiologyPatientIds.push(id);
  const healthcarePatientId = healthcarePatientIds[i];
  usedHealthcarePatientIds.push(healthcarePatientId);

  sql.push(`INSERT INTO cardiology_patients (id, healthcare_patient_id, company_id, cardiac_risk_level, has_pacemaker, has_stent, has_bypass, ejection_fraction, last_ecg_date, last_echo_date, nyha_class, smoking_status, diabetes_status, hypertension_status, dyslipidemia_status, cardiac_history, created_at, updated_at) VALUES ('${id}', '${healthcarePatientId}', '${COMPANY_ID}', '${randomChoice(['low', 'moderate', 'high', 'very_high'])}', ${randomChoice([0, 0, 0, 1])}, ${randomChoice([0, 0, 0, 1])}, ${randomChoice([0, 0, 0, 0, 1])}, ${randomFloat(25, 70, 0)}, '${randomDate(new Date('2024-01-01'), new Date('2024-12-15'))}', '${randomDate(new Date('2024-01-01'), new Date('2024-12-15'))}', '${randomChoice(['I', 'II', 'III', 'IV'])}', '${randomChoice(['never', 'former', 'current', 'never', 'never'])}', '${randomChoice(['none', 'type1', 'type2', 'prediabetes', 'none', 'none'])}', '${randomChoice(['none', 'controlled', 'uncontrolled', 'none', 'controlled'])}', '${randomChoice(['none', 'treated', 'untreated', 'none', 'treated'])}', '${randomChoice(['Infarctus 2019', 'Angioplastie LAD 2020', 'Insuffisance cardiaque', 'Fibrillation auriculaire', 'Aucun antécédent'])}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);`);
}

// CARDIOLOGY ECG
console.log('Generating cardiology ECG records...');
const interpretations = ['normal', 'abnormal', 'borderline'];
const rhythms = ['sinusal', 'fibrillation_auriculaire', 'flutter', 'tachycardie_sinusale', 'bradycardie_sinusale'];
for (let i = 0; i < 300; i++) {
  const id = uuid();
  const patientId = healthcarePatientIds[i % 100];

  sql.push(`INSERT INTO cardiology_ecg (id, patient_id, company_id, recording_date, recording_time, heart_rate, pr_interval, qrs_duration, qt_interval, qtc_interval, rhythm, axis, interpretation, findings, technician, reviewing_doctor, status, created_at, updated_at) VALUES ('${id}', '${patientId}', '${COMPANY_ID}', '${randomDate(new Date('2024-01-01'), new Date('2024-12-15'))}', '${String(randomInt(7, 18)).padStart(2, '0')}:${String(randomInt(0, 59)).padStart(2, '0')}', ${randomInt(50, 120)}, ${randomInt(120, 220)}, ${randomInt(80, 120)}, ${randomInt(360, 480)}, ${randomInt(380, 460)}, '${randomChoice(rhythms)}', '${randomChoice(['normal', 'deviation_gauche', 'deviation_droite'])}', '${randomChoice(interpretations)}', '${randomChoice(['ECG normal', 'Ondes T négatives V1-V3', 'Sous-décalage ST latéral', 'Hypertrophie VG', 'BBD complet', 'FA rapide', 'ESV isolées'])}', 'Tech. ${randomChoice(lastNames)}', 'Dr. ${randomChoice(lastNames)}', 'completed', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);`);
}

// CARDIOLOGY PACEMAKERS
console.log('Generating cardiology pacemakers...');
const pacemakerManufacturers = ['Medtronic', 'Boston Scientific', 'Abbott', 'Biotronik', 'MicroPort'];
const pacemakerModels = ['Advisa MRI', 'ACCOLADE', 'Assurity MRI', 'Edora 8', 'Rega'];
const deviceTypes = ['single_chamber', 'dual_chamber', 'biventricular', 'icd'];
const pacingModes = ['VVI', 'DDD', 'DDDR', 'AAIR', 'CRT-D'];
const pacemakerIds = [];
for (let i = 0; i < 40; i++) {
  const id = uuid();
  pacemakerIds.push(id);
  const patientId = healthcarePatientIds[i];
  const implantDate = randomDate(new Date('2018-01-01'), new Date('2024-06-01'));
  const manufacturer = randomChoice(pacemakerManufacturers);

  sql.push(`INSERT INTO cardiology_pacemakers (id, patient_id, company_id, manufacturer, model, serial_number, implant_date, implanting_doctor, implanting_hospital, device_type, leads_count, battery_status, battery_voltage, estimated_longevity, last_interrogation_date, next_interrogation_date, pacing_mode, lower_rate, upper_rate, status, notes, created_at, updated_at) VALUES ('${id}', '${patientId}', '${COMPANY_ID}', '${manufacturer}', '${randomChoice(pacemakerModels)}', 'PM${randomInt(100000, 999999)}', '${implantDate}', 'Dr. ${randomChoice(lastNames)}', '${randomChoice(['CHU Ibn Rochd', 'CHU Mohammed VI', 'Clinique Internationale', 'Hôpital Cheikh Khalifa'])}', '${randomChoice(deviceTypes)}', ${randomChoice([1, 2, 3])}, '${randomChoice(['good', 'good', 'good', 'monitoring', 'low'])}', ${randomFloat(2.5, 3.1, 2)}, '${randomInt(3, 10)} ans', '${randomDate(new Date('2024-06-01'), new Date('2024-12-15'))}', '${randomDate(new Date('2025-01-01'), new Date('2025-12-31'))}', '${randomChoice(pacingModes)}', ${randomChoice([50, 55, 60])}, ${randomChoice([120, 130, 140, 150])}, 'active', 'Dispositif fonctionnel', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);`);
}

// CARDIOLOGY PACEMAKER INTERROGATIONS
console.log('Generating pacemaker interrogations...');
for (let i = 0; i < 150; i++) {
  const id = uuid();
  const pacemakerId = randomChoice(pacemakerIds);

  sql.push(`INSERT INTO cardiology_pacemaker_interrogations (id, pacemaker_id, company_id, interrogation_date, technician, doctor, battery_voltage, battery_impedance, lead_impedance_atrial, lead_impedance_ventricular, sensing_atrial, sensing_ventricular, threshold_atrial, threshold_ventricular, percent_paced_atrial, percent_paced_ventricular, episodes_af, episodes_vt, episodes_vf, findings, adjustments_made, next_follow_up, created_at, updated_at) VALUES ('${id}', '${pacemakerId}', '${COMPANY_ID}', '${randomDate(new Date('2024-01-01'), new Date('2024-12-15'))}', 'Tech. ${randomChoice(lastNames)}', 'Dr. ${randomChoice(lastNames)}', ${randomFloat(2.5, 3.1, 2)}, ${randomFloat(400, 600, 0)}, ${randomFloat(400, 700, 0)}, ${randomFloat(400, 700, 0)}, ${randomFloat(2.0, 5.0, 1)}, ${randomFloat(5.0, 15.0, 1)}, ${randomFloat(0.5, 1.5, 2)}, ${randomFloat(0.5, 1.5, 2)}, ${randomFloat(0, 100, 1)}, ${randomFloat(0, 100, 1)}, ${randomInt(0, 10)}, ${randomInt(0, 3)}, ${randomInt(0, 1)}, '${randomChoice(['Paramètres stables', 'Batterie en bon état', 'Seuils normaux', 'Quelques ESV détectées', 'Épisodes FA courts'])}', '${randomChoice(['Aucun', 'Ajustement sensibilité', 'Modification fréquence base', 'Aucun changement'])}', '${randomDate(new Date('2025-01-01'), new Date('2025-12-31'))}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);`);
}

// CARDIOLOGY STENTS
console.log('Generating cardiology stents...');
const stentLocations = ['LAD', 'LCX', 'RCA', 'LM', 'D1', 'OM1', 'PDA'];
const stentTypes = ['DES', 'BMS', 'BVS'];
const stentManufacturers = ['Medtronic', 'Abbott', 'Boston Scientific', 'Biotronik', 'Terumo'];
for (let i = 0; i < 60; i++) {
  const id = uuid();
  const patientId = healthcarePatientIds[i % 50];
  const implantDate = randomDate(new Date('2018-01-01'), new Date('2024-06-01'));

  sql.push(`INSERT INTO cardiology_stents (id, patient_id, company_id, implant_date, implanting_doctor, implanting_hospital, stent_type, manufacturer, model, diameter, length, location, lesion_type, pre_stenosis, post_stenosis, timi_flow_pre, timi_flow_post, dual_antiplatelet_end_date, notes, created_at, updated_at) VALUES ('${id}', '${patientId}', '${COMPANY_ID}', '${implantDate}', 'Dr. ${randomChoice(lastNames)}', '${randomChoice(['CHU Ibn Rochd', 'CHU Mohammed VI', 'Clinique Internationale', 'Hôpital Cheikh Khalifa'])}', '${randomChoice(stentTypes)}', '${randomChoice(stentManufacturers)}', '${randomChoice(['Xience', 'Resolute', 'Synergy', 'Orsiro', 'Ultimaster'])}', ${randomFloat(2.5, 4.0, 1)}, ${randomInt(15, 38)}, '${randomChoice(stentLocations)}', '${randomChoice(['A', 'B1', 'B2', 'C'])}', ${randomInt(70, 99)}, ${randomInt(0, 10)}, '${randomChoice(['0', '1', '2'])}', '3', '${randomDate(new Date('2025-01-01'), new Date('2026-06-01'))}', 'Procédure sans complication', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);`);
}

// HEALTHCARE CONSULTATIONS (Cardiology)
console.log('Generating cardiology consultations...');
for (let i = 0; i < 200; i++) {
  const id = uuid();
  const patientId = healthcarePatientIds[i % 100];

  sql.push(`INSERT INTO healthcare_consultations (id, patient_id, company_id, module, consultation_date, consultation_time, consultation_type, doctor_name, chief_complaint, diagnosis, treatment_plan, notes, follow_up_date, status, created_at, updated_at) VALUES ('${id}', '${patientId}', '${COMPANY_ID}', 'cardiology', '${randomDate(new Date('2024-01-01'), new Date('2024-12-15'))}', '${String(randomInt(8, 17)).padStart(2, '0')}:${String(randomInt(0, 59)).padStart(2, '0')}', '${randomChoice(['routine', 'urgent', 'follow_up', 'pre_operative'])}', 'Dr. ${randomChoice(lastNames)}', '${randomChoice(['Douleur thoracique', 'Dyspnée effort', 'Palpitations', 'Contrôle pacemaker', 'Suivi post-infarctus', 'HTA mal contrôlée', 'Bilan cardiaque'])}', '${randomChoice(['Angor stable', 'Insuffisance cardiaque NYHA II', 'FA paroxystique', 'HTA grade 2', 'Post-IDM, évolution favorable', 'Cardiomyopathie dilatée'])}', '${randomChoice(['Optimisation traitement', 'Ajout bêtabloquant', 'Coronarographie programmée', 'Surveillance', 'Holter ECG prévu'])}', 'Consultation standard', '${randomDate(new Date('2025-01-01'), new Date('2025-06-30'))}', 'completed', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);`);
}

// =====================================================
// OPHTHALMOLOGY MODULE
// =====================================================
console.log('Generating ophthalmology patients...');
const ophthalmoPatientIds = [];
for (let i = 50; i < 150; i++) {
  const id = uuid();
  ophthalmoPatientIds.push(id);
  const healthcarePatientId = healthcarePatientIds[i];

  sql.push(`INSERT INTO ophthalmology_patients (id, healthcare_patient_id, company_id, primary_diagnosis, has_glaucoma, has_dmla, has_diabetic_retinopathy, has_cataract, has_iol_implant, last_acuity_od, last_acuity_og, last_iop_od, last_iop_og, last_consultation, next_appointment, wearing_glasses, wearing_contacts, ophthalmic_history, created_at, updated_at) VALUES ('${id}', '${healthcarePatientId}', '${COMPANY_ID}', '${randomChoice(['Glaucome primitif', 'DMLA humide', 'DMLA sèche', 'Rétinopathie diabétique', 'Cataracte', 'Myopie forte', 'Aucune'])}', ${randomChoice([0, 0, 0, 1])}, ${randomChoice([0, 0, 0, 1])}, ${randomChoice([0, 0, 0, 1])}, ${randomChoice([0, 0, 1])}, ${randomChoice([0, 0, 0, 1])}, '${randomChoice(['10/10', '9/10', '8/10', '6/10', '4/10', '2/10', 'CLD', 'VBLM'])}', '${randomChoice(['10/10', '9/10', '8/10', '6/10', '4/10', '2/10', 'CLD', 'VBLM'])}', ${randomFloat(10, 28, 1)}, ${randomFloat(10, 28, 1)}, '${randomDate(new Date('2024-01-01'), new Date('2024-12-15'))}', '${randomDate(new Date('2025-01-01'), new Date('2025-06-30'))}', ${randomChoice([0, 1])}, ${randomChoice([0, 0, 0, 1])}, '${randomChoice(['Chirurgie cataracte 2020', 'IVT depuis 2021', 'Glaucome traité', 'Aucun antécédent'])}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);`);
}

// OPHTHALMOLOGY OCT
console.log('Generating OCT scans...');
const scanTypes = ['macula', 'rnfl', 'optic_nerve', 'anterior'];
const eyes = ['OD', 'OG'];
for (let i = 0; i < 250; i++) {
  const id = uuid();
  const patientId = healthcarePatientIds[50 + (i % 100)];
  const eye = randomChoice(eyes);
  const scanType = randomChoice(scanTypes);

  sql.push(`INSERT INTO ophthalmology_oct (id, patient_id, company_id, scan_date, eye, scan_type, device, technician, reviewing_doctor, signal_quality, central_macular_thickness, macula_volume, rnfl_thickness, rnfl_superior, rnfl_inferior, rnfl_nasal, rnfl_temporal, cup_disc_ratio, findings, interpretation, status, created_at, updated_at) VALUES ('${id}', '${patientId}', '${COMPANY_ID}', '${randomDate(new Date('2024-01-01'), new Date('2024-12-15'))}', '${eye}', '${scanType}', '${randomChoice(['Zeiss Cirrus', 'Heidelberg Spectralis', 'Topcon Maestro'])}', 'Tech. ${randomChoice(lastNames)}', 'Dr. ${randomChoice(lastNames)}', '${randomChoice(['good', 'good', 'good', 'fair', 'poor'])}', ${scanType === 'macula' ? randomInt(220, 450) : 'NULL'}, ${scanType === 'macula' ? randomFloat(6.5, 12.0, 2) : 'NULL'}, ${scanType === 'rnfl' ? randomInt(60, 120) : 'NULL'}, ${scanType === 'rnfl' ? randomInt(80, 140) : 'NULL'}, ${scanType === 'rnfl' ? randomInt(80, 140) : 'NULL'}, ${scanType === 'rnfl' ? randomInt(50, 90) : 'NULL'}, ${scanType === 'rnfl' ? randomInt(50, 80) : 'NULL'}, ${scanType === 'optic_nerve' ? randomFloat(0.3, 0.8, 2) : 'NULL'}, '${randomChoice(['OCT normal', 'Épaississement maculaire', 'Atrophie RNFL', 'DEP', 'Membrane épirétinienne', 'Trou maculaire'])}', '${randomChoice(['Normal', 'À surveiller', 'Pathologique', 'Stable par rapport au précédent'])}', 'completed', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);`);
}

// OPHTHALMOLOGY VISUAL FIELDS
console.log('Generating visual fields...');
for (let i = 0; i < 180; i++) {
  const id = uuid();
  const patientId = healthcarePatientIds[50 + (i % 100)];
  const eye = randomChoice(eyes);
  const md = randomFloat(-25, 2, 2);

  sql.push(`INSERT INTO ophthalmology_visual_fields (id, patient_id, company_id, test_date, eye, test_strategy, device, technician, reviewing_doctor, fixation_losses, false_positives, false_negatives, reliability, mean_deviation, pattern_standard_deviation, visual_field_index, ght_status, findings, progression_analysis, created_at, updated_at) VALUES ('${id}', '${patientId}', '${COMPANY_ID}', '${randomDate(new Date('2024-01-01'), new Date('2024-12-15'))}', '${eye}', '${randomChoice(['24-2', '10-2', '30-2'])}', '${randomChoice(['Humphrey', 'Octopus', 'Medmont'])}', 'Tech. ${randomChoice(lastNames)}', 'Dr. ${randomChoice(lastNames)}', ${randomInt(0, 5)}, ${randomInt(0, 10)}, ${randomInt(0, 10)}, '${randomChoice(['reliable', 'reliable', 'reliable', 'borderline', 'unreliable'])}', ${md}, ${randomFloat(1, 12, 2)}, ${randomFloat(50, 100, 0)}, '${randomChoice(['Within Normal Limits', 'Borderline', 'Outside Normal Limits'])}', '${randomChoice(['Champ visuel normal', 'Déficit arciforme supérieur', 'Scotome paracentral', 'Atteinte diffuse', 'Déficit nasal'])}', '${randomChoice(['Stable', 'Progression possible', 'Progression confirmée', 'Amélioration'])}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);`);
}

// OPHTHALMOLOGY IVT INJECTIONS
console.log('Generating IVT injections...');
const ivtDrugs = ['Eylea', 'Lucentis', 'Avastin', 'Vabysmo', 'Ozurdex'];
const ivtIndications = ['DMLA', 'DME', 'RVO', 'myopic_cnv'];
for (let i = 0; i < 350; i++) {
  const id = uuid();
  const patientId = healthcarePatientIds[50 + (i % 80)];
  const eye = randomChoice(eyes);
  const drug = randomChoice(ivtDrugs);

  sql.push(`INSERT INTO ophthalmology_ivt_injections (id, patient_id, company_id, injection_date, eye, drug, drug_generic, dose, lot_number, indication, injection_number, protocol, pre_injection_iop, post_injection_iop, pre_injection_acuity, performing_doctor, assistant, complications, next_injection_date, notes, created_at, updated_at) VALUES ('${id}', '${patientId}', '${COMPANY_ID}', '${randomDate(new Date('2024-01-01'), new Date('2024-12-15'))}', '${eye}', '${drug}', '${drug === 'Eylea' ? 'aflibercept' : drug === 'Lucentis' ? 'ranibizumab' : drug === 'Avastin' ? 'bevacizumab' : drug === 'Vabysmo' ? 'faricimab' : 'dexamethasone'}', '${drug === 'Ozurdex' ? '700µg' : drug === 'Vabysmo' ? '6mg' : '2mg'}', 'LOT${randomInt(100000, 999999)}', '${randomChoice(ivtIndications)}', ${randomInt(1, 24)}, '${randomChoice(['PRN', 'T&E', 'fixed'])}', ${randomFloat(12, 22, 1)}, ${randomFloat(15, 35, 1)}, '${randomChoice(['6/10', '5/10', '4/10', '3/10', '2/10', 'CLD'])}', 'Dr. ${randomChoice(lastNames)}', 'IDE ${randomChoice(firstNames)}', '${randomChoice(['Aucune', 'Aucune', 'Aucune', 'Aucune', 'Hémorragie sous-conjonctivale minime'])}', '${randomDate(new Date('2025-01-01'), new Date('2025-06-30'))}', 'Injection sans complication', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);`);
}

// OPHTHALMOLOGY TONOMETRY
console.log('Generating tonometry measurements...');
for (let i = 0; i < 200; i++) {
  const id = uuid();
  const patientId = healthcarePatientIds[50 + (i % 100)];

  sql.push(`INSERT INTO ophthalmology_tonometry (id, patient_id, company_id, measurement_date, measurement_time, device, technician, iop_od, iop_og, cct_od, cct_og, iop_od_corrected, iop_og_corrected, notes, created_at, updated_at) VALUES ('${id}', '${patientId}', '${COMPANY_ID}', '${randomDate(new Date('2024-01-01'), new Date('2024-12-15'))}', '${String(randomInt(8, 17)).padStart(2, '0')}:${String(randomInt(0, 59)).padStart(2, '0')}', '${randomChoice(['goldmann', 'icare', 'tonopen', 'pneumo'])}', 'Tech. ${randomChoice(lastNames)}', ${randomFloat(10, 28, 1)}, ${randomFloat(10, 28, 1)}, ${randomInt(480, 600)}, ${randomInt(480, 600)}, ${randomFloat(10, 26, 1)}, ${randomFloat(10, 26, 1)}, '${randomChoice(['Mesure fiable', 'Patient collaborant', 'Légère appréhension'])}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);`);
}

// OPHTHALMOLOGY REFRACTION
console.log('Generating refraction measurements...');
for (let i = 0; i < 150; i++) {
  const id = uuid();
  const patientId = healthcarePatientIds[50 + (i % 100)];

  sql.push(`INSERT INTO ophthalmology_refraction (id, patient_id, company_id, measurement_date, technician, optometrist, od_sphere, od_cylinder, od_axis, od_add, od_va_uncorrected, od_va_corrected, od_pd, og_sphere, og_cylinder, og_axis, og_add, og_va_uncorrected, og_va_corrected, og_pd, prescription_type, notes, created_at, updated_at) VALUES ('${id}', '${patientId}', '${COMPANY_ID}', '${randomDate(new Date('2024-01-01'), new Date('2024-12-15'))}', 'Tech. ${randomChoice(lastNames)}', 'Dr. ${randomChoice(lastNames)}', ${randomFloat(-8, 4, 2)}, ${randomFloat(-4, 0, 2)}, ${randomInt(0, 180)}, ${randomFloat(0, 3, 2)}, '${randomChoice(['10/10', '8/10', '6/10', '4/10'])}', '${randomChoice(['10/10', '10/10', '9/10'])}', ${randomFloat(28, 35, 1)}, ${randomFloat(-8, 4, 2)}, ${randomFloat(-4, 0, 2)}, ${randomInt(0, 180)}, ${randomFloat(0, 3, 2)}, '${randomChoice(['10/10', '8/10', '6/10', '4/10'])}', '${randomChoice(['10/10', '10/10', '9/10'])}', ${randomFloat(28, 35, 1)}, '${randomChoice(['distance', 'near', 'progressive', 'bifocal'])}', 'Réfraction standard', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);`);
}

// HEALTHCARE CONSULTATIONS (Ophthalmology)
console.log('Generating ophthalmology consultations...');
for (let i = 0; i < 200; i++) {
  const id = uuid();
  const patientId = healthcarePatientIds[50 + (i % 100)];

  sql.push(`INSERT INTO healthcare_consultations (id, patient_id, company_id, module, consultation_date, consultation_time, consultation_type, doctor_name, chief_complaint, diagnosis, treatment_plan, notes, follow_up_date, status, created_at, updated_at) VALUES ('${id}', '${patientId}', '${COMPANY_ID}', 'ophthalmology', '${randomDate(new Date('2024-01-01'), new Date('2024-12-15'))}', '${String(randomInt(8, 17)).padStart(2, '0')}:${String(randomInt(0, 59)).padStart(2, '0')}', '${randomChoice(['routine', 'urgent', 'follow_up', 'pre_operative'])}', 'Dr. ${randomChoice(lastNames)}', '${randomChoice(['Baisse acuité visuelle', 'Vision floue', 'Douleur oculaire', 'Contrôle glaucome', 'Suivi DMLA', 'Contrôle IVT', 'Bilan pré-cataracte'])}', '${randomChoice(['DMLA humide active', 'Glaucome chronique stable', 'Cataracte sénile', 'RD non proliférante', 'Syndrome sec modéré', 'Myopie forte'])}', '${randomChoice(['IVT mensuelle', 'Continuer collyres', 'Chirurgie programmée', 'Surveillance OCT', 'Laser prévu'])}', 'Consultation ophtalmologique', '${randomDate(new Date('2025-01-01'), new Date('2025-06-30'))}', 'completed', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);`);
}

// HEALTHCARE MEDICATIONS
console.log('Generating healthcare medications...');
const medications = [
  // Cardiology
  { name: 'Kardegic', module: 'cardiology', dosage: '75mg', frequency: '1x/jour', route: 'oral' },
  { name: 'Plavix', module: 'cardiology', dosage: '75mg', frequency: '1x/jour', route: 'oral' },
  { name: 'Bisoprolol', module: 'cardiology', dosage: '5mg', frequency: '1x/jour', route: 'oral' },
  { name: 'Ramipril', module: 'cardiology', dosage: '5mg', frequency: '1x/jour', route: 'oral' },
  { name: 'Atorvastatine', module: 'cardiology', dosage: '40mg', frequency: '1x/jour', route: 'oral' },
  { name: 'Furosémide', module: 'cardiology', dosage: '40mg', frequency: '1x/jour', route: 'oral' },
  // Ophthalmology
  { name: 'Latanoprost', module: 'ophthalmology', dosage: '0.005%', frequency: '1x/jour soir', route: 'collyre' },
  { name: 'Timolol', module: 'ophthalmology', dosage: '0.5%', frequency: '2x/jour', route: 'collyre' },
  { name: 'Dorzolamide', module: 'ophthalmology', dosage: '2%', frequency: '3x/jour', route: 'collyre' },
  { name: 'Brimonidine', module: 'ophthalmology', dosage: '0.2%', frequency: '2x/jour', route: 'collyre' },
  { name: 'Azopt', module: 'ophthalmology', dosage: '1%', frequency: '2x/jour', route: 'collyre' }
];

for (let i = 0; i < 300; i++) {
  const id = uuid();
  const med = randomChoice(medications);
  const patientId = med.module === 'cardiology'
    ? healthcarePatientIds[i % 100]
    : healthcarePatientIds[50 + (i % 100)];

  sql.push(`INSERT INTO healthcare_medications (id, patient_id, company_id, module, medication_name, dosage, frequency, route, start_date, prescribing_doctor, indication, status, notes, created_at, updated_at) VALUES ('${id}', '${patientId}', '${COMPANY_ID}', '${med.module}', '${med.name}', '${med.dosage}', '${med.frequency}', '${med.route}', '${randomDate(new Date('2023-01-01'), new Date('2024-06-01'))}', 'Dr. ${randomChoice(lastNames)}', '${randomChoice(['Traitement de fond', 'Prévention secondaire', 'Contrôle tension', 'Réduction PIO'])}', 'active', 'Prescription active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);`);
}

// HEALTHCARE ALERTS
console.log('Generating healthcare alerts...');
const alertTypes = ['lab_critical', 'medication_due', 'appointment_missed', 'vital_abnormal', 'follow_up_required'];
const severities = ['low', 'medium', 'high', 'critical'];
for (let i = 0; i < 100; i++) {
  const id = uuid();
  const patientId = healthcarePatientIds[i % 150];
  const module = randomChoice(['cardiology', 'ophthalmology', 'dialysis']);

  sql.push(`INSERT INTO healthcare_alerts (id, patient_id, company_id, module, alert_type, severity, title, description, triggered_at, status, created_at, updated_at) VALUES ('${id}', '${patientId}', '${COMPANY_ID}', '${module}', '${randomChoice(alertTypes)}', '${randomChoice(severities)}', '${randomChoice(['Résultat critique', 'Rendez-vous manqué', 'Suivi requis', 'Médicament à renouveler', 'Anomalie détectée'])}', '${randomChoice(['Hémoglobine basse', 'PIO élevée', 'ECG anormal', 'Patient non venu', 'Renouvellement prescription'])}', CURRENT_TIMESTAMP, '${randomChoice(['active', 'active', 'acknowledged', 'resolved'])}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);`);
}

// Write SQL to file
const fs = require('fs');
const sqlContent = sql.join('\n');
fs.writeFileSync('/tmp/healthcare_seed_staging.sql', sqlContent);
console.log(`\nGenerated ${sql.length} SQL statements`);
console.log('SQL file written to /tmp/healthcare_seed_staging.sql');
