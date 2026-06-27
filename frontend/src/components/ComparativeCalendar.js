import { useState, useEffect, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import { eventosAPI, coordinacionesAPI } from '@/services/api';
import { getSalonColor } from '@/utils/colors';
import { getFeriadosMap } from '@/utils/feriados';
import styles from '@/styles/ComparativeCalendar.module.css';

const MAX_DJS_PER_DAY = 1;

export default function ComparativeCalendar({
  salonId,
  year,
  onDateClick,
  currentUserId,
  onExistingEventClick,
  refreshTrigger = 0
}) {
  const [rawEvents, setRawEvents] = useState([]);
  const [rawCoords, setRawCoords] = useState([]);
  const [loading, setLoading] = useState(false);

  // Mapa de feriados para el año seleccionado
  const feriadosMap = useMemo(() => {
    return getFeriadosMap(year - 1, year + 1);
  }, [year]);

  useEffect(() => {
    if (salonId && year) {
      loadEvents();
    } else {
      setRawEvents([]);
    }
  }, [salonId, year, refreshTrigger]);

  const loadEvents = async () => {
    if (!salonId || !year) return;

    try {
      setLoading(true);
      const [eventsRes, coordsRes] = await Promise.all([
        eventosAPI.getBySalon(salonId, year),
        coordinacionesAPI.getAll({ activo: true }).catch(() => ({ data: [] }))
      ]);
      setRawEvents(eventsRes.data || []);
      setRawCoords(coordsRes.data || []);
    } catch (err) {
      console.error('Error al cargar eventos comparativos:', err);
    } finally {
      setLoading(false);
    }
  };

  const eventsByDate = useMemo(() => {
    const map = new Map();
    rawEvents.forEach((event) => {
      if (!event.fecha_evento) return;
      const key = event.fecha_evento.split('T')[0];
      if (!key) return;
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key).push(event);
    });
    return map;
  }, [rawEvents]);

  const getEventsForDate = (date) => {
    if (!date) return [];
    const dateKey = format(date, 'yyyy-MM-dd');
    return eventsByDate.get(dateKey) || [];
  };

  // Videocalls map
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

  // Coordinations map
  const coordsByDate = useMemo(() => {
    const map = new Map();
    rawCoords.forEach((coord) => {
      if (!coord.fecha_evento) return;
      const key = coord.fecha_evento.split('T')[0];
      if (!key) return;
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(coord);
    });
    return map;
  }, [rawCoords]);

  const getCoordStatus = (dateKey, salonIdTarget) => {
    const coordsForDate = coordsByDate.get(dateKey) || [];
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
      return { color: 'yellow', label: 'Pre-coordinación enviada — Esperando cliente' };
    }

    return { color: 'red', label: 'Coordinación pendiente de inicio' };
  };

  const getEventColor = (event) => {
    if (event.dj_color_hex) return event.dj_color_hex;
    if (event.dj_salon_id) return getSalonColor(event.dj_salon_id);
    if (event.salon_id) return getSalonColor(event.salon_id);
    return '#7c3aed';
  };

  // Generar meses en formato Lunes a Domingo con días en blanco para alinear
  const months = useMemo(() => {
    const list = [];
    for (let m = 0; m < 12; m++) {
      const monthDate = new Date(year, m, 1);
      const monthStart = startOfMonth(monthDate);
      const monthEnd = endOfMonth(monthDate);
      const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

      // Calcular celdas vacías al inicio (0 = Lunes, 6 = Domingo)
      const firstDayOfWeek = monthStart.getDay();
      const firstDayIndex = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
      const blankStart = Array(firstDayIndex).fill(null);

      // Calcular celdas vacías al final para completar la grilla
      const totalCells = firstDayIndex + days.length;
      const remainingCells = (7 - (totalCells % 7)) % 7;
      const blankEnd = Array(remainingCells).fill(null);

      list.push({
        monthDate,
        monthName: format(monthDate, 'MMMM', { locale: es }).toUpperCase(),
        days,
        blankStart,
        blankEnd
      });
    }
    return list;
  }, [year]);

  const handleDayClick = (date) => {
    if (!date) return;
    const eventsForDate = getEventsForDate(date);
    const dateKey = format(date, 'yyyy-MM-dd');
    const videocallsOnDate = videocallsByDate.get(dateKey) || [];
    const videocallsFiltered = videocallsOnDate.filter(
      c => !salonId || String(c.salon_id) === String(salonId)
    );

    if (eventsForDate.length > 0 || videocallsFiltered.length > 0) {
      if (typeof onExistingEventClick === 'function') {
        onExistingEventClick({
          isAgenda: true,
          date,
          events: eventsForDate,
          videocalls: videocallsFiltered
        });
      }
    } else {
      if (onDateClick) {
        onDateClick(date);
      }
    }
  };

  const weekDays = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

  return (
    <div className={styles.calendarContainer}>
      {loading && (
        <div className={styles.loadingOverlay}>
          <div className={styles.spinner}></div>
          <span>Cargando eventos...</span>
        </div>
      )}

      <div className={styles.yearGrid}>
        {months.map((month, mIdx) => (
          <div key={mIdx} className={styles.monthContainer}>
            <h3 className={styles.monthTitle}>{month.monthName}</h3>

            <div className={styles.weekDaysHeader}>
              {weekDays.map((wd, wdIdx) => (
                <div key={wdIdx} className={styles.weekDayLabel}>
                  {wd}
                </div>
              ))}
            </div>

            <div className={styles.daysGrid}>
              {/* Celdas vacías al inicio */}
              {month.blankStart.map((_, idx) => (
                <div key={`blank-start-${idx}`} className={styles.dayCellEmpty} />
              ))}

              {/* Celdas de días del mes */}
              {month.days.map((date) => {
                const dateKey = format(date, 'yyyy-MM-dd');
                const eventsForDate = getEventsForDate(date);
                const hasEvent = eventsForDate.length > 0;
                const isBlocked = hasEvent && eventsForDate.length >= MAX_DJS_PER_DAY;

                // Feriado info
                const feriadoInfo = feriadosMap.get(dateKey);
                const isHoliday = Boolean(feriadoInfo);

                // Videollamadas
                const videocallsOnDate = videocallsByDate.get(dateKey) || [];
                const activeVideocalls = videocallsOnDate.filter(c => !c.videollamada_completada);
                const hasActiveVideocall = activeVideocalls.length > 0;

                const dayClasses = [styles.dayCell];
                if (isHoliday) dayClasses.push(styles.holidayDay);
                if (hasEvent) dayClasses.push(styles.hasEventDay);
                if (isBlocked) dayClasses.push(styles.blockedDay);
                if (hasActiveVideocall) dayClasses.push(styles.hasVideocallDay);

                // Determinar color de celda si tiene evento
                const cellStyle = {};
                let djNames = '';
                if (hasEvent) {
                  const primaryEvent = eventsForDate[0];
                  const djColor = getEventColor(primaryEvent);
                  cellStyle.backgroundColor = djColor;
                  cellStyle.borderColor = djColor;
                  djNames = eventsForDate.map(e => e.dj_nombre || 'DJ').join(', ');
                }

                // Tooltip info
                let tooltip = format(date, 'dd/MM/yyyy');
                if (isHoliday && feriadoInfo) tooltip += ` | Feriado: ${feriadoInfo.name}`;
                if (hasEvent) tooltip += ` | Evento: ${djNames}`;
                if (hasActiveVideocall) tooltip += ` | Reunión Agendada`;

                const status = hasEvent ? getCoordStatus(dateKey, salonId) : null;

                return (
                  <div
                    key={dateKey}
                    className={dayClasses.join(' ')}
                    style={cellStyle}
                    onClick={() => handleDayClick(date)}
                    title={tooltip}
                  >
                    <span className={styles.dayNumber}>
                      {format(date, 'd')}
                    </span>

                    {/* Indicadores flotantes */}
                    {hasEvent && status && (
                      <span
                        className={`${styles.statusIndicatorDot} ${styles['status_' + status.color]}`}
                        title={status.label}
                      />
                    )}

                    {hasEvent && eventsForDate.some(e => e.contactado) && (
                      <span className={styles.contactedIcon} title="Cliente Contactado">
                        💬
                      </span>
                    )}

                    {hasActiveVideocall && !hasEvent && (
                      <span className={styles.videocallIndicatorDot} />
                    )}
                  </div>
                );
              })}

              {/* Celdas vacías al final */}
              {month.blankEnd.map((_, idx) => (
                <div key={`blank-end-${idx}`} className={styles.dayCellEmpty} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
