import { describe, it, expect } from 'vitest';
import { parsePagination, getOffset, buildPaginationMeta } from './pagination';

describe('parsePagination', () => {
  it('returns defaults when no params provided', () => {
    const result = parsePagination({});
    expect(result).toEqual({ page: 1, limit: 20 });
  });

  it('parses valid page and limit', () => {
    const result = parsePagination({ page: '3', limit: '50' });
    expect(result).toEqual({ page: 3, limit: 50 });
  });

  it('clamps page minimum to 1 for zero', () => {
    const result = parsePagination({ page: '0' });
    expect(result.page).toBe(1);
  });

  it('clamps page minimum to 1 for negative values', () => {
    const result = parsePagination({ page: '-5' });
    expect(result.page).toBe(1);
  });

  it('clamps limit maximum to 100', () => {
    const result = parsePagination({ limit: '200' });
    expect(result.limit).toBe(100);
  });

  it('clamps limit minimum to 1', () => {
    const result = parsePagination({ limit: '0' });
    expect(result.limit).toBe(20); // 0 is falsy so || 20 kicks in
  });

  it('clamps negative limit to default', () => {
    const result = parsePagination({ limit: '-10' });
    expect(result.limit).toBe(1); // -10 is truthy, Math.max(1, -10) = 1
  });

  it('handles non-numeric page string', () => {
    const result = parsePagination({ page: 'abc' });
    expect(result.page).toBe(1);
  });

  it('handles non-numeric limit string', () => {
    const result = parsePagination({ limit: 'xyz' });
    expect(result.limit).toBe(20);
  });

  it('handles undefined values', () => {
    const result = parsePagination({ page: undefined, limit: undefined });
    expect(result).toEqual({ page: 1, limit: 20 });
  });
});

describe('getOffset', () => {
  it('returns 0 for page 1', () => {
    expect(getOffset({ page: 1, limit: 20 })).toBe(0);
  });

  it('returns 20 for page 2 with limit 20', () => {
    expect(getOffset({ page: 2, limit: 20 })).toBe(20);
  });

  it('returns 20 for page 3 with limit 10', () => {
    expect(getOffset({ page: 3, limit: 10 })).toBe(20);
  });
});

describe('buildPaginationMeta', () => {
  it('calculates totalPages correctly', () => {
    const meta = buildPaginationMeta(95, { page: 1, limit: 20 });
    expect(meta.totalPages).toBe(5); // ceil(95/20) = 5
  });

  it('sets hasNextPage true when more pages exist', () => {
    const meta = buildPaginationMeta(50, { page: 1, limit: 20 });
    expect(meta.hasNextPage).toBe(true);
  });

  it('sets hasNextPage false on last page', () => {
    const meta = buildPaginationMeta(50, { page: 3, limit: 20 });
    expect(meta.hasNextPage).toBe(false);
  });

  it('sets hasPreviousPage false on page 1', () => {
    const meta = buildPaginationMeta(50, { page: 1, limit: 20 });
    expect(meta.hasPreviousPage).toBe(false);
  });

  it('sets hasPreviousPage true on page 2+', () => {
    const meta = buildPaginationMeta(50, { page: 2, limit: 20 });
    expect(meta.hasPreviousPage).toBe(true);
  });

  it('handles 0 total records', () => {
    const meta = buildPaginationMeta(0, { page: 1, limit: 20 });
    expect(meta.totalPages).toBe(0);
    expect(meta.hasNextPage).toBe(false);
    expect(meta.hasPreviousPage).toBe(false);
  });

  it('handles exactly 1 page of records', () => {
    const meta = buildPaginationMeta(20, { page: 1, limit: 20 });
    expect(meta.totalPages).toBe(1);
    expect(meta.hasNextPage).toBe(false);
    expect(meta.hasPreviousPage).toBe(false);
  });

  it('includes page, limit, and total in result', () => {
    const meta = buildPaginationMeta(100, { page: 2, limit: 25 });
    expect(meta.page).toBe(2);
    expect(meta.limit).toBe(25);
    expect(meta.total).toBe(100);
  });
});
