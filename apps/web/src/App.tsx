import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Suspense, lazy } from 'react';
import { ProtectedRoute } from './components/ProtectedRoute';
import { DashboardLayout } from './components/layouts/DashboardLayout';
import { LanguageProvider } from './contexts/LanguageContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ToastProvider } from './contexts/ToastContext';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { PasswordlessVerifyPage } from './pages/auth/PasswordlessVerifyPage';
import { DashboardPage } from './pages/DashboardPage';

// Profile page
const ProfilePage = lazy(() => import('./pages/profile/ProfilePage').then(m => ({ default: m.ProfilePage })));

// Lazy load feature modules for code splitting
const AccountsPage = lazy(() => import('./pages/finance/AccountsPage').then(m => ({ default: m.AccountsPage })));
const AccountFormPage = lazy(() => import('./pages/finance/AccountFormPage').then(m => ({ default: m.AccountFormPage })));
const InvoicesPage = lazy(() => import('./pages/finance/InvoicesPage').then(m => ({ default: m.InvoicesPage })));
const NewInvoicePage = lazy(() => import('./pages/finance/NewInvoicePage').then(m => ({ default: m.NewInvoicePage })));
const InvoiceDetailPage = lazy(() => import('./pages/finance/InvoiceDetailPage').then(m => ({ default: m.InvoiceDetailPage })));
const PaymentsPage = lazy(() => import('./pages/finance/PaymentsPage').then(m => ({ default: m.PaymentsPage })));
const PaymentFormPage = lazy(() => import('./pages/finance/PaymentFormPage').then(m => ({ default: m.PaymentFormPage })));
const ReportsPage = lazy(() => import('./pages/finance/ReportsPage').then(m => ({ default: m.ReportsPage })));

const CompaniesPage = lazy(() => import('./pages/crm/CompaniesPage').then(m => ({ default: m.CompaniesPage })));
const CompanyFormPage = lazy(() => import('./pages/crm/CompanyFormPage').then(m => ({ default: m.CompanyFormPage })));
const ContactsPage = lazy(() => import('./pages/crm/ContactsPage').then(m => ({ default: m.ContactsPage })));
const ContactFormPage = lazy(() => import('./pages/crm/ContactFormPage').then(m => ({ default: m.ContactFormPage })));
const PipelinePage = lazy(() => import('./pages/crm/PipelinePage').then(m => ({ default: m.PipelinePage })));
const OpportunityFormPage = lazy(() => import('./pages/crm/OpportunityFormPage').then(m => ({ default: m.OpportunityFormPage })));

const ProjectsPage = lazy(() => import('./pages/projects/ProjectsPage').then(m => ({ default: m.ProjectsPage })));
const ProjectFormPage = lazy(() => import('./pages/projects/ProjectFormPage').then(m => ({ default: m.ProjectFormPage })));

const InventoryPage = lazy(() => import('./pages/inventory/InventoryPage').then(m => ({ default: m.InventoryPage })));
const InventoryItemFormPage = lazy(() => import('./pages/inventory/InventoryItemFormPage').then(m => ({ default: m.InventoryItemFormPage })));

const EmployeesPage = lazy(() => import('./pages/hr/EmployeesPage').then(m => ({ default: m.EmployeesPage })));
const EmployeeFormPage = lazy(() => import('./pages/hr/EmployeeFormPage').then(m => ({ default: m.EmployeeFormPage })));

const SuppliersPage = lazy(() => import('./pages/procurement/SuppliersPage').then(m => ({ default: m.SuppliersPage })));
const SupplierFormPage = lazy(() => import('./pages/procurement/SupplierFormPage').then(m => ({ default: m.SupplierFormPage })));

const SalesOrdersPage = lazy(() => import('./pages/sales/SalesOrdersPage').then(m => ({ default: m.SalesOrdersPage })));
const SalesOrderFormPage = lazy(() => import('./pages/sales/SalesOrderFormPage').then(m => ({ default: m.SalesOrderFormPage })));

const WorkOrdersPage = lazy(() => import('./pages/manufacturing/WorkOrdersPage').then(m => ({ default: m.WorkOrdersPage })));
const WorkOrderFormPage = lazy(() => import('./pages/manufacturing/WorkOrderFormPage').then(m => ({ default: m.WorkOrderFormPage })));

const AssetsPage = lazy(() => import('./pages/assets/AssetsPage').then(m => ({ default: m.AssetsPage })));
const AssetFormPage = lazy(() => import('./pages/assets/AssetFormPage').then(m => ({ default: m.AssetFormPage })));

const WorkflowsPage = lazy(() => import('./pages/workflows/WorkflowsPage').then(m => ({ default: m.WorkflowsPage })));
const WorkflowFormPage = lazy(() => import('./pages/workflows/WorkflowFormPage').then(m => ({ default: m.WorkflowFormPage })));
const WebhookFormPage = lazy(() => import('./pages/workflows/WebhookFormPage').then(m => ({ default: m.WebhookFormPage })));
const ApiKeyFormPage = lazy(() => import('./pages/workflows/ApiKeyFormPage').then(m => ({ default: m.ApiKeyFormPage })));

const ActivityFeedPage = lazy(() => import('./pages/ActivityFeedPage').then(m => ({ default: m.ActivityFeedPage })));
const AIPage = lazy(() => import('./pages/ai/AIPage').then(m => ({ default: m.AIPage })));

