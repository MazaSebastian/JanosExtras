import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { format } from 'date-fns';
import { formatDateFromDB, formatDateFromDBLong } from '@/utils/dateFormat';
import { es } from 'date-fns/locale';
import { getAuth } from '@/utils/auth';
import api, { eventosAPI, fichadasAPI, coordinacionesAPI, salonesAPI } from '@/services/api';
import DJLayout from '@/components/DJLayout';
import AnunciosDisplay from '@/components/AnunciosDisplay';
import Loading, { SkeletonCard } from '@/components/Loading';
import styles from '@/styles/Home.module.css';

export default function DJHomePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [recentFichadas, setRecentFichadas] = useState([]);
  const [upcomingMeetings, setUpcomingMeetings] = useState([]);
  const [completedPreCoords, setCompletedPreCoords] = useState([]);
  const [weekEvents, setWeekEvents] = useState([]);
  const [salonNombre, setSalonNombre] = useState('');
  const [calendarConnected, setCalendarConnected] = useState(true);
  const [time, setTime] = useState('');
  const [error, setError] = useState('');

  // Estados del Fichador Express
  const [gettingLocation, setGettingLocation] = useState(false);
  const [fichadaCreating, setFichadaCreating] = useState(false);
  const [fichadaError, setFichadaError] = useState('');
  const [fichadaSuccess, setFichadaSuccess] = useState('');

  // Efecto para el reloj en tiempo real
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(format(now, 'HH:mm:ss'));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Verificar Auth
  useEffect(() => {
    const auth = getAuth();
    if (!auth.token || !auth.user) {
      router.push('/login');
      return;
    }
    setUser(auth.user);
  }, [router]);

  // Cargar datos al tener el usuario
  useEffect(() => {
    if (!user) return;
    loadHomeData();
  }, [user]);

  const loadHomeData = async () => {
    try {
      setLoading(true);
      setError('');
      const currentDate = new Date();
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;

      // Cargar resumen de eventos
      const summaryRes = await eventosAPI.getMonthlySummary(year, month);
      setSummary(summaryRes.data);

      // Cargar info del salón si el DJ tiene uno
      if (user.salon_id) {
        try {
          const salonRes = await salonesAPI.getById(user.salon_id);
          if (salonRes.data?.nombre) {
            setSalonNombre(salonRes.data.nombre);
          }
        } catch (e) {
          console.warn('Error al cargar salón');
        }
      }

      // Cargar últimas fichadas (últimas 5)
      const fichadasRes = await fichadasAPI.list({ limit: 5 });
      const fichadasList = fichadasRes.data || [];
      setRecentFichadas(fichadasList);

      // Cargar todas las coordinaciones del DJ
      const coordinacionesRes = await coordinacionesAPI.getAll({ activo: true });
      const allCoordinaciones = coordinacionesRes.data || [];

      // 1. Filtrar videollamadas próximas agendadas (no completadas)
      const meetings = allCoordinaciones
        .filter(c => c.videollamada_agendada && !c.videollamada_completada && c.videollamada_fecha)
        .sort((a, b) => new Date(a.videollamada_fecha) - new Date(b.videollamada_fecha));
      setUpcomingMeetings(meetings);

      // 2. Filtrar pre-coordinaciones completadas listas para revisión
      const completedPre = allCoordinaciones
        .filter(c => c.pre_coordinacion_completada && c.estado !== 'completado')
        .sort((a, b) => new Date(a.fecha_evento || 0) - new Date(b.fecha_evento || 0));
      setCompletedPreCoords(completedPre);

      // 3. Filtrar eventos asignados en la semana (próximos 7 días)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const sevenDaysLater = new Date(today);
      sevenDaysLater.setDate(today.getDate() + 7);
      sevenDaysLater.setHours(23, 59, 59, 999);

      const week = allCoordinaciones
        .filter(c => {
          if (!c.fecha_evento) return false;
          const eventDate = new Date(c.fecha_evento + 'T00:00:00'); // Evitar desfasajes
          return eventDate >= today && eventDate <= sevenDaysLater;
        })
        .sort((a, b) => new Date(a.fecha_evento) - new Date(b.fecha_evento));
      setWeekEvents(week);

      // 4. Cargar estado de conexión de Google Calendar
      try {
        const calStatus = await api.get('/google-calendar/status');
        setCalendarConnected(!!calStatus.data?.connected);
      } catch (e) {
        console.warn('Error al cargar estado de Google Calendar');
      }

    } catch (err) {
      console.error('Error al cargar datos del home:', err);
      setError('Error al cargar los datos del dashboard.');
    } finally {
      setLoading(false);
    }
  };

  // Lógica de Fichadas
  const ultimaFichada = recentFichadas[0];
  const puedeIngresar = !ultimaFichada || ultimaFichada.tipo === 'egreso';
  const puedeEgresar = ultimaFichada && ultimaFichada.tipo === 'ingreso';

  const getCurrentLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Tu navegador no soporta geolocalización.'));
        return;
      }

      const options = {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 30000,
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
              errorMessage = 'Permiso de geolocalización denegado. Actívalo en la barra del navegador.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Información de ubicación no disponible.';
              break;
            case error.TIMEOUT:
              errorMessage = 'Tiempo de espera agotado. Verifica el GPS.';
              break;
          }
          reject(new Error(errorMessage));
        },
        options
      );
    });
  };

  const handleQuickFichada = async (tipo) => {
    try {
      setFichadaCreating(true);
      setFichadaError('');
      setFichadaSuccess('');

      let latitud = null;
      let longitud = null;

      if (tipo === 'ingreso') {
        try {
          setGettingLocation(true);
          const location = await getCurrentLocation();
          latitud = location.latitud;
          longitud = location.longitud;
        } catch (locErr) {
          setFichadaError(locErr.message);
          setFichadaCreating(false);
          setGettingLocation(false);
          return;
        } finally {
          setGettingLocation(false);
        }
      }

      await fichadasAPI.create({ tipo, latitud, longitud });
      setFichadaSuccess(
        tipo === 'ingreso'
          ? '¡Ingreso registrado! Buena jornada de trabajo.'
          : '¡Egreso registrado! Que tengas un excelente descanso.'
      );

      // Recargar datos locales
      await loadHomeData();

      setTimeout(() => {
        setFichadaSuccess('');
      }, 4000);

    } catch (err) {
      setFichadaError(err.response?.data?.error || 'No se pudo registrar la fichada.');
    } finally {
      setFichadaCreating(false);
    }
  };

  // Completar reunión/videollamada directamente
  const handleToggleMeetingCompleted = async (meeting) => {
    try {
      await coordinacionesAPI.update(meeting.id, {
        videollamada_completada: !meeting.videollamada_completada
      });
      // Recargar la lista
      await loadHomeData();
    } catch (err) {
      console.error('Error al actualizar videollamada:', err);
      alert('Hubo un error al actualizar la videollamada. Intenta nuevamente.');
    }
  };

  const getGreeting = () => {
    const hours = new Date().getHours();
    if (hours < 12) return '¡Buen día';
    if (hours < 20) return '¡Buenas tardes';
    return '¡Buenas noches';
  };

  if (!user) {
    return <Loading message="Cargando..." fullScreen />;
  }

  return (
    <DJLayout user={user}>
      <div className={styles.homeContainer}>
        {/* Header con saludo dinámico */}
        <div className={styles.header}>
          <h1 className={styles.title}>{getGreeting()}, {user.nombre.split(' ')[0]}!</h1>
          <p className={styles.subtitle}>
            {salonNombre ? `📍 ${salonNombre} • ` : ''}Aquí tienes un resumen semanal de tus actividades
          </p>
        </div>

        {/* Alerta de conexión de Google Calendar */}
        {!calendarConnected && (
          <div className={styles.calendarWarning}>
            <div className={styles.warningText}>
              <span>⚠️</span>
              <span>
                <strong>Atención:</strong> Tu Google Calendar no está conectado. Los clientes no podrán agendar videollamadas automáticas.
              </span>
            </div>
            <button
              className={styles.warningLink}
              onClick={() => router.push('/dashboard/ajustes')}
            >
              Conectar Ahora →
            </button>
          </div>
        )}

        {/* Fichas de Resumen (KPIs) */}
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <span className={styles.statIcon}>📅</span>
            <div className={styles.statInfo}>
              <span className={styles.statNumber}>{weekEvents.length}</span>
              <span className={styles.statLabel}>Eventos esta semana</span>
            </div>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statIcon}>📹</span>
            <div className={styles.statInfo}>
              <span className={styles.statNumber}>{upcomingMeetings.length}</span>
              <span className={styles.statLabel}>Reuniones agendadas</span>
            </div>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statIcon}>📝</span>
            <div className={styles.statInfo}>
              <span className={styles.statNumber}>{completedPreCoords.length}</span>
              <span className={styles.statLabel}>Pre-coordinaciones listas</span>
            </div>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statIcon}>⏱️</span>
            <div className={styles.statInfo}>
              <span className={styles.statNumber}>
                {puedeIngresar ? 'Fuera' : 'En Turno'}
              </span>
              <span className={styles.statLabel}>Estado de fichada</span>
            </div>
          </div>
        </div>

        {loading ? (
          <SkeletonCard count={3} />
        ) : (
          <div className={styles.mainLayout}>
            {/* Columna Principal - Tareas y agendas */}
            <div className={styles.mainContent}>
              {/* Videollamadas y Reuniones */}
              <div className={styles.card}>
                <div className={styles.cardHeader}>
                  <span className={styles.cardIcon}>📹</span>
                  <h2 className={styles.cardTitle}>Reuniones y Videollamadas de la Semana</h2>
                </div>
                <div className={styles.cardContent}>
                  {upcomingMeetings.length === 0 ? (
                    <p className={styles.emptyMessage}>No tienes videollamadas o reuniones pendientes para esta semana.</p>
                  ) : (
                    <div className={styles.list}>
                      {upcomingMeetings.map((meeting) => {
                        const dateFormatted = meeting.videollamada_fecha
                          ? format(new Date(meeting.videollamada_fecha), "EEEE d 'de' MMMM, HH:mm'hs'", { locale: es })
                          : 'Fecha no definida';

                        return (
                          <div key={meeting.id} className={styles.meetingItem}>
                            <div className={styles.meetingDetails}>
                              <span className={styles.meetingTitle}>
                                {meeting.nombre_agasajado ? `${meeting.nombre_agasajado} (${meeting.nombre_cliente})` : meeting.nombre_cliente || meeting.titulo}
                              </span>
                              <span className={styles.meetingTime} style={{ textTransform: 'capitalize' }}>
                                ⏰ {dateFormatted} {meeting.tipo_evento && ` • ${meeting.tipo_evento}`}
                              </span>
                            </div>
                            <div className={styles.meetingActions}>
                              {meeting.videollamada_meet_link && (
                                <a
                                  href={meeting.videollamada_meet_link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={styles.meetBtn}
                                >
                                  📹 Entrar
                                </a>
                              )}
                              <div className={styles.checkboxWrapper}>
                                <input
                                  type="checkbox"
                                  id={`meet-${meeting.id}`}
                                  className={styles.meetingCheckbox}
                                  checked={meeting.videollamada_completada}
                                  onChange={() => handleToggleMeetingCompleted(meeting)}
                                  title="Marcar como completada"
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Pre-coordinaciones listas para revisión */}
              <div className={styles.card}>
                <div className={styles.cardHeader}>
                  <span className={styles.cardIcon}>📝</span>
                  <h2 className={styles.cardTitle}>Pre-coordinaciones Listas para Revisión</h2>
                </div>
                <div className={styles.cardContent}>
                  {completedPreCoords.length === 0 ? (
                    <p className={styles.emptyMessage}>No hay pre-coordinaciones nuevas completadas por los clientes.</p>
                  ) : (
                    <div className={styles.list}>
                      {completedPreCoords.map((coord) => (
                        <div key={coord.id} className={styles.preCoordItem}>
                          <div className={styles.preCoordInfo}>
                            <span className={styles.preCoordTitle}>
                              {coord.nombre_agasajado ? `${coord.nombre_agasajado} (${coord.nombre_cliente})` : coord.nombre_cliente || coord.titulo}
                            </span>
                            <span className={styles.preCoordMeta}>
                              📅 {coord.fecha_evento ? formatDateFromDB(coord.fecha_evento) : 'Sin fecha'}
                              {coord.tipo_evento && ` • ${coord.tipo_evento}`}
                              {coord.salon_nombre && ` • ${coord.salon_nombre}`}
                            </span>
                          </div>
                          <button
                            className={styles.reviewBtn}
                            onClick={() => router.push(`/dashboard/coordinaciones/${coord.id}/iniciar`)}
                          >
                            Revisar Respuestas →
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <button
                    className={styles.cardAction}
                    onClick={() => router.push('/dashboard/coordinaciones')}
                  >
                    Ir a Coordinaciones
                  </button>
                </div>
              </div>

              {/* Eventos asignados en la semana */}
              <div className={styles.card}>
                <div className={styles.cardHeader}>
                  <span className={styles.cardIcon}>📅</span>
                  <h2 className={styles.cardTitle}>Tus Eventos de la Semana</h2>
                </div>
                <div className={styles.cardContent}>
                  {weekEvents.length === 0 ? (
                    <p className={styles.emptyMessage}>No tienes eventos asignados en los próximos 7 días.</p>
                  ) : (
                    <div className={styles.list}>
                      {weekEvents.map((event) => (
                        <div key={event.id} className={styles.preCoordItem}>
                          <div className={styles.preCoordInfo}>
                            <span className={styles.preCoordTitle}>
                              {event.nombre_agasajado ? `${event.nombre_agasajado} (${event.nombre_cliente})` : event.nombre_cliente || event.titulo}
                            </span>
                            <span className={styles.preCoordMeta}>
                              📆 {event.fecha_evento ? formatDateFromDBLong(event.fecha_evento) : 'Sin fecha'}
                              {event.tipo_evento && ` • ${event.tipo_evento}`}
                              {event.salon_nombre && ` • 📍 ${event.salon_nombre}`}
                            </span>
                          </div>
                          <button
                            className={styles.reviewBtn}
                            onClick={() => router.push(`/dashboard/coordinaciones/${event.id}/iniciar`)}
                          >
                            Ver Flujo
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <button
                    className={styles.cardAction}
                    onClick={() => router.push('/dashboard')}
                  >
                    Ver Calendario Completo
                  </button>
                </div>
              </div>
            </div>

            {/* Columna Derecha - Reloj, Fichador rápido y Anuncios */}
            <div className={styles.sidebar}>
              {/* Reloj y Fichador Express */}
              <div className={styles.fichadorCard}>
                <div className={styles.cardHeader} style={{ width: '100%', marginBottom: 0 }}>
                  <span className={styles.cardIcon}>⏱️</span>
                  <h2 className={styles.cardTitle}>Fichador Express</h2>
                </div>

                <div className={styles.clockText}>{time || '00:00:00'}</div>

                <div className={`${styles.statusBadge} ${puedeIngresar ? styles.statusBadgeFuera : styles.statusBadgeEnTurno}`}>
                  {!puedeIngresar && <span className={styles.pulseDot} />}
                  {puedeIngresar ? 'Fuera de Turno' : 'En Turno'}
                </div>

                {fichadaError && (
                  <div className={styles.errorAlert}>
                    <span>⚠️</span>
                    <span>{fichadaError}</span>
                  </div>
                )}

                {fichadaSuccess && (
                  <div className={styles.successAlert}>
                    <span>✓</span>
                    <span>{fichadaSuccess}</span>
                  </div>
                )}

                <div className={styles.fichadorButtons}>
                  <button
                    type="button"
                    className={`${styles.fichadorBtn} ${styles.fichadorBtnIngreso}`}
                    disabled={!puedeIngresar || fichadaCreating || gettingLocation}
                    onClick={() => handleQuickFichada('ingreso')}
                  >
                    {gettingLocation ? 'Ubicación...' : 'Entrada'}
                  </button>
                  <button
                    type="button"
                    className={`${styles.fichadorBtn} ${styles.fichadorBtnEgreso}`}
                    disabled={!puedeEgresar || fichadaCreating}
                    onClick={() => handleQuickFichada('egreso')}
                  >
                    Salida
                  </button>
                </div>

                {ultimaFichada && (
                  <span className={styles.fichadaStatusText}>
                    Último registro: {ultimaFichada.tipo === 'ingreso' ? 'Entrada' : 'Salida'} a las {format(new Date(ultimaFichada.registrado_en), 'HH:mm')}
                  </span>
                )}
              </div>

              {/* Anuncios del Administrador */}
              <AnunciosDisplay />
            </div>
          </div>
        )}
      </div>
    </DJLayout>
  );
}
