/**
 * Example React component showing how to use the Result Pattern with tRPC
 * This demonstrates client-side usage of the product API
 */

import { useState } from 'react';
// Note: This import would work once tRPC is properly set up
// import { api } from '@/lib/trpc';

// Mock API hook for demonstration (replace with actual tRPC hook)
const mockApi = {
  product: {
    getAll: {
      useQuery: () => ({
        data: null,
        isLoading: false,
        error: null,
        isError: false,
      }),
    },
    create: {
      useMutation: () => ({
        mutate: (data: any) => console.log('Creating product:', data),
        isLoading: false,
        error: null,
      }),
    },
  },
};

interface Product {
  id: string;
  name: 'PROFESIONAL' | 'ENTRENAMIENTO' | 'RECREATIVA';
  description?: string;
  price: number;
  availableAmount: number;
  category?: string;
  brand?: string;
  isActive: boolean;
}

export function ProductManagement() {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Using tRPC hooks (this would be the actual implementation)
  const { 
    data: products, 
    isLoading, 
    error, 
    isError 
  } = mockApi.product.getAll.useQuery();

  const createProduct = mockApi.product.create.useMutation({
    onSuccess: (newProduct) => {
      console.log('Product created successfully:', newProduct);
      // The Result pattern ensures we know the operation succeeded
      // and newProduct is guaranteed to be defined
    },
    onError: (error) => {
      // Error handling with specific error codes from TenisProError
      if (error.message.includes('PRODUCT_INSUFFICIENT_INVENTORY')) {
        alert('Not enough inventory available');
      } else if (error.message.includes('PRODUCT_PRICE_INVALID')) {
        alert('Invalid price provided');
      } else {
        alert(`Error: ${error.message}`);
      }
    },
  });

  const handleCreateProduct = () => {
    createProduct.mutate({
      name: 'PROFESIONAL',
      description: 'Professional tennis racket',
      price: 150000, // COP
      availableAmount: 10,
      category: 'Raquetas',
      brand: 'Wilson',
    });
  };

  if (isLoading) {
    return <div>Loading products...</div>;
  }

  if (isError) {
    return (
      <div className="error">
        <h3>Error loading products</h3>
        <p>{error?.message}</p>
        <button onClick={() => window.location.reload()}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="product-management">
      <h2>Product Management</h2>
      
      <div className="actions">
        <button 
          onClick={handleCreateProduct}
          disabled={createProduct.isLoading}
        >
          {createProduct.isLoading ? 'Creating...' : 'Create Product'}
        </button>
      </div>

      <div className="product-list">
        {products?.map((product: Product) => (
          <div key={product.id} className="product-card">
            <h3>{product.name}</h3>
            <p>{product.description}</p>
            <p>Price: ${product.price.toLocaleString()}</p>
            <p>Stock: {product.availableAmount}</p>
            <p>Status: {product.isActive ? 'Active' : 'Inactive'}</p>
            
            <button onClick={() => setSelectedProduct(product)}>
              Edit
            </button>
          </div>
        ))}
      </div>

      {selectedProduct && (
        <ProductEditModal 
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </div>
  );
}

function ProductEditModal({ 
  product, 
  onClose 
}: { 
  product: Product; 
  onClose: () => void; 
}) {
  const [formData, setFormData] = useState({
    description: product.description || '',
    price: product.price,
    availableAmount: product.availableAmount,
  });

  // This would use the actual tRPC mutation
  const updateProduct = mockApi.product.create.useMutation({
    onSuccess: () => {
      console.log('Product updated successfully');
      onClose();
    },
    onError: (error) => {
      console.error('Update failed:', error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // The Result pattern in the backend ensures that validation
    // errors are properly caught and returned as TRPCErrors
    updateProduct.mutate({
      id: product.id,
      data: formData,
    });
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h3>Edit Product: {product.name}</h3>
        
        <form onSubmit={handleSubmit}>
          <div>
            <label>Description:</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                description: e.target.value 
              }))}
            />
          </div>
          
          <div>
            <label>Price (COP):</label>
            <input
              type="number"
              value={formData.price}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                price: Number(e.target.value) 
              }))}
            />
          </div>
          
          <div>
            <label>Stock:</label>
            <input
              type="number"
              value={formData.availableAmount}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                availableAmount: Number(e.target.value) 
              }))}
            />
          </div>
          
          <div className="modal-actions">
            <button type="submit" disabled={updateProduct.isLoading}>
              {updateProduct.isLoading ? 'Updating...' : 'Update'}
            </button>
            <button type="button" onClick={onClose}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Example of error handling with specific Result Pattern error types
export function useProductOperations() {
  const createProduct = mockApi.product.create.useMutation({
    onError: (error) => {
      // The Result Pattern allows for structured error handling
      const errorMessage = error.message;
      
      if (errorMessage.includes('PRODUCT_PRICE_INVALID')) {
        return 'Please enter a valid price between $0 and $10,000,000 COP';
      }
      
      if (errorMessage.includes('PRODUCT_INVALID_QUANTITY')) {
        return 'Stock amount must be a positive whole number';
      }
      
      if (errorMessage.includes('DATABASE_CONSTRAINT_VIOLATION')) {
        return 'A product with this SKU already exists';
      }
      
      // Generic error fallback
      return 'An error occurred while creating the product. Please try again.';
    },
  });

  return {
    createProduct,
    // Add other operations here
  };
}
