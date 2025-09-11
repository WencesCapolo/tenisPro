/**
 * Order Repository - Data Access Layer
 * Handles all database operations for orders using the Result pattern
 */

import { db } from '../../../lib/db';
import { Result, ok, err, safeAsync } from '../../../lib/result';
import { AppError, createError } from '../../../lib/errors';
import { OrderStatus, Prisma } from '@prisma/client';
import {
  CreateOrderData,
  CreateOrderItemData,
  UpdateOrderData,
  OrderFilters,
  CreateCustomerData,
  OrderWithRelations,
  PaginationInput,
  PaginatedResponse,
  OrderStats,
} from './order.types';

export class OrderRepository {
  /**
   * Generate a unique order number
   */
  async generateOrderNumber(): Promise<Result<string, AppError>> {
    return safeAsync(async () => {
      const year = new Date().getFullYear();
      const prefix = `ORD-${year}-`;
      
      // Get the count of orders created this year
      const count = await db.order.count({
        where: {
          orderNumber: {
            startsWith: prefix,
          },
        },
      });
      
      const sequence = (count + 1).toString().padStart(4, '0');
      return `${prefix}${sequence}`;
    }).then(result => {
      if (!result.success) {
        return err(createError.databaseError('generate order number', result.error));
      }
      return ok(result.data);
    });
  }

  /**
   * Create a new customer
   */
  async createCustomer(customerData: CreateCustomerData): Promise<Result<string, AppError>> {
    return safeAsync(async () => {
      const customer = await db.customer.create({
        data: {
          ...customerData,
          isActive: true,
          isDeleted: false,
        },
      });
      return customer.id;
    }).then(result => {
      if (!result.success) {
        // Check for unique constraint violation (email)
        if (result.error instanceof Prisma.PrismaClientKnownRequestError) {
          if (result.error.code === 'P2002') {
            return err(createError.customerEmailExists(customerData.email));
          }
        }
        return err(createError.databaseError('create customer', result.error));
      }
      return ok(result.data);
    });
  }

  /**
   * Find customer by ID
   */
  async findCustomerById(id: string): Promise<Result<any | null, AppError>> {
    return safeAsync(async () => {
      const customer = await db.customer.findUnique({
        where: { id, isDeleted: false },
      });
      return customer;
    }).then(result => {
      if (!result.success) {
        return err(createError.databaseError('find customer by ID', result.error));
      }
      return ok(result.data);
    });
  }

  /**
   * Find customer by email
   */
  async findCustomerByEmail(email: string): Promise<Result<any | null, AppError>> {
    return safeAsync(async () => {
      const customer = await db.customer.findUnique({
        where: { email, isDeleted: false },
      });
      return customer;
    }).then(result => {
      if (!result.success) {
        return err(createError.databaseError('find customer by email', result.error));
      }
      return ok(result.data);
    });
  }

  /**
   * Get product by ID with stock information
   */
  async findProductById(id: string): Promise<Result<any | null, AppError>> {
    return safeAsync(async () => {
      const product = await db.product.findUnique({
        where: { id, isDeleted: false, isActive: true },
      });
      return product;
    }).then(result => {
      if (!result.success) {
        return err(createError.databaseError('find product by ID', result.error));
      }
      return ok(result.data);
    });
  }

  /**
   * Create a new order with transaction
   */
  async create(orderData: CreateOrderData, orderItems: CreateOrderItemData[]): Promise<Result<OrderWithRelations, AppError>> {
    return safeAsync(async () => {
      return await db.$transaction(async (tx) => {
        // Create the order
        const order = await tx.order.create({
          data: orderData,
        });

        // Create order items
        const createdItems = await Promise.all(
          orderItems.map(item => 
            tx.orderItem.create({
              data: {
                ...item,
                orderId: order.id,
              },
            })
          )
        );

        // Update product stock (reduce available amount)
        await Promise.all(
          orderItems.map(item =>
            tx.product.update({
              where: { id: item.productId },
              data: {
                availableAmount: {
                  decrement: item.quantity,
                },
              },
            })
          )
        );

        // Fetch the complete order with relations
        const completeOrder = await tx.order.findUnique({
          where: { id: order.id },
          include: {
            customer: true,
            orderItems: {
              include: {
                product: true,
              },
            },
          },
        });

        return completeOrder!;
      });
    }).then(result => {
      if (!result.success) {
        return err(createError.databaseError('create order', result.error));
      }
      return ok(result.data);
    });
  }

  /**
   * Find order by ID
   */
  async findById(id: string): Promise<Result<OrderWithRelations | null, AppError>> {
    return safeAsync(async () => {
      const order = await db.order.findUnique({
        where: { id, isDeleted: false },
        include: {
          customer: true,
          orderItems: {
            include: {
              product: true,
            },
          },
        },
      });
      return order;
    }).then(result => {
      if (!result.success) {
        return err(createError.databaseError('find order by ID', result.error));
      }
      return ok(result.data);
    });
  }

  /**
   * Find order by order number
   */
  async findByOrderNumber(orderNumber: string): Promise<Result<OrderWithRelations | null, AppError>> {
    return safeAsync(async () => {
      const order = await db.order.findUnique({
        where: { orderNumber, isDeleted: false },
        include: {
          customer: true,
          orderItems: {
            include: {
              product: true,
            },
          },
        },
      });
      return order;
    }).then(result => {
      if (!result.success) {
        return err(createError.databaseError('find order by order number', result.error));
      }
      return ok(result.data);
    });
  }

