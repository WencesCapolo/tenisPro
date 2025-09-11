/**
 * Product-related type definitions for TenisPro
 * Contains interfaces and types used across repository, service, and router layers
 */

import { Product, ProductType } from '@prisma/client';
import { z } from 'zod';

// Input validation schemas
const ProductTypeSchema = z.enum(['PROFESIONAL', 'ENTRENAMIENTO', 'RECREATIVA']);

const CreateProductSchema = z.object({
  name: ProductTypeSchema,
  description: z.string().optional(),
  price: z.number().min(0),
  availableAmount: z.number().int().min(0),
  category: z.string().optional(),
  brand: z.string().optional(),
  model: z.string().optional(),
  sku: z.string().optional(),
  imageUrl: z.string().url().optional(),
});

const UpdateProductSchema = z.object({
  description: z.string().optional(),
  price: z.number().min(0).optional(),
  availableAmount: z.number().int().min(0).optional(),
  category: z.string().optional(),
  brand: z.string().optional(),
  model: z.string().optional(),
  imageUrl: z.string().url().optional(),
  isActive: z.boolean().optional(),
});

const ProductFiltersSchema = z.object({
  name: ProductTypeSchema.optional(),
  category: z.string().optional(),
  brand: z.string().optional(),
  isActive: z.boolean().optional(),
  inStock: z.boolean().optional(),
});

// Export schemas for use in router
export { ProductTypeSchema, CreateProductSchema, UpdateProductSchema, ProductFiltersSchema };

// Repository layer interfaces
export interface CreateProductData {
  name: ProductType;
  description?: string;
  price: number;
  availableAmount: number;
  category?: string;
  brand?: string;
  model?: string;
  sku?: string;
  imageUrl?: string;
}

export interface UpdateProductData {
  description?: string;
  price?: number;
  availableAmount?: number;
  category?: string;
  brand?: string;
  model?: string;
  imageUrl?: string;
  isActive?: boolean;
}

export interface ProductFilters {
  name?: ProductType;
  category?: string;
  brand?: string;
  isActive?: boolean;
  inStock?: boolean;
}

// Service layer interfaces
export interface CreateProductInput {
  name: ProductType;
  description?: string;
  price: number;
  availableAmount: number;
  category?: string;
  brand?: string;
  model?: string;
  sku?: string;
  imageUrl?: string;
}

export interface UpdateProductInput {
  description?: string;
  price?: number;
  availableAmount?: number;
  category?: string;
  brand?: string;
  model?: string;
  imageUrl?: string;
  isActive?: boolean;
}

export interface ProductListFilters {
  name?: ProductType;
  category?: string;
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

// Router input schemas (used for Zod validation)
export interface CreateProductSchema {
  name: ProductType;
  description?: string;
  price: number;
  availableAmount: number;
  category?: string;
  brand?: string;
  model?: string;
  sku?: string;
  imageUrl?: string;
}

export interface UpdateProductSchema {
  description?: string;
  price?: number;
  availableAmount?: number;
  category?: string;
  brand?: string;
  model?: string;
  imageUrl?: string;
  isActive?: boolean;
}

export interface ProductFiltersSchema {
  name?: ProductType;
  category?: string;
  brand?: string;
  isActive?: boolean;
  inStock?: boolean;
}

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


