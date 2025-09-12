# TenisPro Result Pattern Implementation Guide

## Overview

The Result Pattern is a functional programming approach to error handling that eliminates the need for throwing exceptions in the TenisPro Order Management System. This guide documents how to properly implement and use the Result Pattern across all layers of the application.

## Core Concepts

### Result Type

```typescript
export type Result<T, E = Error> = {
  success: true;
  data: T;
} | {
  success: false;
  error: E;
};
```

This structure matches the pattern defined in our `.cursorrules` file and provides:

1. **Explicit Error Handling**: Forces developers to handle errors at each step
2. **Type Safety**: TypeScript knows exactly when data can be null
3. **No Exceptions**: Eliminates unexpected crashes from unhandled exceptions
4. **Composable**: Easy to chain operations and propagate errors
5. **Debugging**: Better error tracking with structured error codes

### Helper Functions

```typescript
// Create successful result
function ok<T>(data: T): Result<T, never> {
  return { success: true, data };
}

// Create error result
function err<E extends Error>(error: E): Result<never, E> {
  return { success: false, error };
}

// Safely execute async operations
async function safeAsync<T, E extends Error = Error>(
  fn: () => Promise<T>
): Promise<Result<T, E>> {
  try {
    const data = await fn();
    return ok(data);
  } catch (error) {
    return err(error as E);
  }
}
```

## TenisPro-Specific Error System

### Error Structure

```typescript
export class TenisProError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly layer: 'repository' | 'service' | 'router' = 'service',
    public readonly cause?: Error
  ) {
    super(message);
    this.name = 'TenisProError';
  }
}
```

### Error Categories

#### Order Management Errors
- `ORDER_NOT_FOUND` - Order doesn't exist
- `ORDER_ALREADY_CANCELLED` - Cannot modify cancelled orders
- `ORDER_INVALID_STATUS_TRANSITION` - Invalid status change (e.g., DESPACHADO → PENDIENTE)
- `ORDER_CANNOT_BE_MODIFIED` - Order in final state

#### Product Management Errors
- `PRODUCT_NOT_FOUND` - Product doesn't exist
- `PRODUCT_OUT_OF_STOCK` - No inventory available
- `PRODUCT_INSUFFICIENT_INVENTORY` - Not enough stock for requested quantity
- `PRODUCT_INACTIVE` - Product is deactivated

#### Customer Management Errors
- `CUSTOMER_NOT_FOUND` - Customer doesn't exist
- `CUSTOMER_EMAIL_EXISTS` - Duplicate email registration
- `CUSTOMER_INVALID_EMAIL` - Email format validation failed

#### Notification System Errors (OpenAI)
- `NOTIFICATION_OPENAI_API_ERROR` - OpenAI API failure
- `NOTIFICATION_FAILED_TO_SEND` - Notification delivery failed
- `NOTIFICATION_GENERATION_FAILED` - AI content generation failed

## Layer-by-Layer Implementation

### 1. Repository Layer

**Purpose**: Data persistence with database error handling

```typescript
// src/server/api/repositories/order.repository.ts
import { db } from '@/lib/db';
import { Result, ok, err, safeAsync } from '@/lib/result';
import { TenisProError, createError } from '@/lib/errors';
import { Order, OrderStatus } from '@prisma/client';

export class OrderRepository {
  async findById(id: string): Promise<Result<Order | null, TenisProError>> {
    return safeAsync(async () => {
      const order = await db.order.findUnique({
        where: { id, isDeleted: false },
        include: {
          customer: true,
          orderItems: {
            include: { product: true }
          }
        }
      });
      return order;
    }).then(result => {
      if (!result.success) {
        return err(createError.databaseError('find order by ID', result.error));
      }
      return ok(result.data);
    });
  }

  async updateStatus(id: string, status: OrderStatus): Promise<Result<Order, TenisProError>> {
    return safeAsync(async () => {
      return await db.order.update({
        where: { id },
        data: { 
          orderStatus: status, 
          updatedAt: new Date(),
          // Set timestamps based on status
          ...(status === 'DESPACHADO' && { shippedAt: new Date() }),
          ...(status === 'CANCELADO' && { cancelledAt: new Date() }),
        }
      });
    }).then(result => {
      if (!result.success) {
        return err(createError.databaseError('update order status', result.error));
      }
      return ok(result.data);
    });
  }

  async create(orderData: CreateOrderData): Promise<Result<Order, TenisProError>> {
    return safeAsync(async () => {
      return await db.$transaction(async (tx) => {
        // Create order
        const order = await tx.order.create({
          data: {
            orderNumber: await this.generateOrderNumber(),
            customerId: orderData.customerId,
            orderStatus: 'PENDIENTE',
            subtotal: orderData.subtotal,
            taxAmount: orderData.taxAmount,
            shippingCost: orderData.shippingCost,
            totalAmount: orderData.totalAmount,
          }
        });

        // Create order items
        await tx.orderItem.createMany({
          data: orderData.items.map(item => ({
            orderId: order.id,
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
          }))
        });

        // Update product inventory
        for (const item of orderData.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              availableAmount: {
                decrement: item.quantity
              }
            }
          });
        }

        return order;
      });
    }).then(result => {
      if (!result.success) {
        return err(createError.databaseError('create order', result.error));
      }
      return ok(result.data);
    });
  }

  private async generateOrderNumber(): Promise<string> {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const count = await db.order.count({
      where: {
        createdAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0))
        }
      }
    });
    return `TP-${date}-${(count + 1).toString().padStart(3, '0')}`;
  }
}
```

