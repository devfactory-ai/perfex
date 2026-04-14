/**
 * Route Registry - Conditional module loading based on app variant
 *
 * This file uses compile-time feature flags (__FEATURE_*) defined in vite.config.ts
 * to enable proper tree-shaking. Disabled modules are completely excluded from the build.
 */

import { lazy, ComponentType } from 'react';

// Declare feature flags (set by Vite at build time)
declare const __FEATURE_BAKERY__: boolean;
declare const __FEATURE_DIALYSE__: boolean;
declare const __FEATURE_CARDIOLOGY__: boolean;
declare const __FEATURE_OPHTHALMOLOGY__: boolean;
declare const __FEATURE_CRM__: boolean;
declare const __FEATURE_FINANCE__: boolean;
declare const __FEATURE_HR__: boolean;
declare const __FEATURE_INVENTORY__: boolean;
declare const __FEATURE_PROJECTS__: boolean;
declare const __FEATURE_SALES__: boolean;
declare const __FEATURE_PROCUREMENT__: boolean;
declare const __FEATURE_MANUFACTURING__: boolean;
declare const __FEATURE_WORKFLOWS__: boolean;
declare const __FEATURE_AUDIT__: boolean;
declare const __FEATURE_AI__: boolean;
declare const __FEATURE_CLINICAL_AI__: boolean;
declare const __FEATURE_RPM__: boolean;
declare const __FEATURE_PATIENT_PORTAL__: boolean;

// Type for lazy loaded components
type LazyComponent = ComponentType<unknown>;

// Route configuration type
export interface RouteConfig {
  path: string;
  component: React.LazyExoticComponent<LazyComponent>;
}

// Get variant from environment
const VARIANT = import.meta.env.VITE_APP_VARIANT || 'perfex-full';

// ============================================
// COMMON ROUTES (always included)
// ============================================
export const commonRoutes: RouteConfig[] = [
  // Profile
  { path: 'profile', component: lazy(() => import('../pages/profile/ProfilePage').then(m => ({ default: m.ProfilePage }))) },

  // Help
  { path: 'help', component: lazy(() => import('../pages/help/HelpCenterPage').then(m => ({ default: m.HelpCenterPage }))) },
  { path: 'help/getting-started', component: lazy(() => import('../pages/help/GettingStartedPage').then(m => ({ default: m.GettingStartedPage }))) },
  { path: 'help/faq', component: lazy(() => import('../pages/help/FAQPage').then(m => ({ default: m.FAQPage }))) },
  { path: 'help/modules', component: lazy(() => import('../pages/help/ModuleGuidesPage').then(m => ({ default: m.ModuleGuidesPage }))) },
  { path: 'help/modules/:moduleId', component: lazy(() => import('../pages/help/ModuleGuidesPage').then(m => ({ default: m.ModuleGuidesPage }))) },

  // Settings
  { path: 'settings', component: lazy(() => import('../pages/settings/SettingsPage').then(m => ({ default: m.SettingsPage }))) },
  { path: 'settings/modules', component: lazy(() => import('../pages/settings/ModulesSettingsPage').then(m => ({ default: m.ModulesSettingsPage }))) },

  // Admin (Platform Management - requires admin/super_admin role, checked at page level)
  { path: 'admin', component: lazy(() => import('../pages/admin/AdminDashboardPage').then(m => ({ default: m.AdminDashboardPage }))) },
  { path: 'admin/organizations', component: lazy(() => import('../pages/admin/OrganizationsPage').then(m => ({ default: m.OrganizationsPage }))) },
  { path: 'admin/users', component: lazy(() => import('../pages/admin/UsersPage').then(m => ({ default: m.UsersPage }))) },
];

// ============================================
// FINANCE ROUTES
// ============================================
const financeRoutesDef: RouteConfig[] = __FEATURE_FINANCE__ ? [
  { path: 'finance/accounts', component: lazy(() => import('../pages/finance/AccountsPage').then(m => ({ default: m.AccountsPage }))) },
  { path: 'finance/accounts/new', component: lazy(() => import('../pages/finance/AccountFormPage').then(m => ({ default: m.AccountFormPage }))) },
  { path: 'finance/accounts/:id/edit', component: lazy(() => import('../pages/finance/AccountFormPage').then(m => ({ default: m.AccountFormPage }))) },
  { path: 'finance/invoices', component: lazy(() => import('../pages/finance/InvoicesPage').then(m => ({ default: m.InvoicesPage }))) },
  { path: 'finance/invoices/new', component: lazy(() => import('../pages/finance/NewInvoicePage').then(m => ({ default: m.NewInvoicePage }))) },
  { path: 'finance/invoices/:id', component: lazy(() => import('../pages/finance/InvoiceDetailPage').then(m => ({ default: m.InvoiceDetailPage }))) },
  { path: 'finance/payments', component: lazy(() => import('../pages/finance/PaymentsPage').then(m => ({ default: m.PaymentsPage }))) },
  { path: 'finance/payments/new', component: lazy(() => import('../pages/finance/PaymentFormPage').then(m => ({ default: m.PaymentFormPage }))) },
  { path: 'finance/reports', component: lazy(() => import('../pages/finance/ReportsPage').then(m => ({ default: m.ReportsPage }))) },
] : [];
export const financeRoutes = financeRoutesDef;

