/**
 * Bakery Module Routes
 *
 * Complete API routes for bakery ERP including:
 * - Stock Management
 * - Production
 * - Maintenance (CMMS)
 * - Sales (B2B + On-site)
 * - Reporting
 */

import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { requireAuth, requirePermission } from '../middleware/auth';
import { bakeryService } from '../services/bakery';
import type { Env } from '../types';

const bakery = new Hono<{ Bindings: Env }>();

// All routes require authentication
bakery.use('/*', requireAuth);

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

// Common schemas
const paginationSchema = z.object({
  page: z.string().optional().transform(v => parseInt(v || '1', 10)),
  limit: z.string().optional().transform(v => parseInt(v || '50', 10)),
  search: z.string().optional(),
});

const dateRangeSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

// Article schemas
const createArticleSchema = z.object({
  reference: z.string().min(1),
  name: z.string().min(1),
  category: z.enum(['farine', 'semoule', 'levure', 'additifs', 'emballages', 'autre']),
  unitOfMeasure: z.enum(['kg', 'L', 'unite']),
  averagePurchasePrice: z.number().optional(),
  minimumStock: z.number().optional(),
  optimalStock: z.number().optional(),
  mainSupplierId: z.string().optional(),
  alternativeSupplierIds: z.array(z.string()).optional(),
  expirationDate: z.string().optional(),
});

const updateArticleSchema = createArticleSchema.partial();

// Stock movement schemas
const createStockMovementSchema = z.object({
  articleId: z.string(),
  type: z.enum(['entree', 'sortie', 'ajustement', 'inventaire']),
  quantity: z.number(),
  reason: z.string(),
  documentReference: z.string().optional(),
  lotNumber: z.string().optional(),
  purchasePrice: z.number().optional(),
  movementDate: z.string(),
  comment: z.string().optional(),
});

// Product schemas
const createProductSchema = z.object({
  reference: z.string().min(1),
  name: z.string().min(1),
  category: z.enum(['pain', 'patisserie', 'viennoiserie', 'autre']),
  unitPrice: z.number().positive(),
  costPrice: z.number().optional(),
});

const updateProductSchema = createProductSchema.partial();

// Recipe schemas
const createRecipeSchema = z.object({
  productId: z.string(),
  name: z.string().min(1),
  yield: z.number().positive(),
  yieldUnit: z.string(),
  compositions: z.array(z.object({
    articleId: z.string(),
    quantityNeeded: z.number().positive(),
  })),
});

// Production schemas
const createProofingChamberSchema = z.object({
  name: z.string().min(1),
  cartCapacity: z.number().int().positive(),
  idealTemperature: z.number(),
  idealHumidity: z.number(),
});

const createProofingCartSchema = z.object({
  cartNumber: z.string(),
  chamberId: z.string().optional(),
  lines: z.array(z.object({
    productId: z.string(),
    quantity: z.number().int().positive(),
    doughWeight: z.number().optional(),
  })),
});

const createOvenSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['rotatif', 'sole', 'tunnel', 'autre']),
  cartCapacity: z.number().int().positive(),
  maxTemperature: z.number().positive(),
});

const createOvenPassageSchema = z.object({
  cartId: z.string(),
  ovenId: z.string(),
  temperature: z.number(),
  expectedDuration: z.number().int().positive(),
});

const createQualityControlSchema = z.object({
  ovenPassageId: z.string(),
  isConforming: z.boolean(),
  comment: z.string().optional(),
  defects: z.array(z.object({
    productId: z.string(),
    defectType: z.enum(['brule', 'sous_cuit', 'deforme', 'casse', 'autre']),
    defectiveQuantity: z.number().int().positive(),
    probableCause: z.string().optional(),
    correctiveAction: z.string().optional(),
  })).optional(),
});

// Equipment schemas
const createEquipmentSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['four', 'petrin', 'cylindre', 'laminoir', 'chambre_pousse', 'diviseur', 'faconneur', 'congelateur', 'autre']),
  brand: z.string(),
  model: z.string(),
  serialNumber: z.string(),
  purchaseDate: z.string(),
  commissioningDate: z.string(),
  supplierId: z.string().optional(),
  purchaseValue: z.number().positive(),
  warrantyMonths: z.number().int().positive(),
  location: z.string(),
});

const updateEquipmentSchema = createEquipmentSchema.partial();

// Intervention schemas
const createInterventionSchema = z.object({
  equipmentId: z.string(),
  type: z.enum(['preventive', 'corrective', 'revision', 'amelioration']),
  interventionDate: z.string(),
  durationMinutes: z.number().int().positive(),
  problemNature: z.string().optional(),
  actionsPerformed: z.string(),
  internalTechnicianId: z.string().optional(),
  externalTechnician: z.string().optional(),
  externalCompany: z.string().optional(),
  laborCost: z.number().optional(),
  causedProductionStop: z.boolean().optional(),
  stopDurationMinutes: z.number().int().optional(),
  comment: z.string().optional(),
  parts: z.array(z.object({
    sparePartId: z.string(),
    quantity: z.number().positive(),
  })).optional(),
});

// Maintenance plan schemas
const createMaintenancePlanSchema = z.object({
  equipmentId: z.string(),
  periodicityType: z.enum(['jours', 'semaines', 'mois', 'heures_fonctionnement']),
  interval: z.number().int().positive(),
  checklist: z.array(z.string()),
  estimatedDurationMinutes: z.number().int().positive(),
});

// Spare part schemas
const createSparePartSchema = z.object({
  reference: z.string(),
  designation: z.string(),
  compatibleEquipmentIds: z.array(z.string()).optional(),
  minimumStock: z.number().optional(),
  unitPrice: z.number().positive(),
  supplierId: z.string().optional(),
  deliveryLeadDays: z.number().int().optional(),
});

// B2B Client schemas
const createB2BClientSchema = z.object({
  commercialName: z.string().min(1),
  type: z.enum(['restaurant', 'hotel', 'collectivite', 'grossiste', 'autre']),
  mainContact: z.string(),
  phone: z.string(),
  email: z.string().email().optional(),
  deliveryAddress: z.string(),
  paymentTerms: z.string().optional(),
  hasSpecificPricing: z.boolean().optional(),
});

const updateB2BClientSchema = createB2BClientSchema.partial();

// Delivery order schemas
const createDeliveryOrderSchema = z.object({
  clientId: z.string(),
  expectedDeliveryDate: z.string(),
  expectedDeliveryTime: z.string().optional(),
  comment: z.string().optional(),
  lines: z.array(z.object({
    productId: z.string(),
    orderedQuantity: z.number().int().positive(),
    unitPriceHT: z.number().positive(),
  })),
});

// Point of sale schemas
const createPointOfSaleSchema = z.object({
  name: z.string().min(1),
  location: z.string(),
});