### 2. Service Layer

**Purpose**: Business logic and domain rules

```typescript
// src/server/api/services/order.service.ts
import { OrderRepository } from '../repositories/order.repository';
import { ProductRepository } from '../repositories/product.repository';
import { NotificationService } from './notification.service';
import { Result, ok, err } from '@/lib/result';
import { TenisProError, createError } from '@/lib/errors';
import { OrderStatus } from '@prisma/client';

export class OrderService {
  constructor(
    private orderRepository: OrderRepository,
    private productRepository: ProductRepository,
    private notificationService: NotificationService
  ) {}

  async getById(id: string): Promise<Result<Order, TenisProError>> {
    const result = await this.orderRepository.findById(id);
    
    if (!result.success) {
      return err(result.error);
    }

    if (!result.data) {
      return err(createError.orderNotFound(id));
    }

    return ok(result.data);
  }

  async updateStatus(id: string, newStatus: OrderStatus): Promise<Result<Order, TenisProError>> {
    // Get current order
    const orderResult = await this.getById(id);
    if (!orderResult.success) {
      return err(orderResult.error);
    }

    const order = orderResult.data;

    // Business logic: Validate status transition
    const validationResult = this.validateStatusTransition(order.orderStatus, newStatus);
    if (!validationResult.success) {
      return err(validationResult.error);
    }

    // Update status in database
    const updateResult = await this.orderRepository.updateStatus(id, newStatus);
    if (!updateResult.success) {
      return err(updateResult.error);
    }

    // Send notification (don't fail the operation if notification fails)
    const notificationResult = await this.notificationService.sendOrderStatusUpdate(
      updateResult.data,
      order.orderStatus,
      newStatus
    );

    if (!notificationResult.success) {
      // Log the notification failure but don't return error
      console.warn('Failed to send notification:', notificationResult.error.message);
    }

    return ok(updateResult.data);
  }

  async createOrder(orderData: CreateOrderInput): Promise<Result<Order, TenisProError>> {
    // Validate products and inventory
    const validationResult = await this.validateOrderItems(orderData.items);
    if (!validationResult.success) {
      return err(validationResult.error);
    }

    // Calculate totals
    const calculationResult = this.calculateOrderTotals(orderData.items);
    if (!calculationResult.success) {
      return err(calculationResult.error);
    }

    // Create order
    const createResult = await this.orderRepository.create({
      ...orderData,
      ...calculationResult.data,
    });

    if (!createResult.success) {
      return err(createResult.error);
    }

    // Send order confirmation notification
    await this.notificationService.sendOrderConfirmation(createResult.data);

    return ok(createResult.data);
  }

  private validateStatusTransition(
    currentStatus: OrderStatus, 
    newStatus: OrderStatus
  ): Result<void, TenisProError> {
    const validTransitions: Record<OrderStatus, OrderStatus[]> = {
      'PENDIENTE': ['PROCESANDO', 'CANCELADO'],
      'PROCESANDO': ['DESPACHADO', 'CANCELADO'],
      'DESPACHADO': ['CANCELADO'], // Only cancellation allowed after shipping
      'CANCELADO': [], // No transitions from cancelled
    };

    const allowedTransitions = validTransitions[currentStatus] || [];
    
    if (!allowedTransitions.includes(newStatus)) {
      return err(createError.invalidStatusTransition(currentStatus, newStatus));
    }

    return ok(undefined);
  }

  private async validateOrderItems(items: OrderItemInput[]): Promise<Result<void, TenisProError>> {
    for (const item of items) {
      // Check product exists
      const productResult = await this.productRepository.findById(item.productId);
      if (!productResult.success) {
        return err(productResult.error);
      }

      if (!productResult.data) {
        return err(createError.productNotFound(item.productId));
      }

      const product = productResult.data;

      // Check if product is active
      if (!product.isActive) {
        return err(createError.productInactive(product.name));
      }

      // Check inventory
      if (product.availableAmount < item.quantity) {
        return err(createError.insufficientInventory(
          product.name, 
          product.availableAmount, 
          item.quantity
        ));
      }
    }

    return ok(undefined);
  }

  private calculateOrderTotals(items: OrderItemInput[]): Result<OrderTotals, TenisProError> {
    try {
      const subtotal = items.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
      const taxAmount = subtotal * 0.19; // 19% IVA in Colombia
      const shippingCost = subtotal > 200000 ? 0 : 15000; // Free shipping over $200,000 COP
      const totalAmount = subtotal + taxAmount + shippingCost;

      return ok({
        subtotal,
        taxAmount,
        shippingCost,
        totalAmount,
      });
    } catch (error) {
      return err(createError.internalError('Failed to calculate order totals', error as Error));
    }
  }
}
```

