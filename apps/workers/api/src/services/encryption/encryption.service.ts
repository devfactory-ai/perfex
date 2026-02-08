/**
 * Healthcare Data Encryption Service
 * Service de chiffrement des données de santé
 * Conforme HIPAA/GDPR avec chiffrement AES-256-GCM
 */

// Types
export interface EncryptionKey {
  id: string;
  version: number;
  algorithm: 'AES-GCM' | 'AES-CBC';
  keyLength: 128 | 192 | 256;
  purpose: 'data' | 'key' | 'backup';
  status: 'active' | 'inactive' | 'destroyed';
  createdAt: string;
  rotatedAt?: string;
  expiresAt?: string;
  metadata: {
    createdBy: string;
    organizationId: string;
    description?: string;
  };
}

export interface EncryptedData {
  ciphertext: string;
  iv: string;
  authTag: string;
  keyId: string;
  keyVersion: number;
  algorithm: string;
  encryptedAt: string;
}

export interface EncryptedField {
  fieldPath: string;
  encryptedData: EncryptedData;
  dataType: 'string' | 'object' | 'array' | 'number';
}

export interface DataMaskingRule {
  id: string;
  name: string;
  fieldPattern: string;
  maskType: 'full' | 'partial' | 'hash' | 'tokenize' | 'redact';
  maskConfig: {
    visibleChars?: number;
    maskChar?: string;
    prefix?: string;
    suffix?: string;
  };
  appliesTo: string[];
  isActive: boolean;
}

export interface AccessLog {
  id: string;
  timestamp: string;
  userId: string;
  action: 'encrypt' | 'decrypt' | 'key_create' | 'key_rotate' | 'key_destroy' | 'mask' | 'unmask';
  resourceType: string;
  resourceId: string;
  ipAddress?: string;
  userAgent?: string;
  success: boolean;
  errorMessage?: string;
  metadata?: Record<string, unknown>;
}

export interface TokenizedData {
  token: string;
  tokenType: 'patient_id' | 'ssn' | 'mrn' | 'credit_card' | 'custom';
  originalFormat: string;
  createdAt: string;
  expiresAt?: string;
}

export interface KeyRotationPolicy {
  id: string;
  name: string;
  rotationIntervalDays: number;
  maxKeyAge: number;
  retentionPeriod: number;
  autoRotate: boolean;
  notifyBeforeRotation: number;
  appliesTo: string[];
}

// Simulated secure key storage
const keyVault: Map<string, { key: CryptoKey; metadata: EncryptionKey }> = new Map();
const tokenVault: Map<string, { originalValue: string; metadata: TokenizedData }> = new Map();
const accessLogs: AccessLog[] = [];

// Default masking rules
const defaultMaskingRules: DataMaskingRule[] = [
  {
    id: 'mask-001',
    name: 'SSN Masking',
    fieldPattern: '*.ssn',
    maskType: 'partial',
    maskConfig: { visibleChars: 4, maskChar: '*', prefix: '***-**-' },
    appliesTo: ['patient', 'employee'],
    isActive: true
  },
  {
    id: 'mask-002',
    name: 'Phone Number Masking',
    fieldPattern: '*.phone',
    maskType: 'partial',
    maskConfig: { visibleChars: 4, maskChar: '*', prefix: '***-***-' },
    appliesTo: ['patient', 'contact'],
    isActive: true
  },
  {
    id: 'mask-003',
    name: 'Email Masking',
    fieldPattern: '*.email',
    maskType: 'partial',
    maskConfig: { visibleChars: 3, maskChar: '*' },
    appliesTo: ['patient', 'user'],
    isActive: true
  },
  {
    id: 'mask-004',
    name: 'Credit Card Masking',
    fieldPattern: '*.creditCard',
    maskType: 'partial',
    maskConfig: { visibleChars: 4, maskChar: '*', prefix: '**** **** **** ' },
    appliesTo: ['payment', 'billing'],
    isActive: true
  },
  {
    id: 'mask-005',
    name: 'Date of Birth Masking',
    fieldPattern: '*.dateOfBirth',
    maskType: 'partial',
    maskConfig: { visibleChars: 4, maskChar: '*', suffix: '-**-**' },
    appliesTo: ['patient'],
    isActive: true
  }
];