// Sales session schemas
const createSalesSessionSchema = z.object({
  pointOfSaleId: z.string(),
  sessionDate: z.string(),
  period: z.enum(['matin', 'apres_midi']),
});

const closeSalesSessionSchema = z.object({
  stockCounts: z.array(z.object({
    productId: z.string(),
    closingStock: z.number(),
  })),
  declaredRevenue: z.number().optional(),
});

// Report config schemas
const createReportConfigSchema = z.object({
  reportName: z.string().min(1),
  type: z.enum(['quotidien', 'hebdomadaire', 'mensuel']),
  templateId: z.string().optional(),
  emailRecipients: z.array(z.string().email()).optional(),
  whatsappRecipients: z.array(z.string()).optional(),
  sendTime: z.string(),
  sendDay: z.number().int().optional(),
});

// =============================================================================
// STOCK MANAGEMENT ROUTES
// =============================================================================

/**
 * GET /api/v1/bakery/articles
 * List all articles
 */
bakery.get(
  '/articles',
  requirePermission('bakery:articles:read'),
  zValidator('query', paginationSchema.merge(z.object({
    category: z.string().optional(),
    lowStock: z.string().optional(),
  }))),
  async (c) => {
    try {
      const organizationId = c.get('realOrganizationId')!;
      const query = c.req.valid('query');
      const result = await bakeryService.stock.listArticles(organizationId, query);
      return c.json({ success: true, data: result });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return c.json({ success: false, error: { code: 'INTERNAL_ERROR', message } }, 500);
    }
  }
);

/**
 * POST /api/v1/bakery/articles
 * Create a new article
 */
bakery.post(
  '/articles',
  requirePermission('bakery:articles:create'),
  zValidator('json', createArticleSchema),
  async (c) => {
    try {
      const organizationId = c.get('realOrganizationId')!;
      const userId = c.get('userId');
      const data = c.req.valid('json');
      const result = await bakeryService.stock.createArticle(organizationId, data, userId);
      return c.json({ success: true, data: result }, 201);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return c.json({ success: false, error: { code: 'INTERNAL_ERROR', message } }, 500);
    }
  }
);

/**
 * GET /api/v1/bakery/articles/:id
 * Get article by ID
 */
bakery.get(
  '/articles/:id',
  requirePermission('bakery:articles:read'),
  async (c) => {
    try {
      const organizationId = c.get('realOrganizationId')!;
      const id = c.req.param('id');
      const result = await bakeryService.stock.getArticle(organizationId, id);
      if (!result) {
        return c.json({ success: false, error: { code: 'NOT_FOUND', message: 'Article not found' } }, 404);
      }
      return c.json({ success: true, data: result });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return c.json({ success: false, error: { code: 'INTERNAL_ERROR', message } }, 500);
    }
  }
);

/**
 * PUT /api/v1/bakery/articles/:id
 * Update article
 */
bakery.put(
  '/articles/:id',
  requirePermission('bakery:articles:update'),
  zValidator('json', updateArticleSchema),
  async (c) => {
    try {
      const organizationId = c.get('realOrganizationId')!;
      const id = c.req.param('id');
      const data = c.req.valid('json');
      const result = await bakeryService.stock.updateArticle(organizationId, id, data);
      return c.json({ success: true, data: result });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return c.json({ success: false, error: { code: 'INTERNAL_ERROR', message } }, 500);
    }
  }
);

/**
 * DELETE /api/v1/bakery/articles/:id
 * Delete article
 */
bakery.delete(
  '/articles/:id',
  requirePermission('bakery:articles:delete'),
  async (c) => {
    try {
      const organizationId = c.get('realOrganizationId')!;
      const id = c.req.param('id');
      await bakeryService.stock.deleteArticle(organizationId, id);
      return c.json({ success: true, data: { deleted: true } });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return c.json({ success: false, error: { code: 'INTERNAL_ERROR', message } }, 500);
    }
  }
);

/**
 * POST /api/v1/bakery/stock-movements
 * Create stock movement (entry, exit, adjustment)
 */
bakery.post(
  '/stock-movements',
  requirePermission('bakery:stock:create'),
  zValidator('json', createStockMovementSchema),
  async (c) => {
    try {
      const organizationId = c.get('realOrganizationId')!;
      const userId = c.get('userId');
      const data = c.req.valid('json');
      const result = await bakeryService.stock.createMovement(organizationId, data, userId);
      return c.json({ success: true, data: result }, 201);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return c.json({ success: false, error: { code: 'INTERNAL_ERROR', message } }, 500);
    }
  }
);

/**
 * GET /api/v1/bakery/stock-movements
 * List stock movements
 */
bakery.get(
  '/stock-movements',
  requirePermission('bakery:stock:read'),
  zValidator('query', paginationSchema.merge(dateRangeSchema).merge(z.object({
    articleId: z.string().optional(),
    type: z.string().optional(),
  }))),
  async (c) => {
    try {
      const organizationId = c.get('realOrganizationId')!;
      const query = c.req.valid('query');
      const result = await bakeryService.stock.listMovements(organizationId, query);
      return c.json({ success: true, data: result });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return c.json({ success: false, error: { code: 'INTERNAL_ERROR', message } }, 500);
    }
  }
);

/**
 * POST /api/v1/bakery/stock-movements/:id/validate
 * Validate stock movement
 */
bakery.post(
  '/stock-movements/:id/validate',
  requirePermission('bakery:stock:validate'),
  async (c) => {
    try {
      const organizationId = c.get('realOrganizationId')!;
      const userId = c.get('userId');
      const id = c.req.param('id');
      const result = await bakeryService.stock.validateMovement(organizationId, id, userId);
      return c.json({ success: true, data: result });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return c.json({ success: false, error: { code: 'INTERNAL_ERROR', message } }, 500);
    }
  }
);

/**
 * GET /api/v1/bakery/stock-alerts
 * Get active stock alerts
 */
bakery.get(
  '/stock-alerts',
  requirePermission('bakery:alerts:read'),
  zValidator('query', paginationSchema.merge(z.object({
    alertType: z.string().optional(),
    acknowledged: z.string().optional(),
  }))),
  async (c) => {
    try {
      const organizationId = c.get('realOrganizationId')!;
      const query = c.req.valid('query');
      const result = await bakeryService.stock.listAlerts(organizationId, query);
      return c.json({ success: true, data: result });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return c.json({ success: false, error: { code: 'INTERNAL_ERROR', message } }, 500);
    }
  }
);

/**
 * POST /api/v1/bakery/stock-alerts/:id/acknowledge
 * Acknowledge stock alert
 */
bakery.post(
  '/stock-alerts/:id/acknowledge',
  requirePermission('bakery:alerts:update'),
  async (c) => {
    try {
      const organizationId = c.get('realOrganizationId')!;
      const userId = c.get('userId');
      const id = c.req.param('id');
      const result = await bakeryService.stock.acknowledgeAlert(organizationId, id, userId);
      return c.json({ success: true, data: result });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return c.json({ success: false, error: { code: 'INTERNAL_ERROR', message } }, 500);
    }
  }
);

