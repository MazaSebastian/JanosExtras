import { useEffect, useState, useCallback } from 'react';
import { GoogleMap, LoadScript, Marker, InfoWindow } from '@react-google-maps/api';
import styles from '@/styles/LocationMap.module.css';

const mapContainerStyle = {
  width: '100%',
  height: '400px',
  borderRadius: '12px',
};

const defaultCenter = {
  lat: -34.603722,
  lng: -58.381592, // Buenos Aires por defecto
};

const mapOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  streetViewControl: false,
  mapTypeControl: false,
  fullscreenControl: true,
};

export default function LocationMap({ salonLocation, currentLocation, salonName }) {
  const [map, setMap] = useState(null);
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const [distance, setDistance] = useState(null);
  const [mapsLoaded, setMapsLoaded] = useState(false);

  // Calcular distancia entre dos puntos
  const calculateDistance = useCallback((lat1, lon1, lat2, lon2) => {
    const R = 6371000; // Radio de la Tierra en metros
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }, []);

  // Actualizar centro del mapa y distancia cuando cambian las ubicaciones
  useEffect(() => {
    if (currentLocation?.lat && currentLocation?.lng) {
      setMapCenter({
        lat: currentLocation.lat,
        lng: currentLocation.lng,
      });

      if (salonLocation?.lat && salonLocation?.lng) {
        const dist = calculateDistance(
          currentLocation.lat,
          currentLocation.lng,
          salonLocation.lat,
          salonLocation.lng
        );
        setDistance(Math.round(dist));
      }
    } else if (salonLocation?.lat && salonLocation?.lng) {
      setMapCenter({
        lat: salonLocation.lat,
        lng: salonLocation.lng,
      });
    }
  }, [currentLocation, salonLocation, calculateDistance]);

  const onLoad = useCallback((map) => {
    setMap(map);
    if (window.google?.maps) {
      setMapsLoaded(true);
    }
  }, []);

  const onScriptLoad = useCallback(() => {
    if (window.google?.maps) {
      setMapsLoaded(true);
    }
  }, []);

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  // Ajustar el zoom para mostrar ambas ubicaciones
  useEffect(() => {
    if (!map || !window.google?.maps) return;
    
    if (currentLocation?.lat && salonLocation?.lat) {
      const bounds = new window.google.maps.LatLngBounds();
      bounds.extend(new window.google.maps.LatLng(currentLocation.lat, currentLocation.lng));
      bounds.extend(new window.google.maps.LatLng(salonLocation.lat, salonLocation.lng));
      map.fitBounds(bounds);
    } else if (currentLocation?.lat || salonLocation?.lat) {
      const location = currentLocation || salonLocation;
      map.setCenter({ lat: location.lat, lng: location.lng });
      map.setZoom(16);
    }
  }, [map, currentLocation, salonLocation]);

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

  if (!apiKey) {
    return (
      <div className={styles.mapPlaceholder}>
        <p>⚠️ Google Maps API Key no configurada</p>
        <p className={styles.mapPlaceholderSubtext}>
          Configura NEXT_PUBLIC_GOOGLE_MAPS_API_KEY en las variables de entorno
        </p>
      </div>
    );
  }

  return (
    <div className={styles.mapContainer}>
      {distance !== null && (
        <div className={styles.distanceBadge}>
          <span className={styles.distanceIcon}>📍</span>
          <span className={styles.distanceText}>
            Distancia al salón: <strong>{distance}m</strong>
          </span>
        </div>
      )}
      <LoadScript 
        googleMapsApiKey={apiKey}
        onLoad={onScriptLoad}
      >
        {mapsLoaded ? (
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            center={mapCenter}
            zoom={15}
            options={mapOptions}
            onLoad={onLoad}
            onUnmount={onUnmount}
          >
            {/* Marcador del salón */}
            {salonLocation?.lat && salonLocation?.lng && window.google?.maps && (
              <Marker
                position={{ lat: salonLocation.lat, lng: salonLocation.lng }}
                icon={{
                  url: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png',
                  scaledSize: new window.google.maps.Size(40, 40),
                }}
                onClick={() => setSelectedMarker('salon')}
              >
                {selectedMarker === 'salon' && (
                  <InfoWindow onCloseClick={() => setSelectedMarker(null)}>
                    <div>
                      <strong>{salonName || 'Salón'}</strong>
                      <br />
                      <small>Ubicación del salón</small>
                    </div>
                  </InfoWindow>
                )}
              </Marker>
            )}

            {/* Marcador de la ubicación actual del DJ */}
            {currentLocation?.lat && currentLocation?.lng && window.google?.maps && (
              <Marker
                position={{ lat: currentLocation.lat, lng: currentLocation.lng }}
                icon={{
                  url: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png',
                  scaledSize: new window.google.maps.Size(40, 40),
                }}
                onClick={() => setSelectedMarker('current')}
              >
                {selectedMarker === 'current' && (
                  <InfoWindow onCloseClick={() => setSelectedMarker(null)}>
                    <div>
                      <strong>Tu ubicación</strong>
                      <br />
                      <small>Ubicación actual</small>
                    </div>
                  </InfoWindow>
                )}
              </Marker>
            )}
          </GoogleMap>
        ) : (
          <div className={styles.mapPlaceholder}>
            <p>Cargando mapa...</p>
          </div>
        )}
      </LoadScript>
    </div>
  );
}

