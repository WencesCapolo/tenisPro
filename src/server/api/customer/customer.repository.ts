import { db } from '../../../lib/db';
import { Result, ok, err, safeAsync } from '../../../lib/result';
import { AppError, createError } from '../../../lib/errors';
import { Customer, Prisma } from '@prisma/client';
import {
  CreateCustomerData,
  UpdateCustomerData,
  CustomerFilters,
} from './customer.types';

export class CustomerRepository {
  async findById(id: string): Promise<Result<Customer | null, AppError>> {
    return safeAsync(async () => {
      const customer = await db.customer.findUnique({
        where: { id, isDeleted: false },
      });
      return customer;
    }).then((result) => {
      if (!result.success) {
        return err(createError.databaseError('find customer by ID', (result as { success: false; error: Error }).error));
      }
      return ok(result.data);
    });
  }

  async findMany(filters: CustomerFilters = {}): Promise<Result<Customer[], AppError>> {
    return safeAsync(async () => {
      const where: Prisma.CustomerWhereInput = {
        isDeleted: false,
        ...(filters.name && { name: { contains: filters.name, mode: 'insensitive' } }),
        ...(filters.email && { email: filters.email }),
        ...(filters.isActive !== undefined && { isActive: filters.isActive }),
      };

      const customers = await db.customer.findMany({ where, orderBy: { createdAt: 'desc' } });
      return customers;
    }).then((result) => {
      if (!result.success) {
        return err(createError.databaseError('find customers', (result as { success: false; error: Error }).error));
      }
      return ok(result.data);
    });
  }

  async create(data: CreateCustomerData): Promise<Result<any, AppError>> {
    return safeAsync(async () => {
      const customer = await db.customer.create({ 
        data: {
          name: data.name,
          email: data.email,
          phone: data.phone,
          address: data.address,
          city: data.city,
          state: data.state,
          postalCode: data.postalCode,
          country: data.country,
          taxId: data.taxId,
          companyName: data.companyName,
          isActive: true,
          isDeleted: false,
        }
      });
      return customer;
    }).then((result) => {
      if (!result.success) {
        const error = (result as { success: false; error: Error }).error;
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          if (
            error.code === 'P2002' &&
            Array.isArray((error.meta as { target?: string[] }).target) &&
            (error.meta as { target?: string[] }).target!.includes('email')
          ) {
            return err(createError.customerEmailExists(data.email));
          }
        }
        return err(createError.databaseError('create customer', error));
      }
      return ok(result.data);
    });
  }

  async update(id: string, data: UpdateCustomerData): Promise<Result<any, AppError>> {
    return safeAsync(async () => {
      const customer = await db.customer.update({
        where: { id },
        data: { ...data, updatedAt: new Date() },
      });
      return customer;
    }).then((result) => {
      if (!result.success) {
        return err(createError.databaseError('update customer', (result as { success: false; error: Error }).error));
      }
      return ok(result.data);
    });
  }

  async softDelete(id: string): Promise<Result<any, AppError>> {
    return safeAsync(async () => {
      const customer = await db.customer.update({
        where: { id },
        data: { isDeleted: true, isActive: false, updatedAt: new Date() },
      });
      return customer;
    }).then((result) => {
      if (!result.success) {
        return err(createError.databaseError('delete customer', (result as { success: false; error: Error }).error));
      }
      return ok(result.data);
    });
  }
}
