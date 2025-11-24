import { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { fichadasAPI, salonesAPI, authAPI } from '@/services/api';
import LocationMap from '@/components/LocationMap';
import Loading, { LoadingButton } from '@/components/Loading';
import styles from '@/styles/FichadasPanel.module.css';

const formatDateTime = (value) => {
  if (!value) return '';
  return format(new Date(value), "EEEE d 'de' MMMM HH:mm", { locale: es });
};

export default function FichadasPanel() {
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);
  const [infoMessage, setInfoMessage] = useState('');
  const [gettingLocation, setGettingLocation] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [salonInfo, setSalonInfo] = useState(null);
  const [locationError, setLocationError] = useState('');
  const [showAllMovements, setShowAllMovements] = useState(false);

  const ultimaFichada = items[0];
  const puedeIngresar =
    !ultimaFichada || ultimaFichada.tipo === 'egreso';
  const puedeEgresar = ultimaFichada && ultimaFichada.tipo === 'ingreso';

  const resumenDiario = useMemo(() => {
    const dates = {};
    items.forEach((item) => {
      const dateKey = format(new Date(item.registrado_en), 'yyyy-MM-dd');
      if (!dates[dateKey]) {
        dates[dateKey] = [];
      }
      dates[dateKey].push(item);
    });
    return Object.entries(dates).map(([date, fichadas]) => ({
      date,
      fichadas,
    }));
  }, [items]);

  const loadFichadas = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await fichadasAPI.list({ limit: 30 });
      setItems(response.data || []);
    } catch (err) {
      console.error('Error al cargar fichadas:', err);
      setError(err.response?.data?.error || 'No se pudieron cargar las fichadas.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFichadas();
    loadSalonInfo();
  }, []);

  const loadSalonInfo = async () => {
    try {
      const profile = await authAPI.getProfile();
      if (profile.data?.salon_id) {
        const salonResponse = await salonesAPI.getById(profile.data.salon_id);
        setSalonInfo(salonResponse.data);
      }
    } catch (err) {
      console.error('Error al cargar información del salón:', err);
    }
  };

  // Tracking de ubicación en tiempo real
  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationError('Tu navegador no soporta geolocalización.');
      return;
    }

    const options = {
      enableHighAccuracy: true,
      timeout: 20000, // Aumentado a 20 segundos
      maximumAge: 60000, // Permitir usar ubicación de hasta 1 minuto de antigüedad
    };

    // Obtener ubicación inicial
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCurrentLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setLocationError('');
      },
      (error) => {
        let errorMessage = 'No se pudo obtener tu ubicación.';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Permiso de geolocalización denegado.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Información de ubicación no disponible.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Tiempo de espera agotado.';
            break;
        }
        setLocationError(errorMessage);
      },
      options
    );

    // Actualizar ubicación en tiempo real
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setCurrentLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setLocationError('');
      },
      (error) => {
        // Solo mostrar error si no hay ubicación previa
        if (!currentLocation) {
          let errorMessage = 'No se pudo obtener tu ubicación.';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Permiso de geolocalización denegado.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Información de ubicación no disponible.';
              break;
            case error.TIMEOUT:
              errorMessage = 'Tiempo de espera agotado. Verifica que el GPS esté activado.';
              break;
          }
          setLocationError(errorMessage);
        }
      },
      options
    );

    // Limpiar el watch cuando el componente se desmonte
    return () => {
      if (watchId) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, []);

  const getCurrentLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Tu navegador no soporta geolocalización.'));
        return;
      }

      const options = {
        enableHighAccuracy: true,
        timeout: 20000, // Aumentado a 20 segundos
        maximumAge: 30000, // Permitir usar ubicación de hasta 30 segundos de antigüedad
      };

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitud: position.coords.latitude,
            longitud: position.coords.longitude,
          });
        },
        (error) => {
          let errorMessage = 'No se pudo obtener tu ubicación.';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage =
                'Se denegó el permiso de geolocalización. Por favor, permite el acceso a tu ubicación en la configuración del navegador.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'La información de ubicación no está disponible.';
              break;
            case error.TIMEOUT:
              errorMessage = 'Se agotó el tiempo de espera para obtener la ubicación. Verifica que el GPS esté activado y que tengas buena señal.';
              break;
            default:
              errorMessage = 'Error desconocido al obtener la ubicación.';
              break;
          }
          reject(new Error(errorMessage));
        },
        options
      );
    });
  };

  const registrarFichada = async (tipo) => {
    try {
      setCreating(true);
      setError('');
      setInfoMessage('');

      let latitud = null;
      let longitud = null;

      // Solo obtener ubicación para ingresos
      if (tipo === 'ingreso') {
        try {
          setGettingLocation(true);
          const location = await getCurrentLocation();
          latitud = location.latitud;
          longitud = location.longitud;
        } catch (locationError) {
          setError(locationError.message);
          setCreating(false);
          setGettingLocation(false);
          return;
        } finally {
          setGettingLocation(false);
        }
      }

      await fichadasAPI.create({ tipo, latitud, longitud });
      setInfoMessage(
        tipo === 'ingreso'
          ? 'Ingreso registrado. ¡Buena jornada!'
          : 'Egreso registrado. ¡Gracias!'
      );
      await loadFichadas();
      // Auto-ocultar mensaje después de 4 segundos
      setTimeout(() => {
        setInfoMessage('');
      }, 4000);
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo registrar la fichada.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <section className={styles.panel}>
      <header className={styles.header}>
        <div>
          <p className={styles.subtitle}>Control horario</p>
          <h3 className={styles.title}>Fichadas</h3>
        </div>
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.primaryButton}
            onClick={() => registrarFichada('ingreso')}
            disabled={!puedeIngresar || creating || gettingLocation}
          >
            {gettingLocation
              ? 'Obteniendo ubicación...'
              : creating
              ? 'Registrando...'
              : 'Marcar ingreso'}
          </button>
          <button
            type="button"
            className={styles.secondaryButton}
            onClick={() => registrarFichada('egreso')}
            disabled={!puedeEgresar || creating}
          >
            Marcar egreso
          </button>
        </div>
      </header>

      {error && (
        <div className={styles.error}>
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}
      {infoMessage && (
        <div className={styles.info}>
          <span>✓</span>
          <span>{infoMessage}</span>
        </div>
      )}

      <div className={styles.statusCard}>
        <p className={styles.statusLabel}>Estado actual</p>
        <h4 className={styles.statusValue}>
          {puedeIngresar ? 'Fuera de turno' : 'En jornada'}
        </h4>
        {ultimaFichada && (
          <p className={styles.statusDetail}>
            Última fichada: {ultimaFichada.tipo} —{' '}
            {formatDateTime(ultimaFichada.registrado_en)}
          </p>
        )}
      </div>

      {/* Mapa de ubicación */}
      {salonInfo && (
        <div className={styles.mapSection}>
          <h5 className={styles.mapTitle}>Ubicación en tiempo real</h5>
          {locationError && (
            <div className={styles.locationError}>
              <span>⚠️</span>
              <div>
                <span>{locationError}</span>
                <button
                  type="button"
                  className={styles.retryButton}
                  onClick={() => {
                    setLocationError('');
                    // Forzar actualización de ubicación
                    if (navigator.geolocation) {
                      navigator.geolocation.getCurrentPosition(
                        (position) => {
                          setCurrentLocation({
                            lat: position.coords.latitude,
                            lng: position.coords.longitude,
                          });
                          setLocationError('');
                        },
                        (error) => {
                          let errorMessage = 'No se pudo obtener tu ubicación.';
                          switch (error.code) {
                            case error.PERMISSION_DENIED:
                              errorMessage = 'Permiso de geolocalización denegado.';
                              break;
                            case error.POSITION_UNAVAILABLE:
                              errorMessage = 'Información de ubicación no disponible.';
                              break;
                            case error.TIMEOUT:
                              errorMessage = 'Tiempo de espera agotado. Verifica que el GPS esté activado.';
                              break;
                          }
                          setLocationError(errorMessage);
                        },
                        {
                          enableHighAccuracy: true,
                          timeout: 20000,
                          maximumAge: 0,
                        }
                      );
                    }
                  }}
                >
                  Reintentar
                </button>
              </div>
            </div>
          )}
          <LocationMap
            salonLocation={
              salonInfo.latitud && salonInfo.longitud
                ? {
                    lat: parseFloat(salonInfo.latitud),
                    lng: parseFloat(salonInfo.longitud),
                  }
                : null
            }
            currentLocation={currentLocation}
            salonName={salonInfo.nombre}
          />
          {!salonInfo.latitud || !salonInfo.longitud ? (
            <p className={styles.mapWarning}>
              ⚠️ El salón no tiene coordenadas configuradas. Contacta al administrador.
            </p>
          ) : null}
        </div>
      )}

      <div className={styles.listContainer}>
        <div className={styles.listHeader}>
          <h5>Últimos movimientos</h5>
          {!loading && resumenDiario.length > 5 && (
            <button
              type="button"
              className={styles.toggleButton}
              onClick={() => setShowAllMovements(!showAllMovements)}
            >
              {showAllMovements ? 'Ver menos' : `Ver todos (${resumenDiario.length})`}
            </button>
          )}
        </div>
        {loading ? (
          <Loading message="Cargando fichadas..." size="small" variant="gradient" />
        ) : resumenDiario.length === 0 ? (
          <div className={styles.listEmpty}>
            Aún no registraste entradas o salidas.
          </div>
        ) : (
          (showAllMovements ? resumenDiario : resumenDiario.slice(0, 5)).map(({ date, fichadas }) => (
            <div key={date} className={styles.dayBlock}>
              <p className={styles.dayTitle}>
                {format(new Date(date), "EEEE d 'de' MMMM", { locale: es })}
              </p>
              <div className={styles.chipRow}>
                {fichadas.map((item) => (
                  <div
                    key={item.id}
                    className={`${styles.chip} ${
                      item.tipo === 'ingreso' ? styles.ingreso : styles.egreso
                    }`}
                  >
                    <span>{item.tipo === 'ingreso' ? 'Ingreso' : 'Egreso'}</span>
                    <strong>
                      {format(new Date(item.registrado_en), 'HH:mm')}
                    </strong>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}


