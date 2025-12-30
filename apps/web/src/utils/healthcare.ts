/**
 * Healthcare Module Utilities
 * Shared utilities for Dialyse, Cardiology, and Ophthalmology modules
 */

// ============================================================================
// DATE FORMATTING
// ============================================================================

/**
 * Format a date to locale string
 */
export function formatDate(date: Date | string | null | undefined, locale = 'fr-FR'): string {
  if (!date) return '-';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '-';
  return d.toLocaleDateString(locale);
}

/**
 * Format a date with time
 */
export function formatDateTime(date: Date | string | null | undefined, locale = 'fr-FR'): string {
  if (!date) return '-';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '-';
  return d.toLocaleString(locale);
}

/**
 * Format time only
 */
export function formatTime(date: Date | string | null | undefined, locale = 'fr-FR'): string {
  if (!date) return '-';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '-';
  return d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
}

/**
 * Format relative date (e.g., "il y a 2 jours")
 */
export function formatRelativeDate(date: Date | string | null | undefined): string {
  if (!date) return '-';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '-';

  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Aujourd'hui";
  if (diffDays === 1) return 'Hier';
  if (diffDays < 7) return `Il y a ${diffDays} jours`;
  if (diffDays < 30) return `Il y a ${Math.floor(diffDays / 7)} semaines`;
  return formatDate(d);
}

// ============================================================================
// CALCULATIONS
// ============================================================================

/**
 * Calculate age from date of birth
 */
export function calculateAge(dateOfBirth: Date | string | null | undefined): number | null {
  if (!dateOfBirth) return null;
  const birth = typeof dateOfBirth === 'string' ? new Date(dateOfBirth) : dateOfBirth;
  if (isNaN(birth.getTime())) return null;

  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }

  return age;
}

/**
 * Format age with unit
 */
export function formatAge(dateOfBirth: Date | string | null | undefined): string {
  const age = calculateAge(dateOfBirth);
  if (age === null) return '-';
  return `${age} ans`;
}

/**
 * Calculate BMI (Body Mass Index)
 */
export function calculateBMI(weightKg: number | null, heightCm: number | null): number | null {
  if (!weightKg || !heightCm || heightCm <= 0) return null;
  const heightM = heightCm / 100;
  return Math.round((weightKg / (heightM * heightM)) * 10) / 10;
}

/**
 * Get BMI category
 */
export function getBMICategory(bmi: number | null): string {
  if (bmi === null) return '-';
  if (bmi < 18.5) return 'Insuffisance pondérale';
  if (bmi < 25) return 'Poids normal';
  if (bmi < 30) return 'Surpoids';
  if (bmi < 35) return 'Obésité modérée';
  if (bmi < 40) return 'Obésité sévère';
  return 'Obésité morbide';
}

// ============================================================================
// FORMATTING
// ============================================================================

/**
 * Format currency
 */
export function formatCurrency(
  amount: number | null | undefined,
  currency = 'EUR',
  locale = 'fr-FR'
): string {
  if (amount === null || amount === undefined) return '-';
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(amount);
}

/**
 * Format number with locale
 */
export function formatNumber(
  value: number | null | undefined,
  locale = 'fr-FR',
  options?: Intl.NumberFormatOptions
): string {
  if (value === null || value === undefined) return '-';
  return new Intl.NumberFormat(locale, options).format(value);
}

/**
 * Format percentage
 */
export function formatPercentage(value: number | null | undefined, decimals = 1): string {
  if (value === null || value === undefined) return '-';
  return `${value.toFixed(decimals)}%`;
}

/**
 * Format phone number (French format)
 */
export function formatPhoneNumber(phone: string | null | undefined): string {
  if (!phone) return '-';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return cleaned.replace(/(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4 $5');
  }
  return phone;
}

/**
 * Format patient name
 */
export function formatPatientName(
  firstName: string | null | undefined,
  lastName: string | null | undefined
): string {
  const parts = [lastName?.toUpperCase(), firstName].filter(Boolean);
  return parts.length > 0 ? parts.join(' ') : '-';
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] as const;
export type BloodType = typeof BLOOD_TYPES[number];

export const GENDERS = [
  { value: 'M', label: 'Masculin' },
  { value: 'F', label: 'Féminin' },
] as const;

export const PATIENT_STATUSES = [
  { value: 'active', label: 'Actif', color: 'green' },
  { value: 'inactive', label: 'Inactif', color: 'gray' },
  { value: 'deceased', label: 'Décédé', color: 'red' },
  { value: 'transferred', label: 'Transféré', color: 'blue' },
] as const;

export const ALERT_SEVERITIES = [
  { value: 'critical', label: 'Critique', color: 'red' },
  { value: 'warning', label: 'Avertissement', color: 'orange' },
  { value: 'info', label: 'Information', color: 'blue' },
] as const;

export const ALERT_STATUSES = [
  { value: 'active', label: 'Active', color: 'red' },
  { value: 'acknowledged', label: 'Prise en compte', color: 'yellow' },
  { value: 'resolved', label: 'Résolue', color: 'green' },
] as const;

export const MAINTENANCE_TYPES = [
  { value: 'preventive', label: 'Préventive' },
  { value: 'corrective', label: 'Corrective' },
  { value: 'calibration', label: 'Calibration' },
  { value: 'inspection', label: 'Inspection' },
] as const;

export const MAINTENANCE_STATUSES = [
  { value: 'scheduled', label: 'Planifiée', color: 'blue' },
  { value: 'in_progress', label: 'En cours', color: 'yellow' },
  { value: 'completed', label: 'Terminée', color: 'green' },
  { value: 'cancelled', label: 'Annulée', color: 'gray' },
] as const;

export const PRIORITIES = [
  { value: 'low', label: 'Basse', color: 'gray' },
  { value: 'medium', label: 'Moyenne', color: 'blue' },
  { value: 'high', label: 'Haute', color: 'orange' },
  { value: 'critical', label: 'Critique', color: 'red' },
] as const;

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Get label from options array
 */
export function getOptionLabel<T extends { value: string; label: string }>(
  options: readonly T[],
  value: string | null | undefined
): string {
  if (!value) return '-';
  const option = options.find(o => o.value === value);
  return option?.label || value;
}

/**
 * Check if a date is overdue
 */
export function isOverdue(date: Date | string | null | undefined): boolean {
  if (!date) return false;
  const d = typeof date === 'string' ? new Date(date) : date;
  return d < new Date();
}

/**
 * Check if a date is today
 */
export function isToday(date: Date | string | null | undefined): boolean {
  if (!date) return false;
  const d = typeof date === 'string' ? new Date(date) : date;
  const today = new Date();
  return d.toDateString() === today.toDateString();
}

/**
 * Generate initials from name
 */
export function getInitials(firstName?: string | null, lastName?: string | null): string {
  const first = firstName?.charAt(0)?.toUpperCase() || '';
  const last = lastName?.charAt(0)?.toUpperCase() || '';
  return `${first}${last}` || '?';
}
