/**
 * TenisPro Error Handling System
 * 
 * Defines application-specific errors for the tennis equipment order management system.
 * Provides structured error handling across Repository, Service, and Router layers.
 */

/**
 * Base error class for TenisPro application
 */
export class AppError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly layer: 'repository' | 'service' | 'router' = 'service',
    public readonly cause?: Error
  ) {
    super(message);
    this.name = 'AppError';
    
    // Maintain proper stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }

  /**
   * Convert error to a plain object for logging/serialization
   */
  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      layer: this.layer,
      stack: this.stack,
      cause: this.cause?.message,
    };
  }
}

/**
 * Error codes organized by domain and layer
 */
export const ErrorCodes = {
  // Order Management Errors
  ORDER: {
    NOT_FOUND: 'ORDER_NOT_FOUND',
    ALREADY_CANCELLED: 'ORDER_ALREADY_CANCELLED',
    CANNOT_BE_MODIFIED: 'ORDER_CANNOT_BE_MODIFIED',
    INVALID_STATUS_TRANSITION: 'ORDER_INVALID_STATUS_TRANSITION',
    ITEMS_REQUIRED: 'ORDER_ITEMS_REQUIRED',
    TOTAL_MISMATCH: 'ORDER_TOTAL_MISMATCH',
    ALREADY_SHIPPED: 'ORDER_ALREADY_SHIPPED',
    ALREADY_DELIVERED: 'ORDER_ALREADY_DELIVERED',
  },

  // Product Management Errors
  PRODUCT: {
    NOT_FOUND: 'PRODUCT_NOT_FOUND',
    OUT_OF_STOCK: 'PRODUCT_OUT_OF_STOCK',
    INSUFFICIENT_INVENTORY: 'PRODUCT_INSUFFICIENT_INVENTORY',
    INACTIVE: 'PRODUCT_INACTIVE',
    INVALID_QUANTITY: 'PRODUCT_INVALID_QUANTITY',
    PRICE_INVALID: 'PRODUCT_PRICE_INVALID',
    CATEGORY_NOT_FOUND: 'PRODUCT_CATEGORY_NOT_FOUND',
  },

  // Customer Management Errors
  CUSTOMER: {
    NOT_FOUND: 'CUSTOMER_NOT_FOUND',
    EMAIL_EXISTS: 'CUSTOMER_EMAIL_EXISTS',
    INVALID_EMAIL: 'CUSTOMER_INVALID_EMAIL',
    INACTIVE: 'CUSTOMER_INACTIVE',
    MISSING_REQUIRED_FIELDS: 'CUSTOMER_MISSING_REQUIRED_FIELDS',
    INVALID_PHONE: 'CUSTOMER_INVALID_PHONE',
  },

  // Notification System Errors (OpenAI Integration)
  NOTIFICATION: {
    FAILED_TO_SEND: 'NOTIFICATION_FAILED_TO_SEND',
    OPENAI_API_ERROR: 'NOTIFICATION_OPENAI_API_ERROR',
    TEMPLATE_NOT_FOUND: 'NOTIFICATION_TEMPLATE_NOT_FOUND',
    INVALID_RECIPIENT: 'NOTIFICATION_INVALID_RECIPIENT',
    RATE_LIMITED: 'NOTIFICATION_RATE_LIMITED',
    GENERATION_FAILED: 'NOTIFICATION_GENERATION_FAILED',
  },

  // Database Layer Errors
  DATABASE: {
    CONNECTION_ERROR: 'DATABASE_CONNECTION_ERROR',
    QUERY_ERROR: 'DATABASE_QUERY_ERROR',
    TRANSACTION_ERROR: 'DATABASE_TRANSACTION_ERROR',
    CONSTRAINT_VIOLATION: 'DATABASE_CONSTRAINT_VIOLATION',
    UNIQUE_CONSTRAINT: 'DATABASE_UNIQUE_CONSTRAINT',
    FOREIGN_KEY_CONSTRAINT: 'DATABASE_FOREIGN_KEY_CONSTRAINT',
    TIMEOUT: 'DATABASE_TIMEOUT',
    MIGRATION_ERROR: 'DATABASE_MIGRATION_ERROR',
  },

  // Validation Errors
  VALIDATION: {
    INVALID_INPUT: 'VALIDATION_INVALID_INPUT',
    REQUIRED_FIELD: 'VALIDATION_REQUIRED_FIELD',
    INVALID_FORMAT: 'VALIDATION_INVALID_FORMAT',
    OUT_OF_RANGE: 'VALIDATION_OUT_OF_RANGE',
    INVALID_ENUM: 'VALIDATION_INVALID_ENUM',
    SCHEMA_ERROR: 'VALIDATION_SCHEMA_ERROR',
  },

  // Authentication & Authorization (for future implementation)
  AUTH: {
    UNAUTHORIZED: 'AUTH_UNAUTHORIZED',
    FORBIDDEN: 'AUTH_FORBIDDEN',
    SESSION_EXPIRED: 'AUTH_SESSION_EXPIRED',
    INVALID_TOKEN: 'AUTH_INVALID_TOKEN',
  },

  // System Level Errors
  SYSTEM: {
    INTERNAL_ERROR: 'SYSTEM_INTERNAL_ERROR',
    SERVICE_UNAVAILABLE: 'SYSTEM_SERVICE_UNAVAILABLE',
    CONFIGURATION_ERROR: 'SYSTEM_CONFIGURATION_ERROR',
    EXTERNAL_SERVICE_ERROR: 'SYSTEM_EXTERNAL_SERVICE_ERROR',
    NETWORK_ERROR: 'SYSTEM_NETWORK_ERROR',
  },
} as const;