// Smart Audit System pages
const AuditDashboardPage = lazy(() => import('./pages/audit/AuditDashboardPage').then(m => ({ default: m.AuditDashboardPage })));
const AuditTasksPage = lazy(() => import('./pages/audit/AuditTasksPage').then(m => ({ default: m.AuditTasksPage })));
const RiskAssessmentPage = lazy(() => import('./pages/audit/RiskAssessmentPage').then(m => ({ default: m.RiskAssessmentPage })));
const ComplianceCopilotPage = lazy(() => import('./pages/audit/ComplianceCopilotPage').then(m => ({ default: m.ComplianceCopilotPage })));
const CommonalityStudyPage = lazy(() => import('./pages/audit/CommonalityStudyPage').then(m => ({ default: m.CommonalityStudyPage })));

// Help Center pages
const HelpCenterPage = lazy(() => import('./pages/help/HelpCenterPage').then(m => ({ default: m.HelpCenterPage })));
const GettingStartedPage = lazy(() => import('./pages/help/GettingStartedPage').then(m => ({ default: m.GettingStartedPage })));
const FAQPage = lazy(() => import('./pages/help/FAQPage').then(m => ({ default: m.FAQPage })));
const ModuleGuidesPage = lazy(() => import('./pages/help/ModuleGuidesPage').then(m => ({ default: m.ModuleGuidesPage })));

// Settings pages
const SettingsPage = lazy(() => import('./pages/settings/SettingsPage').then(m => ({ default: m.SettingsPage })));
const ModulesSettingsPage = lazy(() => import('./pages/settings/ModulesSettingsPage').then(m => ({ default: m.ModulesSettingsPage })));

// Recipes pages (Bakery module)
const RecipesPage = lazy(() => import('./pages/recipes/RecipesPage').then(m => ({ default: m.RecipesPage })));
const RecipeFormPage = lazy(() => import('./pages/recipes/RecipeFormPage').then(m => ({ default: m.RecipeFormPage })));

// Traceability pages (HACCP module)
const TraceabilityPage = lazy(() => import('./pages/traceability/TraceabilityPage').then(m => ({ default: m.TraceabilityPage })));

// Payroll pages
const PayrollPage = lazy(() => import('./pages/payroll/PayrollPage').then(m => ({ default: m.PayrollPage })));

// Integrations pages (Tunisian market connectors)
const IntegrationsPage = lazy(() => import('./pages/integrations/IntegrationsPage').then(m => ({ default: m.IntegrationsPage })));

// Dialyse pages (Healthcare - Dialysis module)
const DialyseDashboardPage = lazy(() => import('./pages/dialyse/DialyseDashboardPage').then(m => ({ default: m.DialyseDashboardPage })));
const DialysePatientsPage = lazy(() => import('./pages/dialyse/DialysePatientsPage').then(m => ({ default: m.DialysePatientsPage })));
const DialysePatientDetailPage = lazy(() => import('./pages/dialyse/DialysePatientDetailPage').then(m => ({ default: m.DialysePatientDetailPage })));
const DialysePatientFormPage = lazy(() => import('./pages/dialyse/DialysePatientFormPage').then(m => ({ default: m.DialysePatientFormPage })));
const DialysePlanningPage = lazy(() => import('./pages/dialyse/DialysePlanningPage').then(m => ({ default: m.DialysePlanningPage })));
const DialyseMachinesPage = lazy(() => import('./pages/dialyse/DialyseMachinesPage').then(m => ({ default: m.DialyseMachinesPage })));
const DialyseAlertsPage = lazy(() => import('./pages/dialyse/DialyseAlertsPage').then(m => ({ default: m.DialyseAlertsPage })));
const DialyseAlertDetailPage = lazy(() => import('./pages/dialyse/DialyseAlertDetailPage').then(m => ({ default: m.DialyseAlertDetailPage })));
const DialyseSessionFormPage = lazy(() => import('./pages/dialyse/DialyseSessionFormPage').then(m => ({ default: m.DialyseSessionFormPage })));
const DialyseSessionDetailPage = lazy(() => import('./pages/dialyse/DialyseSessionDetailPage').then(m => ({ default: m.DialyseSessionDetailPage })));
const DialysePrescriptionFormPage = lazy(() => import('./pages/dialyse/DialysePrescriptionFormPage').then(m => ({ default: m.DialysePrescriptionFormPage })));
const DialyseLabResultFormPage = lazy(() => import('./pages/dialyse/DialyseLabResultFormPage').then(m => ({ default: m.DialyseLabResultFormPage })));
const DialyseVascularAccessFormPage = lazy(() => import('./pages/dialyse/DialyseVascularAccessFormPage').then(m => ({ default: m.DialyseVascularAccessFormPage })));
const DialyseSlotsPage = lazy(() => import('./pages/dialyse/DialyseSlotsPage').then(m => ({ default: m.DialyseSlotsPage })));
const DialyseReportsPage = lazy(() => import('./pages/dialyse/DialyseReportsPage').then(m => ({ default: m.DialyseReportsPage })));
const DialyseConsumablesPage = lazy(() => import('./pages/dialyse/DialyseConsumablesPage').then(m => ({ default: m.DialyseConsumablesPage })));
const DialyseMaintenancePage = lazy(() => import('./pages/dialyse/DialyseMaintenancePage').then(m => ({ default: m.DialyseMaintenancePage })));
const DialyseProtocolsPage = lazy(() => import('./pages/dialyse/DialyseProtocolsPage').then(m => ({ default: m.DialyseProtocolsPage })));
const DialyseStaffPage = lazy(() => import('./pages/dialyse/DialyseStaffPage').then(m => ({ default: m.DialyseStaffPage })));
const DialyseBillingPage = lazy(() => import('./pages/dialyse/DialyseBillingPage').then(m => ({ default: m.DialyseBillingPage })));
const DialyseTransportPage = lazy(() => import('./pages/dialyse/DialyseTransportPage').then(m => ({ default: m.DialyseTransportPage })));

