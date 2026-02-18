/**
 * Bakery Sales Service
 * Manages B2B clients, delivery orders, points of sale, and sales sessions
 */

import { eq, and, desc, like, or, sql } from 'drizzle-orm';
import { drizzleDb } from '../../db';
import {
  bakeryB2BClients,
  bakeryClientPricing,
  bakeryDeliveryOrders,
  bakeryDeliveryOrderLines,
  bakeryDeliveryNotes,
  bakeryPointsOfSale,
  bakerySalesSessions,
  bakeryPOSStock,
  bakeryTeamHandovers,
  bakeryProducts,
  type BakeryB2BClient,
  type BakeryDeliveryOrder,
  type BakeryDeliveryNote,
  type BakeryPointOfSale,
  type BakerySalesSession,
  type BakeryTeamHandover,
} from '@perfex/database';

interface CreateB2BClientInput {
  commercialName: string;
  type: 'restaurant' | 'hotel' | 'collectivite' | 'grossiste' | 'autre';
  mainContact: string;
  phone: string;
  email?: string;
  deliveryAddress: string;
  paymentTerms?: string;
  hasSpecificPricing?: boolean;
}

interface CreateDeliveryOrderInput {
  clientId: string;
  expectedDeliveryDate: string;
  expectedDeliveryTime?: string;
  comment?: string;
  lines: Array<{
    productId: string;
    orderedQuantity: number;
    unitPriceHT: number;
  }>;
}

interface CreateDeliveryNoteInput {
  orderId: string;
  signatoryName?: string;
  signatureData?: string;
  latitude?: number;
  longitude?: number;
  deliveredQuantities: Array<{
    productId: string;
    quantity: number;
  }>;
}

interface CreatePointOfSaleInput {
  name: string;
  location: string;
}

interface CreateSalesSessionInput {
  pointOfSaleId: string;
  sessionDate: string;
  period: 'matin' | 'apres_midi';
}

interface CloseSalesSessionInput {
  stockCounts: Array<{
    productId: string;
    closingStock: number;
  }>;
  declaredRevenue?: number;
}

interface CreateTeamHandoverInput {
  morningSessionId: string;
  afternoonSessionId: string;
  morningResponsibleId: string;
  afternoonResponsibleId: string;
  morningSignature?: string;
  afternoonSignature?: string;
  declaredMorningRevenue?: number;
  comment?: string;
}

interface QueryFilters {
  page?: number;
  limit?: number;
  search?: string;
  type?: string;
  clientId?: string;
  status?: string;
  pointOfSaleId?: string;
  startDate?: string;
  endDate?: string;
}

