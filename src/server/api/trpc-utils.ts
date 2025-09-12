/**
 * tRPC utility functions for TenisPro
 * Contains helper functions for working with the Result pattern in tRPC routers
 */

import { TRPCError } from '@trpc/server';
import { Result } from '../../lib/result';
import { AppError } from '../../lib/errors';

/**
 * Unwraps a Result and throws a TRPCError if it contains an error
 * This allows for clean router implementations following the Result pattern
 * 
 * @param result - The Result to unwrap
 * @returns The data from the Result if successful
 * @throws TRPCError if the Result contains an error
 */
export function unwrap<T>(result: Result<T, AppError>): T {
  if (!result.success) {
    throw convertAppErrorToTRPCError((result as { success: false; error: AppError }).error);
  }
  return result.data;
}

/**
 * Converts an AppError to a TRPCError with appropriate HTTP status codes
 * Maps application-specific error codes to tRPC error codes
 * 
 * @param error - The AppError to convert
 * @returns A TRPCError with appropriate code and message
 */
export function convertAppErrorToTRPCError(error: AppError): TRPCError {
  const codeMap: Record<string, TRPCError['code']> = {
    // Order Management Errors
    'ORDER_NOT_FOUND': 'NOT_FOUND',
    'ORDER_ALREADY_CANCELLED': 'CONFLICT',
    'ORDER_CANNOT_BE_MODIFIED': 'CONFLICT',
    'ORDER_INVALID_STATUS_TRANSITION': 'CONFLICT',
    'ORDER_ITEMS_REQUIRED': 'BAD_REQUEST',
    'ORDER_TOTAL_MISMATCH': 'BAD_REQUEST',
    'ORDER_ALREADY_SHIPPED': 'CONFLICT',
    'ORDER_ALREADY_DELIVERED': 'CONFLICT',

    // Product Management Errors
    'PRODUCT_NOT_FOUND': 'NOT_FOUND',
    'PRODUCT_OUT_OF_STOCK': 'CONFLICT',
    'PRODUCT_INSUFFICIENT_INVENTORY': 'CONFLICT',
    'PRODUCT_INACTIVE': 'CONFLICT',
    'PRODUCT_INVALID_QUANTITY': 'BAD_REQUEST',
    'PRODUCT_PRICE_INVALID': 'BAD_REQUEST',
    'PRODUCT_CATEGORY_NOT_FOUND': 'NOT_FOUND',

    // Customer Management Errors
    'CUSTOMER_NOT_FOUND': 'NOT_FOUND',
    'CUSTOMER_EMAIL_EXISTS': 'CONFLICT',
    'CUSTOMER_INVALID_EMAIL': 'BAD_REQUEST',
    'CUSTOMER_INACTIVE': 'CONFLICT',
    'CUSTOMER_MISSING_REQUIRED_FIELDS': 'BAD_REQUEST',
    'CUSTOMER_INVALID_PHONE': 'BAD_REQUEST',

    // Notification System Errors
    'NOTIFICATION_FAILED_TO_SEND': 'INTERNAL_SERVER_ERROR',
    'NOTIFICATION_OPENAI_API_ERROR': 'INTERNAL_SERVER_ERROR',
    'NOTIFICATION_TEMPLATE_NOT_FOUND': 'NOT_FOUND',
    'NOTIFICATION_INVALID_RECIPIENT': 'BAD_REQUEST',
    'NOTIFICATION_RATE_LIMITED': 'TOO_MANY_REQUESTS',
    'NOTIFICATION_GENERATION_FAILED': 'INTERNAL_SERVER_ERROR',

    // Database Layer Errors
    'DATABASE_CONNECTION_ERROR': 'INTERNAL_SERVER_ERROR',
    'DATABASE_QUERY_ERROR': 'INTERNAL_SERVER_ERROR',
    'DATABASE_TRANSACTION_ERROR': 'INTERNAL_SERVER_ERROR',
    'DATABASE_CONSTRAINT_VIOLATION': 'CONFLICT',
    'DATABASE_UNIQUE_CONSTRAINT': 'CONFLICT',
    'DATABASE_FOREIGN_KEY_CONSTRAINT': 'CONFLICT',
    'DATABASE_TIMEOUT': 'TIMEOUT',
    'DATABASE_MIGRATION_ERROR': 'INTERNAL_SERVER_ERROR',

    // Validation Errors
    'VALIDATION_INVALID_INPUT': 'BAD_REQUEST',
    'VALIDATION_REQUIRED_FIELD': 'BAD_REQUEST',
    'VALIDATION_INVALID_FORMAT': 'BAD_REQUEST',
    'VALIDATION_OUT_OF_RANGE': 'BAD_REQUEST',
    'VALIDATION_INVALID_ENUM': 'BAD_REQUEST',
    'VALIDATION_SCHEMA_ERROR': 'BAD_REQUEST',

    // Authentication & Authorization Errors
    'AUTH_UNAUTHORIZED': 'UNAUTHORIZED',
    'AUTH_FORBIDDEN': 'FORBIDDEN',
    'AUTH_SESSION_EXPIRED': 'UNAUTHORIZED',
    'AUTH_INVALID_TOKEN': 'UNAUTHORIZED',

    // System Level Errors
    'SYSTEM_INTERNAL_ERROR': 'INTERNAL_SERVER_ERROR',
    'SYSTEM_SERVICE_UNAVAILABLE': 'INTERNAL_SERVER_ERROR',
    'SYSTEM_CONFIGURATION_ERROR': 'INTERNAL_SERVER_ERROR',
    'SYSTEM_EXTERNAL_SERVICE_ERROR': 'INTERNAL_SERVER_ERROR',
    'SYSTEM_NETWORK_ERROR': 'INTERNAL_SERVER_ERROR',
  };

  const code = codeMap[error.code] || 'INTERNAL_SERVER_ERROR';

  return new TRPCError({
    code,
    message: error.message,
    cause: error,
  });
}