// Dialyse Form pages (dedicated pages instead of modals)
const DialyseMaintenanceFormPage = lazy(() => import('./pages/dialyse/DialyseMaintenanceFormPage').then(m => ({ default: m.DialyseMaintenanceFormPage })));
const DialyseBillingFormPage = lazy(() => import('./pages/dialyse/DialyseBillingFormPage').then(m => ({ default: m.DialyseBillingFormPage })));
const DialyseTransportFormPage = lazy(() => import('./pages/dialyse/DialyseTransportFormPage').then(m => ({ default: m.DialyseTransportFormPage })));
const DialyseStaffFormPage = lazy(() => import('./pages/dialyse/DialyseStaffFormPage').then(m => ({ default: m.DialyseStaffFormPage })));
const DialyseProtocolFormPage = lazy(() => import('./pages/dialyse/DialyseProtocolFormPage').then(m => ({ default: m.DialyseProtocolFormPage })));
const DialyseConsumableFormPage = lazy(() => import('./pages/dialyse/DialyseConsumableFormPage').then(m => ({ default: m.DialyseConsumableFormPage })));
const DialyseMachineFormPage = lazy(() => import('./pages/dialyse/DialyseMachineFormPage').then(m => ({ default: m.DialyseMachineFormPage })));

// Cardiology pages (Healthcare - Cardiology module)
const CardiologyDashboardPage = lazy(() => import('./pages/cardiology/CardiologyDashboardPage'));
const CardiologyPatientsPage = lazy(() => import('./pages/cardiology/CardiologyPatientsPage'));
const CardiologyPatientFormPage = lazy(() => import('./pages/cardiology/CardiologyPatientFormPage'));
const CardiologyPatientDetailPage = lazy(() => import('./pages/cardiology/CardiologyPatientDetailPage'));
const CardiologyConsultationsPage = lazy(() => import('./pages/cardiology/CardiologyConsultationsPage'));
const CardiologyEcgPage = lazy(() => import('./pages/cardiology/CardiologyEcgPage'));
const CardiologyEchoPage = lazy(() => import('./pages/cardiology/CardiologyEchoPage'));
const CardiologyPacemakersPage = lazy(() => import('./pages/cardiology/CardiologyPacemakersPage'));
const CardiologyStentsPage = lazy(() => import('./pages/cardiology/CardiologyStentsPage'));
const CardiologyRiskScoresPage = lazy(() => import('./pages/cardiology/CardiologyRiskScoresPage'));
const CardiologyMedicationsPage = lazy(() => import('./pages/cardiology/CardiologyMedicationsPage'));
const CardiologyEventsPage = lazy(() => import('./pages/cardiology/CardiologyEventsPage'));
const CardiologyAlertsPage = lazy(() => import('./pages/cardiology/CardiologyAlertsPage'));
const CardiologyAppointmentsPage = lazy(() => import('./pages/cardiology/CardiologyAppointmentsPage'));
const CardiologyReportsPage = lazy(() => import('./pages/cardiology/CardiologyReportsPage'));

// Ophthalmology pages (Healthcare - Ophthalmology module)
const OphthalmologyDashboardPage = lazy(() => import('./pages/ophthalmology/OphthalmologyDashboardPage'));
const OphthalmologyPatientsPage = lazy(() => import('./pages/ophthalmology/OphthalmologyPatientsPage'));
const OphthalmologyPatientFormPage = lazy(() => import('./pages/ophthalmology/OphthalmologyPatientFormPage'));
const OphthalmologyPatientDetailPage = lazy(() => import('./pages/ophthalmology/OphthalmologyPatientDetailPage'));
const OphthalmologyConsultationsPage = lazy(() => import('./pages/ophthalmology/OphthalmologyConsultationsPage'));
const OphthalmologyOctPage = lazy(() => import('./pages/ophthalmology/OphthalmologyOctPage'));
const OphthalmologyVisualFieldsPage = lazy(() => import('./pages/ophthalmology/OphthalmologyVisualFieldsPage'));
const OphthalmologyIvtPage = lazy(() => import('./pages/ophthalmology/OphthalmologyIvtPage'));
const OphthalmologyBiometryPage = lazy(() => import('./pages/ophthalmology/OphthalmologyBiometryPage'));
const OphthalmologyIolImplantsPage = lazy(() => import('./pages/ophthalmology/OphthalmologyIolImplantsPage'));
const OphthalmologySurgeriesPage = lazy(() => import('./pages/ophthalmology/OphthalmologySurgeriesPage'));
const OphthalmologyRefractionPage = lazy(() => import('./pages/ophthalmology/OphthalmologyRefractionPage'));
const OphthalmologyTonometryPage = lazy(() => import('./pages/ophthalmology/OphthalmologyTonometryPage'));
const OphthalmologyOsdiPage = lazy(() => import('./pages/ophthalmology/OphthalmologyOsdiPage'));
const OphthalmologyAlertsPage = lazy(() => import('./pages/ophthalmology/OphthalmologyAlertsPage'));
// Ophthalmology form pages
const OphthalmologySurgeryFormPage = lazy(() => import('./pages/ophthalmology/OphthalmologySurgeryFormPage'));
const OphthalmologyConsultationFormPage = lazy(() => import('./pages/ophthalmology/OphthalmologyConsultationFormPage'));
const OphthalmologyOctFormPage = lazy(() => import('./pages/ophthalmology/OphthalmologyOctFormPage'));
const OphthalmologyIvtFormPage = lazy(() => import('./pages/ophthalmology/OphthalmologyIvtFormPage'));
const OphthalmologyBiometryFormPage = lazy(() => import('./pages/ophthalmology/OphthalmologyBiometryFormPage'));