/**
 * POST /api/v1/bakery/inventories
 * Create new inventory
 */
bakery.post(
  '/inventories',
  requirePermission('bakery:inventory:create'),
  zValidator('json', z.object({
    type: z.enum(['quotidien', 'mensuel', 'annuel']),
  })),
  async (c) => {
    try {
      const organizationId = c.get('realOrganizationId')!;
      const userId = c.get('userId');
      const data = c.req.valid('json');
      const result = await bakeryService.stock.createInventory(organizationId, data.type, userId);
      return c.json({ success: true, data: result }, 201);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return c.json({ success: false, error: { code: 'INTERNAL_ERROR', message } }, 500);
    }
  }
);

/**
 * GET /api/v1/bakery/inventories
 * List inventories
 */
bakery.get(
  '/inventories',
  requirePermission('bakery:inventory:read'),
  zValidator('query', paginationSchema.merge(dateRangeSchema)),
  async (c) => {
    try {
      const organizationId = c.get('realOrganizationId')!;
      const query = c.req.valid('query');
      const result = await bakeryService.stock.listInventories(organizationId, query);
      return c.json({ success: true, data: result });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return c.json({ success: false, error: { code: 'INTERNAL_ERROR', message } }, 500);
    }
  }
);

/**
 * PUT /api/v1/bakery/inventories/:id/lines
 * Update inventory line (actual count)
 */
bakery.put(
  '/inventories/:id/lines',
  requirePermission('bakery:inventory:update'),
  zValidator('json', z.object({
    lines: z.array(z.object({
      articleId: z.string(),
      actualStock: z.number(),
      justification: z.string().optional(),
    })),
  })),
  async (c) => {
    try {
      const organizationId = c.get('realOrganizationId')!;
      const id = c.req.param('id');
      const data = c.req.valid('json');
      const result = await bakeryService.stock.updateInventoryLines(organizationId, id, data.lines);
      return c.json({ success: true, data: result });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return c.json({ success: false, error: { code: 'INTERNAL_ERROR', message } }, 500);
    }
  }
);

/**
 * POST /api/v1/bakery/inventories/:id/validate
 * Validate inventory and generate adjustments
 */
bakery.post(
  '/inventories/:id/validate',
  requirePermission('bakery:inventory:validate'),
  async (c) => {
    try {
      const organizationId = c.get('realOrganizationId')!;
      const userId = c.get('userId');
      const id = c.req.param('id');
      const result = await bakeryService.stock.validateInventory(organizationId, id, userId);
      return c.json({ success: true, data: result });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return c.json({ success: false, error: { code: 'INTERNAL_ERROR', message } }, 500);
    }
  }
);

// =============================================================================
// PRODUCT ROUTES
// =============================================================================

/**
 * GET /api/v1/bakery/products
 * List products
 */
bakery.get(
  '/products',
  requirePermission('bakery:products:read'),
  zValidator('query', paginationSchema.merge(z.object({
    category: z.string().optional(),
  }))),
  async (c) => {
    try {
      const organizationId = c.get('realOrganizationId')!;
      const query = c.req.valid('query');
      const result = await bakeryService.product.listProducts(organizationId, query);
      return c.json({ success: true, data: result });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return c.json({ success: false, error: { code: 'INTERNAL_ERROR', message } }, 500);
    }
  }
);

/**
 * POST /api/v1/bakery/products
 * Create product
 */
bakery.post(
  '/products',
  requirePermission('bakery:products:create'),
  zValidator('json', createProductSchema),
  async (c) => {
    try {
      const organizationId = c.get('realOrganizationId')!;
      const data = c.req.valid('json');
      const result = await bakeryService.product.createProduct(organizationId, data);
      return c.json({ success: true, data: result }, 201);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return c.json({ success: false, error: { code: 'INTERNAL_ERROR', message } }, 500);
    }
  }
);

/**
 * GET /api/v1/bakery/products/:id
 * Get product by ID
 */
bakery.get(
  '/products/:id',
  requirePermission('bakery:products:read'),
  async (c) => {
    try {
      const organizationId = c.get('realOrganizationId')!;
      const id = c.req.param('id');
      const result = await bakeryService.product.getProduct(organizationId, id);
      if (!result) {
        return c.json({ success: false, error: { code: 'NOT_FOUND', message: 'Product not found' } }, 404);
      }
      return c.json({ success: true, data: result });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return c.json({ success: false, error: { code: 'INTERNAL_ERROR', message } }, 500);
    }
  }
);

/**
 * PUT /api/v1/bakery/products/:id
 * Update product
 */
bakery.put(
  '/products/:id',
  requirePermission('bakery:products:update'),
  zValidator('json', updateProductSchema),
  async (c) => {
    try {
      const organizationId = c.get('realOrganizationId')!;
      const id = c.req.param('id');
      const data = c.req.valid('json');
      const result = await bakeryService.product.updateProduct(organizationId, id, data);
      return c.json({ success: true, data: result });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return c.json({ success: false, error: { code: 'INTERNAL_ERROR', message } }, 500);
    }
  }
);

/**
 * DELETE /api/v1/bakery/products/:id
 * Delete product
 */
bakery.delete(
  '/products/:id',
  requirePermission('bakery:products:delete'),
  async (c) => {
    try {
      const organizationId = c.get('realOrganizationId')!;
      const id = c.req.param('id');
      await bakeryService.product.deleteProduct(organizationId, id);
      return c.json({ success: true, data: { deleted: true } });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return c.json({ success: false, error: { code: 'INTERNAL_ERROR', message } }, 500);
    }
  }
);

/**
 * POST /api/v1/bakery/recipes
 * Create product recipe
 */
bakery.post(
  '/recipes',
  requirePermission('bakery:recipes:create'),
  zValidator('json', createRecipeSchema),
  async (c) => {
    try {
      const organizationId = c.get('realOrganizationId')!;
      const data = c.req.valid('json');
      const result = await bakeryService.product.createRecipe(organizationId, data);
      return c.json({ success: true, data: result }, 201);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return c.json({ success: false, error: { code: 'INTERNAL_ERROR', message } }, 500);
    }
  }
);

/**
 * GET /api/v1/bakery/recipes
 * List recipes
 */
bakery.get(
  '/recipes',
  requirePermission('bakery:recipes:read'),
  zValidator('query', paginationSchema),
  async (c) => {
    try {
      const organizationId = c.get('realOrganizationId')!;
      const query = c.req.valid('query');
      const result = await bakeryService.product.listRecipes(organizationId, query);
      return c.json({ success: true, data: result });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return c.json({ success: false, error: { code: 'INTERNAL_ERROR', message } }, 500);
    }
  }
);

/**
 * GET /api/v1/bakery/production-forecast
 * Calculate theoretical production based on stock exits
 */
