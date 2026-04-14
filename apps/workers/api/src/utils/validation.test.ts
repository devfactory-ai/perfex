import { describe, expect, it } from 'vitest';
import {
  PAGINATION_DEFAULTS,
  validatePagination,
  parsePositiveInt,
  parsePositiveFloat,
  validateEnum,
  isValidUUID,
  validateOrganizationId,
  requireOrganizationId,
  sanitizeString,
  parseDate,
  validateDateRange,
  parseMonths,
} from './validation';

describe('isValidUUID', () => {
  it('accepts a valid UUID v4', () => {
    expect(isValidUUID('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
  });

  it('accepts uppercase UUID', () => {
    expect(isValidUUID('550E8400-E29B-41D4-A716-446655440000')).toBe(true);
  });

  it('rejects an invalid string', () => {
    expect(isValidUUID('not-a-uuid')).toBe(false);
  });

  it('rejects an empty string', () => {
    expect(isValidUUID('')).toBe(false);
  });

  it('rejects null', () => {
    expect(isValidUUID(null)).toBe(false);
  });

  it('rejects undefined', () => {
    expect(isValidUUID(undefined)).toBe(false);
  });

  it('rejects UUID with wrong version segment', () => {
    expect(isValidUUID('550e8400-e29b-61d4-a716-446655440000')).toBe(false);
  });

  it('rejects UUID with wrong variant segment', () => {
    expect(isValidUUID('550e8400-e29b-41d4-0716-446655440000')).toBe(false);
  });
});

describe('validatePagination', () => {
  it('returns defaults when no arguments provided', () => {
    const result = validatePagination();
    expect(result).toEqual({ limit: 25, offset: 0 });
  });

  it('parses valid limit and offset', () => {
    const result = validatePagination('10', '20');
    expect(result).toEqual({ limit: 10, offset: 20 });
  });

  it('clamps limit to minimum of 1', () => {
    const result = validatePagination('0');
    expect(result.limit).toBe(1);
  });

  it('clamps limit to default max of 100', () => {
    const result = validatePagination('999');
    expect(result.limit).toBe(100);
  });

  it('clamps offset to minimum of 0', () => {
    const result = validatePagination(undefined, '-5');
    expect(result.offset).toBe(0);
  });

  it('uses custom defaultLimit from options', () => {
    const result = validatePagination(null, null, { defaultLimit: 50 });
    expect(result.limit).toBe(50);
  });

  it('uses custom maxLimit from options', () => {
    const result = validatePagination('200', null, { maxLimit: 150 });
    expect(result.limit).toBe(150);
  });

  it('returns defaults for non-numeric limit', () => {
    const result = validatePagination('abc');
    expect(result.limit).toBe(PAGINATION_DEFAULTS.LIMIT);
  });

  it('returns default offset for non-numeric offset', () => {
    const result = validatePagination(null, 'xyz');
    expect(result.offset).toBe(0);
  });

  it('handles Infinity strings gracefully', () => {
    const result = validatePagination('Infinity');
    expect(result.limit).toBe(PAGINATION_DEFAULTS.LIMIT);
  });
});

describe('parsePositiveInt', () => {
  it('parses a valid positive integer', () => {
    expect(parsePositiveInt('42', 0)).toBe(42);
  });

  it('returns default for null', () => {
    expect(parsePositiveInt(null, 10)).toBe(10);
  });

  it('returns default for undefined', () => {
    expect(parsePositiveInt(undefined, 10)).toBe(10);
  });

  it('returns default for empty string', () => {
    expect(parsePositiveInt('', 5)).toBe(5);
  });

  it('returns default for negative number', () => {
    expect(parsePositiveInt('-3', 5)).toBe(5);
  });

  it('returns default for non-numeric string', () => {
    expect(parsePositiveInt('abc', 7)).toBe(7);
  });

  it('accepts zero', () => {
    expect(parsePositiveInt('0', 10)).toBe(0);
  });

  it('truncates float strings to integer', () => {
    expect(parsePositiveInt('3.9', 0)).toBe(3);
  });
});

describe('parsePositiveFloat', () => {
  it('parses a valid positive float', () => {
    expect(parsePositiveFloat('3.14', 0)).toBe(3.14);
  });

  it('returns default for null', () => {
    expect(parsePositiveFloat(null, 1.5)).toBe(1.5);
  });

  it('returns default for undefined', () => {
    expect(parsePositiveFloat(undefined, 1.5)).toBe(1.5);
  });

  it('returns default for negative number', () => {
    expect(parsePositiveFloat('-2.5', 1.0)).toBe(1.0);
  });

  it('returns default for non-numeric string', () => {
    expect(parsePositiveFloat('abc', 0)).toBe(0);
  });

  it('accepts zero', () => {
    expect(parsePositiveFloat('0', 10)).toBe(0);
  });

  it('parses integer strings as float', () => {
    expect(parsePositiveFloat('5', 0)).toBe(5);
  });
});

describe('validateEnum', () => {
  const allowed = ['active', 'inactive', 'pending'] as const;

  it('returns value when it is in allowed list', () => {
    expect(validateEnum('active', allowed, 'pending')).toBe('active');
  });

  it('returns default for value not in allowed list', () => {
    expect(validateEnum('deleted', allowed, 'pending')).toBe('pending');
  });

  it('returns default for null', () => {
    expect(validateEnum(null, allowed, 'inactive')).toBe('inactive');
  });

  it('returns default for undefined', () => {
    expect(validateEnum(undefined, allowed, 'inactive')).toBe('inactive');
  });

  it('returns default for empty string not in allowed list', () => {
    expect(validateEnum('', allowed, 'active')).toBe('active');
  });
});

describe('validateOrganizationId', () => {
  it('accepts a valid UUID', () => {
    expect(validateOrganizationId('550e8400-e29b-41d4-a716-446655440000')).toBe(
      '550e8400-e29b-41d4-a716-446655440000'
    );
  });

  it('accepts a custom org ID format', () => {
    expect(validateOrganizationId('org-abc123')).toBe('org-abc123');
  });

  it('accepts company-prefixed IDs', () => {
    expect(validateOrganizationId('company-my-org')).toBe('company-my-org');
  });

  it('throws for null', () => {
    expect(() => validateOrganizationId(null)).toThrow('Organization ID is required');
  });

  it('throws for undefined', () => {
    expect(() => validateOrganizationId(undefined)).toThrow('Organization ID is required');
  });

  it('throws for empty string', () => {
    expect(() => validateOrganizationId('')).toThrow('Organization ID is required');
  });

  it('throws for invalid format', () => {
    expect(() => validateOrganizationId('!!!invalid!!!')).toThrow('Invalid organization ID format');
  });
});

describe('requireOrganizationId', () => {
  it('returns the ID when present', () => {
    expect(requireOrganizationId('org-123')).toBe('org-123');
  });

  it('throws for null', () => {
    expect(() => requireOrganizationId(null)).toThrow('Organization ID is required');
  });

  it('throws for undefined', () => {
    expect(() => requireOrganizationId(undefined)).toThrow('Organization ID is required');
  });

  it('throws for empty string', () => {
    expect(() => requireOrganizationId('')).toThrow('Organization ID is required');
  });
});

describe('sanitizeString', () => {
  it('removes script tags (angle brackets)', () => {
    expect(sanitizeString('<script>alert("xss")</script>')).toBe('scriptalert("xss")/script');
  });

  it('removes javascript: protocol', () => {
    expect(sanitizeString('javascript:alert(1)')).toBe('alert(1)');
  });

  it('removes javascript: protocol case-insensitively', () => {
    expect(sanitizeString('JavaScript:alert(1)')).toBe('alert(1)');
  });

  it('removes event handlers like onclick=', () => {
    expect(sanitizeString('onclick=doSomething()')).toBe('doSomething()');
  });

  it('removes onload= handler', () => {
    expect(sanitizeString('onload=init()')).toBe('init()');
  });

  it('preserves normal text', () => {
    expect(sanitizeString('Hello, world!')).toBe('Hello, world!');
  });

  it('trims whitespace', () => {
    expect(sanitizeString('  hello  ')).toBe('hello');
  });

  it('returns empty string for null', () => {
    expect(sanitizeString(null)).toBe('');
  });

  it('returns empty string for undefined', () => {
    expect(sanitizeString(undefined)).toBe('');
  });

  it('returns empty string for empty input', () => {
    expect(sanitizeString('')).toBe('');
  });
});

describe('parseDate', () => {
  it('parses a valid ISO date string', () => {
    const result = parseDate('2024-01-15');
    expect(result).toBeInstanceOf(Date);
    expect(result!.getFullYear()).toBe(2024);
  });

  it('parses a full ISO datetime string', () => {
    const result = parseDate('2024-06-15T10:30:00Z');
    expect(result).toBeInstanceOf(Date);
  });

  it('returns null for invalid date string', () => {
    expect(parseDate('not-a-date')).toBeNull();
  });

  it('returns null for null', () => {
    expect(parseDate(null)).toBeNull();
  });

  it('returns null for undefined', () => {
    expect(parseDate(undefined)).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(parseDate('')).toBeNull();
  });
});

describe('validateDateRange', () => {
  it('returns both dates when valid range', () => {
    const result = validateDateRange('2024-01-01', '2024-12-31');
    expect(result.startDate).toBeInstanceOf(Date);
    expect(result.endDate).toBeInstanceOf(Date);
    expect(result.startDate!.getTime()).toBeLessThan(result.endDate!.getTime());
  });

  it('swaps dates when start is after end', () => {
    const result = validateDateRange('2024-12-31', '2024-01-01');
    expect(result.startDate!.getFullYear()).toBe(2024);
    expect(result.startDate!.getMonth()).toBe(0); // January
    expect(result.endDate!.getMonth()).toBe(11); // December
  });

  it('returns nulls when both dates are null', () => {
    const result = validateDateRange(null, null);
    expect(result).toEqual({ startDate: null, endDate: null });
  });

  it('handles only start date provided', () => {
    const result = validateDateRange('2024-06-01', null);
    expect(result.startDate).toBeInstanceOf(Date);
    expect(result.endDate).toBeNull();
  });

  it('handles only end date provided', () => {
    const result = validateDateRange(null, '2024-06-01');
    expect(result.startDate).toBeNull();
    expect(result.endDate).toBeInstanceOf(Date);
  });

  it('handles invalid start date', () => {
    const result = validateDateRange('invalid', '2024-06-01');
    expect(result.startDate).toBeNull();
    expect(result.endDate).toBeInstanceOf(Date);
  });

  it('handles invalid end date', () => {
    const result = validateDateRange('2024-06-01', 'invalid');
    expect(result.startDate).toBeInstanceOf(Date);
    expect(result.endDate).toBeNull();
  });
});

describe('parseMonths', () => {
  it('parses a valid month value', () => {
    expect(parseMonths('6')).toBe(6);
  });

  it('returns default of 12 when no value', () => {
    expect(parseMonths(null)).toBe(12);
  });

  it('returns custom default when specified', () => {
    expect(parseMonths(null, 24)).toBe(24);
  });

  it('clamps to minimum of 1', () => {
    expect(parseMonths('0')).toBe(1);
  });

  it('clamps to maximum of 36', () => {
    expect(parseMonths('100')).toBe(36);
  });

  it('returns default for non-numeric string', () => {
    expect(parseMonths('abc')).toBe(12);
  });
});
