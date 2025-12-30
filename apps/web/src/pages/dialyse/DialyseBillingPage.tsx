/**
 * Dialyse Billing Page
 * Manage billing for dialysis sessions
 */

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, getErrorMessage, type ApiResponse } from '@/lib/api';
import { EmptyState } from '@/components/EmptyState';
import { Pagination } from '@/components/Pagination';
import { Eye, Pencil, Trash2, Plus, CreditCard } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { PageHeader, Button, StatsCard, SectionCard, InlineLoading } from '@/components/healthcare';

// API returns snake_case - we map it in the query
interface BillingRecordApi {
  id: string;
  invoice_number: string;
  patient_id: string;
  patient_medical_id: string;
  patient_first_name: string;
  patient_last_name: string;
  session_id: string | null;
  status: string;
  billing_type: string;
  amount: number;
  insurance_amount: number;
  patient_amount: number;
  insurance_provider: string | null;
  insurance_policy_number: string | null;
  paid_amount: number;
  paid_date: number | null;
  billing_date: number;
  session_date: number;
  line_items: string | null;
  notes: string | null;
  created_at: number;
}

interface BillingRecord {
  id: string;
  invoiceNumber: string;
  patientId: string;
  patientMedicalId: string;
  patientFirstName: string;
  patientLastName: string;
  sessionId: string | null;
  status: 'draft' | 'pending' | 'submitted' | 'approved' | 'rejected' | 'paid';
  billingType: 'session' | 'monthly' | 'package' | 'other';
  insuranceProvider: string | null;
  insurancePolicyNumber: string | null;
  // Amounts
  totalAmount: number;
  insuranceCoverage: number;
  patientResponsibility: number;
  paidAmount: number;
  // For backwards compatibility
  baseAmount: number;
  consumablesAmount: number;
  medicationsAmount: number;
  additionalCharges: number;
  discountAmount: number;
  // Dates
  serviceDate: string;
  billingDate: string;
  paidDate: string | null;
  // Items
  lineItems: BillingLineItem[];
  notes: string | null;
  createdAt: string;
}

interface BillingLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  category: 'session' | 'consumable' | 'medication' | 'service' | 'other';
  code: string | null;
}

interface BillingStats {
  total: number;
  draft: number;
  pending: number;
  submitted: number;
  paid: number;
  totalBilled: number;
  totalPaid: number;
  totalOutstanding: number;
  thisMonth: number;
}