export class BakerySalesService {
  /**
   * List B2B clients
   */
  async listB2BClients(
    organizationId: string,
    filters: QueryFilters
  ): Promise<{ items: BakeryB2BClient[]; total: number }> {
    const conditions: any[] = [eq(bakeryB2BClients.organizationId, organizationId)];

    if (filters.type) {
      conditions.push(eq(bakeryB2BClients.type, filters.type as any));
    }

    if (filters.search) {
      const searchTerm = `%${filters.search}%`;
      conditions.push(
        or(
          like(bakeryB2BClients.commercialName, searchTerm),
          like(bakeryB2BClients.mainContact, searchTerm)
        )
      );
    }

    const items = await drizzleDb
      .select()
      .from(bakeryB2BClients)
      .where(and(...conditions))
      .orderBy(bakeryB2BClients.commercialName)
      .all() as BakeryB2BClient[];

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
   * Create B2B client
   */
  async createB2BClient(
    organizationId: string,
    data: CreateB2BClientInput
  ): Promise<BakeryB2BClient> {
    const now = new Date();
    const id = crypto.randomUUID();

    await drizzleDb.insert(bakeryB2BClients).values({
      id,
      organizationId,
      commercialName: data.commercialName,
      type: data.type,
      mainContact: data.mainContact,
      phone: data.phone,
      email: data.email || null,
      deliveryAddress: data.deliveryAddress,
      paymentTerms: data.paymentTerms || null,
      hasSpecificPricing: data.hasSpecificPricing || false,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    const client = await this.getB2BClient(organizationId, id);
    if (!client) {
      throw new Error('Failed to create client');
    }

    return client;
  }

  /**
   * Get B2B client by ID
   */
  async getB2BClient(organizationId: string, id: string): Promise<BakeryB2BClient | null> {
    const client = await drizzleDb
      .select()
      .from(bakeryB2BClients)
      .where(and(eq(bakeryB2BClients.id, id), eq(bakeryB2BClients.organizationId, organizationId)))
      .get() as BakeryB2BClient | undefined;

    return client || null;
  }

  /**
   * Update B2B client
   */
  async updateB2BClient(
    organizationId: string,
    id: string,
    data: Partial<CreateB2BClientInput>
  ): Promise<BakeryB2BClient> {
    const existing = await this.getB2BClient(organizationId, id);
    if (!existing) {
      throw new Error('Client not found');
    }

    await drizzleDb
      .update(bakeryB2BClients)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(and(eq(bakeryB2BClients.id, id), eq(bakeryB2BClients.organizationId, organizationId)));

    const updated = await this.getB2BClient(organizationId, id);
    if (!updated) {
      throw new Error('Failed to update client');
    }

    return updated;
  }

  /**
   * Create delivery order
   * Schema: orderDate, expectedDeliveryDate, expectedDeliveryTime, status, totalAmountHT, vatAmount, totalAmountTTC
   */
  async createDeliveryOrder(
    organizationId: string,
    data: CreateDeliveryOrderInput,
    userId: string
  ): Promise<BakeryDeliveryOrder> {
    const now = new Date();
    const id = crypto.randomUUID();

    // Generate order number
    const orderNumber = `CMD-${Date.now().toString(36).toUpperCase()}`;

    // Calculate totals
    let totalAmountHT = 0;
    for (const line of data.lines) {
      totalAmountHT += line.orderedQuantity * line.unitPriceHT;
    }
    const taxRate = 0.19; // Tunisia VAT rate (can be configurable)
    const vatAmount = totalAmountHT * taxRate;
    const totalAmountTTC = totalAmountHT + vatAmount;

    await drizzleDb.insert(bakeryDeliveryOrders).values({
      id,
      organizationId,
      clientId: data.clientId,
      orderNumber,
      orderDate: now,
      expectedDeliveryDate: new Date(data.expectedDeliveryDate),
      expectedDeliveryTime: data.expectedDeliveryTime || null,
      status: 'brouillon',
      totalAmountHT,
      vatAmount,
      totalAmountTTC,
      comment: data.comment || null,
      createdById: userId,
      createdAt: now,
      updatedAt: now,
    });

    // Create order lines (no organizationId)
    for (const line of data.lines) {
      // Get client-specific pricing if exists
      let unitPrice = line.unitPriceHT;
      const clientPricing = await drizzleDb
        .select()
        .from(bakeryClientPricing)
        .where(and(
          eq(bakeryClientPricing.clientId, data.clientId),
          eq(bakeryClientPricing.productId, line.productId)
        ))
        .get();

      if (clientPricing) {
        unitPrice = (clientPricing as any).specificPrice;
      }

      const lineAmountHT = line.orderedQuantity * unitPrice;

      await drizzleDb.insert(bakeryDeliveryOrderLines).values({
        id: crypto.randomUUID(),
        orderId: id,
        productId: line.productId,
        orderedQuantity: line.orderedQuantity,
        unitPriceHT: unitPrice,
        lineAmountHT,
        createdAt: now,
      });
    }

    const order = await drizzleDb
      .select()
      .from(bakeryDeliveryOrders)
      .where(eq(bakeryDeliveryOrders.id, id))
      .get() as BakeryDeliveryOrder;

    return order;
  }

  /**
   * List delivery orders
   */
  async listDeliveryOrders(
    organizationId: string,
    filters: QueryFilters
  ): Promise<{ items: any[]; total: number }> {
    const conditions: any[] = [eq(bakeryDeliveryOrders.organizationId, organizationId)];

    if (filters.clientId) {
      conditions.push(eq(bakeryDeliveryOrders.clientId, filters.clientId));
    }

    if (filters.status) {
      conditions.push(eq(bakeryDeliveryOrders.status, filters.status as any));
    }

    if (filters.startDate) {
      conditions.push(sql`${bakeryDeliveryOrders.expectedDeliveryDate} >= ${filters.startDate}`);
    }

    if (filters.endDate) {
      conditions.push(sql`${bakeryDeliveryOrders.expectedDeliveryDate} <= ${filters.endDate}`);
    }

    // Pagination at DB level
    const page = filters.page || 1;
    const limit = filters.limit || 50;
    const offset = (page - 1) * limit;

    const orders = await drizzleDb
      .select()
      .from(bakeryDeliveryOrders)
      .where(and(...conditions))
      .orderBy(desc(bakeryDeliveryOrders.createdAt))
      .limit(limit)
      .offset(offset)
      .all() as BakeryDeliveryOrder[];

    // Get total count
    const totalResult = await drizzleDb
      .select({ count: sql<number>`count(*)` })
      .from(bakeryDeliveryOrders)
      .where(and(...conditions))
      .get();
    const total = totalResult?.count || 0;

    if (orders.length === 0) {
      return { items: [], total };
    }

    // Batch fetch: Get all clients in one query
    const clientIds = [...new Set(orders.map(o => o.clientId))];
    const clients = await drizzleDb
      .select()
      .from(bakeryB2BClients)
      .where(sql`${bakeryB2BClients.id} IN (${sql.join(clientIds.map(id => sql`${id}`), sql`, `)})`)
      .all();
    const clientMap = new Map((clients as any[]).map(c => [c.id, c]));

    // Batch fetch: Get all order lines in one query
    const orderIds = orders.map(o => o.id);
    const allLines = await drizzleDb
      .select()
      .from(bakeryDeliveryOrderLines)
      .where(sql`${bakeryDeliveryOrderLines.orderId} IN (${sql.join(orderIds.map(id => sql`${id}`), sql`, `)})`)
      .all();

    // Batch fetch: Get all products in one query
    const productIds = [...new Set((allLines as any[]).map(l => l.productId))];
    const products = productIds.length > 0
      ? await drizzleDb
          .select()
          .from(bakeryProducts)
          .where(sql`${bakeryProducts.id} IN (${sql.join(productIds.map(id => sql`${id}`), sql`, `)})`)
          .all()
      : [];
    const productMap = new Map((products as any[]).map(p => [p.id, p]));

    // Build lines lookup map
    const linesByOrder = new Map<string, any[]>();
    for (const line of allLines as any[]) {
      const orderLines = linesByOrder.get(line.orderId) || [];
      orderLines.push({
        ...line,
        product: productMap.get(line.productId) || null,
      });
      linesByOrder.set(line.orderId, orderLines);
    }

    // Build enriched orders
    const ordersWithDetails = orders.map(order => ({
      ...order,
      client: clientMap.get(order.clientId) || null,
      lines: linesByOrder.get(order.id) || [],
    }));

    return {
      items: ordersWithDetails,
      total,
    };
  }

  /**
   * Update order status
   */
  async updateOrderStatus(
    organizationId: string,
    orderId: string,
    status: 'brouillon' | 'confirmee' | 'preparee' | 'en_livraison' | 'livree' | 'facturee'
  ): Promise<BakeryDeliveryOrder> {
    const now = new Date();

    await drizzleDb
      .update(bakeryDeliveryOrders)
      .set({
        status,
        updatedAt: now,
      })
      .where(and(
        eq(bakeryDeliveryOrders.id, orderId),
        eq(bakeryDeliveryOrders.organizationId, organizationId)
      ));

    const order = await drizzleDb
      .select()
      .from(bakeryDeliveryOrders)
      .where(eq(bakeryDeliveryOrders.id, orderId))
      .get() as BakeryDeliveryOrder;

    if (!order) {
      throw new Error('Order not found');
    }

    return order;
  }

  /**
   * Create delivery note with signature
   * Schema: issueDate, departureTime, arrivalTime, deliveryPersonId, clientSignatureData, signatoryName, signatureDate, signatureLatitude, signatureLongitude
   */
  async createDeliveryNote(
    organizationId: string,
    data: CreateDeliveryNoteInput,
    userId: string
  ): Promise<BakeryDeliveryNote> {
    const now = new Date();
    const id = crypto.randomUUID();

    // Generate note number
    const noteNumber = `BL-${Date.now().toString(36).toUpperCase()}`;

    await drizzleDb.insert(bakeryDeliveryNotes).values({
      id,
      orderId: data.orderId,
      noteNumber,
      issueDate: now,
      arrivalTime: now,
      signatoryName: data.signatoryName || null,
      clientSignatureData: data.signatureData || null,
      signatureDate: data.signatureData ? now : null,
      signatureLatitude: data.latitude || null,
      signatureLongitude: data.longitude || null,
      deliveryPersonId: userId,
      createdAt: now,
    });

    // Update order line delivered quantities
    for (const item of data.deliveredQuantities) {
      await drizzleDb
        .update(bakeryDeliveryOrderLines)
        .set({
          deliveredQuantity: item.quantity,
        })
        .where(and(
          eq(bakeryDeliveryOrderLines.orderId, data.orderId),
          eq(bakeryDeliveryOrderLines.productId, item.productId)
        ));
    }

    // Update order status
    await this.updateOrderStatus(organizationId, data.orderId, 'livree');

    const note = await drizzleDb
      .select()
      .from(bakeryDeliveryNotes)
      .where(eq(bakeryDeliveryNotes.id, id))
      .get() as BakeryDeliveryNote;

    return note;
  }

  /**
   * List points of sale
   */
  async listPointsOfSale(organizationId: string): Promise<BakeryPointOfSale[]> {
    const items = await drizzleDb
      .select()
      .from(bakeryPointsOfSale)
      .where(eq(bakeryPointsOfSale.organizationId, organizationId))
      .orderBy(bakeryPointsOfSale.name)
      .all() as BakeryPointOfSale[];

    return items;
  }

  /**
   * Create point of sale
   */
  async createPointOfSale(
    organizationId: string,
    data: CreatePointOfSaleInput
  ): Promise<BakeryPointOfSale> {
    const now = new Date();
    const id = crypto.randomUUID();

    await drizzleDb.insert(bakeryPointsOfSale).values({
      id,
      organizationId,
      name: data.name,
      location: data.location,
      isActive: true,
      createdAt: now,
    });

    const pos = await drizzleDb
      .select()
      .from(bakeryPointsOfSale)
      .where(eq(bakeryPointsOfSale.id, id))
      .get() as BakeryPointOfSale;

    return pos;
  }

  /**
   * Open sales session
   * Schema: sessionDate, period, responsibleId, openingTime, closingTime, status, calculatedRevenue, declaredRevenue, revenueVariance
   */
  async openSalesSession(
    organizationId: string,
    data: CreateSalesSessionInput,
    userId: string
  ): Promise<BakerySalesSession> {
    const now = new Date();
    const id = crypto.randomUUID();

    await drizzleDb.insert(bakerySalesSessions).values({
      id,
      organizationId,
      pointOfSaleId: data.pointOfSaleId,
      sessionDate: new Date(data.sessionDate),
      period: data.period,
      status: 'ouverte',
      responsibleId: userId,
      openingTime: now,
      createdAt: now,
      updatedAt: now,
    });

    // Initialize POS stock from products
    // Schema: sessionId, productId, productType, openingStock, dailyEntries, deliveries, defective, closingStock, calculatedSold, unitPrice, productRevenue
    const products = await drizzleDb
      .select()
      .from(bakeryProducts)
      .where(and(
        eq(bakeryProducts.organizationId, organizationId),
        eq(bakeryProducts.isActive, true)
      ))
      .all();

    for (const product of products as any[]) {
      await drizzleDb.insert(bakeryPOSStock).values({
        id: crypto.randomUUID(),
        sessionId: id,
        productId: product.id,
        productType: product.category || 'pain',
        openingStock: 0, // Will be updated based on previous session
        dailyEntries: 0,
        deliveries: 0,
        defective: 0,
        closingStock: 0,
        calculatedSold: 0,
        unitPrice: product.unitPrice || 0,
        productRevenue: 0,
        createdAt: now,
        updatedAt: now,
      });
    }

    const session = await drizzleDb
      .select()
      .from(bakerySalesSessions)
      .where(eq(bakerySalesSessions.id, id))
      .get() as BakerySalesSession;

    return session;
  }

  /**
   * List sales sessions
   */
  async listSalesSessions(
    organizationId: string,
    filters: QueryFilters
  ): Promise<{ items: any[]; total: number }> {
    const conditions: any[] = [eq(bakerySalesSessions.organizationId, organizationId)];

    if (filters.pointOfSaleId) {
      conditions.push(eq(bakerySalesSessions.pointOfSaleId, filters.pointOfSaleId));
    }

    if (filters.status) {
      conditions.push(eq(bakerySalesSessions.status, filters.status as any));
    }

    if (filters.startDate) {
      conditions.push(sql`${bakerySalesSessions.sessionDate} >= ${filters.startDate}`);
    }

    if (filters.endDate) {
      conditions.push(sql`${bakerySalesSessions.sessionDate} <= ${filters.endDate}`);
    }

    const sessions = await drizzleDb
      .select()
      .from(bakerySalesSessions)
      .where(and(...conditions))
      .orderBy(desc(bakerySalesSessions.sessionDate))
      .all() as BakerySalesSession[];

    // Get point of sale details
    const sessionsWithDetails = await Promise.all(
      sessions.map(async (session) => {
        const pos = await drizzleDb
          .select()
          .from(bakeryPointsOfSale)
          .where(eq(bakeryPointsOfSale.id, session.pointOfSaleId))
          .get();

        const stock = await drizzleDb
          .select()
          .from(bakeryPOSStock)
          .where(eq(bakeryPOSStock.sessionId, session.id))
          .all();

        return {
          ...session,
          pointOfSale: pos,
          stock,
        };
      })
    );

    const page = filters.page || 1;
    const limit = filters.limit || 50;
    const offset = (page - 1) * limit;
    const paginatedItems = sessionsWithDetails.slice(offset, offset + limit);

    return {
      items: paginatedItems,
      total: sessionsWithDetails.length,
    };
  }

  /**
   * Close sales session with stock counts
   */
  async closeSalesSession(
    organizationId: string,
    sessionId: string,
    data: CloseSalesSessionInput
  ): Promise<BakerySalesSession> {
    const now = new Date();

    // Get session
    const session = await drizzleDb
      .select()
      .from(bakerySalesSessions)
      .where(eq(bakerySalesSessions.id, sessionId))
      .get() as BakerySalesSession;

    if (!session) {
      throw new Error('Session not found');
    }

    // Calculate revenue
    let calculatedRevenue = 0;

    for (const count of data.stockCounts) {
      // Get POS stock entry
      const posStock = await drizzleDb
        .select()
        .from(bakeryPOSStock)
        .where(and(
          eq(bakeryPOSStock.sessionId, sessionId),
          eq(bakeryPOSStock.productId, count.productId)
        ))
        .get() as any;

      if (posStock) {
        const opening = posStock.openingStock || 0;
        const dailyEntries = posStock.dailyEntries || 0;
        const deliveries = posStock.deliveries || 0;
        const defective = posStock.defective || 0;
        const closing = count.closingStock;
        const calculatedSold = opening + dailyEntries - deliveries - defective - closing;

        // Get product price from stock entry
        const unitPrice = posStock.unitPrice || 0;
        const productRevenue = calculatedSold * unitPrice;
        calculatedRevenue += productRevenue;

        // Update POS stock
        await drizzleDb
          .update(bakeryPOSStock)
          .set({
            closingStock: closing,
            calculatedSold,
            productRevenue,
            updatedAt: now,
          })
          .where(eq(bakeryPOSStock.id, posStock.id));
      }
    }

    // Update session with closing values
    const revenueVariance = data.declaredRevenue ? data.declaredRevenue - calculatedRevenue : null;

    await drizzleDb
      .update(bakerySalesSessions)
      .set({
        status: 'fermee',
        closingTime: now,
        declaredRevenue: data.declaredRevenue || null,
        calculatedRevenue,
        revenueVariance,
        updatedAt: now,
      })
      .where(eq(bakerySalesSessions.id, sessionId));

    const updated = await drizzleDb
      .select()
      .from(bakerySalesSessions)
      .where(eq(bakerySalesSessions.id, sessionId))
      .get() as BakerySalesSession;

    return updated;
  }

  /**
   * Create team handover
   * Schema: morningSessionId, afternoonSessionId, handoverDate, handoverTime, morningResponsibleId, afternoonResponsibleId, jointValidation, morningSignature, afternoonSignature, calculatedMorningRevenue, declaredMorningRevenue, variance, comment
   */
  async createTeamHandover(
    organizationId: string,
    data: CreateTeamHandoverInput
  ): Promise<BakeryTeamHandover> {
    const now = new Date();
    const id = crypto.randomUUID();

    // Get morning session
    const morningSession = await drizzleDb
      .select()
      .from(bakerySalesSessions)
      .where(eq(bakerySalesSessions.id, data.morningSessionId))
      .get() as BakerySalesSession;

    if (!morningSession) {
      throw new Error('Morning session not found');
    }

    // Get morning session stock for transfer
    const morningStock = await drizzleDb
      .select()
      .from(bakeryPOSStock)
      .where(eq(bakeryPOSStock.sessionId, data.morningSessionId))
      .all();

    // Update afternoon session opening stock
    for (const stock of morningStock as any[]) {
      if (stock.closingStock !== null && stock.closingStock !== undefined) {
        await drizzleDb
          .update(bakeryPOSStock)
          .set({
            openingStock: stock.closingStock,
            updatedAt: now,
          })
          .where(and(
            eq(bakeryPOSStock.sessionId, data.afternoonSessionId),
            eq(bakeryPOSStock.productId, stock.productId)
          ));
      }
    }

    // Calculate morning revenue from session
    const calculatedMorningRevenue = morningSession.calculatedRevenue || 0;
    const variance = data.declaredMorningRevenue
      ? data.declaredMorningRevenue - calculatedMorningRevenue
      : null;

    await drizzleDb.insert(bakeryTeamHandovers).values({
      id,
      organizationId,
      handoverDate: now,
      handoverTime: now,
      morningSessionId: data.morningSessionId,
      afternoonSessionId: data.afternoonSessionId,
      morningResponsibleId: data.morningResponsibleId,
      afternoonResponsibleId: data.afternoonResponsibleId,
      jointValidation: false,
      morningSignature: data.morningSignature || null,
      afternoonSignature: data.afternoonSignature || null,
      calculatedMorningRevenue,
      declaredMorningRevenue: data.declaredMorningRevenue || null,
      variance,
      comment: data.comment || null,
      createdAt: now,
    });

    const handover = await drizzleDb
      .select()
      .from(bakeryTeamHandovers)
      .where(eq(bakeryTeamHandovers.id, id))
      .get() as BakeryTeamHandover;

    return handover;
  }
}

export const bakerySalesService = new BakerySalesService();