// ============================================
// INVENTORY ROUTES
// ============================================
const inventoryRoutesDef: RouteConfig[] = __FEATURE_INVENTORY__ ? [
  { path: 'inventory', component: lazy(() => import('../pages/inventory/InventoryPage').then(m => ({ default: m.InventoryPage }))) },
  { path: 'inventory/new', component: lazy(() => import('../pages/inventory/InventoryItemFormPage').then(m => ({ default: m.InventoryItemFormPage }))) },
  { path: 'inventory/:id/edit', component: lazy(() => import('../pages/inventory/InventoryItemFormPage').then(m => ({ default: m.InventoryItemFormPage }))) },
] : [];
export const inventoryRoutes = inventoryRoutesDef;

// ============================================
// HR ROUTES
// ============================================
const hrRoutesDef: RouteConfig[] = __FEATURE_HR__ ? [
  { path: 'hr/employees', component: lazy(() => import('../pages/hr/EmployeesPage').then(m => ({ default: m.EmployeesPage }))) },
  { path: 'hr/employees/new', component: lazy(() => import('../pages/hr/EmployeeFormPage').then(m => ({ default: m.EmployeeFormPage }))) },
  { path: 'hr/employees/:id/edit', component: lazy(() => import('../pages/hr/EmployeeFormPage').then(m => ({ default: m.EmployeeFormPage }))) },
  { path: 'payroll', component: lazy(() => import('../pages/payroll/PayrollPage').then(m => ({ default: m.PayrollPage }))) },
] : [];
export const hrRoutes = hrRoutesDef;

// ============================================
// CRM ROUTES
// ============================================
const crmRoutesDef: RouteConfig[] = __FEATURE_CRM__ ? [
  { path: 'crm/companies', component: lazy(() => import('../pages/crm/CompaniesPage').then(m => ({ default: m.CompaniesPage }))) },
  { path: 'crm/companies/new', component: lazy(() => import('../pages/crm/CompanyFormPage').then(m => ({ default: m.CompanyFormPage }))) },
  { path: 'crm/companies/:id/edit', component: lazy(() => import('../pages/crm/CompanyFormPage').then(m => ({ default: m.CompanyFormPage }))) },
  { path: 'crm/contacts', component: lazy(() => import('../pages/crm/ContactsPage').then(m => ({ default: m.ContactsPage }))) },
  { path: 'crm/contacts/new', component: lazy(() => import('../pages/crm/ContactFormPage').then(m => ({ default: m.ContactFormPage }))) },
  { path: 'crm/contacts/:id/edit', component: lazy(() => import('../pages/crm/ContactFormPage').then(m => ({ default: m.ContactFormPage }))) },
  { path: 'crm/pipeline', component: lazy(() => import('../pages/crm/PipelinePage').then(m => ({ default: m.PipelinePage }))) },
  { path: 'crm/pipeline/opportunities/new', component: lazy(() => import('../pages/crm/OpportunityFormPage').then(m => ({ default: m.OpportunityFormPage }))) },
  { path: 'crm/pipeline/opportunities/:id/edit', component: lazy(() => import('../pages/crm/OpportunityFormPage').then(m => ({ default: m.OpportunityFormPage }))) },
] : [];
export const crmRoutes = crmRoutesDef;

