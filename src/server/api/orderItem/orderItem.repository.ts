/**
 * Order Item Repository - Data Access Layer
 * Handles all database operations for order items using the Result pattern
 */

import { db } from '../../../lib/db';
import { Result, ok, err, safeAsync } from '../../../lib/result';
import { AppError, createError } from '../../../lib/errors';
import { Prisma } from '@prisma/client';
import {
  CreateOrderItemData,
  OrderItemFilters,
  OrderItemWithRelations,
  PaginationInput,
  PaginatedResponse
} from './orderItem.types';

export class OrderItemRepository {
  /**
   * Create a new order item
   */
  async create(orderItemData: CreateOrderItemData): Promise<Result<OrderItemWithRelations, AppError>> {
    return safeAsync(async () => {
      const orderItem = await db.orderItem.create({
        data: orderItemData,
        include: {
          product: true,
          order: true,
        },
      });
      return orderItem;
    }).then(result => {
      if (!result.success) {
        const error = (result as { success: false; error: Error }).error;
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          if (error.code === 'P2003') {
            return err(createError.validationError('orderId or productId', 'Invalid order or product reference'));
          }
        }
        return err(createError.databaseError('create order item', error));
      }
      return ok(result.data);
    });
  }

  /**
   * Find order item by ID
   */
  async findById(id: string): Promise<Result<OrderItemWithRelations | null, AppError>> {
    return safeAsync(async () => {
      const orderItem = await db.orderItem.findUnique({
        where: { id },
        include: {
          product: true,
          order: true,
        },
      });
      return orderItem;
    }).then(result => {
      if (!result.success) {
        return err(createError.databaseError('find order item by ID', (result as { success: false; error: Error }).error));
      }
      return ok(result.data);
    });
  }


  /**
   * Find many order items with filters and pagination
   */
  async findMany(filters: OrderItemFilters, pagination: PaginationInput): Promise<Result<PaginatedResponse<OrderItemWithRelations>, AppError>> {
    return safeAsync(async () => {
      const { page = 1, limit = 10 } = pagination;
      const skip = (page - 1) * limit;

      // Build where clause
      const where: Prisma.OrderItemWhereInput = {
        ...(filters.orderId && { orderId: filters.orderId }),
        ...(filters.productId && { productId: filters.productId }),
        ...(filters.minQuantity && { quantity: { gte: filters.minQuantity } }),
        ...(filters.maxQuantity && { quantity: { lte: filters.maxQuantity } }),
        ...(filters.minUnitPrice && { unitPrice: { gte: filters.minUnitPrice } }),
        ...(filters.maxUnitPrice && { unitPrice: { lte: filters.maxUnitPrice } }),
        ...(filters.minTotalPrice && { totalPrice: { gte: filters.minTotalPrice } }),
        ...(filters.maxTotalPrice && { totalPrice: { lte: filters.maxTotalPrice } }),
      };

      // Get total count and order items in parallel
      const [total, orderItems] = await Promise.all([
        db.orderItem.count({ where }),
        db.orderItem.findMany({
          where,
          include: {
            product: true,
            order: true,
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        data: orderItems,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      };
    }).then(result => {
      if (!result.success) {
        return err(createError.databaseError('find order items', (result as { success: false; error: Error }).error));
      }
      return ok(result.data);
    });
  }

  /**
   * Delete an order item
   */
  async delete(id: string): Promise<Result<void, AppError>> {
    return safeAsync(async () => {
      await db.orderItem.delete({
        where: { id },
      });
    }).then(result => {
      if (!result.success) {
        const error = (result as { success: false; error: Error }).error;
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          if (error.code === 'P2025') {
            return err(createError.validationError('id', 'Order item not found'));
          }
        }
        return err(createError.databaseError('delete order item', error));
      }
      return ok(undefined);
    });
  }

  /**
   * Delete all order items for a specific order
   */
  async deleteByOrderId(orderId: string): Promise<Result<{ count: number }, AppError>> {
    return safeAsync(async () => {
      const result = await db.orderItem.deleteMany({
        where: { orderId },
      });
      return result;
    }).then(result => {
      if (!result.success) {
        return err(createError.databaseError('delete order items by order ID', (result as { success: false; error: Error }).error));
      }
      return ok(result.data);
    });
  }
  /**
   * Get product by ID (helper method)
   */
  async findProductById(id: string): Promise<Result<any | null, AppError>> {
    return safeAsync(async () => {
      const product = await db.product.findUnique({
        where: { id, isDeleted: false, isActive: true },
      });
      return product;
    }).then(result => {
      if (!result.success) {
        return err(createError.databaseError('find product by ID', (result as { success: false; error: Error }).error));
      }
      return ok(result.data);
    });
  }
}