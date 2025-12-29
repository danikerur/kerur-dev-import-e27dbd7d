import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Upload, Loader2, X, ArrowRight, Plus, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../lib/supabase';
import imageCompression from 'browser-image-compression';
import ProductVariationsTable, { ProductVariation } from '../components/ProductVariationsTable';

interface Category {
  id: string;
  name: string;
  parent_id: string | null;
}

interface Supplier {
  id: string;
  name: string;
}

interface Dimension {
  id: string;
  width: number;
  height: number;
  length: number;
  product_code?: string;
  model?: string;
}

export function EditProductPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedParentCategory, setSelectedParentCategory] = useState<string>('');
  const [dimensions, setDimensions] = useState<Dimension[]>([]);
  const [product, setProduct] = useState({
    name: '',
    description: '',
    image_url: '',
    category_id: null as string | null,
    catalog_visible: true,
    catalog_order: 0,
    tag: '',
    specifications: {
      width: 0,
      height: 0,
      length: 0
    },
    dimensions: [] as Dimension[],
    product_code: '',
    supplier_id: null as string | null
  });
  const [optionsType, setOptionsType] = useState<'dimensions' | 'variations'>('dimensions');
  const [variations, setVariations] = useState<ProductVariation[]>([]);

  useEffect(() => {
    if (id) {
      fetchProduct(id);
      fetchProductVariations(id);
    }
    fetchCategories();
    fetchSuppliers();
  }, [id]);

  async function fetchSuppliers() {
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .select('id, name')
        .order('name');

      if (error) throw error;
      setSuppliers(data || []);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
    }
  }

  async function fetchProduct(productId: string) {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .single();

      if (error) throw error;

      if (data) {
        let productDimensions: Dimension[] = [];

        if (Array.isArray(data.dimensions) && data.dimensions.length > 0) {
          productDimensions = data.dimensions.map((dim: any) => ({
            id: dim.id,
            width: dim.width,
            height: dim.height,
            length: (dim.length ?? dim.depth) || 0,
            product_code: dim.product_code || '',
            model: dim.model || ''
          }));
        } else {
          const specs = data.specifications as unknown as { width?: number; height?: number; length?: number; depth?: number } | null;
          productDimensions = [{
            id: '1',
            width: specs?.width || 0,
            height: specs?.height || 0,
            length: (specs?.length ?? specs?.depth) || 0,
            product_code: data.product_code || '',
            model: ''
          }];
        }

        const specs = data.specifications as unknown as { width?: number; height?: number; length?: number; depth?: number } | null;
        setProduct({
          ...data,
          tag: data.tag || '',
          dimensions: productDimensions,
          product_code: data.product_code || '',
          supplier_id: data.supplier_id || null,
          specifications: {
            length: (specs?.length ?? specs?.depth) || 0,
            width: specs?.width || 0,
            height: specs?.height || 0
          }
        });

        setDimensions(productDimensions);
        setOptionsType((data.options_type as 'dimensions' | 'variations') || 'dimensions');

        if (data.category_id) {
          const category = await findCategory(data.category_id);
          if (category?.parent_id) {
            setSelectedParentCategory(category.parent_id);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching product:', error);
      alert('שגיאה בטעינת פרטי המוצר. אנא נסה שוב.');
      navigate('/products');
    } finally {
      setIsLoading(false);
    }
  }

  async function fetchProductVariations(productId: string) {
    const { data, error } = await supabase
      .from('product_variations')
      .select('*')
      .eq('product_id', productId);
    if (!error && data) {
      setVariations(data.map((v: any) => ({ name: v.name, id: v.id })));
    }
  }

  async function findCategory(categoryId: string): Promise<Category | null> {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('id', categoryId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error finding category:', error);
      return null;
    }
  }

  async function fetchCategories() {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error fetching categories:', error);
      return;
    }

    setCategories(data || []);
  }

  const parentCategories = categories.filter(cat => !cat.parent_id);
  const getChildCategories = (parentId: string) => {
    return categories.filter(cat => cat.parent_id === parentId);
  };

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);

    try {
      const compressedFile = await imageCompression(file, {
        maxSizeMB: 0.05,
        maxWidthOrHeight: 800,
        useWebWorker: true
      });

      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `product-images/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('products')
        .upload(filePath, compressedFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('products')
        .getPublicUrl(filePath);

      setProduct(prev => ({
        ...prev,
        image_url: publicUrl
      }));
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('שגיאה בהעלאת התמונה. אנא נסה שוב.');
    } finally {
      setIsUploading(false);
    }
  }

  const addDimension = () => {
    const newDimension: Dimension = {
      id: Date.now().toString(),
      width: 0,
      height: 0,
      length: 0,
      product_code: '',
      model: ''
    };

    setDimensions([...dimensions, newDimension]);
    setProduct(prev => ({
      ...prev,
      dimensions: [...prev.dimensions, newDimension]
    }));
  };

  const removeDimension = (id: string) => {
    if (dimensions.length <= 1) {
      alert('חייב להיות לפחות מידה אחת למוצר');
      return;
    }

    const updatedDimensions = dimensions.filter(dim => dim.id !== id);
    setDimensions(updatedDimensions);
    setProduct(prev => ({
      ...prev,
      dimensions: updatedDimensions
    }));
  };

  const updateDimension = (id: string, field: keyof Dimension, value: string | number) => {
    const updatedDimensions = dimensions.map(dim =>
      dim.id === id ? { ...dim, [field]: value } : dim
    );

    setDimensions(updatedDimensions);
    setProduct(prev => ({
      ...prev,
      dimensions: updatedDimensions
    }));
  };

  const toggleCatalogVisibility = () => {
    setProduct(prev => ({
      ...prev,
      catalog_visible: !prev.catalog_visible
    }));
  };

  function handleOptionsTypeChange(e: React.ChangeEvent<HTMLSelectElement>) {
    setOptionsType(e.target.value as 'dimensions' | 'variations');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (optionsType === 'variations') {
      if (variations.length === 0 || variations.some(v => !v.name.trim())) {
        alert('יש להזין לפחות וריאציה אחת עם שם תקין.');
        return;
      }
    }

    if (dimensions.length === 0) {
      alert('חייב להיות לפחות מידה אחת למוצר');
      return;
    }

    // Validate that each dimension has a product code
    if (dimensions.some(dim => !dim.product_code)) {
      alert('יש להזין קוד מוצר לכל מידה');
      return;
    }

    setIsSaving(true);
    try {
      const mainSpecifications = {
        width: dimensions[0].width,
        height: dimensions[0].height,
        length: dimensions[0].length
      };
      const dimensionsToSave = dimensions.map(dim => ({
        id: dim.id,
        width: dim.width,
        height: dim.height,
        length: dim.length,
        product_code: dim.product_code,
        model: dim.model
      }));

      const updateObj: any = {
        name: product.name,
        description: product.description,
        image_url: product.image_url,
        specifications: mainSpecifications,
        dimensions: optionsType === 'dimensions' ? dimensionsToSave : null,
        category_id: product.category_id,
        catalog_visible: product.catalog_visible,
        catalog_order: product.catalog_order,
        tag: product.tag || null,
        product_code: dimensionsToSave[0].product_code,
        supplier_id: product.supplier_id,
        options_type: optionsType
      };
      const { error } = await supabase
        .from('products')
        .update(updateObj)
        .eq('id', id);

      if (error) throw error;

      if (optionsType === 'variations') {
        // Delete old variations
        await supabase.from('product_variations').delete().eq('product_id', id);
        // Insert new
        if (variations.length > 0) {
          await supabase.from('product_variations').insert(
            variations.map(v => ({ product_id: id, name: v.name.trim() }))
          );
        }
      }

      navigate('/products');
    } catch (error) {
      console.error('Error updating product:', error);
      alert('שגיאה בשמירת המוצר. אנא נסה שוב.');
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
        <div className="flex items-center gap-2 text-gray-500">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>טוען פרטי מוצר...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-3">
          <button
            onClick={() => navigate('/products')}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowRight className="w-6 h-6" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">עריכת מוצר</h1>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Basic Information */}
            <div className="space-y-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h2 className="text-lg font-medium text-gray-900 mb-4">פרטי מוצר</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">שם המוצר</label>
                    <input
                      type="text"
                      value={product.name}
                      onChange={(e) => setProduct({ ...product, name: e.target.value })}
                      required
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ספק</label>
                    <select
                      value={product.supplier_id || ''}
                      onChange={(e) => setProduct({ ...product, supplier_id: e.target.value || null })}
                      required
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">בחר ספק</option>
                      {suppliers.map(supplier => (
                        <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">קטגוריה</label>
                    <select
                      value={product.category_id || ''}
                      onChange={(e) => setProduct({ ...product, category_id: e.target.value || null })}
                      required
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">בחר קטגוריה</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h2 className="text-lg font-medium text-gray-900 mb-4">תיאור ותגיות</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">תיאור</label>
                    <textarea
                      value={product.description}
                      onChange={(e) => setProduct({ ...product, description: e.target.value })}
                      required
                      rows={4}
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">תג מוצר</label>
                    <input
                      type="text"
                      value={product.tag}
                      onChange={(e) => setProduct({ ...product, tag: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="חדש / מבצע / מומלץ וכו'"
                    />
                    <p className="mt-1 text-sm text-gray-500">התג יוצג בפינה העליונה של המוצר בקטלוג (אופציונלי)</p>
                  </div>
                </div>
              </div>
            </div>
            {/* Image and Visibility */}
            <div className="space-y-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h2 className="text-lg font-medium text-gray-900 mb-4">תמונה ונראות</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">תמונה</label>
                    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                      <div className="space-y-1 text-center">
                        <div className="flex text-sm text-gray-600">
                          <label
                            htmlFor="file-upload"
                            className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                          >
                            <span>העלה תמונה</span>
                            <input
                              id="file-upload"
                              type="file"
                              accept="image/*"
                              onChange={handleImageUpload}
                              disabled={isUploading}
                              className="sr-only"
                            />
                          </label>
                          <p className="mr-1">או גרור ושחרר</p>
                        </div>
                        <p className="text-xs text-gray-500">PNG, JPG, WEBP עד 10MB</p>
                      </div>
                    </div>
                    {isUploading && (
                      <p className="mt-2 text-sm text-gray-500 text-center">מעלה תמונה...</p>
                    )}
                    {product.image_url && (
                      <div className="mt-4 flex justify-center">
                        <img
                          src={product.image_url}
                          alt="תמונה מוצגת"
                          className="h-48 w-48 object-cover rounded-lg shadow-md"
                        />
                      </div>
                    )}
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={product.catalog_visible}
                      onChange={toggleCatalogVisibility}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label className="mr-2 text-sm text-gray-700">הצג בקטלוג</label>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* Options Type Select */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <label className="block text-sm font-medium text-gray-700 mb-1">סוג אפשרויות למוצר</label>
            <select
              name="options_type"
              value={optionsType}
              onChange={handleOptionsTypeChange}
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="dimensions">מידות</option>
              <option value="variations">וריאציות</option>
            </select>
          </div>
          {/* Sizes or Variations Table */}
          {optionsType === 'dimensions' ? (
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-medium text-gray-900">מידות מוצר</h2>
                <button
                  type="button"
                  onClick={addDimension}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <Plus className="h-4 w-4 ml-1" />
                  הוסף מידה
                </button>
              </div>
              {dimensions.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-white">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">קוד מוצר</th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">דגם</th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">גובה (ס"מ)</th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">עומק (ס"מ)</th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">אורך (ס"מ)</th>
                        <th scope="col" className="relative px-6 py-3"><span className="sr-only">פעולות</span></th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {dimensions.map((dimension, index) => (
                        <tr key={dimension.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <input
                              type="text"
                              value={dimension.product_code || ''}
                              onChange={(e) => updateDimension(dimension.id, 'product_code', e.target.value)}
                              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              required
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <input
                              type="text"
                              value={dimension.model || ''}
                              onChange={(e) => updateDimension(dimension.id, 'model', e.target.value)}
                              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              required
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <input
                              type="number"
                              value={dimension.height}
                              onChange={(e) => updateDimension(dimension.id, 'height', e.target.value)}
                              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              min="0"
                              step="0.1"
                              required
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <input
                              type="number"
                              value={dimension.length}
                              onChange={(e) => updateDimension(dimension.id, 'length', e.target.value)}
                              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              min="0"
                              step="0.1"
                              required
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <input
                              type="number"
                              value={dimension.width}
                              onChange={(e) => updateDimension(dimension.id, 'width', e.target.value)}
                              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              min="0"
                              step="0.1"
                              required
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-left text-sm font-medium">
                            <button
                              type="button"
                              onClick={() => removeDimension(dimension.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <X className="h-5 w-5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 bg-white rounded-lg border-2 border-dashed border-gray-300">
                  <p>אין מידות מוגדרות</p>
                  <p className="text-sm mt-1">לחץ על "הוסף מידה" כדי להתחיל</p>
                </div>
              )}
            </div>
          ) : (
            <ProductVariationsTable variations={variations} onChange={setVariations} />
          )}
          {/* Submit Button */}
          <div className="flex justify-end pt-4 border-t border-gray-200">
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-3 bg-blue-600 text-white text-lg font-medium rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  שומר שינויים...
                </div>
              ) : (
                'שמור שינויים'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
