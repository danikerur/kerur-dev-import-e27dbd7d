import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowRight, Plus, Search, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useGoogleMaps } from '../lib/googleMaps';
import { AddCustomerModal } from '../components/AddCustomerModal';
import { DeliveryRouteMap } from '../components/delivery/DeliveryRouteMap';
import { DeliveryDetailsForm } from '../components/delivery/DeliveryDetailsForm';
import { DeliveryCustomersList } from '../components/delivery/DeliveryCustomersList';
import { SelectCustomerModal } from '../components/delivery/SelectCustomerModal';
import { SelectProductModal } from '../components/delivery/SelectProductModal';
import { SelectDimensionModal } from '../components/delivery/SelectDimensionModal';
import type { Driver, Customer, Product, SelectedCustomer, Delivery, Dimension } from '../types/delivery';

const BASE_LOCATION = {
  lat: 31.2518,  // באר שבע
  lng: 34.7913
};

export function EditDeliveryPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [delivery, setDelivery] = useState<Delivery | null>(null);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCustomers, setSelectedCustomers] = useState<SelectedCustomer[]>([]);
  const [showCustomerSelector, setShowCustomerSelector] = useState(false);
  const [showProductSelector, setShowProductSelector] = useState<string | null>(null);
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
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

  const { isReady: isGoogleMapsReady } = useGoogleMaps();

  useEffect(() => {
    if (id) {
      fetchDelivery(id);
    }
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const [driversData, customersData, productsData] = await Promise.all([
        supabase.from('drivers').select('*').order('full_name'),
        supabase.from('customers').select('*').order('name'),
        supabase.from('products').select('*').order('name')
      ]);

      if (driversData.error) throw driversData.error;
      if (customersData.error) throw customersData.error;
      if (productsData.error) throw productsData.error;

      setDrivers(driversData.data || []);
      setCustomers((customersData.data || []).map(c => ({
        id: c.id,
        name: c.name,
        phone: c.phone,
        address: c.address,
        latitude: c.latitude,
        longitude: c.longitude,
      })));
      setProducts((productsData.data || []).map(p => ({
        id: p.id,
        name: p.name,
        specifications: (p.specifications as unknown as { length: number; width: number; height: number }) || { length: 0, width: 0, height: 0 },
        dimensions: (p.dimensions as unknown as Dimension[]) || [],
        image_url: p.image_url || null,
        options_type: p.options_type || undefined,
      })));
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const fetchDelivery = async (deliveryId: string) => {
    try {
      const { data: deliveryData, error: deliveryError } = await supabase
        .from('deliveries')
        .select('*')
        .eq('id', deliveryId)
        .single();

      if (deliveryError) throw deliveryError;

      // Map delivery data to include customers array (will be populated below)
      setDelivery({
        id: deliveryData.id,
        driver_id: deliveryData.driver_id,
        delivery_date: deliveryData.delivery_date,
        status: deliveryData.status || 'planned',
        created_at: deliveryData.created_at || '',
        customers: [],
      });

      const { data: customersData, error: customersError } = await supabase
        .from('delivery_customers')
        .select(`
          id,
          delivery_price,
          notes,
          order,
          customer:customers(
            id,
            name,
            phone,
            address,
            latitude,
            longitude
          ),
          products:delivery_products(
            id,
            quantity,
            dimension_index,
            product:products(
              id,
              name,
              image_url,
              specifications,
              dimensions
            )
          )
        `)
        .eq('delivery_id', deliveryId)
        .order('order');

      if (customersError) throw customersError;

      const formattedCustomers: SelectedCustomer[] = customersData.map((dc: any) => ({
        id: dc.id,
        customer: dc.customer,
        products: dc.products.map((dp: any) => ({
          id: dp.id,
          product: dp.product,
          quantity: dp.quantity,
          selectedDimensionIndex: dp.dimension_index || 0
        })),
        delivery_price: dc.delivery_price || 0,
        notes: dc.notes || '',
        order: dc.order || 0
      }));

      setSelectedCustomers(formattedCustomers);
    } catch (error) {
      console.error('Error fetching delivery:', error);
      alert('שגיאה בטעינת פרטי האספקה. אנא נסה שוב.');
      navigate('/deliveries');
    } finally {
      setIsLoading(false);
    }
  };

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

  const optimizeRoute = (customers: SelectedCustomer[]): SelectedCustomer[] => {
    if (customers.length <= 1) return customers;

    // Calculate distance from base for each customer
    const customersWithDistance = customers.map(customer => ({
      ...customer,
      distance: calculateDistance(BASE_LOCATION, {
        lat: customer.customer.latitude,
        lng: customer.customer.longitude
      })
    }));

    // Sort by distance from base (ascending - closest first)
    customersWithDistance.sort((a, b) => (a.distance || 0) - (b.distance || 0));

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
      id: crypto.randomUUID(),
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
      const updatedCustomers = prev.filter(sc => sc.id !== customerId);
      return optimizeRoute(updatedCustomers);
    });
  };

  const handleAddProduct = (customerId: string, product: Product) => {
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
    addProductWithDimension(customerId, product, 0);
  };

  const getProductDimensions = (product: Product): Dimension[] => {
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

  const addProductWithDimension = (customerId: string, product: Product, dimensionIndex: number) => {
    setSelectedCustomers(prev => {
      const customerIndex = prev.findIndex(c => c.id === customerId);
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
            id: crypto.randomUUID(),
            product,
            quantity: 1,
            selectedDimensionIndex: dimensionIndex
          }];

      return prev.map((c, i) =>
        i === customerIndex
          ? { ...c, products: updatedProducts }
          : c
      );
    });

    // Close modals
    setShowDimensionsModal({ show: false, customerId: null, product: null });
    setShowProductSelector(null);
  };

  const handleRemoveProduct = (customerId: string, productId: string) => {
    setSelectedCustomers(prev =>
      prev.map(sc => {
        if (sc.id === customerId) {
          return {
            ...sc,
            products: sc.products.filter(p => p.id !== productId)
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
        if (sc.id === customerId) {
          return {
            ...sc,
            products: sc.products.map(p =>
              p.id === productId
                ? { ...p, quantity }
                : p
            )
          };
        }
        return sc;
      })
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!delivery) return;

    if (selectedCustomers.length === 0) {
      alert('יש לבחור לפחות לקוח אחד');
      return;
    }

    setIsSaving(true);

    try {
      await supabase.rpc('update_delivery', {
        p_delivery_id: delivery.id,
        p_driver_id: delivery.driver_id,
        p_delivery_date: delivery.delivery_date,
        p_status: delivery.status,
        p_customers: selectedCustomers.map(sc => ({
          id: sc.id,
          customer_id: sc.customer.id,
          delivery_price: sc.delivery_price,
          notes: sc.notes,
          address: sc.customer.address,
          latitude: sc.customer.latitude,
          longitude: sc.customer.longitude,
          order: sc.order,
          products: sc.products.map(p => ({
            id: p.id,
            product_id: p.product.id,
            quantity: p.quantity,
            dimension_index: p.selectedDimensionIndex,
            product_size: {}
          }))
        }))
      });

      navigate('/deliveries');
    } catch (error) {
      console.error('Error updating delivery:', error);
      alert('שגיאה בעדכון האספקה. אנא נסה שוב.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading || !delivery) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center gap-2 text-gray-500">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent" />
          <span>טוען פרטי אספקה...</span>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate('/deliveries')}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <ArrowRight className="w-6 h-6" />
        </button>
        <h1 className="text-2xl font-bold">עריכת אספקה</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <DeliveryDetailsForm
              driverId={delivery.driver_id}
              deliveryDate={delivery.delivery_date}
              status={delivery.status}
              drivers={drivers}
              onUpdate={(field, value) => setDelivery(prev => prev ? { ...prev, [field]: value } : null)}
            />

            <DeliveryCustomersList
              selectedCustomers={selectedCustomers}
              onShowCustomerSelector={() => setShowCustomerSelector(true)}
              onRemoveCustomer={handleRemoveCustomer}
              onShowProductSelector={(customerId) => setShowProductSelector(customerId)}
              onUpdateCustomer={(customerId, field, value) => {
                setSelectedCustomers(prev =>
                  prev.map(c =>
                    c.id === customerId
                      ? { ...c, [field]: value }
                      : c
                  )
                );
              }}
              onUpdateQuantity={handleUpdateQuantity}
              onRemoveProduct={handleRemoveProduct}
            />

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
                disabled={isSaving}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
              >
                {isSaving ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                    שומר שינויים...
                  </>
                ) : (
                  'שמור שינויים'
                )}
              </button>
            </div>
          </div>

          <div className="space-y-6">
            <DeliveryRouteMap
              selectedCustomers={selectedCustomers}
              isGoogleMapsReady={isGoogleMapsReady}
            />
          </div>
        </div>
      </form>

      {/* Customer Selector Modal */}
      {showCustomerSelector && (
        <SelectCustomerModal
          customers={customers}
          selectedCustomerIds={selectedCustomers.map(sc => sc.customer.id)}
          searchTerm={customerSearchTerm}
          onSearchChange={setCustomerSearchTerm}
          onSelectCustomer={handleAddCustomer}
          onShowAddCustomer={() => setShowAddCustomer(true)}
          onClose={() => setShowCustomerSelector(false)}
        />
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
        <SelectProductModal
          products={products}
          searchTerm={productSearchTerm}
          onSearchChange={setProductSearchTerm}
          onSelectProduct={(product) => handleAddProduct(showProductSelector, product)}
          onClose={() => setShowProductSelector(null)}
        />
      )}

      {/* Dimensions Selection Modal */}
      {showDimensionsModal.show && showDimensionsModal.product && (
        <SelectDimensionModal
          product={showDimensionsModal.product}
          onSelectDimension={(dimensionIndex) => {
            if (!showDimensionsModal.customerId) return;
            addProductWithDimension(
              showDimensionsModal.customerId,
              showDimensionsModal.product!,
              dimensionIndex
            );
          }}
          onClose={() => setShowDimensionsModal({ show: false, customerId: null, product: null })}
        />
      )}
    </div>
  );
}
