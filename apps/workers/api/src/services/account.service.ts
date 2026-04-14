/**
 * Account Service
 * Chart of accounts management
 */

import { drizzle } from 'drizzle-orm/d1';
import { eq, and, or, isNull, count } from 'drizzle-orm';
import { accounts, journalEntryLines, type Account } from '@perfex/database';
import type { CreateAccountInput, UpdateAccountInput, AccountWithBalance } from '@perfex/shared';

export class AccountService {
  constructor(private db: D1Database) {}

  /**
   * Create account
   */
  async create(
    organizationId: string,
    data: CreateAccountInput
  ): Promise<Account> {
    const drizzleDb = drizzle(this.db);

    // Check if code already exists
    const existing = await drizzleDb
      .select()
      .from(accounts)
      .where(
        and(
          eq(accounts.organizationId, organizationId),
          eq(accounts.code, data.code)
        )
      )
      .get();

    if (existing) {
      throw new Error('Account code already exists');
    }

    // Create account
    const accountId = crypto.randomUUID();
    const now = new Date();

    await drizzleDb.insert(accounts).values({
      id: accountId,
      organizationId,
      code: data.code,
      name: data.name,
      type: data.type,
      parentId: data.parentId || null,
      currency: data.currency || 'EUR',
      active: true,
      system: false,
      createdAt: now,
      updatedAt: now,
    });

    const account = await drizzleDb
      .select()
      .from(accounts)
      .where(eq(accounts.id, accountId))
      .get();

    if (!account) {
      throw new Error('Failed to create account');
    }

    return account as Account;
  }

  /**
   * Get accounts list
   */
  async list(
    organizationId: string,
    options?: { type?: string; active?: boolean }
  ): Promise<Account[]> {
    const drizzleDb = drizzle(this.db);

    let query = drizzleDb
      .select()
      .from(accounts)
      .where(eq(accounts.organizationId, organizationId));

    const accountsList = await query.all();

    // Filter by type if provided
    let filtered = accountsList;
    if (options?.type) {
      filtered = filtered.filter(a => a.type === options.type);
    }
    if (options?.active !== undefined) {
      filtered = filtered.filter(a => a.active === options.active);
    }

    return filtered as Account[];
  }

  /**
   * Get account by ID
   */
  async getById(accountId: string, organizationId: string): Promise<Account> {
    const drizzleDb = drizzle(this.db);

    const account = await drizzleDb
      .select()
      .from(accounts)
      .where(
        and(
          eq(accounts.id, accountId),
          eq(accounts.organizationId, organizationId)
        )
      )
      .get();

    if (!account) {
      throw new Error('Account not found');
    }

    return account as Account;
  }

  /**
   * Update account
   */
  async update(
    accountId: string,
    organizationId: string,
    data: UpdateAccountInput
  ): Promise<Account> {
    const drizzleDb = drizzle(this.db);

    // Check if account exists and is not system
    const account = await this.getById(accountId, organizationId);

    if (account.system) {
      throw new Error('Cannot update system account');
    }

    await drizzleDb
      .update(accounts)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(accounts.id, accountId));

