import { useState, useEffect, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import { eventosAPI, coordinacionesAPI } from '@/services/api';
import { getSalonColor } from '@/utils/colors';
import { getFeriadosMap, esFeriado } from '@/utils/feriados';
import styles from '@/styles/Calendar.module.css';

const MAX_DJS_PER_DAY = 1;

export default function Calendar({
  salonId,
  onDateClick,
  currentUserId,
  onExistingEventClick,
  filterDjId,
  readOnly = false,
  adminMode = false,
  startDateFilter,
  endDateFilter,
  refreshTrigger = 0
}) {
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [rawEvents, setRawEvents] = useState([]);
  const [rawCoords, setRawCoords] = useState([]);
  const [loading, setLoading] = useState(false);

  // Mapa de feriados para el año actual y años adyacentes (para meses que muestran días de otros años)
  const feriadosMap = useMemo(() => {
    return getFeriadosMap(currentYear - 1, currentYear + 1);
  }, [currentYear]);

  useEffect(() => {
    if (salonId) {
      loadEvents();
    } else {
      setRawEvents([]);
    }
  }, [salonId, currentYear, refreshTrigger]);

  const loadEvents = async () => {
    if (!salonId) return;

    try {
      setLoading(true);
      const [eventsRes, coordsRes] = await Promise.all([
        eventosAPI.getBySalon(salonId, currentYear),
        coordinacionesAPI.getAll({ activo: true }).catch(() => ({ data: [] }))
      ]);
      setRawEvents(eventsRes.data || []);
      setRawCoords(coordsRes.data || []);
    } catch (err) {
      console.error('Error al cargar eventos:', err);
    } finally {
      setLoading(false);
    }
  };

  const events = useMemo(() => {
    if (!rawEvents.length) return [];

    const start = startDateFilter ? new Date(startDateFilter) : null;
    const end = endDateFilter ? new Date(endDateFilter) : null;
    let rangeStart = start;
    let rangeEnd = end;

    if (rangeStart && rangeEnd && rangeStart > rangeEnd) {
      const temp = rangeStart;
      rangeStart = rangeEnd;
      rangeEnd = temp;
    }

    return rawEvents.filter((event) => {
      if (filterDjId && event.dj_id !== filterDjId) return false;
      if (!rangeStart && !rangeEnd) return true;
      if (!event.fecha_evento) return false;
      const eventDate = new Date(event.fecha_evento);
      if (Number.isNaN(eventDate.getTime())) return false;
      if (rangeStart && eventDate < rangeStart) return false;
      if (rangeEnd && eventDate > rangeEnd) return false;
      return true;
    });
  }, [rawEvents, filterDjId, startDateFilter, endDateFilter]);

  const eventsByDate = useMemo(() => {
    const map = new Map();
    events.forEach((event) => {
      if (!event.fecha_evento) return;
      const key = event.fecha_evento.split('T')[0];
      if (!key) return;
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key).push(event);
    });
    return map;
  }, [events]);

  const getEventsForDate = (date) => {
    if (!date) return [];
    const dateKey = format(date, 'yyyy-MM-dd');
    return eventsByDate.get(dateKey) || [];
  };

  // ── Videocalls map ──
  const videocallsByDate = useMemo(() => {
    const map = new Map();
    rawCoords.forEach((coord) => {
      if (coord.videollamada_agendada && coord.videollamada_fecha) {
        try {
          const localDate = new Date(coord.videollamada_fecha);
          const key = format(localDate, 'yyyy-MM-dd');
          if (key) {
            if (!map.has(key)) map.set(key, []);
            map.get(key).push(coord);
          }
        } catch (e) {
          console.error("Invalid date", coord.videollamada_fecha);
        }
      }
    });
    return map;
  }, [rawCoords]);

  // ── Coordination status map ──
  const coordsByDate = useMemo(() => {
    const map = new Map();
    rawCoords.forEach((coord) => {
      if (!coord.fecha_evento) return;
      const key = coord.fecha_evento.split('T')[0];
      if (!key) return;
      // Store all coordinations for a given date (may be multiple salons)
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(coord);
    });
    return map;
  }, [rawCoords]);

  /**
   * Returns { color: 'red'|'yellow'|'green'|null, label: string }
   * RED    = coordination not started / pre-coord not sent
   * YELLOW = pre-coord completed by client OR coordination has pending items (en_proceso)
   * GREEN  = coordination fully completed
   */
  const getCoordStatus = (dateKey, salonIdTarget) => {
    const coordsForDate = coordsByDate.get(dateKey) || [];
    // Find the coordination that matches this salon
    const coord = coordsForDate.find(c =>
      c.salon_id === salonIdTarget || !salonIdTarget
    );

    if (!coord) {
      return { color: 'red', label: 'Sin coordinación iniciada' };
    }

    const estado = (coord.estado || '').toLowerCase();
    const preCoordCompleted = coord.pre_coordinacion_completado_por_cliente;
    const preCoordSent = Boolean(coord.pre_coordinacion_url);

    if (estado === 'completada' || estado === 'completado') {
      return { color: 'green', label: 'Coordinación completada ✓' };
    }

    if (preCoordCompleted || estado === 'en_proceso') {
      return {
        color: 'yellow', label: preCoordCompleted
          ? 'Pre-coordinación completada — Pendiente reunión'
          : 'Coordinación en proceso — Items pendientes'
      };
    }

    if (preCoordSent && !preCoordCompleted) {
      return { color: 'yellow', label: 'Pre-coordinación enviada — Esperando respuesta del cliente' };
    }

    return { color: 'red', label: 'Coordinación pendiente de inicio' };
  };

  const getEventColor = (event) => {
    if (event.dj_color_hex) {
      return event.dj_color_hex;
    }
    if (event.dj_salon_id) {
      return getSalonColor(event.dj_salon_id);
    }
    if (event.salon_id) {
      return getSalonColor(event.salon_id);
    }
    if (event.dj_id) {
      return getSalonColor(event.dj_id);
    }
    return '#772c87';
  };

  // Generar todos los meses del año
  const months = [];
  for (let month = 0; month < 12; month++) {
    const monthDate = new Date(currentYear, month, 1);
    const monthStart = startOfMonth(monthDate);
    const monthEnd = endOfMonth(monthDate);
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

    // Obtener días del mes anterior para completar la primera semana
    const firstDayOfWeek = monthStart.getDay();
    const daysBefore = [];
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const date = new Date(monthStart);
      date.setDate(date.getDate() - i - 1);
      daysBefore.push(date);
    }

    // Obtener días del mes siguiente para completar la última semana
    const lastDayOfWeek = monthEnd.getDay();
    const daysAfter = [];
    const daysNeeded = 6 - lastDayOfWeek;
    for (let i = 1; i <= daysNeeded; i++) {
      const date = new Date(monthEnd);
      date.setDate(date.getDate() + i);
      daysAfter.push(date);
    }

    const allDays = [...daysBefore, ...daysInMonth, ...daysAfter];
    months.push({
      monthDate,
      monthName: format(monthDate, 'MMMM', { locale: es }),
      days: allDays
    });
  }

  const handleDateClick = (date, monthDate) => {
    // Solo permitir clics en fechas del mes actual (no en días de otros meses)
    if (!isSameMonth(date, monthDate)) {
      return;
    }

    if (readOnly && !adminMode) {
      return;
    }

    const eventsForDate = getEventsForDate(date);
    // If adminMode is true, we respect all events for the date. Otherwise just currentUserId.
    const allEventsToShow = adminMode ? eventsForDate : eventsForDate.filter(e => e.dj_id === currentUserId);
    const myEvent = eventsForDate.find((event) => event.dj_id === currentUserId);
    const isFull = eventsForDate.length >= MAX_DJS_PER_DAY;

    const dateKey = format(date, 'yyyy-MM-dd');
    const videocallsOnDate = videocallsByDate.get(dateKey) || [];
    const videocallsFiltered = videocallsOnDate.filter(c => !salonId || String(c.salon_id) === String(salonId) || (currentUserId && String(c.dj_responsable_id) === String(currentUserId)));

    if (allEventsToShow.length > 0 || videocallsFiltered.length > 0) {
      if (typeof onExistingEventClick === 'function') {
        onExistingEventClick({
          isAgenda: true,
          date: date,
          events: allEventsToShow,
          videocalls: videocallsFiltered
        });
      }
      return;
    }

    if (isFull) {
      return;
    }

    if (onDateClick) {
      onDateClick(date);
    }
  };

  const previousYear = () => {
    setCurrentYear(currentYear - 1);
  };

  const nextYear = () => {
    setCurrentYear(currentYear + 1);
  };

  const weekDays = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];

  return (
    <div className={styles.calendar}>
      <div className={styles.header}>
        <button onClick={previousYear} className={styles.navButton}>
          ‹
        </button>
        <h2 className={styles.yearTitle}>
          {currentYear}
        </h2>
        <button onClick={nextYear} className={styles.navButton}>
          ›
        </button>
      </div>

      {loading && (
        <div className={styles.loadingContainer}>
          <div className={styles.loadingMessage}>Cargando eventos del año...</div>
        </div>
      )}

      <div className={styles.yearGrid}>
        {months.map((month, monthIndex) => (
          <div key={monthIndex} className={styles.monthContainer}>
            <h3 className={styles.monthTitle}>{month.monthName}</h3>

            <div className={styles.weekDays}>
              {weekDays.map((day) => (
                <div key={day} className={styles.weekDay}>
                  {day}
                </div>
              ))}
            </div>

            <div className={styles.days}>
              {month.days.map((date, dayIndex) => {
                const isCurrentMonth = isSameMonth(date, month.monthDate);
                const eventsForDate = getEventsForDate(date);
                const hasEventOnDate = eventsForDate.length > 0;
                const myEvent = eventsForDate.find(
                  (event) => event.dj_id === currentUserId
                );
                const isFull = eventsForDate.length >= MAX_DJS_PER_DAY;
                const isBlocked = isFull && !myEvent;
                const tooltipNames = eventsForDate
                  .map((event) => event.dj_nombre || 'DJ sin nombre')
                  .join(', ');

                // Verificar si es feriado
                const dateKey = format(date, 'yyyy-MM-dd');
                const feriadoInfo = feriadosMap.get(dateKey);
                const isHoliday = Boolean(feriadoInfo);

                // Check for videocalls specifically on this day
                const videocallsOnDate = videocallsByDate.get(dateKey) || [];
                const activeVideocalls = videocallsOnDate.filter(c => !c.videollamada_completada && (!salonId || String(c.salon_id) === String(salonId) || String(c.dj_responsable_id) === String(currentUserId)));
                const hasActiveVideocall = activeVideocalls.length > 0;

                const dayClasses = [styles.day];
                if (!isCurrentMonth) dayClasses.push(styles.otherMonth);
                if (isHoliday) dayClasses.push(styles.holiday);
                if (hasEventOnDate) dayClasses.push(styles.hasEvent);
                if (isBlocked) dayClasses.push(styles.blocked);
                if (myEvent) dayClasses.push(styles.myEvent);
                if (isFull && !myEvent) dayClasses.push(styles.full);
                if (hasActiveVideocall) dayClasses.push(styles.hasVideocall);

                // Build tooltip with status info
                let tooltipText = '';
                const statusInfo = (myEvent) ? getCoordStatus(dateKey, salonId) : null;

                if (isHoliday && feriadoInfo) {
                  tooltipText = feriadoInfo.name;
                  if (hasEventOnDate) {
                    tooltipText += ` | ${tooltipNames}`;
                    if (statusInfo) tooltipText += ` — ${statusInfo.label}`;
                    if (isFull && !myEvent) {
                      tooltipText += ' — Cupo completo';
                    }
                  }
                } else if (hasEventOnDate) {
                  tooltipText = tooltipNames;
                  if (statusInfo) tooltipText += ` — ${statusInfo.label}`;
                  if (isFull && !myEvent) {
                    tooltipText += ' — Cupo completo';
                  }
                } else if (hasActiveVideocall) {
                  tooltipText = activeVideocalls
                    .map(c => {
                      let timeStr = '';
                      if (c.videollamada_fecha) {
                        try {
                          timeStr = format(new Date(c.videollamada_fecha), 'HH:mm');
                        } catch (e) { }
                      }
                      return `Reunión: ${c.nombre_cliente || c.titulo}${timeStr ? ` a las ${timeStr}hs` : ''}`;
                    })
                    .join(' | ');
                } else {
                  tooltipText = format(date, 'dd/MM/yyyy');
                }

                // If it has both event and videocall, append videocall info to tooltip
                if (hasEventOnDate && hasActiveVideocall) {
                  const vText = activeVideocalls
                    .map(c => `Reunión: ${c.nombre_cliente || c.titulo}`)
                    .join(', ');
                  tooltipText += ` | ${vText}`;
                }

                // Compute inline color for the day cell based on DJ assignments
                const cellStyle = {};
                if (hasEventOnDate && !isHoliday) {
                  const primaryEvent = myEvent || eventsForDate[0];
                  const djColor = getEventColor(primaryEvent);
                  cellStyle.background = djColor;
                  cellStyle.borderColor = djColor;
                }

                return (
                  <div
                    key={`${monthIndex}-${dayIndex}`}
                    className={dayClasses.join(' ')}
                    style={cellStyle}
                    onClick={() => handleDateClick(date, month.monthDate)}
                    data-dj-name={
                      hasEventOnDate
                        ? tooltipNames
                        : undefined
                    }
                    data-videocall-name={
                      hasActiveVideocall && !hasEventOnDate
                        ? tooltipText
                        : undefined
                    }
                    data-feriado-name={
                      isHoliday && feriadoInfo
                        ? feriadoInfo.name
                        : undefined
                    }
                    title={tooltipText}
                  >
                    <span className={styles.dayNumber}>
                      {format(date, 'd')}
                    </span>
                    {(hasEventOnDate && myEvent) && (() => {
                      const status = getCoordStatus(dateKey, salonId);
                      const coordsForDate = coordsByDate.get(dateKey) || [];
                      const coord = coordsForDate.find(c => String(c.salon_id) === String(salonId) || !salonId);

                      return (
                        <>
                          {status && (
                            <span
                              className={`${styles.statusDot} ${styles['statusDot_' + status.color]}`}
                              title={status.label}
                            />
                          )}
                          {coord?.contactado && (
                            <span
                              className={styles.contactadoIndicator}
                              title="Cliente Contactado"
                            >
                              💬
                            </span>
                          )}
                          {(coord?.videollamada_agendada && !coord?.videollamada_completada) && (
                            <span
                              className={styles.videocallMixedDot}
                              title="Reunión/Videollamada Pendiente"
                            />
                          )}
                        </>
                      );
                    })()}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* --- LEYENDA VISUAL DINÁMICA --- */}
      <div className={styles.calendarLegend}>
        <h4>Leyenda de Estados y Colores</h4>
        <div className={styles.legendGrid}>
          <div className={styles.legendItem}>
            <div className={styles.legendColorBox} style={{ background: '#772c87', border: '2px solid rgba(255,255,255,0.4)', boxShadow: '0 2px 6px rgba(0,0,0,0.3)' }}></div>
            <span>Fiesta Asignada (Tu Color)</span>
          </div>
          <div className={styles.legendItem}>
            <div className={styles.legendColorBox} style={{ background: 'linear-gradient(135deg, #ffeb3b 0%, #ffc107 100%)', border: '1px solid #ff9800' }}></div>
            <span>Feriado Nacional</span>
          </div>
          <div className={styles.legendItem}>
            <div className={styles.legendColorBox} style={{ background: 'rgba(255, 112, 67, 0.08)', border: '1px solid #ff7043' }}></div>
            <span>Día Ocupado (Otro DJ)</span>
          </div>
          <div className={styles.legendItem}>
            <span className={`${styles.statusDot} ${styles.statusDot_red}`} style={{ position: 'static', transform: 'scale(1.2)' }}></span>
            <span>Coordinación NO iniciada</span>
          </div>
          <div className={styles.legendItem}>
            <span className={`${styles.statusDot} ${styles.statusDot_yellow}`} style={{ position: 'static', transform: 'scale(1.2)' }}></span>
            <span>Coordinación En Proceso / Cuestionario</span>
          </div>
          <div className={styles.legendItem}>
            <span className={`${styles.statusDot} ${styles.statusDot_green}`} style={{ position: 'static', transform: 'scale(1.2)' }}></span>
            <span>Coordinación 100% Completada</span>
          </div>
          <div className={styles.legendItem}>
            <div className={styles.legendColorBox} style={{ background: '#4285F4', border: '2px solid #3367D6' }}></div>
            <span>Reunión Agendada (Día Libre)</span>
          </div>
          <div className={styles.legendItem}>
            <span className={styles.videocallMixedDot} style={{ position: 'relative', top: 'auto', left: 'auto', transform: 'scale(1.2)' }}></span>
            <span>Reunión + Evento Confirmado</span>
          </div>
          <div className={styles.legendItem}>
            <span style={{ fontSize: '13px', lineHeight: 1 }}>💬</span>
            <span>Cliente Contactado por WhatsApp</span>
          </div>
        </div>
      </div>

    </div >
  );
}


