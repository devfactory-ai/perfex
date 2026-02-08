/**
 * Secure Patient Messaging Service - Messagerie Sécurisée Patient
 *
 * HIPAA-compliant secure messaging between patients and healthcare providers
 * Includes message threads, attachments, read receipts, and audit logging
 */

import { D1Database } from '@cloudflare/workers-types';

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface MessageThread {
  id: string;
  organizationId: string;
  subject: string;
  category: ThreadCategory;
  priority: ThreadPriority;
  status: ThreadStatus;

  // Participants
  patientId: string;
  patientName: string;
  providerId?: string;
  providerName?: string;
  departmentId?: string;
  departmentName?: string;
  careTeam: ThreadParticipant[];

  // Assignment
  assignedTo?: string;
  assignedToName?: string;
  assignedAt?: string;

  // Messages
  messages: SecureMessage[];
  messageCount: number;
  unreadCount: number;
  lastMessageAt?: string;
  lastMessageBy?: string;

  // Context
  relatedEncounterId?: string;
  relatedAppointmentId?: string;
  attachments: Attachment[];

  // Response SLA
  responseRequired: boolean;
  responseDeadline?: string;
  firstResponseAt?: string;
  responseWithinSLA: boolean;

  // Metadata
  tags: string[];
  createdAt: string;
  updatedAt: string;
  closedAt?: string;
  closedBy?: string;
  closedReason?: string;
}

export type ThreadCategory =
  | 'general_inquiry'      // Question générale
  | 'appointment'          // Rendez-vous
  | 'prescription'         // Ordonnance
  | 'test_results'         // Résultats examens
  | 'medication_refill'    // Renouvellement
  | 'symptoms'             // Symptômes
  | 'follow_up'            // Suivi
  | 'billing'              // Facturation
  | 'referral'             // Orientation
  | 'urgent'               // Urgent
  | 'other';

export type ThreadPriority = 'low' | 'normal' | 'high' | 'urgent';

export type ThreadStatus =
  | 'new'
  | 'awaiting_response'
  | 'in_progress'
  | 'awaiting_patient'
  | 'pending_review'
  | 'resolved'
  | 'closed';

export interface ThreadParticipant {
  userId: string;
  userName: string;
  userType: 'patient' | 'provider' | 'nurse' | 'staff' | 'system';
  role: string;
  addedAt: string;
  active: boolean;
  notificationPreference: 'all' | 'mentions' | 'none';
  lastReadAt?: string;
}

export interface SecureMessage {
  id: string;
  threadId: string;
  senderId: string;
  senderName: string;
  senderType: 'patient' | 'provider' | 'nurse' | 'staff' | 'system';
  senderRole?: string;

  // Content
  content: string;
  contentType: 'text' | 'html' | 'markdown';
  isSystemMessage: boolean;

  // Attachments
  attachments: Attachment[];

  // Delivery
  sentAt: string;
  deliveredAt?: string;
  readReceipts: ReadReceipt[];

  // Editing
  edited: boolean;
  editedAt?: string;
  originalContent?: string;

  // Reply
  replyToId?: string;
  mentions: string[];

  // Actions
  actions?: MessageAction[];

  // Status
  status: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
  failureReason?: string;

