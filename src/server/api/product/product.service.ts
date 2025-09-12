import { ProductRepository } from './product.repository';
import { Result, ok, err } from '../../../lib/result';
import { AppError, createError } from '../../../lib/errors';
import { Product, ProductType } from '@prisma/client';
import {
  CreateProductInput,
  UpdateProductInput,
  ProductListFilters,
  ProductStats
} from './product.types';

export class ProductService {
  constructor(private productRepository: ProductRepository) {}

  async getById(id: string): Promise<Result<Product, AppError>> {
    const result = await this.productRepository.findById(id);
    
    if (!result.success) {
      return err((result as { success: false; error: AppError }).error);
    }

    if (!result.data) {
      return err(createError.productNotFound(id));
    }

    return ok(result.data);
  }

  async getAll(filters: ProductListFilters = {}): Promise<Result<Product[], AppError>> {
    const result = await this.productRepository.findMany(filters);
    
    if (!result.success) {
      return err((result as { success: false; error: AppError }).error);
    }

    return ok(result.data);
  }

  async getActiveProducts(): Promise<Result<Product[], AppError>> {
    const result = await this.productRepository.findMany({
      isActive: true,
      inStock: true
    });
    
    if (!result.success) {
      return err((result as { success: false; error: AppError }).error);
    }

    return ok(result.data);
  }

  async create(productInput: CreateProductInput): Promise<Result<Product, AppError>> {
    // Business validation
    const validationResult = this.validateProductData(productInput);
    if (!validationResult.success) {
      return err(validationResult.error);
    }

    // Check if SKU already exists (if provided)
    if (productInput.sku) {
      const existingProductResult = await this.productRepository.findMany({});
      if (existingProductResult.success) {
        const existingProduct = existingProductResult.data.find(p => p.sku === productInput.sku);
        if (existingProduct) {
          return err(createError.constraintViolation(`Product with SKU ${productInput.sku} already exists`));
        }
      }
    }

    // Create product
    const createResult = await this.productRepository.create(productInput);
    if (!createResult.success) {
      return err(createResult.error);
    }

    return ok(createResult.data);
  }

  async update(id: string, productInput: UpdateProductInput): Promise<Result<Product, AppError>> {
    // Check if product exists
    const existingProductResult = await this.getById(id);
    if (!existingProductResult.success) {
      return err(existingProductResult.error);
    }

    // Business validation for updates
    if (productInput.price !== undefined) {
      const priceValidation = this.validatePrice(productInput.price);
      if (!priceValidation.success) {
        return err(priceValidation.error);
      }
    }

    if (productInput.availableAmount !== undefined) {
      const stockValidation = this.validateStock(productInput.availableAmount);
      if (!stockValidation.success) {
        return err(stockValidation.error);
      }
    }

    // Update product
    const updateResult = await this.productRepository.update(id, productInput);
    if (!updateResult.success) {
      return err(updateResult.error);
    }

    return ok(updateResult.data);
  }

  async updateStock(id: string, newAmount: number): Promise<Result<Product, AppError>> {
    // Validate stock amount
    const stockValidation = this.validateStock(newAmount);
    if (!stockValidation.success) {
      return err(stockValidation.error);
    }

    // Check if product exists
    const existingProductResult = await this.getById(id);
    if (!existingProductResult.success) {
      return err(existingProductResult.error);
    }

    // Update stock
    const updateResult = await this.productRepository.updateStock(id, newAmount);
    if (!updateResult.success) {
      return err(updateResult.error);
    }

    return ok(updateResult.data);
  }

  async reserveStock(id: string, quantity: number): Promise<Result<Product, AppError>> {
    // Get current product
    const productResult = await this.getById(id);
    if (!productResult.success) {
      return err(productResult.error);
    }

    const product = productResult.data;

    // Check if product is active
    if (!product.isActive) {
      return err(new AppError(
        'PRODUCT_INACTIVE',
        `Product ${product.name} is not active`,
        'service'
      ));
    }

    // Check if enough stock is available
    if (product.availableAmount < quantity) {
      return err(createError.insufficientInventory(
        product.name, 
        product.availableAmount, 
        quantity
      ));
    }

    // Reserve stock (decrement)
    const reserveResult = await this.productRepository.decrementStock(id, quantity);
    if (!reserveResult.success) {
      return err(reserveResult.error);
    }

    return ok(reserveResult.data);
  }

