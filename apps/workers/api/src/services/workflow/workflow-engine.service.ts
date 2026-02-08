/**
 * Workflow Engine Service
 * BPMN-like workflow automation engine for healthcare processes
 */

// =============================================================================
// Types & Interfaces
// =============================================================================

export type WorkflowStatus = 'draft' | 'active' | 'completed' | 'cancelled' | 'suspended' | 'error';
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'skipped' | 'failed' | 'timeout';
export type TriggerType = 'manual' | 'scheduled' | 'event' | 'condition' | 'webhook';
export type ActionType = 'task' | 'notification' | 'approval' | 'api_call' | 'script' | 'gateway' | 'subprocess';

export interface WorkflowDefinition {
  id: string;
  name: string;
  description: string;
  version: string;
  module: 'dialyse' | 'cardiology' | 'ophthalmology' | 'general';
  trigger: WorkflowTrigger;
  steps: WorkflowStep[];
  variables: WorkflowVariable[];
  escalationRules?: EscalationRule[];
  slaDefinition?: SLADefinition;
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkflowTrigger {
  type: TriggerType;
  event?: string;
  schedule?: string; // Cron expression
  condition?: string;
  webhookUrl?: string;
}

export interface WorkflowStep {
  id: string;
  name: string;
  type: ActionType;
  description?: string;
  assignee?: WorkflowAssignee;
  action: WorkflowAction;
  conditions?: StepCondition[];
  timeout?: number; // minutes
  retryPolicy?: RetryPolicy;
  onSuccess?: string; // next step id
  onFailure?: string; // step id or 'end'
  onTimeout?: string;
  metadata?: Record<string, unknown>;
}

export interface WorkflowAssignee {
  type: 'user' | 'role' | 'team' | 'dynamic';
  value: string;
  fallback?: string;
}

export interface WorkflowAction {
  type: ActionType;
  // Task action
  taskType?: string;
  formId?: string;
  instructions?: string;
  requiredFields?: string[];
  // Notification action
  notificationType?: 'email' | 'sms' | 'push' | 'in_app';
  template?: string;
  recipients?: string[];
  // Approval action
  approvers?: string[];
  minApprovals?: number;
  // API call action
  endpoint?: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: Record<string, unknown>;
  // Script action
  script?: string;
  // Gateway action
  gatewayType?: 'exclusive' | 'inclusive' | 'parallel';
  branches?: GatewayBranch[];
  // Subprocess action
  subprocessId?: string;
}

export interface GatewayBranch {
  id: string;
  name: string;
  condition: string;
  targetStepId: string;
}

export interface StepCondition {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'lt' | 'gte' | 'lte' | 'contains' | 'in' | 'not_in';
  value: unknown;
}

export interface RetryPolicy {
  maxRetries: number;
  retryDelay: number; // seconds
  exponentialBackoff: boolean;
}

export interface WorkflowVariable {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'object' | 'array';
  defaultValue?: unknown;
  required: boolean;
  description?: string;
}

export interface EscalationRule {
  id: string;
  name: string;
  condition: string;
  delayMinutes: number;
  action: {
    type: 'notify' | 'reassign' | 'escalate';
    target: string;
    message?: string;
  };
}

export interface SLADefinition {
  targetCompletionMinutes: number;
  warningThresholdPercent: number;
  breachActions: {
    type: 'notify' | 'escalate';
    target: string;
  }[];
}

// =============================================================================
// Workflow Instance Types
// =============================================================================

export interface WorkflowInstance {
  id: string;
  definitionId: string;
  definitionVersion: string;
  status: WorkflowStatus;
  currentStepId?: string;
  variables: Record<string, unknown>;
  context: {
    patientId?: string;
    resourceId?: string;
    resourceType?: string;
    module?: string;
    triggeredBy: string;
    triggerData?: Record<string, unknown>;
  };
  steps: WorkflowStepInstance[];
  startedAt: Date;
  completedAt?: Date;
  cancelledAt?: Date;
  cancelledBy?: string;
  cancelReason?: string;
  error?: {
    stepId: string;
    message: string;
    timestamp: Date;
  };
  slaStatus?: {
    targetCompletion: Date;
    warningAt: Date;
    isBreached: boolean;
    breachedAt?: Date;
  };
  metadata?: Record<string, unknown>;
}

export interface WorkflowStepInstance {
  stepId: string;
  name: string;
  status: TaskStatus;
  assignee?: string;
  startedAt?: Date;
  completedAt?: Date;
  completedBy?: string;
  result?: Record<string, unknown>;
  attempts: number;
  lastError?: string;
  dueAt?: Date;
}

export interface WorkflowTask {
  id: string;
  instanceId: string;
  stepId: string;
  definitionId: string;
  name: string;
  description?: string;
  assignee: string;
  status: TaskStatus;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueAt?: Date;
  formData?: Record<string, unknown>;
  instructions?: string;
  context: {
    patientId?: string;
    patientName?: string;
    resourceType?: string;
    resourceId?: string;
  };
  actions: {
    id: string;
    label: string;
    type: 'submit' | 'approve' | 'reject' | 'escalate' | 'delegate';
    requiresComment?: boolean;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

// =============================================================================
// Predefined Workflow Templates
// =============================================================================

const WORKFLOW_TEMPLATES: WorkflowDefinition[] = [
  // Lab Result Review Workflow
  {
    id: 'wf-lab-review-001',
    name: 'Revue des résultats de laboratoire',
    description: 'Workflow automatisé pour la revue des résultats de laboratoire anormaux',
    version: '1.0',
    module: 'dialyse',
    trigger: {
      type: 'event',
      event: 'lab_result.created'
    },
    steps: [
      {
        id: 'step-1',
        name: 'Vérifier valeurs anormales',
        type: 'gateway',
        action: {
          type: 'gateway',
          gatewayType: 'exclusive',
          branches: [
            {
              id: 'branch-normal',
              name: 'Valeurs normales',
              condition: 'result.isNormal === true',
              targetStepId: 'step-end'
            },
            {
              id: 'branch-abnormal',
              name: 'Valeurs anormales',
              condition: 'result.isNormal === false',
              targetStepId: 'step-2'
            },
            {
              id: 'branch-critical',
              name: 'Valeurs critiques',
              condition: 'result.isCritical === true',
              targetStepId: 'step-urgent'
            }
          ]
        },
        onSuccess: 'step-2'
      },
      {
        id: 'step-urgent',
        name: 'Notification urgente',
        type: 'notification',
        action: {
          type: 'notification',
          notificationType: 'sms',
          template: 'critical_lab_result',
          recipients: ['attending_physician', 'on_call_doctor']
        },
        onSuccess: 'step-2'
      },
      {
        id: 'step-2',
        name: 'Revue par le médecin',
        type: 'approval',
        assignee: {
          type: 'role',
          value: 'physician',
          fallback: 'medical_director'
        },
        action: {
          type: 'approval',
          approvers: ['attending_physician'],
          minApprovals: 1
        },
        timeout: 480, // 8 hours
        onSuccess: 'step-3',
        onTimeout: 'step-escalate'
      },
      {
        id: 'step-escalate',
        name: 'Escalade',
        type: 'notification',
        action: {
          type: 'notification',
          notificationType: 'email',
          template: 'lab_review_escalation',
          recipients: ['medical_director']
        },
        onSuccess: 'step-2'
      },
      {
        id: 'step-3',
        name: 'Mettre à jour dossier patient',
        type: 'task',
        action: {
          type: 'task',
          taskType: 'update_patient_record',
          instructions: 'Documenter les actions prises suite aux résultats'
        },
        onSuccess: 'step-4'
      },
      {
        id: 'step-4',
        name: 'Notification patient si nécessaire',
        type: 'gateway',
        action: {
          type: 'gateway',
          gatewayType: 'exclusive',
          branches: [
            {
              id: 'notify-patient',
              name: 'Informer patient',
              condition: 'context.notifyPatient === true',
              targetStepId: 'step-notify-patient'
            },
            {
              id: 'no-notify',
              name: 'Pas de notification',
              condition: 'context.notifyPatient !== true',
              targetStepId: 'step-end'
            }
          ]
        },
        onSuccess: 'step-end'
      },
      {
        id: 'step-notify-patient',
        name: 'Notifier le patient',
        type: 'notification',
        action: {
          type: 'notification',
          notificationType: 'email',
          template: 'lab_result_notification'
        },
        onSuccess: 'step-end'
      },
      {
        id: 'step-end',
        name: 'Fin du workflow',
        type: 'task',
        action: {
          type: 'task',
          taskType: 'workflow_complete'
        }
      }
    ],
    variables: [
      { name: 'result', type: 'object', required: true, description: 'Lab result data' },
      { name: 'patient', type: 'object', required: true, description: 'Patient information' }
    ],
    escalationRules: [
      {
        id: 'esc-1',
        name: 'Critical value not reviewed',
        condition: 'result.isCritical === true && step.status === "pending"',
        delayMinutes: 30,
        action: {
          type: 'escalate',
          target: 'medical_director',
          message: 'Valeur critique non revue après 30 minutes'
        }
      }
    ],
    slaDefinition: {
      targetCompletionMinutes: 480,
      warningThresholdPercent: 75,
      breachActions: [
        { type: 'notify', target: 'medical_director' }
      ]
    },
    isActive: true,
    createdBy: 'system',
    createdAt: new Date(),
    updatedAt: new Date()
  },

  // Prescription Renewal Workflow
  {
    id: 'wf-prescription-renewal-001',
    name: 'Renouvellement de prescription',
    description: 'Workflow pour le renouvellement des prescriptions arrivant à expiration',
    version: '1.0',
    module: 'general',
    trigger: {
      type: 'scheduled',
      schedule: '0 8 * * *' // Daily at 8 AM
    },
    steps: [
      {
        id: 'step-1',
        name: 'Identifier prescriptions expirant',
        type: 'script',
        action: {
          type: 'script',
          script: 'findExpiringPrescriptions(30)' // 30 days ahead
        },
        onSuccess: 'step-2'
      },
      {
        id: 'step-2',
        name: 'Créer tâches de renouvellement',
        type: 'task',
        assignee: {
          type: 'role',
          value: 'physician'
        },
        action: {
          type: 'task',
          taskType: 'prescription_renewal',
          formId: 'prescription-renewal-form',
          instructions: 'Revoir et renouveler les prescriptions listées'
        },
        timeout: 1440, // 24 hours
        onSuccess: 'step-3'
      },
      {
        id: 'step-3',
        name: 'Signature électronique',
        type: 'approval',
        action: {
          type: 'approval',
          approvers: ['prescribing_physician'],
          minApprovals: 1
        },
        onSuccess: 'step-4'
      },
      {
        id: 'step-4',
        name: 'Notifier patient',
        type: 'notification',
        action: {
          type: 'notification',
          notificationType: 'sms',
          template: 'prescription_renewed'
        },
        onSuccess: 'step-end'
      },
      {
        id: 'step-end',
        name: 'Fin',
        type: 'task',
        action: {
          type: 'task',
          taskType: 'workflow_complete'
        }
      }
    ],
    variables: [
      { name: 'prescriptions', type: 'array', required: true, description: 'List of expiring prescriptions' }
    ],
    isActive: true,
    createdBy: 'system',
    createdAt: new Date(),
    updatedAt: new Date()
  },

  // Patient Admission Workflow
  {
    id: 'wf-admission-001',
    name: 'Admission patient dialyse',
    description: 'Workflow complet d\'admission pour nouveau patient en dialyse',
    version: '1.0',
    module: 'dialyse',
    trigger: {
      type: 'manual'
    },
    steps: [
      {
        id: 'step-1',
        name: 'Vérifier dossier administratif',
        type: 'task',
        assignee: {
          type: 'role',
          value: 'administrative_staff'
        },
        action: {
          type: 'task',
          taskType: 'verify_documents',
          requiredFields: ['identity', 'insurance', 'consent_forms'],
          instructions: 'Vérifier tous les documents administratifs du patient'
        },
        onSuccess: 'step-2'
      },
      {
        id: 'step-2',
        name: 'Évaluation médicale initiale',
        type: 'task',
        assignee: {
          type: 'role',
          value: 'physician'
        },
        action: {
          type: 'task',
          taskType: 'medical_evaluation',
          formId: 'initial-evaluation-form'
        },
        onSuccess: 'step-3'
      },
      {
        id: 'step-3',
        name: 'Évaluation accès vasculaire',
        type: 'task',
        assignee: {
          type: 'role',
          value: 'vascular_surgeon'
        },
        action: {
          type: 'task',
          taskType: 'vascular_assessment',
          formId: 'vascular-access-form'
        },
        onSuccess: 'step-4'
      },
      {
        id: 'step-4',
        name: 'Prescription de dialyse',
        type: 'task',
        assignee: {
          type: 'role',
          value: 'nephrologist'
        },
        action: {
          type: 'task',
          taskType: 'dialysis_prescription',
          formId: 'dialysis-prescription-form'
        },
        onSuccess: 'step-5'
      },
      {
        id: 'step-5',
        name: 'Planification première séance',
        type: 'task',
        assignee: {
          type: 'role',
          value: 'planning_staff'
        },
        action: {
          type: 'task',
          taskType: 'schedule_session',
          instructions: 'Planifier la première séance de dialyse'
        },
        onSuccess: 'step-6'
      },
      {
        id: 'step-6',
        name: 'Éducation patient',
        type: 'task',
        assignee: {
          type: 'role',
          value: 'nurse_educator'
        },
        action: {
          type: 'task',
          taskType: 'patient_education',
          formId: 'education-checklist'
        },
        onSuccess: 'step-7'
      },
      {
        id: 'step-7',
        name: 'Notification patient',
        type: 'notification',
        action: {
          type: 'notification',
          notificationType: 'email',
          template: 'admission_complete'
        },
        onSuccess: 'step-end'
      },
      {
        id: 'step-end',
        name: 'Admission complète',
        type: 'task',
        action: {
          type: 'task',
          taskType: 'workflow_complete'
        }
      }
    ],
    variables: [
      { name: 'patientId', type: 'string', required: true, description: 'Patient ID' },
      { name: 'admissionDate', type: 'date', required: true, description: 'Target admission date' }
    ],
    slaDefinition: {
      targetCompletionMinutes: 10080, // 7 days
      warningThresholdPercent: 80,
      breachActions: [
        { type: 'notify', target: 'unit_manager' }
      ]
    },
    isActive: true,
    createdBy: 'system',
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

// =============================================================================
// Workflow Engine Service
// =============================================================================

export class WorkflowEngineService {
  private definitions: Map<string, WorkflowDefinition> = new Map();
  private instances: Map<string, WorkflowInstance> = new Map();

  constructor() {
    // Load predefined templates
    WORKFLOW_TEMPLATES.forEach(def => {
      this.definitions.set(def.id, def);
    });
  }

  /**
   * Get all workflow definitions
   */
  async getDefinitions(module?: string): Promise<WorkflowDefinition[]> {
    let definitions = Array.from(this.definitions.values());
    if (module) {
      definitions = definitions.filter(d => d.module === module || d.module === 'general');
    }
    return definitions;
  }

  /**
   * Get workflow definition by ID
   */
  async getDefinition(definitionId: string): Promise<WorkflowDefinition | null> {
    return this.definitions.get(definitionId) || null;
  }

  /**
   * Create a new workflow definition
   */
  async createDefinition(definition: Omit<WorkflowDefinition, 'id' | 'createdAt' | 'updatedAt'>): Promise<WorkflowDefinition> {
    const newDefinition: WorkflowDefinition = {
      id: `wf-${Date.now()}`,
      ...definition,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.definitions.set(newDefinition.id, newDefinition);
    return newDefinition;
  }

  /**
   * Start a new workflow instance
   */
  async startWorkflow(
    definitionId: string,
    context: WorkflowInstance['context'],
    variables?: Record<string, unknown>
  ): Promise<WorkflowInstance> {
    const definition = await this.getDefinition(definitionId);
    if (!definition) {
      throw new Error(`Workflow definition ${definitionId} not found`);
    }

    if (!definition.isActive) {
      throw new Error('Workflow definition is not active');
    }

    const instance: WorkflowInstance = {
      id: `wfi-${Date.now()}`,
      definitionId,
      definitionVersion: definition.version,
      status: 'active',
      currentStepId: definition.steps[0]?.id,
      variables: {
        ...this.getDefaultVariables(definition.variables),
        ...variables
      },
      context,
      steps: definition.steps.map(step => ({
        stepId: step.id,
        name: step.name,
        status: 'pending',
        attempts: 0
      })),
      startedAt: new Date()
    };

    // Calculate SLA if defined
    if (definition.slaDefinition) {
      const targetCompletion = new Date(
        Date.now() + definition.slaDefinition.targetCompletionMinutes * 60 * 1000
      );
      const warningAt = new Date(
        Date.now() + definition.slaDefinition.targetCompletionMinutes *
        (definition.slaDefinition.warningThresholdPercent / 100) * 60 * 1000
      );

      instance.slaStatus = {
        targetCompletion,
        warningAt,
        isBreached: false
      };
    }

    this.instances.set(instance.id, instance);

    // Start first step
    await this.executeStep(instance, definition.steps[0]);

    return instance;
  }

  /**
   * Get workflow instance by ID
   */
  async getInstance(instanceId: string): Promise<WorkflowInstance | null> {
    return this.instances.get(instanceId) || null;
  }

  /**
   * Get instances by patient
   */
  async getPatientInstances(patientId: string): Promise<WorkflowInstance[]> {
    return Array.from(this.instances.values())
      .filter(i => i.context.patientId === patientId);
  }

  /**
   * Get active tasks for user
   */
  async getUserTasks(userId: string): Promise<WorkflowTask[]> {
    const tasks: WorkflowTask[] = [];

    for (const instance of this.instances.values()) {
      if (instance.status !== 'active') continue;

      const definition = await this.getDefinition(instance.definitionId);
      if (!definition) continue;

      const currentStepDef = definition.steps.find(s => s.id === instance.currentStepId);
      if (!currentStepDef) continue;

      const currentStep = instance.steps.find(s => s.stepId === instance.currentStepId);
      if (!currentStep || currentStep.status !== 'pending') continue;

      // Check if user is assignee
      if (currentStepDef.assignee) {
        const isAssignee = await this.checkAssignment(currentStepDef.assignee, userId);
        if (isAssignee) {
          tasks.push(this.createTask(instance, currentStepDef, currentStep));
        }
      }
    }

    return tasks;
  }

  /**
   * Complete a task
   */
  async completeTask(
    instanceId: string,
    stepId: string,
    userId: string,
    result: Record<string, unknown>,
    action: string
  ): Promise<WorkflowInstance> {
    const instance = await this.getInstance(instanceId);
    if (!instance) {
      throw new Error('Workflow instance not found');
    }

    if (instance.status !== 'active') {
      throw new Error('Workflow is not active');
    }

    const definition = await this.getDefinition(instance.definitionId);
    if (!definition) {
      throw new Error('Workflow definition not found');
    }

    const stepDef = definition.steps.find(s => s.id === stepId);
    if (!stepDef) {
      throw new Error('Step not found in definition');
    }

    const stepInstance = instance.steps.find(s => s.stepId === stepId);
    if (!stepInstance) {
      throw new Error('Step not found in instance');
    }

    // Update step
    stepInstance.status = 'completed';
    stepInstance.completedAt = new Date();
    stepInstance.completedBy = userId;
    stepInstance.result = result;

    // Update instance variables with result
    instance.variables = {
      ...instance.variables,
      [`${stepId}_result`]: result
    };

    // Determine next step
    const nextStepId = this.determineNextStep(stepDef, result, action);

    if (nextStepId && nextStepId !== 'end') {
      instance.currentStepId = nextStepId;
      const nextStepDef = definition.steps.find(s => s.id === nextStepId);
      if (nextStepDef) {
        await this.executeStep(instance, nextStepDef);
      }
    } else {
      // Workflow complete
      instance.status = 'completed';
      instance.completedAt = new Date();
      instance.currentStepId = undefined;
    }

    this.instances.set(instance.id, instance);
    return instance;
  }

  /**
   * Cancel a workflow instance
   */
  async cancelWorkflow(instanceId: string, userId: string, reason: string): Promise<WorkflowInstance> {
    const instance = await this.getInstance(instanceId);
    if (!instance) {
      throw new Error('Workflow instance not found');
    }

    instance.status = 'cancelled';
    instance.cancelledAt = new Date();
    instance.cancelledBy = userId;
    instance.cancelReason = reason;

    this.instances.set(instance.id, instance);
    return instance;
  }

  /**
   * Execute a workflow step
   */
  private async executeStep(instance: WorkflowInstance, step: WorkflowStep): Promise<void> {
    const stepInstance = instance.steps.find(s => s.stepId === step.id);
    if (!stepInstance) return;

    stepInstance.status = 'in_progress';
    stepInstance.startedAt = new Date();
    stepInstance.attempts++;

    if (step.timeout) {
      stepInstance.dueAt = new Date(Date.now() + step.timeout * 60 * 1000);
    }

    switch (step.action.type) {
      case 'notification':
        await this.executeNotification(instance, step);
        // Auto-complete notification steps
        stepInstance.status = 'completed';
        stepInstance.completedAt = new Date();
        if (step.onSuccess) {
          instance.currentStepId = step.onSuccess;
        }
        break;

      case 'gateway':
        await this.executeGateway(instance, step);
        break;

      case 'script':
        await this.executeScript(instance, step);
        break;

      case 'api_call':
        await this.executeApiCall(instance, step);
        break;

      case 'task':
      case 'approval':
        // These wait for user action
        stepInstance.status = 'pending';
        break;
    }

    this.instances.set(instance.id, instance);
  }

  /**
   * Execute notification action
   */
  private async executeNotification(instance: WorkflowInstance, step: WorkflowStep): Promise<void> {
    const action = step.action;
    // Would integrate with notification service
    console.log(`Sending ${action.notificationType} notification: ${action.template}`);
  }

  /**
   * Execute gateway (decision point)
   */
  private async executeGateway(instance: WorkflowInstance, step: WorkflowStep): Promise<void> {
    const action = step.action;
    if (!action.branches) return;

    // Evaluate branch conditions
    for (const branch of action.branches) {
      const conditionMet = this.evaluateCondition(branch.condition, instance.variables);
      if (conditionMet) {
        instance.currentStepId = branch.targetStepId;

        const stepInstance = instance.steps.find(s => s.stepId === step.id);
        if (stepInstance) {
          stepInstance.status = 'completed';
          stepInstance.completedAt = new Date();
          stepInstance.result = { selectedBranch: branch.id };
        }
        return;
      }
    }

    // Default to onSuccess if no branch matched
    if (step.onSuccess) {
      instance.currentStepId = step.onSuccess;
    }
  }

  /**
   * Execute script action
   */
  private async executeScript(instance: WorkflowInstance, step: WorkflowStep): Promise<void> {
    // Would execute script in sandboxed environment
    console.log(`Executing script: ${step.action.script}`);
  }

  /**
   * Execute API call action
   */
  private async executeApiCall(instance: WorkflowInstance, step: WorkflowStep): Promise<void> {
    const action = step.action;
    // Would make actual API call
    console.log(`API call: ${action.method} ${action.endpoint}`);
  }

  /**
   * Get default variable values
   */
  private getDefaultVariables(variables: WorkflowVariable[]): Record<string, unknown> {
    const defaults: Record<string, unknown> = {};
    for (const v of variables) {
      if (v.defaultValue !== undefined) {
        defaults[v.name] = v.defaultValue;
      }
    }
    return defaults;
  }

  /**
   * Check if user matches assignee
   */
  private async checkAssignment(assignee: WorkflowAssignee, userId: string): Promise<boolean> {
    switch (assignee.type) {
      case 'user':
        return assignee.value === userId;
      case 'role':
        // Would check user role
        return true;
      case 'team':
        // Would check team membership
        return true;
      case 'dynamic':
        // Would evaluate dynamic assignment
        return true;
      default:
        return false;
    }
  }

  /**
   * Create task from step
   */
  private createTask(
    instance: WorkflowInstance,
    stepDef: WorkflowStep,
    stepInstance: WorkflowStepInstance
  ): WorkflowTask {
    return {
      id: `task-${instance.id}-${stepDef.id}`,
      instanceId: instance.id,
      stepId: stepDef.id,
      definitionId: instance.definitionId,
      name: stepDef.name,
      description: stepDef.description,
      assignee: stepInstance.assignee || '',
      status: stepInstance.status,
      priority: 'medium',
      dueAt: stepInstance.dueAt,
      instructions: stepDef.action.instructions,
      context: {
        patientId: instance.context.patientId,
        resourceType: instance.context.resourceType,
        resourceId: instance.context.resourceId
      },
      actions: this.getTaskActions(stepDef),
      createdAt: stepInstance.startedAt || new Date(),
      updatedAt: new Date()
    };
  }

  /**
   * Get available actions for task
   */
  private getTaskActions(step: WorkflowStep): WorkflowTask['actions'] {
    if (step.type === 'approval') {
      return [
        { id: 'approve', label: 'Approuver', type: 'approve' },
        { id: 'reject', label: 'Rejeter', type: 'reject', requiresComment: true }
      ];
    }
    return [
      { id: 'complete', label: 'Terminer', type: 'submit' }
    ];
  }

  /**
   * Determine next step based on result
   */
  private determineNextStep(step: WorkflowStep, result: Record<string, unknown>, action: string): string | undefined {
    if (action === 'reject' && step.onFailure) {
      return step.onFailure;
    }
    return step.onSuccess;
  }

  /**
   * Evaluate condition expression
   */
  private evaluateCondition(condition: string, variables: Record<string, unknown>): boolean {
    try {
      // Simple condition evaluation
      // In production, use a proper expression parser
      const func = new Function(...Object.keys(variables), `return ${condition}`);
      return func(...Object.values(variables));
    } catch {
      return false;
    }
  }
}

export const workflowEngineService = new WorkflowEngineService();
