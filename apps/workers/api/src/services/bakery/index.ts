/**
 * Bakery Services Index
 * Export all bakery module services
 */

export * from './stock.service';
export * from './product.service';
export * from './production.service';
export * from './maintenance.service';
export * from './sales.service';
export * from './reporting.service';

// Re-export service instances for convenience
import { bakeryStockService } from './stock.service';
import { bakeryProductService } from './product.service';
import { bakeryProductionService } from './production.service';
import { bakeryMaintenanceService } from './maintenance.service';
import { bakerySalesService } from './sales.service';
import { bakeryReportingService } from './reporting.service';

/**
 * Unified bakery service object
 * Provides access to all bakery module services
 */
export const bakeryService = {
  stock: bakeryStockService,
  product: bakeryProductService,
  production: bakeryProductionService,
  maintenance: bakeryMaintenanceService,
  sales: bakerySalesService,
  reporting: bakeryReportingService,
};

export const bakeryServices = {
  stock: bakeryStockService,
  product: bakeryProductService,
  production: bakeryProductionService,
  maintenance: bakeryMaintenanceService,
  sales: bakerySalesService,
  reporting: bakeryReportingService,
};
