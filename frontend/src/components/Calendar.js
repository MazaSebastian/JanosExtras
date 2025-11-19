import { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';
import { es } from 'date-fns/locale';
import { eventosAPI } from '@/services/api';
import styles from '@/styles/Calendar.module.css';

export default function Calendar({ salonId, onDateClick }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (salonId) {
      loadEvents();
    }
  }, [salonId, currentDate]);

  const loadEvents = async () => {
    if (!salonId) return;
    
    try {
      setLoading(true);
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
      const response = await eventosAPI.getBySalonAndMonth(salonId, year, month);
      setEvents(response.data);
    } catch (err) {
      console.error('Error al cargar eventos:', err);
    } finally {
      setLoading(false);
    }
  };

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
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

  const handleDateClick = (date) => {
    if (isSameMonth(date, currentDate) && onDateClick) {
      onDateClick(date);
    }
  };

  const previousMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };

  const nextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  const weekDays = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  return (
    <div className={styles.calendar}>
      <div className={styles.header}>
        <button onClick={previousMonth} className={styles.navButton}>
          ‹
        </button>
        <h2 className={styles.monthTitle}>
          {format(currentDate, 'MMMM yyyy', { locale: es })}
        </h2>
        <button onClick={nextMonth} className={styles.navButton}>
          ›
        </button>
      </div>

      <div className={styles.weekDays}>
        {weekDays.map((day) => (
          <div key={day} className={styles.weekDay}>
            {day}
          </div>
        ))}
      </div>

      <div className={styles.days}>
        {allDays.map((date, index) => {
          const isCurrentMonth = isSameMonth(date, currentDate);
          const hasEventOnDate = hasEvent(date);
          const event = getEventForDate(date);

          return (
            <div
              key={index}
              className={`${styles.day} ${
                !isCurrentMonth ? styles.otherMonth : ''
              } ${hasEventOnDate ? styles.hasEvent : ''}`}
              onClick={() => handleDateClick(date)}
            >
              <span className={styles.dayNumber}>
                {format(date, 'd')}
              </span>
              {hasEventOnDate && (
                <div className={styles.eventIndicator} title={event?.dj_nombre}>
                  ●
                </div>
              )}
            </div>
          );
        })}
      </div>

      {loading && <div className={styles.loading}>Cargando eventos...</div>}
    </div>
  );
}