bakery.get(
  '/production-forecast',
  requirePermission('bakery:production:read'),
  zValidator('query', z.object({
    date: z.string().optional(),
  })),
  async (c) => {
    try {
      const organizationId = c.get('realOrganizationId')!;
      const query = c.req.valid('query');
      const result = await bakeryService.production.calculateForecast(organizationId, query.date);
      return c.json({ success: true, data: result });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return c.json({ success: false, error: { code: 'INTERNAL_ERROR', message } }, 500);
    }
  }
);

// =============================================================================
// PRODUCTION ROUTES
// =============================================================================

/**
 * GET /api/v1/bakery/proofing-chambers
 * List proofing chambers
 */
bakery.get(
  '/proofing-chambers',
  requirePermission('bakery:production:read'),
  async (c) => {
    try {
      const organizationId = c.get('realOrganizationId')!;
      const result = await bakeryService.production.listProofingChambers(organizationId);
      return c.json({ success: true, data: result });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return c.json({ success: false, error: { code: 'INTERNAL_ERROR', message } }, 500);
    }
  }
);

/**
 * POST /api/v1/bakery/proofing-chambers
 * Create proofing chamber
 */
bakery.post(
  '/proofing-chambers',
  requirePermission('bakery:production:create'),
  zValidator('json', createProofingChamberSchema),
  async (c) => {
    try {
      const organizationId = c.get('realOrganizationId')!;
      const data = c.req.valid('json');
      const result = await bakeryService.production.createProofingChamber(organizationId, data);
      return c.json({ success: true, data: result }, 201);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return c.json({ success: false, error: { code: 'INTERNAL_ERROR', message } }, 500);
    }
  }
);

/**
 * POST /api/v1/bakery/proofing-carts
 * Create proofing cart
 */
bakery.post(
  '/proofing-carts',
  requirePermission('bakery:production:create'),
  zValidator('json', createProofingCartSchema),
  async (c) => {
    try {
      const organizationId = c.get('realOrganizationId')!;
      const userId = c.get('userId');
      const data = c.req.valid('json');
      const result = await bakeryService.production.createProofingCart(organizationId, data, userId);
      return c.json({ success: true, data: result }, 201);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return c.json({ success: false, error: { code: 'INTERNAL_ERROR', message } }, 500);
    }
  }
);

/**
 * GET /api/v1/bakery/proofing-carts
 * List proofing carts
 */
bakery.get(
  '/proofing-carts',
  requirePermission('bakery:production:read'),
  zValidator('query', paginationSchema.merge(z.object({
    status: z.string().optional(),
    chamberId: z.string().optional(),
  }))),
  async (c) => {
    try {
      const organizationId = c.get('realOrganizationId')!;
      const query = c.req.valid('query');
      const result = await bakeryService.production.listProofingCarts(organizationId, query);
      return c.json({ success: true, data: result });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return c.json({ success: false, error: { code: 'INTERNAL_ERROR', message } }, 500);
    }
  }
);

/**
 * PUT /api/v1/bakery/proofing-carts/:id/status
 * Update cart status
 */
bakery.put(
  '/proofing-carts/:id/status',
  requirePermission('bakery:production:update'),
  zValidator('json', z.object({
    status: z.enum(['en_pousse', 'pret_four', 'au_four', 'termine']),
  })),
  async (c) => {
    try {
      const organizationId = c.get('realOrganizationId')!;
      const id = c.req.param('id');
      const data = c.req.valid('json');
      const result = await bakeryService.production.updateCartStatus(organizationId, id, data.status);
      return c.json({ success: true, data: result });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return c.json({ success: false, error: { code: 'INTERNAL_ERROR', message } }, 500);
    }
  }
);

/**
 * GET /api/v1/bakery/ovens
 * List ovens
 */
bakery.get(
  '/ovens',
  requirePermission('bakery:production:read'),
  async (c) => {
    try {
      const organizationId = c.get('realOrganizationId')!;
      const result = await bakeryService.production.listOvens(organizationId);
      return c.json({ success: true, data: result });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return c.json({ success: false, error: { code: 'INTERNAL_ERROR', message } }, 500);
    }
  }
);

/**
 * POST /api/v1/bakery/ovens
 * Create oven
 */
bakery.post(
  '/ovens',
  requirePermission('bakery:production:create'),
  zValidator('json', createOvenSchema),
  async (c) => {
    try {
      const organizationId = c.get('realOrganizationId')!;
      const data = c.req.valid('json');
      const result = await bakeryService.production.createOven(organizationId, data);
      return c.json({ success: true, data: result }, 201);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return c.json({ success: false, error: { code: 'INTERNAL_ERROR', message } }, 500);
    }
  }
);

/**
 * POST /api/v1/bakery/oven-passages
 * Create oven passage (start baking)
 */
bakery.post(
  '/oven-passages',
  requirePermission('bakery:production:create'),
  zValidator('json', createOvenPassageSchema),
  async (c) => {
    try {
      const organizationId = c.get('realOrganizationId')!;
      const userId = c.get('userId');
      const data = c.req.valid('json');
      const result = await bakeryService.production.createOvenPassage(organizationId, data, userId);
      return c.json({ success: true, data: result }, 201);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return c.json({ success: false, error: { code: 'INTERNAL_ERROR', message } }, 500);
    }
  }
);

/**
 * PUT /api/v1/bakery/oven-passages/:id/complete
 * Complete oven passage (finish baking)
 */
bakery.put(
  '/oven-passages/:id/complete',
  requirePermission('bakery:production:update'),
  async (c) => {
    try {
      const organizationId = c.get('realOrganizationId')!;
      const id = c.req.param('id');
      const result = await bakeryService.production.completeOvenPassage(organizationId, id);
      return c.json({ success: true, data: result });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return c.json({ success: false, error: { code: 'INTERNAL_ERROR', message } }, 500);
    }
  }
);

/**
 * GET /api/v1/bakery/oven-passages
 * List oven passages
 */
bakery.get(
  '/oven-passages',
  requirePermission('bakery:production:read'),
  zValidator('query', paginationSchema.merge(dateRangeSchema).merge(z.object({
    status: z.string().optional(),
    ovenId: z.string().optional(),
  }))),
  async (c) => {
    try {
      const organizationId = c.get('realOrganizationId')!;
      const query = c.req.valid('query');
      const result = await bakeryService.production.listOvenPassages(organizationId, query);
      return c.json({ success: true, data: result });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return c.json({ success: false, error: { code: 'INTERNAL_ERROR', message } }, 500);
    }
  }
);

/**
 * POST /api/v1/bakery/quality-controls
 * Create quality control
 */
