/**
 * Dialyse Patient Form Page
 * Create or edit a dialysis patient
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, getErrorMessage, type ApiResponse } from '@/lib/api';

interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
}

interface PatientFormData {
  contactId: string;
  medicalId: string;
  bloodType: string;
  dryWeight: string;
  renalFailureEtiology: string;
  hivStatus: string;
  hbvStatus: string;
  hcvStatus: string;
  requiresIsolation: boolean;
  hepatitisBVaccinated: boolean;
  dialysisStartDate: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactRelation: string;
  notes: string;
}

const initialFormData: PatientFormData = {
  contactId: '',
  medicalId: '',
  bloodType: '',
  dryWeight: '',
  renalFailureEtiology: '',
  hivStatus: 'unknown',
  hbvStatus: 'unknown',
  hcvStatus: 'unknown',
  requiresIsolation: false,
  hepatitisBVaccinated: false,
  dialysisStartDate: '',
  emergencyContactName: '',
  emergencyContactPhone: '',
  emergencyContactRelation: '',
  notes: '',
};

const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const serologyStatuses = [
  { value: 'unknown', label: 'Inconnu' },
  { value: 'negative', label: 'Négatif' },
  { value: 'positive', label: 'Positif' },
];

export function DialysePatientFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditing = !!id;

  const [formData, setFormData] = useState<PatientFormData>(initialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [contactSearch, setContactSearch] = useState('');

  // Fetch existing patient if editing
  const { data: existingPatient, isLoading: isLoadingPatient } = useQuery({
    queryKey: ['dialyse-patient', id],
    queryFn: async () => {
      const response = await api.get<ApiResponse<any>>(`/dialyse/patients/${id}`);
      return response.data.data;
    },
    enabled: isEditing,
  });

  // Fetch contacts for selection
  const { data: contacts } = useQuery({
    queryKey: ['contacts-search', contactSearch],
    queryFn: async () => {
      const response = await api.get<ApiResponse<Contact[]>>(`/contacts?search=${contactSearch}&limit=20`);
      return response.data.data;
    },
    enabled: !isEditing && contactSearch.length >= 2,
  });

  // Populate form when editing
  useEffect(() => {
    if (existingPatient) {
      setFormData({
        contactId: existingPatient.contactId || '',
        medicalId: existingPatient.medicalId || '',
        bloodType: existingPatient.bloodType || '',
        dryWeight: existingPatient.dryWeight?.toString() || '',
        renalFailureEtiology: existingPatient.renalFailureEtiology || '',
        hivStatus: existingPatient.hivStatus || 'unknown',
        hbvStatus: existingPatient.hbvStatus || 'unknown',
        hcvStatus: existingPatient.hcvStatus || 'unknown',
        requiresIsolation: existingPatient.requiresIsolation || false,
        hepatitisBVaccinated: existingPatient.hepatitisBVaccinated || false,
        dialysisStartDate: existingPatient.dialysisStartDate
          ? new Date(existingPatient.dialysisStartDate).toISOString().split('T')[0]
          : '',
        emergencyContactName: existingPatient.emergencyContactName || '',
        emergencyContactPhone: existingPatient.emergencyContactPhone || '',
        emergencyContactRelation: existingPatient.emergencyContactRelation || '',
        notes: existingPatient.notes || '',
      });
    }
  }, [existingPatient]);

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post<ApiResponse<any>>('/dialyse/patients', data);
      return response.data.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['dialyse-patients'] });
      navigate(`/dialyse/patients/${data.id}`);
    },
    onError: (error) => {
      alert(`Erreur: ${getErrorMessage(error)}`);
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.put<ApiResponse<any>>(`/dialyse/patients/${id}`, data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dialyse-patients'] });
      queryClient.invalidateQueries({ queryKey: ['dialyse-patient', id] });
      navigate(`/dialyse/patients/${id}`);
    },
    onError: (error) => {
      alert(`Erreur: ${getErrorMessage(error)}`);
    },
  });

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!isEditing && !formData.contactId) {
      newErrors.contactId = 'Veuillez sélectionner un contact';
    }
    if (!formData.medicalId.trim()) {
      newErrors.medicalId = 'L\'ID médical est requis';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    const payload = {
      contactId: formData.contactId,
      medicalId: formData.medicalId,
      bloodType: formData.bloodType || null,
      dryWeight: formData.dryWeight ? parseFloat(formData.dryWeight) : null,
      renalFailureEtiology: formData.renalFailureEtiology || null,
      hivStatus: formData.hivStatus,
      hbvStatus: formData.hbvStatus,
      hcvStatus: formData.hcvStatus,
      requiresIsolation: formData.requiresIsolation,
      hepatitisBVaccinated: formData.hepatitisBVaccinated,
      dialysisStartDate: formData.dialysisStartDate || null,
      emergencyContactName: formData.emergencyContactName || null,
      emergencyContactPhone: formData.emergencyContactPhone || null,
      emergencyContactRelation: formData.emergencyContactRelation || null,
      notes: formData.notes || null,
    };

    if (isEditing) {
      updateMutation.mutate(payload);
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    // Clear error when field is modified
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const selectContact = (contact: Contact) => {
    setFormData(prev => ({ ...prev, contactId: contact.id }));
    setContactSearch(`${contact.firstName} ${contact.lastName}`);
  };

  if (isEditing && isLoadingPatient) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
          <p className="mt-4 text-sm text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          to={isEditing ? `/dialyse/patients/${id}` : '/dialyse/patients'}
          className="p-2 rounded-md hover:bg-accent"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {isEditing ? 'Modifier le patient' : 'Nouveau patient dialysé'}
          </h1>
          <p className="text-muted-foreground">
            {isEditing ? 'Modifiez les informations du patient' : 'Enregistrez un nouveau patient dialysé'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Contact Selection (only for new patients) */}
        {!isEditing && (
          <div className="rounded-lg border bg-card p-6">
            <h3 className="text-lg font-semibold mb-4">Contact CRM</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Rechercher un contact <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  value={contactSearch}
                  onChange={(e) => setContactSearch(e.target.value)}
                  placeholder="Tapez au moins 2 caractères pour rechercher..."
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
                {errors.contactId && (
                  <p className="mt-1 text-sm text-destructive">{errors.contactId}</p>
                )}
                {contacts && contacts.length > 0 && !formData.contactId && (
                  <div className="mt-2 border rounded-md max-h-48 overflow-y-auto">
                    {contacts.map((contact) => (
                      <button
                        key={contact.id}
                        type="button"
                        onClick={() => selectContact(contact)}
                        className="w-full px-4 py-2 text-left hover:bg-accent text-sm"
                      >
                        <div className="font-medium">{contact.firstName} {contact.lastName}</div>
                        <div className="text-muted-foreground text-xs">{contact.email}</div>
                      </button>
                    ))}
                  </div>
                )}
                {formData.contactId && (
                  <p className="mt-2 text-sm text-green-600">Contact sélectionné</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Medical Info */}
        <div className="rounded-lg border bg-card p-6">
          <h3 className="text-lg font-semibold mb-4">Informations médicales</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium mb-1">
                ID Médical <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                name="medicalId"
                value={formData.medicalId}
                onChange={handleChange}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="Ex: PAT-2024-001"
              />
              {errors.medicalId && (
                <p className="mt-1 text-sm text-destructive">{errors.medicalId}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Groupe sanguin</label>
              <select
                name="bloodType"
                value={formData.bloodType}
                onChange={handleChange}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Sélectionner</option>
                {bloodTypes.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Poids sec (kg)</label>
              <input
                type="number"
                name="dryWeight"
                value={formData.dryWeight}
                onChange={handleChange}
                step="0.1"
                min="0"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="Ex: 70.5"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Date début dialyse</label>
              <input
                type="date"
                name="dialysisStartDate"
                value={formData.dialysisStartDate}
                onChange={handleChange}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Étiologie de l'insuffisance rénale</label>
              <input
                type="text"
                name="renalFailureEtiology"
                value={formData.renalFailureEtiology}
                onChange={handleChange}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="Ex: Néphropathie diabétique"
              />
            </div>
          </div>
        </div>

        {/* Serology */}
        <div className="rounded-lg border bg-card p-6">
          <h3 className="text-lg font-semibold mb-4">Sérologie</h3>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="block text-sm font-medium mb-1">Statut VIH</label>
              <select
                name="hivStatus"
                value={formData.hivStatus}
                onChange={handleChange}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {serologyStatuses.map((status) => (
                  <option key={status.value} value={status.value}>{status.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Statut VHB</label>
              <select
                name="hbvStatus"
                value={formData.hbvStatus}
                onChange={handleChange}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {serologyStatuses.map((status) => (
                  <option key={status.value} value={status.value}>{status.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Statut VHC</label>
              <select
                name="hcvStatus"
                value={formData.hcvStatus}
                onChange={handleChange}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {serologyStatuses.map((status) => (
                  <option key={status.value} value={status.value}>{status.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="requiresIsolation"
                checked={formData.requiresIsolation}
                onChange={handleChange}
                className="rounded border-input"
              />
              <span className="text-sm">Nécessite une isolation</span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="hepatitisBVaccinated"
                checked={formData.hepatitisBVaccinated}
                onChange={handleChange}
                className="rounded border-input"
              />
              <span className="text-sm">Vacciné contre l'hépatite B</span>
            </label>
          </div>
        </div>

        {/* Emergency Contact */}
        <div className="rounded-lg border bg-card p-6">
          <h3 className="text-lg font-semibold mb-4">Contact d'urgence</h3>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="block text-sm font-medium mb-1">Nom</label>
              <input
                type="text"
                name="emergencyContactName"
                value={formData.emergencyContactName}
                onChange={handleChange}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Téléphone</label>
              <input
                type="tel"
                name="emergencyContactPhone"
                value={formData.emergencyContactPhone}
                onChange={handleChange}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Relation</label>
              <input
                type="text"
                name="emergencyContactRelation"
                value={formData.emergencyContactRelation}
                onChange={handleChange}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="Ex: Époux/Épouse, Parent"
              />
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="rounded-lg border bg-card p-6">
          <h3 className="text-lg font-semibold mb-4">Notes</h3>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows={4}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            placeholder="Notes additionnelles..."
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Link
            to={isEditing ? `/dialyse/patients/${id}` : '/dialyse/patients'}
            className="rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent"
          >
            Annuler
          </Link>
          <button
            type="submit"
            disabled={createMutation.isPending || updateMutation.isPending}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {createMutation.isPending || updateMutation.isPending
              ? 'Enregistrement...'
              : isEditing ? 'Mettre à jour' : 'Créer le patient'
            }
          </button>
        </div>
      </form>
    </div>
  );
}
