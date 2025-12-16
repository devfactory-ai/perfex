/**
 * Dashboard Page
 * Main dashboard with key metrics and quick actions
 */

import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { api, type ApiResponse } from '@/lib/api';
import type { Invoice, Company, Contact, Opportunity } from '@perfex/shared';

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
