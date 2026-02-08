/**
 * Report Generation Service
 */

import { logger } from '../utils/logger';

export enum ReportType {
  INVOICES_AGING = 'finance.invoices_aging',
  DIALYSE_SESSIONS = 'healthcare.dialyse_sessions',
  DIALYSE_PATIENT_STATS = 'healthcare.dialyse_patient_stats',
  STOCK_LEVELS = 'inventory.stock_levels',
  AUDIT_TRAIL = 'audit.audit_trail',
}

export type ReportFormat = 'pdf' | 'excel' | 'csv' | 'json';

export interface ReportParams {
  type: ReportType;
  format: ReportFormat;
  organizationId: string;
  startDate?: Date;
  endDate?: Date;
  filters?: Record<string, any>;
}

export interface ReportResult {
  id: string;
  type: ReportType;
  format: ReportFormat;
  filename: string;
  data: any;
  generatedAt: Date;
  rowCount: number;
}

export class ReportService {
  constructor(private db: D1Database) {}

  async generate(params: ReportParams, userId: string): Promise<ReportResult> {
    const id = crypto.randomUUID();
    logger.info('Generating report', { type: params.type, format: params.format });

    const data = await this.fetchReportData(params);
    const formattedData = this.formatData(data, params);

    return {
      id,
      type: params.type,
      format: params.format,
      filename: this.generateFilename(params),
      data: formattedData,
      generatedAt: new Date(),
      rowCount: Array.isArray(data) ? data.length : 1,
    };
  }

  private async fetchReportData(params: ReportParams): Promise<any> {
    const { type, organizationId, startDate, endDate } = params;

    switch (type) {
      case ReportType.DIALYSE_SESSIONS:
        return this.getDialyseSessionsData(organizationId, startDate, endDate);
      case ReportType.DIALYSE_PATIENT_STATS:
        return this.getDialysePatientStatsData(organizationId);
      default:
        return { message: 'Report type not implemented' };
    }
  }

  private async getDialyseSessionsData(orgId: string, start?: Date, end?: Date): Promise<any> {
    let query = 'SELECT * FROM dialyse_sessions WHERE organization_id = ?';
    const params: any[] = [orgId];

    if (start) {
      query += ' AND session_date >= ?';
      params.push(start.toISOString());
    }
    if (end) {
      query += ' AND session_date <= ?';
      params.push(end.toISOString());
    }

    const result = await this.db.prepare(query).bind(...params).all();
    return { sessions: result.results || [], count: (result.results || []).length };
  }

  private async getDialysePatientStatsData(orgId: string): Promise<any> {
    const result = await this.db.prepare(
      'SELECT COUNT(*) as total FROM dialyse_patients WHERE organization_id = ?'
    ).bind(orgId).first();
    return { summary: result };
  }

  private formatData(data: any, params: ReportParams): any {
    if (params.format === 'csv') return this.formatAsCsv(data);
    return data;
  }

  private formatAsCsv(data: any): string {
    const items = data.sessions || data.items || [];
    if (items.length === 0) return '';
    const headers = Object.keys(items[0]);
    return [headers.join(','), ...items.map((i: any) => headers.map(h => i[h] ?? '').join(','))].join('\n');
  }

  private generateFilename(params: ReportParams): string {
    const date = new Date().toISOString().split('T')[0];
    const typePart = params.type.replace('.', '_');
    return 'report_' + typePart + '_' + date + '.' + params.format;
  }

  /**
   * Get General Ledger for an account
   */
  async getGeneralLedger(
    organizationId: string,
    accountId: string,
    filters: { startDate?: Date; endDate?: Date }
  ): Promise<any> {
    let query = `
      SELECT je.*, jel.debit, jel.credit, a.name as account_name, a.code as account_code
      FROM journal_entry_lines jel
      JOIN journal_entries je ON jel.journal_entry_id = je.id
      JOIN accounts a ON jel.account_id = a.id
      WHERE jel.account_id = ? AND je.organization_id = ?
    `;
    const params: any[] = [accountId, organizationId];

    if (filters.startDate) {
      query += ' AND je.entry_date >= ?';
      params.push(filters.startDate.toISOString());
    }
    if (filters.endDate) {
      query += ' AND je.entry_date <= ?';
      params.push(filters.endDate.toISOString());
    }

    query += ' ORDER BY je.entry_date ASC';

    const result = await this.db.prepare(query).bind(...params).all();
    const entries = result.results || [];

    let runningBalance = 0;
    const ledgerEntries = entries.map((entry: any) => {
      runningBalance += (entry.debit || 0) - (entry.credit || 0);
      return {
        ...entry,
        runningBalance,
      };
    });

    return {
      accountId,
      entries: ledgerEntries,
      totalDebit: entries.reduce((sum: number, e: any) => sum + (e.debit || 0), 0),
      totalCredit: entries.reduce((sum: number, e: any) => sum + (e.credit || 0), 0),
      balance: runningBalance,
    };
  }

