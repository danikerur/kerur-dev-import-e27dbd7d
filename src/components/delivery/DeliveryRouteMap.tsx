import React, { useEffect, useRef } from 'react';
import type { SelectedCustomer } from '../../types/delivery';

interface DeliveryRouteMapProps {
  selectedCustomers: SelectedCustomer[];
  isGoogleMapsReady: boolean;
}

const BASE_LOCATION = {
  lat: 31.2518,  // באר שבע
  lng: 34.7913
};

export function DeliveryRouteMap({
  selectedCustomers,
  isGoogleMapsReady
}: DeliveryRouteMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const polylineRef = useRef<any>(null);
  const isCustomersLoaded = useRef(false);

  useEffect(() => {
    isCustomersLoaded.current = selectedCustomers.length > 0;
  }, [selectedCustomers]);

  useEffect(() => {
    if (isGoogleMapsReady && mapRef.current && !mapInstanceRef.current) {
      initMap();
    }
  }, [isGoogleMapsReady]);

  useEffect(() => {
    if (mapInstanceRef.current && isCustomersLoaded.current) {
      updateMapMarkers();
    }
  }, [selectedCustomers]);

  useEffect(() => {
    return () => {
      destroyMap();
    };
  }, []);

  const destroyMap = () => {
    if (markersRef.current) {
      markersRef.current.forEach(marker => {
        if (marker && typeof marker.setMap === 'function') {
          marker.setMap(null);
        }
      });
      markersRef.current = [];
    }

    if (polylineRef.current && typeof polylineRef.current.setMap === 'function') {
      polylineRef.current.setMap(null);
      polylineRef.current = null;
    }

    if (mapInstanceRef.current && typeof mapInstanceRef.current.setMap === 'function') {
      mapInstanceRef.current.setMap(null);
      mapInstanceRef.current = null;
    }
  };

  const initMap = () => {
    if (!mapRef.current || !window.google) return;

    mapRef.current.style.display = 'block';
    mapRef.current.style.minHeight = '600px';
    mapRef.current.style.height = '600px';
    void mapRef.current.offsetHeight;

    const map = new window.google.maps.Map(mapRef.current, {
      center: BASE_LOCATION,
      zoom: 9,
      styles: [
        {
          featureType: 'poi',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }]
        }
      ],
      gestureHandling: 'greedy',
      scrollwheel: true,
      mapTypeControl: false,
      fullscreenControl: false,
      streetViewControl: false
    });

    mapInstanceRef.current = map;

    setTimeout(() => {
      window.google.maps.event.trigger(map, 'resize');
      if (selectedCustomers.length > 0) {
        updateMapMarkers();
      } else {
        map.setCenter(BASE_LOCATION);
        map.setZoom(9);
      }
    }, 200);
  };

  const updateMapMarkers = () => {
    if (!mapInstanceRef.current) return;

    markersRef.current.forEach(marker => {
      if (marker && typeof marker.setMap === 'function') {
        marker.setMap(null);
      }
    });
    markersRef.current = [];

    if (polylineRef.current && typeof polylineRef.current.setMap === 'function') {
      polylineRef.current.setMap(null);
    }

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

      const bounds = new window.google.maps.LatLngBounds();
      path.forEach(point => bounds.extend(point));
      mapInstanceRef.current.fitBounds(bounds, {
        padding: { top: 50, right: 50, bottom: 50, left: 50 }
      });
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 h-full flex flex-col">
      <h2 className="text-lg font-medium mb-4">מפת מסלול</h2>
      <div
        ref={mapRef}
        className="flex-1 rounded-lg overflow-hidden bg-gray-100 relative"
        style={{
          minHeight: '600px',
          height: '100%',
          display: 'block',
          position: 'relative'
        }}
      />
    </div>
  );
}
