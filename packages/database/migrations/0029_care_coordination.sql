-- Care Coordination Module Migration
-- Supports comprehensive care management, team coordination, and transitions

-- Care Teams
CREATE TABLE IF NOT EXISTS care_teams (
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('primary_care', 'specialty', 'palliative', 'chronic_disease', 'transitional', 'oncology')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'on_hold')),
  lead_provider_id TEXT NOT NULL,
  conditions TEXT, -- JSON array
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
);

CREATE INDEX idx_care_teams_patient ON care_teams(patient_id);
CREATE INDEX idx_care_teams_status ON care_teams(status);
CREATE INDEX idx_care_teams_lead_provider ON care_teams(lead_provider_id);

-- Care Team Members
CREATE TABLE IF NOT EXISTS care_team_members (
  id TEXT PRIMARY KEY,
  team_id TEXT NOT NULL,
  provider_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('lead', 'primary', 'specialist', 'nurse', 'care_manager', 'social_worker', 'pharmacist', 'therapist')),
  specialty TEXT,
  responsibilities TEXT, -- JSON array
  contact_preference TEXT DEFAULT 'email' CHECK (contact_preference IN ('phone', 'email', 'secure_message', 'pager')),
  availability_hours TEXT,
  start_date TEXT NOT NULL,
  end_date TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  FOREIGN KEY (team_id) REFERENCES care_teams(id) ON DELETE CASCADE
);

CREATE INDEX idx_care_team_members_team ON care_team_members(team_id);
CREATE INDEX idx_care_team_members_provider ON care_team_members(provider_id);
CREATE INDEX idx_care_team_members_active ON care_team_members(is_active);

-- Care Plans
CREATE TABLE IF NOT EXISTS care_plans (
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL,
  team_id TEXT,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed', 'cancelled', 'on_hold')),
  category TEXT NOT NULL CHECK (category IN ('chronic_disease', 'post_acute', 'preventive', 'palliative', 'rehabilitation')),
  start_date TEXT NOT NULL,
  target_end_date TEXT,
  review_date TEXT NOT NULL,
  created_by TEXT NOT NULL,
  approved_by TEXT,
  approved_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  FOREIGN KEY (team_id) REFERENCES care_teams(id) ON DELETE SET NULL
);

CREATE INDEX idx_care_plans_patient ON care_plans(patient_id);
CREATE INDEX idx_care_plans_status ON care_plans(status);
CREATE INDEX idx_care_plans_category ON care_plans(category);
CREATE INDEX idx_care_plans_review_date ON care_plans(review_date);

-- Plan Conditions
CREATE TABLE IF NOT EXISTS plan_conditions (
  id TEXT PRIMARY KEY,
  plan_id TEXT NOT NULL,
  icd10_code TEXT NOT NULL,
  description TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('mild', 'moderate', 'severe')),
  is_primary INTEGER NOT NULL DEFAULT 0,
  onset_date TEXT,
  notes TEXT,
  FOREIGN KEY (plan_id) REFERENCES care_plans(id) ON DELETE CASCADE
);

CREATE INDEX idx_plan_conditions_plan ON plan_conditions(plan_id);
CREATE INDEX idx_plan_conditions_code ON plan_conditions(icd10_code);

-- Care Goals
CREATE TABLE IF NOT EXISTS care_goals (
  id TEXT PRIMARY KEY,
  plan_id TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('clinical', 'functional', 'behavioral', 'social', 'safety')),
  description TEXT NOT NULL,
  target_value TEXT,
  target_date TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'achieved', 'partially_achieved', 'not_achieved')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
  progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  barriers TEXT, -- JSON array
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (plan_id) REFERENCES care_plans(id) ON DELETE CASCADE
);

CREATE INDEX idx_care_goals_plan ON care_goals(plan_id);
CREATE INDEX idx_care_goals_status ON care_goals(status);
CREATE INDEX idx_care_goals_target_date ON care_goals(target_date);

-- Goal Milestones
CREATE TABLE IF NOT EXISTS goal_milestones (
  id TEXT PRIMARY KEY,
  goal_id TEXT NOT NULL,
  description TEXT NOT NULL,
  target_date TEXT NOT NULL,
  achieved_date TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'achieved', 'missed')),
  FOREIGN KEY (goal_id) REFERENCES care_goals(id) ON DELETE CASCADE
);

CREATE INDEX idx_goal_milestones_goal ON goal_milestones(goal_id);

