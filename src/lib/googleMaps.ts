import { useEffect, useState } from 'react';

const GOOGLE_MAPS_API_KEY = 'AIzaSyCRrLvOVOE9dYj7e_r0atpIMuHqlmJtMeI';

declare global {
  interface Window {
    google: any;
    initGoogleMaps: () => void;
  }
}

let isLoading = false;
let isLoaded = false;
let loadPromise: Promise<void> | null = null;
let retryCount = 0;
const MAX_RETRIES = 3;

export function loadGoogleMaps(libraries: string[] = ['places']): Promise<void> {
  if (isLoaded && window.google?.maps) return Promise.resolve();
  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve, reject) => {
    if (window.google?.maps) {
      isLoaded = true;
      resolve();
      return;
    }

    isLoading = true;

    const timeoutId = setTimeout(() => {
      if (retryCount < MAX_RETRIES) {
        retryCount++;
        loadPromise = null;
        isLoading = false;
        console.log(`Retrying Google Maps load (attempt ${retryCount}/${MAX_RETRIES})`);
        loadGoogleMaps(libraries).then(resolve).catch(reject);
      } else {
        reject(new Error('Google Maps loading timeout after multiple retries'));
        loadPromise = null;
        isLoading = false;
        retryCount = 0;
      }
    }, 20000);

    const checkServices = () => {
      const services = [
        window.google?.maps?.Map,
        window.google?.maps?.Marker,
        window.google?.maps?.places?.AutocompleteService,
        window.google?.maps?.Geocoder
      ];
      return services.every(service => service !== undefined);
    };

    window.initGoogleMaps = () => {
      setTimeout(() => {
        if (checkServices()) {
          clearTimeout(timeoutId);
          isLoaded = true;
          isLoading = false;
          retryCount = 0;
          resolve();
        } else {
          if (retryCount < MAX_RETRIES) {
            retryCount++;
            loadPromise = null;
            isLoading = false;
            console.log(`Retrying Google Maps services check (attempt ${retryCount}/${MAX_RETRIES})`);
            loadGoogleMaps(libraries).then(resolve).catch(reject);
          } else {
            reject(new Error('Google Maps services not fully loaded after multiple retries'));
            loadPromise = null;
            isLoading = false;
            retryCount = 0;
          }
        }
      }, 1000);
    };

    const script = document.createElement('script');
    const librariesParam = `&libraries=${[...new Set(['places', ...libraries])].join(',')}`;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}${librariesParam}&callback=initGoogleMaps&language=he`;
    script.async = true;
    script.defer = true;
    script.onerror = () => {
      if (retryCount < MAX_RETRIES) {
        retryCount++;
        clearTimeout(timeoutId);
        loadPromise = null;
        isLoading = false;
        console.log(`Retrying script load after error (attempt ${retryCount}/${MAX_RETRIES})`);
        loadGoogleMaps(libraries).then(resolve).catch(reject);
      } else {
        clearTimeout(timeoutId);
        reject(new Error('Failed to load Google Maps after multiple retries'));
        loadPromise = null;
        isLoading = false;
        retryCount = 0;
      }
    };
    document.head.appendChild(script);
  });

  return loadPromise;
}

export function useGoogleMaps(libraries: string[] = ['places']) {
  const [isReady, setIsReady] = useState(isLoaded && !!window.google?.maps);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;

    const initMaps = async () => {
      if (!isLoaded || !window.google?.maps) {
        try {
          await loadGoogleMaps(libraries);
          if (mounted) {
            setIsReady(true);
            setError(null);
          }
        } catch (err) {
          console.error('Error loading Google Maps:', err);
          if (mounted) {
            setError(err instanceof Error ? err : new Error('Failed to load Google Maps'));
            setIsReady(false);
          }
        }
      } else {
        setIsReady(true);
      }
    };

    initMaps();

    return () => {
      mounted = false;
    };
  }, [libraries.join(',')]);

  return { isReady, error };
}