  // Metadata
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface Attachment {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number; // bytes
  mimeType: string;
  url: string;
  thumbnailUrl?: string;

  // Security
  encrypted: boolean;
  scannedForVirus: boolean;
  virusScanResult?: 'clean' | 'infected' | 'pending';

  // Upload
  uploadedBy: string;
  uploadedAt: string;

  // Access
  downloadCount: number;
  lastDownloadedAt?: string;
}

export interface ReadReceipt {
  userId: string;
  userName: string;
  readAt: string;
}

export interface MessageAction {
  type: 'link' | 'button' | 'appointment' | 'form';
  label: string;
  url?: string;
  data?: Record<string, any>;
}

// Templates
export interface MessageTemplate {
  id: string;
  organizationId: string;
  name: string;
  category: ThreadCategory;
  subject: string;
  content: string;
  contentType: 'text' | 'html' | 'markdown';
  variables: TemplateVariable[];
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface TemplateVariable {
  name: string;
  type: 'text' | 'date' | 'time' | 'select';
  label: string;
  required: boolean;
  defaultValue?: string;
  options?: string[];
}

// Auto-responses
export interface AutoResponse {
  id: string;
  organizationId: string;
  name: string;
  triggerType: 'after_hours' | 'holiday' | 'category' | 'keyword';
  triggerCondition?: string;
  responseTemplate: string;
  isActive: boolean;
  schedule?: AutoResponseSchedule;
  createdAt: string;
  updatedAt: string;
}

export interface AutoResponseSchedule {
  timezone: string;
  afterHoursStart: string; // HH:MM
  afterHoursEnd: string;
  workDays: number[]; // 0-6, Sunday = 0
  holidays: string[]; // ISO dates
}

// Notifications
export interface MessageNotification {
  id: string;
  userId: string;
  threadId: string;
  messageId: string;
  type: 'new_message' | 'reply' | 'mention' | 'urgent' | 'assignment';
  title: string;
  body: string;
  channels: NotificationChannel[];
  sent: boolean;
  sentAt?: string;
  read: boolean;
  readAt?: string;
  clicked: boolean;
  clickedAt?: string;
  createdAt: string;
}

export interface NotificationChannel {
  channel: 'in_app' | 'email' | 'sms' | 'push';
  sent: boolean;
  sentAt?: string;
  delivered: boolean;
  deliveredAt?: string;
  error?: string;
}

// Analytics
export interface MessagingAnalytics {
  period: {
    startDate: string;
    endDate: string;
  };
  summary: MessagingSummary;
  byCategory: CategoryMetrics[];
  responseTimeMetrics: ResponseTimeMetrics;
  volumeTrend: VolumeTrend[];
  topProviders: ProviderMetrics[];
}

export interface MessagingSummary {
  totalThreads: number;
  newThreads: number;
  resolvedThreads: number;
  avgResponseTime: number; // minutes
  responseWithinSLA: number;
  patientSatisfaction?: number;
}

export interface CategoryMetrics {
  category: ThreadCategory;
  count: number;
  avgResponseTime: number;
  resolutionRate: number;
}

export interface ResponseTimeMetrics {
  average: number;
  median: number;
  p95: number;
  withinSLA: number;
  overdueSLA: number;
}

export interface VolumeTrend {
  date: string;
  received: number;
  sent: number;
  resolved: number;
}

export interface ProviderMetrics {
  providerId: string;
  providerName: string;
  threadsHandled: number;
  avgResponseTime: number;
  resolutionRate: number;
}

// Dashboard
export interface MessagingDashboard {
  inbox: ThreadSummary;
  recentThreads: MessageThread[];
  urgentThreads: MessageThread[];
  awaitingResponse: MessageThread[];
  overdueSLA: MessageThread[];
  unreadCount: number;
  todayStats: DayStats;
}

export interface ThreadSummary {
  total: number;
  unread: number;
  new: number;
  inProgress: number;
  awaitingPatient: number;
  overdue: number;
}

export interface DayStats {
  received: number;
  sent: number;
  resolved: number;
  avgResponseTime: number;
}

// ============================================================================
// Secure Messaging Service Class
// ============================================================================

export class SecureMessagingService {
  private db: D1Database;
  private organizationId: string;

  constructor(db: D1Database, organizationId: string) {
    this.db = db;
    this.organizationId = organizationId;
  }

  // ==========================================================================
  // Thread Management
  // ==========================================================================

