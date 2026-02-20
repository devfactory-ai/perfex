/**
 * Bakery Module Seed Script
 * Comprehensive sample data for Perfex Bakery ERP
 */

import { drizzle } from 'drizzle-orm/d1';
import {
  organizations,
  users,
  organizationMembers,
  roles,
  userRoles,
  suppliers,
} from './schema';
import {
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
  bakerySalesSessions,
  bakeryPOSStock,
  bakeryReportConfigs,
} from './schema/bakery';

interface SeedContext {
  db: ReturnType<typeof drizzle>;
  organizationId: string;
  userId: string;
  supplierIds: Record<string, string>;
  articleIds: Record<string, string>;
  productIds: Record<string, string>;
  recipeIds: Record<string, string>;
  equipmentIds: Record<string, string>;
  clientIds: Record<string, string>;
  posIds: Record<string, string>;
}

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
 * Seed Bakery Organization and Users
 */
async function seedBakeryOrganization(db: ReturnType<typeof drizzle>) {
  console.log('Seeding bakery organization and users...');

  const orgId = crypto.randomUUID();
  const adminId = crypto.randomUUID();
  const bakerId = crypto.randomUUID();
  const salesId = crypto.randomUUID();
  const deliveryId = crypto.randomUUID();
  const now = new Date();

  // Create organization
  await db.insert(organizations).values({
    id: orgId,
    name: 'Boulangerie Au Pain Doré',
    slug: 'boulangerie-pain-dore',
    industry: 'Boulangerie-Pâtisserie',
    size: '10-50',
    country: 'France',
    timezone: 'Europe/Paris',
    currency: 'EUR',
    fiscalYearEnd: '12-31',
    logoUrl: null,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  });

  // Create admin user
  const adminHash = await hashPassword('Demo@2024!');
  await db.insert(users).values({
    id: adminId,
    email: 'demo@perfex.io',
    passwordHash: adminHash,
    firstName: 'Jean-Pierre',
    lastName: 'Dupont',
    phoneNumber: '+33 6 12 34 56 78',
    isActive: true,
    isEmailVerified: true,
    emailVerifiedAt: now,
    createdAt: now,
    updatedAt: now,
  });

  // Create baker user
  const bakerHash = await hashPassword('Baker@2024!');
  await db.insert(users).values({
    id: bakerId,
    email: 'boulanger@perfex.io',
    passwordHash: bakerHash,
    firstName: 'Marie',
    lastName: 'Martin',
    phoneNumber: '+33 6 98 76 54 32',
    isActive: true,
    isEmailVerified: true,
    emailVerifiedAt: now,
    createdAt: now,
    updatedAt: now,
  });

  // Create sales user
  const salesHash = await hashPassword('Sales@2024!');
  await db.insert(users).values({
    id: salesId,
    email: 'vente@perfex.io',
    passwordHash: salesHash,
    firstName: 'Sophie',
    lastName: 'Bernard',
    phoneNumber: '+33 6 11 22 33 44',
    isActive: true,
    isEmailVerified: true,
    emailVerifiedAt: now,
    createdAt: now,
    updatedAt: now,
  });

  // Create delivery user
  const deliveryHash = await hashPassword('Delivery@2024!');
  await db.insert(users).values({
    id: deliveryId,
    email: 'livraison@perfex.io',
    passwordHash: deliveryHash,
    firstName: 'Pierre',
    lastName: 'Lefebvre',
    phoneNumber: '+33 6 55 66 77 88',
    isActive: true,
    isEmailVerified: true,
    emailVerifiedAt: now,
    createdAt: now,
    updatedAt: now,
  });

  // Create organization memberships
  await db.insert(organizationMembers).values([
    { id: crypto.randomUUID(), organizationId: orgId, userId: adminId, role: 'owner', joinedAt: now },
    { id: crypto.randomUUID(), organizationId: orgId, userId: bakerId, role: 'member', joinedAt: now },
    { id: crypto.randomUUID(), organizationId: orgId, userId: salesId, role: 'member', joinedAt: now },
    { id: crypto.randomUUID(), organizationId: orgId, userId: deliveryId, role: 'member', joinedAt: now },
  ]);

  // Create roles
  const adminRoleId = crypto.randomUUID();
  const bakerRoleId = crypto.randomUUID();
  const salesRoleId = crypto.randomUUID();
  const deliveryRoleId = crypto.randomUUID();

  await db.insert(roles).values([
    {
      id: adminRoleId,
      organizationId: orgId,
      name: 'Gérant',
      description: 'Accès complet à tous les modules',
      permissions: JSON.stringify({
        'bakery:*': true,
        'stock:*': true,
        'production:*': true,
        'maintenance:*': true,
        'sales:*': true,
        'reports:*': true,
        'finance:*': true,
        'inventory:*': true,
        'crm:*': true,
        'hr:*': true,
        'procurement:*': true,
        'manufacturing:*': true,
        'projects:*': true,
        'admin:*': true,
      }),
      isSystem: true,
      createdBy: adminId,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: bakerRoleId,
      organizationId: orgId,
      name: 'Boulanger',
      description: 'Gestion de la production et du stock',
      permissions: JSON.stringify({
        'production:*': true,
        'stock:read': true,
        'stock:update': true,
      }),
      isSystem: false,
      createdBy: adminId,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: salesRoleId,
      organizationId: orgId,
      name: 'Vendeur',
      description: 'Gestion des ventes et caisses',
      permissions: JSON.stringify({
        'sales:*': true,
        'stock:read': true,
      }),
      isSystem: false,
      createdBy: adminId,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: deliveryRoleId,
      organizationId: orgId,
      name: 'Livreur',
      description: 'Gestion des livraisons B2B',
      permissions: JSON.stringify({
        'sales:delivery:*': true,
        'sales:read': true,
      }),
      isSystem: false,
      createdBy: adminId,
      createdAt: now,
      updatedAt: now,
    },
  ]);

  // Assign roles
  await db.insert(userRoles).values([
    { id: crypto.randomUUID(), organizationId: orgId, userId: adminId, roleId: adminRoleId, assignedAt: now },
    { id: crypto.randomUUID(), organizationId: orgId, userId: bakerId, roleId: bakerRoleId, assignedAt: now },
    { id: crypto.randomUUID(), organizationId: orgId, userId: salesId, roleId: salesRoleId, assignedAt: now },
    { id: crypto.randomUUID(), organizationId: orgId, userId: deliveryId, roleId: deliveryRoleId, assignedAt: now },
  ]);

  console.log('✓ Created bakery organization and 4 users');
  console.log('  Admin: demo@perfex.io / Demo@2024!');
  console.log('  Boulanger: boulanger@perfex.io / Baker@2024!');
  console.log('  Vendeur: vente@perfex.io / Sales@2024!');
  console.log('  Livreur: livraison@perfex.io / Delivery@2024!');

  return {
    organizationId: orgId,
    userId: adminId,
    bakerId,
    salesId,
    deliveryId,
  };
}

