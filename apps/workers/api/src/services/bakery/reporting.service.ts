/**
 * Bakery Reporting Service
 * Manages dashboards, daily summaries, report configurations, and accounting exports
 */

import { eq, and, desc, sql } from 'drizzle-orm';
import { drizzleDb } from '../../db';
import {
  bakeryArticles,
  bakeryStockAlerts,
  bakeryProofingCarts,
  bakeryQualityControls,
  bakeryProductionComparisons,
  bakeryEquipment,
  bakeryInterventions,
  bakeryMaintenanceAlerts,
  bakeryB2BClients,
  bakeryDeliveryOrders,
  bakerySalesSessions,
  bakeryReportConfigs,
  bakeryGeneratedReports,
  bakeryAccountingExports,
  bakeryDailySalesSummary,
  type BakeryReportConfig,
  type BakeryGeneratedReport,
  type BakeryAccountingExport,
  type BakeryDailySalesSummary,
} from '@perfex/database';

interface CreateReportConfigInput {
  reportName: string;
  type: 'quotidien' | 'hebdomadaire' | 'mensuel';
  templateId?: string;
  emailRecipients?: string[];
  whatsappRecipients?: string[];
  sendTime: string;
  sendDay?: number;
}

interface GenerateReportInput {
  configId?: string;
  reportType?: 'daily' | 'weekly' | 'monthly';
  startDate: string;
  endDate: string;
}

interface CreateAccountingExportInput {
  periodStart: string;
  periodEnd: string;
  exportType: 'ventes' | 'achats' | 'stocks' | 'complet';
  format: 'csv' | 'excel' | 'sage' | 'ciel';
}

interface QueryFilters {
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
}

export class BakeryReportingService {
  /**
   * Get stock dashboard data
   */
  async getStockDashboard(organizationId: string): Promise<any> {
    // Get all articles
    const articles = await drizzleDb
      .select()
      .from(bakeryArticles)
      .where(and(
        eq(bakeryArticles.organizationId, organizationId),
        eq(bakeryArticles.isActive, true)
      ))
      .all() as any[];

    // Count low stock items
    const lowStockItems = articles.filter(
      (a) => a.currentStock !== null &&
             a.minimumStock !== null &&
             a.currentStock <= a.minimumStock
    );

    // Count out of stock items
    const outOfStockItems = articles.filter((a) => (a.currentStock || 0) === 0);

    // Get active alerts
    const alerts = await drizzleDb
      .select()
      .from(bakeryStockAlerts)
      .where(and(
        eq(bakeryStockAlerts.organizationId, organizationId),
        eq(bakeryStockAlerts.isAcknowledged, false)
      ))
      .all();

    // Calculate total stock value
    const totalStockValue = articles.reduce(
      (sum, a) => sum + ((a.currentStock || 0) * (a.averagePurchasePrice || 0)),
      0
    );

    // Group by category
    const byCategory = articles.reduce((acc: any, a) => {
      if (!acc[a.category]) {
        acc[a.category] = { count: 0, value: 0 };
      }
      acc[a.category].count++;
      acc[a.category].value += (a.currentStock || 0) * (a.averagePurchasePrice || 0);
      return acc;
    }, {});

    return {
      totalArticles: articles.length,
      lowStockCount: lowStockItems.length,
      outOfStockCount: outOfStockItems.length,
      activeAlertsCount: alerts.length,
      totalStockValue,
      byCategory,
      lowStockItems: lowStockItems.slice(0, 10), // Top 10
      recentAlerts: alerts.slice(0, 5),
    };
  }

  /**
   * Get production dashboard data
   * Note: bakeryOvenPassages doesn't have organizationId, filter via cart
   */
  async getProductionDashboard(organizationId: string): Promise<any> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get today's proofing carts (using entryTime instead of startTime)
    const todayCarts = await drizzleDb
      .select()
      .from(bakeryProofingCarts)
      .where(and(
        eq(bakeryProofingCarts.organizationId, organizationId),
        sql`${bakeryProofingCarts.entryTime} >= ${today.toISOString()}`,
        sql`${bakeryProofingCarts.entryTime} < ${tomorrow.toISOString()}`
      ))
      .all();

