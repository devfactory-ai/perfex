/**
 * Seed Routes
 * Database seeding endpoints for demo/staging environments
 */

import { Hono } from 'hono';
import { getDb } from '../db';
import type { Env } from '../types';
import {
  organizations,
  users,
  organizationMembers,
  roles,
  userRoles,
  suppliers,
  bakeryArticles,
  bakeryProducts,
  bakeryProductRecipes,
  bakeryRecipeCompositions,
  bakeryProofingChambers,
  bakeryOvens,
  bakeryEquipment,
  bakeryMaintenancePlans,
  bakerySpareParts,
  bakeryB2BClients,
  bakeryPointsOfSale,
  bakerySupplierOrders,
  bakerySupplierOrderLines,
  bakeryStockMovements,
  bakeryDeliveryOrders,
  bakeryDeliveryOrderLines,
  bakeryReportConfigs,
} from '@perfex/database';

const app = new Hono<{ Bindings: Env }>();

/**
 * Hash password
 */
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * POST /seed/bakery
 * Seed database with bakery demo data
 */
app.post('/bakery', async (c) => {
  try {
    // Safety check - only staging/dev
    const env = c.env.ENVIRONMENT || 'development';
    if (env === 'production') {
      return c.json({ error: 'Seeding not allowed in production' }, 403);
    }

    const seedKey = c.req.header('X-Seed-Key');
    const expectedKey = c.env.SEED_SECRET_KEY || 'perfex-demo-2024';
    if (seedKey !== expectedKey) {
      return c.json({ error: 'Invalid seed key' }, 401);
    }

    const db = getDb();
    const now = new Date();

    // IDs
    const orgId = crypto.randomUUID();
    const adminId = crypto.randomUUID();
    const bakerId = crypto.randomUUID();
    const salesId = crypto.randomUUID();
    const deliveryId = crypto.randomUUID();

    console.log('Creating bakery organization...');

    // Create organization
    await db.insert(organizations).values({
      id: orgId,
      name: 'Boulangerie Au Pain Doré',
      slug: 'boulangerie-pain-dore',
      settings: JSON.stringify({
        industry: 'Boulangerie-Pâtisserie',
        size: '10-50',
        country: 'France',
        timezone: 'Europe/Paris',
        currency: 'EUR',
        fiscalYearEnd: '12-31',
      }),
      createdAt: now,
      updatedAt: now,
    });

    // Create users
    const adminHash = await hashPassword('Demo@2024!');
    const bakerHash = await hashPassword('Baker@2024!');
    const salesHash = await hashPassword('Sales@2024!');
    const deliveryHash = await hashPassword('Delivery@2024!');

    await db.insert(users).values([
      {
        id: adminId,
        email: 'demo@perfex.io',
        passwordHash: adminHash,
        firstName: 'Jean-Pierre',
        lastName: 'Dupont',
        active: true,
        emailVerified: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: bakerId,
        email: 'boulanger@perfex.io',
        passwordHash: bakerHash,
        firstName: 'Marie',
        lastName: 'Martin',
        active: true,
        emailVerified: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: salesId,
        email: 'vente@perfex.io',
        passwordHash: salesHash,
        firstName: 'Sophie',
        lastName: 'Bernard',
        active: true,
        emailVerified: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: deliveryId,
        email: 'livraison@perfex.io',
        passwordHash: deliveryHash,
        firstName: 'Pierre',
        lastName: 'Lefebvre',
        active: true,
        emailVerified: true,
        createdAt: now,
        updatedAt: now,
      },
    ]);

    // Create memberships
    await db.insert(organizationMembers).values([
      { id: crypto.randomUUID(), organizationId: orgId, userId: adminId, role: 'admin', joinedAt: now },
      { id: crypto.randomUUID(), organizationId: orgId, userId: bakerId, role: 'member', joinedAt: now },
      { id: crypto.randomUUID(), organizationId: orgId, userId: salesId, role: 'member', joinedAt: now },
      { id: crypto.randomUUID(), organizationId: orgId, userId: deliveryId, role: 'member', joinedAt: now },
    ]);

    // Create roles
    const adminRoleId = crypto.randomUUID();
    await db.insert(roles).values([
      {
        id: adminRoleId,
        organizationId: orgId,
        name: 'Gérant',
        permissions: JSON.stringify({ 'bakery:*': true, 'stock:*': true, 'production:*': true, 'sales:*': true }),
        createdAt: now,
      },
    ]);

    await db.insert(userRoles).values({
      id: crypto.randomUUID(),
      organizationId: orgId,
      userId: adminId,
      roleId: adminRoleId,
    });

    console.log('Creating suppliers...');

    // Create suppliers
    const supplierIds: Record<string, string> = {};
    const suppliersData = [
      { name: 'Grands Moulins de Paris', supplierNumber: 'SUP-001', email: 'commandes@grandsmoulins.fr', phone: '+33 1 45 67 89 00' },
      { name: 'Lesaffre Levures', supplierNumber: 'SUP-002', email: 'france@lesaffre.com', phone: '+33 3 20 81 61 00' },
      { name: 'Metro Cash & Carry', supplierNumber: 'SUP-003', email: 'pro@metro.fr', phone: '+33 1 41 41 41 41' },
    ];

    for (const s of suppliersData) {
      const id = crypto.randomUUID();
      supplierIds[s.name] = id;
      await db.insert(suppliers).values({
        id,
        organizationId: orgId,
        supplierNumber: s.supplierNumber,
        name: s.name,
        email: s.email,
        phone: s.phone,
        country: 'France',
        paymentTerms: 'net_30',
        active: true,
        createdBy: adminId,
        createdAt: now,
        updatedAt: now,
      });
    }

    console.log('Creating raw materials...');

    // Create articles (raw materials)
    const articleIds: Record<string, string> = {};
    const articlesData = [
      { ref: 'FAR-T55', name: 'Farine de blé T55', cat: 'farine', unit: 'kg', price: 0.85, stock: 500 },
      { ref: 'FAR-T65', name: 'Farine de blé T65', cat: 'farine', unit: 'kg', price: 0.90, stock: 400 },
      { ref: 'LEV-FRA', name: 'Levure fraîche', cat: 'levure', unit: 'kg', price: 2.50, stock: 20 },
      { ref: 'SEL-FIN', name: 'Sel fin', cat: 'autre', unit: 'kg', price: 0.50, stock: 50 },
      { ref: 'MAT-BEU', name: 'Beurre AOP 82%', cat: 'autre', unit: 'kg', price: 8.50, stock: 50 },
      { ref: 'SUC-BLA', name: 'Sucre blanc', cat: 'autre', unit: 'kg', price: 1.20, stock: 100 },
      { ref: 'CHO-NOI', name: 'Chocolat noir 70%', cat: 'autre', unit: 'kg', price: 12.00, stock: 20 },
      { ref: 'LAI-ENT', name: 'Lait entier UHT', cat: 'autre', unit: 'L', price: 1.10, stock: 100 },
      { ref: 'OEU-FRA', name: 'Oeufs frais (x180)', cat: 'autre', unit: 'unite', price: 25.00, stock: 10 },
      { ref: 'EMB-SAC', name: 'Sachets papier kraft', cat: 'emballages', unit: 'unite', price: 0.08, stock: 2000 },
    ];

    for (const a of articlesData) {
      const id = crypto.randomUUID();
      articleIds[a.ref] = id;
      await db.insert(bakeryArticles).values({
        id,
        organizationId: orgId,
        reference: a.ref,
        name: a.name,
        category: a.cat,
        unitOfMeasure: a.unit,
        averagePurchasePrice: a.price,
        currentStock: a.stock,
        minimumStock: a.stock * 0.2,
        optimalStock: a.stock * 0.6,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      });
    }

    console.log('Creating products...');

    // Create products
    const productIds: Record<string, string> = {};
    const productsData = [
      { ref: 'PAI-BAG', name: 'Baguette tradition', cat: 'pain', price: 1.30, cost: 0.35 },
      { ref: 'PAI-CAM', name: 'Pain de campagne', cat: 'pain', price: 3.20, cost: 0.85 },
      { ref: 'VIE-CRO', name: 'Croissant pur beurre', cat: 'viennoiserie', price: 1.40, cost: 0.45 },
      { ref: 'VIE-PAC', name: 'Pain au chocolat', cat: 'viennoiserie', price: 1.50, cost: 0.50 },
      { ref: 'VIE-RAI', name: 'Pain aux raisins', cat: 'viennoiserie', price: 1.60, cost: 0.55 },
      { ref: 'PAT-ECL', name: 'Éclair au chocolat', cat: 'patisserie', price: 3.50, cost: 0.95 },
      { ref: 'PAT-TAR', name: 'Tarte aux fruits', cat: 'patisserie', price: 3.80, cost: 1.00 },
      { ref: 'SNA-JAM', name: 'Sandwich jambon-beurre', cat: 'autre', price: 4.50, cost: 1.50 },
    ];

    for (const p of productsData) {
      const id = crypto.randomUUID();
      productIds[p.ref] = id;
      await db.insert(bakeryProducts).values({
        id,
        organizationId: orgId,
        reference: p.ref,
        name: p.name,
        category: p.cat,
        unitPrice: p.price,
        costPrice: p.cost,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      });
    }

    console.log('Creating recipes...');

    // Create baguette recipe
    const baguetteRecipeId = crypto.randomUUID();
    await db.insert(bakeryProductRecipes).values({
      id: baguetteRecipeId,
      organizationId: orgId,
      productId: productIds['PAI-BAG'],
      name: 'Recette Baguette Tradition',
      yield: 20,
      yieldUnit: 'baguettes',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    await db.insert(bakeryRecipeCompositions).values([
      { id: crypto.randomUUID(), recipeId: baguetteRecipeId, articleId: articleIds['FAR-T65'], quantityNeeded: 5, createdAt: now },
      { id: crypto.randomUUID(), recipeId: baguetteRecipeId, articleId: articleIds['LEV-FRA'], quantityNeeded: 0.1, createdAt: now },
      { id: crypto.randomUUID(), recipeId: baguetteRecipeId, articleId: articleIds['SEL-FIN'], quantityNeeded: 0.1, createdAt: now },
    ]);

    console.log('Creating equipment...');

    // Create proofing chambers
    await db.insert(bakeryProofingChambers).values([
      { id: crypto.randomUUID(), organizationId: orgId, name: 'Chambre pousse 1', cartCapacity: 8, idealTemperature: 28, idealHumidity: 85, isActive: true, createdAt: now },
      { id: crypto.randomUUID(), organizationId: orgId, name: 'Chambre pousse 2', cartCapacity: 6, idealTemperature: 26, idealHumidity: 80, isActive: true, createdAt: now },
    ]);

    // Create ovens
    await db.insert(bakeryOvens).values([
      { id: crypto.randomUUID(), organizationId: orgId, name: 'Four rotatif Bongard', type: 'rotatif', cartCapacity: 2, maxTemperature: 280, isActive: true, createdAt: now },
      { id: crypto.randomUUID(), organizationId: orgId, name: 'Four à sole Pavailler', type: 'sole', cartCapacity: 4, maxTemperature: 300, isActive: true, createdAt: now },
    ]);

    // Create equipment
    const equipmentIds: Record<string, string> = {};
    const equipmentData = [
      { name: 'Four rotatif Bongard', type: 'four', brand: 'Bongard', model: 'Cervap MR 2000', serial: 'BG-2019-4521', value: 45000 },
      { name: 'Pétrin spirale VMI', type: 'petrin', brand: 'VMI', model: 'SPI 200', serial: 'VMI-2018-8765', value: 12000 },
      { name: 'Laminoir Rondo', type: 'laminoir', brand: 'Rondo', model: 'Doge 600', serial: 'RD-2021-9876', value: 25000 },
    ];

    for (const eq of equipmentData) {
      const id = crypto.randomUUID();
      equipmentIds[eq.name] = id;
      const purchaseDate = new Date('2020-01-15');
      const warrantyEnd = new Date('2022-01-15');
      await db.insert(bakeryEquipment).values({
        id,
        organizationId: orgId,
        name: eq.name,
        type: eq.type,
        brand: eq.brand,
        model: eq.model,
        serialNumber: eq.serial,
        purchaseDate,
        commissioningDate: purchaseDate,
        purchaseValue: eq.value,
        warrantyMonths: 24,
        warrantyEndDate: warrantyEnd,
        location: 'Atelier principal',
        isActive: true,
        createdAt: now,
        updatedAt: now,
      });
    }

    console.log('Creating maintenance plans...');

    // Create maintenance plan
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    await db.insert(bakeryMaintenancePlans).values({
      id: crypto.randomUUID(),
      organizationId: orgId,
      equipmentId: equipmentIds['Four rotatif Bongard'],
      periodicityType: 'mois',
      interval: 1,
      nextScheduledDate: nextMonth,
      checklist: JSON.stringify(['Nettoyage brûleurs', 'Vérification joints', 'Contrôle température']),
      estimatedDurationMinutes: 60,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    console.log('Creating spare parts...');

    // Create spare parts
    await db.insert(bakerySpareParts).values([
      { id: crypto.randomUUID(), organizationId: orgId, reference: 'SP-JOI-001', designation: 'Joint de porte four', currentStock: 5, minimumStock: 2, unitPrice: 85, deliveryLeadDays: 7, createdAt: now, updatedAt: now },
      { id: crypto.randomUUID(), organizationId: orgId, reference: 'SP-COU-001', designation: 'Courroie pétrin VMI', currentStock: 3, minimumStock: 1, unitPrice: 120, deliveryLeadDays: 10, createdAt: now, updatedAt: now },
    ]);

    console.log('Creating B2B clients...');

    // Create B2B clients
    const clientIds: Record<string, string> = {};
    const clientsData = [
      { name: 'Restaurant Le Bistrot Parisien', type: 'restaurant', contact: 'Michel Roux', phone: '+33 1 42 33 44 55', address: '15 Rue de la Gaité, 75014 Paris' },
      { name: 'Hôtel Grand Luxe', type: 'hotel', contact: 'Isabelle Mercier', phone: '+33 1 45 67 89 01', address: '8 Place Vendôme, 75001 Paris' },
      { name: 'Café des Arts', type: 'restaurant', contact: 'Pierre Lefebvre', phone: '+33 1 43 55 66 77', address: '42 Boulevard Saint-Germain, 75005 Paris' },
    ];

    for (const cl of clientsData) {
      const id = crypto.randomUUID();
      clientIds[cl.name] = id;
      await db.insert(bakeryB2BClients).values({
        id,
        organizationId: orgId,
        commercialName: cl.name,
        type: cl.type,
        mainContact: cl.contact,
        phone: cl.phone,
        deliveryAddress: cl.address,
        paymentTerms: 'Net 15',
        isActive: true,
        createdAt: now,
        updatedAt: now,
      });
    }

    console.log('Creating points of sale...');

    // Create points of sale
    await db.insert(bakeryPointsOfSale).values([
      { id: crypto.randomUUID(), organizationId: orgId, name: 'Boutique principale', location: '45 Rue du Commerce, 75015 Paris', isActive: true, createdAt: now },
      { id: crypto.randomUUID(), organizationId: orgId, name: 'Kiosque marché Aligre', location: 'Marché d\'Aligre, 75012 Paris', isActive: true, createdAt: now },
    ]);

    console.log('Creating sample transactions...');

    // Create sample supplier order
    const orderId = crypto.randomUUID();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    await db.insert(bakerySupplierOrders).values({
      id: orderId,
      organizationId: orgId,
      supplierId: supplierIds['Grands Moulins de Paris'],
      orderNumber: 'CF-2024-001',
      orderDate: yesterday,
      expectedDeliveryDate: now,
      status: 'confirmee',
      totalAmount: 450.00,
      createdById: adminId,
      createdAt: yesterday,
      updatedAt: yesterday,
    });

    await db.insert(bakerySupplierOrderLines).values({
      id: crypto.randomUUID(),
      orderId,
      articleId: articleIds['FAR-T65'],
      quantity: 500,
      unitPrice: 0.90,
      lineAmount: 450,
      createdAt: yesterday,
    });

    // Create stock movement
    await db.insert(bakeryStockMovements).values({
      id: crypto.randomUUID(),
      organizationId: orgId,
      articleId: articleIds['FAR-T65'],
      type: 'entree',
      quantity: 500,
      reason: 'Réception commande CF-2024-001',
      documentReference: 'BL-GMP-2024-1234',
      lotNumber: 'LOT-2024-02-15',
      purchasePrice: 0.90,
      movementDate: now,
      responsibleId: adminId,
      isValidated: true,
      validatedAt: now,
      validatedById: adminId,
      createdAt: now,
    });

    // Create sample delivery order
    const deliveryOrderId = crypto.randomUUID();
    await db.insert(bakeryDeliveryOrders).values({
      id: deliveryOrderId,
      organizationId: orgId,
      clientId: clientIds['Restaurant Le Bistrot Parisien'],
      orderNumber: 'LIV-2024-001',
      orderDate: yesterday,
      expectedDeliveryDate: now,
      expectedDeliveryTime: '06:30',
      status: 'livree',
      totalAmountHT: 45.50,
      vatAmount: 4.55,
      totalAmountTTC: 50.05,
      createdById: adminId,
      createdAt: yesterday,
      updatedAt: now,
    });

    await db.insert(bakeryDeliveryOrderLines).values([
      { id: crypto.randomUUID(), orderId: deliveryOrderId, productId: productIds['PAI-BAG'], orderedQuantity: 20, deliveredQuantity: 20, unitPriceHT: 1.18, lineAmountHT: 23.60, createdAt: yesterday },
      { id: crypto.randomUUID(), orderId: deliveryOrderId, productId: productIds['VIE-CRO'], orderedQuantity: 15, deliveredQuantity: 15, unitPriceHT: 1.27, lineAmountHT: 19.05, createdAt: yesterday },
    ]);

    console.log('Creating report configs...');

    // Create report configurations
    await db.insert(bakeryReportConfigs).values([
      { id: crypto.randomUUID(), organizationId: orgId, reportName: 'Rapport quotidien production', type: 'quotidien', emailRecipients: JSON.stringify(['gerant@boulangerie.fr']), sendTime: '18:00', isActive: true, createdAt: now, updatedAt: now },
      { id: crypto.randomUUID(), organizationId: orgId, reportName: 'Bilan mensuel', type: 'mensuel', emailRecipients: JSON.stringify(['gerant@boulangerie.fr']), sendTime: '09:00', sendDay: 1, isActive: true, createdAt: now, updatedAt: now },
    ]);

    console.log('Bakery seed completed successfully!');

    return c.json({
      success: true,
      message: 'Boulangerie Au Pain Doré créée avec succès!',
      data: {
        organization: {
          id: orgId,
          name: 'Boulangerie Au Pain Doré',
        },
        accounts: [
          { role: 'Gérant', email: 'demo@perfex.io', password: 'Demo@2024!' },
          { role: 'Boulanger', email: 'boulanger@perfex.io', password: 'Baker@2024!' },
          { role: 'Vendeur', email: 'vente@perfex.io', password: 'Sales@2024!' },
          { role: 'Livreur', email: 'livraison@perfex.io', password: 'Delivery@2024!' },
        ],
        stats: {
          articles: articlesData.length,
          products: productsData.length,
          equipment: equipmentData.length,
          clients: clientsData.length,
          suppliers: suppliersData.length,
        },
      },
    });
  } catch (error: any) {
    console.error('Seed error:', error);
    return c.json({
      success: false,
      error: error.message || 'Failed to seed database',
      details: error.stack,
    }, 500);
  }
});

/**
 * GET /seed/status
 * Check seed status
 */
app.get('/status', async (c) => {
  try {
    const rawDb = c.env.DB;

    const bakeryOrgs = await rawDb.prepare(
      `SELECT COUNT(*) as count FROM organizations WHERE industry = 'Boulangerie-Pâtisserie'`
    ).first<{ count: number }>();

    const bakeryProducts = await rawDb.prepare(
      `SELECT COUNT(*) as count FROM bakery_products`
    ).first<{ count: number }>();

    const bakeryArticles = await rawDb.prepare(
      `SELECT COUNT(*) as count FROM bakery_articles`
    ).first<{ count: number }>();

    return c.json({
      success: true,
      data: {
        hasBakeryOrg: (bakeryOrgs?.count || 0) > 0,
        bakeryProducts: bakeryProducts?.count || 0,
        bakeryArticles: bakeryArticles?.count || 0,
        seeded: (bakeryProducts?.count || 0) > 0,
      },
    });
  } catch (error: any) {
    return c.json({
      success: true,
      data: {
        hasBakeryOrg: false,
        bakeryProducts: 0,
        bakeryArticles: 0,
        seeded: false,
      },
      error: error.message,
    });
  }
});

export default app;
