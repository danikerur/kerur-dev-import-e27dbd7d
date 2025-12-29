import React, { useEffect, useState, useRef } from 'react';
import { MapPin, Phone, Search, Filter, ChevronRight, X, ChevronDown } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useGoogleMaps } from '@/lib/googleMaps';
import { useNavigate } from 'react-router-dom';
import '@/styles/InfoWindow.css';

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
  city: string | null;
  latitude: number;
  longitude: number;
  products: CustomerProduct[] | null;
}

interface Category {
  id: string;
  name: string;
  parent_id: string | null;
}

// הגדרת גבולות ישראל
const ISRAEL_BOUNDS = {
  north: 33.4,
  south: 29.5,
  west: 34.2,
  east: 35.9
};

export function CustomerSearchPage() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [products, setProducts] = useState<{ id: string; name: string; count: number; category_id?: string }[]>([]);
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const infoWindowRef = useRef<{ show: (content: string) => void; hide: () => void } | null>(null);
  const infoWindowElementRef = useRef<HTMLDivElement | null>(null);
  const backdropElementRef = useRef<HTMLDivElement | null>(null);
  const { isReady: isGoogleMapsReady } = useGoogleMaps();
  const [isMapInitialized, setIsMapInitialized] = useState(false);
  const [filteredCustomersCount, setFilteredCustomersCount] = useState(0);

  useEffect(() => {
    fetchCustomers();
    fetchCategories();
  }, []);

  useEffect(() => {
    if (isGoogleMapsReady && mapRef.current && !mapInstanceRef.current) {
      initMap();
    }
  }, [isGoogleMapsReady]);

  useEffect(() => {
    if (mapInstanceRef.current && customers.length > 0 && isMapInitialized) {
      addMarkersToMap();
    }
  }, [customers, searchTerm, selectedProduct, isMapInitialized]);

  // Cleanup effect
  useEffect(() => {
    return () => {
      if (markersRef.current) {
        markersRef.current.forEach(marker => marker.setMap(null));
        markersRef.current = [];
      }
      if (infoWindowRef.current) {
        infoWindowRef.current.hide();
      }
      // Remove DOM elements
      if (infoWindowElementRef.current) {
        document.body.removeChild(infoWindowElementRef.current);
        infoWindowElementRef.current = null;
      }
      if (backdropElementRef.current) {
        document.body.removeChild(backdropElementRef.current);
        backdropElementRef.current = null;
      }
      mapInstanceRef.current = null;
      setIsMapInitialized(false);
    };
  }, []);

  const CENTER_OF_ISRAEL = { lat: 31.7683, lng: 35.2137 };

  const formatPhoneNumber = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '');
    return cleaned.startsWith('972') ? cleaned : `972${cleaned.startsWith('0') ? cleaned.slice(1) : cleaned}`;
  };

  const formatWhatsAppMessage = (customer: Customer) => {
    const productsList = customer.products?.map(p => 
      `${p.name} (${p.specifications.length}×${p.specifications.width}×${p.specifications.height} ס"מ) - כמות: ${p.quantity}`
    ).join('\n') || '';

    const message = `פרטי לקוח:
שם: ${customer.name}
טלפון: ${customer.phone}
כתובת: ${customer.address}${customer.city ? `, ${customer.city}` : ''}

מוצרים:
${productsList}

מיקום:
https://www.google.com/maps?q=${customer.latitude},${customer.longitude}`;

    return encodeURIComponent(message);
  };

  async function fetchCustomers() {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching customers:', error);
      return;
    }

    console.log('Fetched customers:', data?.length || 0);
    if (data && data.length > 0) {
      console.log('First customer products:', data[0].products);
    }

    // Cast data to Customer[] since products is stored as JSON in DB
    setCustomers((data || []) as unknown as Customer[]);

    // Calculate product counts
    const { data: productsData, error: productsError } = await supabase
      .from('products')
      .select('id, name, category_id');

    if (productsError) {
      console.error('Error fetching products:', productsError);
      return;
    }

    const productCounts = (productsData || []).map(product => ({
      ...product,
      count: (data || []).filter(c => 
        (c.products as any)?.some((p: any) => p.id === product.id)
      ).length
    }));

    setProducts(productCounts);
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

  // Get parent categories only
  const parentCategories = categories.filter(cat => !cat.parent_id);

  // Get child categories for a specific parent
  const getChildCategories = (parentId: string) => {
    return categories.filter(cat => cat.parent_id === parentId);
  };

  // Toggle category expansion
  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  // Filter products based on search term
  const filteredProducts = products
    .filter(product => {
      const matchesSearch = !productSearchTerm || 
        product.name.toLowerCase().includes(productSearchTerm.toLowerCase());
      const hasCustomers = product.count > 0;
      return matchesSearch && hasCustomers;
    })
    .sort((a, b) => b.count - a.count);

  const initMap = () => {
    if (!mapRef.current || !window.google) return;

    const map = new window.google.maps.Map(mapRef.current, {
      center: CENTER_OF_ISRAEL,
      zoom: 8,
      minZoom: 7,
      maxZoom: 18,
      restriction: {
        latLngBounds: ISRAEL_BOUNDS,
        strictBounds: false
      },
      styles: [
        {
          featureType: 'poi',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }]
        }
      ],
      gestureHandling: 'greedy',
      scrollwheel: true
    });

    // Create a custom div for the info window
    const infoWindowContent = document.createElement('div');
    infoWindowContent.className = 'custom-info-window';
    infoWindowContent.style.display = 'none';
    infoWindowElementRef.current = infoWindowContent;

    // Create content container
    const contentContainer = document.createElement('div');
    contentContainer.className = 'info-window-content';
    infoWindowContent.appendChild(contentContainer);

    // Create close button
    const closeButton = document.createElement('button');
    closeButton.innerHTML = '×';
    closeButton.className = 'info-window-close';
    infoWindowContent.appendChild(closeButton);

    // Create a backdrop div
    const backdrop = document.createElement('div');
    backdrop.className = 'custom-info-window-backdrop';
    backdrop.style.display = 'none';
    backdropElementRef.current = backdrop;

    // Add elements to the map
    document.body.appendChild(backdrop);
    document.body.appendChild(infoWindowContent);

    // Function to show info window
    const showInfoWindow = (content: string) => {
      contentContainer.innerHTML = content;
      backdrop.style.display = 'block';
      infoWindowContent.style.display = 'block';

      // Add event listeners to links after content is set
      const links = contentContainer.getElementsByClassName('customer-link');
      Array.from(links).forEach(link => {
        link.addEventListener('click', (e) => {
          e.preventDefault();
          const customerId = (e.currentTarget as HTMLElement).getAttribute('data-customer-id');
          if (customerId) {
            hideInfoWindow();
            navigate(`/customers/${customerId}/edit`);
          }
        });
      });
    };

    // Function to hide info window
    const hideInfoWindow = () => {
      if (backdrop && infoWindowContent) {
        backdrop.style.display = 'none';
        infoWindowContent.style.display = 'none';
      }
    };

    // Add click event to backdrop and close button
    backdrop.addEventListener('click', hideInfoWindow);
    closeButton.addEventListener('click', hideInfoWindow);

    mapInstanceRef.current = map;
    infoWindowRef.current = { show: showInfoWindow, hide: hideInfoWindow };
    setIsMapInitialized(true);
  };

  const addMarkersToMap = () => {
    if (!mapInstanceRef.current) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    // Filter customers based on search and product filter
    const filteredCustomers = customers.filter(customer => {
      const searchTermLower = searchTerm.toLowerCase();
      
      // Search term matching
      const nameMatch = customer.name.toLowerCase().includes(searchTermLower);
      const addressMatch = customer.address.toLowerCase().includes(searchTermLower);
      const cityMatch = customer.city?.toLowerCase().includes(searchTermLower);
      const productNameMatch = customer.products?.some((p: any) => 
        p.name.toLowerCase().includes(searchTermLower)
      );
      
      const searchMatches = !searchTerm || nameMatch || addressMatch || cityMatch || productNameMatch;
      
      // Product filter matching - check if the customer has the selected product
      let productFilterMatch = true;
      if (selectedProduct) {
        productFilterMatch = false;
        if (customer.products && Array.isArray(customer.products)) {
          for (const product of customer.products) {
            if (product.id === selectedProduct) {
              productFilterMatch = true;
              break;
            }
          }
        }
      }

      // Both conditions must be true
      return searchMatches && productFilterMatch;
    });

    // Update filtered customers count
    setFilteredCustomersCount(filteredCustomers.length);

    // Add new markers
    const bounds = new window.google.maps.LatLngBounds();
    
    filteredCustomers.forEach(customer => {
      if (!customer.latitude || !customer.longitude) return;

      const position = new window.google.maps.LatLng(customer.latitude, customer.longitude);
      bounds.extend(position);

      const marker = new window.google.maps.Marker({
        position,
        map: mapInstanceRef.current,
        title: customer.name,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: '#16a34a',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2,
        }
      });

      marker.addListener('click', () => {
        const displayProducts = customer.products?.slice(0, 3) || [];
        const hasMoreProducts = (customer.products?.length || 0) > 3;

        const content = `
          <div dir="rtl" class="p-2">
            <h3 class="font-semibold text-lg">
              <a href="#" class="text-blue-600 hover:underline customer-link" data-customer-id="${customer.id}">
                ${customer.name}
              </a>
            </h3>
            <div class="mt-2 space-y-2">
              <div class="flex items-center justify-between gap-2">
                <a href="tel:+${formatPhoneNumber(customer.phone)}" class="flex items-center gap-2 text-gray-600 hover:text-blue-600 active:text-blue-800 transition-colors">
                  <span class="flex-shrink-0">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                    </svg>
                  </span>
                  <span dir="ltr">${customer.phone}</span>
                </a>
                <a 
                  href="https://wa.me/?text=${formatWhatsAppMessage(customer)}"
                  target="_blank"
                  class="flex items-center gap-1 text-green-600 hover:text-green-700 active:text-green-800 transition-colors text-sm"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M17.472 13.172l.028.028a2.5 2.5 0 0 1 0 3.536l-1.586 1.586a3 3 0 0 1-3.536.428A24.45 24.45 0 0 1 4.222 10.586a3 3 0 0 1 .428-3.536l1.586-1.586a2.5 2.5 0 0 1 3.536 0l.028.028a2 2 0 0 1 .561 1.386l.143 1.429a1 1 0 0 1-.286.804L8.5 10.5a13.5 13.5 0 0 0 5 5l1.389-1.718a1 1 0 0 1 .804-.286l1.429.143a2 2 0 0 1 1.386.561Z"></path>
                    <path d="M12 2a10 10 0 0 1 10 10"></path>
                    <path d="M19.071 4.929A10 10 0 0 1 12 22"></path>
                    <path d="M12 22a10 10 0 0 1-8.95-5.5"></path>
                  </svg>
                  שתף בווטסאפ
                </a>
              </div>
              <p class="flex items-center gap-2 text-gray-600">
                <span class="flex-shrink-0">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path>
                    <circle cx="12" cy="10" r="3"></circle>
                  </svg>
                </span>
                <span>${customer.address}${customer.city ? `, ${customer.city}` : ''}</span>
              </p>
            </div>
            ${displayProducts.length > 0 ? `
              <div class="mt-3 pt-2 border-t">
                <h4 class="font-medium mb-2">מוצרים:</h4>
                <div class="space-y-2">
                  ${displayProducts.map((product: any) => `
                    <div class="flex justify-between items-start">
                      <div>
                        <div class="font-medium">${product.name}</div>
                        <div class="text-sm text-gray-500">
                          ${product.specifications.length} × ${product.specifications.width} × ${product.specifications.height} ס"מ
                        </div>
                      </div>
                      <div class="text-sm font-medium">
                        כמות: ${product.quantity}
                      </div>
                    </div>
                  `).join('')}
                  ${hasMoreProducts ? `
                    <div class="text-blue-600 hover:underline cursor-pointer text-sm mt-2">
                      <a href="#" class="customer-link" data-customer-id="${customer.id}">
                        הצג את כל המוצרים...
                      </a>
                    </div>
                  ` : ''}
                </div>
              </div>
            ` : ''}
          </div>
        `;

        // Show the custom info window
        infoWindowRef.current?.show(content);
      });

      markersRef.current.push(marker);
    });

    // התאמת גבולות המפה
    if (markersRef.current.length > 0) {
      const newBounds = bounds.toJSON();
      
      const adjustedBounds = {
        north: Math.min(newBounds.north, ISRAEL_BOUNDS.north),
        south: Math.max(newBounds.south, ISRAEL_BOUNDS.south),
        east: Math.min(newBounds.east, ISRAEL_BOUNDS.east),
        west: Math.max(newBounds.west, ISRAEL_BOUNDS.west)
      };
      
      mapInstanceRef.current.fitBounds(adjustedBounds, {
        padding: { top: 50, right: 50, bottom: 50, left: 50 }
      });
    } else if (filteredCustomers.length === 0) {
      // Reset map to center of Israel if no customers match
      mapInstanceRef.current.setCenter(CENTER_OF_ISRAEL);
      mapInstanceRef.current.setZoom(8);
    }
  };

  // Clear filters function
  const clearFilters = () => {
    setSelectedProduct('');
    setProductSearchTerm('');
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex-1">
        <div className="flex justify-between items-center mb-4 lg:mb-6">
          <h1 className="text-xl lg:text-2xl font-bold">איתור לקוחות</h1>
        </div>

        <div className="bg-white rounded-lg shadow-md p-3 lg:p-4 mb-4">
          <div className="flex items-center gap-2 lg:gap-4">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="חפש לפי שם לקוח, כתובת, עיר או שם מוצר..."
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

        {/* סרגל סינון */}
        {showFilters && (
          <div className="bg-white rounded-lg shadow-md p-4 mb-4">
            <div className="space-y-4">
              <h2 className="font-semibold text-lg">סינון לפי מוצר</h2>
              
              {/* חיפוש מוצרים */}
              <div className="relative">
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="חפש מוצר..."
                  value={productSearchTerm}
                  onChange={(e) => setProductSearchTerm(e.target.value)}
                  className="block w-full pr-9 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                />
                {productSearchTerm && (
                  <button
                    onClick={() => setProductSearchTerm('')}
                    className="absolute inset-y-0 left-0 pl-3 flex items-center"
                  >
                    <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                  </button>
                )}
              </div>
              
              {/* רשימת מוצרים */}
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={!selectedProduct}
                    onChange={() => setSelectedProduct('')}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span>כל המוצרים</span>
                </label>
                {filteredProducts.length > 0 ? (
                  filteredProducts.map(product => (
                    <label key={product.id} className="flex items-center gap-2">
                      <input
                        type="radio"
                        checked={selectedProduct === product.id}
                        onChange={() => setSelectedProduct(product.id)}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span>{product.name} ({product.count})</span>
                    </label>
                  ))
                ) : (
                  <div className="text-gray-500 text-sm py-2">
                    {productSearchTerm ? 'לא נמצאו מוצרים התואמים את החיפוש' : 'אין מוצרים זמינים'}
                  </div>
                )}
              </div>
              
              {/* כפתורי פעולות */}
              <div className="flex justify-end gap-2">
                <button
                  onClick={clearFilters}
                  className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded"
                >
                  נקה סינון
                </button>
              </div>
            </div>
            
            {/* Display filtered customers count */}
            <div className="mt-4 pt-4 border-t">
              <div className="text-sm text-gray-600">
                {filteredCustomersCount > 0 ? (
                  <p>מציג {filteredCustomersCount} לקוחות על המפה</p>
                ) : (
                  <p className="text-amber-600">לא נמצאו לקוחות התואמים את הסינון</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Map Container */}
        <div className="bg-white rounded-lg shadow-md p-2 lg:p-4">
          <div 
            ref={mapRef}
            className="w-full h-[50vh] lg:h-[calc(100vh-12rem)] rounded-lg overflow-hidden"
          />
        </div>
      </div>
    </div>
  );
}