  /**
   * Find many orders with filters and pagination
   */
  async findMany(filters: OrderFilters, pagination: PaginationInput): Promise<Result<PaginatedResponse<OrderWithRelations>, AppError>> {
    return safeAsync(async () => {
      const { page = 1, limit = 10 } = pagination;
      const skip = (page - 1) * limit;

      // Build where clause
      const where: Prisma.OrderWhereInput = {
        isDeleted: false,
        ...(filters.orderStatus && { orderStatus: filters.orderStatus }),
        ...(filters.customerId && { customerId: filters.customerId }),
        ...(filters.orderNumber && { orderNumber: { contains: filters.orderNumber, mode: 'insensitive' } }),
        ...(filters.dateFrom && { createdAt: { gte: filters.dateFrom } }),
        ...(filters.dateTo && { createdAt: { lte: filters.dateTo } }),
        ...(filters.minAmount && { totalAmount: { gte: filters.minAmount } }),
        ...(filters.maxAmount && { totalAmount: { lte: filters.maxAmount } }),
        ...(filters.customerEmail && {
          customer: {
            email: { contains: filters.customerEmail, mode: 'insensitive' },
          },
        }),
        ...(filters.productId && {
          orderItems: {
            some: {
              productId: filters.productId,
            },
          },
        }),
      };

      // Get total count and orders in parallel
      const [total, orders] = await Promise.all([
        db.order.count({ where }),
        db.order.findMany({
          where,
          include: {
            customer: true,
            orderItems: {
              include: {
                product: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        data: orders,
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
        return err(createError.databaseError('find orders', result.error));
      }
      return ok(result.data);
    });
  }

  /**
   * Update an order
   */
  async update(id: string, updateData: UpdateOrderData): Promise<Result<OrderWithRelations, AppError>> {
    return safeAsync(async () => {
      const updatedOrder = await db.order.update({
        where: { id, isDeleted: false },
        data: {
          ...updateData,
          updatedAt: new Date(),
        },
        include: {
          customer: true,
          orderItems: {
            include: {
              product: true,
            },
          },
        },
      });
      return updatedOrder;
    }).then(result => {
      if (!result.success) {
        if (result.error instanceof Prisma.PrismaClientKnownRequestError) {
          if (result.error.code === 'P2025') {
            return err(createError.orderNotFound(id));
          }
        }
        return err(createError.databaseError('update order', result.error));
      }
      return ok(result.data);
    });
  }

  /**
   * Soft delete an order
   */
  async delete(id: string): Promise<Result<void, AppError>> {
    return safeAsync(async () => {
      await db.order.update({
        where: { id, isDeleted: false },
        data: {
          isDeleted: true,
          updatedAt: new Date(),
        },
      });
    }).then(result => {
      if (!result.success) {
        if (result.error instanceof Prisma.PrismaClientKnownRequestError) {
          if (result.error.code === 'P2025') {
            return err(createError.orderNotFound(id));
          }
        }
        return err(createError.databaseError('delete order', result.error));
      }
      return ok(undefined);
    });
  }

  /**
   * Get order statistics
   */
  async getStats(): Promise<Result<OrderStats, AppError>> {
    return safeAsync(async () => {
      const [
        totalOrders,
        pendingOrders,
        processingOrders,
        shippedOrders,
        cancelledOrders,
        revenueResult,
      ] = await Promise.all([
        db.order.count({ where: { isDeleted: false } }),
        db.order.count({ where: { isDeleted: false, orderStatus: 'PENDIENTE' } }),
        db.order.count({ where: { isDeleted: false, orderStatus: 'PROCESANDO' } }),
        db.order.count({ where: { isDeleted: false, orderStatus: 'DESPACHADO' } }),
        db.order.count({ where: { isDeleted: false, orderStatus: 'CANCELADO' } }),
        db.order.aggregate({
          where: { 
            isDeleted: false,
            orderStatus: { not: 'CANCELADO' },
          },
          _sum: { totalAmount: true },
          _avg: { totalAmount: true },
        }),
      ]);

      const totalRevenue = Number(revenueResult._sum.totalAmount || 0);
      const averageOrderValue = Number(revenueResult._avg.totalAmount || 0);

      return {
        totalOrders,
        pendingOrders,
        processingOrders,
        shippedOrders,
        cancelledOrders,
        totalRevenue,
        averageOrderValue,
      };
    }).then(result => {
      if (!result.success) {
        return err(createError.databaseError('get order stats', result.error));
      }
      return ok(result.data);
    });
  }

  /**
   * Cancel order and restore stock
   */
  async cancelOrder(id: string, reason?: string): Promise<Result<OrderWithRelations, AppError>> {
    return safeAsync(async () => {
      return await db.$transaction(async (tx) => {
        // Get the order with items
        const order = await tx.order.findUnique({
          where: { id, isDeleted: false },
          include: { orderItems: true },
        });

        if (!order) {
          throw new Error('Order not found');
        }

        // Update order status
        const updatedOrder = await tx.order.update({
          where: { id },
          data: {
            orderStatus: 'CANCELADO',
            cancelledAt: new Date(),
            cancellationReason: reason,
            updatedAt: new Date(),
          },
          include: {
            customer: true,
            orderItems: {
              include: {
                product: true,
              },
            },
          },
        });

        // Restore stock for each item (only if order was not already cancelled)
        if (order.orderStatus !== 'CANCELADO') {
          await Promise.all(
            order.orderItems.map(item =>
              tx.product.update({
                where: { id: item.productId },
                data: {
                  availableAmount: {
                    increment: item.quantity,
                  },
                },
              })
            )
          );
        }

        return updatedOrder;
      });
    }).then(result => {
      if (!result.success) {
        return err(createError.databaseError('cancel order', result.error));
      }
      return ok(result.data);
    });
  }
}