  async restoreStock(id: string, quantity: number): Promise<Result<Product, AppError>> {
    // Get current product
    const productResult = await this.getById(id);
    if (!productResult.success) {
      return err(productResult.error);
    }

    const product = productResult.data;
    const newAmount = product.availableAmount + quantity;

    // Restore stock
    const restoreResult = await this.productRepository.updateStock(id, newAmount);
    if (!restoreResult.success) {
      return err(restoreResult.error);
    }

    return ok(restoreResult.data);
  }

  async deactivate(id: string): Promise<Result<Product, AppError>> {
    const updateResult = await this.productRepository.update(id, { isActive: false });
    if (!updateResult.success) {
      return err(updateResult.error);
    }

    return ok(updateResult.data);
  }

  async activate(id: string): Promise<Result<Product, AppError>> {
    const updateResult = await this.productRepository.update(id, { isActive: true });
    if (!updateResult.success) {
      return err(updateResult.error);
    }

    return ok(updateResult.data);
  }

  async delete(id: string): Promise<Result<Product, AppError>> {
    // Check if product exists
    const existingProductResult = await this.getById(id);
    if (!existingProductResult.success) {
      return err(existingProductResult.error);
    }

    // Soft delete
    const deleteResult = await this.productRepository.softDelete(id);
    if (!deleteResult.success) {
      return err(deleteResult.error);
    }

    return ok(deleteResult.data);
  }

  async getProductStats(): Promise<Result<ProductStats, AppError>> {
    const activeCountResult = await this.productRepository.getActiveProductsCount();
    if (!activeCountResult.success) {
      return err(activeCountResult.error);
    }

    const lowStockResult = await this.productRepository.getLowStockProducts();
    if (!lowStockResult.success) {
      return err(lowStockResult.error);
    }

    const allProductsResult = await this.productRepository.findMany({});
    if (!allProductsResult.success) {
      return err(allProductsResult.error);
    }

    const totalValue = allProductsResult.data.reduce((sum, product) => {
      return sum + (Number(product.price) * product.availableAmount);
    }, 0);

    const stats: ProductStats = {
      totalProducts: allProductsResult.data.length,
      activeProducts: activeCountResult.data,
      inactiveProducts: allProductsResult.data.length - activeCountResult.data,
      lowStockProducts: lowStockResult.data.length,
      totalInventoryValue: totalValue,
      outOfStockProducts: allProductsResult.data.filter(p => p.availableAmount === 0).length,
    };

    return ok(stats);
  }

  async getLowStockProducts(threshold: number = 10): Promise<Result<Product[], AppError>> {
    const result = await this.productRepository.getLowStockProducts(threshold);
    
    if (!result.success) {
      return err((result as { success: false; error: AppError }).error);
    }

    return ok(result.data);
  }

  async getProductsByCategory(category: string): Promise<Result<Product[], AppError>> {
    const result = await this.productRepository.findMany({
      category,
      isActive: true
    });
    
    if (!result.success) {
      return err((result as { success: false; error: AppError }).error);
    }

    return ok(result.data);
  }

  async getProductsByType(type: ProductType): Promise<Result<Product[], AppError>> {
    const result = await this.productRepository.findMany({
      name: type,
      isActive: true
    });
    
    if (!result.success) {
      return err((result as { success: false; error: AppError }).error);
    }

    return ok(result.data);
  }

  // Private validation methods
  private validateProductData(productData: CreateProductInput): Result<void, AppError> {
    // Validate price
    const priceValidation = this.validatePrice(productData.price);
    if (!priceValidation.success) {
      return err(priceValidation.error);
    }

    // Validate stock
    const stockValidation = this.validateStock(productData.availableAmount);
    if (!stockValidation.success) {
      return err(stockValidation.error);
    }

    // Validate required fields
    if (!productData.name) {
      return err(createError.requiredField('name'));
    }

    return ok(undefined);
  }

  private validatePrice(price: number): Result<void, AppError> {
    if (price < 0) {
      return err(new AppError(
        'PRODUCT_PRICE_INVALID',
        'Product price cannot be negative',
        'service'
      ));
    }

    if (price > 10000000) { // 10 million COP max
      return err(new AppError(
        'PRODUCT_PRICE_INVALID',
        'Product price exceeds maximum allowed value',
        'service'
      ));
    }

    return ok(undefined);
  }

  private validateStock(amount: number): Result<void, AppError> {
    if (amount < 0) {
      return err(new AppError(
        'PRODUCT_INVALID_QUANTITY',
        'Stock amount cannot be negative',
        'service'
      ));
    }

    if (!Number.isInteger(amount)) {
      return err(new AppError(
        'PRODUCT_INVALID_QUANTITY',
        'Stock amount must be a whole number',
        'service'
      ));
    }

    return ok(undefined);
  }
}