-- Care Interventions
CREATE TABLE IF NOT EXISTS care_interventions (
  id TEXT PRIMARY KEY,
  plan_id TEXT NOT NULL,
  goal_id TEXT,
  type TEXT NOT NULL CHECK (type IN ('medication', 'education', 'monitoring', 'referral', 'counseling', 'therapy', 'social_support')),
  description TEXT NOT NULL,
  frequency TEXT NOT NULL,
  responsible_member_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'active', 'completed', 'discontinued')),
  start_date TEXT NOT NULL,
  end_date TEXT,
  outcomes TEXT, -- JSON array
  notes TEXT,
  FOREIGN KEY (plan_id) REFERENCES care_plans(id) ON DELETE CASCADE,
  FOREIGN KEY (goal_id) REFERENCES care_goals(id) ON DELETE SET NULL
);

CREATE INDEX idx_care_interventions_plan ON care_interventions(plan_id);
CREATE INDEX idx_care_interventions_status ON care_interventions(status);

-- Care Barriers
CREATE TABLE IF NOT EXISTS care_barriers (
  id TEXT PRIMARY KEY,
  plan_id TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('financial', 'transportation', 'language', 'health_literacy', 'social_support', 'housing', 'mental_health', 'substance_use')),
  description TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high')),
  mitigation_plan TEXT,
  status TEXT NOT NULL DEFAULT 'identified' CHECK (status IN ('identified', 'being_addressed', 'resolved')),
  identified_date TEXT NOT NULL DEFAULT (datetime('now')),
  resolved_date TEXT,
  FOREIGN KEY (plan_id) REFERENCES care_plans(id) ON DELETE CASCADE
);

CREATE INDEX idx_care_barriers_plan ON care_barriers(plan_id);
CREATE INDEX idx_care_barriers_status ON care_barriers(status);

-- Care Transitions
CREATE TABLE IF NOT EXISTS care_transitions (
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('admission', 'discharge', 'transfer', 'referral')),
  from_facility TEXT,
  to_facility TEXT,
  from_unit TEXT,
  to_unit TEXT,
  from_provider TEXT,
  to_provider TEXT,
  reason TEXT NOT NULL,
  scheduled_date TEXT NOT NULL,
  actual_date TEXT,
  status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'completed', 'cancelled')),
  transition_plan TEXT, -- JSON object
  follow_up_required INTEGER NOT NULL DEFAULT 0,
  follow_up_date TEXT,
  follow_up_completed INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
);

CREATE INDEX idx_care_transitions_patient ON care_transitions(patient_id);
CREATE INDEX idx_care_transitions_status ON care_transitions(status);
CREATE INDEX idx_care_transitions_scheduled ON care_transitions(scheduled_date);
CREATE INDEX idx_care_transitions_follow_up ON care_transitions(follow_up_required, follow_up_completed);

-- Care Coordination Tasks
CREATE TABLE IF NOT EXISTS care_coordination_tasks (
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL,
  plan_id TEXT,
  team_id TEXT,
  assigned_to TEXT NOT NULL,
  task_type TEXT NOT NULL CHECK (task_type IN ('follow_up_call', 'care_conference', 'referral', 'medication_review', 'assessment', 'education', 'documentation', 'authorization')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('urgent', 'high', 'medium', 'low')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled', 'deferred')),
  due_date TEXT NOT NULL,
  completed_date TEXT,
  completed_by TEXT,
  outcome TEXT,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  FOREIGN KEY (plan_id) REFERENCES care_plans(id) ON DELETE SET NULL,
  FOREIGN KEY (team_id) REFERENCES care_teams(id) ON DELETE SET NULL
);

CREATE INDEX idx_care_tasks_patient ON care_coordination_tasks(patient_id);
CREATE INDEX idx_care_tasks_assigned ON care_coordination_tasks(assigned_to);
CREATE INDEX idx_care_tasks_status ON care_coordination_tasks(status);
CREATE INDEX idx_care_tasks_due_date ON care_coordination_tasks(due_date);
CREATE INDEX idx_care_tasks_priority ON care_coordination_tasks(priority);

-- Patient Outreach
CREATE TABLE IF NOT EXISTS patient_outreach (
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('phone', 'video', 'in_person', 'home_visit', 'secure_message')),
  purpose TEXT NOT NULL CHECK (purpose IN ('wellness_check', 'care_gap', 'follow_up', 'medication_adherence', 'appointment_reminder', 'test_results')),
  scheduled_date TEXT NOT NULL,
  attempted_date TEXT,
  outcome TEXT NOT NULL DEFAULT 'scheduled' CHECK (outcome IN ('scheduled', 'completed', 'no_answer', 'left_message', 'refused', 'rescheduled')),
  duration INTEGER, -- minutes
  notes TEXT,
  next_action TEXT,
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
);