// Key rotation policies
const rotationPolicies: KeyRotationPolicy[] = [
  {
    id: 'policy-001',
    name: 'Standard PHI Encryption',
    rotationIntervalDays: 90,
    maxKeyAge: 365,
    retentionPeriod: 730,
    autoRotate: true,
    notifyBeforeRotation: 14,
    appliesTo: ['patient_data', 'clinical_notes']
  },
  {
    id: 'policy-002',
    name: 'High Security Financial',
    rotationIntervalDays: 30,
    maxKeyAge: 180,
    retentionPeriod: 365,
    autoRotate: true,
    notifyBeforeRotation: 7,
    appliesTo: ['financial_data', 'billing']
  }
];

export class EncryptionService {

  // Generate a new encryption key
  async generateKey(options: {
    purpose: EncryptionKey['purpose'];
    organizationId: string;
    createdBy: string;
    description?: string;
    expiresInDays?: number;
  }): Promise<EncryptionKey> {
    // Generate AES-256-GCM key using Web Crypto API
    const cryptoKey = await crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    ) as CryptoKey;

    const keyId = `key-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();

    const keyMetadata: EncryptionKey = {
      id: keyId,
      version: 1,
      algorithm: 'AES-GCM',
      keyLength: 256,
      purpose: options.purpose,
      status: 'active',
      createdAt: now.toISOString(),
      expiresAt: options.expiresInDays
        ? new Date(now.getTime() + options.expiresInDays * 24 * 60 * 60 * 1000).toISOString()
        : undefined,
      metadata: {
        createdBy: options.createdBy,
        organizationId: options.organizationId,
        description: options.description
      }
    };

    keyVault.set(keyId, { key: cryptoKey, metadata: keyMetadata });

    // Log key creation
    this.logAccess({
      userId: options.createdBy,
      action: 'key_create',
      resourceType: 'encryption_key',
      resourceId: keyId,
      success: true,
      metadata: { purpose: options.purpose }
    });

    return keyMetadata;
  }

  // Encrypt data using AES-256-GCM
  async encrypt(data: string | object, keyId: string, userId: string): Promise<EncryptedData> {
    const keyEntry = keyVault.get(keyId);
    if (!keyEntry) {
      this.logAccess({
        userId,
        action: 'encrypt',
        resourceType: 'data',
        resourceId: 'unknown',
        success: false,
        errorMessage: 'Key not found'
      });
      throw new Error('Encryption key not found');
    }

    if (keyEntry.metadata.status !== 'active') {
      throw new Error(`Key ${keyId} is not active`);
    }

    const plaintext = typeof data === 'string' ? data : JSON.stringify(data);
    const encoder = new TextEncoder();
    const plaintextBytes = encoder.encode(plaintext);

    // Generate random IV (96 bits for GCM)
    const iv = crypto.getRandomValues(new Uint8Array(12));

    // Encrypt
    const ciphertextBytes = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      keyEntry.key,
      plaintextBytes
    );

    // Extract auth tag (last 16 bytes in GCM)
    const ciphertext = new Uint8Array(ciphertextBytes);
    const authTag = ciphertext.slice(-16);
    const encryptedContent = ciphertext.slice(0, -16);

    const result: EncryptedData = {
      ciphertext: this.arrayBufferToBase64(encryptedContent),
      iv: this.arrayBufferToBase64(iv),
      authTag: this.arrayBufferToBase64(authTag),
      keyId,
      keyVersion: keyEntry.metadata.version,
      algorithm: 'AES-256-GCM',
      encryptedAt: new Date().toISOString()
    };

    this.logAccess({
      userId,
      action: 'encrypt',
      resourceType: 'data',
      resourceId: keyId,
      success: true
    });

    return result;
  }

  // Decrypt data
  async decrypt(encryptedData: EncryptedData, userId: string): Promise<string> {
    const keyEntry = keyVault.get(encryptedData.keyId);
    if (!keyEntry) {
      this.logAccess({
        userId,
        action: 'decrypt',
        resourceType: 'data',
        resourceId: encryptedData.keyId,
        success: false,
        errorMessage: 'Key not found'
      });
      throw new Error('Decryption key not found');
    }

    const iv = this.base64ToArrayBuffer(encryptedData.iv);
    const ciphertext = this.base64ToArrayBuffer(encryptedData.ciphertext);
    const authTag = this.base64ToArrayBuffer(encryptedData.authTag);

    // Combine ciphertext and auth tag
    const combined = new Uint8Array(ciphertext.byteLength + authTag.byteLength);
    combined.set(new Uint8Array(ciphertext), 0);
    combined.set(new Uint8Array(authTag), ciphertext.byteLength);

    try {
      const decryptedBytes = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: new Uint8Array(iv) },
        keyEntry.key,
        combined
      );

      const decoder = new TextDecoder();
      const plaintext = decoder.decode(decryptedBytes);

      this.logAccess({
        userId,
        action: 'decrypt',
        resourceType: 'data',
        resourceId: encryptedData.keyId,
        success: true
      });

      return plaintext;
    } catch {
      this.logAccess({
        userId,
        action: 'decrypt',
        resourceType: 'data',
        resourceId: encryptedData.keyId,
        success: false,
        errorMessage: 'Decryption failed - possible tampering'
      });
      throw new Error('Decryption failed - data may have been tampered with');
    }
  }

  // Encrypt specific fields in an object
  async encryptFields(
    data: Record<string, unknown>,
    fieldPaths: string[],
    keyId: string,
    userId: string
  ): Promise<{ data: Record<string, unknown>; encryptedFields: EncryptedField[] }> {
    const result = { ...data };
    const encryptedFields: EncryptedField[] = [];

    for (const fieldPath of fieldPaths) {
      const value = this.getNestedValue(data, fieldPath);
      if (value !== undefined && value !== null) {
        const encrypted = await this.encrypt(value as string | object, keyId, userId);
        encryptedFields.push({
          fieldPath,
          encryptedData: encrypted,
          dataType: Array.isArray(value) ? 'array' : typeof value as 'string' | 'object' | 'number'
        });
        this.setNestedValue(result, fieldPath, `[ENCRYPTED:${encrypted.keyId}]`);
      }
    }

    return { data: result, encryptedFields };
  }

  // Decrypt specific fields
  async decryptFields(
    data: Record<string, unknown>,
    encryptedFields: EncryptedField[],
    userId: string
  ): Promise<Record<string, unknown>> {
    const result = { ...data };

    for (const field of encryptedFields) {
      const decrypted = await this.decrypt(field.encryptedData, userId);
      let value: unknown = decrypted;

      if (field.dataType === 'object' || field.dataType === 'array') {
        try {
          value = JSON.parse(decrypted);
        } catch {
          value = decrypted;
        }
      } else if (field.dataType === 'number') {
        value = Number(decrypted);
      }

      this.setNestedValue(result, field.fieldPath, value);
    }

    return result;
  }

  // Rotate encryption key
  async rotateKey(oldKeyId: string, rotatedBy: string): Promise<EncryptionKey> {
    const oldKeyEntry = keyVault.get(oldKeyId);
    if (!oldKeyEntry) {
      throw new Error('Key not found');
    }

    // Generate new key
    const cryptoKey = await crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    ) as CryptoKey;

    const newKeyId = `key-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();