/**
 * Seed Suppliers
 */
async function seedSuppliers(ctx: SeedContext) {
  console.log('Seeding suppliers...');

  const now = new Date();
  const supplierIds: Record<string, string> = {};

  const suppliersData = [
    {
      id: crypto.randomUUID(),
      name: 'Grands Moulins de Paris',
      type: 'manufacturer',
      email: 'commandes@grandsmoulins.fr',
      phone: '+33 1 45 67 89 00',
      address: '45 Rue du Blé',
      city: 'Paris',
      postalCode: '75012',
      country: 'France',
      paymentTerms: 'Net 30',
    },
    {
      id: crypto.randomUUID(),
      name: 'Lesaffre Levures',
      type: 'manufacturer',
      email: 'france@lesaffre.com',
      phone: '+33 3 20 81 61 00',
      address: '137 rue Gabriel Péri',
      city: 'Marcq-en-Baroeul',
      postalCode: '59700',
      country: 'France',
      paymentTerms: 'Net 45',
    },
    {
      id: crypto.randomUUID(),
      name: 'Puratos France',
      type: 'distributor',
      email: 'info@puratos.fr',
      phone: '+33 1 39 30 21 00',
      address: 'ZI des Garennes',
      city: 'Villeneuve-la-Garenne',
      postalCode: '92390',
      country: 'France',
      paymentTerms: 'Net 30',
    },
    {
      id: crypto.randomUUID(),
      name: 'Metro Cash & Carry',
      type: 'distributor',
      email: 'pro@metro.fr',
      phone: '+33 1 41 41 41 41',
      address: 'ZAC des Chanteraines',
      city: 'Gennevilliers',
      postalCode: '92230',
      country: 'France',
      paymentTerms: 'Comptant',
    },
    {
      id: crypto.randomUUID(),
      name: 'Emballages Boulangerie Pro',
      type: 'distributor',
      email: 'contact@emb-boulangerie.fr',
      phone: '+33 4 72 22 33 44',
      address: '15 rue de l\'Industrie',
      city: 'Lyon',
      postalCode: '69007',
      country: 'France',
      paymentTerms: 'Net 30',
    },
  ];

  for (const supplier of suppliersData) {
    supplierIds[supplier.name] = supplier.id;
    await ctx.db.insert(suppliers).values({
      ...supplier,
      organizationId: ctx.organizationId,
      isActive: true,
      createdBy: ctx.userId,
      createdAt: now,
      updatedAt: now,
    });
  }

  console.log(`✓ Created ${suppliersData.length} suppliers`);
  return supplierIds;
}

/**
 * Seed Raw Materials (Articles)
 */
