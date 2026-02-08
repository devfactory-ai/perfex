/**
 * Clinical Documentation Page
 * List and manage AI-generated clinical documents
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { api, type ApiResponse } from '@/lib/api';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  PageHeader,
  Button,
  SectionCard,
  InlineLoading,
  DataTable,
  EmptyState,
  ConfirmDialog
} from '@/components/healthcare';
import {
  FileText,
  Plus,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  Clock,
  FileSignature,
  Filter,
  Search
} from 'lucide-react';

interface ClinicalDocument {
  id: string;
  documentType: string;
  title: string;
  status: 'draft' | 'pending_review' | 'approved' | 'signed' | 'amended' | 'voided';
  aiModel: string;
  generatedBy: string;
  createdAt: string;
  updatedAt: string;
  signedAt: string | null;
  signedBy: string | null;
  patient: {
    id: string;
    contact: {
      firstName: string;
      lastName: string;
    };
  };
}

interface DocumentsResponse {
  documents: ClinicalDocument[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

type DocumentStatus = 'all' | 'draft' | 'pending_review' | 'approved' | 'signed';
type DocumentType = 'all' | 'consultation_note' | 'discharge_summary' | 'referral_letter' | 'progress_note' | 'surgical_report';

export function ClinicalDocumentationPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<DocumentStatus>('all');
  const [typeFilter, setTypeFilter] = useState<DocumentType>('all');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['clinical-documents', page, search, statusFilter, typeFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      });
      if (search) params.append('search', search);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (typeFilter !== 'all') params.append('type', typeFilter);

      const response = await api.get<ApiResponse<DocumentsResponse>>(`/clinical-ai/documentation?${params}`);
      return response.data.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/clinical-ai/documentation/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clinical-documents'] });
      setDeleteId(null);
    },
  });

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      draft: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300',
      pending_review: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
      approved: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
      signed: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
      amended: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400',
      voided: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
    };
    return styles[status] || styles.draft;
  };

  const getDocumentTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      consultation_note: t('clinicalAi.docType.consultationNote'),
      discharge_summary: t('clinicalAi.docType.dischargeSummary'),
      referral_letter: t('clinicalAi.docType.referralLetter'),
      progress_note: t('clinicalAi.docType.progressNote'),
      surgical_report: t('clinicalAi.docType.surgicalReport'),
      procedure_note: t('clinicalAi.docType.procedureNote'),
      admission_note: t('clinicalAi.docType.admissionNote'),
      transfer_note: t('clinicalAi.docType.transferNote'),
    };
    return labels[type] || type;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const columns = [
    {
      key: 'title',
      header: t('clinicalAi.document'),
      render: (doc: ClinicalDocument) => (
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
            <FileText className="h-4 w-4 text-gray-600 dark:text-gray-400" />
          </div>
          <div>
            <p className="font-medium">{doc.title || getDocumentTypeLabel(doc.documentType)}</p>
            <p className="text-xs text-gray-500">{getDocumentTypeLabel(doc.documentType)}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'patient',
      header: t('clinicalAi.patient'),
      render: (doc: ClinicalDocument) => (
        <span>
          {doc.patient?.contact?.firstName} {doc.patient?.contact?.lastName}
        </span>
      ),
    },
    {
      key: 'status',
      header: t('clinicalAi.status'),
      render: (doc: ClinicalDocument) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(doc.status)}`}>
          {t(`clinicalAi.status.${doc.status}`)}
        </span>
      ),
    },
    {
      key: 'createdAt',
      header: t('clinicalAi.createdAt'),
      render: (doc: ClinicalDocument) => formatDate(doc.createdAt),
    },
    {
      key: 'signedAt',
      header: t('clinicalAi.signedAt'),
      render: (doc: ClinicalDocument) => (
        doc.signedAt ? (
          <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
            <FileSignature className="h-4 w-4" />
            <span>{formatDate(doc.signedAt)}</span>
          </div>
        ) : (
          <span className="text-gray-400">-</span>
        )
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (doc: ClinicalDocument) => (
        <div className="flex items-center gap-2 justify-end">
          <button
            onClick={() => navigate(`/clinical-ai/documentation/${doc.id}`)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            title={t('clinicalAi.view')}
          >
            <Eye className="h-4 w-4 text-gray-600 dark:text-gray-400" />
          </button>
          {(doc.status === 'draft' || doc.status === 'pending_review') && (
            <button
              onClick={() => navigate(`/clinical-ai/documentation/${doc.id}/edit`)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              title={t('clinicalAi.edit')}
            >
              <Edit className="h-4 w-4 text-gray-600 dark:text-gray-400" />
            </button>
          )}
          {doc.status === 'draft' && (
            <button
              onClick={() => setDeleteId(doc.id)}
              className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
              title={t('clinicalAi.delete')}
            >
              <Trash2 className="h-4 w-4 text-red-600 dark:text-red-400" />
            </button>
          )}
        </div>
      ),
    },
  ];

  if (isLoading) {
    return <InlineLoading rows={10} />;
  }

  if (error) {
    return (
      <SectionCard>
        <div className="p-6 text-center">
          <p className="text-destructive">{t('clinicalAi.error')}</p>
        </div>
      </SectionCard>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title={t('clinicalAi.documentation')}
        subtitle={t('clinicalAi.documentationSubtitle')}
        icon={FileText}
        module="dialyse"
        actions={
          <Link to="/clinical-ai/documentation/new">
            <Button module="dialyse" icon={Plus}>
              {t('clinicalAi.newDocument')}
            </Button>
          </Link>
        }
      />

      {/* Filters */}
      <SectionCard>
        <div className="p-4">
          <div className="flex flex-wrap gap-4">
            {/* Search */}
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder={t('clinicalAi.searchDocuments')}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg bg-background focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as DocumentStatus)}
                className="border rounded-lg px-3 py-2 bg-background focus:ring-2 focus:ring-primary"
              >
                <option value="all">{t('clinicalAi.allStatuses')}</option>
                <option value="draft">{t('clinicalAi.status.draft')}</option>
                <option value="pending_review">{t('clinicalAi.status.pending_review')}</option>
                <option value="approved">{t('clinicalAi.status.approved')}</option>
                <option value="signed">{t('clinicalAi.status.signed')}</option>
              </select>
            </div>

            {/* Type Filter */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as DocumentType)}
              className="border rounded-lg px-3 py-2 bg-background focus:ring-2 focus:ring-primary"
            >
              <option value="all">{t('clinicalAi.allTypes')}</option>
              <option value="consultation_note">{t('clinicalAi.docType.consultationNote')}</option>
              <option value="discharge_summary">{t('clinicalAi.docType.dischargeSummary')}</option>
              <option value="referral_letter">{t('clinicalAi.docType.referralLetter')}</option>
              <option value="progress_note">{t('clinicalAi.docType.progressNote')}</option>
              <option value="surgical_report">{t('clinicalAi.docType.surgicalReport')}</option>
            </select>
          </div>

          {/* Quick Stats */}
          <div className="flex gap-4 mt-4 pt-4 border-t">
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-amber-500" />
              <span className="text-gray-600 dark:text-gray-400">
                {data?.documents.filter(d => d.status === 'pending_review').length || 0} {t('clinicalAi.pendingReview')}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-gray-600 dark:text-gray-400">
                {data?.documents.filter(d => d.status === 'signed').length || 0} {t('clinicalAi.signed')}
              </span>
            </div>
          </div>
        </div>
      </SectionCard>

      {/* Documents Table */}
      <SectionCard>
        {data?.documents && data.documents.length > 0 ? (
          <DataTable
            data={data.documents}
            columns={columns}
            pagination={{
              page: data.pagination.page,
              totalPages: data.pagination.pages,
              onPageChange: setPage,
            }}
          />
        ) : (
          <EmptyState
            icon={FileText}
            title={t('clinicalAi.noDocuments')}
            description={t('clinicalAi.noDocumentsDesc')}
            action={{
              label: t('clinicalAi.createFirst'),
              onClick: () => navigate('/clinical-ai/documentation/new'),
            }}
          />
        )}
      </SectionCard>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        title={t('clinicalAi.deleteDocument')}
        message={t('clinicalAi.deleteDocumentConfirm')}
        confirmLabel={t('clinicalAi.delete')}
        isLoading={deleteMutation.isPending}
        variant="danger"
      />
    </div>
  );
}
