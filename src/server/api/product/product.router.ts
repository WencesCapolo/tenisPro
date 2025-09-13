import { createTRPCRouter, publicProcedure } from '../trpc';
import { ProductService } from './product.service';
import { ProductRepository } from './product.repository';
import { unwrap } from '../trpc-utils';
import { z } from 'zod';
import { 
  ProductTypeSchema, 
  ProductNameSchema,
  CreateProductSchema, 
  UpdateProductSchema, 
  ProductFiltersSchema 
} from './product.types';

// Initialize service with repository
const productRepository = new ProductRepository();
const productService = new ProductService(productRepository);


export const productRouter = createTRPCRouter({
  // Get product by ID
  getById: publicProcedure
    .input(z.object({ id: z.string().cuid() }))
    .query(async ({ input }) => {
      return unwrap(await productService.getById(input.id));
    }),

  // Get all products with optional filters
  getAll: publicProcedure
    .input(ProductFiltersSchema)
    .query(async ({ input }) => {
      return unwrap(await productService.getAll(input));
    }),

  // Get only active products (for customer-facing views)
  getActive: publicProcedure
    .query(async () => {
      return unwrap(await productService.getActiveProducts());
    }),

  // Get products by category
  getByCategory: publicProcedure
    .input(z.object({ category: ProductTypeSchema }))
    .query(async ({ input }) => {
      return unwrap(await productService.getProductsByCategory(input.category));
    }),

  // Get products by name
  getByName: publicProcedure
    .input(z.object({ name: ProductNameSchema }))
    .query(async ({ input }) => {
      return unwrap(await productService.getProductsByName(input.name));
    }),

  // Get products by type (category)
  getByType: publicProcedure
    .input(z.object({ type: ProductTypeSchema }))
    .query(async ({ input }) => {
      return unwrap(await productService.getProductsByType(input.type));
    }),

  // Create new product
  create: publicProcedure
    .input(CreateProductSchema)
    .mutation(async ({ input }) => {
      return unwrap(await productService.create(input));
    }),

  // Update existing product
  update: publicProcedure
    .input(z.object({
      id: z.string().cuid(),
      data: UpdateProductSchema,
    }))
    .mutation(async ({ input }) => {
      return unwrap(await productService.update(input.id, input.data));
    }),

  // Update product stock
  updateStock: publicProcedure
    .input(z.object({
      id: z.string().cuid(),
      amount: z.number().int().min(0),
    }))
    .mutation(async ({ input }) => {
      return unwrap(await productService.updateStock(input.id, input.amount));
    }),

  // Reserve product stock (for order processing)
  reserveStock: publicProcedure
    .input(z.object({
      id: z.string().cuid(),
      quantity: z.number().int().min(1),
    }))
    .mutation(async ({ input }) => {
      return unwrap(await productService.reserveStock(input.id, input.quantity));
    }),

  // Restore product stock (for order cancellation)
  restoreStock: publicProcedure
    .input(z.object({
      id: z.string().cuid(),
      quantity: z.number().int().min(1),
    }))
    .mutation(async ({ input }) => {
      return unwrap(await productService.restoreStock(input.id, input.quantity));
    }),

  // Activate product
  activate: publicProcedure
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ input }) => {
      return unwrap(await productService.activate(input.id));
    }),

  // Deactivate product
  deactivate: publicProcedure
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ input }) => {
      return unwrap(await productService.deactivate(input.id));
    }),

  // Soft delete product
  delete: publicProcedure
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ input }) => {
      return unwrap(await productService.delete(input.id));
    }),

  // Get product statistics for dashboard
  getStats: publicProcedure
    .query(async () => {
      return unwrap(await productService.getProductStats());
    }),

  // Get low stock products
  getLowStock: publicProcedure
    .input(z.object({ 
      threshold: z.number().int().min(0).default(10) 
    }))
    .query(async ({ input }) => {
      return unwrap(await productService.getLowStockProducts(input.threshold));
    }),
});