    return this.getById(accountId, organizationId);
  }

  /**
   * Delete account
   */
  async delete(accountId: string, organizationId: string): Promise<void> {
    const drizzleDb = drizzle(this.db);

    const account = await this.getById(accountId, organizationId);

    if (account.system) {
      throw new Error('Cannot delete system account');
    }

    // Check if account is used in journal entries
    const usageCount = await drizzleDb
      .select({ count: count() })
      .from(journalEntryLines)
      .where(eq(journalEntryLines.accountId, accountId));

    if (usageCount[0]?.count > 0) {
      throw new Error('Cannot delete account that is used in journal entries');
    }

    await drizzleDb
      .delete(accounts)
      .where(eq(accounts.id, accountId));
  }

  /**
   * Get account hierarchy (parent-child)
   */
  async getHierarchy(organizationId: string): Promise<Account[]> {
    const allAccounts = await this.list(organizationId);

    // Sort by code for hierarchical display
    return allAccounts.sort((a: any, b: any) => a.code.localeCompare(b.code));
  }

  /**
   * Import chart of accounts template
   */
  async importTemplate(
    organizationId: string,
    template: 'french' | 'syscohada'
  ): Promise<number> {
    // Load template-specific accounts based on French PCG or SYSCOHADA chart of accounts
    const templateAccounts = template === 'french' ? this.getFrenchPCGAccounts() : this.getSyscohadaAccounts();

    let importCount = 0;
    for (const acc of templateAccounts) {
      try {
        await this.create(organizationId, {
          code: acc.code,
          name: acc.name,
          type: acc.type,
          currency: 'EUR',
        });
        importCount++;
      } catch {
        // Skip if account already exists
      }
    }

    return importCount;
  }

  private getFrenchPCGAccounts(): Array<{ code: string; name: string; type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense' }> {
    return [
      // Class 1 - Capitaux
      { code: '10100', name: 'Capital social', type: 'equity' },
      { code: '10600', name: 'Réserves', type: 'equity' },
      { code: '11000', name: 'Report à nouveau', type: 'equity' },
      { code: '12000', name: 'Résultat de l\'exercice', type: 'equity' },
      { code: '16400', name: 'Emprunts', type: 'liability' },
      // Class 2 - Immobilisations
      { code: '21100', name: 'Terrains', type: 'asset' },
      { code: '21300', name: 'Constructions', type: 'asset' },
      { code: '21500', name: 'Installations techniques', type: 'asset' },
      { code: '21800', name: 'Matériel de transport', type: 'asset' },
      { code: '28100', name: 'Amortissements immobilisations', type: 'asset' },
      // Class 3 - Stocks
      { code: '31000', name: 'Matières premières', type: 'asset' },
      { code: '35500', name: 'Produits finis', type: 'asset' },
      { code: '37000', name: 'Stocks de marchandises', type: 'asset' },
      // Class 4 - Tiers
      { code: '40100', name: 'Fournisseurs', type: 'liability' },
      { code: '40400', name: 'Fournisseurs - Factures non parvenues', type: 'liability' },
      { code: '41100', name: 'Clients', type: 'asset' },
      { code: '41600', name: 'Clients douteux', type: 'asset' },
      { code: '42100', name: 'Personnel - Rémunérations dues', type: 'liability' },
      { code: '43100', name: 'Sécurité sociale', type: 'liability' },
      { code: '44550', name: 'TVA à décaisser', type: 'liability' },
      { code: '44566', name: 'TVA déductible sur biens et services', type: 'asset' },
      { code: '44571', name: 'TVA collectée', type: 'liability' },
      // Class 5 - Trésorerie
      { code: '51200', name: 'Banques', type: 'asset' },
      { code: '53000', name: 'Caisse', type: 'asset' },
      // Class 6 - Charges
      { code: '60100', name: 'Achats de matières premières', type: 'expense' },
      { code: '60700', name: 'Achats de marchandises', type: 'expense' },
      { code: '61300', name: 'Locations', type: 'expense' },
      { code: '61500', name: 'Entretien et réparations', type: 'expense' },
      { code: '62600', name: 'Frais postaux et télécommunications', type: 'expense' },
      { code: '64100', name: 'Rémunérations du personnel', type: 'expense' },
      { code: '64500', name: 'Charges de sécurité sociale', type: 'expense' },
      { code: '66160', name: 'Intérêts bancaires', type: 'expense' },
      { code: '68100', name: 'Dotations aux amortissements', type: 'expense' },
      // Class 7 - Produits
      { code: '70100', name: 'Ventes de produits finis', type: 'revenue' },
      { code: '70600', name: 'Prestations de services', type: 'revenue' },
      { code: '70700', name: 'Ventes de marchandises', type: 'revenue' },
      { code: '76400', name: 'Revenus des valeurs mobilières', type: 'revenue' },
      { code: '77500', name: 'Produits des cessions d\'éléments d\'actif', type: 'revenue' },
    ];
  }

  private getSyscohadaAccounts(): Array<{ code: string; name: string; type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense' }> {
    return [
      // Class 1 - Ressources durables
      { code: '10100', name: 'Capital social', type: 'equity' },
      { code: '11100', name: 'Réserves légales', type: 'equity' },
      { code: '13000', name: 'Résultat net', type: 'equity' },
      { code: '16200', name: 'Emprunts et dettes', type: 'liability' },
      // Class 2 - Actif immobilisé
      { code: '22100', name: 'Terrains', type: 'asset' },
      { code: '23100', name: 'Bâtiments', type: 'asset' },
      { code: '24400', name: 'Matériel et outillage', type: 'asset' },
      { code: '24500', name: 'Matériel de transport', type: 'asset' },
      { code: '28000', name: 'Amortissements', type: 'asset' },
      // Class 3 - Stocks
      { code: '31100', name: 'Marchandises', type: 'asset' },
      { code: '32100', name: 'Matières premières', type: 'asset' },
      { code: '36100', name: 'Produits finis', type: 'asset' },
      // Class 4 - Tiers
      { code: '40100', name: 'Fournisseurs', type: 'liability' },
      { code: '41100', name: 'Clients', type: 'asset' },
      { code: '42200', name: 'Personnel', type: 'liability' },
      { code: '43100', name: 'Organismes sociaux', type: 'liability' },
      { code: '44100', name: 'État - Impôts sur bénéfices', type: 'liability' },
      { code: '44300', name: 'État - TVA facturée', type: 'liability' },
      { code: '44500', name: 'État - TVA récupérable', type: 'asset' },
      // Class 5 - Trésorerie
      { code: '52100', name: 'Banques locales', type: 'asset' },
      { code: '57100', name: 'Caisse', type: 'asset' },
      // Class 6 - Charges
      { code: '60100', name: 'Achats de marchandises', type: 'expense' },
      { code: '60200', name: 'Achats de matières premières', type: 'expense' },
      { code: '61300', name: 'Transports', type: 'expense' },
      { code: '62200', name: 'Locations', type: 'expense' },
      { code: '63100', name: 'Frais bancaires', type: 'expense' },
      { code: '66100', name: 'Rémunérations', type: 'expense' },
      { code: '66400', name: 'Charges sociales', type: 'expense' },
      { code: '67100', name: 'Intérêts des emprunts', type: 'expense' },
      { code: '68100', name: 'Dotations aux amortissements', type: 'expense' },
      // Class 7 - Produits
      { code: '70100', name: 'Ventes de marchandises', type: 'revenue' },
      { code: '70200', name: 'Ventes de produits fabriqués', type: 'revenue' },
      { code: '70600', name: 'Services vendus', type: 'revenue' },
      { code: '77100', name: 'Intérêts de prêts', type: 'revenue' },
      { code: '77500', name: 'Revenus de participations', type: 'revenue' },
    ];
  }
}
