/**
 * Perfex Dialyse SDK - API Client
 * Main client for interacting with the Dialyse API
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import type {
  DialyseSdkConfig,
  ApiResponse,
  // Patient
  DialysePatient,
  CreatePatientInput,
  UpdatePatientInput,
  PatientStats,
  // Vascular Access
  VascularAccess,
  CreateVascularAccessInput,
  // Prescription
  DialysePrescription,
  CreatePrescriptionInput,
  // Machine
  DialysisMachine,
  CreateMachineInput,
  MachineStats,
  MachineMaintenance,
  CreateMaintenanceInput,
  // Session
  DialysisSession,
  CreateSessionInput,
  SessionSlot,
  CreateSlotInput,
  SessionRecord,
  CreateSessionRecordInput,
  SessionIncident,
  CreateSessionIncidentInput,
  // Lab
  LabResult,
  CreateLabResultInput,
  // Alert
  ClinicalAlert,
  CreateAlertInput,
  AlertStats,
  // Dashboard
  DashboardData,
} from './types';

export class DialyseApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public response?: unknown
  ) {
    super(message);
    this.name = 'DialyseApiError';
  }
}

export class DialyseClient {
  private client: AxiosInstance;

  constructor(config: DialyseSdkConfig) {

    this.client = axios.create({
      baseURL: config.baseUrl.replace(/\/$/, '') + '/api/v1/dialyse',
      timeout: config.timeout || 30000,
      headers: {
        'Content-Type': 'application/json',
        ...(config.apiKey && { 'X-API-Key': config.apiKey }),
        ...(config.accessToken && { Authorization: `Bearer ${config.accessToken}` }),
        ...(config.organizationId && { 'X-Organization-Id': config.organizationId }),
        ...config.headers,
      },
    });

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        const message = (error.response?.data as any)?.error || error.message;
        throw new DialyseApiError(
          message,
          error.response?.status || 500,
          error.response?.data
        );
      }
    );
  }

  /**
   * Set organization ID for all requests
   */
  setOrganizationId(organizationId: string): void {
    this.client.defaults.headers['X-Organization-Id'] = organizationId;
  }

  /**
   * Set access token for authentication
   */
  setAccessToken(token: string): void {
    this.client.defaults.headers['Authorization'] = `Bearer ${token}`;
  }

  // ==========================================================================
  // DASHBOARD
  // ==========================================================================

  /**
   * Get dashboard overview data
   */
  async getDashboard(): Promise<DashboardData> {
    const response = await this.client.get<ApiResponse<DashboardData>>('/dashboard');
    return response.data.data;
  }

  // ==========================================================================
  // PATIENTS
  // ==========================================================================

  /**
   * List all patients with optional filters
   */
  async listPatients(params?: {
    search?: string;
    status?: string;
    requiresIsolation?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<DialysePatient[]> {
    const response = await this.client.get<ApiResponse<DialysePatient[]>>('/patients', { params });
    return response.data.data;
  }

  /**
   * Get patient by ID
   */
  async getPatient(patientId: string): Promise<DialysePatient> {
    const response = await this.client.get<ApiResponse<DialysePatient>>(`/patients/${patientId}`);
    return response.data.data;
  }

  /**
   * Create a new patient
   */
  async createPatient(data: CreatePatientInput): Promise<DialysePatient> {
    const response = await this.client.post<ApiResponse<DialysePatient>>('/patients', data);
    return response.data.data;
  }

  /**
   * Update a patient
   */
  async updatePatient(patientId: string, data: UpdatePatientInput): Promise<DialysePatient> {
    const response = await this.client.put<ApiResponse<DialysePatient>>(`/patients/${patientId}`, data);
    return response.data.data;
  }

  /**
   * Delete a patient
   */
  async deletePatient(patientId: string): Promise<void> {
    await this.client.delete(`/patients/${patientId}`);
  }

  /**
   * Get patient statistics
   */
  async getPatientStats(): Promise<PatientStats> {
    const response = await this.client.get<ApiResponse<PatientStats>>('/patients/stats');
    return response.data.data;
  }

  /**
   * Update patient serology
   */
  async updatePatientSerology(patientId: string, data: {
    hivStatus?: string;
    hbvStatus?: string;
    hcvStatus?: string;
  }): Promise<DialysePatient> {
    const response = await this.client.put<ApiResponse<DialysePatient>>(
      `/patients/${patientId}/serology`,
      data
    );
    return response.data.data;
  }

  // ==========================================================================
  // VASCULAR ACCESSES
  // ==========================================================================

  /**
   * List vascular accesses for a patient
   */
  async listVascularAccesses(patientId: string): Promise<VascularAccess[]> {
    const response = await this.client.get<ApiResponse<VascularAccess[]>>(
      `/patients/${patientId}/vascular-accesses`
    );
    return response.data.data;
  }

  /**
   * Create a vascular access
   */
  async createVascularAccess(data: CreateVascularAccessInput): Promise<VascularAccess> {
    const response = await this.client.post<ApiResponse<VascularAccess>>('/vascular-accesses', data);
    return response.data.data;
  }

  /**
   * Update vascular access status
   */
  async updateVascularAccessStatus(accessId: string, status: string, reason?: string): Promise<VascularAccess> {
    const response = await this.client.put<ApiResponse<VascularAccess>>(
      `/vascular-accesses/${accessId}/status`,
      { status, reason }
    );
    return response.data.data;
  }

  // ==========================================================================
  // PRESCRIPTIONS
  // ==========================================================================

  /**
   * List prescriptions for a patient
   */
  async listPrescriptions(patientId: string, status?: string): Promise<DialysePrescription[]> {
    const response = await this.client.get<ApiResponse<DialysePrescription[]>>(
      `/patients/${patientId}/prescriptions`,
      { params: { status } }
    );
    return response.data.data;
  }

  /**
   * Get active prescription for a patient
   */
  async getActivePrescription(patientId: string): Promise<DialysePrescription | null> {
    const response = await this.client.get<ApiResponse<DialysePrescription>>(
      `/patients/${patientId}/prescriptions/active`
    );
    return response.data.data;
  }

  /**
   * Create a prescription
   */
  async createPrescription(data: CreatePrescriptionInput): Promise<DialysePrescription> {
    const response = await this.client.post<ApiResponse<DialysePrescription>>('/prescriptions', data);
    return response.data.data;
  }

  /**
   * Renew a prescription (creates new and supersedes old)
   */
  async renewPrescription(prescriptionId: string, changes?: Partial<CreatePrescriptionInput>): Promise<DialysePrescription> {
    const response = await this.client.post<ApiResponse<DialysePrescription>>(
      `/prescriptions/${prescriptionId}/renew`,
      changes
    );
    return response.data.data;
  }

  /**
   * Cancel a prescription
   */
  async cancelPrescription(prescriptionId: string): Promise<DialysePrescription> {
    const response = await this.client.post<ApiResponse<DialysePrescription>>(
      `/prescriptions/${prescriptionId}/cancel`
    );
    return response.data.data;
  }

  // ==========================================================================
  // MACHINES
  // ==========================================================================

  /**
   * List all machines
   */
  async listMachines(params?: {
    status?: string;
    isolationOnly?: boolean;
    limit?: number;
  }): Promise<DialysisMachine[]> {
    const response = await this.client.get<ApiResponse<DialysisMachine[]>>('/machines', { params });
    return response.data.data;
  }

  /**
   * Get machine by ID
   */
  async getMachine(machineId: string): Promise<DialysisMachine> {
    const response = await this.client.get<ApiResponse<DialysisMachine>>(`/machines/${machineId}`);
    return response.data.data;
  }

  /**
   * Create a machine
   */
  async createMachine(data: CreateMachineInput): Promise<DialysisMachine> {
    const response = await this.client.post<ApiResponse<DialysisMachine>>('/machines', data);
    return response.data.data;
  }

  /**
   * Update a machine
   */
  async updateMachine(machineId: string, data: Partial<CreateMachineInput>): Promise<DialysisMachine> {
    const response = await this.client.put<ApiResponse<DialysisMachine>>(`/machines/${machineId}`, data);
    return response.data.data;
  }

  /**
   * Update machine status
   */
  async updateMachineStatus(machineId: string, status: string): Promise<DialysisMachine> {
    const response = await this.client.put<ApiResponse<DialysisMachine>>(
      `/machines/${machineId}/status`,
      { status }
    );
    return response.data.data;
  }

  /**
   * Get machine statistics
   */
  async getMachineStats(): Promise<MachineStats> {
    const response = await this.client.get<ApiResponse<MachineStats>>('/machines/stats');
    return response.data.data;
  }

  /**
   * Get available machines (optionally for isolation)
   */
  async getAvailableMachines(forIsolation?: boolean): Promise<DialysisMachine[]> {
    const response = await this.client.get<ApiResponse<DialysisMachine[]>>('/machines/available', {
      params: { forIsolation },
    });
    return response.data.data;
  }

  // ==========================================================================
  // MACHINE MAINTENANCE
  // ==========================================================================

  /**
   * List maintenance records for a machine
   */
  async listMachineMaintenance(machineId: string): Promise<MachineMaintenance[]> {
    const response = await this.client.get<ApiResponse<MachineMaintenance[]>>(
      `/machines/${machineId}/maintenance`
    );
    return response.data.data;
  }

  /**
   * Create maintenance record
   */
  async createMaintenance(data: CreateMaintenanceInput): Promise<MachineMaintenance> {
    const response = await this.client.post<ApiResponse<MachineMaintenance>>('/maintenance', data);
    return response.data.data;
  }

  /**
   * Complete maintenance
   */
  async completeMaintenance(maintenanceId: string, data: {
    workPerformed?: string;
    cost?: number;
    partsReplaced?: string[];
  }): Promise<MachineMaintenance> {
    const response = await this.client.post<ApiResponse<MachineMaintenance>>(
      `/maintenance/${maintenanceId}/complete`,
      data
    );
    return response.data.data;
  }

  // ==========================================================================
  // SESSION SLOTS
  // ==========================================================================

  /**
   * List session slots
   */
  async listSlots(): Promise<SessionSlot[]> {
    const response = await this.client.get<ApiResponse<SessionSlot[]>>('/slots');
    return response.data.data;
  }

  /**
   * Create a session slot
   */
  async createSlot(data: CreateSlotInput): Promise<SessionSlot> {
    const response = await this.client.post<ApiResponse<SessionSlot>>('/slots', data);
    return response.data.data;
  }

  /**
   * Update a session slot
   */
  async updateSlot(slotId: string, data: Partial<CreateSlotInput>): Promise<SessionSlot> {
    const response = await this.client.put<ApiResponse<SessionSlot>>(`/slots/${slotId}`, data);
    return response.data.data;
  }

  // ==========================================================================
  // SESSIONS
  // ==========================================================================

  /**
   * List sessions with filters
   */
  async listSessions(params?: {
    patientId?: string;
    machineId?: string;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
    limit?: number;
  }): Promise<DialysisSession[]> {
    const response = await this.client.get<ApiResponse<DialysisSession[]>>('/sessions', { params });
    return response.data.data;
  }

  /**
   * Get session by ID
   */
  async getSession(sessionId: string): Promise<DialysisSession> {
    const response = await this.client.get<ApiResponse<DialysisSession>>(`/sessions/${sessionId}`);
    return response.data.data;
  }

  /**
   * Create a session
   */
  async createSession(data: CreateSessionInput): Promise<DialysisSession> {
    const response = await this.client.post<ApiResponse<DialysisSession>>('/sessions', data);
    return response.data.data;
  }

  /**
   * Create recurring sessions
   */
  async createRecurringSessions(data: CreateSessionInput, weeks: number = 4): Promise<DialysisSession[]> {
    const response = await this.client.post<ApiResponse<DialysisSession[]>>(
      '/sessions/recurring',
      { ...data, weeks }
    );
    return response.data.data;
  }

  /**
   * Check-in patient for session
   */
  async checkInSession(sessionId: string): Promise<DialysisSession> {
    const response = await this.client.post<ApiResponse<DialysisSession>>(`/sessions/${sessionId}/check-in`);
    return response.data.data;
  }

  /**
   * Start a session
   */
  async startSession(sessionId: string, machineId?: string): Promise<DialysisSession> {
    const response = await this.client.post<ApiResponse<DialysisSession>>(
      `/sessions/${sessionId}/start`,
      { machineId }
    );
    return response.data.data;
  }

  /**
   * Complete a session
   */
  async completeSession(sessionId: string): Promise<DialysisSession> {
    const response = await this.client.post<ApiResponse<DialysisSession>>(`/sessions/${sessionId}/complete`);
    return response.data.data;
  }

  /**
   * Cancel a session
   */
  async cancelSession(sessionId: string, reason: string): Promise<DialysisSession> {
    const response = await this.client.post<ApiResponse<DialysisSession>>(
      `/sessions/${sessionId}/cancel`,
      { reason }
    );
    return response.data.data;
  }

  // ==========================================================================
  // SESSION RECORDS (Per-dialytic monitoring)
  // ==========================================================================

  /**
   * List records for a session
   */
  async listSessionRecords(sessionId: string): Promise<SessionRecord[]> {
    const response = await this.client.get<ApiResponse<SessionRecord[]>>(`/sessions/${sessionId}/records`);
    return response.data.data;
  }

  /**
   * Add a record to a session
   */
  async createSessionRecord(sessionId: string, data: CreateSessionRecordInput): Promise<SessionRecord> {
    const response = await this.client.post<ApiResponse<SessionRecord>>(
      `/sessions/${sessionId}/records`,
      data
    );
    return response.data.data;
  }

  // ==========================================================================
  // SESSION INCIDENTS
  // ==========================================================================

  /**
   * List incidents for a session
   */
  async listSessionIncidents(sessionId: string): Promise<SessionIncident[]> {
    const response = await this.client.get<ApiResponse<SessionIncident[]>>(`/sessions/${sessionId}/incidents`);
    return response.data.data;
  }

  /**
   * Report an incident
   */
  async createSessionIncident(sessionId: string, data: CreateSessionIncidentInput): Promise<SessionIncident> {
    const response = await this.client.post<ApiResponse<SessionIncident>>(
      `/sessions/${sessionId}/incidents`,
      data
    );
    return response.data.data;
  }

  // ==========================================================================
  // LAB RESULTS
  // ==========================================================================

  /**
   * List lab results for a patient
   */
  async listLabResults(patientId: string, limit?: number): Promise<LabResult[]> {
    const response = await this.client.get<ApiResponse<LabResult[]>>(
      `/patients/${patientId}/lab-results`,
      { params: { limit } }
    );
    return response.data.data;
  }

  /**
   * Get latest lab result
   */
  async getLatestLabResult(patientId: string): Promise<LabResult | null> {
    const response = await this.client.get<ApiResponse<LabResult>>(
      `/patients/${patientId}/lab-results/latest`
    );
    return response.data.data;
  }

  /**
   * Create a lab result
   */
  async createLabResult(data: CreateLabResultInput): Promise<LabResult> {
    const response = await this.client.post<ApiResponse<LabResult>>('/lab-results', data);
    return response.data.data;
  }

  /**
   * Import lab results from file data
   */
  async importLabResults(patientId: string, results: Array<{
    marker: string;
    value: number;
    unit?: string;
  }>): Promise<{ imported: number; errors: string[] }> {
    const response = await this.client.post<ApiResponse<{ imported: number; errors: string[] }>>(
      `/patients/${patientId}/lab-results/import`,
      { results }
    );
    return response.data.data;
  }

  /**
   * Calculate Kt/V
   */
  async calculateKtV(data: {
    ureaPre: number;
    ureaPost: number;
    postWeight: number;
    durationMinutes: number;
    ufVolume?: number;
  }): Promise<number> {
    const response = await this.client.post<ApiResponse<{ ktV: number }>>('/lab-results/calculate-ktv', data);
    return response.data.data.ktV;
  }

  /**
   * Get lab trend for a marker
   */
  async getLabTrend(patientId: string, marker: string, months?: number): Promise<Array<{ date: Date; value: number }>> {
    const response = await this.client.get<ApiResponse<Array<{ date: Date; value: number }>>>(
      `/patients/${patientId}/lab-results/trend/${marker}`,
      { params: { months } }
    );
    return response.data.data;
  }

  // ==========================================================================
  // CLINICAL ALERTS
  // ==========================================================================

  /**
   * List alerts with filters
   */
  async listAlerts(params?: {
    patientId?: string;
    status?: string;
    severity?: string;
    type?: string;
    limit?: number;
  }): Promise<ClinicalAlert[]> {
    const response = await this.client.get<ApiResponse<ClinicalAlert[]>>('/alerts', { params });
    return response.data.data;
  }

  /**
   * Get alert by ID
   */
  async getAlert(alertId: string): Promise<ClinicalAlert> {
    const response = await this.client.get<ApiResponse<ClinicalAlert>>(`/alerts/${alertId}`);
    return response.data.data;
  }

  /**
   * Create an alert
   */
  async createAlert(data: CreateAlertInput): Promise<ClinicalAlert> {
    const response = await this.client.post<ApiResponse<ClinicalAlert>>('/alerts', data);
    return response.data.data;
  }

  /**
   * Acknowledge an alert
   */
  async acknowledgeAlert(alertId: string): Promise<ClinicalAlert> {
    const response = await this.client.post<ApiResponse<ClinicalAlert>>(`/alerts/${alertId}/acknowledge`);
    return response.data.data;
  }

  /**
   * Resolve an alert
   */
  async resolveAlert(alertId: string, notes?: string): Promise<ClinicalAlert> {
    const response = await this.client.post<ApiResponse<ClinicalAlert>>(
      `/alerts/${alertId}/resolve`,
      { notes }
    );
    return response.data.data;
  }

  /**
   * Dismiss an alert
   */
  async dismissAlert(alertId: string): Promise<ClinicalAlert> {
    const response = await this.client.post<ApiResponse<ClinicalAlert>>(`/alerts/${alertId}/dismiss`);
    return response.data.data;
  }

  /**
   * Get alert statistics
   */
  async getAlertStats(): Promise<AlertStats> {
    const response = await this.client.get<ApiResponse<AlertStats>>('/alerts/stats');
    return response.data.data;
  }

  /**
   * Run automated alert generation
   */
  async generateAutomatedAlerts(): Promise<{
    serology: number;
    vascularAccess: number;
    lab: number;
  }> {
    const response = await this.client.post<ApiResponse<{
      serology: number;
      vascularAccess: number;
      lab: number;
    }>>('/alerts/generate');
    return response.data.data;
  }
}
