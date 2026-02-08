/**
 * Soft Delete Utilities
 * Implements soft delete pattern for data preservation
 */

import { sql, eq, isNull, and, or } from 'drizzle-orm';
import type { SQLiteTable, SQLiteColumn } from 'drizzle-orm/sqlite-core';

/**
 * Interface for tables that support soft delete
 */
export interface SoftDeletable {
  deletedAt: SQLiteColumn;
  deletedBy?: SQLiteColumn;
}

/**
 * Soft delete options
 */
export interface SoftDeleteOptions {
  userId?: string;
  reason?: string;
  permanent?: boolean;
}

/**
 * Base service class with soft delete support
 */
export class SoftDeleteService<T extends SQLiteTable> {
  constructor(
    protected table: T,
    protected db: any,
    protected deletedAtColumn: string = 'deleted_at',
    protected deletedByColumn: string = 'deleted_by'
  ) {}

  /**
   * Get the condition to filter out soft-deleted records
   */
  protected notDeleted() {
    return isNull((this.table as any)[this.deletedAtColumn]);
  }

  /**
   * Get the condition to include only soft-deleted records
   */
  protected onlyDeleted() {
    return sql`${(this.table as any)[this.deletedAtColumn]} IS NOT NULL`;
  }

  /**
   * Soft delete a record by setting deletedAt timestamp
   */
  async softDelete(
    id: string,
    organizationId: string,
    options: SoftDeleteOptions = {}
  ): Promise<boolean> {
    const { userId, permanent = false } = options;

    if (permanent) {
      // Permanent delete - actually remove the record
      const result = await this.db
        .delete(this.table)
        .where(
          and(
            eq((this.table as any).id, id),
            eq((this.table as any).organizationId, organizationId)
          )
        )
        .run();

      return result.meta?.changes > 0;
    }

    // Soft delete - set deletedAt and optionally deletedBy
    const updateData: any = {
      [this.deletedAtColumn]: new Date(),
    };

    if (userId && (this.table as any)[this.deletedByColumn]) {
      updateData[this.deletedByColumn] = userId;
    }

    const result = await this.db
      .update(this.table)
      .set(updateData)
      .where(
        and(
          eq((this.table as any).id, id),
          eq((this.table as any).organizationId, organizationId),
          this.notDeleted()
        )
      )
      .run();

    return result.meta?.changes > 0;
  }

  /**
   * Restore a soft-deleted record
   */
  async restore(id: string, organizationId: string): Promise<boolean> {
    const result = await this.db
      .update(this.table)
      .set({
        [this.deletedAtColumn]: null,
        [this.deletedByColumn]: null,
      })
      .where(
        and(
          eq((this.table as any).id, id),
          eq((this.table as any).organizationId, organizationId),
          this.onlyDeleted()
        )
      )
      .run();

    return result.meta?.changes > 0;
  }

  /**
   * Permanently delete all soft-deleted records older than specified days
   */
  async purgeDeleted(organizationId: string, daysOld: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await this.db
      .delete(this.table)
      .where(
        and(
          eq((this.table as any).organizationId, organizationId),
          sql`${(this.table as any)[this.deletedAtColumn]} < ${cutoffDate.toISOString()}`
        )
      )
      .run();

    return result.meta?.changes || 0;
  }

  /**
   * Get count of soft-deleted records
   */
  async countDeleted(organizationId: string): Promise<number> {
    const result = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(this.table)
      .where(
        and(
          eq((this.table as any).organizationId, organizationId),
          this.onlyDeleted()
        )
      )
      .get();

    return result?.count || 0;
  }

  /**
   * List soft-deleted records with pagination
   */
  async listDeleted(
    organizationId: string,
    limit: number = 20,
    offset: number = 0
  ) {
    return this.db
      .select()
      .from(this.table)
      .where(
        and(
          eq((this.table as any).organizationId, organizationId),
          this.onlyDeleted()
        )
      )
      .limit(limit)
      .offset(offset)
      .orderBy(sql`${(this.table as any)[this.deletedAtColumn]} DESC`)
      .all();
  }
}

/**
 * Middleware to add soft delete conditions to queries
 */
export function withSoftDelete<T>(
  baseCondition: any,
  includedDeleted: boolean = false
) {
  if (includedDeleted) {
    return baseCondition;
  }
  return and(baseCondition, sql`deleted_at IS NULL`);
}

/**
 * Helper to build soft delete timestamps
 */
export function getSoftDeleteTimestamp(deleted: boolean = true) {
  return deleted ? new Date() : null;
}

/**
 * Audit trail for soft delete operations
 */
export interface SoftDeleteAuditEntry {
  entityType: string;
  entityId: string;
  action: 'soft_delete' | 'restore' | 'permanent_delete' | 'purge';
  userId: string;
  organizationId: string;
  reason?: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

/**
 * Create audit entry for soft delete operation
 */
export function createSoftDeleteAudit(
  entityType: string,
  entityId: string,
  action: SoftDeleteAuditEntry['action'],
  userId: string,
  organizationId: string,
  reason?: string,
  metadata?: Record<string, any>
): SoftDeleteAuditEntry {
  return {
    entityType,
    entityId,
    action,
    userId,
    organizationId,
    reason,
    timestamp: new Date(),
    metadata,
  };
}