// ============================================
// BAKERY ROUTES
// ============================================
const bakeryRoutesDef: RouteConfig[] = __FEATURE_BAKERY__ ? [
  { path: 'bakery', component: lazy(() => import('../pages/bakery/BakeryDashboardPage').then(m => ({ default: m.BakeryDashboardPage }))) },
  { path: 'bakery/articles', component: lazy(() => import('../pages/bakery/BakeryArticlesPage').then(m => ({ default: m.BakeryArticlesPage }))) },
  { path: 'bakery/articles/new', component: lazy(() => import('../pages/bakery/BakeryArticleFormPage').then(m => ({ default: m.BakeryArticleFormPage }))) },
  { path: 'bakery/articles/:id/edit', component: lazy(() => import('../pages/bakery/BakeryArticleFormPage').then(m => ({ default: m.BakeryArticleFormPage }))) },
  { path: 'bakery/stock/movements', component: lazy(() => import('../pages/bakery/BakeryStockMovementsPage').then(m => ({ default: m.BakeryStockMovementsPage }))) },
  { path: 'bakery/stock/alerts', component: lazy(() => import('../pages/bakery/BakeryStockAlertsPage').then(m => ({ default: m.BakeryStockAlertsPage }))) },
  { path: 'bakery/inventories', component: lazy(() => import('../pages/bakery/BakeryInventoriesPage').then(m => ({ default: m.BakeryInventoriesPage }))) },
  { path: 'bakery/production', component: lazy(() => import('../pages/bakery/BakeryProductionPage').then(m => ({ default: m.BakeryProductionPage }))) },
  { path: 'bakery/proofing', component: lazy(() => import('../pages/bakery/BakeryProofingPage').then(m => ({ default: m.BakeryProofingPage }))) },
  { path: 'bakery/ovens', component: lazy(() => import('../pages/bakery/BakeryOvensPage').then(m => ({ default: m.BakeryOvensPage }))) },
  { path: 'bakery/quality', component: lazy(() => import('../pages/bakery/BakeryQualityPage').then(m => ({ default: m.BakeryQualityPage }))) },
  { path: 'bakery/maintenance', component: lazy(() => import('../pages/bakery/BakeryMaintenancePage').then(m => ({ default: m.BakeryMaintenancePage }))) },
  { path: 'bakery/sales', component: lazy(() => import('../pages/bakery/BakerySalesPage').then(m => ({ default: m.BakerySalesPage }))) },
  { path: 'bakery/reports', component: lazy(() => import('../pages/bakery/BakeryReportsPage').then(m => ({ default: m.BakeryReportsPage }))) },
  { path: 'help/workflow', component: lazy(() => import('../pages/help/BakeryWorkflowGuidePage').then(m => ({ default: m.BakeryWorkflowGuidePage }))) },
  // Recipes
  { path: 'recipes', component: lazy(() => import('../pages/recipes/RecipesPage').then(m => ({ default: m.RecipesPage }))) },
  { path: 'recipes/new', component: lazy(() => import('../pages/recipes/RecipeFormPage').then(m => ({ default: m.RecipeFormPage }))) },
  { path: 'recipes/:id', component: lazy(() => import('../pages/recipes/RecipeFormPage').then(m => ({ default: m.RecipeFormPage }))) },
  { path: 'recipes/:id/edit', component: lazy(() => import('../pages/recipes/RecipeFormPage').then(m => ({ default: m.RecipeFormPage }))) },
  // Traceability
  { path: 'traceability', component: lazy(() => import('../pages/traceability/TraceabilityPage').then(m => ({ default: m.TraceabilityPage }))) },
  // POS
  { path: 'pos', component: lazy(() => import('../pages/pos/POSPage').then(m => ({ default: m.POSPage }))) },
] : [];
export const bakeryRoutes = bakeryRoutesDef;

