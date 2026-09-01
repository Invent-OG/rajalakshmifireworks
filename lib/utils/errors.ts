/**
 * Centralized error types for the application.
 * These provide user-friendly messages while keeping internal details for logging.
 */

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly userMessage: string;
  public readonly isOperational: boolean;

  constructor(
    message: string, // Internal message for logging
    statusCode: number = 500,
    userMessage?: string, // User-facing message
    isOperational: boolean = true
  ) {
    super(message);
    this.statusCode = statusCode;
    this.userMessage = userMessage || 'Something went wrong. Please try again.';
    this.isOperational = isOperational;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, userMessage?: string) {
    super(message, 400, userMessage || message);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, 404, `${resource} not found.`);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401, 'Please log in to continue.');
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super(message, 403, 'You do not have permission to perform this action.');
  }
}

export class ConflictError extends AppError {
  constructor(message: string, userMessage?: string) {
    super(message, 409, userMessage || message);
  }
}

export class InsufficientStockError extends AppError {
  constructor(productName: string, available: number) {
    super(
      `Insufficient stock for ${productName}: only ${available} available`,
      400,
      `Sorry, only ${available} units of "${productName}" are available.`
    );
  }
}

export class MinimumOrderError extends AppError {
  constructor(minAmount: number, currentAmount: number) {
    super(
      `Order total ₹${currentAmount} below minimum ₹${minAmount}`,
      400,
      `Minimum order value is ₹${minAmount}. Please add ₹${minAmount - currentAmount} more.`
    );
  }
}

export class DuplicateOrderError extends AppError {
  constructor(invoiceNumber: string) {
    super(
      `Duplicate order detected: ${invoiceNumber}`,
      409,
      'This order has already been placed.'
    );
  }
}

/**
 * Convert an error into an API-safe response
 */
export function toErrorResponse(error: unknown): { message: string; statusCode: number } {
  if (error instanceof AppError) {
    return { message: error.userMessage, statusCode: error.statusCode };
  }
  console.error('Unexpected error:', error);
  return { message: 'Something went wrong. Please try again.', statusCode: 500 };
}