bakery.post(
  '/quality-controls',
  requirePermission('bakery:quality:create'),
  zValidator('json', createQualityControlSchema),
  async (c) => {
    try {
      const organizationId = c.get('realOrganizationId')!;
      const userId = c.get('userId');
      const data = c.req.valid('json');
      const result = await bakeryService.production.createQualityControl(organizationId, data, userId);
      return c.json({ success: true, data: result }, 201);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return c.json({ success: false, error: { code: 'INTERNAL_ERROR', message } }, 500);
    }
  }
);

/**
 * GET /api/v1/bakery/quality-controls
 * List quality controls
 */
bakery.get(
  '/quality-controls',
  requirePermission('bakery:quality:read'),
  zValidator('query', paginationSchema.merge(dateRangeSchema).merge(z.object({
    isConforming: z.string().optional(),
  }))),
  async (c) => {
    try {
      const organizationId = c.get('realOrganizationId')!;
      const query = c.req.valid('query');
      const result = await bakeryService.production.listQualityControls(organizationId, query);
      return c.json({ success: true, data: result });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return c.json({ success: false, error: { code: 'INTERNAL_ERROR', message } }, 500);
    }
  }
);

/**
 * GET /api/v1/bakery/production-comparisons
 * Get production comparisons (theoretical vs actual)
 */
bakery.get(
  '/production-comparisons',
  requirePermission('bakery:production:read'),
  zValidator('query', paginationSchema.merge(dateRangeSchema)),
  async (c) => {
    try {
      const organizationId = c.get('realOrganizationId')!;
      const query = c.req.valid('query');
      const result = await bakeryService.production.listComparisons(organizationId, query);
      return c.json({ success: true, data: result });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return c.json({ success: false, error: { code: 'INTERNAL_ERROR', message } }, 500);
    }
  }
);

/**
 * POST /api/v1/bakery/meter-readings
 * Record meter reading
 */
bakery.post(
  '/meter-readings',
  requirePermission('bakery:energy:create'),
  zValidator('json', z.object({
    meterType: z.enum(['gaz', 'electricite', 'eau']),
    meterValue: z.number(),
  })),
  async (c) => {
    try {
      const organizationId = c.get('realOrganizationId')!;
      const userId = c.get('userId');
      const data = c.req.valid('json');
      const result = await bakeryService.production.recordMeterReading(organizationId, data, userId);
      return c.json({ success: true, data: result }, 201);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return c.json({ success: false, error: { code: 'INTERNAL_ERROR', message } }, 500);
    }
  }
);

/**
 * GET /api/v1/bakery/daily-consumptions
 * Get daily energy consumptions
 */
bakery.get(
  '/daily-consumptions',
  requirePermission('bakery:energy:read'),
  zValidator('query', paginationSchema.merge(dateRangeSchema).merge(z.object({
    energyType: z.string().optional(),
  }))),
  async (c) => {
    try {
      const organizationId = c.get('realOrganizationId')!;
      const query = c.req.valid('query');
      const result = await bakeryService.production.listDailyConsumptions(organizationId, query);
      return c.json({ success: true, data: result });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return c.json({ success: false, error: { code: 'INTERNAL_ERROR', message } }, 500);
    }
  }
);

// =============================================================================
// MAINTENANCE ROUTES
// =============================================================================

/**
 * GET /api/v1/bakery/equipment
 * List equipment
 */
bakery.get(
  '/equipment',
  requirePermission('bakery:maintenance:read'),
  zValidator('query', paginationSchema.merge(z.object({
    type: z.string().optional(),
    isActive: z.string().optional(),
  }))),
  async (c) => {
    try {
      const organizationId = c.get('realOrganizationId')!;
      const query = c.req.valid('query');
      const result = await bakeryService.maintenance.listEquipment(organizationId, query);
      return c.json({ success: true, data: result });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return c.json({ success: false, error: { code: 'INTERNAL_ERROR', message } }, 500);
    }
  }
);

/**
 * POST /api/v1/bakery/equipment
 * Create equipment
 */
bakery.post(
  '/equipment',
  requirePermission('bakery:maintenance:create'),
  zValidator('json', createEquipmentSchema),
  async (c) => {
    try {
      const organizationId = c.get('realOrganizationId')!;
      const data = c.req.valid('json');
      const result = await bakeryService.maintenance.createEquipment(organizationId, data);
      return c.json({ success: true, data: result }, 201);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return c.json({ success: false, error: { code: 'INTERNAL_ERROR', message } }, 500);
    }
  }
);

/**
 * GET /api/v1/bakery/equipment/:id
 * Get equipment by ID
 */
bakery.get(
  '/equipment/:id',
  requirePermission('bakery:maintenance:read'),
  async (c) => {
    try {
      const organizationId = c.get('realOrganizationId')!;
      const id = c.req.param('id');
      const result = await bakeryService.maintenance.getEquipment(organizationId, id);
      if (!result) {
        return c.json({ success: false, error: { code: 'NOT_FOUND', message: 'Equipment not found' } }, 404);
      }
      return c.json({ success: true, data: result });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return c.json({ success: false, error: { code: 'INTERNAL_ERROR', message } }, 500);
    }
  }
);

/**
 * PUT /api/v1/bakery/equipment/:id
 * Update equipment
 */
bakery.put(
  '/equipment/:id',
  requirePermission('bakery:maintenance:update'),
  zValidator('json', updateEquipmentSchema),
  async (c) => {
    try {
      const organizationId = c.get('realOrganizationId')!;
      const id = c.req.param('id');
      const data = c.req.valid('json');
      const result = await bakeryService.maintenance.updateEquipment(organizationId, id, data);
      return c.json({ success: true, data: result });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return c.json({ success: false, error: { code: 'INTERNAL_ERROR', message } }, 500);
    }
  }
);

/**
 * POST /api/v1/bakery/interventions
 * Create intervention
 */
bakery.post(
  '/interventions',
  requirePermission('bakery:maintenance:create'),
  zValidator('json', createInterventionSchema),
  async (c) => {
    try {
      const organizationId = c.get('realOrganizationId')!;
      const data = c.req.valid('json');
      const result = await bakeryService.maintenance.createIntervention(organizationId, data);
      return c.json({ success: true, data: result }, 201);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return c.json({ success: false, error: { code: 'INTERNAL_ERROR', message } }, 500);
    }
  }
);

/**
 * GET /api/v1/bakery/interventions
 * List interventions
 */
bakery.get(
  '/interventions',
  requirePermission('bakery:maintenance:read'),
  zValidator('query', paginationSchema.merge(dateRangeSchema).merge(z.object({
    equipmentId: z.string().optional(),
    type: z.string().optional(),
    status: z.string().optional(),
  }))),
  async (c) => {
    try {
      const organizationId = c.get('realOrganizationId')!;
      const query = c.req.valid('query');
      const result = await bakeryService.maintenance.listInterventions(organizationId, query);
      return c.json({ success: true, data: result });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return c.json({ success: false, error: { code: 'INTERNAL_ERROR', message } }, 500);
    }
  }
);