// ============================================
// HEALTHCARE - DIALYSE ROUTES
// ============================================
const dialyseRoutesDef: RouteConfig[] = __FEATURE_DIALYSE__ ? [
  { path: 'dialyse', component: lazy(() => import('../pages/dialyse/DialyseDashboardPage').then(m => ({ default: m.DialyseDashboardPage }))) },
  { path: 'dialyse/patients', component: lazy(() => import('../pages/dialyse/DialysePatientsPage').then(m => ({ default: m.DialysePatientsPage }))) },
  { path: 'dialyse/patients/new', component: lazy(() => import('../pages/dialyse/DialysePatientFormPage').then(m => ({ default: m.DialysePatientFormPage }))) },
  { path: 'dialyse/patients/:id', component: lazy(() => import('../pages/dialyse/DialysePatientDetailPage').then(m => ({ default: m.DialysePatientDetailPage }))) },
  { path: 'dialyse/patients/:id/edit', component: lazy(() => import('../pages/dialyse/DialysePatientFormPage').then(m => ({ default: m.DialysePatientFormPage }))) },
  { path: 'dialyse/planning', component: lazy(() => import('../pages/dialyse/DialysePlanningPage').then(m => ({ default: m.DialysePlanningPage }))) },
  { path: 'dialyse/machines', component: lazy(() => import('../pages/dialyse/DialyseMachinesPage').then(m => ({ default: m.DialyseMachinesPage }))) },
  { path: 'dialyse/machines/new', component: lazy(() => import('../pages/dialyse/DialyseMachineFormPage').then(m => ({ default: m.DialyseMachineFormPage }))) },
  { path: 'dialyse/machines/:id/edit', component: lazy(() => import('../pages/dialyse/DialyseMachineFormPage').then(m => ({ default: m.DialyseMachineFormPage }))) },
  { path: 'dialyse/alerts', component: lazy(() => import('../pages/dialyse/DialyseAlertsPage').then(m => ({ default: m.DialyseAlertsPage }))) },
  { path: 'dialyse/alerts/:id', component: lazy(() => import('../pages/dialyse/DialyseAlertDetailPage').then(m => ({ default: m.DialyseAlertDetailPage }))) },
  { path: 'dialyse/sessions/new', component: lazy(() => import('../pages/dialyse/DialyseSessionFormPage').then(m => ({ default: m.DialyseSessionFormPage }))) },
  { path: 'dialyse/sessions/:id', component: lazy(() => import('../pages/dialyse/DialyseSessionDetailPage').then(m => ({ default: m.DialyseSessionDetailPage }))) },
  { path: 'dialyse/prescriptions/new', component: lazy(() => import('../pages/dialyse/DialysePrescriptionFormPage').then(m => ({ default: m.DialysePrescriptionFormPage }))) },
  { path: 'dialyse/prescriptions/:id/edit', component: lazy(() => import('../pages/dialyse/DialysePrescriptionFormPage').then(m => ({ default: m.DialysePrescriptionFormPage }))) },
  { path: 'dialyse/lab-results/new', component: lazy(() => import('../pages/dialyse/DialyseLabResultFormPage').then(m => ({ default: m.DialyseLabResultFormPage }))) },
  { path: 'dialyse/lab-results/:id/edit', component: lazy(() => import('../pages/dialyse/DialyseLabResultFormPage').then(m => ({ default: m.DialyseLabResultFormPage }))) },
  { path: 'dialyse/vascular-accesses/new', component: lazy(() => import('../pages/dialyse/DialyseVascularAccessFormPage').then(m => ({ default: m.DialyseVascularAccessFormPage }))) },
  { path: 'dialyse/vascular-accesses/:id/edit', component: lazy(() => import('../pages/dialyse/DialyseVascularAccessFormPage').then(m => ({ default: m.DialyseVascularAccessFormPage }))) },
  { path: 'dialyse/slots', component: lazy(() => import('../pages/dialyse/DialyseSlotsPage').then(m => ({ default: m.DialyseSlotsPage }))) },
  { path: 'dialyse/reports', component: lazy(() => import('../pages/dialyse/DialyseReportsPage').then(m => ({ default: m.DialyseReportsPage }))) },
  { path: 'dialyse/consumables', component: lazy(() => import('../pages/dialyse/DialyseConsumablesPage').then(m => ({ default: m.DialyseConsumablesPage }))) },
  { path: 'dialyse/consumables/new', component: lazy(() => import('../pages/dialyse/DialyseConsumableFormPage').then(m => ({ default: m.DialyseConsumableFormPage }))) },
  { path: 'dialyse/consumables/:id/edit', component: lazy(() => import('../pages/dialyse/DialyseConsumableFormPage').then(m => ({ default: m.DialyseConsumableFormPage }))) },
  { path: 'dialyse/maintenance', component: lazy(() => import('../pages/dialyse/DialyseMaintenancePage').then(m => ({ default: m.DialyseMaintenancePage }))) },
  { path: 'dialyse/maintenance/new', component: lazy(() => import('../pages/dialyse/DialyseMaintenanceFormPage').then(m => ({ default: m.DialyseMaintenanceFormPage }))) },
  { path: 'dialyse/maintenance/:id/edit', component: lazy(() => import('../pages/dialyse/DialyseMaintenanceFormPage').then(m => ({ default: m.DialyseMaintenanceFormPage }))) },
  { path: 'dialyse/protocols', component: lazy(() => import('../pages/dialyse/DialyseProtocolsPage').then(m => ({ default: m.DialyseProtocolsPage }))) },
  { path: 'dialyse/protocols/new', component: lazy(() => import('../pages/dialyse/DialyseProtocolFormPage').then(m => ({ default: m.DialyseProtocolFormPage }))) },
  { path: 'dialyse/protocols/:id/edit', component: lazy(() => import('../pages/dialyse/DialyseProtocolFormPage').then(m => ({ default: m.DialyseProtocolFormPage }))) },
  { path: 'dialyse/staff', component: lazy(() => import('../pages/dialyse/DialyseStaffPage').then(m => ({ default: m.DialyseStaffPage }))) },
  { path: 'dialyse/staff/new', component: lazy(() => import('../pages/dialyse/DialyseStaffFormPage').then(m => ({ default: m.DialyseStaffFormPage }))) },
  { path: 'dialyse/staff/:id/edit', component: lazy(() => import('../pages/dialyse/DialyseStaffFormPage').then(m => ({ default: m.DialyseStaffFormPage }))) },
  { path: 'dialyse/billing', component: lazy(() => import('../pages/dialyse/DialyseBillingPage').then(m => ({ default: m.DialyseBillingPage }))) },
  { path: 'dialyse/billing/new', component: lazy(() => import('../pages/dialyse/DialyseBillingFormPage').then(m => ({ default: m.DialyseBillingFormPage }))) },
  { path: 'dialyse/billing/:id/edit', component: lazy(() => import('../pages/dialyse/DialyseBillingFormPage').then(m => ({ default: m.DialyseBillingFormPage }))) },
  { path: 'dialyse/transport', component: lazy(() => import('../pages/dialyse/DialyseTransportPage').then(m => ({ default: m.DialyseTransportPage }))) },
  { path: 'dialyse/transport/new', component: lazy(() => import('../pages/dialyse/DialyseTransportFormPage').then(m => ({ default: m.DialyseTransportFormPage }))) },
  { path: 'dialyse/transport/:id/edit', component: lazy(() => import('../pages/dialyse/DialyseTransportFormPage').then(m => ({ default: m.DialyseTransportFormPage }))) },
] : [];
export const dialyseRoutes = dialyseRoutesDef;

