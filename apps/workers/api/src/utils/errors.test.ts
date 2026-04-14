import { describe, it, expect } from 'vitest';
import {
  AppError,
  BadRequestError,
  ValidationError,
  UnauthorizedError,
  InvalidTokenError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  AlreadyExistsError,
  RateLimitError,
  InternalServerError,
  DatabaseError,
  ServiceUnavailableError,
  ErrorCodes,
  isAppError,
  wrapError,
  createValidationError,
  createNotFoundError,
} from './errors';

describe('AppError', () => {
  it('sets statusCode, code, and message', () => {
    const err = new AppError(ErrorCodes.BAD_REQUEST, 'bad', 400);
    expect(err.statusCode).toBe(400);
    expect(err.code).toBe('BAD_REQUEST');
    expect(err.message).toBe('bad');
  });

  it('has name set to AppError', () => {
    const err = new AppError(ErrorCodes.BAD_REQUEST, 'bad', 400);
    expect(err.name).toBe('AppError');
  });

  it('is an instance of Error', () => {
    const err = new AppError(ErrorCodes.BAD_REQUEST, 'bad', 400);
    expect(err).toBeInstanceOf(Error);
  });

  it('has a stack trace', () => {
    const err = new AppError(ErrorCodes.BAD_REQUEST, 'bad', 400);
    expect(err.stack).toBeDefined();
  });

  it('isOperational defaults to true', () => {
    const err = new AppError(ErrorCodes.BAD_REQUEST, 'bad', 400);
    expect(err.isOperational).toBe(true);
  });

  it('stores details when provided', () => {
    const details = { field: 'email' };
    const err = new AppError(ErrorCodes.BAD_REQUEST, 'bad', 400, details);
    expect(err.details).toEqual(details);
  });

  it('toJSON returns proper format without details', () => {
    const err = new AppError(ErrorCodes.BAD_REQUEST, 'bad', 400);
    expect(err.toJSON()).toEqual({
      success: false,
      error: { code: 'BAD_REQUEST', message: 'bad' },
    });
  });

  it('toJSON includes details when present', () => {
    const err = new AppError(ErrorCodes.BAD_REQUEST, 'bad', 400, { key: 'val' });
    expect(err.toJSON()).toEqual({
      success: false,
      error: { code: 'BAD_REQUEST', message: 'bad', details: { key: 'val' } },
    });
  });
});

describe('BadRequestError', () => {
  it('has statusCode 400 and default message', () => {
    const err = new BadRequestError();
    expect(err.statusCode).toBe(400);
    expect(err.message).toBe('Bad request');
    expect(err.code).toBe('BAD_REQUEST');
    expect(err.name).toBe('BadRequestError');
  });

  it('accepts a custom message', () => {
    const err = new BadRequestError('Invalid input');
    expect(err.message).toBe('Invalid input');
  });
});

describe('ValidationError', () => {
  it('has statusCode 400 and default message', () => {
    const err = new ValidationError();
    expect(err.statusCode).toBe(400);
    expect(err.message).toBe('Validation failed');
    expect(err.code).toBe('VALIDATION_ERROR');
    expect(err.name).toBe('ValidationError');
  });

  it('accepts a custom message', () => {
    const err = new ValidationError('Name is required');
    expect(err.message).toBe('Name is required');
  });
});

describe('UnauthorizedError', () => {
  it('has statusCode 401 and default message', () => {
    const err = new UnauthorizedError();
    expect(err.statusCode).toBe(401);
    expect(err.message).toBe('Authentication required');
    expect(err.code).toBe('UNAUTHORIZED');
    expect(err.name).toBe('UnauthorizedError');
  });
});

describe('InvalidTokenError', () => {
  it('has statusCode 401 and default message', () => {
    const err = new InvalidTokenError();
    expect(err.statusCode).toBe(401);
    expect(err.message).toBe('Invalid or expired token');
    expect(err.code).toBe('INVALID_TOKEN');
    expect(err.name).toBe('InvalidTokenError');
  });
});

describe('ForbiddenError', () => {
  it('has statusCode 403 and default message', () => {
    const err = new ForbiddenError();
    expect(err.statusCode).toBe(403);
    expect(err.message).toBe('Access denied');
    expect(err.code).toBe('FORBIDDEN');
    expect(err.name).toBe('ForbiddenError');
  });
});

describe('NotFoundError', () => {
  it('has statusCode 404 and default message', () => {
    const err = new NotFoundError();
    expect(err.statusCode).toBe(404);
    expect(err.message).toBe('Resource not found');
    expect(err.code).toBe('NOT_FOUND');
    expect(err.name).toBe('NotFoundError');
  });

  it('uses custom resource name in message', () => {
    const err = new NotFoundError('User');
    expect(err.message).toBe('User not found');
  });
});

describe('ConflictError', () => {
  it('has statusCode 409 and default message', () => {
    const err = new ConflictError();
    expect(err.statusCode).toBe(409);
    expect(err.message).toBe('Resource conflict');
    expect(err.code).toBe('CONFLICT');
    expect(err.name).toBe('ConflictError');
  });
});

describe('AlreadyExistsError', () => {
  it('has statusCode 409 and default message', () => {
    const err = new AlreadyExistsError();
    expect(err.statusCode).toBe(409);
    expect(err.message).toBe('Resource already exists');
    expect(err.code).toBe('ALREADY_EXISTS');
    expect(err.name).toBe('AlreadyExistsError');
  });

  it('uses custom resource name in message', () => {
    const err = new AlreadyExistsError('Email');
    expect(err.message).toBe('Email already exists');
  });
});

