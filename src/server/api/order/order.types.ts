/**
 * Order-related type definitions for TenisPro
 * Contains interfaces and types used across repository, service, and router layers
 */

import { Order, OrderItem, OrderStatus, Customer, Product } from '@prisma/client';
import { z } from 'zod';
import { CreateCustomerSchema } from '../customer/customer.types';

// Reusable ID schema to support both CUID (default in Prisma) and legacy UUID ids
export const IdSchema = z.union([z.string().cuid(), z.string().uuid()]);

// Input validation schemas
const OrderStatusSchema = z.enum(['PENDIENTE', 'PROCESANDO', 'DESPACHADO', 'CANCELADO']);

const OrderItemSchema = z.object({
  productId: IdSchema,
  quantity: z.number().int().min(1),
  unitPrice: z.number().min(0).optional(), // Optional, will be fetched from product if not provided
});

const CreateOrderSchema = z.object({
  customerId: IdSchema.optional(), // Optional if creating with inline customer
  customer: CreateCustomerSchema.optional(), // Optional if using existing customerId
  orderItems: z.array(OrderItemSchema).min(1),
  notes: z.string().optional(),
  customerNotes: z.string().optional(),
  shippingAddress: z.string().optional(),
  billingAddress: z.string().optional(),
  shippingCost: z.number().min(0).default(0),
  discount: z.number().min(0).default(0),
}).refine(data => data.customerId || data.customer, {
  message: "Either customerId or customer data must be provided",
});

const UpdateOrderSchema = z.object({
  orderStatus: OrderStatusSchema.optional(),
  notes: z.string().optional(),
  customerNotes: z.string().optional(),
  shippingAddress: z.string().optional(),
  billingAddress: z.string().optional(),
  trackingNumber: z.string().optional(),
  shippingCost: z.number().min(0).optional(),
  discount: z.number().min(0).optional(),
  cancellationReason: z.string().optional(),
});

const OrderFiltersSchema = z.object({
  orderStatus: OrderStatusSchema.optional(),
  customerId: z.string().cuid().optional(),
  customerEmail: z.string().email().optional(),
  productId: z.string().cuid().optional(),
  orderNumber: z.string().optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  minAmount: z.number().min(0).optional(),
  maxAmount: z.number().min(0).optional(),
});

const PaginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(10000).default(10), // Increased limit for dashboard stats
});

// Export schemas for use in router
export { 
  OrderStatusSchema, 
  OrderItemSchema,
  CreateOrderSchema, 
  UpdateOrderSchema, 
  OrderFiltersSchema,
  PaginationSchema 
};

// Repository layer interfaces
export interface CreateOrderData {
  orderNumber: string;
  orderStatus: OrderStatus;
  customerId: string;
  totalAmount: number;
  subtotal: number;
  taxAmount: number;
  shippingCost: number;
  discount: number;
  notes?: string;
  customerNotes?: string;
  shippingAddress?: string;
  billingAddress?: string;
}

export interface CreateOrderItemData {
  orderId: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  discount: number;
}

export interface UpdateOrderData {
  orderStatus?: OrderStatus;
  notes?: string;
  customerNotes?: string;
  shippingAddress?: string;
  billingAddress?: string;
  trackingNumber?: string;
  shippingCost?: number;
  discount?: number;
  shippedAt?: Date;
  deliveredAt?: Date;
  cancelledAt?: Date;
  cancellationReason?: string;
}

export interface OrderFilters {
  orderStatus?: OrderStatus;
  customerId?: string;
  customerEmail?: string;
  productId?: string;
  orderNumber?: string;
  dateFrom?: Date;
  dateTo?: Date;
  minAmount?: number;
  maxAmount?: number;
}

export interface CreateCustomerData {
  name: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country: string;
  taxId?: string;
  companyName?: string;
}

// Service layer interfaces
export type CreateOrderInput = z.infer<typeof CreateOrderSchema>;

export type UpdateOrderInput = z.infer<typeof UpdateOrderSchema>;

export interface OrderListFilters {
  orderStatus?: OrderStatus;
  customerId?: string;
  customerEmail?: string;
  productId?: string;
  orderNumber?: string;
  dateFrom?: Date;
  dateTo?: Date;
  minAmount?: number;
  maxAmount?: number;
  page?: number;
  limit?: number;
}

// Extended types with relations
export interface OrderWithRelations extends Order {
  customer: Customer;
  orderItems: Array<OrderItem & {
    product: Product;
  }>;
}

export interface OrderWithStats extends OrderWithRelations {
  itemsCount: number;
  totalItems: number;
}

// Response types
export interface OrderResponse {
  orders: OrderWithRelations[];
  total: number;
  page: number;
  limit: number;
}

export interface OrderStats {
  totalOrders: number;
  pendingOrders: number;
  processingOrders: number;
  shippedOrders: number;
  cancelledOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
}

export interface OrderStatsResponse extends OrderStats {
  lastUpdated: string;
}

// Business logic types
export interface StockValidationResult {
  isValid: boolean;
  errors: Array<{
    productId: string;
    productName: string;
    requested: number;
    available: number;
  }>;
}

export interface OrderCalculation {
  subtotal: number;
  taxAmount: number;
  shippingCost: number;
  discount: number;
  totalAmount: number;
}

export interface StatusTransitionValidation {
  isValid: boolean;
  error?: string;
}

// Order status transition rules - All transitions are now allowed
// Keeping the export for backward compatibility but not enforcing restrictions
export const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDIENTE: ['PROCESANDO', 'DESPACHADO', 'CANCELADO'],
  PROCESANDO: ['PENDIENTE', 'DESPACHADO', 'CANCELADO'],
  DESPACHADO: ['PENDIENTE', 'PROCESANDO', 'CANCELADO'],
  CANCELADO: ['PENDIENTE', 'PROCESANDO', 'DESPACHADO'],
};

// Tax configuration (can be moved to environment variables later)
export const TAX_RATE = 0.19; // 19% IVA in Colombia
export const LOW_STOCK_THRESHOLD = 5;

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
export interface OrderError {
  code: string;
  message: string;
  field?: string;
  value?: any;
}

// Order number generation types
export interface OrderNumberConfig {
  prefix: string;
  year: number;
  sequence: number;
}

// Inventory reservation types
export interface InventoryReservation {
  productId: string;
  quantity: number;
  reservedAt: Date;
  orderId?: string;
}

export interface ReservationResult {
  success: boolean;
  reservations: InventoryReservation[];
  errors: Array<{
    productId: string;
    error: string;
  }>;
}