    const newKeyMetadata: EncryptionKey = {
      ...oldKeyEntry.metadata,
      id: newKeyId,
      version: oldKeyEntry.metadata.version + 1,
      status: 'active',
      createdAt: now.toISOString(),
      rotatedAt: now.toISOString(),
      metadata: {
        ...oldKeyEntry.metadata.metadata,
        createdBy: rotatedBy
      }
    };

    // Mark old key as inactive
    oldKeyEntry.metadata.status = 'inactive';

    keyVault.set(newKeyId, { key: cryptoKey, metadata: newKeyMetadata });

    this.logAccess({
      userId: rotatedBy,
      action: 'key_rotate',
      resourceType: 'encryption_key',
      resourceId: newKeyId,
      success: true,
      metadata: { previousKeyId: oldKeyId }
    });

    return newKeyMetadata;
  }

  // Destroy key (mark as destroyed, data cannot be recovered)
  async destroyKey(keyId: string, destroyedBy: string): Promise<void> {
    const keyEntry = keyVault.get(keyId);
    if (!keyEntry) {
      throw new Error('Key not found');
    }

    keyEntry.metadata.status = 'destroyed';
    // In production, securely wipe the key material
    keyVault.delete(keyId);

    this.logAccess({
      userId: destroyedBy,
      action: 'key_destroy',
      resourceType: 'encryption_key',
      resourceId: keyId,
      success: true
    });
  }

  // Tokenize sensitive data
  async tokenize(
    value: string,
    tokenType: TokenizedData['tokenType'],
    userId: string,
    expiresInDays?: number
  ): Promise<string> {
    const token = `tok_${tokenType}_${Date.now()}_${Math.random().toString(36).substr(2, 16)}`;
    const now = new Date();

    const tokenData: TokenizedData = {
      token,
      tokenType,
      originalFormat: this.detectFormat(value),
      createdAt: now.toISOString(),
      expiresAt: expiresInDays
        ? new Date(now.getTime() + expiresInDays * 24 * 60 * 60 * 1000).toISOString()
        : undefined
    };

    tokenVault.set(token, { originalValue: value, metadata: tokenData });

    this.logAccess({
      userId,
      action: 'mask',
      resourceType: 'token',
      resourceId: token,
      success: true,
      metadata: { tokenType }
    });

    return token;
  }

  // Detokenize
  async detokenize(token: string, userId: string): Promise<string> {
    const entry = tokenVault.get(token);
    if (!entry) {
      this.logAccess({
        userId,
        action: 'unmask',
        resourceType: 'token',
        resourceId: token,
        success: false,
        errorMessage: 'Token not found'
      });
      throw new Error('Token not found');
    }

    if (entry.metadata.expiresAt && new Date(entry.metadata.expiresAt) < new Date()) {
      throw new Error('Token has expired');
    }

    this.logAccess({
      userId,
      action: 'unmask',
      resourceType: 'token',
      resourceId: token,
      success: true
    });

    return entry.originalValue;
  }

  // Apply data masking
  maskData(value: string, rule: DataMaskingRule): string {
    switch (rule.maskType) {
      case 'full':
        return rule.maskConfig.maskChar?.repeat(value.length) || '********';

      case 'partial': {
        const visibleChars = rule.maskConfig.visibleChars || 4;
        const maskChar = rule.maskConfig.maskChar || '*';
        const prefix = rule.maskConfig.prefix || '';
        const suffix = rule.maskConfig.suffix || '';

        if (prefix || suffix) {
          return prefix + value.slice(-visibleChars) + suffix;
        }

        const masked = maskChar.repeat(Math.max(0, value.length - visibleChars));
        return masked + value.slice(-visibleChars);
      }

      case 'hash':
        return this.hashValue(value);

      case 'redact':
        return '[REDACTED]';

      case 'tokenize':
        return `[TOKEN:${value.slice(0, 4)}...]`;

      default:
        return value;
    }
  }

  // Get masking rules
  getMaskingRules(entityType?: string): DataMaskingRule[] {
    if (entityType) {
      return defaultMaskingRules.filter(r =>
        r.isActive && r.appliesTo.includes(entityType)
      );
    }
    return defaultMaskingRules.filter(r => r.isActive);
  }

  // Apply masking to object based on rules
  applyMasking(
    data: Record<string, unknown>,
    entityType: string
  ): Record<string, unknown> {
    const rules = this.getMaskingRules(entityType);
    const result = { ...data };

    for (const rule of rules) {
      const fieldName = rule.fieldPattern.split('.').pop()!;
      if (fieldName in result && typeof result[fieldName] === 'string') {
        result[fieldName] = this.maskData(result[fieldName] as string, rule);
      }
    }

    return result;
  }

  // Get key rotation policies
  getRotationPolicies(): KeyRotationPolicy[] {
    return rotationPolicies;
  }

  // Check keys needing rotation
  async checkKeysForRotation(): Promise<{ keyId: string; daysUntilRotation: number }[]> {
    const keysNeedingRotation: { keyId: string; daysUntilRotation: number }[] = [];
    const now = new Date();

    for (const [keyId, entry] of keyVault.entries()) {
      if (entry.metadata.status !== 'active') continue;

      const policy = rotationPolicies.find(p =>
        p.appliesTo.includes(entry.metadata.purpose)
      );

      if (!policy) continue;

      const createdAt = new Date(entry.metadata.rotatedAt || entry.metadata.createdAt);
      const daysSinceCreation = Math.floor(
        (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24)
      );
      const daysUntilRotation = policy.rotationIntervalDays - daysSinceCreation;

      if (daysUntilRotation <= policy.notifyBeforeRotation) {
        keysNeedingRotation.push({ keyId, daysUntilRotation });
      }
    }

    return keysNeedingRotation;
  }

  // Get access logs
  getAccessLogs(options: {
    userId?: string;
    action?: AccessLog['action'];
    resourceType?: string;
    fromDate?: string;
    toDate?: string;
    limit?: number;
  }): AccessLog[] {
    let logs = [...accessLogs];

    if (options.userId) {
      logs = logs.filter(l => l.userId === options.userId);
    }

    if (options.action) {
      logs = logs.filter(l => l.action === options.action);
    }

    if (options.resourceType) {
      logs = logs.filter(l => l.resourceType === options.resourceType);
    }

    if (options.fromDate) {
      logs = logs.filter(l => l.timestamp >= options.fromDate!);
    }

    if (options.toDate) {
      logs = logs.filter(l => l.timestamp <= options.toDate!);
    }

    logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return logs.slice(0, options.limit || 100);
  }

  // Get active keys
  getActiveKeys(organizationId?: string): EncryptionKey[] {
    const keys: EncryptionKey[] = [];
    for (const [, entry] of keyVault.entries()) {
      if (entry.metadata.status === 'active') {
        if (!organizationId || entry.metadata.metadata.organizationId === organizationId) {
          keys.push(entry.metadata);
        }
      }
    }
    return keys;
  }

  // Helper methods
  private arrayBufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
    const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }

  private getNestedValue(obj: Record<string, unknown>, path: string): unknown {
    return path.split('.').reduce((current: unknown, key) => {
      return current && typeof current === 'object' ? (current as Record<string, unknown>)[key] : undefined;
    }, obj);
  }

  private setNestedValue(obj: Record<string, unknown>, path: string, value: unknown): void {
    const keys = path.split('.');
    const lastKey = keys.pop()!;
    const target = keys.reduce((current: unknown, key) => {
      if (current && typeof current === 'object') {
        return (current as Record<string, unknown>)[key];
      }
      return undefined;
    }, obj) as Record<string, unknown> | undefined;

    if (target) {
      target[lastKey] = value;
    }
  }

  private detectFormat(value: string): string {
    if (/^\d{3}-\d{2}-\d{4}$/.test(value)) return 'SSN';
    if (/^\d{16}$/.test(value.replace(/\s/g, ''))) return 'CREDIT_CARD';
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'EMAIL';
    if (/^\+?\d{10,15}$/.test(value.replace(/[\s-]/g, ''))) return 'PHONE';
    return 'STRING';
  }

  private hashValue(value: string): string {
    // Simple hash for demonstration - in production use proper crypto hash
    let hash = 0;
    for (let i = 0; i < value.length; i++) {
      const char = value.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return `HASH_${Math.abs(hash).toString(16).padStart(8, '0')}`;
  }

  private logAccess(log: Omit<AccessLog, 'id' | 'timestamp'>): void {
    accessLogs.push({
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      ...log
    });
  }
}
