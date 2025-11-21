import { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, startOfYear, endOfYear, addYears, subYears } from 'date-fns';
import { es } from 'date-fns/locale';
import { eventosAPI } from '@/services/api';
import { getSalonColor } from '@/utils/colors';
import styles from '@/styles/Calendar.module.css';

export default function Calendar({
  salonId,
  onDateClick,
  currentUserSalonId,
  currentUserId,
  onExistingEventClick,
  filterDjId,
  readOnly = false
}) {
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (salonId) {
      loadEvents();
    } else {
      setEvents([]);
    }
  }, [salonId, currentYear]);

  const loadEvents = async () => {
    if (!salonId) return;
    
    try {
      setLoading(true);
      const response = await eventosAPI.getBySalon(salonId, currentYear);
      const eventsData = response.data || [];
      const filteredEvents = filterDjId
        ? eventsData.filter((event) => event.dj_id === filterDjId)
        : eventsData;
      setEvents(filteredEvents);
    } catch (err) {
      console.error('Error al cargar eventos:', err);
    } finally {
      setLoading(false);
    }
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

  // Función mejorada para comparar fechas sin problemas de zona horaria
  const isSameDate = (date1, date2) => {
    if (!date1 || !date2) return false;
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
  };

  const hasEvent = (date) => {
    if (!date || events.length === 0) return false;
    return events.some((event) => {
      if (!event.fecha_evento) return false;
      // Normalizar la fecha del evento a formato YYYY-MM-DD
      const eventDateStr = event.fecha_evento.split('T')[0];
      const dateStr = format(date, 'yyyy-MM-dd');
      return eventDateStr === dateStr;
    });
  };

  const getEventForDate = (date) => {
    if (!date || events.length === 0) return null;
    const dateStr = format(date, 'yyyy-MM-dd');
    return events.find((event) => {
      if (!event.fecha_evento) return false;
      const eventDateStr = event.fecha_evento.split('T')[0];
      return eventDateStr === dateStr;
    });
  };

  const handleDateClick = (date, monthDate) => {
    // Solo permitir clics en fechas del mes actual (no en días de otros meses)
    if (!isSameMonth(date, monthDate)) {
      return;
    }
    
    if (readOnly) {
      return;
    }

    // Verificar si la fecha ya tiene un evento (bloqueada)
    const event = getEventForDate(date);
    const hasEventOnDate = !!event;
    if (hasEventOnDate) {
      if (
        event?.dj_id === currentUserId &&
        typeof onExistingEventClick === 'function'
      ) {
        onExistingEventClick(event);
      }
      return;
    }
    
    // Solo permitir clic si no está bloqueada
    if (onDateClick && !hasEventOnDate) {
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

      {loading && <div className={styles.loading}>Cargando eventos del año...</div>}

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
                const hasEventOnDate = hasEvent(date);
                const event = getEventForDate(date);
                
                // Obtener el color del salón del DJ que marcó el evento
                let eventColor = null;
                if (hasEventOnDate && event) {
                  if (event.dj_color_hex) {
                    eventColor = event.dj_color_hex;
                  } else if (event.dj_salon_id) {
                  // Prioridad: dj_salon_id > salon_id > dj_id (fallback)
                    eventColor = getSalonColor(event.dj_salon_id);
                  } else if (event.salon_id) {
                    // Fallback: usar el salón del evento
                    eventColor = getSalonColor(event.salon_id);
                  } else if (event.dj_id) {
                    // Último fallback: usar el ID del DJ (aunque debería usar salón)
                    eventColor = getSalonColor(event.dj_id);
                  }
                  
                  // Si aún no hay color, usar un color por defecto
                  if (!eventColor) {
                    eventColor = '#667eea'; // Color por defecto
                  }
                }

                // Determinar si esta fecha está bloqueada
                const isBlocked = hasEventOnDate;
                const isMyEvent =
                  hasEventOnDate &&
                  event?.dj_id === currentUserId &&
                  event?.dj_salon_id === currentUserSalonId;
                
                // Estilos dinámicos para fechas con eventos
                const dayStyle = {};
                if (hasEventOnDate && eventColor) {
                  dayStyle.backgroundColor = `${eventColor}25`;
                  dayStyle.borderColor = eventColor;
                  dayStyle.borderWidth = '2px';
                  dayStyle.borderStyle = 'solid';
                }
                
                const dayClasses = [styles.day];
                if (!isCurrentMonth) dayClasses.push(styles.otherMonth);
                if (hasEventOnDate) dayClasses.push(styles.hasEvent);
                if (isBlocked) dayClasses.push(styles.blocked);

                return (
                  <div
                    key={`${monthIndex}-${dayIndex}`}
                    className={dayClasses.join(' ')}
                    onClick={() => handleDateClick(date, month.monthDate)}
                    style={dayStyle}
                    data-dj-name={
                      hasEventOnDate && event?.dj_nombre
                        ? event.dj_nombre
                        : undefined
                    }
                    title={
                      isBlocked
                        ? isMyEvent
                          ? `Evento marcado por ti (${event?.dj_nombre || ''})`
                          : `Fecha ocupada por ${event?.dj_nombre || 'otro DJ'}`
                        : format(date, 'dd/MM/yyyy')
                    }
                  >
                    <span className={styles.dayNumber}>
                      {format(date, 'd')}
                    </span>
                    {hasEventOnDate && eventColor && (
                      <div 
                        className={styles.eventIndicator} 
                        title={`${event?.dj_nombre || 'Evento'}`}
                        style={{ color: eventColor }}
                      >
                        ●
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

