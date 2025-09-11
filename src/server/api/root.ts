/**
 * Main tRPC router for TenisPro
 * This file contains the main router that combines all sub-routers
 */

import { createTRPCRouter } from './trpc';
import { productRouter } from './product/product.router';

/**
 * This is the primary router for the tRPC server
 * All routers added in /api/routers should be manually added here
 */
export const appRouter = createTRPCRouter({
  product: productRouter,
  // Add other routers here as they are created
  // order: orderRouter,
  // customer: customerRouter,
});

// Export type definition of API
export type AppRouter = typeof appRouter;