CREATE INDEX idx_patient_outreach_patient ON patient_outreach(patient_id);
CREATE INDEX idx_patient_outreach_scheduled ON patient_outreach(scheduled_date);
CREATE INDEX idx_patient_outreach_outcome ON patient_outreach(outcome);

-- Care Gap Alerts
CREATE TABLE IF NOT EXISTS care_gap_alerts (
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('preventive', 'chronic_disease', 'medication', 'follow_up', 'screening')),
  measure TEXT NOT NULL,
  description TEXT NOT NULL,
  due_date TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'addressed', 'closed', 'excluded')),
  addressed_date TEXT,
  addressed_by TEXT,
  exclusion_reason TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
);

CREATE INDEX idx_care_gaps_patient ON care_gap_alerts(patient_id);
CREATE INDEX idx_care_gaps_status ON care_gap_alerts(status);
CREATE INDEX idx_care_gaps_due_date ON care_gap_alerts(due_date);
CREATE INDEX idx_care_gaps_category ON care_gap_alerts(category);

-- Risk Stratifications
CREATE TABLE IF NOT EXISTS risk_stratifications (
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL,
  assessment_date TEXT NOT NULL DEFAULT (datetime('now')),
  risk_score INTEGER NOT NULL CHECK (risk_score >= 0 AND risk_score <= 100),
  risk_level TEXT NOT NULL CHECK (risk_level IN ('low', 'moderate', 'high', 'very_high')),
  model TEXT NOT NULL,
  factors TEXT, -- JSON array
  recommendations TEXT, -- JSON array
  next_assessment_date TEXT NOT NULL,
  assessed_by TEXT NOT NULL,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
);

CREATE INDEX idx_risk_strat_patient ON risk_stratifications(patient_id);
CREATE INDEX idx_risk_strat_level ON risk_stratifications(risk_level);
CREATE INDEX idx_risk_strat_score ON risk_stratifications(risk_score);
CREATE INDEX idx_risk_strat_date ON risk_stratifications(assessment_date);

-- Care Conferences
CREATE TABLE IF NOT EXISTS care_conferences (
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL,
  team_id TEXT NOT NULL,
  scheduled_date TEXT NOT NULL,
  duration INTEGER NOT NULL, -- minutes
  type TEXT NOT NULL CHECK (type IN ('initial', 'follow_up', 'discharge_planning', 'family', 'multidisciplinary')),
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
  attendees TEXT, -- JSON array
  agenda TEXT, -- JSON array
  summary TEXT,
  decisions TEXT, -- JSON array
  next_conference_date TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  FOREIGN KEY (team_id) REFERENCES care_teams(id) ON DELETE CASCADE
);

CREATE INDEX idx_care_conferences_patient ON care_conferences(patient_id);
CREATE INDEX idx_care_conferences_team ON care_conferences(team_id);
CREATE INDEX idx_care_conferences_scheduled ON care_conferences(scheduled_date);
CREATE INDEX idx_care_conferences_status ON care_conferences(status);

-- Chronic Disease Registry
CREATE TABLE IF NOT EXISTS chronic_disease_registry (
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL,
  condition TEXT NOT NULL,
  icd10_code TEXT NOT NULL,
  diagnosis_date TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('mild', 'moderate', 'severe')),
  control_status TEXT NOT NULL DEFAULT 'moderately_controlled' CHECK (control_status IN ('well_controlled', 'moderately_controlled', 'poorly_controlled')),
  last_assessment_date TEXT NOT NULL,
  key_metrics TEXT, -- JSON array
  care_gaps TEXT, -- JSON array
  enrolled INTEGER NOT NULL DEFAULT 1,
  program_id TEXT,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
);

CREATE INDEX idx_chronic_registry_patient ON chronic_disease_registry(patient_id);
CREATE INDEX idx_chronic_registry_condition ON chronic_disease_registry(condition);
CREATE INDEX idx_chronic_registry_status ON chronic_disease_registry(control_status);
CREATE INDEX idx_chronic_registry_enrolled ON chronic_disease_registry(enrolled);
