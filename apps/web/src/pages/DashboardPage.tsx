/**
 * Dashboard Page
 * Main dashboard with key metrics and quick actions
 */

import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { api, type ApiResponse } from '@/lib/api';
import type { Invoice, Company, Contact, Opportunity, InventoryItem } from '@perfex/shared';

export function DashboardPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  // Fetch invoices for metrics
  const { data: invoices } = useQuery({
    queryKey: ['invoices'],
    queryFn: async () => {
      const response = await api.get<ApiResponse<Invoice[]>>('/invoices');
      return response.data.data;
    },
  });

  // Fetch companies
  const { data: companies } = useQuery({
    queryKey: ['companies'],
    queryFn: async () => {
      const response = await api.get<ApiResponse<Company[]>>('/companies');
      return response.data.data;
    },
  });

  // Fetch contacts
  const { data: contacts } = useQuery({
    queryKey: ['contacts'],
    queryFn: async () => {
      const response = await api.get<ApiResponse<Contact[]>>('/contacts');
      return response.data.data;
    },
  });

  // Fetch opportunities
  const { data: opportunities } = useQuery({
    queryKey: ['opportunities'],
    queryFn: async () => {
      const response = await api.get<ApiResponse<Opportunity[]>>('/opportunities?status=open');
      return response.data.data;
    },
  });

  // Fetch inventory stats
  const { data: inventoryStats } = useQuery({
    queryKey: ['inventory-stats'],
    queryFn: async () => {
      const response = await api.get<ApiResponse<{
        totalItems: number;
        activeItems: number;
        totalWarehouses: number;
        lowStockItems: number;
      }>>('/inventory/items/stats');
      return response.data.data;
    },
  });

  // Fetch inventory items for low stock alerts
  const { data: inventoryItems } = useQuery({
    queryKey: ['inventory-items'],
    queryFn: async () => {
      const response = await api.get<ApiResponse<InventoryItem[]>>('/inventory/items');
      return response.data.data;
    },
  });

  // Calculate metrics
  const totalRevenue = invoices?.reduce((sum, inv) => {
    if (inv.status === 'paid') {
      return sum + inv.total;
    }
    return sum;
  }, 0) || 0;

  const unpaidInvoices = invoices?.filter(inv =>
    inv.status === 'sent' || inv.status === 'overdue'
  ).length || 0;

  const activeCompanies = companies?.filter(c => c.status === 'active').length || 0;

  const pipelineValue = opportunities?.reduce((sum, opp) => sum + opp.value, 0) || 0;

  // Get recent invoices
  const recentInvoices = invoices?.slice(0, 5) || [];

  // Calculate inventory metrics
  const rawMaterials = inventoryItems?.filter(item => item.category === 'raw_material') || [];
  const finishedProducts = inventoryItems?.filter(item => item.category === 'finished_product') || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('nav.dashboard')}</h1>
        <p className="text-muted-foreground">
          {t('dashboard.welcomeBack')}, {user?.firstName || t('common.user')}!
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <div className="flex flex-col space-y-1.5">
            <h3 className="font-semibold tracking-tight text-sm text-muted-foreground">
              {t('dashboard.totalRevenue')}
            </h3>
            <p className="text-2xl font-bold">€{totalRevenue.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">
              {t('dashboard.fromPaidInvoices').replace('{count}', String(invoices?.filter(i => i.status === 'paid').length || 0))}
            </p>
          </div>
        </div>

        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <div className="flex flex-col space-y-1.5">
            <h3 className="font-semibold tracking-tight text-sm text-muted-foreground">
              {t('dashboard.unpaidInvoices')}
            </h3>
            <p className="text-2xl font-bold">{unpaidInvoices}</p>
            <p className="text-xs text-muted-foreground">
              {invoices?.filter(i => i.status === 'overdue').length || 0} {t('dashboard.overdue')}
            </p>
          </div>
        </div>

        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <div className="flex flex-col space-y-1.5">
            <h3 className="font-semibold tracking-tight text-sm text-muted-foreground">
              {t('dashboard.activeCompanies')}
            </h3>
            <p className="text-2xl font-bold">{activeCompanies}</p>
            <p className="text-xs text-muted-foreground">
              {contacts?.length || 0} {t('dashboard.totalContacts')}
            </p>
          </div>
        </div>

        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <div className="flex flex-col space-y-1.5">
            <h3 className="font-semibold tracking-tight text-sm text-muted-foreground">
              {t('dashboard.openPipeline')}
            </h3>
            <p className="text-2xl font-bold">€{pipelineValue.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">
              {opportunities?.length || 0} {t('dashboard.opportunities')}
            </p>
          </div>
        </div>
      </div>

      {/* Bakery / Inventory Section */}
      <div className="rounded-lg border bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <span>🥖</span> {t('bakery.management')}
          </h2>
          <button
            onClick={() => navigate('/help/workflow')}
            className="text-sm text-primary hover:underline flex items-center gap-1"
          >
            <span>📋</span> {t('common.guide')} Workflow
          </button>
        </div>

        {/* Inventory Stats */}
        <div className="grid gap-4 md:grid-cols-4 mb-6">
          <div className="rounded-lg border bg-white dark:bg-card p-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">📦</span>
              <div>
                <p className="text-sm text-muted-foreground">{t('bakery.rawMaterials')}</p>
                <p className="text-xl font-bold">{rawMaterials.length}</p>
              </div>
            </div>
          </div>
          <div className="rounded-lg border bg-white dark:bg-card p-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🥐</span>
              <div>
                <p className="text-sm text-muted-foreground">{t('bakery.finishedProducts')}</p>
                <p className="text-xl font-bold">{finishedProducts.length}</p>
              </div>
            </div>
          </div>
          <div className="rounded-lg border bg-white dark:bg-card p-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">📊</span>
              <div>
                <p className="text-sm text-muted-foreground">{t('inventory.totalItems')}</p>
                <p className="text-xl font-bold">{inventoryStats?.totalItems || inventoryItems?.length || 0}</p>
              </div>
            </div>
          </div>
          <div className="rounded-lg border bg-white dark:bg-card p-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">⚠️</span>
              <div>
                <p className="text-sm text-muted-foreground">{t('inventory.lowStock')}</p>
                <p className="text-xl font-bold text-orange-600">{inventoryStats?.lowStockItems || 0}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions for Bakery */}
        <div className="grid gap-3 md:grid-cols-4">
          <button
            onClick={() => navigate('/inventory')}
            className="flex items-center justify-center gap-2 rounded-md bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 px-4 py-3 text-sm font-medium hover:bg-amber-200 dark:hover:bg-amber-900/50 transition-colors"
          >
            <span>📦</span> {t('common.viewStock')}
          </button>
          <button
            onClick={() => navigate('/recipes')}
            className="flex items-center justify-center gap-2 rounded-md bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 px-4 py-3 text-sm font-medium hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors"
          >
            <span>📋</span> {t('bakery.recipes')}
          </button>
          <button
            onClick={() => navigate('/manufacturing/work-orders')}
            className="flex items-center justify-center gap-2 rounded-md bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 px-4 py-3 text-sm font-medium hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
          >
            <span>🏭</span> {t('bakery.production')}
          </button>
          <button
            onClick={() => navigate('/procurement/suppliers')}
            className="flex items-center justify-center gap-2 rounded-md bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 px-4 py-3 text-sm font-medium hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
          >
            <span>🚚</span> {t('procurement.suppliers')}
          </button>
        </div>

        {/* Low Stock Alert */}
        {(inventoryStats?.lowStockItems || 0) > 0 && (
          <div className="mt-4 rounded-lg border border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-950/30 p-4">
            <h3 className="font-semibold text-orange-800 dark:text-orange-200 flex items-center gap-2 mb-2">
              <span>⚠️</span> {t('dashboard.lowStockAlerts')}
            </h3>
            <p className="text-sm text-orange-700 dark:text-orange-300 mb-2">
              {t('dashboard.lowStockMessage').replace('{count}', String(inventoryStats?.lowStockItems || 0))}
            </p>
            <button
              onClick={() => navigate('/inventory')}
              className="text-sm text-orange-700 dark:text-orange-300 hover:underline font-medium"
            >
              {t('dashboard.viewStockAndOrder')} →
            </button>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="rounded-lg border bg-card p-6 shadow-sm">
        <h2 className="text-xl font-semibold mb-4">{t('dashboard.quickActions')}</h2>
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
          <button
            onClick={() => navigate('/finance/invoices/new')}
            className="flex items-center justify-center gap-2 rounded-md border border-input bg-background px-4 py-3 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            {t('dashboard.createInvoice')}
          </button>
          <button
            onClick={() => navigate('/crm/companies')}
            className="flex items-center justify-center gap-2 rounded-md border border-input bg-background px-4 py-3 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            {t('dashboard.addCompany')}
          </button>
          <button
            onClick={() => navigate('/crm/contacts')}
            className="flex items-center justify-center gap-2 rounded-md border border-input bg-background px-4 py-3 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            {t('dashboard.addContact')}
          </button>
          <button
            onClick={() => navigate('/crm/pipeline')}
            className="flex items-center justify-center gap-2 rounded-md border border-input bg-background px-4 py-3 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            {t('dashboard.newOpportunity')}
          </button>
        </div>
      </div>

      {/* Recent Invoices */}
      {recentInvoices.length > 0 && (
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">{t('dashboard.recentInvoices')}</h2>
            <button
              onClick={() => navigate('/finance/invoices')}
              className="text-sm text-primary hover:underline"
            >
              {t('common.viewAll')}
            </button>
          </div>
          <div className="space-y-3">
            {recentInvoices.map((invoice) => (
              <div
                key={invoice.id}
                className="flex items-center justify-between py-3 border-b last:border-0 cursor-pointer hover:bg-accent/50 px-2 rounded"
                onClick={() => navigate(`/finance/invoices/${invoice.id}`)}
              >
                <div className="flex-1">
                  <p className="font-medium">{invoice.number}</p>
                  <p className="text-sm text-muted-foreground">{invoice.customerName}</p>
                </div>
                <div className="text-right mr-4">
                  <p className="font-medium">€{invoice.total.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">
                    {t('dashboard.dueDate')}: {new Date(invoice.dueDate).toLocaleDateString()}
                  </p>
                </div>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  invoice.status === 'paid' ? 'bg-green-100 text-green-800' :
                  invoice.status === 'sent' ? 'bg-blue-100 text-blue-800' :
                  invoice.status === 'overdue' ? 'bg-red-100 text-red-800' :
                  invoice.status === 'cancelled' ? 'bg-gray-100 text-gray-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {t(`finance.${invoice.status}`)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!invoices?.length && !companies?.length && !contacts?.length && (
        <div className="rounded-lg border bg-card p-12 shadow-sm text-center">
          <h2 className="text-xl font-semibold mb-2">{t('dashboard.getStarted')}</h2>
          <p className="text-muted-foreground mb-6">
            {t('dashboard.getStartedDescription')}
          </p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => navigate('/crm/companies')}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              {t('dashboard.addCompany')}
            </button>
            <button
              onClick={() => navigate('/finance/invoices/new')}
              className="rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent"
            >
              {t('dashboard.createInvoice')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
