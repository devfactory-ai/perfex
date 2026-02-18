/**
 * Bakery Product Service
 * Manages products and recipes
 */

import { eq, and, desc, like, or } from 'drizzle-orm';
import { drizzleDb } from '../../db';
import {
  bakeryProducts,
  bakeryProductRecipes,
  bakeryRecipeCompositions,
  bakeryArticles,
  type BakeryProduct,
  type BakeryProductRecipe,
  type BakeryRecipeComposition,
} from '@perfex/database';

interface CreateProductInput {
  reference: string;
  name: string;
  category: 'pain' | 'patisserie' | 'viennoiserie' | 'autre';
  unitPrice: number;
  costPrice?: number;
}

interface CreateRecipeInput {
  productId: string;
  name: string;
  yield: number;
  yieldUnit: string;
  compositions: Array<{
    articleId: string;
    quantityNeeded: number;
  }>;
}

interface QueryFilters {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
}

export class BakeryProductService {
  /**
   * List products with filters
   */
  async listProducts(
    organizationId: string,
    filters: QueryFilters
  ): Promise<{ items: BakeryProduct[]; total: number }> {
    const conditions: any[] = [eq(bakeryProducts.organizationId, organizationId)];

    if (filters.category) {
      conditions.push(eq(bakeryProducts.category, filters.category as any));
    }

    if (filters.search) {
      const searchTerm = `%${filters.search}%`;
      conditions.push(
        or(
          like(bakeryProducts.name, searchTerm),
          like(bakeryProducts.reference, searchTerm)
        )
      );
    }

    const items = await drizzleDb
      .select()
      .from(bakeryProducts)
      .where(and(...conditions))
      .orderBy(desc(bakeryProducts.createdAt))
      .all() as BakeryProduct[];

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
   * Create a new product
   */
  async createProduct(
    organizationId: string,
    data: CreateProductInput
  ): Promise<BakeryProduct> {
    const now = new Date();
    const id = crypto.randomUUID();

    await drizzleDb.insert(bakeryProducts).values({
      id,
      organizationId,
      reference: data.reference,
      name: data.name,
      category: data.category,
      unitPrice: data.unitPrice,
      costPrice: data.costPrice || null,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    const product = await this.getProduct(organizationId, id);
    if (!product) {
      throw new Error('Failed to create product');
    }

    return product;
  }

  /**
   * Get product by ID
   */
  async getProduct(organizationId: string, id: string): Promise<BakeryProduct | null> {
    const product = await drizzleDb
      .select()
      .from(bakeryProducts)
      .where(and(eq(bakeryProducts.id, id), eq(bakeryProducts.organizationId, organizationId)))
      .get() as BakeryProduct | undefined;

    return product || null;
  }

  /**
   * Update product
   */
  async updateProduct(
    organizationId: string,
    id: string,
    data: Partial<CreateProductInput>
  ): Promise<BakeryProduct> {
    const existing = await this.getProduct(organizationId, id);
    if (!existing) {
      throw new Error('Product not found');
    }

    await drizzleDb
      .update(bakeryProducts)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(and(eq(bakeryProducts.id, id), eq(bakeryProducts.organizationId, organizationId)));

    const updated = await this.getProduct(organizationId, id);
    if (!updated) {
      throw new Error('Failed to update product');
    }

    return updated;
  }

  /**
   * Delete product
   */
  async deleteProduct(organizationId: string, id: string): Promise<void> {
    const existing = await this.getProduct(organizationId, id);
    if (!existing) {
      throw new Error('Product not found');
    }

    await drizzleDb
      .delete(bakeryProducts)
      .where(and(eq(bakeryProducts.id, id), eq(bakeryProducts.organizationId, organizationId)));
  }

  /**
   * Create recipe for a product
   */
  async createRecipe(
    organizationId: string,
    data: CreateRecipeInput
  ): Promise<BakeryProductRecipe> {
    const now = new Date();
    const id = crypto.randomUUID();

    // Verify product exists
    const product = await this.getProduct(organizationId, data.productId);
    if (!product) {
      throw new Error('Product not found');
    }

    // Get current version
    const existingRecipes = await drizzleDb
      .select()
      .from(bakeryProductRecipes)
      .where(and(
        eq(bakeryProductRecipes.productId, data.productId),
        eq(bakeryProductRecipes.organizationId, organizationId)
      ))
      .all() as BakeryProductRecipe[];

    const version = existingRecipes.length + 1;

    // Set previous active recipe to inactive
    if (existingRecipes.length > 0) {
      await drizzleDb
        .update(bakeryProductRecipes)
        .set({ isActive: false })
        .where(and(
          eq(bakeryProductRecipes.productId, data.productId),
          eq(bakeryProductRecipes.isActive, true)
        ));
    }

    // Calculate total cost from compositions
    let totalCost = 0;
    for (const comp of data.compositions) {
      const article = await drizzleDb
        .select()
        .from(bakeryArticles)
        .where(eq(bakeryArticles.id, comp.articleId))
        .get() as any;

      if (article) {
        totalCost += (article.averagePurchasePrice || 0) * comp.quantityNeeded;
      }
    }

    // Create recipe (schema has: id, organizationId, productId, name, yield, yieldUnit, isActive, createdAt, updatedAt)
    await drizzleDb.insert(bakeryProductRecipes).values({
      id,
      organizationId,
      productId: data.productId,
      name: data.name,
      yield: data.yield,
      yieldUnit: data.yieldUnit,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    // Create compositions (schema has: id, recipeId, articleId, quantityNeeded, createdAt - NO organizationId)
    for (const comp of data.compositions) {
      await drizzleDb.insert(bakeryRecipeCompositions).values({
        id: crypto.randomUUID(),
        recipeId: id,
        articleId: comp.articleId,
        quantityNeeded: comp.quantityNeeded,
        createdAt: now,
      });
    }

    // Update product cost price
    const costPerUnit = data.yield > 0 ? totalCost / data.yield : totalCost;
    await drizzleDb
      .update(bakeryProducts)
      .set({
        costPrice: costPerUnit,
        updatedAt: now,
      })
      .where(eq(bakeryProducts.id, data.productId));

    const recipe = await drizzleDb
      .select()
      .from(bakeryProductRecipes)
      .where(eq(bakeryProductRecipes.id, id))
      .get() as BakeryProductRecipe;

    return recipe;
  }

  /**
   * List recipes
   */
  async listRecipes(
    organizationId: string,
    filters: QueryFilters
  ): Promise<{ items: any[]; total: number }> {
    const recipes = await drizzleDb
      .select()
      .from(bakeryProductRecipes)
      .where(eq(bakeryProductRecipes.organizationId, organizationId))
      .orderBy(desc(bakeryProductRecipes.createdAt))
      .all() as BakeryProductRecipe[];

    // Get compositions for each recipe
    const recipesWithCompositions = await Promise.all(
      recipes.map(async (recipe) => {
        const compositions = await drizzleDb
          .select()
          .from(bakeryRecipeCompositions)
          .where(eq(bakeryRecipeCompositions.recipeId, recipe.id))
          .all() as BakeryRecipeComposition[];

        // Get article details
        const compositionsWithArticles = await Promise.all(
          compositions.map(async (comp) => {
            const article = await drizzleDb
              .select()
              .from(bakeryArticles)
              .where(eq(bakeryArticles.id, comp.articleId))
              .get() as any;

            return {
              ...comp,
              article: article || null,
            };
          })
        );

        // Get product details
        const product = await this.getProduct(organizationId, recipe.productId);

        return {
          ...recipe,
          product,
          compositions: compositionsWithArticles,
        };
      })
    );

    const page = filters.page || 1;
    const limit = filters.limit || 50;
    const offset = (page - 1) * limit;
    const paginatedItems = recipesWithCompositions.slice(offset, offset + limit);

    return {
      items: paginatedItems,
      total: recipesWithCompositions.length,
    };
  }

  /**
   * Get recipe by ID with compositions
   */
  async getRecipeById(
    organizationId: string,
    recipeId: string
  ): Promise<any | null> {
    const recipe = await drizzleDb
      .select()
      .from(bakeryProductRecipes)
      .where(and(
        eq(bakeryProductRecipes.id, recipeId),
        eq(bakeryProductRecipes.organizationId, organizationId)
      ))
      .get() as BakeryProductRecipe | undefined;

    if (!recipe) return null;

    const compositions = await drizzleDb
      .select()
      .from(bakeryRecipeCompositions)
      .where(eq(bakeryRecipeCompositions.recipeId, recipeId))
      .all() as BakeryRecipeComposition[];

    const compositionsWithArticles = await Promise.all(
      compositions.map(async (comp) => {
        const article = await drizzleDb
          .select()
          .from(bakeryArticles)
          .where(eq(bakeryArticles.id, comp.articleId))
          .get() as any;

        return {
          ...comp,
          article: article || null,
        };
      })
    );

    const product = await this.getProduct(organizationId, recipe.productId);

    return {
      ...recipe,
      product,
      compositions: compositionsWithArticles,
    };
  }

  /**
   * Get active recipe for a product
   */
  async getActiveRecipeForProduct(
    organizationId: string,
    productId: string
  ): Promise<any | null> {
    const recipe = await drizzleDb
      .select()
      .from(bakeryProductRecipes)
      .where(and(
        eq(bakeryProductRecipes.productId, productId),
        eq(bakeryProductRecipes.organizationId, organizationId),
        eq(bakeryProductRecipes.isActive, true)
      ))
      .get() as BakeryProductRecipe | undefined;

    if (!recipe) return null;

    return this.getRecipeById(organizationId, recipe.id);
  }
}

export const bakeryProductService = new BakeryProductService();
