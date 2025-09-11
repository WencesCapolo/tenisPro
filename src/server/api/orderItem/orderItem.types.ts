/**
 * Order Item-related type definitions for TenisPro
 * Contains interfaces and types used across repository, service, and router layers
 */

import { OrderItem, Product, Order } from '@prisma/client';
import { z } from 'zod';

// Input validation schemas
const CreateOrderItemSchema = z.object({
  orderId: z.string().cuid(),
  productId: z.string().cuid(),
  quantity: z.number().int().min(1),
  unitPrice: z.number().min(0).optional(), // Optional, will be fetched from product if not provided
  discount: z.number().min(0).default(0),
});


const OrderItemFiltersSchema = z.object({
  orderId: z.string().cuid().optional(),
  productId: z.string().cuid().optional(),
  minQuantity: z.number().int().min(1).optional(),
  maxQuantity: z.number().int().min(1).optional(),
  minUnitPrice: z.number().min(0).optional(),
  maxUnitPrice: z.number().min(0).optional(),
  minTotalPrice: z.number().min(0).optional(),
  maxTotalPrice: z.number().min(0).optional(),
});

const PaginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(10),
});

// Export schemas for use in router
export { 
  CreateOrderItemSchema, 
  OrderItemFiltersSchema,
  PaginationSchema 
};

// Repository layer interfaces
export interface CreateOrderItemData {
  orderId: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  discount: number;
}


export interface OrderItemFilters {
  orderId?: string;
  productId?: string;
  minQuantity?: number;
  maxQuantity?: number;
  minUnitPrice?: number;
  maxUnitPrice?: number;
  minTotalPrice?: number;
  maxTotalPrice?: number;
}

// Service layer interfaces
export interface CreateOrderItemInput {
  orderId: string;
  productId: string;
  quantity: number;
  unitPrice?: number;
  discount?: number;
}

export interface OrderItemListFilters {
  orderId?: string;
  productId?: string;
  minQuantity?: number;
  maxQuantity?: number;
  minUnitPrice?: number;
  maxUnitPrice?: number;
  minTotalPrice?: number;
  maxTotalPrice?: number;
  page?: number;
  limit?: number;
}

// Extended types with relations
export interface OrderItemWithRelations extends OrderItem {
  product: Product;
  order: Order;
}

// Response types
export interface OrderItemResponse {
  orderItems: OrderItemWithRelations[];
  total: number;
  page: number;
  limit: number;
}

// Business logic types
export interface OrderItemCalculation {
  unitPrice: number;
  quantity: number;
  subtotal: number;
  discount: number;
  totalPrice: number;
}

export interface StockValidationResult {
  isValid: boolean;
  availableStock: number;
  requestedQuantity: number;
  productName: string;
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

// Error-specific types
export interface OrderItemError {
  code: string;
  message: string;
  field?: string;
  value?: any;
}

// Order item validation types
export interface OrderItemValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// Constants
export const ORDER_ITEM_CONSTRAINTS = {
  MIN_QUANTITY: 1,
  MAX_QUANTITY: 1000,
  MIN_UNIT_PRICE: 0,
  MAX_UNIT_PRICE: 999999.99,
  MIN_DISCOUNT: 0,
  MAX_DISCOUNT_PERCENTAGE: 100,
} as const;
