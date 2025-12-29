import React from 'react';
import { X } from 'lucide-react';
import type { Product, Dimension } from '../../types/delivery';

interface SelectDimensionModalProps {
  product: Product;
  onSelectDimension: (dimensionIndex: number) => void;
  onClose: () => void;
}

interface DimensionWithDepth {
  id: string;
  width: number;
  height: number;
  length: number;
  depth?: number;
  product_code?: string;
  model?: string;
}

const getProductDimensions = (product: Product): Dimension[] => {
  if (product.dimensions && product.dimensions.length > 0) {
    return product.dimensions;
  }
  return [{
    id: '1',
    length: product.specifications.length,
    width: product.specifications.width,
    height: product.specifications.height
  }];
};

export function SelectDimensionModal({
  product,
  onSelectDimension,
  onClose
}: SelectDimensionModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-lg font-semibold">בחר מידה למוצר</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4">
          <h3 className="font-medium text-lg mb-3">{product.name}</h3>

          <div className="space-y-3 mt-4">
            {getProductDimensions(product).map((dimension, index) => {
              const dim = dimension as DimensionWithDepth;
              return (
                <button
                  key={dim.id}
                  className="w-full p-3 border rounded-lg hover:bg-blue-50 hover:border-blue-300 flex justify-between items-center"
                  onClick={() => onSelectDimension(index)}
                >
                  <div className="font-medium">מידה {index + 1}</div>
                  <div className="text-gray-600">
                    {dim.width} × {dim.height} × {dim.length} ס"מ
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
