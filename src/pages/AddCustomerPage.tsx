import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Loader2, X, Plus, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useGoogleMaps } from '../lib/googleMaps';

interface Dimension {
  id: string;
  length: number;
  width: number;
  height: number;
}

interface Product {
  id: string;
  name: string;
  image_url: string;
  specifications?: {
    length: number;
    width: number;
    height: number;
  } | null;
  dimensions?: Dimension[];
}

interface SelectedProduct extends Product {
  quantity: number;
  selectedDimensionIndex?: number;
}

interface GooglePlace {
  description: string;
  place_id: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

const ISRAEL_BOUNDS = {
  north: 33.4,
  south: 29.5,
  west: 34.2,
  east: 35.9
};

export function AddCustomerPage() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [suggestions, setSuggestions] = useState<GooglePlace[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [addressError, setAddressError] = useState('');
  const [isAddressSelected, setIsAddressSelected] = useState(false);
  const [showProductCatalog, setShowProductCatalog] = useState(false);
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [showDimensionsModal, setShowDimensionsModal] = useState<{show: boolean, product: Product | null}>({
    show: false,
    product: null
  });
  const searchTimeoutRef = useRef<NodeJS.Timeout>();
  const autocompleteServiceRef = useRef<any>(null);
  const geocoderRef = useRef<any>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const { isReady: isGoogleMapsReady, error: mapsError } = useGoogleMaps(['places']);
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    phone: '',
    address: '',
    latitude: 0,
    longitude: 0
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    if (!isGoogleMapsReady || !mapRef.current || mapInstanceRef.current) return;

    try {
      const map = new window.google.maps.Map(mapRef.current, {
        center: { lat: 31.7683, lng: 35.2137 },
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

      mapInstanceRef.current = map;
      autocompleteServiceRef.current = new window.google.maps.places.AutocompleteService();
      geocoderRef.current = new window.google.maps.Geocoder();

      map.addListener('click', (e: any) => {
        if (!e.latLng) return;

        const lat = e.latLng.lat();
        const lng = e.latLng.lng();

        geocoderRef.current.geocode(
          { location: { lat, lng } },
          (results: any[], status: string) => {
            if (status === 'OK' && results[0]) {
              setNewCustomer(prev => ({
                ...prev,
                address: results[0].formatted_address,
                latitude: lat,
                longitude: lng
              }));
              updateMarkerOnMap(lat, lng);
              setIsAddressSelected(true);
            }
          }
        );
      });
    } catch (error) {
      console.error('Error initializing map:', error);
    }
  }, [isGoogleMapsReady]);

  const updateMarkerOnMap = (lat: number, lng: number) => {
    if (!mapInstanceRef.current || !window.google?.maps) return;

    if (markerRef.current) {
      markerRef.current.setMap(null);
    }

    const marker = new window.google.maps.Marker({
      position: { lat, lng },
      map: mapInstanceRef.current,
      icon: {
        path: window.google.maps.SymbolPath.CIRCLE,
        scale: 10,
        fillColor: '#16a34a',
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 2,
      }
    });

    markerRef.current = marker;
    mapInstanceRef.current.setCenter({ lat, lng });
    mapInstanceRef.current.setZoom(15);
  };

  async function fetchProducts() {
    const { data, error } = await supabase
      .from('products')
      .select('id, name, image_url, specifications, dimensions');

    if (error) {
      console.error('Error fetching products:', error);
      return;
    }

    const mappedProducts: Product[] = (data || []).map(p => ({
      id: p.id,
      name: p.name,
      image_url: p.image_url || '',
      specifications: (p.specifications as unknown as { length: number; width: number; height: number }) || null,
      dimensions: (p.dimensions as unknown as Dimension[]) || [],
    }));
    setProducts(mappedProducts);
  }

  const getProductDimensions = (product: Product): Dimension[] => {
    if (product.dimensions && product.dimensions.length > 0) {
      return product.dimensions;
    }
    const spec = product.specifications;
    if (spec && spec.length != null && spec.width != null && spec.height != null) {
      return [{
        id: '1',
        length: spec.length,
        width: spec.width,
        height: spec.height
      }];
    }
    return [];
  };

  const handleAddProduct = (product: Product) => {
    const dimensions = getProductDimensions(product);

    if (dimensions.length > 1) {
      setShowDimensionsModal({
        show: true,
        product: product
      });
      return;
    }

    if (dimensions.length === 1) {
      addProductWithDimension(product, 0);
      return;
    }
    console.warn('Product has no dimensions or specifications', product);
  };

  const addProductWithDimension = (product: Product, dimensionIndex: number) => {
    setSelectedProducts(prev => {
      const existingProductIndex = prev.findIndex(p =>
        p.id === product.id && p.selectedDimensionIndex === dimensionIndex
      );

      if (existingProductIndex >= 0) {
        return prev.map((p, index) =>
          index === existingProductIndex
            ? { ...p, quantity: p.quantity + 1 }
            : p
        );
      }

      return [...prev, {
        ...product,
        quantity: 1,
        selectedDimensionIndex: dimensionIndex
      }];
    });

    setShowDimensionsModal({ show: false, product: null });
    setShowProductCatalog(false);
  };

  const handleRemoveProduct = (index: number) => {
    setSelectedProducts(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpdateQuantity = (index: number, quantity: number) => {
    if (quantity < 1) return;
    setSelectedProducts(prev =>
      prev.map((p, i) => i === index ? { ...p, quantity } : p)
    );
  };

  async function searchAddress(query: string) {
    setNewCustomer(prev => ({ ...prev, address: query }));
    setAddressError('');
    setIsAddressSelected(false);

    if (!query.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    if (!window.google?.maps?.places || !autocompleteServiceRef.current) {
      setAddressError('שירות החיפוש נטען... אנא נסה שוב בעוד מספר שניות.');
      return;
    }

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const request = {
          input: query,
          componentRestrictions: { country: 'il' },
          types: ['geocode', 'establishment'],
          language: 'he'
        };

        const predictions = await new Promise<GooglePlace[]>((resolve, reject) => {
          autocompleteServiceRef.current.getPlacePredictions(
            request,
            (results: GooglePlace[] | null, status: string) => {
              if (status === 'OK' && results) {
                resolve(results);
              } else {
                reject(new Error('Failed to get predictions'));
              }
            }
          );
        });

        setSuggestions(predictions);
        setShowSuggestions(true);
        setAddressError('');
      } catch (error) {
        console.error('Error fetching address suggestions:', error);
        setAddressError('שגיאה בחיפוש כתובת. אנא נסה שוב.');
      } finally {
        setIsSearching(false);
      }
    }, 300);
  }

  const handleAddressSelect = async (place: GooglePlace) => {
    if (!window.google?.maps || !geocoderRef.current) {
      setAddressError('שירות המיקום נטען... אנא נסה שוב בעוד מספר שניות.');
      return;
    }

    try {
      const result = await new Promise<any>((resolve, reject) => {
        geocoderRef.current.geocode(
          { placeId: place.place_id },
          (results: any[], status: string) => {
            if (status === 'OK' && results[0]) {
              resolve(results[0]);
            } else {
              reject(new Error('שגיאה בקבלת פרטי כתובת'));
            }
          }
        );
      });

      const location = result.geometry.location;
      const lat = location.lat();
      const lng = location.lng();

      setNewCustomer(prev => ({
        ...prev,
        address: place.description,
        latitude: lat,
        longitude: lng
      }));

      updateMarkerOnMap(lat, lng);

      setSuggestions([]);
      setShowSuggestions(false);
      setAddressError('');
      setIsAddressSelected(true);
    } catch (error) {
      console.error('Error getting address details:', error);
      setAddressError('שגיאה בקבלת פרטי כתובת. אנא נסה שוב.');
    }
  };

  const validateAddress = () => {
    if (!isAddressSelected) {
      setAddressError('יש לבחור כתובת מרשימת ההצעות');
      return false;
    }
    return true;
  };

  const filteredProducts = products.filter(product => {
    if (!productSearchTerm) return true;
    return product.name.toLowerCase().includes(productSearchTerm.toLowerCase());
  });

  const getSelectedDimension = (product: SelectedProduct): Dimension | null => {
    const dimensions = getProductDimensions(product);
    if (dimensions.length === 0) return null;
    const selectedIndex = product.selectedDimensionIndex || 0;
    return dimensions[selectedIndex] || null;
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!validateAddress()) {
      return;
    }

    if (selectedProducts.length === 0) {
      alert('יש לבחור לפחות מוצר אחד');
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase
        .from('customers')
        .insert([{
          name: newCustomer.name,
          phone: newCustomer.phone,
          address: newCustomer.address,
          latitude: newCustomer.latitude,
          longitude: newCustomer.longitude,
          products: selectedProducts
            .map(p => {
              const selectedDimension = getSelectedDimension(p);
              if (!selectedDimension) return null;
              return {
                id: p.id,
                name: p.name,
                quantity: p.quantity,
                specifications: {
                  length: selectedDimension.length,
                  width: selectedDimension.width,
                  height: selectedDimension.height
                }
              };
            })
            .filter(Boolean)
        }]);

      if (error) throw error;

      navigate('/customers');
    } catch (error) {
      console.error('Error saving customer:', error);
      alert('שגיאה בשמירת הלקוח. אנא נסה שוב.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">הוספת לקוח חדש</h1>
      </div>

      {mapsError && (
        <div className="bg-red-50 text-red-700 p-4 rounded-md mb-4">
          שגיאה בטעינת המפה. אנא רענן את העמוד ונסה שוב.
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                שם הלקוח
              </label>
              <input
                type="text"
                required
                value={newCustomer.name}
                onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                מספר טלפון
              </label>
              <input
                type="tel"
                required
                value={newCustomer.phone}
                onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                dir="ltr"
              />
            </div>

            <div className="relative address-search-container">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                כתובת
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={newCustomer.address}
                  onChange={(e) => searchAddress(e.target.value)}
                  onFocus={() => {
                    if (suggestions.length > 0) {
                      setShowSuggestions(true);
                    }
                  }}
                  className={`w-full rounded-md shadow-sm focus:ring-blue-500 p-2 border ${
                    addressError ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'
                  }`}
                  placeholder="חפש כתובת..."
                />
                {isSearching && (
                  <div className="absolute left-2 top-1/2 -translate-y-1/2">
                    <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
                  </div>
                )}
              </div>
              {addressError && (
                <p className="mt-1 text-sm text-red-600">{addressError}</p>
              )}
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white rounded-md shadow-lg border max-h-60 overflow-auto">
                  {suggestions.map((place, index) => (
                    <button
                      key={index}
                      type="button"
                      className="w-full text-right px-4 py-2 text-sm hover:bg-gray-100 focus:bg-gray-100 flex items-center gap-2"
                      onClick={() => handleAddressSelect(place)}
                    >
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <div>
                        <div className="font-medium">{place.structured_formatting.main_text}</div>
                        <div className="text-gray-500">{place.structured_formatting.secondary_text}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                מוצרים
              </label>
              <button
                type="button"
                onClick={() => setShowProductCatalog(true)}
                className="w-full rounded-md border border-gray-300 shadow-sm p-2 text-right hover:bg-gray-50"
              >
                בחר מוצרים מהקטלוג
              </button>

              {selectedProducts.length > 0 && (
                <div className="mt-4 space-y-3">
                  {selectedProducts.map((product, index) => {
                    const selectedDimension = getSelectedDimension(product);
                    return (
                      <div key={index} className="flex items-center gap-4 p-3 border rounded-lg">
                        {product.image_url && (
                          <img
                            src={product.image_url}
                            alt={product.name}
                            className="w-16 h-16 object-cover rounded-md"
                          />
                        )}
                        <div className="flex-1">
                          <div className="font-medium">{product.name}</div>
                          {selectedDimension ? (
                            <div className="text-sm text-gray-500">
                              {selectedDimension.length} × {selectedDimension.width} × {selectedDimension.height} ס"מ
                            </div>
                          ) : (
                            <div className="text-sm text-orange-600">אין מידות זמינות</div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleUpdateQuantity(index, product.quantity - 1)}
                            className="p-1 rounded-md hover:bg-gray-100"
                          >
                            -
                          </button>
                          <span className="w-8 text-center">{product.quantity}</span>
                          <button
                            type="button"
                            onClick={() => handleUpdateQuantity(index, product.quantity + 1)}
                            className="p-1 rounded-md hover:bg-gray-100"
                          >
                            +
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveProduct(index)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded-md"
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

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => navigate('/customers')}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                ביטול
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    מוסיף לקוח...
                  </>
                ) : (
                  'שמור לקוח'
                )}
              </button>
            </div>
          </form>

          <div
            ref={mapRef}
            className="h-[400px] rounded-lg overflow-hidden shadow-md"
          />
        </div>
      </div>

      {showProductCatalog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="text-lg font-semibold">בחירת מוצרים מהקטלוג</h2>
              <button
                onClick={() => setShowProductCatalog(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 border-b">
              <div className="relative">
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="חפש מוצר לפי שם..."
                  value={productSearchTerm}
                  onChange={(e) => setProductSearchTerm(e.target.value)}
                  className="block w-full pr-10 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="p-4 overflow-auto max-h-[calc(80vh-8rem)]">
              {filteredProducts.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  לא נמצאו מוצרים התואמים את החיפוש
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {filteredProducts.map(product => (
                    <div
                      key={product.id}
                      className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => handleAddProduct(product)}
                    >
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="w-full h-40 object-cover"
                        />
                      ) : (
                        <div className="w-full h-40 bg-gray-100 flex items-center justify-center">
                          <span className="text-gray-400">אין תמונה</span>
                        </div>
                      )}
                      <div className="p-3">
                        <h3 className="font-medium">{product.name}</h3>
                        {(() => {
                          const spec = product.specifications;
                          if (spec && spec.length != null && spec.width != null && spec.height != null) {
                            return (
                              <p className="text-sm text-gray-500 mt-1">
                                {spec.length} × {spec.width} × {spec.height} ס"מ
                              </p>
                            );
                          }
                          return null;
                        })()}
                        {product.dimensions && product.dimensions.length > 1 && (
                          <div className="mt-2 text-xs text-blue-600">
                            {product.dimensions.length} מידות זמינות
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showDimensionsModal.show && showDimensionsModal.product && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="text-lg font-semibold">בחר מידה למוצר</h2>
              <button
                onClick={() => setShowDimensionsModal({show: false, product: null})}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4">
              <h3 className="font-medium text-lg mb-3">{showDimensionsModal.product.name}</h3>

              <div className="space-y-3 mt-4">
                {getProductDimensions(showDimensionsModal.product).map((dimension, index) => (
                  <button
                    key={dimension.id}
                    className="w-full p-3 border rounded-lg hover:bg-blue-50 hover:border-blue-300 flex justify-between items-center"
                    onClick={() => addProductWithDimension(showDimensionsModal.product!, index)}
                  >
                    <div className="font-medium">מידה {index + 1}</div>
                    <div className="text-gray-600">
                      {dimension.length} × {dimension.width} × {dimension.height} ס"מ
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AddCustomerPage;
