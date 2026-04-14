/**
 * Company Service Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CompanyService } from './company.service';

// Create chainable mock helpers
const createChainableMock = (resolvedValue: any = null) => {
  const mock: any = {
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    offset: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    get: vi.fn().mockResolvedValue(resolvedValue),
    all: vi.fn().mockResolvedValue(resolvedValue !== null ? [resolvedValue] : []),
    run: vi.fn().mockResolvedValue({ success: true }),
  };
  return mock;
};

let mockSelectFn: ReturnType<typeof vi.fn>;
let mockInsertFn: ReturnType<typeof vi.fn>;
let mockUpdateFn: ReturnType<typeof vi.fn>;
let mockDeleteFn: ReturnType<typeof vi.fn>;

vi.mock('../db', () => ({
  getDb: vi.fn(() => ({
    select: mockSelectFn,
    insert: mockInsertFn,
    update: mockUpdateFn,
    delete: mockDeleteFn,
  })),
}));

vi.mock('drizzle-orm', () => ({
  eq: vi.fn((_col: any, val: any) => ({ type: 'eq', val })),
  and: vi.fn((...args: any[]) => ({ type: 'and', args })),
  desc: vi.fn((col: any) => ({ type: 'desc', col })),
  like: vi.fn((_col: any, val: any) => ({ type: 'like', val })),
  or: vi.fn((...args: any[]) => ({ type: 'or', args })),
  sql: { raw: vi.fn() },
  count: vi.fn(() => 'count_fn'),
}));

vi.mock('@perfex/database', () => ({
  companies: {
    id: 'id',
    organizationId: 'organizationId',
    name: 'name',
    type: 'type',
    status: 'status',
    assignedTo: 'assignedTo',
    email: 'email',
    phone: 'phone',
    createdAt: 'createdAt',
  },
}));

const ORG_ID = 'org-test-001';
const USER_ID = 'user-test-001';
const COMPANY_ID = 'company-test-001';

const testCompany = {
  id: COMPANY_ID,
  organizationId: ORG_ID,
  name: 'Acme Corp',
  website: 'https://acme.com',
  phone: '+21612345678',
  email: 'contact@acme.com',
  address: '123 Main St',
  city: 'Tunis',
  state: 'Tunis',
  postalCode: '1000',
  country: 'TN',
  industry: 'Technology',
  size: '50-100',
  type: 'customer',
  status: 'active',
  assignedTo: USER_ID,
  tags: '["vip","enterprise"]',
  notes: 'Test company',
  createdBy: USER_ID,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

describe('CompanyService', () => {
  let service: CompanyService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new CompanyService();

    // Default mock implementations
    mockSelectFn = vi.fn(() => createChainableMock(null));
    mockInsertFn = vi.fn(() => createChainableMock(null));
    mockUpdateFn = vi.fn(() => createChainableMock(null));
    mockDeleteFn = vi.fn(() => createChainableMock(null));
  });

  describe('create', () => {
    it('should create a new company and return it', async () => {
      // First call: insert
      mockInsertFn = vi.fn(() => createChainableMock(null));

      // For getById after insert: need select to return the company
      const selectMock = createChainableMock(testCompany);
      mockSelectFn = vi.fn(() => selectMock);

      const input = {
        name: 'Acme Corp',
        type: 'customer' as const,
        website: 'https://acme.com',
        phone: '+21612345678',
        email: 'contact@acme.com',
        tags: ['vip', 'enterprise'],
      };

      const result = await service.create(ORG_ID, USER_ID, input);

      expect(result).toBeDefined();
      expect(result.name).toBe('Acme Corp');
      expect(result.organizationId).toBe(ORG_ID);
      expect(mockInsertFn).toHaveBeenCalled();
      expect(mockSelectFn).toHaveBeenCalled();
    });

    it('should throw error if company creation fails', async () => {
      mockInsertFn = vi.fn(() => createChainableMock(null));

      // getById returns null after insert
      const selectMock = createChainableMock(null);
      mockSelectFn = vi.fn(() => selectMock);

      const input = {
        name: 'Acme Corp',
        type: 'customer' as const,
      };

      await expect(service.create(ORG_ID, USER_ID, input)).rejects.toThrow(
        'Failed to create company'
      );
    });
  });

  describe('getById', () => {
    it('should return a company when found', async () => {
      const selectMock = createChainableMock(testCompany);
      mockSelectFn = vi.fn(() => selectMock);

      const result = await service.getById(ORG_ID, COMPANY_ID);

      expect(result).toBeDefined();
      expect(result!.id).toBe(COMPANY_ID);
      expect(result!.name).toBe('Acme Corp');
      expect(mockSelectFn).toHaveBeenCalled();
    });

    it('should return null when company not found', async () => {
      const selectMock = createChainableMock(null);
      mockSelectFn = vi.fn(() => selectMock);

      const result = await service.getById(ORG_ID, 'nonexistent-id');

      expect(result).toBeNull();
    });
  });

  describe('list', () => {
    it('should return companies for an organization', async () => {
      const companiesList = [testCompany, { ...testCompany, id: 'company-002', name: 'Beta Inc' }];
      const selectMock = createChainableMock(null);
      selectMock.all = vi.fn().mockResolvedValue(companiesList);
      mockSelectFn = vi.fn(() => selectMock);

      const result = await service.list(ORG_ID);

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Acme Corp');
      expect(result[1].name).toBe('Beta Inc');
    });

    it('should return empty array when no companies exist', async () => {
      const selectMock = createChainableMock(null);
      selectMock.all = vi.fn().mockResolvedValue([]);
      mockSelectFn = vi.fn(() => selectMock);

      const result = await service.list(ORG_ID);

      expect(result).toEqual([]);
    });

    it('should apply type filter', async () => {
      const selectMock = createChainableMock(null);
      selectMock.all = vi.fn().mockResolvedValue([testCompany]);
      mockSelectFn = vi.fn(() => selectMock);

      const result = await service.list(ORG_ID, { type: 'customer' });

      expect(result).toHaveLength(1);
      expect(selectMock.where).toHaveBeenCalled();
    });

    it('should apply search filter', async () => {
      const selectMock = createChainableMock(null);
      selectMock.all = vi.fn().mockResolvedValue([testCompany]);
      mockSelectFn = vi.fn(() => selectMock);

      const result = await service.list(ORG_ID, { search: 'Acme' });

      expect(result).toHaveLength(1);
      expect(selectMock.where).toHaveBeenCalled();
    });

    it('should apply status filter', async () => {
      const selectMock = createChainableMock(null);
      selectMock.all = vi.fn().mockResolvedValue([testCompany]);
      mockSelectFn = vi.fn(() => selectMock);

      const result = await service.list(ORG_ID, { status: 'active' });

      expect(result).toHaveLength(1);
    });

    it('should apply assignedTo filter', async () => {
      const selectMock = createChainableMock(null);
      selectMock.all = vi.fn().mockResolvedValue([testCompany]);
      mockSelectFn = vi.fn(() => selectMock);

      const result = await service.list(ORG_ID, { assignedTo: USER_ID });

      expect(result).toHaveLength(1);
    });
  });

  describe('listPaginated', () => {
    it('should return paginated companies', async () => {
      const selectMock = createChainableMock(null);
      selectMock.all = vi.fn().mockResolvedValue([testCompany]);
      mockSelectFn = vi.fn(() => selectMock);

      const result = await service.listPaginated(ORG_ID, undefined, { limit: 10, offset: 0 });

      expect(result).toHaveLength(1);
      expect(selectMock.limit).toHaveBeenCalledWith(10);
      expect(selectMock.offset).toHaveBeenCalledWith(0);
    });

    it('should return results without pagination params', async () => {
      const selectMock = createChainableMock(null);
      selectMock.all = vi.fn().mockResolvedValue([testCompany]);
      mockSelectFn = vi.fn(() => selectMock);

      const result = await service.listPaginated(ORG_ID);

      expect(result).toHaveLength(1);
      // limit/offset should not be called when no pagination
      expect(selectMock.limit).not.toHaveBeenCalled();
    });

    it('should apply filters with pagination', async () => {
      const selectMock = createChainableMock(null);
      selectMock.all = vi.fn().mockResolvedValue([testCompany]);
      mockSelectFn = vi.fn(() => selectMock);

      const result = await service.listPaginated(
        ORG_ID,
        { type: 'customer', status: 'active' },
        { limit: 5, offset: 10 }
      );

      expect(result).toHaveLength(1);
      expect(selectMock.where).toHaveBeenCalled();
      expect(selectMock.limit).toHaveBeenCalledWith(5);
      expect(selectMock.offset).toHaveBeenCalledWith(10);
    });
  });

  describe('count', () => {
    it('should return count of companies', async () => {
      const selectMock = createChainableMock(null);
      selectMock.get = vi.fn().mockResolvedValue({ count: 5 });
      mockSelectFn = vi.fn(() => selectMock);

      const result = await service.count(ORG_ID);

      expect(result).toBe(5);
    });

    it('should return 0 when no companies match', async () => {
      const selectMock = createChainableMock(null);
      selectMock.get = vi.fn().mockResolvedValue(null);
      mockSelectFn = vi.fn(() => selectMock);

      const result = await service.count(ORG_ID);

      expect(result).toBe(0);
    });

    it('should apply filters when counting', async () => {
      const selectMock = createChainableMock(null);
      selectMock.get = vi.fn().mockResolvedValue({ count: 2 });
      mockSelectFn = vi.fn(() => selectMock);

      const result = await service.count(ORG_ID, { type: 'customer' });

      expect(result).toBe(2);
      expect(selectMock.where).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update company fields and return updated company', async () => {
      const updatedCompany = { ...testCompany, name: 'Acme Corp Updated' };

      // getById (existence check) returns existing, then update, then getById returns updated
      let selectCallCount = 0;
      mockSelectFn = vi.fn(() => {
        selectCallCount++;
        if (selectCallCount === 1) {
          return createChainableMock(testCompany);
        }
        return createChainableMock(updatedCompany);
      });

      mockUpdateFn = vi.fn(() => createChainableMock(null));

      const result = await service.update(ORG_ID, COMPANY_ID, { name: 'Acme Corp Updated' });

      expect(result.name).toBe('Acme Corp Updated');
      expect(mockUpdateFn).toHaveBeenCalled();
    });

    it('should throw error when company not found', async () => {
      mockSelectFn = vi.fn(() => createChainableMock(null));

      await expect(service.update(ORG_ID, 'nonexistent', { name: 'Test' })).rejects.toThrow(
        'Company not found'
      );
    });

    it('should throw error if update verification fails', async () => {
      // First getById returns existing, second returns null
      let selectCallCount = 0;
      mockSelectFn = vi.fn(() => {
        selectCallCount++;
        if (selectCallCount === 1) {
          return createChainableMock(testCompany);
        }
        return createChainableMock(null);
      });

      mockUpdateFn = vi.fn(() => createChainableMock(null));

      await expect(
        service.update(ORG_ID, COMPANY_ID, { name: 'Updated' })
      ).rejects.toThrow('Failed to update company');
    });

    it('should convert tags array to JSON string', async () => {
      const updatedCompany = { ...testCompany, tags: '["new-tag"]' };

      let selectCallCount = 0;
      mockSelectFn = vi.fn(() => {
        selectCallCount++;
        if (selectCallCount === 1) {
          return createChainableMock(testCompany);
        }
        return createChainableMock(updatedCompany);
      });

      const updateMock = createChainableMock(null);
      mockUpdateFn = vi.fn(() => updateMock);

      const result = await service.update(ORG_ID, COMPANY_ID, { tags: ['new-tag'] });

      expect(result).toBeDefined();
      expect(mockUpdateFn).toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('should delete an existing company', async () => {
      mockSelectFn = vi.fn(() => createChainableMock(testCompany));
      mockDeleteFn = vi.fn(() => createChainableMock(null));

      await expect(service.delete(ORG_ID, COMPANY_ID)).resolves.toBeUndefined();
      expect(mockDeleteFn).toHaveBeenCalled();
    });

    it('should throw error when company not found', async () => {
      mockSelectFn = vi.fn(() => createChainableMock(null));

      await expect(service.delete(ORG_ID, 'nonexistent')).rejects.toThrow('Company not found');
    });
  });

  describe('getStats', () => {
    it('should return company statistics grouped by type and status', async () => {
      const companiesList = [
        { ...testCompany, type: 'customer', status: 'active' },
        { ...testCompany, id: 'c2', type: 'customer', status: 'inactive' },
        { ...testCompany, id: 'c3', type: 'vendor', status: 'active' },
      ];

      const selectMock = createChainableMock(null);
      selectMock.all = vi.fn().mockResolvedValue(companiesList);
      mockSelectFn = vi.fn(() => selectMock);

      const result = await service.getStats(ORG_ID);

      expect(result.total).toBe(3);
      expect(result.byType).toEqual({ customer: 2, vendor: 1 });
      expect(result.byStatus).toEqual({ active: 2, inactive: 1 });
    });

    it('should return empty stats when no companies exist', async () => {
      const selectMock = createChainableMock(null);
      selectMock.all = vi.fn().mockResolvedValue([]);
      mockSelectFn = vi.fn(() => selectMock);

      const result = await service.getStats(ORG_ID);

      expect(result.total).toBe(0);
      expect(result.byType).toEqual({});
      expect(result.byStatus).toEqual({});
    });
  });
});
