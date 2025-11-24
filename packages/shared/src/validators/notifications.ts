/**
 * Notifications validators (Zod schemas)
 */

import { z } from 'zod';

// Notification validators
export const createNotificationSchema = z.object({
  userId: z.string().uuid(),
  type: z.enum(['info', 'success', 'warning', 'error', 'mention', 'task', 'approval']),
  title: z.string().min(1).max(200),
  message: z.string().max(1000).optional().nullable(),
  link: z.string().max(500).optional().nullable(),
  relatedId: z.string().uuid().optional().nullable(),
  relatedType: z.string().max(100).optional().nullable(),
});

export type CreateNotificationInput = z.infer<typeof createNotificationSchema>;

export const markNotificationReadSchema = z.object({
  notificationIds: z.array(z.string().uuid()).min(1),
});

export type MarkNotificationReadInput = z.infer<typeof markNotificationReadSchema>;

// System Settings validators
export const updateSystemSettingSchema = z.object({
  value: z.string().max(5000),
});

export type UpdateSystemSettingInput = z.infer<typeof updateSystemSettingSchema>;

export const createSystemSettingSchema = z.object({
  category: z.string().min(1).max(100),
  key: z.string().min(1).max(100),
  value: z.string().max(5000),
  description: z.string().max(500).optional().nullable(),
});

export type CreateSystemSettingInput = z.infer<typeof createSystemSettingSchema>;