async function seedArticles(ctx: SeedContext) {
  console.log('Seeding raw materials...');

  const now = new Date();
  const articleIds: Record<string, string> = {};

  const articlesData = [
    // Farines
    { reference: 'FAR-T55', name: 'Farine de blé T55', category: 'farine', unit: 'kg', price: 0.85, stock: 500, min: 100, optimal: 300, supplier: 'Grands Moulins de Paris' },
    { reference: 'FAR-T65', name: 'Farine de blé T65', category: 'farine', unit: 'kg', price: 0.90, stock: 400, min: 80, optimal: 250, supplier: 'Grands Moulins de Paris' },
    { reference: 'FAR-T80', name: 'Farine de blé T80 (bise)', category: 'farine', unit: 'kg', price: 0.95, stock: 100, min: 30, optimal: 80, supplier: 'Grands Moulins de Paris' },
    { reference: 'FAR-T150', name: 'Farine complète T150', category: 'farine', unit: 'kg', price: 1.20, stock: 80, min: 20, optimal: 60, supplier: 'Grands Moulins de Paris' },
    { reference: 'FAR-SEI', name: 'Farine de seigle', category: 'farine', unit: 'kg', price: 1.10, stock: 50, min: 15, optimal: 40, supplier: 'Grands Moulins de Paris' },
    { reference: 'FAR-GRU', name: 'Gruau d\'Alsace', category: 'farine', unit: 'kg', price: 1.50, stock: 30, min: 10, optimal: 25, supplier: 'Grands Moulins de Paris' },

    // Semoules
    { reference: 'SEM-FIN', name: 'Semoule fine', category: 'semoule', unit: 'kg', price: 1.20, stock: 40, min: 10, optimal: 30, supplier: 'Grands Moulins de Paris' },
    { reference: 'SEM-GRO', name: 'Semoule grosse', category: 'semoule', unit: 'kg', price: 1.15, stock: 30, min: 8, optimal: 25, supplier: 'Grands Moulins de Paris' },

    // Levures et ferments
    { reference: 'LEV-FRA', name: 'Levure fraîche', category: 'levure', unit: 'kg', price: 2.50, stock: 20, min: 5, optimal: 15, supplier: 'Lesaffre Levures' },
    { reference: 'LEV-SEC', name: 'Levure sèche instantanée', category: 'levure', unit: 'kg', price: 8.00, stock: 10, min: 3, optimal: 8, supplier: 'Lesaffre Levures' },
    { reference: 'LEV-NAT', name: 'Levain naturel déshydraté', category: 'levure', unit: 'kg', price: 12.00, stock: 5, min: 2, optimal: 5, supplier: 'Lesaffre Levures' },

    // Additifs et améliorants
    { reference: 'ADD-AME', name: 'Améliorant panification', category: 'additifs', unit: 'kg', price: 4.50, stock: 15, min: 5, optimal: 12, supplier: 'Puratos France' },
    { reference: 'ADD-GLU', name: 'Gluten vital', category: 'additifs', unit: 'kg', price: 3.80, stock: 10, min: 3, optimal: 8, supplier: 'Puratos France' },
    { reference: 'ADD-MAL', name: 'Malt d\'orge', category: 'additifs', unit: 'kg', price: 5.20, stock: 8, min: 2, optimal: 6, supplier: 'Puratos France' },

    // Matières grasses
    { reference: 'MAT-BEU', name: 'Beurre AOP 82%', category: 'autre', unit: 'kg', price: 8.50, stock: 50, min: 15, optimal: 40, supplier: 'Metro Cash & Carry' },
    { reference: 'MAT-MAR', name: 'Margarine feuilletage', category: 'autre', unit: 'kg', price: 4.20, stock: 30, min: 10, optimal: 25, supplier: 'Metro Cash & Carry' },
    { reference: 'MAT-HUI', name: 'Huile de tournesol', category: 'autre', unit: 'L', price: 2.80, stock: 20, min: 5, optimal: 15, supplier: 'Metro Cash & Carry' },

    // Sucres
    { reference: 'SUC-BLA', name: 'Sucre blanc cristallisé', category: 'autre', unit: 'kg', price: 1.20, stock: 100, min: 25, optimal: 80, supplier: 'Metro Cash & Carry' },
    { reference: 'SUC-GLO', name: 'Sucre glace', category: 'autre', unit: 'kg', price: 1.80, stock: 30, min: 8, optimal: 25, supplier: 'Metro Cash & Carry' },
    { reference: 'SUC-ROU', name: 'Cassonade', category: 'autre', unit: 'kg', price: 2.20, stock: 20, min: 5, optimal: 15, supplier: 'Metro Cash & Carry' },

    // Oeufs et lait
    { reference: 'OEU-FRA', name: 'Oeufs frais (carton 180)', category: 'autre', unit: 'unite', price: 25.00, stock: 10, min: 3, optimal: 8, supplier: 'Metro Cash & Carry' },
    { reference: 'LAI-ENT', name: 'Lait entier UHT', category: 'autre', unit: 'L', price: 1.10, stock: 100, min: 30, optimal: 80, supplier: 'Metro Cash & Carry' },
    { reference: 'CRE-FRA', name: 'Crème fraîche 35%', category: 'autre', unit: 'L', price: 4.50, stock: 20, min: 5, optimal: 15, supplier: 'Metro Cash & Carry' },

    // Sel et épices
    { reference: 'SEL-FIN', name: 'Sel fin', category: 'autre', unit: 'kg', price: 0.50, stock: 50, min: 15, optimal: 40, supplier: 'Metro Cash & Carry' },
    { reference: 'SEL-GUE', name: 'Sel de Guérande', category: 'autre', unit: 'kg', price: 3.50, stock: 10, min: 3, optimal: 8, supplier: 'Metro Cash & Carry' },

    // Chocolat et garnitures
    { reference: 'CHO-NOI', name: 'Chocolat noir 70%', category: 'autre', unit: 'kg', price: 12.00, stock: 20, min: 5, optimal: 15, supplier: 'Puratos France' },
    { reference: 'CHO-LAI', name: 'Chocolat au lait', category: 'autre', unit: 'kg', price: 10.00, stock: 15, min: 4, optimal: 12, supplier: 'Puratos France' },
    { reference: 'PRA-AME', name: 'Pâte de pralin amandes', category: 'autre', unit: 'kg', price: 18.00, stock: 8, min: 2, optimal: 6, supplier: 'Puratos France' },
    { reference: 'AME-EFF', name: 'Amandes effilées', category: 'autre', unit: 'kg', price: 14.00, stock: 10, min: 3, optimal: 8, supplier: 'Metro Cash & Carry' },
    { reference: 'PEP-CHO', name: 'Pépites de chocolat', category: 'autre', unit: 'kg', price: 9.00, stock: 15, min: 4, optimal: 12, supplier: 'Puratos France' },

    // Fruits
    { reference: 'RAI-SEC', name: 'Raisins secs', category: 'autre', unit: 'kg', price: 6.00, stock: 15, min: 4, optimal: 12, supplier: 'Metro Cash & Carry' },
    { reference: 'POM-SEI', name: 'Pommes séchées', category: 'autre', unit: 'kg', price: 8.00, stock: 10, min: 3, optimal: 8, supplier: 'Metro Cash & Carry' },

    // Emballages
    { reference: 'EMB-SAC', name: 'Sachets papier kraft', category: 'emballages', unit: 'unite', price: 0.08, stock: 2000, min: 500, optimal: 1500, supplier: 'Emballages Boulangerie Pro' },
    { reference: 'EMB-BOI', name: 'Boîtes pâtisserie 20cm', category: 'emballages', unit: 'unite', price: 0.45, stock: 500, min: 150, optimal: 400, supplier: 'Emballages Boulangerie Pro' },
    { reference: 'EMB-CAR', name: 'Cartons livraison', category: 'emballages', unit: 'unite', price: 0.80, stock: 200, min: 50, optimal: 150, supplier: 'Emballages Boulangerie Pro' },
  ];

  for (const article of articlesData) {
    const id = crypto.randomUUID();
    articleIds[article.reference] = id;

    await ctx.db.insert(bakeryArticles).values({
      id,
      organizationId: ctx.organizationId,
      reference: article.reference,
      name: article.name,
      category: article.category,
      unitOfMeasure: article.unit,
      averagePurchasePrice: article.price,
      currentStock: article.stock,
      minimumStock: article.min,
      optimalStock: article.optimal,
      mainSupplierId: ctx.supplierIds[article.supplier],
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
  }

  console.log(`✓ Created ${articlesData.length} raw materials`);
  return articleIds;
}

/**
 * Seed Products
 */
async function seedProducts(ctx: SeedContext) {
  console.log('Seeding bakery products...');

  const now = new Date();
  const productIds: Record<string, string> = {};

  const productsData = [
    // Pains
    { reference: 'PAI-BAG', name: 'Baguette tradition', category: 'pain', price: 1.30, cost: 0.35 },
    { reference: 'PAI-BAT', name: 'Bâtard', category: 'pain', price: 1.80, cost: 0.45 },
    { reference: 'PAI-FIC', name: 'Ficelle', category: 'pain', price: 0.80, cost: 0.20 },
    { reference: 'PAI-PAV', name: 'Pavé aux céréales', category: 'pain', price: 2.50, cost: 0.70 },
    { reference: 'PAI-CAM', name: 'Pain de campagne (500g)', category: 'pain', price: 3.20, cost: 0.85 },
    { reference: 'PAI-COM', name: 'Pain complet', category: 'pain', price: 3.50, cost: 0.90 },
    { reference: 'PAI-SEI', name: 'Pain de seigle', category: 'pain', price: 3.80, cost: 0.95 },
    { reference: 'PAI-NOI', name: 'Pain aux noix', category: 'pain', price: 4.50, cost: 1.20 },
    { reference: 'PAI-OLI', name: 'Fougasse aux olives', category: 'pain', price: 3.90, cost: 1.00 },
    { reference: 'PAI-MIE', name: 'Pain de mie', category: 'pain', price: 3.80, cost: 0.80 },

    // Viennoiseries
    { reference: 'VIE-CRO', name: 'Croissant pur beurre', category: 'viennoiserie', price: 1.40, cost: 0.45 },
    { reference: 'VIE-PAC', name: 'Pain au chocolat', category: 'viennoiserie', price: 1.50, cost: 0.50 },
    { reference: 'VIE-RAI', name: 'Pain aux raisins', category: 'viennoiserie', price: 1.60, cost: 0.55 },
    { reference: 'VIE-CHA', name: 'Chausson aux pommes', category: 'viennoiserie', price: 1.80, cost: 0.60 },
    { reference: 'VIE-BRI', name: 'Brioche nature', category: 'viennoiserie', price: 2.20, cost: 0.65 },
    { reference: 'VIE-BRS', name: 'Brioche au sucre', category: 'viennoiserie', price: 2.40, cost: 0.70 },
    { reference: 'VIE-ORA', name: 'Pain au lait', category: 'viennoiserie', price: 0.90, cost: 0.25 },
    { reference: 'VIE-SUI', name: 'Pain suisse', category: 'viennoiserie', price: 1.80, cost: 0.55 },

    // Pâtisseries
    { reference: 'PAT-ECL', name: 'Éclair au chocolat', category: 'patisserie', price: 3.50, cost: 0.95 },
    { reference: 'PAT-ECC', name: 'Éclair au café', category: 'patisserie', price: 3.50, cost: 0.95 },
    { reference: 'PAT-PAF', name: 'Paris-Brest', category: 'patisserie', price: 4.50, cost: 1.20 },
    { reference: 'PAT-MIL', name: 'Millefeuille', category: 'patisserie', price: 4.50, cost: 1.15 },
    { reference: 'PAT-TAR', name: 'Tarte aux fruits', category: 'patisserie', price: 3.80, cost: 1.00 },
    { reference: 'PAT-TCH', name: 'Tarte au chocolat', category: 'patisserie', price: 4.20, cost: 1.10 },
    { reference: 'PAT-FRA', name: 'Fraisier (part)', category: 'patisserie', price: 4.80, cost: 1.30 },
    { reference: 'PAT-OPE', name: 'Opéra (part)', category: 'patisserie', price: 5.20, cost: 1.40 },
    { reference: 'PAT-MAD', name: 'Madeleine (x3)', category: 'patisserie', price: 2.80, cost: 0.70 },
    { reference: 'PAT-FIN', name: 'Financier (x3)', category: 'patisserie', price: 3.20, cost: 0.80 },
    { reference: 'PAT-MAC', name: 'Macaron (pièce)', category: 'patisserie', price: 2.20, cost: 0.60 },

    // Sandwichs et snacking
    { reference: 'SNA-JAM', name: 'Sandwich jambon-beurre', category: 'autre', price: 4.50, cost: 1.50 },
    { reference: 'SNA-POU', name: 'Sandwich poulet crudités', category: 'autre', price: 5.50, cost: 1.80 },
    { reference: 'SNA-QUI', name: 'Quiche lorraine (part)', category: 'autre', price: 3.80, cost: 1.00 },
    { reference: 'SNA-CRO', name: 'Croque-monsieur', category: 'autre', price: 4.90, cost: 1.40 },
  ];

  for (const product of productsData) {
    const id = crypto.randomUUID();
    productIds[product.reference] = id;

    await ctx.db.insert(bakeryProducts).values({
      id,
      organizationId: ctx.organizationId,
      reference: product.reference,
      name: product.name,
      category: product.category,
      unitPrice: product.price,
      costPrice: product.cost,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
  }

  console.log(`✓ Created ${productsData.length} products`);
  return productIds;
}

/**
 * Seed Recipes
 */
async function seedRecipes(ctx: SeedContext) {
  console.log('Seeding recipes...');

  const now = new Date();
  const recipeIds: Record<string, string> = {};

  // Baguette recipe
  const baguetteRecipeId = crypto.randomUUID();
  recipeIds['baguette'] = baguetteRecipeId;

  await ctx.db.insert(bakeryProductRecipes).values({
    id: baguetteRecipeId,
    organizationId: ctx.organizationId,
    productId: ctx.productIds['PAI-BAG'],
    name: 'Recette Baguette Tradition',
    yield: 20,
    yieldUnit: 'baguettes',
    isActive: true,
    createdAt: now,
    updatedAt: now,
  });

  await ctx.db.insert(bakeryRecipeCompositions).values([
    { id: crypto.randomUUID(), recipeId: baguetteRecipeId, articleId: ctx.articleIds['FAR-T65'], quantityNeeded: 5, createdAt: now },
    { id: crypto.randomUUID(), recipeId: baguetteRecipeId, articleId: ctx.articleIds['LEV-FRA'], quantityNeeded: 0.1, createdAt: now },
    { id: crypto.randomUUID(), recipeId: baguetteRecipeId, articleId: ctx.articleIds['SEL-FIN'], quantityNeeded: 0.1, createdAt: now },
  ]);

  // Croissant recipe
  const croissantRecipeId = crypto.randomUUID();
  recipeIds['croissant'] = croissantRecipeId;

  await ctx.db.insert(bakeryProductRecipes).values({
    id: croissantRecipeId,
    organizationId: ctx.organizationId,
    productId: ctx.productIds['VIE-CRO'],
    name: 'Recette Croissant Pur Beurre',
    yield: 24,
    yieldUnit: 'croissants',
    isActive: true,
    createdAt: now,
    updatedAt: now,
  });

  await ctx.db.insert(bakeryRecipeCompositions).values([
    { id: crypto.randomUUID(), recipeId: croissantRecipeId, articleId: ctx.articleIds['FAR-GRU'], quantityNeeded: 2.5, createdAt: now },
    { id: crypto.randomUUID(), recipeId: croissantRecipeId, articleId: ctx.articleIds['MAT-BEU'], quantityNeeded: 1.25, createdAt: now },
    { id: crypto.randomUUID(), recipeId: croissantRecipeId, articleId: ctx.articleIds['LEV-FRA'], quantityNeeded: 0.05, createdAt: now },
    { id: crypto.randomUUID(), recipeId: croissantRecipeId, articleId: ctx.articleIds['SUC-BLA'], quantityNeeded: 0.25, createdAt: now },
    { id: crypto.randomUUID(), recipeId: croissantRecipeId, articleId: ctx.articleIds['SEL-FIN'], quantityNeeded: 0.05, createdAt: now },
    { id: crypto.randomUUID(), recipeId: croissantRecipeId, articleId: ctx.articleIds['LAI-ENT'], quantityNeeded: 0.5, createdAt: now },
  ]);

  // Pain au chocolat recipe
  const pacRecipeId = crypto.randomUUID();
  recipeIds['pain_chocolat'] = pacRecipeId;

  await ctx.db.insert(bakeryProductRecipes).values({
    id: pacRecipeId,
    organizationId: ctx.organizationId,
    productId: ctx.productIds['VIE-PAC'],
    name: 'Recette Pain au Chocolat',
    yield: 20,
    yieldUnit: 'pains au chocolat',
    isActive: true,
    createdAt: now,
    updatedAt: now,
  });

  await ctx.db.insert(bakeryRecipeCompositions).values([
    { id: crypto.randomUUID(), recipeId: pacRecipeId, articleId: ctx.articleIds['FAR-GRU'], quantityNeeded: 2, createdAt: now },
    { id: crypto.randomUUID(), recipeId: pacRecipeId, articleId: ctx.articleIds['MAT-BEU'], quantityNeeded: 1, createdAt: now },
    { id: crypto.randomUUID(), recipeId: pacRecipeId, articleId: ctx.articleIds['CHO-NOI'], quantityNeeded: 0.4, createdAt: now },
    { id: crypto.randomUUID(), recipeId: pacRecipeId, articleId: ctx.articleIds['LEV-FRA'], quantityNeeded: 0.04, createdAt: now },
    { id: crypto.randomUUID(), recipeId: pacRecipeId, articleId: ctx.articleIds['SUC-BLA'], quantityNeeded: 0.2, createdAt: now },
  ]);

  console.log('✓ Created 3 recipes with compositions');
  return recipeIds;
}

/**
 * Seed Production Equipment
 */
async function seedEquipment(ctx: SeedContext) {
  console.log('Seeding production equipment...');

  const now = new Date();
  const equipmentIds: Record<string, string> = {};

  // Proofing Chambers
  const chambers = [
    { name: 'Chambre de pousse 1 - Pains', capacity: 8, temp: 28, humidity: 85 },
    { name: 'Chambre de pousse 2 - Viennoiseries', capacity: 6, temp: 26, humidity: 80 },
  ];

  for (const chamber of chambers) {
    await ctx.db.insert(bakeryProofingChambers).values({
      id: crypto.randomUUID(),
      organizationId: ctx.organizationId,
      name: chamber.name,
      cartCapacity: chamber.capacity,
      idealTemperature: chamber.temp,
      idealHumidity: chamber.humidity,
      isActive: true,
      createdAt: now,
    });
  }

  // Ovens
  const ovens = [
    { name: 'Four rotatif Bongard', type: 'rotatif', capacity: 2, maxTemp: 280 },
    { name: 'Four à sole Pavailler', type: 'sole', capacity: 4, maxTemp: 300 },
    { name: 'Four ventilé Pâtisserie', type: 'autre', capacity: 3, maxTemp: 250 },
  ];

  for (const oven of ovens) {
    await ctx.db.insert(bakeryOvens).values({
      id: crypto.randomUUID(),
      organizationId: ctx.organizationId,
      name: oven.name,
      type: oven.type,
      cartCapacity: oven.capacity,
      maxTemperature: oven.maxTemp,
      isActive: true,
      createdAt: now,
    });
  }

  // Equipment for maintenance
  const equipmentData = [
    { name: 'Four rotatif Bongard', type: 'four', brand: 'Bongard', model: 'Cervap MR 2000', serial: 'BG-2019-4521', value: 45000, warranty: 24 },
    { name: 'Four à sole Pavailler', type: 'four', brand: 'Pavailler', model: 'Topaze 600', serial: 'PV-2020-1234', value: 35000, warranty: 24 },
    { name: 'Pétrin spirale VMI', type: 'petrin', brand: 'VMI', model: 'SPI 200', serial: 'VMI-2018-8765', value: 12000, warranty: 12 },
    { name: 'Pétrin à bras plongeants', type: 'petrin', brand: 'Bertrand-Puma', model: 'BP 80', serial: 'BP-2017-5432', value: 8500, warranty: 12 },
    { name: 'Laminoir Rondo', type: 'laminoir', brand: 'Rondo', model: 'Doge 600', serial: 'RD-2021-9876', value: 25000, warranty: 24 },
    { name: 'Façonneuse Bongard', type: 'faconneur', brand: 'Bongard', model: 'Eole', serial: 'BG-2020-3456', value: 15000, warranty: 18 },
    { name: 'Diviseur volumétrique', type: 'diviseur', brand: 'Diosna', model: 'DV 40', serial: 'DI-2019-6543', value: 18000, warranty: 18 },
    { name: 'Chambre froide positive', type: 'congelateur', brand: 'Coldline', model: 'CF 2000', serial: 'CL-2020-7654', value: 8000, warranty: 24 },
    { name: 'Chambre froide négative', type: 'congelateur', brand: 'Coldline', model: 'CN 1500', serial: 'CL-2020-7655', value: 12000, warranty: 24 },
  ];

  for (const eq of equipmentData) {
    const id = crypto.randomUUID();
    equipmentIds[eq.name] = id;

    const purchaseDate = new Date('2020-01-15');
    const warrantyEnd = new Date(purchaseDate);
    warrantyEnd.setMonth(warrantyEnd.getMonth() + eq.warranty);

    await ctx.db.insert(bakeryEquipment).values({
      id,
      organizationId: ctx.organizationId,
      name: eq.name,
      type: eq.type,
      brand: eq.brand,
      model: eq.model,
      serialNumber: eq.serial,
      purchaseDate,
      commissioningDate: purchaseDate,
      purchaseValue: eq.value,
      warrantyMonths: eq.warranty,
      warrantyEndDate: warrantyEnd,
      location: 'Atelier principal',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
  }

  console.log(`✓ Created ${chambers.length} proofing chambers, ${ovens.length} ovens, ${equipmentData.length} equipment`);
  return equipmentIds;
}

/**
 * Seed Maintenance Plans
 */
async function seedMaintenancePlans(ctx: SeedContext) {
  console.log('Seeding maintenance plans...');

  const now = new Date();
  const nextMonth = new Date();
  nextMonth.setMonth(nextMonth.getMonth() + 1);

  const plans = [
    {
      equipmentName: 'Four rotatif Bongard',
      periodicity: 'mois',
      interval: 1,
      checklist: ['Nettoyage brûleurs', 'Vérification joints', 'Contrôle température', 'Lubrification charnières'],
      duration: 60,
    },
    {
      equipmentName: 'Pétrin spirale VMI',
      periodicity: 'semaines',
      interval: 2,
      checklist: ['Nettoyage cuve', 'Vérification courroies', 'Graissage roulements', 'Contrôle sécurités'],
      duration: 45,
    },
    {
      equipmentName: 'Laminoir Rondo',
      periodicity: 'semaines',
      interval: 1,
      checklist: ['Nettoyage cylindres', 'Vérification tension toile', 'Lubrification'],
      duration: 30,
    },
    {
      equipmentName: 'Chambre froide positive',
      periodicity: 'mois',
      interval: 3,
      checklist: ['Contrôle température', 'Nettoyage condenseur', 'Vérification joints portes', 'Contrôle dégivrage'],
      duration: 45,
    },
  ];

  for (const plan of plans) {
    const equipmentId = ctx.equipmentIds[plan.equipmentName];
    if (!equipmentId) continue;

    await ctx.db.insert(bakeryMaintenancePlans).values({
      id: crypto.randomUUID(),
      organizationId: ctx.organizationId,
      equipmentId,
      periodicityType: plan.periodicity,
      interval: plan.interval,
      nextScheduledDate: nextMonth,
      checklist: JSON.stringify(plan.checklist),
      estimatedDurationMinutes: plan.duration,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
  }

  console.log(`✓ Created ${plans.length} maintenance plans`);
}

/**
 * Seed Spare Parts
 */
async function seedSpareParts(ctx: SeedContext) {
  console.log('Seeding spare parts...');

  const now = new Date();

  const parts = [
    { ref: 'SP-BRU-001', name: 'Brûleur four rotatif', stock: 2, min: 1, price: 450, lead: 14 },
    { ref: 'SP-JOI-001', name: 'Joint de porte four', stock: 5, min: 2, price: 85, lead: 7 },
    { ref: 'SP-COU-001', name: 'Courroie pétrin VMI', stock: 3, min: 1, price: 120, lead: 10 },
    { ref: 'SP-TOI-001', name: 'Toile laminoir', stock: 2, min: 1, price: 380, lead: 14 },
    { ref: 'SP-THE-001', name: 'Thermostat chambre froide', stock: 2, min: 1, price: 95, lead: 5 },
    { ref: 'SP-MOT-001', name: 'Moteur ventilateur four', stock: 1, min: 1, price: 680, lead: 21 },
    { ref: 'SP-ROU-001', name: 'Roulement pétrin', stock: 4, min: 2, price: 45, lead: 5 },
    { ref: 'SP-CYL-001', name: 'Cylindre laminoir', stock: 1, min: 1, price: 1200, lead: 30 },
  ];

  for (const part of parts) {
    await ctx.db.insert(bakerySpareParts).values({
      id: crypto.randomUUID(),
      organizationId: ctx.organizationId,
      reference: part.ref,
      designation: part.name,
      currentStock: part.stock,
      minimumStock: part.min,
      unitPrice: part.price,
      deliveryLeadDays: part.lead,
      createdAt: now,
      updatedAt: now,
    });
  }

  console.log(`✓ Created ${parts.length} spare parts`);
}

/**
 * Seed B2B Clients
 */
async function seedB2BClients(ctx: SeedContext) {
  console.log('Seeding B2B clients...');

  const now = new Date();
  const clientIds: Record<string, string> = {};

  const clients = [
    { name: 'Restaurant Le Bistrot Parisien', type: 'restaurant', contact: 'Michel Roux', phone: '+33 1 42 33 44 55', email: 'contact@bistrotparisien.fr', address: '15 Rue de la Gaité, 75014 Paris', terms: 'Net 15' },
    { name: 'Hôtel Grand Luxe', type: 'hotel', contact: 'Isabelle Mercier', phone: '+33 1 45 67 89 01', email: 'restauration@grandluxe.com', address: '8 Place Vendôme, 75001 Paris', terms: 'Net 30' },
    { name: 'Cantine Scolaire Jean Jaurès', type: 'collectivite', contact: 'Marie Dubois', phone: '+33 1 48 22 33 44', email: 'cantine@ecolejj.fr', address: '25 Rue Jean Jaurès, 75019 Paris', terms: 'Net 45' },
    { name: 'Café des Arts', type: 'restaurant', contact: 'Pierre Lefebvre', phone: '+33 1 43 55 66 77', email: 'commandes@cafedesarts.fr', address: '42 Boulevard Saint-Germain, 75005 Paris', terms: 'Net 15' },
    { name: 'Traiteur Excellence', type: 'grossiste', contact: 'Jean-Marc Duval', phone: '+33 1 41 22 33 44', email: 'achats@traiteur-excellence.fr', address: 'ZI La Défense, 92000 Nanterre', terms: 'Net 30' },
    { name: 'Épicerie Fine du Marais', type: 'autre', contact: 'Sophie Martin', phone: '+33 1 42 78 89 00', email: 'contact@epiceriemarais.fr', address: '18 Rue des Rosiers, 75004 Paris', terms: 'Comptant' },
  ];

  for (const client of clients) {
    const id = crypto.randomUUID();
    clientIds[client.name] = id;

    await ctx.db.insert(bakeryB2BClients).values({
      id,
      organizationId: ctx.organizationId,
      commercialName: client.name,
      type: client.type,
      mainContact: client.contact,
      phone: client.phone,
      email: client.email,
      deliveryAddress: client.address,
      paymentTerms: client.terms,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
  }

  console.log(`✓ Created ${clients.length} B2B clients`);
  return clientIds;
}

/**
 * Seed Points of Sale
 */
async function seedPointsOfSale(ctx: SeedContext) {
  console.log('Seeding points of sale...');

  const now = new Date();
  const posIds: Record<string, string> = {};

  const points = [
    { name: 'Boutique principale', location: '45 Rue du Commerce, 75015 Paris' },
    { name: 'Kiosque marché Aligre', location: 'Marché d\'Aligre, 75012 Paris' },
  ];

  for (const pos of points) {
    const id = crypto.randomUUID();
    posIds[pos.name] = id;

    await ctx.db.insert(bakeryPointsOfSale).values({
      id,
      organizationId: ctx.organizationId,
      name: pos.name,
      location: pos.location,
      isActive: true,
      createdAt: now,
    });
  }

  console.log(`✓ Created ${points.length} points of sale`);
  return posIds;
}

/**
 * Seed Sample Transactions
 */
async function seedSampleTransactions(ctx: SeedContext) {
  console.log('Seeding sample transactions...');

  const now = new Date();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  // Sample supplier order
  const orderId = crypto.randomUUID();
  await ctx.db.insert(bakerySupplierOrders).values({
    id: orderId,
    organizationId: ctx.organizationId,
    supplierId: ctx.supplierIds['Grands Moulins de Paris'],
    orderNumber: 'CF-2024-001',
    orderDate: yesterday,
    expectedDeliveryDate: now,
    status: 'confirmee',
    totalAmount: 850.50,
    createdById: ctx.userId,
    createdAt: yesterday,
    updatedAt: yesterday,
  });

  await ctx.db.insert(bakerySupplierOrderLines).values([
    { id: crypto.randomUUID(), orderId, articleId: ctx.articleIds['FAR-T65'], quantity: 500, unitPrice: 0.90, lineAmount: 450, createdAt: yesterday },
    { id: crypto.randomUUID(), orderId, articleId: ctx.articleIds['FAR-T55'], quantity: 400, unitPrice: 0.85, lineAmount: 340, createdAt: yesterday },
    { id: crypto.randomUUID(), orderId, articleId: ctx.articleIds['FAR-T80'], quantity: 50, unitPrice: 1.21, lineAmount: 60.50, createdAt: yesterday },
  ]);

  // Sample stock movements
  await ctx.db.insert(bakeryStockMovements).values([
    {
      id: crypto.randomUUID(),
      organizationId: ctx.organizationId,
      articleId: ctx.articleIds['FAR-T65'],
      type: 'entree',
      quantity: 500,
      reason: 'Réception commande CF-2024-001',
      documentReference: 'BL-GMP-2024-1234',
      lotNumber: 'LOT-2024-02-15',
      purchasePrice: 0.90,
      movementDate: now,
      responsibleId: ctx.userId,
      isValidated: true,
      validatedAt: now,
      validatedById: ctx.userId,
      createdAt: now,
    },
    {
      id: crypto.randomUUID(),
      organizationId: ctx.organizationId,
      articleId: ctx.articleIds['FAR-T65'],
      type: 'sortie',
      quantity: -50,
      reason: 'Production baguettes',
      movementDate: now,
      responsibleId: ctx.userId,
      isValidated: true,
      validatedAt: now,
      validatedById: ctx.userId,
      createdAt: now,
    },
  ]);

  // Sample delivery order
  const deliveryId = crypto.randomUUID();
  await ctx.db.insert(bakeryDeliveryOrders).values({
    id: deliveryId,
    organizationId: ctx.organizationId,
    clientId: ctx.clientIds['Restaurant Le Bistrot Parisien'],
    orderNumber: 'LIV-2024-001',
    orderDate: yesterday,
    expectedDeliveryDate: now,
    expectedDeliveryTime: '06:30',
    status: 'livree',
    totalAmountHT: 58.50,
    vatAmount: 5.85,
    totalAmountTTC: 64.35,
    createdById: ctx.userId,
    createdAt: yesterday,
    updatedAt: now,
  });

  await ctx.db.insert(bakeryDeliveryOrderLines).values([
    { id: crypto.randomUUID(), orderId: deliveryId, productId: ctx.productIds['PAI-BAG'], orderedQuantity: 20, deliveredQuantity: 20, unitPriceHT: 1.18, lineAmountHT: 23.60, createdAt: yesterday },
    { id: crypto.randomUUID(), orderId: deliveryId, productId: ctx.productIds['VIE-CRO'], orderedQuantity: 15, deliveredQuantity: 15, unitPriceHT: 1.27, lineAmountHT: 19.05, createdAt: yesterday },
    { id: crypto.randomUUID(), orderId: deliveryId, productId: ctx.productIds['VIE-PAC'], orderedQuantity: 12, deliveredQuantity: 12, unitPriceHT: 1.32, lineAmountHT: 15.84, createdAt: yesterday },
  ]);

  console.log('✓ Created sample transactions (orders, movements, deliveries)');
}

/**
 * Seed Report Configurations
 */
async function seedReportConfigs(ctx: SeedContext) {
  console.log('Seeding report configurations...');

  const now = new Date();

  const configs = [
    { name: 'Rapport quotidien de production', type: 'quotidien', time: '18:00', emails: ['gerant@boulangerie.fr'] },
    { name: 'Rapport hebdomadaire des ventes', type: 'hebdomadaire', time: '08:00', day: 1, emails: ['gerant@boulangerie.fr', 'comptable@boulangerie.fr'] },
    { name: 'Bilan mensuel complet', type: 'mensuel', time: '09:00', day: 1, emails: ['gerant@boulangerie.fr', 'direction@boulangerie.fr'] },
  ];

  for (const config of configs) {
    await ctx.db.insert(bakeryReportConfigs).values({
      id: crypto.randomUUID(),
      organizationId: ctx.organizationId,
      reportName: config.name,
      type: config.type,
      emailRecipients: JSON.stringify(config.emails),
      sendTime: config.time,
      sendDay: config.day,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
  }

  console.log(`✓ Created ${configs.length} report configurations`);
}

/**
 * Main bakery seed function
 */
export async function seedBakery(db: ReturnType<typeof drizzle>) {
  console.log('🥖 Starting Perfex Bakery seed...\n');

  try {
    // Step 1: Create organization and users
    const { organizationId, userId, bakerId, salesId, deliveryId } = await seedBakeryOrganization(db);

    // Initialize context
    const ctx: SeedContext = {
      db,
      organizationId,
      userId,
      supplierIds: {},
      articleIds: {},
      productIds: {},
      recipeIds: {},
      equipmentIds: {},
      clientIds: {},
      posIds: {},
    };

    // Step 2: Seed suppliers
    ctx.supplierIds = await seedSuppliers(ctx);

    // Step 3: Seed raw materials
    ctx.articleIds = await seedArticles(ctx);

    // Step 4: Seed products
    ctx.productIds = await seedProducts(ctx);

    // Step 5: Seed recipes
    ctx.recipeIds = await seedRecipes(ctx);

    // Step 6: Seed equipment
    ctx.equipmentIds = await seedEquipment(ctx);

    // Step 7: Seed maintenance plans
    await seedMaintenancePlans(ctx);

    // Step 8: Seed spare parts
    await seedSpareParts(ctx);

    // Step 9: Seed B2B clients
    ctx.clientIds = await seedB2BClients(ctx);

    // Step 10: Seed points of sale
    ctx.posIds = await seedPointsOfSale(ctx);

    // Step 11: Seed sample transactions
    await seedSampleTransactions(ctx);

    // Step 12: Seed report configs
    await seedReportConfigs(ctx);

    console.log('\n✅ Perfex Bakery seeded successfully!');
    console.log('\n📝 Demo Login Credentials:');
    console.log('   ┌──────────────────────────────────────────────────┐');
    console.log('   │ Gérant (Admin)                                   │');
    console.log('   │   Email: demo@perfex.io                          │');
    console.log('   │   Password: Demo@2024!                           │');
    console.log('   ├──────────────────────────────────────────────────┤');
    console.log('   │ Boulanger                                        │');
    console.log('   │   Email: boulanger@perfex.io                     │');
    console.log('   │   Password: Baker@2024!                          │');
    console.log('   ├──────────────────────────────────────────────────┤');
    console.log('   │ Vendeur                                          │');
    console.log('   │   Email: vente@perfex.io                         │');
    console.log('   │   Password: Sales@2024!                          │');
    console.log('   ├──────────────────────────────────────────────────┤');
    console.log('   │ Livreur                                          │');
    console.log('   │   Email: livraison@perfex.io                     │');
    console.log('   │   Password: Delivery@2024!                       │');
    console.log('   └──────────────────────────────────────────────────┘');
    console.log('\n🥐 Boulangerie Au Pain Doré est prête!');

    return {
      organizationId,
      userId,
      bakerId,
      salesId,
      deliveryId,
    };
  } catch (error) {
    console.error('❌ Bakery seed failed:', error);
    throw error;
  }
}

export default seedBakery;
