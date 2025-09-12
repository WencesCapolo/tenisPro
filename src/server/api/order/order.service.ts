/**
 * Order Service - Business Logic Layer
 * Handles order-related business logic with Result pattern
 */

import { Result, ok, err } from '../../../lib/result';
import { AppError, createError } from '../../../lib/errors';
import { OrderRepository } from './order.repository';
import { OrderStatus } from '@prisma/client';
import {
  CreateOrderInput,
  UpdateOrderInput,
  OrderListFilters,
  OrderWithRelations,
  PaginatedResponse,
  OrderStats,
  StockValidationResult,
  OrderCalculation,
  StatusTransitionValidation,
  ORDER_STATUS_TRANSITIONS,
  TAX_RATE,
  CreateOrderData,
  CreateOrderItemData,
  UpdateOrderData,
} from './order.types';
import { CreateCustomerData } from '../customer/customer.types';

export class OrderService {
  constructor(private orderRepository: OrderRepository) {}

  /**
   * Validate stock availability for order items
   */
  private async validateStock(orderItems: CreateOrderInput['orderItems']): Promise<Result<StockValidationResult, AppError>> {
    const validationResult: StockValidationResult = {
      isValid: true,
      errors: [],
    };

    for (const item of orderItems) {
      const productResult = await this.orderRepository.findProductById(item.productId);
      
      if (!productResult.success) {
        return productResult;
      }

      const product = productResult.data;
      if (!product) {
        validationResult.isValid = false;
        validationResult.errors.push({
          productId: item.productId,
          productName: 'Unknown Product',
          requested: item.quantity,
          available: 0,
        });
        continue;
      }

      if (product.availableAmount < item.quantity) {
        validationResult.isValid = false;
        validationResult.errors.push({
          productId: item.productId,
          productName: product.name,
          requested: item.quantity,
          available: product.availableAmount,
        });
      }
    }

    return ok(validationResult);
  }

  /**
   * Calculate order totals
   */
  private async calculateOrderTotals(
    orderItems: CreateOrderInput['orderItems'],
    shippingCost: number = 0,
    discount: number = 0
  ): Promise<Result<OrderCalculation, AppError>> {
    let subtotal = 0;

    // Calculate subtotal by getting current product prices
    for (const item of orderItems) {
      const productResult = await this.orderRepository.findProductById(item.productId);
      
      if (!productResult.success) {
        return productResult;
      }

      const product = productResult.data;
      if (!product) {
        return err(createError.productNotFound(item.productId));
      }

      const unitPrice = item.unitPrice ?? Number(product.price);
      subtotal += unitPrice * item.quantity;
    }

    const taxAmount = subtotal * TAX_RATE;
    const totalAmount = subtotal + taxAmount + shippingCost - discount;

    return ok({
      subtotal,
      taxAmount,
      shippingCost,
      discount,
      totalAmount,
    });
  }

  /**
   * Validate status transition
   */
  private validateStatusTransition(currentStatus: OrderStatus, newStatus: OrderStatus): StatusTransitionValidation {
    const allowedTransitions = ORDER_STATUS_TRANSITIONS[currentStatus];
    
    if (!allowedTransitions.includes(newStatus)) {
      return {
        isValid: false,
        error: `Cannot transition from ${currentStatus} to ${newStatus}. Allowed transitions: ${allowedTransitions.join(', ')}`,
      };
    }

    return { isValid: true };
  }

  /**
   * Get or create customer
   */
  private async getOrCreateCustomer(input: CreateOrderInput): Promise<Result<string, AppError>> {
    if (input.customerId) {
      // Validate existing customer
      const customerResult = await this.orderRepository.findCustomerById(input.customerId);
      
      if (!customerResult.success) {
        return customerResult;
      }

      if (!customerResult.data) {
        return err(createError.customerNotFound(input.customerId));
      }

      return ok(input.customerId);
    }

    if (input.customer) {
      // Check if customer with email already exists
      const existingCustomerResult = await this.orderRepository.findCustomerByEmail(input.customer.email);
      
      if (!existingCustomerResult.success) {
        return existingCustomerResult;
      }

      if (existingCustomerResult.data) {
        return ok(existingCustomerResult.data.id);
      }

      // Create new customer
      if (!input.customer.name) {
        return err(createError.validationError('customer.name', 'Customer name is required'));
      }
      if (!input.customer.email) {
        return err(createError.validationError('customer.email', 'Customer email is required'));
      }
      
      const createResult = await this.orderRepository.createCustomer({
        name: input.customer.name,
        email: input.customer.email,
        phone: input.customer.phone,
        address: input.customer.address,
        city: input.customer.city,
        state: input.customer.state,
        postalCode: input.customer.postalCode,
        country: input.customer.country,
        taxId: input.customer.taxId,
        companyName: input.customer.companyName,
      });
      
      if (!createResult.success) {
        return createResult;
      }

      return ok(createResult.data);
    }

    return err(createError.validationError('customer', 'Either customerId or customer data must be provided'));
  }