describe('RateLimitError', () => {
  it('has statusCode 429 and default message', () => {
    const err = new RateLimitError();
    expect(err.statusCode).toBe(429);
    expect(err.message).toBe('Too many requests');
    expect(err.code).toBe('RATE_LIMIT_EXCEEDED');
    expect(err.name).toBe('RateLimitError');
  });
});

describe('InternalServerError', () => {
  it('has statusCode 500 and default message', () => {
    const err = new InternalServerError();
    expect(err.statusCode).toBe(500);
    expect(err.message).toBe('An unexpected error occurred');
    expect(err.code).toBe('INTERNAL_SERVER_ERROR');
    expect(err.name).toBe('InternalServerError');
  });
});

describe('DatabaseError', () => {
  it('has statusCode 500 and default message', () => {
    const err = new DatabaseError();
    expect(err.statusCode).toBe(500);
    expect(err.message).toBe('Database operation failed');
    expect(err.code).toBe('DATABASE_ERROR');
    expect(err.name).toBe('DatabaseError');
  });
});

describe('ServiceUnavailableError', () => {
  it('has statusCode 503 and default message', () => {
    const err = new ServiceUnavailableError();
    expect(err.statusCode).toBe(503);
    expect(err.message).toBe('Service temporarily unavailable');
    expect(err.code).toBe('SERVICE_UNAVAILABLE');
    expect(err.name).toBe('ServiceUnavailableError');
  });
});

describe('instanceof checks', () => {
  it('NotFoundError is instanceof AppError', () => {
    expect(new NotFoundError()).toBeInstanceOf(AppError);
  });

  it('NotFoundError is instanceof Error', () => {
    expect(new NotFoundError()).toBeInstanceOf(Error);
  });

  it('all subclasses are instanceof AppError', () => {
    const errors = [
      new BadRequestError(),
      new ValidationError(),
      new UnauthorizedError(),
      new InvalidTokenError(),
      new ForbiddenError(),
      new NotFoundError(),
      new ConflictError(),
      new AlreadyExistsError(),
      new RateLimitError(),
      new InternalServerError(),
      new DatabaseError(),
      new ServiceUnavailableError(),
    ];
    for (const err of errors) {
      expect(err).toBeInstanceOf(AppError);
      expect(err).toBeInstanceOf(Error);
    }
  });
});

describe('isAppError', () => {
  it('returns true for AppError instances', () => {
    expect(isAppError(new AppError(ErrorCodes.BAD_REQUEST, 'x', 400))).toBe(true);
    expect(isAppError(new NotFoundError())).toBe(true);
  });

  it('returns false for plain errors and non-errors', () => {
    expect(isAppError(new Error('plain'))).toBe(false);
    expect(isAppError('string')).toBe(false);
    expect(isAppError(null)).toBe(false);
    expect(isAppError(undefined)).toBe(false);
  });
});

describe('wrapError', () => {
  it('returns AppError unchanged', () => {
    const original = new NotFoundError('User');
    expect(wrapError(original)).toBe(original);
  });

  it('wraps "not found" errors as NotFoundError', () => {
    const result = wrapError(new Error('Item not found'));
    expect(result).toBeInstanceOf(NotFoundError);
    expect(result.statusCode).toBe(404);
  });

  it('wraps "unauthorized" errors as UnauthorizedError', () => {
    const result = wrapError(new Error('unauthorized access'));
    expect(result).toBeInstanceOf(UnauthorizedError);
    expect(result.statusCode).toBe(401);
  });

  it('wraps "forbidden" errors as ForbiddenError', () => {
    const result = wrapError(new Error('forbidden action'));
    expect(result).toBeInstanceOf(ForbiddenError);
    expect(result.statusCode).toBe(403);
  });

  it('wraps "validation" errors as ValidationError', () => {
    const result = wrapError(new Error('validation failed'));
    expect(result).toBeInstanceOf(ValidationError);
    expect(result.statusCode).toBe(400);
  });

  it('wraps "already exists" errors as AlreadyExistsError', () => {
    const result = wrapError(new Error('record already exists'));
    expect(result).toBeInstanceOf(AlreadyExistsError);
    expect(result.statusCode).toBe(409);
  });

  it('wraps unknown Error as InternalServerError', () => {
    const result = wrapError(new Error('something broke'));
    expect(result).toBeInstanceOf(InternalServerError);
    expect(result.statusCode).toBe(500);
  });

  it('wraps non-Error values as InternalServerError', () => {
    const result = wrapError('oops');
    expect(result).toBeInstanceOf(InternalServerError);
    expect(result.message).toBe('An unexpected error occurred');
  });
});

describe('createValidationError', () => {
  it('creates a ValidationError with field names in message', () => {
    const err = createValidationError({ email: 'required', name: 'too short' });
    expect(err).toBeInstanceOf(ValidationError);
    expect(err.message).toBe('Validation failed for: email, name');
    expect(err.details).toEqual({ fields: { email: 'required', name: 'too short' } });
  });
});

describe('createNotFoundError', () => {
  it('creates a NotFoundError with resource type', () => {
    const err = createNotFoundError('User');
    expect(err).toBeInstanceOf(NotFoundError);
    expect(err.message).toBe('User not found');
  });

  it('includes identifier in details when provided', () => {
    const err = createNotFoundError('User', '123');
    expect(err.details).toEqual({ id: '123' });
  });

  it('has no details when identifier is omitted', () => {
    const err = createNotFoundError('User');
    expect(err.details).toBeUndefined();
  });
});