    // Get today's quality controls (using controlDate instead of controlTime)
    const todayControls = await drizzleDb
      .select()
      .from(bakeryQualityControls)
      .where(and(
        eq(bakeryQualityControls.organizationId, organizationId),
        sql`${bakeryQualityControls.controlDate} >= ${today.toISOString()}`,
        sql`${bakeryQualityControls.controlDate} < ${tomorrow.toISOString()}`
      ))
      .all() as any[];

    const conformingCount = todayControls.filter((c) => c.isConforming).length;
    const nonConformingCount = todayControls.filter((c) => !c.isConforming).length;

    // Get production comparisons for today (using comparisonDate instead of productionDate)
    // Schema uses: conformingQuantity, defectiveQuantity, theoreticalVariance, conformityRate, lossRate
    const comparisons = await drizzleDb
      .select()
      .from(bakeryProductionComparisons)
      .where(and(
        eq(bakeryProductionComparisons.organizationId, organizationId),
        sql`${bakeryProductionComparisons.comparisonDate} >= ${today.toISOString()}`,
        sql`${bakeryProductionComparisons.comparisonDate} < ${tomorrow.toISOString()}`
      ))
      .all() as any[];

    const totalTheoretical = comparisons.reduce((sum, c) => sum + (c.theoreticalQuantity || 0), 0);
    const totalConforming = comparisons.reduce((sum, c) => sum + (c.conformingQuantity || 0), 0);
    const totalDefective = comparisons.reduce((sum, c) => sum + (c.defectiveQuantity || 0), 0);
    const avgConformityRate = comparisons.length > 0
      ? comparisons.reduce((sum, c) => sum + (c.conformityRate || 0), 0) / comparisons.length
      : 100;

    // Group carts by status
    const cartsByStatus = (todayCarts as any[]).reduce((acc: any, c) => {
      acc[c.status] = (acc[c.status] || 0) + 1;
      return acc;
    }, {});

    // Calculate passages from carts (via cart relationship)
    const cartIds = (todayCarts as any[]).map(c => c.id);

