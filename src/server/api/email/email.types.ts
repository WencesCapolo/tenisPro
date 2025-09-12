/**
 * Email API Types and Schemas
 * Defines types for email generation functionality
 */

import { z } from 'zod';

/**
 * Schema for email generation request
 */
export const GenerateEmailSchema = z.object({
  orderNumber: z.string().min(1, 'Order number is required'),
  customerName: z.string().min(1, 'Customer name is required'),
});

/**
 * Input type for email generation
 */
export type GenerateEmailInput = z.infer<typeof GenerateEmailSchema>;

/**
 * Generated email response
 */
export interface GeneratedEmail {
  content: string;
  orderNumber: string;
  customerName: string;
  generatedAt: Date;
}

/**
 * OpenAI configuration interface
 */
export interface OpenAIConfig {
  apiKey: string;
  model: string;
  maxTokens: number;
  temperature: number;
}

/**
 * Email generation prompt template
 */
export interface EmailPromptData {
  orderNumber: string;
  customerName: string;
}