// Cardiology form pages
const CardiologyConsultationFormPage = lazy(() => import('./pages/cardiology/CardiologyConsultationFormPage'));
const CardiologyEcgFormPage = lazy(() => import('./pages/cardiology/CardiologyEcgFormPage'));
const CardiologyEchoFormPage = lazy(() => import('./pages/cardiology/CardiologyEchoFormPage'));
const CardiologyPacemakerFormPage = lazy(() => import('./pages/cardiology/CardiologyPacemakerFormPage'));
const CardiologyStentFormPage = lazy(() => import('./pages/cardiology/CardiologyStentFormPage'));
const CardiologyRiskScoresFormPage = lazy(() => import('./pages/cardiology/CardiologyRiskScoresFormPage'));
const CardiologyMedicationsFormPage = lazy(() => import('./pages/cardiology/CardiologyMedicationsFormPage'));
const CardiologyEventsFormPage = lazy(() => import('./pages/cardiology/CardiologyEventsFormPage'));
const CardiologyAppointmentsFormPage = lazy(() => import('./pages/cardiology/CardiologyAppointmentsFormPage'));

// Ophthalmology additional form pages
const OphthalmologyTonometryFormPage = lazy(() => import('./pages/ophthalmology/OphthalmologyTonometryFormPage'));
const OphthalmologyVisualFieldsFormPage = lazy(() => import('./pages/ophthalmology/OphthalmologyVisualFieldsFormPage'));
const OphthalmologyIolImplantsFormPage = lazy(() => import('./pages/ophthalmology/OphthalmologyIolImplantsFormPage'));
const OphthalmologyOsdiFormPage = lazy(() => import('./pages/ophthalmology/OphthalmologyOsdiFormPage'));
const OphthalmologyRefractionFormPage = lazy(() => import('./pages/ophthalmology/OphthalmologyRefractionFormPage'));

