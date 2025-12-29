import React, { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, FolderPlus, ChevronDown, ChevronRight, X, Search, Eye, EyeOff } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

interface Dimension {
  id: string;
  length: number;
  width: number;
  height: number;
  depth: number;
}

interface Product {
  id: string;
  name: string;
  description: string;
  image_url: string;
  category_id: string | null;
  catalog_visible?: boolean;
  catalog_order?: number;
  specifications: {
    length: number;
    width: number;
    height: number;
  };
  dimensions?: Dimension[];
  product_code?: string;
  supplier?: string;
  options_type?: string;
}

interface Category {
  id: string;
  name: string;
  parent_id: string | null;
}

export function ProductsPage() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [isEditingCategory, setIsEditingCategory] = useState<Category | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [selectedParentCategory, setSelectedParentCategory] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCatalogFilter, setShowCatalogFilter] = useState(false);
  const [catalogFilter, setCatalogFilter] = useState<'all' | 'visible' | 'hidden'>('all');

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  async function fetchProducts() {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching products:', error);
      return;
    }

    setProducts(data || []);
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
  const getChildCategories = (parentId: string) => categories.filter(cat => cat.parent_id === parentId);

  async function handleAddCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!newCategoryName.trim()) return;

    try {
      const { error } = await supabase
        .from('categories')
        .insert([{
          name: newCategoryName.trim(),
          parent_id: selectedParentCategory || null
        }]);

      if (error) throw error;

      setNewCategoryName('');
      setSelectedParentCategory('');
      setIsAddingCategory(false);
      fetchCategories();
    } catch (error) {
      console.error('Error adding category:', error);
      alert('שגיאה בהוספת הקטגוריה. אנא נסה שוב.');
    }
  }

  async function handleDeleteCategory(categoryId: string) {
    if (!window.confirm('האם אתה בטוח שברצונך למחוק קטגוריה זו?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', categoryId);

      if (error) throw error;

      fetchCategories();
      fetchProducts();
    } catch (error) {
      console.error('Error deleting category:', error);
      alert('שגיאה במחיקת הקטגוריה. אנא נסה שוב.');
    }
  }

  const handleDeleteProduct = async (productId: string) => {
    if (!window.confirm('האם אתה בטוח שברצונך למחוק מוצר זה?')) {
      return;
    }

    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) throw error;

      fetchProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('שגיאה במחיקת המוצר. אנא נסה שוב.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEditProduct = (productId: string) => {
    navigate(`/products/edit/${productId}`);
  };

  const toggleCatalogVisibility = async (product: Product) => {
    setIsUpdating(true);
    try {
      const newVisibility = product.catalog_visible === false ? true : false;

      const { error } = await supabase
        .from('products')
        .update({ catalog_visible: newVisibility })
        .eq('id', product.id);

      if (error) throw error;

      setProducts(prevProducts =>
        prevProducts.map(p =>
          p.id === product.id ? { ...p, catalog_visible: newVisibility } : p
        )
      );
    } catch (error) {
      console.error('Error updating product visibility:', error);
      alert('שגיאה בעדכון נראות המוצר בקטלוג. אנא נסה שוב.');
    } finally {
      setIsUpdating(false);
    }
  };

  const filteredProducts = products.filter(product => {
    const searchTermLower = searchTerm.toLowerCase();
    const nameMatch = product.name.toLowerCase().includes(searchTermLower);
    const descriptionMatch = product.description?.toLowerCase().includes(searchTermLower);
    const productCodeMatch = product.product_code?.toLowerCase().includes(searchTermLower);
    const supplierMatch = product.supplier?.toLowerCase().includes(searchTermLower);

    const catalogVisibilityMatch =
      catalogFilter === 'all' ||
      (catalogFilter === 'visible' && product.catalog_visible !== false) ||
      (catalogFilter === 'hidden' && product.catalog_visible === false);

    if (!selectedCategory) {
      return (nameMatch || descriptionMatch || productCodeMatch || supplierMatch) && catalogVisibilityMatch;
    }

    const selectedCategoryData = categories.find(c => c.id === selectedCategory);
    if (selectedCategoryData && !selectedCategoryData.parent_id) {
      const childCategoryIds = getChildCategories(selectedCategory).map(c => c.id);
      return (nameMatch || descriptionMatch || productCodeMatch || supplierMatch) && childCategoryIds.includes(product.category_id || '') && catalogVisibilityMatch;
    }

    return (nameMatch || descriptionMatch || productCodeMatch || supplierMatch) && product.category_id === selectedCategory && catalogVisibilityMatch;
  });

  const groupedProducts = filteredProducts.reduce((acc, product) => {
    const categoryId = product.category_id || 'uncategorized';
    if (!acc[categoryId]) {
      acc[categoryId] = [];
    }
    acc[categoryId].push(product);
    return acc;
  }, {} as Record<string, Product[]>);

  const getDisplayDimensions = (product: Product) => {
    if (product.options_type === 'variations') {
      return [];
    }
    if (product.dimensions && Array.isArray(product.dimensions) && product.dimensions.length > 0) {
      return product.dimensions;
    }
    if (!product.specifications || product.specifications.length == null || product.specifications.width == null || product.specifications.height == null) {
      return [];
    }
    return [{
      id: '1',
      length: product.specifications.length,
      width: product.specifications.width,
      height: product.specifications.height
    }];
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 lg:mb-6">
        <h1 className="text-xl lg:text-2xl font-bold">ניהול מוצרים</h1>
        <div className="flex gap-2 w-full sm:w-auto">
          <button
            onClick={() => setShowCategoryManager(true)}
            className="flex-1 sm:flex-none bg-green-600 text-white px-3 lg:px-4 py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-green-700 text-sm"
          >
            <FolderPlus className="w-5 h-5" />
            <span>ניהול קטגוריות</span>
          </button>
          <Link
            to="/products/add"
            className="flex-1 sm:flex-none bg-blue-600 text-white px-3 lg:px-4 py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-blue-700 text-sm"
          >
            <Plus className="w-5 h-5" />
            <span>הוסף מוצר</span>
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-3 lg:p-4 mb-4 lg:mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="חיפוש לפי שם, תיאור, קוד מוצר או ספק..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pr-10 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory('')}
              className={`px-3 py-2 rounded-lg whitespace-nowrap text-sm ${
                !selectedCategory
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              הכל ({products.length})
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {Object.entries(groupedProducts).map(([categoryId, categoryProducts]) => {
          const category = categories.find(c => c.id === categoryId);
          const parentCategory = category?.parent_id
            ? categories.find(c => c.id === category.parent_id)
            : null;

          return (
            <div key={categoryId}>
              <h2 className="text-lg font-semibold mb-4">
                {category
                  ? `${category.name}${parentCategory ? ` (${parentCategory.name})` : ''}`
                  : 'ללא קטגוריה'
                }
              </h2>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {categoryProducts.map((product) => (
                  <div key={product.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                    <div className="relative aspect-square">
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="w-full h-full object-contain bg-gray-50 p-2"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                          <span className="text-gray-400 text-sm">אין תמונה</span>
                        </div>
                      )}
                      <div className="absolute top-2 left-2 flex gap-2">
                        <button
                          onClick={() => handleEditProduct(product.id)}
                          className="bg-white text-blue-600 p-2 rounded-full shadow-md hover:bg-blue-50"
                          title="ערוך מוצר"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(product.id)}
                          className="bg-white text-red-600 p-2 rounded-full shadow-md hover:bg-red-50"
                          title="מחק מוצר"
                          disabled={isDeleting}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => toggleCatalogVisibility(product)}
                          className={`bg-white p-2 rounded-full shadow-md ${
                            product.catalog_visible === false
                              ? 'text-gray-500 hover:bg-gray-50'
                              : 'text-purple-600 hover:bg-purple-50'
                          }`}
                          title={product.catalog_visible === false ? 'הצג בקטלוג' : 'הסתר מהקטלוג'}
                          disabled={isUpdating}
                        >
                          {product.catalog_visible === false ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="text-lg font-semibold line-clamp-1">{product.name}</h3>
                      {product.description && (
                        <p className="text-gray-600 text-sm mt-1 line-clamp-2">{product.description}</p>
                      )}

                      <div className="mt-2 pt-2 border-t">
                        {getDisplayDimensions(product).length > 0 && getDisplayDimensions(product).map((dimension, index) => (
                          <div key={index} className={`${index > 0 ? 'mt-2 pt-2 border-t' : ''}`}>
                            {getDisplayDimensions(product).length > 1 && (
                              <div className="text-xs text-gray-500 mb-1">מידה {index + 1}</div>
                            )}
                            <div className="grid grid-cols-3 gap-2 text-sm">
                              <div className="text-center">
                                <span className="block text-gray-500">גובה</span>
                                <span className="font-medium">{dimension.height} ס"מ</span>
                              </div>
                              <div className="text-center">
                                <span className="block text-gray-500">עומק</span>
                                <span className="font-medium">{dimension.length} ס"מ</span>
                              </div>
                              <div className="text-center">
                                <span className="block text-gray-500">אורך</span>
                                <span className="font-medium">{dimension.width} ס"מ</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Category Manager Modal */}
      {showCategoryManager && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl flex flex-col max-h-[90vh]">
            <div className="p-4 border-b flex justify-between items-center flex-shrink-0">
              <h2 className="text-lg font-semibold">ניהול קטגוריות</h2>
              <button
                onClick={() => {
                  setShowCategoryManager(false);
                  setIsAddingCategory(false);
                  setIsEditingCategory(null);
                  setNewCategoryName('');
                  setSelectedParentCategory('');
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-hidden flex flex-col">
              <div className="p-4 flex-shrink-0">
                <button
                  onClick={() => {
                    setIsAddingCategory(true);
                    setIsEditingCategory(null);
                    setNewCategoryName('');
                    setSelectedParentCategory('');
                  }}
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-blue-700"
                >
                  <Plus className="w-5 h-5" />
                  הוסף קטגוריה חדשה
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-4 pb-4">
                <div className="space-y-4">
                  {parentCategories.map(parentCat => (
                    <div key={parentCat.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-medium">{parentCat.name}</div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleDeleteCategory(parentCat.id)}
                            className="text-red-600 hover:text-red-800 p-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="pl-4 space-y-2">
                        {getChildCategories(parentCat.id).map(childCat => (
                          <div key={childCat.id} className="flex items-center justify-between py-1">
                            <div>{childCat.name}</div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleDeleteCategory(childCat.id)}
                                className="text-red-600 hover:text-red-800 p-1"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {isAddingCategory && (
                <div className="border-t p-4 bg-white flex-shrink-0">
                  <h3 className="font-medium mb-4">הוספת קטגוריה חדשה</h3>
                  <form onSubmit={handleAddCategory}>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          קטגוריית אב
                        </label>
                        <select
                          value={selectedParentCategory}
                          onChange={(e) => setSelectedParentCategory(e.target.value)}
                          className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                        >
                          <option value="">קטגוריה ראשית</option>
                          {parentCategories.map(category => (
                            <option key={category.id} value={category.id}>
                              {category.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          שם הקטגוריה
                        </label>
                        <input
                          type="text"
                          value={newCategoryName}
                          onChange={(e) => setNewCategoryName(e.target.value)}
                          className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                          placeholder="הזן שם קטגוריה..."
                          required
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-3 mt-6">
                      <button
                        type="button"
                        onClick={() => {
                          setIsAddingCategory(false);
                          setNewCategoryName('');
                          setSelectedParentCategory('');
                        }}
                        className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                      >
                        ביטול
                      </button>
                      <button
                        type="submit"
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                      >
                        הוסף קטגוריה
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
