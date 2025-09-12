import { CustomerRepository } from './customer.repository';
import { Result, ok, err } from '../../../lib/result';
import { AppError, createError } from '../../../lib/errors';
import {
  CreateCustomerInput,
  UpdateCustomerInput,
  CustomerListFilters,
  CreateCustomerSchema,
  UpdateCustomerSchema,
} from './customer.types';
import { Customer } from '@prisma/client';

export class CustomerService {
  constructor(private customerRepository: CustomerRepository) {}

  async getById(id: string): Promise<Result<Customer, AppError>> {
    const result = await this.customerRepository.findById(id);
    if (!result.success) {
      return err((result as { success: false; error: AppError }).error);
    }

    if (!result.data) {
      return err(createError.customerNotFound(id));
    }

    return ok(result.data);
  }

  async getAll(filters: CustomerListFilters = {}): Promise<Result<Customer[], AppError>> {
    const result = await this.customerRepository.findMany(filters);
    if (!result.success) {
      return err((result as { success: false; error: AppError }).error);
    }
    return ok(result.data);
  }

  async create(input: CreateCustomerInput): Promise<Result<Customer, AppError>> {
    // Validate input
    const validation = CreateCustomerSchema.safeParse(input);
    if (!validation.success) {
      return err(createError.validationError('customer', validation.error.message));
    }

    // Check for email duplication
    const existingResult = await this.customerRepository.findMany({ email: input.email });
    if (!existingResult.success) {
      return err((existingResult as { success: false; error: AppError }).error);
    }
    if (existingResult.data.length > 0) {
      return err(createError.customerEmailExists(input.email));
    }

    const createResult = await this.customerRepository.create(input);
    if (!createResult.success) {
      return err((createResult as { success: false; error: AppError }).error);
    }

    return ok(createResult.data);
  }

  async update(id: string, input: UpdateCustomerInput): Promise<Result<Customer, AppError>> {
    // Validate input
    const validation = UpdateCustomerSchema.safeParse(input);
    if (!validation.success) {
      return err(createError.validationError('customer', validation.error.message));
    }

    // Ensure customer exists
    const existing = await this.getById(id);
    if (!existing.success) {
      return err((existing as { success: false; error: AppError }).error);
    }

    // Email change duplication check
    if (input.email && input.email !== existing.data.email) {
      const emailCheck = await this.customerRepository.findMany({ email: input.email });
      if (!emailCheck.success) {
        return err((emailCheck as { success: false; error: AppError }).error);
      }
      if (emailCheck.data.length > 0) {
        return err(createError.customerEmailExists(input.email));
      }
    }

    const updateResult = await this.customerRepository.update(id, input);
    if (!updateResult.success) {
      return err((updateResult as { success: false; error: AppError }).error);
    }
    return ok(updateResult.data);
  }

  async delete(id: string): Promise<Result<Customer, AppError>> {
    // Ensure exists
    const existing = await this.getById(id);
    if (!existing.success) {
      return err((existing as { success: false; error: AppError }).error);
    }

    const deleteResult = await this.customerRepository.softDelete(id);
    if (!deleteResult.success) {
      return err((deleteResult as { success: false; error: AppError }).error);
    }
    return ok(deleteResult.data);
  }
}
