import { createTRPCRouter, publicProcedure } from '../trpc';
import { unwrap } from '../trpc-utils';
import { CustomerRepository } from './customer.repository';
import { CustomerService } from './customer.service';
import { z } from 'zod';
import { CreateCustomerSchema, UpdateCustomerSchema, CustomerFiltersSchema } from './customer.types';

const customerRepository = new CustomerRepository();
const customerService = new CustomerService(customerRepository);

export const customerRouter = createTRPCRouter({
  getById: publicProcedure
    .input(z.object({ id: z.string().cuid() }))
    .query(async ({ input }) => unwrap(await customerService.getById(input.id))),

  getAll: publicProcedure
    .input(CustomerFiltersSchema.optional())
    .query(async ({ input }) => unwrap(await customerService.getAll(input ?? {}))),

  create: publicProcedure
    .input(CreateCustomerSchema)
    .mutation(async ({ input }) => unwrap(await customerService.create(input))),

  update: publicProcedure
    .input(z.object({ id: z.string().cuid(), data: UpdateCustomerSchema }))
    .mutation(async ({ input }) => unwrap(await customerService.update(input.id, input.data))),

  delete: publicProcedure
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ input }) => unwrap(await customerService.delete(input.id))),
});
