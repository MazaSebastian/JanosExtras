import { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, startOfYear, endOfYear, addYears, subYears } from 'date-fns';
import { es } from 'date-fns/locale';
import { eventosAPI } from '@/services/api';
import { getDJColor } from '@/utils/colors';
import styles from '@/styles/Calendar.module.css';

export default function Calendar({ salonId, onDateClick }) {
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (salonId) {
      loadEvents();
    }
  }, [salonId, currentYear]);

  const loadEvents = async () => {
    if (!salonId) return;
    
    try {
      setLoading(true);
      // Cargar eventos de todos los meses del año
      const allEvents = [];
      for (let month = 1; month <= 12; month++) {
        try {
          const response = await eventosAPI.getBySalonAndMonth(salonId, currentYear, month);
          allEvents.push(...response.data);
        } catch (err) {
          console.error(`Error al cargar eventos del mes ${month}:`, err);
        }
      }
      setEvents(allEvents);
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

  const hasEvent = (date) => {
    return events.some((event) => {
      const eventDate = new Date(event.fecha_evento);
      return isSameDay(eventDate, date);
    });
  };

  const getEventForDate = (date) => {
    return events.find((event) => {
      const eventDate = new Date(event.fecha_evento);
      return isSameDay(eventDate, date);
    });
  };

  const handleDateClick = (date, monthDate) => {
    // Solo permitir clics en fechas del mes actual (no en días de otros meses)
    if (isSameMonth(date, monthDate) && onDateClick) {
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
                const eventColor = event?.dj_id ? getDJColor(event.dj_id) : null;

                return (
                  <div
                    key={dayIndex}
                    className={`${styles.day} ${
                      !isCurrentMonth ? styles.otherMonth : ''
                    } ${hasEventOnDate ? styles.hasEvent : ''}`}
                    onClick={() => handleDateClick(date, month.monthDate)}
                    style={hasEventOnDate && eventColor ? {
                      backgroundColor: `${eventColor}20`,
                      borderColor: eventColor,
                      borderWidth: '1.5px',
                      borderStyle: 'solid'
                    } : {}}
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