/**
 * Helper function to handle async operations in tRPC procedures
 * Automatically unwraps the Result and handles errors
 * 
 * @param asyncOperation - An async function that returns a Result
 * @returns The unwrapped data
 */
export async function unwrapAsync<T>(
  asyncOperation: () => Promise<Result<T, AppError>>
): Promise<T> {
  const result = await asyncOperation();
  return unwrap(result);
}

/**
 * Type guard to check if an error is an AppError
 * Useful for error handling in middleware or error formatters
 * 
 * @param error - The error to check
 * @returns True if the error is an AppError
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

/**
 * Extracts user-friendly error messages from AppErrors
 * Provides fallback messages for system errors
 * 
 * @param error - The error to extract message from
 * @returns A user-friendly error message
 */
export function getUserFriendlyMessage(error: AppError): string {
  const userFriendlyMessages: Record<string, string> = {
    // Order errors
    'ORDER_NOT_FOUND': 'The requested order could not be found.',
    'ORDER_ALREADY_CANCELLED': 'This order has already been cancelled.',
    'ORDER_CANNOT_BE_MODIFIED': 'This order cannot be modified in its current state.',
    'ORDER_INVALID_STATUS_TRANSITION': 'Invalid order status change requested.',

    // Product errors
    'PRODUCT_NOT_FOUND': 'The requested product could not be found.',
    'PRODUCT_OUT_OF_STOCK': 'This product is currently out of stock.',
    'PRODUCT_INSUFFICIENT_INVENTORY': 'Not enough inventory available for this request.',
    'PRODUCT_INACTIVE': 'This product is currently unavailable.',
    'PRODUCT_INVALID_QUANTITY': 'Please enter a valid quantity.',
    'PRODUCT_PRICE_INVALID': 'Please enter a valid price.',

    // Customer errors
    'CUSTOMER_NOT_FOUND': 'Customer not found.',
    'CUSTOMER_EMAIL_EXISTS': 'A customer with this email already exists.',
    'CUSTOMER_INVALID_EMAIL': 'Please enter a valid email address.',

    // Validation errors
    'VALIDATION_INVALID_INPUT': 'Please check your input and try again.',
    'VALIDATION_REQUIRED_FIELD': 'This field is required.',
    'VALIDATION_INVALID_FORMAT': 'Invalid format provided.',

    // System errors
    'SYSTEM_INTERNAL_ERROR': 'An internal error occurred. Please try again later.',
    'DATABASE_CONNECTION_ERROR': 'Database connection error. Please try again later.',
  };

  return userFriendlyMessages[error.code] || error.message || 'An unexpected error occurred.';
}