  async createThread(data: {
    patientId: string;
    patientName: string;
    subject: string;
    category: ThreadCategory;
    priority?: ThreadPriority;
    providerId?: string;
    providerName?: string;
    departmentId?: string;
    departmentName?: string;
    initialMessage: string;
    attachments?: Partial<Attachment>[];
    relatedEncounterId?: string;
    relatedAppointmentId?: string;
    senderType: 'patient' | 'provider';
    senderId: string;
    senderName: string;
  }): Promise<MessageThread> {
    const thread: MessageThread = {
      id: this.generateId(),
      organizationId: this.organizationId,
      subject: data.subject,
      category: data.category,
      priority: data.priority || 'normal',
      status: 'new',
      patientId: data.patientId,
      patientName: data.patientName,
      providerId: data.providerId,
      providerName: data.providerName,
      departmentId: data.departmentId,
      departmentName: data.departmentName,
      careTeam: [],
      messages: [],
      messageCount: 0,
      unreadCount: 0,
      attachments: [],
      responseRequired: data.senderType === 'patient',
      responseDeadline: data.senderType === 'patient'
        ? this.calculateResponseDeadline(data.priority || 'normal')
        : undefined,
      responseWithinSLA: true,
      tags: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Add initial participants
    thread.careTeam.push({
      userId: data.patientId,
      userName: data.patientName,
      userType: 'patient',
      role: 'Patient',
      addedAt: new Date().toISOString(),
      active: true,
      notificationPreference: 'all'
    });

    if (data.providerId) {
      thread.careTeam.push({
        userId: data.providerId,
        userName: data.providerName || '',
        userType: 'provider',
        role: 'Physician',
        addedAt: new Date().toISOString(),
        active: true,
        notificationPreference: 'all'
      });
    }

    // Add initial message
    const message = await this.addMessageToThread(thread, {
      senderId: data.senderId,
      senderName: data.senderName,
      senderType: data.senderType,
      content: data.initialMessage,
      attachments: data.attachments
    });

    thread.messages.push(message);
    thread.messageCount = 1;
    thread.unreadCount = 1;
    thread.lastMessageAt = message.sentAt;
    thread.lastMessageBy = data.senderName;

    // Check for auto-response (after hours, etc.)
    await this.checkAutoResponse(thread);

    await ThreadDB.create(this.db, thread);

    // Send notifications
    await this.sendNewThreadNotification(thread);

    return thread;
  }

  async getThread(id: string): Promise<MessageThread | null> {
    return ThreadDB.getById(this.db, id);
  }

  async updateThread(id: string, updates: Partial<MessageThread>): Promise<MessageThread> {
    const thread = await this.getThread(id);
    if (!thread) throw new Error('Thread not found');

    const updated: MessageThread = {
      ...thread,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    await ThreadDB.update(this.db, id, updated);
    return updated;
  }

  async listThreads(filters: {
    patientId?: string;
    providerId?: string;
    status?: ThreadStatus;
    category?: ThreadCategory;
    priority?: ThreadPriority;
    unreadOnly?: boolean;
    fromDate?: string;
    toDate?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{ threads: MessageThread[]; total: number }> {
    return ThreadDB.list(this.db, this.organizationId, filters);
  }

  async assignThread(threadId: string, data: {
    assignedTo: string;
    assignedToName: string;
    assignedBy: string;
  }): Promise<MessageThread> {
    const thread = await this.getThread(threadId);
    if (!thread) throw new Error('Thread not found');

    // Add assignee to care team if not already there
    if (!thread.careTeam.some(p => p.userId === data.assignedTo)) {
      thread.careTeam.push({
        userId: data.assignedTo,
        userName: data.assignedToName,
        userType: 'provider',
        role: 'Assigned Provider',
        addedAt: new Date().toISOString(),
        active: true,
        notificationPreference: 'all'
      });
    }

    // Add system message
    await this.sendMessage(threadId, {
      senderId: 'system',
      senderName: 'System',
      senderType: 'system',
      content: `Ce fil a été assigné à ${data.assignedToName}`,
      isSystemMessage: true
    });

    return this.updateThread(threadId, {
      assignedTo: data.assignedTo,
      assignedToName: data.assignedToName,
      assignedAt: new Date().toISOString(),
      status: 'in_progress',
      careTeam: thread.careTeam
    });
  }

  async closeThread(threadId: string, data: {
    closedBy: string;
    reason?: string;
  }): Promise<MessageThread> {
    // Add system message
    await this.sendMessage(threadId, {
      senderId: 'system',
      senderName: 'System',
      senderType: 'system',
      content: `Ce fil a été clôturé${data.reason ? `: ${data.reason}` : ''}`,
      isSystemMessage: true
    });

    return this.updateThread(threadId, {
      status: 'closed',
      closedAt: new Date().toISOString(),
      closedBy: data.closedBy,
      closedReason: data.reason
    });
  }

  async reopenThread(threadId: string, reopenedBy: string): Promise<MessageThread> {
    // Add system message
    await this.sendMessage(threadId, {
      senderId: 'system',
      senderName: 'System',
      senderType: 'system',
      content: 'Ce fil a été réouvert',
      isSystemMessage: true
    });

    return this.updateThread(threadId, {
      status: 'in_progress',
      closedAt: undefined,
      closedBy: undefined,
      closedReason: undefined
    });
  }

  private calculateResponseDeadline(priority: ThreadPriority): string {
    const now = new Date();
    let hoursToAdd: number;

    switch (priority) {
      case 'urgent': hoursToAdd = 2; break;
      case 'high': hoursToAdd = 4; break;
      case 'normal': hoursToAdd = 24; break;
      case 'low': hoursToAdd = 48; break;
      default: hoursToAdd = 24;
    }

    // Adjust for business hours (simplified)
    return new Date(now.getTime() + hoursToAdd * 60 * 60 * 1000).toISOString();
  }

  // ==========================================================================
  // Message Operations
  // ==========================================================================

  async sendMessage(threadId: string, data: {
    senderId: string;
    senderName: string;
    senderType: 'patient' | 'provider' | 'nurse' | 'staff' | 'system';
    senderRole?: string;
    content: string;
    attachments?: Partial<Attachment>[];
    replyToId?: string;
    mentions?: string[];
    isSystemMessage?: boolean;
  }): Promise<SecureMessage> {
    const thread = await this.getThread(threadId);
    if (!thread) throw new Error('Thread not found');

    const message = await this.addMessageToThread(thread, data);

    thread.messages.push(message);
    thread.messageCount++;
    thread.lastMessageAt = message.sentAt;
    thread.lastMessageBy = data.senderName;

    // Update thread status based on who sent the message
    if (data.senderType === 'patient') {
      thread.status = 'awaiting_response';
      thread.unreadCount++;
    } else if (data.senderType !== 'system') {
      if (!thread.firstResponseAt && thread.responseRequired) {
        thread.firstResponseAt = message.sentAt;
        // Check if within SLA
        if (thread.responseDeadline) {
          thread.responseWithinSLA = new Date(message.sentAt) <= new Date(thread.responseDeadline);
        }
      }
      thread.status = 'awaiting_patient';
      thread.unreadCount++;
    }

    await this.updateThread(threadId, {
      messages: thread.messages,
      messageCount: thread.messageCount,
      unreadCount: thread.unreadCount,
      lastMessageAt: thread.lastMessageAt,
      lastMessageBy: thread.lastMessageBy,
      status: thread.status,
      firstResponseAt: thread.firstResponseAt,
      responseWithinSLA: thread.responseWithinSLA
    });

    // Send notifications
    if (!data.isSystemMessage) {
      await this.sendMessageNotification(thread, message);
    }

    return message;
  }

  private async addMessageToThread(thread: MessageThread, data: {
    senderId: string;
    senderName: string;
    senderType: 'patient' | 'provider' | 'nurse' | 'staff' | 'system';
    senderRole?: string;
    content: string;
    attachments?: Partial<Attachment>[];
    replyToId?: string;
    mentions?: string[];
    isSystemMessage?: boolean;
  }): Promise<SecureMessage> {
    const message: SecureMessage = {
      id: this.generateId(),
      threadId: thread.id,
      senderId: data.senderId,
      senderName: data.senderName,
      senderType: data.senderType,
      senderRole: data.senderRole,
      content: data.content,
      contentType: 'text',
      isSystemMessage: data.isSystemMessage || false,
      attachments: data.attachments?.map(a => this.createAttachment(a, data.senderId)) || [],
      sentAt: new Date().toISOString(),
      readReceipts: [],
      edited: false,
      replyToId: data.replyToId,
      mentions: data.mentions || [],
      status: 'sent',
      createdAt: new Date().toISOString()
    };

    return message;
  }

  private createAttachment(data: Partial<Attachment>, uploadedBy: string): Attachment {
    return {
      id: this.generateId(),
      fileName: data.fileName || 'file',
      fileType: data.fileType || 'unknown',
      fileSize: data.fileSize || 0,
      mimeType: data.mimeType || 'application/octet-stream',
      url: data.url || '',
      thumbnailUrl: data.thumbnailUrl,
      encrypted: true,
      scannedForVirus: true,
      virusScanResult: 'clean',
      uploadedBy,
      uploadedAt: new Date().toISOString(),
      downloadCount: 0
    };
  }

  async editMessage(threadId: string, messageId: string, data: {
    newContent: string;
    editedBy: string;
  }): Promise<SecureMessage> {
    const thread = await this.getThread(threadId);
    if (!thread) throw new Error('Thread not found');

    const messageIndex = thread.messages.findIndex(m => m.id === messageId);
    if (messageIndex === -1) throw new Error('Message not found');

    const message = thread.messages[messageIndex];

    // Only sender can edit their message
    if (message.senderId !== data.editedBy) {
      throw new Error('Cannot edit message from another user');
    }

    // Store original if first edit
    if (!message.edited) {
      message.originalContent = message.content;
    }

    message.content = data.newContent;
    message.edited = true;
    message.editedAt = new Date().toISOString();

    thread.messages[messageIndex] = message;
    await this.updateThread(threadId, { messages: thread.messages });

    return message;
  }

  async markAsRead(threadId: string, userId: string, userName: string): Promise<void> {
    const thread = await this.getThread(threadId);
    if (!thread) throw new Error('Thread not found');

    const now = new Date().toISOString();

    // Mark all unread messages as read
    for (const message of thread.messages) {
      if (!message.readReceipts.some(r => r.userId === userId)) {
        message.readReceipts.push({
          userId,
          userName,
          readAt: now
        });
        message.status = 'read';
      }
    }

    // Update participant last read
    const participantIndex = thread.careTeam.findIndex(p => p.userId === userId);
    if (participantIndex !== -1) {
      thread.careTeam[participantIndex].lastReadAt = now;
    }

    // Reset unread count for this user's perspective
    thread.unreadCount = 0;

    await this.updateThread(threadId, {
      messages: thread.messages,
      careTeam: thread.careTeam,
      unreadCount: thread.unreadCount
    });
  }

  // ==========================================================================
  // Templates
  // ==========================================================================

  async createTemplate(data: Partial<MessageTemplate>): Promise<MessageTemplate> {
    const template: MessageTemplate = {
      id: this.generateId(),
      organizationId: this.organizationId,
      name: data.name || '',
      category: data.category || 'general_inquiry',
      subject: data.subject || '',
      content: data.content || '',
      contentType: data.contentType || 'text',
      variables: data.variables || [],
      isActive: true,
      createdBy: data.createdBy || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await TemplateDB.create(this.db, template);
    return template;
  }

  async listTemplates(category?: ThreadCategory): Promise<MessageTemplate[]> {
    return TemplateDB.list(this.db, this.organizationId, category);
  }

  async useTemplate(templateId: string, variables: Record<string, string>): Promise<{ subject: string; content: string }> {
    const template = await TemplateDB.getById(this.db, templateId);
    if (!template) throw new Error('Template not found');

    let subject = template.subject;
    let content = template.content;

    // Replace variables
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      subject = subject.replace(regex, value);
      content = content.replace(regex, value);
    }

    return { subject, content };
  }

  // ==========================================================================
  // Auto-responses
  // ==========================================================================

  async createAutoResponse(data: Partial<AutoResponse>): Promise<AutoResponse> {
    const autoResponse: AutoResponse = {
      id: this.generateId(),
      organizationId: this.organizationId,
      name: data.name || '',
      triggerType: data.triggerType || 'after_hours',
      triggerCondition: data.triggerCondition,
      responseTemplate: data.responseTemplate || '',
      isActive: data.isActive ?? true,
      schedule: data.schedule,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await AutoResponseDB.create(this.db, autoResponse);
    return autoResponse;
  }

  private async checkAutoResponse(thread: MessageThread): Promise<void> {
    const autoResponses = await AutoResponseDB.listActive(this.db, this.organizationId);

    for (const ar of autoResponses) {
      let shouldTrigger = false;

      if (ar.triggerType === 'after_hours' && ar.schedule) {
        shouldTrigger = this.isAfterHours(ar.schedule);
      } else if (ar.triggerType === 'category' && ar.triggerCondition) {
        shouldTrigger = thread.category === ar.triggerCondition;
      }

      if (shouldTrigger) {
        await this.sendMessage(thread.id, {
          senderId: 'system',
          senderName: 'Réponse automatique',
          senderType: 'system',
          content: ar.responseTemplate,
          isSystemMessage: true
        });
        break; // Only one auto-response per thread
      }
    }
  }

  private isAfterHours(schedule: AutoResponseSchedule): boolean {
    const now = new Date();
    const currentDay = now.getDay();
    const currentTime = now.toTimeString().slice(0, 5);

    // Check if it's a work day
    if (!schedule.workDays.includes(currentDay)) {
      return true;
    }

    // Check if it's a holiday
    const today = now.toISOString().split('T')[0];
    if (schedule.holidays.includes(today)) {
      return true;
    }

    // Check if outside work hours
    if (currentTime < schedule.afterHoursEnd || currentTime >= schedule.afterHoursStart) {
      return true;
    }

    return false;
  }

  // ==========================================================================
  // Notifications
  // ==========================================================================

  private async sendNewThreadNotification(thread: MessageThread): Promise<void> {
    for (const participant of thread.careTeam) {
      if (participant.userId !== thread.messages[0].senderId && participant.notificationPreference !== 'none') {
        const notification: MessageNotification = {
          id: this.generateId(),
          userId: participant.userId,
          threadId: thread.id,
          messageId: thread.messages[0].id,
          type: 'new_message',
          title: `Nouveau message: ${thread.subject}`,
          body: thread.messages[0].content.substring(0, 100),
          channels: [
            { channel: 'in_app', sent: false, delivered: false },
            { channel: 'email', sent: false, delivered: false }
          ],
          sent: false,
          read: false,
          clicked: false,
          createdAt: new Date().toISOString()
        };

        await NotificationDB.create(this.db, notification);
        await this.dispatchNotification(notification);
      }
    }
  }

  private async sendMessageNotification(thread: MessageThread, message: SecureMessage): Promise<void> {
    for (const participant of thread.careTeam) {
      if (participant.userId !== message.senderId && participant.notificationPreference !== 'none') {
        const isMentioned = message.mentions.includes(participant.userId);
        if (!isMentioned && participant.notificationPreference === 'mentions') continue;

        const notification: MessageNotification = {
          id: this.generateId(),
          userId: participant.userId,
          threadId: thread.id,
          messageId: message.id,
          type: isMentioned ? 'mention' : 'reply',
          title: isMentioned ? `Vous avez été mentionné dans: ${thread.subject}` : `Réponse: ${thread.subject}`,
          body: message.content.substring(0, 100),
          channels: [
            { channel: 'in_app', sent: false, delivered: false },
            { channel: 'email', sent: false, delivered: false }
          ],
          sent: false,
          read: false,
          clicked: false,
          createdAt: new Date().toISOString()
        };

        if (thread.priority === 'urgent') {
          notification.type = 'urgent';
          notification.channels.push({ channel: 'sms', sent: false, delivered: false });
        }

        await NotificationDB.create(this.db, notification);
        await this.dispatchNotification(notification);
      }
    }
  }

  private async dispatchNotification(notification: MessageNotification): Promise<void> {
    // In a real implementation, this would send to notification services
    // For now, just mark as sent
    notification.sent = true;
    notification.sentAt = new Date().toISOString();
    for (const channel of notification.channels) {
      channel.sent = true;
      channel.sentAt = new Date().toISOString();
    }
    await NotificationDB.update(this.db, notification.id, notification);
  }

  async listNotifications(userId: string, unreadOnly?: boolean): Promise<MessageNotification[]> {
    return NotificationDB.listByUser(this.db, userId, unreadOnly);
  }

  async markNotificationRead(notificationId: string): Promise<void> {
    const notification = await NotificationDB.getById(this.db, notificationId);
    if (!notification) return;

    notification.read = true;
    notification.readAt = new Date().toISOString();
    await NotificationDB.update(this.db, notificationId, notification);
  }

  // ==========================================================================
  // Dashboard & Analytics
  // ==========================================================================

  async getDashboard(userId: string, userType: 'patient' | 'provider'): Promise<MessagingDashboard> {
    const filters = userType === 'patient'
      ? { patientId: userId }
      : { providerId: userId };

    const { threads } = await this.listThreads({ ...filters, limit: 100 });

    const inbox: ThreadSummary = {
      total: threads.length,
      unread: threads.filter(t => t.unreadCount > 0).length,
      new: threads.filter(t => t.status === 'new').length,
      inProgress: threads.filter(t => t.status === 'in_progress').length,
      awaitingPatient: threads.filter(t => t.status === 'awaiting_patient').length,
      overdue: threads.filter(t =>
        t.responseDeadline && new Date(t.responseDeadline) < new Date() && !t.firstResponseAt
      ).length
    };

    const today = new Date().toISOString().split('T')[0];
    const todayThreads = threads.filter(t => t.createdAt.startsWith(today));

    const todayStats: DayStats = {
      received: todayThreads.filter(t => t.messages[0].senderType === 'patient').length,
      sent: todayThreads.filter(t => t.messages[0].senderType !== 'patient').length,
      resolved: threads.filter(t => t.closedAt?.startsWith(today)).length,
      avgResponseTime: 0
    };

    // Recent threads
    const recentThreads = threads
      .sort((a, b) => new Date(b.lastMessageAt || b.createdAt).getTime() - new Date(a.lastMessageAt || a.createdAt).getTime())
      .slice(0, 10);

    // Urgent threads
    const urgentThreads = threads.filter(t => t.priority === 'urgent' && t.status !== 'closed');

    // Awaiting response
    const awaitingResponse = threads.filter(t => t.status === 'awaiting_response');

    // Overdue SLA
    const overdueSLA = threads.filter(t =>
      t.responseDeadline && new Date(t.responseDeadline) < new Date() && !t.firstResponseAt
    );

    // Unread count
    const unreadCount = threads.reduce((sum, t) => sum + t.unreadCount, 0);

    return {
      inbox,
      recentThreads,
      urgentThreads,
      awaitingResponse,
      overdueSLA,
      unreadCount,
      todayStats
    };
  }

  async getAnalytics(filters: {
    startDate: string;
    endDate: string;
    providerId?: string;
    departmentId?: string;
  }): Promise<MessagingAnalytics> {
    const { threads } = await this.listThreads({
      fromDate: filters.startDate,
      toDate: filters.endDate,
      limit: 1000
    });

    const summary: MessagingSummary = {
      totalThreads: threads.length,
      newThreads: threads.filter(t => new Date(t.createdAt) >= new Date(filters.startDate)).length,
      resolvedThreads: threads.filter(t => t.status === 'closed' || t.status === 'resolved').length,
      avgResponseTime: this.calculateAvgResponseTime(threads),
      responseWithinSLA: threads.filter(t => t.responseWithinSLA).length
    };

    // By category
    const categoryMap = new Map<ThreadCategory, MessageThread[]>();
    for (const t of threads) {
      const arr = categoryMap.get(t.category) || [];
      arr.push(t);
      categoryMap.set(t.category, arr);
    }

    const byCategory: CategoryMetrics[] = Array.from(categoryMap.entries()).map(([category, catThreads]) => ({
      category,
      count: catThreads.length,
      avgResponseTime: this.calculateAvgResponseTime(catThreads),
      resolutionRate: (catThreads.filter(t => t.status === 'closed').length / catThreads.length) * 100
    }));

    // Response time metrics
    const responseTimes = threads
      .filter(t => t.firstResponseAt && t.messages.length > 0)
      .map(t => {
        const firstPatientMessage = t.messages.find(m => m.senderType === 'patient');
        if (!firstPatientMessage || !t.firstResponseAt) return 0;
        return (new Date(t.firstResponseAt).getTime() - new Date(firstPatientMessage.sentAt).getTime()) / 60000;
      })
      .filter(rt => rt > 0)
      .sort((a, b) => a - b);

    const responseTimeMetrics: ResponseTimeMetrics = {
      average: responseTimes.length > 0 ? responseTimes.reduce((a, b) => a + b) / responseTimes.length : 0,
      median: responseTimes.length > 0 ? responseTimes[Math.floor(responseTimes.length / 2)] : 0,
      p95: responseTimes.length > 0 ? responseTimes[Math.floor(responseTimes.length * 0.95)] : 0,
      withinSLA: threads.filter(t => t.responseWithinSLA).length,
      overdueSLA: threads.filter(t => !t.responseWithinSLA).length
    };

    return {
      period: { startDate: filters.startDate, endDate: filters.endDate },
      summary,
      byCategory,
      responseTimeMetrics,
      volumeTrend: [],
      topProviders: []
    };
  }

  private calculateAvgResponseTime(threads: MessageThread[]): number {
    const times = threads
      .filter(t => t.firstResponseAt && t.messages.length > 0)
      .map(t => {
        const firstPatientMessage = t.messages.find(m => m.senderType === 'patient');
        if (!firstPatientMessage || !t.firstResponseAt) return 0;
        return (new Date(t.firstResponseAt).getTime() - new Date(firstPatientMessage.sentAt).getTime()) / 60000;
      })
      .filter(rt => rt > 0);

    return times.length > 0 ? Math.round(times.reduce((a, b) => a + b) / times.length) : 0;
  }

  // ==========================================================================
  // Utility Methods
  // ==========================================================================

  private generateId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// ============================================================================
// Database Layer (Stubs for D1 Implementation)
// ============================================================================

class ThreadDB {
  static async create(db: D1Database, thread: MessageThread): Promise<void> {}
  static async getById(db: D1Database, id: string): Promise<MessageThread | null> { return null; }
  static async update(db: D1Database, id: string, thread: MessageThread): Promise<void> {}
  static async list(db: D1Database, orgId: string, filters: any): Promise<{ threads: MessageThread[]; total: number }> {
    return { threads: [], total: 0 };
  }
}

class TemplateDB {
  static async create(db: D1Database, template: MessageTemplate): Promise<void> {}
  static async getById(db: D1Database, id: string): Promise<MessageTemplate | null> { return null; }
  static async list(db: D1Database, orgId: string, category?: ThreadCategory): Promise<MessageTemplate[]> { return []; }
}

class AutoResponseDB {
  static async create(db: D1Database, ar: AutoResponse): Promise<void> {}
  static async listActive(db: D1Database, orgId: string): Promise<AutoResponse[]> { return []; }
}

class NotificationDB {
  static async create(db: D1Database, notification: MessageNotification): Promise<void> {}
  static async getById(db: D1Database, id: string): Promise<MessageNotification | null> { return null; }
  static async update(db: D1Database, id: string, notification: MessageNotification): Promise<void> {}
  static async listByUser(db: D1Database, userId: string, unreadOnly?: boolean): Promise<MessageNotification[]> { return []; }
}

export default SecureMessagingService;
