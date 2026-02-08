/**
 * Scheduled Tasks Service
 * Handles all cron-triggered background jobs
 */

import { drizzle } from 'drizzle-orm/d1';
import { eq, lt, and, isNull, sql } from 'drizzle-orm';
import {
  auditSchedules,
  auditTasks,
  riskAssessments,
  sessions,
  organizations,
} from '@perfex/database';
import type { Env } from '../types';
import { logger } from '../utils/logger';

export class ScheduledService {
  private db: ReturnType<typeof drizzle>;
  private env: Env;

  constructor(env: Env) {
    this.db = drizzle(env.DB);
    this.env = env;
  }

  /**
   * Main scheduler - routes to appropriate handler based on cron schedule
   */
  async handleScheduledEvent(event: ScheduledEvent): Promise<void> {
    const cronTime = event.cron;
    logger.info(`[Scheduler] Running scheduled task: ${cronTime}`);

    try {
      switch (cronTime) {
        // Every hour - Session cleanup
        case '0 * * * *':
          await this.cleanupExpiredSessions();
          break;

        // Every day at 6 AM UTC - Daily risk assessment
        case '0 6 * * *':
          await this.runDailyRiskAssessments();
          break;

        // Every day at midnight UTC - Overdue task check
        case '0 0 * * *':
          await this.checkOverdueTasks();
          break;

        // Every Monday at 7 AM UTC - Weekly reports
        case '0 7 * * 1':
          await this.generateWeeklyReports();
          break;

        // Every day at 1 AM UTC - Process scheduled audits
        case '0 1 * * *':
          await this.processScheduledAudits();
          break;

        default:
          logger.info(`[Scheduler] Unknown cron pattern: ${cronTime}`);
      }
    } catch (error) {
      logger.error(`[Scheduler] Error in scheduled task ${cronTime}`, { error });
    }
  }

  /**
   * Clean up expired sessions
   */
  async cleanupExpiredSessions(): Promise<void> {
    logger.info('[Scheduler] Cleaning up expired sessions...');

    const now = new Date();

    const result = await this.db
      .delete(sessions)
      .where(lt(sessions.expiresAt, now));

    logger.info(`[Scheduler] Session cleanup completed`);
  }

  /**
   * Run daily automated risk assessments for active organizations
   */
  async runDailyRiskAssessments(): Promise<void> {
    logger.info('[Scheduler] Running daily risk assessments...');

    // Get all organizations
    const activeOrgs = await this.db
      .select({ id: organizations.id })
      .from(organizations);

    for (const org of activeOrgs) {
      try {
        // Check if organization has daily risk assessment schedule
        const schedules = await this.db
          .select()
          .from(auditSchedules)
          .where(
            and(
              eq(auditSchedules.organizationId, org.id),
              eq(auditSchedules.scheduleType, 'risk_assessment'),
              eq(auditSchedules.frequency, 'daily'),
              eq(auditSchedules.isActive, true)
            )
          );

        if (schedules.length > 0) {
          logger.info(`[Scheduler] Running risk assessment for org: ${org.id}`);
          // Risk assessment would be triggered here
          // In production, this would call the AI service
        }
      } catch (error) {
        logger.error(`[Scheduler] Error for org ${org.id}`, { error });
      }
    }

    logger.info('[Scheduler] Daily risk assessments completed');
  }

  /**
   * Check for overdue audit tasks and update their status
   */
  async checkOverdueTasks(): Promise<void> {
    logger.info('[Scheduler] Checking overdue tasks...');

    const now = new Date();

    // Find tasks that are past due date and not completed
    const overdueTasks = await this.db
      .select()
      .from(auditTasks)
      .where(
        and(
          lt(auditTasks.dueDate, now),
          sql`${auditTasks.status} NOT IN ('completed', 'cancelled')`
        )
      );

    for (const task of overdueTasks) {
      // Update task priority to high if it's overdue
      if (task.priority !== 'critical' && task.priority !== 'high') {
        await this.db
          .update(auditTasks)
          .set({
            priority: 'high',
            updatedAt: now,
          })
          .where(eq(auditTasks.id, task.id));
      }

      // TODO: Send notification to assigned user
      logger.info(`[Scheduler] Task ${task.taskNumber} is overdue`);
    }

    logger.info(`[Scheduler] Found ${overdueTasks.length} overdue tasks`);
  }

