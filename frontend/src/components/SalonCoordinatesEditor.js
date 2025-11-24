import { useState, useEffect, useCallback } from 'react';
import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api';
import { salonesAPI } from '@/services/api';
import { parseCoordinates, looksLikeCoordinates } from '@/lib/utils/coordinateParser.js';
import styles from '@/styles/SalonCoordinatesEditor.module.css';

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

export default function SalonCoordinatesEditor({ salon, onClose, onSave }) {
  const [map, setMap] = useState(null);
  const [markerPosition, setMarkerPosition] = useState(null);
  const [latInput, setLatInput] = useState('');
  const [lngInput, setLngInput] = useState('');
  const [combinedInput, setCombinedInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (salon?.latitud && salon?.longitud) {
      const position = {
        lat: parseFloat(salon.latitud),
        lng: parseFloat(salon.longitud),
      };
      setMarkerPosition(position);
      setLatInput(salon.latitud.toString());
      setLngInput(salon.longitud.toString());
    } else {
      setMarkerPosition(defaultCenter);
      setLatInput(defaultCenter.lat.toString());
      setLngInput(defaultCenter.lng.toString());
    }
  }, [salon]);

  // Sincronizar inputs con el marcador cuando cambia el marcador
  useEffect(() => {
    if (markerPosition) {
      setLatInput(markerPosition.lat.toFixed(8));
      setLngInput(markerPosition.lng.toFixed(8));
      // Limpiar el campo combinado cuando se actualiza desde el mapa
      setCombinedInput('');
    }
  }, [markerPosition]);

  const onLoad = useCallback((map) => {
    setMap(map);
    if (markerPosition && window.google?.maps) {
      map.setCenter(markerPosition);
      map.setZoom(17);
    }
  }, [markerPosition]);

  const onMapClick = useCallback((event) => {
    const position = {
      lat: event.latLng.lat(),
      lng: event.latLng.lng(),
    };
    setMarkerPosition(position);
  }, []);

  const handleCoordinatePaste = (e) => {
    const pastedText = e.clipboardData.getData('text');
    const parsed = parseCoordinates(pastedText);
    
    if (parsed) {
      e.preventDefault();
      setLatInput(parsed.lat.toString());
      setLngInput(parsed.lng.toString());
      setMarkerPosition(parsed);
      if (map) {
        map.setCenter(parsed);
        map.setZoom(17);
      }
      setError('');
    }
  };

  const handleLatChange = (e) => {
    const value = e.target.value;
    setLatInput(value);
    const lat = parseFloat(value);
    if (!isNaN(lat) && lat >= -90 && lat <= 90) {
      setMarkerPosition((prev) => ({
        lat,
        lng: prev?.lng || defaultCenter.lng,
      }));
      if (map) {
        map.setCenter({
          lat,
          lng: markerPosition?.lng || defaultCenter.lng,
        });
      }
    }
  };

  const handleLngChange = (e) => {
    const value = e.target.value;
    setLngInput(value);
    const lng = parseFloat(value);
    if (!isNaN(lng) && lng >= -180 && lng <= 180) {
      setMarkerPosition((prev) => ({
        lat: prev?.lat || defaultCenter.lat,
        lng,
      }));
      if (map) {
        map.setCenter({
          lat: markerPosition?.lat || defaultCenter.lat,
          lng,
        });
      }
    }
  };

  const handleApplyCoordinates = () => {
    // Intentar parsear como coordenadas combinadas primero
    const combinedInput = `${latInput.trim()} ${lngInput.trim()}`;
    const parsed = parseCoordinates(combinedInput);
    
    let lat, lng;
    
    if (parsed) {
      // Si se pudo parsear como formato combinado (DMS, etc.)
      lat = parsed.lat;
      lng = parsed.lng;
    } else {
      // Intentar parsear como decimales individuales
      lat = parseFloat(latInput);
      lng = parseFloat(lngInput);
    }

    if (isNaN(lat) || lat < -90 || lat > 90) {
      setError('La latitud debe ser un número entre -90 y 90');
      return;
    }

    if (isNaN(lng) || lng < -180 || lng > 180) {
      setError('La longitud debe ser un número entre -180 y 180');
      return;
    }

    setError('');
    const position = { lat, lng };
    setMarkerPosition(position);
    setLatInput(lat.toString());
    setLngInput(lng.toString());
    if (map) {
      map.setCenter(position);
      map.setZoom(17);
    }
  };

  const handleSave = async () => {
    if (!markerPosition) {
      setError('Por favor, selecciona una ubicación en el mapa');
      return;
    }

    if (!salon?.id) {
      setError('Error: No se pudo identificar el salón');
      return;
    }

    try {
      setSaving(true);
      setError('');
      
      console.log('Guardando coordenadas:', {
        salonId: salon.id,
        latitud: markerPosition.lat,
        longitud: markerPosition.lng,
      });

      const response = await salonesAPI.updateCoordinates(salon.id, {
        latitud: markerPosition.lat,
        longitud: markerPosition.lng,
      });

      console.log('Respuesta del servidor:', response);

      if (response.data) {
        setSuccess(true);
        // Esperar un momento para mostrar el mensaje de éxito
        setTimeout(() => {
          onSave();
          onClose();
        }, 1000);
      } else {
        setError('No se recibió confirmación del servidor');
      }
    } catch (err) {
      console.error('Error al guardar coordenadas:', err);
      const errorMessage = err.response?.data?.error || err.message || 'Error al guardar las coordenadas';
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

  if (!apiKey) {
    return (
      <div className={styles.modal}>
        <div className={styles.modalContent}>
          <h3>Configurar coordenadas de {salon?.nombre}</h3>
          <div className={styles.error}>
            <p>⚠️ Google Maps API Key no configurada</p>
            <p className={styles.errorSubtext}>
              Configura NEXT_PUBLIC_GOOGLE_MAPS_API_KEY en las variables de entorno de Vercel
            </p>
          </div>
          <button onClick={onClose} className={styles.closeButton}>
            Cerrar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.modal}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h3>Configurar coordenadas de {salon?.nombre}</h3>
          <button onClick={onClose} className={styles.closeButton}>
            ×
          </button>
        </div>

        <div className={styles.instructions}>
          <p>📍 Ingresá las coordenadas manualmente o hacé clic en el mapa</p>
          
          {/* Campo único para pegar coordenadas completas desde Google Maps */}
          <div className={styles.fullCoordinateInput}>
            <label htmlFor="coordenadas-completas">
              📋 Coordenadas completas (copiar y pegar desde Google Maps)
            </label>
            <input
              id="coordenadas-completas"
              type="text"
              value={combinedInput}
              onChange={(e) => {
                const value = e.target.value;
                setCombinedInput(value);
                
                // Intentar parsear automáticamente si parece ser coordenadas
                if (looksLikeCoordinates(value)) {
                  const parsed = parseCoordinates(value);
                  if (parsed) {
                    setLatInput(parsed.lat.toFixed(8));
                    setLngInput(parsed.lng.toFixed(8));
                    setMarkerPosition(parsed);
                    if (map) {
                      map.setCenter(parsed);
                      map.setZoom(17);
                    }
                    setError('');
                  }
                }
              }}
              onPaste={(e) => {
                const pastedText = e.clipboardData.getData('text');
                setCombinedInput(pastedText);
                
                const parsed = parseCoordinates(pastedText);
                if (parsed) {
                  e.preventDefault();
                  setLatInput(parsed.lat.toFixed(8));
                  setLngInput(parsed.lng.toFixed(8));
                  setMarkerPosition(parsed);
                  if (map) {
                    map.setCenter(parsed);
                    map.setZoom(17);
                  }
                  setError('');
                }
              }}
              placeholder="Pegá aquí las coordenadas desde Google Maps (cualquier formato)"
              className={styles.fullCoordinateInputField}
            />
            <div className={styles.coordinateHint}>
              💡 Copiá las coordenadas desde Google Maps y pegálas aquí. Acepta formato DMS (grados/minutos/segundos) o decimal.
            </div>
          </div>

          {/* Campos individuales para edición manual */}
          <div className={styles.coordinatesInput}>
            <div className={styles.inputGroup}>
              <label htmlFor="latitud">Latitud</label>
              <input
                id="latitud"
                type="text"
                value={latInput}
                onChange={handleLatChange}
                placeholder="-34.603722"
                className={styles.coordinateInput}
              />
            </div>
            <div className={styles.inputGroup}>
              <label htmlFor="longitud">Longitud</label>
              <input
                id="longitud"
                type="text"
                value={lngInput}
                onChange={handleLngChange}
                placeholder="-58.381592"
                className={styles.coordinateInput}
              />
            </div>
            <button
              type="button"
              onClick={handleApplyCoordinates}
              className={styles.applyButton}
            >
              Aplicar
            </button>
          </div>

          {markerPosition && (
            <div className={styles.coordinates}>
              <strong>Coordenadas actuales:</strong> {markerPosition.lat.toFixed(8)}, {markerPosition.lng.toFixed(8)}
            </div>
          )}
        </div>

        <LoadScript googleMapsApiKey={apiKey}>
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            center={markerPosition || defaultCenter}
            zoom={markerPosition ? 17 : 12}
            options={mapOptions}
            onLoad={onLoad}
            onClick={onMapClick}
          >
            {markerPosition && (
              <Marker
                position={markerPosition}
                draggable={true}
                onDragEnd={(event) => {
                  setMarkerPosition({
                    lat: event.latLng.lat(),
                    lng: event.latLng.lng(),
                  });
                }}
              />
            )}
          </GoogleMap>
        </LoadScript>

        {error && (
          <div className={styles.errorMessage}>
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className={styles.successMessage}>
            <span>✓</span>
            <span>Coordenadas guardadas exitosamente</span>
          </div>
        )}

        <div className={styles.modalActions}>
          <button onClick={onClose} className={styles.cancelButton} disabled={saving}>
            Cancelar
          </button>
          <button onClick={handleSave} className={styles.saveButton} disabled={saving || !markerPosition}>
            {saving ? 'Guardando...' : 'Guardar coordenadas'}
          </button>
        </div>
      </div>
    </div>
  );
}

