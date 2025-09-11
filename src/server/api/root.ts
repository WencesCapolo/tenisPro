/**
 * Main tRPC router for TenisPro
 * This file contains the main router that combines all sub-routers
 */

import { createTRPCRouter } from './trpc';
import { productRouter } from './product/product.router';
import { orderRouter } from './order/order.router';
import { orderItemRouter } from './orderItem/orderItem.router';
import { customerRouter } from './customer/customer.router';

/**
 * This is the primary router for the tRPC server
 * All routers added in /api/routers should be manually added here
 */
export const appRouter = createTRPCRouter({
  product: productRouter,
  order: orderRouter,
  orderItem: orderItemRouter,
  customer: customerRouter,
  // Add other routers here as they are created
  // customer: customerRouter,
});

// Export type definition of API
export type AppRouter = typeof appRouter;