### 3. Router Layer (tRPC)

**Purpose**: API request handling and client error communication

```typescript
// src/server/api/routers/order.router.ts
import { createTRPCRouter, publicProcedure } from '../trpc';
import { OrderService } from '../services/order.service';
import { OrderRepository } from '../repositories/order.repository';
import { ProductRepository } from '../repositories/product.repository';
import { NotificationService } from '../services/notification.service';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { TenisProError } from '@/lib/errors';

// Initialize services
const orderRepository = new OrderRepository();
const productRepository = new ProductRepository();
const notificationService = new NotificationService();
const orderService = new OrderService(orderRepository, productRepository, notificationService);

// Input schemas
const OrderStatusSchema = z.enum(['PENDIENTE', 'PROCESANDO', 'DESPACHADO', 'CANCELADO']);

const CreateOrderSchema = z.object({
  customerId: z.string().cuid(),
  items: z.array(z.object({
    productId: z.string().cuid(),
    quantity: z.number().min(1),
    unitPrice: z.number().min(0),
  })).min(1),
  customerNotes: z.string().optional(),
  shippingAddress: z.string().min(1),
  billingAddress: z.string().optional(),
});

/**
 * Convert TenisProError to TRPCError with appropriate HTTP codes
 */
function convertToTRPCError(error: TenisProError): TRPCError {
  // Map error codes to HTTP status codes
  const codeMap: Record<string, TRPCError['code']> = {
    'ORDER_NOT_FOUND': 'NOT_FOUND',
    'PRODUCT_NOT_FOUND': 'NOT_FOUND',
    'CUSTOMER_NOT_FOUND': 'NOT_FOUND',
    'ORDER_ALREADY_CANCELLED': 'CONFLICT',
    'ORDER_INVALID_STATUS_TRANSITION': 'CONFLICT',
    'PRODUCT_OUT_OF_STOCK': 'CONFLICT',
    'PRODUCT_INSUFFICIENT_INVENTORY': 'CONFLICT',
    'CUSTOMER_EMAIL_EXISTS': 'CONFLICT',
    'VALIDATION_INVALID_INPUT': 'BAD_REQUEST',
    'VALIDATION_REQUIRED_FIELD': 'BAD_REQUEST',
    'AUTH_UNAUTHORIZED': 'UNAUTHORIZED',
    'AUTH_FORBIDDEN': 'FORBIDDEN',
    'DATABASE_CONNECTION_ERROR': 'INTERNAL_SERVER_ERROR',
    'SYSTEM_INTERNAL_ERROR': 'INTERNAL_SERVER_ERROR',
  };

  const code = codeMap[error.code] || 'INTERNAL_SERVER_ERROR';

  return new TRPCError({
    code,
    message: error.message,
    cause: error,
  });
}

export const orderRouter = createTRPCRouter({
  getById: publicProcedure
    .input(z.object({ id: z.string().cuid() }))
    .query(async ({ input }) => {
      const result = await orderService.getById(input.id);
      
      if (!result.success) {
        throw convertToTRPCError(result.error);
      }
      
      return result.data;
    }),

  updateStatus: publicProcedure
    .input(z.object({
      id: z.string().cuid(),
      status: OrderStatusSchema,
    }))
    .mutation(async ({ input }) => {
      const result = await orderService.updateStatus(input.id, input.status);
      
      if (!result.success) {
        throw convertToTRPCError(result.error);
      }
      
      return result.data;
    }),

  create: publicProcedure
    .input(CreateOrderSchema)
    .mutation(async ({ input }) => {
      const result = await orderService.createOrder(input);
      
      if (!result.success) {
        throw convertToTRPCError(result.error);
      }
      
      return result.data;
    }),

  getAll: publicProcedure
    .input(z.object({
      page: z.number().min(1).default(1),
      limit: z.number().min(1).max(100).default(20),
      status: OrderStatusSchema.optional(),
      customerId: z.string().cuid().optional(),
    }))
    .query(async ({ input }) => {
      const result = await orderService.getAll({
        page: input.page,
        limit: input.limit,
        filters: {
          status: input.status,
          customerId: input.customerId,
        }
      });
      
      if (!result.success) {
        throw convertToTRPCError(result.error);
      }
      
      return result.data;
    }),

  cancel: publicProcedure
    .input(z.object({
      id: z.string().cuid(),
      reason: z.string().min(1),
    }))
    .mutation(async ({ input }) => {
      const result = await orderService.cancel(input.id, input.reason);
      
      if (!result.success) {
        throw convertToTRPCError(result.error);
      }
      
      return result.data;
    }),
});
```

