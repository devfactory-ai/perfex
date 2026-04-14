/**
 * Database schemas export
 * Central export point for all Drizzle schemas
 */

export * from './users';
export * from './finance';
export * from './inventory';
export * from './hr';
export * from './notifications';
export * from './modules';
export * from './recipes';
export * from './traceability';
export * from './bakery';

// Export all tables for drizzle-kit
export {
  users,
  organizations,
  organizationMembers,
  roles,
  userRoles,
  sessions,
} from './users';

export {
  accounts,
  journals,
  journalEntries,
  journalEntryLines,
  fiscalYears,
  taxRates,
  invoices,
  invoiceLines,
  payments,
  paymentAllocations,
  bankAccounts,
} from './finance';

export {
  inventoryItems,
  warehouses,
  stockLevels,
  stockMovements,
  stockAdjustments,
  stockAdjustmentLines,
} from './inventory';

export {
  departments,
  employees,
  leaveRequests,
  attendanceRecords,
  leaveBalances,
} from './hr';

export {
  notifications,
  auditLogs,
  systemSettings,
} from './notifications';

export * from './audit';

export {
  auditTasks,
  auditFindings,
  riskAssessments,
  riskDataPoints,
  complianceKnowledgeBase,
  complianceChecks,
  complianceConversations,
  commonalityStudies,
  improvementProposals,
  auditSchedules,
  auditConfiguration,
} from './audit';

export {
  moduleRegistry,
  organizationModules,
} from './modules';

export {
  recipeCategories,
  recipes,
  recipeIngredients,
  recipeSteps,
  recipeVersions,
  recipeScaling,
  allergenRegistry,
} from './recipes';

export {
  lots,
  lotMovements,
  productionTraceability,
  productionInputLots,
  haccpControlPoints,
  haccpRecords,
  temperatureLogs,
  productRecalls,
  cleaningRecords,
} from './traceability';

export * from './integrations';

export {
  integrationConfigs,
  integrationTransactions,
  paymentTransactions,
  smsTransactions,
  shippingTransactions,
  fiscalDeclarations,
  integrationWebhookEvents,
} from './integrations';

// Bakery module tables
export {
  // Stock Management
  bakeryArticles,
  bakeryStockMovements,
  bakeryInventories,
  bakeryInventoryLines,
  bakeryStockAlerts,
  bakerySupplierOrders,
  bakerySupplierOrderLines,
  bakeryProducts,
  bakeryProductRecipes,
  bakeryRecipeCompositions,
  // Production
  bakeryProofingChambers,
  bakeryProofingCarts,
  bakeryCartLines,
  bakeryOvens,
  bakeryOvenPassages,
  bakeryQualityControls,
  bakeryProductionDefects,
  bakeryProductionComparisons,
  bakeryMeterReadings,
  bakeryDailyConsumptions,
  // Maintenance
  bakeryEquipment,
  bakeryInterventions,
  bakeryMaintenancePlans,
  bakeryMaintenanceAlerts,
  bakerySpareParts,
  bakerySparePartMovements,
  bakeryInterventionParts,
  bakeryMaintenanceIndicators,
  // Sales
  bakeryB2BClients,
  bakeryClientPricing,
  bakeryDeliveryOrders,
  bakeryDeliveryOrderLines,
  bakeryDeliveryNotes,
  bakeryPointsOfSale,
  bakerySalesSessions,
  bakeryPOSStock,
  bakeryTeamHandovers,
  // Reporting
  bakeryReportConfigs,
  bakeryGeneratedReports,
  bakeryAccountingExports,
  bakeryDailySalesSummary,
  bakeryAuditLogs,
} from './bakery';