// ============================================
// HEALTHCARE - CARDIOLOGY ROUTES
// ============================================
const cardiologyRoutesDef: RouteConfig[] = __FEATURE_CARDIOLOGY__ ? [
  { path: 'cardiology', component: lazy(() => import('../pages/cardiology/CardiologyDashboardPage')) },
  { path: 'cardiology/patients', component: lazy(() => import('../pages/cardiology/CardiologyPatientsPage')) },
  { path: 'cardiology/patients/new', component: lazy(() => import('../pages/cardiology/CardiologyPatientFormPage')) },
  { path: 'cardiology/patients/:id', component: lazy(() => import('../pages/cardiology/CardiologyPatientDetailPage')) },
  { path: 'cardiology/patients/:id/edit', component: lazy(() => import('../pages/cardiology/CardiologyPatientFormPage')) },
  { path: 'cardiology/consultations', component: lazy(() => import('../pages/cardiology/CardiologyConsultationsPage')) },
  { path: 'cardiology/consultations/new', component: lazy(() => import('../pages/cardiology/CardiologyConsultationFormPage')) },
  { path: 'cardiology/consultations/:id/edit', component: lazy(() => import('../pages/cardiology/CardiologyConsultationFormPage')) },
  { path: 'cardiology/ecg', component: lazy(() => import('../pages/cardiology/CardiologyEcgPage')) },
  { path: 'cardiology/ecg/new', component: lazy(() => import('../pages/cardiology/CardiologyEcgFormPage')) },
  { path: 'cardiology/ecg/:id/edit', component: lazy(() => import('../pages/cardiology/CardiologyEcgFormPage')) },
  { path: 'cardiology/echo', component: lazy(() => import('../pages/cardiology/CardiologyEchoPage')) },
  { path: 'cardiology/echo/new', component: lazy(() => import('../pages/cardiology/CardiologyEchoFormPage')) },
  { path: 'cardiology/echo/:id/edit', component: lazy(() => import('../pages/cardiology/CardiologyEchoFormPage')) },
  { path: 'cardiology/pacemakers', component: lazy(() => import('../pages/cardiology/CardiologyPacemakersPage')) },
  { path: 'cardiology/pacemakers/new', component: lazy(() => import('../pages/cardiology/CardiologyPacemakerFormPage')) },
  { path: 'cardiology/pacemakers/:id/edit', component: lazy(() => import('../pages/cardiology/CardiologyPacemakerFormPage')) },
  { path: 'cardiology/stents', component: lazy(() => import('../pages/cardiology/CardiologyStentsPage')) },
  { path: 'cardiology/stents/new', component: lazy(() => import('../pages/cardiology/CardiologyStentFormPage')) },
  { path: 'cardiology/stents/:id/edit', component: lazy(() => import('../pages/cardiology/CardiologyStentFormPage')) },
  { path: 'cardiology/risk-scores', component: lazy(() => import('../pages/cardiology/CardiologyRiskScoresPage')) },
  { path: 'cardiology/risk-scores/new', component: lazy(() => import('../pages/cardiology/CardiologyRiskScoresFormPage')) },
  { path: 'cardiology/risk-scores/:id/edit', component: lazy(() => import('../pages/cardiology/CardiologyRiskScoresFormPage')) },
  { path: 'cardiology/medications', component: lazy(() => import('../pages/cardiology/CardiologyMedicationsPage')) },
  { path: 'cardiology/medications/new', component: lazy(() => import('../pages/cardiology/CardiologyMedicationsFormPage')) },
  { path: 'cardiology/medications/:id/edit', component: lazy(() => import('../pages/cardiology/CardiologyMedicationsFormPage')) },
  { path: 'cardiology/events', component: lazy(() => import('../pages/cardiology/CardiologyEventsPage')) },
  { path: 'cardiology/events/new', component: lazy(() => import('../pages/cardiology/CardiologyEventsFormPage')) },
  { path: 'cardiology/events/:id/edit', component: lazy(() => import('../pages/cardiology/CardiologyEventsFormPage')) },
  { path: 'cardiology/alerts', component: lazy(() => import('../pages/cardiology/CardiologyAlertsPage')) },
  { path: 'cardiology/appointments', component: lazy(() => import('../pages/cardiology/CardiologyAppointmentsPage')) },
  { path: 'cardiology/appointments/new', component: lazy(() => import('../pages/cardiology/CardiologyAppointmentsFormPage')) },
  { path: 'cardiology/appointments/:id/edit', component: lazy(() => import('../pages/cardiology/CardiologyAppointmentsFormPage')) },
  { path: 'cardiology/reports', component: lazy(() => import('../pages/cardiology/CardiologyReportsPage')) },
] : [];
export const cardiologyRoutes = cardiologyRoutesDef;