## Client-Side Usage

### React Query Integration

```typescript
// components/orders/OrderStatusUpdater.tsx
import { api } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

interface OrderStatusUpdaterProps {
  orderId: string;
  currentStatus: string;
}

export function OrderStatusUpdater({ orderId, currentStatus }: OrderStatusUpdaterProps) {
  const { toast } = useToast();
  const utils = api.useContext();

  const updateStatus = api.order.updateStatus.useMutation({
    onSuccess: (updatedOrder) => {
      toast({
        title: "Order Updated",
        description: `Order status changed to ${updatedOrder.orderStatus}`,
      });
      
      // Invalidate and refetch order data
      utils.order.getById.invalidate({ id: orderId });
      utils.order.getAll.invalidate();
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleStatusUpdate = (newStatus: string) => {
    updateStatus.mutate({
      id: orderId,
      status: newStatus as any,
    });
  };

  return (
    <div className="flex gap-2">
      {currentStatus === 'PENDIENTE' && (
        <Button 
          onClick={() => handleStatusUpdate('PROCESANDO')}
          disabled={updateStatus.isLoading}
        >
          Mark as Processing
        </Button>
      )}
      
      {currentStatus === 'PROCESANDO' && (
        <Button 
          onClick={() => handleStatusUpdate('DESPACHADO')}
          disabled={updateStatus.isLoading}
        >
          Mark as Shipped
        </Button>
      )}
      
      {['PENDIENTE', 'PROCESANDO'].includes(currentStatus) && (
        <Button 
          variant="destructive"
          onClick={() => handleStatusUpdate('CANCELADO')}
          disabled={updateStatus.isLoading}
        >
          Cancel Order
        </Button>
      )}
    </div>
  );
}
```

### Error Handling Patterns

```typescript
// hooks/useOrderOperations.ts
import { api } from '@/lib/trpc';
import { useToast } from '@/components/ui/use-toast';

export function useOrderOperations() {
  const { toast } = useToast();

  const createOrder = api.order.create.useMutation({
    onError: (error) => {
      // Handle specific error types
      if (error.data?.code === 'CONFLICT') {
        if (error.message.includes('out of stock')) {
          toast({
            title: "Product Unavailable",
            description: "One or more products in your order are out of stock.",
            variant: "destructive",
          });
        } else if (error.message.includes('insufficient inventory')) {
          toast({
            title: "Insufficient Stock",
            description: "Not enough inventory available for your requested quantity.",
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Order Creation Failed",
          description: error.message,
          variant: "destructive",
        });
      }
    },
    onSuccess: (order) => {
      toast({
        title: "Order Created",
        description: `Order ${order.orderNumber} has been created successfully.`,
      });
    },
  });

  return {
    createOrder,
  };
}
```

## OpenAI Integration Example

