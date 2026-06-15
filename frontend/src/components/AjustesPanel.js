import { useState, useEffect } from 'react';
import { authAPI } from '@/services/api';
import { suscribirNotificacionesPush } from '@/utils/pushHelper';
import styles from '@/styles/AjustesPanel.module.css';

const DAYS_OF_WEEK = [
  { key: 'lunes', name: 'Lunes' },
  { key: 'martes', name: 'Martes' },
  { key: 'miercoles', name: 'Miércoles' },
  { key: 'jueves', name: 'Jueves' },
  { key: 'viernes', name: 'Viernes' },
  { key: 'sabado', name: 'Sábado' },
  { key: 'domingo', name: 'Domingo' }
];

const AVAILABLE_HOURS = [
  '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', 
  '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'
];

export default function AjustesPanel() {
  const [activeTab, setActiveTab] = useState('notificaciones');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  
  // Notification Preferences States
  const [recordatorioHoras, setRecordatorioHoras] = useState(2);
  const [reunionesDia, setReunionesDia] = useState(true);
  const [precoordinacionCompletada, setPrecoordinacionCompletada] = useState(true);

  // Contact Information States
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');
  
  // Push Notification Device Status
  const [pushGranted, setPushGranted] = useState(false);
  
  // Availability States
  const [dispActiva, setDispActiva] = useState(false);
  const [horasDisponibles, setHorasDisponibles] = useState({
    lunes: [],
    martes: [],
    miercoles: [],
    jueves: [],
    viernes: [],
    sabado: [],
    domingo: []
  });
  
  // Accordion toggle states per day
  const [expandedDay, setExpandedDay] = useState('lunes');

  useEffect(() => {
    // Check push permissions on load
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPushGranted(Notification.permission === 'granted');
    }

    // Load DJ Profile
    async function loadProfile() {
      try {
        const res = await authAPI.getProfile();
        const dj = res.data;
        if (dj) {
          if (dj.notific_recordatorio_horas !== undefined && dj.notific_recordatorio_horas !== null) {
            setRecordatorioHoras(dj.notific_recordatorio_horas);
          }
          if (dj.notific_reuniones_dia !== undefined && dj.notific_reuniones_dia !== null) {
            setReunionesDia(dj.notific_reuniones_dia);
          }
          if (dj.notific_precoordinacion_completada !== undefined && dj.notific_precoordinacion_completada !== null) {
            setPrecoordinacionCompletada(dj.notific_precoordinacion_completada);
          }
          if (dj.email !== undefined && dj.email !== null) {
            setEmail(dj.email);
          }
          if (dj.telefono !== undefined && dj.telefono !== null) {
            setTelefono(dj.telefono);
          }
          
          if (dj.disponibilidad_videollamada) {
            const disp = typeof dj.disponibilidad_videollamada === 'string'
              ? JSON.parse(dj.disponibilidad_videollamada)
              : dj.disponibilidad_videollamada;
            
            setDispActiva(disp.activo || false);
            if (disp.horasDisponibles) {
              // Map both accented and unaccented versions just in case database has old structure
              const parsedHoras = {
                lunes: disp.horasDisponibles.lunes || disp.horasDisponibles.Lunes || [],
                martes: disp.horasDisponibles.martes || disp.horasDisponibles.Martes || [],
                miercoles: disp.horasDisponibles.miercoles || disp.horasDisponibles.miércoles || disp.horasDisponibles.Miércoles || [],
                jueves: disp.horasDisponibles.jueves || disp.horasDisponibles.Jueves || [],
                viernes: disp.horasDisponibles.viernes || disp.horasDisponibles.Viernes || [],
                sabado: disp.horasDisponibles.sabado || disp.horasDisponibles.sábado || disp.horasDisponibles.Sábado || [],
                domingo: disp.horasDisponibles.domingo || disp.horasDisponibles.Domingo || []
              };
              setHorasDisponibles(parsedHoras);
            }
          }
        }
      } catch (err) {
        console.error('Error al cargar perfil de DJ:', err);
        setMessage({ type: 'error', text: 'Error al cargar los ajustes.' });
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, []);

  const handlePushRegister = async () => {
    const sub = await suscribirNotificacionesPush();
    if (sub) {
      setPushGranted(true);
      setMessage({ type: 'success', text: '¡Este dispositivo ha sido registrado correctamente para recibir notificaciones push!' });
    } else {
      setMessage({ type: 'error', text: 'No se pudo suscribir el dispositivo. Asegúrate de habilitar los permisos.' });
    }
    setTimeout(() => setMessage(null), 5000);
  };

  const handleToggleSlot = (dayKey, hour) => {
    setHorasDisponibles(prev => {
      const daySlots = prev[dayKey] || [];
      const updated = daySlots.includes(hour)
        ? daySlots.filter(h => h !== hour)
        : [...daySlots, hour].sort();
      return {
        ...prev,
        [dayKey]: updated
      };
    });
  };

  const handleSelectAllDay = (dayKey) => {
    setHorasDisponibles(prev => ({
      ...prev,
      [dayKey]: [...AVAILABLE_HOURS]
    }));
  };

  const handleClearDay = (dayKey) => {
    setHorasDisponibles(prev => ({
      ...prev,
      [dayKey]: []
    }));
  };

  const handleCopyDayToAll = (dayKey) => {
    const sourceSlots = horasDisponibles[dayKey] || [];
    setHorasDisponibles(prev => {
      const updated = {};
      DAYS_OF_WEEK.forEach(day => {
        updated[day.key] = [...sourceSlots];
      });
      return updated;
    });
    setMessage({ type: 'success', text: `Horarios de ${DAYS_OF_WEEK.find(d => d.key === dayKey).name} copiados a todos los días.` });
    setTimeout(() => setMessage(null), 4000);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const dataToSave = {
        notific_recordatorio_horas: parseInt(recordatorioHoras),
        notific_reuniones_dia: reunionesDia,
        notific_precoordinacion_completada: precoordinacionCompletada,
        email,
        telefono,
        disponibilidad_videollamada: {
          activo: dispActiva,
          horasDisponibles: horasDisponibles
        }
      };

      await authAPI.updateProfile(dataToSave);
      setMessage({ type: 'success', text: '¡Ajustes guardados correctamente!' });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error('Error al guardar ajustes:', err);
      setMessage({ type: 'error', text: 'Error al guardar los ajustes. Inténtalo de nuevo.' });
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(null), 5000);
    }
  };

  if (loading) {
    return <div className={styles.loading}>Cargando tus ajustes...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Ajustes y Configuración</h2>
        <p>Configura tus notificaciones push y disponibilidad para videollamadas con clientes.</p>
      </div>

      {message && (
        <div className={message.type === 'success' ? styles.successMessage : styles.errorMessage}>
          {message.type === 'success' ? '✅' : '❌'} {message.text}
        </div>
      )}

      <div className={styles.tabs}>
        <button 
          className={`${styles.tabButton} ${activeTab === 'notificaciones' ? styles.tabButtonActive : ''}`}
          onClick={() => setActiveTab('notificaciones')}
        >
          🔔 Notificaciones
        </button>
        <button 
          className={`${styles.tabButton} ${activeTab === 'disponibilidad' ? styles.tabButtonActive : ''}`}
          onClick={() => setActiveTab('disponibilidad')}
        >
          📅 Disponibilidad Videollamadas
        </button>
      </div>

      <form onSubmit={handleSave}>
        {activeTab === 'notificaciones' && (
          <>
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>Datos de Contacto</h3>
              <p style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '1.5rem' }}>
                Esta información se le mostrará a los clientes cuando agenden una videollamada para que puedan contactarte en caso de necesidad.
              </p>
              
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label htmlFor="telefono">Número de Teléfono / WhatsApp</label>
                  <input 
                    id="telefono"
                    type="text" 
                    className={styles.textInput} 
                    placeholder="Ej: +54 9 11 1234 5678" 
                    value={telefono} 
                    onChange={(e) => setTelefono(e.target.value)}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="email">Correo Electrónico de Contacto</label>
                  <input 
                    id="email"
                    type="email" 
                    className={styles.textInput} 
                    placeholder="Ej: tuemail@janos.com" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className={styles.card}>
              <h3 className={styles.cardTitle}>Preferencias de Notificaciones</h3>
              
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label htmlFor="recordatorio_horas">Recordatorio de Eventos</label>
                  <select 
                    id="recordatorio_horas"
                    className={styles.selectInput}
                    value={recordatorioHoras}
                    onChange={(e) => setRecordatorioHoras(e.target.value)}
                  >
                    <option value={1}>1 hora antes del evento</option>
                    <option value={2}>2 horas antes del evento</option>
                    <option value={3}>3 horas antes del evento</option>
                    <option value={4}>4 horas antes del evento</option>
                    <option value={12}>12 horas antes del evento</option>
                    <option value={24}>24 horas antes del evento</option>
                  </select>
                </div>

                <div className={styles.switchOption}>
                  <div className={styles.switchLabel}>
                    <span>Resumen Diario</span>
                    <span>Recibe un recordatorio cada mañana con tus eventos de ese día.</span>
                  </div>
                  <label className={styles.switch}>
                    <input 
                      type="checkbox" 
                      checked={reunionesDia} 
                      onChange={(e) => setReunionesDia(e.target.checked)}
                    />
                    <span className={styles.slider}></span>
                  </label>
                </div>

                <div className={styles.switchOption}>
                  <div className={styles.switchLabel}>
                    <span>Pre-coordinaciones Completadas</span>
                    <span>Recibe notificaciones inmediatas cuando un cliente finalice su pre-coordinación.</span>
                  </div>
                  <label className={styles.switch}>
                    <input 
                      type="checkbox" 
                      checked={precoordinacionCompletada} 
                      onChange={(e) => setPrecoordinacionCompletada(e.target.checked)}
                    />
                    <span className={styles.slider}></span>
                  </label>
                </div>

                <div className={styles.pushStatusWrapper}>
                  <div>
                    <div className={styles.statusIndicator}>
                      <span className={`${styles.statusDot} ${pushGranted ? styles.statusDotActive : styles.statusDotInactive}`}></span>
                      <span>Push en este dispositivo: {pushGranted ? 'Habilitado' : 'No Habilitado'}</span>
                    </div>
                    <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.25rem' }}>
                      Para recibir alertas en tiempo real, debes suscribir cada dispositivo que utilices.
                    </p>
                  </div>
                  <button 
                    type="button" 
                    className={styles.pushButton}
                    onClick={handlePushRegister}
                  >
                    {pushGranted ? 'Re-suscripción' : 'Activar en este Dispositivo'}
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === 'disponibilidad' && (
          <div className={styles.card}>
            <div className={styles.switchOption} style={{ marginBottom: '2rem' }}>
              <div className={styles.switchLabel}>
                <span>Agendamiento de Videollamadas por Clientes</span>
                <span>Habilita que los clientes se agenden una videollamada al terminar su pre-coordinación.</span>
              </div>
              <label className={styles.switch}>
                <input 
                  type="checkbox" 
                  checked={dispActiva} 
                  onChange={(e) => setDispActiva(e.target.checked)}
                />
                <span className={styles.slider}></span>
              </label>
            </div>

            {dispActiva && (
              <>
                <h3 className={styles.cardTitle}>Horarios Disponibles por Día de la Semana</h3>
                <p style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '1.5rem' }}>
                  Selecciona qué días estás disponible y haz clic en cada día para configurar tus franjas horarias específicas.
                </p>

                <div className={styles.weekdaysContainer}>
                  {DAYS_OF_WEEK.map((day) => {
                    const daySlots = horasDisponibles[day.key] || [];
                    const isDayActive = daySlots.length > 0;
                    const isExpanded = expandedDay === day.key;

                    return (
                      <div 
                        key={day.key} 
                        className={`${styles.dayRow} ${isDayActive ? styles.dayRowActive : ''}`}
                      >
                        <div className={styles.dayHeader} onClick={() => setExpandedDay(isExpanded ? null : day.key)}>
                          <div className={styles.dayTitleWrapper}>
                            <input 
                              type="checkbox"
                              className={styles.dayCheckbox}
                              checked={isDayActive}
                              onChange={(e) => {
                                e.stopPropagation();
                                if (isDayActive) {
                                  handleClearDay(day.key);
                                } else {
                                  handleSelectAllDay(day.key);
                                }
                              }}
                            />
                            <span className={styles.dayName}>{day.name}</span>
                          </div>
                          
                          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <span className={styles.slotsIndicator}>
                              {daySlots.length} {daySlots.length === 1 ? 'módulo' : 'módulos'}
                            </span>
                            <span style={{ fontSize: '0.8rem', opacity: 0.6 }}>
                              {isExpanded ? '▲' : '▼'}
                            </span>
                          </div>
                        </div>

                        {isExpanded && (
                          <div className={styles.dayContent}>
                            <div className={styles.quickActions} style={{ marginBottom: '1rem' }}>
                              <button type="button" className={styles.actionLink} onClick={() => handleSelectAllDay(day.key)}>
                                Seleccionar Todos
                              </button>
                              <span style={{ color: '#cbd5e1' }}>|</span>
                              <button type="button" className={styles.actionLink} onClick={() => handleClearDay(day.key)}>
                                Limpiar
                              </button>
                              <span style={{ color: '#cbd5e1' }}>|</span>
                              <button type="button" className={styles.actionLink} onClick={() => handleCopyDayToAll(day.key)}>
                                Copiar a todos los días
                              </button>
                            </div>

                            <div className={styles.slotsGrid}>
                              {AVAILABLE_HOURS.map((hour) => {
                                const isActive = daySlots.includes(hour);
                                return (
                                  <div 
                                    key={hour}
                                    className={`${styles.slotPill} ${isActive ? styles.slotPillActive : ''}`}
                                    onClick={() => handleToggleSlot(day.key, hour)}
                                  >
                                    {hour}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}

        <div className={styles.saveBar}>
          <button 
            type="submit" 
            className={styles.saveButton}
            disabled={saving}
          >
            {saving ? 'Guardando...' : 'Guardar Ajustes'}
          </button>
        </div>
      </form>
    </div>
  );
}
