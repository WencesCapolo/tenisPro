/**
 * Product-related type definitions for TenisPro
 * Contains interfaces and types used across repository, service, and router layers
 */

import { Product, ProductType, ProductName } from '@prisma/client';
import { z } from 'zod';

// Input validation schemas
const ProductTypeSchema = z.enum(['PROFESIONAL', 'ENTRENAMIENTO', 'RECREATIVA']);
const ProductNameSchema = z.enum(['RAQUETA', 'PELOTA', 'RED', 'ZAPATILLA']);

const CreateProductSchema = z.object({
  name: ProductNameSchema,
  description: z.string().optional(),
  price: z.number().min(0),
  availableAmount: z.number().int().min(0),
  category: ProductTypeSchema,
  brand: z.string().optional(),
  model: z.string().optional(),
  sku: z.string().optional(),
  imageUrl: z.string().url().optional(),
});

const UpdateProductSchema = z.object({
  description: z.string().optional(),
  price: z.number().min(0).optional(),
  availableAmount: z.number().int().min(0).optional(),
  category: ProductTypeSchema.optional(),
  brand: z.string().optional(),
  model: z.string().optional(),
  imageUrl: z.string().url().optional(),
  isActive: z.boolean().optional(),
});

const ProductFiltersSchema = z.object({
  name: ProductNameSchema.optional(),
  category: ProductTypeSchema.optional(),
  brand: z.string().optional(),
  isActive: z.boolean().optional(),
  inStock: z.boolean().optional(),
});

// Export schemas for use in router
export { ProductTypeSchema, ProductNameSchema, CreateProductSchema, UpdateProductSchema, ProductFiltersSchema };

// Repository layer interfaces
export interface CreateProductData {
  name: ProductName;
  description?: string;
  price: number;
  availableAmount: number;
  category: ProductType;
  brand?: string;
  model?: string;
  sku?: string;
  imageUrl?: string;
}

export interface UpdateProductData {
  description?: string;
  price?: number;
  availableAmount?: number;
  category?: ProductType;
  brand?: string;
  model?: string;
  imageUrl?: string;
  isActive?: boolean;
}

export interface ProductFilters {
  name?: ProductName;
  category?: ProductType;
  brand?: string;
  isActive?: boolean;
  inStock?: boolean;
}

// Service layer interfaces - inferred from Zod schemas for consistency
export type CreateProductInput = z.infer<typeof CreateProductSchema>;

export type UpdateProductInput = z.infer<typeof UpdateProductSchema>;

export interface ProductListFilters {
  name?: ProductName;
  category?: ProductType;
  brand?: string;
  isActive?: boolean;
  inStock?: boolean;
}

export interface ProductStats {
  totalProducts: number;
  activeProducts: number;
  inactiveProducts: number;
  lowStockProducts: number;
  totalInventoryValue: number;
  outOfStockProducts: number;
}

// Extended Product type with computed fields
export interface ProductWithStats extends Product {
  isLowStock: boolean;
  inventoryValue: number;
}

// API Response types
export interface ProductResponse {
  products: Product[];
  total: number;
  page: number;
  limit: number;
}

export interface ProductStatsResponse extends ProductStats {
  lastUpdated: string;
}

// Note: Router input types are now inferred from Zod schemas above

// Error-specific types
export interface ProductError {
  code: string;
  message: string;
  field?: string;
  value?: any;
}

// Pagination types
export interface PaginationInput {
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}


