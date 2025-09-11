# Product API - Result Pattern Implementation

This directory demonstrates the complete implementation of the Result Pattern following the TenisPro architecture standards.

## File Structure

```
product/
├── product.types.ts      # All interfaces and type definitions
├── product.repository.ts # Data access layer with Result Pattern
├── product.service.ts    # Business logic layer with Result Pattern
├── product.router.ts     # tRPC router with unwrap pattern
```

## Key Features

### 1. Clean Type Organization
All interfaces are centralized in `product.types.ts`:
- Repository layer types: `CreateProductData`, `UpdateProductData`, `ProductFilters`
- Service layer types: `CreateProductInput`, `UpdateProductInput`, `ProductListFilters`
- Response types: `ProductStats`, `ProductResponse`, `PaginatedResponse`

### 2. Consistent Error Handling
- Uses `AppError` throughout all layers
- Structured error codes for different scenarios
- Proper error propagation without exceptions

### 3. Clean Router Implementation
Uses the `unwrap` pattern for concise, readable code:

```typescript
// Before (verbose)
getById: publicProcedure
  .input(z.object({ id: z.string().cuid() }))
  .query(async ({ input }) => {
    const result = await productService.getById(input.id);
    if (!result.success) {
      throw convertToTRPCError(result.error);
    }
    return result.data;
  }),

// After (clean)
getById: publicProcedure
  .input(z.object({ id: z.string().cuid() }))
  .query(async ({ input }) => {
    return unwrap(await productService.getById(input.id));
  }),
```

### 4. Service Layer Pattern
Services return `Result<T, AppError>` consistently:

```typescript
async getById(id: string): Promise<Result<Product, AppError>> {
  const result = await this.productRepository.findById(id);
  
  if (!result.success) {
    return err(result.error);
  }

  if (!result.data) {
    return err(createError.productNotFound(id));
  }

  return ok(result.data);
}
```

### 5. Repository Layer Pattern
Repositories use `safeAsync` for database operations:

```typescript
async findById(id: string): Promise<Result<Product | null, AppError>> {
  return safeAsync(async () => {
    const product = await db.product.findUnique({
      where: { id, isDeleted: false }
    });
    return product;
  }).then(result => {
    if (!result.success) {
      return err(createError.databaseError('find product by ID', result.error));
    }
    return ok(result.data);
  });
}
```

## Usage Examples

### Client-Side Usage

```typescript
// React component using tRPC
function ProductList() {
  const { data: products, error } = api.product.getAll.useQuery({
    isActive: true,
    inStock: true
  });

  if (error) {
    // Error is automatically converted from AppError to TRPCError
    return <div>Error: {error.message}</div>;
  }

  return (
    <div>
      {products?.map(product => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
```

### Service Integration

```typescript
// Using the service in business logic
async function processOrder(orderItems: OrderItem[]) {
  for (const item of orderItems) {
    const result = await productService.reserveStock(item.productId, item.quantity);
    
    if (!result.success) {
      // Handle specific error types
      if (result.error.code === 'PRODUCT_INSUFFICIENT_INVENTORY') {
        throw new Error(`Not enough stock for ${item.productId}`);
      }
      throw new Error(`Failed to reserve stock: ${result.error.message}`);
    }
    
    // result.data is guaranteed to be Product here
    console.log(`Reserved ${item.quantity} units of ${result.data.name}`);
  }
}
```

## Benefits

1. **Type Safety**: Full TypeScript support with proper error types
2. **Clean Code**: Minimal boilerplate with the unwrap pattern
3. **Explicit Error Handling**: No hidden exceptions, all errors are explicit
4. **Consistency**: Same pattern across all layers
5. **Maintainability**: Centralized types and error handling
6. **Testability**: Easy to test with predictable Result types

## Testing

```typescript
describe('ProductService', () => {
  it('should return error when product not found', async () => {
    // Mock repository to return not found
    mockRepository.findById.mockResolvedValue(ok(null));
    
    const result = await productService.getById('invalid-id');
    
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe('PRODUCT_NOT_FOUND');
    }
  });
  
  it('should return product when found', async () => {
    const mockProduct = { id: '1', name: 'PROFESIONAL' };
    mockRepository.findById.mockResolvedValue(ok(mockProduct));
    
    const result = await productService.getById('1');
    
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(mockProduct);
    }
  });
});
```

This implementation provides a robust, type-safe, and maintainable foundation for the TenisPro product management system.
