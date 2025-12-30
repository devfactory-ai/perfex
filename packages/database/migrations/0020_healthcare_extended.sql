-- Healthcare Extended Tables Migration
-- Adds missing tables for cardiology and ophthalmology modules

-- ============================================================================
-- HEALTHCARE SHARED TABLES
-- ============================================================================

-- Healthcare Examinations
CREATE TABLE IF NOT EXISTS healthcare_examinations (
    id TEXT PRIMARY KEY,
    company_id TEXT NOT NULL,
    patient_id TEXT NOT NULL REFERENCES healthcare_patients(id) ON DELETE CASCADE,
    consultation_id TEXT REFERENCES healthcare_consultations(id) ON DELETE SET NULL,

    examination_number TEXT NOT NULL,
    examination_date INTEGER NOT NULL,
    module TEXT NOT NULL CHECK (module IN ('cardiology', 'ophthalmology', 'dialyse', 'general')),

    examination_type TEXT NOT NULL,
    examination_subtype TEXT,

    performed_by TEXT REFERENCES employees(id) ON DELETE SET NULL,
    interpreted_by TEXT REFERENCES employees(id) ON DELETE SET NULL,
    interpreted_at INTEGER,

    findings TEXT,
    interpretation TEXT,
    conclusion TEXT,
    recommendations TEXT,
    measurements TEXT,
    media_urls TEXT,
    report_url TEXT,

    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'reviewed', 'cancelled')),
    urgency TEXT DEFAULT 'routine' CHECK (urgency IN ('routine', 'urgent', 'stat')),

    has_abnormal_findings INTEGER DEFAULT 0,
    abnormal_findings TEXT,

    notes TEXT,
    created_by TEXT NOT NULL REFERENCES users(id),
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Healthcare Implanted Devices
CREATE TABLE IF NOT EXISTS healthcare_implanted_devices (
    id TEXT PRIMARY KEY,
    company_id TEXT NOT NULL,
    patient_id TEXT NOT NULL REFERENCES healthcare_patients(id) ON DELETE CASCADE,

    device_number TEXT NOT NULL,
    module TEXT NOT NULL CHECK (module IN ('cardiology', 'ophthalmology', 'dialyse', 'general')),

    device_type TEXT NOT NULL,
    device_subtype TEXT,
    manufacturer TEXT,
    model TEXT,
    serial_number TEXT,
    lot_number TEXT,

    implantation_date INTEGER NOT NULL,
    implantation_site TEXT,
    implanted_by TEXT REFERENCES employees(id) ON DELETE SET NULL,
    implantation_procedure TEXT,

    device_settings TEXT,
    device_measurements TEXT,

    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'replaced', 'explanted', 'malfunctioning')),
    status_date INTEGER,
    status_reason TEXT,

    replaced_by_id TEXT,
    replacement_date INTEGER,
    replacement_reason TEXT,

    last_check_date INTEGER,
    next_check_date INTEGER,
    check_interval_months INTEGER,

    warranty_expiry INTEGER,
    expected_end_of_life INTEGER,

    notes TEXT,
    created_by TEXT NOT NULL REFERENCES users(id),
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Healthcare Appointments
CREATE TABLE IF NOT EXISTS healthcare_appointments (
    id TEXT PRIMARY KEY,
    company_id TEXT NOT NULL,
    patient_id TEXT NOT NULL REFERENCES healthcare_patients(id) ON DELETE CASCADE,

    appointment_number TEXT NOT NULL,
    module TEXT NOT NULL CHECK (module IN ('cardiology', 'ophthalmology', 'dialyse', 'general')),

    appointment_type TEXT NOT NULL CHECK (appointment_type IN ('consultation', 'examination', 'procedure', 'follow_up', 'device_check', 'other')),

    scheduled_date INTEGER NOT NULL,
    scheduled_time TEXT,
    duration_minutes INTEGER DEFAULT 30,

    provider_id TEXT REFERENCES employees(id) ON DELETE SET NULL,
    location TEXT,
    room TEXT,

    status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'checked_in', 'in_progress', 'completed', 'cancelled', 'no_show', 'rescheduled')),

    confirmed_at INTEGER,
    confirmed_by TEXT,
    reminder_sent INTEGER DEFAULT 0,
    reminder_sent_at INTEGER,

    checked_in_at INTEGER,
    completed_at INTEGER,

    cancelled_at INTEGER,
    cancelled_by TEXT REFERENCES users(id) ON DELETE SET NULL,
    cancellation_reason TEXT,
    rescheduled_from_id TEXT,
    rescheduled_to_id TEXT,

    is_recurring INTEGER DEFAULT 0,
    recurrence_rule TEXT,
    recurrence_group_id TEXT,

    reason TEXT,
    notes TEXT,
    created_by TEXT NOT NULL REFERENCES users(id),
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Healthcare Documents
CREATE TABLE IF NOT EXISTS healthcare_documents (
    id TEXT PRIMARY KEY,
    company_id TEXT NOT NULL,
    patient_id TEXT NOT NULL REFERENCES healthcare_patients(id) ON DELETE CASCADE,

    module TEXT NOT NULL CHECK (module IN ('cardiology', 'ophthalmology', 'dialyse', 'general')),

    document_type TEXT NOT NULL CHECK (document_type IN ('consultation_report', 'examination_report', 'lab_result', 'prescription', 'referral_letter', 'discharge_summary', 'consent_form', 'imaging', 'other')),

    title TEXT NOT NULL,
    description TEXT,
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size INTEGER,

    consultation_id TEXT REFERENCES healthcare_consultations(id) ON DELETE SET NULL,
    examination_id TEXT REFERENCES healthcare_examinations(id) ON DELETE SET NULL,

    document_date INTEGER,

    is_confidential INTEGER DEFAULT 0,
    access_level TEXT DEFAULT 'all' CHECK (access_level IN ('all', 'physicians_only', 'owner_only')),

    uploaded_by TEXT NOT NULL REFERENCES users(id),
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Healthcare Chronic Conditions
CREATE TABLE IF NOT EXISTS healthcare_chronic_conditions (
    id TEXT PRIMARY KEY,
    company_id TEXT NOT NULL,
    patient_id TEXT NOT NULL REFERENCES healthcare_patients(id) ON DELETE CASCADE,

    condition_code TEXT,
    condition_name TEXT NOT NULL,
    module TEXT NOT NULL CHECK (module IN ('cardiology', 'ophthalmology', 'dialyse', 'general')),
    category TEXT,

    diagnosis_date INTEGER,
    diagnosed_by TEXT REFERENCES employees(id) ON DELETE SET NULL,
    diagnosis_method TEXT,

    severity TEXT CHECK (severity IN ('mild', 'moderate', 'severe', 'critical')),
    stage TEXT,

    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'controlled', 'resolved', 'in_remission')),
    status_date INTEGER,

    current_treatment TEXT,
    treatment_goals TEXT,
    treatment_response TEXT CHECK (treatment_response IN ('excellent', 'good', 'partial', 'poor', 'unknown')),

    monitoring_parameters TEXT,
    last_assessment_date INTEGER,
    next_assessment_date INTEGER,

    risk_factors TEXT,
    complications TEXT,

    notes TEXT,
    created_by TEXT NOT NULL REFERENCES users(id),
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- ============================================================================
-- CARDIOLOGY TABLES
-- ============================================================================

