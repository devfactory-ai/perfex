/**
 * Test Fixtures
 * Reusable test data for consistent testing
 */

export const testUser = {
  id: 'user-test-001',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  password: 'hashedPassword123',
  organizationId: 'org-test-001',
  role: 'admin',
  active: true,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

export const testOrganization = {
  id: 'org-test-001',
  name: 'Test Organization',
  slug: 'test-org',
  plan: 'enterprise',
  active: true,
  settings: {},
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

export const testPatient = {
  id: 'patient-test-001',
  organizationId: 'org-test-001',
  firstName: 'Jean',
  lastName: 'Dupont',
  dateOfBirth: new Date('1970-05-15'),
  gender: 'male',
  nationalId: '12345678',
  phone: '+21698765432',
  email: 'jean.dupont@example.com',
  address: '123 Rue Test, Tunis',
  bloodType: 'A+',
  active: true,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

export const testDialysePatient = {
  ...testPatient,
  id: 'dialyse-patient-test-001',
  dryWeight: 70.5,
  targetWeight: 71.0,
  dialysisStartDate: new Date('2023-01-01'),
  vascularAccessType: 'fav',
  hivStatus: 'negative',
  hbvStatus: 'immune',
  hcvStatus: 'negative',
  hepatitisBVaccinated: true,
};

export const testDialyseSession = {
  id: 'session-test-001',
  patientId: 'dialyse-patient-test-001',
  prescriptionId: 'prescription-test-001',
  machineId: 'machine-test-001',
  slotId: 'slot-test-001',
  sessionDate: new Date('2024-06-15'),
  scheduledStartTime: '08:00',
  scheduledEndTime: '12:00',
  status: 'scheduled',
  organizationId: 'org-test-001',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

export const testMachine = {
  id: 'machine-test-001',
  organizationId: 'org-test-001',
  serialNumber: 'DM-2024-001',
  model: 'Fresenius 5008',
  manufacturer: 'Fresenius',
  location: 'Salle A',
  status: 'available',
  lastMaintenanceDate: new Date('2024-05-01'),
  nextMaintenanceDate: new Date('2024-08-01'),
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

export const testInvoice = {
  id: 'invoice-test-001',
  organizationId: 'org-test-001',
  number: 'INV-2024-001',
  customerId: 'customer-test-001',
  customerName: 'Client Test',
  customerEmail: 'client@test.com',
  date: new Date('2024-06-01'),
  dueDate: new Date('2024-07-01'),
  status: 'draft',
  subtotal: 1000,
  taxAmount: 190,
  total: 1190,
  amountPaid: 0,
  amountDue: 1190,
  currency: 'TND',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

export const testJWT = {
  accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLXRlc3QtMDAxIiwiZW1haWwiOiJ0ZXN0QGV4YW1wbGUuY29tIiwidHlwZSI6ImFjY2VzcyIsImlhdCI6MTcwNDA2NzIwMCwiZXhwIjoxNzA0MTUzNjAwfQ.test',
  refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLXRlc3QtMDAxIiwic2Vzc2lvbklkIjoic2Vzc2lvbi0wMDEiLCJ0eXBlIjoicmVmcmVzaCIsImlhdCI6MTcwNDA2NzIwMCwiZXhwIjoxNzA0NjcyMDAwfQ.test',
};

// Factory functions for creating test data with overrides
export const createTestUser = (overrides = {}) => ({
  ...testUser,
  id: 'user-' + Math.random().toString(36).substring(7),
  ...overrides,
});

export const createTestPatient = (overrides = {}) => ({
  ...testPatient,
  id: 'patient-' + Math.random().toString(36).substring(7),
  ...overrides,
});

export const createTestSession = (overrides = {}) => ({
  ...testDialyseSession,
  id: 'session-' + Math.random().toString(36).substring(7),
  ...overrides,
});

export const createTestInvoice = (overrides = {}) => ({
  ...testInvoice,
  id: 'invoice-' + Math.random().toString(36).substring(7),
  number: 'INV-' + Math.random().toString(36).substring(7).toUpperCase(),
  ...overrides,
});