/**
 * PUT /api/v1/bakery/interventions/:id/complete
 * Complete intervention
 */
bakery.put(
  '/interventions/:id/complete',
  requirePermission('bakery:maintenance:update'),
  async (c) => {
    try {
      const organizationId = c.get('realOrganizationId')!;
      const id = c.req.param('id');
      const result = await bakeryService.maintenance.completeIntervention(organizationId, id);
      return c.json({ success: true, data: result });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return c.json({ success: false, error: { code: 'INTERNAL_ERROR', message } }, 500);
    }
  }
);

/**
 * POST /api/v1/bakery/maintenance-plans
 * Create maintenance plan
 */
bakery.post(
  '/maintenance-plans',
  requirePermission('bakery:maintenance:create'),
  zValidator('json', createMaintenancePlanSchema),
  async (c) => {
    try {
      const organizationId = c.get('realOrganizationId')!;
      const data = c.req.valid('json');
      const result = await bakeryService.maintenance.createMaintenancePlan(organizationId, data);
      return c.json({ success: true, data: result }, 201);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return c.json({ success: false, error: { code: 'INTERNAL_ERROR', message } }, 500);
    }
  }
);

/**
 * GET /api/v1/bakery/maintenance-plans
 * List maintenance plans
 */
bakery.get(
  '/maintenance-plans',
  requirePermission('bakery:maintenance:read'),
  zValidator('query', paginationSchema.merge(z.object({
    equipmentId: z.string().optional(),
  }))),
  async (c) => {
    try {
      const organizationId = c.get('realOrganizationId')!;
      const query = c.req.valid('query');
      const result = await bakeryService.maintenance.listMaintenancePlans(organizationId, query);
      return c.json({ success: true, data: result });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return c.json({ success: false, error: { code: 'INTERNAL_ERROR', message } }, 500);
    }
  }
);

/**
 * GET /api/v1/bakery/maintenance-alerts
 * Get maintenance alerts
 */
bakery.get(
  '/maintenance-alerts',
  requirePermission('bakery:maintenance:read'),
  zValidator('query', paginationSchema.merge(z.object({
    acknowledged: z.string().optional(),
  }))),
  async (c) => {
    try {
      const organizationId = c.get('realOrganizationId')!;
      const query = c.req.valid('query');
      const result = await bakeryService.maintenance.listMaintenanceAlerts(organizationId, query);
      return c.json({ success: true, data: result });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return c.json({ success: false, error: { code: 'INTERNAL_ERROR', message } }, 500);
    }
  }
);

/**
 * POST /api/v1/bakery/spare-parts
 * Create spare part
 */
bakery.post(
  '/spare-parts',
  requirePermission('bakery:maintenance:create'),
  zValidator('json', createSparePartSchema),
  async (c) => {
    try {
      const organizationId = c.get('realOrganizationId')!;
      const data = c.req.valid('json');
      const result = await bakeryService.maintenance.createSparePart(organizationId, data);
      return c.json({ success: true, data: result }, 201);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return c.json({ success: false, error: { code: 'INTERNAL_ERROR', message } }, 500);
    }
  }
);

/**
 * GET /api/v1/bakery/spare-parts
 * List spare parts
 */
bakery.get(
  '/spare-parts',
  requirePermission('bakery:maintenance:read'),
  zValidator('query', paginationSchema.merge(z.object({
    lowStock: z.string().optional(),
  }))),
  async (c) => {
    try {
      const organizationId = c.get('realOrganizationId')!;
      const query = c.req.valid('query');
      const result = await bakeryService.maintenance.listSpareParts(organizationId, query);
      return c.json({ success: true, data: result });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return c.json({ success: false, error: { code: 'INTERNAL_ERROR', message } }, 500);
    }
  }
);

/**
 * GET /api/v1/bakery/maintenance-indicators
 * Get maintenance KPIs (MTBF, MTTR, etc.)
 */
bakery.get(
  '/maintenance-indicators',
  requirePermission('bakery:maintenance:read'),
  zValidator('query', z.object({
    equipmentId: z.string().optional(),
    period: z.string().optional(),
  })),
  async (c) => {
    try {
      const organizationId = c.get('realOrganizationId')!;
      const query = c.req.valid('query');
      const result = await bakeryService.maintenance.getIndicators(organizationId, query);
      return c.json({ success: true, data: result });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return c.json({ success: false, error: { code: 'INTERNAL_ERROR', message } }, 500);
    }
  }
);

// =============================================================================
// SALES ROUTES
// =============================================================================

/**
 * GET /api/v1/bakery/b2b-clients
 * List B2B clients
 */
bakery.get(
  '/b2b-clients',
  requirePermission('bakery:sales:read'),
  zValidator('query', paginationSchema.merge(z.object({
    type: z.string().optional(),
  }))),
  async (c) => {
    try {
      const organizationId = c.get('realOrganizationId')!;
      const query = c.req.valid('query');
      const result = await bakeryService.sales.listB2BClients(organizationId, query);
      return c.json({ success: true, data: result });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return c.json({ success: false, error: { code: 'INTERNAL_ERROR', message } }, 500);
    }
  }
);

/**
 * POST /api/v1/bakery/b2b-clients
 * Create B2B client
 */
bakery.post(
  '/b2b-clients',
  requirePermission('bakery:sales:create'),
  zValidator('json', createB2BClientSchema),
  async (c) => {
    try {
      const organizationId = c.get('realOrganizationId')!;
      const data = c.req.valid('json');
      const result = await bakeryService.sales.createB2BClient(organizationId, data);
      return c.json({ success: true, data: result }, 201);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return c.json({ success: false, error: { code: 'INTERNAL_ERROR', message } }, 500);
    }
  }
);

/**
 * GET /api/v1/bakery/b2b-clients/:id
 * Get B2B client by ID
 */
bakery.get(
  '/b2b-clients/:id',
  requirePermission('bakery:sales:read'),
  async (c) => {
    try {
      const organizationId = c.get('realOrganizationId')!;
      const id = c.req.param('id');
      const result = await bakeryService.sales.getB2BClient(organizationId, id);
      if (!result) {
        return c.json({ success: false, error: { code: 'NOT_FOUND', message: 'Client not found' } }, 404);
      }
      return c.json({ success: true, data: result });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return c.json({ success: false, error: { code: 'INTERNAL_ERROR', message } }, 500);
    }
  }
);

/**
 * PUT /api/v1/bakery/b2b-clients/:id
 * Update B2B client
 */
bakery.put(
  '/b2b-clients/:id',
  requirePermission('bakery:sales:update'),
  zValidator('json', updateB2BClientSchema),
  async (c) => {
    try {
      const organizationId = c.get('realOrganizationId')!;
      const id = c.req.param('id');
      const data = c.req.valid('json');
      const result = await bakeryService.sales.updateB2BClient(organizationId, id, data);
      return c.json({ success: true, data: result });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return c.json({ success: false, error: { code: 'INTERNAL_ERROR', message } }, 500);
    }
  }
);

