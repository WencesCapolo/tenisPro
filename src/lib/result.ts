/**
 * Result Pattern Implementation for TenisPro
 * 
 * Provides type-safe error handling without exceptions.
 */

export type Result<T, E = Error> = {
  success: true;
  data: T;
} | {
  success: false;
  error: E;
};

/**
 * Create a successful result
 * @param data The successful data to wrap
 * @returns A successful Result
 */
export function ok<T>(data: T): Result<T, never> {
  return { success: true, data };
}

/**
 * Create an error result
 * @param error The error to wrap
 * @returns An error Result
 */
export function err<E extends Error>(error: E): Result<never, E> {
  return { success: false, error };
}

/**
 * Safely execute an async operation and return a Result
 * @param fn The async function to execute
 * @returns A Result wrapping the operation outcome
 */
export async function safeAsync<T, E extends Error = Error>(
  fn: () => Promise<T>
): Promise<Result<T, E>> {
  try {
    const data = await fn();
    return ok(data);
  } catch (error) {
    return err(error as E);
  }
}

/**
 * Safely execute a sync operation and return a Result
 * @param fn The function to execute
 * @returns A Result wrapping the operation outcome
 */
export function safe<T, E extends Error = Error>(
  fn: () => T
): Result<T, E> {
  try {
    const data = fn();
    return ok(data);
  } catch (error) {
    return err(error as E);
  }
}

/**
 * Chain multiple Result operations together
 * @param result The initial Result
 * @param fn Function to apply if the result is successful
 * @returns A new Result
 */
export function chain<T, U, E extends Error>(
  result: Result<T, E>,
  fn: (data: T) => Result<U, E>
): Result<U, E> {
  if (!result.success) {
    return result;
  }
  return fn(result.data);
}

/**
 * Map the data of a successful Result
 * @param result The Result to map
 * @param fn Function to transform the data
 * @returns A new Result with transformed data
 */
export function map<T, U, E extends Error>(
  result: Result<T, E>,
  fn: (data: T) => U
): Result<U, E> {
  if (!result.success) {
    return result;
  }
  return ok(fn(result.data));
}

/**
 * Map the error of a failed Result
 * @param result The Result to map
 * @param fn Function to transform the error
 * @returns A new Result with transformed error
 */
export function mapError<T, E1 extends Error, E2 extends Error>(
  result: Result<T, E1>,
  fn: (error: E1) => E2
): Result<T, E2> {
  if (result.success) {
    return result;
  }
  return err(fn(result.error));
}

/**
 * Type guard to check if a Result is successful
 * @param result The Result to check
 * @returns True if the result is successful
 */
export function isOk<T, E extends Error>(result: Result<T, E>): result is { success: true; data: T } {
  return result.success;
}

/**
 * Type guard to check if a Result is an error
 * @param result The Result to check
 * @returns True if the result is an error
 */
export function isErr<T, E extends Error>(result: Result<T, E>): result is { success: false; error: E } {
  return !result.success;
}
