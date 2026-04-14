/**
 * Route Registry - Bakery-focused app routes
 *
 * This file uses compile-time feature flags (__FEATURE_*) defined in vite.config.ts
 * to enable proper tree-shaking. Disabled modules are completely excluded from the build.
 */

import { lazy, ComponentType } from 'react';

// Declare feature flags (set by Vite at build time)
declare const __FEATURE_BAKERY__: boolean;
declare const __FEATURE_FINANCE__: boolean;
declare const __FEATURE_HR__: boolean;
declare const __FEATURE_INVENTORY__: boolean;

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
] : [];
export const hrRoutes = hrRoutesDef;

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
// ALL ROUTES COMBINED
// ============================================
export const allRoutes: RouteConfig[] = [
  ...commonRoutes,
  ...financeRoutes,
  ...inventoryRoutes,
  ...hrRoutes,
  ...bakeryRoutes,
];

// Export variant info for debugging
export const routeInfo = {
  variant: VARIANT,
  totalRoutes: allRoutes.length,
};