/**
 * POST /api/v1/bakery/delivery-orders
 * Create delivery order
 */
bakery.post(
  '/delivery-orders',
  requirePermission('bakery:sales:create'),
  zValidator('json', createDeliveryOrderSchema),
  async (c) => {
    try {
      const organizationId = c.get('realOrganizationId')!;
      const userId = c.get('userId');
      const data = c.req.valid('json');
      const result = await bakeryService.sales.createDeliveryOrder(organizationId, data, userId);
      return c.json({ success: true, data: result }, 201);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return c.json({ success: false, error: { code: 'INTERNAL_ERROR', message } }, 500);
    }
  }
);

/**
 * GET /api/v1/bakery/delivery-orders
 * List delivery orders
 */
bakery.get(
  '/delivery-orders',
  requirePermission('bakery:sales:read'),
  zValidator('query', paginationSchema.merge(dateRangeSchema).merge(z.object({
    clientId: z.string().optional(),
    status: z.string().optional(),
  }))),
  async (c) => {
    try {
      const organizationId = c.get('realOrganizationId')!;
      const query = c.req.valid('query');
      const result = await bakeryService.sales.listDeliveryOrders(organizationId, query);
      return c.json({ success: true, data: result });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return c.json({ success: false, error: { code: 'INTERNAL_ERROR', message } }, 500);
    }
  }
);

/**
 * PUT /api/v1/bakery/delivery-orders/:id/status
 * Update delivery order status
 */
bakery.put(
  '/delivery-orders/:id/status',
  requirePermission('bakery:sales:update'),
  zValidator('json', z.object({
    status: z.enum(['brouillon', 'confirmee', 'preparee', 'en_livraison', 'livree', 'facturee']),
  })),
  async (c) => {
    try {
      const organizationId = c.get('realOrganizationId')!;
      const id = c.req.param('id');
      const data = c.req.valid('json');
      const result = await bakeryService.sales.updateOrderStatus(organizationId, id, data.status);
      return c.json({ success: true, data: result });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return c.json({ success: false, error: { code: 'INTERNAL_ERROR', message } }, 500);
    }
  }
);

/**
 * POST /api/v1/bakery/delivery-notes
 * Create delivery note with signature
 */
