import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Plus, Search, Truck, Calendar, X, MapPin, ChevronDown } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useGoogleMaps } from '../lib/googleMaps';
import { AddCustomerModal } from '../components/AddCustomerModal';

interface Driver {
  id: string;
  full_name: string;
  phone: string;
}

interface Customer {
  id: string;
  name: string;
  phone: string;
  address: string;
  latitude: number;
  longitude: number;
}

interface Dimension {
  id: string;
  length: number;
  width: number;
  height: number;
}

interface Product {
  id: string;
  name: string;
  image_url: string | null;
  specifications: {
    length: number;
    width: number;
    height: number;
  };
  dimensions?: Dimension[];
  options_type?: string;
}

interface SelectedProduct {
  product: Product;
  quantity: number;
  selectedDimensionIndex?: number;
  selectedVariation?: any;
}

interface SelectedCustomer {
  customer: Customer;
  products: SelectedProduct[];
  delivery_price: number;
  notes: string;
  order: number;
  distance?: number;
}

const BASE_LOCATION = {
  lat: 31.2518,  // באר שבע
  lng: 34.7913
};

export default function NewDeliveryPage() {
  const navigate = useNavigate();
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedDriver, setSelectedDriver] = useState<string>('');
  const [deliveryDate, setDeliveryDate] = useState<string>('');
  const [selectedCustomers, setSelectedCustomers] = useState<SelectedCustomer[]>([]);
  const [showCustomerSelector, setShowCustomerSelector] = useState(false);
  const [showProductSelector, setShowProductSelector] = useState<string | null>(null);
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [showDimensionsModal, setShowDimensionsModal] = useState<{
    show: boolean;
    customerId: string | null;
    product: Product | null;
  }>({
    show: false,
    customerId: null,
    product: null
  });
  const [showVariationsModal, setShowVariationsModal] = useState<{
    show: boolean;
    customerId: string | null;
    product: Product | null;
    variations: any[];
  }>({ show: false, customerId: null, product: null, variations: [] });
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const polylineRef = useRef<any>(null);
  const { isReady: isGoogleMapsReady } = useGoogleMaps();

  useEffect(() => {
    fetchDrivers();
    fetchCustomers();
    fetchProducts();
  }, []);

  useEffect(() => {
    if (isGoogleMapsReady && mapRef.current && !mapInstanceRef.current) {
      initMap();
    }
  }, [isGoogleMapsReady]);

  useEffect(() => {
    if (mapInstanceRef.current) {
      updateMapMarkers();
    }
  }, [selectedCustomers]);

  useEffect(() => {
    if (selectedCustomers.length > 1) {
      const optimizedCustomers = optimizeRoute([...selectedCustomers]);
      setSelectedCustomers(optimizedCustomers);
    }
  }, [selectedCustomers.length]);

  async function fetchDrivers() {
    const { data, error } = await supabase
      .from('drivers')
      .select('*')
      .order('full_name');

    if (error) {
      console.error('Error fetching drivers:', error);
      return;
    }

    setDrivers(data || []);
  }

  async function fetchCustomers() {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error fetching customers:', error);
      return;
    }

    setCustomers(data || []);
  }

  async function fetchProducts() {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error fetching products:', error);
      return;
    }

    setProducts(data || []);
  }

  const initMap = () => {
    if (!mapRef.current || !window.google) return;

    const map = new window.google.maps.Map(mapRef.current, {
      center: BASE_LOCATION,
      zoom: 9,
      styles: [
        {
          featureType: 'poi',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }]
        }
      ]
    });

    mapInstanceRef.current = map;
  };

  const updateMapMarkers = () => {
    if (!mapInstanceRef.current) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    if (polylineRef.current) {
      polylineRef.current.setMap(null);
    }

    // Add base location marker
    const baseMarker = new window.google.maps.Marker({
      position: BASE_LOCATION,
      map: mapInstanceRef.current,
      icon: {
        path: window.google.maps.SymbolPath.CIRCLE,
        scale: 10,
        fillColor: '#16a34a',
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 2,
      },
      label: {
        text: 'בסיס',
        color: '#ffffff',
        fontSize: '14px',
        fontWeight: 'bold'
      }
    });
    markersRef.current.push(baseMarker);

    // Add customer markers
    selectedCustomers.forEach((customer, index) => {
      const marker = new window.google.maps.Marker({
        position: { lat: customer.customer.latitude, lng: customer.customer.longitude },
        map: mapInstanceRef.current,
        label: {
          text: (index + 1).toString(),
          color: '#ffffff',
          fontSize: '14px',
          fontWeight: 'bold'
        }
      });
      markersRef.current.push(marker);
    });

    // Draw route
    if (selectedCustomers.length > 0) {
      const path = [
        BASE_LOCATION,
        ...selectedCustomers.map(c => ({
          lat: c.customer.latitude,
          lng: c.customer.longitude
        }))
      ];

      polylineRef.current = new window.google.maps.Polyline({
        path,
        geodesic: true,
        strokeColor: '#4f46e5',
        strokeOpacity: 1.0,
        strokeWeight: 2
      });

      polylineRef.current.setMap(mapInstanceRef.current);

      // Fit bounds
      const bounds = new window.google.maps.LatLngBounds();
      path.forEach(point => bounds.extend(point));
      mapInstanceRef.current.fitBounds(bounds, {
        padding: { top: 50, right: 50, bottom: 50, left: 50 }
      });
    }
  };

  const optimizeRoute = (customers: SelectedCustomer[]): SelectedCustomer[] => {
    if (customers.length <= 1) return customers;

    const calculateDistance = (point1: { lat: number; lng: number }, point2: { lat: number; lng: number }) => {
      const R = 6371; // Earth's radius in km
      const dLat = (point2.lat - point1.lat) * Math.PI / 180;
      const dLon = (point2.lng - point1.lng) * Math.PI / 180;
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) *
                Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      return R * c;
    };

    // Calculate distance from base for each customer
    const customersWithDistance = customers.map(customer => ({
      ...customer,
      distance: calculateDistance(BASE_LOCATION, {
        lat: customer.customer.latitude,
        lng: customer.customer.longitude
      })
    }));

    // Sort by distance from base (ascending - closest first)
    customersWithDistance.sort((a, b) => a.distance - b.distance);

    // Return sorted customers with updated order
    return customersWithDistance.map((item, index) => ({
      ...item,
      order: index
    }));
  };

  const handleAddCustomer = (customer: Customer) => {
    if (selectedCustomers.some(sc => sc.customer.id === customer.id)) {
      return;
    }

    const newCustomer: SelectedCustomer = {
      customer,
      products: [],
      delivery_price: 0,
      notes: '',
      order: selectedCustomers.length
    };

    setSelectedCustomers(prev => {
      const updatedCustomers = [...prev, newCustomer];
      return optimizeRoute(updatedCustomers);
    });
    setShowCustomerSelector(false);
  };

  const handleCustomerAdded = (newCustomer: Customer) => {
    setCustomers(prev => [...prev, newCustomer]);
    handleAddCustomer(newCustomer);
  };

  const handleRemoveCustomer = (customerId: string) => {
    setSelectedCustomers(prev => {
      const updatedCustomers = prev.filter(sc => sc.customer.id !== customerId);
      return optimizeRoute(updatedCustomers);
    });
  };

  const handleAddProduct = async (customerId: string, product: Product) => {
    if (product.options_type === 'variations') {
      // Load variations from Supabase
      const { data, error } = await supabase
        .from('product_variations')
        .select('*')
        .eq('product_id', product.id);
      setShowVariationsModal({
        show: true,
        customerId,
        product,
        variations: data || []
      });
      return;
    }
    console.log('handleAddProduct', { customerId, product });
    const dimensions = getProductDimensions(product);
    // If product has multiple dimensions, show dimensions selection modal
    if (dimensions.length > 1) {
      setShowDimensionsModal({
        show: true,
        customerId,
        product
      });
      return;
    }
    // If product has only one dimension, add it directly
    await addProductWithDimension(customerId, product, 0);
  };

  const getProductDimensions = (product: Product): Dimension[] => {
    if (product.options_type === 'variations') {
      return [];
    }
    if (product.dimensions && product.dimensions.length > 0) {
      return product.dimensions;
    }
    // Fallback to specifications if dimensions array is not available
    return [{
      id: '1',
      length: product.specifications.length,
      width: product.specifications.width,
      height: product.specifications.height
    }];
  };

  const addProductWithDimension = async (customerId: string, product: Product, dimensionIndex: number) => {
    console.log('addProductWithDimension', { customerId, product, dimensionIndex });
    setSelectedCustomers(prev => {
      const customerIndex = prev.findIndex(c => c.customer.id === customerId);
      if (customerIndex === -1) return prev;
      const customer = prev[customerIndex];
      const existingProductIndex = customer.products.findIndex(p =>
        p.product.id === product.id && p.selectedDimensionIndex === dimensionIndex
      );
      const updatedProducts = existingProductIndex >= 0
        ? customer.products.map((p, i) =>
            i === existingProductIndex
              ? { ...p, quantity: p.quantity + 1 }
              : p
          )
        : [...customer.products, {
            product,
            quantity: 1,
            selectedDimensionIndex: dimensionIndex
          }];
      const updated = prev.map((c, i) =>
        i === customerIndex
          ? { ...c, products: updatedProducts }
          : c
      );
      console.log('selectedCustomers after add', updated);
      return updated;
    });
    setShowDimensionsModal({ show: false, customerId: null, product: null });
    setShowProductSelector(null);
  };

  const handleRemoveProduct = (customerId: string, productId: string) => {
    setSelectedCustomers(prev =>
      prev.map(sc => {
        if (sc.customer.id === customerId) {
          return {
            ...sc,
            products: sc.products.filter(p => p.product.id !== productId)
          };
        }
        return sc;
      })
    );
  };

  const handleUpdateQuantity = (customerId: string, productId: string, quantity: number) => {
    if (quantity < 1) return;

    setSelectedCustomers(prev =>
      prev.map(sc => {
        if (sc.customer.id === customerId) {
          return {
            ...sc,
            products: sc.products.map(p =>
              p.product.id === productId
                ? { ...p, quantity }
                : p
            )
          };
        }
        return sc;
      })
    );
  };

  // Add a function to handle selecting a variation
  const handleSelectVariation = async (variation: any) => {
    if (!showVariationsModal.product || !showVariationsModal.customerId) return;
    setSelectedCustomers(prev => {
      const customerIndex = prev.findIndex(c => c.customer.id === showVariationsModal.customerId);
      if (customerIndex === -1) return prev;
      const customer = prev[customerIndex];
      const updatedProducts = [
        ...customer.products,
        {
          product: showVariationsModal.product as Product, // ensure not null
          quantity: 1,
          selectedVariation: variation
        }
      ];
      const updated = prev.map((c, i) =>
        i === customerIndex
          ? { ...c, products: updatedProducts }
          : c
      );
      return updated;
    });
    setShowVariationsModal({ show: false, customerId: null, product: null, variations: [] });
    setShowProductSelector(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedCustomers.length === 0) {
      alert('יש לבחור לפחות לקוח אחד');
      return;
    }

    setIsLoading(true);

    try {
      // Create delivery
      const { data: delivery, error: deliveryError } = await supabase
        .from('deliveries')
        .insert({
          driver_id: selectedDriver || null,
          delivery_date: deliveryDate || null,
          status: 'planned'
        })
        .select()
        .single();

      if (deliveryError) throw deliveryError;

      // Create delivery customers and their products
      for (const sc of selectedCustomers) {
        const { data: deliveryCustomer, error: customerError } = await supabase
          .from('delivery_customers')
          .insert({
            delivery_id: delivery.id,
            customer_id: sc.customer.id,
            delivery_price: sc.delivery_price,
            notes: sc.notes,
            address: sc.customer.address,
            order: sc.order
          })
          .select()
          .single();

        if (customerError) throw customerError;

        // Create delivery products
        for (const product of sc.products) {
          // Get the correct dimension for this product
          const dimension = getProductDimensions(product.product)[product.selectedDimensionIndex || 0];
          const product_size = dimension ? {
            length: dimension.length,
            width: dimension.width,
            height: dimension.height
          } : {};
          const { error: productError } = await supabase
            .from('delivery_products')
            .insert({
              delivery_customer_id: deliveryCustomer.id,
              product_id: product.product.id,
              quantity: product.quantity,
              dimension_index: product.selectedDimensionIndex || null,
              product_size
            });
          if (productError) throw productError;
        }

        // Update customer's products in customers table
        const { data: customerData, error: customerFetchError } = await supabase
          .from('customers')
          .select('products')
          .eq('id', sc.customer.id)
          .single();
        if (customerFetchError) throw customerFetchError;
        const existingProducts = customerData?.products || [];
        const productKey = (p: { id: string; specifications?: { length: number; width: number; height: number } }) =>
          `${p.id}_${p.specifications?.length || ''}_${p.specifications?.width || ''}_${p.specifications?.height || ''}`;
        const mergedProductsMap = new Map<string, any>();
        existingProducts.forEach((p: any) => mergedProductsMap.set(productKey(p), { ...p }));
        sc.products.forEach(p => {
          // Use the correct dimension for the key
          const dimension = getProductDimensions(p.product)[p.selectedDimensionIndex || 0];
          const key = `${p.product.id}_${dimension.length}_${dimension.width}_${dimension.height}`;
          if (mergedProductsMap.has(key)) {
            mergedProductsMap.get(key).quantity += p.quantity;
          } else {
            mergedProductsMap.set(key, {
              id: p.product.id,
              name: p.product.name,
              quantity: p.quantity,
              specifications: {
                length: dimension.length,
                width: dimension.width,
                height: dimension.height
              }
            });
          }
        });
        const mergedProducts = Array.from(mergedProductsMap.values());
        const { error: customerUpdateError } = await supabase
          .from('customers')
          .update({
            products: mergedProducts
          })
          .eq('id', sc.customer.id);
        if (customerUpdateError) throw customerUpdateError;
      }

      navigate('/deliveries');
    } catch (error) {
      console.error('Error creating delivery:', error);
      alert('שגיאה ביצירת האספקה. אנא נסה שוב.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate('/deliveries')}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <ArrowRight className="w-6 h-6" />
        </button>
        <h1 className="text-2xl font-bold">יצירת אספקה חדשה</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-medium mb-4">פרטי אספקה</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    מוביל
                  </label>
                  <select
                    value={selectedDriver}
                    onChange={(e) => setSelectedDriver(e.target.value)}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="">בחר מוביל</option>
                    {drivers.map(driver => (
                      <option key={driver.id} value={driver.id}>
                        {driver.full_name} - {driver.phone}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    תאריך אספקה
                  </label>
                  <input
                    type="date"
                    value={deliveryDate}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-medium">לקוחות באספקה</h2>
                <button
                  type="button"
                  onClick={() => setShowCustomerSelector(true)}
                  className="bg-blue-600 text-white px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-sm hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4" />
                  הוסף לקוח
                </button>
              </div>

              <div className="space-y-4">
                {selectedCustomers.map((sc, index) => (
                  <div key={sc.customer.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="bg-blue-100 text-blue-800 text-sm font-medium px-2 py-0.5 rounded-full">
                            תחנה {index + 1}
                          </span>
                          <h3 className="font-medium">{sc.customer.name}</h3>
                        </div>
                        <div className="text-sm text-gray-500 mt-1">
                          <div>{sc.customer.phone}</div>
                          <div>{sc.customer.address}</div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveCustomer(sc.customer.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          מחיר הובלה
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={sc.delivery_price}
                          onChange={(e) => setSelectedCustomers(prev =>
                            prev.map(c =>
                              c.customer.id === sc.customer.id
                                ? { ...c, delivery_price: parseFloat(e.target.value) || 0 }
                                : c
                            )
                          )}
                          className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          הערות
                        </label>
                        <textarea
                          value={sc.notes}
                          onChange={(e) => setSelectedCustomers(prev =>
                            prev.map(c =>
                              c.customer.id === sc.customer.id
                                ? { ...c, notes: e.target.value }
                                : c
                            )
                          )}
                          className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          rows={2}
                        />
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <label className="block text-sm font-medium text-gray-700">
                            מוצרים
                          </label>
                          <button
                            type="button"
                            onClick={() => setShowProductSelector(sc.customer.id)}
                            className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
                          >
                            <Plus className="w-4 h-4" />
                            הוסף מוצר
                          </button>
                        </div>

                        {sc.products.length === 0 ? (
                          <p className="text-sm text-gray-500">לא נבחרו מוצרים</p>
                        ) : (
                          <div className="space-y-2">
                            {sc.products.map((p, pi) => (
                              <div key={p.product.id + (p.selectedDimensionIndex ?? 0)} className="flex items-center gap-4 border rounded p-2 mb-2">
                                {p.product.image_url && (
                                  <img
                                    src={p.product.image_url}
                                    alt={p.product.name}
                                    className="w-10 h-10 object-cover rounded"
                                  />
                                )}
                                <div className="flex-1">
                                  <div className="font-medium">{p.product.name}
                                    {p.selectedVariation?.name && (
                                      <div className="text-xs text-gray-500 mt-1">{p.selectedVariation.name}</div>
                                    )}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    {(() => {
                                      const dims = getProductDimensions(p.product);
                                      const dim = dims[p.selectedDimensionIndex || 0];
                                      if (dim && typeof dim.length !== 'undefined' && typeof dim.width !== 'undefined' && typeof dim.height !== 'undefined') {
                                        return `${dim.length} × ${dim.width} × ${dim.height} ס"מ`;
                                      } else if (p.product.options_type === 'variations') {
                                        return 'וריאציה';
                                      } else {
                                        return '-';
                                      }
                                    })()}
                                  </div>
                                </div>
                                <div className="flex items-center gap-3">
                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateQuantity(sc.customer.id, p.product.id, p.quantity - 1)}
                                      className="p-1 hover:bg-gray-200 rounded"
                                    >
                                      -
                                    </button>
                                    <span className="w-8 text-center">{p.quantity}</span>
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateQuantity(sc.customer.id, p.product.id, p.quantity + 1)}
                                      className="p-1 hover:bg-gray-200 rounded"
                                    >
                                      +
                                    </button>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveProduct(sc.customer.id, p.product.id)}
                                    className="text-red-600 hover:text-red-800"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {selectedCustomers.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Truck className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                    <p>לא נבחרו לקוחות</p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => navigate('/deliveries')}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                ביטול
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                    יוצר אספקה...
                  </>
                ) : (
                  'צור אספקה'
                )}
              </button>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-medium mb-4">מפת מסלול</h2>
              <div
                ref={mapRef}
                className="w-full h-[600px] rounded-lg overflow-hidden bg-gray-100"
              />
            </div>
          </div>
        </div>
      </form>

      {/* Customer Selector Modal */}
      {showCustomerSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="text-lg font-semibold">בחירת לקוח</h2>
              <button
                type="button"
                onClick={() => setShowCustomerSelector(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4">
              <div className="flex justify-between items-center mb-4">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="חיפוש לפי שם, טלפון או כתובת..."
                    value={customerSearchTerm}
                    onChange={(e) => setCustomerSearchTerm(e.target.value)}
                    className="block w-full pr-10 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddCustomer(true)}
                  className="bg-green-600 text-white px-3 py-2 rounded-lg flex items-center gap-1.5 mr-4 whitespace-nowrap hover:bg-green-700"
                >
                  <Plus className="w-4 h-4" />
                  לקוח חדש
                </button>
              </div>

              <div className="max-h-96 overflow-y-auto">
                {customers
                  .filter(customer =>
                    !selectedCustomers.some(sc => sc.customer.id === customer.id) &&
                    (customer.name.toLowerCase().includes(customerSearchTerm.toLowerCase()) ||
                     customer.phone.includes(customerSearchTerm) ||
                     customer.address.toLowerCase().includes(customerSearchTerm.toLowerCase()))
                  )
                  .map(customer => (
                    <button
                      key={customer.id}
                      type="button"
                      onClick={() => handleAddCustomer(customer)}
                      className="w-full text-right p-3 hover:bg-gray-50 rounded-lg mb-2"
                    >
                      <div className="font-medium">{customer.name}</div>
                      <div className="text-sm text-gray-500">{customer.phone}</div>
                      <div className="text-sm text-gray-500">{customer.address}</div>
                    </button>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Customer Modal */}
      {showAddCustomer && (
        <AddCustomerModal
          onClose={() => setShowAddCustomer(false)}
          onCustomerAdded={handleCustomerAdded}
        />
      )}

      {/* Product Selector Modal */}
      {showProductSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="text-lg font-semibold">בחירת מוצר</h2>
              <button
                type="button"
                onClick={() => setShowProductSelector(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4">
              <div className="relative mb-4">
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5  text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="חיפוש לפי שם מוצר..."
                  value={productSearchTerm}
                  onChange={(e) => setProductSearchTerm(e.target.value)}
                  className="block w-full pr-10 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                {products
                  .filter(product =>
                    product.name.toLowerCase().includes(productSearchTerm.toLowerCase())
                  )
                  .map(product => (
                    <button
                      key={product.id}
                      type="button"
                      onClick={async () => await handleAddProduct(showProductSelector, product)}
                      className="text-right p-3 hover:bg-gray-50 rounded-lg border"
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
                        <div className="text-sm text-gray-500">
                          {product.specifications.length} × {product.specifications.width} × {product.specifications.height} ס"מ
                        </div>
                      )}
                      {product.dimensions && product.dimensions.length > 1 && product.options_type !== 'variations' && (
                        <div className="mt-2 text-xs text-blue-600">
                          {product.dimensions.length} מידות זמינות
                        </div>
                      )}
                    </button>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dimensions Selection Modal */}
      {showDimensionsModal.show && showDimensionsModal.product && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="text-lg font-semibold">בחר מידה למוצר</h2>
              <button
                onClick={() => setShowDimensionsModal({ show: false, customerId: null, product: null })}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4">
              <h3 className="font-medium text-lg mb-3">{showDimensionsModal.product.name}</h3>

              <div className="space-y-3 mt-4">
                {getProductDimensions(showDimensionsModal.product).length === 0 ? (
                  <div className="text-center text-gray-500">אין מידות/וריאציות זמינות למוצר זה</div>
                ) : (
                  getProductDimensions(showDimensionsModal.product).map((dimension, index) => (
                    <button
                      key={dimension.id}
                      className="w-full p-3 border rounded-lg hover:bg-blue-50 hover:border-blue-300 flex justify-between items-center"
                      onClick={async () => await addProductWithDimension(
                        showDimensionsModal.customerId!,
                        showDimensionsModal.product!,
                        index
                      )}
                    >
                      <div className="font-medium">מידה {index + 1}</div>
                      <div className="text-gray-600">
                        {dimension.length} × {dimension.width} × {dimension.height} ס"מ
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Variations Selection Modal */}
      {showVariationsModal.show && showVariationsModal.product && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="text-lg font-semibold">בחר וריאציה למוצר</h2>
              <button
                type="button"
                onClick={() => setShowVariationsModal({ show: false, customerId: null, product: null, variations: [] })}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4">
              <div className="font-bold mb-2">{showVariationsModal.product.name}</div>
              {showVariationsModal.variations.length === 0 ? (
                <div className="text-center text-gray-500">לא נמצאו וריאציות</div>
              ) : (
                showVariationsModal.variations.map(variation => (
                  <div
                    key={variation.id}
                    className="border rounded-lg p-3 mb-2 cursor-pointer hover:bg-blue-50"
                    onClick={() => handleSelectVariation(variation)}
                  >
                    {variation.name}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