```typescript
// src/server/api/services/notification.service.ts
import { Result, ok, err, safeAsync } from '@/lib/result';
import { TenisProError, createError } from '@/lib/errors';
import OpenAI from 'openai';

export class NotificationService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async sendOrderStatusUpdate(
    order: Order,
    previousStatus: OrderStatus,
    newStatus: OrderStatus
  ): Promise<Result<void, TenisProError>> {
    // Generate personalized message using OpenAI
    const messageResult = await this.generateStatusUpdateMessage(order, previousStatus, newStatus);
    if (!messageResult.success) {
      return err(messageResult.error);
    }

    // Here you would integrate with your email/SMS service
    // For now, we'll just log the generated message
    console.log('Generated notification:', messageResult.data);

    return ok(undefined);
  }

  private async generateStatusUpdateMessage(
    order: Order,
    previousStatus: OrderStatus,
    newStatus: OrderStatus
  ): Promise<Result<string, TenisProError>> {
    const statusTranslations = {
      'PENDIENTE': 'pending',
      'PROCESANDO': 'being processed',
      'DESPACHADO': 'shipped',
      'CANCELADO': 'cancelled',
    };

    const prompt = `Generate a friendly, professional notification message for a tennis equipment store customer. 
    
Order details:
- Order Number: ${order.orderNumber}
- Previous Status: ${statusTranslations[previousStatus]}
- New Status: ${statusTranslations[newStatus]}
- Total Amount: $${order.totalAmount}

The message should be warm, informative, and include relevant next steps for the customer. Keep it concise but personalized.`;

    return safeAsync(async () => {
      const completion = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a helpful customer service assistant for TenisPro, a tennis equipment company. Generate professional, friendly notification messages."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 200,
        temperature: 0.7,
      });

      return completion.choices[0]?.message?.content || "Your order status has been updated.";
    }).then(result => {
      if (!result.success) {
        return err(createError.openaiError(result.error.message));
      }
      return ok(result.data);
    });
  }
}
```

## Best Practices

### Do's ✅

1. **Always use the Result Pattern** for operations that can fail
2. **Check for errors immediately** after each operation
3. **Use meaningful error codes** from the `ErrorCodes` constant
4. **Propagate errors up** the chain with proper context
5. **Use TypeScript's type narrowing** - after checking `if (!result.success)`, TypeScript knows the error type
6. **Convert errors appropriately** at the router layer for client consumption
7. **Log errors with context** but don't expose internal details to clients
8. **Handle OpenAI failures gracefully** - don't let notification failures break core operations
9. **Use transactions** for complex operations that need atomicity
10. **Validate business rules** in the service layer, not just input validation

### Don'ts ❌

1. **Don't throw exceptions** - always return Results
2. **Don't ignore error cases** - always check the success field
3. **Don't expose internal error details** to clients
4. **Don't let notification failures** break core business operations
5. **Don't mix patterns** - use Result consistently across all layers
6. **Don't create generic error messages** - use specific, actionable error messages

### Common Patterns

**Error Propagation**:
```typescript
const result = await someOperation();
if (!result.success) {
  return err(result.error);
}
// TypeScript knows result.data is available here
```

**Error Transformation**:
```typescript
const result = await repository.getOrder(id);
if (!result.success) {
  return err(createError.orderNotFound(id));
}
```

**Multiple Operation Chain**:
```typescript
const orderResult = await this.getById(id);
if (!orderResult.success) return err(orderResult.error);

const validationResult = await this.validateOperation(orderResult.data);
if (!validationResult.success) return err(validationResult.error);

return ok(processedData);
```

## File Structure

```
src/
├── lib/
│   ├── result.ts           # Result type and helper functions
│   └── errors.ts           # TenisPro-specific error definitions
├── server/
│   └── api/
│       ├── repositories/   # Data access layer
│       │   ├── order.repository.ts
│       │   ├── product.repository.ts
│       │   └── customer.repository.ts
│       ├── services/       # Business logic layer
│       │   ├── order.service.ts
│       │   ├── product.service.ts
│       │   └── notification.service.ts
│       └── routers/        # API endpoints
│           ├── order.router.ts
│           ├── product.router.ts
│           └── customer.router.ts
└── components/             # Client-side components
    └── orders/
        ├── OrderStatusUpdater.tsx
        └── OrderCreationForm.tsx
```

## Conclusion

The Result Pattern provides TenisPro with:

- **Reliable order management** with explicit error handling
- **Safe OpenAI integration** that won't break core operations
- **Better debugging** with structured error codes and layer tracking
- **Improved user experience** with meaningful error messages
- **Type safety** throughout the application
- **Maintainable code** with consistent error handling patterns

This approach ensures that the tennis equipment order management system is robust, user-friendly, and maintainable as it scales.