/**
 * Helper functions to create specific error types
 */
export const createError = {
  // Order errors
  orderNotFound: (orderId?: string) => new AppError(
    ErrorCodes.ORDER.NOT_FOUND,
    `Order ${orderId ? `with ID ${orderId} ` : ''}not found`,
    'service'
  ),

  orderAlreadyCancelled: (orderId: string) => new AppError(
    ErrorCodes.ORDER.ALREADY_CANCELLED,
    `Order ${orderId} is already cancelled and cannot be modified`,
    'service'
  ),

  invalidStatusTransition: (from: string, to: string) => new AppError(
    ErrorCodes.ORDER.INVALID_STATUS_TRANSITION,
    `Cannot transition order status from ${from} to ${to}`,
    'service'
  ),

  // Product errors
  productNotFound: (productId?: string) => new AppError(
    ErrorCodes.PRODUCT.NOT_FOUND,
    `Product ${productId ? `with ID ${productId} ` : ''}not found`,
    'service'
  ),

  productOutOfStock: (productName: string) => new AppError(
    ErrorCodes.PRODUCT.OUT_OF_STOCK,
    `Product ${productName} is out of stock`,
    'service'
  ),

  insufficientInventory: (productName: string, available: number, requested: number) => new AppError(
    ErrorCodes.PRODUCT.INSUFFICIENT_INVENTORY,
    `Insufficient inventory for ${productName}. Available: ${available}, Requested: ${requested}`,
    'service'
  ),

  // Customer errors
  customerNotFound: (customerId?: string) => new AppError(
    ErrorCodes.CUSTOMER.NOT_FOUND,
    `Customer ${customerId ? `with ID ${customerId} ` : ''}not found`,
    'service'
  ),

  customerEmailExists: (email: string) => new AppError(
    ErrorCodes.CUSTOMER.EMAIL_EXISTS,
    `Customer with email ${email} already exists`,
    'service'
  ),

  // Notification errors
  notificationFailed: (reason: string) => new AppError(
    ErrorCodes.NOTIFICATION.FAILED_TO_SEND,
    `Failed to send notification: ${reason}`,
    'service'
  ),

  openaiError: (error: string) => new AppError(
    ErrorCodes.NOTIFICATION.OPENAI_API_ERROR,
    `OpenAI API error: ${error}`,
    'service'
  ),

  // Database errors
  databaseError: (operation: string, cause?: Error) => new AppError(
    ErrorCodes.DATABASE.QUERY_ERROR,
    `Database error during ${operation}`,
    'repository',
    cause
  ),

  constraintViolation: (constraint: string) => new AppError(
    ErrorCodes.DATABASE.CONSTRAINT_VIOLATION,
    `Database constraint violation: ${constraint}`,
    'repository'
  ),

  // Validation errors
  validationError: (field: string, reason: string) => new AppError(
    ErrorCodes.VALIDATION.INVALID_INPUT,
    `Validation error for ${field}: ${reason}`,
    'router'
  ),

  requiredField: (field: string) => new AppError(
    ErrorCodes.VALIDATION.REQUIRED_FIELD,
    `Required field missing: ${field}`,
    'router'
  ),

  // System errors
  internalError: (message: string, cause?: Error) => new AppError(
    ErrorCodes.SYSTEM.INTERNAL_ERROR,
    message,
    'service',
    cause
  ),
};

/**
 * Type definitions for error codes
 */
export type OrderErrorCode = typeof ErrorCodes.ORDER[keyof typeof ErrorCodes.ORDER];
export type ProductErrorCode = typeof ErrorCodes.PRODUCT[keyof typeof ErrorCodes.PRODUCT];
export type CustomerErrorCode = typeof ErrorCodes.CUSTOMER[keyof typeof ErrorCodes.CUSTOMER];
export type NotificationErrorCode = typeof ErrorCodes.NOTIFICATION[keyof typeof ErrorCodes.NOTIFICATION];
export type DatabaseErrorCode = typeof ErrorCodes.DATABASE[keyof typeof ErrorCodes.DATABASE];
export type ValidationErrorCode = typeof ErrorCodes.VALIDATION[keyof typeof ErrorCodes.VALIDATION];
export type AuthErrorCode = typeof ErrorCodes.AUTH[keyof typeof ErrorCodes.AUTH];
export type SystemErrorCode = typeof ErrorCodes.SYSTEM[keyof typeof ErrorCodes.SYSTEM];

export type AppErrorCode = 
  | OrderErrorCode 
  | ProductErrorCode 
  | CustomerErrorCode 
  | NotificationErrorCode 
  | DatabaseErrorCode 
  | ValidationErrorCode 
  | AuthErrorCode 
  | SystemErrorCode;