// ============================================
// HEALTHCARE - OPHTHALMOLOGY ROUTES
// ============================================
const ophthalmologyRoutesDef: RouteConfig[] = __FEATURE_OPHTHALMOLOGY__ ? [
  { path: 'ophthalmology', component: lazy(() => import('../pages/ophthalmology/OphthalmologyDashboardPage')) },
  { path: 'ophthalmology/patients', component: lazy(() => import('../pages/ophthalmology/OphthalmologyPatientsPage')) },
  { path: 'ophthalmology/patients/new', component: lazy(() => import('../pages/ophthalmology/OphthalmologyPatientFormPage')) },
  { path: 'ophthalmology/patients/:id', component: lazy(() => import('../pages/ophthalmology/OphthalmologyPatientDetailPage')) },
  { path: 'ophthalmology/patients/:id/edit', component: lazy(() => import('../pages/ophthalmology/OphthalmologyPatientFormPage')) },
  { path: 'ophthalmology/consultations', component: lazy(() => import('../pages/ophthalmology/OphthalmologyConsultationsPage')) },
  { path: 'ophthalmology/consultations/new', component: lazy(() => import('../pages/ophthalmology/OphthalmologyConsultationFormPage')) },
  { path: 'ophthalmology/consultations/:id/edit', component: lazy(() => import('../pages/ophthalmology/OphthalmologyConsultationFormPage')) },
  { path: 'ophthalmology/oct', component: lazy(() => import('../pages/ophthalmology/OphthalmologyOctPage')) },
  { path: 'ophthalmology/oct/new', component: lazy(() => import('../pages/ophthalmology/OphthalmologyOctFormPage')) },
  { path: 'ophthalmology/oct/:id/edit', component: lazy(() => import('../pages/ophthalmology/OphthalmologyOctFormPage')) },
  { path: 'ophthalmology/visual-fields', component: lazy(() => import('../pages/ophthalmology/OphthalmologyVisualFieldsPage')) },
  { path: 'ophthalmology/visual-fields/new', component: lazy(() => import('../pages/ophthalmology/OphthalmologyVisualFieldsFormPage')) },
  { path: 'ophthalmology/visual-fields/:id/edit', component: lazy(() => import('../pages/ophthalmology/OphthalmologyVisualFieldsFormPage')) },
  { path: 'ophthalmology/ivt-injections', component: lazy(() => import('../pages/ophthalmology/OphthalmologyIvtPage')) },
  { path: 'ophthalmology/ivt-injections/new', component: lazy(() => import('../pages/ophthalmology/OphthalmologyIvtFormPage')) },
  { path: 'ophthalmology/ivt-injections/:id/edit', component: lazy(() => import('../pages/ophthalmology/OphthalmologyIvtFormPage')) },
  { path: 'ophthalmology/biometry', component: lazy(() => import('../pages/ophthalmology/OphthalmologyBiometryPage')) },
  { path: 'ophthalmology/biometry/new', component: lazy(() => import('../pages/ophthalmology/OphthalmologyBiometryFormPage')) },
  { path: 'ophthalmology/biometry/:id/edit', component: lazy(() => import('../pages/ophthalmology/OphthalmologyBiometryFormPage')) },
  { path: 'ophthalmology/iol-implants', component: lazy(() => import('../pages/ophthalmology/OphthalmologyIolImplantsPage')) },
  { path: 'ophthalmology/iol-implants/new', component: lazy(() => import('../pages/ophthalmology/OphthalmologyIolImplantsFormPage')) },
  { path: 'ophthalmology/iol-implants/:id/edit', component: lazy(() => import('../pages/ophthalmology/OphthalmologyIolImplantsFormPage')) },
  { path: 'ophthalmology/surgeries', component: lazy(() => import('../pages/ophthalmology/OphthalmologySurgeriesPage')) },
  { path: 'ophthalmology/surgeries/new', component: lazy(() => import('../pages/ophthalmology/OphthalmologySurgeryFormPage')) },
  { path: 'ophthalmology/surgeries/:id/edit', component: lazy(() => import('../pages/ophthalmology/OphthalmologySurgeryFormPage')) },
  { path: 'ophthalmology/refraction', component: lazy(() => import('../pages/ophthalmology/OphthalmologyRefractionPage')) },
  { path: 'ophthalmology/refraction/new', component: lazy(() => import('../pages/ophthalmology/OphthalmologyRefractionFormPage')) },
  { path: 'ophthalmology/refraction/:id/edit', component: lazy(() => import('../pages/ophthalmology/OphthalmologyRefractionFormPage')) },
  { path: 'ophthalmology/tonometry', component: lazy(() => import('../pages/ophthalmology/OphthalmologyTonometryPage')) },
  { path: 'ophthalmology/tonometry/new', component: lazy(() => import('../pages/ophthalmology/OphthalmologyTonometryFormPage')) },
  { path: 'ophthalmology/tonometry/:id/edit', component: lazy(() => import('../pages/ophthalmology/OphthalmologyTonometryFormPage')) },
  { path: 'ophthalmology/osdi-scores', component: lazy(() => import('../pages/ophthalmology/OphthalmologyOsdiPage')) },
  { path: 'ophthalmology/osdi-scores/new', component: lazy(() => import('../pages/ophthalmology/OphthalmologyOsdiFormPage')) },
  { path: 'ophthalmology/osdi-scores/:id/edit', component: lazy(() => import('../pages/ophthalmology/OphthalmologyOsdiFormPage')) },
  { path: 'ophthalmology/alerts', component: lazy(() => import('../pages/ophthalmology/OphthalmologyAlertsPage')) },
] : [];
export const ophthalmologyRoutes = ophthalmologyRoutesDef;