  /**
   * Get Trial Balance
   */
  async getTrialBalance(
    organizationId: string,
    filters: { startDate?: Date; endDate?: Date }
  ): Promise<any> {
    let query = `
      SELECT
        a.id, a.code, a.name, a.type,
        COALESCE(SUM(jel.debit), 0) as total_debit,
        COALESCE(SUM(jel.credit), 0) as total_credit
      FROM accounts a
      LEFT JOIN journal_entry_lines jel ON a.id = jel.account_id
      LEFT JOIN journal_entries je ON jel.journal_entry_id = je.id
      WHERE a.organization_id = ?
    `;
    const params: any[] = [organizationId];

    if (filters.startDate) {
      query += ' AND (je.entry_date IS NULL OR je.entry_date >= ?)';
      params.push(filters.startDate.toISOString());
    }
    if (filters.endDate) {
      query += ' AND (je.entry_date IS NULL OR je.entry_date <= ?)';
      params.push(filters.endDate.toISOString());
    }

    query += ' GROUP BY a.id, a.code, a.name, a.type ORDER BY a.code';

    const result = await this.db.prepare(query).bind(...params).all();
    const accounts = result.results || [];

    return {
      accounts: accounts.map((a: any) => ({
        ...a,
        balance: a.total_debit - a.total_credit,
      })),
      totalDebit: accounts.reduce((sum: number, a: any) => sum + a.total_debit, 0),
      totalCredit: accounts.reduce((sum: number, a: any) => sum + a.total_credit, 0),
    };
  }

  /**
   * Get Balance Sheet
   */
  async getBalanceSheet(organizationId: string, asOfDate: Date): Promise<any> {
    const query = `
      SELECT
        a.type,
        a.id, a.code, a.name,
        COALESCE(SUM(jel.debit), 0) - COALESCE(SUM(jel.credit), 0) as balance
      FROM accounts a
      LEFT JOIN journal_entry_lines jel ON a.id = jel.account_id
      LEFT JOIN journal_entries je ON jel.journal_entry_id = je.id AND je.entry_date <= ?
      WHERE a.organization_id = ? AND a.type IN ('asset', 'liability', 'equity')
      GROUP BY a.id, a.code, a.name, a.type
      ORDER BY a.type, a.code
    `;

    const result = await this.db.prepare(query).bind(asOfDate.toISOString(), organizationId).all();
    const accounts = result.results || [];

    const assets = accounts.filter((a: any) => a.type === 'asset');
    const liabilities = accounts.filter((a: any) => a.type === 'liability');
    const equity = accounts.filter((a: any) => a.type === 'equity');

    const totalAssets = assets.reduce((sum: number, a: any) => sum + a.balance, 0);
    const totalLiabilities = liabilities.reduce((sum: number, a: any) => sum + Math.abs(a.balance), 0);
    const totalEquity = equity.reduce((sum: number, a: any) => sum + Math.abs(a.balance), 0);

    return {
      asOfDate: asOfDate.toISOString(),
      assets: { accounts: assets, total: totalAssets },
      liabilities: { accounts: liabilities, total: totalLiabilities },
      equity: { accounts: equity, total: totalEquity },
      totalLiabilitiesAndEquity: totalLiabilities + totalEquity,
    };
  }

  /**
   * Get Income Statement (Profit & Loss)
   */
  async getIncomeStatement(
    organizationId: string,
    filters: { startDate?: Date; endDate?: Date }
  ): Promise<any> {
    let query = `
      SELECT
        a.type,
        a.id, a.code, a.name,
        COALESCE(SUM(jel.credit), 0) - COALESCE(SUM(jel.debit), 0) as balance
      FROM accounts a
      LEFT JOIN journal_entry_lines jel ON a.id = jel.account_id
      LEFT JOIN journal_entries je ON jel.journal_entry_id = je.id
      WHERE a.organization_id = ? AND a.type IN ('revenue', 'expense')
    `;
    const params: any[] = [organizationId];

    if (filters.startDate) {
      query += ' AND je.entry_date >= ?';
      params.push(filters.startDate.toISOString());
    }
    if (filters.endDate) {
      query += ' AND je.entry_date <= ?';
      params.push(filters.endDate.toISOString());
    }

    query += ' GROUP BY a.id, a.code, a.name, a.type ORDER BY a.type, a.code';

    const result = await this.db.prepare(query).bind(...params).all();
    const accounts = result.results || [];

    const revenues = accounts.filter((a: any) => a.type === 'revenue');
    const expenses = accounts.filter((a: any) => a.type === 'expense');

    const totalRevenue = revenues.reduce((sum: number, a: any) => sum + a.balance, 0);
    const totalExpenses = expenses.reduce((sum: number, a: any) => sum + Math.abs(a.balance), 0);

    return {
      period: {
        startDate: filters.startDate?.toISOString(),
        endDate: filters.endDate?.toISOString(),
      },
      revenues: { accounts: revenues, total: totalRevenue },
      expenses: { accounts: expenses, total: totalExpenses },
      netIncome: totalRevenue - totalExpenses,
    };
  }
}
