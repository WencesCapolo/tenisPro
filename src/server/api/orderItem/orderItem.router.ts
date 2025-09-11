/**
 * Order Item Router - tRPC API Routes
 * Provides HTTP endpoints for order item management using the unwrap pattern
 */

import { createTRPCRouter, publicProcedure } from '../trpc';
import { OrderItemService } from './orderItem.service';
import { OrderItemRepository } from './orderItem.repository';
import { unwrap } from '../trpc-utils';
import { z } from 'zod';
import {
  CreateOrderItemSchema,
  OrderItemFiltersSchema,
  PaginationSchema,
} from './orderItem.types';

// Initialize service with repository
const orderItemRepository = new OrderItemRepository();
const orderItemService = new OrderItemService(orderItemRepository);

export const orderItemRouter = createTRPCRouter({
  // Get order item by ID
  getById: publicProcedure
    .input(z.object({ id: z.string().cuid() }))
    .query(async ({ input }) => {
      return unwrap(await orderItemService.getById(input.id));
    }),

  // Get all order items with filters and pagination
  getAll: publicProcedure
    .input(OrderItemFiltersSchema.merge(PaginationSchema))
    .query(async ({ input }) => {
      return unwrap(await orderItemService.getAll(input));
    }),

  // Create new order item
  create: publicProcedure
    .input(CreateOrderItemSchema)
    .mutation(async ({ input }) => {
      return unwrap(await orderItemService.create(input));
    }),
});