// ============================================
// HEALTHCARE - CLINICAL AI ROUTES
// ============================================
const clinicalAiRoutesDef: RouteConfig[] = __FEATURE_CLINICAL_AI__ ? [
  { path: 'clinical-ai', component: lazy(() => import('../pages/clinical-ai/ClinicalAIDashboardPage').then(m => ({ default: m.ClinicalAIDashboardPage }))) },
  { path: 'clinical-ai/documentation', component: lazy(() => import('../pages/clinical-ai/ClinicalDocumentationPage').then(m => ({ default: m.ClinicalDocumentationPage }))) },
  { path: 'clinical-ai/documentation/new', component: lazy(() => import('../pages/clinical-ai/ClinicalDocumentFormPage').then(m => ({ default: m.ClinicalDocumentFormPage }))) },
  { path: 'clinical-ai/documentation/:id', component: lazy(() => import('../pages/clinical-ai/ClinicalDocumentFormPage').then(m => ({ default: m.ClinicalDocumentFormPage }))) },
  { path: 'clinical-ai/documentation/:id/edit', component: lazy(() => import('../pages/clinical-ai/ClinicalDocumentFormPage').then(m => ({ default: m.ClinicalDocumentFormPage }))) },
  { path: 'clinical-ai/summaries', component: lazy(() => import('../pages/clinical-ai/PatientSummaryPage').then(m => ({ default: m.PatientSummaryPage }))) },
  { path: 'clinical-ai/summaries/new', component: lazy(() => import('../pages/clinical-ai/PatientSummaryPage').then(m => ({ default: m.PatientSummaryPage }))) },
  { path: 'clinical-ai/diagnostics', component: lazy(() => import('../pages/clinical-ai/DiagnosticAssistantPage').then(m => ({ default: m.DiagnosticAssistantPage }))) },
] : [];
export const clinicalAiRoutes = clinicalAiRoutesDef;

// ============================================
// HEALTHCARE - RPM ROUTES
// ============================================
const rpmRoutesDef: RouteConfig[] = __FEATURE_RPM__ ? [
  { path: 'rpm', component: lazy(() => import('../pages/rpm/RpmDashboardPage').then(m => ({ default: m.RpmDashboardPage }))) },
  { path: 'rpm/devices', component: lazy(() => import('../pages/rpm/RpmDevicesPage').then(m => ({ default: m.RpmDevicesPage }))) },
  { path: 'rpm/programs', component: lazy(() => import('../pages/rpm/RpmProgramsPage').then(m => ({ default: m.RpmProgramsPage }))) },
  { path: 'rpm/enrollments', component: lazy(() => import('../pages/rpm/RpmEnrollmentsPage').then(m => ({ default: m.RpmEnrollmentsPage }))) },
  { path: 'rpm/compliance', component: lazy(() => import('../pages/rpm/RpmCompliancePage').then(m => ({ default: m.RpmCompliancePage }))) },
] : [];
export const rpmRoutes = rpmRoutesDef;

// ============================================
// HEALTHCARE - PATIENT PORTAL ROUTES
// ============================================
const patientPortalRoutesDef: RouteConfig[] = __FEATURE_PATIENT_PORTAL__ ? [
  { path: '/portal/login', component: lazy(() => import('../pages/patient-portal/PortalLoginPage').then(m => ({ default: m.PortalLoginPage }))) },
  { path: '/portal', component: lazy(() => import('../pages/patient-portal/PortalDashboardPage').then(m => ({ default: m.PortalDashboardPage }))) },
  { path: '/portal/appointments', component: lazy(() => import('../pages/patient-portal/PortalAppointmentsPage').then(m => ({ default: m.PortalAppointmentsPage }))) },
  { path: '/portal/messages', component: lazy(() => import('../pages/patient-portal/PortalMessagesPage').then(m => ({ default: m.PortalMessagesPage }))) },
  { path: '/portal/symptom-tracker', component: lazy(() => import('../pages/patient-portal/PortalSymptomTrackerPage').then(m => ({ default: m.PortalSymptomTrackerPage }))) },
] : [];
export const patientPortalRoutes = patientPortalRoutesDef;

// ============================================
// ERP ONLY ROUTES
// ============================================
const erpOnlyRoutesDef: RouteConfig[] = [];

// Projects
if (__FEATURE_PROJECTS__) {
  erpOnlyRoutesDef.push(
    { path: 'projects', component: lazy(() => import('../pages/projects/ProjectsPage').then(m => ({ default: m.ProjectsPage }))) },
    { path: 'projects/new', component: lazy(() => import('../pages/projects/ProjectFormPage').then(m => ({ default: m.ProjectFormPage }))) },
    { path: 'projects/:id/edit', component: lazy(() => import('../pages/projects/ProjectFormPage').then(m => ({ default: m.ProjectFormPage }))) }
  );
}

// Procurement
if (__FEATURE_PROCUREMENT__) {
  erpOnlyRoutesDef.push(
    { path: 'procurement/suppliers', component: lazy(() => import('../pages/procurement/SuppliersPage').then(m => ({ default: m.SuppliersPage }))) },
    { path: 'procurement/suppliers/new', component: lazy(() => import('../pages/procurement/SupplierFormPage').then(m => ({ default: m.SupplierFormPage }))) },
    { path: 'procurement/suppliers/:id/edit', component: lazy(() => import('../pages/procurement/SupplierFormPage').then(m => ({ default: m.SupplierFormPage }))) }
  );
}

