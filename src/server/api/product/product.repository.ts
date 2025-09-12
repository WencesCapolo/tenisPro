import { db } from '../../../lib/db';
import { Result, ok, err, safeAsync } from '../../../lib/result';
import { AppError, createError } from '../../../lib/errors';
import { Product, ProductType } from '@prisma/client';
import {
  CreateProductData,
  UpdateProductData,
  ProductFilters
} from './product.types';

export class ProductRepository {
  async findById(id: string): Promise<Result<Product | null, AppError>> {
    return safeAsync(async () => {
      const product = await db.product.findUnique({
        where: { 
          id,
          isDeleted: false 
        }
      });
      return product;
    }).then(result => {
      if (!result.success) {
        return err(createError.databaseError('find product by ID', (result as { success: false; error: Error }).error));
      }
      return ok(result.data);
    });
  }

  async findMany(filters: ProductFilters = {}): Promise<Result<Product[], AppError>> {
    return safeAsync(async () => {
      const where: any = {
        isDeleted: false,
      };

      if (filters.name) {
        where.name = filters.name;
      }

      if (filters.category) {
        where.category = filters.category;
      }

      if (filters.brand) {
        where.brand = filters.brand;
      }

      if (filters.isActive !== undefined) {
        where.isActive = filters.isActive;
      }

      if (filters.inStock) {
        where.availableAmount = { gt: 0 };
      }

      const products = await db.product.findMany({
        where,
        orderBy: [
          { name: 'asc' },
          { createdAt: 'desc' }
        ]
      });

      return products;
    }).then(result => {
      if (!result.success) {
        return err(createError.databaseError('find products', (result as { success: false; error: Error }).error));
      }
      return ok(result.data);
    });
  }

  async create(productData: CreateProductData): Promise<Result<Product, AppError>> {
    return safeAsync(async () => {
      const product = await db.product.create({
        data: {
          name: productData.name,
          description: productData.description,
          price: productData.price,
          availableAmount: productData.availableAmount,
          category: productData.category,
          brand: productData.brand,
          model: productData.model,
          sku: productData.sku,
          imageUrl: productData.imageUrl,
          isActive: true,
        }
      });
      return product;
    }).then(result => {
      if (!result.success) {
        const error = (result as { success: false; error: Error }).error;
        // Check for unique constraint violations
        if (error.message?.includes('Unique constraint')) {
          return err(createError.constraintViolation('Product SKU already exists'));
        }
        return err(createError.databaseError('create product', error));
      }
      return ok(result.data);
    });
  }

  async update(id: string, productData: UpdateProductData): Promise<Result<Product, AppError>> {
    return safeAsync(async () => {
      const product = await db.product.update({
        where: { id },
        data: {
          ...productData,
          updatedAt: new Date(),
        }
      });
      return product;
    }).then(result => {
      if (!result.success) {
        return err(createError.databaseError('update product', (result as { success: false; error: Error }).error));
      }
      return ok(result.data);
    });
  }

  async updateStock(id: string, newAmount: number): Promise<Result<Product, AppError>> {
    return safeAsync(async () => {
      const product = await db.product.update({
        where: { id },
        data: {
          availableAmount: newAmount,
          updatedAt: new Date(),
        }
      });
      return product;
    }).then(result => {
      if (!result.success) {
        return err(createError.databaseError('update product stock', (result as { success: false; error: Error }).error));
      }
      return ok(result.data);
    });
  }

  async decrementStock(id: string, amount: number): Promise<Result<Product, AppError>> {
    return safeAsync(async () => {
      const product = await db.product.update({
        where: { id },
        data: {
          availableAmount: {
            decrement: amount
          },
          updatedAt: new Date(),
        }
      });
      return product;
    }).then(result => {
      if (!result.success) {
        return err(createError.databaseError('decrement product stock', (result as { success: false; error: Error }).error));
      }
      return ok(result.data);
    });
  }

  async softDelete(id: string): Promise<Result<Product, AppError>> {
    return safeAsync(async () => {
      const product = await db.product.update({
        where: { id },
        data: {
          isDeleted: true,
          isActive: false,
          updatedAt: new Date(),
        }
      });
      return product;
    }).then(result => {
      if (!result.success) {
        return err(createError.databaseError('delete product', (result as { success: false; error: Error }).error));
      }
      return ok(result.data);
    });
  }

  async getActiveProductsCount(): Promise<Result<number, AppError>> {
    return safeAsync(async () => {
      const count = await db.product.count({
        where: {
          isDeleted: false,
          isActive: true,
        }
      });
      return count;
    }).then(result => {
      if (!result.success) {
        return err(createError.databaseError('count active products', (result as { success: false; error: Error }).error));
      }
      return ok(result.data);
    });
  }

  async getLowStockProducts(threshold: number = 10): Promise<Result<Product[], AppError>> {
    return safeAsync(async () => {
      const products = await db.product.findMany({
        where: {
          isDeleted: false,
          isActive: true,
          availableAmount: {
            lte: threshold
          }
        },
        orderBy: {
          availableAmount: 'asc'
        }
      });
      return products;
    }).then(result => {
      if (!result.success) {
        return err(createError.databaseError('find low stock products', (result as { success: false; error: Error }).error));
      }
      return ok(result.data);
    });
  }
}