  /**
   * Generate weekly summary reports
   */
  async generateWeeklyReports(): Promise<void> {
    logger.info('[Scheduler] Generating weekly reports...');

    const activeOrgs = await this.db
      .select({ id: organizations.id })
      .from(organizations);

    for (const org of activeOrgs) {
      try {
        // Get last week's statistics
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

        // Count tasks created this week
        const tasksThisWeek = await this.db
          .select({ count: sql<number>`count(*)` })
          .from(auditTasks)
          .where(
            and(
              eq(auditTasks.organizationId, org.id),
              sql`${auditTasks.createdAt} >= ${oneWeekAgo.getTime()}`
            )
          );

        // Count completed tasks this week
        const completedThisWeek = await this.db
          .select({ count: sql<number>`count(*)` })
          .from(auditTasks)
          .where(
            and(
              eq(auditTasks.organizationId, org.id),
              eq(auditTasks.status, 'completed'),
              sql`${auditTasks.completedAt} >= ${oneWeekAgo.getTime()}`
            )
          );

        // Count risk assessments this week
        const assessmentsThisWeek = await this.db
          .select({ count: sql<number>`count(*)` })
          .from(riskAssessments)
          .where(
            and(
              eq(riskAssessments.organizationId, org.id),
              sql`${riskAssessments.assessmentDate} >= ${oneWeekAgo.getTime()}`
            )
          );

        logger.info(`[Scheduler] Org ${org.id} weekly stats:`, {
          tasks: tasksThisWeek[0]?.count || 0,
          completed: completedThisWeek[0]?.count || 0,
          assessments: assessmentsThisWeek[0]?.count || 0,
        });

        // TODO: Store report or send email notification
      } catch (error) {
        logger.error(`[Scheduler] Error generating report for org ${org.id}`, { error });
      }
    }

    logger.info('[Scheduler] Weekly reports completed');
  }

  /**
   * Process scheduled audits
   */
  async processScheduledAudits(): Promise<void> {
    logger.info('[Scheduler] Processing scheduled audits...');

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Get active schedules that should run today
    const schedules = await this.db
      .select()
      .from(auditSchedules)
      .where(eq(auditSchedules.isActive, true));

    for (const schedule of schedules) {
      try {
        // Check if schedule should run based on frequency
        const shouldRun = this.shouldScheduleRun(schedule, today);

        if (shouldRun) {
          logger.info(`[Scheduler] Executing schedule: ${schedule.id} (${schedule.scheduleType})`);

          // Update last run time
          await this.db
            .update(auditSchedules)
            .set({
              lastRunAt: now,
              updatedAt: now,
            })
            .where(eq(auditSchedules.id, schedule.id));

          // Execute the scheduled task based on type
          switch (schedule.scheduleType) {
            case 'risk_assessment':
              // Trigger risk assessment
              logger.info(`[Scheduler] Triggering risk assessment for ${schedule.organizationId}`);
              break;
            case 'compliance_check':
              // Trigger compliance check
              logger.info(`[Scheduler] Triggering compliance check for ${schedule.organizationId}`);
              break;
            case 'commonality_study':
              // Trigger commonality study
              logger.info(`[Scheduler] Triggering commonality study for ${schedule.organizationId}`);
              break;
            case 'report':
              // Generate report
              logger.info(`[Scheduler] Generating report for ${schedule.organizationId}`);
              break;
          }
        }
      } catch (error) {
        logger.error(`[Scheduler] Error processing schedule ${schedule.id}`, { error });
      }
    }

    logger.info('[Scheduler] Scheduled audits processing completed');
  }

  /**
   * Determine if a schedule should run based on frequency
   */
  private shouldScheduleRun(
    schedule: typeof auditSchedules.$inferSelect,
    today: Date
  ): boolean {
    const lastRun = schedule.lastRunAt ? new Date(schedule.lastRunAt) : null;
    const dayOfWeek = today.getDay();
    const dayOfMonth = today.getDate();

    switch (schedule.frequency) {
      case 'daily':
        // Run if never run or last run was before today
        return !lastRun || lastRun < today;

      case 'weekly':
        // Run on Monday (1) by default, or check if a week has passed
        if (!lastRun) return dayOfWeek === 1;
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        return lastRun < weekAgo && dayOfWeek === 1;

      case 'monthly':
        // Run on the 1st of the month
        if (!lastRun) return dayOfMonth === 1;
        const monthAgo = new Date(today);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        return lastRun < monthAgo && dayOfMonth === 1;

      case 'quarterly':
        // Run on the 1st of Jan, Apr, Jul, Oct
        const quarterMonths = [0, 3, 6, 9];
        if (!quarterMonths.includes(today.getMonth())) return false;
        if (dayOfMonth !== 1) return false;
        if (!lastRun) return true;
        const threeMonthsAgo = new Date(today);
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
        return lastRun < threeMonthsAgo;

      default:
        return false;
    }
  }
}
