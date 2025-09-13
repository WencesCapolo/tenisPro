/**
 * Order Router - tRPC API Routes
 * Provides HTTP endpoints for order management using the unwrap pattern
 */

import { createTRPCRouter, publicProcedure } from '../trpc';
import { OrderService } from './order.service';
import { OrderRepository } from './order.repository';
import { unwrap } from '../trpc-utils';
import { z } from 'zod';
import {
  OrderStatusSchema,
  CreateOrderSchema,
  UpdateOrderSchema,
  OrderFiltersSchema,
  PaginationSchema,
  IdSchema,
} from './order.types';

// Initialize service with repository
const orderRepository = new OrderRepository();
const orderService = new OrderService(orderRepository);

export const orderRouter = createTRPCRouter({
  // Get order by ID
  getById: publicProcedure
    .input(z.object({ id: IdSchema }))
    .query(async ({ input }) => {
      return unwrap(await orderService.getById(input.id));
    }),

  // Get order by order number
  getByOrderNumber: publicProcedure
    .input(z.object({ orderNumber: z.string() }))
    .query(async ({ input }) => {
      return unwrap(await orderService.getByOrderNumber(input.orderNumber));
    }),

  // Get all orders with filters and pagination
  getAll: publicProcedure
    .input(OrderFiltersSchema.merge(PaginationSchema))
    .query(async ({ input }) => {
      const { dateFrom, dateTo, ...otherFilters } = input;
      return unwrap(await orderService.getAll({
        ...otherFilters,
        ...(dateFrom && { dateFrom: new Date(dateFrom) }),
        ...(dateTo && { dateTo: new Date(dateTo) }),
      }));
    }),

  // Get orders by customer ID
  getByCustomerId: publicProcedure
    .input(z.object({ 
      customerId: IdSchema,
      page: z.number().int().min(1).default(1),
      limit: z.number().int().min(1).max(100).default(10),
    }))
    .query(async ({ input }) => {
      const { customerId, page, limit } = input;
      return unwrap(await orderService.getByCustomerId(customerId, { page, limit }));
    }),

  // Get pending orders
  getPending: publicProcedure
    .query(async () => {
      return unwrap(await orderService.getPendingOrders());
    }),

  // Create new order
  create: publicProcedure
    .input(CreateOrderSchema)
    .mutation(async ({ input }) => {
      return unwrap(await orderService.create(input));
    }),

  // Update existing order
  update: publicProcedure
    .input(z.object({
      id: IdSchema,
      data: UpdateOrderSchema,
    }))
    .mutation(async ({ input }) => {
      return unwrap(await orderService.update(input.id, input.data));
    }),

  // Update order status
  updateStatus: publicProcedure
    .input(z.object({
      id: IdSchema,
      status: OrderStatusSchema,
      reason: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      return unwrap(await orderService.updateStatus(input.id, input.status, input.reason));
    }),

  // Cancel order
  cancel: publicProcedure
    .input(z.object({
      id: IdSchema,
      reason: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      return unwrap(await orderService.cancel(input.id, input.reason));
    }),

  // Delete order (soft delete)
  delete: publicProcedure
    .input(z.object({ id: IdSchema }))
    .mutation(async ({ input }) => {
      return unwrap(await orderService.delete(input.id));
    }),

  // Get order statistics
  getStats: publicProcedure
    .query(async () => {
      return unwrap(await orderService.getStats());
    }),
});