// Sales
if (__FEATURE_SALES__) {
  erpOnlyRoutesDef.push(
    { path: 'sales/orders', component: lazy(() => import('../pages/sales/SalesOrdersPage').then(m => ({ default: m.SalesOrdersPage }))) },
    { path: 'sales/orders/new', component: lazy(() => import('../pages/sales/SalesOrderFormPage').then(m => ({ default: m.SalesOrderFormPage }))) },
    { path: 'sales/orders/:id/edit', component: lazy(() => import('../pages/sales/SalesOrderFormPage').then(m => ({ default: m.SalesOrderFormPage }))) }
  );
}

// Manufacturing
if (__FEATURE_MANUFACTURING__) {
  erpOnlyRoutesDef.push(
    { path: 'manufacturing/work-orders', component: lazy(() => import('../pages/manufacturing/WorkOrdersPage').then(m => ({ default: m.WorkOrdersPage }))) },
    { path: 'manufacturing/work-orders/new', component: lazy(() => import('../pages/manufacturing/WorkOrderFormPage').then(m => ({ default: m.WorkOrderFormPage }))) },
    { path: 'manufacturing/work-orders/:id/edit', component: lazy(() => import('../pages/manufacturing/WorkOrderFormPage').then(m => ({ default: m.WorkOrderFormPage }))) }
  );
}

// Workflows
if (__FEATURE_WORKFLOWS__) {
  erpOnlyRoutesDef.push(
    { path: 'workflows', component: lazy(() => import('../pages/workflows/WorkflowsPage').then(m => ({ default: m.WorkflowsPage }))) },
    { path: 'workflows/new', component: lazy(() => import('../pages/workflows/WorkflowFormPage').then(m => ({ default: m.WorkflowFormPage }))) },
    { path: 'workflows/:id/edit', component: lazy(() => import('../pages/workflows/WorkflowFormPage').then(m => ({ default: m.WorkflowFormPage }))) },
    { path: 'workflows/webhooks/new', component: lazy(() => import('../pages/workflows/WebhookFormPage').then(m => ({ default: m.WebhookFormPage }))) },
    { path: 'workflows/webhooks/:id/edit', component: lazy(() => import('../pages/workflows/WebhookFormPage').then(m => ({ default: m.WebhookFormPage }))) },
    { path: 'workflows/api-keys/new', component: lazy(() => import('../pages/workflows/ApiKeyFormPage').then(m => ({ default: m.ApiKeyFormPage }))) },
    { path: 'workflows/api-keys/:id/edit', component: lazy(() => import('../pages/workflows/ApiKeyFormPage').then(m => ({ default: m.ApiKeyFormPage }))) }
  );
}

// Audit
if (__FEATURE_AUDIT__) {
  erpOnlyRoutesDef.push(
    { path: 'audit', component: lazy(() => import('../pages/audit/AuditDashboardPage').then(m => ({ default: m.AuditDashboardPage }))) },
    { path: 'audit/tasks', component: lazy(() => import('../pages/audit/AuditTasksPage').then(m => ({ default: m.AuditTasksPage }))) },
    { path: 'audit/risk', component: lazy(() => import('../pages/audit/RiskAssessmentPage').then(m => ({ default: m.RiskAssessmentPage }))) },
    { path: 'audit/compliance', component: lazy(() => import('../pages/audit/ComplianceCopilotPage').then(m => ({ default: m.ComplianceCopilotPage }))) },
    { path: 'audit/commonality', component: lazy(() => import('../pages/audit/CommonalityStudyPage').then(m => ({ default: m.CommonalityStudyPage }))) }
  );
}

// AI
if (__FEATURE_AI__) {
  erpOnlyRoutesDef.push(
    { path: 'ai', component: lazy(() => import('../pages/ai/AIPage').then(m => ({ default: m.AIPage }))) },
    { path: 'activity', component: lazy(() => import('../pages/ActivityFeedPage').then(m => ({ default: m.ActivityFeedPage }))) },
    { path: 'integrations', component: lazy(() => import('../pages/integrations/IntegrationsPage').then(m => ({ default: m.IntegrationsPage }))) }
  );
}

export const erpOnlyRoutes = erpOnlyRoutesDef;

// ============================================
// ALL ROUTES COMBINED
// ============================================
export const allRoutes: RouteConfig[] = [
  ...commonRoutes,
  ...financeRoutes,
  ...inventoryRoutes,
  ...hrRoutes,
  ...crmRoutes,
  ...bakeryRoutes,
  ...dialyseRoutes,
  ...cardiologyRoutes,
  ...ophthalmologyRoutes,
  ...clinicalAiRoutes,
  ...rpmRoutes,
  ...erpOnlyRoutes,
];

// Portal routes are separate (outside DashboardLayout)
export const portalRoutes = patientPortalRoutes;

// Export variant info for debugging
export const routeInfo = {
  variant: VARIANT,
  totalRoutes: allRoutes.length,
  portalRoutes: portalRoutes.length,
};