  /**
   * Create a new order
   */
  async create(input: CreateOrderInput): Promise<Result<OrderWithRelations, AppError>> {
    // Validate stock
    const stockValidation = await this.validateStock(input.orderItems);
    if (!stockValidation.success) {
      return stockValidation as Result<OrderWithRelations, AppError>;
    }

    if (!stockValidation.data.isValid) {
      const errorMessages = stockValidation.data.errors.map(
        error => `${error.productName}: requested ${error.requested}, available ${error.available}`
      ).join('; ');
      
      return err(createError.insufficientInventory('Multiple products', 0, 0));
    }

    // Get or create customer
    const customerResult = await this.getOrCreateCustomer(input);
    if (!customerResult.success) {
      return customerResult as Result<OrderWithRelations, AppError>;
    }

    const customerId = customerResult.data;

    // Calculate totals
    const calculationResult = await this.calculateOrderTotals(
      input.orderItems,
      input.shippingCost,
      input.discount
    );
    
    if (!calculationResult.success) {
      return calculationResult as Result<OrderWithRelations, AppError>;
    }

    const calculation = calculationResult.data;

    // Generate order number
    const orderNumberResult = await this.orderRepository.generateOrderNumber();
    if (!orderNumberResult.success) {
      return orderNumberResult as Result<OrderWithRelations, AppError>;
    }

    // Prepare order data
    const orderData: CreateOrderData = {
      orderNumber: orderNumberResult.data,
      orderStatus: 'PENDIENTE',
      customerId,
      totalAmount: calculation.totalAmount,
      subtotal: calculation.subtotal,
      taxAmount: calculation.taxAmount,
      shippingCost: calculation.shippingCost,
      discount: calculation.discount,
      notes: input.notes,
      customerNotes: input.customerNotes,
      shippingAddress: input.shippingAddress,
      billingAddress: input.billingAddress,
    };

    // Prepare order items data
    const orderItemsData: Omit<CreateOrderItemData, 'orderId'>[] = [];
    
    for (const item of input.orderItems) {
      const productResult = await this.orderRepository.findProductById(item.productId);
      if (!productResult.success) {
        return productResult;
      }

      const product = productResult.data!;
      const unitPrice = item.unitPrice ?? Number(product.price);
      const totalPrice = unitPrice * item.quantity;

      orderItemsData.push({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice,
        totalPrice,
        discount: 0, // Item-level discount can be added later
      });
    }

    // Create order
    const createResult = await this.orderRepository.create(
      orderData,
      orderItemsData.map(item => ({ ...item, orderId: '' })) // orderId will be set in repository
    );

    if (!createResult.success) {
      return createResult;
    }

    return ok(createResult.data);
  }

  /**
   * Get order by ID
   */
  async getById(id: string): Promise<Result<OrderWithRelations, AppError>> {
    const result = await this.orderRepository.findById(id);
    
    if (!result.success) {
      return result;
    }

    if (!result.data) {
      return err(createError.orderNotFound(id));
    }

    return ok(result.data);
  }

  /**
   * Get order by order number
   */
  async getByOrderNumber(orderNumber: string): Promise<Result<OrderWithRelations, AppError>> {
    const result = await this.orderRepository.findByOrderNumber(orderNumber);
    
    if (!result.success) {
      return result;
    }

    if (!result.data) {
      return err(createError.orderNotFound());
    }

    return ok(result.data);
  }

  /**
   * Get all orders with filters and pagination
   */
  async getAll(filters: OrderListFilters): Promise<Result<PaginatedResponse<OrderWithRelations>, AppError>> {
    const { page, limit, ...orderFilters } = filters;
    
    const result = await this.orderRepository.findMany(
      {
        ...orderFilters,
        // Convert date strings to Date objects if provided
        ...(filters.dateFrom && { dateFrom: new Date(filters.dateFrom) }),
        ...(filters.dateTo && { dateTo: new Date(filters.dateTo) }),
      },
      { page, limit }
    );

    if (!result.success) {
      return result;
    }

    return ok(result.data);
  }

