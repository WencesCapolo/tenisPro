/**
 * Order Item Service - Business Logic Layer
 * Handles order item-related business logic with Result pattern
 */

import { Result, ok, err } from '../../../lib/result';
import { AppError, createError } from '../../../lib/errors';
import { OrderItemRepository } from './orderItem.repository';
import {
  CreateOrderItemInput,
  OrderItemListFilters,
  OrderItemWithRelations,
  PaginatedResponse,
  OrderItemCalculation,
  StockValidationResult,
  CreateOrderItemData,
  CreateOrderItemSchema
} from './orderItem.types';

export class OrderItemService {
  constructor(private orderItemRepository: OrderItemRepository) {}

  /**
   * Validate stock availability for order item
   */
  private async validateStock(productId: string, quantity: number): Promise<Result<StockValidationResult, AppError>> {
    const productResult = await this.orderItemRepository.findProductById(productId);
    
    if (!productResult.success) {
      return err(productResult.error);
    }

    const product = productResult.data;
    if (!product) {
      return err(createError.productNotFound(productId));
    }

    const validationResult: StockValidationResult = {
      isValid: product.availableAmount >= quantity,
      availableStock: product.availableAmount,
      requestedQuantity: quantity,
      productName: product.name,
    };

    return ok(validationResult);
  }

  /**
   * Calculate order item totals
   */
  private calculateOrderItemTotals(
    quantity: number,
    unitPrice: number,
    discount: number = 0
  ): OrderItemCalculation {
    const subtotal = quantity * unitPrice;
    const totalPrice = subtotal - discount;

    return {
      unitPrice,
      quantity,
      subtotal,
      discount,
      totalPrice: Math.max(0, totalPrice), // Ensure total is not negative
    };
  }

  /**
   * Create a new order item
   */
  async create(input: CreateOrderItemInput): Promise<Result<OrderItemWithRelations, AppError>> {
    // Validate input
    const validation = CreateOrderItemSchema.safeParse(input);
    if (!validation.success) {
      return err(createError.validationError('orderItem', validation.error.message));
    }	

    // Get product information
    const productResult = await this.orderItemRepository.findProductById(input.productId);
    if (!productResult.success) {
      return err(productResult.error);
    }

    const product = productResult.data;
    if (!product) {
      return err(createError.productNotFound(input.productId));
    }

    // Use provided unit price or get from product
    const unitPrice = input.unitPrice ?? Number(product.price);

    // Validate stock if quantity is specified
    const stockValidation = await this.validateStock(input.productId, input.quantity);
    if (!stockValidation.success) {
      return err(stockValidation.error);
    }

    if (!stockValidation.data.isValid) {
      return err(createError.insufficientInventory(
        stockValidation.data.productName,
        stockValidation.data.availableStock,
        stockValidation.data.requestedQuantity
      ));
    }

    // Calculate totals
    const calculation = this.calculateOrderItemTotals(
      input.quantity,
      unitPrice,
      input.discount || 0
    );

    // Prepare order item data
    const orderItemData: CreateOrderItemData = {
      orderId: input.orderId,
      productId: input.productId,
      quantity: input.quantity,
      unitPrice: calculation.unitPrice,
      totalPrice: calculation.totalPrice,
      discount: calculation.discount,
    };

    // Create order item
    const createResult = await this.orderItemRepository.create(orderItemData);

    if (!createResult.success) {
      return err(createResult.error);
    }

    return ok(createResult.data);
  }

  /**
   * Get order item by ID
   */
  async getById(id: string): Promise<Result<OrderItemWithRelations, AppError>> {
    const result = await this.orderItemRepository.findById(id);
    
    if (!result.success) {
      return err(result.error);
    }

    if (!result.data) {
      return err(createError.validationError('id', 'Order item not found'));
    }

    return ok(result.data);
  }

  /**
   * Get all order items with filters and pagination
   */
  async getAll(filters: OrderItemListFilters): Promise<Result<PaginatedResponse<OrderItemWithRelations>, AppError>> {
    const { page, limit, ...orderItemFilters } = filters;
    
    const result = await this.orderItemRepository.findMany(
      orderItemFilters,
      { page, limit }
    );

    if (!result.success) {
      return err(result.error);
    }

    return ok(result.data);
  }

  /**
   * Check if order item can be modified
   */
  async canModify(id: string): Promise<Result<boolean, AppError>> {
    const orderItemResult = await this.orderItemRepository.findById(id);
    if (!orderItemResult.success) {
      return err(orderItemResult.error);
    }

    if (!orderItemResult.data) {
      return err(createError.validationError('id', 'Order item not found'));
    }

    const orderItem = orderItemResult.data;

    // Check order status - can't modify items of shipped or delivered orders
    const canModify = !['DESPACHADO', 'CANCELADO', 'PROCESANDO'].includes(orderItem.order.orderStatus);

    return ok(canModify);
  }
}