bakery.post(
  '/delivery-notes',
  requirePermission('bakery:sales:create'),
  zValidator('json', z.object({
    orderId: z.string(),
    signatoryName: z.string().optional(),
    signatureData: z.string().optional(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    deliveredQuantities: z.array(z.object({
      productId: z.string(),
      quantity: z.number(),
    })),
  })),
  async (c) => {
    try {
      const organizationId = c.get('realOrganizationId')!;
      const userId = c.get('userId');
      const data = c.req.valid('json');
      const result = await bakeryService.sales.createDeliveryNote(organizationId, data, userId);
      return c.json({ success: true, data: result }, 201);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return c.json({ success: false, error: { code: 'INTERNAL_ERROR', message } }, 500);
    }
  }
);

/**
 * GET /api/v1/bakery/points-of-sale
 * List points of sale
 */
bakery.get(
  '/points-of-sale',
  requirePermission('bakery:sales:read'),
  async (c) => {
    try {
      const organizationId = c.get('realOrganizationId')!;
      const result = await bakeryService.sales.listPointsOfSale(organizationId);
      return c.json({ success: true, data: result });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return c.json({ success: false, error: { code: 'INTERNAL_ERROR', message } }, 500);
    }
  }
);

/**
 * POST /api/v1/bakery/points-of-sale
 * Create point of sale
 */
bakery.post(
  '/points-of-sale',
  requirePermission('bakery:sales:create'),
  zValidator('json', createPointOfSaleSchema),
  async (c) => {
    try {
      const organizationId = c.get('realOrganizationId')!;
      const data = c.req.valid('json');
      const result = await bakeryService.sales.createPointOfSale(organizationId, data);
      return c.json({ success: true, data: result }, 201);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return c.json({ success: false, error: { code: 'INTERNAL_ERROR', message } }, 500);
    }
  }
);

/**
 * POST /api/v1/bakery/sales-sessions
 * Open sales session
 */
bakery.post(
  '/sales-sessions',
  requirePermission('bakery:sales:create'),
  zValidator('json', createSalesSessionSchema),
  async (c) => {
    try {
      const organizationId = c.get('realOrganizationId')!;
      const userId = c.get('userId');
      const data = c.req.valid('json');
      const result = await bakeryService.sales.openSalesSession(organizationId, data, userId);
      return c.json({ success: true, data: result }, 201);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return c.json({ success: false, error: { code: 'INTERNAL_ERROR', message } }, 500);
    }
  }
);

/**
 * GET /api/v1/bakery/sales-sessions
 * List sales sessions
 */
bakery.get(
  '/sales-sessions',
  requirePermission('bakery:sales:read'),
  zValidator('query', paginationSchema.merge(dateRangeSchema).merge(z.object({
    pointOfSaleId: z.string().optional(),
    status: z.string().optional(),
  }))),
  async (c) => {
    try {
      const organizationId = c.get('realOrganizationId')!;
      const query = c.req.valid('query');
      const result = await bakeryService.sales.listSalesSessions(organizationId, query);
      return c.json({ success: true, data: result });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return c.json({ success: false, error: { code: 'INTERNAL_ERROR', message } }, 500);
    }
  }
);

/**
 * PUT /api/v1/bakery/sales-sessions/:id/close
 * Close sales session with stock counts
 */
bakery.put(
  '/sales-sessions/:id/close',
  requirePermission('bakery:sales:update'),
  zValidator('json', closeSalesSessionSchema),
  async (c) => {
    try {
      const organizationId = c.get('realOrganizationId')!;
      const id = c.req.param('id');
      const data = c.req.valid('json');
      const result = await bakeryService.sales.closeSalesSession(organizationId, id, data);
      return c.json({ success: true, data: result });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return c.json({ success: false, error: { code: 'INTERNAL_ERROR', message } }, 500);
    }
  }
);

/**
 * POST /api/v1/bakery/team-handovers
 * Create team handover
 */
bakery.post(
  '/team-handovers',
  requirePermission('bakery:sales:create'),
  zValidator('json', z.object({
    morningSessionId: z.string(),
    afternoonSessionId: z.string(),
    morningResponsibleId: z.string(),
    afternoonResponsibleId: z.string(),
    morningSignature: z.string().optional(),
    afternoonSignature: z.string().optional(),
    declaredMorningRevenue: z.number().optional(),
    comment: z.string().optional(),
  })),
  async (c) => {
    try {
      const organizationId = c.get('realOrganizationId')!;
      const data = c.req.valid('json');
      const result = await bakeryService.sales.createTeamHandover(organizationId, data);
      return c.json({ success: true, data: result }, 201);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return c.json({ success: false, error: { code: 'INTERNAL_ERROR', message } }, 500);
    }
  }
);

// =============================================================================
// REPORTING ROUTES
// =============================================================================

/**
 * GET /api/v1/bakery/dashboard/stock
 * Stock dashboard data
 */
bakery.get(
  '/dashboard/stock',
  requirePermission('bakery:dashboard:read'),
  async (c) => {
    try {
      const organizationId = c.get('realOrganizationId')!;
      const result = await bakeryService.reporting.getStockDashboard(organizationId);
      return c.json({ success: true, data: result });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return c.json({ success: false, error: { code: 'INTERNAL_ERROR', message } }, 500);
    }
  }
);

/**
 * GET /api/v1/bakery/dashboard/production
 * Production dashboard data
 */
bakery.get(
  '/dashboard/production',
  requirePermission('bakery:dashboard:read'),
  async (c) => {
    try {
      const organizationId = c.get('realOrganizationId')!;
      const result = await bakeryService.reporting.getProductionDashboard(organizationId);
      return c.json({ success: true, data: result });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return c.json({ success: false, error: { code: 'INTERNAL_ERROR', message } }, 500);
    }
  }
);

/**
 * GET /api/v1/bakery/dashboard/sales
 * Sales dashboard data
 */
bakery.get(
  '/dashboard/sales',
  requirePermission('bakery:dashboard:read'),
  zValidator('query', z.object({
    period: z.enum(['today', 'week', 'month', 'year']).optional(),
  })),
  async (c) => {
    try {
      const organizationId = c.get('realOrganizationId')!;
      const query = c.req.valid('query');
      const result = await bakeryService.reporting.getSalesDashboard(organizationId, query.period);
      return c.json({ success: true, data: result });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return c.json({ success: false, error: { code: 'INTERNAL_ERROR', message } }, 500);
    }
  }
);

/**
 * GET /api/v1/bakery/dashboard/maintenance
 * Maintenance dashboard data
 */
bakery.get(
  '/dashboard/maintenance',
  requirePermission('bakery:dashboard:read'),
  async (c) => {
    try {
      const organizationId = c.get('realOrganizationId')!;
      const result = await bakeryService.reporting.getMaintenanceDashboard(organizationId);
      return c.json({ success: true, data: result });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return c.json({ success: false, error: { code: 'INTERNAL_ERROR', message } }, 500);
    }
  }
);

/**
 * GET /api/v1/bakery/daily-summary
 * Get daily sales summary
 */
bakery.get(
  '/daily-summary',
  requirePermission('bakery:reports:read'),
  zValidator('query', z.object({
    date: z.string().optional(),
  })),
  async (c) => {
    try {
      const organizationId = c.get('realOrganizationId')!;
      const query = c.req.valid('query');
      const result = await bakeryService.reporting.getDailySummary(organizationId, query.date);
      return c.json({ success: true, data: result });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return c.json({ success: false, error: { code: 'INTERNAL_ERROR', message } }, 500);
    }
  }
);

/**
 * POST /api/v1/bakery/report-configs
 * Create report configuration
 */
bakery.post(
  '/report-configs',
  requirePermission('bakery:reports:create'),
  zValidator('json', createReportConfigSchema),
  async (c) => {
    try {
      const organizationId = c.get('realOrganizationId')!;
      const data = c.req.valid('json');
      const result = await bakeryService.reporting.createReportConfig(organizationId, data);
      return c.json({ success: true, data: result }, 201);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return c.json({ success: false, error: { code: 'INTERNAL_ERROR', message } }, 500);
    }
  }
);

/**
 * GET /api/v1/bakery/report-configs
 * List report configurations
 */
bakery.get(
  '/report-configs',
  requirePermission('bakery:reports:read'),
  async (c) => {
    try {
      const organizationId = c.get('realOrganizationId')!;
      const result = await bakeryService.reporting.listReportConfigs(organizationId);
      return c.json({ success: true, data: result });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return c.json({ success: false, error: { code: 'INTERNAL_ERROR', message } }, 500);
    }
  }
);

/**
 * POST /api/v1/bakery/reports/generate
 * Generate report
 */
bakery.post(
  '/reports/generate',
  requirePermission('bakery:reports:create'),
  zValidator('json', z.object({
    configId: z.string().optional(),
    reportType: z.enum(['daily', 'weekly', 'monthly']).optional(),
    startDate: z.string(),
    endDate: z.string(),
  })),
  async (c) => {
    try {
      const organizationId = c.get('realOrganizationId')!;
      const data = c.req.valid('json');
      const result = await bakeryService.reporting.generateReport(organizationId, data);
      return c.json({ success: true, data: result }, 201);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return c.json({ success: false, error: { code: 'INTERNAL_ERROR', message } }, 500);
    }
  }
);

/**
 * GET /api/v1/bakery/generated-reports
 * List generated reports
 */
bakery.get(
  '/generated-reports',
  requirePermission('bakery:reports:read'),
  zValidator('query', paginationSchema.merge(dateRangeSchema)),
  async (c) => {
    try {
      const organizationId = c.get('realOrganizationId')!;
      const query = c.req.valid('query');
      const result = await bakeryService.reporting.listGeneratedReports(organizationId, query);
      return c.json({ success: true, data: result });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return c.json({ success: false, error: { code: 'INTERNAL_ERROR', message } }, 500);
    }
  }
);

/**
 * POST /api/v1/bakery/accounting-exports
 * Create accounting export
 */
bakery.post(
  '/accounting-exports',
  requirePermission('bakery:reports:create'),
  zValidator('json', z.object({
    periodStart: z.string(),
    periodEnd: z.string(),
    exportType: z.enum(['ventes', 'achats', 'stocks', 'complet']),
    format: z.enum(['csv', 'excel', 'sage', 'ciel']),
  })),
  async (c) => {
    try {
      const organizationId = c.get('realOrganizationId')!;
      const userId = c.get('userId');
      const data = c.req.valid('json');
      const result = await bakeryService.reporting.createAccountingExport(organizationId, data, userId);
      return c.json({ success: true, data: result }, 201);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return c.json({ success: false, error: { code: 'INTERNAL_ERROR', message } }, 500);
    }
  }
);

/**
 * GET /api/v1/bakery/accounting-exports
 * List accounting exports
 */
bakery.get(
  '/accounting-exports',
  requirePermission('bakery:reports:read'),
  zValidator('query', paginationSchema.merge(dateRangeSchema)),
  async (c) => {
    try {
      const organizationId = c.get('realOrganizationId')!;
      const query = c.req.valid('query');
      const result = await bakeryService.reporting.listAccountingExports(organizationId, query);
      return c.json({ success: true, data: result });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return c.json({ success: false, error: { code: 'INTERNAL_ERROR', message } }, 500);
    }
  }
);

export default bakery;
