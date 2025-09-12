import { Customer } from '@prisma/client';
import { z } from 'zod';

/**
 * Customer-related type definitions for TenisPro
 * Follows Result Pattern shared by all API modules
 */

// ----------------------------
// Zod Schemas (Router Layer)
// ----------------------------

export const CreateCustomerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().optional(),
  taxId: z.string().optional(),
  companyName: z.string().optional(),
});

export const UpdateCustomerSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().optional(),
  taxId: z.string().optional(),
  companyName: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const CustomerFiltersSchema = z.object({
  name: z.string().optional(),
  email: z.string().optional(),
  isActive: z.boolean().optional(),
});

// ----------------------------
// Repository Layer Interfaces
// ----------------------------

export type CreateCustomerData = z.infer<typeof CreateCustomerSchema>;

export type UpdateCustomerData = z.infer<typeof UpdateCustomerSchema>;

export type CustomerFilters = z.infer<typeof CustomerFiltersSchema>;

// ----------------------------
// Service Layer Interfaces
// ----------------------------

export type CreateCustomerInput = z.infer<typeof CreateCustomerSchema>;
export type UpdateCustomerInput = z.infer<typeof UpdateCustomerSchema>;
export type CustomerListFilters = z.infer<typeof CustomerFiltersSchema>;

// ----------------------------
// Response Types
// ----------------------------

export interface CustomerResponse {
  customers: Customer[];
  total: number;
}
