import React, { useState } from 'react';
import { Search, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Product } from '../../types/delivery';

interface ProductVariation { id: number; name: string; }

interface SelectProductModalProps {
  products: Product[];
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onSelectProduct: (product: Product, variation?: ProductVariation) => void;
  onClose: () => void;
}

export function SelectProductModal({
  products,
  searchTerm,
  onSearchChange,
  onSelectProduct,
  onClose
}: SelectProductModalProps) {
  const [showVariationsFor, setShowVariationsFor] = useState<Product | null>(null);
  const [variations, setVariations] = useState<ProductVariation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleProductClick = async (product: Product) => {
    if (product.options_type === 'variations') {
      setShowVariationsFor(product);
      setLoading(true);
      setError(null);
      setVariations([]);
      const { data, error } = await supabase
        .from('product_variations')
        .select('*')
        .eq('product_id', product.id);
      setLoading(false);
      if (error) {
        setError('שגיאה בטעינת הוריאציות');
        return;
      }
      setVariations(data || []);
    } else {
      onSelectProduct(product);
    }
  };

  const handleSelectVariation = (variation: ProductVariation) => {
    if (showVariationsFor) {
      onSelectProduct(showVariationsFor, variation);
      setShowVariationsFor(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-lg font-semibold">בחירת מוצר</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4">
          <div className="relative mb-4">
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="חיפוש לפי שם מוצר..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="block w-full pr-10 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-4 max-h-96 overflow-y-auto">
            {products
              .filter(product =>
                product.name.toLowerCase().includes(searchTerm.toLowerCase())
              )
              .map(product => (
                <div
                  key={product.id}
                  className="text-right p-3 hover:bg-gray-50 rounded-lg border cursor-pointer"
                  onClick={() => handleProductClick(product)}
                >
                  {product.image_url && (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-32 object-contain mb-2"
                    />
                  )}
                  <div className="font-medium">{product.name}</div>
                  {product.options_type === 'variations' ? (
                    <div className="text-sm text-blue-600">מוצר עם וריאציות</div>
                  ) : (
                    product.specifications && product.specifications.length != null && product.specifications.width != null && product.specifications.height != null && (
                      <div className="text-sm text-gray-500">
                        {product.specifications.height} × {product.specifications.length} × {product.specifications.width} ס"מ
                      </div>
                    )
                  )}
                  {product.dimensions && product.dimensions.length > 1 && product.options_type !== 'variations' && (
                    <div className="mt-2 text-xs text-blue-600">
                      {product.dimensions.length} מידות זמינות
                    </div>
                  )}
                </div>
              ))}
          </div>
        </div>
      </div>
      {showVariationsFor && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="text-lg font-semibold">בחר וריאציה למוצר</h2>
              <button
                type="button"
                onClick={() => setShowVariationsFor(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4">
              <div className="font-bold mb-2">{showVariationsFor.name}</div>
              {loading && <div>טוען...</div>}
              {error && <div className="text-red-600">{error}</div>}
              {!loading && !error && variations.length === 0 && <div>לא נמצאו וריאציות</div>}
              {!loading && !error && variations.map(variation => (
                <div
                  key={variation.id}
                  className="border rounded-lg p-3 mb-2 cursor-pointer hover:bg-blue-50"
                  onClick={() => handleSelectVariation(variation)}
                >
                  {variation.name}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
