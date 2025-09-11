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

export interface CreateCustomerData {
  name: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  taxId?: string;
  companyName?: string;
}

export interface UpdateCustomerData {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  taxId?: string;
  companyName?: string;
  isActive?: boolean;
}

export interface CustomerFilters {
  name?: string;
  email?: string;
  isActive?: boolean;
}

// ----------------------------
// Service Layer Interfaces
// ----------------------------

export interface CreateCustomerInput extends CreateCustomerData {}
export interface UpdateCustomerInput extends UpdateCustomerData {}
export interface CustomerListFilters extends CustomerFilters {}

// ----------------------------
// Response Types
// ----------------------------

export interface CustomerResponse {
  customers: Customer[];
  total: number;
}