  /**
   * Update an order
   */
  async update(id: string, input: UpdateOrderInput): Promise<Result<OrderWithRelations, AppError>> {
    // Get current order
    const currentOrderResult = await this.orderRepository.findById(id);
    if (!currentOrderResult.success) {
      return currentOrderResult;
    }

    if (!currentOrderResult.data) {
      return err(createError.orderNotFound(id));
    }

    const currentOrder = currentOrderResult.data;

    // Validate status transition if status is being changed
    if (input.orderStatus && input.orderStatus !== currentOrder.orderStatus) {
      const transitionValidation = this.validateStatusTransition(
        currentOrder.orderStatus,
        input.orderStatus
      );

      if (!transitionValidation.isValid) {
        return err(createError.invalidStatusTransition(
          currentOrder.orderStatus,
          input.orderStatus
        ));
      }
    }

    // Prepare update data
    const updateData: UpdateOrderData = {
      ...input,
      // Set timestamps based on status changes
      ...(input.orderStatus === 'DESPACHADO' && { shippedAt: new Date() }),
      ...(input.orderStatus === 'CANCELADO' && { 
        cancelledAt: new Date(),
        cancellationReason: input.cancellationReason 
      }),
    };

    const result = await this.orderRepository.update(id, updateData);

    if (!result.success) {
      return result;
    }

    return ok(result.data);
  }

  /**
   * Cancel an order
   */
  async cancel(id: string, reason?: string): Promise<Result<OrderWithRelations, AppError>> {
    // Get current order
    const currentOrderResult = await this.orderRepository.findById(id);
    if (!currentOrderResult.success) {
      return currentOrderResult;
    }

    if (!currentOrderResult.data) {
      return err(createError.orderNotFound(id));
    }

    const currentOrder = currentOrderResult.data;

    // Check if order can be cancelled
    if (currentOrder.orderStatus === 'CANCELADO') {
      return err(createError.orderAlreadyCancelled(id));
    }

    // Validate transition to cancelled
    const transitionValidation = this.validateStatusTransition(
      currentOrder.orderStatus,
      'CANCELADO'
    );

    if (!transitionValidation.isValid) {
      return err(createError.invalidStatusTransition(
        currentOrder.orderStatus,
        'CANCELADO'
      ));
    }

    const result = await this.orderRepository.cancelOrder(id, reason);

    if (!result.success) {
      return result;
    }

    return ok(result.data);
  }

  /**
   * Delete an order (soft delete)
   */
  async delete(id: string): Promise<Result<void, AppError>> {
    // Check if order exists and can be deleted
    const orderResult = await this.orderRepository.findById(id);
    if (!orderResult.success) {
      return orderResult as Result<void, AppError>;
    }

    if (!orderResult.data) {
      return err(createError.orderNotFound(id));
    }

    const order = orderResult.data;

    // Only allow deletion of cancelled or pending orders
    if (order.orderStatus !== 'CANCELADO' && order.orderStatus !== 'PENDIENTE') {
      return err(createError.validationError(
        'orderStatus',
        'Only cancelled or pending orders can be deleted'
      ));
    }

    const result = await this.orderRepository.delete(id);

    if (!result.success) {
      return result;
    }

    return ok(undefined);
  }

  /**
   * Get order statistics
   */
  async getStats(): Promise<Result<OrderStats, AppError>> {
    const result = await this.orderRepository.getStats();

    if (!result.success) {
      return result;
    }

    return ok(result.data);
  }

  /**
   * Get orders by customer
   */
  async getByCustomerId(customerId: string, pagination?: { page?: number; limit?: number }): Promise<Result<PaginatedResponse<OrderWithRelations>, AppError>> {
    const result = await this.orderRepository.findMany(
      { customerId },
      pagination || {}
    );

    if (!result.success) {
      return result;
    }

    return ok(result.data);
  }

  /**
   * Get pending orders
   */
  async getPendingOrders(): Promise<Result<OrderWithRelations[], AppError>> {
    const result = await this.orderRepository.findMany(
      { orderStatus: 'PENDIENTE' },
      { limit: 100 }
    );

    if (!result.success) {
      return result as Result<OrderWithRelations[], AppError>;
    }

    return ok(result.data.data);
  }

  /**
   * Update order status
   */
  async updateStatus(id: string, status: OrderStatus, reason?: string): Promise<Result<OrderWithRelations, AppError>> {
    return this.update(id, {
      orderStatus: status,
      ...(status === 'CANCELADO' && reason && { cancellationReason: reason }),
    });
  }
}
