import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Plus, Trash2 } from 'lucide-react';
import ProductVariationsTable, { ProductVariation } from '../components/ProductVariationsTable';

interface Product {
  name: string;
  product_code: string;
  supplier_id: number;
  category_id: string;
  subcategory_id: string;
  description: string;
  tags: string[];
  image_url: string;
  is_visible_in_catalog: boolean;
}

interface ProductSize {
  product_code: string;
  model: string;
  height: number;
  width: number;
  depth: number;
}

interface Supplier {
  id: number;
  name: string;
}

export function AddProductPage() {
  const navigate = useNavigate();
  const [isUploading, setIsUploading] = useState(false);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [formData, setFormData] = useState<Product>({
    name: '',
    product_code: '',
    supplier_id: 0,
    category_id: '',
    subcategory_id: '',
    description: '',
    tags: [],
    image_url: '',
    is_visible_in_catalog: true
  });
  const [sizes, setSizes] = useState<ProductSize[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [imageError, setImageError] = useState(false);
  const [uploadErrorMsg, setUploadErrorMsg] = useState<string | null>(null);
  const [optionsType, setOptionsType] = useState<'dimensions' | 'variations'>('dimensions');
  const [variations, setVariations] = useState<ProductVariation[]>([]);

  useEffect(() => {
    fetchSuppliers();
    fetchCategories();
  }, []);

  const fetchSuppliers = async () => {
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .select('id, name')
        .order('name');

      if (error) throw error;
      setSuppliers(data || []);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      alert('שגיאה בטעינת רשימת הספקים');
    }
  };

  const fetchCategories = async () => {
    const { data, error } = await supabase.from('categories').select('*');
    if (!error) setCategories(data || []);
  };

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('הקובץ שנבחר אינו תמונה');
      return;
    }

    setIsUploading(true);
    setUploadErrorMsg(null);

    try {
      const fileExt = file.name.split('.').pop()?.toLowerCase();
      if (!fileExt || !['jpeg', 'jpg', 'png', 'webp'].includes(fileExt)) {
        throw new Error('סוג הקובץ אינו נתמך. יש להשתמש בקבצי JPEG, PNG או WebP בלבד.');
      }

      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `product-images/${fileName}`;

      const { data: signedUrlData, error: signedUrlError } = await supabase.storage
        .from('products')
        .createSignedUploadUrl(filePath);

      if (signedUrlError) throw signedUrlError;

      const response = await fetch(signedUrlData.signedUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type
        }
      });

      if (!response.ok) throw new Error('Upload failed');

      const { data: urlData } = supabase.storage
        .from('products')
        .getPublicUrl(filePath);

      setFormData(prev => ({
        ...prev,
        image_url: urlData.publicUrl
      }));
      setImageError(false);
    } catch (error) {
      console.error('Error uploading image:', error);
      alert(error instanceof Error ? error.message : 'שגיאה בהעלאת התמונה. אנא נסה שוב.');
    } finally {
      setIsUploading(false);
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    if (name === 'is_visible_in_catalog') {
      setFormData(prev => ({
        ...prev,
        [name]: (e.target as HTMLInputElement).checked
      }));
    } else if (name === 'category_id') {
      setFormData(prev => ({
        ...prev,
        category_id: value,
        subcategory_id: ''
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSizeChange = (index: number, field: keyof ProductSize, value: string | number) => {
    setSizes(prev => {
      const newSizes = [...prev];
      newSizes[index] = {
        ...newSizes[index],
        [field]: field === 'product_code' || field === 'model' ? value : Number(value)
      };
      return newSizes;
    });
  };

  const addSize = () => {
    setSizes(prev => [...prev, {
      product_code: '',
      model: '',
      height: 0,
      width: 0,
      depth: 0
    }]);
  };

  const removeSize = (index: number) => {
    setSizes(prev => prev.filter((_, i) => i !== index));
  };

  const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!formData.tags.includes(tagInput.trim())) {
        setFormData(prev => ({
          ...prev,
          tags: [...prev.tags, tagInput.trim()]
        }));
      }
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleOptionsTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setOptionsType(e.target.value as 'dimensions' | 'variations');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (optionsType === 'variations') {
        if (variations.length === 0 || variations.some(v => !v.name.trim())) {
          alert('יש להזין לפחות וריאציה אחת עם שם תקין.');
          return;
        }
      }

      const dimensionsJson = sizes.map((size, index) => ({
        id: index + 1,
        length: size.depth,
        width: size.width,
        height: size.height,
        product_code: size.product_code,
        model: size.model
      }));
      const mainSpec = dimensionsJson[0];
      const {
        name,
        product_code,
        supplier_id,
        category_id,
        subcategory_id,
        description,
        tags,
        image_url,
        is_visible_in_catalog
      } = formData;

      const { data: productData, error: productError } = await supabase
        .from('products')
        .insert([{
          name,
          product_code,
          supplier_id,
          category_id: subcategory_id || category_id,
          description,
          tags,
          image_url,
          is_visible_in_catalog,
          options_type: optionsType,
          specifications: optionsType === 'dimensions' ? mainSpec : null,
          dimensions: optionsType === 'dimensions' ? dimensionsJson : null
        }])
        .select()
        .single();

      if (productError) throw productError;

      if (optionsType === 'variations') {
        const { error: variationsError } = await supabase
          .from('product_variations')
          .insert(
            variations.map(v => ({
              product_id: productData.id,
              name: v.name.trim()
            }))
          );
        if (variationsError) throw variationsError;
      }

      alert('המוצר נוסף בהצלחה');
      navigate('/products');
    } catch (error) {
      console.error('Error adding product:', error);
      alert('שגיאה בהוספת המוצר. אנא נסה שוב.');
    }
  };

  const mainCategories = categories.filter(cat => !cat.parent_id);
  const subCategories = categories.filter(cat => cat.parent_id === formData.category_id);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900">הוספת מוצר חדש</h1>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h2 className="text-lg font-medium text-gray-900 mb-4">פרטי מוצר</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">שם המוצר</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ספק</label>
                    <select
                      name="supplier_id"
                      value={formData.supplier_id}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">בחר ספק</option>
                      {suppliers.map(supplier => (
                        <option key={supplier.id} value={supplier.id}>
                          {supplier.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">קטגוריה</label>
                    <select
                      name="category_id"
                      value={formData.category_id}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">בחר קטגוריה</option>
                      {mainCategories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>

                  {formData.category_id && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">תת-קטגוריה</label>
                      <select
                        name="subcategory_id"
                        value={formData.subcategory_id}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">בחר תת-קטגוריה</option>
                        {subCategories.map(cat => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h2 className="text-lg font-medium text-gray-900 mb-4">תיאור ותגיות</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">תיאור</label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      required
                      rows={4}
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">תגיות</label>
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={handleTagInputKeyDown}
                      placeholder="הקלד תגית ולחץ Enter"
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <div className="flex flex-wrap gap-2 mt-2">
                      {formData.tags.map(tag => (
                        <span
                          key={tag}
                          className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                        >
                          {tag}
                          <button
                            type="button"
                            onClick={() => removeTag(tag)}
                            className="mr-1 text-blue-600 hover:text-blue-800"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

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
                    {uploadErrorMsg && (
                      <div className="mt-2 text-center text-red-500 text-sm">{uploadErrorMsg}</div>
                    )}
                    {isUploading && (
                      <p className="mt-2 text-sm text-gray-500 text-center">מעלה תמונה...</p>
                    )}
                    {formData.image_url && !imageError && (
                      <div className="mt-4 flex justify-center">
                        <img
                          src={formData.image_url}
                          alt="תמונה מוצגת"
                          className="h-48 w-48 object-cover rounded-lg shadow-md"
                          onError={() => setImageError(true)}
                        />
                      </div>
                    )}
                    {imageError && (
                      <div className="mt-4 text-center text-red-500 text-sm">לא ניתן להציג את התמונה. ודא שכתובת התמונה תקינה ושהקובץ קיים.</div>
                    )}
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="is_visible_in_catalog"
                      checked={formData.is_visible_in_catalog}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label className="mr-2 text-sm text-gray-700">הצג בקטלוג</label>
                  </div>
                </div>
              </div>
            </div>
          </div>

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

          {optionsType === 'dimensions' ? (
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-medium text-gray-900">מידות מוצר</h2>
                <button
                  type="button"
                  onClick={addSize}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <Plus className="h-4 w-4 ml-1" />
                  הוסף מידה
                </button>
              </div>
              {sizes.length > 0 ? (
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
                      {sizes.map((size, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <input
                              type="text"
                              value={size.product_code}
                              onChange={(e) => handleSizeChange(index, 'product_code', e.target.value)}
                              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              required
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <input
                              type="text"
                              value={size.model}
                              onChange={(e) => handleSizeChange(index, 'model', e.target.value)}
                              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              required
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <input
                              type="number"
                              value={size.height}
                              onChange={(e) => handleSizeChange(index, 'height', e.target.value)}
                              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              min="0"
                              step="0.1"
                              required
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <input
                              type="number"
                              value={size.depth}
                              onChange={(e) => handleSizeChange(index, 'depth', e.target.value)}
                              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              min="0"
                              step="0.1"
                              required
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <input
                              type="number"
                              value={size.width}
                              onChange={(e) => handleSizeChange(index, 'width', e.target.value)}
                              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              min="0"
                              step="0.1"
                              required
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-left text-sm font-medium">
                            <button
                              type="button"
                              onClick={() => removeSize(index)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <Trash2 className="h-5 w-5" />
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

          <div className="flex justify-end pt-4 border-t border-gray-200">
            <button
              type="submit"
              disabled={isUploading}
              className="px-6 py-3 bg-blue-600 text-white text-lg font-medium rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              שמור מוצר
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddProductPage;