export function DialyseBillingPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const toast = useToast();
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<'all' | 'today' | 'week' | 'month'>('month');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [viewingBilling, setViewingBilling] = useState<BillingRecord | null>(null);

  // Transform API response to frontend format
  const transformBillingRecord = (record: BillingRecordApi): BillingRecord => {
    let lineItems: BillingLineItem[] = [];
    try {
      if (record.line_items) {
        const parsed = JSON.parse(record.line_items);
        lineItems = Array.isArray(parsed) ? parsed.map((item: any) => ({
          description: item.description || '',
          quantity: item.qty || item.quantity || 1,
          unitPrice: item.price || item.unitPrice || 0,
          totalPrice: (item.qty || item.quantity || 1) * (item.price || item.unitPrice || 0),
          category: item.category || 'session',
          code: item.code || null,
        })) : [];
      }
    } catch (e) {
      console.warn('Failed to parse line_items:', e);
    }

    return {
      id: record.id,
      invoiceNumber: record.invoice_number,
      patientId: record.patient_id,
      patientMedicalId: record.patient_medical_id || '',
      patientFirstName: record.patient_first_name || '',
      patientLastName: record.patient_last_name || '',
      sessionId: record.session_id,
      status: (record.status as BillingRecord['status']) || 'pending',
      billingType: (record.billing_type as BillingRecord['billingType']) || 'session',
      insuranceProvider: record.insurance_provider,
      insurancePolicyNumber: record.insurance_policy_number,
      totalAmount: record.amount || 0,
      insuranceCoverage: record.insurance_amount || 0,
      patientResponsibility: record.patient_amount || 0,
      paidAmount: record.paid_amount || 0,
      baseAmount: record.amount || 0,
      consumablesAmount: 0,
      medicationsAmount: 0,
      additionalCharges: 0,
      discountAmount: 0,
      serviceDate: record.session_date ? new Date(record.session_date).toISOString() : '',
      billingDate: record.billing_date ? new Date(record.billing_date).toISOString() : '',
      paidDate: record.paid_date ? new Date(record.paid_date).toISOString() : null,
      lineItems,
      notes: record.notes,
      createdAt: record.created_at ? new Date(record.created_at).toISOString() : '',
    };
  };

  // Fetch billing records
  const { data: response, isLoading, error } = useQuery({
    queryKey: ['dialyse-billing', searchTerm, statusFilter, typeFilter, dateRange, currentPage, itemsPerPage],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (typeFilter !== 'all') params.append('type', typeFilter);
      if (dateRange !== 'all') params.append('dateRange', dateRange);
      params.append('offset', ((currentPage - 1) * itemsPerPage).toString());
      params.append('limit', itemsPerPage.toString());

      const url = `/dialyse/billing${params.toString() ? `?${params.toString()}` : ''}`;
      const result = await api.get<{ success: boolean; data: BillingRecordApi[]; meta?: any }>(url);

      // Transform API response
      const transformedData = (result.data.data || []).map(transformBillingRecord);
      return { data: transformedData, meta: result.data.meta };
    },
  });

  // Fetch stats
  const { data: stats } = useQuery({
    queryKey: ['dialyse-billing-stats'],
    queryFn: async () => {
      const response = await api.get<ApiResponse<BillingStats>>('/dialyse/billing/stats');
      return response.data.data;
    },
  });

  // Delete billing mutation
  const deleteBilling = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/dialyse/billing/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dialyse-billing'] });
      queryClient.invalidateQueries({ queryKey: ['dialyse-billing-stats'] });
      toast.success(t('dialyse.invoiceDeleted'));
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  // Mark as paid mutation
  const markAsPaid = useMutation({
    mutationFn: async ({ id, paidAmount }: { id: string; paidAmount: number }) => {
      await api.post(`/dialyse/billing/${id}/pay`, { paidAmount, paidDate: new Date().toISOString() });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dialyse-billing'] });
      queryClient.invalidateQueries({ queryKey: ['dialyse-billing-stats'] });
      toast.success(t('dialyse.paymentRecorded'));
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  const handleAddBilling = () => {
    navigate('/dialyse/billing/new');
  };

  const handleEditBilling = (billing: BillingRecord) => {
    navigate(`/dialyse/billing/${billing.id}/edit`);
  };

  const handleViewBilling = (billing: BillingRecord) => {
    setViewingBilling(billing);
  };

  const handleDelete = (id: string, invoiceNumber: string) => {
    if (confirm(`${t('dialyse.confirmDeleteInvoice')} "${invoiceNumber}" ?`)) {
      deleteBilling.mutate(id);
    }
  };

  const handleMarkAsPaid = (billing: BillingRecord) => {
    const outstanding = billing.totalAmount - billing.paidAmount;
    const amount = prompt(`${t('dialyse.enterPaidAmount')} (${t('dialyse.remainingDue')}: ${formatCurrency(outstanding)}):`, outstanding.toString());
    if (amount !== null) {
      const paidAmount = parseFloat(amount);
      if (!isNaN(paidAmount) && paidAmount > 0) {
        markAsPaid.mutate({ id: billing.id, paidAmount: billing.paidAmount + paidAmount });
      }
    }
  };

  // Calculate paginated data
  const paginatedBilling = useMemo(() => {
    const items = response?.data || [];
    const total = response?.meta?.total || 0;
    const totalPages = Math.ceil(total / itemsPerPage);
    return { data: items, total, totalPages };
  }, [response, itemsPerPage]);

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      draft: 'bg-muted text-muted-foreground',
      pending: 'bg-muted text-foreground',
      submitted: 'bg-muted/70 text-foreground',
      approved: 'bg-muted/50 text-foreground',
      rejected: 'bg-muted text-muted-foreground',
      paid: 'bg-muted/60 text-foreground',
    };
    const labels: Record<string, string> = {
      draft: t('dialyse.statusDraft'),
      pending: t('dialyse.statusPending'),
      submitted: t('dialyse.statusSubmitted'),
      approved: t('dialyse.statusApproved'),
      rejected: t('dialyse.statusRejected'),
      paid: t('dialyse.statusPaid'),
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || 'bg-muted text-muted-foreground'}`}>
        {labels[status] || status}
      </span>
    );
  };

  const getTypeBadge = (type: string) => {
    const styles: Record<string, string> = {
      session: 'bg-muted text-foreground',
      monthly: 'bg-muted/70 text-foreground',
      package: 'bg-muted/80 text-foreground',
      other: 'bg-muted text-muted-foreground',
    };
    const labels: Record<string, string> = {
      session: t('dialyse.typeSession'),
      monthly: t('dialyse.typeMonthly'),
      package: t('dialyse.typePackage'),
      other: t('dialyse.typeOther'),
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[type] || 'bg-muted text-muted-foreground'}`}>
        {labels[type] || type}
      </span>
    );
  };

  const formatDate = (date: string | null): string => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('fr-FR');
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount);
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const isOverdue = (billing: BillingRecord): boolean => {
    if (billing.status === 'paid') return false;
    // Consider overdue if unpaid and billing date is more than 30 days ago
    const billingDate = new Date(billing.billingDate);
    const dueDate = new Date(billingDate.getTime() + 30 * 24 * 60 * 60 * 1000);
    return dueDate < new Date() && billing.paidAmount < billing.totalAmount;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title={t('dialyse.billing')}
        description={t('dialyse.billingSubtitle')}
        module="dialyse"
      >
        <Button onClick={handleAddBilling}>
          <Plus className="h-4 w-4" />
          {t('dialyse.newInvoice')}
        </Button>
      </PageHeader>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title={t('dialyse.totalBilled')}
            value={formatCurrency(stats.totalBilled ?? 0)}
            subtitle={`${stats.total ?? 0} ${t('dialyse.invoices')}`}
            module="dialyse"
          />
          <StatsCard
            title={t('dialyse.totalPaid')}
            value={formatCurrency(stats.totalPaid ?? 0)}
            subtitle={`${stats.paid ?? 0} ${t('dialyse.paidInvoices')}`}
            module="dialyse"
          />
          <StatsCard
            title={t('dialyse.outstanding')}
            value={formatCurrency(stats.totalOutstanding ?? 0)}
            subtitle={`${stats.pending ?? 0} ${t('dialyse.pending')}`}
            module="dialyse"
          />
          <StatsCard
            title={t('dialyse.thisMonth')}
            value={stats.thisMonth ?? 0}
            subtitle={t('dialyse.invoicesGenerated')}
            module="dialyse"
          />
        </div>
      )}

      {/* Filters and Search */}
      <div className="flex gap-4 flex-wrap">
        <div className="flex-1 min-w-[200px]">
          <input
            type="text"
            placeholder={t('dialyse.searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="all">{t('dialyse.allStatuses')}</option>
          <option value="draft">{t('dialyse.statusDraft')}</option>
          <option value="pending">{t('dialyse.statusPending')}</option>
          <option value="submitted">{t('dialyse.statusSubmitted')}</option>
          <option value="approved">{t('dialyse.statusApproved')}</option>
          <option value="rejected">{t('dialyse.statusRejected')}</option>
          <option value="paid">{t('dialyse.statusPaid')}</option>
        </select>
        <select
          value={typeFilter}
          onChange={(e) => { setTypeFilter(e.target.value); setCurrentPage(1); }}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="all">{t('dialyse.allTypes')}</option>
          <option value="session">{t('dialyse.typeSession')}</option>
          <option value="monthly">{t('dialyse.typeMonthly')}</option>
          <option value="package">{t('dialyse.typePackage')}</option>
          <option value="other">{t('dialyse.typeOther')}</option>
        </select>
        <select
          value={dateRange}
          onChange={(e) => { setDateRange(e.target.value as typeof dateRange); setCurrentPage(1); }}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="all">{t('dialyse.allDates')}</option>
          <option value="today">{t('dialyse.today')}</option>
          <option value="week">{t('dialyse.thisWeek')}</option>
          <option value="month">{t('dialyse.thisMonth')}</option>
        </select>
      </div>

      {/* Billing List */}
      <SectionCard module="dialyse">
        {isLoading ? (
          <InlineLoading message={t('dialyse.loadingBilling')} />
        ) : error ? (
          <div className="p-12 text-center">
            <p className="text-destructive">{t('dialyse.error')}: {getErrorMessage(error)}</p>
          </div>
        ) : paginatedBilling.data.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b bg-muted/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{t('dialyse.invoiceNumber')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{t('dialyse.patient')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{t('dialyse.type')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{t('dialyse.serviceDate')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{t('dialyse.amount')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{t('dialyse.insurance')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{t('dialyse.status')}</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase">{t('dialyse.actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {paginatedBilling.data.map((billing) => (
                    <tr key={billing.id} className={`hover:bg-muted/50 ${isOverdue(billing) ? 'bg-slate-50 dark:bg-slate-800/30' : ''}`}>
                      <td className="px-6 py-4">
                        <div className="font-mono text-sm font-medium">{billing.invoiceNumber}</div>
                        {billing.sessionId && (
                          <div className="text-xs text-muted-foreground">{t('dialyse.linkedSession')}</div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium">{billing.patientFirstName} {billing.patientLastName}</div>
                        <div className="text-sm text-muted-foreground font-mono">{billing.patientMedicalId}</div>
                      </td>
                      <td className="px-6 py-4">{getTypeBadge(billing.billingType)}</td>
                      <td className="px-6 py-4">
                        <div className="text-sm">{formatDate(billing.serviceDate)}</div>
                        {isOverdue(billing) && (
                          <div className="text-xs text-slate-800 dark:text-slate-300 font-medium">
                            {t('dialyse.overdue')}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium">{formatCurrency(billing.totalAmount)}</div>
                        {billing.paidAmount > 0 && billing.paidAmount < billing.totalAmount && (
                          <div className="text-xs text-muted-foreground">
                            {t('dialyse.paid')}: {formatCurrency(billing.paidAmount)}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {billing.insuranceProvider ? (
                          <div className="text-sm">
                            <div>{billing.insuranceProvider}</div>
                            <div className="text-muted-foreground">{formatCurrency(billing.insuranceCoverage)}</div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4">{getStatusBadge(billing.status)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleViewBilling(billing)}
                            className="p-2 text-muted-foreground hover:text-primary hover:bg-muted rounded-md transition-colors"
                            title={t('dialyse.view')}
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          {billing.status !== 'paid' && (
                            <button
                              onClick={() => handleMarkAsPaid(billing)}
                              className="p-2 text-muted-foreground hover:text-primary hover:bg-muted rounded-md transition-colors"
                              title={t('dialyse.pay')}
                            >
                              <CreditCard className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleEditBilling(billing)}
                            className="p-2 text-muted-foreground hover:text-primary hover:bg-muted rounded-md transition-colors"
                            title={t('dialyse.edit')}
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(billing.id, billing.invoiceNumber)}
                            className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                            title={t('dialyse.delete')}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Pagination
              currentPage={currentPage}
              totalPages={paginatedBilling.totalPages}
              totalItems={paginatedBilling.total}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={setItemsPerPage}
            />
          </>
        ) : (
          <EmptyState
            title={t('dialyse.noBillingFound')}
            description={t('dialyse.createFirstInvoice')}
            icon="invoice"
            action={{
              label: t('dialyse.newInvoice'),
              onClick: handleAddBilling,
            }}
          />
        )}
      </SectionCard>

      {/* View Billing Modal */}
      {viewingBilling && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-background rounded-lg shadow-lg w-full max-w-3xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl font-semibold">{t('dialyse.invoice')} {viewingBilling.invoiceNumber}</h2>
                    {getStatusBadge(viewingBilling.status)}
                  </div>
                  <p className="text-muted-foreground">
                    {viewingBilling.patientFirstName} {viewingBilling.patientLastName} ({viewingBilling.patientMedicalId})
                  </p>
                </div>
                <button
                  onClick={() => setViewingBilling(null)}
                  className="p-2 hover:bg-accent rounded-md"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                {/* Billing Info */}
                <div className="rounded-lg border p-4">
                  <h3 className="font-semibold mb-3">{t('dialyse.information')}</h3>
                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">{t('dialyse.type')}</dt>
                      <dd>{getTypeBadge(viewingBilling.billingType)}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">{t('dialyse.serviceDate')}</dt>
                      <dd>{formatDate(viewingBilling.serviceDate)}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">{t('dialyse.billingDate')}</dt>
                      <dd>{formatDate(viewingBilling.billingDate)}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">{t('dialyse.dueDate')}</dt>
                      <dd className={isOverdue(viewingBilling) ? 'text-slate-800 dark:text-slate-300 font-medium' : ''}>
                        {viewingBilling.billingDate ? formatDate(new Date(new Date(viewingBilling.billingDate).getTime() + 30 * 24 * 60 * 60 * 1000).toISOString()) : '-'}
                      </dd>
                    </div>
                    {viewingBilling.sessionId && (
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">{t('dialyse.session')}</dt>
                        <dd>#{viewingBilling.sessionId.slice(0, 8)}</dd>
                      </div>
                    )}
                  </dl>
                </div>

                {/* Insurance */}
                <div className="rounded-lg border p-4">
                  <h3 className="font-semibold mb-3">{t('dialyse.insurance')}</h3>
                  {viewingBilling.insuranceProvider ? (
                    <dl className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">{t('dialyse.provider')}</dt>
                        <dd>{viewingBilling.insuranceProvider}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">{t('dialyse.policyNumber')}</dt>
                        <dd className="font-mono">{viewingBilling.insurancePolicyNumber}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">{t('dialyse.coverage')}</dt>
                        <dd className="font-medium">{formatCurrency(viewingBilling.insuranceCoverage)}</dd>
                      </div>
                    </dl>
                  ) : (
                    <p className="text-muted-foreground text-sm">{t('dialyse.noInsurance')}</p>
                  )}
                </div>
              </div>

              {/* Amounts Breakdown */}
              <div className="mt-6 rounded-lg border p-4">
                <h3 className="font-semibold mb-3">{t('dialyse.amountBreakdown')}</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>{t('dialyse.baseAmount')}</span>
                    <span>{formatCurrency(viewingBilling.baseAmount)}</span>
                  </div>
                  {viewingBilling.consumablesAmount > 0 && (
                    <div className="flex justify-between">
                      <span>{t('dialyse.consumables')}</span>
                      <span>{formatCurrency(viewingBilling.consumablesAmount)}</span>
                    </div>
                  )}
                  {viewingBilling.medicationsAmount > 0 && (
                    <div className="flex justify-between">
                      <span>{t('dialyse.medications')}</span>
                      <span>{formatCurrency(viewingBilling.medicationsAmount)}</span>
                    </div>
                  )}
                  {viewingBilling.additionalCharges > 0 && (
                    <div className="flex justify-between">
                      <span>{t('dialyse.additionalCharges')}</span>
                      <span>{formatCurrency(viewingBilling.additionalCharges)}</span>
                    </div>
                  )}
                  {viewingBilling.discountAmount > 0 && (
                    <div className="flex justify-between text-slate-600 dark:text-slate-400">
                      <span>{t('dialyse.discount')}</span>
                      <span>-{formatCurrency(viewingBilling.discountAmount)}</span>
                    </div>
                  )}
                  <div className="border-t pt-2 font-semibold flex justify-between">
                    <span>{t('dialyse.total')}</span>
                    <span>{formatCurrency(viewingBilling.totalAmount)}</span>
                  </div>
                  {viewingBilling.insuranceCoverage > 0 && (
                    <div className="flex justify-between text-slate-600 dark:text-slate-400">
                      <span>{t('dialyse.insuranceCoverage')}</span>
                      <span>-{formatCurrency(viewingBilling.insuranceCoverage)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-medium">
                    <span>{t('dialyse.patientResponsibility')}</span>
                    <span>{formatCurrency(viewingBilling.patientResponsibility)}</span>
                  </div>
                  {viewingBilling.paidAmount > 0 && (
                    <>
                      <div className="flex justify-between text-slate-600 dark:text-slate-400">
                        <span>{t('dialyse.alreadyPaid')}</span>
                        <span>{formatCurrency(viewingBilling.paidAmount)}</span>
                      </div>
                      <div className="flex justify-between font-bold text-lg">
                        <span>{t('dialyse.remainingDue')}</span>
                        <span className={viewingBilling.totalAmount - viewingBilling.paidAmount > 0 ? 'text-slate-800 dark:text-slate-300' : 'text-slate-600 dark:text-slate-400'}>
                          {formatCurrency(viewingBilling.totalAmount - viewingBilling.paidAmount)}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Line Items */}
              {viewingBilling.lineItems && viewingBilling.lineItems.length > 0 && (
                <div className="mt-6 rounded-lg border p-4">
                  <h3 className="font-semibold mb-3">{t('dialyse.billingLines')}</h3>
                  <table className="w-full text-sm">
                    <thead className="border-b">
                      <tr>
                        <th className="text-left py-2">{t('dialyse.description')}</th>
                        <th className="text-center py-2">{t('dialyse.quantity')}</th>
                        <th className="text-right py-2">{t('dialyse.unitPrice')}</th>
                        <th className="text-right py-2">{t('dialyse.total')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {viewingBilling.lineItems.map((item, idx) => (
                        <tr key={idx} className="border-b last:border-0">
                          <td className="py-2">
                            {item.description}
                            {item.code && <span className="text-muted-foreground ml-2">({item.code})</span>}
                          </td>
                          <td className="text-center py-2">{item.quantity}</td>
                          <td className="text-right py-2">{formatCurrency(item.unitPrice)}</td>
                          <td className="text-right py-2 font-medium">{formatCurrency(item.totalPrice)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {viewingBilling.notes && (
                <div className="mt-6 rounded-lg border p-4">
                  <h3 className="font-semibold mb-2">{t('dialyse.notes')}</h3>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{viewingBilling.notes}</p>
                </div>
              )}

              <div className="flex justify-end gap-2 mt-6">
                {viewingBilling.status !== 'paid' && (
                  <button
                    onClick={() => { setViewingBilling(null); handleMarkAsPaid(viewingBilling); }}
                    className="px-4 py-2 rounded-md bg-slate-600 text-white text-sm font-medium hover:bg-slate-700 dark:bg-slate-500 dark:hover:bg-slate-600"
                  >
                    {t('dialyse.recordPayment')}
                  </button>
                )}
                <button
                  onClick={() => { setViewingBilling(null); handleEditBilling(viewingBilling); }}
                  className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90"
                >
                  {t('dialyse.edit')}
                </button>
                <button
                  onClick={() => setViewingBilling(null)}
                  className="px-4 py-2 rounded-md border text-sm font-medium hover:bg-accent"
                >
                  {t('dialyse.close')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
