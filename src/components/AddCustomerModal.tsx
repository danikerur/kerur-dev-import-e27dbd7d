import React, { useState } from 'react';
import { X, MapPin, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useGoogleMaps } from '../lib/googleMaps';

interface AddCustomerModalProps {
  onClose: () => void;
  onCustomerAdded: (customer: {
    id: string;
    name: string;
    phone: string;
    address: string;
    latitude: number;
    longitude: number;
  }) => void;
}

interface GooglePlace {
  description: string;
  place_id: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

export function AddCustomerModal({ onClose, onCustomerAdded }: AddCustomerModalProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [suggestions, setSuggestions] = useState<GooglePlace[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [addressError, setAddressError] = useState('');
  const [isAddressSelected, setIsAddressSelected] = useState(false);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);

  const { isReady: isMapsReady, error: mapsError } = useGoogleMaps(['places']);

  async function searchAddress(query: string) {
    setAddress(query);
    setAddressError('');
    setIsAddressSelected(false);

    if (!query.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    if (!isMapsReady || !window.google?.maps?.places) {
      setAddressError('שירות החיפוש נטען... אנא נסה שוב בעוד מספר שניות.');
      return;
    }

    setIsSearching(true);
    try {
      const autocompleteService = new window.google.maps.places.AutocompleteService();
      const predictions = await new Promise<GooglePlace[]>((resolve, reject) => {
        autocompleteService.getPlacePredictions(
          {
            input: query,
            componentRestrictions: { country: 'il' },
            types: ['geocode', 'establishment'],
            language: 'he'
          },
          (results, status) => {
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
  }

  const handleAddressSelect = async (place: GooglePlace) => {
    if (!isMapsReady || !window.google?.maps) {
      setAddressError('שירות המיקום נטען... אנא נסה שוב בעוד מספר שניות.');
      return;
    }

    try {
      const geocoder = new window.google.maps.Geocoder();
      const result = await new Promise<any>((resolve, reject) => {
        geocoder.geocode(
          { placeId: place.place_id },
          (results, status) => {
            if (status === 'OK' && results?.[0]) {
              resolve(results[0]);
            } else {
              reject(new Error('שגיאה בקבלת פרטי כתובת'));
            }
          }
        );
      });

      const location = result.geometry.location;
      setLatitude(location.lat());
      setLongitude(location.lng());
      setAddress(place.description);
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
    if (!isAddressSelected || !latitude || !longitude) {
      setAddressError('יש לבחור כתובת מרשימת ההצעות');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    if (!validateAddress()) {
      setIsLoading(false);
      return;
    }

    try {
      const { data, error: dbError } = await supabase
        .from('customers')
        .insert({
          name,
          phone,
          address,
          latitude,
          longitude,
          products: []
        })
        .select()
        .single();

      if (dbError) throw dbError;
      if (!data) throw new Error('No data returned');

      onCustomerAdded({
        id: data.id,
        name: data.name,
        phone: data.phone,
        address: data.address,
        latitude: data.latitude,
        longitude: data.longitude
      });

      onClose();
    } catch (err) {
      console.error('Error creating customer:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-lg font-semibold">הוספת לקוח חדש</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4">
          {mapsError && (
            <div className="bg-yellow-50 text-yellow-800 p-3 rounded-lg text-sm mb-4">
              לא ניתן לטעון את שירות Google Maps כרגע. אנא רענן את העמוד ונסה שוב.
            </div>
          )}
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                שם
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                טלפון
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                dir="ltr"
              />
            </div>

            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                כתובת
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={address}
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
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
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
                  <Loader2 className="w-4 h-4 animate-spin" />
                  שומר...
                </>
              ) : (
                'שמור'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
