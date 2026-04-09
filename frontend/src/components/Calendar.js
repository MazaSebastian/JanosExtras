import { useState, useEffect, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import { eventosAPI, coordinacionesAPI } from '@/services/api';
import { getSalonColor } from '@/utils/colors';
import { getFeriadosMap, esFeriado } from '@/utils/feriados';
import styles from '@/styles/Calendar.module.css';

const MAX_DJS_PER_DAY = 3;

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
    const myEvent = eventsForDate.find((event) => event.dj_id === currentUserId);
    const isFull = eventsForDate.length >= MAX_DJS_PER_DAY;

    if (myEvent) {
      if (typeof onExistingEventClick === 'function') {
        onExistingEventClick(myEvent);
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

  const weekDays = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];

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

                const dayClasses = [styles.day];
                if (!isCurrentMonth) dayClasses.push(styles.otherMonth);
                if (isHoliday) dayClasses.push(styles.holiday);
                if (hasEventOnDate) dayClasses.push(styles.hasEvent);
                if (isBlocked) dayClasses.push(styles.blocked);
                if (myEvent) dayClasses.push(styles.myEvent);
                if (isFull && !myEvent) dayClasses.push(styles.full);

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
                } else {
                  tooltipText = format(date, 'dd/MM/yyyy');
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
                    {hasEventOnDate && myEvent && (() => {
                      const status = getCoordStatus(dateKey, salonId);
                      return status ? (
                        <span
                          className={`${styles.statusDot} ${styles['statusDot_' + status.color]}`}
                          title={status.label}
                        />
                      ) : null;
                    })()}
                    {hasEventOnDate && eventsForDate.length > 1 && (
                      <div className={styles.eventBadges}>
                        {eventsForDate.slice(1, MAX_DJS_PER_DAY).map((event) => (
                          <span
                            key={event.id}
                            className={styles.eventBadge}
                            style={{ backgroundColor: getEventColor(event) }}
                            title={event.dj_nombre || 'Evento'}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


