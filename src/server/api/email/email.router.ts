/**
 * Email Router - tRPC API Routes
 * Provides HTTP endpoints for email generation using the unwrap pattern
 */

import { createTRPCRouter, publicProcedure } from '../trpc';
import { EmailService } from './email.service';
import { unwrap } from '../trpc-utils';
import { GenerateEmailSchema } from './email.types';

// Initialize service
const emailService = new EmailService();

export const emailRouter = createTRPCRouter({
  // Generate email for dispatched order
  generateEmail: publicProcedure
    .input(GenerateEmailSchema)
    .mutation(async ({ input }) => {
      return unwrap(await emailService.generateEmail(input));
    }),
});