    return {
      date: today.toISOString().split('T')[0],
      cartsTotal: todayCarts.length,
      cartsByStatus,
      qualityControlsTotal: todayControls.length,
      conformingCount,
      nonConformingCount,
      conformityRate: avgConformityRate,
      totalTheoretical,
      totalConforming,
      totalDefective,
    };
  }

  /**
   * Get sales dashboard data
   */
  async getSalesDashboard(
    organizationId: string,
    period?: string
  ): Promise<any> {
    const today = new Date();
    let startDate: Date;
    let endDate = new Date();

    switch (period) {
      case 'week':
        startDate = new Date(today);
        startDate.setDate(today.getDate() - 7);
        break;
      case 'month':
        startDate = new Date(today);
        startDate.setMonth(today.getMonth() - 1);
        break;
      case 'year':
        startDate = new Date(today);
        startDate.setFullYear(today.getFullYear() - 1);
        break;
      default: // today
        startDate = new Date(today);
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
    }

    // Get B2B orders (using totalAmountTTC instead of totalTTC)
    const orders = await drizzleDb
      .select()
      .from(bakeryDeliveryOrders)
      .where(and(
        eq(bakeryDeliveryOrders.organizationId, organizationId),
        sql`${bakeryDeliveryOrders.createdAt} >= ${startDate.toISOString()}`,
        sql`${bakeryDeliveryOrders.createdAt} <= ${endDate.toISOString()}`
      ))
      .all() as any[];

    const totalB2BRevenue = orders
      .filter((o) => o.status === 'livree' || o.status === 'facturee')
      .reduce((sum, o) => sum + (o.totalAmountTTC || 0), 0);

    // Get sales sessions (using status 'fermee' instead of 'cloturee')
    const sessions = await drizzleDb
      .select()
      .from(bakerySalesSessions)
      .where(and(
        eq(bakerySalesSessions.organizationId, organizationId),
        sql`${bakerySalesSessions.sessionDate} >= ${startDate.toISOString()}`,
        sql`${bakerySalesSessions.sessionDate} <= ${endDate.toISOString()}`
      ))
      .all() as any[];

    const totalPOSRevenue = sessions
      .filter((s) => s.status === 'fermee' || s.status === 'validee')
      .reduce((sum, s) => sum + (s.calculatedRevenue || 0), 0);

    // Group orders by status
    const ordersByStatus = orders.reduce((acc: any, o) => {
      acc[o.status] = (acc[o.status] || 0) + 1;
      return acc;
    }, {});

    // Get active clients count
    const activeClients = await drizzleDb
      .select()
      .from(bakeryB2BClients)
      .where(and(
        eq(bakeryB2BClients.organizationId, organizationId),
        eq(bakeryB2BClients.isActive, true)
      ))
      .all();

    return {
      period: period || 'today',
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      totalRevenue: totalB2BRevenue + totalPOSRevenue,
      b2bRevenue: totalB2BRevenue,
      posRevenue: totalPOSRevenue,
      ordersCount: orders.length,
      ordersByStatus,
      sessionsCount: sessions.length,
      activeClientsCount: activeClients.length,
      averageOrderValue: orders.length > 0 ? totalB2BRevenue / orders.length : 0,
    };
  }

  /**
   * Get maintenance dashboard data
   * Note: bakeryEquipment doesn't have status field in schema
   */
  async getMaintenanceDashboard(organizationId: string): Promise<any> {
    // Get equipment
    const equipment = await drizzleDb
      .select()
      .from(bakeryEquipment)
      .where(and(
        eq(bakeryEquipment.organizationId, organizationId),
        eq(bakeryEquipment.isActive, true)
      ))
      .all() as any[];

    // Group by type instead of status (status doesn't exist)
    const byType = equipment.reduce((acc: any, e) => {
      acc[e.type] = (acc[e.type] || 0) + 1;
      return acc;
    }, {});

    // Get recent interventions (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const interventions = await drizzleDb
      .select()
      .from(bakeryInterventions)
      .where(and(
        eq(bakeryInterventions.organizationId, organizationId),
        sql`${bakeryInterventions.interventionDate} >= ${thirtyDaysAgo.toISOString()}`
      ))
      .all() as any[];

    // Group by type
    const interventionsByType = interventions.reduce((acc: any, i) => {
      acc[i.type] = (acc[i.type] || 0) + 1;
      return acc;
    }, {});

    // Calculate total maintenance cost
    const totalCost = interventions.reduce((sum, i) => sum + (i.totalCost || 0), 0);

    // Get active alerts
    const alerts = await drizzleDb
      .select()
      .from(bakeryMaintenanceAlerts)
      .where(and(
        eq(bakeryMaintenanceAlerts.organizationId, organizationId),
        eq(bakeryMaintenanceAlerts.isAcknowledged, false)
      ))
      .all();

    // Equipment needing warranty attention
    const warrantyExpiringSoon = equipment.filter((e) => {
      if (!e.warrantyEndDate) return false;
      const warrantyEnd = new Date(e.warrantyEndDate);
      const now = new Date();
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      return warrantyEnd <= thirtyDaysFromNow && warrantyEnd >= now;
    });

    // Count interventions by status
    const pendingInterventions = interventions.filter((i) => i.status === 'planifiee' || i.status === 'en_cours').length;
    const correctiveInterventions = interventions.filter((i) => i.type === 'corrective').length;

    return {
      totalEquipment: equipment.length,
      byType,
      interventionsLast30Days: interventions.length,
      interventionsByType,
      totalMaintenanceCost30Days: totalCost,
      activeAlertsCount: alerts.length,
      warrantyExpiringSoonCount: warrantyExpiringSoon.length,
      correctiveInterventions,
      pendingInterventions,
    };
  }

  /**
   * Get daily sales summary
   * Schema: summaryDate, deliveryRevenueHT, deliveryRevenueTTC, onSiteMorningRevenue, onSiteAfternoonRevenue,
   *         onSiteTotalRevenue, totalDayRevenue, deliveryCount, estimatedOnSiteCustomers, averageBasket, topProductsJson
   */
  async getDailySummary(
    organizationId: string,
    date?: string
  ): Promise<BakeryDailySalesSummary | null> {
    const targetDate = date ? new Date(date) : new Date();
    targetDate.setHours(0, 0, 0, 0);

    // Check if summary exists
    const summary = await drizzleDb
      .select()
      .from(bakeryDailySalesSummary)
      .where(and(
        eq(bakeryDailySalesSummary.organizationId, organizationId),
        sql`date(${bakeryDailySalesSummary.summaryDate}) = date(${targetDate.toISOString()})`
      ))
      .get() as BakeryDailySalesSummary | undefined;

    // If not exists, generate it
    if (!summary) {
      return await this.generateDailySummary(organizationId, targetDate);
    }

    return summary;
  }

  /**
   * Generate daily summary with schema-correct columns
   */
  private async generateDailySummary(
    organizationId: string,
    date: Date
  ): Promise<BakeryDailySalesSummary | null> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // Get all closed sessions for the day (status 'fermee' or 'validee')
    const sessions = await drizzleDb
      .select()
      .from(bakerySalesSessions)
      .where(and(
        eq(bakerySalesSessions.organizationId, organizationId),
        sql`${bakerySalesSessions.status} IN ('fermee', 'validee')`,
        sql`${bakerySalesSessions.sessionDate} >= ${startOfDay.toISOString()}`,
        sql`${bakerySalesSessions.sessionDate} <= ${endOfDay.toISOString()}`
      ))
      .all() as any[];

    // Split sessions by period
    const morningSessions = sessions.filter(s => s.period === 'matin');
    const afternoonSessions = sessions.filter(s => s.period === 'apres_midi');

    const onSiteMorningRevenue = morningSessions.reduce((sum, s) => sum + (s.calculatedRevenue || 0), 0);
    const onSiteAfternoonRevenue = afternoonSessions.reduce((sum, s) => sum + (s.calculatedRevenue || 0), 0);
    const onSiteTotalRevenue = onSiteMorningRevenue + onSiteAfternoonRevenue;

    // Get delivered orders for the day
    const orders = await drizzleDb
      .select()
      .from(bakeryDeliveryOrders)
      .where(and(
        eq(bakeryDeliveryOrders.organizationId, organizationId),
        sql`${bakeryDeliveryOrders.status} IN ('livree', 'facturee')`,
        sql`${bakeryDeliveryOrders.expectedDeliveryDate} >= ${startOfDay.toISOString()}`,
        sql`${bakeryDeliveryOrders.expectedDeliveryDate} <= ${endOfDay.toISOString()}`
      ))
      .all() as any[];

    const deliveryRevenueHT = orders.reduce((sum, o) => sum + (o.totalAmountHT || 0), 0);
    const deliveryRevenueTTC = orders.reduce((sum, o) => sum + (o.totalAmountTTC || 0), 0);
    const deliveryCount = orders.length;

    const totalDayRevenue = onSiteTotalRevenue + deliveryRevenueTTC;
    const estimatedOnSiteCustomers = sessions.length > 0 ? sessions.length * 20 : 0; // Rough estimate
    const averageBasket = estimatedOnSiteCustomers > 0 ? onSiteTotalRevenue / estimatedOnSiteCustomers : 0;

    const id = crypto.randomUUID();
    const now = new Date();

    await drizzleDb.insert(bakeryDailySalesSummary).values({
      id,
      organizationId,
      summaryDate: startOfDay,
      deliveryRevenueHT,
      deliveryRevenueTTC,
      onSiteMorningRevenue,
      onSiteAfternoonRevenue,
      onSiteTotalRevenue,
      totalDayRevenue,
      deliveryCount,
      estimatedOnSiteCustomers,
      averageBasket,
      createdAt: now,
    });

    const summary = await drizzleDb
      .select()
      .from(bakeryDailySalesSummary)
      .where(eq(bakeryDailySalesSummary.id, id))
      .get() as BakeryDailySalesSummary;

    return summary;
  }

  /**
   * Create report configuration
   */
  async createReportConfig(
    organizationId: string,
    data: CreateReportConfigInput
  ): Promise<BakeryReportConfig> {
    const now = new Date();
    const id = crypto.randomUUID();

    await drizzleDb.insert(bakeryReportConfigs).values({
      id,
      organizationId,
      reportName: data.reportName,
      type: data.type,
      templateId: data.templateId || null,
      emailRecipients: data.emailRecipients ? JSON.stringify(data.emailRecipients) : null,
      whatsappRecipients: data.whatsappRecipients ? JSON.stringify(data.whatsappRecipients) : null,
      sendTime: data.sendTime,
      sendDay: data.sendDay || null,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    const config = await drizzleDb
      .select()
      .from(bakeryReportConfigs)
      .where(eq(bakeryReportConfigs.id, id))
      .get() as BakeryReportConfig;

    return config;
  }

  /**
   * List report configurations
   */
  async listReportConfigs(organizationId: string): Promise<BakeryReportConfig[]> {
    const configs = await drizzleDb
      .select()
      .from(bakeryReportConfigs)
      .where(eq(bakeryReportConfigs.organizationId, organizationId))
      .orderBy(bakeryReportConfigs.reportName)
      .all() as BakeryReportConfig[];

    return configs;
  }

  /**
   * Generate report
   * Schema: configId, generationDate, periodStart, periodEnd, pdfUrl, isSent, sentAt
   */
  async generateReport(
    organizationId: string,
    data: GenerateReportInput
  ): Promise<BakeryGeneratedReport> {
    const now = new Date();
    const id = crypto.randomUUID();

    // Generate PDF URL (in real implementation, would create actual file)
    const pdfUrl = `/reports/${id}.pdf`;

    await drizzleDb.insert(bakeryGeneratedReports).values({
      id,
      organizationId,
      configId: data.configId || null,
      periodStart: new Date(data.startDate),
      periodEnd: new Date(data.endDate),
      generationDate: now,
      pdfUrl,
      isSent: false,
      createdAt: now,
    });

    const report = await drizzleDb
      .select()
      .from(bakeryGeneratedReports)
      .where(eq(bakeryGeneratedReports.id, id))
      .get() as BakeryGeneratedReport;

    return report;
  }

  /**
   * List generated reports (using generationDate instead of generatedAt)
   */
  async listGeneratedReports(
    organizationId: string,
    filters: QueryFilters
  ): Promise<{ items: BakeryGeneratedReport[]; total: number }> {
    const conditions: any[] = [eq(bakeryGeneratedReports.organizationId, organizationId)];

    if (filters.startDate) {
      conditions.push(sql`${bakeryGeneratedReports.generationDate} >= ${filters.startDate}`);
    }

    if (filters.endDate) {
      conditions.push(sql`${bakeryGeneratedReports.generationDate} <= ${filters.endDate}`);
    }

    const items = await drizzleDb
      .select()
      .from(bakeryGeneratedReports)
      .where(and(...conditions))
      .orderBy(desc(bakeryGeneratedReports.generationDate))
      .all() as BakeryGeneratedReport[];

    const page = filters.page || 1;
    const limit = filters.limit || 50;
    const offset = (page - 1) * limit;
    const paginatedItems = items.slice(offset, offset + limit);

    return {
      items: paginatedItems,
      total: items.length,
    };
  }

  /**
   * Create accounting export
   * Schema: periodStart, periodEnd, exportType, format, fileUrl, generatedById, generatedAt
   */
  async createAccountingExport(
    organizationId: string,
    data: CreateAccountingExportInput,
    userId: string
  ): Promise<BakeryAccountingExport> {
    const now = new Date();
    const id = crypto.randomUUID();

    // Generate file URL
    const fileUrl = `/exports/${id}.${data.format === 'excel' ? 'xlsx' : data.format}`;

    await drizzleDb.insert(bakeryAccountingExports).values({
      id,
      organizationId,
      periodStart: new Date(data.periodStart),
      periodEnd: new Date(data.periodEnd),
      exportType: data.exportType,
      format: data.format,
      fileUrl,
      generatedById: userId,
      generatedAt: now,
    });

    const export_ = await drizzleDb
      .select()
      .from(bakeryAccountingExports)
      .where(eq(bakeryAccountingExports.id, id))
      .get() as BakeryAccountingExport;

    return export_;
  }

  /**
   * List accounting exports (using generatedAt)
   */
  async listAccountingExports(
    organizationId: string,
    filters: QueryFilters
  ): Promise<{ items: BakeryAccountingExport[]; total: number }> {
    const conditions: any[] = [eq(bakeryAccountingExports.organizationId, organizationId)];

    if (filters.startDate) {
      conditions.push(sql`${bakeryAccountingExports.generatedAt} >= ${filters.startDate}`);
    }

    if (filters.endDate) {
      conditions.push(sql`${bakeryAccountingExports.generatedAt} <= ${filters.endDate}`);
    }

    const items = await drizzleDb
      .select()
      .from(bakeryAccountingExports)
      .where(and(...conditions))
      .orderBy(desc(bakeryAccountingExports.generatedAt))
      .all() as BakeryAccountingExport[];

    const page = filters.page || 1;
    const limit = filters.limit || 50;
    const offset = (page - 1) * limit;
    const paginatedItems = items.slice(offset, offset + limit);

    return {
      items: paginatedItems,
      total: items.length,
    };
  }
}

export const bakeryReportingService = new BakeryReportingService();
