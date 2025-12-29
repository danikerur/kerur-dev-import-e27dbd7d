import React from 'react';
import { Plus, X } from 'lucide-react';
import type { SelectedProduct } from '../../types/delivery';

interface CustomerProductsProps {
  products: SelectedProduct[];
  onShowProductSelector: () => void;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveProduct: (productId: string) => void;
}

export function CustomerProducts({
  products,
  onShowProductSelector,
  onUpdateQuantity,
  onRemoveProduct
}: CustomerProductsProps) {
  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <label className="block text-sm font-medium text-gray-700">
          מוצרים
        </label>
        <button
          type="button"
          onClick={onShowProductSelector}
          className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
        >
          <Plus className="w-4 h-4" />
          הוסף מוצר
        </button>
      </div>

      {products.length === 0 ? (
        <p className="text-sm text-gray-500">לא נבחרו מוצרים</p>
      ) : (
        <div className="space-y-2">
          {products.map(({ id, product, quantity, selectedDimensionIndex }) => {
            const dimensions = product.dimensions || [{
              id: '1',
              length: product.specifications.length,
              width: product.specifications.width,
              height: product.specifications.height
            }];
            const dimension = dimensions[selectedDimensionIndex || 0];

            return (
              <div
                key={id}
                className="flex items-center justify-between bg-gray-50 p-2 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  {product.image_url && (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-10 h-10 object-cover rounded"
                    />
                  )}
                  <div>
                    <div className="font-medium">{product.name}</div>
                    <div className="text-sm text-gray-500">
                      {dimension.length} × {dimension.width} × {dimension.height} ס"מ
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onUpdateQuantity(id, quantity - 1)}
                      className="p-1 hover:bg-gray-200 rounded"
                    >
                      -
                    </button>
                    <span className="w-8 text-center">{quantity}</span>
                    <button
                      type="button"
                      onClick={() => onUpdateQuantity(id, quantity + 1)}
                      className="p-1 hover:bg-gray-200 rounded"
                    >
                      +
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => onRemoveProduct(id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
