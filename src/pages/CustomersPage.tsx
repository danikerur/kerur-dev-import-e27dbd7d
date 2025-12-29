import React, { useState, useEffect } from 'react';
import { Plus, MapPin, Phone, Pencil, Trash2, Search, Filter, ChevronRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

interface Product {
  id: string;
  name: string;
  specifications: {
    length: number;
    width: number;
    height: number;
  };
}

interface CustomerProduct {
  id: string;
  name: string;
  quantity: number;
  specifications: {
    length: number;
    width: number;
    height: number;
  };
}

interface Customer {
  id: string;
  name: string;
  phone: string;
  address: string;
  products: CustomerProduct[];
  created_at: string;
}

export function CustomersPage() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchCustomers();
    fetchProducts();
  }, []);

  async function fetchCustomers() {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching customers:', error);
      return;
    }

    const mappedCustomers: Customer[] = (data || []).map(c => ({
      id: c.id,
      name: c.name,
      phone: c.phone,
      address: c.address,
      products: (c.products as unknown as CustomerProduct[]) || [],
      created_at: c.created_at || ''
    }));
    setCustomers(mappedCustomers);
  }

  async function fetchProducts() {
    const { data, error } = await supabase
      .from('products')
      .select('id, name, specifications');

    if (error) {
      console.error('Error fetching products:', error);
      return;
    }

    const mappedProducts: Product[] = (data || []).map(p => ({
      id: p.id,
      name: p.name,
      specifications: (p.specifications as { length: number; width: number; height: number }) || { length: 0, width: 0, height: 0 }
    }));
    setProducts(mappedProducts);
  }

  const handleDeleteCustomer = async (customerId: string) => {
    if (!window.confirm('האם אתה בטוח שברצונך למחוק לקוח זה?')) {
      return;
    }

    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', customerId);

      if (error) throw error;

      fetchCustomers();
    } catch (error) {
      console.error('Error deleting customer:', error);
      alert('שגיאה במחיקת הלקוח. אנא נסה שוב.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEditCustomer = (customerId: string) => {
    navigate(`/customers/edit/${customerId}`);
  };

  const filteredCustomers = customers.filter(customer => {
    const searchTermLower = searchTerm.toLowerCase();
    const nameMatch = customer.name.toLowerCase().includes(searchTermLower);
    const addressMatch = customer.address.toLowerCase().includes(searchTermLower);
    const productMatch = customer.products?.some(p =>
      p.name.toLowerCase().includes(searchTermLower)
    );
    const productFilterMatch = !selectedProduct ||
      customer.products?.some(p => p.id === selectedProduct);

    return (nameMatch || addressMatch || productMatch) && productFilterMatch;
  });

  const productCounts = products.map(product => ({
    ...product,
    count: customers.filter(c =>
      c.products?.some(p => p.id === product.id)
    ).length
  }));

  const formatPhoneNumber = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '');
    return cleaned.startsWith('972') ? cleaned : `972${cleaned.startsWith('0') ? cleaned.slice(1) : cleaned}`;
  };

  return (
    <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
      {showFilters && (
        <div className="bg-white rounded-lg shadow-md p-4 lg:h-fit lg:sticky lg:top-4 w-full lg:w-64 order-2 lg:order-1">
          <div className="space-y-4">
            <div className="bg-blue-50 rounded-lg p-3 mb-4">
              <div className="text-blue-800 font-medium">סה"כ לקוחות במערכת</div>
              <div className="text-2xl font-bold text-blue-900 mt-1">{customers.length}</div>
              <div className="text-sm text-blue-700 mt-1">
                מציג {filteredCustomers.length} לקוחות
                {searchTerm || selectedProduct ? ' (לאחר סינון)' : ''}
              </div>
            </div>
            <h2 className="font-semibold text-lg">סינון לפי מוצר</h2>
            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={selectedProduct === ''}
                  onChange={() => setSelectedProduct('')}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <span>הכל ({customers.length})</span>
              </label>
              {productCounts.map(product => (
                <label key={product.id} className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={selectedProduct === product.id}
                    onChange={() => setSelectedProduct(product.id)}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span>{product.name} ({product.count})</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 order-1 lg:order-2">
        <div className="flex justify-between items-center mb-4 lg:mb-6">
          <h1 className="text-xl lg:text-2xl font-bold">ניהול לקוחות</h1>
          <Link
            to="/customers/add"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 text-sm lg:text-base"
          >
            <Plus className="w-5 h-5" />
            הוסף לקוח
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-md p-3 lg:p-4 mb-4 lg:mb-6">
          <div className="flex items-center gap-2 lg:gap-4">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="חיפוש לפי שם לקוח, כתובת או שם מוצר..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pr-10 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm lg:text-base"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2 rounded-lg border ${showFilters ? 'bg-blue-50 border-blue-200 text-blue-600' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}
              title={showFilters ? 'הסתר סינון' : 'הצג סינון'}
            >
              <Filter className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-6">
          {filteredCustomers.map((customer) => (
            <div key={customer.id} className="bg-white rounded-lg shadow-md p-3 lg:p-4">
              <div className="flex justify-between items-start">
                <button
                  onClick={() => handleEditCustomer(customer.id)}
                  className="text-base lg:text-lg font-semibold text-blue-600 hover:text-blue-800 text-right flex items-center gap-1 truncate"
                >
                  {customer.name}
                  <ChevronRight className="w-4 h-4 flex-shrink-0" />
                </button>
                <div className="flex gap-1 lg:gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleEditCustomer(customer.id)}
                    className="text-blue-600 hover:text-blue-800 p-1"
                    title="ערוך לקוח"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteCustomer(customer.id)}
                    className="text-red-600 hover:text-red-800 p-1"
                    title="מחק לקוח"
                    disabled={isDeleting}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="mt-2 lg:mt-3 space-y-1 lg:space-y-2">
                <a
                  href={`tel:+${formatPhoneNumber(customer.phone)}`}
                  className="flex items-center gap-2 text-gray-600 hover:text-blue-600 active:text-blue-800 transition-colors"
                >
                  <Phone className="w-4 h-4 flex-shrink-0" />
                  <span dir="ltr" className="text-sm lg:text-base truncate">{customer.phone}</span>
                </a>
                <div className="flex items-center gap-2 text-gray-600">
                  <MapPin className="w-4 h-4 flex-shrink-0" />
                  <span className="text-sm lg:text-base truncate">{customer.address}</span>
                </div>
              </div>

              {customer.products?.length > 0 && (
                <div className="mt-2 lg:mt-3 pt-2 lg:pt-3 border-t space-y-2 lg:space-y-3">
                  <span className="text-xs lg:text-sm text-gray-500">מוצרים:</span>
                  {customer.products.slice(0, 2).map((product, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="min-w-0">
                        <span className="font-medium text-sm lg:text-base truncate block">{product.name}</span>
                        <div className="text-xs lg:text-sm text-gray-500 truncate">
                          {product.specifications.length} × {product.specifications.width} × {product.specifications.height} ס"מ
                        </div>
                      </div>
                      <div className="text-xs lg:text-sm font-medium flex-shrink-0">
                        כמות: {product.quantity}
                      </div>
                    </div>
                  ))}
                  {customer.products.length > 2 && (
                    <button
                      onClick={() => handleEditCustomer(customer.id)}
                      className="text-blue-600 hover:underline text-xs lg:text-sm flex items-center gap-1"
                    >
                      הצג את כל המוצרים...
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )}

              <div className="mt-2 text-xs lg:text-sm text-gray-500">
                נוצר ב-{new Date(customer.created_at).toLocaleDateString('he-IL')}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