-- Cardiology ECG Records
CREATE TABLE IF NOT EXISTS cardiology_ecg_records (
    id TEXT PRIMARY KEY,
    company_id TEXT NOT NULL,
    patient_id TEXT NOT NULL REFERENCES healthcare_patients(id) ON DELETE CASCADE,
    examination_id TEXT REFERENCES healthcare_examinations(id) ON DELETE SET NULL,
    consultation_id TEXT REFERENCES healthcare_consultations(id) ON DELETE SET NULL,

    ecg_number TEXT NOT NULL,
    recording_date INTEGER NOT NULL,

    ecg_type TEXT NOT NULL CHECK (ecg_type IN ('standard_12_lead', 'rhythm_strip', 'stress_test', 'signal_averaged')),

    paper_speed INTEGER,
    gain REAL,
    filter_settings TEXT,

    heart_rate INTEGER,
    pr_interval INTEGER,
    qrs_duration INTEGER,
    qt_interval INTEGER,
    qtc_interval INTEGER,
    axis INTEGER,

    rhythm TEXT CHECK (rhythm IN ('sinus', 'afib', 'aflutter', 'svt', 'vt', 'paced', 'other')),
    rhythm_regularity TEXT CHECK (rhythm_regularity IN ('regular', 'irregular', 'regularly_irregular', 'irregularly_irregular')),

    p_wave_findings TEXT,
    qrs_findings TEXT,
    st_segment_findings TEXT,
    t_wave_findings TEXT,

    has_abnormalities INTEGER DEFAULT 0,
    abnormalities TEXT,

    interpretation TEXT,
    clinical_correlation TEXT,
    comparison TEXT,

    ai_analysis TEXT,
    ai_confidence REAL,

    ecg_image_url TEXT,
    ecg_pdf_url TEXT,
    raw_data_url TEXT,

    performed_by TEXT REFERENCES employees(id) ON DELETE SET NULL,
    interpreted_by TEXT REFERENCES employees(id) ON DELETE SET NULL,
    interpreted_at INTEGER,

    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'interpreted', 'reviewed', 'verified')),
    urgency TEXT DEFAULT 'routine' CHECK (urgency IN ('routine', 'urgent', 'stat')),

    notes TEXT,
    created_by TEXT NOT NULL REFERENCES users(id),
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Cardiology Echocardiograms
CREATE TABLE IF NOT EXISTS cardiology_echocardiograms (
    id TEXT PRIMARY KEY,
    company_id TEXT NOT NULL,
    patient_id TEXT NOT NULL REFERENCES healthcare_patients(id) ON DELETE CASCADE,
    examination_id TEXT REFERENCES healthcare_examinations(id) ON DELETE SET NULL,
    consultation_id TEXT REFERENCES healthcare_consultations(id) ON DELETE SET NULL,

    echo_number TEXT NOT NULL,
    study_date INTEGER NOT NULL,

    echo_type TEXT NOT NULL CHECK (echo_type IN ('tte', 'tee', 'stress', 'contrast', 'strain')),
    indication TEXT,

    -- Left Ventricle
    lv_ef REAL,
    lv_ef_method TEXT CHECK (lv_ef_method IN ('visual', 'biplane', 'simpson', '3d')),
    lvedd REAL,
    lvesd REAL,
    lv_mass REAL,
    lv_mass_index REAL,
    lv_wall_motion TEXT,
    gls REAL,

    -- Left Atrium
    la_volume REAL,
    la_volume_index REAL,
    la_dimension REAL,

    -- Right Ventricle
    rv_function TEXT CHECK (rv_function IN ('normal', 'mildly_reduced', 'moderately_reduced', 'severely_reduced')),
    tapse REAL,
    rvsp REAL,
    rv_basal_diameter REAL,

    -- Right Atrium
    ra_area REAL,
    ra_pressure REAL,

    -- Valves
    mitral_regurgitation TEXT CHECK (mitral_regurgitation IN ('none', 'trivial', 'mild', 'moderate', 'severe')),
    mitral_stenosis TEXT CHECK (mitral_stenosis IN ('none', 'mild', 'moderate', 'severe')),
    aortic_regurgitation TEXT CHECK (aortic_regurgitation IN ('none', 'trivial', 'mild', 'moderate', 'severe')),
    aortic_stenosis TEXT CHECK (aortic_stenosis IN ('none', 'mild', 'moderate', 'severe')),
    tricuspid_regurgitation TEXT CHECK (tricuspid_regurgitation IN ('none', 'trivial', 'mild', 'moderate', 'severe')),
    pulmonic_regurgitation TEXT CHECK (pulmonic_regurgitation IN ('none', 'trivial', 'mild', 'moderate', 'severe')),

    -- Aorta
    aortic_root_diameter REAL,
    ascending_aorta_diameter REAL,

    -- Pericardium
    pericardial_effusion TEXT CHECK (pericardial_effusion IN ('none', 'trivial', 'small', 'moderate', 'large')),

    -- Diastolic Function
    diastolic_function TEXT CHECK (diastolic_function IN ('normal', 'grade_1', 'grade_2', 'grade_3', 'indeterminate')),

    all_measurements TEXT,
    findings TEXT,
    abnormal_findings TEXT,
    has_abnormal_findings INTEGER DEFAULT 0,

    interpretation TEXT,
    conclusion TEXT,
    recommendations TEXT,
    comparison TEXT,

    ai_analysis TEXT,
    ai_confidence REAL,

    image_urls TEXT,
    video_urls TEXT,
    report_url TEXT,

    sonographer TEXT REFERENCES employees(id) ON DELETE SET NULL,
    interpreted_by TEXT REFERENCES employees(id) ON DELETE SET NULL,
    interpreted_at INTEGER,

    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'preliminary', 'final', 'amended')),
    urgency TEXT DEFAULT 'routine' CHECK (urgency IN ('routine', 'urgent', 'stat')),

    notes TEXT,
    created_by TEXT NOT NULL REFERENCES users(id),
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Cardiology Holter Records
CREATE TABLE IF NOT EXISTS cardiology_holter_records (
    id TEXT PRIMARY KEY,
    company_id TEXT NOT NULL,
    patient_id TEXT NOT NULL REFERENCES healthcare_patients(id) ON DELETE CASCADE,
    examination_id TEXT REFERENCES healthcare_examinations(id) ON DELETE SET NULL,

    holter_number TEXT NOT NULL,
    indication TEXT,

    start_date INTEGER NOT NULL,
    end_date INTEGER,
    duration_hours REAL,
    analyzed_duration_hours REAL,

    monitor_type TEXT CHECK (monitor_type IN ('standard', 'extended', 'event_recorder', 'loop_recorder')),
    device_model TEXT,

    min_heart_rate INTEGER,
    max_heart_rate INTEGER,
    avg_heart_rate INTEGER,

    total_qrs_complexes INTEGER,
    sve_premature_beats INTEGER,
    pve_premature_beats INTEGER,

    afib_episodes INTEGER,
    afib_burden REAL,
    vt_episodes INTEGER,

    pauses_over_2s INTEGER,
    pauses_over_3s INTEGER,
    longest_pause REAL,

    significant_findings TEXT,
    has_significant_findings INTEGER DEFAULT 0,

    interpretation TEXT,
    conclusion TEXT,
    recommendations TEXT,

    report_url TEXT,

    analyzed_by TEXT REFERENCES employees(id) ON DELETE SET NULL,
    interpreted_by TEXT REFERENCES employees(id) ON DELETE SET NULL,
    interpreted_at INTEGER,

    status TEXT DEFAULT 'recording' CHECK (status IN ('recording', 'analyzing', 'pending_interpretation', 'final')),
    urgency TEXT DEFAULT 'routine' CHECK (urgency IN ('routine', 'urgent', 'stat')),

    notes TEXT,
    created_by TEXT NOT NULL REFERENCES users(id),
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Cardiology Risk Scores
CREATE TABLE IF NOT EXISTS cardiology_risk_scores (
    id TEXT PRIMARY KEY,
    company_id TEXT NOT NULL,
    patient_id TEXT NOT NULL REFERENCES healthcare_patients(id) ON DELETE CASCADE,
    consultation_id TEXT REFERENCES healthcare_consultations(id) ON DELETE SET NULL,

    score_type TEXT NOT NULL CHECK (score_type IN ('score2', 'score2_op', 'cha2ds2_vasc', 'has_bled', 'heart', 'timi', 'grace', 'crusade', 'framingham', 'euroscore2', 'syntax')),
    calculation_date INTEGER NOT NULL,

    input_parameters TEXT NOT NULL,
    score_value REAL NOT NULL,
    risk_category TEXT CHECK (risk_category IN ('very_low', 'low', 'moderate', 'high', 'very_high')),
    risk_percentage REAL,

    interpretation TEXT,
    recommendations TEXT,

    previous_score_id TEXT,
    score_change REAL,

    ai_recommendation TEXT,

    calculated_by TEXT REFERENCES users(id) ON DELETE SET NULL,
    reviewed_by TEXT REFERENCES employees(id) ON DELETE SET NULL,
    reviewed_at INTEGER,

    notes TEXT,
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Cardiology Cardiac Events
CREATE TABLE IF NOT EXISTS cardiology_cardiac_events (
    id TEXT PRIMARY KEY,
    company_id TEXT NOT NULL,
    patient_id TEXT NOT NULL REFERENCES healthcare_patients(id) ON DELETE CASCADE,

    event_number TEXT NOT NULL,
    event_date INTEGER NOT NULL,

    event_type TEXT NOT NULL CHECK (event_type IN ('mi', 'stemi', 'nstemi', 'unstable_angina', 'heart_failure', 'stroke', 'tia', 'cardiac_arrest', 'arrhythmia', 'syncope', 'bleeding', 'stent_thrombosis', 'restenosis', 'hospitalization', 'other')),
    severity TEXT NOT NULL CHECK (severity IN ('mild', 'moderate', 'severe', 'fatal')),

    symptoms TEXT,
    vital_signs TEXT,
    troponin_peak REAL,
    other_biomarkers TEXT,

    management TEXT,
    interventions TEXT,
    hospitalized INTEGER DEFAULT 0,
    hospital_admission_date INTEGER,
    hospital_discharge_date INTEGER,
    icu_stay INTEGER DEFAULT 0,

    outcome TEXT CHECK (outcome IN ('recovered', 'ongoing', 'chronic_sequelae', 'fatal')),
    sequelae TEXT,

    related_stent_id TEXT REFERENCES cardiology_stents(id) ON DELETE SET NULL,
    related_pacemaker_id TEXT REFERENCES cardiology_pacemakers(id) ON DELETE SET NULL,

    document_urls TEXT,

    reported_by TEXT REFERENCES users(id) ON DELETE SET NULL,
    verified_by TEXT REFERENCES employees(id) ON DELETE SET NULL,
    verified_at INTEGER,

    notes TEXT,
    created_by TEXT NOT NULL REFERENCES users(id),
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Cardiology Medications
CREATE TABLE IF NOT EXISTS cardiology_medications (
    id TEXT PRIMARY KEY,
    company_id TEXT NOT NULL,
    patient_id TEXT NOT NULL REFERENCES healthcare_patients(id) ON DELETE CASCADE,
    consultation_id TEXT REFERENCES healthcare_consultations(id) ON DELETE SET NULL,

    medication_name TEXT NOT NULL,
    generic_name TEXT,
    medication_class TEXT CHECK (medication_class IN ('antiplatelet', 'anticoagulant', 'statin', 'beta_blocker', 'ace_inhibitor', 'arb', 'arni', 'calcium_channel_blocker', 'diuretic', 'mra', 'antiarrhythmic', 'nitrate', 'sglt2i', 'other')),

    dose TEXT NOT NULL,
    dose_unit TEXT,
    frequency TEXT NOT NULL,
    route TEXT DEFAULT 'oral' CHECK (route IN ('oral', 'iv', 'sc', 'im', 'topical', 'sublingual')),

    start_date INTEGER NOT NULL,
    end_date INTEGER,
    is_ongoing INTEGER DEFAULT 1,

    indication TEXT,
    target_parameter TEXT,

    prescribed_by TEXT REFERENCES employees(id) ON DELETE SET NULL,

    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'discontinued', 'on_hold', 'completed')),
    discontinuation_reason TEXT,
    discontinued_at INTEGER,
    discontinued_by TEXT REFERENCES users(id) ON DELETE SET NULL,

    requires_monitoring INTEGER DEFAULT 0,
    monitoring_parameters TEXT,
    side_effects TEXT,

    notes TEXT,
    created_by TEXT NOT NULL REFERENCES users(id),
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Cardiology Pacemakers (extends existing cardiology_pacemakers)
CREATE TABLE IF NOT EXISTS cardiology_pacemakers (
    id TEXT PRIMARY KEY,
    company_id TEXT NOT NULL,
    patient_id TEXT NOT NULL REFERENCES healthcare_patients(id) ON DELETE CASCADE,

    device_number TEXT NOT NULL,
    device_type TEXT NOT NULL CHECK (device_type IN ('single_chamber_pacemaker', 'dual_chamber_pacemaker', 'crt_p', 'single_chamber_icd', 'dual_chamber_icd', 'crt_d', 'leadless')),
    indication TEXT NOT NULL,

    manufacturer TEXT NOT NULL,
    model TEXT NOT NULL,
    serial_number TEXT NOT NULL,

    implant_date INTEGER NOT NULL,
    implanted_by TEXT REFERENCES employees(id) ON DELETE SET NULL,
    implant_center TEXT,
    implant_procedure TEXT,

    leads TEXT,
    mode TEXT,
    lower_rate INTEGER,
    upper_rate INTEGER,
    av_delay INTEGER,
    output_settings TEXT,

    battery_status TEXT DEFAULT 'ok' CHECK (battery_status IN ('ok', 'elective_replacement', 'end_of_life')),
    battery_voltage REAL,
    battery_impedance INTEGER,
    estimated_longevity TEXT,

    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'replaced', 'explanted', 'end_of_life')),
    status_date INTEGER,
    status_reason TEXT,

    replaced_by_id TEXT,
    replacement_date INTEGER,
    replacement_reason TEXT,

    last_interrogation_date INTEGER,
    next_interrogation_date INTEGER,
    remote_monitoring_enabled INTEGER DEFAULT 0,
    remote_monitoring_platform TEXT,

    mri_conditional INTEGER DEFAULT 0,
    mri_conditions TEXT,

    notes TEXT,
    created_by TEXT NOT NULL REFERENCES users(id),
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Cardiology Pacemaker Interrogations
CREATE TABLE IF NOT EXISTS cardiology_pacemaker_interrogations (
    id TEXT PRIMARY KEY,
    company_id TEXT NOT NULL,
    pacemaker_id TEXT NOT NULL REFERENCES cardiology_pacemakers(id) ON DELETE CASCADE,

    interrogation_number TEXT NOT NULL,
    interrogation_date INTEGER NOT NULL,
    interrogation_type TEXT NOT NULL CHECK (interrogation_type IN ('in_person', 'remote', 'emergency')),

    battery_voltage REAL,
    battery_impedance INTEGER,
    battery_status TEXT CHECK (battery_status IN ('ok', 'elective_replacement', 'end_of_life')),

    ra_threshold REAL,
    ra_impedance INTEGER,
    ra_sensing REAL,
    rv_threshold REAL,
    rv_impedance INTEGER,
    rv_sensing REAL,
    lv_threshold REAL,
    lv_impedance INTEGER,
    lv_sensing REAL,

    at_pacing_percent REAL,
    vp_pacing_percent REAL,
    bv_pacing_percent REAL,

    at_af_episodes INTEGER,
    at_af_burden REAL,
    vt_episodes INTEGER,
    vf_episodes INTEGER,
    atp_delivered INTEGER,
    shocks_delivered INTEGER,

    significant_events TEXT,
    programming_changes TEXT,
    programming_changes_reason TEXT,

    findings TEXT,
    has_alerts INTEGER DEFAULT 0,
    alerts TEXT,

    performed_by TEXT REFERENCES employees(id) ON DELETE SET NULL,
    reviewed_by TEXT REFERENCES employees(id) ON DELETE SET NULL,

    report_url TEXT,
    printout_urls TEXT,

    notes TEXT,
    created_by TEXT NOT NULL REFERENCES users(id),
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Cardiology Stents
CREATE TABLE IF NOT EXISTS cardiology_stents (
    id TEXT PRIMARY KEY,
    company_id TEXT NOT NULL,
    patient_id TEXT NOT NULL REFERENCES healthcare_patients(id) ON DELETE CASCADE,

    stent_number TEXT NOT NULL,
    procedure_date INTEGER NOT NULL,
    procedure_type TEXT NOT NULL CHECK (procedure_type IN ('primary_pci', 'elective_pci', 'rescue_pci', 'staged_pci')),
    indication TEXT NOT NULL,
    clinical_presentation TEXT CHECK (clinical_presentation IN ('stemi', 'nstemi', 'unstable_angina', 'stable_angina', 'silent_ischemia')),

    vessel_name TEXT NOT NULL,
    vessel_segment TEXT,
    lesion_type TEXT CHECK (lesion_type IN ('a', 'b1', 'b2', 'c')),
    prestenosis_pct INTEGER,
    lesion_length REAL,
    reference_vessel_diameter REAL,
    is_bifurcation INTEGER DEFAULT 0,
    is_cto INTEGER DEFAULT 0,

    stent_type TEXT NOT NULL CHECK (stent_type IN ('des', 'bms', 'bioresorbable', 'drug_coated_balloon')),
    stent_manufacturer TEXT,
    stent_model TEXT,
    stent_diameter REAL,
    stent_length REAL,
    deployment_pressure INTEGER,
    post_dilation_pressure INTEGER,

    number_of_stents INTEGER DEFAULT 1,
    additional_stents TEXT,

    poststenosis_pct INTEGER,
    timi_flow INTEGER,
    procedure_success INTEGER DEFAULT 1,
    complications TEXT,

    operator TEXT REFERENCES employees(id) ON DELETE SET NULL,
    cath_lab TEXT,

    access_site TEXT CHECK (access_site IN ('radial', 'femoral', 'brachial')),
    access_side TEXT CHECK (access_side IN ('left', 'right')),

    antiplatelet_regimen TEXT,
    dapt_duration INTEGER,

    follow_up_angiogram_date INTEGER,
    in_stent_restenosis INTEGER,
    stent_thrombosis INTEGER,

    angiogram_urls TEXT,
    report_url TEXT,

    notes TEXT,
    created_by TEXT NOT NULL REFERENCES users(id),
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- ============================================================================
-- OPHTHALMOLOGY TABLES
-- ============================================================================

-- Ophthalmology OCT Scans
CREATE TABLE IF NOT EXISTS ophthalmology_oct_scans (
    id TEXT PRIMARY KEY,
    company_id TEXT NOT NULL,
    patient_id TEXT NOT NULL REFERENCES healthcare_patients(id) ON DELETE CASCADE,
    examination_id TEXT REFERENCES healthcare_examinations(id) ON DELETE SET NULL,
    consultation_id TEXT REFERENCES healthcare_consultations(id) ON DELETE SET NULL,

    oct_number TEXT NOT NULL,
    scan_date INTEGER NOT NULL,

    eye TEXT NOT NULL CHECK (eye IN ('od', 'os', 'ou')),
    oct_type TEXT NOT NULL CHECK (oct_type IN ('macula', 'optic_nerve', 'anterior_segment', 'angiography', 'wide_field')),
    scan_pattern TEXT,

    device_manufacturer TEXT,
    device_model TEXT,
    signal_strength INTEGER,

    central_macular_thickness REAL,
    avg_macular_thickness REAL,
    macula_volume REAL,
    etdrs_map TEXT,

    rnfl_average REAL,
    rnfl_superior REAL,
    rnfl_inferior REAL,
    rnfl_nasal REAL,
    rnfl_temporal REAL,
    cup_disc_ratio REAL,

    all_measurements TEXT,
    findings TEXT,
    abnormal_findings TEXT,
    has_abnormal_findings INTEGER DEFAULT 0,

    interpretation TEXT,
    conclusion TEXT,
    recommendations TEXT,
    comparison TEXT,

    progression_status TEXT CHECK (progression_status IN ('stable', 'improving', 'worsening', 'new_finding')),

    ai_analysis TEXT,
    ai_confidence REAL,
    ai_detected_pathologies TEXT,

    image_urls TEXT,
    report_url TEXT,
    raw_data_url TEXT,

    performed_by TEXT REFERENCES employees(id) ON DELETE SET NULL,
    interpreted_by TEXT REFERENCES employees(id) ON DELETE SET NULL,
    interpreted_at INTEGER,

    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'interpreted', 'reviewed', 'verified')),
    urgency TEXT DEFAULT 'routine' CHECK (urgency IN ('routine', 'urgent', 'stat')),

    notes TEXT,
    created_by TEXT NOT NULL REFERENCES users(id),
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Ophthalmology Visual Fields
CREATE TABLE IF NOT EXISTS ophthalmology_visual_fields (
    id TEXT PRIMARY KEY,
    company_id TEXT NOT NULL,
    patient_id TEXT NOT NULL REFERENCES healthcare_patients(id) ON DELETE CASCADE,
    examination_id TEXT REFERENCES healthcare_examinations(id) ON DELETE SET NULL,
    consultation_id TEXT REFERENCES healthcare_consultations(id) ON DELETE SET NULL,

    vf_number TEXT NOT NULL,
    test_date INTEGER NOT NULL,

    eye TEXT NOT NULL CHECK (eye IN ('od', 'os')),
    test_type TEXT NOT NULL CHECK (test_type IN ('sita_standard', 'sita_fast', 'sita_faster', 'full_threshold', 'screening', 'kinetic')),
    test_pattern TEXT,

    device_manufacturer TEXT,
    device_model TEXT,

    fixation_losses REAL,
    false_positives REAL,
    false_negatives REAL,
    test_duration INTEGER,
    is_reliable INTEGER,

    mean_deviation REAL,
    md_probability REAL,
    pattern_standard_deviation REAL,
    psd_probability REAL,
    visual_field_index REAL,
    ght_result TEXT CHECK (ght_result IN ('within_normal', 'borderline', 'outside_normal', 'generalized_reduction', 'abnormally_high')),

    sensitivity_values TEXT,
    total_deviation_values TEXT,
    pattern_deviation_values TEXT,

    defect_type TEXT,
    defect_location TEXT,
    defect_severity TEXT CHECK (defect_severity IN ('none', 'mild', 'moderate', 'severe')),

    glaucoma_staging_system TEXT,
    glaucoma_stage TEXT,

    progression_status TEXT CHECK (progression_status IN ('stable', 'possible_progression', 'likely_progression', 'improving')),
    progression_rate REAL,

    findings TEXT,
    has_abnormal_findings INTEGER DEFAULT 0,

    interpretation TEXT,
    conclusion TEXT,
    recommendations TEXT,
    comparison TEXT,

    ai_analysis TEXT,
    ai_confidence REAL,

    image_urls TEXT,
    report_url TEXT,

    performed_by TEXT REFERENCES employees(id) ON DELETE SET NULL,
    interpreted_by TEXT REFERENCES employees(id) ON DELETE SET NULL,
    interpreted_at INTEGER,

    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'interpreted', 'reviewed', 'verified')),
    urgency TEXT DEFAULT 'routine' CHECK (urgency IN ('routine', 'urgent', 'stat')),

    notes TEXT,
    created_by TEXT NOT NULL REFERENCES users(id),
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Ophthalmology Surgeries
CREATE TABLE IF NOT EXISTS ophthalmology_surgeries (
    id TEXT PRIMARY KEY,
    company_id TEXT NOT NULL,
    patient_id TEXT NOT NULL REFERENCES healthcare_patients(id) ON DELETE CASCADE,

    surgery_number TEXT NOT NULL,
    surgery_date INTEGER NOT NULL,

    eye TEXT NOT NULL CHECK (eye IN ('od', 'os', 'ou')),
    surgery_type TEXT NOT NULL CHECK (surgery_type IN ('phaco', 'ecce', 'icce', 'iol_exchange', 'vitrectomy', 'retinal_detachment', 'glaucoma_trab', 'glaucoma_tube', 'migs', 'corneal_transplant', 'pterygium', 'strabismus', 'oculoplastics', 'laser_refractive', 'prk', 'lasik', 'smile', 'other')),
    surgery_subtype TEXT,
    indication TEXT,
    diagnosis TEXT,

    surgeon TEXT REFERENCES employees(id) ON DELETE SET NULL,
    assistant_surgeon TEXT REFERENCES employees(id) ON DELETE SET NULL,
    anesthesiologist TEXT REFERENCES employees(id) ON DELETE SET NULL,
    scrub_nurse TEXT REFERENCES employees(id) ON DELETE SET NULL,

    anesthesia_type TEXT CHECK (anesthesia_type IN ('topical', 'local', 'peribulbar', 'retrobulbar', 'general')),
    anesthesia_drugs TEXT,

    scheduled_start_time INTEGER,
    actual_start_time INTEGER,
    actual_end_time INTEGER,
    duration_minutes INTEGER,

    pre_op_va TEXT,
    pre_op_iop INTEGER,
    pre_op_exam TEXT,
    pre_op_medications TEXT,

    procedure_details TEXT,
    techniques_used TEXT,
    implanted_devices TEXT,
    consumables_used TEXT,

    intra_op_findings TEXT,
    intra_op_complications TEXT,
    has_complications INTEGER DEFAULT 0,

    surgery_outcome TEXT CHECK (surgery_outcome IN ('successful', 'complicated', 'converted', 'aborted')),
    immediate_va TEXT,
    immediate_iop INTEGER,

    post_op_medications TEXT,
    post_op_instructions TEXT,
    first_follow_up_date INTEGER,

    final_va TEXT,
    final_iop INTEGER,
    final_outcome TEXT CHECK (final_outcome IN ('excellent', 'good', 'fair', 'poor')),
    late_complications TEXT,

    billing_codes TEXT,

    operative_report_url TEXT,
    video_urls TEXT,
    image_urls TEXT,
    consent_form_url TEXT,

    notes TEXT,
    created_by TEXT NOT NULL REFERENCES users(id),
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Ophthalmology Fundus Photos
CREATE TABLE IF NOT EXISTS ophthalmology_fundus_photos (
    id TEXT PRIMARY KEY,
    company_id TEXT NOT NULL,
    patient_id TEXT NOT NULL REFERENCES healthcare_patients(id) ON DELETE CASCADE,
    consultation_id TEXT REFERENCES healthcare_consultations(id) ON DELETE SET NULL,

    photo_number TEXT NOT NULL,
    capture_date INTEGER NOT NULL,

    eye TEXT NOT NULL CHECK (eye IN ('od', 'os')),
    photo_type TEXT NOT NULL CHECK (photo_type IN ('color', 'red_free', 'autofluorescence', 'icg', 'fluorescein', 'wide_field', 'montage')),
    field_of_view TEXT,

    device_manufacturer TEXT,
    device_model TEXT,

    dilated INTEGER DEFAULT 1,
    dilating_agent TEXT,

    image_quality TEXT CHECK (image_quality IN ('excellent', 'good', 'fair', 'poor')),
    quality_issues TEXT,

    findings TEXT,
    abnormal_findings TEXT,
    has_abnormal_findings INTEGER DEFAULT 0,

    optic_disc_appearance TEXT,
    cup_disc_ratio REAL,
    macula_appearance TEXT,
    vessel_appearance TEXT,
    periphery_appearance TEXT,

    hemorrhages INTEGER,
    exudates INTEGER,
    cotton_wool_spots INTEGER,
    neovascularization INTEGER,
    drusen INTEGER,
    pigment_changes INTEGER,
    retinal_detachment INTEGER,

    ai_analysis TEXT,
    ai_detected_pathologies TEXT,
    ai_confidence REAL,

    image_url TEXT NOT NULL,
    thumbnail_url TEXT,
    annotated_image_url TEXT,

    performed_by TEXT REFERENCES employees(id) ON DELETE SET NULL,
    graded_by TEXT REFERENCES employees(id) ON DELETE SET NULL,
    graded_at INTEGER,

    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'graded', 'reviewed')),

    notes TEXT,
    created_by TEXT NOT NULL REFERENCES users(id),
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Ophthalmology OSDI Scores
CREATE TABLE IF NOT EXISTS ophthalmology_osdi_scores (
    id TEXT PRIMARY KEY,
    company_id TEXT NOT NULL,
    patient_id TEXT NOT NULL REFERENCES healthcare_patients(id) ON DELETE CASCADE,
    consultation_id TEXT REFERENCES healthcare_consultations(id) ON DELETE SET NULL,

    assessment_date INTEGER NOT NULL,

    q1_light_sensitivity INTEGER,
    q2_gritty_feeling INTEGER,
    q3_painful_eyes INTEGER,
    q4_blurred_vision INTEGER,
    q5_poor_vision INTEGER,
    q6_reading INTEGER,
    q7_driving INTEGER,
    q8_computer INTEGER,
    q9_television INTEGER,
    q10_windy_conditions INTEGER,
    q11_low_humidity INTEGER,
    q12_air_conditioning INTEGER,

    total_score REAL NOT NULL,
    symptom_subscore REAL,
    vision_subscore REAL,
    trigger_subscore REAL,

    severity TEXT NOT NULL CHECK (severity IN ('normal', 'mild', 'moderate', 'severe')),

    previous_score_id TEXT,
    score_change REAL,

    raw_responses TEXT,

    administered_by TEXT REFERENCES users(id) ON DELETE SET NULL,

    notes TEXT,
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Healthcare shared indexes
CREATE INDEX IF NOT EXISTS idx_healthcare_examinations_patient ON healthcare_examinations(patient_id);
CREATE INDEX IF NOT EXISTS idx_healthcare_examinations_module ON healthcare_examinations(module);
CREATE INDEX IF NOT EXISTS idx_healthcare_implanted_devices_patient ON healthcare_implanted_devices(patient_id);
CREATE INDEX IF NOT EXISTS idx_healthcare_appointments_patient ON healthcare_appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_healthcare_appointments_date ON healthcare_appointments(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_healthcare_documents_patient ON healthcare_documents(patient_id);
CREATE INDEX IF NOT EXISTS idx_healthcare_chronic_conditions_patient ON healthcare_chronic_conditions(patient_id);

-- Cardiology indexes
CREATE INDEX IF NOT EXISTS idx_cardiology_ecg_records_patient ON cardiology_ecg_records(patient_id);
CREATE INDEX IF NOT EXISTS idx_cardiology_echocardiograms_patient ON cardiology_echocardiograms(patient_id);
CREATE INDEX IF NOT EXISTS idx_cardiology_holter_records_patient ON cardiology_holter_records(patient_id);
CREATE INDEX IF NOT EXISTS idx_cardiology_risk_scores_patient ON cardiology_risk_scores(patient_id);
CREATE INDEX IF NOT EXISTS idx_cardiology_cardiac_events_patient ON cardiology_cardiac_events(patient_id);
CREATE INDEX IF NOT EXISTS idx_cardiology_medications_patient ON cardiology_medications(patient_id);
CREATE INDEX IF NOT EXISTS idx_cardiology_pacemakers_patient ON cardiology_pacemakers(patient_id);
CREATE INDEX IF NOT EXISTS idx_cardiology_pacemaker_interrogations_pacemaker ON cardiology_pacemaker_interrogations(pacemaker_id);
CREATE INDEX IF NOT EXISTS idx_cardiology_stents_patient ON cardiology_stents(patient_id);

-- Ophthalmology indexes
CREATE INDEX IF NOT EXISTS idx_ophthalmology_oct_scans_patient ON ophthalmology_oct_scans(patient_id);
CREATE INDEX IF NOT EXISTS idx_ophthalmology_visual_fields_patient ON ophthalmology_visual_fields(patient_id);
CREATE INDEX IF NOT EXISTS idx_ophthalmology_surgeries_patient ON ophthalmology_surgeries(patient_id);
CREATE INDEX IF NOT EXISTS idx_ophthalmology_fundus_photos_patient ON ophthalmology_fundus_photos(patient_id);
CREATE INDEX IF NOT EXISTS idx_ophthalmology_osdi_scores_patient ON ophthalmology_osdi_scores(patient_id);