// Loading fallback component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
  </div>
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <LanguageProvider>
          <ToastProvider>
          <BrowserRouter>
          <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/auth/passwordless" element={<PasswordlessVerifyPage />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route path="finance/accounts" element={<Suspense fallback={<PageLoader />}><AccountsPage /></Suspense>} />
            <Route path="finance/accounts/new" element={<Suspense fallback={<PageLoader />}><AccountFormPage /></Suspense>} />
            <Route path="finance/accounts/:id/edit" element={<Suspense fallback={<PageLoader />}><AccountFormPage /></Suspense>} />
            <Route path="finance/invoices" element={<Suspense fallback={<PageLoader />}><InvoicesPage /></Suspense>} />
            <Route path="finance/invoices/new" element={<Suspense fallback={<PageLoader />}><NewInvoicePage /></Suspense>} />
            <Route path="finance/invoices/:id" element={<Suspense fallback={<PageLoader />}><InvoiceDetailPage /></Suspense>} />
            <Route path="finance/payments" element={<Suspense fallback={<PageLoader />}><PaymentsPage /></Suspense>} />
            <Route path="finance/payments/new" element={<Suspense fallback={<PageLoader />}><PaymentFormPage /></Suspense>} />
            <Route path="finance/reports" element={<Suspense fallback={<PageLoader />}><ReportsPage /></Suspense>} />
            <Route path="crm/companies" element={<Suspense fallback={<PageLoader />}><CompaniesPage /></Suspense>} />
            <Route path="crm/companies/new" element={<Suspense fallback={<PageLoader />}><CompanyFormPage /></Suspense>} />
            <Route path="crm/companies/:id/edit" element={<Suspense fallback={<PageLoader />}><CompanyFormPage /></Suspense>} />
            <Route path="crm/contacts" element={<Suspense fallback={<PageLoader />}><ContactsPage /></Suspense>} />
            <Route path="crm/contacts/new" element={<Suspense fallback={<PageLoader />}><ContactFormPage /></Suspense>} />
            <Route path="crm/contacts/:id/edit" element={<Suspense fallback={<PageLoader />}><ContactFormPage /></Suspense>} />
            <Route path="crm/pipeline" element={<Suspense fallback={<PageLoader />}><PipelinePage /></Suspense>} />
            <Route path="crm/pipeline/opportunities/new" element={<Suspense fallback={<PageLoader />}><OpportunityFormPage /></Suspense>} />
            <Route path="crm/pipeline/opportunities/:id/edit" element={<Suspense fallback={<PageLoader />}><OpportunityFormPage /></Suspense>} />
            <Route path="projects" element={<Suspense fallback={<PageLoader />}><ProjectsPage /></Suspense>} />
            <Route path="projects/new" element={<Suspense fallback={<PageLoader />}><ProjectFormPage /></Suspense>} />
            <Route path="projects/:id/edit" element={<Suspense fallback={<PageLoader />}><ProjectFormPage /></Suspense>} />
            <Route path="inventory" element={<Suspense fallback={<PageLoader />}><InventoryPage /></Suspense>} />
            <Route path="inventory/new" element={<Suspense fallback={<PageLoader />}><InventoryItemFormPage /></Suspense>} />
            <Route path="inventory/:id/edit" element={<Suspense fallback={<PageLoader />}><InventoryItemFormPage /></Suspense>} />
            <Route path="hr/employees" element={<Suspense fallback={<PageLoader />}><EmployeesPage /></Suspense>} />
            <Route path="hr/employees/new" element={<Suspense fallback={<PageLoader />}><EmployeeFormPage /></Suspense>} />
            <Route path="hr/employees/:id/edit" element={<Suspense fallback={<PageLoader />}><EmployeeFormPage /></Suspense>} />
            <Route path="procurement/suppliers" element={<Suspense fallback={<PageLoader />}><SuppliersPage /></Suspense>} />
            <Route path="procurement/suppliers/new" element={<Suspense fallback={<PageLoader />}><SupplierFormPage /></Suspense>} />
            <Route path="procurement/suppliers/:id/edit" element={<Suspense fallback={<PageLoader />}><SupplierFormPage /></Suspense>} />
            <Route path="sales/orders" element={<Suspense fallback={<PageLoader />}><SalesOrdersPage /></Suspense>} />
            <Route path="sales/orders/new" element={<Suspense fallback={<PageLoader />}><SalesOrderFormPage /></Suspense>} />
            <Route path="sales/orders/:id/edit" element={<Suspense fallback={<PageLoader />}><SalesOrderFormPage /></Suspense>} />
            <Route path="manufacturing/work-orders" element={<Suspense fallback={<PageLoader />}><WorkOrdersPage /></Suspense>} />
            <Route path="manufacturing/work-orders/new" element={<Suspense fallback={<PageLoader />}><WorkOrderFormPage /></Suspense>} />
            <Route path="manufacturing/work-orders/:id/edit" element={<Suspense fallback={<PageLoader />}><WorkOrderFormPage /></Suspense>} />
            <Route path="assets" element={<Suspense fallback={<PageLoader />}><AssetsPage /></Suspense>} />
            <Route path="assets/new" element={<Suspense fallback={<PageLoader />}><AssetFormPage /></Suspense>} />
            <Route path="assets/:id/edit" element={<Suspense fallback={<PageLoader />}><AssetFormPage /></Suspense>} />
            <Route path="workflows" element={<Suspense fallback={<PageLoader />}><WorkflowsPage /></Suspense>} />
            <Route path="workflows/new" element={<Suspense fallback={<PageLoader />}><WorkflowFormPage /></Suspense>} />
            <Route path="workflows/:id/edit" element={<Suspense fallback={<PageLoader />}><WorkflowFormPage /></Suspense>} />
            <Route path="workflows/webhooks/new" element={<Suspense fallback={<PageLoader />}><WebhookFormPage /></Suspense>} />
            <Route path="workflows/webhooks/:id/edit" element={<Suspense fallback={<PageLoader />}><WebhookFormPage /></Suspense>} />
            <Route path="workflows/api-keys/new" element={<Suspense fallback={<PageLoader />}><ApiKeyFormPage /></Suspense>} />
            <Route path="workflows/api-keys/:id/edit" element={<Suspense fallback={<PageLoader />}><ApiKeyFormPage /></Suspense>} />
            <Route path="activity" element={<Suspense fallback={<PageLoader />}><ActivityFeedPage /></Suspense>} />
            <Route path="ai" element={<Suspense fallback={<PageLoader />}><AIPage /></Suspense>} />
            <Route path="audit" element={<Suspense fallback={<PageLoader />}><AuditDashboardPage /></Suspense>} />
            <Route path="audit/tasks" element={<Suspense fallback={<PageLoader />}><AuditTasksPage /></Suspense>} />
            <Route path="audit/risk" element={<Suspense fallback={<PageLoader />}><RiskAssessmentPage /></Suspense>} />
            <Route path="audit/compliance" element={<Suspense fallback={<PageLoader />}><ComplianceCopilotPage /></Suspense>} />
            <Route path="audit/commonality" element={<Suspense fallback={<PageLoader />}><CommonalityStudyPage /></Suspense>} />
            <Route path="help" element={<Suspense fallback={<PageLoader />}><HelpCenterPage /></Suspense>} />
            <Route path="help/getting-started" element={<Suspense fallback={<PageLoader />}><GettingStartedPage /></Suspense>} />
            <Route path="help/faq" element={<Suspense fallback={<PageLoader />}><FAQPage /></Suspense>} />
            <Route path="help/modules" element={<Suspense fallback={<PageLoader />}><ModuleGuidesPage /></Suspense>} />
            <Route path="help/modules/:moduleId" element={<Suspense fallback={<PageLoader />}><ModuleGuidesPage /></Suspense>} />
            <Route path="settings" element={<Suspense fallback={<PageLoader />}><SettingsPage /></Suspense>} />
            <Route path="settings/modules" element={<Suspense fallback={<PageLoader />}><ModulesSettingsPage /></Suspense>} />
            <Route path="recipes" element={<Suspense fallback={<PageLoader />}><RecipesPage /></Suspense>} />
            <Route path="recipes/new" element={<Suspense fallback={<PageLoader />}><RecipeFormPage /></Suspense>} />
            <Route path="recipes/:id" element={<Suspense fallback={<PageLoader />}><RecipeFormPage /></Suspense>} />
            <Route path="recipes/:id/edit" element={<Suspense fallback={<PageLoader />}><RecipeFormPage /></Suspense>} />
            <Route path="traceability" element={<Suspense fallback={<PageLoader />}><TraceabilityPage /></Suspense>} />
            <Route path="payroll" element={<Suspense fallback={<PageLoader />}><PayrollPage /></Suspense>} />
            <Route path="integrations" element={<Suspense fallback={<PageLoader />}><IntegrationsPage /></Suspense>} />
            <Route path="profile" element={<Suspense fallback={<PageLoader />}><ProfilePage /></Suspense>} />
            {/* Dialyse (Healthcare - Dialysis module) */}
            <Route path="dialyse" element={<Suspense fallback={<PageLoader />}><DialyseDashboardPage /></Suspense>} />
            <Route path="dialyse/patients" element={<Suspense fallback={<PageLoader />}><DialysePatientsPage /></Suspense>} />
            <Route path="dialyse/patients/new" element={<Suspense fallback={<PageLoader />}><DialysePatientFormPage /></Suspense>} />
            <Route path="dialyse/patients/:id" element={<Suspense fallback={<PageLoader />}><DialysePatientDetailPage /></Suspense>} />
            <Route path="dialyse/patients/:id/edit" element={<Suspense fallback={<PageLoader />}><DialysePatientFormPage /></Suspense>} />
            <Route path="dialyse/planning" element={<Suspense fallback={<PageLoader />}><DialysePlanningPage /></Suspense>} />
            <Route path="dialyse/machines" element={<Suspense fallback={<PageLoader />}><DialyseMachinesPage /></Suspense>} />
            <Route path="dialyse/alerts" element={<Suspense fallback={<PageLoader />}><DialyseAlertsPage /></Suspense>} />
            <Route path="dialyse/alerts/:id" element={<Suspense fallback={<PageLoader />}><DialyseAlertDetailPage /></Suspense>} />
            <Route path="dialyse/sessions/new" element={<Suspense fallback={<PageLoader />}><DialyseSessionFormPage /></Suspense>} />
            <Route path="dialyse/sessions/:id" element={<Suspense fallback={<PageLoader />}><DialyseSessionDetailPage /></Suspense>} />
            <Route path="dialyse/prescriptions/new" element={<Suspense fallback={<PageLoader />}><DialysePrescriptionFormPage /></Suspense>} />
            <Route path="dialyse/prescriptions/:id/edit" element={<Suspense fallback={<PageLoader />}><DialysePrescriptionFormPage /></Suspense>} />
            <Route path="dialyse/lab-results/new" element={<Suspense fallback={<PageLoader />}><DialyseLabResultFormPage /></Suspense>} />
            <Route path="dialyse/lab-results/:id/edit" element={<Suspense fallback={<PageLoader />}><DialyseLabResultFormPage /></Suspense>} />
            <Route path="dialyse/vascular-accesses/new" element={<Suspense fallback={<PageLoader />}><DialyseVascularAccessFormPage /></Suspense>} />
            <Route path="dialyse/vascular-accesses/:id/edit" element={<Suspense fallback={<PageLoader />}><DialyseVascularAccessFormPage /></Suspense>} />
            <Route path="dialyse/slots" element={<Suspense fallback={<PageLoader />}><DialyseSlotsPage /></Suspense>} />
            <Route path="dialyse/reports" element={<Suspense fallback={<PageLoader />}><DialyseReportsPage /></Suspense>} />
            <Route path="dialyse/consumables" element={<Suspense fallback={<PageLoader />}><DialyseConsumablesPage /></Suspense>} />
            <Route path="dialyse/maintenance" element={<Suspense fallback={<PageLoader />}><DialyseMaintenancePage /></Suspense>} />
            <Route path="dialyse/protocols" element={<Suspense fallback={<PageLoader />}><DialyseProtocolsPage /></Suspense>} />
            <Route path="dialyse/staff" element={<Suspense fallback={<PageLoader />}><DialyseStaffPage /></Suspense>} />
            <Route path="dialyse/billing" element={<Suspense fallback={<PageLoader />}><DialyseBillingPage /></Suspense>} />
            <Route path="dialyse/transport" element={<Suspense fallback={<PageLoader />}><DialyseTransportPage /></Suspense>} />
            {/* Dialyse Form pages (dedicated pages instead of modals) */}
            <Route path="dialyse/machines/new" element={<Suspense fallback={<PageLoader />}><DialyseMachineFormPage /></Suspense>} />
            <Route path="dialyse/machines/:id/edit" element={<Suspense fallback={<PageLoader />}><DialyseMachineFormPage /></Suspense>} />
            <Route path="dialyse/consumables/new" element={<Suspense fallback={<PageLoader />}><DialyseConsumableFormPage /></Suspense>} />
            <Route path="dialyse/consumables/:id/edit" element={<Suspense fallback={<PageLoader />}><DialyseConsumableFormPage /></Suspense>} />
            <Route path="dialyse/maintenance/new" element={<Suspense fallback={<PageLoader />}><DialyseMaintenanceFormPage /></Suspense>} />
            <Route path="dialyse/maintenance/:id/edit" element={<Suspense fallback={<PageLoader />}><DialyseMaintenanceFormPage /></Suspense>} />
            <Route path="dialyse/protocols/new" element={<Suspense fallback={<PageLoader />}><DialyseProtocolFormPage /></Suspense>} />
            <Route path="dialyse/protocols/:id/edit" element={<Suspense fallback={<PageLoader />}><DialyseProtocolFormPage /></Suspense>} />
            <Route path="dialyse/staff/new" element={<Suspense fallback={<PageLoader />}><DialyseStaffFormPage /></Suspense>} />
            <Route path="dialyse/staff/:id/edit" element={<Suspense fallback={<PageLoader />}><DialyseStaffFormPage /></Suspense>} />
            <Route path="dialyse/billing/new" element={<Suspense fallback={<PageLoader />}><DialyseBillingFormPage /></Suspense>} />
            <Route path="dialyse/billing/:id/edit" element={<Suspense fallback={<PageLoader />}><DialyseBillingFormPage /></Suspense>} />
            <Route path="dialyse/transport/new" element={<Suspense fallback={<PageLoader />}><DialyseTransportFormPage /></Suspense>} />
            <Route path="dialyse/transport/:id/edit" element={<Suspense fallback={<PageLoader />}><DialyseTransportFormPage /></Suspense>} />
            {/* Cardiology (Healthcare - Cardiology module) */}
            <Route path="cardiology" element={<Suspense fallback={<PageLoader />}><CardiologyDashboardPage /></Suspense>} />
            <Route path="cardiology/patients" element={<Suspense fallback={<PageLoader />}><CardiologyPatientsPage /></Suspense>} />
            <Route path="cardiology/patients/new" element={<Suspense fallback={<PageLoader />}><CardiologyPatientFormPage /></Suspense>} />
            <Route path="cardiology/patients/:id" element={<Suspense fallback={<PageLoader />}><CardiologyPatientDetailPage /></Suspense>} />
            <Route path="cardiology/patients/:id/edit" element={<Suspense fallback={<PageLoader />}><CardiologyPatientFormPage /></Suspense>} />
            <Route path="cardiology/consultations" element={<Suspense fallback={<PageLoader />}><CardiologyConsultationsPage /></Suspense>} />
            <Route path="cardiology/consultations/new" element={<Suspense fallback={<PageLoader />}><CardiologyConsultationFormPage /></Suspense>} />
            <Route path="cardiology/consultations/:id/edit" element={<Suspense fallback={<PageLoader />}><CardiologyConsultationFormPage /></Suspense>} />
            <Route path="cardiology/ecg" element={<Suspense fallback={<PageLoader />}><CardiologyEcgPage /></Suspense>} />
            <Route path="cardiology/ecg/new" element={<Suspense fallback={<PageLoader />}><CardiologyEcgFormPage /></Suspense>} />
            <Route path="cardiology/ecg/:id/edit" element={<Suspense fallback={<PageLoader />}><CardiologyEcgFormPage /></Suspense>} />
            <Route path="cardiology/echo" element={<Suspense fallback={<PageLoader />}><CardiologyEchoPage /></Suspense>} />
            <Route path="cardiology/echo/new" element={<Suspense fallback={<PageLoader />}><CardiologyEchoFormPage /></Suspense>} />
            <Route path="cardiology/echo/:id/edit" element={<Suspense fallback={<PageLoader />}><CardiologyEchoFormPage /></Suspense>} />
            <Route path="cardiology/pacemakers" element={<Suspense fallback={<PageLoader />}><CardiologyPacemakersPage /></Suspense>} />
            <Route path="cardiology/pacemakers/new" element={<Suspense fallback={<PageLoader />}><CardiologyPacemakerFormPage /></Suspense>} />
            <Route path="cardiology/pacemakers/:id/edit" element={<Suspense fallback={<PageLoader />}><CardiologyPacemakerFormPage /></Suspense>} />
            <Route path="cardiology/stents" element={<Suspense fallback={<PageLoader />}><CardiologyStentsPage /></Suspense>} />
            <Route path="cardiology/stents/new" element={<Suspense fallback={<PageLoader />}><CardiologyStentFormPage /></Suspense>} />
            <Route path="cardiology/stents/:id/edit" element={<Suspense fallback={<PageLoader />}><CardiologyStentFormPage /></Suspense>} />
            <Route path="cardiology/risk-scores" element={<Suspense fallback={<PageLoader />}><CardiologyRiskScoresPage /></Suspense>} />
            <Route path="cardiology/risk-scores/new" element={<Suspense fallback={<PageLoader />}><CardiologyRiskScoresFormPage /></Suspense>} />
            <Route path="cardiology/risk-scores/:id/edit" element={<Suspense fallback={<PageLoader />}><CardiologyRiskScoresFormPage /></Suspense>} />
            <Route path="cardiology/medications" element={<Suspense fallback={<PageLoader />}><CardiologyMedicationsPage /></Suspense>} />
            <Route path="cardiology/medications/new" element={<Suspense fallback={<PageLoader />}><CardiologyMedicationsFormPage /></Suspense>} />
            <Route path="cardiology/medications/:id/edit" element={<Suspense fallback={<PageLoader />}><CardiologyMedicationsFormPage /></Suspense>} />
            <Route path="cardiology/events" element={<Suspense fallback={<PageLoader />}><CardiologyEventsPage /></Suspense>} />
            <Route path="cardiology/events/new" element={<Suspense fallback={<PageLoader />}><CardiologyEventsFormPage /></Suspense>} />
            <Route path="cardiology/events/:id/edit" element={<Suspense fallback={<PageLoader />}><CardiologyEventsFormPage /></Suspense>} />
            <Route path="cardiology/alerts" element={<Suspense fallback={<PageLoader />}><CardiologyAlertsPage /></Suspense>} />
            <Route path="cardiology/appointments" element={<Suspense fallback={<PageLoader />}><CardiologyAppointmentsPage /></Suspense>} />
            <Route path="cardiology/appointments/new" element={<Suspense fallback={<PageLoader />}><CardiologyAppointmentsFormPage /></Suspense>} />
            <Route path="cardiology/appointments/:id/edit" element={<Suspense fallback={<PageLoader />}><CardiologyAppointmentsFormPage /></Suspense>} />
            <Route path="cardiology/reports" element={<Suspense fallback={<PageLoader />}><CardiologyReportsPage /></Suspense>} />
            {/* Ophthalmology (Healthcare - Ophthalmology module) */}
            <Route path="ophthalmology" element={<Suspense fallback={<PageLoader />}><OphthalmologyDashboardPage /></Suspense>} />
            <Route path="ophthalmology/patients" element={<Suspense fallback={<PageLoader />}><OphthalmologyPatientsPage /></Suspense>} />
            <Route path="ophthalmology/patients/new" element={<Suspense fallback={<PageLoader />}><OphthalmologyPatientFormPage /></Suspense>} />
            <Route path="ophthalmology/patients/:id" element={<Suspense fallback={<PageLoader />}><OphthalmologyPatientDetailPage /></Suspense>} />
            <Route path="ophthalmology/patients/:id/edit" element={<Suspense fallback={<PageLoader />}><OphthalmologyPatientFormPage /></Suspense>} />
            <Route path="ophthalmology/consultations" element={<Suspense fallback={<PageLoader />}><OphthalmologyConsultationsPage /></Suspense>} />
            <Route path="ophthalmology/consultations/new" element={<Suspense fallback={<PageLoader />}><OphthalmologyConsultationFormPage /></Suspense>} />
            <Route path="ophthalmology/consultations/:id/edit" element={<Suspense fallback={<PageLoader />}><OphthalmologyConsultationFormPage /></Suspense>} />
            <Route path="ophthalmology/oct" element={<Suspense fallback={<PageLoader />}><OphthalmologyOctPage /></Suspense>} />
            <Route path="ophthalmology/oct/new" element={<Suspense fallback={<PageLoader />}><OphthalmologyOctFormPage /></Suspense>} />
            <Route path="ophthalmology/oct/:id/edit" element={<Suspense fallback={<PageLoader />}><OphthalmologyOctFormPage /></Suspense>} />
            <Route path="ophthalmology/visual-fields" element={<Suspense fallback={<PageLoader />}><OphthalmologyVisualFieldsPage /></Suspense>} />
            <Route path="ophthalmology/visual-fields/new" element={<Suspense fallback={<PageLoader />}><OphthalmologyVisualFieldsFormPage /></Suspense>} />
            <Route path="ophthalmology/visual-fields/:id/edit" element={<Suspense fallback={<PageLoader />}><OphthalmologyVisualFieldsFormPage /></Suspense>} />
            <Route path="ophthalmology/ivt-injections" element={<Suspense fallback={<PageLoader />}><OphthalmologyIvtPage /></Suspense>} />
            <Route path="ophthalmology/ivt-injections/new" element={<Suspense fallback={<PageLoader />}><OphthalmologyIvtFormPage /></Suspense>} />
            <Route path="ophthalmology/ivt-injections/:id/edit" element={<Suspense fallback={<PageLoader />}><OphthalmologyIvtFormPage /></Suspense>} />
            <Route path="ophthalmology/biometry" element={<Suspense fallback={<PageLoader />}><OphthalmologyBiometryPage /></Suspense>} />
            <Route path="ophthalmology/biometry/new" element={<Suspense fallback={<PageLoader />}><OphthalmologyBiometryFormPage /></Suspense>} />
            <Route path="ophthalmology/biometry/:id/edit" element={<Suspense fallback={<PageLoader />}><OphthalmologyBiometryFormPage /></Suspense>} />
            <Route path="ophthalmology/iol-implants" element={<Suspense fallback={<PageLoader />}><OphthalmologyIolImplantsPage /></Suspense>} />
            <Route path="ophthalmology/iol-implants/new" element={<Suspense fallback={<PageLoader />}><OphthalmologyIolImplantsFormPage /></Suspense>} />
            <Route path="ophthalmology/iol-implants/:id/edit" element={<Suspense fallback={<PageLoader />}><OphthalmologyIolImplantsFormPage /></Suspense>} />
            <Route path="ophthalmology/surgeries" element={<Suspense fallback={<PageLoader />}><OphthalmologySurgeriesPage /></Suspense>} />
            <Route path="ophthalmology/surgeries/new" element={<Suspense fallback={<PageLoader />}><OphthalmologySurgeryFormPage /></Suspense>} />
            <Route path="ophthalmology/surgeries/:id/edit" element={<Suspense fallback={<PageLoader />}><OphthalmologySurgeryFormPage /></Suspense>} />
            <Route path="ophthalmology/refraction" element={<Suspense fallback={<PageLoader />}><OphthalmologyRefractionPage /></Suspense>} />
            <Route path="ophthalmology/refraction/new" element={<Suspense fallback={<PageLoader />}><OphthalmologyRefractionFormPage /></Suspense>} />
            <Route path="ophthalmology/refraction/:id/edit" element={<Suspense fallback={<PageLoader />}><OphthalmologyRefractionFormPage /></Suspense>} />
            <Route path="ophthalmology/tonometry" element={<Suspense fallback={<PageLoader />}><OphthalmologyTonometryPage /></Suspense>} />
            <Route path="ophthalmology/tonometry/new" element={<Suspense fallback={<PageLoader />}><OphthalmologyTonometryFormPage /></Suspense>} />
            <Route path="ophthalmology/tonometry/:id/edit" element={<Suspense fallback={<PageLoader />}><OphthalmologyTonometryFormPage /></Suspense>} />
            <Route path="ophthalmology/osdi-scores" element={<Suspense fallback={<PageLoader />}><OphthalmologyOsdiPage /></Suspense>} />
            <Route path="ophthalmology/osdi-scores/new" element={<Suspense fallback={<PageLoader />}><OphthalmologyOsdiFormPage /></Suspense>} />
            <Route path="ophthalmology/osdi-scores/:id/edit" element={<Suspense fallback={<PageLoader />}><OphthalmologyOsdiFormPage /></Suspense>} />
            <Route path="ophthalmology/alerts" element={<Suspense fallback={<PageLoader />}><OphthalmologyAlertsPage /></Suspense>} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          </BrowserRouter>
          </ToastProvider>
        </LanguageProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
