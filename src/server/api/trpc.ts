/**
 * tRPC configuration for TenisPro
 * This file contains the tRPC router setup and procedures
 */

import { initTRPC } from '@trpc/server';
import superjson from 'superjson';
import { ZodError } from 'zod';

/**
 * Create tRPC context
 * Add any context you need here (auth, db, etc.)
 */
export const createTRPCContext = async (opts: { headers: Headers }) => {
  return {
    headers: opts.headers,
    // Add session, db, or other context here when needed
  };
};

/**
 * Initialize tRPC
 */
const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

/**
 * Export reusable router and procedure helpers
 */
export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;

// For future auth implementation
// export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
//   if (!ctx.session?.user?.id) {
//     throw new TRPCError({ code: 'UNAUTHORIZED' });
//   }
//   return next({
//     ctx: {
//       ...ctx,
//       session: ctx.session,
//     },
//   });
// });
